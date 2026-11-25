import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { TRANSPARENCY_ROUTES } from './apply-editorial-transparency.js';
import { EDITORIAL_AUTHORITY } from '../content/editorial-authority.js';
import { SITE_METADATA, getPageMetadata } from '../content/site-metadata.js';
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
  if (article.lastReviewed !== getPageMetadata(`/blog/${post.slug}/`).reviewedAt) failures.push(`${post.slug}: lastReviewed merkezi tarihle eşleşmiyor`);
}

const sitemap=await readFile(join(dist,'sitemap.xml'),'utf8');
const llms=await readFile(join(dist,'llms.txt'),'utf8');
for(const route of ['/editoryal-politika/','/kaynak-politikasi/']){
 const html=await readFile(join(dist,route.slice(1),'index.html'),'utf8');
 const meta=getPageMetadata(route);
 const page=jsonLdNodes(html,route).find(n=>n.url===EDITORIAL_AUTHORITY.site.origin+route&&hasType(n,'WebPage'));
 if(page?.datePublished!==meta.publishedAt||page?.dateModified!==meta.modifiedAt)failures.push(route+': politika tarihleri merkezi kayıtla uyuşmuyor');
 if(!sitemap.includes('<loc>https://maasim.net'+route+'</loc>')||!llms.includes('(https://maasim.net'+route+')'))failures.push(route+': sitemap/llms kaydı eksik');
}
for(const route of TRANSPARENCY_ROUTES){
 const html=await readFile(join(dist,route.replace(/^\/+|\/+$/g,''),'index.html'),'utf8');
 const block=html.match(/<section\b[^>]*data-editorial-transparency="v1"[^>]*>[\s\S]*?<\/section>/i)?.[0]||'';
 const meta=getPageMetadata(route);
 for(const token of ['Hazırlayan','Teknik kontrol','Hukuki / bağımsız uzman kontrolü','İlk yayın','Son güncelleme','Kayıtlı içerik / veri kontrolü','Geçerlilik kapsamı','Hesaplama / veri sürümü','Temel kaynak kayıtları ve değişiklik geçmişi','href="/iletisim/"','datetime="'+meta.publishedAt+'"','datetime="'+meta.modifiedAt+'"','doğrulanmış bağımsız uzman onayı yayımlanmıyor'])if(!block.includes(token))failures.push(route+': A14 şeffaflık alanı eksik: '+token);
 if(meta.reviewedAt&&!block.includes('datetime="'+meta.reviewedAt+'"'))failures.push(route+': kayıtlı kontrol tarihi eksik');
 if(!meta.reviewedAt&&!block.includes('Ayrı kayıt bulunmuyor'))failures.push(route+': bilinmeyen kontrol tarihi belirtilmeli');
}
console.log('A14 şeffaflık kontrolü: '+TRANSPARENCY_ROUTES.length+' sayfa.');

if (failures.length) {
  console.error('Editoryal otorite doğrulaması başarısız:\n- ' + failures.join('\n- '));
  process.exit(1);
}

console.log(`Editoryal otorite doğrulandı: ${authorityPages.length} politika/kurumsal sayfa, ${indexableBlogPosts.length} blog entity bağlantısı.`);
