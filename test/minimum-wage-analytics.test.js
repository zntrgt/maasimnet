import test from 'node:test';
import assert from 'node:assert/strict';
import { sendMinimumWageCalculatorEvent } from '../src/minimum-wage-calculator.js';

function withGlobals({ consent, gtag }, fn) {
  const originalCookiebot = globalThis.Cookiebot;
  const originalGtag = globalThis.gtag;
  try {
    globalThis.Cookiebot = consent === undefined ? undefined : { consent: { statistics: consent } };
    globalThis.gtag = gtag;
    return fn();
  } finally {
    if (originalCookiebot === undefined) delete globalThis.Cookiebot; else globalThis.Cookiebot = originalCookiebot;
    if (originalGtag === undefined) delete globalThis.gtag; else globalThis.gtag = originalGtag;
  }
}

test('minimum wage analytics is blocked without statistics consent', () => {
  const calls = [];
  const sent = withGlobals({ consent: false, gtag: (...args) => calls.push(args) }, () => sendMinimumWageCalculatorEvent());
  assert.equal(sent, false);
  assert.deepEqual(calls, []);
});

test('minimum wage analytics sends only completion event after consent', () => {
  const calls = [];
  const sent = withGlobals({ consent: true, gtag: (...args) => calls.push(args) }, () => sendMinimumWageCalculatorEvent());
  assert.equal(sent, true);
  assert.deepEqual(calls, [['event', 'minimum_wage_calculator_complete']]);
});
