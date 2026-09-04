import { calculateSalaryRaise } from './salary-raise-engine.js';
import { formatTurkishMoney, parseTurkishMoney } from './money-input.js';

const moneyFormatter = new Intl.NumberFormat('tr-TR', {
  style: 'currency', currency: 'TRY', minimumFractionDigits: 2, maximumFractionDigits: 2
});
const percentFormatter = new Intl.NumberFormat('tr-TR', {
  minimumFractionDigits: 2, maximumFractionDigits: 2
});

function formatMoneyKurus(kurus) { return moneyFormatter.format(kurus / 100); }
function formatPercent(rateBasisPoints) { return `%${percentFormatter.format(rateBasisPoints / 100)}`; }
function moneyToKurus(value) { return Math.round(parseTurkishMoney(value) * 100); }
function percentToBasisPoints(value) {
  const normalized = String(value ?? '').trim().replace(/\s/g, '').replace(',', '.').replace('%', '');
  const number = Number(normalized);
  return Number.isFinite(number) ? Math.round(number * 100) : NaN;
}
function formatPercentInput(rateBasisPoints) { return percentFormatter.format(rateBasisPoints / 100); }
function setText(root, selector, value) { const node = root.querySelector(selector); if (node) node.textContent = value; }
function setValue(input, value) { if (input) input.value = value; }

const MODE_COPY = Object.freeze({
  new_salary: Object.freeze({ title: 'Yeni maaşın', helper: 'Eski maaş ve zam oranından hesaplandı.' }),
  rate: Object.freeze({ title: 'Maaş değişim oranı', helper: 'Eski ve yeni maaş arasındaki yüzde değişim.' }),
  old_salary: Object.freeze({ title: 'Eski maaşın', helper: 'Yeni maaş ve değişim oranından geriye doğru hesaplandı.' })
});

function getMode(root) {
  return root.querySelector('input[name="calculation_mode"]:checked')?.value || 'new_salary';
}

function getInputs(root) {
  return {
    oldSalary: root.querySelector('[name="old_salary"]'),
    newSalary: root.querySelector('[name="new_salary"]'),
    rate: root.querySelector('[name="rate"]')
  };
}

function configureMode(root) {
  const mode = getMode(root);
  const inputs = getInputs(root);
  const outputName = mode === 'new_salary' ? 'newSalary' : mode === 'rate' ? 'rate' : 'oldSalary';
  for (const [name, input] of Object.entries(inputs)) {
    if (!input) continue;
    const isOutput = name === outputName;
    input.readOnly = isOutput;
    input.setAttribute('aria-readonly', String(isOutput));
    input.classList.toggle('salary-raise-field__input--output', isOutput);
    if (isOutput) input.dataset.outputField = 'true'; else delete input.dataset.outputField;
  }
  const copy = MODE_COPY[mode];
  setText(root, '[data-primary-label]', copy.title);
  setText(root, '[data-primary-helper]', copy.helper);
}

function calculateFromForm(root) {
  const mode = getMode(root);
  const { oldSalary, newSalary, rate } = getInputs(root);
  const args = { mode };
  if (mode !== 'old_salary') args.oldSalaryKurus = moneyToKurus(oldSalary?.value || '');
  if (mode !== 'new_salary') args.newSalaryKurus = moneyToKurus(newSalary?.value || '');
  if (mode !== 'rate') args.rateBasisPoints = percentToBasisPoints(rate?.value || '');
  return calculateSalaryRaise(args);
}

function primaryValue(result) {
  if (result.mode === 'rate') return formatPercent(result.rateBasisPoints);
  if (result.mode === 'old_salary') return formatMoneyKurus(result.oldSalaryKurus);
  return formatMoneyKurus(result.newSalaryKurus);
}

