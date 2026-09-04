import test from 'node:test';
import assert from 'node:assert/strict';
import { sendTerminationCalculatorEvent } from '../src/termination-calculators.js';

function withAnalyticsGlobals({ consent, gtag }, fn) {
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

test('termination analytics does not send without statistics consent', () => {
  const calls = [];
  const sent = withAnalyticsGlobals({ consent: false, gtag: (...args) => calls.push(args) }, () =>
    sendTerminationCalculatorEvent('severance')
  );
  assert.equal(sent, false);
  assert.deepEqual(calls, []);
});

test('termination analytics sends only categorical calculator type after consent', () => {
  const calls = [];
  const sent = withAnalyticsGlobals({ consent: true, gtag: (...args) => calls.push(args) }, () =>
    sendTerminationCalculatorEvent('combined')
  );
  assert.equal(sent, true);
  assert.deepEqual(calls, [[
    'event',
    'termination_calculator_complete',
    { calculator_type: 'combined' }
  ]]);
});

test('termination analytics rejects unknown calculator types', () => {
  const calls = [];
  const sent = withAnalyticsGlobals({ consent: true, gtag: (...args) => calls.push(args) }, () =>
    sendTerminationCalculatorEvent('custom')
  );
  assert.equal(sent, false);
  assert.deepEqual(calls, []);
});
