import test from 'node:test';
import assert from 'node:assert/strict';
import { MIN_PENSION_HISTORY, historyRows, latestMinPension, minPensionOutlook } from '../src/min-pension-engine.js';
import { MIN_PENSION_KURUS, emekliZam } from '../src/zam-2027-engine.js';
import { compute, noteText } from '../src/min-pension-calculator.js';

test('tarihçenin son satırı zam motorundaki güncel tabanla aynı', () => {
  assert.equal(latestMinPension().kurus, MIN_PENSION_KURUS);
  const periods = MIN_PENSION_HISTORY.map((r) => r.period);
  assert.deepEqual(periods, [...periods].sort());
});

test('Temmuz 2026 tabanı 20.000 TL × %17,76; 2025 artışları zam oranıyla aynı', () => {
  assert.equal(Math.round(2_000_000 * 1.1776), 2_355_200);
  const rows = historyRows();
  assert.deepEqual(rows.map((r) => r.relation), ['below', 'above', 'same', 'same', 'above', 'same']);
  assert.equal(rows[4].floorPct, 18.48);
});

test('taban zam oranında artarsa taban altındaki emekli tabanı alır', () => {
  const r = minPensionOutlook({ kokKurus: 1_500_000, assumedMonthlyPct: 1.5, floorMode: 'indexed' });
  const z = emekliZam({ currentKurus: MIN_PENSION_KURUS, assumedMonthlyPct: 1.5 });
  assert.equal(r.paymentKurus, z.minPensionScenarioKurus);
  assert.equal(r.topUpKurus, r.paymentKurus - r.newKokKurus);
  assert.equal(r.onFloorAfter, true);
  assert.match(noteText(r), /taban da zam oranında/);
});

test('taban değişmezse taban altındaki emeklinin ödemesi aynı kalır', () => {
  const r = minPensionOutlook({ kokKurus: 1_500_000, assumedMonthlyPct: 1.5, floorMode: 'same' });
  assert.equal(r.paymentKurus, MIN_PENSION_KURUS);
  assert.equal(r.increaseKurus, 0);
  assert.match(noteText(r), /aynı kalır/);
});

test('kökü tabanı geçen emekli artık destek almaz; tabanın üstündeki tam zam alır', () => {
  const crossing = minPensionOutlook({ kokKurus: 2_200_000, assumedMonthlyPct: 1.5, floorMode: 'same' });
  assert.equal(crossing.topUpKurus, 0);
  assert.equal(crossing.paymentKurus, crossing.newKokKurus);
  assert.ok(crossing.effectivePct < crossing.raisePct);
  const above = minPensionOutlook({ kokKurus: 3_000_000, assumedMonthlyPct: 1.5 });
  assert.equal(above.effectivePct, above.raisePct);
  assert.match(noteText(above), /tamamı/);
});

test('arayüz: Türkçe tutar ve özel taban okunur, hatalı girdi reddedilir', () => {
  const r = compute({ kokText: '15.000', scenario: '1,5'.replace(',', '.'), floorMode: 'custom', customFloor: '27.000' });
  assert.equal(r.floorKurus, 2_700_000);
  assert.equal(r.paymentKurus, 2_700_000);
  assert.throws(() => compute({ kokText: '', scenario: '1.5', floorMode: 'same' }), /Kök/);
  assert.throws(() => compute({ kokText: '15.000', scenario: 'custom', customMonthly: '', floorMode: 'same' }), /varsayım/);
});

test('dul/yetim: taban dosyaya uygulanır, sonra hisseye bölünür', () => {
  const r = minPensionOutlook({ kokKurus: 1_125_000, assumedMonthlyPct: 1.5, floorMode: 'same', sharePct: 75 });
  assert.equal(r.fileKokKurus, 1_500_000);
  assert.equal(r.currentPaymentKurus, 1_766_400);
  assert.equal(r.paymentKurus, 1_766_400);
  assert.equal(r.increaseKurus, 0);
  assert.equal(compute({ kokText: '11.250', scenario: '1.5', floorMode: 'same', share: '75' }).paymentKurus, 1_766_400);
  assert.throws(() => minPensionOutlook({ kokKurus: 1_000_000, sharePct: 0 }), /Hisse/);
  assert.equal(minPensionOutlook({ kokKurus: 1_500_000, assumedMonthlyPct: 1.5 }).sharePct, 100);
});
