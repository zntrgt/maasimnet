import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DATA_2026 } from '../src/data-2026.js';

export async function applyCalculatorHubFreshness(dist) {
  const path = join(dist, 'hesaplama-araclari', 'index.html');
  let html = await readFile(path, 'utf8');
  if (html.includes('data-calculator-hub-freshness')) return;

  const block = `<aside class="freshness tools-hub__freshness" data-calculator-hub-freshness><h2>Güncellik bilgisi</h2><dl><div><dt>Geçerlilik dönemi</dt><dd>2026</dd></div><div><dt>Son mevzuat / veri kontrolü</dt><dd>${DATA_2026.checkedAt}</dd></div><div><dt>Hesaplama motoru</dt><dd>${DATA_2026.engineVersion}</dd></div></dl><p>Hub yalnız yayında olan gerçek hesaplama araçlarını listeler. Gelecek araçlar hesap motoru ve doğrulama testleri tamamlanmadan burada yayınlanmaz.</p></aside>`;
  const css = `<style data-calculator-hub-freshness-css>.tools-hub__freshness{margin-top:48px;padding:22px;border:1px solid #dbe4ee;border-radius:20px;background:#fff}.tools-hub__freshness h2{margin:0 0 14px;font-size:19px}.tools-hub__freshness dl{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.tools-hub__freshness dl div{padding-top:10px;border-top:1px solid #e2e8f0}.tools-hub__freshness dt{color:#64748b;font-size:11px;font-weight:800;text-transform:uppercase}.tools-hub__freshness dd{margin:4px 0 0;font-size:13px;font-weight:800}.tools-hub__freshness p{margin:16px 0 0;color:#64748b;font-size:13px;line-height:1.6}@media(max-width:620px){.tools-hub__freshness dl{grid-template-columns:1fr}}</style>`;

  html = html.replace(/<\/head>/i, `${css}</head>`);
  html = html.replace(/<\/main>/i, `${block}</main>`);
  await writeFile(path, html, 'utf8');
  console.log(`Hesaplama araçları hub güncellik bilgisi eklendi: ${DATA_2026.checkedAt}`);
}
