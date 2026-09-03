import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { indexableBlogPosts, blogOutputPath } from '../content/blog-manifest.js';

const dist = join(process.cwd(), 'dist');
const failures = [];
const seenTitles = new Map();
const seenDescriptions = new Map();

const originalDataSlugs = new Set([
  '2026-maas-vergi-dilimleri',
  'netten-brute-maas-neden-aylik-degisir',
  '100000-tl-brut-maas-neti-2026',
  'prim-ikramiye-net-maasi-neden-dusurur',
  'is-teklifinin-yillik-degeri'
]);

const editorialImages = new Map([
  ['is-yerinde-finansal-saglik', 'is-yerinde-finansal-saglik-editorial.webp'],
  ['2027-maas-zammi-beklentileri', '2027-maas-zammi-beklentileri-editorial.webp'],
  ['maas-zam-gorusmesi-nasil-yapilir', 'maas-zam-gorusmesi-editorial.webp'],
  ['is-teklifinin-yillik-degeri', 'is-teklifinin-yillik-degeri-editorial.webp'],
  ['isveren-katkili-bes', 'isveren-katkili-bes-editorial.webp'],
  ['esnek-yan-hak-butcesi', 'esnek-yan-hak-butcesi-editorial.webp'],
  ['is-degisikliginde-vergi-matrahi', 'is-degisikliginde-vergi-matrahi-editorial.webp'],
  ['2026-maas-vergi-dilimleri', '2026-maas-vergi-dilimleri-editorial.webp'],
  ['netten-brute-maas-neden-aylik-degisir', 'netten-brute-maas-neden-aylik-degisir-editorial.webp'],
  ['maas-hesaplama-siteleri-neden-farkli', 'maas-hesaplama-siteleri-neden-farkli-editorial.webp']
]);

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

function jsonLdNodes(html, slug) {
  const nodes = [];
  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(match[1]);
      if (Array.isArray(parsed)) nodes.push(...parsed);
      else if (Array.isArray(parsed?.['@graph'])) nodes.push(...parsed['@graph']);
      else nodes.push(parsed);
    } catch {
      failures.push(`${slug}: geçersiz JSON-LD bulundu`);
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
  const title = titleText(html);
  const description = metaDescription(html);
  const h1Count = (html.match(/<h1\b/gi) || []).length;
  const canonical = html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i)?.[1] || '';
  const nodes = jsonLdNodes(html, post.slug);
  const articleNode = nodes.find((node) => hasType(node, 'Article') || hasType(node, 'BlogPosting'));
  const breadcrumbNode = nodes.find((node) => hasType(node, 'BreadcrumbList'));
  const faqNode = nodes.find((node) => hasType(node, 'FAQPage'));
  const firstH1End = article.search(/<\/h1>/i);
  const earlyText = firstH1End >= 0 ? strip(article.slice(firstH1End + 5, firstH1End + 2600)) : '';
  const internalLinks = [...article.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi)]
    .map((match) => match[1])
    .filter((href) => href.startsWith('/') && !href.startsWith('/#') && href !== '/');
  const externalLinks = [...article.matchAll(/<a\b[^>]*href=["']https?:\/\/[^"']+["'][^>]*>/gi)];
  const hasEvidenceLink = externalLinks.length > 0 || /href=["']\/(?:metodoloji|hesaplama-metodolojisi|2026-verileri|veriler)\/?["']/i.test(article);
  const imageWithAlt = /<img\b(?=[^>]*\bsrc=["'][^"']+["'])(?=[^>]*\balt=["'][^"']+["'])[^>]*>/i.test(article);
  const ogImage = html.match(/<meta\b[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i)?.[1] || '';
  const hasOriginalValue = /maasim-original-data|quality-depth|decision-table|<figure\b|content-cta|<table\b/i.test(article);
  const visibleFaqCount = (article.match(/<details\b/gi) || []).length;

  const checks = [
    [title.length >= 20 && title.length <= 90, `title okunabilir aralıkta değil (${title.length}/20-90)`],
    [description.length >= 105 && description.length <= 190, `meta description uzunluğu uygun değil (${description.length}/105-190)`],
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

  if (originalDataSlugs.has(post.slug)) {
    checks.push([html.includes('class="maasim-original-data"'), 'yüksek niyetli içerikte Maaşım.net özgün hesaplama bloğu yok']);
    checks.push([html.includes('class="original-data-method"'), 'özgün hesaplama metodoloji notu yok']);
    checks.push([html.includes('href="/hesaplama-metodolojisi/"'), 'özgün hesaplama metodoloji bağlantısı yok']);
  }

  if (editorialImages.has(post.slug)) {
    const asset = editorialImages.get(post.slug);
    checks.push([html.includes(`/assets/${asset}`), `konuya özel editoryal görsel kullanılmıyor (${asset})`]);
    checks.push([ogImage.endsWith(`/assets/${asset}`), `og:image konuya özel editoryal görselle eşleşmiyor (${asset})`]);
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

const blogIndex = await readFile(join(dist, 'blog', 'index.html'), 'utf8');
for (const [slug, asset] of editorialImages) {
  const routePos = blogIndex.indexOf(`href="/blog/${slug}/"`);
  const assetPos = blogIndex.indexOf(`/assets/${asset}`, routePos);
  if (routePos < 0 || assetPos < 0 || assetPos - routePos > 1600) {
    failures.push(`${slug}: blog kartında konuya özel editoryal görsel yok (${asset})`);
  }
}

if (failures.length) {
  console.error('Blog SEO/GEO kalite kapısı başarısız:\n- ' + failures.join('\n- '));
  process.exit(1);
}

console.log(`Blog SEO/GEO kalite kapısı v2 başarılı: ${indexableBlogPosts.length} içerik; ${originalDataSlugs.size} yüksek niyetli blogda özgün hesaplama, ${editorialImages.size} blogda konuya özel görsel doğrulandı.`);
