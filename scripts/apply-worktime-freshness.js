import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DATA_2026 } from '../src/data-2026.js';

const ROUTES = [
  'resmi-tatil-mesai-ucreti-hesaplama',
  'hafta-tatili-ucreti-hesaplama',
  'part-time-maas-hesaplama',
  'eksik-gun-maas-hesaplama',
  'sgk-prim-hesaplama'
];
const MARKER = 'data-worktime-freshness="v1"';

export async function applyWorktimeFreshness(dist) {
  for (const route of ROUTES) {
    const file = join(dist,route,'index.html');
    let html = await readFile(file,'utf8');
    if (html.includes(MARKER)) continue;
    const block = `<aside class="worktime-section" ${MARKER} aria-label="Güncellik bilgisi"><h2>Güncellik</h2><p>2026 bordro ve SGK parametreleri <strong>${DATA_2026.checkedAt}</strong> tarihinde resmî kaynaklarla kontrol edildi. Hesap motoru: <strong>${DATA_2026.engineVersion}</strong>.</p></aside>`;
    html = html.replace(/<section class="worktime-section"><h2>Sık sorulan sorular<\/h2>/i,`${block}<section class="worktime-section"><h2>Sık sorulan sorular</h2>`);
    if (!html.includes(MARKER)) throw new Error(`Tier C güncellik bloğu eklenemedi: ${route}`);
    await writeFile(file,html,'utf8');
  }
  console.log(`Tier C güncellik blokları eklendi: ${ROUTES.length}`);
}
