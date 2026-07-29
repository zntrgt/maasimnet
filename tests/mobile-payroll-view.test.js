import test from 'node:test';
import assert from 'node:assert/strict';

import { renderMobilePayrollRows } from '../src/mobile-payroll-view.js';

const payrolls = [
  {
    month: 0,
    baseGross: 100000,
    extraGross: 5000,
    net: 75953.02
  }
];

const months = ['Ocak'];
const openDetails = new Set([0]);

function formatCurrency(value) {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value) + ' ₺';
}

function formatInputMoney(value) {
  return new Intl.NumberFormat('tr-TR', {
    maximumFractionDigits: 2
  }).format(value);
}

test('mobil bordro dört ana sütun, canlı formatlı input ve detay satırı üretir', () => {
  const html = renderMobilePayrollRows({
    payrolls,
    months,
    currentMode: 'gross',
    openDetails,
    formatCurrency,
    formatInputMoney,
    renderPayrollDetail: () => '<div>Vergi detayı</div>',
    changeReasons: new Map([[0, { type: 'increase', text: 'Açıklama' }]]),
    renderPayrollChangeReason: (reason, columns) => `<tr><td colspan="${columns}">${reason.text}</td></tr>`
  });

  assert.match(html, /Ocak/);
  assert.match(html, /value="100\.000"/);
  assert.match(html, /data-raw-value="100000"/);
  assert.match(html, /inputmode="decimal"/);
  assert.match(html, /oninput="formatMoneyInputElement\(this\)"/);
  assert.match(html, /75\.953,02 ₺/);
  assert.match(html, /colspan="4"/);
  assert.match(html, /Açıklama/);
  assert.match(html, /Ek Brüt/);
  assert.match(html, /Vergi detayı/);
});

test('netten brüte modunda brüt ve ek brüt alanları düzenlenemez', () => {
  const html = renderMobilePayrollRows({
    payrolls,
    months,
    currentMode: 'net',
    openDetails: new Set(),
    formatCurrency,
    formatInputMoney,
    renderPayrollDetail: () => ''
  });

  const disabledCount = (html.match(/disabled/g) || []).length;
  assert.equal(disabledCount, 2);
});
