import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateUnemploymentBenefit,
  get2026UnemploymentMonthlyGrossCapKurus,
  getUnemploymentBenefitDurationDays
} from '../src/unemployment-engine.js';

const fullMonths = (pekKurus) => [1, 2, 3, 4].map(() => ({ pekKurus, premiumDays: 30 }));

test('2026 unemployment benefit cap equals 80% of gross minimum wage', () => {
  assert.equal(get2026UnemploymentMonthlyGrossCapKurus(), 2_642_400);
});

test('benefit duration follows 600/900/1080 premium-day thresholds', () => {
  assert.equal(getUnemploymentBenefitDurationDays(599), 0);
  assert.equal(getUnemploymentBenefitDurationDays(600), 180);
  assert.equal(getUnemploymentBenefitDurationDays(899), 180);
  assert.equal(getUnemploymentBenefitDurationDays(900), 240);
  assert.equal(getUnemploymentBenefitDurationDays(1079), 240);
  assert.equal(getUnemploymentBenefitDurationDays(1080), 300);
});

test('2026 minimum-wage PEK produces 40% gross benefit and only stamp tax', () => {
  const result = calculateUnemploymentBenefit({
    months: fullMonths(3_303_000),
    premiumDaysLast3Years: 600,
    last120DaysUnderContract: true,
    involuntaryUnemployment: true,
    applicationAfterDays: 10
  });
  assert.equal(result.averageDailyGrossKurus, 110_100);
  assert.equal(result.dailyGrossBenefitKurus, 44_040);
  assert.equal(result.monthlyGrossBenefitKurus, 1_321_200);
  assert.equal(result.monthlyStampTaxKurus, 10_028);
  assert.equal(result.monthlyNetBenefitKurus, 1_311_172);
  assert.equal(result.statutoryDurationDays, 180);
  assert.equal(result.payableDurationDays, 180);
  assert.equal(result.totalNetBenefitKurus, 7_867_032);
  assert.equal(result.capApplied, false);
  assert.equal(result.eligibilityStatus, 'estimated-eligible');
});

test('high PEK is capped at 80% of 2026 gross minimum wage', () => {
  const result = calculateUnemploymentBenefit({
    months: fullMonths(10_000_000),
    premiumDaysLast3Years: 1080,
    last120DaysUnderContract: true,
    involuntaryUnemployment: true
  });
  assert.equal(result.monthlyGrossBenefitKurus, 2_642_400);
  assert.equal(result.monthlyStampTaxKurus, 20_056);
  assert.equal(result.monthlyNetBenefitKurus, 2_622_344);
  assert.equal(result.capApplied, true);
  assert.equal(result.statutoryDurationDays, 300);
});

test('daily average uses actual PEK premium days across the last four months', () => {
  const result = calculateUnemploymentBenefit({
    months: [
      { pekKurus: 3_303_000, premiumDays: 30 },
      { pekKurus: 2_202_000, premiumDays: 20 },
      { pekKurus: 1_101_000, premiumDays: 10 },
      { pekKurus: 3_303_000, premiumDays: 30 }
    ],
    premiumDaysLast3Years: 900,
    last120DaysUnderContract: true,
    involuntaryUnemployment: true
  });
  assert.equal(result.totalPremiumDaysLast4Months, 90);
  assert.equal(result.totalPekKurus, 9_909_000);
  assert.equal(result.averageDailyGrossKurus, 110_100);
  assert.equal(result.monthlyGrossBenefitKurus, 1_321_200);
  assert.equal(result.statutoryDurationDays, 240);
});

test('late application deducts days after the first 30 days from entitlement', () => {
  const result = calculateUnemploymentBenefit({
    months: fullMonths(3_303_000),
    premiumDaysLast3Years: 600,
    last120DaysUnderContract: true,
    involuntaryUnemployment: true,
    applicationAfterDays: 45
  });
  assert.equal(result.delayedDaysLost, 15);
  assert.equal(result.payableDurationDays, 165);
  assert.match(result.eligibilityReasons.join(' '), /15 gün/);
});

test('basic eligibility status separates failed and unknown conditions from amount calculation', () => {
  const insufficient = calculateUnemploymentBenefit({
    months: fullMonths(3_303_000),
    premiumDaysLast3Years: 599,
    last120DaysUnderContract: true,
    involuntaryUnemployment: true
  });
  assert.equal(insufficient.eligibilityStatus, 'not-eligible');
  assert.equal(insufficient.statutoryDurationDays, 0);
  assert.ok(insufficient.monthlyNetBenefitKurus > 0, 'amount remains visible as a hypothetical amount');

  const unknown = calculateUnemploymentBenefit({
    months: fullMonths(3_303_000),
    premiumDaysLast3Years: 600,
    last120DaysUnderContract: null,
    involuntaryUnemployment: null
  });
  assert.equal(unknown.eligibilityStatus, 'needs-review');
});

test('PEK cannot exist for a month with zero premium days', () => {
  assert.throws(() => calculateUnemploymentBenefit({
    months: [
      { pekKurus: 100_000, premiumDays: 0 },
      { pekKurus: 0, premiumDays: 0 },
      { pekKurus: 0, premiumDays: 0 },
      { pekKurus: 0, premiumDays: 0 }
    ],
    premiumDaysLast3Years: 600
  }), /prim günü 0 ise PEK de 0/);
});
