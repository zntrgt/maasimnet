import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { indexableBlogPosts, blogOutputPath } from '../content/blog-manifest.js';

const esc = (s = '') => String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const text = (s = '') => s.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const question = (s) => { let q = text(s); if (!q.endsWith('?')) q += '?'; return q; };

function facts(title, lead) {
  return `<section class="ai-quick-facts" aria-labelledby="ai-quick-facts-title"><h2 id="ai-quick-facts-title">Kısa özet</h2><ul><li><strong>Bu sayfa neyi açıklar?</strong> ${esc(title)}</li><li><strong>Temel sonuç:</strong> ${esc(lead || 'Sonuç, sayfadaki açık varsayımlar ve hesaplama yöntemiyle birlikte okunmalıdır.')}</li><li><strong>Kontrol noktası:</strong> Ücret türü, ödeme tarihi, vergi matrahı ve çalışan koşulları aynı senaryoda tutulmalıdır.</li><li><strong>Güncellik notu:</strong> Kanun teklifi veya taslaklar yürürlükteki mevzuatın yerine geçmez; tarih ve resmî kaynak kontrol edilmelidir.</li></ul></section>`;
}

function comparison() {
  return `<section class="law-comparison" aria-labelledby="law-comparison-title"><h2 id="law-comparison-title">Mevcut durum ve kanun teklifleri</h2><div class="comparison-scroll" tabindex="0"><table><caption>Yürürlükteki uygulama ile teklif/taslakların karşılaştırılması</caption><thead><tr><th scope="col">Başlık</th><th scope="col">Mevcut durum</th><th scope="col">Kanun teklifi / taslak</th></tr></thead><tbody><tr><th scope="row">Hukuki durum</th><td>Yürürlükteki kanun, yönetmelik ve resmî tebliğler uygulanır.</td><td>Teklif veya taslak, kabul edilip yayımlanana kadar yürürlükte değildir.</td></tr><tr><th scope="row">Hesaba etkisi</th><td>Bu sayfadaki hesap mevcut parametrelerle yapılır.</td><td>Değişiklik kesinleşirse tarihinden itibaren yeniden hesaplanır.</td></tr><tr><th scope="row">Kontrol</th><td>Resmî kurum kaynağı ve geçerlilik tarihi kontrol edilir.</td><td>Teklif numarası, komisyon/genel kurul durumu ve Resmî Gazete yayımı ayrıca kontrol edilir.</td></tr></tbody></table></div></section>`;
}

function faqData(html, title, lead) {
  const pairs = [...html.matchAll(/<details[^>]*>\s*<summary[^>]*>([\s\S]*?)<\/summary>\s*<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map(m => [question(m[1]), text(m[2])]).filter((x, i, a) => x[1] && a.findIndex(y => y[0] === x[0]) === i);
  if (pairs.length < 3) pairs.push([`\u200B${question(title)} nasıl değerlendirilir?`, text(lead) || 'Sayfadaki varsayımlar ve kaynaklar birlikte değerlendirilmelidir.']);
  return pairs.slice(0, 8);
}

export async function enhanceBlogAiSearch(dist) {
  for (const post of indexableBlogPosts) {
    const path = join(dist, blogOutputPath(post));
    let html = await readFile(path, 'utf8');
    const title = text(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || post.title);
    const lead = text(html.match(/<p[^>]*class="lead"[^>]*>([\s\S]*?)<\/p>/i)?.[1] || '');
    const pairs = faqData(html, title, lead);
    const schema = {'@context':'https://schema.org','@type':'FAQPage','mainEntity':pairs.map(([name,answer])=>({'@type':'Question',name,acceptedAnswer:{'@type':'Answer',text:answer}}))};
    if (!html.includes('"@type":"FAQPage"')) html = html.replace('</head>', `<script type="application/ld+json">${JSON.stringify(schema)}</script></head>`);
    if (!html.includes('class="ai-quick-facts"')) html = html.replace(/(<\/header>)/i, `$1${facts(title, lead)}`);
    if (!html.includes('class="law-comparison"')) html = html.replace(/(<div class="body">|<section class="body">)/i, `$1${comparison()}`);
    html = html.replace(/<summary([^>]*)>([\s\S]*?)<\/summary>/gi, (_, attrs, q) => `<summary${attrs}>${esc(question(q))}</summary>`);
    await writeFile(path, html);
  }
  const cssPath = join(dist, 'assets', 'blog.css');
  let css = await readFile(cssPath, 'utf8');
  if (!css.includes('ai-quick-facts')) css += '\n.ai-quick-facts,.law-comparison{margin:24px 0;padding:20px;background:#f0fdfa;border:1px solid #99f6e4;border-radius:16px}.ai-quick-facts h2,.law-comparison h2{margin-top:0}.ai-quick-facts li{margin:8px 0}.comparison-scroll{overflow-x:auto}.law-comparison table{width:100%;min-width:680px;border-collapse:collapse}.law-comparison th,.law-comparison td{text-align:left;vertical-align:top;padding:12px;border-bottom:1px solid #cbd5e1}.law-comparison thead{background:#ccfbf1}.law-comparison caption{text-align:left;padding:8px 0;color:#475569}\n';
  await writeFile(cssPath, css);
}

