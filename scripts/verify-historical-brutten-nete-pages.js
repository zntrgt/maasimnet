import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const dist = new URL('../dist/', import.meta.url).pathname;
const years = [2025, 2024, 2023, 2022, 2021, 2020];
const route = (year) => `/brutten-nete-${year}/`;
const genericRoute = (year) => `/${year}-maas-hesaplama/`;

function requireText(html, needle, label) {
  if (!html.includes(needle)) throw new Error(`${label} eksik: ${needle}`);
}

await access(join(dist, 'assets', 'historical-payroll-engine.js'));
await access(join(dist, 'assets', 'historical-payroll-data.js'));
const engine = await import(pathToFileURL(join(dist, 'assets', 'historical-payroll-engine.js')).href);
const dataModule = await import(pathToFileURL(join(dist, 'assets', 'historical-payroll-data.js')).href);

const officialPeriods = [
  { year: 2020, month: 0, gross: 294_300, net: 232_471, ceiling: 2_207_250 },
  { year: 2021, month: 0, gross: 357_750, net: 282_590, ceiling: 2_683_140 },
  { year: 2022, month: 0, gross: 500_400, net: 425_340, ceiling: 3_753_000 },
  { year: 2022, month: 6, gross: 647_100, net: 550_035, ceiling: 4_853_250 },
  { year: 2023, month: 0, gross: 1_000_800, net: 850_680, ceiling: 7_506_000 },
  { year: 2023, month: 6, gross: 1_341_450, net: 1_140_232, ceiling: 10_060_890 },
  { year: 2024, month: 0, gross: 2_000_250, net: 1_700_212, ceiling: 15_001_890 },
  { year: 2025, month: 0, gross: 2_600_550, net: 2_210_467, ceiling: 19_504_140 }
];

for (const benchmark of officialPeriods) {
  const period = dataModule.getHistoricalPeriod(benchmark.year, benchmark.month);
  if (period.minimumGrossKurus !== benchmark.gross) throw new Error(`${benchmark.year}/${benchmark.month + 1} resmî brüt benchmark sapması`);
  if (period.referenceMinimumNetKurus !== benchmark.net) throw new Error(`${benchmark.year}/${benchmark.month + 1} resmî net benchmark sapması`);
  if (period.sgkCeilingKurus !== benchmark.ceiling) throw new Error(`${benchmark.year}/${benchmark.month + 1} SGK tavan benchmark sapması`);
}

for (const year of years) {
  const gross = Array.from({ length: 12 }, (_, month) => dataModule.getHistoricalPeriod(year, month).minimumGrossKurus);
  const rows = engine.calculateHistoricalPayrollYear({ year, grossKurusByMonth: gross });
  for (const row of rows) {
    const expected = dataModule.getHistoricalPeriod(year, row.month).referenceMinimumNetKurus;
    if (row.netKurus !== expected) throw new Error(`${year}/${row.month + 1} asgari ücret neti ${row.netKurus}; beklenen ${expected}`);
  }
}

// İkinci bağımsız regression seti: her dönemin asgari ücretinin 2 katı brüt ücret.
// Beklenen değerler resmî yıl parametrelerinden bağımsız referans hesapla çıkarılıp sabitlenmiştir.
const doubleMinimumExpectedNet = {
  2020: { 0: 442_869, 5: 417_854, 6: 417_854, 11: 382_832 },
  2021: { 0: 538_349, 5: 507_940, 6: 507_940, 11: 465_368 },
  2022: { 0: 783_081, 5: 740_547, 6: 957_649, 11: 908_146 },
  2023: { 0: 1_566_162, 5: 1_481_094, 6: 1_985_226, 11: 1_882_604 },
  2024: { 0: 3_130_211, 5: 2_960_190, 6: 2_949_056, 11: 2_807_170 },
  2025: { 0: 4_069_627, 5: 3_848_580, 6: 3_848_580, 11: 3_649_638 }
};
for (const year of years) {
  const gross = Array.from({ length: 12 }, (_, month) => dataModule.getHistoricalPeriod(year, month).minimumGrossKurus * 2);
  const rows = engine.calculateHistoricalPayrollYear({ year, grossKurusByMonth: gross });
  for (const [monthText, expectedNet] of Object.entries(doubleMinimumExpectedNet[year])) {
    const month = Number(monthText);
    if (rows[month].netKurus !== expectedNet) throw new Error(`${year}/${month + 1} 2x asgari brüt regression sapması: ${rows[month].netKurus} != ${expectedNet}`);
  }
}

for (const year of years) {
  const file = join(dist, `brutten-nete-${year}`, 'index.html');
  const html = await readFile(file, 'utf8');
  const canonical = `https://maasim.net${route(year)}`;
  requireText(html, `<title>Brütten Nete ${year} Maaş Hesaplama | Maaşım.net</title>`, `${year} title`);
  requireText(html, `<h1>Brütten Nete ${year} Maaş Hesaplama</h1>`, `${year} H1`);
  requireText(html, `rel="canonical" href="${canonical}"`, `${year} canonical`);
  requireText(html, `data-query-owner="brutten-nete-${year}"`, `${year} query owner`);
  requireText(html, `href="${genericRoute(year)}"`, `${year} generic calculator cross-link`);
  requireText(html, '"@type":"WebApplication"', `${year} WebApplication schema`);
  requireText(html, '"@type":"FAQPage"', `${year} FAQ schema`);
  requireText(html, 'Resmî kaynaklar ve hesap kontrolü', `${year} source/audit block`);
  requireText(html, `${year} resmî asgari ücret`, `${year} minimum wage benchmark`);
  requireText(html, 'name="first_amount"', `${year} gross input`);
  if (html.includes('value="net_to_gross"')) throw new Error(`${year} dedicated brütten-net sayfasında netten-brüte modu bulunmamalı.`);
  if (/noindex/i.test(html)) throw new Error(`${year} dedicated brütten-net sayfasında noindex bulundu.`);
  if (year <= 2021) requireText(html, 'name="agi_option"', `${year} AGİ selector`);
  if (year >= 2022 && html.includes('name="agi_option"')) throw new Error(`${year} sayfasında AGİ seçimi olmamalı.`);
}

const hub = await readFile(join(dist, 'hesaplama-araclari', 'index.html'), 'utf8');
const sitemap = await readFile(join(dist, 'sitemap.xml'), 'utf8');
for (const year of years) {
  requireText(hub, `href="${route(year)}"`, `${year} hub link`);
  requireText(hub, `https://maasim.net${route(year)}`, `${year} hub ItemList`);
  requireText(sitemap, `<loc>https://maasim.net${route(year)}</loc>`, `${year} sitemap`);
  const generic = await readFile(join(dist, `${year}-maas-hesaplama`, 'index.html'), 'utf8');
  requireText(generic, `href="${route(year)}"`, `${year} generic-to-dedicated internal link`);
}
requireText(hub, 'data-historical-brutten-nete-discovery="v1"', 'hub gross-to-net discovery marker');

console.log('2020–2025 dedicated brütten-net sayfaları ve çift benchmark hesap kontrolü doğrulandı.');
