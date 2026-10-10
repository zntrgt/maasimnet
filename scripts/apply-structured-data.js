import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ORGANIZATION, WEBSITE, ORG_ID, WEBSITE_ID, DEFAULT_SOCIAL_IMAGE } from '../content/site-identity.js';
import { getPageMetadata } from '../content/site-metadata.js';
import { canonicalOf, metaOf } from '../content/html-attrs.js';

// Sayfa üreticileri şemayı ayrı ayrı yazar. Bu adım, indekslenebilir her sayfada:
// - Organization ve WebSite düğümlerini tek ve aynı tanımla değiştirir/ekler,
// - sayfa düğümlerine isPartOf/publisher, Article'lara zorunlu ve önerilen alanları,
//   WebApplication ve Dataset'lere yayıncı/oluşturucu bağlantısını ekler,
// - şeması olmayan sayfalara temel WebPage düğümü ekler,
// - sosyal görseli eksik ya da SVG olan sayfalara varsayılan PNG'yi koyar.
// Mevcut değerlerin üzerine yazmaz (Organization/WebSite hariç); yalnız eksikleri doldurur.

const LD_RE = /<script type="application\/ld\+json"([^>]*)>([\s\S]*?)<\/script>/g;
const PAGE_TYPES = new Set(['WebPage', 'CollectionPage', 'AboutPage', 'ContactPage', 'ItemPage', 'SearchResultsPage']);
const orgRef = { '@id': ORG_ID };
const siteRef = { '@id': WEBSITE_ID };

async function htmlFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await htmlFiles(full));
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

const typesOf = (node) => (Array.isArray(node['@type']) ? node['@type'] : [node['@type']]);
const decode = (s = '') => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const stripBrand = (s = '') => s.replace(/\s*\|\s*Maaşım\.net\s*$/, '').trim();
const trimHeadline = (s) => (s.length <= 110 ? s : `${s.slice(0, 107).replace(/\s+\S*$/, '')}…`);
const isRaster = (url = '') => /\.(png|jpe?g|webp|gif|avif)(\?|$)/i.test(url);
const toJson = (data) => JSON.stringify(data).replace(/</g, '\\u003c');

function fillNode(node, ctx) {
  const types = typesOf(node);
  const isArticle = types.some((t) => t === 'Article' || t === 'BlogPosting' || t === 'NewsArticle');
  const isPage = isArticle ? String(node['@id'] || '').endsWith('#webpage') || !node.headline : types.some((t) => PAGE_TYPES.has(t));
  if (isPage || isArticle) {
    node.isPartOf ??= siteRef;
    node.publisher ??= orgRef;
    node.inLanguage ??= 'tr-TR';
  }
  if (isArticle) {
    node.headline ??= trimHeadline(stripBrand(node.name || ctx.title));
    node.author ??= orgRef;
    node.mainEntityOfPage ??= ctx.canonical;
    node.image ??= ctx.socialImage;
  }
  if (types.includes('WebApplication') || types.includes('SoftwareApplication')) node.publisher ??= orgRef;
  if (types.includes('Dataset')) {
    node.creator ??= orgRef;
    node.url ??= ctx.canonical;
    node.isAccessibleForFree ??= true;
    if (!node.description || node.description.length < 50) node.description = ctx.description && ctx.description.length >= 50 ? ctx.description : node.description;
  }
  return node;
}

// Şeması olmayan sayfaya eklenen düğümün tarihleri merkezi site-metadata ile aynı olmalı (verify-content-dates).
function dates(canonical) {
  const meta = getPageMetadata(new URL(canonical).pathname);
  return { ...(meta.publishedAt ? { datePublished: meta.publishedAt } : {}), ...(meta.modifiedAt ? { dateModified: meta.modifiedAt } : {}) };
}

