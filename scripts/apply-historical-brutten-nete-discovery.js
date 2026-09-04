import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const SITE = 'https://maasim.net';
const YEARS = Object.freeze([2025, 2024, 2023, 2022, 2021, 2020]);
const MARKER = 'data-historical-brutten-nete-discovery="v1"';
const route = (year) => `/brutten-nete-${year}/`;
const genericRoute = (year) => `/${year}-maas-hesaplama/`;

function hubSection() {
  return `<section class="calculator-discovery calculator-discovery--historical-brutten-nete" ${MARKER}><div class="calculator-discovery__head"><p class="calculator-discovery__eyebrow">Brütten nete · geçmiş yıllar</p><h2>2020–2025 brütten nete maaş hesaplama</h2><p>Google'da aradığınız yılın brüt maaşını, o yılın gerçek vergi, SGK ve AGİ/istisna kurallarıyla nete çevirin.</p></div><div class="calculator-discovery__grid">${YEARS.map((year) => `<a class="calculator-discovery__card" href="${route(year)}"><strong>Brütten Nete ${year}</strong><span>${year} brüt maaşın ay ay net karşılığını tarihsel bordro motoruyla hesapla.</span><b>${year} hesabını aç →</b></a>`).join('')}</div></section>`;
}

function appendItemList(html) {
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
  if (!match) return html;
  try {
    const graph = JSON.parse(match[1]);
    const collection = graph?.['@graph']?.find((item) => item?.['@type'] === 'CollectionPage');
    const list = collection?.mainEntity?.itemListElement;
    if (!Array.isArray(list)) return html;
    let position = list.length;
    for (const year of YEARS) {
      const url = `${SITE}${route(year)}`;
      if (list.some((item) => item.url === url)) continue;
      position += 1;
      list.push({ '@type': 'ListItem', position, name: `Brütten Nete ${year} Maaş Hesaplama`, url });
    }
    return html.replace(match[0], `<script type="application/ld+json">${JSON.stringify(graph)}</script>`);
  } catch {
    return html;
  }
}

export async function applyHistoricalGrossToNetDiscovery(dist) {
  const hubFile = join(dist, 'hesaplama-araclari', 'index.html');
  let hub = await readFile(hubFile, 'utf8');
  if (!hub.includes(MARKER)) {
    hub = hub.replace(/<\/main>/i, `${hubSection()}</main>`);
    hub = appendItemList(hub);
  }
  await writeFile(hubFile, hub, 'utf8');

  let pages = 1;
  for (const year of YEARS) {
    const file = join(dist, `${year}-maas-hesaplama`, 'index.html');
    let html = await readFile(file, 'utf8');
    const localMarker = `data-brutten-nete-link="${year}"`;
    if (!html.includes(localMarker)) {
      const block = `<aside class="historical-note" ${localMarker}><strong>Sadece brütten nete mi bakıyorsunuz?</strong> <a href="${route(year)}">Brütten Nete ${year} Maaş Hesaplama</a> sayfası bu sorgu için sadeleştirilmiş tek yönlü hesap sunar.</aside>`;
      html = html.replace(/<\/main>/i, `${block}</main>`);
      await writeFile(file, html, 'utf8');
    }
    pages += 1;
  }

  return Object.freeze({ tools: YEARS.length, pages });
}
