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
if (!indexHtml.includes('<script type="module" src="/assets/app.js"></script>')) {
  throw new Error('index.html merkezi app modülünü yüklemiyor.');
}
if (indexHtml.includes('function runPayroll(') || indexHtml.includes('const PARAMS =')) {
  throw new Error('Eski inline hesap motoru dist/index.html içinde kaldı.');
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

console.log('dist doğrulaması başarılı: 15 HTML, merkezi motor ve dinamik senaryo değerleri hazır.');
