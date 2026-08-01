import test from 'node:test';
import assert from 'node:assert/strict';
import { runPayrollAudit } from '../src/payroll-audit.js';

test('açık bordro test raporundaki tüm sınır senaryoları geçer', () => {
  const audit = runPayrollAudit();
  const failures = audit.cases
    .filter((item) => item.status !== 'passed')
    .map((item) => `${item.id}: ${item.details.join(' ')}`);

  assert.equal(audit.calculationYear, 2026);
  assert.equal(audit.failed, 0, failures.join('\n'));
  assert.equal(audit.passed, audit.total);
});

test('test raporu istenen beş çekirdek alanı kapsar', () => {
  const categories = new Set(runPayrollAudit().cases.map((item) => item.category));

  for (const category of ['Vergi dilimleri', 'SGK tavanı', 'Asgari ücret', 'Engellilik indirimi', 'Yuvarlama']) {
    assert.ok(categories.has(category), `Eksik test kategorisi: ${category}`);
  }
});
