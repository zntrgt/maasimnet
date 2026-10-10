import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { calculateBorrowing, dailyBounds, DAILY_FLOOR_KURUS, DAILY_CEILING_KURUS, BORROWING_CHECKED_AT } from '../src/borrowing-engine.js';

const SITE = 'https://maasim.net';
export const BORROWING_ROUTE = '/borclanma-hesaplama/';
const TITLE = 'Askerlik ve Doğum Borçlanması Hesaplama 2026 | Maaşım.net';
const H1 = 'Askerlik ve Doğum Borçlanması Hesaplama 2026';
const ask = dailyBounds('askerlik');
const dog = dailyBounds('dogum');
const tl = (kurus) => `${(kurus / 100).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
const DESCRIPTION = `2026 askerlik borçlanması günlük en az ${tl(ask.minKurus)} (%45), doğum borçlanması ${tl(dog.minKurus)} (%32). Borçlanma tutarını ve emeklilik başlangıcınıza etkisini hesaplayın.`;
const SOURCES = Object.freeze({
  law7566: 'https://www.turmob.org.tr/ekutuphane/Read/b1e7e30a-eecd-4ef4-b401-dacb35fec672',
  sgk: 'https://www.sgk.gov.tr/',
  law5510: 'https://www.mevzuat.gov.tr/mevzuatmetin/1.5.5510.pdf'
});
const esc = (value = '') => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmtDate = (iso) => new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));

const askRows = [360, 450, 540].map((d) => { const r = calculateBorrowing({ type: 'askerlik', days: d }); return `<tr><td>${d} gün (${d / 30} ay)</td><td><b>${tl(r.minTotalKurus)}</b></td><td>${tl(r.maxTotalKurus)}</td></tr>`; }).join('');
const dogRows = [1, 2, 3].map((c) => { const r = calculateBorrowing({ type: 'dogum', children: c, days: 720 }); return `<tr><td>${c} çocuk (${(c * 720).toLocaleString('tr-TR')} gün)</td><td><b>${tl(r.minTotalKurus)}</b></td><td>${tl(r.maxTotalKurus)}</td></tr>`; }).join('');

const FAQ = [
  ['2026 askerlik borçlanması ne kadar?', `1 Ocak 2026’dan itibaren askerlik borçlanmasında oran %45. Günlük en düşük tutar ${tl(ask.minKurus)}, en yüksek ${tl(ask.maxKurus)}. 18 ay (540 gün) için en düşük tutar ${tl(calculateBorrowing({ type: 'askerlik', days: 540 }).minTotalKurus)}.`],
  ['2026 doğum borçlanması ne kadar?', `Doğum borçlanmasında oran %32’de kaldı. Günlük en düşük tutar ${tl(dog.minKurus)}; bir çocuk için 720 gün en düşük ${tl(calculateBorrowing({ type: 'dogum', children: 1, days: 720 }).minTotalKurus)}.`],
  ['Askerlik borçlanması neden pahalandı?', '19 Aralık 2025 tarihli Resmî Gazete’de yayımlanan 7566 sayılı Kanunla askerlik ve doğum dışındaki borçlanmalarda prim oranı 1 Ocak 2026’dan itibaren %32’den %45’e yükseltildi.'],
  ['Askerlik borçlanması emeklilik başlangıcını geriye çeker mi?', 'İlk sigorta girişinden önce yapılan askerlik borçlanırsa, sigortalılık başlangıcı borçlanılan gün sayısı kadar geriye gider. Bu, bazı kişileri 8 Eylül 1999 öncesine taşıyarak EYT kapsamına ya da 30 Nisan 2008 öncesine taşıyarak 1999–2008 kurallarına sokabilir.'],
  ['Doğum borçlanmasında kaç gün borçlanılabilir?', 'İlk sigorta girişinden sonraki her doğum için, doğumdan sonraki 2 yıl (720 gün) içinde çalışılmayan süreler, en fazla 3 doğum için borçlanılabilir.'],
  ['Borçlanma tutarı ne zaman ödenir?', 'SGK’nın borç tutarını bildirmesinden itibaren 1 ay içinde ödenmelidir; süresinde ödenmezse başvuru geçersiz sayılır ve yeniden başvurmak gerekir. Tutarın tamamı ya da ödenen kısma karşılık gelen gün kadarı sayılır.']
];

function schema() {
  const url = `${SITE}${BORROWING_ROUTE}`;
  return { '@context': 'https://schema.org', '@graph': [
    { '@type': 'WebPage', '@id': `${url}#page`, url, name: TITLE, description: DESCRIPTION, inLanguage: 'tr-TR', datePublished: BORROWING_CHECKED_AT, dateModified: BORROWING_CHECKED_AT },
    { '@type': 'WebApplication', '@id': `${url}#calculator`, url, name: 'Borçlanma Hesaplama', applicationCategory: 'FinanceApplication', operatingSystem: 'Web', isAccessibleForFree: true, description: DESCRIPTION, offers: { '@type': 'Offer', price: 0, priceCurrency: 'TRY' } },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Hesaplama Araçları', item: `${SITE}/hesaplama-araclari/` },
      { '@type': 'ListItem', position: 3, name: 'Borçlanma Hesaplama', item: url }
    ] },
    { '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }
  ] };
}

