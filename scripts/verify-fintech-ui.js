import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const dist = join(process.cwd(), 'dist');
const html = await readFile(join(dist, 'index.html'), 'utf8');
const css = await readFile(join(dist, 'assets', 'styles.css'), 'utf8');
const app = await readFile(join(dist, 'assets', 'app.js'), 'utf8');

const requiredHtml = [
  'data-fintech-ui="v1"',
  'class="calculator-layout',
  'class="calculator-results-column"',
  'class="calculator-table-full"',
  'data-dashboard-table="full-width"',
  'id="payroll-results-shell"'
];
for (const token of requiredHtml) {
  if (!html.includes(token)) throw new Error(`Fintech UI HTML işareti eksik: ${token}`);
}

const layoutStart = html.indexOf('class="calculator-layout');
const resultsStart = html.indexOf('class="calculator-results-column"', layoutStart);
const fullTableStart = html.indexOf('class="calculator-table-full"', resultsStart);
const payrollStart = html.indexOf('id="payroll-results-shell"', fullTableStart);
if (!(layoutStart >= 0 && resultsStart > layoutStart && fullTableStart > resultsStart && payrollStart > fullTableStart)) {
  throw new Error('Dashboard hiyerarşisi hatalı: form/özet üst grid ve tam genişlik tablo sırası korunmuyor.');
}

const requiredCss = [
  '/* Maaşım.net SaaS fintech arayüz sistemi */',
  '/* Tam genişlik SaaS dashboard bordro yerleşimi */',
  '/* Simetrik finansal metrik kart standardı */',
  '--primary: #0f172a',
  '--accent: #10b981',
  'font-variant-numeric: tabular-nums',
  'grid-template-columns: minmax(300px, 350px) minmax(0, 1fr)',
  'grid-template-columns: repeat(4, minmax(0, 1fr))',
  'justify-content: space-between',
  '.secondary-metrics-grid',
  '.calculator-table-full',
  'grid-column: 1 / -1',
  '#payroll-results-shell .payroll-table',
  'overflow-x: auto',
  '.cta-button--calculate',
  '#senaryolar .grid'
];
for (const token of requiredCss) {
  if (!css.includes(token)) throw new Error(`Fintech UI CSS kuralı eksik: ${token}`);
}

if (!css.includes('grid-template-columns: 1fr !important')) {
  throw new Error('Fintech UI mobil tek sütun düzeni eksik.');
}

if (!app.includes("document.getElementById('stat-high-net').innerText = formatCurrency(highestNet);")) {
  throw new Error('En yüksek net kartında ay adı değer alanına karışıyor.');
}
if (!app.includes("document.getElementById('stat-low-net').innerText = formatCurrency(lowestNet);")) {
  throw new Error('En düşük net kartında ay adı değer alanına karışıyor.');
}

console.log('SaaS fintech dashboard düzeni ve simetrik metrik kart hiyerarşisi doğrulandı.');