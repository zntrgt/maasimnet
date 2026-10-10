import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { ORGANIZATION, ORG_ID, WEBSITE_ID } from '../content/site-identity.js';
import { canonicalOf, metaOf } from '../content/html-attrs.js';

const dist = new URL('../dist/', import.meta.url).pathname;
async function htmlFiles(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) out.push(...await htmlFiles(full)); else if (e.name.endsWith('.html')) out.push(full);
  }
  return out;
}
const typesOf = (n) => (Array.isArray(n['@type']) ? n['@type'] : [n['@type']]);
let pages = 0;
const orgJson = JSON.stringify(ORGANIZATION);
for (const file of await htmlFiles(dist)) {
  const html = await readFile(file, 'utf8');
  if (/noindex/i.test(metaOf(html, 'name', 'robots')?.attrs.content || '')) continue;
  const canonical = canonicalOf(html);
  if (!canonical) continue;
  pages += 1;
  const nodes = [];
  for (const [, body] of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    const data = JSON.parse(body);
    nodes.push(...(Array.isArray(data) ? data : data['@graph'] || [data]));
  }
  const where = file.replace(dist, '/');
  const orgs = nodes.filter((n) => n['@id'] === ORG_ID);
  assert.equal(orgs.length, 1, `${where}: tek Organization olmalı`);
  assert.equal(JSON.stringify(orgs[0]), orgJson, `${where}: Organization merkezi tanımla aynı olmalı`);
  assert.equal(nodes.filter((n) => n['@id'] === WEBSITE_ID).length, 1, `${where}: tek WebSite olmalı`);
  const ids = nodes.map((n) => n['@id']).filter(Boolean);
  assert.equal(ids.length, new Set(ids).size, `${where}: yinelenen @id`);
  for (const n of nodes) {
    const t = typesOf(n);
    if (t.some((x) => ['WebPage', 'CollectionPage', 'AboutPage', 'ContactPage'].includes(x))) assert.ok(n.isPartOf && n.publisher, `${where}: ${t} isPartOf/publisher`);
    if (t.some((x) => ['Article', 'BlogPosting'].includes(x))) for (const k of ['headline', 'author', 'publisher', 'image', 'datePublished', 'dateModified']) assert.ok(n[k], `${where}: Article ${k} eksik`);
    if (t.includes('WebApplication')) assert.ok(n.publisher || n.provider || n.author, `${where}: WebApplication yayıncı`);
  }
  const og = metaOf(html, 'property', 'og:image')?.attrs.content || '';
  assert.equal([...html.matchAll(/property="og:image"/g)].length, 1, `${where}: tek og:image olmalı`);
  assert.match(og, /\.(png|jpe?g|webp)$/i, `${where}: og:image raster olmalı`);
}
assert.ok(pages > 50, 'beklenenden az sayfa tarandı');
console.log(`Yapılandırılmış veri: ${pages} indekslenebilir sayfada Organization/WebSite tutarlı, sayfa ve Article alanları tam, sosyal görsel raster.`);