function page() {
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(TITLE)}</title><meta name="description" content="${esc(DESCRIPTION)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${SITE}${BORROWING_ROUTE}"><meta property="og:type" content="website"><meta property="og:title" content="${esc(H1)}"><meta property="og:description" content="${esc(DESCRIPTION)}"><meta property="og:url" content="${SITE}${BORROWING_ROUTE}"><meta property="og:site_name" content="Maaşım.net"><script type="application/ld+json">${JSON.stringify(schema())}</script><link rel="stylesheet" href="/assets/borrowing-calculator.css"></head><body class="borrow-page"><main><div class="borrow-shell">
<header class="borrow-hero"><span class="borrow-eyebrow">5510 m.41 · 7566 sayılı Kanun</span><h1>${H1}</h1><p>Askerlik veya doğum borçlanmasının 2026 tutarını hesaplayın. İlk işe girişinizden önceki askerliği borçlanırsanız, emeklilik başlangıç tarihinizin ne kadar geriye gideceğini de görün.</p><div class="borrow-freshness"><span>Son kontrol: ${fmtDate(BORROWING_CHECKED_AT)}</span><span>Askerlik %45 · Doğum %32</span></div></header>
<section class="borrow-answer"><h2>Kısa cevap</h2><p>1 Ocak 2026’dan itibaren <strong>askerlik borçlanması</strong> günlük en az <strong>${tl(ask.minKurus)}</strong> (brüt asgari ücretin günlüğünün %45’i); 18 ay için en az ${tl(calculateBorrowing({ type: 'askerlik', days: 540 }).minTotalKurus)}. <strong>Doğum borçlanması</strong> %32’de kaldı: günlük en az <strong>${tl(dog.minKurus)}</strong>, bir çocuk için 720 gün en az ${tl(calculateBorrowing({ type: 'dogum', children: 1, days: 720 }).minTotalKurus)}. Oran artışı 7566 sayılı Kanunla geldi.</p></section>
<section class="borrow-grid" data-borrow-calculator><div class="borrow-panel"><form novalidate><h2>Bilgilerini gir</h2><div class="borrow-stack"><div class="borrow-field"><label for="bType">Borçlanma türü</label><select id="bType" name="type"><option value="askerlik">Askerlik (er/erbaş)</option><option value="dogum">Doğum</option></select></div>
<div class="borrow-field" data-only="askerlik"><label for="bDays">Askerlik süresi (gün)</label><input id="bDays" name="days" type="number" inputmode="numeric" min="1" max="1080" step="1" placeholder="Örn. 540"></div>
<div class="borrow-field" data-only="dogum" hidden><label for="bChildren">Borçlanılacak doğum sayısı</label><select id="bChildren" name="children"><option value="1">1</option><option value="2">2</option><option value="3">3</option></select></div>
<div class="borrow-field" data-only="dogum" hidden><label for="bDogumDays">Çocuk başına gün <small>(en fazla 720)</small></label><input id="bDogumDays" name="dogumDays" type="number" inputmode="numeric" min="1" max="720" step="1" value="720"></div>
<div class="borrow-field"><label for="bPek">Günlük kazanç (TL) <small>(boş bırakırsanız en düşük tutar)</small></label><input id="bPek" name="pek" type="text" inputmode="decimal" placeholder="${(DAILY_FLOOR_KURUS / 100).toLocaleString('tr-TR')} – ${(DAILY_CEILING_KURUS / 100).toLocaleString('tr-TR')}"></div>
<div class="borrow-field" data-only="askerlik"><label><input type="checkbox" name="before"> Askerliğim ilk sigorta girişimden önceydi</label></div>
<div class="borrow-field" data-only="askerlik" data-first hidden><label for="bFirst">İlk sigorta giriş tarihi</label><input id="bFirst" name="first" type="date" min="1960-01-01"></div></div><p class="borrow-help">Daha yüksek günlük kazanç seçmek ileride bağlanacak aylığı artırabilir, ancak borçlanma tutarını da artırır.</p><button class="borrow-submit" type="submit">Borçlanmayı hesapla</button></form></div>
<div class="borrow-results" data-calculator-results hidden><h2>Sonuç</h2><div class="borrow-error" data-calculator-error hidden></div><div class="borrow-result-grid"><article class="borrow-result borrow-result--primary"><span>Ödenecek toplam tutar</span><strong data-result="total">—</strong></article><article class="borrow-result"><span>Günlük tutar</span><strong data-result="daily">—</strong></article><article class="borrow-result"><span>Kazanılacak prim günü</span><strong data-result="days">—</strong></article><article class="borrow-result borrow-result--status"><span>Sigortalılık başlangıcı</span><strong data-result="shift">—</strong></article></div></div></section>
<section class="borrow-section"><h2>2026 askerlik borçlanması tutarları (%45)</h2><div class="borrow-table-scroll"><table><thead><tr><th>Süre</th><th>En düşük</th><th>En yüksek</th></tr></thead><tbody>${askRows}</tbody></table></div><p>Günlük tutar: en düşük ${tl(ask.minKurus)}, en yüksek ${tl(ask.maxKurus)}.</p></section>
<section class="borrow-section"><h2>2026 doğum borçlanması tutarları (%32)</h2><div class="borrow-table-scroll"><table><thead><tr><th>Doğum</th><th>En düşük</th><th>En yüksek</th></tr></thead><tbody>${dogRows}</tbody></table></div><p>Günlük tutar: en düşük ${tl(dog.minKurus)}, en yüksek ${tl(dog.maxKurus)}. Doğum, ilk sigorta girişinden sonra olmalı; doğumdan sonraki 2 yıl içinde çalışılmayan süreler borçlanılır.</p></section>
<section class="borrow-section"><h2>Borçlanma emeklilik tarihini nasıl etkiler?</h2><p>Borçlanılan günler prim gününüze eklenir. İlk sigorta girişinizden önceki askerliği borçlanırsanız sigortalılık başlangıcınız da bu gün sayısı kadar geriye gider; bu, 8 Eylül 1999 sınırını geçenleri EYT kapsamına, 30 Nisan 2008 sınırını geçenleri 1999–2008 kurallarına taşıyabilir. Yeni başlangıç tarihiyle <a href="/emeklilik-hesaplama/">emeklilik tarihinizi hesaplayın</a>.</p><p><strong>Kapsam dışı:</strong> Yurt dışı borçlanması (farklı kural ve kur hesabı), yedek subay okulu, doktora/uzmanlık, avukatlık stajı ve diğer borçlanma türleri; bu türlerde de 2026’dan itibaren oran %45’tir.</p></section>
<section class="borrow-section"><h2>İlgili hesaplama araçları</h2><div class="borrow-links"><a class="borrow-link" href="/emeklilik-hesaplama/"><strong>Emeklilik Hesaplama</strong><span>Borçlanmadan sonra ne zaman emekli olacağınızı görün.</span></a><a class="borrow-link" href="/kademeli-emeklilik/"><strong>Kademeli Emeklilik</strong><span>1999–2008 girişliler için son durum.</span></a><a class="borrow-link" href="/emekli-zammi-hesaplama/"><strong>Emekli Zammı Hesaplama</strong><span>Ocak 2027 SSK ve Bağ-Kur zammı.</span></a></div></section>
<section class="borrow-section"><h2>Kaynaklar</h2><div class="borrow-source-list"><a href="${SOURCES.law7566}" rel="noopener noreferrer">SGK hizmet borçlanma tutarları 01.01.2026 (7566 sayılı Kanun) ↗</a><a href="${SOURCES.law5510}" rel="noopener noreferrer">5510 sayılı Kanun (m.41) ↗</a></div><p class="borrow-disclaimer">Kesin borç tutarı SGK’nın tahakkuk bildirimiyle belli olur; bu sayfa bilgilendirme amaçlıdır.</p></section>
<section class="borrow-section borrow-faq"><h2>Sık sorulan sorular</h2>${FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</section></div></main><script type="module" src="/assets/borrowing-calculator.js"></script></body></html>`;
}

export async function addBorrowingCalculator(dist) {
  const dir = join(dist, BORROWING_ROUTE.replace(/^\/+|\/+$/g, ''));
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'index.html'), page(), 'utf8');
  console.log('Borçlanma hesaplayıcısı üretildi:', BORROWING_ROUTE);
  return Object.freeze({ generated: 1 });
}
