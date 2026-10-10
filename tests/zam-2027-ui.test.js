import test from 'node:test';
import assert from 'node:assert/strict';
import { compute, parsePercent, basisText } from '../src/zam-2027-calculator.js';

test('Türkçe tutar ve yüzde biçimleri okunur', () => {
  assert.equal(parsePercent('1,5'), 1.5);
  assert.equal(parsePercent('%2'), 2);
  const r = compute('emekli', { amountText: '23.552', scenario: '2', customText: '' });
  assert.equal(r.currentKurus, 2_355_200);
  assert.equal(r.raisePct, 12.02);
});

test('özel varsayım boşsa anlaşılır hata verir', () => {
  assert.throws(() => compute('memur', { amountText: '70.257', scenario: 'custom', customText: '' }), /varsayım/);
});

test('memur dayanak metni farkı ve toplu sözleşmeyi gösterir', () => {
  const r = compute('memur', { amountText: '70.257', scenario: '2', customText: '' });
  assert.match(basisText('memur', r), /enflasyon farkı .* toplu sözleşme %5/);
});
