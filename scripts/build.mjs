import { cp, mkdir, readFile, writeFile, rm, stat } from 'node:fs/promises';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'dist');
const blogRoot = resolve(root, 'blog');
const blogSource = resolve(blogRoot, 'MLtheorybench');
const articleControls = '<nav class="language-switch" aria-label="Choose language"><button type="button" data-article-language="en" aria-pressed="true">EN</button><button type="button" data-article-language="zh" aria-pressed="false">中文</button></nav><button class="theme-toggle" type="button" role="switch" aria-checked="false" data-theme-toggle aria-label="Switch to dark mode" title="Switch to dark mode"><span aria-hidden="true">☾</span></button>';
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(resolve(root, 'public'), output, { recursive: true });
await mkdir(resolve(output, 'blog'), { recursive: true });
const assets = new Set();
const articles = {};
for (const filename of ['index.html', 'index.en.html']) {
  let html = await readFile(resolve(blogSource, filename), 'utf8');
  for (const match of html.matchAll(/(?:src|href)=["']([^"'#]+)["']/g)) {
    const asset = match[1];
    if (/^(?:https?:|data:|\/\/)/.test(asset) || asset === 'index.html' || asset === 'index.en.html') continue;
    assets.add(asset);
  }
  const chinese = filename === 'index.html';
  html = html.replace(/<link rel="alternate" hreflang="(?:zh-CN|en)"[^>]*>\n?/g, '');
  html = html.replace(/<nav class="language-switch"[^>]*>[\s\S]*?<\/nav>/, articleControls);
  html = html.replace(/<div class="topbar"><b>MLtheorybench<\/b>/, `<div class="topbar"><a class="home-link" href="/">← OpenMLTheory</a><b>MLtheorybench</b>`);
  html = html.replace('</body>', `<nav aria-label="${chinese ? '文章导航' : 'Article navigation'}" style="text-align:center;padding:0 16px 35px"><a href="/blog/?view=list" style="color:#72766e;text-decoration:none;font-size:14px">← ${chinese ? '返回博客' : 'Back to Blog'}</a></nav>\n</body>`);
  const title = html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? 'MLtheorybench';
  const body = html.match(/<body>([\s\S]*?)<\/body>/)?.[1];
  if (!body) throw new Error(`Missing body in ${filename}`);
  articles[chinese ? 'zh' : 'en'] = {
    title,
    body: body.replace(/<script>[\s\S]*?<\/script>/g, '').replaceAll('src="assets/', 'src="/blog/assets/')
  };
}
for (const asset of assets) {
  const source = resolve(blogSource, asset);
  if (!source.startsWith(blogSource + '/')) throw new Error(`Asset outside blog: ${asset}`);
  await stat(source);
  const destination = resolve(output, 'blog', asset);
  await mkdir(dirname(destination), { recursive: true });
  await cp(source, destination);
}
const template = (language, article) => `<template id="article-${language}" data-title="${article.title.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}">${article.body.replaceAll('</template>', '<\\/template>')}</template>`;
const englishHead = await readFile(resolve(blogSource, 'index.en.html'), 'utf8');
const head = englishHead.match(/<head>([\s\S]*?)<\/head>/)?.[1]
  ?.replace(/<link rel="alternate" hreflang="(?:zh-CN|en)"[^>]*>\n?/g, '');
