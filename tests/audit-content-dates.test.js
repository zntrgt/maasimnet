import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { applyContentDates } from '../scripts/apply-content-dates.js';
import { getPageMetadata } from '../content/site-metadata.js';

test('visible attributed fields and schema use the same page dates', async()=>{
  const dir=await mkdtemp(join(tmpdir(),'maasim-dates-'));
  try {
    await writeFile(join(dir,'index.html'),`<html><head><link rel="canonical" href="https://maasim.net/"><script type="application/ld+json">{"@type":"WebPage","datePublished":"2026-07-29","dateModified":"2026-07-29"}</script></head><body><dt class="label">Son güncelleme</dt><dd class="value">29 Temmuz 2026</dd><aside>İlk yayın 2026-07-29 · Son güncelleme 2026-07-29 · Son mevzuat kontrolü 2026-09-04</aside></body></html>`);
    await applyContentDates(dir);
    const html=await readFile(join(dir,'index.html'),'utf8');
    const date=getPageMetadata('/').modifiedAt;
    assert.ok(html.includes(`<dd class="value">${date}</dd>`));
    assert.ok(html.includes(`Son güncelleme ${date}`));
    assert.ok(html.includes(`"dateModified":"${date}"`));
  } finally { await rm(dir,{recursive:true,force:true}); }
});
test('blog publication dates follow their original generator dates',()=>{
  assert.equal(getPageMetadata('/blog/100000-tl-brut-maas-neti-2026/').publishedAt,'2026-07-30');
  assert.equal(getPageMetadata('/blog/maas-zam-gorusmesi-nasil-yapilir/').publishedAt,'2026-07-31');
});
