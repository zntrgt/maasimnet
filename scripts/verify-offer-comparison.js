import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const dist = join(process.cwd(), 'dist');
const html = await readFile(join(dist, 'maas-teklifi-karsilastirma', 'index.html'), 'utf8');
const app = await readFile(join(dist, 'assets', 'offer-comparison.js'), 'utf8');
const home = await readFile(join(dist, 'index.html'), 'utf8');
const sitemap = await readFile(join(dist, 'sitemap.xml'), 'utf8');

for (const token of [
  '<title>Maaş Teklifi Karşılaştırma 2026',
  'id="current-salary"',
  'id="offer-salary"',
  'id="offer-start-month"',
  'id="compare-annual-net-diff"',
  'id="compare-package-diff"',
  'id="comparison-verdict"',
  'application/ld+json',
  '/assets/offer-comparison.js'
]) assert(html.includes(token), `Teklif karşılaştırma çıktısı eksik: ${token}`);

assert(home.includes('/maas-teklifi-karsilastirma/'), 'Ana sayfada teklif karşılaştırma CTA bağlantısı eksik.');
assert(sitemap.includes('https://maasim.net/maas-teklifi-karsilastirma/'), 'Teklif karşılaştırma URL sitemap içinde yok.');

for (const token of [
  'solveMonthlyGrossForFixedNet',
  'calculatePayrollYear',
  'summarizePayroll',
  'localStorage.setItem',
  'month < startMonth ? gross : offerGrosses[month]',
  'month < startMonth || !offerPackage ? currentPackage.extraTl : offerPackage.extraTl',
  'annualBenefitsKurus',
  'firstBracketMonth(rows, 270000)'
]) assert(app.includes(token), `Teklif karşılaştırma motoru eksik: ${token}`);

assert(!app.includes('fetch('), 'Maaş karşılaştırma verileri sunucuya gönderilmemeli.');
console.log('Maaş teklifi karşılaştırma sayfası, karma başlangıç ayı hesabı, gizlilik ve iç linkler doğrulandı.');
