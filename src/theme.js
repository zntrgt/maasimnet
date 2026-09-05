(() => {
  const STORAGE_KEY = 'maasim_theme_v1';
  const root = document.documentElement;
  const media = window.matchMedia('(prefers-color-scheme: dark)');

  const getStored = () => {
    try {
      const value = window.localStorage.getItem(STORAGE_KEY);
      return value === 'dark' || value === 'light' ? value : null;
    } catch (_) {
      return null;
    }
  };

  const systemTheme = () => media.matches ? 'dark' : 'light';

  function syncButtons(theme) {
    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
      const next = theme === 'dark' ? 'light' : 'dark';
      button.setAttribute('aria-label', `${next === 'dark' ? 'Karanlık' : 'Aydınlık'} temaya geç`);
      button.setAttribute('title', `${next === 'dark' ? 'Karanlık' : 'Aydınlık'} temaya geç`);
      button.setAttribute('aria-pressed', String(theme === 'dark'));
    });
  }

  function applyTheme(theme, { persist = false } = {}) {
    const safeTheme = theme === 'dark' ? 'dark' : 'light';
    root.dataset.theme = safeTheme;
    root.style.colorScheme = safeTheme;
    if (persist) {
      try { window.localStorage.setItem(STORAGE_KEY, safeTheme); } catch (_) {}
    }
    syncButtons(safeTheme);
    window.dispatchEvent(new CustomEvent('maasim:themechange', { detail: { theme: safeTheme } }));
  }

  function init() {
    applyTheme(getStored() || root.dataset.theme || systemTheme());
    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
      if (button.dataset.themeBound === 'true') return;
      button.dataset.themeBound = 'true';
      button.addEventListener('click', () => {
        applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', { persist: true });
      });
    });
  }

  media.addEventListener?.('change', () => {
    if (!getStored()) applyTheme(systemTheme());
  });

  window.MaaisimTheme = Object.freeze({ applyTheme, getTheme: () => root.dataset.theme || systemTheme() });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
