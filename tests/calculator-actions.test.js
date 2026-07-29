import test from 'node:test';
import assert from 'node:assert/strict';

import { runCalculationAndFocusPayroll } from '../src/calculator-actions.js';

test('hesaplama callbackini her durumda çalıştırır', () => {
  let calculationCount = 0;

  const scrolled = runCalculationAndFocusPayroll({
    calculate: () => {
      calculationCount += 1;
    },
    payrollElement: null,
    viewportWidth: 1200
  });

  assert.equal(calculationCount, 1);
  assert.equal(scrolled, false);
});

test('mobilde hesaplama sonrası bordroya yumuşak kaydırır', () => {
  let scrollOptions = null;

  const scrolled = runCalculationAndFocusPayroll({
    calculate: () => {},
    payrollElement: {
      scrollIntoView(options) {
        scrollOptions = options;
      }
    },
    viewportWidth: 390
  });

  assert.equal(scrolled, true);
  assert.deepEqual(scrollOptions, {
    behavior: 'smooth',
    block: 'start'
  });
});

test('masaüstünde otomatik kaydırma yapmaz', () => {
  let wasScrolled = false;

  const scrolled = runCalculationAndFocusPayroll({
    calculate: () => {},
    payrollElement: {
      scrollIntoView() {
        wasScrolled = true;
      }
    },
    viewportWidth: 1024
  });

  assert.equal(scrolled, false);
  assert.equal(wasScrolled, false);
});
