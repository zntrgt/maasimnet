import test from 'node:test';
import assert from 'node:assert/strict';
import { compute, agreedText } from '../src/rent-calculator.js';

test('Türkçe tutar ve virgüllü oran okunur; tavan aşımı yazılır', () => {
  const r = compute({ currentText: '20.000', renewal: '2026-10', agreedText: '40,5' });
  assert.equal(r.maxKurus, 2_629_800);
  assert.match(agreedText(r), /tavanı aşıyor/);
});

test('istenen oran boşsa "Girilmedi"', () => {
  assert.equal(agreedText(compute({ currentText: '15.000', renewal: '2026-09', agreedText: '' })), 'Girilmedi');
});

test('tabloda olmayan ay için elle oran girilebilir', () => {
  const r = compute({ currentText: '10.000', renewal: 'custom', agreedText: '', customCapText: '34,88' });
  assert.equal(r.maxKurus, 1_348_800);
  assert.throws(() => compute({ currentText: '10.000', renewal: 'custom', agreedText: '', customCapText: '' }), /TÜİK/);
});
