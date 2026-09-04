import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const dist = new URL('../dist/', import.meta.url).pathname;
const years = [2025, 2024, 2023, 2022, 2021, 2020];
const route = (year) => `/${year}-maas-hesaplama/`;
const file = (year) => join(dist, `${year}-maas-hesaplama`, 'index.html');

function requireText(html, needle, label) {
  if (!html.includes(needle)) throw new Error(`${label} eksik: ${needle}`);
}

for (const asset of ['historical-payroll-data.js','historical-payroll-engine.js','historical-payroll-calculator.js','historical-payroll-calculator.css']) {
  await access(join(dist, 'assets', asset));
}

for (const year of years) {
  const html = await readFile(file(year), 'utf8');
  const canonical = `https://maasim.net${route(year)}`;
  requireText(html, `<title>${year} Maaş Hesaplama | Brütten Nete &amp; Netten Brüte | Maaşım.net</title>`, `${year} title`);
  requireText(html, `<h1>${year} Maaş Hesaplama: Brütten Nete &amp; Netten Brüte</h1>`, `${year} H1`);
  requireText(html, `rel="canonical" href="${canonical}"`, `${year} canonical`);
  requireText(html, 'content="index,follow,max-image-preview:large"', `${year} robots`);
  requireText(html, '"@type":"WebApplication"', `${year} WebApplication schema`);
  requireText(html, '"@type":"FAQPage"', `${year} FAQ schema`);
  requireText(html, '"@type":"BreadcrumbList"', `${year} breadcrumb schema`);
  requireText(html, `data-historical-payroll-calculator`, `${year} calculator root`);
  requireText(html, `data-historical-year="${year}"`, `${year} year contract`);
  requireText(html, '/assets/historical-payroll-calculator.css', `${year} stylesheet`);
  requireText(html, '/assets/historical-payroll-calculator.js', `${year} module`);
  requireText(html, `${year} resmî asgari ücret`, `${year} official minimum benchmark`);
  requireText(html, 'Resmî Kaynaklar ve Güncellik', `${year} visible freshness`);
  requireText(html, 'ÇSGB', `${year} ministry source`);
  requireText(html, 'GİB', `${year} tax authority source`);
  requireText(html, 'Bu sayfa tarihsel bir bordro aracıdır', `${year} historical/current separation`);
  requireText(html, 'Standart 4/a ücret bordrosu', `${year} scope disclosure`);
  if (/noindex/i.test(html)) throw new Error(`${year} sayfasında noindex bulundu.`);

  if (year <= 2021) {
    requireText(html, 'name="agi_option"', `${year} AGİ family selector`);
    requireText(html, 'ilave AGİ', `${year} additional AGİ rule`);
  } else {
    if (html.includes('name="agi_option"')) throw new Error(`${year} sayfasında AGİ seçimi olmamalı.`);
    requireText(html, 'asgari ücret vergi istisnası', `${year} minimum-wage tax exemption copy`);
  }
  if (year === 2022 || year === 2023) requireText(html, 'Temmuz–Aralık', `${year} mid-year benchmark`);
}

const hub = await readFile(join(dist, 'hesaplama-araclari', 'index.html'), 'utf8');
const home = await readFile(join(dist, 'index.html'), 'utf8');
const sitemap = await readFile(join(dist, 'sitemap.xml'), 'utf8');
for (const year of years) {
  const path = route(year);
  requireText(hub, `href="${path}"`, `${year} hub internal link`);
  requireText(home, `href="${path}"`, `${year} homepage internal link`);
  requireText(hub, `https://maasim.net${path}`, `${year} hub ItemList`);
  requireText(sitemap, `<loc>https://maasim.net${path}</loc>`, `${year} sitemap`);
}
requireText(hub, 'data-historical-discovery="v1"', 'historical hub discovery marker');
requireText(home, 'data-historical-discovery="v1"', 'historical homepage discovery marker');
requireText(hub, '2020–2025 tarihsel maaş hesaplama', 'historical hub heading');

const client = await readFile(join(dist, 'assets', 'historical-payroll-calculator.js'), 'utf8');
for (const forbidden of ['fetch(', 'XMLHttpRequest', 'navigator.sendBeacon', 'gtag(', 'dataLayer.push']) {
  if (client.includes(forbidden)) throw new Error(`Tarihsel hesaplayıcı finansal girdiyi ağ/analytics katmanına gönderebilecek ifade içeriyor: ${forbidden}`);
}

console.log(`Tarihsel maaş hesaplayıcı sözleşmesi doğrulandı: ${years.length} yıl; motor + SEO + discovery + sitemap + privacy.`);
