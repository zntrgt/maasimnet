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

function syncMainToVisualViewport() {
  const main = qs('body[data-fintech-ui="v2"] > main');
  if (!main) return;

  const mobile = window.matchMedia(MOBILE_QUERY).matches;
  if (!mobile) {
    for (const property of ['width', 'max-width', 'margin-left', 'margin-right', 'transform']) {
      main.style.removeProperty(property);
    }
    document.documentElement.style.removeProperty('--mobile-visual-viewport-width');
    delete document.body.dataset.mobileVisualViewport;
    return;
  }

  const viewport = window.visualViewport;
  const width = Math.max(280, Math.round((viewport?.width || document.documentElement.clientWidth) * 100) / 100);
  const offsetLeft = Math.max(0, Math.round((viewport?.offsetLeft || 0) * 100) / 100);

  document.documentElement.style.setProperty('--mobile-visual-viewport-width', `${width}px`);
  document.body.dataset.mobileVisualViewport = String(width);

  // iOS Safari can keep a layout viewport wider than the currently visible viewport
  // after focus/keyboard/result updates. Inline !important makes the calculator use
  // exactly the visible width instead of inheriting that stale layout width.
  main.style.setProperty('width', `${width}px`, 'important');
  main.style.setProperty('max-width', `${width}px`, 'important');
  main.style.setProperty('margin-left', `${offsetLeft}px`, 'important');
  main.style.setProperty('margin-right', '0px', 'important');
  main.style.setProperty('transform', 'none', 'important');
}

function setupMobileStickyUx() {
  const sticky = qs('.enterprise-mobile-sticky');
  const result = qs('.metric-hero');
  const input = qs('#input-salary');
  if (!sticky || !result || !input) return;

  let resultVisible = false;
  const refresh = () => {
    syncMainToVisualViewport();
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
  window.visualViewport?.addEventListener('scroll', refresh, { passive: true });

  const payrollBody = qs('#payroll-body');
  if (payrollBody) new MutationObserver(refresh).observe(payrollBody, { childList: true, subtree: true, characterData: true });

  sticky.setAttribute('aria-hidden', 'true');
  refresh();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupMobileStickyUx, { once: true });
else setupMobileStickyUx();
