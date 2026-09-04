import {
  calculateNotice,
  calculateSeverance,
  calculateTerminationPackage
} from './termination-engine.js';

const moneyFormatter = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const VALID_CALCULATOR_TYPES = new Set(['combined', 'severance', 'notice']);

function parseMoneyToKurus(value) {
  const raw = String(value || '').trim();
  if (!raw) return 0;
  const normalized = raw
    .replace(/\s/g, '')
    .replace(/₺|TL/gi, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const number = Number(normalized);
  if (!Number.isFinite(number) || number < 0) throw new Error('Tutar alanlarına sıfır veya pozitif bir sayı girin.');
  return Math.round(number * 100);
}

function formatMoney(kurus) {
  return moneyFormatter.format(kurus / 100);
}

function formatRates(rates = []) {
  return rates.map((rate) => `%${(rate / 10_000).toLocaleString('tr-TR', { maximumFractionDigits: 2 })}`).join(' → ') || '—';
}

function inputValue(form, name) {
  return form.elements.namedItem(name)?.value || '';
}

function readInput(form) {
  return {
    startIso: inputValue(form, 'startDate'),
    endIso: inputValue(form, 'endDate'),
    baseGrossKurus: parseMoneyToKurus(inputValue(form, 'baseGross')),
    mealKurus: parseMoneyToKurus(inputValue(form, 'meal')),
    transportKurus: parseMoneyToKurus(inputValue(form, 'transport')),
    regularOtherKurus: parseMoneyToKurus(inputValue(form, 'regularOther')),
    annualRegularBenefitsKurus: parseMoneyToKurus(inputValue(form, 'annualRegularBenefits')),
    previousCumulativeTaxBaseKurus: parseMoneyToKurus(inputValue(form, 'previousTaxBase')),
    remainingIncomeTaxExemptionKurus: parseMoneyToKurus(inputValue(form, 'remainingIncomeTaxExemption')),
    remainingStampTaxExemptionKurus: parseMoneyToKurus(inputValue(form, 'remainingStampTaxExemption'))
  };
}

function durationText(duration) {
  return `${duration.years} yıl ${duration.months} ay ${duration.days} gün`;
}

function setText(root, selector, value) {
  const node = root.querySelector(selector);
  if (node) node.textContent = value;
}

function severanceFormula(result) {
  return `${formatMoney(result.basisKurus)} × (${result.duration.years} yıl + ${result.duration.months}/12 + ${result.duration.days}/365) = ${formatMoney(result.grossKurus)}`;
}

function dressedGrossFormula(result) {
  return [
    formatMoney(result.baseGrossKurus),
    formatMoney(result.mealKurus),
    formatMoney(result.transportKurus),
    formatMoney(result.regularOtherKurus),
    formatMoney(result.annualRegularBenefitsMonthlyKurus)
  ].join(' + ') + ` = ${formatMoney(result.dressedGrossKurus)}`;
}

function renderSeverance(root, result, stampExemptionProvided = false) {
  setText(root, '[data-result="duration"]', durationText(result.duration));
  setText(root, '[data-result="dressed-gross"]', formatMoney(result.dressedGrossKurus));
  setText(root, '[data-result="annual-benefits-monthly"]', formatMoney(result.annualRegularBenefitsMonthlyKurus));
  setText(root, '[data-result="severance-ceiling"]', formatMoney(result.ceilingKurus));
  setText(root, '[data-result="severance-basis"]', formatMoney(result.basisKurus));
  setText(root, '[data-result="severance-gross"]', formatMoney(result.grossKurus));
  setText(root, '[data-result="severance-stamp-exemption"]', formatMoney(result.stampTaxExemptionAppliedKurus));
  setText(root, '[data-result="severance-stamp"]', formatMoney(result.stampTaxKurus));
  setText(root, '[data-result="severance-net"]', formatMoney(result.netKurus));
  setText(root, '[data-result="severance-formula"]', severanceFormula(result));
  setText(root, '[data-result="dressed-gross-formula"]', dressedGrossFormula(result));

  const warning = root.querySelector('[data-severance-warning]');
  if (warning) {
    const messages = [];
    if (!result.eligibleByDuration) {
      messages.push('Bu hizmet süresi 1 yıldan kısa. 1475 sayılı Kanun kapsamındaki genel kıdem tazminatı koşulunda en az 1 yıl çalışma aranır.');
    }
    if (result.ceilingApplied) {
      messages.push('Giydirilmiş brüt ücret fesih tarihinde geçerli kıdem tazminatı tavanını aştığı için hesap tavandan yapıldı.');
    }
    if (result.stampTaxExemptionAppliedKurus > 0) {
      messages.push(`${formatMoney(result.stampTaxExemptionAppliedKurus)} kullanılmamış damga vergisi istisnası kıdem tazminatına uygulandı.`);
    } else if (!stampExemptionProvided) {
      messages.push('Damga vergisi hesabı, fesih ayındaki asgari ücret damga vergisi istisnasının normal ücret bordrosunda tamamen kullanıldığı varsayımıyla yapılır. Bordronuzda kullanılmamış istisna varsa gelişmiş alana girebilirsiniz.');
    }
    warning.hidden = messages.length === 0;
    warning.textContent = messages.join(' ');
  }
}

function renderNotice(root, result, { taxBaseProvided = false, incomeExemptionProvided = false, stampExemptionProvided = false } = {}) {
  setText(root, '[data-result="duration"]', durationText(result.duration));
  setText(root, '[data-result="dressed-gross"]', formatMoney(result.dressedGrossKurus));
  setText(root, '[data-result="annual-benefits-monthly"]', formatMoney(result.annualRegularBenefitsMonthlyKurus));
  setText(root, '[data-result="notice-period"]', `${result.noticePeriod.weeks} hafta (${result.noticePeriod.days} gün)`);
  setText(root, '[data-result="notice-gross"]', formatMoney(result.grossKurus));
  setText(root, '[data-result="notice-rates"]', formatRates(result.incomeTaxRatesPpm));
  setText(root, '[data-result="notice-income-tax-exemption"]', formatMoney(result.incomeTaxExemptionAppliedKurus));
  setText(root, '[data-result="notice-income-tax"]', formatMoney(result.incomeTaxKurus));
  setText(root, '[data-result="notice-stamp-exemption"]', formatMoney(result.stampTaxExemptionAppliedKurus));
  setText(root, '[data-result="notice-stamp"]', formatMoney(result.stampTaxKurus));
  setText(root, '[data-result="notice-net"]', formatMoney(result.netKurus));

  const warning = root.querySelector('[data-notice-warning]');
  if (warning) {
    const messages = [];
    messages.push(taxBaseProvided
      ? 'Net ihbar tahmini, girdiğiniz ödeme öncesi kümülatif gelir vergisi matrahına göre hesaplandı.'
      : 'Kümülatif vergi matrahı girilmediği için gelir vergisi 0 TL önceki matrahtan başlatıldı; gerçek bordro matrahı sonucu değiştirebilir.');

    if (result.incomeTaxExemptionAppliedKurus > 0 || result.stampTaxExemptionAppliedKurus > 0) {
      messages.push('Girdiğiniz kullanılmamış aylık asgari ücret vergi istisnaları, 2026 için geçerli aylık üst sınırlarla kısıtlanarak hesaba dahil edildi.');
    } else if (!incomeExemptionProvided && !stampExemptionProvided) {
      messages.push('Vergi hesabı, fesih ayındaki asgari ücret gelir ve damga vergisi istisnalarının normal ücret bordrosunda tamamen kullanıldığı varsayımıyla yapılır. Kısmi ay veya o ay düşük/hiç ücret ödenmemesi halinde bordroda kalan istisna net ihbarı artırabilir.');
    }

    warning.hidden = false;
    warning.textContent = messages.join(' ');
  }
}

function clearError(root) {
  const error = root.querySelector('[data-calculator-error]');
  if (error) {
    error.hidden = true;
    error.textContent = '';
  }
}

function showError(root, message) {
  const error = root.querySelector('[data-calculator-error]');
  if (error) {
    error.hidden = false;
    error.textContent = message;
  }
}

function revealResults(root) {
  const results = root.querySelector('[data-calculator-results]');
  if (results) results.hidden = false;
}

export function sendTerminationCalculatorEvent(type) {
  if (!VALID_CALCULATOR_TYPES.has(type)) return false;
  if (globalThis.Cookiebot?.consent?.statistics !== true) return false;
  if (typeof globalThis.gtag !== 'function') return false;

  globalThis.gtag('event', 'termination_calculator_complete', {
    calculator_type: type
  });
  return true;
}

if (typeof document !== 'undefined') {
  for (const root of document.querySelectorAll('[data-termination-calculator]')) {
    const type = root.getAttribute('data-termination-calculator');
    const form = root.querySelector('form');
    if (!form) continue;

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      clearError(root);

      try {
        const input = readInput(form);
        if (!input.startIso || !input.endIso) throw new Error('İşe giriş ve işten ayrılma tarihlerini girin.');
        if (!input.baseGrossKurus) throw new Error('Aylık brüt ücreti girin.');

        const taxOptions = {
          taxBaseProvided: Boolean(inputValue(form, 'previousTaxBase').trim()),
          incomeExemptionProvided: Boolean(inputValue(form, 'remainingIncomeTaxExemption').trim()),
          stampExemptionProvided: Boolean(inputValue(form, 'remainingStampTaxExemption').trim())
        };
        const severanceRoot = root.querySelector('[data-severance-results]') || root;
        const noticeRoot = root.querySelector('[data-notice-results]') || root;

        if (type === 'severance') {
          renderSeverance(severanceRoot, calculateSeverance(input), taxOptions.stampExemptionProvided);
        } else if (type === 'notice') {
          renderNotice(noticeRoot, calculateNotice(input), taxOptions);
        } else {
          const result = calculateTerminationPackage(input);
          renderSeverance(severanceRoot, result.severance, taxOptions.stampExemptionProvided);
          renderNotice(noticeRoot, result.notice, taxOptions);
          setText(root, '[data-result="package-gross"]', formatMoney(result.grossTotalKurus));
          setText(root, '[data-result="package-net"]', formatMoney(result.netTotalKurus));
        }

        revealResults(root);
        sendTerminationCalculatorEvent(type);
      } catch (error) {
        showError(root, error instanceof Error ? error.message : 'Hesaplama sırasında bir hata oluştu.');
      }
    });
  }
}
