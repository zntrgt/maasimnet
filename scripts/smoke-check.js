import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const DIST_DIR = resolve('dist');
const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.jpg': 'image/jpeg'
};

function resolveRequestPath(urlPath) {
  const cleanPath = decodeURIComponent(urlPath.split('?')[0]);
  const relativePath = cleanPath === '/' ? 'index.html' : cleanPath.replace(/^\/+/, '');
  const normalizedPath = normalize(relativePath);
  if (normalizedPath.startsWith('..')) return null;
  return join(DIST_DIR, normalizedPath);
}

async function resolveFile(urlPath) {
  let candidate = resolveRequestPath(urlPath);
  if (!candidate) return null;

  try {
    const info = await stat(candidate);
    if (info.isDirectory()) candidate = join(candidate, 'index.html');
  } catch {
    if (!extname(candidate)) candidate = join(candidate, 'index.html');
  }

  try {
    const info = await stat(candidate);
    return info.isFile() ? candidate : null;
  } catch {
    return null;
  }
}

const server = createServer(async (request, response) => {
  const filePath = await resolveFile(request.url || '/');
  if (!filePath) {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not Found');
    return;
  }

  const body = await readFile(filePath);
  response.writeHead(200, {
    'content-type': MIME_TYPES[extname(filePath)] || 'application/octet-stream',
    'cache-control': 'no-store'
  });
  response.end(body);
});

await new Promise((resolvePromise) => server.listen(0, '127.0.0.1', resolvePromise));
const address = server.address();
const baseUrl = `http://127.0.0.1:${address.port}`;

async function fetchText(path) {
  const response = await fetch(`${baseUrl}${path}`);
  return { response, text: await response.text() };
}

function count(text, pattern) {
  return (text.match(pattern) || []).length;
}

function assertSharedShell(path, html) {
  assert.equal(count(html, /class="site-header"/g), 1, `${path}: ortak header sayısı 1 olmalı`);
  assert.equal(count(html, /class="site-footer"/g), 1, `${path}: ortak footer sayısı 1 olmalı`);
  assert.equal(count(html, /data-site-shell-css="v3"/g), 1, `${path}: ortak shell CSS bloğu 1 olmalı`);
  assert.equal(count(html, /data-cookiebot-renew/g), 1, `${path}: Cookiebot tercih bağlantısı 1 olmalı`);
  assert.doesNotMatch(html, /<header\b[^>]*class="[^"]*\btop\b/i, `${path}: eski P0 header kalmamalı`);
  assert.doesNotMatch(html, /\/assets\/site-shell\.css/, `${path}: ikinci shell CSS isteği kalmamalı`);
  assert.match(html, /<main\b/i, `${path}: ana içerik alanı bulunmalı`);
}

try {
  const home = await fetchText('/');
  assert.equal(home.response.status, 200);
  assertSharedShell('/', home.text);
  assert.match(home.text, /<script type="module" src="\/assets\/app\.js"><\/script>/);
  assert.match(home.text, /class="mobile-payroll-table"/);
  assert.match(home.text, /calculateAndShowPayroll\(\)/);
  assert.match(home.text, />Vergi Dilimi<\/th>/);
  assert.match(home.text, /2027’de alabileceğin tahmini ücreti karşılaştır/i);

  const shellPages = [
    '/blog/',
    '/blog/2027-maas-zammi-beklentileri/',
    '/sozluk/',
    '/sss/',
    '/veriler/2026/',
    '/hesaplama-metodolojisi/',
    '/2027-maas-hesaplama/',
    '/cerez-politikasi/',
    '/gizlilik/'
  ];

  for (const path of shellPages) {
    const page = await fetchText(path);
    assert.equal(page.response.status, 200, `${path}: HTTP 200 dönmeli`);
    assertSharedShell(path, page.text);
  }

  const estimate = await fetchText('/2027-maas-hesaplama/');
  assert.match(estimate.text, /2027 Maaş Hesaplama: Brütten Nete ve Netten Brüte Tahmin/i);
  assert.match(estimate.text, /data-estimate-mode="gross-to-net"/);
  assert.match(estimate.text, /data-estimate-mode="net-to-gross"/);
  assert.match(estimate.text, /Bu bir tahmin aracıdır/i);
  assert.match(estimate.text, /FAQPage/);

  const app = await fetchText('/assets/app.js');
  assert.equal(app.response.status, 200);
  assert.match(app.text, /calculatePayrollYear/);
  assert.match(app.text, /solveMonthlyGrossForFixedNet/);
  assert.match(app.text, /formatIncomeTaxRates/);

  const estimateApp = await fetchText('/assets/estimate-2027.js');
  assert.equal(estimateApp.response.status, 200);
  assert.match(estimateApp.text, /calculatePayrollYear/);
  assert.match(estimateApp.text, /solveMonthlyGrossForFixedNet/);

  const engine = await fetchText('/assets/payroll-engine.js');
  assert.equal(engine.response.status, 200);
  assert.match(engine.text, /export function calculatePayrollYear/);
  assert.match(engine.text, /export function solveMonthlyGrossForFixedNet/);

  const styles = await fetchText('/assets/styles.css');
  assert.equal(styles.response.status, 200);
  assert.match(styles.text, /\.mobile-payroll-table/);
  assert.match(styles.text, /\.cta-button--calculate/);
  assert.match(styles.text, /\.cta-button--download/);
  assert.match(styles.text, /\.tax-bracket-badge/);

  const versionResponse = await fetch(`${baseUrl}/version.json`);
  assert.equal(versionResponse.status, 200);
  const version = await versionResponse.json();
  assert.equal(version.calculationEngine, 'central-kurus-engine');
  assert.ok(version.version);
  assert.ok(version.builtAt);

  const missing = await fetch(`${baseUrl}/olmayan-sayfa/`);
  assert.equal(missing.status, 404);

  console.log(`Smoke test başarılı: ${shellPages.length + 1} kritik sayfa, ortak shell, 2026/2027 hesaplayıcılar ve statik assetler doğrulandı.`);
} finally {
  await new Promise((resolvePromise, rejectPromise) => {
    server.close((error) => error ? rejectPromise(error) : resolvePromise());
  });
}
