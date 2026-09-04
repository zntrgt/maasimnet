import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateOvertimePay } from '../src/overtime-engine.js';

test('60k monthly gross and 10 hours statutory overtime produces 4k gross overtime', () => {
  const result = calculateOvertimePay({
    monthlyGrossKurus: 6_000_000,
    overtime50Minutes: 600,
    monthNumber: 1
  });
  assert.equal(result.regularHourlyGrossKurus, 26_667);
  assert.equal(result.overtime50GrossKurus, 400_000);
  assert.equal(result.extraTime25GrossKurus, 0);
  assert.equal(result.overtimeGrossKurus, 400_000);
  assert.equal(result.incrementalSocialKurus, 56_000);
  assert.equal(result.incrementalUnemploymentKurus, 4_000);
  assert.equal(result.incrementalIncomeTaxKurus, 51_000);
  assert.equal(result.incrementalStampTaxKurus, 3_036);
  assert.equal(result.overtimeNetKurus, 285_964);
});

test('40-hour contract scenario can combine 5 hours at 25% and 2 hours at 50%', () => {
  const result = calculateOvertimePay({
    monthlyGrossKurus: 6_000_000,
    overtime50Minutes: 120,
    extraTime25Minutes: 300,
    monthNumber: 1
  });
  assert.equal(result.overtime50GrossKurus, 80_000);
  assert.equal(result.extraTime25GrossKurus, 166_667);
  assert.equal(result.overtimeGrossKurus, 246_667);
  assert.equal(result.overtimeNetKurus, 176_345);
  assert.equal(result.overtime50TimeOffMinutes, 180);
  assert.equal(result.extraTime25TimeOffMinutes, 375);
});

test('net overtime effect respects the cumulative income tax base', () => {
  const january = calculateOvertimePay({
    monthlyGrossKurus: 6_000_000,
    overtime50Minutes: 600,
    monthNumber: 1,
    previousCumulativeTaxBaseKurus: 0
  });
  const september = calculateOvertimePay({
    monthlyGrossKurus: 6_000_000,
    overtime50Minutes: 600,
    monthNumber: 9,
    previousCumulativeTaxBaseKurus: 40_000_000
  });
  assert.equal(january.overtimeGrossKurus, september.overtimeGrossKurus);
  assert.equal(september.incrementalIncomeTaxKurus, 91_800);
  assert.equal(september.overtimeNetKurus, 245_164);
  assert.ok(september.overtimeNetKurus < january.overtimeNetKurus);
});

test('SGK ceiling prevents extra social security deduction above the ceiling', () => {
  const result = calculateOvertimePay({
    monthlyGrossKurus: 30_000_000,
    overtime50Minutes: 600,
    monthNumber: 1
  });
  assert.equal(result.overtimeGrossKurus, 2_000_000);
  assert.equal(result.incrementalSocialKurus, 0);
  assert.equal(result.incrementalUnemploymentKurus, 0);
  assert.equal(result.overtimeNetKurus, 1_584_820);
});

test('optional contractual hourly rate overrides the 225-hour monthly divisor', () => {
  const result = calculateOvertimePay({
    monthlyGrossKurus: 6_000_000,
    hourlyGrossOverrideKurus: 30_000,
    overtime50Minutes: 120,
    monthNumber: 1
  });
  assert.equal(result.regularHourlyGrossKurus, 30_000);
  assert.equal(result.hourlyGrossOverrideApplied, true);
  assert.equal(result.overtime50GrossKurus, 90_000);
});

test('annual 270-hour statutory overtime limit is surfaced without changing earned pay', () => {
  const result = calculateOvertimePay({
    monthlyGrossKurus: 6_000_000,
    overtime50Minutes: 600,
    overtime50MinutesYearToDate: 16_000,
    monthNumber: 1
  });
  assert.equal(result.annualLimitMinutes, 16_200);
  assert.equal(result.overtime50MinutesAfter, 16_600);
  assert.equal(result.annualLimitExceeded, true);
  assert.equal(result.annualRemainingMinutes, 0);
  assert.equal(result.overtime50GrossKurus, 400_000, '270-hour limit does not erase pay already earned');
});

test('overtime inputs use half-hour increments to match statutory rounding workflow', () => {
  assert.throws(() => calculateOvertimePay({
    monthlyGrossKurus: 6_000_000,
    overtime50Minutes: 20,
    monthNumber: 1
  }), /30 dakikalık adımlarla/);
});
