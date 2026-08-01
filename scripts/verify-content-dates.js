import { access, readFile, readdir } from 'node:fs/promises';
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

function pagePath(html, file, distDir) {
  const canonical = html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i)
    || html.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["'][^>]*>/i);
  if (canonical) return new URL(canonical[1], 'https://maasim.net').pathname;

  const relativePath = relative(distDir, file).split(sep).join('/');
  if (relativePath === 'index.html') return '/';
  if (relativePath.endsWith('/index.html')) return `/${relativePath.slice(0, -'index.html'.length)}`;
  return `/${relativePath}`;
}

function hasType(node, names) {
  const types = Array.isArray(node?.['@type']) ? node['@type'] : [node?.['@type']];
  return types.some((type) => names.includes(type));
}

function validateStructuredDates(node, metadata, page, failures) {
  if (Array.isArray(node)) {
    node.forEach((item) => validateStructuredDates(item, metadata, page, failures));
    return;
  }
  if (!node || typeof node !== 'object') return;

  const contentTypes = ['WebPage', 'Article', 'BlogPosting', 'TechArticle', 'Report', 'Dataset', 'WebApplication'];
  if (hasType(node, contentTypes) || Object.hasOwn(node, 'dateModified')) {
    const expected = hasType(node, ['Dataset']) && metadata.reviewedAt
      ? metadata.reviewedAt
      : metadata.modifiedAt;
    if (node.dateModified !== expected) failures.push(`${page}: JSON-LD dateModified ${node.dateModified} yerine ${expected} olmalı.`);
  }

  Object.values(node).forEach((value) => validateStructuredDates(value, metadata, page, failures));
}

export async function verifyContentDates(distDir) {
  const failures = [];
  const files = await walkHtml(distDir);

  for (const file of files) {
    const html = await readFile(file, 'utf8');
    const path = pagePath(html, file, distDir);
    const metadata = getPageMetadata(path);

    if (!html.includes(`data-page-modified="${metadata.modifiedAt}"`)) {
      failures.push(`${path}: data-page-modified eksik veya yanlış.`);
    }
    if (!html.includes(`<meta name="last-modified" content="${metadata.modifiedAt}">`)) {
      failures.push(`${path}: last-modified meta etiketi eksik veya yanlış.`);
    }
    if (!html.includes(`<meta property="article:modified_time" content="${metadata.modifiedAt}">`)) {
      failures.push(`${path}: article:modified_time eksik veya yanlış.`);
    }

    for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
      try {
        validateStructuredDates(JSON.parse(match[1].trim()), metadata, path, failures);
      } catch (error) {
        failures.push(`${path}: JSON-LD okunamadı: ${error.message}`);
      }
    }
  }

  const reportPath = join(distDir, 'test-raporu', 'index.html');
  await access(reportPath);
  const report = await readFile(reportPath, 'utf8');
  if (!report.includes('Tümü geçti') || !report.includes('7/7')) {
    failures.push('/test-raporu/: başarılı test özeti bulunamadı.');
  }

  const sitemap = await readFile(join(distDir, 'sitemap.xml'), 'utf8');
  for (const match of sitemap.matchAll(/<url>[\s\S]*?<loc>([^<]+)<\/loc>[\s\S]*?<lastmod>([^<]+)<\/lastmod>[\s\S]*?<\/url>/gi)) {
    const url = new URL(match[1]);
    const expected = getPageMetadata(url.pathname).modifiedAt;
    if (match[2] !== expected) failures.push(`${url.pathname}: sitemap lastmod ${match[2]} yerine ${expected} olmalı.`);
  }

  if (failures.length) throw new Error(`Merkezi tarih doğrulaması başarısız:\n${failures.join('\n')}`);
  console.log(`merkezi içerik tarihleri doğrulandı: ${files.length} HTML`);
  return true;
}

const invokedDirectly = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (invokedDirectly) {
  const distDir = new URL('../dist', import.meta.url).pathname;
  await verifyContentDates(distDir);
}
