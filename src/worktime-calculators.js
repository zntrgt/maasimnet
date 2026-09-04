import {
  calculatePublicHolidayPay,
  calculateWeeklyRestPay,
  calculatePartTimePay,
  calculatePartialMonthPay,
  calculateSgkPremium
} from './worktime-engines.js';
import { formatTurkishMoney, parseTurkishMoney } from './money-input.js';

const moneyFormatter = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const numberFormatter = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 });
const percentFormatter = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function money(kurus) { return moneyFormatter.format(kurus / 100); }
function moneyToKurus(value) { return Math.round(parseTurkishMoney(value) * 100); }
function numberValue(value) { return Number(String(value ?? '').trim().replace(',', '.')); }
function intValue(value) { return Number.parseInt(String(value ?? ''), 10); }
function optionalMoneyKurus(value) { const parsed = parseTurkishMoney(value); return parsed > 0 ? Math.round(parsed * 100) : undefined; }
function setText(root, name, value) { const node = root.querySelector(`[data-result="${name}"]`); if (node) node.textContent = value; }
function monthIndex(root) { return Math.max(0, Math.min(11, intValue(root.querySelector('[name="month"]')?.value || 0))); }
function retired(root) { return root.querySelector('[name="retired"]')?.checked === true; }
function previousTaxBase(root) { return optionalMoneyKurus(root.querySelector('[name="previous_tax_base"]')?.value); }

const EVENT_BY_TYPE = Object.freeze({
  holiday: 'public_holiday_calculator_complete',
  weekly_rest: 'weekly_rest_calculator_complete',
  part_time: 'part_time_calculator_complete',
  partial_month: 'partial_month_calculator_complete',
  sgk: 'sgk_premium_calculator_complete'
});

export function sendWorktimeCalculatorEvent(type) {
  const eventName = EVENT_BY_TYPE[type];
  if (!eventName) return false;
  if (globalThis.Cookiebot?.consent?.statistics !== true) return false;
  if (typeof globalThis.gtag !== 'function') return false;
  globalThis.gtag('event', eventName);
  return true;
}

function argsFromForm(root) {
  const type = root.dataset.type;
  if (type === 'holiday') {
    const days = numberValue(root.querySelector('[name="worked_days"]')?.value);
    return {
      monthlyGrossKurus: moneyToKurus(root.querySelector('[name="monthly_gross"]')?.value),
      halfDayUnitsWorked: Math.round(days * 2),
      monthIndex: monthIndex(root),
      previousCumulativeTaxBaseKurus: previousTaxBase(root),
      retired: retired(root)
    };
  }
  if (type === 'weekly_rest') return {
    monthlyGrossKurus: moneyToKurus(root.querySelector('[name="monthly_gross"]')?.value),
    restDaysWorked: intValue(root.querySelector('[name="worked_days"]')?.value),
    monthIndex: monthIndex(root),
    previousCumulativeTaxBaseKurus: previousTaxBase(root),
    retired: retired(root)
  };
  if (type === 'part_time') return {
    fullTimeEquivalentGrossKurus: moneyToKurus(root.querySelector('[name="full_time_gross"]')?.value),
    weeklyHours: numberValue(root.querySelector('[name="weekly_hours"]')?.value),
    fullTimeWeeklyHours: numberValue(root.querySelector('[name="full_time_weekly_hours"]')?.value),
    monthlyWorkedHours: numberValue(root.querySelector('[name="monthly_hours"]')?.value),
    monthIndex: monthIndex(root),
    previousCumulativeTaxBaseKurus: previousTaxBase(root),
    retired: retired(root)
  };
  if (type === 'partial_month') return {
    normalMonthlyGrossKurus: moneyToKurus(root.querySelector('[name="monthly_gross"]')?.value),
    paidDays: intValue(root.querySelector('[name="paid_days"]')?.value),
    monthIndex: monthIndex(root),
    previousCumulativeTaxBaseKurus: previousTaxBase(root),
    retired: retired(root)
  };
  if (type === 'sgk') return {
    pekKurus: moneyToKurus(root.querySelector('[name="pek"]')?.value),
    premiumDays: intValue(root.querySelector('[name="premium_days"]')?.value),
    employerScheme: root.querySelector('[name="employer_scheme"]')?.value || 'other',
    retired: retired(root)
  };
  throw new Error('Bilinmeyen hesaplayıcı türü.');
}

function calculate(root) {
  const args = argsFromForm(root);
  switch (root.dataset.type) {
    case 'holiday': return calculatePublicHolidayPay(args);
    case 'weekly_rest': return calculateWeeklyRestPay(args);
    case 'part_time': return calculatePartTimePay(args);
    case 'partial_month': return calculatePartialMonthPay(args);
    case 'sgk': return calculateSgkPremium(args);
    default: throw new Error('Bilinmeyen hesaplayıcı türü.');
  }
}

