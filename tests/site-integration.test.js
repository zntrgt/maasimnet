import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const indexHtml = await readFile(
  new URL('../static/index.html', import.meta.url),
  'utf8'
);
const appJs = await readFile(
  new URL('../src/app.js', import.meta.url),
  'utf8'
);
const stylesCss = await readFile(
  new URL('../static/assets/styles.css', import.meta.url),
  'utf8'
);

test('ana sayfa merkezi ES modülünü yükler ve eski inline motoru içermez', () => {
  assert.match(indexHtml, /<script type="module" src="\/assets\/app\.js"><\/script>/);
  assert.doesNotMatch(indexHtml, /function runPayroll\(/);
  assert.doesNotMatch(indexHtml, /function tariffTax\(/);
  assert.doesNotMatch(indexHtml, /const PARAMS\s*=/);
});

test('arayüz hesaplama için yalnız merkezi bordro motorunu kullanır', () => {
  assert.match(appJs, /calculatePayrollYear/);
  assert.match(appJs, /solveMonthlyGrossForFixedNet/);
  assert.match(appJs, /summarizePayroll/);
  assert.match(appJs, /renderMobilePayrollRows/);
  assert.match(appJs, /runCalculationAndFocusPayroll/);
  assert.doesNotMatch(appJs, /function runPayroll\(/);
  assert.doesNotMatch(appJs, /function tariffTax\(/);
});

test('mobil bordro dört kolonlu tablo ve hesapla butonu olarak korunur', () => {
  assert.match(indexHtml, /<th scope="col">Ay<\/th>/);
  assert.match(indexHtml, /<th scope="col">Brüt<\/th>/);
  assert.match(indexHtml, /<th scope="col">Net Maaş<\/th>/);
  assert.match(indexHtml, /<th scope="col">Detay<\/th>/);
  assert.match(indexHtml, /onclick="calculateAndShowPayroll\(\)"/);
  assert.match(stylesCss, /\.cta-button--calculate/);
  assert.match(stylesCss, /\.cta-button--download/);
});

test('ana hesaplama ve CSV indirme fonksiyonları tarayıcıya güvenli biçimde açılır', () => {
  assert.match(appJs, /Object\.assign\(window,/);
  assert.match(appJs, /calculateAndShowPayroll/);
  assert.match(appJs, /downloadCSV/);
});

test('100.000 TL senaryo sayfası hesap değerlerini build tokenlarından alır', async () => {
  const scenarioTemplate = await readFile(
    new URL('../static/100000-brut-maas-hesaplama/index.html', import.meta.url),
    'utf8'
  );

  assert.match(scenarioTemplate, /\{\{SCENARIO_100K_JAN_NET\}\}/);
  assert.match(scenarioTemplate, /\{\{SCENARIO_100K_ANNUAL_NET\}\}/);
  assert.doesNotMatch(scenarioTemplate, /75\.953,03 TL/);
  assert.doesNotMatch(scenarioTemplate, /833\.881,63 TL/);
});
