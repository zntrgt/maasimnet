import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePublicHolidayPay,
  calculateWeeklyRestPay,
  calculatePartTimePay,
  calculatePartialMonthPay,
  calculateSgkPremium,
  get2026DailyPekLimits
} from '../src/worktime-engines.js';

const tl = (value) => Math.round(value * 100);

test('60k monthly gross and one public holiday worked adds one daily wage', () => {
  const result = calculatePublicHolidayPay({ monthlyGrossKurus: tl(60_000), halfDayUnitsWorked: 2 });
  assert.equal(result.dailyGrossKurus, tl(2_000));
  assert.equal(result.extraGrossKurus, tl(2_000));
  assert.equal(result.grossWithExtraKurus, tl(62_000));
  assert.ok(result.extraNetKurus > 0);
});

test('60k monthly gross and one weekly rest day worked adds 1.5 daily wage', () => {
  const result = calculateWeeklyRestPay({ monthlyGrossKurus: tl(60_000), restDaysWorked: 1 });
  assert.equal(result.dailyGrossKurus, tl(2_000));
  assert.equal(result.extraGrossKurus, tl(3_000));
  assert.equal(result.grossWithExtraKurus, tl(63_000));
});

test('part-time salary is proportional to comparable full-time wage and premium days round up', () => {
  const result = calculatePartTimePay({
    fullTimeEquivalentGrossKurus: tl(90_000),
    weeklyHours: 30,
    fullTimeWeeklyHours: 45,
    monthlyWorkedHours: 120
  });
  assert.equal(result.grossKurus, tl(60_000));
  assert.equal(result.premiumDays, 16);
  assert.equal(result.ratio, 2 / 3);
  assert.ok(result.netKurus > 0);
});

test('partial-month pay uses 30-day divisor', () => {
  const result = calculatePartialMonthPay({ normalMonthlyGrossKurus: tl(90_000), paidDays: 17 });
  assert.equal(result.dailyGrossKurus, tl(3_000));
  assert.equal(result.grossKurus, tl(51_000));
  assert.equal(result.missingDays, 13);
});

test('2026 SGK daily PEK limits are 1,101 and 9,909 TL', () => {
  const limits = get2026DailyPekLimits();
  assert.equal(limits.minimumDailyKurus, tl(1_101));
  assert.equal(limits.maximumDailyKurus, tl(9_909));
});

test('100k PEK for 30 days uses current normal employee and other-sector rates', () => {
  const result = calculateSgkPremium({ pekKurus: tl(100_000), premiumDays: 30, employerScheme: 'other' });
  assert.equal(result.employeeSgkKurus, tl(14_000));
  assert.equal(result.employeeUnemploymentKurus, tl(1_000));
  assert.equal(result.employerSgkOrSgdpKurus, tl(19_750));
  assert.equal(result.employerUnemploymentKurus, tl(2_000));
  assert.equal(result.employeeTotalKurus, tl(15_000));
  assert.equal(result.employerTotalKurus, tl(21_750));
  assert.equal(result.totalPremiumKurus, tl(36_750));
});

test('SGK PEK must respect premium-day scaled 2026 floor and ceiling', () => {
  assert.throws(() => calculateSgkPremium({ pekKurus: tl(10_000), premiumDays: 10 }), /alt ve üst sınırları/);
  assert.throws(() => calculateSgkPremium({ pekKurus: tl(100_000), premiumDays: 10 }), /alt ve üst sınırları/);
  const result = calculateSgkPremium({ pekKurus: tl(50_000), premiumDays: 10 });
  assert.equal(result.minimumPekKurus, tl(11_010));
  assert.equal(result.maximumPekKurus, tl(99_090));
});
