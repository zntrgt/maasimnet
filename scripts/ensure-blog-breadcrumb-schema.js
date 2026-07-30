import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  indexableBlogPosts,
  blogOutputPath,
  blogRoute,
  validateBlogManifest
} from '../content/blog-manifest.js';

const SITE = 'https://maasim.net';

function breadcrumbFor(post, title) {
  const route = blogRoute(post);
  return {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/blog/` },
      { '@type': 'ListItem', position: 3, name: title, item: `${SITE}${route}` }
    ]
  };
}

function extractTitle(html, fallback) {
  const match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!match) return fallback;
  return match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || fallback;
}

function ensureSchema(html, post) {
  const pattern = /<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/i;
  const match = html.match(pattern);
  if (!match) {
    throw new Error(`JSON-LD bulunamadı: ${blogRoute(post)}`);
  }

  let data;
  try {
    data = JSON.parse(match[1]);
  } catch (error) {
    throw new Error(`JSON-LD parse edilemedi (${blogRoute(post)}): ${error.message}`);
  }

  const graph = Array.isArray(data?.['@graph']) ? data['@graph'] : null;
  if (!graph) {
    throw new Error(`JSON-LD @graph eksik: ${blogRoute(post)}`);
  }
  if (graph.some((node) => node?.['@type'] === 'BreadcrumbList')) {
    return { html, changed: false };
  }

  const title = extractTitle(html, post.slug.replaceAll('-', ' '));
  graph.push(breadcrumbFor(post, title));
  const replacement = `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
  return { html: html.replace(pattern, replacement), changed: true };
}

export async function ensureBlogBreadcrumbSchema(dist) {
  validateBlogManifest();
  let changed = 0;

  for (const post of indexableBlogPosts) {
    const path = join(dist, blogOutputPath(post));
    const html = await readFile(path, 'utf8');
    const result = ensureSchema(html, post);
    if (!result.changed) continue;
    await writeFile(path, result.html);
    changed += 1;
  }

  console.log(`blog breadcrumb schema kontrolü tamamlandı: ${changed} sayfaya BreadcrumbList eklendi`);
}
