import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateNotice,
  calculateSeverance,
  get2026SeveranceCeilingKurus,
  getNoticePeriod,
  getServiceDuration
} from '../src/termination-engine.js';

test('calendar service duration keeps years, months and days separately', () => {
  assert.deepEqual(
    getServiceDuration('2006-04-15', '2010-08-25'),
    { years: 4, months: 4, days: 10, totalDays: 1593 }
  );
});

test('2026 severance ceiling switches on 1 July', () => {
  assert.equal(get2026SeveranceCeilingKurus('2026-06-30'), 6_494_877);
  assert.equal(get2026SeveranceCeilingKurus('2026-07-01'), 7_372_987);
});

test('notice period follows 2/4/6/8 week statutory bands', () => {
  assert.deepEqual(getNoticePeriod('2026-01-01', '2026-05-31'), { weeks: 2, days: 14 });
  assert.deepEqual(getNoticePeriod('2025-10-01', '2026-09-01'), { weeks: 4, days: 28 });
  assert.deepEqual(getNoticePeriod('2024-10-01', '2026-09-01'), { weeks: 6, days: 42 });
  assert.deepEqual(getNoticePeriod('2022-01-01', '2026-09-01'), { weeks: 8, days: 56 });
});

test('notice period keeps exact statutory boundaries in the lower band', () => {
  assert.deepEqual(getNoticePeriod('2026-01-01', '2026-07-01'), { weeks: 4, days: 28 });
  assert.deepEqual(getNoticePeriod('2025-03-01', '2026-09-01'), { weeks: 6, days: 42 });
  assert.deepEqual(getNoticePeriod('2023-09-01', '2026-09-01'), { weeks: 6, days: 42 });
  assert.deepEqual(getNoticePeriod('2023-09-01', '2026-09-02'), { weeks: 8, days: 56 });
});

test('severance uses 2026 ceiling and only stamp tax', () => {
  const result = calculateSeverance({
    startIso: '2022-01-01',
    endIso: '2026-09-01',
    baseGrossKurus: 10_000_000,
    mealKurus: 500_000,
    transportKurus: 250_000,
    regularOtherKurus: 0
  });
  assert.equal(result.ceilingKurus, 7_372_987);
  assert.equal(result.basisKurus, 7_372_987);
  assert.equal(result.ceilingApplied, true);
  assert.equal(result.incomeTaxKurus, 0);
  assert.equal(result.sgkKurus, 0);
  assert.ok(result.netKurus < result.grossKurus);
});

test('less than one year returns no statutory severance amount', () => {
  const result = calculateSeverance({
    startIso: '2026-01-01',
    endIso: '2026-09-01',
    baseGrossKurus: 6_000_000
  });
  assert.equal(result.eligibleByDuration, false);
  assert.equal(result.grossKurus, 0);
  assert.equal(result.netKurus, 0);
});

test('notice pay uses dressed gross, no SGK and progressive income tax', () => {
  const result = calculateNotice({
    startIso: '2022-01-01',
    endIso: '2026-09-01',
    baseGrossKurus: 6_000_000,
    previousCumulativeTaxBaseKurus: 0
  });
  assert.equal(result.noticePeriod.weeks, 8);
  assert.equal(result.grossKurus, 11_200_000);
  assert.equal(result.incomeTaxKurus, 1_680_000);
  assert.equal(result.sgkKurus, 0);
  assert.ok(result.netKurus < result.grossKurus);
});
