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
  return `${value.toFixed(2)} ₺`;
}

function formatInputMoney(value) {
  return String(value);
}

test('mobil bordro dört ana sütun ve detay satırı üretir', () => {
  const html = renderMobilePayrollRows({
    payrolls,
    months,
    currentMode: 'gross',
    openDetails,
    formatCurrency,
    formatInputMoney,
    renderPayrollDetail: () => '<div>Vergi detayı</div>'
  });

  assert.match(html, /Ocak/);
  assert.match(html, /100000/);
  assert.match(html, /75953\.02 ₺/);
  assert.match(html, /Detay|Kapat/);
  assert.match(html, /colspan="4"/);
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
