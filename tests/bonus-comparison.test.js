import test from 'node:test';
import assert from 'node:assert/strict';
import { createBonusComparison, bonusComparisonTable } from '../scripts/bonus-comparison.js';
test('Nisan primi ödeme ayı netini artırır, Mayıs netini azaltır ve yıllık fark uzlaşır', () => {
  const data = createBonusComparison(3);
  assert.equal(data.paymentDelta, 3362050);
  assert.equal(data.differences[4], -297500);
  assert.equal(data.annualDelta, 3064550);
  assert.equal(data.paymentDelta + data.laterDelta, data.annualDelta);
  assert.deepEqual(data.differences.slice(0,3), [0,0,0]);
});
test('Haziran primi sonraki ayların netini değiştirmez; karşılaştırma 12 ayı içerir', () => {
  const data = createBonusComparison(5);
  assert.equal(data.paymentDelta, 3064550);
  assert.equal(data.annualNet, 86452713);
  assert.deepEqual(data.differences.slice(6), [0,0,0,0,0,0]);
  assert.equal((bonusComparisonTable(data).match(/scope="row"/g)||[]).length,12);
  assert.throws(()=>createBonusComparison(12), RangeError);
});
