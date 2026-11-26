import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const ROUTE = '/2027-maas-hesaplama/';
const TITLE = '2027 Brütten Nete Maaş Hesaplama | Netten Brüte Tahmin | Maaşım.net';
const H1 = '2027 Brütten Nete Maaş Hesaplama ve Netten Brüte Tahmin';
const DESCRIPTION = '2026 maaşınla %27, %30, %35 zam senaryolarını karşılaştır veya 2027 brüt/net maaş beklentini gir. Tahmini vergi ve SGK varsayımlarıyla 12 aylık bordronu gör.';

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
    `<aside class="home-2027-estimate-cta" data-search-supports="2027-maas-hesaplama"><strong>2027 ücret senaryolarını karşılaştır</strong><p>2026 maaşına %27, %30 veya %35 zam gelirse ne kadar alırsın? İstersen doğrudan 2027 maaş beklentini gir.</p><a href="${ROUTE}">2027 brütten nete maaş hesaplama →</a><small>Tahmin aracı resmî 2027 bordrosu değildir.</small></aside>`
  );
  // Keep a single CTA; a late build pass positions it above the calculator.
  await writeFile(homePath, home, 'utf8');

  console.log('2027 arama niyeti sahipliği dedicated hesaplayıcı URL üzerinde güçlendirildi.');
}

export async function promote2027HomeLink(dist){
  const path=join(dist,'index.html');
  let html=await readFile(path,'utf8');
  const pattern=/<aside class="home-2027-estimate-cta"[^>]*>[\s\S]*?<\/aside>/i;
  const cta=html.match(pattern)?.[0];
  if(!cta)throw new Error('2027 home CTA missing');
  html=html.replace(pattern,'');
  const hero=/<header class="enterprise-hero"[^>]*>[\s\S]*?<\/header>/i;
  if(!hero.test(html))throw new Error('Home hero missing');
  html=html.replace(hero,m=>m+cta);
  html=html.replace(/<\/head>/i,'<style data-home-2027-priority>.home-2027-estimate-cta{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 14px;align-items:center;padding:12px 16px;margin:12px auto 16px;border-width:1px;border-radius:14px}.home-2027-estimate-cta strong{font-size:16px;grid-column:1}.home-2027-estimate-cta p{font-size:13px;margin:0;grid-column:1}.home-2027-estimate-cta a{grid-column:2;grid-row:1/4;justify-content:center;text-align:center;font-size:13px;white-space:normal}.home-2027-estimate-cta small{grid-column:1;margin:0;font-size:11px}@media(max-width:600px){.home-2027-estimate-cta{grid-template-columns:1fr;gap:6px;margin:8px 0 12px}.home-2027-estimate-cta a{grid-column:1;grid-row:auto;min-height:42px;align-items:center}.home-2027-estimate-cta small{grid-row:3}}</style></head>');
  await writeFile(path,html,'utf8');
}
