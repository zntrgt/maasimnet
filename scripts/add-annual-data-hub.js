import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DATA_2026 } from '../src/data-2026.js';
import { DATA_2027, ESTIMATE_PRESETS_2027 } from '../src/data-2027.js';
const site = 'https://maasim.net';
const date = DATA_2027.checkedAt;
const ydo = DATA_2027.revaluation;
const money = kurus => (kurus / 100).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TL';
const pct = (ydo.valueBps / 100).toLocaleString('tr-TR');
const linkYdo = `<a href="${ydo.sourceUrl}">24 Kasım 2026 · ${ydo.sourceTitle}</a>`;
const source = (key, label) => `<a href="${DATA_2026.sources[key].url}">${label}</a>`;
function page(path, title, description, body, type) {
  const url = site + path;
  const crumbs = [{ '@type':'ListItem', position:1, name:'Ana Sayfa', item:site+'/' }];
  if (path !== '/veriler/') crumbs.push({ '@type':'ListItem', position:2, name:'Veri Merkezi', item:site+'/veriler/' });
  crumbs.push({ '@type':'ListItem', position:crumbs.length+1, name:title, item:url });
  const graph = { '@context':'https://schema.org', '@graph':[
    { '@type':type, '@id':url+'#page', url, name:title, description, datePublished:date, dateModified:date },
    { '@type':'BreadcrumbList', itemListElement:crumbs }
  ] };
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} | Maaşım.net</title><meta name="description" content="${description}"><meta name="robots" content="index,follow"><link rel="canonical" href="${url}"><link rel="stylesheet" href="/assets/p0-content.css"><script type="application/ld+json">${JSON.stringify(graph)}</script></head><body><main class="shell"><p class="crumb"><a href="/">Ana Sayfa</a> / <a href="/veriler/">Veri Merkezi</a></p><h1>${title}</h1><article class="content">${body}<p>Son güncelleme: 25 Kasım 2026</p></article></main></body></html>`;
}
export async function addAnnualDataHub(dist) {
  const p = DATA_2026.payroll;
  const hub = page('/veriler/', 'Resmî Maaş, Vergi ve SGK Verileri',
    'Türkiye’de maaş hesaplamasında kullanılan asgari ücret, gelir vergisi dilimleri, SGK ve kıdem tazminatı tavanlarına ait yıllık verileri ve kaynaklarını incele.',
    `<p class="lead">2026 yılında brüt asgari ücret ${money(p.minimumGrossKurus)}, net asgari ücret ${money(p.referenceMinimumNetKurus)}, aylık SGK tavanı ${money(p.sgkCeilingKurus)}. Kaynak: ${source('minimumWage','ÇSGB (23.12.2025)')} ve ${source('sgk','SGK (14.01.2026)')}.</p>
<h2>Yıllara göre bordro verileri</h2><div class="data-grid"><section class="data-card"><h3><a href="/veriler/2027/">2027 bordro verileri ve açıklanma durumu</a></h3><p>2026 yılı için ilan edilen yeniden değerleme oranı %${pct}. 2027 ücret tarifesi ve asgari ücret henüz kesinleşmedi.</p></section><section class="data-card"><h3><a href="/veriler/2026/">2026 resmî bordro verileri</a></h3><p>Asgari ücret, gelir vergisi, SGK ve ilgili istisnaları kaynaklarıyla incele.</p></section></div>
<h2>Veriler nasıl güncelleniyor?</h2><p>Her yıl ayrı URL’de saklanır. Yeni parametreler ilgili resmî belgeye dayanarak kaydedilir; açıklanmamış değerler kesin veri sayılmaz. <a href="/kaynak-politikasi/">Kaynak politikası</a>, <a href="/hesaplama-metodolojisi/">hesaplama metodolojisi</a> ve <a href="/test-raporu/">test raporu</a> üzerinden yöntemi kontrol edebilirsin.</p><p><a href="/">Brütten nete maaşını hesapla</a> veya <a href="/2027-maas-hesaplama/">2027 maaş senaryolarını karşılaştır</a>.</p>`, 'CollectionPage');
  const middle = ESTIMATE_PRESETS_2027.middle;
  const year = page('/veriler/2027/', '2027 Maaş ve Bordro Verileri',
    '2027 asgari ücret, SGK tavanı ve gelir vergisi dilimlerinin açıklanma durumunu takip et; resmî yeniden değerleme oranını ve tahmin yöntemini kaynaklarıyla incele.',
    `<p class="lead">24 Kasım 2026 tarihinde 2026 yılı yeniden değerleme oranı %${pct} olarak ilan edildi; 2027 ücret gelir vergisi tarifesi ve asgari ücret henüz kesinleşmedi. Kaynak: ${linkYdo}.</p><h2>2027 parametrelerinin açıklanma durumu</h2><table class="table"><thead><tr><th scope="col">Parametre</th><th scope="col">Değer / durum</th></tr></thead><tbody><tr><th scope="row">2026 yılı yeniden değerleme oranı</th><td>%${pct} · Resmî</td></tr>${DATA_2027.pending.map(p => `<tr><th scope="row">${p.label}</th><td>Resmî açıklama bekleniyor</td></tr>`).join('')}</tbody></table>
<h2>YDO ile 2027 vergi dilimi senaryosu [TAHMİN]</h2><p>2026 ücret tarifesindeki üst sınırları 1,2783 ile çarparak, yuvarlama veya olası mevzuat değişikliği olmadan aşağıdaki senaryoyu elde ediyoruz. Bunlar resmî 2027 dilimleri değildir. 2026 baz değerleri: ${source('incomeTax','GİB, 332 Seri No.lu Tebliğ (31.12.2025)')}.</p><table class="table"><thead><tr><th scope="col">Vergi oranı (2026)</th><th scope="col">2026 üst sınırı</th><th scope="col">2027 tahmini üst sınır</th></tr></thead><tbody>${middle.brackets.map((v,i)=>`<tr><th scope="row">%${p.incomeTaxBrackets[i].ratePpm/10000}</th><td>${money(p.incomeTaxBrackets[i].upToKurus)}</td><td>${money(v*100)}</td></tr>`).join('')}</tbody></table><p>Asgari ücret artışı YDO’dan bağımsızdır. <a href="/2027-maas-hesaplama/">2027 maaş tahmin aracında</a> kendi varsayımlarını değiştir.</p><p><a href="/veriler/">Tüm yılların verileri</a> · <a href="/veriler/2026/">2026 resmî bordro verileri</a> · <a href="/hesaplama-metodolojisi/">Hesaplama metodolojisi</a></p>`, 'WebPage');
  for (const [path,html] of [['veriler',hub],['veriler/2027',year]]) {
    await mkdir(join(dist,path),{recursive:true});
    await writeFile(join(dist,path,'index.html'),html,'utf8');
  }
  const oldPath = join(dist,'veriler','2026','index.html');
  const old = await readFile(oldPath,'utf8');
  await writeFile(oldPath,old.replace('</main>','<p><a href="/veriler/">Tüm yılların bordro verileri</a> · <a href="/veriler/2027/">2027 verilerinin açıklanma durumu</a></p></main>'),'utf8');
  const llmsPath = join(dist,'llms.txt');
  const llms = await readFile(llmsPath,'utf8');
  await writeFile(llmsPath,llms.trimEnd()+'\n- https://maasim.net/veriler/ — Yıllık bordro veri merkezi.\n- https://maasim.net/veriler/2027/ — Resmî açıklanma durumu; tahminler ayrı etiketlidir.\n','utf8');
}
