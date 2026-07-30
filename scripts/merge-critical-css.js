import { readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const LEGACY_MERGE_MARKER = '/* Birleştirilmiş ortak site shell stilleri */';
const CURRENT_MERGE_MARKER = '/* Birleştirilmiş ortak site shell stilleri v2 */';
const SHELL_LINK_PATTERN = /\s*<link\b[^>]*href=["']\/assets\/site-shell\.css["'][^>]*>/gi;

async function walkHtml(dir, output = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await walkHtml(path, output);
    else if (entry.name.endsWith('.html')) output.push(path);
  }
  return output;
}

export async function mergeCriticalCss(distDir) {
  const stylesPath = join(distDir, 'assets', 'styles.css');
  const shellPath = join(distDir, 'assets', 'site-shell.css');

  let styles = await readFile(stylesPath, 'utf8');
  const shellCss = (await readFile(shellPath, 'utf8')).trim();

  // Eski build çıktılarında legacy marker styles.css içinde kalabiliyor.
  // Bu nedenle yalnız marker varlığına güvenmeyip güncel shell sürümünü ayrıca ekliyoruz.
  if (!styles.includes(CURRENT_MERGE_MARKER)) {
    styles += `\n${CURRENT_MERGE_MARKER}\n${shellCss}\n`;
    await writeFile(stylesPath, styles, 'utf8');
  }

  const htmlFiles = await walkHtml(distDir);
  for (const path of htmlFiles) {
    const html = await readFile(path, 'utf8');
    const optimized = html.replace(SHELL_LINK_PATTERN, '');
    if (optimized.includes('/assets/site-shell.css')) {
      throw new Error(`Ayrı site-shell.css isteği kaldı: ${path}`);
    }
    if (optimized !== html) await writeFile(path, optimized, 'utf8');
  }

  await rm(shellPath, { force: true });

  const finalStyles = await readFile(stylesPath, 'utf8');
  for (const token of [
    CURRENT_MERGE_MARKER,
    '.site-header{',
    '.site-footer{',
    '.site-footer__grid{',
    'width:100%!important',
    'display:block!important'
  ]) {
    if (!finalStyles.includes(token)) {
      throw new Error(`Güncel ortak site shell CSS ana stylesheet içinde eksik: ${token}`);
    }
  }

  if (!finalStyles.includes(LEGACY_MERGE_MARKER)) {
    console.warn('Legacy shell marker bulunmadı; yalnız güncel v2 shell kullanılıyor.');
  }

  console.log(`Güncel ortak shell CSS birleştirildi: ${htmlFiles.length} HTML sayfasında tek ana stylesheet kullanılıyor.`);
}
