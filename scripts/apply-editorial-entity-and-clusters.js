import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  blogClusters,
  indexableBlogPosts,
  blogOutputPath,
  blogRoute,
  postsInCluster
} from '../content/blog-manifest.js';
import { EDITORIAL_AUTHORITY, editorialTeamSchema } from '../content/editorial-authority.js';
import { SITE_METADATA } from '../content/site-metadata.js';

const esc = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

function relatedPosts(post) {
  const clusterPosts = postsInCluster(post.cluster);
  const start = clusterPosts.findIndex((item) => item.slug === post.slug);
  if (start < 0) return [];
  const related = [];
  for (let offset = 1; offset < clusterPosts.length && related.length < 3; offset += 1) {
    related.push(clusterPosts[(start + offset) % clusterPosts.length]);
  }
  return related;
}

function editorialByline() {
  return `<p class="editorial-byline" aria-label="Yazarlık ve editoryal politika"><strong>Yazar:</strong> <a href="${EDITORIAL_AUTHORITY.paths.editorialPolicy}">${esc(EDITORIAL_AUTHORITY.editorialTeam.name)}</a><span aria-hidden="true"> · </span><a href="${EDITORIAL_AUTHORITY.paths.sourcePolicy}">Kaynak politikası</a><span aria-hidden="true"> · </span><a href="${EDITORIAL_AUTHORITY.paths.methodology}">Metodoloji</a></p>`;
}

function clusterSection(post) {
  const cluster = blogClusters[post.cluster];
  const related = relatedPosts(post);
  const links = related.map((item) => `<a class="topic-cluster__link" href="${blogRoute(item)}"><span>${esc(item.title)}</span><small>İlgili rehber →</small></a>`).join('');
  return `<section class="topic-cluster" data-topic-cluster="${esc(post.cluster)}" aria-labelledby="topic-cluster-${esc(post.slug)}"><div class="topic-cluster__head"><div><p class="topic-cluster__eyebrow">Konu kümesi</p><h2 id="topic-cluster-${esc(post.slug)}">${esc(cluster.title)}</h2><p>${esc(cluster.description)}</p></div><a class="topic-cluster__tool" href="${esc(cluster.toolHref)}">${esc(cluster.toolLabel)} →</a></div><nav class="topic-cluster__links" aria-label="${esc(cluster.title)} bağlantılı içerikler">${links}</nav></section>`;
}

function insertByline(html) {
  if (html.includes('class="editorial-byline"')) return html;
  if (!/<h1\b[^>]*>[\s\S]*?<\/h1>/i.test(html)) throw new Error('Blog H1 bulunamadı; editoryal byline eklenemedi.');
  return html.replace(/(<h1\b[^>]*>[\s\S]*?<\/h1>)/i, `$1${editorialByline()}`);
}

function insertCluster(html, post) {
  if (html.includes(`data-topic-cluster="${post.cluster}"`)) return html;
  const section = clusterSection(post);
  if (/<section\s+class="faq"[^>]*>/i.test(html)) {
    return html.replace(/<section\s+class="faq"[^>]*>/i, (match) => `${section}${match}`);
  }
  if (/<h2\b[^>]*id="sss"[^>]*>/i.test(html)) {
    return html.replace(/<h2\b[^>]*id="sss"[^>]*>/i, (match) => `${section}${match}`);
  }
  if (/<h2\b[^>]*id="kaynakca"[^>]*>/i.test(html)) {
    return html.replace(/<h2\b[^>]*id="kaynakca"[^>]*>/i, (match) => `${section}${match}`);
  }
  if (/<\/article>/i.test(html)) return html.replace(/<\/article>/i, `${section}</article>`);
  throw new Error(`Konu kümesi için bağlantı noktası bulunamadı: ${post.slug}`);
}

function patchSchema(html, post) {
  const cluster = blogClusters[post.cluster];
  return html.replace(/<script\b([^>]*)type=["']application\/ld\+json["']([^>]*)>([\s\S]*?)<\/script>/gi, (full, before, after, json) => {
    let parsed;
    try { parsed = JSON.parse(json); } catch { return full; }
    const nodes = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.['@graph'])
        ? parsed['@graph']
        : [parsed];
    const article = nodes.find((node) => {
      const type = node?.['@type'];
      return type === 'Article' || type === 'BlogPosting' || (Array.isArray(type) && (type.includes('Article') || type.includes('BlogPosting')));
    });
    if (!article) return full;

    article.author = editorialTeamSchema();
    article.reviewedBy = editorialTeamSchema();
    article.publisher = { '@id': EDITORIAL_AUTHORITY.site.organizationId };
    article.lastReviewed = SITE_METADATA.blogReviewedAt;
    article.about = [
      { '@type': 'Thing', name: cluster.title },
      { '@type': 'Thing', name: 'Türkiye çalışma hayatı' }
    ];

    const output = Array.isArray(parsed)
      ? nodes
      : Array.isArray(parsed?.['@graph'])
        ? { ...parsed, '@graph': nodes }
        : nodes[0];
    return `<script${before}type="application/ld+json"${after}>${JSON.stringify(output)}</script>`;
  });
}

