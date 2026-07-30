import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { applyPrivacyToHtml } from '../scripts/apply-privacy-layer.js';
import { addPrivacyPages } from '../scripts/add-privacy-pages.js';
import { privacyRegionForCountry } from '../src/worker.js';

test('eski Google etiketleri temizlenir ve güvenli AdSense bootstrap eklenir', () => {
  const input = `<!doctype html><html><head>
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-TEST"></script>
    <script>window.dataLayer=[];function gtag(){dataLayer.push(arguments)};gtag('config','G-TEST')</script>
    <script type="application/ld+json">{"name":"gtag örneği"}</script>
    <script async crossorigin="anonymous" src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-old"></script>
  </head><body><script>(adsbygoogle=window.adsbygoogle||[]).push({});</script></body></html>`;

  const output = applyPrivacyToHtml(input);
  assert.match(output, /\/assets\/consent-manager\.js/);
  assert.match(output, /\/assets\/consent-manager\.css/);
  assert.doesNotMatch(output, /G-TEST/);
  assert.doesNotMatch(output, /ca-pub-old/);
  assert.match(output, /ca-pub-8614552230353945/);
  assert.match(output, /pauseAdRequests=1/);
  assert.match(output, /requestNonPersonalizedAds=1/);
  assert.match(output, /data-privacy-treatments="disablePersonalization"/);
  assert.match(output, /type="application\/ld\+json"/);
  assert.ok(output.indexOf('pauseAdRequests=1') < output.indexOf('/assets/consent-manager.js'));
  assert.ok(output.indexOf('/assets/consent-manager.js') < output.indexOf('pagead2.googlesyndication.com'));
});

test('gizlilik sayfaları bağımsız yayın ve amaç sınırlılığını açıklar', async () => {
  const dist = await mkdtemp(join(tmpdir(), 'maasim-privacy-'));
  try {
    await writeFile(join(dist, 'sitemap.xml'), '<urlset></urlset>');
    await addPrivacyPages(dist);

    const cookiePolicy = await readFile(join(dist, 'cerez-politikasi', 'index.html'), 'utf8');
    const privacyPolicy = await readFile(join(dist, 'gizlilik', 'index.html'), 'utf8');
    const kvkk = await readFile(join(dist, 'kvkk-aydinlatma-metni', 'index.html'), 'utf8');
    const sitemap = await readFile(join(dist, 'sitemap.xml'), 'utf8');

    assert.match(cookiePolicy, /maasim\.consent/);
    assert.match(cookiePolicy, /Google AdSense Privacy &amp; Messaging/);
    assert.match(cookiePolicy, /kişiselleştirilmemiş reklam/i);
    assert.match(privacyPolicy, /bağımsız bir bilgi ve hesaplama yayını/i);
    assert.match(privacyPolicy, /yeniden pazarlama/i);
    assert.match(kvkk, /Amaç dışı kullanım yasağı/i);
    assert.match(sitemap, /kvkk-aydinlatma-metni/);
  } finally {
    await rm(dist, { recursive: true, force: true });
  }
});

test('Google CMP yalnız EEA, Birleşik Krallık ve İsviçre için seçilir', () => {
  assert.equal(privacyRegionForCountry('DE'), 'google-cmp');
  assert.equal(privacyRegionForCountry('GB'), 'google-cmp');
  assert.equal(privacyRegionForCountry('CH'), 'google-cmp');
  assert.equal(privacyRegionForCountry('TR'), 'site-consent');
  assert.equal(privacyRegionForCountry(undefined), 'site-consent');
});
