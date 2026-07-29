import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { compactBlogIndex } from '../scripts/compact-blog-index.js';

test('blog ana sayfası kare görselli kompakt kart gridine dönüştürülür', async () => {
  const dist = await mkdtemp(join(tmpdir(), 'maasim-blog-layout-'));

  try {
    await mkdir(join(dist, 'blog'), { recursive: true });
    await mkdir(join(dist, 'assets'), { recursive: true });
    await writeFile(
      join(dist, 'blog', 'index.html'),
      '<!doctype html><html><body><main class="shell"><section class="cards"><a class="card" href="/blog/ornek/"><img src="/assets/ornek.webp" alt="Örnek"><div><h2>Örnek</h2><p>Açıklama</p></div></a></section></main></body></html>'
    );
    await writeFile(join(dist, 'assets', 'blog.css'), '.cards{display:grid}');

    await compactBlogIndex(dist);

    const html = await readFile(join(dist, 'blog', 'index.html'), 'utf8');
    const css = await readFile(join(dist, 'assets', 'blog.css'), 'utf8');

    assert.match(html, /<body class="blog-index">/);
    assert.match(html, /<span class="card-media"><img/);
    assert.match(css, /\/\* Compact blog card grid \*\//);
    assert.match(css, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
    assert.match(css, /aspect-ratio: 1 \/ 1/);
    assert.match(css, /grid-template-columns: 112px minmax\(0, 1fr\)/);
  } finally {
    await rm(dist, { recursive: true, force: true });
  }
});
