// Ocak 2027 emekli (SSK/Bağ-Kur) ve memur zammı tahmin motoru.
// Kesinleşen aylar TÜİK aylık TÜFE değişimleridir; kalan aylar kullanıcı varsayımıdır.
// Her TÜİK açıklamasından sonra KNOWN_MONTHS güncellenir.

export const ZAM_DATA_CHECKED_AT = '2026-10-10';
export const KNOWN_MONTHS = Object.freeze([
  Object.freeze({ month: '2026-07', label: 'Temmuz 2026', pct: 1.78 }),
  Object.freeze({ month: '2026-08', label: 'Ağustos 2026', pct: 1.84 }),
  Object.freeze({ month: '2026-09', label: 'Eylül 2026', pct: 1.84 })
]);
// Aralık verisiyle birlikte TÜİK/basın 6 aylık resmî oranı açıklar; endeksten hesaplandığı için aylık oranların
// birleşiminden birkaç yüzde puan farklı olabilir. Açıklanınca buraya yazılır (ör. 10.37); null iken birleşik oran kullanılır.
export const OFFICIAL_SIX_MONTH_PCT = null;
export const PERIOD_MONTHS = Object.freeze(['Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']);
// TÜİK: Ocak–Haziran 2026 kümülatif TÜFE %17,76 (Temmuz 2026 emekli zammı). Yılbaşından bugüne değer,
// buna KNOWN_MONTHS eklenerek hesaplanır; böylece her yeni ay eklendiğinde senaryolar kendiliğinden hizalanır.
export const JAN_JUN_CUMULATIVE_PCT = 17.76;
// Sayfa metni için TÜİK'in açıkladığı Ocak–Eylül kümülatif değeri.
export const JAN_SEP_CUMULATIVE_PCT = 24.32;
export const YEAR_END_REFERENCES = Object.freeze([
  Object.freeze({ key: 'tcmb', label: 'TCMB 2026 yıl sonu tahmini', yearEndPct: 28 }),
  Object.freeze({ key: 'pka', label: 'Piyasa beklentisi (Eylül PKA)', yearEndPct: 29.61 })
]);
// Memur: 8. dönem toplu sözleşme (Kamu Görevlileri Hakem Kurulu, Ağustos 2025).
export const MEMUR_RATES = Object.freeze({ h2_2026: 7, h1_2027: 5 });
// En düşük emekli aylığı (SSK/Bağ-Kur), Temmuz 2026'dan itibaren; kanunla belirlenir.
export const MIN_PENSION_KURUS = 2_355_200;

const round2 = (value) => Math.round(value * 100) / 100;
const compound = (pcts) => (pcts.reduce((acc, pct) => acc * (1 + pct / 100), 1) - 1) * 100;

export function knownCumulativePct() {
  if (KNOWN_MONTHS.length === 6 && OFFICIAL_SIX_MONTH_PCT !== null) return OFFICIAL_SIX_MONTH_PCT;
  return compound(KNOWN_MONTHS.map((m) => m.pct));
}

export function impliedMonthlyPct(yearEndPct, knownMonths = KNOWN_MONTHS) {
  const remainingMonths = 6 - knownMonths.length;
  if (remainingMonths <= 0) return 0;
  const yearToDate = (1 + JAN_JUN_CUMULATIVE_PCT / 100) * (1 + compound(knownMonths.map((m) => m.pct)) / 100);
  const ratio = (1 + yearEndPct / 100) / yearToDate;
  return (Math.pow(ratio, 1 / remainingMonths) - 1) * 100;
}

// 6 ayın tamamı açıklandı. Resmî oran henüz girilmediyse sayfa sonucu "aylık oranlardan hesaplanan" diye etiketler.
export const isFinal = () => KNOWN_MONTHS.length === 6;
export const hasOfficialRate = () => isFinal() && OFFICIAL_SIX_MONTH_PCT !== null;

export function sixMonthInflationPct(assumedMonthlyPct) {
  const remaining = 6 - KNOWN_MONTHS.length;
  if (remaining === 0 && OFFICIAL_SIX_MONTH_PCT !== null) return OFFICIAL_SIX_MONTH_PCT;
  if (!Number.isFinite(assumedMonthlyPct) || assumedMonthlyPct < -5 || assumedMonthlyPct > 15) throw new Error('Aylık enflasyon varsayımı -5 ile 15 arasında olmalı.');
  return compound([...KNOWN_MONTHS.map((m) => m.pct), ...Array(remaining).fill(assumedMonthlyPct)]);
}

function money(currentKurus) {
  const value = Number(currentKurus);
  if (!Number.isFinite(value) || value <= 0 || value > 100_000_000) throw new Error('Mevcut aylık tutarı girin (0’dan büyük).');
  return Math.round(value);
}

export function emekliZam({ currentKurus, assumedMonthlyPct }) {
  const current = money(currentKurus);
  const inflationPct = round2(sixMonthInflationPct(assumedMonthlyPct));
  const newKurus = Math.round(current * (1 + inflationPct / 100));
  return {
    inflationPct,
    raisePct: inflationPct,
    currentKurus: current,
    newKurus,
    increaseKurus: newKurus - current,
    minPensionScenarioKurus: Math.round(MIN_PENSION_KURUS * (1 + inflationPct / 100))
  };
}

export function memurZam({ currentKurus, assumedMonthlyPct }) {
  const current = money(currentKurus);
  const inflationPct = round2(sixMonthInflationPct(assumedMonthlyPct));
  const farkPct = round2(Math.max(0, ((1 + inflationPct / 100) / (1 + MEMUR_RATES.h2_2026 / 100) - 1) * 100));
  const raisePct = round2(((1 + farkPct / 100) * (1 + MEMUR_RATES.h1_2027 / 100) - 1) * 100);
  const newKurus = Math.round(current * (1 + raisePct / 100));
  return { inflationPct, farkPct, collectivePct: MEMUR_RATES.h1_2027, raisePct, currentKurus: current, newKurus, increaseKurus: newKurus - current };
}

export function scenarioPresets() {
  const avgKnown = KNOWN_MONTHS.reduce((s, m) => s + m.pct, 0) / KNOWN_MONTHS.length;
  return [
    ...YEAR_END_REFERENCES.map((ref) => ({ key: ref.key, label: `${ref.label} (%${ref.yearEndPct.toLocaleString('tr-TR')})`, monthlyPct: round2(impliedMonthlyPct(ref.yearEndPct)) })),
    { key: 'recent', label: `Son ${KNOWN_MONTHS.length} ayın ortalaması sürerse`, monthlyPct: round2(avgKnown) }
  ];
}
