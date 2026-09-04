import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const html = await readFile(join(root, 'dist', 'asgari-ucret-hesaplama', 'index.html'), 'utf8');
const engine = await readFile(join(root, 'src', 'minimum-wage-engine.js'), 'utf8');
const ui = await readFile(join(root, 'src', 'minimum-wage-calculator.js'), 'utf8');
const failures = [];

for (const token of [
  '<h1>Asgari Ücret Hesaplama 2026</h1>',
  'rel="canonical" href="https://maasim.net/asgari-ucret-hesaplama/"',
  'WebApplication',
  'FAQPage',
  '33.030,00 TL',
  '28.075,50 TL',
  '4.624,20 TL',
  '330,30 TL',
  'asgari-ucret-isveren-maliyeti',
  'csgb.gov.tr'
]) if (!html.includes(token)) failures.push(`Asgari ücret sayfasında zorunlu içerik eksik: ${token}`);

for (const token of ['payroll.minimumGrossKurus', 'payroll.referenceMinimumNetKurus', 'employeeRatesPpm.sgk', 'employeeRatesPpm.unemployment']) {
  if (!engine.includes(token)) failures.push(`Asgari ücret motoru merkezi 2026 verisini kullanmıyor: ${token}`);
}
if (!engine.includes("throw new Error('2026 resmî net asgari ücret referansı ile hesap motoru eşleşmiyor.')")) failures.push('Resmî net asgari ücret benchmark guardı eksik.');
if (!ui.includes("globalThis.gtag('event', 'minimum_wage_calculator_complete')")) failures.push('Asgari ücret completion eventi eksik.');
if (!ui.includes('Cookiebot?.consent?.statistics !== true')) failures.push('Asgari ücret analytics consent guard eksik.');

if (failures.length) throw new Error(`Asgari ücret hesaplayıcı doğrulaması başarısız:\n${failures.join('\n')}`);
console.log('Asgari ücret hesaplayıcısı doğrulandı: resmî benchmark, SEO, intent ayrımı ve privacy guardları aktif.');
