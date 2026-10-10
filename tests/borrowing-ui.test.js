import test from 'node:test';
import assert from 'node:assert/strict';
import { compute, shiftText } from '../src/borrowing-calculator.js';

test('askerlik: boş kazanç en düşük tutarı kullanır, başlangıç kayması yazılır', () => {
  const r = compute({ type: 'askerlik', days: '540', pek: '', before: true, first: '2000-06-01' });
  assert.equal(r.totalKurus, 26_754_300);
  assert.match(shiftText(r), /EYT kapsamı/);
});

test('doğum: 2 çocuk 720 gün, başlangıç değişmez', () => {
  const r = compute({ type: 'dogum', dogumDays: '720', children: '2', pek: '' });
  assert.equal(r.totalDays, 1440);
  assert.match(shiftText(r), /Değişmez/);
});

test('boş gün hata verir', () => {
  assert.throws(() => compute({ type: 'askerlik', days: '', pek: '' }), /süresi/);
});