function indexClusterHub() {
  const cards = Object.entries(blogClusters).map(([key, cluster]) => {
    const posts = postsInCluster(key).slice(0, 4);
    const links = posts.map((post) => `<a href="${blogRoute(post)}">${esc(post.title)}</a>`).join('');
    return `<article class="blog-cluster-card" data-blog-cluster="${esc(key)}"><h2>${esc(cluster.title)}</h2><p>${esc(cluster.description)}</p><nav aria-label="${esc(cluster.title)} öne çıkan içerikler">${links}</nav><a class="blog-cluster-card__tool" href="${esc(cluster.toolHref)}">${esc(cluster.toolLabel)} →</a></article>`;
  }).join('');
  return `<section class="blog-cluster-hubs" aria-labelledby="blog-cluster-hubs-title"><div class="blog-cluster-hubs__head"><span>Konu kümeleri</span><h2 id="blog-cluster-hubs-title">Maaş ve çalışma hayatını konu bazında keşfet</h2><p>Tekil yazılar yerine aynı karar problemini açıklayan bağlantılı rehberler ve araçlarla ilerleyin.</p></div><div class="blog-cluster-hubs__grid">${cards}</div></section>`;
}

function insertIndexClusters(html) {
  if (html.includes('class="blog-cluster-hubs"')) return html;
  const marker = /<(section|div)\s+class="cards"[^>]*>/i;
  if (!marker.test(html)) throw new Error('Blog index kart alanı bulunamadı; konu kümeleri eklenemedi.');
  return html.replace(marker, (match) => `${indexClusterHub()}${match}`);
}

const cssMarker = '/* editorial-entity-topic-clusters */';
const css = `
${cssMarker}
.editorial-byline{margin:10px 0 24px;color:#64748b;font-size:13px;line-height:1.55}.editorial-byline strong{color:#334155}.editorial-byline a{color:#0f766e;font-weight:750;text-decoration:none}.editorial-byline a:hover{text-decoration:underline}.topic-cluster{margin:42px 0 30px;padding:24px;border:1px solid #dbe4ee;border-radius:22px;background:#f8fafc}.topic-cluster__head{display:flex;align-items:flex-start;justify-content:space-between;gap:22px}.topic-cluster__eyebrow{margin:0 0 5px!important;color:#0f766e!important;font-size:11px!important;font-weight:900;text-transform:uppercase;letter-spacing:.08em}.topic-cluster h2{margin:0 0 7px!important;font-size:25px!important}.topic-cluster__head p{max-width:680px;margin:0!important;color:#475569!important;font-size:14px!important}.topic-cluster__tool{flex:none;padding:10px 13px;border-radius:11px;background:#0f2747;color:#fff!important;text-decoration:none;font-size:13px;font-weight:900}.topic-cluster__links{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:18px}.topic-cluster__link{display:flex;min-width:0;flex-direction:column;justify-content:space-between;gap:10px;padding:14px;border:1px solid #dbe4ee;border-radius:14px;background:#fff;color:#0f2747!important;text-decoration:none!important;font-weight:800;line-height:1.4}.topic-cluster__link small{color:#0f766e;font-size:11px}.blog-cluster-hubs{margin:8px 0 30px}.blog-cluster-hubs__head{max-width:760px;margin-bottom:18px}.blog-cluster-hubs__head>span{color:#0f766e;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.08em}.blog-cluster-hubs__head h2{margin:6px 0 7px;font-size:26px}.blog-cluster-hubs__head p{margin:0;color:#64748b}.blog-cluster-hubs__grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.blog-cluster-card{padding:18px;border:1px solid #dbe4ee;border-radius:18px;background:#fff}.blog-cluster-card h2{margin:0 0 8px;font-size:18px}.blog-cluster-card p{min-height:66px;margin:0 0 12px;color:#64748b;font-size:13px;line-height:1.55}.blog-cluster-card nav{display:grid;gap:7px}.blog-cluster-card nav a{color:#334155;text-decoration:none;font-size:12px;font-weight:750;line-height:1.4}.blog-cluster-card nav a:hover{color:#0f766e}.blog-cluster-card__tool{display:inline-block;margin-top:14px;color:#0f766e;text-decoration:none;font-size:12px;font-weight:900}@media(max-width:820px){.topic-cluster__head{flex-direction:column}.topic-cluster__links,.blog-cluster-hubs__grid{grid-template-columns:1fr}.blog-cluster-card p{min-height:0}}`;

export async function applyEditorialEntityAndClusters(dist) {
  for (const post of indexableBlogPosts) {
    const path = join(dist, blogOutputPath(post));
    let html = await readFile(path, 'utf8');
    html = insertByline(html);
    html = insertCluster(html, post);
    html = patchSchema(html, post);
    await writeFile(path, html);
  }

  const indexPath = join(dist, 'blog', 'index.html');
  let indexHtml = await readFile(indexPath, 'utf8');
  indexHtml = insertIndexClusters(indexHtml);
  await writeFile(indexPath, indexHtml);

  const cssPath = join(dist, 'assets', 'blog.css');
  let blogCss = await readFile(cssPath, 'utf8');
  if (!blogCss.includes(cssMarker)) {
    blogCss += `\n${css}\n`;
    await writeFile(cssPath, blogCss);
  }

  console.log(`Editoryal entity ve konu kümeleri uygulandı: ${indexableBlogPosts.length} blog, ${Object.keys(blogClusters).length} küme.`);
  return { blogs: indexableBlogPosts.length, clusters: Object.keys(blogClusters).length };
}
