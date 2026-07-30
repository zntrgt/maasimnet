import { parseTurkishMoney } from './money-input.js';

const VALID_EVENTS = new Set([
  'calculator_view',
  'salary_input_started',
  'salary_calculation_completed',
  'salary_results_viewed',
  'scenario_modified',
  'methodology_opened',
  'related_content_clicked',
  'calculator_mode_change',
  'payroll_detail_toggle',
  'calculator_csv_download'
]);
const VALID_MODES = new Set(['gross', 'net']);
const VALID_SCENARIO_TYPES = new Set(['standard', 'salary_change', 'extra_payment', 'previous_tax_base']);
const VALID_OVERRIDE_TYPES = new Set(['base_salary', 'extra_payment']);
const VALID_DETAIL_ACTIONS = new Set(['open', 'close']);
const VALID_INPUT_METHODS = new Set(['typed', 'paste', 'enter', 'cta']);
const SALARY_RANGE_VERSION = '2026_v1';
const INPUT_DEBOUNCE_MS = 600;

const SALARY_RANGES = Object.freeze([
  [30000, '0_29k'],
  [40000, '30k_39k'],
  [50000, '40k_49k'],
  [75000, '50k_74k'],
  [100000, '75k_99k'],
  [125000, '100k_124k'],
  [150000, '125k_149k'],
  [200000, '150k_199k'],
  [300000, '200k_299k'],
  [500000, '300k_499k'],
  [Infinity, '500k_plus']
]);

function normalizedMonth(value) {
  const month = Number(value);
  return Number.isInteger(month) && month >= 1 && month <= 12 ? month : undefined;
}

export function getSalaryRange(value) {
  const salary = Number(value);
  if (!Number.isFinite(salary) || salary < 0) return undefined;
  return SALARY_RANGES.find(([upperBound]) => salary < upperBound)?.[1];
}

