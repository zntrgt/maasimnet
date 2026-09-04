import { calculateMinimumWage2026 } from './minimum-wage-engine.js';

const moneyFormatter = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2, maximumFractionDigits: 2 });
function formatMoney(kurus) { return moneyFormatter.format(kurus / 100); }
function setText(root, selector, value) { const node = root.querySelector(selector); if (node) node.textContent = value; }

function render(root, result) {
  setText(root, '[data-result="monthly-gross"]', formatMoney(result.monthlyGrossKurus));
  setText(root, '[data-result="sgk"]', formatMoney(result.employeeSgkKurus));
  setText(root, '[data-result="unemployment"]', formatMoney(result.employeeUnemploymentKurus));
  setText(root, '[data-result="income-tax"]', formatMoney(result.incomeTaxKurus));
  setText(root, '[data-result="stamp-tax"]', formatMoney(result.stampTaxKurus));
  setText(root, '[data-result="monthly-net"]', formatMoney(result.monthlyNetKurus));
  setText(root, '[data-result="daily-gross"]', formatMoney(result.dailyGrossKurus));
  setText(root, '[data-result="daily-net"]', formatMoney(result.dailyNetKurus));
  setText(root, '[data-result="hourly-gross"]', formatMoney(result.hourlyGrossKurus));
  setText(root, '[data-result="hourly-net"]', formatMoney(result.hourlyNetKurus));
  setText(root, '[data-result="period-gross"]', formatMoney(result.periodGrossKurus));
  setText(root, '[data-result="period-net"]', formatMoney(result.periodNetKurus));
  setText(root, '[data-result="period-label"]', `${result.months} aylık toplam`);
  const results = root.querySelector('[data-calculator-results]');
  if (results) results.hidden = false;
}

export function sendMinimumWageCalculatorEvent() {
  if (globalThis.Cookiebot?.consent?.statistics !== true) return false;
  if (typeof globalThis.gtag !== 'function') return false;
  globalThis.gtag('event', 'minimum_wage_calculator_complete');
  return true;
}

if (typeof document !== 'undefined') {
  for (const root of document.querySelectorAll('[data-minimum-wage-calculator]')) {
    const form = root.querySelector('form');
    if (!form) continue;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const months = Number(form.elements.namedItem('months')?.value || 1);
      try {
        render(root, calculateMinimumWage2026({ months }));
        sendMinimumWageCalculatorEvent();
      } catch (error) {
        const node = root.querySelector('[data-calculator-error]');
        if (node) { node.hidden = false; node.textContent = error instanceof Error ? error.message : 'Hesaplama sırasında bir hata oluştu.'; }
      }
    });
    render(root, calculateMinimumWage2026({ months: 1 }));
  }
}
