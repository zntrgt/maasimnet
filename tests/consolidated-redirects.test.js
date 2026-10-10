import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.js';
import { CONSOLIDATED_REDIRECTS } from '../src/consolidated-redirects.js';
import { OFFICIAL_FACT_TOPICS } from '../content/official-facts.js';
import { factBlock, insertionPoint, rewriteLegacyLinks } from '../scripts/apply-official-facts.js';

const env = { ASSETS: { fetch: async () => new Response('Not found', { status: 404 }) } };

for (const [legacy, canonical] of Object.entries(CONSOLIDATED_REDIRECTS)) {
  test(`${legacy} kanonik konu sayfasına 301 ile gider`, async () => {
    for (const pathname of [legacy, legacy.slice(0, -1)]) {
      const response = await worker.fetch(new Request(`https://maasim.net${pathname}?kaynak=x`), env);
      assert.equal(response.status, 301);
      assert.equal(response.headers.get('location'), `https://maasim.net${canonical}`);
    }
  });
}

test('/veriler/2026/ merkezi ve kanonik sayfalar yönlendirilmez', async () => {
  for (const pathname of ['/veriler/2026/', ...Object.values(CONSOLIDATED_REDIRECTS)]) {
    const response = await worker.fetch(new Request(`https://maasim.net${pathname}`), env);
    assert.notEqual(response.status, 301, pathname);
  }
});

test('her kanonik sayfanın en az bir eski URL kaynağı vardır', () => {
  const targets = new Set(Object.values(CONSOLIDATED_REDIRECTS));
  for (const topic of OFFICIAL_FACT_TOPICS) assert.ok(targets.has(topic.path), topic.path);
});

test('resmî değer bloğu cevap cümlesi, değerler ve kaynakla başlar', () => {
  const topic = OFFICIAL_FACT_TOPICS.find((item) => item.key === 'sgk-ceiling');
  const html = factBlock(topic);
  assert.match(html, /<h2 id="official-facts-sgk-ceiling">Resmî 2026 değerleri<\/h2>/);
  assert.ok(html.includes('297.270,00 TL'));
  assert.ok(html.includes('5510 sayılı'));
  assert.match(html, /<time datetime="\d{4}-\d{2}-\d{2}">/);
});

test('blok makalede kısa özetten sonra, hesaplayıcıda rehber bölümünden önce yer alır', () => {
  const article = OFFICIAL_FACT_TOPICS.find((item) => item.placement.type === 'article');
  const articleHtml = '<h1>x</h1><section class="ai-quick-facts"><section class="inner">a</section></section><div class="body"><h2>b</h2></div>';
  assert.equal(insertionPoint(articleHtml, article), articleHtml.indexOf('<div class="body">'));
  const calculator = OFFICIAL_FACT_TOPICS.find((item) => item.key === 'severance-ceiling');
  const calcHtml = '<section class="termination-grid">form</section><section class="termination-section">rehber</section>';
  assert.equal(insertionPoint(calcHtml, calculator), calcHtml.indexOf('<section class="termination-section">'));
});

test('eski veri URL bağlantıları kanonik sayfalara çevrilir', () => {
  const input = '<a href="/sgk/sgk-tavani/">x</a> https://maasim.net/veriler/2026-asgari-ucret/';
  assert.equal(rewriteLegacyLinks(input), '<a href="/blog/2026-sgk-tavani/">x</a> https://maasim.net/asgari-ucret-hesaplama/');
});
