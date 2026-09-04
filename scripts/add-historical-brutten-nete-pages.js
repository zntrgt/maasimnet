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
const money = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const amount = (kurus) => money.format(kurus / 100);
const route = (year) => `/brutten-nete-${year}/`;
const genericRoute = (year) => `/${year}-maas-hesaplama/`;

function title(year) { return `Brütten Nete ${year} Maaş Hesaplama | Maaşım.net`; }
function heading(year) { return `Brütten Nete ${year} Maaş Hesaplama`; }
function description(year, data) {
  return data.agiEnabled
    ? `${year} brüt maaşınızı o yılın vergi dilimleri, SGK tavanı ve AGİ kurallarıyla nete çevirin; 12 aylık tarihsel bordroyu görün.`
    : `${year} brüt maaşınızı o yılın vergi dilimleri, SGK tavanı ve asgari ücret vergi istisnasıyla nete çevirin; 12 aylık bordroyu görün.`;
}

function faq(year, data) {
  const items = [
    [`Brütten nete ${year} hesaplama nasıl yapılır?`, `Brüt ücretten çalışan SGK ve işsizlik primi düşülür. Kalan vergi matrahına ${year} ücret gelirleri tarifesi kümülatif uygulanır; ardından ilgili yılın vergi avantajları ve damga vergisi dikkate alınır.`],
    [`${year} vergi dilimi maaşı ay ay değiştirir mi?`, `Evet. Gelir vergisi matrahı yıl içinde kümülatif ilerlediği için aynı brüt ücretin neti yılın ilerleyen aylarında değişebilir.`],
    [`${year} SGK tavanı uygulanıyor mu?`, `Evet. Her ay için ${year} döneminde geçerli prime esas kazanç üst sınırı kullanılır. 2022 ve 2023 Temmuz değişiklikleri ayrı dönem olarak hesaplanır.`],
    [`Netten brüte ${year} hesabı nerede?`, `Netten brüte ve iki yönlü ${year} bordro hesabı için ${year} Maaş Hesaplama sayfasını kullanabilirsiniz.`],
    ['Bu sayfa güncel 2026 oranlarını mı kullanıyor?', `Hayır. Bu araç yalnız ${year} yılında geçerli tarihsel ücret vergisi, SGK ve asgari ücret parametrelerini kullanır.`]
  ];
  if (data.agiEnabled) items.splice(2, 0, [`${year} AGİ dahil mi?`, `Evet. ${year} yılında yürürlükte olan AGİ aile durumu seçimine göre uygulanır; uygun bordrolarda dönemin ilave AGİ taban koruması da dikkate alınır.`]);
  else items.splice(2, 0, [`${year} asgari ücret vergi istisnası dahil mi?`, `Evet. ${year} yılında yürürlükte olan asgari ücret seviyesindeki gelir ve damga vergisi istisnası ay ay uygulanır.`]);
  return items;
}

function schema(year, data) {
  const url = `${SITE}${route(year)}`;
  const desc = description(year, data);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', '@id': `${url}#page`, url, name: title(year), description: desc, inLanguage: 'tr-TR', dateModified: HISTORICAL_PAYROLL_CHECKED_AT },
      { '@type': 'WebApplication', '@id': `${url}#calculator`, url, name: heading(year), alternateName: [`Brütten Nete ${year}`, `${year} Brüt Maaş Net Hesaplama`, `Brütten Nete Hesaplama ${year}`], applicationCategory: 'FinanceApplication', operatingSystem: 'Web', isAccessibleForFree: true, description: desc, offers: { '@type': 'Offer', price: 0, priceCurrency: 'TRY' } },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Hesaplama Araçları', item: `${SITE}/hesaplama-araclari/` },
        { '@type': 'ListItem', position: 3, name: heading(year), item: url }
      ]},
      { '@type': 'FAQPage', mainEntity: faq(year, data).map(([q,a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }
    ]
  };
}

function sourceList(data) {
  return data.sourceUrls.map((url) => {
    const label = url.includes('csgb.gov.tr') ? 'ÇSGB — tarihsel asgari ücret verileri' : 'GİB — tarihsel ücret vergisi ve AGİ/istisna kuralları';
    return `<li><a href="${url}" rel="noopener noreferrer">${label}</a></li>`;
  }).join('');
}

