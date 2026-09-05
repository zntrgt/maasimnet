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
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp'
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
  assert.ok(count(html, /data-cookiebot-renew/g) >= 1, `${path}: en az bir Cookiebot tercih bağlantısı olmalı`);
  const footerMatch = html.match(/<footer\b[^>]*class="site-footer"[\s\S]*?<\/footer>/i)?.[0] || '';
  assert.equal(count(footerMatch, /data-cookiebot-renew/g), 1, `${path}: ortak footer içinde Cookiebot tercih bağlantısı 1 olmalı`);
  assert.doesNotMatch(html, /<header\b[^>]*class="[^"]*\btop\b/i, `${path}: eski P0 header kalmamalı`);
  assert.doesNotMatch(html, /\/assets\/site-shell\.css/, `${path}: ikinci shell CSS isteği kalmamalı`);
  assert.match(html, /<main\b/i, `${path}: ana içerik alanı bulunmalı`);
}

try {
  const home = await fetchText('/');
  assert.equal(home.response.status, 200);
  assertSharedShell('/', home.text);
  assert.match(home.text, /data-home-critical-css="v1"/);
  assert.match(home.text, /data-fintech-first-paint="v2"/);
  assert.doesNotMatch(home.text, /<link\b[^>]*href=["']\/assets\/styles\.css["']/i);
  assert.match(home.text, /\.calculator-layout/);
  assert.match(home.text, /<script type="module" src="\/assets\/app\.js\?[^\"]*rev=[^\"]+"><\/script>/);
  assert.match(home.text, /class="mobile-payroll-table"/);
  assert.match(home.text, /calculateAndShowPayroll\(\)/);
  assert.match(home.text, />Vergi Dilimi<\/th>/);
  assert.match(home.text, /href="\/2027-maas-hesaplama\/">2027 brütten nete maaş hesaplama/i);
  assert.doesNotMatch(home.text, /brütten nete veya netten brüte tahmin yap/i);

  const shellPages = [
    '/blog/',
    '/blog/2027-maas-zammi-beklentileri/',
    '/sozluk/',
    '/sss/',
    '/veriler/2026/',
    '/hesaplama-metodolojisi/',
    '/2027-maas-hesaplama/',
    '/tazminat-hesaplama/',
    '/kidem-tazminati-hesaplama/',
    '/ihbar-tazminati-hesaplama/',
    '/cerez-politikasi/',
    '/gizlilik/'
  ];

  for (const path of shellPages) {
    const page = await fetchText(path);
    assert.equal(page.response.status, 200, `${path}: HTTP 200 dönmeli`);
    assertSharedShell(path, page.text);
  }

  const estimate = await fetchText('/2027-maas-hesaplama/');
  assert.match(estimate.text, /2027 Brütten Nete Maaş Hesaplama ve Netten Brüte Tahmin/i);
  assert.match(estimate.text, /<title>2027 Brütten Nete Maaş Hesaplama \| Netten Brüte Tahmin \| Maaşım\.net<\/title>/i);
  assert.match(estimate.text, /id="estimate-mode-gross"[^>]*aria-pressed="true"/);
  assert.match(estimate.text, /id="estimate-mode-net"[^>]*aria-pressed="false"/);
  assert.match(estimate.text, /Bu bir tahmin aracıdır/i);
  assert.match(estimate.text, /FAQPage/);

  for (const path of ['/tazminat-hesaplama/', '/kidem-tazminati-hesaplama/', '/ihbar-tazminati-hesaplama/']) {
    const page = await fetchText(path);
    assert.equal(page.response.status, 200);
    assert.match(page.text, /data-termination-calculator=/);
    assert.match(page.text, /\/assets\/termination-calculators\.js/);
    assert.match(page.text, /FAQPage/);
  }

  const app = await fetchText('/assets/app.js');
  assert.equal(app.response.status, 200);
  assert.match(app.text, /calculatePayrollYear/);
  assert.match(app.text, /solveMonthlyGrossForFixedNet/);
  assert.match(app.text, /formatIncomeTaxRates/);

  const analytics = await fetchText('/assets/calculator-analytics.js');
  assert.equal(analytics.response.status, 200);
  assert.doesNotMatch(analytics.text, /input\.value = ''/);
  assert.doesNotMatch(analytics.text, /input\.dataset\.rawValue = ''/);

  const estimateApp = await fetchText('/assets/estimate-2027.js');
  assert.equal(estimateApp.response.status, 200);
  assert.match(estimateApp.text, /calculatePayrollYear/);
  assert.match(estimateApp.text, /solveMonthlyGrossForFixedNet/);
  assert.match(estimateApp.text, /estimate-mode-gross/);
  assert.match(estimateApp.text, /estimate-mode-net/);
  assert.match(estimateApp.text, /salaryByMode/);
  assert.doesNotMatch(estimateApp.text, /salaryInput\.value = isNet \? '100000' : '150000'/);

  const engine = await fetchText('/assets/payroll-engine.js');
  assert.equal(engine.response.status, 200);
  assert.match(engine.text, /export function calculatePayrollYear/);
  assert.match(engine.text, /export function solveMonthlyGrossForFixedNet/);

  const terminationEngine = await fetchText('/assets/termination-engine.js');
  assert.equal(terminationEngine.response.status, 200);
  assert.match(terminationEngine.text, /export function calculateSeverance/);
  assert.match(terminationEngine.text, /export function calculateNotice/);

  const terminationUi = await fetchText('/assets/termination-calculators.js');
  assert.equal(terminationUi.response.status, 200);
  assert.match(terminationUi.text, /termination_calculator_complete/);

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
  assert.equal(version.terminationCalculators, 3);
  assert.ok(version.version);
  assert.ok(version.builtAt);

  const missing = await fetch(`${baseUrl}/olmayan-sayfa/`);
  assert.equal(missing.status, 404);

  console.log(`Smoke test başarılı: ${shellPages.length + 1} kritik sayfa, revisioned frontend graph, first-paint shell, kullanıcı girdisi koruması, ortak shell, 2026/2027 ve tazminat hesaplayıcıları doğrulandı.`);
} finally {
  await new Promise((resolvePromise, rejectPromise) => {
    server.close((error) => error ? rejectPromise(error) : resolvePromise());
  });
}
