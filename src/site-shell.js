(() => {
  try {
    window.localStorage.removeItem('maasim_consent_v1');
    document.cookie = 'maasim_consent=; Max-Age=0; Path=/; SameSite=Lax; Secure';
  } catch (_) {}

  document.addEventListener('click', event => {
    const trigger = event.target.closest('[data-cookiebot-renew]');
    if (!trigger) return;
    event.preventDefault();
    if (window.Cookiebot?.renew) window.Cookiebot.renew();
    else window.location.assign('/cerez-politikasi/');
  });

  const button = document.querySelector('.site-menu-button');
  const menu = document.getElementById('site-mobile-menu');
  if (!button || !menu) return;

  const closeMenu = () => {
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', 'Menüyü aç');
    menu.hidden = true;
  };

  button.addEventListener('click', () => {
    const open = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!open));
    button.setAttribute('aria-label', open ? 'Menüyü aç' : 'Menüyü kapat');
    menu.hidden = open;
  });
  menu.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  window.addEventListener('resize', () => { if (window.innerWidth > 1050) closeMenu(); });
})();
