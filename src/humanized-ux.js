const HUMANIZED_UX_VERSION = 'v1';
const MOBILE_QUERY = '(max-width: 700px)';

function qs(selector, root = document) {
  return root.querySelector(selector);
}

function qsa(selector, root = document) {
  return [...root.querySelectorAll(selector)];
}

function createElement(tag, className, html = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html) node.innerHTML = html;
  return node;
}

function parseCurrency(value) {
  const normalized = String(value || '')
    .replace(/[^0-9,.-]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatTry(value) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0
  }).format(Math.max(0, value));
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function smoothScrollTo(node, block = 'center') {
  node?.scrollIntoView({
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    block
  });
}

function currentSalaryValue() {
  const input = qs('#input-salary');
  if (!input) return 0;
  return Number(input.dataset.rawValue || 0) || parseCurrency(input.value);
}

function hasUsableHomeResult() {
  const inputValue = currentSalaryValue();
  const netValue = parseCurrency(qs('#stat-avg-net')?.textContent);
  return inputValue > 0 && netValue > 0;
}

function isGrossMode() {
  return qs('#btn-mode-gross')?.getAttribute('aria-pressed') !== 'false';
}

function salaryModeCopy() {
  return isGrossMode()
    ? {
        label: 'Brüt maaşın',
        aria: 'Aylık brüt maaşın',
        placeholder: 'Örn. 100.000 ₺',
        cta: 'Net maaşımı gör'
      }
    : {
        label: 'Net maaşın',
        aria: 'Hedef aylık net maaşın',
        placeholder: 'Örn. 75.000 ₺',
        cta: 'Gerekli brütü gör'
      };
}

function humanizeHomeHero() {
  const hero = qs('.enterprise-hero');
  if (!hero) return;

  const eyebrow = qs('.enterprise-hero__eyebrow', hero);
  const heading = qs('h1', hero);
  const lead = qs('.enterprise-hero__lead', hero);
  const meta = qs('.enterprise-hero__meta', hero);

  if (eyebrow) eyebrow.textContent = '2026 mevzuatına göre güncel ✓';
  if (heading) heading.textContent = 'Maaşını hesapla';
  if (lead) lead.textContent = 'Brütünü nete, netini brüte çevir. Verginin yıl içinde maaşını nasıl değiştirdiğini de gör.';
  if (meta) {
    meta.innerHTML = '<span>12 aylık bordro</span><span>Vergi dilimleri</span><span>İşveren maliyeti</span>';
  }

  const trustItems = qsa('.enterprise-trust-item');
  if (trustItems.length) {
    const first = trustItems[0];
    const title = qs('strong', first);
    const description = qs('span:not(.enterprise-trust-item__icon)', first);
    if (title) title.textContent = '2026 mevzuatı kontrol edildi';
    if (description) description.textContent = 'SGK, GİB ve ÇSGB kaynaklarıyla güncel parametreler.';
    trustItems.slice(1).forEach((item) => item.setAttribute('hidden', ''));
  }
}

function setFormHeadingCopy() {
  const headings = qsa('.enterprise-form-heading');
  if (headings[0]) {
    const title = qs('strong', headings[0]);
    const description = qs('small', headings[0]);
    if (title) title.textContent = 'Maaşını gir';
    if (description) description.textContent = 'Brütten nete veya netten brüte tek dokunuşla geçebilirsin.';
  }
  if (headings[1]) {
    const title = qs('strong', headings[1]);
    const description = qs('small', headings[1]);
    if (title) title.textContent = 'Çalışma durumun';
    if (description) description.textContent = 'Yalnız sana uyan seçeneği değiştir.';
  }

  const advanced = qs('details.enterprise-advanced');
  const advancedSummary = advanced ? qs('summary', advanced) : null;
  if (advancedSummary) {
    advancedSummary.innerHTML = '<span>Diğer bordro ayarları</span><small>Çoğu kullanıcı bu alanları değiştirmeden hesaplama yapabilir.</small><b aria-hidden="true">+</b>';
  }
}

