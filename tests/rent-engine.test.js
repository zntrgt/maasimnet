import test from 'node:test';
import assert from 'node:assert/strict';
import { RENT_CAPS, latestCap, calculateRent } from '../src/rent-engine.js';

test('oranlar en yeni ay başta, aylar benzersiz ve sıralı', () => {
  assert.equal(latestCap().renewal, '2026-10');
  assert.equal(latestCap().pct, 31.49);
  const months = RENT_CAPS.map((c) => c.renewal);
  assert.deepEqual([...months].sort().reverse(), months);
  assert.equal(new Set(months).size, months.length);
});

test('Ekim 2026 yenilemesinde 20.000 TL kira en fazla 26.298 TL olur', () => {
  const r = calculateRent({ currentKurus: 2_000_000, renewal: '2026-10' });
  assert.equal(r.maxKurus, 2_629_800);
  assert.equal(r.maxIncreaseKurus, 629_800);
});

test('istenen oran tavanı aşarsa fazlası gösterilir', () => {
  const r = calculateRent({ currentKurus: 2_000_000, renewal: '2026-10', agreedPct: 40 });
  assert.equal(r.agreed.exceedsCap, true);
  assert.equal(r.agreed.excessKurus, 2_800_000 - 2_629_800);
  const ok = calculateRent({ currentKurus: 2_000_000, renewal: '2026-10', agreedPct: 25 });
  assert.equal(ok.agreed.exceedsCap, false);
});

test('hatalı girdiler reddedilir', () => {
  assert.throws(() => calculateRent({ currentKurus: 0, renewal: '2026-10' }), /kira/);
  assert.throws(() => calculateRent({ currentKurus: 100, renewal: '2020-01' }), /ay/);
});
