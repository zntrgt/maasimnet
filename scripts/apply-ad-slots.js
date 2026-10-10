import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { AD_CLIENT, AD_SLOTS } from '../content/ad-slots.js';

export const AD_EXCLUDED_PATHS = Object.freeze(new Set([
  '/gizlilik/', '/kullanim-kosullari/', '/cerez-politikasi/', '/iletisim/',
  '/hakkimizda/', '/editoryal-politika/', '/kaynak-politikasi/',
  '/hesaplama-metodolojisi/', '/test-raporu/', '/sss/', '/sozluk/',
  '/blog/', '/hesaplama-araclari/', '/senaryolar/', '/404/', '/404.html'
]));

export function hasNoindexRobotsMeta(html) {
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] || '';
  return [...head.matchAll(/<meta\b[^>]*>/gi)].some(([tag]) => {
    const name = tag.match(/\bname\s*=\s*(["'])(.*?)\1/i)?.[2];
    const content = tag.match(/\bcontent\s*=\s*(["'])(.*?)\1/i)?.[2];
    return name?.toLowerCase() === 'robots' && /noindex/i.test(content || '');
  });
}

const SLOT_STYLE = `<style data-maasim-ad-slots>
.ad-slot{display:none;box-sizing:border-box;width:100%;max-width:100%;min-width:0;overflow:hidden;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;padding:16px 0;background:transparent}
html[data-ads="on"] .ad-slot{display:block;margin:32px 0}
.ad-slot__label{display:block;margin-bottom:10px;color:#64748b;font:400 12px/1.4 system-ui,sans-serif;text-transform:none}
.ad-slot .adsbygoogle{max-width:100%;min-width:0}
html[data-ads="on"] .ad-slot--toolResult,html[data-ads="on"] .ad-slot--articleInner,html[data-ads="on"] .ad-slot--articleEnd{min-height:250px}
html[data-ads="on"] .ad-slot--sidebar{display:none}
@media(min-width:1024px){html[data-ads="on"] .ad-slot--sidebar{display:block;min-height:600px}}
</style>`;

const esc = (value) => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function slotMarkup(name, slot) {
  const article = name === 'articleInner';
  const attrs = article
    ? 'style="display:block; text-align:center;" data-ad-layout="in-article" data-ad-format="fluid"'
    : 'style="display:block" data-ad-format="auto" data-full-width-responsive="true"';
  return `<aside class="ad-slot ad-slot--${name}" aria-label="Reklam" data-ad-slot-name="${name}"><span class="ad-slot__label">Reklam</span><ins class="adsbygoogle" ${attrs} data-ad-client="${esc(AD_CLIENT)}" data-ad-slot="${esc(slot)}"></ins></aside>`;
}

function stripSlots(html) {
  return html
    .replace(/<aside\b[^>]*class="[^"]*\bad-slot\b[^"]*"[^>]*>[\s\S]*?<\/aside>\s*/gi, '')
    .replace(/<style\b[^>]*data-maasim-ad-slots[^>]*>[\s\S]*?<\/style>\s*/gi, '');
}

function classNames(tag) {
  return (tag.match(/\bclass\s*=\s*(["'])(.*?)\1/i)?.[2] || '').split(/\s+/);
}

function findElement(html, tagName, className, from = 0, until = html.length) {
  const starts = new RegExp(`<${tagName}\\b(?:"[^"]*"|'[^']*'|[^'">])*>`, 'gi');
  starts.lastIndex = from;
  for (let match; (match = starts.exec(html)) && match.index < until;) {
    if (classNames(match[0]).includes(className)) {
      const end = closingEnd(html, tagName, match.index);
      if (end !== null && end <= until) return { start: match.index, end, html: html.slice(match.index, end) };
    }
  }
  return null;
}

function closingEnd(html, tagName, from) {
  const tags = new RegExp(`<\\/?${tagName}\\b(?:"[^"]*"|'[^']*'|[^'">])*>`, 'gi');
  tags.lastIndex = from;
  let depth = 0;
  for (let match; (match = tags.exec(html));) {
    depth += match[0][1] === '/' ? -1 : 1;
    if (depth === 0) return tags.lastIndex;
  }
  return null;
}

function toolPlacement(html, path) {
  if (path === '/') return findElement(html, 'div', 'calculator-table-full')?.end;

  if (/^\/202[0-5]-maas-hesaplama\/$/.test(path)) {
    let cursor = 0;
    while (true) {
      const section = findElement(html, 'section', 'historical-section', cursor);
      if (!section) return null;
      if (/<h2\b[^>]*>12 aylık bordro detayı<\/h2>/i.test(section.html)) return section.end;
      cursor = section.end;
    }
  }

  if (path === '/2027-maas-hesaplama/') {
    const scenarios = findElement(html, 'section', 'estimate-section-card');
    const guide = findElement(html, 'section', 'estimate-explainer');
    return scenarios && guide && scenarios.end <= guide.start ? guide.start : null;
  }

  for (const family of ['termination', 'overtime', 'unemployment', 'retirement', 'zam', 'rw', 'annual-leave', 'minimum-wage', 'salary-raise', 'worktime']) {
    const grid = findElement(html, 'section', `${family}-grid`);
    const guide = findElement(html, 'section', `${family}-section`);
    if (!grid) continue;
    return guide && grid.end <= guide.start && grid.html.includes(`${family}-results`) ? grid.end : null;
  }

  if (path === '/maas-teklifi-karsilastirma/') {
    const results = findElement(html, 'section', 'compare-results');
    return results?.html.includes('compare-table') ? results.end : null;
  }
  return null;
}

function articlePlacements(html, slots) {
  const article = findElement(html, 'article', 'article') || (() => {
    const match = /<article\b[^>]*>/i.exec(html);
    if (!match) return null;
    const end = closingEnd(html, 'article', match.index);
    return end === null ? null : { start: match.index, end };
  })();
  if (!article) return [];
  const body = findElement(html, 'div', 'body', article.start, article.end);
  if (!body) return [];

  const placements = [];
  const headings = [...body.html.matchAll(/<h2\b[^>]*>/gi)].map((match) => body.start + match.index);
  if (slots.articleInner && headings.length >= 4) {
    let at = headings[2]; // İkinci gövde H2 bölümünün bitişi; üçüncü H2 başlamadan önce.
    const sections = /<section\b(?:"[^"]*"|'[^']*'|[^'">])*>/gi;
    sections.lastIndex = headings[1];
    for (let match; (match = sections.exec(html)) && match.index < at;) {
      if (closingEnd(html, 'section', match.index) > headings[2]) {
        at = match.index; // Üçüncü başlığın section kabının içine reklam koyma.
        break;
      }
    }
    const firstTable = html.indexOf('<table', article.start);
    const summary = findElement(html, 'section', 'ai-quick-facts', article.start, body.start);
    const answer = findElement(html, 'section', 'answer', article.start, body.start);
    if ((firstTable === -1 || firstTable < at) && (!summary || summary.end < at) && (!answer || answer.end < at)) {
      placements.push({ at, name: 'articleInner' });
    }
  }

  if (slots.articleEnd) {
    const faq = findElement(html, 'section', 'faq', body.start, body.end);
    const h2Faq = /<h2\b[^>]*\bid=["']sss["'][^>]*>/i.exec(body.html);
    const faqAt = faq?.start ?? (h2Faq ? body.start + h2Faq.index : null);
    if (faqAt !== null) {
      const sources = /<h2\b[^>]*\bid=["']kaynakca["'][^>]*>/i.exec(body.html);
      const editorial = findElement(html, 'aside', 'editorial-review', body.start, body.end);
      const at = Math.min(faqAt, sources ? body.start + sources.index : Infinity, editorial?.start ?? Infinity);
      if (at > body.start) placements.push({ at, name: 'articleEnd' });
    }
  }

  if (slots.sidebar) {
    const sidebar = findElement(html, 'aside', 'sidebar', article.end);
    if (sidebar) {
      let cursor = sidebar.start;
      while (cursor < sidebar.end) {
        const box = findElement(html, 'div', 'side', cursor, sidebar.end);
        if (!box) break;
        if (/<h2\b[^>]*>\s*(?:İlgili araçlar|Kendi maaşını hesapla)\s*<\/h2>/i.test(box.html)) {
          placements.push({ at: box.end, name: 'sidebar' });
          break;
        }
        cursor = box.end;
      }
    }
  }
  return placements;
}

async function walkHtml(dir, output = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await walkHtml(path, output);
    else if (entry.name.endsWith('.html')) output.push(path);
  }
  return output;
}

function routeFor(dist, filename) {
  const path = relative(dist, filename).split(sep).join('/');
  return path === 'index.html' ? '/' : path.endsWith('/index.html') ? `/${path.slice(0, -11)}/` : `/${path}`;
}

export async function applyAdSlots(dist, slots = AD_SLOTS) {
  const files = await walkHtml(dist);
  let pages = 0;
  let inserted = 0;
  for (const filename of files) {
    const path = routeFor(dist, filename);
    let html = stripSlots(await readFile(filename, 'utf8'));
    if (AD_EXCLUDED_PATHS.has(path) || /(?:^|\/)404(?:\.html|\/)/.test(path) || hasNoindexRobotsMeta(html)) {
      await writeFile(filename, html);
      continue;
    }
    const blog = /^\/blog\/[^/]+\/$/.test(path);
    const placements = blog ? articlePlacements(html, slots) : [];
    if (!blog && slots.toolResult && (path === '/' || /<form\b/i.test(html))) {
      const at = toolPlacement(html, path);
      if (at == null) console.log(`Reklam noktası bulunamadı; atlandı: ${path}`);
      else placements.push({ at, name: 'toolResult' });
    }
    if (placements.length) {
      for (const { at, name } of placements.sort((a, b) => b.at - a.at)) {
        html = html.slice(0, at) + slotMarkup(name, slots[name]) + html.slice(at);
      }
      html = html.replace(/<\/head>/i, `${SLOT_STYLE}</head>`);
      pages++;
      inserted += placements.length;
    }
    await writeFile(filename, html);
  }
  console.log(`Kontrollü AdSense alanları: ${inserted} yerleşim, ${pages} sayfa (boş kimlikler atlandı).`);
  return { pages, inserted };
}