function setSalaryModeCopy() {
  const copy = salaryModeCopy();
  const label = qs('#salary-input-label');
  const input = qs('#input-salary');
  const primary = qs('.cta-button--calculate');
  const stickyButton = qs('[data-human-home-cta]');

  if (label) label.textContent = copy.label;
  if (input) {
    input.setAttribute('aria-label', copy.aria);
    input.setAttribute('placeholder', copy.placeholder);
    input.title = isGrossMode()
      ? 'Aylık brüt maaşını yaz.'
      : 'Her ay eline geçmesini hedeflediğin net maaşı yaz.';
  }
  if (primary) primary.textContent = copy.cta;
  if (stickyButton) stickyButton.textContent = copy.cta;
}

function ensureSalaryFeedback() {
  const input = qs('#input-salary');
  const wrapper = input?.closest('.enterprise-money-input');
  if (!input || !wrapper || qs('#human-salary-feedback')) return;

  const feedback = createElement('p', 'human-field-feedback');
  feedback.id = 'human-salary-feedback';
  feedback.setAttribute('aria-live', 'polite');
  wrapper.insertAdjacentElement('afterend', feedback);

  const describedBy = new Set((input.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
  describedBy.add(feedback.id);
  input.setAttribute('aria-describedby', [...describedBy].join(' '));
}

function clearSalaryError() {
  const input = qs('#input-salary');
  const feedback = qs('#human-salary-feedback');
  input?.classList.remove('human-input-error');
  input?.removeAttribute('aria-invalid');
  if (feedback) feedback.textContent = '';
}

function validateSalary({ focus = true } = {}) {
  const input = qs('#input-salary');
  const feedback = qs('#human-salary-feedback');
  if (!input) return false;

  if (currentSalaryValue() > 0) {
    clearSalaryError();
    return true;
  }

  input.classList.add('human-input-error');
  input.setAttribute('aria-invalid', 'true');
  if (feedback) feedback.textContent = 'Maaşını yazmadan hesaplayamam.';
  if (focus) input.focus({ preventScroll: true });
  return false;
}

function ensureQuickAmounts() {
  const input = qs('#input-salary');
  const wrapper = input?.closest('.enterprise-money-input');
  if (!input || !wrapper || qs('.human-quick-amounts')) return;

  const quick = createElement('div', 'human-quick-amounts');
  quick.setAttribute('aria-label', 'Hızlı maaş tutarları');
  quick.innerHTML = [
    [50000, '50 bin'],
    [75000, '75 bin'],
    [100000, '100 bin'],
    [150000, '150 bin']
  ].map(([value, label]) => `<button type="button" data-human-amount="${value}">${label}</button>`).join('');

  const feedback = qs('#human-salary-feedback');
  (feedback || wrapper).insertAdjacentElement('afterend', quick);

  quick.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-human-amount]');
    if (!button) return;
    const value = Number(button.dataset.humanAmount || 0);
    input.value = String(value);
    input.dataset.rawValue = String(value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    clearSalaryError();
    refreshHomeState();
  });
}

function ensureEmptyState() {
  const hero = qs('.metric-hero');
  if (!hero || qs('.human-empty-state', hero)) return;

  const empty = createElement('div', 'human-empty-state', `
    <span class="human-empty-state__eyebrow">12 aylık maaş görünümün</span>
    <h2>Henüz hesap yapmadın</h2>
    <p>Maaşını gir, 12 aylık netini birlikte görelim.</p>
    <div class="human-empty-state__preview">Ocak → Aralık · Vergi dilimleri · Kesintiler · İşveren maliyeti</div>
  `);
  hero.appendChild(empty);
}

function readPayrollRows() {
  return qsa('#payroll-body > tr').map((row) => {
    const cells = [...row.children].filter((cell) => cell.tagName === 'TD');
    if (cells.length < 8) return null;
    const month = cells[0]?.textContent?.trim();
    const netText = cells[4]?.textContent?.trim() || '';
    const badgeText = qs('.tax-bracket-badge', row)?.textContent?.trim() || '';
    const rateMatch = badgeText.match(/(15|20|27|35|40)/);
    if (!month || !netText) return null;
    return {
      month,
      net: parseCurrency(netText),
      netText,
      rate: rateMatch ? Number(rateMatch[1]) : null
    };
  }).filter(Boolean).slice(0, 12);
}

