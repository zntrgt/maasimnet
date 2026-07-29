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
  assert.match(appJs, /formatTurkishMoney/);
  assert.match(appJs, /getPayrollChangeReasons/);
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

test('para inputları tr-TR canlı binlik ayraç ve decimal klavye kullanır', () => {
  assert.match(indexHtml, /id="input-salary" inputmode="decimal"/);
  assert.match(indexHtml, /data-money-input="true"/);
  assert.match(indexHtml, /data-raw-value="100000"/);
  assert.match(indexHtml, /oninput="handleMainSalaryInput\(event\)"/);
  assert.match(indexHtml, /type="text" value="100\.000"/);
  assert.doesNotMatch(indexHtml, /type="number" value="100000"/);
  assert.match(appJs, /oninput="formatMoneyInputElement\(this\)"/);
});

test('net maaş farkı kartı nötr ve açıklamalıdır', () => {
  assert.match(indexHtml, /text-slate-400 uppercase tracking-widest mb-1">Net Maaş Farkı/);
  assert.doesNotMatch(indexHtml, /text-red-500 uppercase tracking-widest mb-1">Net Maaş Farkı/);
  assert.match(indexHtml, /Dilim değişimleri nedeniyle en yüksek ve en düşük ay neti arasındaki fark\./);
});

test('bordro yön değişimi açıklamaları için görünür satır stili bulunur', () => {
  assert.match(stylesCss, /\.payroll-change-reason-row/);
  assert.match(stylesCss, /\.payroll-change-reason/);
  assert.match(appJs, /renderPayrollChangeReason/);
});

test('ana hesaplama ve CSV indirme fonksiyonları tarayıcıya güvenli biçimde açılır', () => {
  assert.match(appJs, /Object\.assign\(window,/);
  assert.match(appJs, /calculateAndShowPayroll/);
  assert.match(appJs, /formatMoneyInputElement/);
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
