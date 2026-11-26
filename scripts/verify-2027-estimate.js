import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { DATA_2027, ESTIMATE_PRESETS_2027 } from '../src/data-2027.js';

const dist = join(process.cwd(), 'dist');
const pagePath = join(dist, '2027-maas-hesaplama', 'index.html');
const assetPath = join(dist, 'assets', 'estimate-2027.js');
await access(pagePath);
await access(assetPath);

const rawHtml = await readFile(pagePath, 'utf8');
// Asset revision queries are added by the final build step.
const html = rawHtml.replace(/(\/assets\/[^"?]+)\?rev=[^"&]+/g, '$1');
const app = await readFile(assetPath, 'utf8');
const sitemap = await readFile(join(dist, 'sitemap.xml'), 'utf8');
const blog = await readFile(join(dist, 'blog', '2027-maas-zammi-beklentileri', 'index.html'), 'utf8');
const home = await readFile(join(dist, 'index.html'), 'utf8');
const css = await readFile(join(dist, 'assets', 'styles.css'), 'utf8');

for (const token of [
  '<title>2027 Brütten Nete Maaş Hesaplama | Netten Brüte Tahmin | Maaşım.net</title>',
  'content="2026 maaşına %27, %30 veya %35 zam gelirse 2027 netin ne olur? Brüt/net beklentini gir, tahmini SGK ve vergiyle 12 aylık maaşını karşılaştır.',
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
  'İlk yayın: <time datetime="2026-07-30">30 Temmuz 2026</time>',
  'Son kontrol: <time datetime="2026-11-25">25 Kasım 2026</time>',
  '%27,83',
  'https://www.resmigazete.gov.tr/eskiler/2026/11/20261124-3.htm',
  'value="242877"',
  'value="511320"',
  'value="1917450"',
  'value="6774990"',
  'Durum: Resmî 2027 parametreleri bekleniyor',
  'href="/hesaplama-metodolojisi/"',
  'href="/blog/2026-maas-vergi-dilimleri/"',
  'type="module" src="/assets/estimate-2027.js"',
  '"@type":"WebApplication"',
  '"@type":"FAQPage"',
  '"name":"2027 Brütten Nete Maaş Hesaplama"'
]) {
  if (!html.includes(token)) throw new Error(`2027 tahmin sayfası eksik: ${token}`);
}

const faqHtml = html.match(/<div class="estimate-faq">([\s\S]*?)<\/div>/i)?.[1] || '';
if ((faqHtml.match(/<details\b/g) || []).length !== 10) {
  throw new Error('2027 tahmin sayfasında görünür 10 SSS bulunmalı.');
}
if ((html.match(/"@type":"Question"/g) || []).length !== 10) {
  throw new Error('2027 tahmin sayfasında 10 soruluk FAQ schema bulunmalı.');
}

for (const token of [
  'calculatePayrollYear',
  'solveMonthlyGrossForFixedNet',
  'summarizePayroll',
  "currentMode = 'gross'",
  "setMode('net')",
  'incomeTaxBrackets',
  'ESTIMATE_PRESETS_2027[name]',
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
const footer = home.match(/<footer\b[^>]*>([\s\S]*?)<\/footer>/i)?.[1] || '';
if (!/href="\/2027-maas-hesaplama\/"[^>]*>2027 Maaş Tahmini<\/a>/.test(footer)) {
  throw new Error('Sitewide footer 2027 tahmin aracına açıklayıcı iç link vermiyor.');
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

// The required-copy checks above verify the hero, calculator and final warning.
// Counting repeated wording across metadata and JSON-LD does not verify visibility.

console.log('2027 dedicated URL arama niyeti, çift yönlü hesaplama, SEO/GEO içeriği, SSS, sitewide iç link ve cannibalization guardrail ile doğrulandı.');

assert.equal(DATA_2027.revaluation.valueBps, 2783);
assert.deepEqual(ESTIMATE_PRESETS_2027.middle.brackets, [242877, 511320, 1917450, 6774990]);
assert.equal(ESTIMATE_PRESETS_2027.middle.minimum, 42939);
assert.equal(ESTIMATE_PRESETS_2027.middle.ceiling, 386451);
assert.ok(DATA_2027.pending.every(p => p.status === 'pending' && p.value === null));
for (const route of ['veriler', 'veriler/2027']) {
  const dataHtml = await readFile(join(dist, route, 'index.html'), 'utf8');
  assert.ok(dataHtml.includes('https://maasim.net/' + route + '/'));
  assert.ok(sitemap.includes('<loc>https://maasim.net/' + route + '/</loc>'));
  assert.ok(dataHtml.includes('%27,83'));
}
const annualHtml = await readFile(join(dist, 'veriler/2027/index.html'), 'utf8');
assert.ok(annualHtml.includes('[TAHMİN]') && annualHtml.includes(DATA_2027.revaluation.sourceUrl));
assert.ok((await readFile(join(dist,'llms.txt'),'utf8')).includes('https://maasim.net/veriler/2027/'));

const taxHtml = await readFile(join(dist,'vergi-dilimi-hesaplama/index.html'),'utf8');
for (const token of ['id="tax-bracket-form"','id="tax-prior"','id="tax-start-month"','id="tax-month-body"','id="tax-transition-body"','"@type":"WebApplication"','"@type":"FAQPage"','https://gib.gov.tr/mevzuat/kanun/433/madde/6937','istisna öncesi','/assets/tax-bracket-calculator.js']) assert.ok(taxHtml.includes(token),'Vergi dilimi sayfası eksik: '+token);
assert.ok(sitemap.includes('<loc>https://maasim.net/vergi-dilimi-hesaplama/</loc>'));
await access(join(dist,'assets/tax-bracket-engine.js'));
await access(join(dist,'assets/tax-bracket-calculator.js'));

for(const token of ['data-estimate-entry="raise" aria-pressed="true"','data-estimate-entry="direct"','data-estimate-raise="27"','data-estimate-raise="30"','data-estimate-raise="35"','id="estimate-custom-rate"','<details class="estimate-advanced">','id="estimate-compare-summary"','id="estimate-compare-body"','id="estimate-minimum-warning"','data-estimate-example="100k"','Net değişim (%)','Sabit net hedef','833.881,63 TL']) {
 if(!html.includes(token)&&!(token==='Sabit net hedef'&&app.includes(token)))throw new Error('2027 comparison missing: '+token);
}
const cta=home.match(/<aside class="home-2027-estimate-cta"[^>]*>[\s\S]*?<\/aside>/g)||[];
assert.equal(cta.length,1);
assert.ok(home.indexOf('data-enterprise-hero')<home.indexOf(cta[0]));
assert.ok(home.indexOf(cta[0])<home.indexOf('id="input-salary"'));
assert.ok(cta[0].includes('%27, %30 veya %35'));
const desktop=home.match(/<div class="site-nav site-nav--desktop"[^>]*>[\s\S]*?<\/div>/)?.[0]||'';
const mobile=home.match(/<div class="site-mobile-menu"[^>]*>[\s\S]*?<\/div>/)?.[0]||'';
assert.ok(desktop.includes('href="/2027-maas-hesaplama/"'));
assert.ok(mobile.includes('href="/2027-maas-hesaplama/"'));
assert.ok(home.includes('class="site-header__year-mobile" href="/2027-maas-hesaplama/"'));
for(const route of ['/','/veriler/2026/','/veriler/2027/','/maas-zam-hesaplama/','/senaryolar/','/temmuz-zam-senaryosu/','/100000-brut-maas-hesaplama/','/blog/maas-zam-gorusmesi-nasil-yapilir/','/blog/100000-tl-brut-maas-neti-2026/','/maas-teklifi-karsilastirma/','/blog/2026-maas-vergi-dilimleri/','/blog/netten-brute-maas-neden-aylik-degisir/','/asgari-ucret-hesaplama/','/blog/2027-maas-zammi-beklentileri/']){
 const page=await readFile(join(dist,route.slice(1),'index.html'),'utf8');
 const main=page.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0]||'';
 assert.ok(main.includes('href="/2027-maas-hesaplama/"'),route+': 2027 main-content link missing');
}
console.log('2027: two entry modes, 3 personal raises + custom, net change, static example and 14 contextual surfaces verified.');
