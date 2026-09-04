import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DATA_2026 } from '../src/data-2026.js';

const SITE = 'https://maasim.net';
const ROUTE = '/issizlik-maasi-hesaplama/';
const TITLE = 'İşsizlik Maaşı Hesaplama 2026 | Maaşım.net';
const DESCRIPTION = '2026 işsizlik maaşını son 4 aylık SGK prime esas kazanç, prim günü ve hak süresiyle hesaplayın; ne kadar ve kaç ay alabileceğinizi görün.';
const ISKUR_SOURCE = DATA_2026.sources.unemployment.url;
const MIN_WAGE_SOURCE = DATA_2026.sources.minimumWage.url;
const STAMP_SOURCE = DATA_2026.sources.stampTax.url;

const money = (kurus) => `${(kurus / 100).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
const monthlyCap = Math.round(DATA_2026.payroll.minimumGrossKurus * DATA_2026.publishedData.unemployment.monthlyGrossCapRatePpm / 1_000_000);

function monthRow(index, label) {
  return `<div class="unemployment-month"><div class="unemployment-field"><label for="pek${index}">${label} SGK prime esas kazanç (PEK)</label><input id="pek${index}" name="pek${index}" type="text" inputmode="decimal" placeholder="Örn. 33.030"></div><div class="unemployment-field"><label for="days${index}">Prim günü</label><input id="days${index}" name="days${index}" type="number" min="0" max="30" step="1" value="30"></div></div>`;
}

const FAQ = [
  ['2026 işsizlik maaşı nasıl hesaplanır?', 'İŞKUR kuralına göre günlük işsizlik ödeneği, son dört aylık prime esas kazançlardan hesaplanan günlük ortalama brüt kazancın yüzde 40’ıdır. Aylık ödeme brüt asgari ücretin yüzde 80’ini geçemez.'],
  ['2026 işsizlik maaşı en fazla ne kadar?', `2026 brüt asgari ücret ${money(DATA_2026.payroll.minimumGrossKurus)} olduğu için 30 günlük brüt işsizlik ödeneği üst sınırı ${money(monthlyCap)}’dir. Bu tutardan damga vergisi kesilir.`],
  ['İşsizlik maaşı kaç ay alınır?', 'Son üç yılda en az 600 gün işsizlik sigortası primi olanlara 180 gün (6 ay), 900 gün olanlara 240 gün (8 ay), 1080 gün olanlara 300 gün (10 ay) ödeme süresi uygulanır.'],
  ['Son 120 gün şartı nedir?', 'İş akdinin sona ermesinden önceki son 120 gün hizmet akdine tabi olma şartı aranır. Araç bu şartı hak kazanma kontrolünde ayrı olarak sorar.'],
  ['İŞKUR başvurusu kaç gün içinde yapılmalı?', 'İş akdinin sona ermesinden itibaren 30 gün içinde başvuru yapılmalıdır. Mücbir sebep dışında gecikilen süre toplam hak sahipliği süresinden düşebilir.'],
  ['İşsizlik maaşından hangi kesintiler yapılır?', 'İŞKUR açıklamalarına göre işsizlik ödeneği damga vergisi dışında vergi ve kesintiye tabi değildir.']
];

function schema() {
  const url = `${SITE}${ROUTE}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', '@id': `${url}#page`, url, name: TITLE, description: DESCRIPTION, inLanguage: 'tr-TR', datePublished: DATA_2026.checkedAt, dateModified: DATA_2026.checkedAt },
      { '@type': 'WebApplication', '@id': `${url}#calculator`, url, name: 'İşsizlik Maaşı Hesaplama 2026', applicationCategory: 'FinanceApplication', operatingSystem: 'Web', isAccessibleForFree: true, description: DESCRIPTION, offers: { '@type': 'Offer', price: 0, priceCurrency: 'TRY' } },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Hesaplama Araçları', item: `${SITE}/hesaplama-araclari/` },
        { '@type': 'ListItem', position: 3, name: 'İşsizlik Maaşı Hesaplama', item: url }
      ]},
      { '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }
    ]
  };
}

