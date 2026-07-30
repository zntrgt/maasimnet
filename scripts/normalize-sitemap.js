import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { indexableBlogPosts, blogRoute } from '../content/blog-manifest.js';

const EXPECTED_HOST = 'maasim.net';
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const SITE_ORIGIN = `https://${EXPECTED_HOST}`;

function addMissingManifestUrls(xml) {
  const existing = new Set(
    [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].trim())
  );
  const lastmod = new Date().toISOString().slice(0, 10);
  const missingEntries = indexableBlogPosts
    .map((post) => `${SITE_ORIGIN}${blogRoute(post)}`)
    .filter((url) => !existing.has(url))
    .map((url) => `  <url>\n    <loc>${url}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`);

  if (!missingEntries.length) return xml;
  if (!/<\/urlset>\s*$/i.test(xml)) {
    throw new Error('Sitemap urlset kapanış etiketi bulunamadı.');
  }

  return xml.replace(/\s*<\/urlset>\s*$/i, `\n${missingEntries.join('\n')}\n</urlset>`);
}

export async function normalizeSitemap(distDir) {
  const sitemapPath = join(distDir, 'sitemap.xml');
  let xml = await readFile(sitemapPath, 'utf8');

  // Blog manifesti tek kaynak olarak kullanılır. Yeni bir indexlenebilir blog
  // eklendiğinde statik sitemap güncellenmemiş olsa bile build çıktısına girer.
  xml = addMissingManifestUrls(xml);

  // Google ignores changefreq and priority. Keep the sitemap focused on
  // canonical URLs and truthful last modification dates.
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

  for (const post of indexableBlogPosts) {
    const expectedUrl = `${SITE_ORIGIN}${blogRoute(post)}`;
    if (!seen.has(expectedUrl)) {
      throw new Error(`Sitemap manifest blog URL'sini içermiyor: ${expectedUrl}`);
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
