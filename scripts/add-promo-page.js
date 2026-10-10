import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PROMOS, PROMO_SOURCES, PROMO_CHECKED_AT, COMMIT_MONTHS } from '../src/promo-data.js';
import { MIN_PENSION_KURUS } from '../src/zam-2027-engine.js';

const SITE = 'https://maasim.net';
export const PROMO_ROUTE = '/emekli-promosyonu/';

const esc = (value = '') => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const tl = (value) => `${Number(value).toLocaleString('tr-TR')} TL`;
const fmtDate = (iso) => new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));
const MONTH = new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${PROMO_CHECKED_AT}T00:00:00Z`)).replace(/^./, (c) => c.toLocaleUpperCase('tr-TR'));
const MIN_PENSION_TL = MIN_PENSION_KURUS / 100;

// Kısa cevap için hesaplanan özetler: dilimi açık bankalarda en üst dilim, kamu bankaları, ek koşullarla en yüksek toplam.
const exactTop = PROMOS.filter((p) => p.bands).map((p) => ({ bank: p.bank, amount: p.bands.at(-1).amount })).sort((a, b) => b.amount - a.amount);
const bestExact = exactTop[0];
const bestTotal = [...PROMOS].filter((p) => p.totalMax).sort((a, b) => b.totalMax - a.totalMax)[0];
const PUBLIC_BANKS = ['ziraat', 'halkbank'];
const publicMax = Math.max(...PROMOS.filter((p) => PUBLIC_BANKS.includes(p.key)).map((p) => p.max));
const expiring = PROMOS.filter((p) => p.until).sort((a, b) => a.until.localeCompare(b.until));

const page = {
  title: `Emekli Promosyonu ${MONTH}: Hangi Banka Ne Kadar Veriyor? | Maaşım.net`,
  h1: `Emekli Promosyonu ${MONTH}: Banka Banka Güncel Tutarlar`,
  // Açıklamada kesme işareti kullanılmaz: meta kalite betiği içeriği ilk tırnakta keser.
  description: `${MONTH} emekli promosyonları: ${PROMOS.length} bankanın koşulsuz nakit ve ek koşullu tutarları, maaş dilimi ve taahhüt iadesi hesaplama. Kaynaklı ve tarihli.`,
  faq: [
    ['En yüksek emekli promosyonunu hangi banka veriyor?', `Maaş dilimleri açıklanan bankalar arasında koşulsuz nakitte en yüksek tutar ${bestExact.bank} (${tl(bestExact.amount)}, 20.000 TL ve üzeri aylıkta). Ek koşullarla birlikte en yüksek toplamı ${bestTotal.bank} duyuruyor (${tl(bestTotal.totalMax)}’ye kadar). Kamu bankalarında koşulsuz nakit ${tl(publicMax)}’ye kadar.`],
    ['Emekli promosyonu tamamen koşulsuz mu?', 'Hayır. Bankalar bir temel nakit tutarı ve buna ek olarak fatura talimatı, kredi kartı harcaması, sigorta ya da kredi kullanımı gibi koşullara bağlı ödüller veriyor. Haberlerdeki “X TL’ye kadar” tutarları çoğunlukla bu koşulların tamamını yerine getirene ödenen toplamdır.'],
    ['Promosyon aldıktan sonra bankayı değiştirirsem iade eder miyim?', `Promosyon genellikle ${COMMIT_MONTHS / 12} yıllık maaş taahhüdüyle verilir. Taahhüt dolmadan maaşınızı başka bankaya taşırsanız kalan süreye düşen kısmı iade etmeniz istenebilir. Kesin koşul imzaladığınız sözleşmede yazar.`],
    ['Hangi maaş dilimindeyim?', `Bankalar dilimleri yatan aylık tutara göre belirler. Kendi aylığını alan SSK ve Bağ-Kur emeklilerinin aylığı en az ${tl(MIN_PENSION_TL)} olduğu için çoğu bankanın en üst dilimine (20.000 TL ve üzeri) girer. Dul veya yetim aylığı payı alanlar daha alt dilimde olabilir.`],
    ['Haberlerde neden farklı promosyon tutarları yazıyor?', 'Kampanyalar ay içinde değişebiliyor ve haberler koşulsuz tutarla koşullu toplamı farklı biçimde topluyor. Bu sayfada her tutar en az iki güncel kaynakta karşılaştırılır; kaynaklar arasında fark varsa satırın notunda belirtilir.']
  ]
};

function schema() {
  const url = `${SITE}${PROMO_ROUTE}`;
  return { '@context': 'https://schema.org', '@graph': [
    { '@type': 'WebPage', '@id': `${url}#page`, url, name: page.title, description: page.description, inLanguage: 'tr-TR', datePublished: '2026-10-10', dateModified: PROMO_CHECKED_AT },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Hesaplama Araçları', item: `${SITE}/hesaplama-araclari/` },
      { '@type': 'ListItem', position: 3, name: 'Emekli Promosyonu', item: url }
    ] },
    { '@type': 'FAQPage', mainEntity: page.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }
  ] };
}

