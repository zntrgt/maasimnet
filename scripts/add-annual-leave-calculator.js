import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DATA_2026 } from '../src/data-2026.js';

const SITE = 'https://maasim.net';
const ROUTE = '/yillik-izin-ucreti-hesaplama/';
const TITLE = 'Yıllık İzin Ücreti Hesaplama 2026 | Maaşım.net';
const DESCRIPTION = 'Kullanılmayan yıllık izin günlerinin 2026 brüt ve tahmini net ücretini hesaplayın; SGK, gelir vergisi ve damga vergisi etkisini görün.';
const LABOR_SOURCE = 'https://www.csgb.gov.tr/sikca-sorulan-sorular/calisma-genel-mudurlugu/%C4%B1s-kanunu/';
const SGK_SOURCE = DATA_2026.sources.sgk.url;
const INCOME_TAX_SOURCE = DATA_2026.sources.incomeTax.url;
const TAX_EXEMPTION_SOURCE = DATA_2026.sources.minimumWageTaxExemption.url;

const FAQ = [
  ['Kullanılmayan yıllık izin ücreti nasıl hesaplanır?', 'İş sözleşmesi sona erdiğinde hak kazanıldığı halde kullanılmayan izin günleri, fesih tarihindeki ücret üzerinden ödenir. Araç günlük brüt ücreti son aylık brüt ücreti 30’a bölerek bulur ve kullanılmayan gün sayısıyla çarpar.'],
  ['Yıllık izin ücretine prim, yemek ve fazla mesai dahil edilir mi?', 'Hayır. Çalışma ve Sosyal Güvenlik Bakanlığı açıklamasına göre yıllık izin ücretine fazla çalışma ücretleri, primler ve sosyal yardımlar dahil edilmez. Bu nedenle araç son aylık çıplak brüt ücreti esas alır.'],
  ['Kullanılmayan izin ücretinden hangi kesintiler yapılır?', 'Kullanılmayan yıllık izin ücreti ücret niteliğindedir. Gelir vergisi ve damga vergisine tabidir; ayrıca SGK prime esas kazanca dahil edilir. Net tutar fesih ayındaki diğer ücret, SGK tavanı ve kümülatif vergi matrahına göre değişebilir.'],
  ['İstifa edersem kullanılmayan izin ücretimi alabilir miyim?', 'Evet. İş Kanunu m.59 iş sözleşmesinin herhangi bir nedenle sona ermesi halinde hak kazanılıp kullanılmayan yıllık izin sürelerine ait ücretin ödenmesini öngörür.'],
  ['Yıllık izin hakkı kaç gündür?', 'Genel kuralda 1–5 yıl dahil hizmeti olanlarda en az 14 gün, 5 yıldan fazla 15 yıldan az hizmette en az 20 gün, 15 yıl ve üzeri hizmette en az 26 gündür. 18 yaş ve altı ile 50 yaş ve üzeri çalışanlarda izin en az 20 gündür.'],
  ['Hafta tatili ve resmî tatiller izin gününe dahil midir?', 'Kanundaki yıllık izin sürelerine hafta tatili, ulusal bayram ve genel tatil günleri dahil değildir. Hesaplayıcıya işverenin izin kaydında görünen kullanılmamış yıllık izin günü sayısını girmeniz en güvenli yöntemdir.']
];

function monthOptions() {
  const names = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  return names.map((name, index) => `<option value="${index + 1}"${index === 8 ? ' selected' : ''}>${name}</option>`).join('');
}

function schema() {
  const url = `${SITE}${ROUTE}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', '@id': `${url}#page`, url, name: TITLE, description: DESCRIPTION, inLanguage: 'tr-TR', datePublished: DATA_2026.checkedAt, dateModified: DATA_2026.checkedAt },
      { '@type': 'WebApplication', '@id': `${url}#calculator`, url, name: 'Yıllık İzin Ücreti Hesaplama 2026', applicationCategory: 'FinanceApplication', operatingSystem: 'Web', isAccessibleForFree: true, description: DESCRIPTION, offers: { '@type': 'Offer', price: 0, priceCurrency: 'TRY' } },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Hesaplama Araçları', item: `${SITE}/hesaplama-araclari/` },
        { '@type': 'ListItem', position: 3, name: 'Yıllık İzin Ücreti Hesaplama', item: url }
      ]},
      { '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }
    ]
  };
}

