import test from 'node:test';
import assert from 'node:assert/strict';

import {
  formatTurkishMoney,
  normalizeTurkishMoneyInput,
  parseTurkishMoney
} from '../src/money-input.js';

test('tr-TR para girişlerini tek sayısal değere normalize eder', () => {
  assert.equal(parseTurkishMoney('100000'), 100000);
  assert.equal(parseTurkishMoney('100.000'), 100000);
  assert.equal(parseTurkishMoney('100.000,00'), 100000);
  assert.equal(parseTurkishMoney('12.345,67 ₺'), 12345.67);
});

test('binlik ayraçlı canlı input görünümü üretir', () => {
  assert.deepEqual(normalizeTurkishMoneyInput('100000'), {
    displayValue: '100.000',
    numericValue: 100000
  });
  assert.deepEqual(normalizeTurkishMoneyInput('100.000,00'), {
    displayValue: '100.000,00',
    numericValue: 100000
  });
  assert.equal(formatTurkishMoney(100000), '100.000');
  assert.equal(formatTurkishMoney(12345.67), '12.345,67');
});