function agiField(data) {
  if (!data.agiEnabled) return '';
  return `<div class="historical-field"><label for="agi-option">AGİ aile durumu</label><select id="agi-option" name="agi_option">${HISTORICAL_AGI_OPTIONS.map((item) => `<option value="${item.id}">${item.label}</option>`).join('')}</select><small>${data.year} yılında AGİ yürürlükteydi; aile durumu net ücreti etkiler.</small></div>`;
}

function benchmarkCards(year) {
  const jan = getHistoricalPeriod(year, 0);
  const jul = getHistoricalPeriod(year, 6);
  return `<div class="historical-benchmarks"><article class="historical-benchmark"><span>${year} resmî asgari ücret</span><strong data-official-minimum>${amount(jan.minimumGrossKurus)} brüt · ${amount(jan.referenceMinimumNetKurus)} net</strong></article><article class="historical-benchmark" data-official-minimum-july${jul.minimumGrossKurus === jan.minimumGrossKurus ? ' hidden' : ''}><span>Temmuz–Aralık</span><strong>${amount(jul.minimumGrossKurus)} brüt · ${amount(jul.referenceMinimumNetKurus)} net</strong></article><article class="historical-benchmark"><span>SGK aylık tavan${jul.sgkCeilingKurus !== jan.sgkCeilingKurus ? ' (Ocak / Temmuz)' : ''}</span><strong>${amount(jan.sgkCeilingKurus)}${jul.sgkCeilingKurus !== jan.sgkCeilingKurus ? ` / ${amount(jul.sgkCeilingKurus)}` : ''}</strong></article></div>`;
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
  return `<div class="historical-year-links"><a href="/">2026 güncel</a>${[...HISTORICAL_YEARS].sort((a,b)=>b-a).map((year) => `<a href="${route(year)}"${year === currentYear ? ' aria-current="page"' : ''}>${year}</a>`).join('')}</div>`;
}

function page(year) {
  const data = getHistoricalPayrollData(year);
  const jan = getHistoricalPeriod(year, 0);
  const jul = getHistoricalPeriod(year, 6);
  const desc = description(year, data);
  const faqs = faq(year, data);
  const midYear = jan.minimumGrossKurus !== jul.minimumGrossKurus;
  const taxMechanism = data.agiEnabled
    ? `${year} yılında AGİ yürürlükteydi. Seçtiğiniz aile durumuna göre AGİ uygulanır; dönemin ilave AGİ taban koruması uygun bordrolarda ayrıca dikkate alınır.`
    : `${year} yılında asgari ücret seviyesindeki gelir ve damga vergisi istisnası, kümülatif ücret vergisi tarifesiyle birlikte ay ay uygulanır.`;

  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title(year)}</title><meta name="description" content="${desc}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${SITE}${route(year)}"><meta property="og:type" content="website"><meta property="og:title" content="${heading(year)}"><meta property="og:description" content="${desc}"><meta property="og:url" content="${SITE}${route(year)}"><meta property="og:site_name" content="Maaşım.net"><meta name="twitter:card" content="summary"><meta name="twitter:title" content="${heading(year)}"><meta name="twitter:description" content="${desc}"><script type="application/ld+json">${JSON.stringify(schema(year, data))}</script><link rel="stylesheet" href="/assets/historical-payroll-calculator.css"></head><body class="historical-payroll-page" data-historical-year="${year}"><main><div class="historical-shell"><header class="historical-hero"><span class="historical-eyebrow">Tarihsel bordro · brütten nete</span><h1>${heading(year)}</h1><p>${year} yılında geçerli gerçek vergi dilimleri, SGK tavanı ve ${data.agiEnabled ? 'AGİ' : 'asgari ücret vergi istisnası'} kurallarıyla brüt maaşınızın ay ay net karşılığını hesaplayın.${midYear ? ` ${year} Temmuz parametre değişikliği otomatik uygulanır.` : ''}</p><div class="historical-trust"><span>Resmî ÇSGB benchmarkları</span><span>GİB ücret tarifesi</span><span>12 aylık kümülatif matrah</span><span>Kontrol: ${HISTORICAL_PAYROLL_CHECKED_AT}</span></div></header>
