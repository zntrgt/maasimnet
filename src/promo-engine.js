import { PROMOS, COMMIT_MONTHS } from './promo-data.js';

// Aylık maaşa göre koşulsuz promosyon. Dilim sınırı kaynakta yoksa yalnız aralık döner (exact=false).
export function promoForPension(promo, pensionTl) {
  if (promo.bands) {
    if (promo.minBandFrom && pensionTl < promo.minBandFrom) return { amount: null, exact: false };
    const hit = promo.bands.find((b) => pensionTl < b.below);
    return { amount: hit.amount, exact: true };
  }
  return { amount: promo.max, exact: false };
}

const rank = (row) => (row.exact && row.amount != null ? 0 : row.uncertain ? 2 : 1);

export function comparePromos(pensionTl, promos = PROMOS) {
  const value = Number(pensionTl);
  if (!Number.isFinite(value) || value <= 0 || value > 1_000_000) throw new Error('Aylık emekli maaşınızı girin.');
  return promos
    .map((p) => ({ ...p, ...promoForPension(p, value) }))
    // Önce dilimi kesin bilinenler, sonra yalnız aralığı bilinenler, en sonda koşulsuz kısmı belirsiz olanlar.
    .sort((a, b) => (rank(a) - rank(b)) || ((b.amount ?? -1) - (a.amount ?? -1)) || ((b.totalMax ?? 0) - (a.totalMax ?? 0)));
}

// Taahhüt dolmadan banka değiştirilirse kalan aylara düşen kısmın orantılı iadesi (sözleşme esas alınır).
export function refundEstimate({ promoTl, monthsStayed, commitMonths = COMMIT_MONTHS }) {
  const promo = Number(promoTl);
  const stayed = Number(monthsStayed);
  if (!Number.isFinite(promo) || promo <= 0 || promo > 1_000_000) throw new Error('Aldığınız promosyon tutarını girin.');
  if (!Number.isInteger(stayed) || stayed < 0) throw new Error('Kaç ay kaldığınızı tam sayı olarak girin.');
  const remaining = Math.max(0, commitMonths - stayed);
  const refund = Math.round((promo * remaining / commitMonths) * 100) / 100;
  return { remainingMonths: remaining, refundTl: refund, monthlyValueTl: Math.round((promo / commitMonths) * 100) / 100 };
}
