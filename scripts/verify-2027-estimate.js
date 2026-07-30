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
const css = await readFile(join(dist, 'assets', 'styles.css'), 'utf8');

for (const token of [
  '<link rel="canonical" href="https://maasim.net/2027-maas-hesaplama/">',
  'Tahmini parametreler · Resmî 2027 verisi değildir',
  'Bu bir tahmin aracıdır; bordro veya resmî hesaplama değildir.',
  'Son uyarı: Sonuçlar resmî değildir',
  'id="estimate-minimum-gross"',
  'id="estimate-sgk-ceiling"',
  'id="estimate-bracket-1"',
  'id="estimate-bracket-4"',
  'id="estimate-table-body"',
  'type="module" src="/assets/estimate-2027.js"',
  '"@type":"WebApplication"'
]) {
  if (!html.includes(token)) throw new Error(`2027 tahmin sayfası eksik: ${token}`);
}

for (const token of [
  'calculatePayrollYear',
  'summarizePayroll',
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
if (!css.includes('/* 2027 tahmini maaş hesaplama sayfası */')) {
  throw new Error('2027 tahmin sayfası stilleri ana CSS içinde değil.');
}

const warningCount = (html.match(/resmî değil|resmî değildir|resmî olmayan|tahmin aracıdır/gi) || []).length;
if (warningCount < 6) throw new Error(`2027 sayfasında görünür uyarı sayısı yetersiz: ${warningCount}`);

console.log('2027 tahmini maaş hesaplayıcı; görünür uyarılar, sitemap, iç link ve interaktif parametrelerle doğrulandı.');
