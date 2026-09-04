import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const html = await readFile(join(process.cwd(), 'dist', 'index.html'), 'utf8');
const title = 'Maaş Hesaplama 2026 | Brütten Nete &amp; Netten Brüte';
const description = 'Maaş hesaplama 2026: brüt maaşınızı nete, hedef net maaşınızı brüte çevirin. Güncel vergi dilimleri, SGK kesintileri ve işveren maliyetini 12 aylık bordroda görün.';

assert.match(html, new RegExp(`<title>${title}<\\/title>`), 'Ana sayfa title 2026 maaş hesaplama query ownership ile başlamalı.');
assert.match(html, /<h1>Maaş Hesaplama 2026: Brütten Nete &amp; Netten Brüte<\/h1>/, 'Ana sayfa H1 exact 2026 maaş hesaplama niyetini sahiplenmeli.');
assert.match(html, new RegExp(`<meta name="description" content="${description.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}">`), 'Ana sayfa meta description 2026 brüt/net niyetini açıklamalı.');
assert.match(html, /<meta property="og:title" content="Maaş Hesaplama 2026 \| Brütten Nete &amp; Netten Brüte">/, 'OG title ana SEO title ile aynı olmalı.');
assert.match(html, /<meta name="twitter:title" content="Maaş Hesaplama 2026 \| Brütten Nete &amp; Netten Brüte">/, 'Twitter title ana SEO title ile aynı olmalı.');
assert.match(html, /Brüt maaşınızı nete, hedef net maaşınızı brüte çevirin; 2026 vergi dilimleri, SGK tavanı, asgari ücret istisnası/, 'Hero lead güncel 2026 bordro bağlamını açıkça vermeli.');

const schemaMatch = html.match(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
assert.ok(schemaMatch, 'Ana sayfa JSON-LD bulunmalı.');
const schema = JSON.parse(schemaMatch[1]);
const graph = schema['@graph'] || [];
const app = graph.find((node) => node['@id'] === 'https://maasim.net/#calculator');
const page = graph.find((node) => node['@id'] === 'https://maasim.net/#webpage');
assert.equal(app?.name, 'Maaş Hesaplama 2026', 'WebApplication adı primary query ile eşleşmeli.');
assert.deepEqual(app?.alternateName, [
  'Brütten Nete Maaş Hesaplama 2026',
  'Netten Brüte Maaş Hesaplama 2026',
  'Brüt Net Maaş Hesaplama 2026'
], 'WebApplication alternateName sorgu varyasyonlarını kontrollü biçimde kapsamalı.');
assert.equal(page?.name, 'Maaş Hesaplama 2026 | Brütten Nete & Netten Brüte', 'WebPage adı title ile semantik olarak eşleşmeli.');
assert.equal(app?.description, description, 'WebApplication açıklaması meta description ile eşleşmeli.');
assert.equal(page?.description, description, 'WebPage açıklaması meta description ile eşleşmeli.');

console.log('Ana sayfa 2026 SEO query ownership doğrulandı: title + H1 + hero + schema tutarlı.');
