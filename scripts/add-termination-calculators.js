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
  stampTax: DATA_2026.sources.stampTax.url,
  minimumWageTaxExemption: DATA_2026.sources.minimumWageTaxExemption.url,
  terminationTaxExemption: DATA_2026.sources.terminationTaxExemption.url
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

function benefitFields() {
  return `<details class="termination-options" open>
    <summary>Düzenli yan haklar ve primler</summary>
    <div class="termination-options__body">
      <p class="termination-options__note">Yalnız düzenli ve para ile ölçülebilen menfaatleri ekleyin. Aynı ödemeyi iki farklı alana tekrar yazmayın.</p>
      ${field('meal', 'Aylık düzenli yemek yardımı', { note: 'Varsa', placeholder: '0' })}
      ${field('transport', 'Aylık düzenli yol / taşıt yardımı', { note: 'Varsa', placeholder: '0' })}
      ${field('annualRegularBenefits', 'Son 12 ayda düzenli prim / ikramiye toplamı', { note: 'Yıllık toplam; araç 12’ye böler', placeholder: '0' })}
      ${field('regularOther', 'Diğer aylık düzenli ve ölçülebilir haklar', { note: 'Varsa', placeholder: '0' })}
    </div>
  </details>`;
}

function advancedTaxFields(type) {
  const taxBaseField = type === 'severance' ? '' : field('previousTaxBase', 'Ödeme öncesi kümülatif gelir vergisi matrahı', {
    note: 'Net ihbar tahmini için önerilir', placeholder: 'Örn. 400.000'
  });
  const incomeTaxExemptionField = type === 'severance' ? '' : field('remainingIncomeTaxExemption', 'Bu ay kalan asgari ücret gelir vergisi istisnası', {
    note: 'Varsa; bordrodan', placeholder: '0'
  });
  const stampTaxExemptionField = field('remainingStampTaxExemption', 'Bu ay kalan asgari ücret damga vergisi istisnası', {
    note: 'Varsa; bordrodan', placeholder: '0'
  });

  return `<details class="termination-options termination-options--advanced">
    <summary>Gelişmiş vergi / bordro bilgileri</summary>
    <div class="termination-options__body">
      <p class="termination-options__note">Bu alanlar çoğu tam aylık bordroda 0 bırakılabilir. Kısmi ay veya düşük/hiç ücret ödenen fesih ayında bordroda kullanılmamış istisna varsa kalan tutarı girin.</p>
      ${taxBaseField}${incomeTaxExemptionField}${stampTaxExemptionField}
      <div class="termination-help">Araç, girilen kullanılmamış istisnayı fesih ayı için geçerli 2026 yasal üst sınırıyla otomatik sınırlar.</div>
    </div>
  </details>`;
}

function calculatorForm(type) {
  return `<form novalidate><h2>Bilgilerini gir</h2><p>Hesap yalnız 2026 fesih tarihleri için güncel tavan ve vergi parametrelerini kullanır.</p>
    ${field('startDate', 'İşe giriş tarihi', { type: 'date', extra: 'required' })}
    ${field('endDate', 'İşten ayrılma tarihi', { type: 'date', extra: 'min="2026-01-01" max="2026-12-31" required' })}
    ${field('baseGross', 'Son aylık brüt ücret', { placeholder: 'Örn. 60.000', extra: 'required' })}
    ${benefitFields()}
    ${advancedTaxFields(type)}
    <button class="termination-submit" type="submit">Hesapla</button>
    <div class="termination-help">Giydirilmiş brüt; son brüt ücret ile düzenli ve para ile ölçülebilen menfaatlerin toplamıdır. Tek seferlik ödemeleri eklemeyin.</div>
  </form>`;
}

