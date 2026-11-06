(() => {
  const key = 'openmltheory-theme';
  let theme = 'light';
  try { theme = localStorage.getItem(key) === 'dark' ? 'dark' : 'light'; } catch {}

  function refresh() {
    document.documentElement.dataset.theme = theme;
    const chinese = document.documentElement.lang.startsWith('zh');
    const label = theme === 'dark'
      ? (chinese ? '切换到浅色模式' : 'Switch to light mode')
      : (chinese ? '切换到深色模式' : 'Switch to dark mode');
    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
      button.setAttribute('aria-checked', String(theme === 'dark'));
      button.setAttribute('aria-label', label);
      button.title = label;
      button.querySelector('span').textContent = theme === 'dark' ? '☀' : '☾';
    });
  }

  document.documentElement.dataset.theme = theme;
  document.addEventListener('DOMContentLoaded', refresh);
  document.addEventListener('click', event => {
    if (!event.target.closest('[data-theme-toggle]')) return;
    theme = theme === 'light' ? 'dark' : 'light';
    try { localStorage.setItem(key, theme); } catch {}
    refresh();
  });
  window.openmltheoryTheme = { refresh };
})();