function ensureTaxInsight() {
  const hero = qs('.metric-hero');
  if (!hero || qs('.human-tax-insight')) return;

  const insight = createElement('article', 'human-tax-insight');
  insight.hidden = true;
  insight.innerHTML = `
    <div>
      <span class="human-tax-insight__eyebrow">Vergi dilimi</span>
      <h3 data-human-tax-title>Vergi dilimin hesaplanıyor</h3>
      <p data-human-tax-copy></p>
    </div>
    <strong data-human-tax-rate></strong>
  `;
  hero.insertAdjacentElement('afterend', insight);
}

function updateTaxInsight() {
  const insight = qs('.human-tax-insight');
  if (!insight || !hasUsableHomeResult()) {
    if (insight) insight.hidden = true;
    return;
  }

  const rows = readPayrollRows();
  const transitionIndex = rows.findIndex((row, index) => index > 0 && row.rate && rows[index - 1]?.rate && row.rate !== rows[index - 1].rate);
  if (transitionIndex < 1) {
    insight.hidden = true;
    return;
  }

  const previous = rows[transitionIndex - 1];
  const current = rows[transitionIndex];
  const difference = Math.max(0, previous.net - current.net);
  const title = qs('[data-human-tax-title]', insight);
  const copy = qs('[data-human-tax-copy]', insight);
  const rate = qs('[data-human-tax-rate]', insight);

  if (title) title.textContent = `${current.month} ayında vergi dilimin değişiyor`;
  if (rate) rate.textContent = `%${previous.rate} → %${current.rate}`;
  if (copy) {
    copy.textContent = difference > 0
      ? `Net maaşın bir önceki aya göre yaklaşık ${formatTry(difference)} daha düşük.`
      : 'Vergi oranındaki değişimin aylık netine etkisini 12 aylık görünümde görebilirsin.';
  }
  insight.hidden = false;
}

function humanizeSalaryJourney() {
  const visual = qs('.enterprise-tax-visual');
  if (!visual) return;
  const eyebrow = qs('.enterprise-tax-visual__head > div > span', visual);
  const title = qs('.enterprise-tax-visual__head strong', visual);
  if (eyebrow) eyebrow.textContent = 'Ocak → Aralık';
  if (title) title.textContent = 'Maaşının yıl içindeki yolculuğu';
}

function setResultCopy() {
  const hero = qs('.metric-hero');
  if (!hero) return;
  const metricTitle = qs('.metric-title', hero);
  if (metricTitle) metricTitle.textContent = 'Aylık ortalama net maaşın';

  const context = qs('#stat-avg-net-context', hero);
  const annualNet = qs('#stat-total-net')?.textContent?.trim();
  if (context && hasUsableHomeResult() && annualNet) {
    context.textContent = `12 aylık ortalama · Yıllık toplam netin ${annualNet}`;
  }

  const secondary = qs('.secondary-metrics');
  if (secondary && !secondary.dataset.humanDefaultApplied) {
    secondary.dataset.humanDefaultApplied = 'true';
    if (window.matchMedia(MOBILE_QUERY).matches) secondary.removeAttribute('open');
  }
}

function updateExportState() {
  const enabled = hasUsableHomeResult();
  qsa('.enterprise-result-actions button').forEach((button) => {
    button.disabled = !enabled;
    button.setAttribute('aria-disabled', String(!enabled));
    button.title = enabled ? '' : 'Önce bir hesaplama yap.';
  });

  const csv = qs('#download-csv-button');
  if (csv) {
    csv.disabled = !enabled;
    csv.setAttribute('aria-disabled', String(!enabled));
    csv.title = enabled ? '' : 'Önce bir hesaplama yap.';
    csv.textContent = 'CSV indir';
  }
}

function configurePrimaryAction() {
  const primary = qs('.cta-button--calculate');
  if (!primary || primary.dataset.humanAction === HUMANIZED_UX_VERSION) return;
  primary.dataset.humanAction = HUMANIZED_UX_VERSION;
  primary.removeAttribute('onclick');
  primary.addEventListener('click', () => {
    if (!validateSalary()) return;
    if (typeof window.calculate === 'function') window.calculate();
    window.requestAnimationFrame(() => smoothScrollTo(qs('.metric-hero'), 'center'));
  });
}

