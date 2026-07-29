(() => {
  const button = document.querySelector('.site-menu-button');
  const menu = document.getElementById('site-mobile-menu');
  if (!button || !menu) return;
  const closeMenu = () => { button.setAttribute('aria-expanded','false'); button.setAttribute('aria-label','Menüyü aç'); menu.hidden = true; };
  button.addEventListener('click', () => { const open = button.getAttribute('aria-expanded') === 'true'; button.setAttribute('aria-expanded', String(!open)); button.setAttribute('aria-label', open ? 'Menüyü aç' : 'Menüyü kapat'); menu.hidden = open; });
  menu.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  window.addEventListener('resize', () => { if (window.innerWidth > 1050) closeMenu(); });
})();