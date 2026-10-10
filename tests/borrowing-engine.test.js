import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateBorrowing, dailyBounds, DAILY_FLOOR_KURUS, DAILY_CEILING_KURUS } from '../src/borrowing-engine.js';

test('2026 günlük alt ve üst sınır: 1.101 TL ve 9.909 TL', () => {
  assert.equal(DAILY_FLOOR_KURUS, 110_100);
  assert.equal(DAILY_CEILING_KURUS, 990_900);
});

test('askerlik %45: günlük en az 495,45 TL; 540 gün 267.543 TL', () => {
  const b = dailyBounds('askerlik');
  assert.equal(b.minKurus, 49_545);
  assert.equal(b.maxKurus, 445_905);
  assert.equal(calculateBorrowing({ type: 'askerlik', days: 540 }).totalKurus, 26_754_300);
});

test('doğum %32: günlük en az 352,32 TL; bir çocuk 720 gün 253.670,40 TL', () => {
  assert.equal(dailyBounds('dogum').minKurus, 35_232);
  const r = calculateBorrowing({ type: 'dogum', children: 1, days: 720 });
  assert.equal(r.totalKurus, 25_367_040);
  assert.equal(calculateBorrowing({ type: 'dogum', children: 3, days: 720 }).totalDays, 2160);
});

test('işe girişten önceki askerlik başlangıcı geriye çeker ve dönem değişimini gösterir', () => {
  const r = calculateBorrowing({ type: 'askerlik', days: 540, beforeFirstInsurance: true, firstInsuranceDate: '2000-06-01' });
  assert.equal(r.startShift.to, '1998-12-09');
  assert.equal(r.startShift.fromRegime, 'transition');
  assert.equal(r.startShift.toRegime, 'eyt');
});

test('hatalı girdiler reddedilir', () => {
  assert.throws(() => calculateBorrowing({ type: 'x', days: 1 }), /tür/);
  assert.throws(() => calculateBorrowing({ type: 'dogum', children: 4, days: 720 }), /Çocuk/);
  assert.throws(() => calculateBorrowing({ type: 'askerlik', days: 0 }), /süresi/);
  assert.throws(() => calculateBorrowing({ type: 'askerlik', days: 100, dailyPekKurus: 50_000 }), /sınır/);
});
