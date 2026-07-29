import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const transformJs = await readFile(new URL('../scripts/apply-result-hierarchy.js', import.meta.url), 'utf8');
const stylesCss = await readFile(new URL('../src/result-hierarchy.css', import.meta.url), 'utf8');
const buildJs = await readFile(new URL('../scripts/build.js', import.meta.url), 'utf8');

test('aylık ortalama net tek hero kart olarak üretilir', () => {
  assert.match(transformJs, /class="metric-hero"/);
  assert.match(transformJs, /id="stat-avg-net-context"/);
  assert.match(transformJs, /<details class="secondary-metrics">/);
});

test('işveren maliyeti opsiyonel alana taşınır', () => {
  assert.match(transformJs, /class="employer-options"/);
  assert.match(transformJs, /Bu seçim net maaşı etkilemez/);
  assert.match(transformJs, /id="stat-avg-cost"/);
});

test('CSV ikincil ve sonuç yokken devre dışıdır', () => {
  assert.match(transformJs, /id="download-csv-button"/);
  assert.match(transformJs, /csvButton\.disabled = !hasValidResult/);
  assert.match(stylesCss, /\.cta-button--download\{background:transparent/);
});

test('netten brüte temsili brüt ve katlanabilir aylık tablo sunar', () => {
  assert.match(transformJs, /id="representative-gross-value"/);
  assert.match(transformJs, /id="toggle-net-gross-table"/);
  assert.match(transformJs, /toggleNetGrossTable/);
  assert.match(transformJs, /Bu neti tutmak için ortalama brüt yaklaşık/);
});

test('build sonucu hiyerarşi dönüşümünü uygular ve sürümü yükseltir', () => {
  assert.match(buildJs, /applyResultHierarchy\(distDir\)/);
  assert.match(buildJs, /0\.4\.0-result-hierarchy/);
});
