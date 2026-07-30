import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildCalculatorEvent } from '../src/calculator-analytics.js';

test('calculator analytics keeps only non-financial allowlisted parameters', () => {
  assert.deepEqual(
    buildCalculatorEvent('calculator_submit', {
      calculator_mode: 'gross',
      salary: 100000,
      annual_income: 1200000,
      retired: true,
      disability_degree: 1
    }),
    { eventName: 'calculator_submit', parameters: { calculator_mode: 'gross' } }
  );

  assert.deepEqual(
    buildCalculatorEvent('calculator_monthly_override', {
      month_number: 7,
      override_type: 'base_salary',
      amount: 150000
    }),
    { eventName: 'calculator_monthly_override', parameters: { month_number: 7, override_type: 'base_salary' } }
  );

  assert.deepEqual(
    buildCalculatorEvent('payroll_detail_toggle', {
      month_number: 13,
      detail_action: 'open',
      net_salary: 99999
    }),
    { eventName: 'payroll_detail_toggle', parameters: { detail_action: 'open' } }
  );

  assert.equal(buildCalculatorEvent('unknown_event', { salary: 100000 }), null);
});

test('calculator analytics source never reads salary or sensitive option values', async () => {
  const source = await readFile(new URL('../src/calculator-analytics.js', import.meta.url), 'utf8');
  for (const forbidden of [
    '.value', 'dataset.rawValue', 'parseTurkishMoney', 'grossKurus', 'netKurus',
    'salaryValue', 'retired', 'disability', 'employerScheme', 'check-retired', 'select-disability'
  ]) assert.doesNotMatch(source, new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
});
