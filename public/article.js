const root = document.querySelector('#article');
let language = 'en';
let scrollHandler;
try { language = localStorage.getItem('openmltheory-language') === 'zh' ? 'zh' : 'en'; } catch {}

function render(next) {
  language = next;
  const template = document.querySelector(`#article-${next}`);
  root.replaceChildren(template.content.cloneNode(true));
  document.documentElement.lang = next === 'zh' ? 'zh-CN' : 'en';
  document.title = template.dataset.title;
  root.querySelectorAll('[data-article-language]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.articleLanguage === next));
    button.addEventListener('click', () => {
      if (button.dataset.articleLanguage !== language) render(button.dataset.articleLanguage);
    });
  });
  window.openmltheoryTheme?.refresh();
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
  scrollHandler = () => {
    let current = 0;
    headings.forEach((heading, index) => { if (heading.getBoundingClientRect().top < 120) current = index; });
    links.forEach((link, index) => link.classList.toggle('active', index === current));
  };
  document.addEventListener('scroll', scrollHandler, { passive: true });
  scrollHandler();
  window.addEventListener('beforeprint', () => root.querySelectorAll('details').forEach(detail => { detail.open = true; }), { once: true });
  try { localStorage.setItem('openmltheory-language', next); } catch {}
}

render(language);
