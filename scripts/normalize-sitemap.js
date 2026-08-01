import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { indexableBlogPosts, blogRoute } from '../content/blog-manifest.js';
import { getPageMetadata, INDEXABLE_STATIC_PATHS } from '../content/site-metadata.js';

const EXPECTED_HOST = 'maasim.net';
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const SITE_ORIGIN = `https://${EXPECTED_HOST}`;

function entryForPath(path) {
  const url = `${SITE_ORIGIN}${path}`;
  const lastmod = getPageMetadata(path).modifiedAt;
  return `  <url>\n    <loc>${url}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`;
}

function addMissingUrls(xml) {
  const existing = new Set(
    [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].trim())
  );
  const requiredPaths = [
    ...indexableBlogPosts.map(blogRoute),
    ...INDEXABLE_STATIC_PATHS
  ];
  const missingEntries = requiredPaths
    .filter((path) => !existing.has(`${SITE_ORIGIN}${path}`))
    .map(entryForPath);

  if (!missingEntries.length) return xml;
  if (!/<\/urlset>\s*$/i.test(xml)) {
    throw new Error('Sitemap urlset kapanış etiketi bulunamadı.');
  }

  return xml.replace(/\s*<\/urlset>\s*$/i, `\n${missingEntries.join('\n')}\n</urlset>`);
}

function normalizeUrlDates(xml) {
  return xml.replace(/<url>([\s\S]*?)<\/url>/gi, (block) => {
    const locMatch = block.match(/<loc>([^<]+)<\/loc>/i);
    if (!locMatch) throw new Error('Sitemap URL bloğunda loc bulunamadı.');
    const url = new URL(locMatch[1].trim());
    const lastmod = getPageMetadata(url.pathname).modifiedAt;

    if (/<lastmod>[^<]*<\/lastmod>/i.test(block)) {
      return block.replace(/<lastmod>[^<]*<\/lastmod>/i, `<lastmod>${lastmod}</lastmod>`);
    }
    return block.replace(/<\/loc>/i, `</loc>\n    <lastmod>${lastmod}</lastmod>`);
  });
}

export async function normalizeSitemap(distDir) {
  const sitemapPath = join(distDir, 'sitemap.xml');
  let xml = await readFile(sitemapPath, 'utf8');

  xml = addMissingUrls(xml);
  xml = normalizeUrlDates(xml);

  // Google ignores changefreq and priority. Keep only canonical URLs and
  // centrally managed, truthful modification dates.
  xml = xml
    .replace(/\s*<changefreq>[^<]*<\/changefreq>/g, '')
    .replace(/\s*<priority>[^<]*<\/priority>/g, '');

  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].trim());
  if (locs.length === 0) throw new Error('Sitemap içinde URL bulunamadı.');

  const seen = new Set();
  for (const loc of locs) {
    let url;
    try {
      url = new URL(loc);
    } catch {
      throw new Error(`Sitemap geçersiz URL içeriyor: ${loc}`);
    }
    if (url.protocol !== 'https:' || url.hostname !== EXPECTED_HOST) {
      throw new Error(`Sitemap yalnızca https://${EXPECTED_HOST} URL'leri içermeli: ${loc}`);
    }
    if (url.search || url.hash) {
      throw new Error(`Sitemap parametre veya fragment içermemeli: ${loc}`);
    }
    if (seen.has(loc)) throw new Error(`Sitemap tekrar eden URL içeriyor: ${loc}`);
    seen.add(loc);
  }

  for (const path of [...indexableBlogPosts.map(blogRoute), ...INDEXABLE_STATIC_PATHS]) {
    const expectedUrl = `${SITE_ORIGIN}${path}`;
    if (!seen.has(expectedUrl)) {
      throw new Error(`Sitemap zorunlu URL'yi içermiyor: ${expectedUrl}`);
    }
  }

  for (const match of xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)) {
    const value = match[1].trim();
    if (!DATE_PATTERN.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
      throw new Error(`Sitemap geçersiz lastmod içeriyor: ${value}`);
    }
  }

  await writeFile(sitemapPath, xml.trimEnd() + '\n');
  console.log(`sitemap normalize edildi: ${locs.length} benzersiz URL`);
  return { urlCount: locs.length };
}
