import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const ROUTE = '/2027-maas-hesaplama/';
const TITLE = '2027 Brütten Nete Maaş Hesaplama | Netten Brüte Tahmin | Maaşım.net';
const H1 = '2027 Brütten Nete Maaş Hesaplama ve Netten Brüte Tahmin';
const DESCRIPTION = '2027 brütten nete maaş hesaplama aracıyla tahmini net maaşınızı görün; netten brüte hesaplayın, asgari ücret, SGK tavanı ve vergi dilimi varsayımlarını değiştirin.';

function patchJsonLd(html) {
  return html.replace(/<script\b([^>]*)type=["']application\/ld\+json["']([^>]*)>([\s\S]*?)<\/script>/gi, (full, before, after, json) => {
    let parsed;
    try { parsed = JSON.parse(json); } catch { return full; }
    const nodes = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.['@graph'])
        ? parsed['@graph']
        : [parsed];

    for (const node of nodes) {
      const type = node?.['@type'];
      if (type === 'WebPage' && node.url === `https://maasim.net${ROUTE}`) {
        node.name = '2027 Brütten Nete Maaş Hesaplama';
        node.description = DESCRIPTION;
        node.about = [
          { '@type': 'Thing', name: '2027 brütten nete maaş hesaplama' },
          { '@type': 'Thing', name: '2027 netten brüte maaş hesaplama' }
        ];
      }
      if (type === 'WebApplication' && node.url === `https://maasim.net${ROUTE}`) {
        node.name = '2027 Brütten Nete Maaş Hesaplama';
        node.alternateName = '2027 Netten Brüte Maaş Tahmini';
        node.description = DESCRIPTION;
      }
    }

    const output = Array.isArray(parsed)
      ? nodes
      : Array.isArray(parsed?.['@graph'])
        ? { ...parsed, '@graph': nodes }
        : nodes[0];
    return `<script${before}type="application/ld+json"${after}>${JSON.stringify(output)}</script>`;
  });
}

export async function apply2027QueryOwnership(dist) {
  const pagePath = join(dist, '2027-maas-hesaplama', 'index.html');
  const homePath = join(dist, 'index.html');

  let page = await readFile(pagePath, 'utf8');
  page = page.replace(/<title>[\s\S]*?<\/title>/i, `<title>${TITLE}</title>`);
  page = page.replace(/<meta\s+name="description"\s+content="[^"]*">/i, `<meta name="description" content="${DESCRIPTION}">`);
  page = page.replace(/<h1>2027 Maaş Hesaplama: Brütten Nete ve Netten Brüte Tahmin<\/h1>/i, `<h1>${H1}</h1>`);
  page = patchJsonLd(page);
  await writeFile(pagePath, page, 'utf8');

  let home = await readFile(homePath, 'utf8');
  home = home.replace(
    /<aside class="home-2027-estimate-cta">[\s\S]*?<\/aside>/i,
    `<aside class="home-2027-estimate-cta" data-search-supports="2027-maas-hesaplama"><strong>2027 ücret senaryolarını karşılaştır</strong><p>2027 bordro parametreleri henüz kesinleşmedi. Kendi varsayımlarını girerek farklı ücret senaryolarını karşılaştır.</p><a href="${ROUTE}">2027 brütten nete maaş hesaplama →</a><small>Tahmin aracı resmî 2027 bordrosu değildir.</small></aside>`
  );
  await writeFile(homePath, home, 'utf8');

  console.log('2027 arama niyeti sahipliği dedicated hesaplayıcı URL üzerinde güçlendirildi.');
}
