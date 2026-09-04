import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DATA_2026 } from '../src/data-2026.js';

const SITE = 'https://maasim.net';
const PUBLISHED = '2026-09-04';
const money = (kurus) => `${(kurus / 100).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
const esc = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const SOURCES = Object.freeze({
  severance: DATA_2026.sources.severance.url,
  labourFaq: 'https://www.csgb.gov.tr/sikca-sorulan-sorular/calisma-genel-mudurlugu/%C4%B1s-kanunu/',
  sgk: DATA_2026.sources.sgk.url,
  incomeTax: DATA_2026.sources.incomeTax.url,
  minimumWageTaxExemption: 'https://gib.gov.tr/mevzuat/kanun/433/ozelge/23157'
});

function schema({ path, title, description, faq }) {
  const url = `${SITE}${path}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage', '@id': `${url}#page`, url, name: title, description,
        inLanguage: 'tr-TR', datePublished: PUBLISHED, dateModified: PUBLISHED,
        isPartOf: { '@id': `${SITE}/#website` }
      },
      {
        '@type': 'WebApplication', '@id': `${url}#calculator`, url, name: title,
        applicationCategory: 'FinanceApplication', operatingSystem: 'Web', isAccessibleForFree: true,
        description, offers: { '@type': 'Offer', price: 0, priceCurrency: 'TRY' }
      },
      {
        '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: title.replace(/ \| Maaşım\.net$/, ''), item: url }
        ]
      },
      {
        '@type': 'FAQPage', mainEntity: faq.map(({ q, a }) => ({
          '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a }
        }))
      }
    ]
  };
}

function field(name, label, { type = 'text', note = '', placeholder = '', extra = '' } = {}) {
  return `<div class="termination-field"><label for="${name}">${esc(label)}${note ? ` <small>${esc(note)}</small>` : ''}</label><input id="${name}" name="${name}" type="${type}" ${type === 'text' ? 'inputmode="decimal"' : ''} placeholder="${esc(placeholder)}" ${extra}></div>`;
}

function calculatorForm(type) {
  const taxBaseField = type === 'severance' ? '' : field('previousTaxBase', 'Ödeme öncesi kümülatif gelir vergisi matrahı', {
    note: 'Net ihbar tahmini için önerilir', placeholder: 'Örn. 400.000'
  });
  const incomeTaxExemptionField = type === 'severance' ? '' : field('remainingIncomeTaxExemption', 'Bu ay kalan asgari ücret gelir vergisi istisnası', {
    note: 'Varsa; bordrodan', placeholder: '0'
  });
  const stampTaxExemptionField = field('remainingStampTaxExemption', 'Bu ay kalan asgari ücret damga vergisi istisnası', {
    note: 'Varsa; bordrodan', placeholder: '0'
  });
  const taxHelp = `<div class="termination-help"><strong>Vergi istisnası alanları opsiyoneldir.</strong> Tam aylık normal ücret bordrosunda asgari ücret gelir ve damga vergisi istisnaları çoğu durumda zaten kullanılmış olur; kalan yoksa 0 bırakın. Kısmi ay veya o ay düşük/hiç ücret ödenmemesi halinde bordroda kullanılmamış istisna varsa kalan tutarı girebilirsiniz. Araç girilen tutarı 2026 için geçerli aylık yasal üst sınırla otomatik sınırlar.</div>`;

  return `<form novalidate><h2>Bilgilerini gir</h2><p>Hesap yalnız 2026 fesih tarihleri için güncel tavan ve vergi parametrelerini kullanır.</p>
    ${field('startDate', 'İşe giriş tarihi', { type: 'date', extra: 'required' })}
    ${field('endDate', 'İşten ayrılma tarihi', { type: 'date', extra: 'min="2026-01-01" max="2026-12-31" required' })}
    ${field('baseGross', 'Son aylık brüt ücret', { placeholder: 'Örn. 60.000', extra: 'required' })}
    ${field('meal', 'Aylık düzenli yemek yardımı', { note: 'Varsa', placeholder: '0' })}
    ${field('transport', 'Aylık düzenli yol / taşıt yardımı', { note: 'Varsa', placeholder: '0' })}
    ${field('regularOther', 'Diğer düzenli para ile ölçülebilen haklar', { note: 'Varsa', placeholder: '0' })}
    ${taxBaseField}
    ${incomeTaxExemptionField}
    ${stampTaxExemptionField}
    ${taxHelp}
    <button class="termination-submit" type="submit">Hesapla</button>
    <div class="termination-help">Giydirilmiş brüt ücret; son brüt ücret ile düzenli ve para ile ölçülebilen yan hakların toplamı olarak ele alınır. Tek seferlik ödemeleri bu alanlara eklemeyin.</div>
  </form>`;
}