export function buildCalculatorEvent(eventName, parameters = {}) {
  if (!VALID_EVENTS.has(eventName)) return null;

  const safeParameters = {};

  if (VALID_MODES.has(parameters.calculation_direction)) {
    safeParameters.calculation_direction = parameters.calculation_direction;
  }
  if (VALID_MODES.has(parameters.calculator_mode)) {
    safeParameters.calculator_mode = parameters.calculator_mode;
  }
  if (VALID_SCENARIO_TYPES.has(parameters.scenario_type)) {
    safeParameters.scenario_type = parameters.scenario_type;
  }
  if (VALID_INPUT_METHODS.has(parameters.input_method)) {
    safeParameters.input_method = parameters.input_method;
  }
  if (SALARY_RANGES.some(([, label]) => label === parameters.salary_range)) {
    safeParameters.salary_range = parameters.salary_range;
    safeParameters.range_version = SALARY_RANGE_VERSION;
  }
  if (parameters.calculation_year === 2026) safeParameters.calculation_year = 2026;

  if (eventName === 'scenario_modified') {
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

function replaceButtonLabel(button) {
  if (!button) return;
  const icon = button.querySelector('i, svg');
  button.textContent = 'Ayrıntılı Sonuçları Gör';
  if (icon) button.prepend(icon);
  button.setAttribute('aria-label', 'Ayrıntılı maaş sonuçlarını gör');
}

export function initializeCalculatorAnalytics(doc = globalThis.document) {
  const input = doc?.getElementById('input-salary');
  if (!input) return false;
  if (doc.documentElement.dataset.maasimCalculatorAnalytics === 'ready') return true;

  doc.documentElement.dataset.maasimCalculatorAnalytics = 'ready';

  const state = {
    hasUserInteracted: false,
    debounceTimer: null,
    pendingMethod: 'typed',
    lastCompletedRange: null,
    lastViewedRange: null,
    latestRange: null,
    canTrackResults: false
  };

  const submitButton = doc.querySelector('button[onclick*="calculateAndShowPayroll"]');
  const resultsShell = doc.getElementById('payroll-results-shell');
  replaceButtonLabel(submitButton);

  const calculateFromInput = (inputMethod = state.pendingMethod) => {
    if (state.debounceTimer) {
      globalThis.clearTimeout(state.debounceTimer);
      state.debounceTimer = null;
    }

    const salary = parseTurkishMoney(input.value);
    if (!Number.isFinite(salary) || salary <= 0) {
      state.latestRange = null;
      state.canTrackResults = false;
      return false;
    }

    globalThis.handleMainSalaryInput?.({ currentTarget: input });
    const salaryRange = getSalaryRange(salary);
    state.latestRange = salaryRange;
    state.canTrackResults = true;

    if (salaryRange && salaryRange !== state.lastCompletedRange) {
      sendCalculatorEvent('salary_calculation_completed', {
        calculation_direction: activeMode(doc),
        calculation_year: 2026,
        salary_range: salaryRange,
        scenario_type: 'standard',
        input_method: inputMethod
      });
      state.lastCompletedRange = salaryRange;
    }
    return true;
  };

  const scheduleCalculation = (inputMethod) => {
    state.pendingMethod = inputMethod;
    if (state.debounceTimer) globalThis.clearTimeout(state.debounceTimer);
    state.debounceTimer = globalThis.setTimeout(
      () => calculateFromInput(inputMethod),
      INPUT_DEBOUNCE_MS
    );
  };

  input.addEventListener('beforeinput', (event) => {
    state.pendingMethod = event.inputType === 'insertFromPaste' ? 'paste' : 'typed';
  }, true);

  input.addEventListener('input', (event) => {
    event.stopImmediatePropagation();

    if (!state.hasUserInteracted) {
      state.hasUserInteracted = true;
      sendCalculatorEvent('salary_input_started', {
        calculation_direction: activeMode(doc),
        calculation_year: 2026,
        scenario_type: 'standard'
      });
    }

    scheduleCalculation(state.pendingMethod);
  }, true);

  input.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    calculateFromInput('enter');
    input.blur();
  }, true);

  doc.addEventListener('click', (event) => {
    const button = closestButton(event.target);

    if (button?.id === 'btn-mode-gross' || button?.id === 'btn-mode-net') {
      if (button.getAttribute('aria-pressed') !== 'true') {
        sendCalculatorEvent('calculator_mode_change', {
          calculator_mode: button.id === 'btn-mode-net' ? 'net' : 'gross'
        });
      }
      return;
    }

    const handler = button?.getAttribute('onclick') || '';
    if (handler.includes('calculateAndShowPayroll')) {
      if (!calculateFromInput('cta')) {
        event.preventDefault();
        input.focus();
      }
      return;
    }

    if (handler.includes('downloadCSV')) {
      sendCalculatorEvent('calculator_csv_download', { calculator_mode: activeMode(doc) });
      return;
    }

    if (handler.includes('togglePayrollDetail')) {
      sendCalculatorEvent('payroll_detail_toggle', {
        month_number: monthFromHandler(handler, 'togglePayrollDetail'),
        detail_action: button.getAttribute('aria-expanded') === 'true' ? 'close' : 'open'
      });
      return;
    }

    const link = event.target?.closest?.('a[href]');
    if (!link) return;
    const href = link.getAttribute('href') || '';
    if (href.includes('hesaplama-metodolojisi')) {
      sendCalculatorEvent('methodology_opened', { calculation_direction: activeMode(doc) });
    } else if (href.startsWith('/') && !href.startsWith('/#') && href !== '/') {
      sendCalculatorEvent('related_content_clicked', { calculation_direction: activeMode(doc) });
    }
  }, true);

  doc.addEventListener('change', (event) => {
    const changedInput = event.target;
    const handler = changedInput?.getAttribute?.('onchange') || '';

    if (handler.includes('updateBaseGrossFromMonth')) {
      sendCalculatorEvent('scenario_modified', {
        calculation_direction: activeMode(doc),
        scenario_type: 'salary_change',
        month_number: monthFromHandler(handler, 'updateBaseGrossFromMonth'),
        override_type: 'base_salary'
      });
    } else if (handler.includes('updateExtraGrossForMonth')) {
      sendCalculatorEvent('scenario_modified', {
        calculation_direction: activeMode(doc),
        scenario_type: 'extra_payment',
        month_number: monthFromHandler(handler, 'updateExtraGrossForMonth'),
        override_type: 'extra_payment'
      });
    }
  }, true);

  if (resultsShell && typeof globalThis.IntersectionObserver === 'function') {
    let visibleTimer = null;
    const observer = new globalThis.IntersectionObserver((entries) => {
      const visible = entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.5);
      if (!visible) {
        if (visibleTimer) globalThis.clearTimeout(visibleTimer);
        visibleTimer = null;
        return;
      }
      if (!state.canTrackResults || !state.latestRange || state.latestRange === state.lastViewedRange) return;

      visibleTimer = globalThis.setTimeout(() => {
        if (!state.canTrackResults || !state.latestRange || state.latestRange === state.lastViewedRange) return;
        sendCalculatorEvent('salary_results_viewed', {
          calculation_direction: activeMode(doc),
          calculation_year: 2026,
          salary_range: state.latestRange,
          scenario_type: 'standard'
        });
        state.lastViewedRange = state.latestRange;
      }, 1000);
    }, { threshold: [0.5] });
    observer.observe(resultsShell);
  }

  sendCalculatorEvent('calculator_view', {
    calculation_direction: activeMode(doc),
    calculation_year: 2026,
    scenario_type: 'standard'
  });

  globalThis.setTimeout(() => {
    input.value = '';
    input.dataset.rawValue = '';
    globalThis.handleMainSalaryInput?.({ currentTarget: input });
  }, 0);

  return true;
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initializeCalculatorAnalytics(), { once: true });
  } else {
    initializeCalculatorAnalytics();
  }
}
