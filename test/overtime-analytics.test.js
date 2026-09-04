import test from 'node:test';
import assert from 'node:assert/strict';
import { sendOvertimeCalculatorEvent } from '../src/overtime-calculator.js';

function withGlobals({ consent, gtag }, fn) {
  const originalCookiebot = globalThis.Cookiebot;
  const originalGtag = globalThis.gtag;
  try {
    globalThis.Cookiebot = consent === undefined ? undefined : { consent: { statistics: consent } };
    globalThis.gtag = gtag;
    return fn();
  } finally {
    if (originalCookiebot === undefined) delete globalThis.Cookiebot;
    else globalThis.Cookiebot = originalCookiebot;
    if (originalGtag === undefined) delete globalThis.gtag;
    else globalThis.gtag = originalGtag;
  }
}

test('overtime analytics is blocked without statistics consent', () => {
  const calls = [];
  const sent = withGlobals({ consent: false, gtag: (...args) => calls.push(args) }, () => sendOvertimeCalculatorEvent());
  assert.equal(sent, false);
  assert.deepEqual(calls, []);
});

test('overtime analytics sends only completion event after consent', () => {
  const calls = [];
  const sent = withGlobals({ consent: true, gtag: (...args) => calls.push(args) }, () => sendOvertimeCalculatorEvent());
  assert.equal(sent, true);
  assert.deepEqual(calls, [['event', 'overtime_calculator_complete']]);
});
