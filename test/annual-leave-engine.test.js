import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateAnnualLeavePay } from '../src/annual-leave-engine.js';

test('60k last gross and 10 unused days produces 20k gross leave pay', () => {
  const result = calculateAnnualLeavePay({
    lastMonthlyGrossKurus: 6_000_000,
    unusedLeaveDays: 10,
    terminationMonthGrossKurus: 6_000_000,
    terminationMonthPremiumDays: 30,
    monthNumber: 1
  });
  assert.equal(result.dailyGrossKurus, 200_000);
  assert.equal(result.leaveGrossKurus, 2_000_000);
  assert.equal(result.incrementalSocialKurus, 280_000);
  assert.equal(result.incrementalUnemploymentKurus, 20_000);
  assert.equal(result.incrementalIncomeTaxKurus, 255_000);
  assert.equal(result.incrementalStampTaxKurus, 15_180);
  assert.equal(result.leaveNetKurus, 1_429_820);
});

test('leave pay net effect follows cumulative income tax base', () => {
  const january = calculateAnnualLeavePay({
    lastMonthlyGrossKurus: 6_000_000,
    unusedLeaveDays: 10,
    terminationMonthGrossKurus: 6_000_000,
    terminationMonthPremiumDays: 30,
    monthNumber: 1,
    previousCumulativeTaxBaseKurus: 0
  });
  const september = calculateAnnualLeavePay({
    lastMonthlyGrossKurus: 6_000_000,
    unusedLeaveDays: 10,
    terminationMonthGrossKurus: 6_000_000,
    terminationMonthPremiumDays: 30,
    monthNumber: 9,
    previousCumulativeTaxBaseKurus: 40_000_000
  });
  assert.equal(january.leaveGrossKurus, september.leaveGrossKurus);
  assert.ok(september.incrementalIncomeTaxKurus > january.incrementalIncomeTaxKurus);
  assert.ok(september.leaveNetKurus < january.leaveNetKurus);
});

test('termination-month premium days scale the SGK ceiling', () => {
  const result = calculateAnnualLeavePay({
    lastMonthlyGrossKurus: 30_000_000,
    unusedLeaveDays: 10,
    terminationMonthGrossKurus: 25_000_000,
    terminationMonthPremiumDays: 20,
    monthNumber: 1
  });
  assert.equal(result.sgkCeilingKurus, 19_818_000);
  assert.equal(result.basePayroll.sgkBaseKurus, 19_818_000);
  assert.equal(result.withLeavePayroll.sgkBaseKurus, 19_818_000);
  assert.equal(result.incrementalSocialKurus, 0);
  assert.equal(result.incrementalUnemploymentKurus, 0);
});

test('unused leave day count and premium days are validated', () => {
  assert.throws(() => calculateAnnualLeavePay({
    lastMonthlyGrossKurus: 6_000_000,
    unusedLeaveDays: 0,
    terminationMonthPremiumDays: 30,
    monthNumber: 1
  }), /Kullanılmayan izin günü/);
  assert.throws(() => calculateAnnualLeavePay({
    lastMonthlyGrossKurus: 6_000_000,
    unusedLeaveDays: 10,
    terminationMonthPremiumDays: 31,
    monthNumber: 1
  }), /Fesih ayı prim günü/);
});
