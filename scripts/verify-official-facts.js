import { access, readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { OFFICIAL_FACT_TOPICS, OFFICIAL_FACT_PATHS } from '../content/official-facts.js';
import { CONSOLIDATED_REDIRECTS } from '../src/consolidated-redirects.js';
import { permanentRedirectFor } from '../src/worker.js';

// Veri sayfası birleştirmesinin build çıktısında tam olduğunu doğrular:
// eski URL'ler üretilmez, 301 hedefleri kanonik sayfalardır, kanonik sayfalar resmî
// değer bloğunu ve Dataset şemasını taşır, hiçbir dosya eski URL'ye bağlantı vermez.
const dist = join(process.cwd(), 'dist');
const SITE = 'https://maasim.net';
const sitemap = await readFile(join(dist, 'sitemap.xml'), 'utf8');

for (const [legacy, canonical] of Object.entries(CONSOLIDATED_REDIRECTS)) {
  assert.ok(OFFICIAL_FACT_PATHS.includes(canonical), `${legacy} hedefi kanonik konu sayfası değil: ${canonical}`);
  assert.equal(permanentRedirectFor(legacy), canonical, `${legacy} 301 hedefi`);
  assert.equal(permanentRedirectFor(legacy.slice(0, -1)), canonical, `${legacy} sondaki eğik çizgi olmadan`);
  await assert.rejects(access(join(dist, legacy, 'index.html')), `${legacy} artık üretilmemeli`);
  assert.ok(!sitemap.includes(`<loc>${SITE}${legacy}</loc>`), `${legacy} sitemap'te olmamalı`);
}

for (const topic of OFFICIAL_FACT_TOPICS) {
  assert.ok(Object.values(CONSOLIDATED_REDIRECTS).includes(topic.path), `${topic.path} için yönlendirilen eski sayfa yok`);
  assert.ok(sitemap.includes(`<loc>${SITE}${topic.path}</loc>`), `${topic.path} sitemap'te olmalı`);
  const html = await readFile(join(dist, topic.path, 'index.html'), 'utf8');
  assert.match(html, /<meta name="robots" content="index,follow/, `${topic.path} indekslenebilir olmalı`);
  assert.equal(html.split(`data-official-facts="${topic.key}"`).length - 1, 1, `${topic.path} tek resmî değer bloğu`);
  assert.equal(html.split(`data-official-facts-schema="${topic.key}"`).length - 1, 1, `${topic.path} tek Dataset şeması`);
  assert.ok(html.includes(topic.answer.replace(/'/g, '&#39;')) || html.includes(topic.answer), `${topic.path} cevap cümlesi`);
  for (const card of topic.cards) assert.ok(html.includes(card.value), `${topic.path} değer: ${card.label} ${card.value}`);
  for (const source of topic.sources) assert.ok(html.includes(source.url), `${topic.path} kaynak: ${source.url}`);
  const schemaJson = html.match(new RegExp(`<script type="application/ld\\+json" data-official-facts-schema="${topic.key}">([\\s\\S]*?)</script>`))[1];
  const schema = JSON.parse(schemaJson);
  assert.equal(schema['@type'], 'Dataset');
  assert.equal(schema.url, `${SITE}${topic.path}`);
  assert.equal(schema.variableMeasured.length, topic.cards.length);
  const blockAt = html.indexOf(`data-official-facts="${topic.key}"`);
  assert.ok(blockAt > html.indexOf('</h1>'), `${topic.path} blok H1'den sonra olmalı`);
}

async function files(dir, output = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await files(path, output);
    else if (/\.(html|txt|xml)$/.test(entry.name)) output.push(path);
  }
  return output;
}
const linking = [];
for (const file of await files(dist)) {
  const text = await readFile(file, 'utf8');
  for (const legacy of Object.keys(CONSOLIDATED_REDIRECTS)) {
    if (text.includes(`href="${legacy}"`) || text.includes(`${SITE}${legacy}`)) linking.push(`${file.replace(`${dist}/`, '')} → ${legacy}`);
  }
}
assert.deepEqual(linking, [], `Yönlendirilen URL'lere bağlantı kalmamalı:\n${linking.join('\n')}`);

console.log(`Veri sayfası birleştirmesi doğrulandı: ${Object.keys(CONSOLIDATED_REDIRECTS).length} eski URL 301 ile ${OFFICIAL_FACT_TOPICS.length} kanonik sayfaya gidiyor; resmî değer blokları, Dataset şemaları ve iç bağlantılar temiz.`);
