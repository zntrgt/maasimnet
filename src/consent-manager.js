(() => {
  'use strict';

  const CONSENT_VERSION = '2026-07-29.1';
  const STORAGE_KEY = 'maasim.consent';
  const CONSENT_TTL_MS = 180 * 24 * 60 * 60 * 1000;
  const DEFAULT_GA_ID = 'G-988BB5B64E';
  const scriptElement = document.currentScript;
  const GA_ID = scriptElement?.dataset.gaId || DEFAULT_GA_ID;
  const state = {
    consent: null,
    analyticsLoaded: false,
    marketingActivated: false,
    contextTracked: false,
    lastFocusedElement: null
  };

  const allowedEvents = Object.freeze({
    calculator_view: ['calculator_type', 'tax_year'],
    calculator_start: ['calculator_type', 'scenario_type'],
    calculation_complete: ['calculator_type', 'scenario_type', 'changed_month'],
    result_tab_view: ['tab_name', 'calculator_type'],
    job_change_warning_view: ['tax_year', 'source_page'],
    faq_open: ['faq_id', 'page_type'],
    source_click: ['source_domain', 'document_type'],
    blog_to_calculator_click: ['article_slug', 'calculator_type'],
    article_read_75: ['article_slug', 'content_group']
  });

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };

  window.gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    functionality_storage: 'denied',
    personalization_storage: 'denied',
    security_storage: 'granted',
    wait_for_update: 500
  });

  function readConsent() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!parsed || parsed.version !== CONSENT_VERSION) return null;
      if (typeof parsed.analytics !== 'boolean' || typeof parsed.marketing !== 'boolean') return null;
      const updatedAt = Date.parse(parsed.updatedAt || '');
      if (!Number.isFinite(updatedAt) || Date.now() - updatedAt > CONSENT_TTL_MS) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  function writeConsent(consent) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
      return true;
    } catch {
      return false;
    }
  }

  function isCertifiedCmpReady() {
    return window.__MAASIM_CERTIFIED_CMP_READY__ === true
      || document.documentElement.dataset.certifiedCmp === 'ready';
  }

  function googleConsentPayload(consent) {
    const marketingGranted = Boolean(consent?.marketing && isCertifiedCmpReady());
    return {
      analytics_storage: consent?.analytics ? 'granted' : 'denied',
      ad_storage: marketingGranted ? 'granted' : 'denied',
      ad_user_data: marketingGranted ? 'granted' : 'denied',
      ad_personalization: marketingGranted ? 'granted' : 'denied',
      functionality_storage: 'denied',
      personalization_storage: 'denied',
      security_storage: 'granted'
    };
  }

  function updateGoogleConsent(consent) {
    window.gtag('consent', 'update', googleConsentPayload(consent));
  }

  function cleanPageLocation() {
    return `${window.location.origin}${window.location.pathname}`;
  }

  function cleanReferrer() {
    if (!document.referrer) return undefined;
    try {
      const referrer = new URL(document.referrer);
      return referrer.origin === window.location.origin
        ? `${referrer.origin}${referrer.pathname}`
        : referrer.origin;
    } catch {
      return undefined;
    }
  }

  function loadAnalytics() {
    if (!state.consent?.analytics || state.analyticsLoaded || !GA_ID) return;
    state.analyticsLoaded = true;

    const analyticsScript = document.createElement('script');
    analyticsScript.async = true;
    analyticsScript.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
    analyticsScript.dataset.consentManaged = 'analytics';
    analyticsScript.onload = () => {
      window.gtag('js', new Date());
      window.gtag('config', GA_ID, {
        send_page_view: false,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        cookie_flags: 'SameSite=Lax;Secure',
        cookie_expires: 15552000,
        cookie_update: true
      });
      const pageView = {
        page_location: cleanPageLocation(),
        page_title: document.title
      };
      const referrer = cleanReferrer();
      if (referrer) pageView.page_referrer = referrer;
      window.gtag('event', 'page_view', pageView);
    };
    document.head.appendChild(analyticsScript);
  }

  function activateMarketingScripts() {
    if (!state.consent?.marketing || state.marketingActivated) return;
    const certifiedCmpReady = isCertifiedCmpReady();
    const blockedScripts = [...document.querySelectorAll('script[type="text/plain"][data-consent-category="marketing"]')];
    const hasGoogleAdvertising = blockedScripts.some((script) => /googlesyndication|doubleclick/i.test(script.dataset.consentSrc || script.textContent));
    if (hasGoogleAdvertising && !certifiedCmpReady) return;
    state.marketingActivated = true;

    blockedScripts.forEach((blockedScript) => {
      if (blockedScript.dataset.consentActivated === 'true') return;
      const activeScript = document.createElement('script');
      const source = blockedScript.dataset.consentSrc;
      if (source) activeScript.src = source;
      if (blockedScript.dataset.consentAsync === 'true') activeScript.async = true;
      for (const attribute of blockedScript.attributes) {
        if (attribute.name.startsWith('data-copy-')) {
          activeScript.setAttribute(attribute.name.slice(10), attribute.value);
        }
      }
      if (!source) activeScript.textContent = blockedScript.textContent;
      activeScript.dataset.consentManaged = 'marketing';
      blockedScript.dataset.consentActivated = 'true';
      blockedScript.after(activeScript);
    });
  }

  function sanitizeParameters(eventName, parameters) {
    const keys = allowedEvents[eventName];
    if (!keys) return null;
    const output = {};
    for (const key of keys) {
      const value = parameters?.[key];
      if (value === undefined || value === null || value === '') continue;
      if (key === 'changed_month') {
        const month = Number(value);
        if (Number.isInteger(month) && month >= 1 && month <= 12) output[key] = month;
        continue;
      }
      if (key === 'tax_year') {
        const year = Number(value);
        if (Number.isInteger(year) && year >= 2020 && year <= 2100) output[key] = year;
        continue;
      }
      output[key] = String(value).slice(0, 80).replace(/[^\p{L}\p{N}._/-]/gu, '_');
    }
    return output;
  }

  window.maasimTrack = (eventName, parameters = {}) => {
    if (!state.consent?.analytics || !allowedEvents[eventName]) return false;
    const safeParameters = sanitizeParameters(eventName, parameters);
    window.gtag('event', eventName, safeParameters || {});
    return true;
  };

  function hideBanner() {
    const banner = document.getElementById('consent-banner');
    if (banner) banner.hidden = true;
  }

  function closePreferences() {
    const modal = document.getElementById('consent-modal');
    if (!modal) return;
    modal.hidden = true;
    document.documentElement.classList.remove('consent-modal-open');
    state.lastFocusedElement?.focus?.();
  }

  function openPreferences() {
    const modal = document.getElementById('consent-modal');
    if (!modal) return;
    state.lastFocusedElement = document.activeElement;
    const analytics = document.getElementById('consent-analytics');
    const marketing = document.getElementById('consent-marketing');
    analytics.checked = Boolean(state.consent?.analytics);
    marketing.checked = Boolean(state.consent?.marketing);
    modal.hidden = false;
    document.documentElement.classList.add('consent-modal-open');
    modal.querySelector('.consent-modal__close')?.focus();
  }

  function saveConsent(nextValues, source) {
    const previous = state.consent;
    const now = new Date().toISOString();
    const next = {
      version: CONSENT_VERSION,
      essential: true,
      analytics: Boolean(nextValues.analytics),
      marketing: Boolean(nextValues.marketing),
      source,
      createdAt: previous?.createdAt || now,
      updatedAt: now
    };

    writeConsent(next);
    state.consent = next;
    updateGoogleConsent(next);
    hideBanner();
    closePreferences();

    const revokedLoadedCategory = Boolean(
      (previous?.analytics && !next.analytics && state.analyticsLoaded)
      || (previous?.marketing && !next.marketing && state.marketingActivated)
    );

    if (revokedLoadedCategory) {
      window.location.reload();
      return;
    }

    loadAnalytics();
    activateMarketingScripts();
    trackInitialContext();
    window.dispatchEvent(new CustomEvent('maasim:consent-changed', { detail: { ...next } }));
  }

  function renderUi() {
    if (document.getElementById('consent-banner')) return;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <section class="consent-banner" id="consent-banner" aria-label="Çerez tercihleri" ${state.consent ? 'hidden' : ''}>
        <div class="consent-banner__copy">
          <strong>Gizlilik tercihiniz sizde</strong>
          <p>Zorunlu teknolojiler siteyi çalıştırır. Analitik ve reklam teknolojileri yalnızca izin verirseniz etkinleşir. Maaş ve hesaplama tutarlarınızı Analytics'e göndermeyiz.</p>
          <a href="/cerez-politikasi/">Çerez Politikasını inceleyin</a>
        </div>
        <div class="consent-banner__actions">
          <button type="button" class="consent-button consent-button--primary" data-consent-action="accept">Tümünü Kabul Et</button>
          <button type="button" class="consent-button consent-button--secondary" data-consent-action="reject">Tümünü Reddet</button>
          <button type="button" class="consent-button consent-button--ghost" data-consent-action="manage">Tercihleri Yönet</button>
        </div>
      </section>
      <div class="consent-modal" id="consent-modal" role="dialog" aria-modal="true" aria-labelledby="consent-modal-title" hidden>
        <div class="consent-modal__backdrop" data-consent-action="close"></div>
        <section class="consent-modal__panel">
          <button type="button" class="consent-modal__close" data-consent-action="close" aria-label="Çerez tercihlerini kapat">×</button>
          <p class="consent-modal__eyebrow">Gizlilik merkezi</p>
          <h2 id="consent-modal-title">Çerez tercihlerinizi yönetin</h2>
          <p>İzin vermediğiniz kategoriler yüklenmez. Tercihinizi daha sonra sayfanın altındaki “Çerez Tercihleri” bağlantısından değiştirebilirsiniz.</p>
          <div class="consent-category">
            <div><strong>Zorunlu teknolojiler</strong><p>Güvenlik, tercih kaydı ve sitenin temel çalışması için gereklidir.</p></div>
            <span class="consent-category__required">Her zaman aktif</span>
          </div>
          <label class="consent-category" for="consent-analytics">
            <div><strong>Analitik</strong><p>Sayfa ve hesaplayıcı kullanımını toplu olarak anlamamıza yardımcı olur. Maaş tutarları gönderilmez.</p></div>
            <input id="consent-analytics" type="checkbox" role="switch">
          </label>
          <label class="consent-category" for="consent-marketing">
            <div><strong>Reklam</strong><p>AdSense ve reklam ölçüm teknolojilerini etkinleştirir. Varsayılan olarak kapalıdır.</p></div>
            <input id="consent-marketing" type="checkbox" role="switch">
          </label>
          <div class="consent-modal__links"><a href="/gizlilik/">Gizlilik</a><a href="/kvkk-aydinlatma-metni/">KVKK Aydınlatma</a><a href="/cerez-politikasi/">Çerez Politikası</a></div>
          <div class="consent-modal__actions">
            <button type="button" class="consent-button consent-button--secondary" data-consent-action="reject">Tümünü Reddet</button>
            <button type="button" class="consent-button consent-button--primary" data-consent-action="save">Seçimlerimi Kaydet</button>
          </div>
        </section>
      </div>`;
    document.body.append(...wrapper.children);
  }

  function calculatorType() {
    return document.getElementById('btn-mode-net')?.getAttribute('aria-pressed') === 'true'
      ? 'net_to_gross'
      : 'gross_to_net';
  }

  function articleSlug() {
    const parts = window.location.pathname.split('/').filter(Boolean);
    return parts.at(-1) || 'home';
  }

  function trackInitialContext() {
    if (state.contextTracked || !state.consent?.analytics) return;
    if (document.getElementById('input-salary')) {
      state.contextTracked = window.maasimTrack('calculator_view', {
        calculator_type: calculatorType(),
        tax_year: 2026
      });
    }
  }

  function bindMeasurementEvents() {
    trackInitialContext();
    if (document.getElementById('input-salary')) {
      document.getElementById('input-salary').addEventListener('input', () => {
        window.maasimTrack('calculator_start', {
          calculator_type: calculatorType(),
          scenario_type: 'annual_standard'
        });
      }, { once: true });
    }

    document.addEventListener('click', (event) => {
      const target = event.target.closest('button, a, summary');
      if (!target) return;

      if (target.matches('[data-consent-open]')) {
        event.preventDefault();
        openPreferences();
        return;
      }

      const action = target.dataset.consentAction;
      if (action === 'accept') saveConsent({ analytics: true, marketing: true }, 'accept_all');
      if (action === 'reject') saveConsent({ analytics: false, marketing: false }, 'reject_all');
      if (action === 'manage') openPreferences();
      if (action === 'close') closePreferences();
      if (action === 'save') {
        saveConsent({
          analytics: document.getElementById('consent-analytics').checked,
          marketing: document.getElementById('consent-marketing').checked
        }, 'preferences');
      }

      const onclick = target.getAttribute('onclick') || '';
      if (onclick.includes('calculateAndShowPayroll')) {
        window.maasimTrack('calculation_complete', {
          calculator_type: calculatorType(),
          scenario_type: 'annual_standard'
        });
      }
      if (onclick.includes('togglePayrollDetail')) {
        window.maasimTrack('result_tab_view', {
          tab_name: 'payroll_detail',
          calculator_type: calculatorType()
        });
      }
      if (target.matches('details summary')) {
        window.maasimTrack('faq_open', { faq_id: target.textContent.trim().slice(0, 60), page_type: articleSlug() });
      }
      if (target.matches('a[href*="#hesaplayici"]') && window.location.pathname.startsWith('/blog/')) {
        window.maasimTrack('blog_to_calculator_click', {
          article_slug: articleSlug(),
          calculator_type: calculatorType()
        });
      }
    });

    let articleDepthTracked = false;
    window.addEventListener('scroll', () => {
      if (articleDepthTracked || !window.location.pathname.startsWith('/blog/')) return;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable > 0 && window.scrollY / scrollable >= 0.75) {
        articleDepthTracked = true;
        window.maasimTrack('article_read_75', { article_slug: articleSlug(), content_group: 'blog' });
      }
    }, { passive: true });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closePreferences();
    });
  }

  state.consent = readConsent();
  if (state.consent) {
    updateGoogleConsent(state.consent);
    loadAnalytics();
  }

  function certifiedCmpReady() {
    window.__MAASIM_CERTIFIED_CMP_READY__ = true;
    updateGoogleConsent(state.consent);
    activateMarketingScripts();
  }

  window.addEventListener('maasim:certified-cmp-ready', certifiedCmpReady);

  window.MaasimConsent = Object.freeze({
    openPreferences,
    certifiedCmpReady,
    getConsent: () => state.consent ? { ...state.consent } : null,
    version: CONSENT_VERSION
  });

  const initialize = () => {
    renderUi();
    bindMeasurementEvents();
    activateMarketingScripts();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();
