import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { formatSiteDateTr, getPageMetadata, SITE_METADATA, STANDARD_FRESHNESS_PATHS } from '../content/site-metadata.js';

async function walkHtml(dir, output = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await walkHtml(path, output);
    else if (entry.name.endsWith('.html')) output.push(path);
  }
  return output;
}

function pathFromHtml(html, file, distDir) {
  const canonical = html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i)
    || html.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["'][^>]*>/i);
  if (canonical) {
    try {
      return new URL(canonical[1], 'https://maasim.net').pathname;
    } catch {
      // Relative path fallback below.
    }
  }

  const relativePath = relative(distDir, file).split(sep).join('/');
  if (relativePath === 'index.html') return '/';
  if (relativePath.endsWith('/index.html')) return `/${relativePath.slice(0, -'index.html'.length)}`;
  return `/${relativePath}`;
}

function hasType(node, names) {
  const types = Array.isArray(node?.['@type']) ? node['@type'] : [node?.['@type']];
  return types.some((type) => names.includes(type));
}

function updateStructuredDates(node, metadata) {
  if (Array.isArray(node)) {
    node.forEach((item) => updateStructuredDates(item, metadata));
    return;
  }
  if (!node || typeof node !== 'object') return;

  const contentTypes = ['WebPage', 'CollectionPage', 'Article', 'BlogPosting', 'TechArticle', 'Report', 'Dataset', 'WebApplication'];
  if (hasType(node, contentTypes) || Object.hasOwn(node, 'dateModified')) {
    node.dateModified = hasType(node, ['Dataset']) && metadata.reviewedAt
      ? metadata.reviewedAt
      : metadata.modifiedAt;
  }

  if (hasType(node, ['WebPage', 'CollectionPage', 'Article', 'BlogPosting', 'TechArticle', 'Report']) && (!node.datePublished || STANDARD_FRESHNESS_PATHS.includes(metadata.path))) {
    node.datePublished = metadata.publishedAt;
  }

  if (metadata.reviewedAt && (hasType(node, ['Article', 'BlogPosting', 'TechArticle', 'Report']) || Object.hasOwn(node, 'lastReviewed'))) {
    node.lastReviewed = metadata.reviewedAt;
  }

  Object.values(node).forEach((value) => updateStructuredDates(value, metadata));
}

