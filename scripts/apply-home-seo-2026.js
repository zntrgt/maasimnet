import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const TITLE = 'Maaş Hesaplama 2026 | Brütten Nete & Netten Brüte';
const DESCRIPTION = 'Maaş hesaplama 2026: brüt maaşınızı nete, hedef net maaşınızı brüte çevirin. Güncel vergi dilimleri, SGK kesintileri ve işveren maliyetini 12 aylık bordroda görün.';
const H1 = 'Maaş Hesaplama 2026: Brütten Nete & Netten Brüte';
const LEAD = 'Brüt maaşınızı nete, hedef net maaşınızı brüte çevirin; 2026 vergi dilimleri, SGK tavanı, asgari ücret istisnası ve işveren maliyetini 12 aylık bordroda birlikte görün.';

function escapeHtml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function setMeta(html, selector, value) {
  const attr = selector.startsWith('property:') ? 'property' : 'name';
  const key = selector.split(':', 2)[1];
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`<meta\\b(?=[^>]*\\b${attr}=["']${escapedKey}["'])[^>]*>`, 'i');
  const replacement = `<meta ${attr}="${key}" content="${escapeHtml(value)}">`;
  if (pattern.test(html)) return html.replace(pattern, replacement);
  return html.replace(/<\/head>/i, `${replacement}</head>`);
}

function updateSchema(html) {
  return html.replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i, (match, source) => {
    let schema;
    try { schema = JSON.parse(source); } catch { return match; }
    const graph = Array.isArray(schema?.['@graph']) ? schema['@graph'] : [];
    for (const node of graph) {
      if (node?.['@type'] === 'WebApplication' && node?.['@id'] === 'https://maasim.net/#calculator') {
        node.name = 'Maaş Hesaplama 2026';
        node.alternateName = [
          'Brütten Nete Maaş Hesaplama 2026',
          'Netten Brüte Maaş Hesaplama 2026',
          'Brüt Net Maaş Hesaplama 2026'
        ];
        node.description = DESCRIPTION;
      }
      if (node?.['@type'] === 'WebPage' && node?.['@id'] === 'https://maasim.net/#webpage') {
        node.name = TITLE;
        node.description = DESCRIPTION;
      }
    }
    return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
  });
}

export async function applyHomeSeo2026(distDir) {
  const indexPath = join(distDir, 'index.html');
  let html = await readFile(indexPath, 'utf8');

  if (!html.includes('data-enterprise-hero="v2"')) throw new Error('2026 ana sayfa SEO güçlendirmesi için Enterprise Fintech hero bulunamadı.');
  if (!html.includes('https://maasim.net/#calculator')) throw new Error('Ana sayfa WebApplication schema bulunamadı.');

  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(TITLE)}</title>`);
  html = setMeta(html, 'name:description', DESCRIPTION);
  html = setMeta(html, 'property:og:title', TITLE);
  html = setMeta(html, 'property:og:description', DESCRIPTION);
  html = setMeta(html, 'name:twitter:title', TITLE);
  html = setMeta(html, 'name:twitter:description', DESCRIPTION);
  html = html.replace(/(<header\b[^>]*data-enterprise-hero=["']v2["'][^>]*>[\s\S]*?<h1>)[\s\S]*?(<\/h1>)/i, `$1${escapeHtml(H1)}$2`);
  html = html.replace(/(<p\b[^>]*class=["'][^"']*enterprise-hero__lead[^"']*["'][^>]*>)[\s\S]*?(<\/p>)/i, `$1${escapeHtml(LEAD)}$2`);
  html = updateSchema(html);

  await writeFile(indexPath, html, 'utf8');
  console.log('Ana sayfa 2026 query ownership güçlendirildi: title + H1 + hero + schema hizalandı.');
}
