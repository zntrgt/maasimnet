import { access, readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  indexableBlogPosts,
  blogOutputPath,
  blogRoute,
  validateBlogManifest
} from '../content/blog-manifest.js';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, 'dist');
const blogDir = join(dist, 'blog');

validateBlogManifest();

const blogIndex = await readFile(join(blogDir, 'index.html'), 'utf8');
const sitemap = await readFile(join(dist, 'sitemap.xml'), 'utf8');
const expectedSlugs = new Set(indexableBlogPosts.map((post) => post.slug));

for (const post of indexableBlogPosts) {
  const outputPath = join(dist, blogOutputPath(post));
  await access(outputPath);
  const html = await readFile(outputPath, 'utf8');
  const route = blogRoute(post);

  if (!blogIndex.includes(`href="${route}"`)) {
    throw new Error(`Blog merkezinde eksik içerik bağlantısı: ${route}`);
  }
  if (!sitemap.includes(`<loc>https://maasim.net${route}</loc>`)) {
    throw new Error(`Sitemap içinde eksik blog URL'si: ${route}`);
  }
  if (!html.includes(`<link rel="canonical" href="https://maasim.net${route}">`)) {
    throw new Error(`Self-canonical eksik veya hatalı: ${route}`);
  }
  for (const schema of ['"@type":"Article"', '"@type":"FAQPage"', '"@type":"BreadcrumbList"']) {
    if (!html.includes(schema)) {
      throw new Error(`Schema eksik (${schema}): ${route}`);
    }
  }
}

const generatedBlogSlugs = new Set();
for (const entry of await readdir(blogDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  try {
    await access(join(blogDir, entry.name, 'index.html'));
    generatedBlogSlugs.add(entry.name);
  } catch {
    // HTML üretmeyen yardımcı klasörleri yok say.
  }
}

const orphanSlugs = [...generatedBlogSlugs].filter((slug) => !expectedSlugs.has(slug));
if (orphanSlugs.length) {
  throw new Error(`Manifest dışında yetim blog çıktısı bulundu: ${orphanSlugs.join(', ')}`);
}

console.log(`Blog manifest doğrulaması başarılı: ${indexableBlogPosts.length} içerik, duplicate slug yok, dosya/index/sitemap/canonical/schema eşleşiyor.`);
