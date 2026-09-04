import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateMinimumWage2026 } from '../src/minimum-wage-engine.js';

test('2026 official monthly minimum wage breakdown matches the ministry reference', () => {
  const result = calculateMinimumWage2026({ months: 1 });
  assert.equal(result.monthlyGrossKurus, 3_303_000);
  assert.equal(result.employeeSgkKurus, 462_420);
  assert.equal(result.employeeUnemploymentKurus, 33_030);
  assert.equal(result.incomeTaxKurus, 0);
  assert.equal(result.stampTaxKurus, 0);
  assert.equal(result.monthlyNetKurus, 2_807_550);
});

test('daily and hourly 2026 minimum wage equivalents are deterministic', () => {
  const result = calculateMinimumWage2026();
  assert.equal(result.dailyGrossKurus, 110_100);
  assert.equal(result.dailyNetKurus, 93_585);
  assert.equal(result.hourlyGrossKurus, 14_680);
  assert.equal(result.hourlyNetKurus, 12_478);
});

test('selected month count scales gross and net totals without changing monthly values', () => {
  const result = calculateMinimumWage2026({ months: 12 });
  assert.equal(result.periodGrossKurus, 39_636_000);
  assert.equal(result.periodNetKurus, 33_690_600);
  assert.equal(result.monthlyGrossKurus, 3_303_000);
  assert.equal(result.monthlyNetKurus, 2_807_550);
});

test('month count must stay between one and twelve', () => {
  assert.throws(() => calculateMinimumWage2026({ months: 0 }), /Ay sayısı/);
  assert.throws(() => calculateMinimumWage2026({ months: 13 }), /Ay sayısı/);
});
