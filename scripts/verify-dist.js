import { access, readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGross100kScenarioData } from './render-scenarios.js';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, 'dist');

const required = [
  'index.html',
  'assets/styles.css',
  'assets/app.js',
  'assets/payroll-engine.js',
  'assets/parameters-2026.js',
  'assets/mobile-payroll-view.js',
  'assets/calculator-actions.js',
  'robots.txt',
  'sitemap.xml',
  'ads.txt',
  'version.json'
];

for (const relativePath of required) {
  await access(join(dist, relativePath));
}

const indexHtml = await readFile(join(dist, 'index.html'), 'utf8');
const stylesCss = await readFile(join(dist, 'assets/styles.css'), 'utf8');
const appJs = await readFile(join(dist, 'assets/app.js'), 'utf8');

if (!indexHtml.includes('<script type="module" src="/assets/app.js"></script>')) {
  throw new Error('index.html merkezi app modülünü yüklemiyor.');
}
if (indexHtml.includes('function runPayroll(') || indexHtml.includes('const PARAMS =')) {
  throw new Error('Eski inline hesap motoru dist/index.html içinde kaldı.');
}

const calculatorStart = indexHtml.indexOf('<section class="calculator-layout');
const resultsColumn = indexHtml.indexOf('<div class="calculator-results-column">', calculatorStart);
const representativeGross = indexHtml.indexOf('id="representative-gross"', resultsColumn);
const resultHierarchy = indexHtml.indexOf('class="result-hierarchy"', resultsColumn);
const payrollShell = indexHtml.indexOf('id="payroll-results-shell"', resultsColumn);
const quickNav = indexHtml.indexOf('<!-- Quick Nav -->', payrollShell);

if (
  calculatorStart < 0
  || resultsColumn < calculatorStart
  || representativeGross < resultsColumn
  || resultHierarchy < representativeGross
  || payrollShell < resultHierarchy
  || quickNav < payrollShell
) {
  throw new Error('Hesap sonucu kolonu doğru sırada üretilmedi.');
}
if (!stylesCss.includes('.calculator-results-column') || !stylesCss.includes('.calculator-results-column > #payroll-results-shell')) {
  throw new Error('Bordro tablosunun geniş sonuç kolonu stilleri eksik.');
}
if (!appJs.includes('netGrossTableExpanded = false;')) {
  throw new Error('Netten brüte aylık dağılımı varsayılan kapalı değil.');
}

const htmlFiles = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (entry.name.endsWith('.html')) htmlFiles.push(path);
  }
}
await walk(dist);
if (htmlFiles.length !== 15) {
  throw new Error(`15 HTML sayfası bekleniyordu, ${htmlFiles.length} bulundu.`);
}

const scenarioHtml = await readFile(
  join(dist, '100000-brut-maas-hesaplama', 'index.html'),
  'utf8'
);
const gross100kScenario = createGross100kScenarioData();
for (const value of Object.values(gross100kScenario.replacements)) {
  if (!scenarioHtml.includes(value)) {
    throw new Error(`100.000 TL senaryo sayfasında merkezi motor değeri bulunamadı: ${value}`);
  }
}
if (/\{\{SCENARIO_[A-Z0-9_]+\}\}/.test(scenarioHtml)) {
  throw new Error('Senaryo sayfasında çözümlenmemiş hesap tokenı kaldı.');
}

console.log('dist doğrulaması başarılı: sonuç kolonu, 15 HTML, merkezi motor ve dinamik senaryo değerleri hazır.');
