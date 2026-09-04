import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { HISTORICAL_YEARS } from '../src/historical-payroll-data.js';

export async function applyHistoricalPayrollFreshness(dist) {
  let updated = 0;
  for (const year of HISTORICAL_YEARS) {
    const file = join(dist, `${year}-maas-hesaplama`, 'index.html');
    let html = await readFile(file, 'utf8');
    const next = html.replace('Resmî kaynaklar ve güncellik', 'Resmî Kaynaklar ve Güncellik');
    if (!next.includes('Güncellik')) throw new Error(`Tarihsel güncellik başlığı eksik: ${year}`);
    if (next !== html) updated += 1;
    html = next;
    await writeFile(file, html, 'utf8');
  }
  console.log(`Tarihsel maaş Güncellik başlıkları doğrulandı: ${HISTORICAL_YEARS.length}; güncellendi: ${updated}`);
}
