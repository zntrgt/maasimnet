import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { runInNewContext } from 'node:vm';
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

test('GA4 and AdSense are blocked until Cookiebot consent and injected idempotently', async () => {
  const dist = await mkdtemp(join(tmpdir(), 'maasim-google-tags-'));
  try {
    await mkdir(join(dist, 'blog'), { recursive: true });
    await writeFile(join(dist, 'index.html'), `<!doctype html><html><head>${consentMode}${legacy}</head><body><input id="input-salary"><aside class="ad-slot" aria-label="Reklam"><span>Reklam</span><ins class="adsbygoogle" data-ad-client="${ADSENSE_CLIENT}" data-ad-slot="1234567890"></ins></aside></body></html>`);
    await writeFile(join(dist, 'blog', 'index.html'), `<!doctype html><html><head>${consentMode}</head><body>Blog</body></html>`);

    await applyGoogleTags(dist);
    await applyGoogleTags(dist);

    const home = await readFile(join(dist, 'index.html'), 'utf8');
    const blog = await readFile(join(dist, 'blog', 'index.html'), 'utf8');

    for (const html of [home, blog]) {
      const consentPosition = html.indexOf('data-maasim-consent-mode');
      const loaderPosition = html.indexOf('data-maasim-google-tag');

      assert.ok(consentPosition > -1 && loaderPosition > consentPosition);
      assert.equal(count(html, 'data-maasim-google-tag'), 1);
      assert.equal(count(html, "'maasim-ga4-script'"), 1);
      assert.equal(count(html, "'maasim-adsense-script'"), 1);
      assert.equal(count(html, `gtag/js?id=${GA_ID}`), 0);
      assert.equal(count(html, `gtag('config', '${GA_ID}'`), 0);
      assert.equal(count(html, `adsbygoogle.js?client=${ADSENSE_CLIENT}`), 0);
      assert.match(html, /Cookiebot\?\.consent\?\.statistics/);
      assert.match(html, /Cookiebot\?\.consent\?\.marketing/);
      assert.match(html, /CookiebotOnConsentReady/);
      assert.match(html, /CookiebotOnDecline/);
      assert.match(html, /window\.location\.reload\(\)/);
      assert.doesNotMatch(html, /<script async src="https:\/\/www\.googletagmanager\.com\/gtag\/js/);
      assert.doesNotMatch(html, /<script async src="https:\/\/pagead2\.googlesyndication\.com\/pagead\/js/);
      assert.doesNotMatch(html.replace(/<aside\b[^>]*class="[^"]*\bad-slot\b[^"]*"[^>]*>[\s\S]*?<\/aside>/gi, ''), /<ins\b[^>]*\badsbygoogle\b/i);
      assert.match(html, /document\.documentElement\.dataset\.ads = 'on'/);
      assert.match(html, /Cookiebot\?\.consent\?\.marketing !== true/);
      assert.match(html, /data-adsbygoogle-status/);
      assert.equal(count(html, `<meta name="google-adsense-account" content="${ADSENSE_CLIENT}">`), 1);
      assert.ok(html.indexOf('google-adsense-account') < html.indexOf('</head>'));
    }

    assert.match(home, /data-maasim-calculator-analytics/);
    assert.equal(count(home, '<ins class="adsbygoogle"'), 1);
    assert.doesNotMatch(blog, /data-maasim-calculator-analytics/);
  } finally {
    await rm(dist, { recursive: true, force: true });
  }
});

test('AdSense slots initialize once only after marketing consent', async () => {
  const dist = await mkdtemp(join(tmpdir(), 'maasim-ads-consent-'));
  try {
    await writeFile(join(dist, 'index.html'), `<!doctype html><html><head>${consentMode}</head><body></body></html>`);
    await applyGoogleTags(dist);
    const html = await readFile(join(dist, 'index.html'), 'utf8');
    const code = html.match(/<script data-cookieconsent="ignore" data-maasim-google-tag>([\s\S]*?)<\/script>/)?.[1];
    assert.ok(code);

    const listeners = new Map();
    const scripts = [];
    const slots = [{ dataset: {} }, { dataset: {} }];
    const window = {
      Cookiebot: { consent: { statistics: false, marketing: false } },
      addEventListener: (name, callback) => listeners.set(name, callback)
    };
    const document = {
      documentElement: { dataset: {} },
      readyState: 'complete',
      head: { appendChild: (script) => scripts.push(script) },
      getElementById: (id) => scripts.find((script) => script.id === id),
      createElement: () => ({ setAttribute(name, value) { this[name] = value; } }),
      querySelectorAll: () => slots.filter((slot) => !slot.dataset.maasimAdRequested)
    };
    runInNewContext(code, { window, document, encodeURIComponent, Date });
    assert.equal(scripts.length, 0);
    assert.equal(window.adsbygoogle, undefined);
    assert.equal(document.documentElement.dataset.ads, undefined);

    window.Cookiebot.consent.marketing = true;
    listeners.get('CookiebotOnAccept')();
    assert.equal(scripts.filter((script) => script.id === 'maasim-adsense-script').length, 1);
    assert.equal(document.documentElement.dataset.ads, 'on');
    assert.equal(window.adsbygoogle.length, 2);
    assert.ok(slots.every((slot) => slot.dataset.maasimAdRequested === 'true'));
    listeners.get('CookiebotOnAccept')();
    assert.equal(window.adsbygoogle.length, 2);
  } finally {
    await rm(dist, { recursive: true, force: true });
  }
});
