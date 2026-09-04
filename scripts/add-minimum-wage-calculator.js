import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DATA_2026 } from '../src/data-2026.js';

const SITE = 'https://maasim.net';
const ROUTE = '/asgari-ucret-hesaplama/';
const TITLE = 'Asgari Ücret Hesaplama 2026: Brüt ve Net | Maaşım.net';
const DESCRIPTION = '2026 net ve brüt asgari ücreti, SGK ve işsizlik primi kesintilerini, günlük ve saatlik karşılıkları ve seçtiğiniz dönem toplamını hesaplayın.';
const MIN_WAGE_SOURCE = DATA_2026.sources.minimumWage.url;
const SGK_SOURCE = DATA_2026.sources.sgk.url;
const TAX_EXEMPTION_SOURCE = DATA_2026.sources.minimumWageTaxExemption.url;

const FAQ = [
  ['2026 net asgari ücret ne kadar?', '1 Ocak 2026–31 Aralık 2026 döneminde aylık brüt asgari ücret 33.030,00 TL, net asgari ücret 28.075,50 TL’dir.'],
  ['2026 asgari ücrette çalışan SGK primi ne kadar?', 'Aylık brüt 33.030 TL üzerinden çalışan SGK primi yüzde 14 ile 4.624,20 TL’dir. İşsizlik sigortası çalışan payı yüzde 1 ile 330,30 TL’dir.'],
  ['Asgari ücretten gelir vergisi kesiliyor mu?', 'Asgari ücrete isabet eden ücret gelir vergisi ve damga vergisi tutarları ilgili yasal istisna kapsamında olduğundan standart asgari ücret bordrosunda ödenecek gelir ve damga vergisi sıfırdır.'],
  ['2026 günlük asgari ücret ne kadar?', 'Brüt günlük asgari ücret 1.101,00 TL’dir. Standart aylık net tutarın 30’a bölünmesiyle günlük net karşılık 935,85 TL’dir.'],
  ['2026 saatlik asgari ücret ne kadar?', 'Aylık 225 saatlik standart ücret bölümü üzerinden brüt saatlik karşılık 146,80 TL, net saatlik karşılık 124,78 TL’dir. Bu değer bordro karşılığıdır; fazla mesai için ayrı zamlı katsayılar uygulanır.'],
  ['İşverene asgari ücret maliyeti burada hesaplanıyor mu?', 'Bu sayfa çalışan tarafındaki brüt-net asgari ücret niyetini hedefler. İşveren SGK teşviki ve toplam maliyet için ayrı Asgari Ücret İşveren Maliyeti aracını kullanabilirsiniz.']
];

function monthOptions() {
  return Array.from({ length: 12 }, (_, index) => `<option value="${index + 1}">${index + 1} ay</option>`).join('');
}

function schema() {
  const url = `${SITE}${ROUTE}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', '@id': `${url}#page`, url, name: TITLE, description: DESCRIPTION, inLanguage: 'tr-TR', datePublished: DATA_2026.checkedAt, dateModified: DATA_2026.checkedAt },
      { '@type': 'WebApplication', '@id': `${url}#calculator`, url, name: 'Asgari Ücret Hesaplama 2026', applicationCategory: 'FinanceApplication', operatingSystem: 'Web', isAccessibleForFree: true, description: DESCRIPTION, offers: { '@type': 'Offer', price: 0, priceCurrency: 'TRY' } },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Hesaplama Araçları', item: `${SITE}/hesaplama-araclari/` },
        { '@type': 'ListItem', position: 3, name: 'Asgari Ücret Hesaplama', item: url }
      ]},
      { '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }
    ]
  };
}

