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

try {
  const home = await fetchText('/');
  assert.equal(home.response.status, 200);
  assert.match(home.text, /<script type="module" src="\/assets\/app\.js"><\/script>/);
  assert.match(home.text, /class="mobile-payroll-table"/);
  assert.match(home.text, /calculateAndShowPayroll\(\)/);

  const app = await fetchText('/assets/app.js');
  assert.equal(app.response.status, 200);
  assert.match(app.text, /calculatePayrollYear/);
  assert.match(app.text, /solveMonthlyGrossForFixedNet/);

  const engine = await fetchText('/assets/payroll-engine.js');
  assert.equal(engine.response.status, 200);
  assert.match(engine.text, /export function calculatePayrollYear/);

  const styles = await fetchText('/assets/styles.css');
  assert.equal(styles.response.status, 200);
  assert.match(styles.text, /\.mobile-payroll-table/);
  assert.match(styles.text, /\.cta-button--calculate/);
  assert.match(styles.text, /\.cta-button--download/);

  const versionResponse = await fetch(`${baseUrl}/version.json`);
  assert.equal(versionResponse.status, 200);
  const version = await versionResponse.json();
  assert.equal(version.calculationEngine, 'central-kurus-engine');
  assert.ok(version.version);
  assert.ok(version.builtAt);

  const privacy = await fetchText('/gizlilik/');
  assert.equal(privacy.response.status, 200);
  assert.match(privacy.text, /Gizlilik/i);

  const missing = await fetch(`${baseUrl}/olmayan-sayfa/`);
  assert.equal(missing.status, 404);

  console.log('Smoke test başarılı: ana sayfa, motor, CSS, version ve alt sayfa doğrulandı.');
} finally {
  await new Promise((resolvePromise, rejectPromise) => {
    server.close((error) => error ? rejectPromise(error) : resolvePromise());
  });
}
