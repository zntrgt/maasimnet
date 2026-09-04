import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const dist = join(root, 'dist');
const routeDir = join(dist, 'maas-zam-hesaplama');
await access(join(routeDir, 'index.html'));

const html = await readFile(join(routeDir, 'index.html'), 'utf8');
const app = await readFile(join(dist, 'assets', 'salary-raise-calculator.js'), 'utf8');
const engine = await readFile(join(dist, 'assets', 'salary-raise-engine.js'), 'utf8');
const css = await readFile(join(dist, 'assets', 'salary-raise-calculator.css'), 'utf8');
const sitemap = await readFile(join(dist, 'sitemap.xml'), 'utf8');

for (const token of [
  '<h1>Maaş Zam Hesaplama</h1>',
  'data-salary-raise-calculator',
  'value="new_salary"',
  'value="rate"',
  'value="old_salary"',
  'data-result="primary"',
  'data-result="annual-difference"',
  'data-copy-result',
  'FAQPage',
  'WebApplication',
  'rel="canonical" href="https://maasim.net/maas-zam-hesaplama/"',
  'data-site-shell-css="v3"',
  'class="site-header"',
  'class="site-footer"'
]) assert.ok(html.includes(token), `Maaş zam sayfasında eksik işaret: ${token}`);

for (const token of [
  "globalThis.gtag('event', 'salary_raise_calculator_complete')",
  'calculateSalaryRaise',
  'navigator.clipboard.writeText',
  'tryLiveRender'
]) assert.ok(app.includes(token), `Maaş zam UI kodunda eksik işaret: ${token}`);

assert.doesNotMatch(app, /\bfetch\s*\(/, 'Maaş zam hesaplayıcısı finansal girdileri ağa göndermemeli.');
assert.doesNotMatch(app, /XMLHttpRequest|sendBeacon/, 'Maaş zam hesaplayıcısı ağ aktarımı içermemeli.');
assert.match(app, /gtag\(\s*['"]event['"]\s*,\s*['"]salary_raise_calculator_complete['"]\s*\)/, 'Completion eventi payload olmadan gönderilmeli.');

for (const token of [
  "mode === 'new_salary'",
  "mode === 'rate'",
  "mode === 'old_salary'",
  'annualDifferenceKurus',
  'rateBasisPoints',
  'salary-raise-kurus-v1'
]) assert.ok(engine.includes(token), `Maaş zam motorunda eksik işaret: ${token}`);

for (const token of [
  '.salary-raise-grid',
  '.salary-raise-results',
  'position:sticky',
  'grid-template-columns:minmax(0,.95fr) minmax(0,1.05fr)',
  '@media(max-width:850px)',
  'grid-template-columns:1fr',
  'var(--mn-emerald-500',
  'var(--mn-ink-950'
]) assert.ok(css.includes(token), `Maaş zam CSS kuralı eksik: ${token}`);

assert.match(sitemap, /<loc>https:\/\/maasim\.net\/maas-zam-hesaplama\/<\/loc>/, 'Maaş zam URL sitemap içinde olmalı.');
assert.doesNotMatch(html, /noindex/i, 'Maaş zam sayfası indexlenebilir olmalı.');

console.log('Maaş zam hesaplayıcısı doğrulandı: 3 yönlü motor, enterprise UI, canonical/schema, privacy-safe analytics ve sitemap.');
