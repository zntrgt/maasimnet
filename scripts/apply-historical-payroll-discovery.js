import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const SITE = 'https://maasim.net';
const YEARS = Object.freeze([2025, 2024, 2023, 2022, 2021, 2020]);
const MARKER = 'data-historical-discovery="v1"';
const TOOLS = Object.freeze(YEARS.map((year) => Object.freeze([
  `/${year}-maas-hesaplama/`,
  `${year} Maaş Hesaplama`,
  `${year} brütten nete ve netten brüte maaşı, o yılın vergi ve SGK kurallarıyla hesapla.`
])));
const card = ([href,title,description]) => `<a class="calculator-discovery__card" href="${href}"><strong>${title}</strong><span>${description}</span><b>${title.replace(' Maaş Hesaplama','')} bordrosunu aç →</b></a>`;

function section(extraClass = '') {
  return `<section class="calculator-discovery ${extraClass}" ${MARKER}><div class="calculator-discovery__head"><p class="calculator-discovery__eyebrow">Geçmiş yıllar</p><h2>2020–2025 tarihsel maaş hesaplama</h2><p>Bugünkü oranları geçmişe uygulamadan; her yılın kendi vergi dilimi, SGK tavanı, AGİ veya asgari ücret vergi istisnasıyla brüt-net hesabı yapın.</p></div><div class="calculator-discovery__grid">${TOOLS.map(card).join('')}</div></section>`;
}

function appendHistoricalItemList(html) {
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
  if (!match) return html;
  try {
    const graph = JSON.parse(match[1]);
    const collection = graph?.['@graph']?.find((x) => x?.['@type'] === 'CollectionPage');
    const list = collection?.mainEntity?.itemListElement;
    if (!Array.isArray(list)) return html;
    let position = list.length;
    for (const [path,title] of TOOLS) {
      const url = `${SITE}${path}`;
      if (list.some((item) => item.url === url)) continue;
      position += 1;
      list.push({ '@type':'ListItem', position, name:title, url });
    }
    return html.replace(match[0], `<script type="application/ld+json">${JSON.stringify(graph)}</script>`);
  } catch {
    return html;
  }
}

export async function applyHistoricalPayrollDiscovery(dist) {
  const hubFile = join(dist, 'hesaplama-araclari', 'index.html');
  let hub = await readFile(hubFile, 'utf8');
  if (!hub.includes(MARKER)) {
    hub = hub.replace(/<\/main>/i, `${section('calculator-discovery--historical-hub')}</main>`);
    hub = appendHistoricalItemList(hub);
  }
  await writeFile(hubFile, hub, 'utf8');

  const homeFile = join(dist, 'index.html');
  let home = await readFile(homeFile, 'utf8');
  if (!home.includes(MARKER)) home = home.replace(/<\/main>/i, `${section('calculator-discovery--historical-home')}</main>`);
  await writeFile(homeFile, home, 'utf8');

  return Object.freeze({ tools: TOOLS.length, pages: 2 });
}
