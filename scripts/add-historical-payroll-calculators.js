import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  HISTORICAL_AGI_OPTIONS,
  HISTORICAL_PAYROLL_CHECKED_AT,
  HISTORICAL_YEARS,
  getHistoricalPayrollData,
  getHistoricalPeriod
} from '../src/historical-payroll-data.js';

const SITE = 'https://maasim.net';
const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const money = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const amount = (kurus) => money.format(kurus / 100);
const route = (year) => `/${year}-maas-hesaplama/`;

function description(year, data) {
  if (data.agiEnabled) return `${year} brüt maaşı nete veya net maaşı brüte çevirin. ${year} vergi dilimleri, SGK tavanı ve AGİ ile 12 aylık tarihsel bordroyu hesaplayın.`;
  return `${year} brüt maaşı nete veya net maaşı brüte çevirin. ${year} vergi dilimleri, SGK tavanı ve asgari ücret vergi istisnasıyla bordroyu hesaplayın.`;
}
function pageTitle(year) { return `${year} Maaş Hesaplama | Brütten Nete & Netten Brüte | Maaşım.net`; }
function heading(year) { return `${year} Maaş Hesaplama: Brütten Nete & Netten Brüte`; }

function faq(year, data) {
  const items = [
    [`${year} brütten nete maaş nasıl hesaplanır?`, `Aylık brüt ücretten çalışan SGK ve işsizlik sigortası primi düşülür; kalan vergi matrahına ${year} ücret gelirleri tarifesi kümülatif olarak uygulanır. Ardından ilgili yılın AGİ veya asgari ücret vergi istisnası ve damga vergisi kuralları dikkate alınır.`],
    [`${year} netten brüte maaş hesaplanabilir mi?`, `Evet. Araç hedef net ücreti, yılın her ayındaki kümülatif vergi matrahını koruyarak kuruş hassasiyetinde brüt ücrete çözer.`],
    [`${year} SGK tavanı hesaplamada dikkate alınıyor mu?`, `Evet. Her ay için ${year} döneminde geçerli prime esas kazanç üst sınırı uygulanır; 2022 ve 2023 gibi yıl ortasında asgari ücret değişen yıllarda dönem parametreleri ayrı kullanılır.`],
    ['Bu hesaplama bugünkü mevzuatı mı kullanıyor?', `Hayır. Bu sayfa tarihsel bir bordro aracıdır ve ${year} yılında geçerli olan ücret vergisi, SGK ve asgari ücret parametrelerini kullanır. Güncel 2026 hesabı için ana Maaş Hesaplama sayfasını kullanın.`],
    ['Maaş yıl ortasında değiştiyse hesaplanabilir mi?', 'Evet. Ocak–Haziran ve Temmuz–Aralık için iki ayrı aylık tutar girebilirsiniz. İkinci alan boş bırakılırsa ilk tutar yılın tamamında kullanılır.']
  ];
  if (data.agiEnabled) items.splice(2, 0, [`${year} AGİ hesaplamaya dahil mi?`, `Evet. ${year} yılında yürürlükte olan asgari geçim indirimi aile durumu seçimine göre uygulanır. Vergi dilimi nedeniyle net ücretin kanundaki taban netin altına düştüğü uygun durumlarda ilave AGİ koruması da hesaba katılır.`]);
  else items.splice(2, 0, [`${year} asgari ücret gelir ve damga vergisi istisnası uygulanıyor mu?`, `Evet. ${year} yılında yürürlükte olan asgari ücret düzeyine kadar gelir vergisi ve damga vergisi istisnası, kümülatif vergi tarifesi dikkate alınarak aylık olarak hesaplanır.`]);
  return items;
}

