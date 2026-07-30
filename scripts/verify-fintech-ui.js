import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const dist = join(process.cwd(), 'dist');
const html = await readFile(join(dist, 'index.html'), 'utf8');
const css = await readFile(join(dist, 'assets', 'styles.css'), 'utf8');

const requiredHtml = [
  'data-fintech-ui="v1"',
  'class="calculator-layout',
  'class="calculator-results-column"',
  'id="payroll-results-shell"'
];
for (const token of requiredHtml) {
  if (!html.includes(token)) throw new Error(`Fintech UI HTML işareti eksik: ${token}`);
}

const requiredCss = [
  '/* Maaşım.net SaaS fintech arayüz sistemi */',
  '--primary: #0f172a',
  '--accent: #10b981',
  'font-variant-numeric: tabular-nums',
  'grid-template-columns: minmax(300px, 350px) minmax(0, 1fr)',
  '.secondary-metrics-grid',
  '#payroll-results-shell .payroll-table',
  'overflow-x: auto',
  '.cta-button--calculate',
  '#senaryolar .grid'
];
for (const token of requiredCss) {
  if (!css.includes(token)) throw new Error(`Fintech UI CSS kuralı eksik: ${token}`);
}

if (!css.includes('@media (max-width: 900px)') || !css.includes('grid-template-columns: 1fr !important')) {
  throw new Error('Fintech UI mobil tek sütun düzeni eksik.');
}

console.log('SaaS fintech UI refaktörü doğrulandı.');
