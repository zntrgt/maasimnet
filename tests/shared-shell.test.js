import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const shell = await readFile(new URL('../scripts/apply-shared-shell.js', import.meta.url), 'utf8');
const css = await readFile(new URL('../src/site-shell.css', import.meta.url), 'utf8');
const js = await readFile(new URL('../src/site-shell.js', import.meta.url), 'utf8');
const build = await readFile(new URL('../scripts/build.js', import.meta.url), 'utf8');

test('ortak header ve footer tek build kaynağından üretilir', () => {
  assert.match(shell, /class="site-header"/);
  assert.match(shell, /class="site-footer"/);
  assert.match(shell, /applySharedShell/);
  assert.match(build, /await applySharedShell\(distDir\)/);
});

test('mobil hamburger erişilebilir ve kapanma davranışlarına sahiptir', () => {
  assert.match(shell, /class="site-menu-button"/);
  assert.match(shell, /aria-expanded="false"/);
  assert.match(shell, /id="site-mobile-menu"/);
  assert.match(js, /event\.key === 'Escape'/);
  assert.match(js, /window\.innerWidth > 1050/);
  assert.match(css, /@media\(max-width:1050px\)/);
  assert.match(css, /\.site-menu-button\{display:none/);
});

test('ortak navigasyon ana içerik merkezlerini içerir', () => {
  for (const href of ['/senaryolar/','/blog/','/veriler/2026/','/sss/','/sozluk/','/hesaplama-metodolojisi/']) {
    assert.match(shell, new RegExp(`href="${href.replaceAll('/', '\\/')}"`));
  }
});