function ensureMobileCta({ termination = false, label = '' } = {}) {
  const selector = termination ? '[data-human-termination-sticky]' : '[data-human-home-sticky]';
  if (qs(selector)) return qs(selector);

  const sticky = createElement('div', termination ? 'human-mobile-cta human-mobile-cta--termination' : 'human-mobile-cta');
  sticky.setAttribute(termination ? 'data-human-termination-sticky' : 'data-human-home-sticky', '');
  sticky.innerHTML = `<button type="button" ${termination ? 'data-human-termination-cta' : 'data-human-home-cta'}>${label}</button>`;
  document.body.appendChild(sticky);

  const updateKeyboardOffset = () => {
    const viewport = window.visualViewport;
    if (!viewport) {
      sticky.style.setProperty('--keyboard-offset', '0px');
      return;
    }
    const offset = Math.max(0, Math.round(window.innerHeight - viewport.height - viewport.offsetTop));
    sticky.style.setProperty('--keyboard-offset', `${offset}px`);
  };
  updateKeyboardOffset();
  window.visualViewport?.addEventListener('resize', updateKeyboardOffset, { passive: true });
  window.visualViewport?.addEventListener('scroll', updateKeyboardOffset, { passive: true });
  window.addEventListener('orientationchange', () => window.setTimeout(updateKeyboardOffset, 120), { passive: true });
  return sticky;
}

function setupHomeMobileCta() {
  const sticky = ensureMobileCta({ label: salaryModeCopy().cta });
  const button = qs('[data-human-home-cta]', sticky);
  if (!button || button.dataset.bound === 'true') return;
  button.dataset.bound = 'true';
  button.addEventListener('click', () => qs('.cta-button--calculate')?.click());
}

function refreshHomeState() {
  if (!qs('#hesaplayici')) return;
  const valid = hasUsableHomeResult();
  const hero = qs('.metric-hero');
  hero?.classList.toggle('is-human-empty', !valid);
  hero?.classList.toggle('has-human-result', valid);
  document.body.classList.toggle('human-has-result', valid);
  setSalaryModeCopy();
  setResultCopy();
  updateExportState();
  updateTaxInsight();
}

function initializeHomeUx() {
  if (!qs('#hesaplayici')) return;
  humanizeHomeHero();
  setFormHeadingCopy();
  ensureSalaryFeedback();
  ensureQuickAmounts();
  ensureEmptyState();
  ensureTaxInsight();
  humanizeSalaryJourney();
  configurePrimaryAction();
  setupHomeMobileCta();
  setSalaryModeCopy();

  const input = qs('#input-salary');
  input?.addEventListener('input', () => {
    if (currentSalaryValue() > 0) clearSalaryError();
    refreshHomeState();
  });

  ['#btn-mode-gross', '#btn-mode-net'].forEach((selector) => {
    qs(selector)?.addEventListener('click', () => window.setTimeout(() => {
      setSalaryModeCopy();
      refreshHomeState();
    }, 0));
  });

  const payrollBody = qs('#payroll-body');
  if (payrollBody) {
    new MutationObserver(() => {
      humanizeSalaryJourney();
      refreshHomeState();
    }).observe(payrollBody, { childList: true, subtree: true, characterData: true });
  }

  refreshHomeState();
}

function terminationCopy(type) {
  if (type === 'severance') {
    return {
      h1: 'Kıdem tazminatını hesapla',
      lead: 'İşe giriş ve ayrılış tarihini, son brüt maaşını yaz. Kıdem tazminatını güncel 2026 tavanıyla görelim.',
      cta: 'Kıdemimi hesapla'
    };
  }
  if (type === 'notice') {
    return {
      h1: 'İhbar tazminatını hesapla',
      lead: 'Çalışma tarihlerini ve son brüt maaşını yaz. İhbar süreni ve tahmini net tazminatını birlikte görelim.',
      cta: 'İhbarımı hesapla'
    };
  }
  return {
    h1: 'Tazminatını hesapla',
    lead: 'İşe giriş ve ayrılış tarihini, son brüt maaşını yaz. Kıdem ve ihbar tutarını birlikte görelim.',
    cta: 'Toplam tazminatımı gör'
  };
}

function replaceLabelText(form, name, value) {
  const input = form.elements.namedItem(name);
  const label = input ? qs(`label[for="${input.id}"]`, form) : null;
  if (!label) return;
  const small = qs('small', label);
  label.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) node.textContent = '';
  });
  label.insertBefore(document.createTextNode(value), label.firstChild);
  if (small) label.insertBefore(document.createTextNode(' '), small);
}

