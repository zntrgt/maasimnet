import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const dist = join(process.cwd(), 'dist');
const read = (route) => readFile(join(dist, route.replace(/^\/+|\/+$/g, ''), 'index.html'), 'utf8');

const hub = await read('/hesaplama-araclari/');
assert.match(hub, /<h1>Maaş ve Çalışan Hakları Hesaplama Araçları<\/h1>/, 'Hub H1 eksik');
assert.match(hub, /rel="canonical" href="https:\/\/maasim\.net\/hesaplama-araclari\/"/, 'Hub canonical eksik');
assert.match(hub, /"@type":"ItemList"/, 'Hub ItemList schema eksik');
assert.doesNotMatch(hub, /noindex/i, 'Hub indexlenebilir olmalı');

const requiredToolRoutes = [
  '/',
  '/maas-zam-hesaplama/',
  '/asgari-ucret-hesaplama/',
  '/tazminat-hesaplama/',
  '/kidem-tazminati-hesaplama/',
  '/ihbar-tazminati-hesaplama/',
  '/issizlik-maasi-hesaplama/',
  '/fazla-mesai-hesaplama/',
  '/yillik-izin-ucreti-hesaplama/'
];
for (const route of requiredToolRoutes) {
  assert.match(hub, new RegExp(`href="${route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`), `Hub zorunlu araca link vermeli: ${route}`);
  if (route !== '/') await access(join(dist, route.replace(/^\/+|\/+$/g, ''), 'index.html'));
}

const home = await readFile(join(dist, 'index.html'), 'utf8');
for (const route of ['/maas-zam-hesaplama/', '/asgari-ucret-hesaplama/', '/kidem-tazminati-hesaplama/', '/ihbar-tazminati-hesaplama/', '/tazminat-hesaplama/', '/issizlik-maasi-hesaplama/', '/fazla-mesai-hesaplama/', '/yillik-izin-ucreti-hesaplama/']) {
  assert.match(home, new RegExp(`href="${route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`), `Ana sayfa araca link vermeli: ${route}`);
}
assert.match(home, /data-calculator-discovery="v1"/, 'Ana sayfada görünür hesaplama araçları modülü eksik');
assert.match(home, /site-nav site-nav--desktop[\s\S]*href="\/hesaplama-araclari\/">Hesaplama Araçları<\/a>/, 'Desktop header Hesaplama Araçları linki eksik');
assert.match(home, /site-nav site-nav--desktop[\s\S]*href="\/tazminat-hesaplama\/">Kıdem &amp; İhbar<\/a>/, 'Desktop header Kıdem & İhbar linki eksik');
assert.match(home, /site-nav site-nav--desktop[\s\S]*href="\/isveren-maliyeti-hesaplama\/">İşveren Maliyeti<\/a>/, 'Desktop header İşveren Maliyeti linki eksik');
assert.match(home, /data-calculator-discovery-css="v1"/, 'Discovery modülü CSS containment eksik');

let contextual = 0;
for (const route of ['/veriler/2026/', '/hesaplama-metodolojisi/', '/sss/', '/sozluk/', '/senaryolar/']) {
  try {
    const html = await read(route);
    assert.match(html, /data-calculator-discovery="v1"/, `${route}: bağlamsal hesaplayıcı link modülü eksik`);
    for (const target of ['/maas-zam-hesaplama/', '/asgari-ucret-hesaplama/', '/issizlik-maasi-hesaplama/', '/fazla-mesai-hesaplama/', '/yillik-izin-ucreti-hesaplama/']) {
      assert.match(html, new RegExp(`href="${target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`), `${route}: bağlamsal link eksik: ${target}`);
    }
    contextual += 1;
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
}
assert.ok(contextual >= 4, `En az 4 otorite sayfası hesaplayıcıları desteklemeli; bulundu: ${contextual}`);

try {
  const article = await read('/blog/kidem-tazminatina-dahil-odemeler/');
  for (const route of ['/kidem-tazminati-hesaplama/', '/ihbar-tazminati-hesaplama/', '/tazminat-hesaplama/', '/yillik-izin-ucreti-hesaplama/']) {
    assert.match(article, new RegExp(`href="${route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`), `Kıdem blogu ilgili hesaplayıcıya link vermeli: ${route}`);
  }
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

const sitemap = await readFile(join(dist, 'sitemap.xml'), 'utf8');
for (const route of ['/hesaplama-araclari/', '/maas-zam-hesaplama/', '/issizlik-maasi-hesaplama/', '/fazla-mesai-hesaplama/', '/yillik-izin-ucreti-hesaplama/', '/asgari-ucret-hesaplama/']) {
  assert.match(sitemap, new RegExp(`<loc>https:\\/\\/maasim\\.net${route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}<\\/loc>`), `Sitemap içinde olmalı: ${route}`);
}

console.log(`Hesaplayıcı keşif mimarisi doğrulandı: hub + ana sayfa + sade enterprise header + ${contextual} bağlamsal otorite sayfası + maaş zam aracı.`);

const temporaryBenefit=await read('/is-goremezlik-odenegi-hesaplama/');
for(const token of ['id="tb-form"','id="tb-kind"','id="tb-treatment"','id="tb-prior-days"','id="tb-pek"','id="tb-total"','2.202,00 TL','5.872,00 TL','"@type":"WebApplication"','"@type":"FAQPage"','/assets/temporary-benefit-calculator.js','https://www.turkiye.gov.tr/4ab-isgoremezlik-odemesi-gorme'])assert.ok(temporaryBenefit.includes(token),'A11 eksik: '+token);
assert.ok(hub.includes('href="/is-goremezlik-odenegi-hesaplama/"'));
assert.ok(sitemap.includes('<loc>https://maasim.net/is-goremezlik-odenegi-hesaplama/</loc>'));
await access(join(dist,'assets','temporary-benefit-engine.js'));
await access(join(dist,'assets','temporary-benefit-calculator.js'));

const dailyWagePage=await read('/gunluk-ucret-hesaplama/');
for(const token of ['id="dw-form"','id="dw-kind"','id="dw-monthly"','id="dw-daily"','id="dw-hourly"','1.101,00 TL','146,80 TL','935,85 TL','124,78 TL','"@type":"WebApplication"','"@type":"BreadcrumbList"','/assets/daily-wage-calculator.js','href="/part-time-maas-hesaplama/"','href="/eksik-gun-maas-hesaplama/"'])assert.ok(dailyWagePage.includes(token),'A12 eksik: '+token);
assert.ok(hub.includes('href="/gunluk-ucret-hesaplama/"'));
assert.ok(sitemap.includes('<loc>https://maasim.net/gunluk-ucret-hesaplama/</loc>'));
await access(join(dist,'assets','daily-wage-engine.js'));
await access(join(dist,'assets','daily-wage-calculator.js'));