${benchmarkCards(year)}
<section class="historical-grid" data-historical-payroll-calculator data-historical-year="${year}" data-query-owner="brutten-nete-${year}"><div class="historical-panel"><form novalidate><h2>${year} brüt maaşını nete çevir</h2><p>Brüt ücretinizi girin. Maaşınız Temmuz'da değiştiyse ikinci yarı tutarını ayrıca yazabilirsiniz.</p><div class="historical-row"><div class="historical-field"><label for="first-amount"><span data-amount-label>Aylık brüt ücret</span> · Ocak–Haziran</label><input id="first-amount" name="first_amount" type="text" inputmode="decimal" autocomplete="off" placeholder="Örn. 50.000,00"></div><div class="historical-field"><label for="second-amount">Temmuz–Aralık brüt ücret</label><input id="second-amount" name="second_amount" type="text" inputmode="decimal" autocomplete="off" placeholder="Boş bırakırsanız ilk tutar kullanılır"><small data-second-helper>Temmuz–Aralık için maaş değiştiyse girin.</small></div></div>${agiField(data)}<button class="historical-submit" type="submit">Brütten nete ${year} hesapla</button><div class="historical-note"><strong>Kapsam:</strong> Standart 4/a ücret bordrosu, tam ay çalışma ve yalnız ücret geliri varsayılır. BES/özel sigorta, engellilik indirimi, özel teşvik ve ek bordro kalemleri kapsam dışıdır.</div><div class="historical-error" data-historical-error hidden></div></form></div><aside class="historical-results" data-historical-results hidden><h2>${year} net maaş sonucu</h2><p>Her ay, yıl başından gelen kümülatif gelir vergisi matrahıyla hesaplanır.</p><div class="historical-primary"><span data-primary-label>Aylık ortalama net</span><strong data-primary-value>—</strong></div><div class="historical-metrics"><article class="historical-metric"><span>Yıllık brüt</span><strong data-result="annual-gross">—</strong></article><article class="historical-metric"><span>Yıllık net</span><strong data-result="annual-net">—</strong></article><article class="historical-metric"><span>Yıllık vergi</span><strong data-result="annual-tax">—</strong></article><article class="historical-metric"><span>Çalışan SGK + işsizlik</span><strong data-result="annual-premium">—</strong></article></div><p class="historical-warning" data-result="minimum-warning"></p><button type="button" class="historical-copy" data-copy-historical>Sonucu kopyala</button></aside></section>
<section class="historical-section"><h2>${year} aylık brütten nete bordro</h2><div class="historical-table-wrap"><table><thead><tr><th>Ay</th><th>Brüt</th><th>SGK + İşsizlik</th><th>Gelir Vergisi</th><th>Damga</th><th>Vergi Dilimi</th><th>Net</th></tr></thead><tbody data-historical-table></tbody></table></div></section>
<section class="historical-section"><h2>${year} hesabında hangi kurallar kullanılıyor?</h2><p>${taxMechanism}</p><p>Çalışan SGK primi %14, işsizlik sigortası primi %1 olarak hesaplanır; SGK matrahı o dönemin prime esas kazanç üst sınırını aşamaz.</p><div class="historical-table-wrap"><table><thead><tr><th>${year} ücret geliri matrahı</th><th>Oran</th></tr></thead><tbody>${taxTable(data)}</tbody></table></div></section>
<section class="historical-section"><h2>Netten brüte veya genel ${year} maaş hesabı</h2><p>Bu sayfa yalnız <strong>brütten nete ${year}</strong> sorgusunun sahibidir. Netten brüte hesaplamak veya iki yönlü tarihsel bordro kullanmak için <a href="${genericRoute(year)}">${year} Maaş Hesaplama</a> aracına geçin.</p>${yearLinks(year)}</section>
<section class="historical-section"><h2>Resmî kaynaklar ve hesap kontrolü</h2><p>Parametreler ${HISTORICAL_PAYROLL_CHECKED_AT} tarihinde resmî tarihsel kaynaklarla yeniden kontrol edildi. Minimum ücret benchmarkları CI'da birebir eşleşmeden yayın yapılamaz.</p><ul>${sourceList(data)}</ul><p><a href="/hesaplama-metodolojisi/">Hesaplama metodolojisi</a> · <a href="/test-raporu/">Test raporu</a></p></section>
<section class="historical-section"><h2>Sık sorulan sorular</h2>${faqs.map(([q,a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('')}</section></div></main><script type="module" src="/assets/historical-payroll-calculator.js"></script></body></html>`;
}

export async function addHistoricalGrossToNetPages(dist) {
  let generated = 0;
  for (const year of HISTORICAL_YEARS) {
    const dir = join(dist, route(year).replace(/^\/+|\/+$/g, ''));
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, 'index.html'), page(year), 'utf8');
    generated += 1;
  }
  console.log(`Tarihsel brütten-net sayfaları üretildi: ${generated}`);
  return Object.freeze({ generated });
}
