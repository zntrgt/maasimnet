import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { GUIDE_CATEGORIES, retiredEmployeeGuides, retiredGuideRedirects } from '../content/employee-guides.js';

// 95 şablon rehberin kısa cevapları, konunun kapsamlı rehberinde tek bölümde toplanır.
// Her durum, eski URL'nin 301 hedefi olan #slug çapasıyla erişilebilir kalır.
const SITE = 'https://maasim.net';
const MARKER = 'data-guide-cases';
const esc = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

const style = `<style ${MARKER}>
.guide-cases{margin:40px 0;padding:24px;border:1px solid #e2e8f0;border-radius:16px;background:#f8fafc}
.guide-cases>h2{margin-top:0}
.guide-case{padding:16px 0;border-top:1px solid #e2e8f0;scroll-margin-top:96px}
.guide-case:first-of-type{border-top:0}
.guide-case h3{margin:4px 0 8px;font-size:1.05rem;line-height:1.4}
.guide-case__tag{display:inline-block;font-size:.75rem;font-weight:700;color:#0f766e;text-transform:uppercase;letter-spacing:.04em}
.guide-case p{margin:6px 0}
.guide-case:target{background:#ecfdf5;border-radius:12px;padding-left:12px;padding-right:12px}
</style>`;

export function targetGroups() {
  const groups = new Map();
  for (const guide of retiredEmployeeGuides) {
    const target = guide.redirectTo.split('#')[0];
    if (!groups.has(target)) groups.set(target, []);
    groups.get(target).push(guide);
  }
  return groups;
}

export function casesSection(guides) {
  const items = guides.map((guide) => `<div class="guide-case" id="${esc(guide.slug)}"><span class="guide-case__tag">${esc(GUIDE_CATEGORIES[guide.kind])}</span><h3>${esc(guide.title)}</h3><p>${esc(guide.answer)}</p><p>${esc(guide.detail)}</p><p><strong>Ne yapmalı:</strong> ${esc(guide.action)}</p></div>`).join('');
  return `<section class="guide-cases" ${MARKER} id="sik-karsilasilan-durumlar"><h2>Sık karşılaşılan durumlar</h2><p>Okurlarımızın bu konuda en sık sorduğu ${guides.length} durumu tek yerde topladık. Her cevap 2026 bordro kurallarına göre yazıldı; kendi rakamlarınızla denemek için hesaplayıcıyı kullanın.</p>${items}</section>`;
}

function stripExisting(html) {
  return html
    .replace(new RegExp(`<section class="guide-cases" ${MARKER}[\\s\\S]*?</section>`, 'g'), '')
    .replace(new RegExp(`<style ${MARKER}>[\\s\\S]*?</style>`, 'g'), '');
}

export function insertionPoint(html) {
  const body = html.indexOf('<div class="body">');
  if (body === -1) return null;
  const candidates = [html.indexOf('<section class="faq"', body), html.search(/<h2\b[^>]*\bid="kaynak(?:ca|lar)"/)]
    .filter((at) => at > body);
  return candidates.length ? Math.min(...candidates) : null;
}

export function rewriteRetiredLinks(text) {
  let next = text;
  for (const [legacy, target] of Object.entries(retiredGuideRedirects)) {
    next = next.split(`href="${legacy}"`).join(`href="${target}"`);
    next = next.split(`${SITE}${legacy}`).join(`${SITE}${target}`);
  }
  return next;
}

async function walk(dir, output = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await walk(path, output);
    else if (/\.(html|txt)$/.test(entry.name)) output.push(path);
  }
  return output;
}

export async function applyGuideConsolidation(dist) {
  const groups = targetGroups();
  for (const [target, guides] of groups) {
    const file = join(dist, target, 'index.html');
    let html = stripExisting(await readFile(file, 'utf8'));
    const at = insertionPoint(html);
    if (at === null) throw new Error(`Birleştirilmiş rehber bölümü için yer bulunamadı: ${target}`);
    html = `${html.slice(0, at)}${casesSection(guides)}${html.slice(at)}`.replace(/<\/head>/i, `${style}</head>`);
    await writeFile(file, html);
  }

  let rewritten = 0;
  for (const file of await walk(dist)) {
    const text = await readFile(file, 'utf8');
    const next = rewriteRetiredLinks(text);
    if (next !== text) {
      await writeFile(file, next);
      rewritten += 1;
    }
  }
  console.log(`Rehber birleştirme: ${retiredEmployeeGuides.length} durum ${groups.size} kapsamlı rehbere taşındı; bağlantısı düzeltilen dosya: ${rewritten}`);
  return { targets: groups.size, retired: retiredEmployeeGuides.length, rewritten };
}
