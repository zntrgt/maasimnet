import test from 'node:test';
import assert from 'node:assert/strict';
import { getApplicableIncomeTaxRatesPpm } from '../src/payroll-engine.js';

const parameters = {
  incomeTaxBrackets: [
    { upToKurus: 100_00, ratePpm: 150_000 },
    { upToKurus: 250_00, ratePpm: 200_000 },
    { upToKurus: Number.POSITIVE_INFINITY, ratePpm: 270_000 }
  ]
};

test('tek dilimde kalan ay yalnız o dilimi döndürür', () => {
  assert.deepEqual(
    getApplicableIncomeTaxRatesPpm(80_00, 30_00, { parameters }),
    [150_000]
  );
});

test('ay içinde vergi dilimi değişirse iki dilimi sırayla döndürür', () => {
  assert.deepEqual(
    getApplicableIncomeTaxRatesPpm(150_00, 100_00, { parameters }),
    [150_000, 200_000]
  );
});

test('ay içinde iki eşik aşılırsa kullanılan tüm dilimleri döndürür', () => {
  assert.deepEqual(
    getApplicableIncomeTaxRatesPpm(300_00, 220_00, { parameters }),
    [150_000, 200_000, 270_000]
  );
});
