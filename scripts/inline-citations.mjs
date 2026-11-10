import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parse, serializeOuter } from 'parse5';

const attr = (node, key) => node.attrs?.find(a => a.name === key)?.value;
const set = (node, key, value) => {
  node.attrs = (node.attrs || []).filter(a => a.name !== key);
  if (value != null) node.attrs.push({ name: key, value: String(value) });
};
const text = node => node.nodeName === '#text' ? node.value : (node.childNodes || []).map(text).join('');
const walk = (node, result = []) => {
  result.push(node);
  for (const child of node.childNodes || []) walk(child, result);
  return result;
};
const hasClass = (node, name) => (attr(node, 'class') || '').split(/\s+/).includes(name);
const authorYear = value => /\D.+,\s*(?:\d{4}[a-z]?|n\.d\.)$/.test(value || '');

export async function loadCitationConfig(root, source) {
  const defaults = JSON.parse(await readFile(resolve(root, 'citation.config.json'), 'utf8'));
  let local = {};
  try { local = JSON.parse(await readFile(resolve(source, 'citation.config.json'), 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const config = { ...defaults, ...local, references: { ...defaults.references, ...local.references } };
  for (const [key, choices] of Object.entries({ style: ['author-year', 'numeric'], link: ['source', 'reference'], mobile: ['navigate', 'preview-first'] })) {
    if (!choices.includes(config[key])) throw new Error(`Invalid citation ${key} in ${source}`);
  }
  if (typeof config.preview !== 'boolean') throw new Error(`Invalid citation preview in ${source}`);
  return config;
}

// Patch only citation spans/anchors, preserving all other source bytes (including math).
export function normalizeInlineCitations(html, config) {
  const nodes = walk(parse(html, { sourceCodeLocationInfo: true }));
  const references = new Map(nodes.filter(n => n.tagName === 'li' && /^(ref-|bib-)/.test(attr(n, 'id') || '')).map(n => [attr(n, 'id'), n]));
  const anchors = nodes.filter(n => n.tagName === 'a' && (attr(n, 'data-ref-id') || hasClass(n, 'citation')));
  const labels = new Map();
  for (const a of anchors) {
    const id = attr(a, 'data-ref-id') || (attr(a, 'href') || '').replace(/^#/, '');
    const label = authorYear(attr(a, 'title')) ? attr(a, 'title') : text(a).trim();
    if (authorYear(label)) labels.set(id, label);
  }
  const replacements = new Map();
  for (const a of anchors) {
    const id = attr(a, 'data-ref-id') || (attr(a, 'href') || '').replace(/^#/, '');
    const ref = references.get(id);
    if (!ref) throw new Error(`Missing reference ${id}`);
    const override = config.references?.[id] || {};
    const label = override.label || labels.get(id);
    if (config.style === 'author-year' && !authorYear(label)) throw new Error(`Provide an author-year label for ${id} in citation.config.json`);
    const source = override.url || walk(ref).find(n => n.tagName === 'a' && /^(https?:\/\/|\/|assets\/)/.test(attr(n, 'href') || ''))?.attrs.find(a => a.name === 'href')?.value;
    if (config.link === 'source' && !source) throw new Error(`Missing source URL for ${id}`);
    if (source && !/^(https?:\/\/|\/(?!\/)|assets\/)/.test(source)) throw new Error(`Invalid source URL for ${id}`);
    set(a, 'href', config.link === 'source' ? source : `#${id}`);
    set(a, 'target', config.link === 'source' ? '_blank' : null);
    set(a, 'rel', config.link === 'source' ? 'noopener noreferrer' : null);
    set(a, 'data-ref-id', id);
    set(a, 'data-citation-preview', config.preview);
    set(a, 'data-citation-mobile', config.mobile);
    set(a, 'title', null);
    set(a, 'class', [...new Set((attr(a, 'class') || '').split(/\s+/).filter(Boolean).concat('citation'))].join(' '));
    // Narrative citations keep the author in surrounding prose, e.g. Lau and Scarlett (2026a).
    const narrative = /^\d{4}[a-z]?$/.test(text(a).trim());
    const display = config.style === 'numeric' ? String([...references.keys()].indexOf(id) + 1) : narrative ? label.split(', ').at(-1) : label;
    a.childNodes = [{ nodeName: '#text', value: display, parentNode: a }];
    const parent = a.parentNode;
    if (hasClass(parent, 'added-citations') && config.style === 'author-year') {
      replacements.set(parent, null);
    } else replacements.set(a, null);
  }
  for (const node of replacements.keys()) {
    if (hasClass(node, 'added-citations')) {
      for (const child of node.childNodes) {
        if (child.nodeName === '#text') child.value = child.value.replace('[', '(').replace(']', ')').replace(/,\s*/g, '; ');
      }
    }
  }
  const edits = [...replacements.keys()].map(n => ({ start: n.sourceCodeLocation.startOffset, end: n.sourceCodeLocation.endOffset, html: serializeOuter(n) }));
  for (const edit of edits.sort((a,b) => b.start-a.start)) html = html.slice(0, edit.start) + edit.html + html.slice(edit.end);
  return html;
}