const rangeText = (p) => (p.min === p.max ? tl(p.max) : `${tl(p.min)} – ${tl(p.max)}`);
const sourceLinks = (keys) => keys.map((k) => `<a href="${esc(PROMO_SOURCES[k].url)}" rel="noopener noreferrer">${esc(PROMO_SOURCES[k].label)} (${fmtDate(PROMO_SOURCES[k].date)})</a>`).join(', ');
const tableRank = (p) => (p.bands ? 0 : p.uncertain ? 2 : 1);
const fullTable = [...PROMOS].sort((a, b) => (tableRank(a) - tableRank(b)) || (b.max - a.max)).map((p) => `<tr><td><strong>${esc(p.bank)}</strong><br><a href="${esc(p.site)}" rel="noopener noreferrer nofollow">Bankanın sitesi ↗</a></td><td>${rangeText(p)}${p.uncertain ? '<br><small>Bir kısmı koşullu olabilir</small>' : ''}${p.bands ? '<br><small>Dilimler: ' + p.bands.map((b, i) => `${i === 0 ? (p.minBandFrom ? `${tl(p.minBandFrom)}–${tl(b.below)}` : `${tl(b.below)} altı`) : b.below === Infinity ? `${tl(p.bands[i - 1].below)} ve üzeri` : `${tl(p.bands[i - 1].below)}–${tl(b.below)}`}: ${tl(b.amount)}`).join(' · ') + '</small>' : ''}</td><td>${p.totalMax ? tl(p.totalMax) : '—'}</td><td>${esc(p.extras)}${p.note ? `<br><small><strong>Kaynak farkı:</strong> ${esc(p.note)}</small>` : ''}</td><td><small>${sourceLinks(p.sources)}</small></td></tr>`).join('');