function render(root, result) {
  const inputs = getInputs(root);
  if (result.mode === 'new_salary') setValue(inputs.newSalary, formatTurkishMoney(result.newSalaryKurus / 100));
  if (result.mode === 'rate') setValue(inputs.rate, formatPercentInput(result.rateBasisPoints));
  if (result.mode === 'old_salary') setValue(inputs.oldSalary, formatTurkishMoney(result.oldSalaryKurus / 100));

  setText(root, '[data-result="primary"]', primaryValue(result));
  setText(root, '[data-result="old"]', formatMoneyKurus(result.oldSalaryKurus));
  setText(root, '[data-result="new"]', formatMoneyKurus(result.newSalaryKurus));
  setText(root, '[data-result="rate"]', formatPercent(result.rateBasisPoints));
  setText(root, '[data-result="difference"]', formatMoneyKurus(result.differenceKurus));
  setText(root, '[data-result="annual-difference"]', formatMoneyKurus(result.annualDifferenceKurus));
  const direction = result.direction === 'increase' ? 'Artış' : result.direction === 'decrease' ? 'Azalış' : 'Değişim yok';
  setText(root, '[data-result="direction"]', direction);
  const results = root.querySelector('[data-calculator-results]');
  if (results) results.hidden = false;
  const error = root.querySelector('[data-calculator-error]');
  if (error) error.hidden = true;
  root.dataset.lastResult = JSON.stringify(result);
  return result;
}

function tryLiveRender(root) {
  try { return render(root, calculateFromForm(root)); } catch { return null; }
}

export function sendSalaryRaiseCalculatorEvent() {
  if (globalThis.Cookiebot?.consent?.statistics !== true) return false;
  if (typeof globalThis.gtag !== 'function') return false;
  globalThis.gtag('event', 'salary_raise_calculator_complete');
  return true;
}

async function copyResult(root) {
  const raw = root.dataset.lastResult;
  if (!raw) return;
  const result = JSON.parse(raw);
  const salaryType = root.querySelector('[name="salary_type"]')?.value === 'gross' ? 'Brüt' : 'Net';
  const text = `${salaryType} maaş değişimi — Eski: ${formatMoneyKurus(result.oldSalaryKurus)} · Yeni: ${formatMoneyKurus(result.newSalaryKurus)} · Değişim: ${formatPercent(result.rateBasisPoints)} · Aylık fark: ${formatMoneyKurus(result.differenceKurus)}`;
  try {
    await navigator.clipboard.writeText(text);
    const button = root.querySelector('[data-copy-result]');
    if (button) {
      const original = button.textContent;
      button.textContent = 'Kopyalandı';
      setTimeout(() => { button.textContent = original; }, 1400);
    }
  } catch {}
}

function normalizeMoneyInput(input) {
  if (!input || input.readOnly) return;
  const parsed = parseTurkishMoney(input.value);
  if (Number.isFinite(parsed)) input.value = formatTurkishMoney(parsed);
}

if (typeof document !== 'undefined') {
  for (const root of document.querySelectorAll('[data-salary-raise-calculator]')) {
    const form = root.querySelector('form');
    if (!form) continue;
    configureMode(root);

    for (const radio of form.querySelectorAll('input[name="calculation_mode"]')) {
      radio.addEventListener('change', () => { configureMode(root); tryLiveRender(root); });
    }
    for (const input of form.querySelectorAll('[data-money-input="true"]')) {
      input.addEventListener('blur', () => { normalizeMoneyInput(input); tryLiveRender(root); });
      input.addEventListener('input', () => { if (!input.readOnly) tryLiveRender(root); });
    }
    const rateInput = form.elements.namedItem('rate');
    rateInput?.addEventListener('input', () => { if (!rateInput.readOnly) tryLiveRender(root); });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      try {
        render(root, calculateFromForm(root));
        sendSalaryRaiseCalculatorEvent();
      } catch (error) {
        const node = root.querySelector('[data-calculator-error]');
        if (node) { node.hidden = false; node.textContent = error instanceof Error ? error.message : 'Hesaplama sırasında bir hata oluştu.'; }
      }
    });

    root.querySelector('[data-copy-result]')?.addEventListener('click', () => copyResult(root));
  }
}
