import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { HISTORICAL_YEARS } from '../src/historical-payroll-data.js';

const HISTORICAL_CSS = '/assets/historical-payroll-calculator.css';
const HISTORICAL_CSS_VERSIONED = `${HISTORICAL_CSS}?v=2`;

function versionHistoricalCss(html, label) {
  const next = html.replaceAll(`href="${HISTORICAL_CSS}"`, `href="${HISTORICAL_CSS_VERSIONED}"`);
  if (!next.includes(HISTORICAL_CSS_VERSIONED)) throw new Error(`Tarihsel CSS sürümü uygulanamadı: ${label}`);
  return next;
}

export async function applyHistoricalPayrollFreshness(dist) {
  let updated = 0;
  for (const year of HISTORICAL_YEARS) {
    for (const route of [`${year}-maas-hesaplama`, `brutten-nete-${year}`]) {
      const file = join(dist, route, 'index.html');
      let html = await readFile(file, 'utf8');
      let next = html.replace('Resmî kaynaklar ve güncellik', 'Resmî Kaynaklar ve Güncellik');
      next = versionHistoricalCss(next, route);
      if (!next.includes('Güncellik') && route === `${year}-maas-hesaplama`) {
        throw new Error(`Tarihsel güncellik başlığı eksik: ${year}`);
      }
      if (next !== html) updated += 1;
      await writeFile(file, next, 'utf8');
    }
  }
  console.log(`Tarihsel sayfa güncellik + CSS sürümleme doğrulandı: ${HISTORICAL_YEARS.length * 2}; güncellendi: ${updated}`);
}
