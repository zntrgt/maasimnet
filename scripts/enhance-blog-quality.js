import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { indexableBlogPosts, blogOutputPath, blogRoute } from '../content/blog-manifest.js';
import { blogQualityContent } from '../content/blog-quality-content.js';
import { negotiationBlogQualityContent } from '../content/blog-quality-content-negotiation.js';

const esc = (v='') => String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const dist = join(process.cwd(), 'dist');
const relatedPool = indexableBlogPosts.map(blogRoute);
const qualityContent = Object.freeze({ ...blogQualityContent, ...negotiationBlogQualityContent });

function relatedLinks(slug) {
  const preferred = relatedPool.filter((route) => !route.includes(`/${slug}/`)).slice(0, 3);
  return preferred.map((route, i) => `<a href="${route}">${['İlgili maaş ve vergi rehberi','İlgili çalışan yan hakları rehberi','Hesaplama ve karar rehberi'][i]}</a>`).join(' · ');
}

function hasDepthContent(cfg) {
  return Boolean(
    cfg.decisionTitle || cfg.intro || cfg.mistakes || cfg.cta ||
    (Array.isArray(cfg.rows) && cfg.rows.length) ||
    (Array.isArray(cfg.checklist) && cfg.checklist.length)
  );
}

function depthSection(post, cfg) {
  if (!hasDepthContent(cfg)) return '';

  const rows = Array.isArray(cfg.rows) ? cfg.rows : [];
  const checklist = Array.isArray(cfg.checklist) ? cfg.checklist : [];
  const table = rows.length
    ? `<div class="table-scroll"><table class="table decision-table"><thead><tr><th>Başlık</th><th>Ne anlatır?</th><th>Karar etkisi</th><th>Kontrol</th></tr></thead><tbody>${rows.map(([a,b,c,d]) => `<tr><td><strong>${esc(a)}</strong></td><td>${esc(b)}</td><td>${esc(c)}</td><td>${esc(d)}</td></tr>`).join('')}</tbody></table></div>`
    : '';
  const checklistBlock = checklist.length
    ? `<h2>Uygulama kontrol listesi</h2><ol class="action-checklist">${checklist.map((item) => `<li>${esc(item)}</li>`).join('')}</ol>`
    : '';
  const mistake = cfg.mistakes ? `<div class="note"><b>Sık yapılan hata:</b> ${esc(cfg.mistakes)}</div>` : '';
  const cta = Array.isArray(cfg.cta) && cfg.cta.length >= 3
    ? `<div class="content-cta"><div><strong>${esc(cfg.cta[1])}</strong><p>${esc(cfg.cta[2])}</p></div><a href="${esc(cfg.cta[0])}">Devam et</a></div>`
    : '';
  const heading = cfg.decisionTitle ? `<h2 id="quality-depth-${post.slug}">${esc(cfg.decisionTitle)}</h2>` : '';
  const intro = cfg.intro ? `<p>${esc(cfg.intro)}</p>` : '';

  return `<section class="quality-depth" aria-label="Karar ve uygulama desteği">${heading}${intro}${table}${checklistBlock}${mistake}${cta}<p class="context-links"><strong>Bağlantılı okumalar:</strong> ${relatedLinks(post.slug)}</p></section>`;
}

function insertDepthSection(html, post, cfg) {
  if (!hasDepthContent(cfg) || html.includes(`quality-depth-${post.slug}`)) return html;
  const depth = depthSection(post, cfg);
  if (/<section\s+class="faq"[^>]*>/i.test(html)) {
    return html.replace(/<section\s+class="faq"[^>]*>/i, (match) => `${depth}${match}`);
  }
  if (/<h2\b[^>]*id="sss"[^>]*>/i.test(html)) {
    return html.replace(/<h2\b[^>]*id="sss"[^>]*>/i, (match) => `${depth}${match}`);
  }
  if (/<h2\b[^>]*id="kaynakca"[^>]*>/i.test(html)) {
    return html.replace(/(<h2\b[^>]*id="kaynakca"[^>]*>)/i, `${depth}$1`);
  }
  if (/<\/article>/i.test(html)) return html.replace(/<\/article>/i, `${depth}</article>`);
  throw new Error(`Blog kalite bölümü için bağlantı noktası bulunamadı: ${post.slug}`);
}

