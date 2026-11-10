import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { parse } from 'parse5';
import { normalizeInlineCitations, loadCitationConfig } from '../scripts/inline-citations.mjs';
const root = resolve(import.meta.dirname, '..');
const walk = node => [node, ...(node.childNodes || []).flatMap(walk)];
const attr = (n,k) => n.attrs?.find(a => a.name === k)?.value;
const text = n => n.value ?? (n.childNodes || []).map(text).join('');
const anchors = html => walk(parse(html)).filter(n => n.tagName === 'a' && attr(n,'data-ref-id'));
const example = '<main><span class="added-citations"> [<a class="citation" href="#ref-x" title="Smith et al., 2026">1</a>, <a class="citation" href="#ref-y" title="Jones, 2025">2</a>]</span><ol class="refs"><li id="ref-x">Smith et al. <a href="https://example.org/x">Paper</a></li><li id="ref-y">Jones <a href="https://example.org/y">Paper</a></li></ol></main>';
const defaults = { style:'author-year', link:'source', preview:true, mobile:'navigate' };

test('all six article sources resolve to source links and consistent labels, preserving bibliography', async () => {
 for (const slug of ['valg','MLtheorybench','rethinking-weight-decay']) {
  const source = join(root,'blog',slug);
  const config = await loadCitationConfig(root,source);
  for (const file of ['index.html','index.en.html']) {
   const original=await readFile(join(source,file),'utf8');
   const output=normalizeInlineCitations(original,config);
   const links=anchors(output);
   assert(links.length>0);
   for(const a of links) {
    assert.match(attr(a,'href'),/^https?:\/\//);
    assert.equal(attr(a,'target'),'_blank');
    assert.equal(attr(a,'rel'),'noopener noreferrer');
    assert.equal(attr(a,'data-citation-mobile'),'navigate');
    assert.match(text(a),/^(?:\d{4}[a-z]?|.+, (?:\d{4}[a-z]?|n\.d\.))$/);
   }
   // Bibliography and its backlinks remain byte-for-byte identical.
   const tail=s=>s.slice(s.lastIndexOf('<h3 id="refs"')>=0?s.lastIndexOf('<h3 id="refs"'):s.lastIndexOf('<div id="refs"'));
   assert.equal(tail(output),tail(original));
  }
 }
});
test('author-year groups use parentheses and semicolons; configured links remain linked to previews',()=>{
 const output=normalizeInlineCitations(example,defaults);
 assert.match(output,/\(.*Smith et al., 2026<\/a>; .*Jones, 2025<\/a>\)/);
 assert.equal(anchors(output)[0].attrs.find(a=>a.name==='data-ref-id').value,'ref-x');
});
test('numeric/reference/preview overrides are honored without leaking to other articles',()=>{
 const output=normalizeInlineCitations(example,{...defaults,style:'numeric',link:'reference',preview:false,mobile:'preview-first'});
 assert.deepEqual(anchors(output).map(text),['1','2']);
 for(const a of anchors(output)) {
  assert.match(attr(a,'href'),/^#ref-/);assert.equal(attr(a,'target'),undefined);
  assert.equal(attr(a,'data-citation-preview'),'false');assert.equal(attr(a,'data-citation-mobile'),'preview-first');
 }
 assert.equal(attr(anchors(normalizeInlineCitations(example,defaults))[0],'href'),'https://example.org/x');
});
test('metadata overrides and HTML escaping; missing metadata or references fail clearly',()=>{
 const config={...defaults,references:{'ref-x':{label:'Smith & Doe, 2026',url:'https://example.org/original?a=1&b=2'}}};
 const first=anchors(normalizeInlineCitations(example,config))[0];
 assert.equal(text(first),'Smith & Doe, 2026');assert.equal(attr(first,'href'),config.references['ref-x'].url);
 assert.throws(()=>normalizeInlineCitations(example.replace('id="ref-x"','id="missing"'),defaults),/Missing reference/);
 assert.throws(()=>normalizeInlineCitations(example.replace(' title="Smith et al., 2026"',''),defaults),/author-year label/);
 assert.throws(()=>normalizeInlineCitations(example.replace('https://example.org/x','#none'),defaults),/Missing source URL/);
});
test('global defaults and optional article configuration merge and validate',async()=>{
 const temp=await mkdtemp(join(tmpdir(),'citation-config-'));
 try {
  const article=join(temp,'article');await mkdir(article);
  await writeFile(join(temp,'citation.config.json'),JSON.stringify(defaults));
  assert.deepEqual(await loadCitationConfig(temp,article),{...defaults,references:{}});
  await writeFile(join(article,'citation.config.json'),JSON.stringify({mobile:'preview-first',preview:false}));
  assert.deepEqual(await loadCitationConfig(temp,article),{...defaults,mobile:'preview-first',preview:false,references:{}});
  await writeFile(join(article,'citation.config.json'),'{"style":"typo"}');
  await assert.rejects(loadCitationConfig(temp,article),/Invalid citation style/);
 } finally {await rm(temp,{recursive:true,force:true});}
});
