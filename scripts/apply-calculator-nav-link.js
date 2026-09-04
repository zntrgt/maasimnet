import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const DISCOVERY_STYLE_MARKER = 'data-calculator-discovery-css="v1"';
const DISCOVERY_CSS = `.calculator-discovery{width:min(1120px,calc(100% - 32px));margin:56px auto;padding:30px;border:1px solid #dbe4ee;border-radius:28px;background:#fff;color:#0f172a;font-family:Inter,ui-sans-serif,system-ui,sans-serif}.calculator-discovery__head{max-width:760px}.calculator-discovery__eyebrow{margin:0 0 6px!important;color:#0d9488!important;font-size:11px!important;font-weight:900!important;text-transform:uppercase;letter-spacing:.12em}.calculator-discovery__head h2{margin:0 0 8px!important;color:#0f172a!important;font-size:clamp(25px,4vw,34px)!important;line-height:1.15!important;letter-spacing:-.025em}.calculator-discovery__head>p:last-child{margin:0!important;color:#64748b!important;font-size:14px!important;line-height:1.65!important}.calculator-discovery__grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:22px}.calculator-discovery__card{display:flex;min-width:0;min-height:168px;flex-direction:column;gap:9px;padding:19px;border:1px solid #e2e8f0;border-radius:19px;background:#f8fafc;color:#0f172a!important;text-decoration:none!important;box-shadow:none!important}.calculator-discovery__card strong{color:#0f172a!important;font-size:16px!important;line-height:1.35!important}.calculator-discovery__card span{color:#64748b!important;font-size:13px!important;line-height:1.55!important}.calculator-discovery__card b{margin-top:auto;color:#0d9488!important;font-size:12px!important}.calculator-discovery__card:hover{border-color:#5eead4;background:#f0fdfa}.calculator-discovery__all{margin:18px 0 0!important}.calculator-discovery__all a{color:#0d9488!important;font-size:13px!important;font-weight:900!important;text-decoration:none!important}.calculator-discovery--compact .calculator-discovery__grid{grid-template-columns:repeat(4,minmax(0,1fr))}.calculator-discovery--compact .calculator-discovery__card{min-height:150px}.calculator-discovery--home{margin-top:64px;margin-bottom:64px}@media(max-width:900px){.calculator-discovery__grid,.calculator-discovery--compact .calculator-discovery__grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.calculator-discovery{width:calc(100% - 24px);margin:38px auto;padding:20px;border-radius:22px}.calculator-discovery__grid,.calculator-discovery--compact .calculator-discovery__grid{grid-template-columns:1fr}.calculator-discovery__card{min-height:0}}`;

async function walk(dir, output = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await walk(path, output);
    else if (entry.name.endsWith('.html')) output.push(path);
  }
  return output;
}

function addNavLinks(html) {
  if (!html.includes('href="/hesaplama-araclari/"')) {
    html = html.replace(
      /(<div class="site-nav site-nav--desktop"[^>]*><a href="\/#hesaplayici">Hesapla<\/a>)/,
      '$1<a href="/hesaplama-araclari/">Araçlar</a><a href="/tazminat-hesaplama/">Tazminat</a>'
    );
    html = html.replace(
      /(<div class="site-mobile-menu"[^>]*><a href="\/#hesaplayici">Hesapla<\/a>)/,
      '$1<a href="/hesaplama-araclari/">Tüm Hesaplama Araçları</a><a href="/tazminat-hesaplama/">Tazminat Hesaplama</a>'
    );
    html = html.replace(
      /(<nav aria-label="Hesaplayıcı bağlantıları">)/,
      '$1<a href="/hesaplama-araclari/">Tüm Hesaplama Araçları</a>'
    );
  }
  return html;
}

function addDiscoveryCss(html) {
  if (!html.includes('data-calculator-discovery="v1"') || html.includes(DISCOVERY_STYLE_MARKER)) return html;
  const safeCss = DISCOVERY_CSS.replace(/<\/style/gi, '<\\/style');
  return html.replace(/<\/head>/i, `<style ${DISCOVERY_STYLE_MARKER}>${safeCss}</style></head>`);
}

export async function applyCalculatorNavLink(dist) {
  const files = await walk(dist);
  let styled = 0;
  for (const path of files) {
    let html = await readFile(path, 'utf8');
    const hadDiscovery = html.includes('data-calculator-discovery="v1"');
    html = addNavLinks(html);
    html = addDiscoveryCss(html);
    if (hadDiscovery) styled += 1;
    await writeFile(path, html, 'utf8');
  }
  console.log(`Hesaplama araçları navigasyonu uygulandı: ${files.length} sayfa; discovery CSS: ${styled} sayfa.`);
  return Object.freeze({ pages: files.length, styled });
}