function severanceResults({ primary = false } = {}) {
  return `<div class="termination-result-grid">
    <article class="termination-result"><span>Hizmet süresi</span><strong data-result="duration">—</strong></article>
    <article class="termination-result"><span>Giydirilmiş brüt</span><strong data-result="dressed-gross">—</strong></article>
    <article class="termination-result"><span>2026 kıdem tavanı</span><strong data-result="severance-ceiling">—</strong></article>
    <article class="termination-result"><span>Hesaba esas aylık ücret</span><strong data-result="severance-basis">—</strong></article>
    <article class="termination-result"><span>Brüt kıdem tazminatı</span><strong data-result="severance-gross">—</strong></article>
    <article class="termination-result"><span>Uygulanan damga istisnası</span><strong data-result="severance-stamp-exemption">—</strong></article>
    <article class="termination-result"><span>Damga vergisi</span><strong data-result="severance-stamp">—</strong></article>
    <article class="termination-result${primary ? ' termination-result--primary' : ''}"><span>Net kıdem tazminatı</span><strong data-result="severance-net">—</strong></article>
  </div><div class="termination-warning" data-severance-warning hidden></div>`;
}

function noticeResults({ primary = false } = {}) {
  return `<div class="termination-result-grid">
    <article class="termination-result"><span>Hizmet süresi</span><strong data-result="duration">—</strong></article>
    <article class="termination-result"><span>Giydirilmiş brüt</span><strong data-result="dressed-gross">—</strong></article>
    <article class="termination-result"><span>İhbar süresi</span><strong data-result="notice-period">—</strong></article>
    <article class="termination-result"><span>Brüt ihbar tazminatı</span><strong data-result="notice-gross">—</strong></article>
    <article class="termination-result"><span>Uygulanan gelir vergisi oranı</span><strong data-result="notice-rates">—</strong></article>
    <article class="termination-result"><span>Uygulanan gelir vergisi istisnası</span><strong data-result="notice-income-tax-exemption">—</strong></article>
    <article class="termination-result"><span>Gelir vergisi tahmini</span><strong data-result="notice-income-tax">—</strong></article>
    <article class="termination-result"><span>Uygulanan damga istisnası</span><strong data-result="notice-stamp-exemption">—</strong></article>
    <article class="termination-result"><span>Damga vergisi</span><strong data-result="notice-stamp">—</strong></article>
    <article class="termination-result${primary ? ' termination-result--primary' : ''}"><span>Net ihbar tazminatı tahmini</span><strong data-result="notice-net">—</strong></article>
  </div><div class="termination-warning" data-notice-warning hidden></div>`;
}

function combinedResults() {
  return `<div class="termination-result-grid">
    <article class="termination-result termination-result--primary"><span>Tahmini toplam net kıdem + ihbar</span><strong data-result="package-net">—</strong></article>
    <article class="termination-result"><span>Toplam brüt kıdem + ihbar</span><strong data-result="package-gross">—</strong></article>
  </div><h2 style="margin-top:28px">Kıdem tazminatı</h2>${severanceResults()}<h2 style="margin-top:28px">İhbar tazminatı</h2>${noticeResults()}`;
}

