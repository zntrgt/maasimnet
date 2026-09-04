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
  '/tazminat-hesaplama/',
  '/kidem-tazminati-hesaplama/',
  '/ihbar-tazminati-hesaplama/',
  '/issizlik-maasi-hesaplama/'
];
for (const route of requiredToolRoutes) {
  assert.match(hub, new RegExp(`href="${route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`), `Hub zorunlu araca link vermeli: ${route}`);
  if (route !== '/') await access(join(dist, route.replace(/^\/+|\/+$/g, ''), 'index.html'));
}

const home = await readFile(join(dist, 'index.html'), 'utf8');
assert.match(home, /data-calculator-discovery="v1"/, 'Ana sayfada görünür hesaplama araçları modülü eksik');
assert.match(home, /href="\/kidem-tazminati-hesaplama\/"/, 'Ana sayfa kıdem aracına link vermeli');
assert.match(home, /href="\/ihbar-tazminati-hesaplama\/"/, 'Ana sayfa ihbar aracına link vermeli');
assert.match(home, /href="\/tazminat-hesaplama\/"/, 'Ana sayfa kombine tazminat aracına link vermeli');
assert.match(home, /href="\/issizlik-maasi-hesaplama\/"/, 'Ana sayfa işsizlik maaşı aracına link vermeli');
assert.match(home, /site-nav site-nav--desktop[\s\S]*href="\/hesaplama-araclari\/">Araçlar<\/a>/, 'Desktop header Araçlar linki eksik');
assert.match(home, /site-nav site-nav--desktop[\s\S]*href="\/tazminat-hesaplama\/">Tazminat<\/a>/, 'Desktop header Tazminat linki eksik');
assert.match(home, /data-calculator-discovery-css="v1"/, 'Discovery modülü CSS containment eksik');

let contextual = 0;
for (const route of ['/veriler/2026/', '/hesaplama-metodolojisi/', '/sss/', '/sozluk/', '/senaryolar/']) {
  try {
    const html = await read(route);
    assert.match(html, /data-calculator-discovery="v1"/, `${route}: bağlamsal hesaplayıcı link modülü eksik`);
    assert.match(html, /href="\/issizlik-maasi-hesaplama\/"/, `${route}: işsizlik maaşı aracına bağlamsal link eksik`);
    contextual += 1;
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
}
assert.ok(contextual >= 4, `En az 4 otorite sayfası hesaplayıcıları desteklemeli; bulundu: ${contextual}`);

try {
  const article = await read('/blog/kidem-tazminatina-dahil-odemeler/');
  for (const route of ['/kidem-tazminati-hesaplama/', '/ihbar-tazminati-hesaplama/', '/tazminat-hesaplama/']) {
    assert.match(article, new RegExp(`href="${route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`), `Kıdem blogu ilgili hesaplayıcıya link vermeli: ${route}`);
  }
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

const sitemap = await readFile(join(dist, 'sitemap.xml'), 'utf8');
assert.match(sitemap, /<loc>https:\/\/maasim\.net\/hesaplama-araclari\/<\/loc>/, 'Hesaplama araçları hub sitemap içinde olmalı');
assert.match(sitemap, /<loc>https:\/\/maasim\.net\/issizlik-maasi-hesaplama\/<\/loc>/, 'İşsizlik maaşı hesaplayıcısı sitemap içinde olmalı');

console.log(`Hesaplayıcı keşif mimarisi doğrulandı: hub + ana sayfa + header + ${contextual} bağlamsal otorite sayfası + işsizlik maaşı aracı.`);
