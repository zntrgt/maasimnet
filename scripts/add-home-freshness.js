import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DATA_2026 } from '../src/data-2026.js';

const VERSION = '0.6.0-p0-information-architecture';

export async function addHomeFreshness(dist) {
  const path = join(dist, 'index.html');
  let html = await readFile(path, 'utf8');
  if (html.includes('id="home-freshness"')) return;
  const block = `<aside id="home-freshness" class="site-freshness max-w-7xl mx-auto mb-16 bg-white border border-slate-200 rounded-3xl p-6 text-sm text-slate-600"><h2 class="font-black text-slate-900 text-lg mb-4">Güncellik bilgisi</h2><dl class="grid grid-cols-1 md:grid-cols-3 gap-4"><div><dt class="text-xs uppercase font-black text-slate-400">İlk yayın</dt><dd class="font-bold">29 Temmuz 2026</dd></div><div><dt class="text-xs uppercase font-black text-slate-400">Son güncelleme</dt><dd class="font-bold">29 Temmuz 2026</dd></div><div><dt class="text-xs uppercase font-black text-slate-400">Son mevzuat kontrolü</dt><dd class="font-bold">${DATA_2026.checkedAt}</dd></div><div><dt class="text-xs uppercase font-black text-slate-400">Geçerlilik dönemi</dt><dd class="font-bold">1 Ocak–31 Aralık 2026</dd></div><div><dt class="text-xs uppercase font-black text-slate-400">Hesaplama motoru</dt><dd class="font-bold">${DATA_2026.engineVersion}</dd></div><div><dt class="text-xs uppercase font-black text-slate-400">Sürüm</dt><dd class="font-bold">${VERSION}</dd></div></dl></aside>`;
  html = html.includes('</main>') ? html.replace('</main>', `${block}</main>`) : html.replace('</body>', `${block}</body>`);
  await writeFile(path, html);
}
