import { calculateUnemploymentBenefit } from './unemployment-engine.js';

const moneyFormatter = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

function parseMoneyToKurus(value) {
  const raw = String(value || '').trim();
  if (!raw) return 0;
  const normalized = raw.replace(/\s/g, '').replace(/₺|TL/gi, '').replace(/\./g, '').replace(',', '.');
  const number = Number(normalized);
  if (!Number.isFinite(number) || number < 0) throw new Error('PEK alanlarına sıfır veya pozitif bir tutar girin.');
  return Math.round(number * 100);
}

function parseInteger(value, label, { empty = null } = {}) {
  const raw = String(value ?? '').trim();
  if (!raw && empty === null) return null;
  const number = Number(raw);
  if (!Number.isSafeInteger(number) || number < 0) throw new Error(`${label} sıfır veya pozitif tam sayı olmalıdır.`);
  return number;
}

function triState(value) {
  if (value === 'yes') return true;
  if (value === 'no') return false;
  return null;
}

function formatMoney(kurus) {
  return moneyFormatter.format(kurus / 100);
}

function setText(root, selector, value) {
  const node = root.querySelector(selector);
  if (node) node.textContent = value;
}

function readInput(form) {
  const months = [1, 2, 3, 4].map((index) => ({
    pekKurus: parseMoneyToKurus(form.elements.namedItem(`pek${index}`)?.value),
    premiumDays: parseInteger(form.elements.namedItem(`days${index}`)?.value, `${index}. ay prim günü`, { empty: 0 }) ?? 0
  }));
  return {
    months,
    premiumDaysLast3Years: parseInteger(form.elements.namedItem('premiumDaysLast3Years')?.value, 'Son 3 yıldaki prim günü', { empty: 0 }) ?? 0,
    last120DaysUnderContract: triState(form.elements.namedItem('last120DaysUnderContract')?.value),
    involuntaryUnemployment: triState(form.elements.namedItem('involuntaryUnemployment')?.value),
    applicationAfterDays: parseInteger(form.elements.namedItem('applicationAfterDays')?.value, 'Başvuru günü')
  };
}

function statusCopy(result) {
  if (result.eligibilityStatus === 'estimated-eligible') return 'Koşullarınıza göre hak kazanma ihtimali var';
  if (result.eligibilityStatus === 'not-eligible') return 'Girilen bilgilere göre temel hak koşulu sağlanmıyor';
  return 'Hak kazanma için bazı bilgilerin teyidi gerekiyor';
}

function render(root, result) {
  setText(root, '[data-result="average-daily-gross"]', formatMoney(result.averageDailyGrossKurus));
  setText(root, '[data-result="monthly-gross"]', formatMoney(result.monthlyGrossBenefitKurus));
  setText(root, '[data-result="monthly-cap"]', formatMoney(result.monthlyGrossCapKurus));
  setText(root, '[data-result="stamp-tax"]', formatMoney(result.monthlyStampTaxKurus));
  setText(root, '[data-result="monthly-net"]', formatMoney(result.monthlyNetBenefitKurus));
  setText(root, '[data-result="duration"]', result.statutoryDurationDays ? `${result.statutoryDurationDays} gün (${result.statutoryDurationMonths} ay)` : '0 gün');
  setText(root, '[data-result="payable-duration"]', `${result.payableDurationDays} gün`);
  setText(root, '[data-result="total-net"]', formatMoney(result.totalNetBenefitKurus));
  setText(root, '[data-result="eligibility"]', statusCopy(result));

  const cap = root.querySelector('[data-cap-warning]');
  if (cap) {
    cap.hidden = !result.capApplied;
    cap.textContent = result.capApplied
      ? `Hesaplanan tutar 2026 aylık brüt üst sınırı olan ${formatMoney(result.monthlyGrossCapKurus)} ile sınırlandı.`
      : '';
  }

  const reasons = root.querySelector('[data-eligibility-reasons]');
  if (reasons) {
    reasons.innerHTML = '';
    for (const reason of result.eligibilityReasons) {
      const li = document.createElement('li');
      li.textContent = reason;
      reasons.appendChild(li);
    }
  }

  const results = root.querySelector('[data-calculator-results]');
  if (results) results.hidden = false;
}

function showError(root, message) {
  const node = root.querySelector('[data-calculator-error]');
  if (node) {
    node.hidden = false;
    node.textContent = message;
  }
}

function clearError(root) {
  const node = root.querySelector('[data-calculator-error]');
  if (node) {
    node.hidden = true;
    node.textContent = '';
  }
}

export function sendUnemploymentCalculatorEvent() {
  if (globalThis.Cookiebot?.consent?.statistics !== true) return false;
  if (typeof globalThis.gtag !== 'function') return false;
  globalThis.gtag('event', 'unemployment_calculator_complete');
  return true;
}

if (typeof document !== 'undefined') {
  for (const root of document.querySelectorAll('[data-unemployment-calculator]')) {
    const form = root.querySelector('form');
    if (!form) continue;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      clearError(root);
      try {
        const input = readInput(form);
        if (!input.months.some((month) => month.premiumDays > 0 && month.pekKurus > 0)) {
          throw new Error('Son dört ay için en az bir PEK ve prim günü bilgisi girin.');
        }
        render(root, calculateUnemploymentBenefit(input));
        sendUnemploymentCalculatorEvent();
      } catch (error) {
        showError(root, error instanceof Error ? error.message : 'Hesaplama sırasında bir hata oluştu.');
      }
    });
  }
}
