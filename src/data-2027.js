import { DATA_2026 } from './data-2026.js';

// Resmî 2026 YDO, 2027 ücret tarifesi değildir.
export const DATA_2027 = Object.freeze({
  year: 2027,
  checkedAt: '2026-11-25',
  revaluation: Object.freeze({
    basisYear: 2026, valueBps: 2783, status: 'official',
    publishedAt: '2026-11-24',
    sourceUrl: 'https://www.resmigazete.gov.tr/eskiler/2026/11/20261124-3.htm',
    sourceTitle: '599 sıra numaralı Vergi Usul Kanunu Genel Tebliği'
  }),
  pending: Object.freeze([
    'Brüt asgari ücret', 'Net asgari ücret', 'SGK prime esas kazanç tavanı',
    'Ücret gelir vergisi tarifesi', 'İşveren prim indirimleri',
    'Ocak–Haziran kıdem tazminatı tavanı', 'Memur ve emekli aylığı artışları'
  ].map(label => Object.freeze({ label, status: 'pending', value: null })))
});

const base = DATA_2026.payroll;
function scenario(wageBps, taxBps) {
  const scale = (kurus, bps) => Math.round(kurus * (10000 + bps) / 10000) / 100;
  const minimum = scale(base.minimumGrossKurus, wageBps);
  return Object.freeze({
    status: 'estimated', wageBps, taxBps, minimum,
    ceiling: Math.round(minimum * DATA_2026.publishedData.sgkCeiling.multiplier * 100) / 100,
    brackets: Object.freeze(base.incomeTaxBrackets.filter(b => Number.isFinite(b.upToKurus)).map(b => scale(b.upToKurus, taxBps)))
  });
}
export const ESTIMATE_PRESETS_2027 = Object.freeze({
  cautious: scenario(2000, 2000),
  middle: scenario(3000, DATA_2027.revaluation.valueBps),
  high: scenario(4000, 4000)
});
