// Kira artış oranı (TBK m.344): yenilenen kira yılında artış, önceki kira yılının TÜFE 12 aylık
// ortalamalara göre değişim oranını geçemez. Konut ve çatılı işyeri için geçerlidir; konutta %25
// geçici sınırı 1 Temmuz 2024'te sona erdi.
// RENT_CAPS: yenileme ayı → o ay uygulanabilecek azami oran (bir önceki ayın TÜİK 12 aylık ortalaması).
// Yeni TÜİK verisi açıklanınca dizinin BAŞINA eklenir. Yalnız en az iki kaynağın aynı verdiği değerler.
export const RENT_DATA_CHECKED_AT = '2026-10-10';
export const RENT_CAPS = Object.freeze([
  Object.freeze({ renewal: '2026-10', label: 'Ekim 2026', basis: 'Eylül 2026', pct: 31.49 }),
  Object.freeze({ renewal: '2026-09', label: 'Eylül 2026', basis: 'Ağustos 2026', pct: 31.79 }),
  Object.freeze({ renewal: '2026-08', label: 'Ağustos 2026', basis: 'Temmuz 2026', pct: 31.90 }),
  Object.freeze({ renewal: '2026-07', label: 'Temmuz 2026', basis: 'Haziran 2026', pct: 32.03 }),
  Object.freeze({ renewal: '2026-06', label: 'Haziran 2026', basis: 'Mayıs 2026', pct: 32.24 }),
  Object.freeze({ renewal: '2026-05', label: 'Mayıs 2026', basis: 'Nisan 2026', pct: 32.43 }),
  Object.freeze({ renewal: '2026-04', label: 'Nisan 2026', basis: 'Mart 2026', pct: 32.82 }),
  Object.freeze({ renewal: '2026-03', label: 'Mart 2026', basis: 'Şubat 2026', pct: 33.39 })
]);

export const latestCap = () => RENT_CAPS[0];
export const capFor = (renewal) => RENT_CAPS.find((c) => c.renewal === renewal) || null;

export function calculateRent({ currentKurus, renewal, agreedPct = null }) {
  const current = Math.round(Number(currentKurus));
  if (!Number.isFinite(current) || current <= 0 || current > 10_000_000_000) throw new Error('Mevcut aylık kirayı girin (0’dan büyük).');
  const cap = capFor(renewal);
  if (!cap) throw new Error('Yenileme ayını seçin.');
  const maxKurus = Math.round(current * (1 + cap.pct / 100));
  const result = { cap, currentKurus: current, maxKurus, maxIncreaseKurus: maxKurus - current, agreed: null };
  if (agreedPct !== null && agreedPct !== '' && agreedPct !== undefined) {
    const pct = Number(agreedPct);
    if (!Number.isFinite(pct) || pct < 0 || pct > 500) throw new Error('İstenen artış oranı 0 ile 500 arasında olmalı.');
    const agreedKurus = Math.round(current * (1 + pct / 100));
    result.agreed = { pct, agreedKurus, exceedsCap: pct > cap.pct, excessKurus: Math.max(0, agreedKurus - maxKurus) };
  }
  return result;
}
