const VALID_EVENTS = new Set([
  'calculator_mode_change',
  'calculator_submit',
  'calculator_monthly_override',
  'payroll_detail_toggle',
  'calculator_csv_download'
]);
const VALID_MODES = new Set(['gross', 'net']);
const VALID_OVERRIDE_TYPES = new Set(['base_salary', 'extra_payment']);
const VALID_DETAIL_ACTIONS = new Set(['open', 'close']);

function normalizedMonth(value) {
  const month = Number(value);
  return Number.isInteger(month) && month >= 1 && month <= 12 ? month : undefined;
}

export function buildCalculatorEvent(eventName, parameters = {}) {
  if (!VALID_EVENTS.has(eventName)) return null;

  const safeParameters = {};
  if (
    ['calculator_mode_change', 'calculator_submit', 'calculator_csv_download'].includes(eventName)
    && VALID_MODES.has(parameters.calculator_mode)
  ) safeParameters.calculator_mode = parameters.calculator_mode;

  if (eventName === 'calculator_monthly_override') {
    const month = normalizedMonth(parameters.month_number);
    if (month) safeParameters.month_number = month;
    if (VALID_OVERRIDE_TYPES.has(parameters.override_type)) safeParameters.override_type = parameters.override_type;
  }

  if (eventName === 'payroll_detail_toggle') {
    const month = normalizedMonth(parameters.month_number);
    if (month) safeParameters.month_number = month;
    if (VALID_DETAIL_ACTIONS.has(parameters.detail_action)) safeParameters.detail_action = parameters.detail_action;
  }

  return Object.freeze({
    eventName,
    parameters: Object.freeze(safeParameters)
  });
}

function hasStatisticsConsent() {
  return globalThis.Cookiebot?.consent?.statistics === true;
}

export function sendCalculatorEvent(eventName, parameters = {}) {
  const event = buildCalculatorEvent(eventName, parameters);
  if (!event || !hasStatisticsConsent() || typeof globalThis.gtag !== 'function') return false;
  globalThis.gtag('event', event.eventName, event.parameters);
  return true;
}

function activeMode(doc = globalThis.document) {
  return doc?.getElementById('btn-mode-net')?.getAttribute('aria-pressed') === 'true' ? 'net' : 'gross';
}

function monthFromHandler(handler, functionName) {
  const match = String(handler || '').match(new RegExp(`${functionName}\\((\\d+)`));
  return match ? Number(match[1]) + 1 : undefined;
}

function closestButton(target) {
  const element = target?.closest ? target : target?.parentElement;
  return element?.closest?.('button') || null;
}

function handleClick(event) {
  const button = closestButton(event.target);
  if (!button) return;

  if (button.id === 'btn-mode-gross' || button.id === 'btn-mode-net') {
    if (button.getAttribute('aria-pressed') !== 'true') {
      sendCalculatorEvent('calculator_mode_change', {
        calculator_mode: button.id === 'btn-mode-net' ? 'net' : 'gross'
      });
    }
    return;
  }

  const handler = button.getAttribute('onclick') || '';
  if (handler.includes('calculateAndShowPayroll')) {
    sendCalculatorEvent('calculator_submit', { calculator_mode: activeMode() });
    return;
  }

  if (handler.includes('downloadCSV')) {
    sendCalculatorEvent('calculator_csv_download', { calculator_mode: activeMode() });
    return;
  }

  if (handler.includes('togglePayrollDetail')) {
    sendCalculatorEvent('payroll_detail_toggle', {
      month_number: monthFromHandler(handler, 'togglePayrollDetail'),
      detail_action: button.getAttribute('aria-expanded') === 'true' ? 'close' : 'open'
    });
  }
}

function handleChange(event) {
  const input = event.target;
  const handler = input?.getAttribute?.('onchange') || '';

  if (handler.includes('updateBaseGrossFromMonth')) {
    sendCalculatorEvent('calculator_monthly_override', {
      month_number: monthFromHandler(handler, 'updateBaseGrossFromMonth'),
      override_type: 'base_salary'
    });
  } else if (handler.includes('updateExtraGrossForMonth')) {
    sendCalculatorEvent('calculator_monthly_override', {
      month_number: monthFromHandler(handler, 'updateExtraGrossForMonth'),
      override_type: 'extra_payment'
    });
  }
}

export function initializeCalculatorAnalytics(doc = globalThis.document) {
  if (!doc?.getElementById('input-salary')) return false;
  if (doc.documentElement.dataset.maasimCalculatorAnalytics === 'ready') return true;

  doc.documentElement.dataset.maasimCalculatorAnalytics = 'ready';
  doc.addEventListener('click', handleClick, true);
  doc.addEventListener('change', handleChange, true);
  return true;
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initializeCalculatorAnalytics(), { once: true });
  } else {
    initializeCalculatorAnalytics();
  }
}
