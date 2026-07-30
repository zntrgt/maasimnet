import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const dist = join(root, 'dist');
const html = await readFile(join(dist, 'index.html'), 'utf8');
const css = await readFile(join(dist, 'assets', 'styles.css'), 'utf8');
const app = await readFile(join(dist, 'assets', 'app.js'), 'utf8');
const shellCss = (await readFile(join(root, 'src', 'site-shell.css'), 'utf8')).trim();

const requiredHtml = [
  'data-fintech-ui="v1"',
  'class="calculator-layout',
  'class="calculator-results-column"',
  'class="calculator-table-full"',
  'data-dashboard-table="full-width"',
  'id="payroll-results-shell"',
  '>Vergi Dilimi</th>'
];
for (const token of requiredHtml) {
  if (!html.includes(token)) throw new Error(`Fintech UI HTML işareti eksik: ${token}`);
}

const representativePages = [
  'index.html',
  join('blog', 'index.html'),
  join('blog', '2027-maas-zammi-beklentileri', 'index.html'),
  join('veriler', '2026', 'index.html'),
  join('sss', 'index.html'),
  join('2027-maas-hesaplama', 'index.html')
];

for (const relativePath of representativePages) {
  const page = await readFile(join(dist, relativePath), 'utf8');
  for (const token of [
    'data-site-shell-css="v3"',
    'class="site-header"',
    'class="site-footer"',
    '.site-header{',
    '.site-footer{',
    '.site-footer__grid{',
    '/* Legacy sayfa CSS\'lerinden ortak shell izolasyonu */'
  ]) {
    if (!page.includes(token)) throw new Error(`Ortak shell eksik (${token}): ${relativePath}`);
  }
  if (!page.includes(shellCss)) throw new Error(`Ortak shell CSS içeriği farklı: ${relativePath}`);
  if (page.includes('/assets/site-shell.css')) throw new Error(`Ayrı shell CSS isteği kaldı: ${relativePath}`);
}

const layoutStart = html.indexOf('class="calculator-layout');
const resultsStart = html.indexOf('class="calculator-results-column"', layoutStart);
const fullTableStart = html.indexOf('class="calculator-table-full"', resultsStart);
const payrollStart = html.indexOf('id="payroll-results-shell"', fullTableStart);
if (!(layoutStart >= 0 && resultsStart > layoutStart && fullTableStart > resultsStart && payrollStart > fullTableStart)) {
  throw new Error('Dashboard hiyerarşisi hatalı: üst iki sütun ve bağımsız tablo yapısı üretilemedi.');
}

const requiredCss = [
  '/* Maaşım.net SaaS fintech arayüz sistemi */',
  '/* Tam genişlik SaaS dashboard bordro yerleşimi */',
  '/* Simetrik finansal metrik kart standardı */',
  '/* Aylık gelir vergisi dilimi sütunu */',
  '--primary: #0f172a',
  '--accent: #10b981',
  'font-variant-numeric: tabular-nums',
  'grid-template-columns: minmax(300px, 350px) minmax(0, 1fr)',
  'grid-template-columns: repeat(4, minmax(0, 1fr))',
  'justify-content: space-between',
  '.secondary-metrics-grid',
  '.calculator-table-full',
  'width: min(100%, 1280px)',
  '#payroll-results-shell .payroll-table',
  '.tax-bracket-badge',
  'overflow-x: visible !important',
  'overflow-y: visible !important',
  'table-layout: fixed',
  'min-width: 0 !important',
  '.cta-button--calculate',
  '#senaryolar .grid'
];
for (const token of requiredCss) {
  if (!css.includes(token)) throw new Error(`Fintech UI CSS kuralı eksik: ${token}`);
}

if (!css.includes('grid-template-columns: 1fr !important')) {
  throw new Error('Fintech UI mobil tek sütun düzeni eksik.');
}

for (const token of [
  'function formatIncomeTaxRates(',
  'incomeTaxRatesPpm: row.incomeTaxRatesPpm',
  "detailPair('Uygulanan Vergi Dilimi'",
  'class="tax-bracket-badge"',
  "'İşveren Maliyeti', 'Vergi Dilimi'"
]) {
  if (!app.includes(token)) throw new Error(`Vergi dilimi uygulama çıktısı eksik: ${token}`);
}

if (!app.includes("document.getElementById('stat-high-net').innerText = formatCurrency(highestNet);")) {
  throw new Error('En yüksek net kartında ay adı değer alanına karışıyor.');
}
if (!app.includes("document.getElementById('stat-low-net').innerText = formatCurrency(lowestNet);")) {
  throw new Error('En düşük net kartında ay adı değer alanına karışıyor.');
}

console.log('Fintech düzeni ve tüm sayfalarda birebir aynı ortak header/footer doğrulandı.');