function links() {
  return `<div class="termination-links">
    <a class="termination-link" href="/tazminat-hesaplama/"><strong>Tazminat Hesaplama</strong><span>Kıdem ve ihbarı birlikte hesapla</span></a>
    <a class="termination-link" href="/kidem-tazminati-hesaplama/"><strong>Kıdem Tazminatı</strong><span>2026 tavanıyla kıdem hesabı</span></a>
    <a class="termination-link" href="/ihbar-tazminati-hesaplama/"><strong>İhbar Tazminatı</strong><span>2–8 haftalık bildirim süresiyle hesapla</span></a>
  </div>`;
}

function sourceList() {
  return `<div class="termination-source-list">
    <a href="${SOURCES.severance}" rel="noopener noreferrer">Çalışma ve Sosyal Güvenlik Bakanlığı — 2026 kıdem tazminatı tavanı ↗</a>
    <a href="${SOURCES.labourFaq}" rel="noopener noreferrer">Çalışma ve Sosyal Güvenlik Bakanlığı — İş Kanunu SSS, kıdem ve ihbar esasları ↗</a>
    <a href="${SOURCES.sgk}" rel="noopener noreferrer">Sosyal Güvenlik Kurumu — 2026 prime esas kazançlar ve tazminatların SGK durumu ↗</a>
    <a href="${SOURCES.incomeTax}" rel="noopener noreferrer">Gelir İdaresi Başkanlığı — 2026 ücret geliri tarifesi ↗</a>
    <a href="${SOURCES.minimumWageTaxExemption}" rel="noopener noreferrer">Gelir İdaresi Başkanlığı — asgari ücret gelir ve damga vergisi istisnası uygulaması ↗</a>
  </div>`;
}

