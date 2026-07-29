import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { applyPrivacyToHtml } from '../scripts/apply-privacy-layer.js';
import { addPrivacyPages } from '../scripts/add-privacy-pages.js';

test('GA etiketleri rıza öncesinde kaldırılır ve AdSense scriptleri bloke edilir', () => {
  const input = `<!doctype html><html><head>
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-TEST"></script>
    <script>window.dataLayer=[];function gtag(){dataLayer.push(arguments)};gtag('config','G-TEST')</script>
    <script type="application/ld+json">{"name":"gtag örneği"}</script>
    <script async crossorigin="anonymous" src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-test"></script>
  </head><body><script>(adsbygoogle=window.adsbygoogle||[]).push({});</script></body></html>`;

  const output = applyPrivacyToHtml(input);
  assert.match(output, /\/assets\/consent-manager\.js/);
  assert.match(output, /\/assets\/consent-manager\.css/);
  assert.doesNotMatch(output, /googletagmanager\.com\/gtag\/js/);
  assert.doesNotMatch(output, /gtag\('config'/);
  assert.match(output, /type="application\/ld\+json"/);
  assert.match(output, /data-consent-category="marketing" data-consent-src=/);
  assert.match(output, /data-copy-crossorigin="anonymous"/);
  assert.match(output, /type="text\/plain" data-consent-category="marketing">\(adsbygoogle/);
});

test('gizlilik sayfaları ve sitemap kayıtları oluşturulur', async () => {
  const dist = await mkdtemp(join(tmpdir(), 'maasim-privacy-'));
  try {
    await writeFile(join(dist, 'sitemap.xml'), '<urlset></urlset>');
    await addPrivacyPages(dist);

    const cookiePolicy = await readFile(join(dist, 'cerez-politikasi', 'index.html'), 'utf8');
    const privacyPolicy = await readFile(join(dist, 'gizlilik', 'index.html'), 'utf8');
    const sitemap = await readFile(join(dist, 'sitemap.xml'), 'utf8');

    assert.match(cookiePolicy, /maasim\.consent/);
    assert.match(cookiePolicy, /Tümünü Reddet/);
    assert.match(cookiePolicy, /sertifikalı CMP/);
    assert.match(privacyPolicy, /maaş, vergi matrahı/i);
    assert.match(sitemap, /kvkk-aydinlatma-metni/);
  } finally {
    await rm(dist, { recursive: true, force: true });
  }
});
