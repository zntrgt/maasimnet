import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { indexableBlogPosts, blogOutputPath, blogRoute, validateBlogManifest } from '../content/blog-manifest.js';

const decode = (value = '') => value
  .replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>');

const stripTags = (value = '') => decode(value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

function extract(html, pattern, fallback = '') {
  const match = html.match(pattern);
  return match ? stripTags(match[1]) : fallback;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasCardForRoute(html, route) {
  const pattern = new RegExp(`<a\\b(?=[^>]*\\bclass=["'][^"']*\\bcard\\b[^"']*["'])(?=[^>]*\\bhref=["']${escapeRegExp(route)}["'])[^>]*>`, 'i');
  return pattern.test(html);
}

function cardFromArticle(post, html) {
  const route = blogRoute(post);
  const title = extract(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i, post.slug.replaceAll('-', ' '));
  const description = extract(html, /<meta\s+name="description"\s+content="([^"]*)"/i, 'Maaşım.net kaynaklı çalışma hayatı rehberi.');
  const tag = extract(html, /<span[^>]*class="[^"]*tag[^"]*"[^>]*>([\s\S]*?)<\/span>/i, 'Maaş ve Çalışma Hayatı');
  const image = html.match(/<img[^>]+src="(\/assets\/[^"]+)"/i)?.[1] || '/assets/logo.svg';

  return `<a class="card" href="${route}"><img src="${escapeHtml(image)}" width="1200" height="675" loading="lazy" alt="${escapeHtml(title)}"><div><small>${escapeHtml(tag)}</small><h2>${escapeHtml(title)}</h2><p>${escapeHtml(description)}</p></div></a>`;
}

export async function ensureBlogIndex(dist) {
  validateBlogManifest();
  const indexPath = join(dist, 'blog', 'index.html');
  let index = await readFile(indexPath, 'utf8');
  const missingCards = [];

  for (const post of indexableBlogPosts) {
    const route = blogRoute(post);
    if (hasCardForRoute(index, route)) continue;
    const articleHtml = await readFile(join(dist, blogOutputPath(post)), 'utf8');
    missingCards.push(cardFromArticle(post, articleHtml));
  }

  if (!missingCards.length) {
    console.log('blog index manifest ile zaten tam eşleşiyor');
    return;
  }

  const marker = /<(section|div)\s+class="cards"[^>]*>/i;
  if (!marker.test(index)) {
    throw new Error('Blog kart kapsayıcısı bulunamadı; manifest kartları indexe eklenemedi.');
  }

  index = index.replace(marker, (match) => `${match}${missingCards.join('')}`);
  await writeFile(indexPath, index);
  console.log(`blog index tamamlandı: ${missingCards.length} eksik manifest kartı otomatik eklendi`);
}
