const ENTERPRISE_UI_VERSION = 'v2';

function qs(selector, root = document) {
  return root.querySelector(selector);
}

function qsa(selector, root = document) {
  return [...root.querySelectorAll(selector)];
}

function text(selector) {
  return qs(selector)?.textContent?.trim() || '—';
}

function createElement(tag, className, html = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html) node.innerHTML = html;
  return node;
}

function addFormSectionHeading(target, eyebrow, title, description) {
  if (!target || target.previousElementSibling?.classList?.contains('enterprise-form-heading')) return;
  const heading = createElement('div', 'enterprise-form-heading', `
    <span>${eyebrow}</span>
    <strong>${title}</strong>
    ${description ? `<small>${description}</small>` : ''}
  `);
  target.parentNode.insertBefore(heading, target);
}

function enhanceFormStructure() {
  const calculator = qs('#hesaplayici');
  if (!calculator || calculator.dataset.enterpriseStructure === ENTERPRISE_UI_VERSION) return;
  calculator.dataset.enterpriseStructure = ENTERPRISE_UI_VERSION;

  const formColumn = calculator.firstElementChild;
  const formCard = formColumn?.firstElementChild;
  if (!formCard) return;
  formColumn.classList.add('enterprise-form-column');
  formCard.classList.add('enterprise-form-card');

  const modeToggle = qs('#btn-mode-gross')?.parentElement;
  if (modeToggle) {
    modeToggle.classList.add('enterprise-mode-toggle');
    addFormSectionHeading(modeToggle, '01', 'Temel Bilgiler', 'Maaş yönünü ve aylık tutarı belirleyin.');
  }

  const salaryInput = qs('#input-salary');
  if (salaryInput && !salaryInput.closest('.enterprise-money-input')) {
    const wrapper = createElement('div', 'enterprise-money-input');
    salaryInput.parentNode.insertBefore(wrapper, salaryInput);
    wrapper.appendChild(salaryInput);
    const clear = createElement('button', 'enterprise-input-clear', '<span aria-hidden="true">×</span>');
    clear.type = 'button';
    clear.setAttribute('aria-label', 'Maaş tutarını temizle');
    clear.title = 'Temizle';
    clear.addEventListener('click', () => {
      salaryInput.value = '';
      salaryInput.dataset.rawValue = '';
      salaryInput.dispatchEvent(new Event('input', { bubbles: true }));
      salaryInput.focus();
    });
    wrapper.appendChild(clear);
  }

  const retired = qs('#check-retired');
  const exceptionBlock = retired?.closest('.pt-6');
  if (exceptionBlock) {
    exceptionBlock.classList.add('enterprise-exceptions');
    addFormSectionHeading(exceptionBlock, '02', 'İstisnalar & Muafiyetler', 'Yalnız size uyan seçenekleri açın.');
  }

  const employer = qs('details.employer-options');
  if (employer) {
    employer.classList.add('enterprise-advanced');
    const summary = employer.querySelector('summary');
    if (summary) summary.innerHTML = '<span>İleri Seviye Ayarlar</span><small>İşveren maliyeti ve SGK teşviki</small><b aria-hidden="true">+</b>';
  }

  const primaryButton = qs('.cta-button--calculate', formCard);
  if (primaryButton) primaryButton.textContent = 'Hesabı Detaylandır';

  const csvButton = qs('#download-csv-button', formCard);
  if (csvButton) {
    csvButton.classList.add('enterprise-csv-action');
    csvButton.textContent = 'Detaylı Bordro CSV';
  }
}

function buildResultActions() {
  const hero = qs('.metric-hero');
  if (!hero || qs('.enterprise-result-actions', hero)) return;
  const actions = createElement('div', 'enterprise-result-actions');
  actions.innerHTML = `
    <button type="button" data-enterprise-action="copy"><span aria-hidden="true">⧉</span>Kopyala</button>
    <button type="button" data-enterprise-action="print"><span aria-hidden="true">⇩</span>PDF / Yazdır</button>
    <button type="button" data-enterprise-action="email"><span aria-hidden="true">↗</span>E-posta</button>
  `;
  hero.appendChild(actions);
  actions.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-enterprise-action]');
    if (!button) return;
    const action = button.dataset.enterpriseAction;
    if (action === 'copy') await copySummary();
    if (action === 'print') printSummary();
    if (action === 'email') emailSummary();
  });
}

function buildTaxVisual() {
  const hero = qs('.metric-hero');
  if (!hero || qs('.enterprise-tax-visual', hero)) return;
  const visual = createElement('section', 'enterprise-tax-visual');
  visual.setAttribute('aria-label', '12 aylık net maaş ve vergi dilimi geçişi');
  visual.innerHTML = `
    <div class="enterprise-tax-visual__head">
      <div><span>12 aylık görünüm</span><strong>Net maaş & vergi dilimi geçişi</strong></div>
      <span class="enterprise-tax-summary" data-enterprise-tax-summary>Vergi dilimleri hesaplanıyor…</span>
    </div>
    <div class="enterprise-tax-bars" data-enterprise-tax-bars aria-hidden="true"></div>
    <p class="enterprise-tax-a11y" data-enterprise-tax-a11y></p>
  `;
  const context = qs('#stat-avg-net-context', hero);
  if (context) context.insertAdjacentElement('afterend', visual);
  else hero.appendChild(visual);
}