if (!head) throw new Error('Missing article head');
const combined = `<!doctype html><html lang="en"><head><script src="/theme.js?v=20261106-1"></script><link rel="icon" type="image/svg+xml" href="/favicon.svg?v=20261106"><meta name="description" content="MLtheorybench: 885 proof tasks from machine learning theory papers, comparing seven AI models.">${head}<link rel="stylesheet" href="/article-theme.css?v=20261106-2"></head><body><div id="article"></div>${template('en', articles.en)}${template('zh', articles.zh)}<script src="/article.js?v=20261106-1" defer></script></body></html>`;
await writeFile(resolve(output, 'blog', 'MLtheorybench'), combined);
const valgSource = resolve(blogRoot, 'valg');
const valgAssets = new Set();
const valgArticles = {};
for (const filename of ['index.html', 'index.en.html']) {
  let html = await readFile(resolve(valgSource, filename), 'utf8');
  html = html.replace(/href="\.\.\/MLtheorybench\/index(?:\.en)?\.html"/g, 'href="/blog/MLtheorybench"');
  for (const match of html.matchAll(/(?:src|href)=["']([^"'#]+)["']/g)) {
    const asset = match[1];
    if (/^(?:https?:|data:|\/\/|\/)/.test(asset) || asset === 'index.html' || asset === 'index.en.html') continue;
    valgAssets.add(asset);
  }
  const chinese = filename === 'index.html';
  html = html.replace(/<link rel="alternate" hreflang="(?:zh-CN|en)"[^>]*>\n?/g, '');
  html = html.replace(/<nav class="language-switch"[^>]*>[\s\S]*?<\/nav>/, articleControls);
  html = html.replace(/<div class="topbar"><b>[^<]+<\/b>/, `<div class="topbar"><a class="home-link" href="/">← OpenMLTheory</a><b>VALG</b>`);
  html = html.replace('</body>', `<nav aria-label="${chinese ? '文章导航' : 'Article navigation'}" style="text-align:center;padding:0 16px 35px"><a href="/blog/?view=list" style="color:#72766e;text-decoration:none;font-size:14px">← ${chinese ? '返回博客' : 'Back to Blog'}</a></nav>\n</body>`);
  const title = html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? 'VALG';
  const body = html.match(/<body>([\s\S]*?)<\/body>/)?.[1];
  if (!body) throw new Error(`Missing body in ${filename}`);
  valgArticles[chinese ? 'zh' : 'en'] = {
    title,
    body: body.replace(/<script>[\s\S]*?<\/script>/g, '')
      .replaceAll('src="assets/', 'src="/blog/assets/valg/')
      .replaceAll('href="assets/', 'href="/blog/assets/valg/')
  };
}
for (const asset of valgAssets) {
  const source = resolve(valgSource, asset);
  if (!source.startsWith(valgSource + '/')) throw new Error(`Asset outside VALG article: ${asset}`);
  await stat(source);
  const destination = resolve(output, 'blog', 'assets', 'valg', asset.replace(/^assets\//, ''));
  await mkdir(dirname(destination), { recursive: true });
  await cp(source, destination);
}
const valgTemplate = (language, article) => `<template id="article-${language}" data-title="${article.title.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}">${article.body.replaceAll('</template>', '<\\/template>')}</template>`;
const valgHead = await readFile(resolve(valgSource, 'index.en.html'), 'utf8');
const valgHeadContent = valgHead.match(/<head>([\s\S]*?)<\/head>/)?.[1]
  ?.replace(/<link rel="alternate" hreflang="(?:zh-CN|en)"[^>]*>\n?/g, '');
if (!valgHeadContent) throw new Error('Missing VALG article head');
const valgCombined = `<!doctype html><html lang="en"><head><script src="/theme.js?v=20261106-1"></script><link rel="icon" type="image/svg+xml" href="/favicon.svg?v=20261106"><meta name="description" content="VALG: an agentic workflow for developing ML theory research with explicit theorem scope and proof review.">${valgHeadContent}<link rel="stylesheet" href="/article-theme.css?v=20261106-2"></head><body><div id="article"></div>${valgTemplate('en', valgArticles.en)}${valgTemplate('zh', valgArticles.zh)}<script src="/article.js?v=20261106-1" defer></script></body></html>`;
await writeFile(resolve(output, 'blog', 'valg'), valgCombined);
await writeFile(resolve(output, '_redirects'), [
  '/blog/MLtheorybench/ /blog/MLtheorybench 301',
  '/blog/MLtheorybench/index.html /blog/MLtheorybench 301',
  '/blog/MLtheorybench/index.en.html /blog/MLtheorybench 301',
  '/blog /blog/ 302',
  '/blog/index.html /blog/ 302',
  '/blog/index.en.html /blog/ 302',
  '/blog/valg/ /blog/valg 301',
  '/blog/valg/index.html /blog/valg 301',
  '/blog/valg/index.en.html /blog/valg 301'
].join('\n') + '\n');
const headersPath = resolve(output, '_headers');
const headers = await readFile(headersPath, 'utf8');
await writeFile(headersPath, `${headers.trimEnd()}\n\n/blog/MLtheorybench\n  Content-Type: text/html; charset=utf-8\n\n/blog/valg\n  Content-Type: text/html; charset=utf-8\n`);
// Explicit output allowlist: no problem records, drafts, archives, or credentials.
await writeFile(resolve(output, '404.html'), `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Page not found — OpenMLTheory</title><style>body{margin:15vh auto;padding:24px;max-width:600px;color:#242822;font:18px/1.7 Georgia,serif}a{color:#be5134}</style><p>OpenMLTheory / 404</p><h1>This page is still an open question.</h1><p>The page you requested could not be found.</p><a href="/">← Back to OpenMLTheory</a></html>`);
console.log(`Built ${relative(root, output)}: homepage, Chinese + English research articles, ${assets.size + valgAssets.size} referenced assets. No problem data included.`);