function renderHoliday(root, r) {
  setText(root, 'primary', money(r.extraNetKurus));
  setText(root, 'extra-gross', money(r.extraGrossKurus));
  setText(root, 'daily-gross', money(r.dailyGrossKurus));
  setText(root, 'monthly-total-gross', money(r.grossWithExtraKurus));
  setText(root, 'monthly-total-net', money(r.netWithExtraKurus));
  setText(root, 'worked-days', `${numberFormatter.format(r.daysWorked)} gün`);
}
function renderWeeklyRest(root, r) {
  setText(root, 'primary', money(r.extraNetKurus));
  setText(root, 'extra-gross', money(r.extraGrossKurus));
  setText(root, 'daily-gross', money(r.dailyGrossKurus));
  setText(root, 'monthly-total-gross', money(r.grossWithExtraKurus));
  setText(root, 'monthly-total-net', money(r.netWithExtraKurus));
  setText(root, 'worked-days', `${r.restDaysWorked} gün`);
}
function renderPartTime(root, r) {
  setText(root, 'primary', money(r.netKurus));
  setText(root, 'gross', money(r.grossKurus));
  setText(root, 'premium-days', `${r.premiumDays} gün`);
  setText(root, 'ratio', `%${percentFormatter.format(r.ratio * 100)}`);
  setText(root, 'pek-floor', money(r.pekFloorKurus));
  setText(root, 'pek-ceiling', money(r.pekCeilingKurus));
  const warning = root.querySelector('[data-pek-warning]');
  if (warning) warning.hidden = !r.belowPekFloor;
}
function renderPartialMonth(root, r) {
  setText(root, 'primary', money(r.netKurus));
  setText(root, 'gross', money(r.grossKurus));
  setText(root, 'daily-gross', money(r.dailyGrossKurus));
  setText(root, 'paid-days', `${r.paidDays} gün`);
  setText(root, 'missing-days', `${r.missingDays} gün`);
  setText(root, 'sgk-base', money(r.sgkBaseKurus));
}
function renderSgk(root, r) {
  setText(root, 'primary', money(r.totalPremiumKurus));
  setText(root, 'employee-total', money(r.employeeTotalKurus));
  setText(root, 'employer-total', money(r.employerTotalKurus));
  setText(root, 'employee-sgk', money(r.employeeSgkKurus || r.employeeSgdpKurus));
  setText(root, 'employee-unemployment', money(r.employeeUnemploymentKurus));
  setText(root, 'employer-sgk', money(r.employerSgkOrSgdpKurus));
  setText(root, 'employer-unemployment', money(r.employerUnemploymentKurus));
  setText(root, 'pek-range', `${money(r.minimumPekKurus)} – ${money(r.maximumPekKurus)}`);
}

function render(root, result) {
  if (root.dataset.type === 'holiday') renderHoliday(root, result);
  if (root.dataset.type === 'weekly_rest') renderWeeklyRest(root, result);
  if (root.dataset.type === 'part_time') renderPartTime(root, result);
  if (root.dataset.type === 'partial_month') renderPartialMonth(root, result);
  if (root.dataset.type === 'sgk') renderSgk(root, result);
  const results = root.querySelector('[data-calculator-results]');
  if (results) results.hidden = false;
  const error = root.querySelector('[data-calculator-error]');
  if (error) error.hidden = true;
  root.dataset.lastResult = JSON.stringify(result);
  return result;
}

function normalizeMoneyInputs(root) {
  for (const input of root.querySelectorAll('[data-money-input="true"]')) {
    const parsed = parseTurkishMoney(input.value);
    input.value = parsed > 0 ? formatTurkishMoney(parsed) : '';
  }
}

function tryLive(root) {
  try { normalizeMoneyInputs(root); return render(root, calculate(root)); } catch { return null; }
}

async function copyResult(root) {
  const primary = root.querySelector('[data-result="primary"]')?.textContent || '';
  const title = root.querySelector('h1')?.textContent || 'Maaşım.net hesaplama sonucu';
  if (!primary) return;
  try {
    await navigator.clipboard.writeText(`${title}: ${primary}`);
    const button = root.querySelector('[data-copy-result]');
    if (button) {
      const original = button.textContent;
      button.textContent = 'Kopyalandı';
      setTimeout(() => { button.textContent = original; }, 1400);
    }
  } catch {}
}

if (typeof document !== 'undefined') {
  for (const root of document.querySelectorAll('[data-worktime-calculator]')) {
    const form = root.querySelector('form');
    if (!form) continue;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      try {
        normalizeMoneyInputs(root);
        render(root, calculate(root));
        sendWorktimeCalculatorEvent(root.dataset.type);
      } catch (error) {
        const node = root.querySelector('[data-calculator-error]');
        if (node) { node.hidden = false; node.textContent = error instanceof Error ? error.message : 'Hesaplama sırasında hata oluştu.'; }
      }
    });
    for (const input of form.querySelectorAll('input,select')) {
      input.addEventListener('change', () => tryLive(root));
      if (input.matches('[data-money-input="true"], input[type="number"]')) input.addEventListener('blur', () => tryLive(root));
    }
    root.querySelector('[data-copy-result]')?.addEventListener('click', () => copyResult(root));
  }
}
