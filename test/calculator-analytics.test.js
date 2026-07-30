import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildCalculatorEvent, getSalaryRange } from '../src/calculator-analytics.js';

test('salary amounts are converted to stable 2026 analytics ranges', () => {
  assert.equal(getSalaryRange(0), '0_29k');
  assert.equal(getSalaryRange(29999), '0_29k');
  assert.equal(getSalaryRange(30000), '30k_39k');
  assert.equal(getSalaryRange(100000), '100k_124k');
  assert.equal(getSalaryRange(124999), '100k_124k');
  assert.equal(getSalaryRange(500000), '500k_plus');
  assert.equal(getSalaryRange(-1), undefined);
  assert.equal(getSalaryRange(Number.NaN), undefined);
});

test('calculator analytics keeps only allowlisted non-raw parameters', () => {
  assert.deepEqual(
    buildCalculatorEvent('salary_calculation_completed', {
      calculation_direction: 'gross',
      calculation_year: 2026,
      salary_range: '100k_124k',
      scenario_type: 'standard',
      input_method: 'typed',
      salary: 100000,
      annual_income: 1200000,
      retired: true
    }),
    {
      eventName: 'salary_calculation_completed',
      parameters: {
        calculation_direction: 'gross',
        scenario_type: 'standard',
        input_method: 'typed',
        salary_range: '100k_124k',
        range_version: '2026_v1',
        calculation_year: 2026
      }
    }
  );

  assert.deepEqual(
    buildCalculatorEvent('scenario_modified', {
      calculation_direction: 'gross',
      scenario_type: 'salary_change',
      month_number: 7,
      override_type: 'base_salary',
      amount: 150000
    }),
    {
      eventName: 'scenario_modified',
      parameters: {
        calculation_direction: 'gross',
        scenario_type: 'salary_change',
        month_number: 7,
        override_type: 'base_salary'
      }
    }
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

test('analytics transport never sends raw salary parameter names', async () => {
  const source = await readFile(new URL('../src/calculator-analytics.js', import.meta.url), 'utf8');
  for (const forbiddenEventParameter of [
    'annual_income:', 'gross_salary:', 'net_salary:', 'salary_value:', 'raw_salary:'
  ]) {
    assert.doesNotMatch(source, new RegExp(forbiddenEventParameter, 'i'));
  }
});
