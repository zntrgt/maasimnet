import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../scripts/add-financial-health-blog.js', import.meta.url), 'utf8');

test('finansal sağlık yazısı ücretin temel rolünü açıklar', () => {
  assert.match(source, /Finansal eğitim, düşük veya öngörülemez ücretin yerine geçmez/);
  assert.match(source, /adil ve öngörülebilir ücret/i);
  assert.match(source, /gizli borç danışmanlığı/);
});

test('2026 BES ve SGK değerleri doğru kaynaklarla bulunur', () => {
  for (const value of ['%32,11', '%17,76', '%20', '79.272 TL', '396.360 TL', '9.909 TL']) {
    assert.match(source, new RegExp(value));
  }
  assert.match(source, /egm\.org\.tr/);
  assert.match(source, /sgk\.gov\.tr/);
  assert.match(source, /gib\.gov\.tr/);
  assert.match(source, /veriportali\.tuik\.gov\.tr/);
});

test('işveren katkısı ve çalışan katkısı ayrılır', () => {
  assert.match(source, /işverenin çalışan adına yaptığı katkı payı ödemeleri için devlet katkısı verilmez/i);
  assert.match(source, /çalışanın bireysel emeklilik sistemine yaptığı katkı payı ücret veya yıllık beyanname matrahından indirilemez/i);
});

test('Article FAQ ve Breadcrumb şemaları üretilir', () => {
  assert.match(source, /'@type':'Article'/);
  assert.match(source, /'@type':'FAQPage'/);
  assert.match(source, /'@type':'BreadcrumbList'/);
});

test('blog kartı sitemap llms ve erişilebilir görsel üretilir', () => {
  assert.match(source, /is-yerinde-finansal-saglik\.svg/);
  assert.match(source, /aria-labelledby="title desc"/);
  assert.match(source, /sitemap\.xml/);
  assert.match(source, /llms\.txt/);
  assert.match(source, /<figcaption>/);
});
