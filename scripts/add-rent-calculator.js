import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { RENT_CAPS, RENT_DATA_CHECKED_AT, latestCap, calculateRent } from '../src/rent-engine.js';

const SITE = 'https://maasim.net';
export const RENT_ROUTE = '/kira-artis-orani-hesaplama/';
const latest = latestCap();
const TITLE = `Kira Artış Oranı ${latest.label}: %${latest.pct.toLocaleString('tr-TR')} ve Kira Zammı Hesaplama | Maaşım.net`;
const H1 = `Kira Artış Oranı Hesaplama: ${latest.label} Tavanı %${latest.pct.toLocaleString('tr-TR')}`;
const DESCRIPTION = `${latest.label} kira artış oranı %${latest.pct.toLocaleString('tr-TR')}. Mevcut kiranızı girin; yasal azami yeni kirayı ve istenen zammın tavanı aşıp aşmadığını hesaplayın.`;
const SOURCES = Object.freeze({
  tuik: 'https://veriportali.tuik.gov.tr/',
  tbk: 'https://www.mevzuat.gov.tr/mevzuatmetin/1.5.6098.pdf',
  latest: 'https://www.capital.com.tr/haberler/tum-haberler/ekim-2026-kira-artis-orani-aciklandi-iste-konut-ve-is-yerleri-icin-yeni-kira-artis-hesaplamasi'
});

const esc = (value = '') => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const pct = (v) => `%${Number(v).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const tl = (kurus) => `${(kurus / 100).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
const fmtDate = (iso) => new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));
const example = calculateRent({ currentKurus: 2_000_000, renewal: latest.renewal });

const capRows = RENT_CAPS.map((c) => `<tr><td>${c.label}</td><td><b>${pct(c.pct)}</b></td><td>${c.basis} TÜFE 12 aylık ortalaması</td></tr>`).join('');
const monthOptions = RENT_CAPS.map((c, i) => `<option value="${c.renewal}"${i === 0 ? ' selected' : ''}>${c.label} — ${pct(c.pct)}</option>`).join('') + '<option value="custom">Başka bir ay (oranı kendim gireceğim)</option>';
const exampleRows = [1_000_000, 2_000_000, 3_000_000, 5_000_000].map((k) => { const r = calculateRent({ currentKurus: k, renewal: latest.renewal }); return `<tr><td>${tl(k)}</td><td>${tl(r.maxIncreaseKurus)}</td><td><b>${tl(r.maxKurus)}</b></td></tr>`; }).join('');

const FAQ = [
  [`${latest.label} kira artış oranı yüzde kaç?`, `${latest.label} içinde yenilenen konut ve işyeri kiraları için yasal azami artış oranı ${pct(latest.pct)}. Bu oran, TÜİK'in ${latest.basis} için açıkladığı TÜFE'nin 12 aylık ortalamalara göre değişimidir.`],
  ['Kira artış oranı nasıl belirlenir?', 'Türk Borçlar Kanunu m.344’e göre yenilenen kira yılında kira artışı, bir önceki kira yılındaki TÜFE’nin 12 aylık ortalamalara göre değişim oranını geçemez. Taraflar daha düşük bir artışta anlaşabilir.'],
  ['Konut kiralarında %25 sınırı hâlâ geçerli mi?', 'Hayır. Konut kiraları için uygulanan geçici %25 sınırı 1 Temmuz 2024’te sona erdi. Artık konut ve işyeri kiralarında aynı kural, TÜFE 12 aylık ortalaması uygulanır.'],
  ['Hangi ayın oranı uygulanır?', 'Kira sözleşmesinin yenilendiği ayda açıklanmış en son 12 aylık ortalama TÜFE değişimi esas alınır; uygulamada bu, yenileme ayından bir önceki ayın verisidir. Hesaplayıcı yenileme ayına göre doğru oranı seçer.'],
  ['5 yıldan uzun süren kiralarda ne olur?', 'Beş yıldan uzun süreli veya beş yıldan sonra yenilenen sözleşmelerde kira bedeli, hâkim tarafından hakkaniyete göre, TÜFE sınırı aranmadan yeniden belirlenebilir (TBK m.344/3). Bu durumda bu hesaplayıcının tavanı bağlayıcı değildir.']
];

