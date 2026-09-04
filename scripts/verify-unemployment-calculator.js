import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const dist = join(process.cwd(), 'dist');
const route = 'issizlik-maasi-hesaplama';
const html = await readFile(join(dist, route, 'index.html'), 'utf8');
const engine = await readFile(join(dist, 'assets', 'unemployment-engine.js'), 'utf8');
const ui = await readFile(join(dist, 'assets', 'unemployment-calculator.js'), 'utf8');
const css = await readFile(join(dist, 'assets', 'unemployment-calculator.css'), 'utf8');
const sitemap = await readFile(join(dist, 'sitemap.xml'), 'utf8');
const hub = await readFile(join(dist, 'hesaplama-araclari', 'index.html'), 'utf8');
const home = await readFile(join(dist, 'index.html'), 'utf8');

assert.match(html, /<h1>İşsizlik Maaşı Hesaplama 2026<\/h1>/, 'Doğru H1 bulunmalı');
assert.match(html, /rel="canonical" href="https:\/\/maasim\.net\/issizlik-maasi-hesaplama\/"/, 'Self canonical bulunmalı');
assert.doesNotMatch(html, /<meta\b[^>]*name=["']robots["'][^>]*noindex/i, 'Sayfa indexlenebilir olmalı');
assert.match(html, /"@type":"WebApplication"/, 'WebApplication schema bulunmalı');
assert.match(html, /"@type":"FAQPage"/, 'FAQPage schema bulunmalı');
assert.match(html, /\/assets\/unemployment-calculator\.js/, 'UI JS asseti bulunmalı');
assert.match(html, /\/assets\/unemployment-calculator\.css/, 'UI CSS asseti bulunmalı');
assert.match(html, /media\.iskur\.gov\.tr/i, 'İŞKUR resmî kaynak bağlantısı bulunmalı');
assert.match(html, /csgb\.gov\.tr/i, '2026 asgari ücret resmî kaynak bağlantısı bulunmalı');
assert.match(html, /name="pek1"/, 'Son 4 ay PEK alanları bulunmalı');
assert.match(html, /name="days1"/, 'Son 4 ay prim günü alanları bulunmalı');
assert.match(html, /name="premiumDaysLast3Years"/, 'Son 3 yıl prim günü alanı bulunmalı');
assert.match(html, /name="last120DaysUnderContract"/, 'Son 120 gün koşulu alanı bulunmalı');
assert.match(html, /name="involuntaryUnemployment"/, 'İşten ayrılma koşulu alanı bulunmalı');
assert.match(html, /name="applicationAfterDays"/, 'Başvuru gecikmesi alanı bulunmalı');
assert.doesNotMatch(html, /name="pek[1-4]"[^>]*value=/i, 'PEK alanları varsayılan finansal değer taşımamalı');

assert.match(engine, /benefitRatePpm/);
assert.match(engine, /monthlyGrossCapRatePpm/);
assert.match(engine, /getUnemploymentBenefitDurationDays/);
assert.match(engine, /premiumDaysLast3Years >= 1080/);
assert.match(engine, /premiumDaysLast3Years >= 900/);
assert.match(engine, /premiumDaysLast3Years >= 600/);
assert.match(engine, /applicationDaysWithoutLoss/);
assert.match(ui, /Cookiebot\?\.consent\?\.statistics\s*!==\s*true/, 'Analytics Cookiebot istatistik iznine bağlı olmalı');
assert.match(ui, /globalThis\.gtag\(\s*['"]event['"]\s*,\s*['"]unemployment_calculator_complete['"]\s*\)/, 'Completion eventi payload olmadan gönderilmeli');
assert.doesNotMatch(ui, /gtag\(\s*['"]event['"]\s*,\s*['"]unemployment_calculator_complete['"]\s*,/, 'Completion eventinde üçüncü analytics payloadı bulunmamalı');
assert.match(css, /box-sizing:border-box/, 'Form box model koruması bulunmalı');
assert.match(css, /minmax\(0,/, 'Grid taşma koruması bulunmalı');

assert.match(sitemap, /<loc>https:\/\/maasim\.net\/issizlik-maasi-hesaplama\/<\/loc>/, 'URL sitemap içinde olmalı');
assert.match(hub, /href="\/issizlik-maasi-hesaplama\/"/, 'Hub işsizlik hesaplayıcısına link vermeli');
assert.match(home, /href="\/issizlik-maasi-hesaplama\/"/, 'Ana sayfa işsizlik hesaplayıcısına link vermeli');

console.log('İşsizlik maaşı hesaplayıcı doğrulaması başarılı: formül, hak süresi, resmî kaynaklar, SEO, layout ve consent analytics.');