function html() {
  const answer = `<p><strong>Koşulsuz nakitte en yüksek tutar ${bestExact.bank}: ${tl(bestExact.amount)}</strong> (20.000 TL ve üzeri aylıkta). Kamu bankaları Ziraat ve Halkbank'ta koşulsuz nakit ${tl(publicMax)}'ye kadar. Ek koşullarla en yüksek toplamı ${bestTotal.bank} duyuruyor: ${tl(bestTotal.totalMax)}'ye kadar.</p><p>Kendi aylığını alan SSK ve Bağ-Kur emeklilerinin aylığı en az ${tl(MIN_PENSION_TL)} olduğu için çoğu bankanın <strong>en üst dilimindedir</strong>. “X TL'ye kadar” tutarları çoğunlukla fatura talimatı, kart harcaması veya sigorta gibi koşulların tamamını yerine getirenlere ödenir.${expiring.length ? ` Süresi yaklaşan kampanya: ${expiring.map((p) => `${p.bank} (son gün ${fmtDate(p.until)})`).join(', ')}.` : ''}</p>`;
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(page.title)}</title><meta name="description" content="${esc(page.description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${SITE}${PROMO_ROUTE}"><meta property="og:type" content="website"><meta property="og:title" content="${esc(page.h1)}"><meta property="og:description" content="${esc(page.description)}"><meta property="og:url" content="${SITE}${PROMO_ROUTE}"><meta property="og:site_name" content="Maaşım.net"><script type="application/ld+json">${JSON.stringify(schema())}</script><link rel="stylesheet" href="/assets/zam-calculator.css"></head><body class="zam-page"><main><div class="zam-shell">
<header class="zam-hero"><span class="zam-eyebrow">Emekli · Banka promosyonu · ${MONTH}</span><h1>${page.h1}</h1><p>Aylık emekli maaşınızı girin; dilimi açıklanan bankalarda size düşen koşulsuz promosyonu, diğerlerinde üst tutarı görün. Erken taşırsanız iade edeceğiniz tutarı da hesaplayın.</p><div class="zam-freshness"><span>Son kontrol: ${fmtDate(PROMO_CHECKED_AT)}</span><span>${PROMOS.length} banka · iki haftada bir güncellenir</span></div></header>
<section class="zam-answer"><p class="zam-disclaimer"><strong>Başvurmadan önce bankanın kendi sitesinden kontrol edin.</strong> Promosyon kampanyaları sık değişir. Bu sayfadaki tutarlar haber kaynaklarından derlenir ve her tutar en az iki güncel kaynakta karşılaştırılır; bankanın resmî kampanya koşulları ve imzalayacağınız sözleşme esastır.</p><h2>Kısa cevap</h2>${answer}</section>
<section class="zam-grid" data-promo-calculator><div class="zam-panel"><form novalidate><h2>Maaşınıza göre karşılaştırın</h2><div class="zam-stack"><div class="zam-field"><label for="pension">Aylık emekli maaşınız (TL)</label><input id="pension" name="pension" type="text" inputmode="decimal" placeholder="Örn. ${Math.round(MIN_PENSION_TL).toLocaleString('tr-TR')}" required></div><div class="zam-field"><label for="stayed">Erken taşıma: bankada kaç ay kaldınız? (isteğe bağlı)</label><input id="stayed" name="stayed" type="text" inputmode="numeric" placeholder="Örn. 12"></div><div class="zam-field"><label for="received">Aldığınız promosyon (TL, isteğe bağlı)</label><input id="received" name="received" type="text" inputmode="decimal" placeholder="Boşsa en yüksek tutar kullanılır"></div></div><p class="zam-help">İade hesabı ${COMMIT_MONTHS} aylık taahhüt ve kalan aylara orantılı iade varsayar; kendi sözleşmenizdeki koşul esastır.</p><button class="zam-submit" type="submit">Promosyonları karşılaştır</button></form></div>
<div class="zam-results" data-calculator-results hidden><h2>Sizin diliminiz için</h2><div class="zam-error" data-calculator-error hidden></div><div class="zam-result-grid"><article class="zam-result zam-result--primary"><span>Dilimi açık bankalarda en yüksek koşulsuz</span><strong data-result="best">—</strong></article><article class="zam-result"><span>Erken taşımada tahmini iade</span><strong data-result="refund">—</strong></article></div><div class="zam-table-scroll"><table><thead><tr><th>Banka</th><th>Koşulsuz nakit</th><th>Ek koşullarla en fazla</th><th>Kaynak</th></tr></thead><tbody data-result="table"></tbody></table></div><p class="zam-disclaimer"><strong>Önemli:</strong> Tutarlar ${fmtDate(PROMO_CHECKED_AT)} tarihli haberlerden derlendi. Başvurmadan önce bankanın kendi sitesinden kontrol edin.</p></div></section>
<section class="zam-section"><h2>${MONTH} emekli promosyonu tablosu</h2><div class="zam-table-scroll"><table><thead><tr><th>Banka</th><th>Koşulsuz nakit (maaşa göre)</th><th>Ek koşullarla en fazla</th><th>Koşullar ve notlar</th><th>Kaynak</th></tr></thead><tbody>${fullTable}</tbody></table></div><p>VakıfBank için ${MONTH} dönemine ait güncel tutar iki kaynakta doğrulanamadığından tabloda yer almıyor.</p></section>
<section class="zam-section"><h2>Promosyon seçerken nelere dikkat etmeli?</h2><ul><li><strong>Koşulsuz ve koşullu tutarı ayırın.</strong> Karşılaştırmayı koşulsuz nakitle yapın; ek ödüllerin her biri ayrı bir ürün veya harcama ister.</li><li><strong>Ek koşulun maliyetini hesaplayın.</strong> Sigorta primi, kredi faizi veya ek hesap kullanımı, kazanacağınız ödülden pahalı olabilir.</li><li><strong>“Toplam avantaj” nakit değildir.</strong> Faizsiz kredi, puan veya taksitli nakit avans gibi kalemler toplam tutara eklenerek duyurulabilir.</li><li><strong>Taahhüt süresine bakın.</strong> Promosyon genellikle ${COMMIT_MONTHS / 12} yıllık maaş taahhüdüyle verilir; erken ayrılmada kalan süreye düşen kısım geri istenebilir.</li><li><strong>Kampanya tarihini kontrol edin.</strong> Bazı kampanyaların son başvuru günü ay içinde dolar.</li></ul></section>
<section class="zam-section"><h2>Bu tablo nasıl hazırlanıyor?</h2><p>Bankaların kampanya sayfaları sık değiştiği için tutarlar güncel haber kaynaklarından derlenir. Her tutar en az iki kaynakta karşılaştırılır; kaynaklar çelişirse en yeni tarihli iki kaynağın ortak değeri yazılır ve fark satırın notunda belirtilir. Tablo ayın 1'i ve 15'i civarında güncellenir. Hata fark ederseniz <a href="/iletisim/">bize yazın</a>.</p></section>
<section class="zam-section"><h2>İlgili sayfalar</h2><div class="zam-links"><a class="zam-link" href="/en-dusuk-emekli-maasi/"><strong>En Düşük Emekli Maaşı</strong><span>Taban aylık ve Ocak 2027 senaryoları.</span></a><a class="zam-link" href="/emekli-zammi-hesaplama/"><strong>Emekli Zammı Hesaplama</strong><span>Ocak 2027 SSK ve Bağ-Kur zammı.</span></a><a class="zam-link" href="/emekli-calisan-maas-hesaplama/"><strong>Emekli Çalışan Maaş Hesaplama</strong><span>Emekliyken çalışınca net maaşınız.</span></a></div></section>
<section class="zam-section"><h2>Kaynaklar</h2><div class="zam-source-list">${Object.values(PROMO_SOURCES).map((s) => `<a href="${esc(s.url)}" rel="noopener noreferrer">${esc(s.label)}, ${fmtDate(s.date)} ↗</a>`).join('')}</div><p class="zam-disclaimer">Bu sayfa bilgilendirme amaçlıdır ve bir bankayı önermez.</p></section>
<section class="zam-section zam-faq"><h2>Sık sorulan sorular</h2>${page.faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</section></div></main><script type="module" src="/assets/promo-calculator.js"></script></body></html>`;
}

export async function addPromoPage(dist) {
  const dir = join(dist, PROMO_ROUTE.replace(/^\/+|\/+$/g, ''));
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'index.html'), html(), 'utf8');
  console.log('Emekli promosyonu sayfası üretildi:', PROMO_ROUTE);
  return Object.freeze({ generated: 1 });
}