function page() {
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${TITLE}</title><meta name="description" content="${DESCRIPTION}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${SITE}${ROUTE}"><meta property="og:type" content="website"><meta property="og:title" content="Yıllık İzin Ücreti Hesaplama 2026"><meta property="og:description" content="${DESCRIPTION}"><meta property="og:url" content="${SITE}${ROUTE}"><meta property="og:site_name" content="Maaşım.net"><script type="application/ld+json">${JSON.stringify(schema())}</script><link rel="stylesheet" href="/assets/annual-leave-calculator.css"></head><body class="annual-leave-page"><main><div class="annual-leave-shell"><header class="annual-leave-hero"><span class="annual-leave-eyebrow">2026 · İş Kanunu m.59</span><h1>Yıllık İzin Ücreti Hesaplama 2026</h1><p>İşten ayrılırken kullanmadığınız yıllık izin günlerinin brüt karşılığını ve fesih ayındaki bordro koşullarınıza göre tahmini net ödemeyi hesaplayın.</p><div class="annual-leave-freshness"><span>Son mevzuat/veri kontrolü: ${DATA_2026.checkedAt}</span><span>Brüt formül: son aylık brüt ÷ 30 × kullanılmayan gün</span></div></header>
<section class="annual-leave-grid" data-annual-leave-calculator><div class="annual-leave-panel"><form novalidate><h2>Bilgilerini gir</h2><p>İzin ücretinde son aylık çıplak brüt ücret kullanılır; fazla mesai, prim ve sosyal yardımları bu alana eklemeyin.</p><div class="annual-leave-fields"><div class="annual-leave-row"><div class="annual-leave-field"><label for="lastMonthlyGross">Son aylık brüt ücret <small>Çıplak brüt</small></label><input id="lastMonthlyGross" name="lastMonthlyGross" type="text" inputmode="decimal" placeholder="Örn. 60.000" required></div><div class="annual-leave-field"><label for="unusedLeaveDays">Kullanılmayan yıllık izin <small>Gün</small></label><input id="unusedLeaveDays" name="unusedLeaveDays" type="number" min="1" step="1" placeholder="Örn. 10" required></div></div><div class="annual-leave-row"><div class="annual-leave-field"><label for="monthNumber">İşten ayrılma / ödeme ayı</label><select id="monthNumber" name="monthNumber">${monthOptions()}</select></div><div class="annual-leave-field"><label for="terminationMonthPremiumDays">Fesih ayı SGK prim günü <small>SGK tavanını doğru uygulamak için</small></label><input id="terminationMonthPremiumDays" name="terminationMonthPremiumDays" type="number" min="1" max="30" step="1" value="30"></div></div><details open><summary>Net tutar için bordro bilgileri</summary><div class="annual-leave-fields"><div class="annual-leave-field"><label for="terminationMonthGross">Fesih ayında izin ücreti dışındaki brüt ücret <small>O ay hak edilen normal ücret; yoksa 0</small></label><input id="terminationMonthGross" name="terminationMonthGross" type="text" inputmode="decimal" placeholder="Örn. 60.000"></div><div class="annual-leave-field"><label for="previousTaxBase">Ay başındaki kümülatif gelir vergisi matrahı <small>Net vergi hesabı için</small></label><input id="previousTaxBase" name="previousTaxBase" type="text" inputmode="decimal" placeholder="Örn. 400.000"></div><div class="annual-leave-row"><div class="annual-leave-field"><label for="retired">Emekli çalışan / SGDP</label><select id="retired" name="retired"><option value="no">Hayır</option><option value="yes">Evet</option></select></div><div class="annual-leave-field"><label for="disabilityDegree">Engellilik indirimi</label><select id="disabilityDegree" name="disabilityDegree"><option value="0">Yok</option><option value="1">1. derece</option><option value="2">2. derece</option><option value="3">3. derece</option></select></div></div></div></details></div><button class="annual-leave-submit" type="submit">İzin ücretini hesapla</button><div class="annual-leave-help"><strong>Neden fesih ayı bordrosunu soruyoruz?</strong> Kullanılmayan izin ücreti kıdem tazminatı gibi vergiden/primden istisna değildir. SGK ve gelir vergisi kesintisi o ayki diğer kazançlarla birlikte hesaplanır.</div></form></div>
<div class="annual-leave-results" data-calculator-results hidden><h2>İzin ücreti sonucu</h2><div class="annual-leave-error" data-calculator-error hidden></div><div class="annual-leave-result-grid"><article class="annual-leave-result"><span>Günlük brüt izin ücreti</span><strong data-result="daily-gross">—</strong></article><article class="annual-leave-result"><span>Brüt kullanılmayan izin ücreti</span><strong data-result="leave-gross">—</strong></article><article class="annual-leave-result"><span>Ek SGK + işsizlik primi</span><strong data-result="social">—</strong></article><article class="annual-leave-result"><span>Ek gelir vergisi</span><strong data-result="income-tax">—</strong></article><article class="annual-leave-result"><span>Ek damga vergisi</span><strong data-result="stamp-tax">—</strong></article><article class="annual-leave-result"><span>Uygulanan gelir vergisi oranları</span><strong data-result="tax-rates">—</strong></article><article class="annual-leave-result"><span>Fesih ayı SGK tavanı</span><strong data-result="sgk-ceiling">—</strong></article><article class="annual-leave-result annual-leave-result--primary"><span>Tahmini net kullanılmayan izin ücreti</span><strong data-result="leave-net">—</strong></article></div><div class="annual-leave-note" data-leave-note hidden></div></div></section>
<section class="annual-leave-section"><h2>Yıllık izin ücreti nasıl hesaplanır?</h2><table><thead><tr><th>Adım</th><th>Formül</th></tr></thead><tbody><tr><td>Günlük brüt ücret</td><td>Fesih tarihindeki son aylık çıplak brüt ücret ÷ 30</td></tr><tr><td>Brüt izin ücreti</td><td>Günlük brüt ücret × kullanılmayan izin günü</td></tr><tr><td>Net izin ücreti</td><td>Fesih ayı bordrosuna izin ücreti eklenmeden önceki ve eklendikten sonraki net tutarın farkı</td></tr></tbody></table><p>İş Kanunu m.59 uyarınca iş sözleşmesinin herhangi bir nedenle sona ermesi halinde kullanılmamış yıllık izin ücretinin ödenmesi gerekir. Bakanlık açıklamasına göre izin ücretinin hesabına fazla çalışma, prim ve sosyal yardımlar dahil edilmez.</p></section>
<section class="annual-leave-section"><h2>Yıllık izin günleri neye göre belirlenir?</h2><p>Genel asgari süreler 1–5 yıl dahil hizmette 14 gün, 5 yıldan fazla 15 yıldan az hizmette 20 gün, 15 yıl ve üzeri hizmette 26 gündür. 18 yaş ve altı ile 50 yaş ve üzerindeki çalışanlar için süre 20 günden az olamaz. Ancak iş sözleşmesi veya toplu iş sözleşmesi daha uzun izin hakkı verebilir.</p><p>Bu araç hak edilmiş toplam gün sayısını geçmiş kullanım kayıtlarınızı bilmeden tahmin etmez. En doğru sonuç için işverenin yıllık izin kayıtlarında kalan gün sayısını girin.</p></section>
<section class="annual-leave-section"><h2>İlgili hesaplama araçları</h2><div class="annual-leave-links"><a class="annual-leave-link" href="/tazminat-hesaplama/"><strong>Kıdem ve İhbar Tazminatı</strong><span>İşten ayrılma paketini hesapla.</span></a><a class="annual-leave-link" href="/issizlik-maasi-hesaplama/"><strong>İşsizlik Maaşı</strong><span>İşsizlik ödeneği ve hak süresini hesapla.</span></a><a class="annual-leave-link" href="/hesaplama-araclari/"><strong>Tüm Hesaplama Araçları</strong><span>Maaş ve çalışan hakları araçlarını aç.</span></a></div></section>
<section class="annual-leave-section"><h2>Resmî kaynaklar</h2><div class="annual-leave-source-list"><a href="${LABOR_SOURCE}" rel="noopener noreferrer">Çalışma ve Sosyal Güvenlik Bakanlığı — İş Kanunu SSS / yıllık izin ↗</a><a href="${SGK_SOURCE}" rel="noopener noreferrer">SGK — 2026 Prime Esas Kazanç Miktarları / yıllık izin ücreti ↗</a><a href="${INCOME_TAX_SOURCE}" rel="noopener noreferrer">Gelir İdaresi Başkanlığı — 2026 ücret gelirleri ve vergi tarifesi ↗</a><a href="${TAX_EXEMPTION_SOURCE}" rel="noopener noreferrer">Gelir İdaresi Başkanlığı — 2026 asgari ücret vergi istisnası ↗</a></div></section>
<section class="annual-leave-section"><h2>Sık sorulan sorular</h2>${FAQ.map(([q,a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('')}</section>
</div></main><script type="module" src="/assets/annual-leave-calculator.js"></script></body></html>`;
}

export async function addAnnualLeaveCalculator(dist) {
  const dir = join(dist, ROUTE.replace(/^\/+|\/+$/g, ''));
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'index.html'), page(), 'utf8');
  console.log('Yıllık izin ücreti hesaplayıcısı üretildi:', ROUTE);
  return Object.freeze({ generated: 1, route: ROUTE });
}
