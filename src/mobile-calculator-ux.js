const MOBILE_QUERY = '(max-width: 700px)';

function qs(selector, root = document) { return root.querySelector(selector); }
function parseCurrency(value) {
  const normalized = String(value || '').replace(/[^0-9,.-]/g, '').replace(/\./g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function hasUsableResult() {
  const input = qs('#input-salary');
  const net = qs('#stat-avg-net');
  const inputValue = Number(input?.dataset?.rawValue || 0) || parseCurrency(input?.value);
  const netValue = parseCurrency(net?.textContent);
  return inputValue > 0 && netValue > 0;
}

function rectWidth(selector) {
  const node = qs(selector);
  return node ? Math.round(node.getBoundingClientRect().width * 100) / 100 : null;
}

function setupLayoutDebug() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('layoutdebug') !== '1') return;

  const panel = document.createElement('pre');
  panel.setAttribute('data-layout-debug', '1');
  panel.style.cssText = 'position:fixed;left:8px;right:8px;top:8px;z-index:99999;margin:0;padding:10px;border-radius:10px;background:rgba(0,0,0,.88);color:#7CFF9B;font:11px/1.35 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre-wrap;pointer-events:none;';
  document.body.appendChild(panel);

  const update = () => {
    const vv = window.visualViewport;
    const form = qs('#hesaplayici')?.firstElementChild;
    const card = form?.firstElementChild;
    const data = {
      innerWidth: window.innerWidth,
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      outerWidth: window.outerWidth,
      dpr: window.devicePixelRatio,
      vvWidth: vv ? Math.round(vv.width * 100) / 100 : null,
      vvScale: vv ? Math.round(vv.scale * 1000) / 1000 : null,
      body: Math.round(document.body.getBoundingClientRect().width * 100) / 100,
      main: rectWidth('main'),
      calculator: rectWidth('#hesaplayici'),
      formColumn: form ? Math.round(form.getBoundingClientRect().width * 100) / 100 : null,
      formCard: card ? Math.round(card.getBoundingClientRect().width * 100) / 100 : null,
      result: rectWidth('.metric-hero'),
      media700: window.matchMedia(MOBILE_QUERY).matches,
      media900: window.matchMedia('(max-width: 900px)').matches
    };
    panel.textContent = Object.entries(data).map(([key, value]) => `${key}: ${value}`).join('\n');
  };

  update();
  window.addEventListener('resize', update, { passive: true });
  window.visualViewport?.addEventListener('resize', update, { passive: true });
  window.setInterval(update, 500);
}

function isIosWebKit() {
  const ua = navigator.userAgent || '';
  const platform = navigator.platform || '';
  const touchMac = platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return /iPhone|iPad|iPod/.test(ua) || touchMac;
}

function setupIosViewportRecovery(input) {
  if (!input || !isIosWebKit() || !window.visualViewport) return;
  const viewportMeta = document.querySelector('meta[name="viewport"]');
  if (!viewportMeta) return;

  const originalContent = viewportMeta.getAttribute('content') || 'width=device-width, initial-scale=1';
  const baselineClientWidth = document.documentElement.clientWidth;
  let interactionUntil = 0;
  let recovering = false;

  const markInteraction = () => {
    interactionUntil = Date.now() + 1800;
  };

  const needsRecovery = () => {
    if (recovering || Date.now() > interactionUntil) return false;
    const scale = window.visualViewport?.scale || 1;
    const clientWidth = document.documentElement.clientWidth;
    const stableLayout = Math.abs(clientWidth - baselineClientWidth) <= 2;
    const visualExpanded = window.innerWidth > clientWidth * 1.08;
    return stableLayout && visualExpanded && scale < 0.92;
  };

  const recover = () => {
    if (!needsRecovery()) return;
    recovering = true;
    const normalized = originalContent
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
      .filter((part) => !/^initial-scale=/i.test(part) && !/^minimum-scale=/i.test(part) && !/^maximum-scale=/i.test(part));
    viewportMeta.setAttribute('content', [...normalized, 'initial-scale=1', 'minimum-scale=1', 'maximum-scale=1'].join(', '));
    window.requestAnimationFrame(() => {
      window.setTimeout(() => {
        viewportMeta.setAttribute('content', originalContent);
        recovering = false;
      }, 140);
    });
  };

  const scheduleRecovery = () => {
    for (const delay of [0, 80, 180, 320, 600]) window.setTimeout(recover, delay);
  };

  input.addEventListener('focus', () => {
    markInteraction();
    scheduleRecovery();
  });
  input.addEventListener('input', () => {
    markInteraction();
    scheduleRecovery();
  });
  input.addEventListener('blur', () => {
    markInteraction();
    scheduleRecovery();
  });
  window.visualViewport.addEventListener('resize', recover, { passive: true });
}

function setupMobileStickyUx() {
  const sticky = qs('.enterprise-mobile-sticky');
  const result = qs('.metric-hero');
  const input = qs('#input-salary');
  if (!sticky || !result || !input) return;

  setupIosViewportRecovery(input);

  let resultVisible = false;
  const refresh = () => {
    const mobile = window.matchMedia(MOBILE_QUERY).matches;
    const shouldShow = mobile && hasUsableResult() && !resultVisible && document.activeElement !== input;
    sticky.classList.toggle('is-visible', shouldShow);
    sticky.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
  };

  const resultObserver = new IntersectionObserver((entries) => {
    resultVisible = entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.18);
    refresh();
  }, { threshold: [0, .18, .45] });
  resultObserver.observe(result);

  input.addEventListener('focus', () => {
    document.body.classList.add('enterprise-input-active');
    refresh();
  });
  input.addEventListener('blur', () => {
    document.body.classList.remove('enterprise-input-active');
    window.setTimeout(refresh, 80);
  });
  input.addEventListener('input', refresh);
  window.addEventListener('resize', refresh, { passive: true });
  window.addEventListener('orientationchange', () => window.setTimeout(refresh, 120), { passive: true });
  window.visualViewport?.addEventListener('resize', refresh, { passive: true });

  const payrollBody = qs('#payroll-body');
  if (payrollBody) new MutationObserver(refresh).observe(payrollBody, { childList: true, subtree: true, characterData: true });

  sticky.setAttribute('aria-hidden', 'true');
  refresh();
}

function initializeMobileUx() {
  setupMobileStickyUx();
  setupLayoutDebug();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeMobileUx, { once: true });
else initializeMobileUx();
