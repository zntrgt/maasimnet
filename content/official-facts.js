import { DATA_2026 } from '../src/data-2026.js';
import { CONSOLIDATED_REDIRECTS } from '../src/consolidated-redirects.js';

// Konu başına tek kanonik sayfa. Eski /veriler/2026-*/ ve /sgk/sgk-tavani/ sayfalarının
// resmî değer kartları ve Dataset şeması bu sayfalara taşınır; sayılar tek kaynaktan
// (DATA_2026) okunur. Blok, AI arama motorlarının alıntılayabileceği kısa ve tarihli
// bir cevap cümlesiyle başlar.
const money = (kurus) => `${(kurus / 100).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
const percent = (ppm) => `%${(ppm / 10_000).toLocaleString('tr-TR', { maximumFractionDigits: 2 })}`;

const d = DATA_2026.publishedData;
const p = DATA_2026.payroll;
const s = DATA_2026.sources;

export const OFFICIAL_FACT_TOPICS = Object.freeze([
  Object.freeze({
    key: 'minimum-wage',
    path: '/asgari-ucret-hesaplama/',
    placement: { type: 'calculator', family: 'minimum-wage' },
    name: '2026 Asgari Ücret: Brüt ve Net Tutar',
    answer: `2026 yılında aylık brüt asgari ücret ${money(d.minimumWage.grossKurus)}, standart çalışan için referans net asgari ücret ${money(d.minimumWage.netKurus)}'dir (1 Ocak–31 Aralık 2026).`,
    cards: [
      { label: 'Brüt asgari ücret', value: money(d.minimumWage.grossKurus), note: 'Aylık, 30 gün' },
      { label: 'Net asgari ücret', value: money(d.minimumWage.netKurus), note: 'Bakanlık referans hesabı' },
      { label: 'Çalışan SGK oranı', value: percent(p.employeeRatesPpm.sgk) },
      { label: 'Çalışan işsizlik oranı', value: percent(p.employeeRatesPpm.unemployment) }
    ],
    sources: [s.minimumWage]
  }),
  Object.freeze({
    key: 'income-tax-brackets',
    path: '/blog/2026-maas-vergi-dilimleri/',
    placement: { type: 'article' },
    name: '2026 Ücret Gelirleri Gelir Vergisi Dilimleri',
    answer: `2026 ücret gelirlerinde gelir vergisi kümülatif matrah üzerinden ${percent(p.incomeTaxBrackets[0].ratePpm)} ile ${percent(p.incomeTaxBrackets.at(-1).ratePpm)} arasında ${p.incomeTaxBrackets.length} dilimle uygulanır; ilk dilim sınırı ${money(p.incomeTaxBrackets[0].upToKurus)}'dir.`,
    cards: p.incomeTaxBrackets.map((bracket, index) => ({
      label: `${index + 1}. dilim`,
      value: percent(bracket.ratePpm),
      note: Number.isFinite(bracket.upToKurus) ? `${money(bracket.upToKurus)}'ye kadar` : 'Üst sınır yok'
    })),
    sources: [s.incomeTax]
  }),
  Object.freeze({
    key: 'sgk-ceiling',
    path: '/blog/2026-sgk-tavani/',
    placement: { type: 'article' },
    name: '2026 SGK Prime Esas Kazanç Alt ve Üst Sınırları',
    answer: `2026 yılında aylık SGK tavanı (prime esas kazanç üst sınırı) ${money(d.sgkCeiling.monthlyKurus)}'dir; bu tutar brüt asgari ücretin ${d.sgkCeiling.multiplier} katıdır.`,
    cards: [
      { label: 'Günlük alt sınır', value: money(Math.round(d.minimumWage.grossKurus / 30)) },
      { label: 'Aylık alt sınır', value: money(d.minimumWage.grossKurus) },
      { label: 'Günlük üst sınır', value: money(d.sgkCeiling.dailyKurus) },
      { label: 'Aylık üst sınır', value: money(d.sgkCeiling.monthlyKurus), note: `Asgari ücretin ${d.sgkCeiling.multiplier} katı` }
    ],
    sources: [s.sgk]
  }),
  Object.freeze({
    key: 'severance-ceiling',
    path: '/kidem-tazminati-hesaplama/',
    placement: { type: 'calculator', family: 'termination' },
    name: '2026 Kıdem Tazminatı Tavanı',
    answer: `2026'da kıdem tazminatı tavanı 1 Ocak–30 Haziran için ${money(d.severanceCeiling.firstHalfKurus)}, 1 Temmuz–31 Aralık için ${money(d.severanceCeiling.secondHalfKurus)}'dir.`,
    cards: [
      { label: '1 Ocak–30 Haziran', value: money(d.severanceCeiling.firstHalfKurus) },
      { label: '1 Temmuz–31 Aralık', value: money(d.severanceCeiling.secondHalfKurus), note: 'Güncel dönem' }
    ],
    sources: [s.severance]
  }),
  Object.freeze({
    key: 'meal-allowance',
    path: '/blog/2026-yemek-karti-istisnasi/',
    placement: { type: 'article' },
    name: '2026 Yemek Yardımı İstisnası: Gelir Vergisi ve SGK',
    answer: `2026'da günlük yemek bedelinin gelir vergisi istisnası ${money(d.mealAllowance.incomeTaxDailyKurus)}, SGK prime esas kazanç istisnası ${money(d.mealAllowance.sgkDailyKurus)}'dir; iki tutar birbirinin yerine kullanılamaz.`,
    cards: [
      { label: 'Gelir vergisi istisnası', value: money(d.mealAllowance.incomeTaxDailyKurus), note: 'Günlük' },
      { label: 'SGK PEK istisnası', value: money(d.mealAllowance.sgkDailyKurus), note: 'Günlük' }
    ],
    sources: [s.mealIncomeTax, s.sgk]
  })
]);

// Her kanonik sayfa, en az bir eski URL'nin yönlendirme hedefi olmalı ve tersi.
export const OFFICIAL_FACT_PATHS = Object.freeze(OFFICIAL_FACT_TOPICS.map((topic) => topic.path));
export const LEGACY_DATA_PATHS = Object.freeze(Object.keys(CONSOLIDATED_REDIRECTS));
export const OFFICIAL_FACTS_CHECKED_AT = DATA_2026.checkedAt;
