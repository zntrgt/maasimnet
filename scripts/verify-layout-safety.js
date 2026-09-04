import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const dist = join(process.cwd(), 'dist');

async function walk(dir, output = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await walk(path, output);
    else if (entry.name.endsWith('.html')) output.push(path);
  }
  return output;
}

const htmlFiles = await walk(dist);
assert.ok(htmlFiles.length >= 20, `Layout taraması için beklenenden az HTML bulundu: ${htmlFiles.length}`);

const requiredShellRules = [
  '*,*::before,*::after{box-sizing:border-box}',
  'main{max-width:100%;min-width:0}',
  'main input,main select,main textarea,main button{max-width:100%}',
  'main a{overflow-wrap:anywhere;word-break:break-word}',
  '@media(max-width:700px){main table{display:block;width:100%;max-width:100%;overflow-x:auto'
];

for (const path of htmlFiles) {
  const html = await readFile(path, 'utf8');
  assert.match(html, /<meta\b[^>]*name=["']viewport["']/i, `${path}: viewport meta eksik`);
  assert.match(html, /data-site-shell-css="v3"/, `${path}: ortak shell CSS eksik`);
  for (const rule of requiredShellRules) {
    assert.ok(html.includes(rule), `${path}: ortak layout güvenlik kuralı eksik: ${rule}`);
  }
}

const terminationCss = await readFile(join(dist, 'assets', 'termination-calculators.css'), 'utf8');
for (const rule of [
  '.termination-page,.termination-page *,.termination-page *::before,.termination-page *::after{box-sizing:border-box}',
  '.termination-grid>*{min-width:0;max-width:100%}',
  '.termination-field input{display:block;width:100%;max-width:100%;min-width:0',
  '.termination-submit{display:block;width:100%;max-width:100%',
  '@media(max-width:700px){.termination-section table{display:block;width:100%;max-width:100%;overflow-x:auto'
]) {
  assert.ok(terminationCss.includes(rule), `Tazminat layout güvenlik kuralı eksik: ${rule}`);
}

const terminationRoutes = ['tazminat-hesaplama', 'kidem-tazminati-hesaplama', 'ihbar-tazminati-hesaplama'];
for (const route of terminationRoutes) {
  const html = await readFile(join(dist, route, 'index.html'), 'utf8');
  assert.match(html, /class="termination-grid"/);
  assert.match(html, /class="termination-panel"/);
  assert.match(html, /class="termination-results"/);
  assert.doesNotMatch(html, /style=["'][^"']*(?:min-)?width:\s*[1-9]\d{3,}px/i, `${route}: dört haneli sabit genişlik layout taşması riski`);
}

console.log(`Sitewide layout güvenliği doğrulandı: ${htmlFiles.length} HTML, universal border-box, form containment ve mobil tablo taşma kontrolü.`);