function severanceResults({ primary = false } = {}) {
  return `<div class="termination-result-grid">
    <article class="termination-result"><span>Hizmet süresi</span><strong data-result="duration">—</strong></article>
    <article class="termination-result"><span>Giydirilmiş brüt</span><strong data-result="dressed-gross">—</strong></article>
    <article class="termination-result"><span>Yıllık prim / ikramiyenin aylık payı</span><strong data-result="annual-benefits-monthly">—</strong></article>
    <article class="termination-result"><span>Fesih tarihindeki kıdem tavanı</span><strong data-result="severance-ceiling">—</strong></article>
    <article class="termination-result"><span>Hesaba esas aylık ücret</span><strong data-result="severance-basis">—</strong></article>
    <article class="termination-result"><span>Brüt kıdem tazminatı</span><strong data-result="severance-gross">—</strong></article>
    <article class="termination-result"><span>Uygulanan damga istisnası</span><strong data-result="severance-stamp-exemption">—</strong></article>
    <article class="termination-result"><span>Damga vergisi</span><strong data-result="severance-stamp">—</strong></article>
    <article class="termination-result${primary ? ' termination-result--primary' : ''}"><span>Net kıdem tazminatı</span><strong data-result="severance-net">—</strong></article>
  </div>
  <div class="termination-formula"><span>Hesabın kontrolü</span><strong data-result="severance-formula">—</strong><p>Giydirilmiş brüt bileşenleri: <span data-result="dressed-gross-formula">—</span></p></div>
  <div class="termination-warning" data-severance-warning hidden></div>`;
}

function noticeResults({ primary = false } = {}) {
  return `<div class="termination-result-grid">
    <article class="termination-result"><span>Hizmet süresi</span><strong data-result="duration">—</strong></article>
    <article class="termination-result"><span>Giydirilmiş brüt</span><strong data-result="dressed-gross">—</strong></article>
    <article class="termination-result"><span>Yıllık prim / ikramiyenin aylık payı</span><strong data-result="annual-benefits-monthly">—</strong></article>
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

function scopedResults(type) {
  if (type === 'severance') return `<section data-severance-results>${severanceResults({ primary: true })}</section>`;
  if (type === 'notice') return `<section data-notice-results>${noticeResults({ primary: true })}</section>`;
  return `<div class="termination-result-grid">
    <article class="termination-result termination-result--primary"><span>Tahmini toplam net kıdem + ihbar</span><strong data-result="package-net">—</strong></article>
    <article class="termination-result"><span>Toplam brüt kıdem + ihbar</span><strong data-result="package-gross">—</strong></article>
  </div>
  <section data-severance-results><h2 style="margin-top:28px">Kıdem tazminatı</h2>${severanceResults()}</section>
  <section data-notice-results><h2 style="margin-top:28px">İhbar tazminatı</h2>${noticeResults()}</section>`;
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
    <a href="${SOURCES.sgk}" rel="noopener noreferrer">Sosyal Güvenlik Kurumu — tazminatların prime esas kazanç durumu ↗</a>
    <a href="${SOURCES.stampTax}" rel="noopener noreferrer">Gelir İdaresi Başkanlığı — 2026 damga vergisi oranları ↗</a>
    <a href="${SOURCES.incomeTax}" rel="noopener noreferrer">Gelir İdaresi Başkanlığı — 2026 ücret geliri tarifesi ↗</a>
    <a href="${SOURCES.minimumWageTaxExemption}" rel="noopener noreferrer">Gelir İdaresi Başkanlığı — 2026 ücret rehberi ve asgari ücret istisnası ↗</a>
    <a href="${SOURCES.terminationTaxExemption}" rel="noopener noreferrer">Gelir İdaresi Başkanlığı — aynı ayda ücret/tazminat ödemelerinde istisna uygulaması ↗</a>
  </div>`;
}

