import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const indexHtml = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
const appJs = await readFile(new URL('../dist/assets/app.js', import.meta.url), 'utf8');
const stylesCss = await readFile(new URL('../dist/assets/styles.css', import.meta.url), 'utf8');

test('aylık ortalama net tek hero kart olarak üretilir', () => {
  assert.match(indexHtml, /class="metric-hero"/);
  assert.match(indexHtml, /id="stat-avg-net-context"/);
  assert.match(indexHtml, /<details class="secondary-metrics">/);
});

test('işveren maliyeti opsiyonel alana taşınır', () => {
  assert.match(indexHtml, /class="employer-options"/);
  assert.match(indexHtml, /Bu seçim net maaşı etkilemez/);
  assert.match(indexHtml, /id="stat-avg-cost"/);
});

test('CSV ikincil ve sonuç yokken devre dışıdır', () => {
  assert.match(indexHtml, /id="download-csv-button"[^>]*disabled/);
  assert.match(appJs, /csvButton\.disabled = !hasValidResult/);
  assert.match(stylesCss, /\.cta-button--download\{background:transparent/);
});

test('netten brüte temsili brüt ve katlanabilir aylık tablo sunar', () => {
  assert.match(indexHtml, /id="representative-gross-value"/);
  assert.match(indexHtml, /id="toggle-net-gross-table"/);
  assert.match(appJs, /toggleNetGrossTable/);
  assert.match(appJs, /Bu neti tutmak için ortalama brüt yaklaşık/);
});