function updateJsonLd(html, metadata, pagePath) {
  return html.replace(/<script\b([^>]*type=["']application\/ld\+json["'][^>]*)>([\s\S]*?)<\/script>/gi, (match, attributes, rawJson) => {
    try {
      const data = JSON.parse(rawJson.trim());
      updateStructuredDates(data, metadata);
      return `<script${attributes}>${JSON.stringify(data)}</script>`;
    } catch (error) {
      throw new Error(`JSON-LD tarihleri güncellenemedi (${pagePath}): ${error.message}`);
    }
  });
}

function upsertMeta(html, selectorPattern, tag) {
  if (selectorPattern.test(html)) return html.replace(selectorPattern, tag);
  return html.replace(/<\/head>/i, `  ${tag}\n</head>`);
}

function updateVisibleFreshness(html, metadata) {
  const reviewedAt = metadata.reviewedAt || metadata.modifiedAt;
  const reviewedAtTr = formatSiteDateTr(reviewedAt);
  const footerReviewedAtTr = formatSiteDateTr(SITE_METADATA.payrollDataReviewedAt);

  return html
    .replace(/(<dt\b[^>]*>\s*İlk yayın\s*<\/dt>\s*<dd\b[^>]*>)[^<]*(<\/dd>)/gi, `$1${metadata.publishedAt}$2`)
    .replace(/(<dt\b[^>]*>\s*Son güncelleme\s*<\/dt>\s*<dd\b[^>]*>)[^<]*(<\/dd>)/gi, `$1${metadata.modifiedAt}$2`)
    .replace(/(<dt\b[^>]*>\s*Son mevzuat kontrolü\s*<\/dt>\s*<dd\b[^>]*>)[^<]*(<\/dd>)/gi, `$1${reviewedAt}$2`)
    .replace(/İlk yayın \d{4}-\d{2}-\d{2} · Son güncelleme \d{4}-\d{2}-\d{2} · Son mevzuat kontrolü \d{4}-\d{2}-\d{2}/g, `İlk yayın ${metadata.publishedAt} · Son güncelleme ${metadata.modifiedAt} · Son mevzuat kontrolü ${reviewedAt}`)
    .replace(/(Son güncelleme:\s*)(?:\d{4}-\d{2}-\d{2}|\d{1,2}\s+[A-Za-zÇĞİÖŞÜçğıöşü]+\s+\d{4})/g, `$1${formatSiteDateTr(metadata.modifiedAt)}`)
    .replace(/Yayımlandı ve son (?:mevzuat|veri) kontrolü:\s*\d{1,2}\s+[A-Za-zÇĞİÖŞÜçğıöşü]+\s+\d{4}/g, `Yayımlandı: ${formatSiteDateTr(metadata.publishedAt)} · Son içerik kontrolü: ${reviewedAtTr}`)
    .replace(/(<strong>\s*Rapor güncellemesi:\s*<\/strong>\s*)\d{4}-\d{2}-\d{2}/gi, `$1${metadata.modifiedAt}`)
    .replace(/(<strong>\s*Mevzuat kontrolü:\s*<\/strong>\s*)\d{4}-\d{2}-\d{2}/gi, `$1${reviewedAt}`)
    .replace(/(Son içerik ve kaynak kontrolü:\s*)[^<]*(<\/span>)/gi, `$1${reviewedAt}$2`)
    .replace(/(Son içerik ve mevzuat kontrolü:\s*)[^<]*(<\/p>)/gi, `$1${footerReviewedAtTr}$2`)
    .replace(/son kontrol\s+\d{1,2}\s+[A-Za-zÇĞİÖŞÜçğıöşü]+\s+\d{4}\./g, `son kontrol ${reviewedAtTr}.`);
}

function applyStandardFreshness(html, metadata) {
  if (!STANDARD_FRESHNESS_PATHS.includes(metadata.path)) return html;
  // Tarihler yalnız merkezden alınır. Kontrol kaydı yoksa güncelleme tarihi,
  // mevzuat kontrol tarihi olarak gösterilmez.
  const items = [
    ['İlk yayın', metadata.publishedAt],
    ['Son güncelleme', metadata.modifiedAt],
    ...(metadata.reviewedAt ? [['Son mevzuat / veri kontrolü', metadata.reviewedAt]] : [])
  ];
  const fields = items.map(([label,value]) => `<div><dt>${label}</dt><dd><time datetime="${value}">${formatSiteDateTr(value)}</time></dd></div>`).join('');
  const block = `<aside data-standard-freshness="v1" aria-label="İçerik güncelliği" class="freshness"><h2>Güncellik bilgisi</h2><dl>${fields}</dl></aside>`;
  if (metadata.path === '/') {
    const homeBlock = /<aside\b[^>]*id="home-freshness"[^>]*>[\s\S]*?<\/aside>/i;
    if (!homeBlock.test(html)) throw new Error('Ana sayfa güncellik alanı bulunamadı.');
    return html.replace(homeBlock, old => old.replace(/<dl\b[^>]*>[\s\S]*?<\/dl>/i, `<dl class="grid grid-cols-1 md:grid-cols-3 gap-4">${fields}<div><dt>Geçerlilik dönemi</dt><dd>1 Ocak–31 Aralık 2026</dd></div><div><dt>Sürüm</dt><dd>${SITE_METADATA.releaseVersion}</dd></div></dl>`).replace('id="home-freshness"', 'id="home-freshness" data-standard-freshness="v1"'));
  }
  if (metadata.path === '/2027-maas-hesaplama/') {
    const old = /<div class="estimate-freshness">[\s\S]*?<\/div>/;
    if (!old.test(html)) throw new Error('2027 güncellik alanı bulunamadı.');
    return html.replace(old, `<div class="estimate-freshness" data-standard-freshness="v1">${items.map(([label,value])=>`<span>${label === 'Son mevzuat / veri kontrolü' ? 'Son kontrol' : label}: <time datetime="${value}">${formatSiteDateTr(value)}</time></span>`).join('')}<span>Durum: Resmî 2027 parametreleri bekleniyor</span></div>`);
  }
  const old = /<p>Son güncelleme:\s*\d{1,2}\s+[A-Za-zÇĞİÖŞÜçğıöşü]+\s+\d{4}<\/p>/i;
  if (!old.test(html)) throw new Error('Güncellik satırı bulunamadı: '+metadata.path);
  return html.replace(old, block);
}

function applyPageDates(html, metadata, pagePath) {
  let updated = updateJsonLd(html, metadata, pagePath);
  updated = updateVisibleFreshness(updated, metadata);
  updated = applyStandardFreshness(updated, metadata);
  updated = upsertMeta(
    updated,
    /<meta\b[^>]*name=["']last-modified["'][^>]*>/i,
    `<meta name="last-modified" content="${metadata.modifiedAt}">`
  );
  updated = upsertMeta(
    updated,
    /<meta\b[^>]*property=["']article:modified_time["'][^>]*>/i,
    `<meta property="article:modified_time" content="${metadata.modifiedAt}">`
  );

  if (/<html\b[^>]*data-page-modified=/i.test(updated)) {
    updated = updated.replace(/(<html\b[^>]*data-page-modified=["'])[^"']*(["'])/i, `$1${metadata.modifiedAt}$2`);
  } else {
    updated = updated.replace(/<html\b([^>]*)>/i, `<html$1 data-page-modified="${metadata.modifiedAt}">`);
  }

  return updated;
}

export async function applyContentDates(distDir) {
  const files = await walkHtml(distDir);
  const paths = [];

  for (const file of files) {
    const html = await readFile(file, 'utf8');
    const pagePath = pathFromHtml(html, file, distDir);
    const metadata = getPageMetadata(pagePath);
    const updated = applyPageDates(html, metadata, pagePath);
    await writeFile(file, updated);
    paths.push(metadata.path);
  }

  console.log(`merkezi içerik tarihleri uygulandı: ${files.length} HTML`);
  return Object.freeze({ pageCount: files.length, paths: Object.freeze(paths) });
}