function movePrimaryTerminationResults(root) {
  qsa('.termination-result-grid', root).forEach((grid) => {
    const primary = qs('.termination-result--primary', grid);
    if (primary && grid.firstElementChild !== primary) grid.prepend(primary);
  });
}

function humanizeTerminationError(errorNode) {
  if (!errorNode || errorNode.hidden) return;
  const map = new Map([
    ['İşe giriş ve işten ayrılma tarihlerini girin.', 'İşe giriş ve ayrılış tarihlerini yazmadan hesaplayamam.'],
    ['Aylık brüt ücreti girin.', 'Son brüt maaşını yazmadan hesaplayamam.'],
    ['Tutar alanlarına sıfır veya pozitif bir sayı girin.', 'Tutar alanlarına geçerli bir sayı yaz.'],
    ['Hesaplama sırasında bir hata oluştu.', 'Hesaplama sırasında bir şey ters gitti. Bilgilerin duruyor, tekrar deneyebilirsin.']
  ]);
  const replacement = map.get(errorNode.textContent.trim());
  if (replacement) errorNode.textContent = replacement;
}

function initializeTerminationUx() {
  const root = qs('[data-termination-calculator]');
  if (!root || !document.body.classList.contains('termination-page')) return;

  const type = root.getAttribute('data-termination-calculator') || 'combined';
  const copy = terminationCopy(type);
  const hero = qs('.termination-hero');
  const heading = hero ? qs('h1', hero) : null;
  const lead = hero ? qs(':scope > p', hero) : null;
  const eyebrow = hero ? qs('.termination-eyebrow', hero) : null;
  if (heading) heading.textContent = copy.h1;
  if (lead) lead.textContent = copy.lead;
  if (eyebrow) eyebrow.textContent = '2026 mevzuatına göre güncel ✓';

  const form = qs('form', root);
  if (!form) return;
  const formLead = qs(':scope > p', form);
  if (formLead) formLead.textContent = 'Temel bilgileri gir. Yan hakların veya bordro detayların varsa sonradan ekleyebilirsin.';
  replaceLabelText(form, 'startDate', 'İşe giriş tarihin');
  replaceLabelText(form, 'endDate', 'İşten ayrılış tarihin');
  replaceLabelText(form, 'baseGross', 'Son brüt maaşın');

  const options = qsa('details.termination-options', form);
  if (options[0]) {
    options[0].removeAttribute('open');
    const summary = qs('summary', options[0]);
    if (summary) summary.innerHTML = '<span>Düzenli yan hakların var mı?</span><small>Yemek, yol veya düzenli primin varsa ekle.</small>';
  }
  const advanced = qs('details.termination-options--advanced', form);
  if (advanced) {
    advanced.removeAttribute('open');
    const summary = qs('summary', advanced);
    if (summary) summary.innerHTML = '<span>Gelişmiş bordro bilgileri</span><small>Çoğu kullanıcı bu alanları boş bırakabilir.</small>';
  }

  const submit = qs('.termination-submit', form);
  if (submit) submit.textContent = copy.cta;
  movePrimaryTerminationResults(root);

  const error = qs('[data-calculator-error]', root);
  if (error) {
    new MutationObserver(() => humanizeTerminationError(error)).observe(error, {
      childList: true,
      characterData: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['hidden']
    });
  }

  const sticky = ensureMobileCta({ termination: true, label: copy.cta });
  const stickyButton = qs('[data-human-termination-cta]', sticky);
  stickyButton?.addEventListener('click', () => form.requestSubmit());

  form.addEventListener('submit', () => {
    window.setTimeout(() => {
      humanizeTerminationError(error);
      const results = qs('[data-calculator-results]', root);
      if (results && !results.hidden) {
        movePrimaryTerminationResults(root);
        const primary = qs('.termination-result--primary', results) || results;
        if (window.matchMedia(MOBILE_QUERY).matches) smoothScrollTo(primary, 'center');
      }
    }, 0);
  });
}

function initializeHumanizedUx() {
  const body = document.body;
  if (!body || body.dataset.humanizedUx !== HUMANIZED_UX_VERSION) return;
  initializeHomeUx();
  initializeTerminationUx();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeHumanizedUx, { once: true });
} else {
  initializeHumanizedUx();
}