function addVisibleFaq(html, cfg) {
  const extraFaq = Array.isArray(cfg.extraFaq) ? cfg.extraFaq : [];
  if (!extraFaq.length) return html;
  const details = extraFaq.map(([q,a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('');
  if (/<section\s+class="faq"[^>]*>/i.test(html)) {
    return html.replace(/(<section\s+class="faq"[^>]*>[\s\S]*?)(<\/section>)/i, `$1${details}$2`);
  }
  if (/<h2\b[^>]*id="sss"[^>]*>/i.test(html)) {
    return html.replace(/(<h2\b[^>]*id="sss"[^>]*>[\s\S]*?)(?=<h2\b|<\/article>)/i, `$1${details}`);
  }
  return html;
}

function addSources(html, cfg) {
  const sources = Array.isArray(cfg.sources) ? cfg.sources : [];
  if (!sources.length) return html;
  const items = sources.map(([href,label]) => `<li><a href="${esc(href)}" rel="noopener noreferrer">${esc(label)}</a>, son kontrol 31 Temmuz 2026.</li>`).join('');
  if (/<ol class="sources">/i.test(html)) {
    return html.replace(/(<ol class="sources">[\s\S]*?)(<\/ol>)/i, `$1${items}$2`);
  }
  if (/<h2\b[^>]*id="kaynakca"[^>]*>[\s\S]*?<ul>/i.test(html)) {
    return html.replace(/(<h2\b[^>]*id="kaynakca"[^>]*>[\s\S]*?<ul>)/i, `$1${items}`);
  }
  return html;
}

function addEditorialReview(html, cfg) {
  if (!cfg.reviewer || !cfg.reviewedAt || !cfg.methodology) {
    throw new Error('Editoryal güven bilgisi eksik: reviewer, reviewedAt ve methodology zorunludur.');
  }
  const box = `<aside class="editorial-review" aria-label="Editoryal inceleme bilgisi"><strong>İnceleyen: ${esc(cfg.reviewer)}</strong><span>Son içerik ve kaynak kontrolü: ${esc(cfg.reviewedAt)}</span><p>${esc(cfg.methodology)}</p></aside>`;
  if (html.includes('editorial-review')) return html;
  if (/<p class="policy">/i.test(html)) return html.replace(/(<p class="policy">)/i, `${box}$1`);
  if (/<h2\b[^>]*id="kaynakca"[^>]*>/i.test(html)) return html.replace(/(<h2\b[^>]*id="kaynakca"[^>]*>)/i, `${box}$1`);
  if (/<\/article>/i.test(html)) return html.replace(/<\/article>/i, `${box}</article>`);
  throw new Error('Editoryal güven bloğu için bağlantı noktası bulunamadı.');
}

function updateSchema(html, cfg) {
  const extraFaq = Array.isArray(cfg.extraFaq) ? cfg.extraFaq : [];
  return html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i, (full, json) => {
    let graph;
    try { graph = JSON.parse(json); } catch { return full; }
    const nodes = Array.isArray(graph['@graph']) ? graph['@graph'] : [graph];
    const article = nodes.find((node) => node['@type'] === 'Article' || node['@type'] === 'BlogPosting');
    if (article) {
      article.reviewedBy = {'@type':'Organization','name':cfg.reviewer,'url':'https://maasim.net/hakkimizda/'};
      article.lastReviewed = '2026-07-31';
    }
    const faq = nodes.find((node) => node['@type'] === 'FAQPage');
    if (faq && extraFaq.length) {
      const existing = new Set((faq.mainEntity || []).map((item) => item.name));
      faq.mainEntity = [...(faq.mainEntity || []), ...extraFaq.filter(([q]) => !existing.has(q)).map(([name,text]) => ({'@type':'Question',name,acceptedAnswer:{'@type':'Answer',text}}))];
    }
    const output = graph['@graph'] ? {...graph, '@graph': nodes} : nodes[0];
    return `<script type="application/ld+json">${JSON.stringify(output)}</script>`;
  });
}

export async function enhanceBlogQuality(distDir = dist) {
  for (const post of indexableBlogPosts) {
    const cfg = qualityContent[post.slug];
    if (!cfg) throw new Error(`Blog editoryal kalite içeriği eksik: ${post.slug}`);
    const file = join(distDir, blogOutputPath(post));
    let html = await readFile(file, 'utf8');
    html = insertDepthSection(html, post, cfg);
    html = addVisibleFaq(html, cfg);
    html = addSources(html, cfg);
    html = addEditorialReview(html, cfg);
    html = updateSchema(html, cfg);
    await writeFile(file, html);
  }

  const cssFile = join(distDir, 'assets', 'blog.css');
  let css = await readFile(cssFile, 'utf8');
  if (!css.includes('/* quality-depth */')) {
    css += `\n/* quality-depth */\n.quality-depth{margin-top:44px}.quality-depth>p{font-size:17px;color:#334155}.table-scroll{max-width:100%;overflow-x:auto}.decision-table{min-width:680px}.action-checklist{display:grid;gap:10px;padding-left:22px}.action-checklist li{padding-left:5px}.content-cta{margin:28px 0;display:flex;align-items:center;justify-content:space-between;gap:20px;padding:22px;border-radius:20px;background:#0f172a;color:#fff}.content-cta p{margin:4px 0 0;color:#cbd5e1!important;font-size:14px!important}.content-cta a{flex:none;background:#10b981;color:#052e2b;text-decoration:none;padding:10px 14px;border-radius:10px;font-weight:900}.context-links{font-size:14px!important}.context-links a{margin-right:6px}.editorial-review{margin:30px 0 18px;padding:18px 20px;border:1px solid #99f6e4;border-radius:16px;background:#f0fdfa}.editorial-review strong,.editorial-review span{display:block}.editorial-review span{font-size:13px;color:#475569;margin-top:3px}.editorial-review p{font-size:14px!important;margin:10px 0 0!important}@media(max-width:700px){.content-cta{align-items:flex-start;flex-direction:column}.decision-table{min-width:620px}}\n`;
    await writeFile(cssFile, css);
  }
  console.log(`Blog editoryal zenginleştirme uygulandı: ${indexableBlogPosts.length} içerik; tablo ve SSS bileşenleri isteğe bağlı.`);
}
