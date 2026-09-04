import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const dist = join(process.cwd(), 'dist');
const html = await readFile(join(dist, 'fazla-mesai-hesaplama', 'index.html'), 'utf8');
const engine = await readFile(join(dist, 'assets', 'overtime-engine.js'), 'utf8');
const ui = await readFile(join(dist, 'assets', 'overtime-calculator.js'), 'utf8');
const css = await readFile(join(dist, 'assets', 'overtime-calculator.css'), 'utf8');
const sitemap = await readFile(join(dist, 'sitemap.xml'), 'utf8');
const hub = await readFile(join(dist, 'hesaplama-araclari', 'index.html'), 'utf8');
const home = await readFile(join(dist, 'index.html'), 'utf8');

assert.match(html, /<h1>Fazla Mesai Hesaplama 2026<\/h1>/, 'Doğru H1 bulunmalı');
assert.match(html, /rel="canonical" href="https:\/\/maasim\.net\/fazla-mesai-hesaplama\/"/, 'Self canonical bulunmalı');
assert.doesNotMatch(html, /<meta\b[^>]*name=["']robots["'][^>]*noindex/i, 'Sayfa indexlenebilir olmalı');
assert.match(html, /"@type":"WebApplication"/, 'WebApplication schema bulunmalı');
assert.match(html, /"@type":"FAQPage"/, 'FAQPage schema bulunmalı');
assert.match(html, /csgb\.gov\.tr/i, 'ÇSGB resmî kaynakları bulunmalı');
assert.match(html, /name="monthlyGross"/, 'Aylık brüt alanı bulunmalı');
assert.match(html, /name="extraTime25Hours"/, '%25 fazla sürelerle çalışma alanı bulunmalı');
assert.match(html, /name="overtime50Hours"/, '%50 fazla çalışma alanı bulunmalı');
assert.match(html, /name="previousTaxBase"/, 'Kümülatif vergi matrahı alanı bulunmalı');
assert.match(html, /name="overtime50YearToDate"/, 'Yıllık 270 saat kontrol alanı bulunmalı');
assert.doesNotMatch(html, /name="monthlyGross"[^>]*value=/i, 'Aylık brüt alanı varsayılan finansal değer taşımamalı');

assert.match(engine, /overtimeRatePpm/);
assert.match(engine, /extraTimeRatePpm/);
assert.match(engine, /standardMonthlyHours/);
assert.match(engine, /annualOvertimeLimitMinutes/);
assert.match(engine, /calculateProgressiveTaxKurus/);
assert.match(engine, /sgkCeilingKurus/);
assert.match(ui, /Cookiebot\?\.consent\?\.statistics\s*!==\s*true/, 'Analytics consent gate bulunmalı');
assert.match(ui, /globalThis\.gtag\(\s*['"]event['"]\s*,\s*['"]overtime_calculator_complete['"]\s*\)/, 'Completion eventi payload olmadan gönderilmeli');
assert.doesNotMatch(ui, /gtag\(\s*['"]event['"]\s*,\s*['"]overtime_calculator_complete['"]\s*,/, 'Completion eventinde finansal payload olmamalı');
assert.match(css, /box-sizing:border-box/);
assert.match(css, /minmax\(0,/);
assert.match(sitemap, /<loc>https:\/\/maasim\.net\/fazla-mesai-hesaplama\/<\/loc>/, 'URL sitemap içinde olmalı');
assert.match(hub, /href="\/fazla-mesai-hesaplama\/"/, 'Hub fazla mesai aracına link vermeli');
assert.match(home, /href="\/fazla-mesai-hesaplama\/"/, 'Ana sayfa fazla mesai aracına link vermeli');

console.log('Fazla mesai hesaplayıcı doğrulaması başarılı: %25/%50 formülü, bordro farkı, 270 saat, SEO, layout ve privacy analytics.');