function page({ path, type, title, h1, description, lead, resultTitle, explainer, faq }) {
  const results = type === 'severance' ? severanceResults({ primary: true }) : type === 'notice' ? noticeResults({ primary: true }) : combinedResults();
  const schemaJson = JSON.stringify(schema({ path, title, description, faq }));
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${SITE}${path}"><meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${SITE}${path}"><meta property="og:site_name" content="Maaşım.net"><meta name="twitter:card" content="summary"><link rel="stylesheet" href="/assets/termination-calculators.css"><script type="application/ld+json">${schemaJson}</script></head><body class="termination-page"><main><div class="termination-shell"><header class="termination-hero"><span class="termination-eyebrow">2026 güncel hesaplama</span><h1>${esc(h1)}</h1><p>${esc(lead)}</p><div class="termination-freshness"><span>Son mevzuat kontrolü: ${esc(DATA_2026.checkedAt)}</span><span>2026 II. yarı kıdem tavanı: ${money(DATA_2026.publishedData.severanceCeiling.secondHalfKurus)}</span></div></header><section class="termination-grid" data-termination-calculator="${type}"><div class="termination-panel">${calculatorForm(type)}</div><div class="termination-results" data-calculator-results hidden><h2>${esc(resultTitle)}</h2><div class="termination-error" data-calculator-error hidden></div>${results}</div></section><section class="termination-section">${explainer}</section><section class="termination-section"><h2>Diğer tazminat hesaplayıcıları</h2>${links()}</section><section class="termination-section"><h2>Resmî kaynaklar</h2><p>Hesaplama parametreleri ve hukuki açıklamalar aşağıdaki resmî kaynaklara dayanır.</p>${sourceList()}<p class="termination-disclaimer"><strong>Önemli:</strong> Bu araç tutar hesabı yapar; kıdem veya ihbar tazminatına hukuken hak kazanıp kazanmadığınızı kesin olarak belirlemez. İş sözleşmesi türü, fesih nedeni, toplu iş sözleşmesi ve özel durumlar sonucu değiştirebilir.</p></section><section class="termination-section termination-faq"><h2>Sık sorulan sorular</h2>${faq.map(({ q, a }) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</section></div></main><script type="module" src="/assets/termination-calculators.js"></script></body></html>`;
}

const severanceFaq = [
  { q: '2026 kıdem tazminatı tavanı ne kadar?', a: `1 Temmuz–31 Aralık 2026 döneminde bir hizmet yılı için kıdem tazminatı tavanı ${money(DATA_2026.publishedData.severanceCeiling.secondHalfKurus)}’dir. 1 Ocak–30 Haziran 2026 döneminde tavan ${money(DATA_2026.publishedData.severanceCeiling.firstHalfKurus)} idi.` },
  { q: 'Kıdem tazminatı nasıl hesaplanır?', a: 'Kıdem tazminatı, son giydirilmiş brüt ücret üzerinden her tam çalışma yılı için 30 günlük ücret esas alınarak hesaplanır; artan ay ve günler oranlanır. Fesih tarihindeki kıdem tazminatı tavanı uygulanır.' },
  { q: 'Kıdem tazminatından hangi kesintiler yapılır?', a: 'Yasal kıdem tazminatında gelir vergisi ve SGK primi kesilmez; damga vergisi uygulanır. Fesih ayındaki asgari ücret damga vergisi istisnasının normal ücrette kullanılmamış bir kısmı varsa, şartları dahilinde kalan tutar tazminat ödemesinde de kullanılabilir.' },
  { q: 'Yemek ve yol yardımı kıdem hesabına girer mi?', a: 'Düzenli olarak sağlanan ve para ile ölçülebilen yemek, yol ve benzeri menfaatler giydirilmiş brüt ücrete dahil edilebilir. Tek seferlik ve süreklilik göstermeyen ödemeler aynı şekilde değerlendirilmez.' }
];

const noticeFaq = [
  { q: 'İhbar süresi kaç haftadır?', a: 'Çalışma süresi 6 aydan azsa 2 hafta, 6 ay–1,5 yıl arasındaysa 4 hafta, 1,5–3 yıl arasındaysa 6 hafta, 3 yıldan uzunsa 8 hafta bildirim süresi uygulanır.' },
  { q: 'İhbar tazminatında tavan var mı?', a: 'Çalışma ve Sosyal Güvenlik Bakanlığı rehberine göre ihbar tazminatı hesabında kıdem tazminatındaki gibi bir tavan üst sınırı yoktur.' },
  { q: 'İhbar tazminatından hangi kesintiler yapılır?', a: 'İhbar tazminatından gelir vergisi ve damga vergisi kesilir; SGK ve işsizlik sigortası primi kesilmez. Fesih ayındaki normal ücrette asgari ücret gelir veya damga vergisi istisnasının tamamı kullanılamadıysa kalan istisna aynı ayda ücret sayılan ödemelerde şartları dahilinde kullanılabilir.' },
  { q: 'İhbar tazminatı hangi ücret üzerinden hesaplanır?', a: 'İhbar tazminatı da giydirilmiş ücret üzerinden hesaplanır; düzenli para veya para ile ölçülebilen menfaatler dikkate alınır.' }
];

const pages = [
  {
    path: '/tazminat-hesaplama/', type: 'combined',
    title: 'Tazminat Hesaplama 2026: Kıdem ve İhbar | Maaşım.net',
    h1: 'Tazminat Hesaplama 2026: Kıdem ve İhbar',
    description: 'Kıdem ve ihbar tazminatını 2026 güncel tavan, hizmet süresi, giydirilmiş brüt ücret ve vergi dilimiyle birlikte hesaplayın.',
    lead: 'İşe giriş ve ayrılma tarihlerinizi, brüt ücretinizi ve düzenli yan haklarınızı girin; kıdem ve ihbar tazminatını tek hesapta karşılaştırın.',
    resultTitle: 'Kıdem + ihbar tazminatı sonucu',
    explainer: `<h2>Kıdem ve ihbar tazminatı arasındaki fark</h2><p>Kıdem tazminatı, gerekli hak kazanma koşulları oluştuğunda hizmet süresi ve fesih tarihindeki kıdem tavanı üzerinden hesaplanır. İhbar tazminatı ise belirsiz süreli iş sözleşmesinde bildirim süresine uyulmaması halinde gündeme gelir ve 2, 4, 6 veya 8 haftalık süreye göre hesaplanır.</p><table><thead><tr><th>Kalem</th><th>Kıdem</th><th>İhbar</th></tr></thead><tbody><tr><td>Temel hesap</td><td>Her yıl için 30 günlük giydirilmiş ücret</td><td>Bildirim süresi × günlük giydirilmiş ücret</td></tr><tr><td>Tavan</td><td>Var</td><td>Yok</td></tr><tr><td>Gelir vergisi</td><td>Yasal kıdem kapsamında yok</td><td>Var</td></tr><tr><td>SGK primi</td><td>Yok</td><td>Yok</td></tr></tbody></table><h2>2026 tavanı nasıl uygulanıyor?</h2><p>Fesih tarihi 2026’nın ilk yarısındaysa ${money(DATA_2026.publishedData.severanceCeiling.firstHalfKurus)}, ikinci yarısındaysa ${money(DATA_2026.publishedData.severanceCeiling.secondHalfKurus)} kıdem tavanı kullanılır. Giydirilmiş ücret tavanı aşarsa kıdem hesabı tavandan yapılır; ihbar hesabında aynı tavan uygulanmaz.</p><h2>Aynı aydaki kullanılmamış vergi istisnası</h2><p>Asgari ücret gelir ve damga vergisi istisnaları ilgili ayın ücret ve ücret sayılan ödemeleri toplamında bir kez uygulanır. Normal ücret bordrosunda istisnanın tamamı kullanılamadıysa kalan tutar şartları dahilinde tazminat ödemesinde kullanılabilir. Araç bu nedenle kalan istisna tutarını opsiyonel olarak kabul eder ve aylık 2026 üst sınırını aşan girişi otomatik sınırlar.</p>`,
    faq: [...severanceFaq.slice(0, 2), ...noticeFaq.slice(0, 3)]
  },
  {
    path: '/kidem-tazminati-hesaplama/', type: 'severance',
    title: 'Kıdem Tazminatı Hesaplama 2026 | Maaşım.net',
    h1: 'Kıdem Tazminatı Hesaplama 2026',
    description: '2026 kıdem tazminatınızı işe giriş ve çıkış tarihi, giydirilmiş brüt ücret ve güncel kıdem tavanıyla brüt ve net olarak hesaplayın.',
    lead: '2026 fesih tarihine göre geçerli kıdem tavanını otomatik seçin; çalışma sürenizi, giydirilmiş brütü, brüt kıdemi ve damga vergisi sonrası net tutarı görün.',
    resultTitle: 'Kıdem tazminatı sonucu',
    explainer: `<h2>2026 kıdem tazminatı nasıl hesaplanır?</h2><p>1475 sayılı İş Kanununun yürürlükteki 14. maddesi kapsamında, kıdem tazminatını gerektiren bir sona erme halinde her tam çalışma yılı için 30 günlük ücret esas alınır. Bir yıldan artan ay ve günler aynı oran üzerinden hesaba katılır.</p><h2>Giydirilmiş brüt ücret nedir?</h2><p>Son brüt maaşa düzenli ve para ile ölçülebilen menfaatler eklenir. Bakanlık; yol, yemek ve düzenli ikramiye gibi ödemelerin kıdem hesabında dikkate alınabileceğini belirtir. <a href="/blog/kidem-tazminatina-dahil-odemeler/">Kıdem tazminatına dahil ödemeler rehberini inceleyin.</a></p><h2>2026 kıdem tazminatı tavanı</h2><table><thead><tr><th>Dönem</th><th>Bir hizmet yılı için tavan</th></tr></thead><tbody><tr><td>1 Ocak–30 Haziran 2026</td><td>${money(DATA_2026.publishedData.severanceCeiling.firstHalfKurus)}</td></tr><tr><td>1 Temmuz–31 Aralık 2026</td><td>${money(DATA_2026.publishedData.severanceCeiling.secondHalfKurus)}</td></tr></tbody></table><p>Hesaplayıcı fesih tarihine göre doğru dönemi otomatik seçer. Fesih ayındaki normal ücret bordrosunda kullanılmamış damga vergisi istisnası varsa opsiyonel alana girilebilir.</p>`,
    faq: severanceFaq
  },
  {
    path: '/ihbar-tazminati-hesaplama/', type: 'notice',
    title: 'İhbar Tazminatı Hesaplama 2026 | Maaşım.net',
    h1: 'İhbar Tazminatı Hesaplama 2026',
    description: '2026 ihbar tazminatını hizmet süresine göre 2, 4, 6 veya 8 haftalık bildirim süresi ve kümülatif vergi matrahıyla hesaplayın.',
    lead: 'Çalışma sürenize göre ihbar süresini otomatik belirleyin; giydirilmiş brüt üzerinden brüt ihbarı, gelir vergisini, damga vergisini ve tahmini net tutarı görün.',
    resultTitle: 'İhbar tazminatı sonucu',
    explainer: `<h2>İhbar tazminatı nasıl hesaplanır?</h2><p>4857 sayılı İş Kanununun 17. maddesindeki bildirim süreleri esas alınır. Giydirilmiş aylık ücret 30’a bölünerek günlük tutar bulunur ve hizmet süresine karşılık gelen ihbar günüyle çarpılır.</p><table><thead><tr><th>Çalışma süresi</th><th>Bildirim süresi</th></tr></thead><tbody><tr><td>6 aydan az</td><td>2 hafta / 14 gün</td></tr><tr><td>6 ay–1,5 yıl</td><td>4 hafta / 28 gün</td></tr><tr><td>1,5–3 yıl</td><td>6 hafta / 42 gün</td></tr><tr><td>3 yıldan fazla</td><td>8 hafta / 56 gün</td></tr></tbody></table><h2>Net ihbar neden kişiden kişiye değişir?</h2><p>İhbar tazminatı gelir vergisine tabi olduğu için aynı brüt ihbar tutarı farklı kümülatif vergi matrahlarında farklı net sonuç verebilir. Bu nedenle araçta ödeme öncesindeki kümülatif gelir vergisi matrahını ayrıca girebilirsiniz. İhbar tazminatı SGK ve işsizlik sigortası primine tabi değildir.</p><h2>Fesih ayındaki kullanılmamış asgari ücret istisnası</h2><p>İlgili ayda normal ücret için asgari ücret gelir veya damga vergisi istisnasının tamamı kullanılamadıysa kalan tutar şartları dahilinde ihbar tazminatında kullanılabilir. Bordronuzda kalan tutar varsa opsiyonel alanlara girin; yoksa 0 bırakın. Hesaplayıcı girilen istisnayı ilgili ayın 2026 yasal üst sınırıyla kısıtlar.</p>`,
    faq: noticeFaq
  }
];

export async function addTerminationCalculators(dist) {
  for (const item of pages) {
    const dir = join(dist, item.path.replace(/^\/+|\/+$/g, ''));
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, 'index.html'), page(item), 'utf8');
  }
  console.log(`tazminat hesaplayıcı sayfaları üretildi: ${pages.length}`);
  return { generated: pages.length, paths: pages.map((page) => page.path) };
}
