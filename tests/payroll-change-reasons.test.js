import test from 'node:test';
import assert from 'node:assert/strict';

import { calculatePayrollYear, tlToKurus } from '../src/payroll-engine.js';
import {
  getPayrollChangeReasons,
  PAYROLL_CHANGE_REASON_TEXT
} from '../src/payroll-change-reasons.js';

test('100.000 TL sabit brütte ilk düşüşü Mart, ilk yükselişi Temmuz olarak etiketler', () => {
  const rows = calculatePayrollYear({
    baseGrossKurusByMonth: Array(12).fill(tlToKurus(100000))
  });
  const reasons = getPayrollChangeReasons(rows);

  assert.equal(reasons.get(2)?.type, 'decrease');
  assert.equal(reasons.get(2)?.text, PAYROLL_CHANGE_REASON_TEXT.decrease);
  assert.equal(reasons.get(6)?.type, 'increase');
  assert.equal(reasons.get(6)?.text, PAYROLL_CHANGE_REASON_TEXT.increase);
  assert.equal(reasons.size, 2);
});

test('brüt maaş değişmişse vergi kaynaklı yön değişimi etiketi üretmez', () => {
  const rows = calculatePayrollYear({
    baseGrossKurusByMonth: [
      ...Array(6).fill(tlToKurus(100000)),
      ...Array(6).fill(tlToKurus(150000))
    ]
  });
  const reasons = getPayrollChangeReasons(rows);

  assert.equal(reasons.has(6), false);
});
