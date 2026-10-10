import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.js';
import { RETIRED_GUIDE_REDIRECTS } from '../src/retired-guide-redirects.js';
import { retiredGuideRedirects, publishedEmployeeGuides, GUIDE_TARGETS } from '../content/employee-guides.js';
import { blogPosts } from '../content/blog-manifest.js';
import { casesSection, insertionPoint, rewriteRetiredLinks, targetGroups } from '../scripts/apply-guide-consolidation.js';

const env = { ASSETS: { fetch: async () => new Response('Not found', { status: 404 }) } };

test('statik Worker haritası içerik kaynağıyla birebir aynı', () => {
  assert.deepEqual({ ...RETIRED_GUIDE_REDIRECTS }, { ...retiredGuideRedirects });
  assert.equal(Object.keys(RETIRED_GUIDE_REDIRECTS).length, 95);
});

test('birleştirilen rehberler hedef çapasına 301 ile gider', async () => {
  for (const [legacy, target] of Object.entries(RETIRED_GUIDE_REDIRECTS)) {
    for (const pathname of [legacy, legacy.slice(0, -1)]) {
      const response = await worker.fetch(new Request(`https://maasim.net${pathname}`), env);
      assert.equal(response.status, 301, pathname);
      assert.equal(response.headers.get('location'), `https://maasim.net${target}`);
    }
  }
});

test('yayımlanan 5 rehber ve hedef rehberler yönlendirilmez', async () => {
  const keep = [...publishedEmployeeGuides.map((p) => `/blog/${p.slug}/`), ...new Set(Object.values(GUIDE_TARGETS))];
  for (const pathname of keep) {
    const response = await worker.fetch(new Request(`https://maasim.net${pathname}`), env);
    assert.notEqual(response.status, 301, pathname);
  }
});

test('blog manifesti birleştirilen rehberleri içermez', () => {
  const slugs = new Set(blogPosts.map((p) => `/blog/${p.slug}/`));
  for (const legacy of Object.keys(RETIRED_GUIDE_REDIRECTS)) assert.ok(!slugs.has(legacy), legacy);
  assert.equal(publishedEmployeeGuides.length, 5);
});

test('hedef bölüm her durumu çapa ile listeler, SSS öncesine yerleşir ve bağlantıları yeniden yazar', () => {
  const groups = targetGroups();
  assert.equal(groups.size, 7);
  const [target, guides] = [...groups][0];
  const section = casesSection(guides);
  for (const guide of guides) assert.ok(section.includes(`id="${guide.slug}"`));
  const html = '<article><div class="body"><p>x</p><section class="faq"><h2>SSS</h2></section></div></article>';
  assert.equal(insertionPoint(html), html.indexOf('<section class="faq"'));
  const legacy = Object.keys(RETIRED_GUIDE_REDIRECTS)[0];
  assert.equal(rewriteRetiredLinks(`<a href="${legacy}">`), `<a href="${RETIRED_GUIDE_REDIRECTS[legacy]}">`);
  assert.ok(target.startsWith('/blog/'));
});
