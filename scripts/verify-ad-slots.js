import { readFile, readdir } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AD_CLIENT, AD_SLOTS } from '../content/ad-slots.js';
import { AD_EXCLUDED_PATHS } from './apply-ad-slots.js';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const validTypes = new Set(Object.keys(AD_SLOTS));

async function walk(dir, files = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const filename = join(dir, entry.name);
    if (entry.isDirectory()) await walk(filename, files);
    else if (entry.name.endsWith('.html')) files.push(filename);
  }
  return files;
}

function route(filename) {
  const path = relative(dist, filename).split(sep).join('/');
  return path === 'index.html' ? '/' : path.endsWith('/index.html') ? `/${path.slice(0, -11)}/` : `/${path}`;
}

function elementEnd(html, tag, start) {
  const token = new RegExp(`<\\/?${tag}\\b(?:"[^"]*"|'[^']*'|[^'">])*>`, 'gi');
  token.lastIndex = start;
  let depth = 0;
  for (let match; (match = token.exec(html));) {
    depth += match[0][1] === '/' ? -1 : 1;
    if (depth === 0) return token.lastIndex;
  }
  throw new Error(`Kapanmayan ${tag} öğesi: ${start}`);
}

function forbiddenRanges(html) {
  const ranges = [];
  const tags = /<(form|table|div|section|aside)\b(?:"[^"]*"|'[^']*'|[^'">])*>/gi;
  for (let match; (match = tags.exec(html));) {
    const klass = match[0].match(/\bclass\s*=\s*(["'])(.*?)\1/i)?.[2] || '';
    const result = klass.split(/\s+/).some((name) => /(?:^|-)results(?:-column|-shell)?$|^result-hierarchy$/.test(name));
    if (match[1] === 'form' || match[1] === 'table' || result) {
      ranges.push({ start: match.index, end: elementEnd(html, match[1], match.index), name: klass || match[1] });
    }
  }
  return ranges;
}

let checked = 0;
let placements = 0;
for (const filename of await walk(dist)) {
  const path = route(filename);
  const html = await readFile(filename, 'utf8');
  checked++;
  if (/<script\b[^>]*\bsrc\s*=\s*["'][^"']*adsbygoogle\.js/i.test(html)) {
    throw new Error(`Statik AdSense script'i: ${path}`);
  }

  const slots = [...html.matchAll(/<aside\b[^>]*\bclass\s*=\s*(["'])([^"']*\bad-slot\b[^"']*)\1[^>]*>/gi)];
  const excluded = AD_EXCLUDED_PATHS.has(path) || /(?:^|\/)404(?:\.html|\/)/.test(path);
  if (excluded && slots.length) throw new Error(`Hariç tutulan sayfada reklam: ${path}`);
  const blog = /^\/blog\/[^/]+\/$/.test(path);
  if (slots.length > (blog ? 3 : 1)) throw new Error(`Fazla reklam alanı: ${path}`);
  const ranges = slots.length ? forbiddenRanges(html) : [];
  const names = new Set();
  for (const match of slots) {
    const start = match.index;
    const block = html.slice(start, elementEnd(html, 'aside', start));
    const name = match[0].match(/\bdata-ad-slot-name="([^"]+)"/)?.[1];
    if (!validTypes.has(name) || names.has(name)) throw new Error(`Geçersiz veya tekrarlanan reklam türü: ${path}`);
    names.add(name);
    if (!AD_SLOTS[name] || !/^\d+$/.test(AD_SLOTS[name])) throw new Error(`Boş veya geçersiz slot kimliği: ${path} ${name}`);
    if (blog !== (name !== 'toolResult')) throw new Error(`Sayfa türüne uymayan reklam: ${path} ${name}`);
    if (!/aria-label="Reklam"/.test(match[0]) || !/<span class="ad-slot__label">Reklam<\/span>/.test(block)) {
      throw new Error(`Reklam etiketi eksik: ${path}`);
    }
    const ins = block.match(/<ins\b[^>]*\bclass="adsbygoogle"[^>]*><\/ins>/g) || [];
    if (ins.length !== 1 || !ins[0].includes(`data-ad-client="${AD_CLIENT}"`) || !ins[0].includes(`data-ad-slot="${AD_SLOTS[name]}"`)) {
      throw new Error(`AdSense işaretçisi veya yayıncı kimliği hatalı: ${path}`);
    }
    if (ranges.some(({ start: a, end: b }) => start > a && start < b)) {
      throw new Error(`Reklam form, tablo veya sonuç alanı içinde: ${path} ${name}`);
    }
    placements++;
  }
  if ((html.match(/<ins\b[^>]*\bclass="adsbygoogle"/g) || []).length !== slots.length) {
    throw new Error(`ad-slot dışında AdSense ins öğesi: ${path}`);
  }
  if (slots.length && !/<style data-maasim-ad-slots>/.test(html)) throw new Error(`Reklam stili eksik: ${path}`);
}

console.log(`AdSense reklam alanları doğrulandı: ${checked} HTML, ${placements} yerleşim.`);
