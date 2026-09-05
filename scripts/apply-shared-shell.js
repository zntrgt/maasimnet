import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { SITE_METADATA, formatSiteDateTr } from '../content/site-metadata.js';

const SHELL_STYLE_MARKER = 'data-site-shell-css="v3"';
const THEME_BOOTSTRAP_MARKER = 'data-theme-bootstrap="v3"';
const THEME_RUNTIME_MARKER = 'data-theme-runtime="v3"';
const UI_RUNTIME_MARKER = 'data-ui-runtime="v3"';
const SHELL_LINK_PATTERN = /\s*<link\b[^>]*href=["']\/assets\/site-shell\.css["'][^>]*>/gi;
const SHARED_HEADER_PATTERN = /<nav\b[^>]*class=["'][^"']*\bsite-header\b[^"']*["'][\s\S]*?<\/nav>/gi;
const SHARED_FOOTER_PATTERN = /<footer\b[^>]*class=["'][^"']*\bsite-footer\b[^"']*["'][\s\S]*?<\/footer>/gi;

const themeToggle = `<button class="site-theme-toggle" type="button" data-theme-toggle aria-pressed="false" aria-label="Karanlık temaya geç" title="Karanlık temaya geç"><svg class="theme-icon--sun" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"></path></svg><svg class="theme-icon--moon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"></path></svg></button>`;
const header = `<nav class="site-header" data-site-header><div class="site-header__inner"><a class="site-brand" href="/" aria-label="Maaşım.net ana sayfa"><img src="/assets/logo.svg" width="40" height="40" alt="Maaşım.net"><span>Maaşım<span>.net</span></span></a><div class="site-nav site-nav--desktop" aria-label="Ana navigasyon"><a href="/hesaplama-araclari/">Hesaplama Araçları</a><a href="/isveren-maliyeti-hesaplama/">İşveren Maliyeti</a><a href="/tazminat-hesaplama/">Kıdem &amp; İhbar</a><a href="/veriler/2026/">2026 Verileri</a><a href="/sss/">SSS</a></div><div class="site-header__tools">${themeToggle}<a class="site-header__cta" href="/#hesaplayici">Maaş Hesapla</a><button class="site-menu-button" type="button" aria-expanded="false" aria-controls="site-mobile-menu" aria-label="Menüyü aç"><span></span><span></span><span></span></button></div></div><div class="site-mobile-menu" id="site-mobile-menu" hidden><a href="/hesaplama-araclari/">Hesaplama Araçları</a><a href="/isveren-maliyeti-hesaplama/">İşveren Maliyeti</a><a href="/tazminat-hesaplama/">Kıdem &amp; İhbar</a><a href="/veriler/2026/">2026 Verileri</a><a href="/sss/">Sık Sorulan Sorular</a><a href="/blog/">Blog</a><a href="/hesaplama-metodolojisi/">Metodoloji</a></div></nav>`;
const footer = `<footer class="site-footer"><div class="site-footer__inner"><div class="site-footer__grid"><div><a class="site-brand site-brand--footer" href="/"><img src="/assets/logo.svg" width="36" height="36" alt=""><span>Maaşım<span>.net</span></span></a><p>2026 bordro ve çalışan haklarını güncel mevzuat parametreleriyle hesaplayan bağımsız finansal araç platformu.</p></div><div><h2>Platform</h2><nav aria-label="Bilgi bağlantıları"><a href="/hesaplama-araclari/">Tüm Hesaplama Araçları</a><a href="/hakkimizda/">Hakkımızda</a><a href="/blog/">Blog</a><a href="/veriler/2026/">2026 Verileri</a><a href="/hesaplama-metodolojisi/">Hesaplama Metodolojisi</a><a href="/iletisim/">İletişim</a></nav></div><div><h2>Hesaplayıcılar</h2><nav aria-label="Hesaplayıcı bağlantıları"><a href="/asgari-ucret-hesaplama/">Asgari Ücret Hesaplama</a><a href="/tazminat-hesaplama/">Kıdem &amp; İhbar Tazminatı</a><a href="/issizlik-maasi-hesaplama/">İşsizlik Maaşı</a><a href="/fazla-mesai-hesaplama/">Fazla Mesai</a><a href="/yillik-izin-ucreti-hesaplama/">Yıllık İzin Ücreti</a><a href="/2027-maas-hesaplama/">2027 Maaş Tahmini</a></nav></div><div><h2>Güven &amp; Yasal</h2><nav aria-label="Yasal bağlantılar"><a href="/editoryal-politika/">Editoryal Politika</a><a href="/kaynak-politikasi/">Kaynak Politikası</a><a href="/gizlilik/">Gizlilik Politikası</a><a href="/kullanim-kosullari/">Kullanım Koşulları</a><a href="/cerez-politikasi/">Çerez Politikası</a><a href="/cerez-politikasi/#cookie-declaration" data-cookiebot-renew>Çerez Tercihleri</a></nav></div></div><div class="site-footer__bottom"><p>© 2026 Maaşım.net. Bilgilendirme amaçlıdır; resmî bordro veya mali müşavirlik hizmeti değildir.</p><p>Son içerik ve sistem güncellemesi: ${formatSiteDateTr(SITE_METADATA.releaseModifiedAt)}</p></div></div></footer>`;

const themeBootstrap = `(()=>{try{const k='maasim_theme_v1',s=localStorage.getItem(k),t=s==='dark'||s==='light'?s:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t}catch(_){}})();`;

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

function safeInline(value, tagName) {
  return value.replace(new RegExp(`<\\/${tagName}`, 'gi'), `<\\/${tagName}`);
}

function addAssets(html, sharedCss, themeJs, uiJs) {
  html = html.replace(SHELL_LINK_PATTERN, '');

  if (!html.includes(THEME_BOOTSTRAP_MARKER)) {
    html = html.replace(/<\/head>/i, `<script ${THEME_BOOTSTRAP_MARKER}>${safeInline(themeBootstrap, 'script')}</script></head>`);
  }
  if (!html.includes(SHELL_STYLE_MARKER)) {
    html = html.replace(/<\/head>/i, `<style ${SHELL_STYLE_MARKER}>${safeInline(sharedCss, 'style')}</style></head>`);
  }
  if (!html.includes(THEME_RUNTIME_MARKER)) {
    html = html.replace(/<\/body>/i, `<script ${THEME_RUNTIME_MARKER}>${safeInline(themeJs, 'script')}</script></body>`);
  }
  if (!html.includes(UI_RUNTIME_MARKER)) {
    html = html.replace(/<\/body>/i, `<script ${UI_RUNTIME_MARKER}>${safeInline(uiJs, 'script')}</script></body>`);
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
  const [shellCss, themeCss, uiCss, themeJs, uiJs] = await Promise.all([
    readFile(join(dist, 'assets', 'site-shell.css'), 'utf8'),
    readFile(new URL('../src/theme.css', import.meta.url), 'utf8'),
    readFile(new URL('../src/ui-primitives.css', import.meta.url), 'utf8'),
    readFile(new URL('../src/theme.js', import.meta.url), 'utf8'),
    readFile(new URL('../src/ui-primitives.js', import.meta.url), 'utf8')
  ]);
  if (!shellCss.includes('.site-header{') || !shellCss.includes('.site-footer{')) throw new Error('Ortak shell CSS kaynağı header veya footer stillerini içermiyor.');
  if (!themeCss.includes('--color-action:#2563eb') || !themeCss.includes('html[data-theme="dark"]')) throw new Error('Design System v3 theme tokenları eksik.');
  if (!uiCss.includes('.ui-tooltip-trigger') || !uiJs.includes('enhanceMobileSummary')) throw new Error('UI primitive katmanı eksik.');
  const sharedCss = `${shellCss.trim()}\n${themeCss.trim()}\n${uiCss.trim()}`;

  const files = await walk(dist);
  for (const path of files) {
    let html = await readFile(path, 'utf8');
    html = applyHeader(html);
    html = applyFooter(html);
    html = addAssets(html, sharedCss, themeJs, uiJs);

    const headerCount = (html.match(/class="site-header"/g) || []).length;
    const footerCount = (html.match(/class="site-footer"/g) || []).length;
    const themeToggleCount = (html.match(/<button\b[^>]*\bdata-theme-toggle\b[^>]*>/gi) || []).length;
    const legacyTopCount = (html.match(/<header\b[^>]*class=["'][^"']*\btop\b/gi) || []).length;

    if (!html.includes(SHELL_STYLE_MARKER) || !html.includes(THEME_BOOTSTRAP_MARKER) || !html.includes(THEME_RUNTIME_MARKER) || !html.includes(UI_RUNTIME_MARKER) || headerCount !== 1 || footerCount !== 1 || themeToggleCount !== 1 || legacyTopCount !== 0 || !html.includes('data-cookiebot-renew>Çerez Tercihleri')) {
      throw new Error(`Ortak shell/design system tekilleştirilemedi: ${path} (header=${headerCount}, footer=${footerCount}, themeToggle=${themeToggleCount}, legacyTop=${legacyTopCount})`);
    }
    await writeFile(path, html);
  }
  console.log(`Enterprise ortak header/footer + Design System v3 uygulandı: ${files.length} sayfa`);
}
