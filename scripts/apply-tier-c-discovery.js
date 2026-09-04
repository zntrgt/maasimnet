import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const TOOLS = Object.freeze([
  ['/resmi-tatil-mesai-ucreti-hesaplama/','Resmî Tatil Mesai Ücreti Hesaplama 2026','Bayram ve genel tatilde çalışmanın ilave brüt ve tahmini net karşılığını hesapla.'],
  ['/hafta-tatili-ucreti-hesaplama/','Hafta Tatili Ücreti Hesaplama 2026','Hafta tatilinde çalışmanın ilave ücretini ve bordro etkisini hesapla.'],
  ['/part-time-maas-hesaplama/','Part-Time Maaş Hesaplama 2026','Kısmi süreli çalışma oranına göre brüt/net maaşı ve SGK prim gününü hesapla.'],
  ['/eksik-gun-maas-hesaplama/','Eksik Gün Maaş Hesaplama 2026','Ücret ödenen gün sayısına göre kıst brüt/net maaşı hesapla.'],
  ['/sgk-prim-hesaplama/','SGK Prim Hesaplama 2026','PEK ve prim gününe göre çalışan ve işveren SGK/işsizlik primlerini hesapla.']
]);
const MARKER = 'data-tier-c-discovery="v1"';
const card = ([href,title,description]) => `<a class="calculator-discovery__card" href="${href}"><strong>${title}</strong><span>${description}</span><b>Hesapla →</b></a>`;

export async function applyTierCDiscovery(dist) {
  const hubFile = join(dist,'hesaplama-araclari','index.html');
  let html = await readFile(hubFile,'utf8');
  if (!html.includes(MARKER)) {
    const section = `<section class="tools-hub__section" ${MARKER}><h2>Çalışma süresi, tatil ve SGK</h2><p>Resmî tatil, hafta tatili, part-time, eksik gün ve SGK prim hesaplarını ayrı araçlarla çözün.</p><div class="tools-hub__grid">${TOOLS.map(card).join('')}</div></section>`;
    html = html.replace(/<\/main>/i,`${section}</main>`);

    const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
    if (match) {
      try {
        const graph = JSON.parse(match[1]);
        const collection = graph?.['@graph']?.find((x) => x?.['@type'] === 'CollectionPage');
        const list = collection?.mainEntity?.itemListElement;
        if (Array.isArray(list)) {
          let position = list.length;
          for (const [path,title] of TOOLS) {
            if (list.some((item) => item.url === `https://maasim.net${path}`)) continue;
            position += 1;
            list.push({ '@type':'ListItem', position, name:title, url:`https://maasim.net${path}` });
          }
          html = html.replace(match[0],`<script type="application/ld+json">${JSON.stringify(graph)}</script>`);
        }
      } catch {}
    }
  }
  await writeFile(hubFile,html,'utf8');
  return Object.freeze({ tools: TOOLS.length });
}
