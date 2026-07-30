import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const HOME_STYLE_MARKER = 'data-home-critical-css="v1"';
const HOME_STYLESHEET_PATTERN = /<link\b[^>]*href=["']\/assets\/styles\.css["'][^>]*>/i;

function minifyCss(source) {
  return source
    .replace(/\/\*(?!\!)[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();
}

export async function inlineHomeCss(distDir) {
  const indexPath = join(distDir, 'index.html');
  const stylesPath = join(distDir, 'assets', 'styles.css');
  const [html, cssSource] = await Promise.all([
    readFile(indexPath, 'utf8'),
    readFile(stylesPath, 'utf8')
  ]);

  if (html.includes(HOME_STYLE_MARKER)) {
    throw new Error('Ana sayfa kritik CSS bloğu birden fazla kez uygulanmaya çalışıldı.');
  }
  if (!HOME_STYLESHEET_PATTERN.test(html)) {
    throw new Error('Ana sayfa styles.css bağlantısı bulunamadı.');
  }

  const css = minifyCss(cssSource);
  if (css.length < 5000 || !css.includes('.calculator-layout')) {
    throw new Error('Ana sayfa CSS kaynağı beklenenden kısa veya hesaplayıcı stilleri eksik.');
  }

  const safeCss = css.replace(/<\/style/gi, '<\\/style');
  const optimized = html.replace(
    HOME_STYLESHEET_PATTERN,
    `<style ${HOME_STYLE_MARKER}>${safeCss}</style>`
  );

  if (!optimized.includes(HOME_STYLE_MARKER) || optimized.includes('href="/assets/styles.css"')) {
    throw new Error('Ana sayfa render-blocking CSS isteği kaldırılamadı.');
  }

  await writeFile(indexPath, optimized, 'utf8');
  console.log(`Ana sayfa CSS'i küçültülerek inline teslim edildi: ${Buffer.byteLength(css, 'utf8')} bayt`);
}
