import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { SITE_METADATA, formatSiteDateTr } from '../content/site-metadata.js';

const SHELL_STYLE_MARKER = 'data-site-shell-css="v3"';
const SHELL_LINK_PATTERN = /\s*<link\b[^>]*href=["']\/assets\/site-shell\.css["'][^>]*>/gi;
const SHARED_HEADER_PATTERN = /<nav\b[^>]*class=["'][^"']*\bsite-header\b[^"']*["'][\s\S]*?<\/nav>/gi;
const SHARED_FOOTER_PATTERN = /<footer\b[^>]*class=["'][^"']*\bsite-footer\b[^"']*["'][\s\S]*?<\/footer>/gi;

const header = `<nav class="site-header" data-site-header><div class="site-header__inner"><a class="site-brand" href="/" aria-label="Maaşım.net ana sayfa"><img src="/assets/logo.svg" width="40" height="40" alt="Maaşım.net"><span>Maaşım<span>.net</span></span></a><div class="site-nav site-nav--desktop" aria-label="Ana navigasyon"><a href="/#hesaplayici">Hesapla</a><a href="/senaryolar/">Senaryolar</a><a href="/blog/">Blog</a><a href="/veriler/2026/">2026 Verileri</a><a href="/sss/">SSS</a><a href="/sozluk/">Sözlük</a><a href="/hesaplama-metodolojisi/">Metodoloji</a></div><a class="site-header__cta" href="/#hesaplayici">Maaşını Hesapla</a><button class="site-menu-button" type="button" aria-expanded="false" aria-controls="site-mobile-menu" aria-label="Menüyü aç"><span></span><span></span><span></span></button></div><div class="site-mobile-menu" id="site-mobile-menu" hidden><a href="/#hesaplayici">Hesapla</a><a href="/senaryolar/">Senaryolar</a><a href="/blog/">Blog</a><a href="/veriler/2026/">2026 Verileri</a><a href="/sss/">Sık Sorulan Sorular</a><a href="/sozluk/">Maaş Sözlüğü</a><a href="/hesaplama-metodolojisi/">Metodoloji</a></div></nav>`;
const footer = `<footer class="site-footer"><div class="site-footer__inner"><div class="site-footer__grid"><div><a class="site-brand site-brand--footer" href="/"><img src="/assets/logo.svg" width="36" height="36" alt=""><span>Maaşım<span>.net</span></span></a><p>2026 yılı için brütten nete, netten brüte, vergi dilimi ve işveren maliyeti hesaplama aracı.</p></div><div><h2>Bilgi</h2><nav aria-label="Bilgi bağlantıları"><a href="/hakkimizda/">Hakkımızda</a><a href="/editoryal-politika/">Editoryal Politika</a><a href="/kaynak-politikasi/">Kaynak Politikası</a><a href="/blog/">Blog</a><a href="/veriler/2026/">2026 Verileri</a><a href="/hesaplama-metodolojisi/">Hesaplama Metodolojisi</a><a href="/senaryolar/">Maaş Senaryoları</a><a href="/iletisim/">İletişim</a></nav></div><div><h2>Rehberler</h2><nav aria-label="Rehber bağlantıları"><a href="/sss/">Sık Sorulan Sorular</a><a href="/sozluk/">Maaş Sözlüğü</a><a href="/sgk/sgk-tavani/">SGK Tavanı</a><a href="/veriler/2026-gelir-vergisi-dilimleri/">Vergi Dilimleri</a></nav></div><div><h2>Yasal</h2><nav aria-label="Yasal bağlantılar"><a href="/gizlilik/">Gizlilik Politikası</a><a href="/kullanim-kosullari/">Kullanım Koşulları</a><a href="/cerez-politikasi/">Çerez Politikası</a><a href="/cerez-politikasi/#cookie-declaration" data-cookiebot-renew>Çerez Tercihleri</a><a href="/ads.txt">ads.txt</a><a href="/sitemap.xml">Sitemap</a></nav></div></div><div class="site-footer__bottom"><p>© 2026 Maaşım.net. Bilgilendirme amaçlıdır; resmî bordro veya mali müşavirlik hizmeti değildir.</p><p>Son içerik ve sistem güncellemesi: ${formatSiteDateTr(SITE_METADATA.releaseModifiedAt)}</p></div></div></footer>`;

function removeLegacyHeaderBeforeMain(html) {
  const mainIndex = html.search(/<main\b/i);
  if (mainIndex < 0) return html;

  const prefix = html.slice(0, mainIndex)
    .replace(SHARED_HEADER_PATTERN, '')
    .replace(/<header\b[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi, '');

  return prefix + html.slice(mainIndex);
}

function applyHeader(html) {
  const cleaned = removeLegacyHeaderBeforeMain(html);
  return cleaned.replace(/<body([^>]*)>/i, `<body$1>${header}`);
}

function applyFooter(html) {
  const cleaned = html
    .replace(SHARED_FOOTER_PATTERN, '')
    .replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi, '');
  return cleaned.replace(/<\/body>/i, `${footer}</body>`);
}

function addAssets(html, shellCss) {
  html = html.replace(SHELL_LINK_PATTERN, '');

  if (!html.includes(SHELL_STYLE_MARKER)) {
    const safeCss = shellCss.replace(/<\/style/gi, '<\\/style');
    html = html.replace(/<\/head>/i, `<style ${SHELL_STYLE_MARKER}>${safeCss}</style></head>`);
  }

  if (!html.includes('/assets/site-shell.js')) {
    html = html.replace(/<\/body>/i, '<script src="/assets/site-shell.js" defer></script></body>');
  }
  return html;
}

async function walk(dir, output = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await walk(path, output);
    else if (entry.name.endsWith('.html')) output.push(path);
  }
  return output;
}

export async function applySharedShell(dist) {
  const shellCss = (await readFile(join(dist, 'assets', 'site-shell.css'), 'utf8')).trim();
  if (!shellCss.includes('.site-header{') || !shellCss.includes('.site-footer{')) {
    throw new Error('Ortak shell CSS kaynağı header veya footer stillerini içermiyor.');
  }

  const files = await walk(dist);
  for (const path of files) {
    let html = await readFile(path, 'utf8');
    html = applyHeader(html);
    html = applyFooter(html);
    html = addAssets(html, shellCss);

    const headerCount = (html.match(/class="site-header"/g) || []).length;
    const footerCount = (html.match(/class="site-footer"/g) || []).length;
    const legacyTopCount = (html.match(/<header\b[^>]*class=["'][^"']*\btop\b/gi) || []).length;

    if (!html.includes(SHELL_STYLE_MARKER) || headerCount !== 1 || footerCount !== 1 || legacyTopCount !== 0 || !html.includes('data-cookiebot-renew>Çerez Tercihleri')) {
      throw new Error(`Ortak shell tekilleştirilemedi: ${path} (header=${headerCount}, footer=${footerCount}, legacyTop=${legacyTopCount})`);
    }
    await writeFile(path, html);
  }
  console.log(`Eski header/footer kalıpları temizlendi; tek ortak shell uygulandı: ${files.length} sayfa`);
}
