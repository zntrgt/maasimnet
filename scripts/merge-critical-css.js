import { readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const SHELL_STYLE_MARKER = 'data-site-shell-css="v3"';
const SHELL_LINK_PATTERN = /\s*<link\b[^>]*href=["']\/assets\/site-shell\.css["'][^>]*>/gi;
const SHELL_STYLE_PATTERN = /<style\s+data-site-shell-css=["']v3["'][^>]*>([\s\S]*?)<\/style>/i;

async function walkHtml(dir, output = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await walkHtml(path, output);
    else if (entry.name.endsWith('.html')) output.push(path);
  }
  return output;
}

function normalizeCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, '')
    .replace(/;}/g, '}')
    .trim();
}

export async function mergeCriticalCss(distDir) {
  const shellPath = join(distDir, 'assets', 'site-shell.css');
  const htmlFiles = await walkHtml(distDir);
  let canonicalEmbeddedCss = null;

  for (const path of htmlFiles) {
    const html = await readFile(path, 'utf8');
    const optimized = html.replace(SHELL_LINK_PATTERN, '');

    for (const token of [
      SHELL_STYLE_MARKER,
      'class="site-header"',
      'class="site-footer"',
      '.site-header{',
      '.site-footer{',
      '.site-footer__grid{',
      '/* Legacy sayfa CSS\'lerinden ortak shell izolasyonu */'
    ]) {
      if (!optimized.includes(token)) {
        throw new Error(`Ortak shell her sayfaya aynı biçimde teslim edilmedi (${token}): ${path}`);
      }
    }

    const styleMatch = optimized.match(SHELL_STYLE_PATTERN);
    if (!styleMatch) {
      throw new Error(`İşaretli ortak shell stil bloğu bulunamadı: ${path}`);
    }

    const normalizedEmbedded = normalizeCss(styleMatch[1]);
    if (!normalizedEmbedded) {
      throw new Error(`Ortak shell stil bloğu boş üretildi: ${path}`);
    }

    if (canonicalEmbeddedCss === null) canonicalEmbeddedCss = normalizedEmbedded;
    if (normalizedEmbedded !== canonicalEmbeddedCss) {
      throw new Error(`Ortak shell CSS sayfalar arasında farklı üretildi: ${path}`);
    }

    if (optimized.includes('/assets/site-shell.css')) {
      throw new Error(`Ayrı site-shell.css isteği kaldı: ${path}`);
    }
    if (optimized !== html) await writeFile(path, optimized, 'utf8');
  }

  if (!canonicalEmbeddedCss || canonicalEmbeddedCss.length < 1000) {
    throw new Error('Ortak shell CSS beklenenden kısa veya boş üretildi.');
  }

  await rm(shellPath, { force: true });
  console.log(`Ortak shell tek kaynaktan inline teslim edildi: ${htmlFiles.length} HTML sayfası doğrulandı.`);
}
