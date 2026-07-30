import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  buildCalculatorEvent,
  getEffectiveDeductionRange,
  getSalaryRange
} from '../src/calculator-analytics.js';

test('salary amounts are converted to stable 2026 analytics ranges', () => {
  assert.equal(getSalaryRange(0), 'under_30k');
  assert.equal(getSalaryRange(29999), 'under_30k');
  assert.equal(getSalaryRange(30000), '30k_49k');
  assert.equal(getSalaryRange(100000), '100k_124k');
  assert.equal(getSalaryRange(124999), '100k_124k');
  assert.equal(getSalaryRange(225000), '200k_249k');
  assert.equal(getSalaryRange(349999), '250k_349k');
  assert.equal(getSalaryRange(500000), '500k_plus');
  assert.equal(getSalaryRange(-1), undefined);
  assert.equal(getSalaryRange(Number.NaN), undefined);
});

test('effective deduction percentages are converted to stable ranges', () => {
  assert.equal(getEffectiveDeductionRange(19.9), 'under_20');
  assert.equal(getEffectiveDeductionRange(20), '20_24');
  assert.equal(getEffectiveDeductionRange(29.9), '25_29');
  assert.equal(getEffectiveDeductionRange(40), '40_plus');
  assert.equal(getEffectiveDeductionRange(-1), undefined);
});

test('calculator analytics keeps only allowlisted non-raw parameters', () => {
  assert.deepEqual(
    buildCalculatorEvent('salary_calculation_completed', {
      calculation_direction: 'gross',
      calculation_year: 2026,
      salary_range: '100k_124k',
      scenario_type: 'salary_change',
      input_method: 'typed',
      salary_change_count: '1',
      has_salary_change: true,
      has_employer_change: false,
      start_month: 'july',
      result_tax_bracket: '27',
      effective_deduction_range: '25_29',
      salary: 100000,
      annual_income: 1200000,
      retired: true
    }),
    {
      eventName: 'salary_calculation_completed',
      parameters: {
        calculation_direction: 'gross',
        scenario_type: 'salary_change',
        input_method: 'typed',
        salary_range: '100k_124k',
        range_version: '2026_v2',
        calculation_year: 2026,
        salary_change_count: '1',
        has_salary_change: true,
        has_employer_change: false,
        start_month: 'july',
        result_tax_bracket: '27',
        effective_deduction_range: '25_29'
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
