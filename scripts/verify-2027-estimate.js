import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const dist = join(process.cwd(), 'dist');
const pagePath = join(dist, '2027-maas-hesaplama', 'index.html');
const assetPath = join(dist, 'assets', 'estimate-2027.js');
await access(pagePath);
await access(assetPath);

const html = await readFile(pagePath, 'utf8');
const app = await readFile(assetPath, 'utf8');
const sitemap = await readFile(join(dist, 'sitemap.xml'), 'utf8');
const blog = await readFile(join(dist, 'blog', '2027-maas-zammi-beklentileri', 'index.html'), 'utf8');
const home = await readFile(join(dist, 'index.html'), 'utf8');
const css = await readFile(join(dist, 'assets', 'styles.css'), 'utf8');

for (const token of [
  '<title>2027 Brütten Nete Maaş Hesaplama | Netten Brüte Tahmin | Maaşım.net</title>',
  'content="2027 brütten nete maaş hesaplama aracıyla tahmini net maaşınızı görün; netten brüte hesaplayın, asgari ücret, SGK tavanı ve vergi dilimi varsayımlarını değiştirin.',
  '<link rel="canonical" href="https://maasim.net/2027-maas-hesaplama/">',
  '<link rel="modulepreload" href="/assets/estimate-2027.js">',
  '<link rel="modulepreload" href="/assets/payroll-engine.js">',
  '<link rel="modulepreload" href="/assets/parameters-2026.js">',
  'Tahmini parametreler · Resmî 2027 verisi değildir',
  'Bu bir tahmin aracıdır; bordro veya resmî hesaplama değildir.',
  'Son uyarı: Sonuçlar resmî değildir',
  '<h1>2027 Brütten Nete Maaş Hesaplama ve Netten Brüte Tahmin</h1>',
  'id="estimate-mode-gross"',
  'id="estimate-mode-net"',
  'id="estimate-salary"',
  'id="estimate-minimum-gross"',
  'id="estimate-sgk-ceiling"',
  'id="estimate-bracket-1"',
  'id="estimate-bracket-4"',
  'id="estimate-table-body"',
  '2027 brütten nete maaş nasıl hesaplanır?',
  '2027 netten brüte maaş nasıl hesaplanır?',
  'Temkinli, orta ve yüksek 2027 senaryoları',
  'İlk yayın: 30 Temmuz 2026',
  'Durum: Resmî 2027 parametreleri bekleniyor',
  'href="/hesaplama-metodolojisi/"',
  'href="/veriler/2026-gelir-vergisi-dilimleri/"',
  'type="module" src="/assets/estimate-2027.js"',
  '"@type":"WebApplication"',
  '"@type":"FAQPage"',
  '"name":"2027 Brütten Nete Maaş Hesaplama"'
]) {
  if (!html.includes(token)) throw new Error(`2027 tahmin sayfası eksik: ${token}`);
}

if ((html.match(/<details>/g) || []).length !== 8) {
  throw new Error('2027 tahmin sayfasında görünür 8 SSS bulunmalı.');
}
if ((html.match(/"@type":"Question"/g) || []).length !== 8) {
  throw new Error('2027 tahmin sayfasında 8 soruluk FAQ schema bulunmalı.');
}

for (const token of [
  'calculatePayrollYear',
  'solveMonthlyGrossForFixedNet',
  'summarizePayroll',
  "currentMode = 'gross'",
  "setMode('net')",
  'incomeTaxBrackets',
  'formatRates(row.incomeTaxRatesPpm)',
  "applyPreset('middle')"
]) {
  if (!app.includes(token)) throw new Error(`2027 tahmin uygulaması eksik: ${token}`);
}

if (!sitemap.includes('<loc>https://maasim.net/2027-maas-hesaplama/</loc>')) {
  throw new Error('2027 tahmin hesaplayıcı sitemap içinde değil.');
}
if (!blog.includes('href="/2027-maas-hesaplama/"')) {
  throw new Error('2027 beklenti yazısı tahmin hesaplayıcıya bağlanmıyor.');
}
for (const token of [
  'class="home-2027-estimate-cta"',
  '2027 ücret senaryolarını karşılaştır',
  'href="/2027-maas-hesaplama/">2027 brütten nete maaş hesaplama →</a>',
  'Tahmin aracı resmî 2027 bordrosu değildir'
]) {
  if (!home.includes(token)) throw new Error(`2026 ana sayfa 2027 yönlendirmesi eksik: ${token}`);
}

if (home.includes('brütten nete veya netten brüte tahmin yap')) {
  throw new Error('Ana sayfa 2027 exact-query açıklamasını sahiplenmemeli; dedicated URL yalnız linkle desteklenmeli.');
}
if (!home.includes('href="/2027-maas-hesaplama/">2027 Brütten Nete Maaş Hesaplama</a>')) {
  throw new Error('Sitewide footer dedicated 2027 URL’ye exact-anchor iç link vermiyor.');
}

for (const token of [
  '/* 2027 tahmini maaş hesaplama sayfası */',
  'content-visibility:auto',
  'contain-intrinsic-size:600px',
  '.home-2027-estimate-cta',
  '.estimate-mode button[aria-pressed=true]'
]) {
  if (!css.includes(token)) throw new Error(`2027 tahmin performans veya görünüm kuralı eksik: ${token}`);
}
if (html.includes('/assets/site-shell.css')) {
  throw new Error('2027 sayfasında ikinci render-blocking site-shell.css isteği kaldı.');
}

const warningCount = (html.match(/resmî değil|resmî değildir|resmî olmayan|tahmin aracıdır|tahminidir/gi) || []).length;
if (warningCount < 10) throw new Error(`2027 sayfasında görünür uyarı sayısı yetersiz: ${warningCount}`);

console.log('2027 dedicated URL arama niyeti, çift yönlü hesaplama, SEO/GEO içeriği, SSS, sitewide iç link ve cannibalization guardrail ile doğrulandı.');
