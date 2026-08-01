import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { getPageMetadata } from '../content/site-metadata.js';

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

  const contentTypes = ['WebPage', 'Article', 'BlogPosting', 'TechArticle', 'Report', 'Dataset', 'WebApplication'];
  if (hasType(node, contentTypes) || Object.hasOwn(node, 'dateModified')) {
    node.dateModified = hasType(node, ['Dataset']) && metadata.reviewedAt
      ? metadata.reviewedAt
      : metadata.modifiedAt;
  }

  if (hasType(node, ['WebPage', 'Article', 'BlogPosting', 'TechArticle', 'Report']) && !node.datePublished) {
    node.datePublished = metadata.publishedAt;
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
  return html
    .replace(/(<dt>\s*Son güncelleme\s*<\/dt>\s*<dd>)[^<]*(<\/dd>)/gi, `$1${metadata.modifiedAt}$2`)
    .replace(/(<dt>\s*Son mevzuat kontrolü\s*<\/dt>\s*<dd>)[^<]*(<\/dd>)/gi, `$1${metadata.reviewedAt || metadata.modifiedAt}$2`)
    .replace(/(<strong>\s*Rapor güncellemesi:\s*<\/strong>\s*)\d{4}-\d{2}-\d{2}/gi, `$1${metadata.modifiedAt}`)
    .replace(/(<strong>\s*Mevzuat kontrolü:\s*<\/strong>\s*)\d{4}-\d{2}-\d{2}/gi, `$1${metadata.reviewedAt || metadata.modifiedAt}`);
}

function applyPageDates(html, metadata, pagePath) {
  let updated = updateJsonLd(html, metadata, pagePath);
  updated = updateVisibleFreshness(updated, metadata);
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
