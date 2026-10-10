import test from 'node:test';
import assert from 'node:assert/strict';
import { PROMOS, PROMO_SOURCES, PROMO_CHECKED_AT } from '../src/promo-data.js';
import { comparePromos, promoForPension, refundEstimate } from '../src/promo-engine.js';
import { amountText } from '../src/promo-calculator.js';

test('her banka en az iki kaynağa dayanır, kaynaklar tanımlı ve kontrol tarihinden eski değil', () => {
  for (const p of PROMOS) {
    assert.ok(p.sources.length >= 2, p.bank);
    for (const k of p.sources) assert.ok(PROMO_SOURCES[k], `${p.bank}: ${k}`);
    assert.ok(p.min <= p.max, p.bank);
    if (p.bands) assert.equal(p.bands.at(-1).amount, p.max, p.bank);
    assert.match(p.site, /^https:\/\//);
  }
  for (const s of Object.values(PROMO_SOURCES)) assert.ok(s.date <= PROMO_CHECKED_AT);
  assert.equal(new Set(PROMOS.map((p) => p.key)).size, PROMOS.length);
});

test('dilim sınırları: 20.000 TL ve üzeri en üst dilim, alt sınırlar dahil değil', () => {
  const ziraat = PROMOS.find((p) => p.key === 'ziraat');
  assert.equal(promoForPension(ziraat, 9_999.99).amount, 5_000);
  assert.equal(promoForPension(ziraat, 10_000).amount, 8_000);
  assert.equal(promoForPension(ziraat, 23_552).amount, 12_000);
  const halk = PROMOS.find((p) => p.key === 'halkbank');
  assert.equal(promoForPension(halk, 9_000).amount, null);
  assert.equal(promoForPension(halk, 12_000).amount, 8_000);
});

test('karşılaştırma: önce kesin dilimler, belirsiz koşulsuz tutarlar en sonda', () => {
  const rows = comparePromos(23_552);
  assert.ok(rows.slice(0, 4).every((r) => r.exact));
  assert.ok(rows.slice(-2).every((r) => r.uncertain));
  assert.match(amountText(rows.at(-1)), /koşullu olabilir/);
  const qnb = rows.find((r) => r.key === 'qnb');
  assert.equal(qnb.amount, 20_000);
  assert.equal(qnb.exact, true);
  assert.match(amountText(rows.find((r) => r.key === 'ing')), /En fazla/);
  assert.throws(() => comparePromos(0), /maaş/);
});

test('erken taşıma iadesi kalan aylara orantılı', () => {
  assert.deepEqual(refundEstimate({ promoTl: 12_000, monthsStayed: 12 }), { remainingMonths: 24, refundTl: 8_000, monthlyValueTl: 333.33 });
  assert.equal(refundEstimate({ promoTl: 12_000, monthsStayed: 40 }).refundTl, 0);
  assert.throws(() => refundEstimate({ promoTl: 12_000, monthsStayed: 1.5 }), /tam sayı/);
});
