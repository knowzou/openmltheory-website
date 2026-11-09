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
