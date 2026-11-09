import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const escapeHtml = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

// One canonical English record is shared by both article languages.
export async function addArticleCitation(html, source, chinese) {
  const bibtex = (await readFile(resolve(source, 'citation.bib'), 'utf8')).trim();
  const label = chinese ? '复制 BibTeX 引用' : 'Copy BibTeX citation';
  const citation = `<section class="article-citation" aria-labelledby="cite-this-article">
  <h3 id="cite-this-article">${chinese ? '引用本文' : 'Cite this article'}</h3>
  <div class="article-citation-code">
    <pre data-bibtex><code>${escapeHtml(bibtex)}</code></pre>
    <button type="button" class="article-citation-copy" data-copy-bibtex hidden aria-label="${label}" title="${label}">
      <svg data-copy-icon viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
      <svg data-check-icon viewBox="0 0 24 24" aria-hidden="true" focusable="false" hidden><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
    </button>
  </div>
  <p class="article-citation-status" data-copy-status role="status" aria-live="polite"></p>
</section>`;
  // Insert after the conclusion, before the reference heading/container and its divider.
  const referencesStart = /(?:<hr>\s*)?<(?:h3|div)\b[^>]*\bid="refs"[^>]*>/;
  if (!referencesStart.test(html)) throw new Error(`Missing references in ${source}`);
  return html.replace(referencesStart, match => `${citation}\n\n${match}`);
}
