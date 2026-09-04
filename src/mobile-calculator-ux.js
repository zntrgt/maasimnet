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

function setupMobileStickyUx() {
  const sticky = qs('.enterprise-mobile-sticky');
  const result = qs('.metric-hero');
  const input = qs('#input-salary');
  if (!sticky || !result || !input) return;

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
  window.visualViewport?.addEventListener('resize', refresh, { passive: true });

  const payrollBody = qs('#payroll-body');
  if (payrollBody) new MutationObserver(refresh).observe(payrollBody, { childList: true, subtree: true, characterData: true });

  sticky.setAttribute('aria-hidden', 'true');
  refresh();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupMobileStickyUx, { once: true });
else setupMobileStickyUx();
