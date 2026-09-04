import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const dist = join(root,'dist');
const routes = [
  ['resmi-tatil-mesai-ucreti-hesaplama','Resmî Tatil Mesai Ücreti Hesaplama 2026','holiday'],
  ['hafta-tatili-ucreti-hesaplama','Hafta Tatili Ücreti Hesaplama 2026','weekly_rest'],
  ['part-time-maas-hesaplama','Part-Time Maaş Hesaplama 2026','part_time'],
  ['eksik-gun-maas-hesaplama','Eksik Gün Maaş Hesaplama 2026','partial_month'],
  ['sgk-prim-hesaplama','SGK Prim Hesaplama 2026','sgk']
];

for (const [route,h1,type] of routes) {
  const html = await readFile(join(dist,route,'index.html'),'utf8');
  for (const token of [
    `<h1>${h1}</h1>`,
    `data-worktime-calculator`,
    `data-type="${type}"`,
    `<link rel="canonical" href="https://maasim.net/${route}/">`,
    'WebApplication',
    'FAQPage',
    '/assets/worktime-calculators.js',
    '/assets/worktime-calculators.css',
    'Finansal girdiler analytics’e gönderilmez',
    'data-calculator-results hidden'
  ]) if (!html.includes(token)) throw new Error(`${route}: zorunlu hesaplayıcı/SEO işareti eksik: ${token}`);
  if (/noindex/i.test(html)) throw new Error(`${route}: noindex olmamalı.`);
}

const js = await readFile(join(root,'src','worktime-calculators.js'),'utf8');
for (const eventName of [
  'public_holiday_calculator_complete',
  'weekly_rest_calculator_complete',
  'part_time_calculator_complete',
  'partial_month_calculator_complete',
  'sgk_premium_calculator_complete'
]) {
  if (!js.includes(`'${eventName}'`)) throw new Error(`Analytics completion eventi eksik: ${eventName}`);
  const re = new RegExp(`gtag\\(\\s*['\"]event['\"]\\s*,\\s*eventName\\s*\\)`);
  if (!re.test(js)) throw new Error('Tier C analytics eventi finansal payload olmadan gönderilmeli.');
}
for (const forbidden of ['salary_amount','gross_salary_value','pek_amount','worked_days_value','premium_days_value','previous_tax_base:']) {
  if (js.includes(forbidden)) throw new Error(`Tier C analytics/input minimizasyonunda yasak alan: ${forbidden}`);
}

const hub = await readFile(join(dist,'hesaplama-araclari','index.html'),'utf8');
if (!hub.includes('data-tier-c-discovery="v1"')) throw new Error('Tier C araçlar hesaplama hubına eklenmedi.');
for (const [route] of routes) if (!hub.includes(`href="/${route}/"`)) throw new Error(`Hub Tier C linki eksik: ${route}`);
const sitemap = await readFile(join(dist,'sitemap.xml'),'utf8');
for (const [route] of routes) if (!sitemap.includes(`<loc>https://maasim.net/${route}/</loc>`)) throw new Error(`Sitemap Tier C URL eksik: ${route}`);

console.log('Tier C çalışma/SGK hesaplayıcıları doğrulandı: 5 route, SEO, hub, sitemap ve privacy-safe analytics.');
