import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { applyConsentManagement } from '../scripts/apply-consent-management.js';

const COOKIEBOT_ID = 'fc0797fc-6cb3-4086-98c8-c276a7024462';

test('Cookiebot, TCF, Consent Mode and declaration are injected', async () => {
  const dist = await mkdtemp(join(tmpdir(), 'maasim-cookiebot-'));
  try {
    await mkdir(join(dist, 'assets'), { recursive: true });
    await mkdir(join(dist, 'blog'), { recursive: true });
    const baseHtml = '<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Test</title></head><body><main>İçerik</main><footer><a href="/gizlilik/">Gizlilik Politikası</a></footer></body></html>';
    await writeFile(join(dist, 'index.html'), baseHtml);
    await writeFile(join(dist, 'blog', 'index.html'), baseHtml);

    await applyConsentManagement(dist);

    const html = await readFile(join(dist, 'index.html'), 'utf8');
    const policy = await readFile(join(dist, 'cerez-politikasi', 'index.html'), 'utf8');

    const cookiebotPosition = html.indexOf('id="Cookiebot"');
    const consentModePosition = html.indexOf('data-maasim-consent-mode');
    const originalMetaPosition = html.indexOf('<meta charset="utf-8">');

    assert.ok(cookiebotPosition > -1);
    assert.ok(consentModePosition > cookiebotPosition);
    assert.ok(cookiebotPosition < originalMetaPosition);
    assert.match(html, new RegExp(`data-cbid="${COOKIEBOT_ID}"`));
    assert.match(html, /data-blockingmode="auto"/);
    assert.match(html, /data-framework="TCFv2\.2"/);
    assert.match(html, /data-cookieconsent="ignore"/);
    assert.match(html, /analytics_storage: 'denied'/);
    assert.match(html, /ad_user_data: 'denied'/);
    assert.match(html, /ads_data_redaction', true/);
    assert.match(html, /href="\/cerez-politikasi\/">Çerez Politikası/);
    assert.match(html, /data-cookiebot-renew>Çerez Tercihleri/);
    assert.doesNotMatch(html, /consent-manager\.(?:js|css)/);
    assert.doesNotMatch(html, /data-maasim-consent-bootstrap/);

    assert.match(policy, new RegExp(`id="CookieDeclaration" src="https://consent\\.cookiebot\\.com/${COOKIEBOT_ID}/cd\\.js"`));
    assert.match(policy, /Reklamlar/);
    assert.match(policy, /İzin verilene kadar kapalı/);
    assert.match(policy, /data-cookiebot-renew>Çerez tercihlerini aç/);
    assert.doesNotMatch(policy, /maasim_consent_v1/);
  } finally {
    await rm(dist, { recursive: true, force: true });
  }
});
