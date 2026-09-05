import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const STYLE_MARKER = '/* Maaşım.net mobile calculator UX v5';
const SCRIPT_SRC = '/assets/mobile-calculator-ux.js';
const VIEWPORT_CONTENT = 'width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover';

function normalizeViewport(html) {
  const viewportPattern = /<meta\b[^>]*name=["']viewport["'][^>]*>/i;
  const viewportTag = `<meta name="viewport" content="${VIEWPORT_CONTENT}">`;
  if (viewportPattern.test(html)) return html.replace(viewportPattern, viewportTag);
  return html.replace(/<head([^>]*)>/i, `<head$1>\n${viewportTag}`);
}

export async function applyMobileCalculatorUx(distDir) {
  const htmlPath = join(distDir, 'index.html');
  const stylesPath = join(distDir, 'assets', 'styles.css');
  let html = await readFile(htmlPath, 'utf8');
  let styles = await readFile(stylesPath, 'utf8');
  const patchCss = await readFile(new URL('../src/mobile-calculator-ux.css', import.meta.url), 'utf8');

  html = normalizeViewport(html);
  if (!styles.includes(STYLE_MARKER)) styles += `\n${patchCss}\n`;
  if (!html.includes(SCRIPT_SRC)) html = html.replace(/<\/body>/i, `<script src="${SCRIPT_SRC}" defer></script></body>`);

  await writeFile(stylesPath, styles);
  await writeFile(htmlPath, html);
  console.log('Mobile calculator UX v5 uygulandı: locked device-width viewport + compact results + contextual sticky + iOS-safe form width.');
}