function schema() {
  const url = `${SITE}${RENT_ROUTE}`;
  return { '@context': 'https://schema.org', '@graph': [
    { '@type': 'WebPage', '@id': `${url}#page`, url, name: TITLE, description: DESCRIPTION, inLanguage: 'tr-TR', datePublished: '2026-10-10', dateModified: RENT_DATA_CHECKED_AT },
    { '@type': 'WebApplication', '@id': `${url}#calculator`, url, name: 'Kira Artış Oranı Hesaplama', applicationCategory: 'FinanceApplication', operatingSystem: 'Web', isAccessibleForFree: true, description: DESCRIPTION, offers: { '@type': 'Offer', price: 0, priceCurrency: 'TRY' } },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Hesaplama Araçları', item: `${SITE}/hesaplama-araclari/` },
      { '@type': 'ListItem', position: 3, name: 'Kira Artış Oranı Hesaplama', item: url }
    ] },
    { '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }
  ] };
}

function page() {
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(TITLE)}</title><meta name="description" content="${esc(DESCRIPTION)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${SITE}${RENT_ROUTE}"><meta property="og:type" content="website"><meta property="og:title" content="${esc(H1)}"><meta property="og:description" content="${esc(DESCRIPTION)}"><meta property="og:url" content="${SITE}${RENT_ROUTE}"><meta property="og:site_name" content="Maaşım.net"><script type="application/ld+json">${JSON.stringify(schema())}</script><link rel="stylesheet" href="/assets/rent-calculator.css"></head><body class="rent-page"><main><div class="rent-shell">
<header class="rent-hero"><span class="rent-eyebrow">TBK m.344 · TÜFE 12 aylık ortalama</span><h1>${H1}</h1><p>Mevcut kiranızı ve sözleşmenin yenilendiği ayı girin; yasal olarak istenebilecek en yüksek yeni kirayı görün. Ev sahibinin istediği oranı da yazarsanız tavanı aşıp aşmadığını gösterelim.</p><div class="rent-freshness"><span>Son veri kontrolü: ${fmtDate(RENT_DATA_CHECKED_AT)}</span><span>${latest.label}: ${pct(latest.pct)}</span></div></header>
<section class="rent-answer"><h2>Kısa cevap</h2><p><strong>${latest.label} kira artış oranı ${pct(latest.pct)}.</strong> Bu ay yenilenen konut ve işyeri kiralarına en fazla bu oranda zam yapılabilir; oran, TÜİK’in ${latest.basis} için açıkladığı TÜFE 12 aylık ortalamasıdır. Örneğin 20.000 TL kira en fazla ${tl(example.maxKurus)} olabilir. Konuttaki %25 sınırı 1 Temmuz 2024’te sona erdi.</p></section>
<section class="rent-grid" data-rent-calculator><div class="rent-panel"><form novalidate><h2>Bilgilerini gir</h2><div class="rent-stack"><div class="rent-field"><label for="rentCurrent">Mevcut aylık kira (TL)</label><input id="rentCurrent" name="current" type="text" inputmode="decimal" placeholder="Örn. 20.000" required></div><div class="rent-field"><label for="rentRenewal">Sözleşmenin yenilendiği ay</label><select id="rentRenewal" name="renewal">${monthOptions}</select></div><div class="rent-field" data-custom-cap hidden><label for="rentCustomCap">TÜİK 12 aylık ortalama TÜFE oranı (%)</label><input id="rentCustomCap" name="customCap" type="text" inputmode="decimal" placeholder="Örn. 34,88"></div><div class="rent-field"><label for="rentAgreed">Ev sahibinin istediği artış (%) <small>(isteğe bağlı)</small></label><input id="rentAgreed" name="agreed" type="text" inputmode="decimal" placeholder="Örn. 35"></div></div><p class="rent-help">Tavan, konut ve çatılı işyeri kiraları için geçerlidir. Beş yılı aşan kiralarda hâkim yeni bedeli hakkaniyete göre belirleyebilir.</p><button class="rent-submit" type="submit">Yeni kirayı hesapla</button></form></div>
<div class="rent-results" data-calculator-results hidden><h2>Sonuç</h2><div class="rent-error" data-calculator-error hidden></div><div class="rent-result-grid"><article class="rent-result rent-result--primary"><span>Yasal azami yeni kira</span><strong data-result="max">—</strong></article><article class="rent-result"><span>Azami artış tutarı</span><strong data-result="increase">—</strong></article><article class="rent-result"><span>Uygulanan tavan</span><strong data-result="cap">—</strong></article><article class="rent-result rent-result--status"><span>İstenen artış</span><strong data-result="agreed">—</strong></article></div></div></section>
<section class="rent-section"><h2>Aylara göre kira artış oranları</h2><div class="rent-table-scroll"><table><thead><tr><th>Yenileme ayı</th><th>Azami artış</th><th>Dayanak</th></tr></thead><tbody>${capRows}</tbody></table></div><p>Tablo yalnız en az iki kaynakta aynı görünen TÜİK değerlerini içerir; her ay TÜİK açıklamasıyla güncellenir. Tabloda olmayan bir ay için hesaplayıcıda “Başka bir ay” seçeneğiyle TÜİK’in o ay için açıkladığı oranı girebilirsiniz. Kaynak: <a href="${SOURCES.tuik}" rel="noopener noreferrer">TÜİK</a>, <a href="${SOURCES.latest}" rel="noopener noreferrer">Ekim 2026 açıklaması (Capital)</a>.</p></section>
<section class="rent-section"><h2>${latest.label} için örnek kira zamları</h2><div class="rent-table-scroll"><table><thead><tr><th>Mevcut kira</th><th>Azami artış</th><th>Azami yeni kira</th></tr></thead><tbody>${exampleRows}</tbody></table></div></section>
<section class="rent-section"><h2>Kira artışında hukuki çerçeve</h2><p>Türk Borçlar Kanunu m.344’e göre taraflar kira artışında anlaşabilir, ancak yenilenen kira yılında uygulanacak artış önceki kira yılındaki TÜFE 12 aylık ortalamasını geçemez. Anlaşma yoksa kira bedeli, aynı sınırı aşmamak kaydıyla hâkim tarafından belirlenir. Beş yıldan uzun süreli veya beş yıldan sonra yenilenen sözleşmelerde hâkim yeni bedeli hakkaniyete göre, emsal kiraları dikkate alarak belirleyebilir.</p><p>Bu sayfa hukuki danışmanlık değildir; anlaşmazlıkta arabulucuya veya bir avukata başvurun.</p></section>
<section class="rent-section"><h2>İlgili hesaplama araçları</h2><div class="rent-links"><a class="rent-link" href="/blog/kira-artisi-maas-butcesi/"><strong>Kira Artışı ve Maaş Bütçesi</strong><span>Yeni kiranın bütün net maaş aylarında karşılanıp karşılanmadığını sınayın.</span></a><a class="rent-link" href="/maas-zam-hesaplama/"><strong>Maaş Zam Hesaplama</strong><span>Maaş zammınız kira artışını karşılıyor mu?</span></a><a class="rent-link" href="/emekli-zammi-hesaplama/"><strong>Emekli Zammı Hesaplama</strong><span>Ocak 2027 emekli zammı.</span></a></div></section>
<section class="rent-section"><h2>Kaynaklar</h2><div class="rent-source-list"><a href="${SOURCES.tuik}" rel="noopener noreferrer">TÜİK Veri Portalı — TÜFE ↗</a><a href="${SOURCES.tbk}" rel="noopener noreferrer">6098 sayılı Türk Borçlar Kanunu (m.344) ↗</a><a href="${SOURCES.latest}" rel="noopener noreferrer">Ekim 2026 kira artış oranı açıklaması ↗</a></div></section>
<section class="rent-section rent-faq"><h2>Sık sorulan sorular</h2>${FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</section></div></main><script type="module" src="/assets/rent-calculator.js"></script></body></html>`;
}

export async function addRentCalculator(dist) {
  const dir = join(dist, RENT_ROUTE.replace(/^\/+|\/+$/g, ''));
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'index.html'), page(), 'utf8');
  console.log('Kira artış oranı hesaplayıcısı üretildi:', RENT_ROUTE);
  return Object.freeze({ generated: 1 });
}
