import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { EDITORIAL_AUTHORITY } from '../content/editorial-authority.js';
import { SITE_METADATA } from '../content/site-metadata.js';
import { indexableBlogPosts, blogOutputPath } from '../content/blog-manifest.js';

const dist = join(process.cwd(), 'dist');
const failures = [];

function jsonLdNodes(html, label) {
  const nodes = [];
  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(match[1]);
      if (Array.isArray(parsed)) nodes.push(...parsed);
      else if (Array.isArray(parsed?.['@graph'])) nodes.push(...parsed['@graph']);
      else nodes.push(parsed);
    } catch {
      failures.push(`${label}: geçersiz JSON-LD`);
    }
  }
  return nodes;
}

function hasType(node, type) {
  const current = node?.['@type'];
  return Array.isArray(current) ? current.includes(type) : current === type;
}

const authorityPages = [
  ['/hakkimizda/', 'AboutPage'],
  ['/editoryal-politika/', 'WebPage'],
  ['/kaynak-politikasi/', 'WebPage']
];

for (const [route, pageType] of authorityPages) {
  const html = await readFile(join(dist, route.replace(/^\/+|\/+$/g, ''), 'index.html'), 'utf8');
  const nodes = jsonLdNodes(html, route);
  const organization = nodes.find((node) => hasType(node, 'Organization') && node['@id'] === EDITORIAL_AUTHORITY.site.organizationId);
  const page = nodes.find((node) => hasType(node, pageType) && node.url === `${EDITORIAL_AUTHORITY.site.origin}${route}`);
  const canonical = html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1] || '';

  if (!organization) failures.push(`${route}: merkezi Maaşım.net Organization entity yok`);
  if (!page) failures.push(`${route}: ${pageType} schema yok`);
  if (canonical !== `${EDITORIAL_AUTHORITY.site.origin}${route}`) failures.push(`${route}: canonical yanlış (${canonical})`);
  if (!html.includes('/editoryal-politika/') && route !== '/editoryal-politika/') failures.push(`${route}: editoryal politika iç linki yok`);
  if (!html.includes('/kaynak-politikasi/') && route !== '/kaynak-politikasi/') failures.push(`${route}: kaynak politikası iç linki yok`);
  if (!html.includes('/hesaplama-metodolojisi/')) failures.push(`${route}: metodoloji iç linki yok`);
}

for (const post of indexableBlogPosts) {
  const html = await readFile(join(dist, blogOutputPath(post)), 'utf8');
  const nodes = jsonLdNodes(html, post.slug);
  const article = nodes.find((node) => hasType(node, 'Article') || hasType(node, 'BlogPosting'));

  if (!html.includes('class="editorial-byline"')) failures.push(`${post.slug}: görünür editoryal byline yok`);
  if (!html.includes('href="/editoryal-politika/"')) failures.push(`${post.slug}: editoryal politika linki yok`);
  if (!html.includes('href="/kaynak-politikasi/"')) failures.push(`${post.slug}: kaynak politikası linki yok`);

  if (!article) {
    failures.push(`${post.slug}: Article/BlogPosting schema bulunamadı`);
    continue;
  }

  if (article.author?.['@type'] !== 'Organization') failures.push(`${post.slug}: author Organization değil`);
  if (article.author?.name !== EDITORIAL_AUTHORITY.editorialTeam.name) failures.push(`${post.slug}: author adı merkezi entity ile eşleşmiyor`);
  if (article.author?.url !== EDITORIAL_AUTHORITY.editorialTeam.url) failures.push(`${post.slug}: author.url editoryal politika entity'sine gitmiyor`);
  if (article.reviewedBy?.url !== EDITORIAL_AUTHORITY.editorialTeam.url) failures.push(`${post.slug}: reviewedBy merkezi editoryal entity ile eşleşmiyor`);
  if (article.publisher?.['@id'] !== EDITORIAL_AUTHORITY.site.organizationId) failures.push(`${post.slug}: publisher merkezi Organization @id kullanmıyor`);
  if (article.lastReviewed !== SITE_METADATA.blogReviewedAt) failures.push(`${post.slug}: lastReviewed merkezi tarihle eşleşmiyor`);
}

if (failures.length) {
  console.error('Editoryal otorite doğrulaması başarısız:\n- ' + failures.join('\n- '));
  process.exit(1);
}

console.log(`Editoryal otorite doğrulandı: ${authorityPages.length} politika/kurumsal sayfa, ${indexableBlogPosts.length} blog entity bağlantısı.`);
