import { calculateOvertimePay } from './overtime-engine.js';

const moneyFormatter = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2, maximumFractionDigits: 2 });

function parseMoneyToKurus(value) {
  const raw = String(value || '').trim();
  if (!raw) return 0;
  const normalized = raw.replace(/\s/g, '').replace(/₺|TL/gi, '').replace(/\./g, '').replace(',', '.');
  const number = Number(normalized);
  if (!Number.isFinite(number) || number < 0) throw new Error('Tutar alanlarına sıfır veya pozitif bir sayı girin.');
  return Math.round(number * 100);
}

function parseHoursToMinutes(value, label) {
  const raw = String(value || '').trim();
  if (!raw) return 0;
  const hours = Number(raw.replace(',', '.'));
  if (!Number.isFinite(hours) || hours < 0) throw new Error(`${label} sıfır veya pozitif olmalıdır.`);
  const minutes = Math.round(hours * 60);
  if (Math.abs(minutes / 60 - hours) > 1e-9 || minutes % 30 !== 0) throw new Error(`${label} 0,5 saatlik adımlarla girilmelidir.`);
  return minutes;
}

function formatMoney(kurus) { return moneyFormatter.format(kurus / 100); }
function formatHours(minutes) { return `${(minutes / 60).toLocaleString('tr-TR', { maximumFractionDigits: 2 })} saat`; }
function formatRates(rates = []) { return rates.map((r) => `%${(r / 10_000).toLocaleString('tr-TR')}`).join(' → ') || '—'; }
function setText(root, selector, value) { const node = root.querySelector(selector); if (node) node.textContent = value; }

function readInput(form) {
  return {
    monthlyGrossKurus: parseMoneyToKurus(form.elements.namedItem('monthlyGross')?.value),
    hourlyGrossOverrideKurus: parseMoneyToKurus(form.elements.namedItem('hourlyGrossOverride')?.value),
    extraTime25Minutes: parseHoursToMinutes(form.elements.namedItem('extraTime25Hours')?.value, '%25 fazla sürelerle çalışma'),
    overtime50Minutes: parseHoursToMinutes(form.elements.namedItem('overtime50Hours')?.value, '%50 fazla çalışma'),
    monthNumber: Number(form.elements.namedItem('monthNumber')?.value || 0),
    previousCumulativeTaxBaseKurus: parseMoneyToKurus(form.elements.namedItem('previousTaxBase')?.value),
    retired: form.elements.namedItem('retired')?.value === 'yes',
    disabilityDegree: Number(form.elements.namedItem('disabilityDegree')?.value || 0),
    overtime50MinutesYearToDate: parseHoursToMinutes(form.elements.namedItem('overtime50YearToDate')?.value, 'Yıl içindeki önceki %50 fazla çalışma')
  };
}

function render(root, result) {
  setText(root, '[data-result="hourly-gross"]', formatMoney(result.regularHourlyGrossKurus));
  setText(root, '[data-result="extra25-gross"]', formatMoney(result.extraTime25GrossKurus));
  setText(root, '[data-result="overtime50-gross"]', formatMoney(result.overtime50GrossKurus));
  setText(root, '[data-result="overtime-gross"]', formatMoney(result.overtimeGrossKurus));
  setText(root, '[data-result="social"]', formatMoney(result.incrementalSocialKurus + result.incrementalUnemploymentKurus));
  setText(root, '[data-result="income-tax"]', formatMoney(result.incrementalIncomeTaxKurus));
  setText(root, '[data-result="stamp-tax"]', formatMoney(result.incrementalStampTaxKurus));
  setText(root, '[data-result="tax-rates"]', formatRates(result.incomeTaxRatesPpm));
  setText(root, '[data-result="overtime-net"]', formatMoney(result.overtimeNetKurus));
  setText(root, '[data-result="annual-used"]', formatHours(result.overtime50MinutesAfter));
  setText(root, '[data-result="annual-remaining"]', formatHours(result.annualRemainingMinutes));
  setText(root, '[data-result="timeoff50"]', formatHours(result.overtime50TimeOffMinutes));
  setText(root, '[data-result="timeoff25"]', formatHours(result.extraTime25TimeOffMinutes));

  const warning = root.querySelector('[data-overtime-warning]');
  if (warning) {
    const notes = [];
    if (result.annualLimitExceeded) notes.push('Girilen %50 fazla çalışma süresiyle yıllık 270 saatlik yasal sınır aşılıyor. Bu sınır, çalışılmış fazla mesai ücretini ortadan kaldırmaz; işverenin çalışma süresi yükümlülüğüne ilişkindir.');
    if (result.withOvertimePayroll.sgkBaseKurus === result.basePayroll.sgkBaseKurus && result.overtimeGrossKurus > 0) notes.push('Aylık ücretiniz SGK prime esas kazanç tavanında/üzerinde olduğu için fazla mesai tutarı ek SGK primi doğurmadı.');
    notes.push('Net tutar, girdiğiniz ödeme ayı ve ay başındaki kümülatif gelir vergisi matrahına göre bordro farkı olarak tahmin edilir.');
    warning.hidden = false;
    warning.textContent = notes.join(' ');
  }

  const results = root.querySelector('[data-calculator-results]');
  if (results) results.hidden = false;
}

function showError(root, message) { const node = root.querySelector('[data-calculator-error]'); if (node) { node.hidden = false; node.textContent = message; } }
function clearError(root) { const node = root.querySelector('[data-calculator-error]'); if (node) { node.hidden = true; node.textContent = ''; } }

export function sendOvertimeCalculatorEvent() {
  if (globalThis.Cookiebot?.consent?.statistics !== true) return false;
  if (typeof globalThis.gtag !== 'function') return false;
  globalThis.gtag('event', 'overtime_calculator_complete');
  return true;
}

if (typeof document !== 'undefined') {
  for (const root of document.querySelectorAll('[data-overtime-calculator]')) {
    const form = root.querySelector('form');
    if (!form) continue;
    form.addEventListener('submit', (event) => {
      event.preventDefault(); clearError(root);
      try {
        const input = readInput(form);
        if (!input.monthlyGrossKurus) throw new Error('Aylık brüt ücreti girin.');
        render(root, calculateOvertimePay(input));
        sendOvertimeCalculatorEvent();
      } catch (error) {
        showError(root, error instanceof Error ? error.message : 'Hesaplama sırasında bir hata oluştu.');
      }
    });
  }
}
