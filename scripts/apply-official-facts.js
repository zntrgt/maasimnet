import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { OFFICIAL_FACT_TOPICS, OFFICIAL_FACTS_CHECKED_AT } from '../content/official-facts.js';
import { CONSOLIDATED_REDIRECTS } from '../src/consolidated-redirects.js';
import { getPageMetadata } from '../content/site-metadata.js';

const SITE = 'https://maasim.net';
const MARKER = 'data-official-facts';
const SCHEMA_MARKER = 'data-official-facts-schema';
const STYLE_MARKER = 'data-official-facts-style';
const esc = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const style = `<style ${STYLE_MARKER}>.official-facts{max-width:1180px;margin:24px auto;padding:20px 22px;border:1px solid #cbd5e1;border-radius:16px;background:#fff;color:#0f172a}.official-facts h2{margin:0 0 8px;font-size:1.15rem;line-height:1.3}.official-facts__answer{margin:0 0 14px;font-size:1rem;line-height:1.55}.official-facts__grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:0 0 12px}.official-facts__grid div{padding:10px 12px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc}.official-facts__grid dt{font-size:.8rem;color:#475569}.official-facts__grid dd{margin:2px 0 0;font-weight:700}.official-facts__grid dd.official-facts__note{font-weight:400;font-size:.78rem;color:#64748b}.official-facts__source{margin:0;font-size:.82rem;color:#475569}.official-facts__source a{color:#0f766e}</style>`;

const formatDateTr = (iso) => new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));

export function factBlock(topic) {
  const id = `official-facts-${topic.key}`;
  const cards = topic.cards.map((card) => `<div><dt>${esc(card.label)}</dt><dd>${esc(card.value)}</dd>${card.note ? `<dd class="official-facts__note">${esc(card.note)}</dd>` : ''}</div>`).join('');
  const sources = topic.sources.map((source) => `<a href="${esc(source.url)}" rel="noopener noreferrer">${esc(source.institution)} – ${esc(source.documentTitle)}</a> (${esc(source.legalBasis)})`).join('; ');
  return `<section class="official-facts" ${MARKER}="${topic.key}" aria-labelledby="${id}"><h2 id="${id}">Resmî 2026 değerleri</h2><p class="official-facts__answer">${esc(topic.answer)}</p><dl class="official-facts__grid">${cards}</dl><p class="official-facts__source">Kaynak: ${sources}. Son mevzuat kontrolü: <time datetime="${OFFICIAL_FACTS_CHECKED_AT}">${formatDateTr(OFFICIAL_FACTS_CHECKED_AT)}</time>.</p></section>`;
}

export function factDataset(topic) {
  const url = `${SITE}${topic.path}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    '@id': `${url}#dataset-${topic.key}`,
    name: topic.name,
    description: topic.answer,
    url,
    inLanguage: 'tr-TR',
    temporalCoverage: '2026',
    // Projenin tarih kuralı: Dataset'te dateModified, sayfanın gözden geçirilme tarihidir.
    dateModified: getPageMetadata(topic.path).reviewedAt || getPageMetadata(topic.path).modifiedAt,
    isAccessibleForFree: true,
    creator: { '@id': `${SITE}/#organization` },
    variableMeasured: topic.cards.map((card) => ({ '@type': 'PropertyValue', name: card.label, value: card.value, ...(card.note ? { description: card.note } : {}) })),
    citation: topic.sources.map((source) => source.url)
  };
}

function closingEnd(html, tag, start) {
  const pattern = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'gi');
  pattern.lastIndex = start;
  let depth = 0;
  for (let match; (match = pattern.exec(html));) {
    depth += match[1] ? -1 : 1;
    if (depth === 0) return pattern.lastIndex;
  }
  return null;
}

function openingWithClass(html, tag, className) {
  const pattern = new RegExp(`<${tag}\\b[^>]*\\bclass=["'][^"']*\\b${className}\\b[^"']*["'][^>]*>`, 'i');
  const match = pattern.exec(html);
  return match ? match.index : -1;
}

export function insertionPoint(html, topic) {
  if (topic.placement.type === 'article') {
    const start = openingWithClass(html, 'section', 'ai-quick-facts');
    if (start === -1) return null;
    return closingEnd(html, 'section', start);
  }
  const guide = openingWithClass(html, 'section', `${topic.placement.family}-section`);
  return guide === -1 ? null : guide;
}

function stripExisting(html) {
  return html
    .replace(new RegExp(`<section class="official-facts" ${MARKER}="[^"]*"[\\s\\S]*?</section>`, 'g'), '')
    .replace(new RegExp(`<script type="application/ld\\+json" ${SCHEMA_MARKER}="[^"]*">[\\s\\S]*?</script>`, 'g'), '')
    .replace(new RegExp(`<style ${STYLE_MARKER}>[\\s\\S]*?</style>`, 'g'), '');
}

export function rewriteLegacyLinks(text) {
  let next = text;
  for (const [legacy, canonical] of Object.entries(CONSOLIDATED_REDIRECTS)) {
    next = next.split(`href="${legacy}"`).join(`href="${canonical}"`);
    next = next.split(`${SITE}${legacy}`).join(`${SITE}${canonical}`);
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

export async function applyOfficialFacts(dist) {
  for (const topic of OFFICIAL_FACT_TOPICS) {
    const file = join(dist, topic.path, 'index.html');
    let html = stripExisting(await readFile(file, 'utf8'));
    const at = insertionPoint(html, topic);
    if (at === null) throw new Error(`Resmî değer bloğu için yerleşim noktası bulunamadı: ${topic.path}`);
    html = `${html.slice(0, at)}${factBlock(topic)}${html.slice(at)}`;
    const schema = `<script type="application/ld+json" ${SCHEMA_MARKER}="${topic.key}">${JSON.stringify(factDataset(topic))}</script>`;
    html = html.replace(/<\/head>/i, `${style}${schema}</head>`);
    await writeFile(file, html);
  }

  let rewritten = 0;
  for (const file of await walk(dist)) {
    const text = await readFile(file, 'utf8');
    const next = rewriteLegacyLinks(text);
    if (next !== text) {
      await writeFile(file, next);
      rewritten += 1;
    }
  }
  console.log(`Resmî değer blokları: ${OFFICIAL_FACT_TOPICS.length} kanonik sayfa; eski veri URL bağlantısı düzeltilen dosya: ${rewritten}`);
  return { topics: OFFICIAL_FACT_TOPICS.length, rewritten };
}