function buildMobileSticky() {
  if (qs('.enterprise-mobile-sticky')) return;
  const sticky = createElement('div', 'enterprise-mobile-sticky');
  sticky.innerHTML = `
    <div><span>Aylık ort. net</span><strong data-enterprise-sticky-net>—</strong></div>
    <button type="button" data-enterprise-scroll-result>Sonuç</button>
  `;
  qs('body')?.appendChild(sticky);
  qs('[data-enterprise-scroll-result]', sticky)?.addEventListener('click', () => {
    qs('.metric-hero')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
  });
}

function parseCurrency(value) {
  const normalized = String(value || '')
    .replace(/[^0-9,.-]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function readPayrollRows() {
  return qsa('#payroll-body > tr').map((row) => {
    const cells = [...row.children].filter((cell) => cell.tagName === 'TD');
    if (cells.length < 8) return null;
    const month = cells[0]?.textContent?.trim();
    const netText = cells[4]?.textContent?.trim() || '';
    const bracket = qs('.tax-bracket-badge', row)?.textContent?.trim() || cells.find((cell) => /%\s*(15|20|27|35|40)/.test(cell.textContent || ''))?.textContent?.trim() || '';
    if (!month || !netText) return null;
    return { month, netText, net: parseCurrency(netText), bracket };
  }).filter(Boolean).slice(0, 12);
}

function updateTaxVisual() {
  const container = qs('[data-enterprise-tax-bars]');
  if (!container) return;
  const rows = readPayrollRows();
  if (!rows.length) return;
  const max = Math.max(...rows.map((row) => row.net), 1);
  container.innerHTML = rows.map((row) => {
    const height = Math.max(22, Math.round((row.net / max) * 100));
    const monthShort = row.month.slice(0, 3);
    return `<div class="enterprise-tax-bar" title="${row.month}: ${row.netText}${row.bracket ? ` · ${row.bracket}` : ''}">
      <span class="enterprise-tax-bar__rate">${row.bracket || '—'}</span>
      <i style="--bar:${height}%"></i>
      <small>${monthShort}</small>
    </div>`;
  }).join('');

  const uniqueRates = [...new Set(rows.map((row) => row.bracket).filter(Boolean))];
  const summary = uniqueRates.length ? `Yıl içinde ${uniqueRates.join(' → ')}` : 'Vergi dilimi aylara göre değişebilir';
  const summaryNode = qs('[data-enterprise-tax-summary]');
  if (summaryNode) summaryNode.textContent = summary;
  const a11y = qs('[data-enterprise-tax-a11y]');
  if (a11y) a11y.textContent = rows.map((row) => `${row.month}: ${row.netText}${row.bracket ? `, ${row.bracket}` : ''}`).join('. ');
}

function updateStickySummary() {
  const stickyNet = qs('[data-enterprise-sticky-net]');
  if (stickyNet) stickyNet.textContent = text('#stat-avg-net');
}

function summaryText() {
  return [
    'Maaşım.net 2026 maaş hesaplama özeti',
    `Aylık ortalama net: ${text('#stat-avg-net')}`,
    `Ortalama brüt: ${text('#stat-avg-gross')}`,
    `Yıllık toplam net: ${text('#stat-total-net')}`,
    `Efektif kesinti oranı: ${text('#stat-tax-rate')}`,
    `Aylık ortalama işveren maliyeti: ${text('#stat-avg-cost')}`,
    '',
    'Hesaplama: https://maasim.net/',
    'Bilgilendirme amaçlıdır; resmî bordro değildir.'
  ].join('\n');
}

function showToast(message) {
  let toast = qs('.enterprise-toast');
  if (!toast) {
    toast = createElement('div', 'enterprise-toast');
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('is-visible');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove('is-visible'), 2200);
}

async function copySummary() {
  const value = summaryText();
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const area = document.createElement('textarea');
    area.value = value;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    area.remove();
  }
  showToast('Özet kopyalandı');
}

function printSummary() {
  document.body.classList.add('enterprise-print-mode');
  const cleanup = () => document.body.classList.remove('enterprise-print-mode');
  window.addEventListener('afterprint', cleanup, { once: true });
  window.print();
  window.setTimeout(cleanup, 1500);
}

function emailSummary() {
  const subject = encodeURIComponent('Maaşım.net 2026 maaş hesaplama özeti');
  const body = encodeURIComponent(summaryText());
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
}

function installResultObserver() {
  const body = qs('#payroll-body');
  if (!body) return;
  const update = () => {
    updateTaxVisual();
    updateStickySummary();
  };
  const observer = new MutationObserver(update);
  observer.observe(body, { childList: true, subtree: true, characterData: true });
  update();
}

function initializeEnterpriseUi() {
  const body = document.body;
  if (!body || body.dataset.fintechUi !== ENTERPRISE_UI_VERSION) return;
  enhanceFormStructure();
  buildResultActions();
  buildTaxVisual();
  buildMobileSticky();
  installResultObserver();
  updateTaxVisual();
  updateStickySummary();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeEnterpriseUi, { once: true });
} else {
  initializeEnterpriseUi();
}