export function normalizePage(html) {
  if (/noindex/i.test(metaOf(html, 'name', 'robots')?.attrs.content || '')) return html;
  const canonical = canonicalOf(html);
  if (!canonical) return html;
  const title = decode(html.match(/<title>([^<]*)<\/title>/i)?.[1] || '');
  const description = decode(metaOf(html, 'name', 'description')?.attrs.content || '');
  const ogTag = metaOf(html, 'property', 'og:image');
  let ogImage = ogTag?.attrs.content;

  // Sosyal görsel: yoksa ekle, SVG ise PNG ile değiştir (Facebook/X SVG göstermez).
  if (!ogImage) {
    html = html.replace(/<\/head>/i, `<meta property="og:image" content="${DEFAULT_SOCIAL_IMAGE}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"></head>`);
    ogImage = DEFAULT_SOCIAL_IMAGE;
  } else if (!isRaster(ogImage)) {
    html = html.replace(ogTag.tag, ogTag.tag.replace(ogImage, DEFAULT_SOCIAL_IMAGE));
    ogImage = DEFAULT_SOCIAL_IMAGE;
  }
  if (!metaOf(html, 'name', 'twitter:card')) html = html.replace(/<\/head>/i, '<meta name="twitter:card" content="summary_large_image"></head>');
  const twImage = metaOf(html, 'name', 'twitter:image');
  if (!twImage) html = html.replace(/<\/head>/i, `<meta name="twitter:image" content="${ogImage}"></head>`);
  else if (!isRaster(twImage.attrs.content)) html = html.replace(twImage.tag, twImage.tag.replace(twImage.attrs.content, ogImage));

  const ctx = { canonical, title, description, socialImage: ogImage };
  const blocks = [];
  html.replace(LD_RE, (match, attrs, body) => { blocks.push({ match, attrs, body }); return match; });

  if (!blocks.length) {
    const page = fillNode({ '@type': /\/iletisim\/$/.test(canonical) ? 'ContactPage' : 'WebPage', '@id': `${canonical}#webpage`, url: canonical, name: stripBrand(title), description: description || undefined, ...dates(canonical) }, ctx);
    const graph = { '@context': 'https://schema.org', '@graph': [ORGANIZATION, WEBSITE, page] };
    return html.replace(/<\/head>/i, `<script type="application/ld+json">${toJson(graph)}</script></head>`);
  }

  let first = true;
  for (const block of blocks) {
    let data;
    try { data = JSON.parse(block.body); } catch { continue; }
    const graphMode = !Array.isArray(data) && Array.isArray(data['@graph']);
    let nodes = Array.isArray(data) ? data : graphMode ? data['@graph'] : [data];
    nodes = nodes.filter((n) => n && n['@id'] !== ORG_ID && n['@id'] !== WEBSITE_ID && !(typesOf(n).includes('WebSite') && !n['@id']));
    nodes = nodes.map((n) => fillNode(n, ctx));
    if (first) { nodes = [ORGANIZATION, WEBSITE, ...nodes]; first = false; }
    if (!nodes.length) { html = html.replace(block.match, ''); continue; }
    const context = (Array.isArray(data) ? data[0]?.['@context'] : data['@context']) || 'https://schema.org';
    const out = nodes.length === 1 && !graphMode ? { '@context': context, ...nodes[0] } : { '@context': context, '@graph': nodes.map((n) => { const { '@context': _c, ...rest } = n; return rest; }) };
    html = html.replace(block.match, `<script type="application/ld+json"${block.attrs}>${toJson(out)}</script>`);
  }
  return html;
}

export async function applyStructuredData(dist) {
  let changed = 0;
  for (const file of await htmlFiles(dist)) {
    const html = await readFile(file, 'utf8');
    const next = normalizePage(html);
    if (next !== html) { await writeFile(file, next, 'utf8'); changed += 1; }
  }
  console.log(`Yapılandırılmış veri normalleştirildi: ${changed} sayfa`);
  return Object.freeze({ changed });
}