function schema(year, data) {
  const url = `${SITE}${route(year)}`;
  const desc = description(year, data);
  const faqs = faq(year, data);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', '@id': `${url}#page`, url, name: pageTitle(year), description: desc, inLanguage: 'tr-TR', dateModified: HISTORICAL_PAYROLL_CHECKED_AT },
      { '@type': 'WebApplication', '@id': `${url}#calculator`, url, name: `${year} Maaş Hesaplama`, alternateName: [`Brütten Nete ${year}`, `Netten Brüte ${year}`, `${year} Brüt Net Maaş Hesaplama`], applicationCategory: 'FinanceApplication', operatingSystem: 'Web', isAccessibleForFree: true, description: desc, offers: { '@type': 'Offer', price: 0, priceCurrency: 'TRY' } },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Hesaplama Araçları', item: `${SITE}/hesaplama-araclari/` },
        { '@type': 'ListItem', position: 3, name: `${year} Maaş Hesaplama`, item: url }
      ]},
      { '@type': 'FAQPage', mainEntity: faqs.map(([q,a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }
    ]
  };
}

function taxTable(data) {
  let previous = 0;
  return data.incomeTaxBrackets.map((bracket) => {
    const rate = bracket.ratePpm / 10_000;
    const upper = Number.isFinite(bracket.upToKurus) ? bracket.upToKurus / 100 : Infinity;
    const label = Number.isFinite(upper)
      ? previous === 0 ? `${new Intl.NumberFormat('tr-TR').format(upper)} TL'ye kadar` : `${new Intl.NumberFormat('tr-TR').format(previous)} – ${new Intl.NumberFormat('tr-TR').format(upper)} TL`
      : `${new Intl.NumberFormat('tr-TR').format(previous)} TL üzeri`;
    previous = upper;
    return `<tr><td>${label}</td><td>%${rate}</td></tr>`;
  }).join('');
}

function yearLinks(currentYear) {
  const years = [...HISTORICAL_YEARS].sort((a,b) => b-a);
  return `<div class="historical-year-links"><a href="/">2026 güncel</a>${years.map((year) => `<a href="${route(year)}"${year === currentYear ? ' aria-current="page"' : ''}>${year}</a>`).join('')}<a href="/2027-maas-hesaplama/">2027 tahmin</a></div>`;
}

function sourceList(data) {
  return data.sourceUrls.map((url, index) => {
    const label = url.includes('csgb.gov.tr') ? 'ÇSGB — yıllar itibarıyla asgari ücret hesaplamaları' : url.includes('2020_ucret') ? 'GİB — 2020 Ücret Geliri Rehberi ve AGİ tablosu' : url.includes('2021_ucret') ? 'GİB — 2021 Ücret Geliri Rehberi ve AGİ tablosu' : url.includes('2025Ucret') ? 'GİB — 2025 Ücret Geliri Vergi Rehberi' : index === data.sourceUrls.length - 1 ? 'GİB — Gelir Vergisi Kanunu ve tarihsel ücret tarifeleri' : 'Gelir İdaresi Başkanlığı';
    return `<li><a href="${url}" rel="noopener noreferrer">${label}</a></li>`;
  }).join('');
}

function agiField(data) {
  if (!data.agiEnabled) return '';
  return `<div class="historical-field"><label for="agi-option">AGİ aile durumu</label><select id="agi-option" name="agi_option">${HISTORICAL_AGI_OPTIONS.map((item) => `<option value="${item.id}">${item.label}</option>`).join('')}</select><small>${data.year} yılında AGİ yürürlükteydi. Seçim aylık AGİ tutarını değiştirir.</small></div>`;
}

function benchmarkCards(year) {
  const january = getHistoricalPeriod(year, 0);
  const july = getHistoricalPeriod(year, 6);
  return `<div class="historical-benchmarks"><article class="historical-benchmark"><span>${year} resmî asgari ücret</span><strong data-official-minimum>${amount(january.minimumGrossKurus)} brüt · ${amount(january.referenceMinimumNetKurus)} net</strong></article><article class="historical-benchmark" data-official-minimum-july${july.minimumGrossKurus === january.minimumGrossKurus ? ' hidden' : ''}><span>Temmuz–Aralık</span><strong>${amount(july.minimumGrossKurus)} brüt · ${amount(july.referenceMinimumNetKurus)} net</strong></article><article class="historical-benchmark"><span>SGK aylık tavan${july.sgkCeilingKurus !== january.sgkCeilingKurus ? ' (Ocak / Temmuz)' : ''}</span><strong>${amount(january.sgkCeilingKurus)}${july.sgkCeilingKurus !== january.sgkCeilingKurus ? ` / ${amount(july.sgkCeilingKurus)}` : ''}</strong></article></div>`;
}

