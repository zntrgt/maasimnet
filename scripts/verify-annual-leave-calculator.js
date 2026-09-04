import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const html = await readFile(join(root, 'dist', 'yillik-izin-ucreti-hesaplama', 'index.html'), 'utf8');
const engine = await readFile(join(root, 'src', 'annual-leave-engine.js'), 'utf8');
const ui = await readFile(join(root, 'src', 'annual-leave-calculator.js'), 'utf8');
const failures = [];

for (const token of [
  '<h1>Yıllık İzin Ücreti Hesaplama 2026</h1>',
  'rel="canonical" href="https://maasim.net/yillik-izin-ucreti-hesaplama/"',
  'WebApplication',
  'FAQPage',
  'name="lastMonthlyGross"',
  'name="unusedLeaveDays"',
  'name="terminationMonthGross"',
  'name="terminationMonthPremiumDays"',
  'name="previousTaxBase"',
  'İş Kanunu m.59',
  'sgk.gov.tr',
  'gib.gov.tr'
]) if (!html.includes(token)) failures.push(`Yıllık izin sayfasında zorunlu içerik eksik: ${token}`);

if (!engine.includes('(lastMonthlyGrossKurus * unusedLeaveDays) / 30')) failures.push('Yıllık izin brüt formülü son aylık brüt / 30 × gün olmalı.');
if (!engine.includes('dailyCeilingKurus * premiumDays')) failures.push('Fesih ayı SGK tavanı prim gününe göre ölçeklenmeli.');
if (!ui.includes("globalThis.gtag('event', 'annual_leave_calculator_complete')")) failures.push('Yıllık izin completion eventi eksik.');
if (!ui.includes('Cookiebot?.consent?.statistics !== true')) failures.push('Yıllık izin analytics consent guard eksik.');
if (/gtag\([^\n]*lastMonthlyGross|gtag\([^\n]*unusedLeaveDays|gtag\([^\n]*previousTaxBase/.test(ui)) failures.push('Yıllık izin analytics finansal/form girdisi taşımamalı.');

if (failures.length) throw new Error(`Yıllık izin hesaplayıcı doğrulaması başarısız:\n${failures.join('\n')}`);
console.log('Yıllık izin ücreti hesaplayıcısı doğrulandı: formül, vergi/SGK bağlamı, SEO ve privacy guardları aktif.');
