import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const transformJs = await readFile(new URL('../scripts/apply-result-hierarchy.js', import.meta.url), 'utf8');
const stylesCss = await readFile(new URL('../src/result-hierarchy.css', import.meta.url), 'utf8');
const buildJs = await readFile(new URL('../scripts/build.js', import.meta.url), 'utf8');

test('aylık ortalama net tek hero kart ve açık detaylı özet olarak üretilir', () => {
  assert.match(transformJs, /class="metric-hero"/);
  assert.match(transformJs, /id="stat-avg-net-context"/);
  assert.match(transformJs, /<details class="secondary-metrics" open>/);
  assert.match(transformJs, /Detaylı maaş özeti/);
});

test('işveren maliyeti opsiyonel alana taşınır', () => {
  assert.match(transformJs, /class="employer-options"/);
  assert.match(transformJs, /Bu seçim net maaşı etkilemez/);
  assert.match(transformJs, /id="stat-avg-cost"/);
});

test('CSV ikincil ve sonuç yokken devre dışıdır', () => {
  assert.match(transformJs, /id="download-csv-button"/);
  assert.match(transformJs, /csvButton\.disabled = !hasValidResult/);
  assert.match(stylesCss, /\.cta-button--download\s*\{/);
  assert.match(stylesCss, /background:\s*transparent\s*!important/);
});

test('netten brüte temsili brüt ve varsayılan kapalı aylık tablo sunar', () => {
  assert.match(transformJs, /id="representative-gross-value"/);
  assert.match(transformJs, /id="toggle-net-gross-table"/);
  assert.match(transformJs, /toggleNetGrossTable/);
  assert.match(transformJs, /netGrossTableExpanded = false/);
  assert.doesNotMatch(transformJs, /netGrossTableExpanded = mode !== 'net'/);
  assert.match(transformJs, /Bu neti tutmak için ortalama brüt yaklaşık/);
});

test('sonuçlar bağımsız sağ kolonda, bordro genişliği korunarak gruplanır', () => {
  assert.match(transformJs, /class="calculator-results-column"/);
  assert.match(transformJs, /placeResultsColumn/);
  assert.match(stylesCss, /\.calculator-results-column\s*\{/);
  assert.match(stylesCss, /\.calculator-results-column > #payroll-results-shell/);
  assert.match(stylesCss, /min-width:\s*0/);
});

test('detaylı metrik ve bordro okunabilirlik stilleri korunur', () => {
  assert.match(stylesCss, /\.secondary-metrics > summary/);
  assert.match(stylesCss, /font-size:\s*1rem/);
  assert.match(stylesCss, /#payroll-results-shell \.payroll-table/);
  assert.match(stylesCss, /#payroll-results-shell \.payroll-table th/);
  assert.match(stylesCss, /#payroll-results-shell \.payroll-table td/);
});

test('build sonucu hiyerarşi dönüşümünü sürümden bağımsız uygular', () => {
  assert.match(buildJs, /applyResultHierarchy\(distDir\)/);
  assert.match(buildJs, /version:\s*'\d+\.\d+\.\d+-[a-z0-9-]+'/);
});
