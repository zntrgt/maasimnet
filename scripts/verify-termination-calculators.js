import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const dist = join(process.cwd(), 'dist');
const pages = [
  ['/tazminat-hesaplama/', 'Tazminat Hesaplama 2026', 'combined'],
  ['/kidem-tazminati-hesaplama/', 'Kıdem Tazminatı Hesaplama 2026', 'severance'],
  ['/ihbar-tazminati-hesaplama/', 'İhbar Tazminatı Hesaplama 2026', 'notice']
];

for (const [route, h1, type] of pages) {
  const html = await readFile(join(dist, route.replace(/^\/+|\/+$/g, ''), 'index.html'), 'utf8');
  assert.match(html, new RegExp(`<h1>${h1.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), `${route}: doğru H1 bulunmalı`);
  assert.match(html, new RegExp(`data-termination-calculator="${type}"`), `${route}: doğru hesaplayıcı tipi bulunmalı`);
  assert.match(html, /\/assets\/termination-calculators\.js/, `${route}: hesaplayıcı JS asseti bulunmalı`);
  assert.match(html, /\/assets\/termination-calculators\.css/, `${route}: hesaplayıcı CSS asseti bulunmalı`);
  assert.match(html, /"@type":"WebApplication"/, `${route}: WebApplication schema bulunmalı`);
  assert.match(html, /"@type":"FAQPage"/, `${route}: FAQPage schema bulunmalı`);
  assert.match(html, /csgb\.gov\.tr/i, `${route}: ÇSGB resmî kaynak bağlantısı bulunmalı`);
  assert.doesNotMatch(html, /<meta\b[^>]*name=["']robots["'][^>]*noindex/i, `${route}: indexlenebilir olmalı`);
  assert.doesNotMatch(html, /name="baseGross"[^>]*value=/i, `${route}: maaş alanı varsayılan değer taşımamalı`);
}

const engine = await readFile(join(dist, 'assets', 'termination-engine.js'), 'utf8');
const ui = await readFile(join(dist, 'assets', 'termination-calculators.js'), 'utf8');
assert.match(engine, /calculateSeverance/);
assert.match(engine, /calculateNotice/);
assert.match(engine, /get2026SeveranceCeilingKurus/);
assert.match(ui, /termination_calculator_complete/);
assert.match(ui, /Cookiebot\?\.consent\?\.statistics\s*!==\s*true/, 'Tazminat eventleri Cookiebot istatistik iznine bağlı olmalı');
assert.match(ui, /typeof globalThis\.gtag\s*!==\s*['"]function['"]/, 'Tazminat eventleri gtag üzerinden gönderilmeli');
assert.doesNotMatch(ui, /dataLayer\.push\s*\(\s*\{\s*event:\s*['"]termination_calculator_complete['"]/, 'Tazminat eventleri doğrudan dataLayer içine yazılmamalı');

console.log(`Tazminat hesaplayıcı doğrulaması başarılı: ${pages.length} sayfa, schema, kaynaklar, boş başlangıç, consent-gated analytics ve hesap motoru.`);
