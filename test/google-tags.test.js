import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { applyGoogleTags } from '../scripts/apply-google-tags.js';

const GA_ID = 'G-988BB5B64E';
const ADSENSE_CLIENT = 'ca-pub-8614552230353945';
const count = (source, token) => source.split(token).length - 1;

const consentMode = `<script data-cookieconsent="ignore" data-maasim-consent-mode>
window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied' });
</script>`;

const legacy = `<script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
<script>gtag('config', '${GA_ID}');</script>
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}" crossorigin="anonymous"></script>`;

test('GA4 and AdSense Auto Ads are injected once after Consent Mode on every page', async () => {
  const dist = await mkdtemp(join(tmpdir(), 'maasim-google-tags-'));
  try {
    await mkdir(join(dist, 'blog'), { recursive: true });
    await writeFile(join(dist, 'index.html'), `<!doctype html><html><head>${consentMode}${legacy}</head><body><input id="input-salary"></body></html>`);
    await writeFile(join(dist, 'blog', 'index.html'), `<!doctype html><html><head>${consentMode}</head><body>Blog</body></html>`);

    await applyGoogleTags(dist);
    await applyGoogleTags(dist);

    const home = await readFile(join(dist, 'index.html'), 'utf8');
    const blog = await readFile(join(dist, 'blog', 'index.html'), 'utf8');

    for (const html of [home, blog]) {
      const consentPosition = html.indexOf('data-maasim-consent-mode');
      const gaPosition = html.indexOf('data-maasim-google-tag');
      const adsensePosition = html.indexOf('data-maasim-adsense-auto');
      assert.ok(consentPosition > -1 && gaPosition > consentPosition && adsensePosition > gaPosition);
      assert.equal(count(html, `gtag/js?id=${GA_ID}`), 1);
      assert.equal(count(html, `gtag('config', '${GA_ID}'`), 1);
      assert.equal(count(html, `adsbygoogle.js?client=${ADSENSE_CLIENT}`), 1);
      assert.doesNotMatch(html, /<ins[^>]+adsbygoogle/i);
    }

    assert.match(home, /data-maasim-calculator-analytics/);
    assert.doesNotMatch(blog, /data-maasim-calculator-analytics/);
  } finally {
    await rm(dist, { recursive: true, force: true });
  }
});
