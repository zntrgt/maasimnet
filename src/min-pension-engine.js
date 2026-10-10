// En düşük emekli aylığı (SSK/Bağ-Kur taban aylık) tarihçesi ve bir sonraki dönem senaryosu.
// Taban tutar kanunla belirlenir; kök aylığa eklenmez, aradaki fark Hazine desteği olarak ödenir.
// Emekli zammı kök aylığa uygulanır. Yeni taban kanunu yayımlanınca MIN_PENSION_HISTORY'ye satır eklenir
// ve zam-2027-engine.js içindeki MIN_PENSION_KURUS aynı tutara güncellenir (test bunu denetler).
import { emekliZam, MIN_PENSION_KURUS } from './zam-2027-engine.js';

export const MIN_PENSION_HISTORY = Object.freeze([
  Object.freeze({ period: '2024-01', label: 'Ocak 2024', kurus: 1_000_000, raisePct: 49.25, prevKurus: 750_000 }),
  Object.freeze({ period: '2024-07', label: 'Temmuz 2024', kurus: 1_250_000, raisePct: 24.73 }),
  Object.freeze({ period: '2025-01', label: 'Ocak 2025', kurus: 1_446_900, raisePct: 15.75 }),
  Object.freeze({ period: '2025-07', label: 'Temmuz 2025', kurus: 1_688_100, raisePct: 16.67 }),
  Object.freeze({ period: '2026-01', label: 'Ocak 2026', kurus: 2_000_000, raisePct: 12.19 }),
  Object.freeze({ period: '2026-07', label: 'Temmuz 2026', kurus: 2_355_200, raisePct: 17.76 })
]);

export const latestMinPension = () => MIN_PENSION_HISTORY.at(-1);

// Bir önceki tabana göre artış ve aynı dönemin emekli zammıyla karşılaştırma.
export function historyRows() {
  return MIN_PENSION_HISTORY.map((row, i) => {
    const prev = row.prevKurus ?? MIN_PENSION_HISTORY[i - 1]?.kurus;
    const floorPct = prev ? Math.round(((row.kurus / prev) - 1) * 10_000) / 100 : null;
    const relation = floorPct == null ? null : Math.abs(floorPct - row.raisePct) < 0.05 ? 'same' : floorPct > row.raisePct ? 'above' : 'below';
    return { ...row, floorPct, relation };
  });
}

const FLOOR_MODES = new Set(['indexed', 'same', 'custom']);

// sharePct: dul/yetim aylığında hak sahibinin hissesi. Taban dosya toplamına uygulanır, sonra hisseye bölünür;
// bu yüzden hesap dosya düzeyinde yapılıp sonuç hisseyle çarpılır. Kendi aylığında hisse %100'dür.
export function minPensionOutlook({ kokKurus, assumedMonthlyPct = 0, floorMode = 'indexed', customFloorKurus = null, sharePct = 100 }) {
  const share = Number(sharePct);
  if (!Number.isFinite(share) || share <= 0 || share > 100) throw new Error('Hisse oranı 0 ile 100 arasında olmalı.');
  const ownKok = Number(kokKurus);
  if (!Number.isFinite(ownKok) || ownKok <= 0 || ownKok > 100_000_000) throw new Error('Kök aylığınızı girin (0’dan büyük).');
  const ratio = share / 100;
  const kok = Math.round(ownKok / ratio);
  if (!FLOOR_MODES.has(floorMode)) throw new Error('Taban aylık senaryosunu seçin.');
  const zam = emekliZam({ currentKurus: kok, assumedMonthlyPct });
  let floorKurus;
  if (floorMode === 'same') floorKurus = MIN_PENSION_KURUS;
  else if (floorMode === 'indexed') floorKurus = zam.minPensionScenarioKurus;
  else {
    const custom = Number(customFloorKurus);
    if (!Number.isFinite(custom) || custom <= 0 || custom > 100_000_000) throw new Error('Taban aylık tutarını girin.');
    floorKurus = Math.round(custom);
  }
  const part = (kurus) => Math.round(kurus * ratio);
  const fileCurrent = Math.max(zam.currentKurus, MIN_PENSION_KURUS);
  const filePayment = Math.max(zam.newKurus, floorKurus);
  const currentPaymentKurus = part(fileCurrent);
  const newKokKurus = part(zam.newKurus);
  const paymentKurus = part(filePayment);
  const effectivePct = Math.round(((filePayment / fileCurrent) - 1) * 10_000) / 100;
  return {
    sharePct: share,
    raisePct: zam.raisePct,
    kokKurus: Math.round(ownKok),
    fileKokKurus: zam.currentKurus,
    newKokKurus,
    floorKurus,
    currentPaymentKurus,
    currentTopUpKurus: currentPaymentKurus - Math.round(ownKok),
    paymentKurus,
    topUpKurus: paymentKurus - newKokKurus,
    increaseKurus: paymentKurus - currentPaymentKurus,
    effectivePct,
    onFloorNow: zam.currentKurus < MIN_PENSION_KURUS,
    onFloorAfter: newKokKurus < floorKurus
  };
}
