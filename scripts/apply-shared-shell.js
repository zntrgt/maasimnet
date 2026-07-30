import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const header = `<nav class="site-header" data-site-header><div class="site-header__inner"><a class="site-brand" href="/" aria-label="Maaşım.net ana sayfa"><img src="/assets/logo.svg" width="40" height="40" alt="Maaşım.net"><span>Maaşım<span>.net</span></span></a><div class="site-nav site-nav--desktop" aria-label="Ana navigasyon"><a href="/#hesaplayici">Hesapla</a><a href="/senaryolar/">Senaryolar</a><a href="/blog/">Blog</a><a href="/veriler/2026/">2026 Verileri</a><a href="/sss/">SSS</a><a href="/sozluk/">Sözlük</a><a href="/hesaplama-metodolojisi/">Metodoloji</a></div><a class="site-header__cta" href="/#hesaplayici">Maaşını Hesapla</a><button class="site-menu-button" type="button" aria-expanded="false" aria-controls="site-mobile-menu" aria-label="Menüyü aç"><span></span><span></span><span></span></button></div><div class="site-mobile-menu" id="site-mobile-menu" hidden><a href="/#hesaplayici">Hesapla</a><a href="/senaryolar/">Senaryolar</a><a href="/blog/">Blog</a><a href="/veriler/2026/">2026 Verileri</a><a href="/sss/">Sık Sorulan Sorular</a><a href="/sozluk/">Maaş Sözlüğü</a><a href="/hesaplama-metodolojisi/">Metodoloji</a></div></nav>`;
const footer = `<footer class="site-footer"><div class="site-footer__inner"><div class="site-footer__grid"><div><a class="site-brand site-brand--footer" href="/"><img src="/assets/logo.svg" width="36" height="36" alt=""><span>Maaşım<span>.net</span></span></a><p>2026 yılı için brütten nete, netten brüte, vergi dilimi ve işveren maliyeti hesaplama aracı.</p></div><div><h2>Bilgi</h2><nav aria-label="Bilgi bağlantıları"><a href="/hakkimizda/">Hakkımızda</a><a href="/blog/">Blog</a><a href="/veriler/2026/">2026 Verileri</a><a href="/hesaplama-metodolojisi/">Hesaplama Metodolojisi</a><a href="/senaryolar/">Maaş Senaryoları</a><a href="/iletisim/">İletişim</a></nav></div><div><h2>Rehberler</h2><nav aria-label="Rehber bağlantıları"><a href="/sss/">Sık Sorulan Sorular</a><a href="/sozluk/">Maaş Sözlüğü</a><a href="/sgk/sgk-tavani/">SGK Tavanı</a><a href="/veriler/2026-gelir-vergisi-dilimleri/">Vergi Dilimleri</a></nav></div><div><h2>Yasal</h2><nav aria-label="Yasal bağlantılar"><a href="/gizlilik/">Gizlilik Politikası</a><a href="/kullanim-kosullari/">Kullanım Koşulları</a><a href="/ads.txt">ads.txt</a><a href="/sitemap.xml">Sitemap</a></nav></div></div><div class="site-footer__bottom"><p>© 2026 Maaşım.net. Bilgilendirme amaçlıdır; resmî bordro veya mali müşavirlik hizmeti değildir.</p><p>Son içerik ve mevzuat kontrolü: 29 Temmuz 2026</p></div></div></footer>`;

function applyHeader(html) {
  const existing = /<nav\b[\s\S]*?<\/nav>/i;
  return existing.test(html)
    ? html.replace(existing, header)
    : html.replace(/<body([^>]*)>/i, `<body$1>${header}`);
}

function applyFooter(html) {
  const existing = /<footer\b[\s\S]*?<\/footer>/i;
  return existing.test(html)
    ? html.replace(existing, footer)
    : html.replace(/<\/body>/i, `${footer}</body>`);
}

function addAssets(html) {
  if (!html.includes('/assets/site-shell.css')) html = html.replace(/<\/head>/i, '<link rel="stylesheet" href="/assets/site-shell.css"></head>');
  if (!html.includes('/assets/site-shell.js')) html = html.replace(/<\/body>/i, '<script src="/assets/site-shell.js" defer></script></body>');
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
  const files = await walk(dist);
  for (const path of files) {
    let html = await readFile(path, 'utf8');
    html = applyHeader(html);
    html = applyFooter(html);
    html = addAssets(html);
    await writeFile(path, html);
  }
  console.log(`ortak header/footer uygulandı: ${files.length} sayfa`);
}
