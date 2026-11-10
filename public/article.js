const root = document.querySelector('#article');
const englishTitle = document.title;
const englishArticle = document.createDocumentFragment();
englishArticle.append(...[...root.childNodes].map(node => node.cloneNode(true)));
let language = 'en';
let scrollHandler;
try { language = localStorage.getItem('openmltheory-language') === 'zh' ? 'zh' : 'en'; } catch {}

async function copyCitationText(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch { /* Try the legacy copy command if clipboard access is denied. */ }
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.cssText = 'position:fixed;top:0;left:0;opacity:0;font-size:16px';
  const activeElement = document.activeElement;
  document.body.append(textarea);
  try {
    textarea.select();
    if (!document.execCommand('copy')) throw new Error('Copy command failed');
  } finally {
    textarea.remove();
    activeElement?.focus({ preventScroll: true });
  }
}

function bindCitationCopy(chinese) {
  const section = root.querySelector('.article-citation');
  const button = section?.querySelector('[data-copy-bibtex]');
  if (!button) return;
  const status = section.querySelector('[data-copy-status]');
  const copyIcon = button.querySelector('[data-copy-icon]');
  const checkIcon = button.querySelector('[data-check-icon]');
  const label = chinese ? '复制 BibTeX 引用' : 'Copy BibTeX citation';
  let resetTimer;
  const resetButton = () => {
    button.classList.remove('is-copied');
    button.setAttribute('aria-label', label);
    button.title = label;
    copyIcon.removeAttribute('hidden');
    checkIcon.setAttribute('hidden', '');
    status.textContent = '';
  };
  button.hidden = false;
  button.addEventListener('click', async () => {
    clearTimeout(resetTimer);
    resetButton();
    button.disabled = true;
    try {
      await copyCitationText(section.querySelector('[data-bibtex]').textContent.trim());
      button.classList.add('is-copied');
      button.setAttribute('aria-label', chinese ? '已复制 BibTeX 引用' : 'BibTeX citation copied');
      button.title = button.getAttribute('aria-label');
      copyIcon.setAttribute('hidden', '');
      checkIcon.removeAttribute('hidden');
      status.textContent = chinese ? '已复制' : 'Copied';
      resetTimer = window.setTimeout(resetButton, 1600);
    } catch {
      status.textContent = chinese ? '复制失败，请选择 BibTeX 文本手动复制。' : 'Select the BibTeX text to copy it manually.';
    } finally {
      button.disabled = false;
    }
  });
}

const citationPreviewState = {
  activeAnchor: null,
  hideTimer: 0,
  index: new Map(),
  popup: null,
  suppressFocus: false,
  touchOpen: false,
};

const citationPreviewIsSmallScreen = () =>
  window.matchMedia?.('(max-width: 700px), (pointer: coarse)').matches ?? window.innerWidth <= 700;

function citationPreviewReferenceId(anchor) {
  if (anchor?.dataset.refId) return anchor.dataset.refId;
  const href = anchor?.getAttribute('href') || '';
  return href.startsWith('#') ? href.slice(1) : '';
}

function citationPreviewReferenceRoot() {
  return root.querySelector('.references, ol.refs, .bibliography');
}

function indexCitationPreviewReferences() {
  const referenceRoot = citationPreviewReferenceRoot();
  if (!referenceRoot) return false;
  const next = new Map();
  referenceRoot.querySelectorAll('li[id]').forEach(item => {
    const clone = item.cloneNode(true);
    clone.querySelectorAll('.backrefs, .footnote-backref, [data-footnote-backref], a[href^="#refctx-"]').forEach(node => node.remove());
    clone.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
    clone.querySelectorAll('a[href]').forEach(link => {
      if (/^https?:/.test(link.href)) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
    });
    next.set(item.id, clone);
  });
  citationPreviewState.index = next;
  return next.size > 0;
}

