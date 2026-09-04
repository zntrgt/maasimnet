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
  assert.match(html, /gib\.gov\.tr/i, `${route}: GİB resmî kaynak bağlantısı bulunmalı`);
  assert.match(html, /name="annualRegularBenefits"/i, `${route}: yıllık düzenli prim/ikramiye alanı bulunmalı`);
  assert.match(html, /name="remainingStampTaxExemption"/i, `${route}: kullanılmamış damga vergisi istisnası alanı bulunmalı`);
  assert.doesNotMatch(html, /ozelge\/23157/i, `${route}: ilgisiz eski GİB özelge bağlantısı bulunmamalı`);
  assert.match(html, /ozelge\/21388/i, `${route}: aynı ay tazminat/vergi istisnası için doğru GİB kaynağı bulunmalı`);
  if (type !== 'severance') {
    assert.match(html, /name="previousTaxBase"/i, `${route}: kümülatif vergi matrahı alanı bulunmalı`);
    assert.match(html, /name="remainingIncomeTaxExemption"/i, `${route}: kullanılmamış gelir vergisi istisnası alanı bulunmalı`);
  }
  if (type !== 'notice') {
    assert.match(html, /data-result="severance-formula"/i, `${route}: denetlenebilir kıdem formülü bulunmalı`);
    assert.match(html, /data-severance-results/i, `${route}: kıdem sonuç scope'u bulunmalı`);
  }
  if (type !== 'severance') {
    assert.match(html, /data-notice-results/i, `${route}: ihbar sonuç scope'u bulunmalı`);
  }
  assert.doesNotMatch(html, /<meta\b[^>]*name=["']robots["'][^>]*noindex/i, `${route}: indexlenebilir olmalı`);
  assert.doesNotMatch(html, /name="baseGross"[^>]*value=/i, `${route}: maaş alanı varsayılan değer taşımamalı`);
}

const engine = await readFile(join(dist, 'assets', 'termination-engine.js'), 'utf8');
const ui = await readFile(join(dist, 'assets', 'termination-calculators.js'), 'utf8');
const css = await readFile(join(dist, 'assets', 'termination-calculators.css'), 'utf8');
assert.match(engine, /calculateSeverance/);
assert.match(engine, /calculateNotice/);
assert.match(engine, /get2026SeveranceCeilingKurus/);
assert.match(engine, /get2026MonthlyTaxExemptionCaps/);
assert.match(engine, /annualRegularBenefitsKurus/);
assert.match(engine, /annualRegularBenefitsMonthlyKurus/);
assert.match(engine, /remainingIncomeTaxExemptionKurus/);
assert.match(engine, /remainingStampTaxExemptionKurus/);
assert.match(ui, /data-severance-results/);
assert.match(ui, /data-notice-results/);
assert.match(ui, /termination_calculator_complete/);
assert.match(ui, /Cookiebot\?\.consent\?\.statistics\s*!==\s*true/, 'Tazminat eventleri Cookiebot istatistik iznine bağlı olmalı');
assert.match(ui, /typeof globalThis\.gtag\s*!==\s*['"]function['"]/, 'Tazminat eventleri gtag üzerinden gönderilmeli');
assert.doesNotMatch(ui, /dataLayer\.push\s*\(\s*\{\s*event:\s*['"]termination_calculator_complete['"]/, 'Tazminat eventleri doğrudan dataLayer içine yazılmamalı');
assert.match(css, /termination-page \*,\.termination-page \*::before,\.termination-page \*::after\{box-sizing:border-box\}/, 'Tazminat sayfası global border-box kullanmalı');
assert.match(css, /\.termination-grid>\*\{min-width:0;max-width:100%\}/, 'Grid çocukları konteyner dışına taşmamalı');
assert.match(css, /\.termination-field input\{[^}]*width:100%;max-width:100%;min-width:0/, 'Form inputları kendi kolonuna sığmalı');

console.log(`Tazminat hesaplayıcı doğrulaması başarılı: ${pages.length} sayfa, doğru kaynaklar, yıllık yan hak payı, formül, scoped sonuçlar, layout güvenliği ve consent-gated analytics.`);
