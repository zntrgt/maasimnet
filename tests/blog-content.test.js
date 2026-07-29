import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../scripts/add-blog.js', import.meta.url), 'utf8');

test('2027 yazısı kesin zam oranı iddia etmez', () => {
  assert.match(source, /kesin bir oran yok/);
  assert.match(source, /Gerçekleşen veri/);
  assert.match(source, /piyasa beklentisi/);
});

test('güncel resmî veriler ve kaynak alan adları bulunur', () => {
  for (const value of ['%32,11', '%17,76', '%15', '%21,47', '%29,21', '%23,95', '%17,83']) {
    assert.match(source, new RegExp(value));
  }
  assert.match(source, /veriportali\.tuik\.gov\.tr/);
  assert.match(source, /tcmb\.gov\.tr/);
  assert.match(source, /sbb\.gov\.tr/);
});

test('Article FAQ Breadcrumb ve Collection schema üretilir', () => {
  assert.match(source, /'@type':'Article'/);
  assert.match(source, /'@type':'FAQPage'/);
  assert.match(source, /'@type':'BreadcrumbList'/);
  assert.match(source, /'@type':'CollectionPage'/);
});

test('görseller açıklayıcı alt metin ve SVG erişilebilirlik metni taşır', () => {
  assert.match(source, /alt="Haziran 2026 yıllık TÜFE/);
  assert.match(source, /alt="13 Ağustos ve 12 Kasım/);
  assert.match(source, /aria-labelledby="t d"/);
  assert.match(source, /<figcaption>/);
});

test('sitemap nav ve llms çıktısı hazırlanır', () => {
  assert.match(source, /href="\/blog\/"/);
  assert.match(source, /sitemap\.xml/);
  assert.match(source, /llms\.txt/);
});