function citationPreviewPopup() {
  if (citationPreviewState.popup) return citationPreviewState.popup;
  const popup = document.createElement('aside');
  popup.id = 'citation-preview';
  popup.className = 'citation-preview';
  popup.setAttribute('role', 'dialog');
  popup.setAttribute('aria-hidden', 'true');
  popup.hidden = true;
  popup.innerHTML = '<div class="citation-preview__header"><span class="citation-preview__label">Reference</span><button type="button" class="citation-preview__close" aria-label="Close citation preview"><span aria-hidden="true">×</span></button></div><div class="citation-preview__body"></div>';
  document.body.append(popup);
  popup.addEventListener('mouseenter', () => clearTimeout(citationPreviewState.hideTimer));
  popup.addEventListener('mouseleave', () => scheduleCitationPreviewHide());
  popup.addEventListener('focusin', () => clearTimeout(citationPreviewState.hideTimer));
  popup.addEventListener('focusout', event => {
    if (!popup.contains(event.relatedTarget)) scheduleCitationPreviewHide();
  });
  popup.querySelector('.citation-preview__close').addEventListener('click', () => {
    const anchor = citationPreviewState.activeAnchor;
    hideCitationPreview(true);
    citationPreviewState.suppressFocus = true;
    anchor?.focus();
    citationPreviewState.suppressFocus = false;
  });
  citationPreviewState.popup = popup;
  return popup;
}

function scheduleCitationPreviewHide(delay = 130) {
  clearTimeout(citationPreviewState.hideTimer);
  citationPreviewState.hideTimer = window.setTimeout(() => hideCitationPreview(), delay);
}

function placeCitationPreview(anchor, popup) {
  const rect = anchor.getBoundingClientRect();
  const margin = 12;
  const viewportWidth = document.documentElement.clientWidth;
  const popupWidth = Math.min(390, viewportWidth - margin * 2);
  popup.style.width = `${popupWidth}px`;
  popup.hidden = false;
  popup.style.visibility = 'hidden';
  const popupRect = popup.getBoundingClientRect();
  let left = rect.left;
  if (left + popupRect.width > viewportWidth - margin) left = viewportWidth - margin - popupRect.width;
  left = Math.max(margin, left);
  const roomBelow = window.innerHeight - rect.bottom - margin;
  const roomAbove = rect.top - margin;
  let top = rect.bottom + 8;
  if (popupRect.height > roomBelow && roomAbove > roomBelow) top = rect.top - popupRect.height - 8;
  top = Math.max(margin, Math.min(top, window.innerHeight - popupRect.height - margin));
  popup.style.left = `${left}px`;
  popup.style.top = `${top}px`;
  popup.style.visibility = 'visible';
}

function showCitationPreview(anchor) {
  const reference = citationPreviewState.index.get(citationPreviewReferenceId(anchor));
  if (!anchor || !reference) return false;
  if (citationPreviewState.activeAnchor && citationPreviewState.activeAnchor !== anchor) hideCitationPreview(true);
  clearTimeout(citationPreviewState.hideTimer);
  const popup = citationPreviewPopup();
  const body = popup.querySelector('.citation-preview__body');
  const label = popup.querySelector('.citation-preview__label');
  const referenceBody = document.createElement('div');
  referenceBody.className = 'citation-preview__reference';
  const referenceClone = reference.cloneNode(true);
  referenceClone.removeAttribute('id');
  referenceClone.classList.remove('csl-entry');
  referenceBody.append(referenceClone);
  body.replaceChildren(referenceBody);
  label.textContent = document.documentElement.lang.startsWith('zh') ? '参考文献' : 'Reference';
  popup.querySelector('.citation-preview__close').setAttribute('aria-label', document.documentElement.lang.startsWith('zh') ? '关闭参考文献预览' : 'Close citation preview');
  popup.setAttribute('aria-label', document.documentElement.lang.startsWith('zh') ? '参考文献预览' : 'Citation preview');
  citationPreviewState.activeAnchor = anchor;
  anchor.setAttribute('aria-describedby', popup.id);
  anchor.setAttribute('aria-expanded', 'true');
  popup.setAttribute('aria-hidden', 'false');
  placeCitationPreview(anchor, popup);
  popup.classList.add('is-visible');
  return true;
}

function hideCitationPreview(force = false) {
  if (!citationPreviewState.activeAnchor) return;
  if (!force && citationPreviewState.touchOpen) return;
  const popup = citationPreviewPopup();
  if (!force && popup.contains(document.activeElement)) return;
  citationPreviewState.activeAnchor.removeAttribute('aria-describedby');
  citationPreviewState.activeAnchor.setAttribute('aria-expanded', 'false');
  popup.classList.remove('is-visible');
  popup.setAttribute('aria-hidden', 'true');
  popup.hidden = true;
  citationPreviewState.activeAnchor = null;
  citationPreviewState.touchOpen = false;
}