function page() {
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${TITLE}</title><meta name="description" content="${DESCRIPTION}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${SITE}${ROUTE}"><meta property="og:type" content="website"><meta property="og:title" content="İşsizlik Maaşı Hesaplama 2026"><meta property="og:description" content="${DESCRIPTION}"><meta property="og:url" content="${SITE}${ROUTE}"><meta property="og:site_name" content="Maaşım.net"><script type="application/ld+json">${JSON.stringify(schema())}</script><link rel="stylesheet" href="/assets/unemployment-calculator.css"></head><body class="unemployment-page"><main><div class="unemployment-shell"><header class="unemployment-hero"><span class="unemployment-eyebrow">2026 · İŞKUR kurallarıyla</span><h1>İşsizlik Maaşı Hesaplama 2026</h1><p>Son dört ayınızdaki SGK prime esas kazanç (PEK) ve prim günlerini girin; 30 günlük tahmini işsizlik ödeneğini, damga vergisi sonrası net tutarı ve prim gününüze göre kaç ay ödeme alabileceğinizi görün.</p><div class="unemployment-freshness"><span>Son mevzuat/veri kontrolü: ${DATA_2026.checkedAt}</span><span>2026 brüt ödeme tavanı: ${money(monthlyCap)}</span></div></header>
<section class="unemployment-grid" data-unemployment-calculator><div class="unemployment-panel"><form novalidate><h2>Bilgilerini gir</h2><p>PEK değerlerini e-Devlet SGK hizmet dökümünüzdeki prime esas kazançlardan alın. Brüt maaşınızla aynı olmak zorunda değildir.</p><div class="unemployment-months">${monthRow(1,'Son ay')}${monthRow(2,'2 ay önce')}${monthRow(3,'3 ay önce')}${monthRow(4,'4 ay önce')}</div><div class="unemployment-stack"><div class="unemployment-field"><label for="premiumDaysLast3Years">Son 3 yıldaki işsizlik sigortası prim günü</label><input id="premiumDaysLast3Years" name="premiumDaysLast3Years" type="number" min="0" max="1080" step="1" placeholder="Örn. 900"></div><div class="unemployment-field"><label for="last120DaysUnderContract">Fesihten önceki son 120 gün hizmet akdine tabi miydin?</label><select id="last120DaysUnderContract" name="last120DaysUnderContract"><option value="unknown">Emin değilim</option><option value="yes">Evet</option><option value="no">Hayır</option></select></div><div class="unemployment-field"><label for="involuntaryUnemployment">Kendi istek ve kusurun dışında mı işsiz kaldın?</label><select id="involuntaryUnemployment" name="involuntaryUnemployment"><option value="unknown">Emin değilim</option><option value="yes">Evet</option><option value="no">Hayır</option></select></div><div class="unemployment-field"><label for="applicationAfterDays">Fesihten kaç gün sonra İŞKUR'a başvurdun? <small>Opsiyonel</small></label><input id="applicationAfterDays" name="applicationAfterDays" type="number" min="0" step="1" placeholder="30 gün içinde ise örn. 10"></div></div><button class="unemployment-submit" type="submit">İşsizlik maaşını hesapla</button><div class="unemployment-help"><strong>Hak kazanma notu:</strong> Bu araç tutar ve temel koşul kontrolü yapar. İşten ayrılış kodu, somut fesih nedeni ve İŞKUR incelemesi nihai hak sahipliğini değiştirebilir.</div></form></div>
<div class="unemployment-results" data-calculator-results hidden><h2>2026 işsizlik maaşı sonucu</h2><div class="unemployment-error" data-calculator-error hidden></div><div class="unemployment-result-grid"><article class="unemployment-result"><span>Günlük ortalama brüt PEK</span><strong data-result="average-daily-gross">—</strong></article><article class="unemployment-result"><span>2026 aylık brüt üst sınır</span><strong data-result="monthly-cap">—</strong></article><article class="unemployment-result"><span>30 günlük brüt ödenek</span><strong data-result="monthly-gross">—</strong></article><article class="unemployment-result"><span>Damga vergisi</span><strong data-result="stamp-tax">—</strong></article><article class="unemployment-result unemployment-result--primary"><span>30 günlük tahmini net işsizlik ödeneği</span><strong data-result="monthly-net">—</strong></article><article class="unemployment-result"><span>Kanuni hak süresi</span><strong data-result="duration">—</strong></article><article class="unemployment-result"><span>Gecikme sonrası ödeme süresi</span><strong data-result="payable-duration">—</strong></article><article class="unemployment-result"><span>Toplam tahmini net ödeme</span><strong data-result="total-net">—</strong></article><article class="unemployment-result unemployment-result--status"><span>Temel hak kontrolü</span><strong data-result="eligibility">—</strong></article></div><div class="unemployment-warning" data-cap-warning hidden></div><ul class="unemployment-reasons" data-eligibility-reasons></ul></div></section>
<section class="unemployment-section"><h2>İşsizlik maaşı hesaplama formülü</h2><p>İŞKUR, son dört aylık prime esas kazançların toplamını bu aylardaki prim günlerine bölerek günlük ortalama brüt kazancı esas alır. Günlük işsizlik ödeneği bunun %40'ıdır. 30 günlük ödeme, 2026 brüt asgari ücretin %80'i olan ${money(monthlyCap)} tutarını aşamaz.</p><table><thead><tr><th>Adım</th><th>Hesap</th></tr></thead><tbody><tr><td>Günlük ortalama brüt kazanç</td><td>Son 4 ay toplam PEK ÷ son 4 ay toplam prim günü</td></tr><tr><td>Günlük brüt ödenek</td><td>Günlük ortalama brüt kazanç × %40</td></tr><tr><td>30 günlük brüt ödenek</td><td>Günlük ödenek × 30; en fazla ${money(monthlyCap)}</td></tr><tr><td>Net tahmin</td><td>Brüt ödenek − damga vergisi</td></tr></tbody></table></section>
<section class="unemployment-section"><h2>Kaç ay işsizlik maaşı alınır?</h2><table><thead><tr><th>Son 3 yıldaki prim günü</th><th>Ödeme süresi</th></tr></thead><tbody><tr><td>600–899 gün</td><td>180 gün / 6 ay</td></tr><tr><td>900–1079 gün</td><td>240 gün / 8 ay</td></tr><tr><td>1080 gün</td><td>300 gün / 10 ay</td></tr></tbody></table><p>600 günün altındaki prim süresinde temel prim şartı sağlanmaz. Ayrıca son 120 gün hizmet akdine tabi olma ve kendi istek/kusuru dışında işsiz kalma koşulları da ayrı ayrı aranır.</p></section>
<section class="unemployment-section"><h2>İlgili hesaplama araçları</h2><div class="unemployment-links"><a class="unemployment-link" href="/tazminat-hesaplama/"><strong>Tazminat Hesaplama</strong><span>Kıdem ve ihbarı birlikte hesapla.</span></a><a class="unemployment-link" href="/kidem-tazminati-hesaplama/"><strong>Kıdem Tazminatı</strong><span>Fiilî hizmet günü ve 2026 tavanıyla hesapla.</span></a><a class="unemployment-link" href="/hesaplama-araclari/"><strong>Tüm Hesaplama Araçları</strong><span>Maaş, vergi ve çalışan hakları araçlarını aç.</span></a></div></section>
<section class="unemployment-section"><h2>Resmî kaynaklar</h2><div class="unemployment-source-list"><a href="${ISKUR_SOURCE}" rel="noopener noreferrer">İŞKUR — İşsizlik Sigortası Hizmetleri ↗</a><a href="${MIN_WAGE_SOURCE}" rel="noopener noreferrer">Çalışma ve Sosyal Güvenlik Bakanlığı — 2026 Asgari Ücret ↗</a><a href="${STAMP_SOURCE}" rel="noopener noreferrer">Gelir İdaresi Başkanlığı — 2026 Damga Vergisi ↗</a></div><p class="unemployment-disclaimer"><strong>Önemli:</strong> Hesaplanan tutar tahmindir. Nihai işsizlik ödeneği ve hak sahipliği, SGK kayıtları, fesih nedeni, başvuru tarihi ve İŞKUR değerlendirmesine göre belirlenir.</p></section>
<section class="unemployment-section unemployment-faq"><h2>Sık sorulan sorular</h2>${FAQ.map(([q,a])=>`<details><summary>${q}</summary><p>${a}</p></details>`).join('')}</section></div></main><script type="module" src="/assets/unemployment-calculator.js"></script></body></html>`;
}

export async function addUnemploymentCalculator(dist) {
  const dir = join(dist, ROUTE.replace(/^\/+|\/+$/g, ''));
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'index.html'), page(), 'utf8');
  console.log('İşsizlik maaşı hesaplayıcı sayfası üretildi:', ROUTE);
  return Object.freeze({ generated: 1, path: ROUTE });
}