function page() {
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${TITLE}</title><meta name="description" content="${DESCRIPTION}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${SITE}${ROUTE}"><meta property="og:type" content="website"><meta property="og:title" content="Asgari Ücret Hesaplama 2026"><meta property="og:description" content="${DESCRIPTION}"><meta property="og:url" content="${SITE}${ROUTE}"><meta property="og:site_name" content="Maaşım.net"><script type="application/ld+json">${JSON.stringify(schema())}</script><link rel="stylesheet" href="/assets/minimum-wage-calculator.css"></head><body class="minimum-wage-page"><main><div class="minimum-wage-shell"><header class="minimum-wage-hero"><span class="minimum-wage-eyebrow">2026 · Resmî asgari ücret</span><h1>Asgari Ücret Hesaplama 2026</h1><p>2026 brüt ve net asgari ücreti, çalışan kesintilerini, günlük/saatlik karşılıkları ve 1–12 aylık toplamı resmî verilerle görün.</p><div class="minimum-wage-freshness"><span>Geçerlilik: 01.01.2026–31.12.2026</span><span>Son veri kontrolü: ${DATA_2026.checkedAt}</span></div></header>
<section class="minimum-wage-grid" data-minimum-wage-calculator><div class="minimum-wage-panel"><form novalidate><h2>Dönem toplamını hesapla</h2><p>Aylık resmî asgari ücret sabittir. Kaç aylık toplam görmek istediğinizi seçin.</p><div class="minimum-wage-field"><label for="months">Dönem</label><select id="months" name="months">${monthOptions()}</select></div><button class="minimum-wage-submit" type="submit">Toplamı hesapla</button><div class="minimum-wage-help"><strong>Çalışan tarafı:</strong> Bu araç net/brüt asgari ücreti gösterir. İşveren maliyeti ve teşvikler ayrı hesaplayıcıda tutulur.</div></form></div>
<div class="minimum-wage-results" data-calculator-results><h2>2026 asgari ücret sonucu</h2><div class="minimum-wage-error" data-calculator-error hidden></div><div class="minimum-wage-result-grid"><article class="minimum-wage-result"><span>Aylık brüt asgari ücret</span><strong data-result="monthly-gross">—</strong></article><article class="minimum-wage-result"><span>Çalışan SGK primi (%14)</span><strong data-result="sgk">—</strong></article><article class="minimum-wage-result"><span>İşsizlik sigortası (%1)</span><strong data-result="unemployment">—</strong></article><article class="minimum-wage-result"><span>Gelir vergisi</span><strong data-result="income-tax">—</strong></article><article class="minimum-wage-result"><span>Damga vergisi</span><strong data-result="stamp-tax">—</strong></article><article class="minimum-wage-result minimum-wage-result--primary"><span>Aylık net asgari ücret</span><strong data-result="monthly-net">—</strong></article><article class="minimum-wage-result"><span>Günlük brüt</span><strong data-result="daily-gross">—</strong></article><article class="minimum-wage-result"><span>Günlük net karşılık</span><strong data-result="daily-net">—</strong></article><article class="minimum-wage-result"><span>Saatlik brüt (225 saat)</span><strong data-result="hourly-gross">—</strong></article><article class="minimum-wage-result"><span>Saatlik net karşılık</span><strong data-result="hourly-net">—</strong></article><article class="minimum-wage-result"><span data-result="period-label">1 aylık toplam</span><strong data-result="period-gross">—</strong><small>Brüt</small></article><article class="minimum-wage-result"><span>Seçilen dönem net toplam</span><strong data-result="period-net">—</strong></article></div></div></section>
<section class="minimum-wage-section"><h2>2026 asgari ücret kesintileri</h2><table><thead><tr><th>Kalem</th><th>Aylık tutar</th></tr></thead><tbody><tr><td>Brüt asgari ücret</td><td>33.030,00 TL</td></tr><tr><td>Çalışan SGK primi (%14)</td><td>4.624,20 TL</td></tr><tr><td>Çalışan işsizlik sigortası (%1)</td><td>330,30 TL</td></tr><tr><td>Gelir vergisi</td><td>0,00 TL — asgari ücret istisnası</td></tr><tr><td>Damga vergisi</td><td>0,00 TL — asgari ücret istisnası</td></tr><tr><td><strong>Net asgari ücret</strong></td><td><strong>28.075,50 TL</strong></td></tr></tbody></table><p>Çalışma ve Sosyal Güvenlik Bakanlığı 2026 için brüt 33.030,00 TL ve net 28.075,50 TL tutarlarını yayımlamıştır. Motor bu referansla birebir eşleşmediğinde hesap üretmez.</p></section>
<section class="minimum-wage-section"><h2>2025’ten 2026’ya ne kadar arttı?</h2><p>2025 aylık brüt asgari ücret 26.005,50 TL, net asgari ücret 22.104,67 TL idi. 2026’da hem brüt hem net tutar yaklaşık %27,01 arttı. Bu karşılaştırma Bakanlığın 2025–2026 resmî tablosuyla uyumludur.</p></section>
<section class="minimum-wage-section"><h2>İlgili hesaplama araçları</h2><div class="minimum-wage-links"><a class="minimum-wage-link" href="/"><strong>Maaş Hesaplama 2026</strong><span>Asgari ücret üzerindeki brüt/net maaşları hesapla.</span></a><a class="minimum-wage-link" href="/asgari-ucret-isveren-maliyeti/"><strong>Asgari Ücret İşveren Maliyeti</strong><span>Teşviklere göre işveren toplam maliyetini gör.</span></a><a class="minimum-wage-link" href="/fazla-mesai-hesaplama/"><strong>Fazla Mesai Hesaplama</strong><span>Saatlik ücret ve zamlı mesai tutarını hesapla.</span></a></div></section>
<section class="minimum-wage-section"><h2>Resmî kaynaklar</h2><div class="minimum-wage-source-list"><a href="${MIN_WAGE_SOURCE}" rel="noopener noreferrer">Çalışma ve Sosyal Güvenlik Bakanlığı — 2026 Asgari Ücretin Net Hesabı ve İşverene Maliyeti ↗</a><a href="${SGK_SOURCE}" rel="noopener noreferrer">SGK — 2026 Prime Esas Kazanç Miktarları ↗</a><a href="${TAX_EXEMPTION_SOURCE}" rel="noopener noreferrer">Gelir İdaresi Başkanlığı — 2026 ücret geliri / asgari ücret istisnası ↗</a></div></section>
<section class="minimum-wage-section"><h2>Sık sorulan sorular</h2>${FAQ.map(([q,a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('')}</section>
</div></main><script type="module" src="/assets/minimum-wage-calculator.js"></script></body></html>`;
}

export async function addMinimumWageCalculator(dist) {
  const dir = join(dist, ROUTE.replace(/^\/+|\/+$/g, ''));
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'index.html'), page(), 'utf8');
  console.log('Asgari ücret hesaplayıcısı üretildi:', ROUTE);
  return Object.freeze({ generated: 1, route: ROUTE });
}
