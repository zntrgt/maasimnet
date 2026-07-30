(() => {
  try {
    window.localStorage.removeItem('maasim_consent_v1');
    document.cookie = 'maasim_consent=; Max-Age=0; Path=/; SameSite=Lax; Secure';
  } catch (_) {}

  const hasStatisticsConsent = () => window.Cookiebot?.consent?.statistics === true;
  const sendEvent = (name, params = {}) => {
    if (!hasStatisticsConsent() || typeof window.gtag !== 'function') return false;
    window.gtag('event', name, params);
    return true;
  };

  const hadStatisticsConsentAtLoad = hasStatisticsConsent();
  window.addEventListener('CookiebotOnAccept', () => {
    if (hadStatisticsConsentAtLoad || !hasStatisticsConsent()) return;
    if (document.getElementById('input-salary')) {
      sendEvent('calculator_view', {
        calculation_direction: document.getElementById('btn-mode-net')?.getAttribute('aria-pressed') === 'true' ? 'net' : 'gross',
        calculation_year: 2026,
        scenario_type: 'standard',
        consent_granted_after_load: true
      });
    }
  }, { once: true });

  document.addEventListener('click', event => {
    const renewTrigger = event.target.closest('[data-cookiebot-renew]');
    if (renewTrigger) {
      event.preventDefault();
      if (window.Cookiebot?.renew) window.Cookiebot.renew();
      else window.location.assign('/cerez-politikasi/');
      return;
    }

    const blogCta = event.target.closest('.content-cta a[href], .context-links a[href]');
    if (blogCta) {
      sendEvent('blog_cta_clicked', {
        link_url: blogCta.href,
        link_text: (blogCta.textContent || '').trim().slice(0, 100),
        page_path: window.location.pathname
      });
    }
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
