import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const html = await readFile(join(process.cwd(), 'dist', 'index.html'), 'utf8');
const titleText = 'Maaş Hesaplama 2026 | Brütten Nete & Netten Brüte';
const titleHtml = 'Maaş Hesaplama 2026 | Brütten Nete &amp; Netten Brüte';
const description = 'Maaş hesaplama 2026: brüt maaşınızı nete, hedef net maaşınızı brüte çevirin. Güncel vergi dilimleri, SGK ve işveren maliyetini 12 aylık bordroda görün.';

function decodeHtml(value) {
  return String(value)
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function metaTags() {
  return [...html.matchAll(/<meta\b[^>]*>/gi)].map((match) => {
    const attrs = {};
    for (const attr of match[0].matchAll(/([:\w-]+)\s*=\s*(["'])(.*?)\2/g)) attrs[attr[1].toLowerCase()] = decodeHtml(attr[3]);
    return attrs;
  });
}

function assertMeta({ attr, key, content, message }) {
  const tag = metaTags().find((attrs) => attrs[attr] === key);
  assert.ok(tag, `${message} Meta etiketi bulunamadı: ${attr}=${key}`);
  assert.equal(tag.content, content, message);
}

assert.match(html, new RegExp(`<title>${titleHtml.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}<\\/title>`), 'Ana sayfa title 2026 maaş hesaplama query ownership ile başlamalı.');
assert.match(html, /<h1>Maaşını hesapla<\/h1>/, 'Ana sayfa H1 kullanıcıya doğrudan ve humanize konuşmalı.');
assertMeta({ attr: 'name', key: 'description', content: description, message: 'Ana sayfa meta description 2026 brüt/net niyetini açıklamalı.' });
assertMeta({ attr: 'property', key: 'og:title', content: titleText, message: 'OG title ana SEO title ile aynı olmalı.' });
assertMeta({ attr: 'property', key: 'og:description', content: description, message: 'OG description ana meta description ile aynı olmalı.' });
assertMeta({ attr: 'name', key: 'twitter:title', content: titleText, message: 'Twitter title ana SEO title ile aynı olmalı.' });
assertMeta({ attr: 'name', key: 'twitter:description', content: description, message: 'Twitter description ana meta description ile aynı olmalı.' });
assert.match(html, /Brütünü nete, netini brüte çevir\. Verginin yıl içinde maaşını nasıl değiştirdiğini de gör\./, 'Hero lead kullanıcı odaklı ve humanize olmalı.');
assert.match(html, /2026 mevzuatına göre güncel ✓/, 'Hero güncellik mesajını kısa ve görünür vermeli.');
assert.match(html, /Henüz hesap yapmadın/, 'Ana hesaplayıcı gerçek empty state ile başlamalı.');
assert.match(html, /Net maaşımı gör/, 'Ana CTA sonuç odaklı olmalı.');

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
assert.equal(page?.name, titleText, 'WebPage adı title ile semantik olarak eşleşmeli.');
assert.equal(app?.description, description, 'WebApplication açıklaması meta description ile eşleşmeli.');
assert.equal(page?.description, description, 'WebPage açıklaması meta description ile eşleşmeli.');

console.log('Ana sayfa SEO metadata + humanized hero doğrulandı: title/schema query ownership, görünen H1/lead UX odaklı.');