function page(year) {
  const data = getHistoricalPayrollData(year);
  const desc = description(year, data);
  const faqs = faq(year, data);
  const january = getHistoricalPeriod(year, 0);
  const hasMidYearMinimumChange = getHistoricalPeriod(year, 6).minimumGrossKurus !== january.minimumGrossKurus;
  const taxMechanism = data.agiEnabled
    ? `${year} yılında AGİ yürürlükteydi. Aile durumuna göre AGİ hesaplanır; Gelir Vergisi Kanunu'nun o dönemdeki ilave AGİ taban koruması uygun bordrolarda ayrıca uygulanır.`
    : `${year} yılında ücretlerin asgari ücret düzeyine kadar olan kısmı için gelir ve damga vergisi istisnası uygulanır. İstisna tutarı da kümülatif vergi tarifesiyle ay ay ilerler.`;

  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${pageTitle(year)}</title><meta name="description" content="${desc}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${SITE}${route(year)}"><meta property="og:type" content="website"><meta property="og:title" content="${heading(year)}"><meta property="og:description" content="${desc}"><meta property="og:url" content="${SITE}${route(year)}"><meta property="og:site_name" content="Maaşım.net"><meta name="twitter:card" content="summary"><meta name="twitter:title" content="${heading(year)}"><meta name="twitter:description" content="${desc}"><script type="application/ld+json">${JSON.stringify(schema(year, data))}</script><link rel="stylesheet" href="/assets/historical-payroll-calculator.css"></head><body class="historical-payroll-page" data-historical-year="${year}"><main><div class="historical-shell"><header class="historical-hero"><span class="historical-eyebrow">Tarihsel bordro · ${year} mevzuatı</span><h1>${heading(year)}</h1><p>${year} yılında geçerli gerçek ücret vergisi, SGK tavanı ve ${data.agiEnabled ? 'AGİ' : 'asgari ücret vergi istisnası'} kurallarıyla 12 aylık bordroyu yeniden hesaplayın. ${hasMidYearMinimumChange ? `${year} Temmuz asgari ücret değişikliği ayrı dönem olarak uygulanır.` : ''}</p><div class="historical-trust"><span>Resmî ÇSGB benchmarkları</span><span>GİB ücret vergi tarifesi</span><span>SGK tavanı ay bazında</span><span>Veri kontrolü: ${HISTORICAL_PAYROLL_CHECKED_AT}</span></div></header>
<section class="historical-grid" data-historical-payroll-calculator data-historical-year="${year}"><div class="historical-panel"><form novalidate><h2>${year} bordronu hesapla</h2><p>Aynı yıl içinde maaş değişikliği varsa ikinci yarı tutarını ayrı girebilirsiniz.</p><fieldset class="historical-modes"><label class="historical-mode"><input type="radio" name="direction" value="gross_to_net" checked><span><strong>Brütten nete</strong><small>Brüt ücret → aylık net</small></span></label><label class="historical-mode"><input type="radio" name="direction" value="net_to_gross"><span><strong>Netten brüte</strong><small>Hedef net → gerekli brüt</small></span></label></fieldset><div class="historical-row"><div class="historical-field"><label for="first-amount"><span data-amount-label>Aylık brüt ücret</span> · Ocak–Haziran</label><input id="first-amount" name="first_amount" type="text" inputmode="decimal" autocomplete="off" placeholder="Örn. 50.000,00"></div><div class="historical-field"><label for="second-amount">Temmuz–Aralık tutarı</label><input id="second-amount" name="second_amount" type="text" inputmode="decimal" autocomplete="off" placeholder="Boş bırakırsanız ilk tutar kullanılır"><small data-second-helper>Temmuz–Aralık için maaş değiştiyse girin.</small></div></div>${agiField(data)}<button class="historical-submit" type="submit">${year} maaşını hesapla</button><div class="historical-note"><strong>Kapsam:</strong> Standart 4/a ücret bordrosu, tam ay çalışma ve yalnız ücret geliri varsayılır. BES/özel sigorta, engellilik indirimi, özel teşvik veya ek bordro kalemleri dahil değildir. Asgari ücret altındaki tam zamanlı brütler için uyarı gösterilir.</div><div class="historical-error" data-historical-error hidden></div></form></div><aside class="historical-results" data-historical-results hidden><h2>${year} sonuç özeti</h2><p>Aylar kümülatif gelir vergisi matrahıyla birbirine bağlı hesaplanır.</p><div class="historical-primary"><span data-primary-label>Aylık ortalama net</span><strong data-primary-value>—</strong></div><div class="historical-metrics"><article class="historical-metric"><span>Yıllık brüt</span><strong data-result="annual-gross">—</strong></article><article class="historical-metric"><span>Yıllık net</span><strong data-result="annual-net">—</strong></article><article class="historical-metric"><span>Gelir + damga vergisi</span><strong data-result="annual-tax">—</strong></article><article class="historical-metric"><span>Çalışan SGK + işsizlik</span><strong data-result="annual-premium">—</strong></article></div><p class="historical-warning" data-result="minimum-warning"></p><button type="button" class="historical-copy" data-copy-historical>Sonucu kopyala</button></aside></section>
<section class="historical-section"><h2>${year} resmî bordro benchmarkları</h2><p>Motorun temel referansları Çalışma ve Sosyal Güvenlik Bakanlığının yayımladığı dönemsel net/brüt asgari ücret rakamlarıyla kilitlenmiştir.</p>${benchmarkCards(year)}</section>
<section class="historical-section"><h2>12 aylık bordro detayı</h2><div class="historical-table-wrap"><table class="historical-table"><thead><tr><th>Ay</th><th>Brüt</th><th>SGK + işsizlik</th><th>Gelir vergisi</th><th>Damga vergisi</th><th>Vergi dilimi</th><th>Net</th></tr></thead><tbody data-historical-table><tr><td colspan="7">Hesaplama yaptığınızda aylık sonuçlar burada görünür.</td></tr></tbody></table></div></section>
<section class="historical-section"><h2>${year} hesaplama mantığı</h2><p>Çalışan SGK primi %14 ve işsizlik sigortası çalışan payı %1 olarak prime esas kazanç üzerinden hesaplanır; prime esas kazanç ilgili dönemin SGK tavanını aşamaz. Gelir vergisi matrahı brüt ücretten bu çalışan primleri düşüldükten sonra bulunur ve yıl içinde kümülatif ilerler. ${taxMechanism}</p><p>Damga vergisi oranı binde 7,59'dur. Netten brüte modunda her ay hedef net için gerekli brüt tutar çözülürken önceki ayların kümülatif vergi matrahı korunur; bu nedenle aynı hedef net için yılın ilerleyen aylarında gerekli brüt değişebilir.</p></section>
<section class="historical-section"><h2>${year} ücret gelirleri vergi tarifesi</h2><div class="historical-table-wrap"><table class="historical-table"><thead><tr><th>Kümülatif ücret matrahı</th><th>Oran</th></tr></thead><tbody>${taxTable(data)}</tbody></table></div></section>
<section class="historical-section"><h2>Diğer yıllara geç</h2>${yearLinks(year)}</section>
<section class="historical-section"><h2>Resmî kaynaklar ve güncellik</h2><p>Bu tarihsel parametre seti ${HISTORICAL_PAYROLL_CHECKED_AT} tarihinde yeniden kontrol edildi. Sayfa bugünkü 2026 parametrelerini geçmiş yıllara uygulamaz; her yıl kendi tarihsel veri setini kullanır.</p><ul class="historical-sources">${sourceList(data)}</ul></section>
<section class="historical-section"><h2>Sık sorulan sorular</h2>${faqs.map(([q,a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('')}</section>
</div></main><script type="module" src="/assets/historical-payroll-calculator.js"></script></body></html>`;
}

export async function addHistoricalPayrollCalculators(dist) {
  for (const year of HISTORICAL_YEARS) {
    const dir = join(dist, `${year}-maas-hesaplama`);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, 'index.html'), page(year), 'utf8');
  }
  console.log(`Tarihsel maaş hesaplayıcıları üretildi: ${HISTORICAL_YEARS.join(', ')}`);
  return Object.freeze({ generated: HISTORICAL_YEARS.length, years: HISTORICAL_YEARS });
}
