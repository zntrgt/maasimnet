import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const theme = await readFile(new URL('../src/theme.css', import.meta.url), 'utf8');
const themeJs = await readFile(new URL('../src/theme.js', import.meta.url), 'utf8');
const uiCss = await readFile(new URL('../src/ui-primitives.css', import.meta.url), 'utf8');
const uiJs = await readFile(new URL('../src/ui-primitives.js', import.meta.url), 'utf8');
const shell = await readFile(new URL('../scripts/apply-shared-shell.js', import.meta.url), 'utf8');
const robots = await readFile(new URL('../content/robots.txt', import.meta.url), 'utf8');
const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));

test('semantic theme tokens include light/dark WCAG-aware foregrounds', () => {
  assert.match(theme, /--color-brand-primary:#0f172a/);
  assert.match(theme, /--color-action:#2563eb/);
  assert.match(theme, /--color-success:#10b981/);
  assert.match(theme, /--color-warning:#f59e0b/);
  assert.match(theme, /--color-danger:#ef4444/);
  assert.match(theme, /html\[data-theme="dark"\]/);
  assert.match(theme, /--color-bg:#0f172a/);
  assert.match(theme, /--font-sans:Inter/);
  assert.match(theme, /--font-numeric:"JetBrains Mono"/);
});

test('touch targets and reduced motion are part of the shared component contract', () => {
  assert.match(theme, /min-height:44px/);
  assert.match(uiCss, /min-width:44px;min-height:44px/);
  assert.match(uiCss, /prefers-reduced-motion:reduce/);
  assert.match(theme, /maasim-shake/);
});

test('theme toggle persists preference and respects system theme', () => {
  assert.match(themeJs, /maasim_theme_v1/);
  assert.match(themeJs, /prefers-color-scheme: dark/);
  assert.match(themeJs, /localStorage\.setItem/);
  assert.match(shell, /data-theme-toggle/);
  assert.match(shell, /data-theme-bootstrap="v3"/);
});

test('framework-free primitives provide popovers and mobile salary summary', () => {
  assert.match(uiCss, /\.ui-tooltip-trigger/);
  assert.match(uiJs, /injectFinancialTooltips/);
  assert.match(uiJs, /enhanceMobileSummary/);
  assert.match(uiJs, /data-human-amount/);
  assert.equal(Boolean(pkg.dependencies?.react || pkg.dependencies?.['framer-motion'] || pkg.dependencies?.tailwindcss), false);
});

test('AI search retrieval stays open without enabling model-training crawlers', () => {
  assert.match(robots, /User-agent: OAI-SearchBot\s+Allow: \//);
  assert.match(robots, /User-agent: ChatGPT-User\s+Allow: \//);
  assert.match(robots, /User-agent: PerplexityBot\s+Allow: \//);
  assert.match(robots, /User-agent: GPTBot\s+Disallow: \//);
  assert.match(robots, /Sitemap: https:\/\/maasim\.net\/sitemap\.xml/);
});
