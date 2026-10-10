import test from 'node:test';
import assert from 'node:assert/strict';
import { KNOWN_MONTHS, knownCumulativePct, sixMonthInflationPct, emekliZam, memurZam, impliedMonthlyPct, scenarioPresets, MIN_PENSION_KURUS } from '../src/zam-2027-engine.js';

test('Temmuz–Eylül kesinleşen kümülatif enflasyon %5,56', () => {
  assert.equal(Math.round(knownCumulativePct() * 100) / 100, 5.56);
});

test('kalan 3 ay %0 ise 6 aylık enflasyon kesinleşen 3 aya eşittir', () => {
  assert.equal(Math.round(sixMonthInflationPct(0) * 100) / 100, 5.56);
});

test('emekli zammı 6 aylık enflasyona eşittir ve tutara uygulanır', () => {
  const r = emekliZam({ currentKurus: 2_355_200, assumedMonthlyPct: 2 });
  // 1.0178*1.0184*1.0184*1.02^3 - 1
  assert.equal(r.raisePct, 12.02);
  assert.equal(r.newKurus, Math.round(2_355_200 * 1.1202));
  assert.equal(r.minPensionScenarioKurus, Math.round(MIN_PENSION_KURUS * 1.1202));
});

test('memur zammı: enflasyon farkı 7% üzerini, sonra 2027 ilk yarı %5 toplu sözleşme', () => {
  const r = memurZam({ currentKurus: 7_025_700, assumedMonthlyPct: 2 });
  assert.equal(r.farkPct, Math.round(((1.1202 / 1.07) - 1) * 10000) / 100);
  assert.equal(r.raisePct, Math.round(((1 + r.farkPct / 100) * 1.05 - 1) * 10000) / 100);
});

test('6 aylık enflasyon %7 altında kalırsa memur farkı sıfır, zam %5', () => {
  const r = memurZam({ currentKurus: 5_000_000, assumedMonthlyPct: 0 });
  assert.equal(r.farkPct, 0);
  assert.equal(r.raisePct, 5);
});

test('yıl sonu tahmininden ima edilen aylık oran tutarlı', () => {
  const m = impliedMonthlyPct(28);
  const ytd = 1.1776 * (1 + knownCumulativePct() / 100);
  assert.ok(Math.abs(ytd - 1.2432) < 0.0005, 'Ocak–Haziran + bilinen aylar TÜİK Ocak–Eylül değeriyle uyumlu');
  const yearEnd = (ytd * Math.pow(1 + m / 100, 3) - 1) * 100;
  assert.ok(Math.abs(yearEnd - 28) < 1e-9);
  assert.equal(scenarioPresets().length, 3);
});

test('hatalı girdiler reddedilir', () => {
  assert.throws(() => emekliZam({ currentKurus: 0, assumedMonthlyPct: 1 }), /tutar/);
  assert.throws(() => emekliZam({ currentKurus: 100, assumedMonthlyPct: 40 }), /varsayımı/);
});

test('yeni ay eklendiğinde senaryo o ayı iki kez saymaz', () => {
  const withOctober = [...KNOWN_MONTHS, { month: '2026-10', label: 'Ekim 2026', pct: 1.5 }];
  const m = impliedMonthlyPct(28, withOctober);
  const ytd = 1.1776 * withOctober.reduce((acc, x) => acc * (1 + x.pct / 100), 1);
  const yearEnd = (ytd * Math.pow(1 + m / 100, 2) - 1) * 100;
  assert.ok(Math.abs(yearEnd - 28) < 1e-9);
});

test('bugün dönem kesinleşmedi ve resmî oran girilmedi', async () => {
  const m = await import('../src/zam-2027-engine.js');
  assert.equal(m.isFinal(), m.KNOWN_MONTHS.length === 6);
  assert.equal(m.hasOfficialRate(), m.isFinal() && m.OFFICIAL_SIX_MONTH_PCT !== null);
});
