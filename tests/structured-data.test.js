import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePage } from '../scripts/apply-structured-data.js';
import { ORGANIZATION, ORG_ID, WEBSITE_ID, DEFAULT_SOCIAL_IMAGE } from '../content/site-identity.js';

const ld = (html) => [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap(([, b]) => { const d = JSON.parse(b); return d['@graph'] || [d]; });
const page = (head) => `<!doctype html><html><head><title>Örnek Sayfa | Maaşım.net</title>${head}</head><body></body></html>`;

test('eski Organization tanımı merkezi tanımla değişir, tekrar eklenmez', () => {
  const html = page('<link href="https://maasim.net/x/" rel="canonical"/><meta content="https://maasim.net/a.png" property="og:image"/><script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Organization","@id":"https://maasim.net/#organization","name":"Maaşım.net","logo":"https://maasim.net/assets/logo.svg"},{"@type":"WebPage","@id":"https://maasim.net/x/#webpage","url":"https://maasim.net/x/"}]}</script>');
  const nodes = ld(normalizePage(html));
  assert.deepEqual(nodes.filter((n) => n['@id'] === ORG_ID), [JSON.parse(JSON.stringify(ORGANIZATION))]);
  assert.equal(nodes.filter((n) => n['@id'] === WEBSITE_ID).length, 1);
  const wp = nodes.find((n) => n['@type'] === 'WebPage');
  assert.deepEqual(wp.isPartOf, { '@id': WEBSITE_ID });
  assert.deepEqual(wp.publisher, { '@id': ORG_ID });
});

test('Article eksikleri doldurulur, var olan değerlere dokunulmaz', () => {
  const html = page('<link rel="canonical" href="https://maasim.net/y/"><meta property="og:image" content="https://maasim.net/assets/logo.svg"><script type="application/ld+json">{"@context":"https://schema.org","@type":"Article","@id":"https://maasim.net/y/#webpage","name":"Örnek Sayfa | Maaşım.net","author":{"@type":"Person","name":"Yazar"},"datePublished":"2026-01-01","dateModified":"2026-01-02"}</script>');
  const out = normalizePage(html);
  const art = ld(out).find((n) => n['@type'] === 'Article');
  assert.equal(art.headline, 'Örnek Sayfa');
  assert.equal(art.author.name, 'Yazar');
  assert.equal(art.image, DEFAULT_SOCIAL_IMAGE);
  assert.match(out, new RegExp(`property="og:image" content="${DEFAULT_SOCIAL_IMAGE}"`));
  assert.equal([...out.matchAll(/og:image"/g)].length, 1);
});

test('şeması olmayan sayfaya tarihli temel düğüm eklenir; noindex sayfaya dokunulmaz', () => {
  const out = normalizePage(page('<link rel="canonical" href="https://maasim.net/iletisim/">'));
  const contact = ld(out).find((n) => n['@type'] === 'ContactPage');
  assert.ok(contact.dateModified);
  assert.match(out, /twitter:card/);
  const noindex = page('<meta name="robots" content="noindex"><link rel="canonical" href="https://maasim.net/z/">');
  assert.equal(normalizePage(noindex), noindex);
});
