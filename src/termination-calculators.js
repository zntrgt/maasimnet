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
    previousCumulativeTaxBaseKurus: parseMoneyToKurus(inputValue(form, 'previousTaxBase'))
  };
}

function durationText(duration) {
  return `${duration.years} yıl ${duration.months} ay ${duration.days} gün`;
}

function setText(root, selector, value) {
  const node = root.querySelector(selector);
  if (node) node.textContent = value;
}

function renderSeverance(root, result) {
  setText(root, '[data-result="duration"]', durationText(result.duration));
  setText(root, '[data-result="dressed-gross"]', formatMoney(result.dressedGrossKurus));
  setText(root, '[data-result="severance-ceiling"]', formatMoney(result.ceilingKurus));
  setText(root, '[data-result="severance-basis"]', formatMoney(result.basisKurus));
  setText(root, '[data-result="severance-gross"]', formatMoney(result.grossKurus));
  setText(root, '[data-result="severance-stamp"]', formatMoney(result.stampTaxKurus));
  setText(root, '[data-result="severance-net"]', formatMoney(result.netKurus));

  const warning = root.querySelector('[data-severance-warning]');
  if (warning) {
    if (!result.eligibleByDuration) {
      warning.hidden = false;
      warning.textContent = 'Bu hizmet süresi 1 yıldan kısa. 1475 sayılı Kanun kapsamındaki genel kıdem tazminatı koşulunda en az 1 yıl çalışma aranır.';
    } else if (result.ceilingApplied) {
      warning.hidden = false;
      warning.textContent = 'Giydirilmiş brüt ücret, fesih tarihinde geçerli kıdem tazminatı tavanını aştığı için hesap tavan üzerinden yapıldı.';
    } else {
      warning.hidden = true;
      warning.textContent = '';
    }
  }
}

function renderNotice(root, result, taxBaseProvided) {
  setText(root, '[data-result="duration"]', durationText(result.duration));
  setText(root, '[data-result="dressed-gross"]', formatMoney(result.dressedGrossKurus));
  setText(root, '[data-result="notice-period"]', `${result.noticePeriod.weeks} hafta (${result.noticePeriod.days} gün)`);
  setText(root, '[data-result="notice-gross"]', formatMoney(result.grossKurus));
  setText(root, '[data-result="notice-rates"]', formatRates(result.incomeTaxRatesPpm));
  setText(root, '[data-result="notice-income-tax"]', formatMoney(result.incomeTaxKurus));
  setText(root, '[data-result="notice-stamp"]', formatMoney(result.stampTaxKurus));
  setText(root, '[data-result="notice-net"]', formatMoney(result.netKurus));

  const warning = root.querySelector('[data-notice-warning]');
  if (warning) {
    warning.hidden = false;
    warning.textContent = taxBaseProvided
      ? 'Net ihbar tahmini, girdiğiniz önceki kümülatif gelir vergisi matrahına göre hesaplandı. Bordrodaki diğer ücret ve istisnalar sonucu değiştirebilir.'
      : 'Kümülatif vergi matrahı girilmediği için gelir vergisi 0 TL önceki matrahtan başlatıldı. Net sonuç bordronuzdaki gerçek kümülatif matraha göre değişebilir.';
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

function pushAnalytics(type) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: 'termination_calculator_complete', calculator_type: type });
}

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

      const taxBaseProvided = Boolean(inputValue(form, 'previousTaxBase').trim());
      if (type === 'severance') {
        renderSeverance(root, calculateSeverance(input));
      } else if (type === 'notice') {
        renderNotice(root, calculateNotice(input), taxBaseProvided);
      } else {
        const result = calculateTerminationPackage(input);
        renderSeverance(root, result.severance);
        renderNotice(root, result.notice, taxBaseProvided);
        setText(root, '[data-result="package-gross"]', formatMoney(result.grossTotalKurus));
        setText(root, '[data-result="package-net"]', formatMoney(result.netTotalKurus));
      }

      revealResults(root);
      pushAnalytics(type);
    } catch (error) {
      showError(root, error instanceof Error ? error.message : 'Hesaplama sırasında bir hata oluştu.');
    }
  });
}
