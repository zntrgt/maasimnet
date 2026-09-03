import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { indexableBlogPosts, blogOutputPath } from '../content/blog-manifest.js';

const dist = join(process.cwd(), 'dist');
const failures = [];
const seenTitles = new Map();
const seenDescriptions = new Map();

const strip = (html) => html
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;/gi, "'")
  .replace(/\s+/g, ' ')
  .trim();

const attr = (html, name, attribute = 'content') => {
  const tag = html.match(new RegExp(`<${name}\\b[^>]*>`, 'i'))?.[0] || '';
  return tag.match(new RegExp(`${attribute}=["']([^"']*)["']`, 'i'))?.[1]?.trim() || '';
};

function metaDescription(html) {
  const tag = html.match(/<meta\b[^>]*name=["']description["'][^>]*>/i)?.[0]
    || html.match(/<meta\b[^>]*content=["'][^"']*["'][^>]*name=["']description["'][^>]*>/i)?.[0]
    || '';
  return tag.match(/content=["']([^"']*)["']/i)?.[1]?.trim() || '';
}

function titleText(html) {
  return strip(html.match(/<title\b[^>]*>[\s\S]*?<\/title>/i)?.[0] || '');
}

function articleHtml(html) {
  return html.match(/<article\b[\s\S]*?<\/article>/i)?.[0] || html.match(/<main\b[\s\S]*?<\/main>/i)?.[0] || html;
}

function jsonLdNodes(html) {
  const nodes = [];
  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(match[1]);
      if (Array.isArray(parsed)) nodes.push(...parsed);
      else if (Array.isArray(parsed?.['@graph'])) nodes.push(...parsed['@graph']);
      else nodes.push(parsed);
    } catch {
      failures.push('geçersiz JSON-LD bulundu');
    }
  }
  return nodes;
}

function hasType(node, type) {
  const value = node?.['@type'];
  return Array.isArray(value) ? value.includes(type) : value === type;
}

for (const post of indexableBlogPosts) {
  const file = join(dist, blogOutputPath(post));
  const html = await readFile(file, 'utf8');
  const article = articleHtml(html);
  const text = strip(article);
  const title = titleText(html);
  const description = metaDescription(html);
  const h1Count = (html.match(/<h1\b/gi) || []).length;
  const canonical = html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i)?.[1] || '';
  const nodes = jsonLdNodes(html);
  const articleNode = nodes.find((node) => hasType(node, 'Article') || hasType(node, 'BlogPosting'));
  const breadcrumbNode = nodes.find((node) => hasType(node, 'BreadcrumbList'));
  const faqNode = nodes.find((node) => hasType(node, 'FAQPage'));
  const firstH1End = article.search(/<\/h1>/i);
  const earlyText = firstH1End >= 0 ? strip(article.slice(firstH1End + 5, firstH1End + 2600)) : '';
  const internalLinks = [...article.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi)]
    .map((match) => match[1])
    .filter((href) => href.startsWith('/') && !href.startsWith('/#') && href !== '/');
  const externalLinks = [...article.matchAll(/<a\b[^>]*href=["']https?:\/\/[^"']+["'][^>]*>/gi)];
  const hasEvidenceLink = externalLinks.length > 0 || /href=["']\/(?:metodoloji|2026-verileri|veriler)\/?["']/i.test(article);
  const imageWithAlt = /<img\b(?=[^>]*\bsrc=["'][^"']+["'])(?=[^>]*\balt=["'][^"']+["'])[^>]*>/i.test(article);
  const ogImage = html.match(/<meta\b[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i)?.[1] || '';
  const hasOriginalValue = /quality-depth|decision-table|<figure\b|content-cta|<table\b/i.test(article);
  const visibleFaqCount = (article.match(/<details\b/gi) || []).length;

  const checks = [
    [title.length >= 25 && title.length <= 75, `title uzunluğu uygun değil (${title.length}/25-75)`],
    [description.length >= 105 && description.length <= 180, `meta description uzunluğu uygun değil (${description.length}/105-180)`],
    [h1Count === 1, `H1 sayısı 1 olmalı (${h1Count})`],
    [canonical.startsWith('https://maasim.net/'), 'canonical eksik veya maasim.net dışında'],
    [earlyText.length >= 140, 'arama niyetine erken ve doğrudan cevap yetersiz'],
    [Boolean(articleNode), 'Article/BlogPosting schema yok'],
    [Boolean(breadcrumbNode), 'BreadcrumbList schema yok'],
    [Boolean(articleNode?.author), 'Article author bilgisi yok'],
    [Boolean(articleNode?.publisher), 'Article publisher bilgisi yok'],
    [Boolean(articleNode?.datePublished), 'Article datePublished yok'],
    [Boolean(articleNode?.dateModified), 'Article dateModified yok'],
    [internalLinks.length >= 1, 'makale içinde anlamlı iç link yok'],
    [hasEvidenceLink, 'kanıt/kaynak veya metodoloji bağlantısı yok'],
    [html.includes('editorial-review'), 'editoryal güven bloğu yok'],
    [Boolean(ogImage), 'og:image yok'],
    [imageWithAlt, 'açıklayıcı alt metinli içerik görseli yok'],
    [hasOriginalValue, 'özgün değer/karşılaştırma/görsel veri katmanı yok']
  ];

  if (faqNode) {
    checks.push([visibleFaqCount >= 1, 'FAQPage schema var ancak görünür SSS içeriği yok']);
    checks.push([Array.isArray(faqNode.mainEntity) && faqNode.mainEntity.length >= 1, 'FAQPage mainEntity boş']);
  }

  for (const [ok, message] of checks) {
    if (!ok) failures.push(`${post.slug}: ${message}`);
  }

  if (title) {
    if (seenTitles.has(title)) failures.push(`${post.slug}: duplicate title (${seenTitles.get(title)})`);
    else seenTitles.set(title, post.slug);
  }
  if (description) {
    if (seenDescriptions.has(description)) failures.push(`${post.slug}: duplicate meta description (${seenDescriptions.get(description)})`);
    else seenDescriptions.set(description, post.slug);
  }
}

if (failures.length) {
  console.error('Blog SEO/GEO kalite kapısı başarısız:\n- ' + failures.join('\n- '));
  process.exit(1);
}

console.log(`Blog SEO/GEO kalite kapısı v2 başarılı: ${indexableBlogPosts.length} içerik; mekanik kelime/H2/tablo/FAQ kotaları uygulanmıyor.`);
