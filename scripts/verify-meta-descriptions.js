import { readFile, readdir } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const dist = join(process.cwd(), 'dist');
const MIN = 105;
const MAX = 190;
const failures = [];
const seen = new Map();

async function htmlFiles(dir) {
  const output = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) output.push(...await htmlFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.html')) output.push(full);
  }
  return output;
}

function normalize(value = '') {
  return String(value)
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function description(html) {
  const tag = html.match(/<meta\b[^>]*name=["']description["'][^>]*>/i)?.[0]
    || html.match(/<meta\b[^>]*content=["'][^"']*["'][^>]*name=["']description["'][^>]*>/i)?.[0]
    || '';
  return normalize(tag.match(/content=["']([^"']*)["']/i)?.[1] || '');
}

function noindex(html) {
  const tag = html.match(/<meta\b[^>]*name=["']robots["'][^>]*>/i)?.[0] || '';
  return /\bnoindex\b/i.test(tag.match(/content=["']([^"']*)["']/i)?.[1] || '');
}

function route(file, html) {
  const canonical = html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i)?.[1];
  if (canonical) {
    try { return new URL(canonical).pathname; } catch { /* fall through */ }
  }
  const rel = relative(dist, file).split(sep).join('/');
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return `/${rel.slice(0, -'index.html'.length)}`;
  return `/${rel}`;
}

let scanned = 0;
for (const file of await htmlFiles(dist)) {
  const html = await readFile(file, 'utf8');
  if (noindex(html)) continue;
  scanned += 1;
  const url = route(file, html);
  const value = description(html);
  const count = (html.match(/<meta\b[^>]*name=["']description["'][^>]*>/gi) || []).length;

  if (count !== 1) failures.push(`${url}: meta description etiketi sayısı ${count}, 1 olmalı`);
  if (value.length < MIN) failures.push(`${url}: meta description çok kısa (${value.length}/${MIN})`);
  if (value.length > MAX) failures.push(`${url}: meta description çok uzun (${value.length}/${MAX})`);

  const key = value.toLocaleLowerCase('tr-TR');
  if (value) {
    if (seen.has(key)) failures.push(`${url}: duplicate meta description (${seen.get(key)})`);
    else seen.set(key, url);
  }
}

if (failures.length) {
  console.error('Meta description doğrulaması başarısız:\n- ' + failures.join('\n- '));
  process.exit(1);
}

console.log(`Meta description doğrulaması başarılı: ${scanned} indexlenebilir sayfa, ${MIN}-${MAX} karakter ve benzersiz açıklamalar.`);