function bindCitationPreviews() {
  getCitationPreviewAnchors().forEach(anchor => {
    if (anchor.dataset.citationPreviewBound === 'true') return;
    anchor.dataset.citationPreviewBound = 'true';
    anchor.setAttribute('aria-haspopup', 'dialog');
    anchor.setAttribute('aria-expanded', 'false');
    anchor.addEventListener('mouseenter', () => {
      if (!citationPreviewIsSmallScreen()) showCitationPreview(anchor);
    });
    anchor.addEventListener('mouseleave', () => {
      if (!citationPreviewIsSmallScreen()) scheduleCitationPreviewHide();
    });
    anchor.addEventListener('focus', () => {
      if (!citationPreviewState.suppressFocus) showCitationPreview(anchor);
    });
    anchor.addEventListener('blur', event => {
      if (!citationPreviewPopup().contains(event.relatedTarget)) scheduleCitationPreviewHide();
    });
    anchor.addEventListener('click', event => {
      if (!citationPreviewIsSmallScreen() || anchor.dataset.citationMobile !== 'preview-first' || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
        hideCitationPreview(true);
        return;
      }
      if (citationPreviewState.activeAnchor !== anchor || !citationPreviewState.touchOpen) {
        if (showCitationPreview(anchor)) {
          event.preventDefault();
          citationPreviewState.touchOpen = true;
        }
      } else {
        hideCitationPreview(true);
      }
    });
  });
}

function getCitationPreviewAnchors() {
  return root.querySelectorAll('main a[data-ref-id][data-citation-preview="true"]');
}

function refreshCitationPreviews() {
  hideCitationPreview(true);
  if (!indexCitationPreviewReferences()) return;
  bindCitationPreviews();
}

document.addEventListener('click', event => {
  const popup = citationPreviewState.popup;
  if (!citationPreviewState.activeAnchor || popup?.contains(event.target) || citationPreviewState.activeAnchor.contains(event.target)) return;
  hideCitationPreview(true);
});
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || !citationPreviewState.activeAnchor) return;
  const anchor = citationPreviewState.activeAnchor;
  hideCitationPreview(true);
  citationPreviewState.suppressFocus = true;
  anchor.focus();
  citationPreviewState.suppressFocus = false;
});
window.addEventListener('resize', () => {
  if (citationPreviewState.activeAnchor) placeCitationPreview(citationPreviewState.activeAnchor, citationPreviewPopup());
});
window.addEventListener('scroll', () => {
  if (citationPreviewState.activeAnchor) placeCitationPreview(citationPreviewState.activeAnchor, citationPreviewPopup());
}, { passive: true });

function render(next) {
  language = next;
  const template = next === 'zh' ? document.querySelector('#article-zh') : null;
  root.replaceChildren(next === 'zh' ? template.content.cloneNode(true) : englishArticle.cloneNode(true));
  document.documentElement.lang = next === 'zh' ? 'zh-CN' : 'en';
  document.title = next === 'zh' ? template.dataset.title : englishTitle;
  root.querySelectorAll('[data-article-language]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.articleLanguage === next));
    button.addEventListener('click', () => {
      if (button.dataset.articleLanguage !== language) render(button.dataset.articleLanguage);
    });
  });
  window.openmltheoryTheme?.refresh();
  bindCitationCopy(next === 'zh');
  refreshCitationPreviews();
  const toc = root.querySelector('#toc ol');
  const headings = [...root.querySelectorAll('main h2[id], main h3[id]')].filter(heading => heading.id !== 'refs');
  headings.forEach(heading => {
    const item = document.createElement('li');
    if (heading.tagName === 'H3') item.className = 'sub';
    const link = document.createElement('a');
    link.href = `#${heading.id}`;
    link.textContent = heading.textContent;
    item.append(link);
    toc.append(item);
  });
  if (scrollHandler) document.removeEventListener('scroll', scrollHandler);
  const links = [...toc.querySelectorAll('a')];
  let activeIndex = -1;
  scrollHandler = () => {
    let current = 0;
    headings.forEach((heading, index) => { if (heading.getBoundingClientRect().top < 120) current = index; });
    if (current === activeIndex) return;
    activeIndex = current;
    links.forEach((link, index) => link.classList.toggle('active', index === current));
    links[current]?.scrollIntoView({ block: 'nearest' });
  };
  document.addEventListener('scroll', scrollHandler, { passive: true });
  scrollHandler();
  window.addEventListener('beforeprint', () => root.querySelectorAll('details').forEach(detail => { detail.open = true; }), { once: true });
  try { localStorage.setItem('openmltheory-language', next); } catch {}
}

render(language);
