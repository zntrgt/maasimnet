import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateNotice,
  calculateSeverance,
  calculateTerminationPackage,
  get2026MonthlyTaxExemptionCaps,
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

test('2026 monthly minimum-wage tax exemption caps follow the termination month', () => {
  assert.deepEqual(get2026MonthlyTaxExemptionCaps('2026-09-01'), {
    monthNumber: 9,
    incomeTaxKurus: 561_510,
    stampTaxKurus: 25_070
  });
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

test('exact two-year severance uses one monthly wage per full service year', () => {
  const result = calculateSeverance({
    startIso: '2024-09-04',
    endIso: '2026-09-04',
    baseGrossKurus: 6_000_000
  });
  assert.deepEqual(result.duration, { years: 2, months: 0, days: 0, totalDays: 730 });
  assert.equal(result.basisKurus, 6_000_000);
  assert.equal(result.grossKurus, 12_000_000);
  assert.equal(result.calculatedStampTaxKurus, 91_080);
  assert.equal(result.stampTaxKurus, 91_080);
  assert.equal(result.netKurus, 11_908_920);
});

test('severance ceiling applies per full service year when dressed wage exceeds the ceiling', () => {
  const result = calculateSeverance({
    startIso: '2023-09-04',
    endIso: '2026-09-04',
    baseGrossKurus: 10_000_000
  });
  assert.equal(result.ceilingKurus, 7_372_987);
  assert.equal(result.basisKurus, 7_372_987);
  assert.equal(result.ceilingApplied, true);
  assert.equal(result.grossKurus, 22_118_961);
});

test('annual regular bonus is divided by twelve and excess months are paid proportionally', () => {
  const result = calculateSeverance({
    startIso: '2025-04-04',
    endIso: '2026-09-04',
    baseGrossKurus: 5_000_000,
    annualRegularBenefitsKurus: 1_200_000
  });
  assert.deepEqual(result.duration, { years: 1, months: 5, days: 0, totalDays: 518 });
  assert.equal(result.annualRegularBenefitsMonthlyKurus, 100_000);
  assert.equal(result.dressedGrossKurus, 5_100_000);
  assert.equal(result.basisKurus, 5_100_000);
  assert.equal(result.grossKurus, 7_225_000);
});

test('severance uses 2026 ceiling and only stamp tax by default', () => {
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
  assert.equal(result.stampTaxExemptionAppliedKurus, 0);
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
  assert.equal(result.calculatedIncomeTaxKurus, 1_680_000);
  assert.equal(result.incomeTaxKurus, 1_680_000);
  assert.equal(result.sgkKurus, 0);
  assert.ok(result.netKurus < result.grossKurus);
});

test('annual regular bonus monthly share is also included in notice dressed wage', () => {
  const result = calculateNotice({
    startIso: '2024-01-01',
    endIso: '2026-09-01',
    baseGrossKurus: 5_000_000,
    annualRegularBenefitsKurus: 1_200_000
  });
  assert.equal(result.annualRegularBenefitsMonthlyKurus, 100_000);
  assert.equal(result.dressedGrossKurus, 5_100_000);
  assert.equal(result.noticePeriod.days, 42);
  assert.equal(result.grossKurus, 7_140_000);
});

test('unused monthly tax exemptions reduce notice taxes but cannot exceed 2026 monthly caps', () => {
  const result = calculateNotice({
    startIso: '2022-01-01',
    endIso: '2026-09-01',
    baseGrossKurus: 6_000_000,
    previousCumulativeTaxBaseKurus: 0,
    remainingIncomeTaxExemptionKurus: 1_000_000,
    remainingStampTaxExemptionKurus: 1_000_000
  });
  assert.equal(result.incomeTaxExemptionAppliedKurus, 561_510);
  assert.equal(result.incomeTaxKurus, 1_118_490);
  assert.equal(result.calculatedStampTaxKurus, 85_008);
  assert.equal(result.stampTaxExemptionAppliedKurus, 25_070);
  assert.equal(result.stampTaxKurus, 59_938);
});

test('combined package caps and applies the remaining stamp exemption only once', () => {
  const result = calculateTerminationPackage({
    startIso: '2022-01-01',
    endIso: '2026-09-01',
    baseGrossKurus: 6_000_000,
    remainingStampTaxExemptionKurus: 1_000_000
  });
  assert.equal(result.severance.stampTaxExemptionAppliedKurus, 25_070);
  assert.equal(result.notice.stampTaxExemptionAppliedKurus, 0);
  assert.equal(
    result.severance.stampTaxExemptionAppliedKurus + result.notice.stampTaxExemptionAppliedKurus,
    25_070
  );
});
