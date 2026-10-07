import { access, readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  indexableBlogPosts,
  discoverableBlogPosts,
  hiddenBlogPosts,
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

for (const post of discoverableBlogPosts) {
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

for (const post of hiddenBlogPosts) {
  const route = blogRoute(post);
  const html = await readFile(join(dist, blogOutputPath(post)), 'utf8');
  if (blogIndex.includes(`href="${route}"`)) throw new Error(`Gizli rehber blog merkezinde: ${route}`);
  if (sitemap.includes(`<loc>https://maasim.net${route}</loc>`)) throw new Error(`Gizli rehber sitemap içinde: ${route}`);
  if (!/<meta name="robots" content="noindex,follow">/i.test(html)) throw new Error(`Gizli rehber noindex,follow değil: ${route}`);
}
if (indexableBlogPosts.length !== 119 || discoverableBlogPosts.length !== 24 || hiddenBlogPosts.length !== 95) {
  throw new Error(`Blog manifest sayıları beklenenden farklı: ${indexableBlogPosts.length} içerik (${discoverableBlogPosts.length} keşfedilebilir, ${hiddenBlogPosts.length} noindex)`);
}
const orphanSlugs = [...generatedBlogSlugs].filter((slug) => !expectedSlugs.has(slug));
if (orphanSlugs.length) {
  throw new Error(`Manifest dışında yetim blog çıktısı bulundu: ${orphanSlugs.join(', ')}`);
}

console.log(`Blog manifest doğrulaması başarılı: ${indexableBlogPosts.length} içerik (${discoverableBlogPosts.length} keşfedilebilir, ${hiddenBlogPosts.length} noindex), dosya/index/sitemap/canonical/schema eşleşiyor.`);
