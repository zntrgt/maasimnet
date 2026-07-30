import { readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const MERGE_MARKER = '/* Birleştirilmiş ortak site shell stilleri */';
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
  const shellCss = await readFile(shellPath, 'utf8');

  if (!styles.includes(MERGE_MARKER)) {
    styles += `\n${MERGE_MARKER}\n${shellCss.trim()}\n`;
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

  if (!styles.includes(MERGE_MARKER) || !styles.includes('.site-header')) {
    throw new Error('Ortak site shell CSS ana stylesheet içine birleştirilemedi.');
  }

  console.log(`CSS birleştirildi: ${htmlFiles.length} HTML sayfasında tek ana stylesheet kullanılıyor.`);
}
