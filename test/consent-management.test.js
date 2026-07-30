import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { applyConsentManagement } from '../scripts/apply-consent-management.js';

test('consent banner and policy are injected with denied defaults', async () => {
  const dist = await mkdtemp(join(tmpdir(), 'maasim-consent-'));
  try {
    await mkdir(join(dist, 'assets'), { recursive: true });
    await mkdir(join(dist, 'blog'), { recursive: true });
    const baseHtml = '<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Test</title></head><body><main>İçerik</main><footer><a href="/gizlilik/">Gizlilik Politikası</a></footer></body></html>';
    await writeFile(join(dist, 'index.html'), baseHtml);
    await writeFile(join(dist, 'blog', 'index.html'), baseHtml);

    await applyConsentManagement(dist);

    const html = await readFile(join(dist, 'index.html'), 'utf8');
    const manager = await readFile(join(dist, 'assets', 'consent-manager.js'), 'utf8');
    const styles = await readFile(join(dist, 'assets', 'consent-manager.css'), 'utf8');
    const policy = await readFile(join(dist, 'cerez-politikasi', 'index.html'), 'utf8');

    assert.match(html, /data-maasim-consent-bootstrap/);
    assert.match(html, /analytics_storage: 'denied'/);
    assert.match(html, /href="\/assets\/consent-manager\.css"/);
    assert.match(html, /src="\/assets\/consent-manager\.js" defer/);
    assert.match(html, /href="\/cerez-politikasi\/">Çerez Politikası/);
    assert.match(html, /data-open-consent-preferences>Çerez Tercihleri/);
    assert.match(manager, /Tümünü Reddet/);
    assert.match(manager, /Tümünü Kabul Et/);
    assert.match(manager, /Tercihleri Yönet/);
    assert.match(manager, /script\[type="text\/plain"\]\[data-consent-category\]/);
    assert.match(styles, /grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
    assert.match(policy, /maasim_consent_v1/);
    assert.match(policy, /İzin verilene kadar kapalı/);
  } finally {
    await rm(dist, { recursive: true, force: true });
  }
});
