import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateSalaryRaise } from '../src/salary-raise-engine.js';

test('50,000 TL with 30 percent raise becomes 65,000 TL', () => {
  const result = calculateSalaryRaise({ mode: 'new_salary', oldSalaryKurus: 5_000_000, rateBasisPoints: 3_000 });
  assert.equal(result.newSalaryKurus, 6_500_000);
  assert.equal(result.differenceKurus, 1_500_000);
  assert.equal(result.annualDifferenceKurus, 18_000_000);
  assert.equal(result.rateBasisPoints, 3_000);
  assert.equal(result.direction, 'increase');
});

test('40,000 TL to 50,000 TL equals 25 percent increase', () => {
  const result = calculateSalaryRaise({ mode: 'rate', oldSalaryKurus: 4_000_000, newSalaryKurus: 5_000_000 });
  assert.equal(result.rateBasisPoints, 2_500);
  assert.equal(result.differenceKurus, 1_000_000);
  assert.equal(result.direction, 'increase');
});

test('65,000 TL after 30 percent raise resolves to 50,000 TL old salary', () => {
  const result = calculateSalaryRaise({ mode: 'old_salary', newSalaryKurus: 6_500_000, rateBasisPoints: 3_000 });
  assert.equal(result.oldSalaryKurus, 5_000_000);
  assert.equal(result.newSalaryKurus, 6_500_000);
});

test('calculator supports decreases and zero change', () => {
  const decrease = calculateSalaryRaise({ mode: 'rate', oldSalaryKurus: 5_000_000, newSalaryKurus: 4_500_000 });
  assert.equal(decrease.rateBasisPoints, -1_000);
  assert.equal(decrease.direction, 'decrease');
  const same = calculateSalaryRaise({ mode: 'rate', oldSalaryKurus: 5_000_000, newSalaryKurus: 5_000_000 });
  assert.equal(same.rateBasisPoints, 0);
  assert.equal(same.direction, 'same');
});

test('rate is rounded deterministically to one basis point', () => {
  const result = calculateSalaryRaise({ mode: 'rate', oldSalaryKurus: 3_000_000, newSalaryKurus: 3_333_333 });
  assert.equal(result.rateBasisPoints, 1_111);
});

test('invalid modes and impossible rate ranges are rejected', () => {
  assert.throws(() => calculateSalaryRaise({ mode: 'nope' }), /Geçersiz hesaplama modu/);
  assert.throws(() => calculateSalaryRaise({ mode: 'new_salary', oldSalaryKurus: 5_000_000, rateBasisPoints: -10_000 }), /oranı/);
  assert.throws(() => calculateSalaryRaise({ mode: 'rate', oldSalaryKurus: 0, newSalaryKurus: 5_000_000 }), /Eski maaş/);
});