function page({ path, type, title, h1, description, lead, resultTitle, explainer, faq }) {
  const results = scopedResults(type);
  const schemaJson = JSON.stringify(schema({ path, title, description, faq }));
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${SITE}${path}"><meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${SITE}${path}"><meta property="og:site_name" content="Maaşım.net"><meta name="twitter:card" content="summary"><link rel="stylesheet" href="/assets/termination-calculators.css"><script type="application/ld+json">${schemaJson}</script></head><body class="termination-page"><main><div class="termination-shell"><header class="termination-hero"><span class="termination-eyebrow">2026 güncel hesaplama</span><h1>${esc(h1)}</h1><p>${esc(lead)}</p><div class="termination-freshness"><span>Son mevzuat kontrolü: ${esc(DATA_2026.checkedAt)}</span><span>2026 II. yarı kıdem tavanı: ${money(DATA_2026.publishedData.severanceCeiling.secondHalfKurus)}</span></div></header><section class="termination-grid" data-termination-calculator="${type}"><div class="termination-panel">${calculatorForm(type)}</div><div class="termination-results" data-calculator-results hidden><h2>${esc(resultTitle)}</h2><div class="termination-error" data-calculator-error hidden></div>${results}</div></section><section class="termination-section">${explainer}</section><section class="termination-section"><h2>Diğer tazminat hesaplayıcıları</h2>${links()}</section><section class="termination-section"><h2>Resmî kaynaklar</h2><p>Hesaplama parametreleri ve hukuki açıklamalar aşağıdaki resmî kaynaklara dayanır.</p>${sourceList()}<p class="termination-disclaimer"><strong>Önemli:</strong> Bu araç, kıdem/ihbar hakkının doğduğu varsayımıyla tutar hesabı yapar; fesih nedeninize göre hukuken hak kazanıp kazanmadığınızı otomatik olarak belirlemez. İş sözleşmesi türü, fesih nedeni, toplu iş sözleşmesi ve özel durumlar sonucu değiştirebilir.</p></section><section class="termination-section termination-faq"><h2>Sık sorulan sorular</h2>${faq.map(({ q, a }) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</section></div></main><script type="module" src="/assets/termination-calculators.js"></script></body></html>`;
}

const severanceFaq = [
  { q: '2026 kıdem tazminatı tavanı ne kadar?', a: `1 Temmuz–31 Aralık 2026 döneminde bir hizmet yılı için kıdem tazminatı tavanı ${money(DATA_2026.publishedData.severanceCeiling.secondHalfKurus)}’dir. 1 Ocak–30 Haziran 2026 döneminde tavan ${money(DATA_2026.publishedData.severanceCeiling.firstHalfKurus)} idi.` },
  { q: 'Kıdem tazminatı nasıl hesaplanır?', a: 'Her tam çalışma yılı için 30 günlük son giydirilmiş ücret esas alınır. Bir yıldan artan ay ve günler aynı oranla eklenir. Giydirilmiş ücret fesih tarihindeki kıdem tavanını aşarsa hesap tavandan yapılır.' },
  { q: 'Kıdem tazminatından hangi kesintiler yapılır?', a: 'Yasal kıdem tazminatında gelir vergisi ve SGK primi kesilmez; damga vergisi uygulanır. Fesih ayındaki asgari ücret damga vergisi istisnasının normal ücrette kullanılmamış kısmı varsa şartları dahilinde kalan tutar tazminat ödemesinde kullanılabilir.' },
  { q: 'Yemek, yol, prim ve ikramiye kıdem hesabına girer mi?', a: 'Düzenli ve para ile ölçülebilen yemek, yol, prim, ikramiye ve benzeri menfaatler giydirilmiş ücrete dahil edilebilir. Yıllık düzenli prim/ikramiye son 12 aylık toplam üzerinden aylık paya çevrilir; tek seferlik veya süreklilik göstermeyen ödemeler aynı şekilde değerlendirilmez.' }
];

const noticeFaq = [
  { q: 'İhbar süresi kaç haftadır?', a: 'Çalışma süresi 6 aydan azsa 2 hafta, 6 ay–1,5 yıl arasındaysa 4 hafta, 1,5–3 yıl arasındaysa 6 hafta, 3 yıldan uzunsa 8 hafta bildirim süresi uygulanır.' },
  { q: 'İhbar tazminatında tavan var mı?', a: 'İhbar tazminatı hesabında kıdem tazminatındaki gibi bir tavan üst sınırı yoktur.' },
  { q: 'İhbar tazminatından hangi kesintiler yapılır?', a: 'İhbar tazminatından gelir vergisi ve damga vergisi kesilir; SGK ve işsizlik sigortası primi kesilmez. Fesih ayındaki normal ücrette asgari ücret gelir veya damga vergisi istisnasının tamamı kullanılamadıysa kalan istisna aynı ayda ücret sayılan ödemelerde şartları dahilinde kullanılabilir.' },
  { q: 'İhbar tazminatı hangi ücret üzerinden hesaplanır?', a: 'İhbar tazminatı giydirilmiş ücret üzerinden hesaplanır; düzenli para veya para ile ölçülebilen menfaatler dikkate alınır.' }
];

const pages = [
  {
    path: '/tazminat-hesaplama/', type: 'combined',
    title: 'Tazminat Hesaplama 2026: Kıdem ve İhbar | Maaşım.net',
    h1: 'Tazminat Hesaplama 2026: Kıdem ve İhbar',
    description: 'Kıdem ve ihbar tazminatını 2026 güncel tavan, hizmet süresi, giydirilmiş brüt ücret ve vergi dilimiyle birlikte hesaplayın.',
    lead: 'İşe giriş ve ayrılma tarihlerinizi, brüt ücretinizi ve düzenli yan haklarınızı girin; kıdem ve ihbar tazminatını tek hesapta karşılaştırın.',
    resultTitle: 'Kıdem + ihbar tazminatı sonucu',
    explainer: `<h2>Kıdem ve ihbar tazminatı arasındaki fark</h2><p>Kıdem tazminatı, gerekli hak kazanma koşulları oluştuğunda hizmet süresi ve fesih tarihindeki kıdem tavanı üzerinden hesaplanır. İhbar tazminatı ise belirsiz süreli iş sözleşmesinde bildirim süresine uyulmaması halinde gündeme gelir ve 2, 4, 6 veya 8 haftalık süreye göre hesaplanır.</p><table><thead><tr><th>Kalem</th><th>Kıdem</th><th>İhbar</th></tr></thead><tbody><tr><td>Temel hesap</td><td>Her yıl için 30 günlük giydirilmiş ücret</td><td>Bildirim süresi × günlük giydirilmiş ücret</td></tr><tr><td>Tavan</td><td>Var</td><td>Yok</td></tr><tr><td>Gelir vergisi</td><td>Yasal kıdem kapsamında yok</td><td>Var</td></tr><tr><td>SGK primi</td><td>Yok</td><td>Yok</td></tr></tbody></table><h2>2026 tavanı nasıl uygulanıyor?</h2><p>Fesih tarihi 2026’nın ilk yarısındaysa ${money(DATA_2026.publishedData.severanceCeiling.firstHalfKurus)}, ikinci yarısındaysa ${money(DATA_2026.publishedData.severanceCeiling.secondHalfKurus)} kıdem tavanı kullanılır. Giydirilmiş ücret tavanı aşarsa kıdem hesabı tavandan yapılır; ihbar hesabında aynı tavan uygulanmaz.</p>`,
    faq: [...severanceFaq.slice(0, 3), ...noticeFaq.slice(0, 3)]
  },
  {
    path: '/kidem-tazminati-hesaplama/', type: 'severance',
    title: 'Kıdem Tazminatı Hesaplama 2026 | Maaşım.net',
    h1: 'Kıdem Tazminatı Hesaplama 2026',
    description: '2026 kıdem tazminatınızı işe giriş ve çıkış tarihi, giydirilmiş brüt ücret ve güncel kıdem tavanıyla brüt ve net olarak hesaplayın.',
    lead: 'İşe giriş ve fesih tarihinizi, son brüt ücretinizi ve düzenli yan haklarınızı girin. Araç 2026 tavanını tarihe göre seçer ve hesabı adım adım gösterir.',
    resultTitle: 'Kıdem tazminatı sonucu',
    explainer: `<h2>2026 kıdem tazminatı formülü</h2><p>1475 sayılı İş Kanununun yürürlükteki 14. maddesi uyarınca her tam çalışma yılı için 30 günlük ücret esas alınır; bir yıldan artan süreler aynı oranla hesaba eklenir.</p><p><strong>Hesaba esas aylık ücret = düşük olan:</strong> son giydirilmiş brüt ücret veya fesih tarihindeki kıdem tavanı.</p><p><strong>Brüt kıdem = hesaba esas aylık ücret × (tam yıl + ay / 12 + gün / 365).</strong></p><p><strong>Net kıdem = brüt kıdem − damga vergisi.</strong> Yasal kıdem tazminatında gelir vergisi ve SGK primi hesaplanmaz.</p><h2>Giydirilmiş brüt ücret nedir?</h2><p>Son brüt maaşa düzenli ve para ile ölçülebilen menfaatler eklenir. Bakanlık; yol, yemek, düzenli prim ve ikramiye gibi ödemelerin dikkate alınabileceğini belirtir. Son 12 ayda düzenli prim/ikramiye toplamını yıllık alana yazarsanız araç bu tutarı 12’ye bölerek aylık payını ekler. <a href="/blog/kidem-tazminatina-dahil-odemeler/">Kıdem tazminatına dahil ödemeler rehberini inceleyin.</a></p><h2>2026 kıdem tazminatı tavanı</h2><table><thead><tr><th>Dönem</th><th>Bir hizmet yılı için tavan</th></tr></thead><tbody><tr><td>1 Ocak–30 Haziran 2026</td><td>${money(DATA_2026.publishedData.severanceCeiling.firstHalfKurus)}</td></tr><tr><td>1 Temmuz–31 Aralık 2026</td><td>${money(DATA_2026.publishedData.severanceCeiling.secondHalfKurus)}</td></tr></tbody></table><p>Hesaplayıcı fesih tarihine göre doğru dönemi otomatik seçer.</p>`,
    faq: severanceFaq
  },
  {
    path: '/ihbar-tazminati-hesaplama/', type: 'notice',
    title: 'İhbar Tazminatı Hesaplama 2026 | Maaşım.net',
    h1: 'İhbar Tazminatı Hesaplama 2026',
    description: '2026 ihbar tazminatını hizmet süresine göre 2, 4, 6 veya 8 haftalık bildirim süresi ve kümülatif vergi matrahıyla hesaplayın.',
    lead: 'Çalışma sürenize göre ihbar süresini otomatik belirleyin; giydirilmiş brüt üzerinden brüt ihbarı, gelir vergisini, damga vergisini ve tahmini net tutarı görün.',
    resultTitle: 'İhbar tazminatı sonucu',
    explainer: `<h2>İhbar tazminatı nasıl hesaplanır?</h2><p>4857 sayılı İş Kanununun 17. maddesindeki bildirim süreleri esas alınır. Giydirilmiş aylık ücret 30’a bölünerek günlük tutar bulunur ve hizmet süresine karşılık gelen ihbar günüyle çarpılır.</p><table><thead><tr><th>Çalışma süresi</th><th>Bildirim süresi</th></tr></thead><tbody><tr><td>6 aydan az</td><td>2 hafta / 14 gün</td></tr><tr><td>6 ay–1,5 yıl</td><td>4 hafta / 28 gün</td></tr><tr><td>1,5–3 yıl</td><td>6 hafta / 42 gün</td></tr><tr><td>3 yıldan fazla</td><td>8 hafta / 56 gün</td></tr></tbody></table><h2>Net ihbar neden kişiden kişiye değişir?</h2><p>İhbar tazminatı gelir vergisine tabi olduğu için aynı brüt ihbar tutarı farklı kümülatif vergi matrahlarında farklı net sonuç verebilir. Bu nedenle ödeme öncesindeki kümülatif gelir vergisi matrahını gelişmiş alanda girebilirsiniz. İhbar tazminatı SGK ve işsizlik sigortası primine tabi değildir.</p>`,
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
