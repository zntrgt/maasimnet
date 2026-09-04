import { calculateAnnualLeavePay } from './annual-leave-engine.js';

const moneyFormatter = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2, maximumFractionDigits: 2 });

function parseMoneyToKurus(value) {
  const raw = String(value || '').trim();
  if (!raw) return 0;
  const normalized = raw.replace(/\s/g, '').replace(/₺|TL/gi, '').replace(/\./g, '').replace(',', '.');
  const number = Number(normalized);
  if (!Number.isFinite(number) || number < 0) throw new Error('Tutar alanlarına sıfır veya pozitif bir sayı girin.');
  return Math.round(number * 100);
}

function formatMoney(kurus) { return moneyFormatter.format(kurus / 100); }
function formatRates(rates = []) { return rates.map((r) => `%${(r / 10_000).toLocaleString('tr-TR')}`).join(' → ') || '—'; }
function setText(root, selector, value) { const node = root.querySelector(selector); if (node) node.textContent = value; }

function readInput(form) {
  return {
    lastMonthlyGrossKurus: parseMoneyToKurus(form.elements.namedItem('lastMonthlyGross')?.value),
    unusedLeaveDays: Number(form.elements.namedItem('unusedLeaveDays')?.value || 0),
    terminationMonthGrossKurus: parseMoneyToKurus(form.elements.namedItem('terminationMonthGross')?.value),
    terminationMonthPremiumDays: Number(form.elements.namedItem('terminationMonthPremiumDays')?.value || 0),
    monthNumber: Number(form.elements.namedItem('monthNumber')?.value || 0),
    previousCumulativeTaxBaseKurus: parseMoneyToKurus(form.elements.namedItem('previousTaxBase')?.value),
    retired: form.elements.namedItem('retired')?.value === 'yes',
    disabilityDegree: Number(form.elements.namedItem('disabilityDegree')?.value || 0)
  };
}

function render(root, result) {
  setText(root, '[data-result="daily-gross"]', formatMoney(result.dailyGrossKurus));
  setText(root, '[data-result="leave-gross"]', formatMoney(result.leaveGrossKurus));
  setText(root, '[data-result="social"]', formatMoney(result.incrementalSocialKurus + result.incrementalUnemploymentKurus));
  setText(root, '[data-result="income-tax"]', formatMoney(result.incrementalIncomeTaxKurus));
  setText(root, '[data-result="stamp-tax"]', formatMoney(result.incrementalStampTaxKurus));
  setText(root, '[data-result="tax-rates"]', formatRates(result.incomeTaxRatesPpm));
  setText(root, '[data-result="leave-net"]', formatMoney(result.leaveNetKurus));
  setText(root, '[data-result="sgk-ceiling"]', formatMoney(result.sgkCeilingKurus));

  const note = root.querySelector('[data-leave-note]');
  if (note) {
    const notes = ['Net sonuç, fesih ayındaki normal bordro ile kullanılmayan izin ücreti eklenmiş bordronun farkıdır.'];
    if (result.withLeavePayroll.sgkBaseKurus === result.basePayroll.sgkBaseKurus) notes.push('Girilen fesih ayı kazancı SGK tavanını doldurduğu için izin ücreti ek SGK/işsizlik primi doğurmadı.');
    note.textContent = notes.join(' ');
    note.hidden = false;
  }

  const results = root.querySelector('[data-calculator-results]');
  if (results) results.hidden = false;
}

function showError(root, message) { const node = root.querySelector('[data-calculator-error]'); if (node) { node.hidden = false; node.textContent = message; } }
function clearError(root) { const node = root.querySelector('[data-calculator-error]'); if (node) { node.hidden = true; node.textContent = ''; } }

export function sendAnnualLeaveCalculatorEvent() {
  if (globalThis.Cookiebot?.consent?.statistics !== true) return false;
  if (typeof globalThis.gtag !== 'function') return false;
  globalThis.gtag('event', 'annual_leave_calculator_complete');
  return true;
}

if (typeof document !== 'undefined') {
  for (const root of document.querySelectorAll('[data-annual-leave-calculator]')) {
    const form = root.querySelector('form');
    if (!form) continue;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      clearError(root);
      try {
        const input = readInput(form);
        if (!input.lastMonthlyGrossKurus) throw new Error('Son aylık brüt ücreti girin.');
        if (!input.unusedLeaveDays) throw new Error('Kullanılmayan izin gününü girin.');
        render(root, calculateAnnualLeavePay(input));
        sendAnnualLeaveCalculatorEvent();
      } catch (error) {
        showError(root, error instanceof Error ? error.message : 'Hesaplama sırasında bir hata oluştu.');
      }
    });
  }
}
