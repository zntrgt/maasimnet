import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { blogImageAssignments } from './apply-blog-images.js';

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceAttribute(tag, name, value) {
  const pattern = new RegExp(`\\b${name}\\s*=\\s*(["'])[^"']*\\1`, 'i');
  if (pattern.test(tag)) return tag.replace(pattern, `${name}="${value}"`);
  return tag.replace(/\s*\/?>$/, (ending) => ` ${name}="${value}"${ending}`);
}

function findCard(html, route) {
  const cardPattern = /<a\b[^>]*class=["'][^"']*\bcard\b[^"']*["'][^>]*>[\s\S]*?<\/a>/gi;
  const hrefPattern = new RegExp(`\\bhref\\s*=\\s*(["'])${escapeRegExp(route)}\\1`, 'i');
  for (const match of html.matchAll(cardPattern)) {
    if (hrefPattern.test(match[0])) return match;
  }
  return null;
}

export async function normalizeBlogIndexImages(dist) {
  const indexPath = join(dist, 'blog', 'index.html');
  let html = await readFile(indexPath, 'utf8');

  for (const post of blogImageAssignments) {
    const route = `/blog/${post.slug}/`;
    const match = findCard(html, route);
    if (!match || match.index == null) throw new Error(`Gerçek blog kartı bulunamadı: ${post.slug}`);

    const card = match[0];
    const image = card.match(/<img\b[^>]*>/i)?.[0];
    if (!image) throw new Error(`Blog kartında görsel bulunamadı: ${post.slug}`);

    let normalizedImage = image;
    normalizedImage = replaceAttribute(normalizedImage, 'src', `/assets/${post.asset}`);
    normalizedImage = replaceAttribute(normalizedImage, 'alt', post.alt);
    normalizedImage = replaceAttribute(normalizedImage, 'width', '480');
    normalizedImage = replaceAttribute(normalizedImage, 'height', '270');
    normalizedImage = replaceAttribute(normalizedImage, 'loading', 'lazy');
    normalizedImage = replaceAttribute(normalizedImage, 'decoding', 'async');

    const normalizedCard = card.replace(image, normalizedImage);
    html = html.slice(0, match.index) + normalizedCard + html.slice(match.index + card.length);
  }

  for (const post of blogImageAssignments) {
    const route = `/blog/${post.slug}/`;
    const match = findCard(html, route);
    if (!match?.[0].includes(`/assets/${post.asset}`)) {
      throw new Error(`Blog kartı editoryal görsel eşleşmesi doğrulanamadı: ${post.slug}`);
    }
  }

  await writeFile(indexPath, html);
  console.log(`Blog index kart görselleri gerçek .card öğeleri üzerinde normalize edildi: ${blogImageAssignments.length}/${blogImageAssignments.length}`);
}
