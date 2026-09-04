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
for (const route of ['/asgari-ucret-hesaplama/', '/kidem-tazminati-hesaplama/', '/ihbar-tazminati-hesaplama/', '/tazminat-hesaplama/', '/issizlik-maasi-hesaplama/', '/fazla-mesai-hesaplama/', '/yillik-izin-ucreti-hesaplama/']) {
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
    for (const target of ['/asgari-ucret-hesaplama/', '/issizlik-maasi-hesaplama/', '/fazla-mesai-hesaplama/', '/yillik-izin-ucreti-hesaplama/']) {
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
for (const route of ['/hesaplama-araclari/', '/issizlik-maasi-hesaplama/', '/fazla-mesai-hesaplama/', '/yillik-izin-ucreti-hesaplama/', '/asgari-ucret-hesaplama/']) {
  assert.match(sitemap, new RegExp(`<loc>https:\\/\\/maasim\\.net${route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}<\\/loc>`), `Sitemap içinde olmalı: ${route}`);
}

console.log(`Hesaplayıcı keşif mimarisi doğrulandı: hub + ana sayfa + sade enterprise header + ${contextual} bağlamsal otorite sayfası.`);
