import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { calculateRetiredWorker, SGDP_EMPLOYEE_RATE_PCT, SGDP_EMPLOYER_RATE_PCT } from '../src/retired-worker-engine.js';
import { DATA_2026 } from '../src/data-2026.js';

const SITE = 'https://maasim.net';
export const RETIRED_WORKER_ROUTE = '/emekli-calisan-maas-hesaplama/';
const TITLE = 'Emekli Çalışan Maaş Hesaplama 2026: Brütten Nete ve Netten Brüte (SGDP) | Maaşım.net';
const H1 = 'Emekli Çalışan Maaş Hesaplama 2026: Brütten Nete ve Netten Brüte';
const DESCRIPTION = `Emekli çalışanın 2026 net maaşını hesaplayın: %${SGDP_EMPLOYEE_RATE_PCT.toLocaleString('tr-TR')} SGDP, işsizlik primi yok. Brütten nete, netten brüte ve normal çalışanla fark.`;
const SGK_SGDP = 'https://www.sgk.gov.tr/Content/Post/ada02fa5-e15f-4e0d-b6c9-fef40a54eb3c/Emeklilikten-Sonra-Tekrar-Calisma-SGDP-2022-05-13-09-35-43';
const SCOPE = 'Bu hesap, ilk sigorta girişi 1 Ekim 2008’den önce olan emekliler içindir. 1 Ekim 2008 ve sonrasında ilk kez sigortalı olup emekli olanlar 4/a kapsamında çalışmaya başlarsa emekli aylığı kesilir ve SGDP yerine normal çalışan gibi prim öder.';
const CHECKED_AT = '2026-10-10';

const esc = (value = '') => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const tl = (kurus) => `${(kurus / 100).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
const pctTr = (v) => `%${v.toLocaleString('tr-TR')}`;
const fmtDate = (iso) => new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));

const EXAMPLES = [DATA_2026.payroll.minimumGrossKurus, 5_000_000, 10_000_000].map((gross) => {
  const r = calculateRetiredWorker({ mode: 'gross', amountKurus: gross });
  return { gross, retiredAvg: r.summary.averageNetKurus, normalAvg: r.normalSummary.averageNetKurus, jan: r.rows[0], diffMonthly: Math.round(r.annualNetAdvantageKurus / 12) };
});
const exampleRows = EXAMPLES.map((e) => `<tr><td>${tl(e.gross)}</td><td>${tl(e.jan.employeeSgdpKurus)}</td><td><b>${tl(e.retiredAvg)}</b></td><td>${tl(e.normalAvg)}</td><td>+${tl(e.diffMonthly)}</td></tr>`).join('');
const sample = EXAMPLES[1];

const FAQ = [
  ['Emekli çalışan maaşından ne kesilir?', `Emekli olup 4/a kapsamında çalışanların brüt ücretinden %${SGDP_EMPLOYEE_RATE_PCT.toLocaleString('tr-TR')} sosyal güvenlik destek primi (SGDP), gelir vergisi ve damga vergisi kesilir. Normal çalışandaki %14 SGK ve %1 işsizlik primi kesilmez.`],
  ['Emekli çalışan net maaşı normal çalışandan yüksek mi?', `Aynı brüt ücrette evet. Örneğin 50.000 TL brütte emekli çalışanın yıllık ortalama aylık neti ${tl(sample.retiredAvg)}, normal çalışanınki ${tl(sample.normalAvg)}; fark ayda ortalama ${tl(sample.diffMonthly)}. Fark, SGDP'nin SGK ve işsizlik priminden düşük olmasından gelir; vergi matrahı biraz yükseldiği için farkın bir kısmı vergiye gider.`],
  ['Emekli çalışanın işverene maliyeti nedir?', `İşveren %${SGDP_EMPLOYER_RATE_PCT.toLocaleString('tr-TR')} SGDP öder ve işsizlik primi ödemez. Bu oran, teşviksiz normal çalışan işveren payından yüksektir; işveren teşvikleri SGDP'ye uygulanmaz.`],
  ['Emekli çalışan asgari ücret istisnasından yararlanır mı?', 'Evet. Asgari ücrete isabet eden gelir vergisi ve damga vergisi istisnası emekli çalışanlara da uygulanır; hesaplayıcı bunu her ay dikkate alır.'],
  ['Emekli çalışırken emekli maaşı kesilir mi?', `İlk sigorta girişi 1 Ekim 2008’den önce olan emekliler 4/a kapsamında SGDP ödeyerek çalışabilir; bu hesaplayıcı yalnız çalışma ücretinin netini hesaplar. ${SCOPE.replace('Bu hesap, ilk sigorta girişi 1 Ekim 2008’den önce olan emekliler içindir. ', '')}`]
];

function schema() {
  const url = `${SITE}${RETIRED_WORKER_ROUTE}`;
  return { '@context': 'https://schema.org', '@graph': [
    { '@type': 'WebPage', '@id': `${url}#page`, url, name: TITLE, description: DESCRIPTION, inLanguage: 'tr-TR', datePublished: '2026-07-29', dateModified: CHECKED_AT },
    { '@type': 'WebApplication', '@id': `${url}#calculator`, url, name: 'Emekli Çalışan Maaş Hesaplama', applicationCategory: 'FinanceApplication', operatingSystem: 'Web', isAccessibleForFree: true, description: DESCRIPTION, offers: { '@type': 'Offer', price: 0, priceCurrency: 'TRY' } },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Hesaplama Araçları', item: `${SITE}/hesaplama-araclari/` },
      { '@type': 'ListItem', position: 3, name: 'Emekli Çalışan Maaş Hesaplama', item: url }
    ] },
    { '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }
  ] };
}

function page() {
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(TITLE)}</title><meta name="description" content="${esc(DESCRIPTION)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${SITE}${RETIRED_WORKER_ROUTE}"><meta property="og:type" content="website"><meta property="og:title" content="${esc(H1)}"><meta property="og:description" content="${esc(DESCRIPTION)}"><meta property="og:url" content="${SITE}${RETIRED_WORKER_ROUTE}"><meta property="og:site_name" content="Maaşım.net"><script type="application/ld+json">${JSON.stringify(schema())}</script><link rel="stylesheet" href="/assets/rw-calculator.css"></head><body class="rw-page"><main><div class="rw-shell">
<header class="rw-hero"><span class="rw-eyebrow">2026 · SGDP kurallarıyla</span><h1>${H1}</h1><p>Emekli olup çalışmaya devam ediyorsanız bordronuz farklı hesaplanır: SGK ve işsizlik primi yerine %${SGDP_EMPLOYEE_RATE_PCT.toLocaleString('tr-TR')} SGDP kesilir. Brüt veya hedef net ücretinizi girin; 12 aylık neti, kesintileri ve aynı ücretle normal çalışana göre farkı görün.</p><div class="rw-freshness"><span>Son kontrol: ${fmtDate(CHECKED_AT)}</span><span>Çalışan SGDP ${pctTr(SGDP_EMPLOYEE_RATE_PCT)} · İşveren SGDP ${pctTr(SGDP_EMPLOYER_RATE_PCT)}</span></div></header>
<section class="rw-answer"><h2>Kısa cevap</h2><p><strong>Kapsam:</strong> ${SCOPE} <a href="${SGK_SGDP}" rel="noopener noreferrer">SGK açıklaması</a>.</p><p>Emekli çalışanın brüt ücretinden <strong>%${SGDP_EMPLOYEE_RATE_PCT.toLocaleString('tr-TR')} SGDP</strong>, gelir vergisi ve damga vergisi kesilir; işsizlik primi kesilmez. Bu yüzden aynı brütte emekli çalışanın neti normal çalışandan yüksektir: 50.000 TL brütte yıllık ortalama net <strong>${tl(sample.retiredAvg)}</strong>, normal çalışanda ${tl(sample.normalAvg)}. İşveren ise %${SGDP_EMPLOYER_RATE_PCT.toLocaleString('tr-TR')} SGDP öder.</p></section>
<section class="rw-grid" data-rw-calculator><div class="rw-panel"><form novalidate><h2>Bilgilerini gir</h2><div class="rw-stack"><div class="rw-field"><label for="rwMode">Hesap yönü</label><select id="rwMode" name="mode"><option value="gross">Brütten nete</option><option value="net">Netten brüte</option></select></div><div class="rw-field"><label for="rwAmount" data-amount-label>Aylık brüt ücret (TL)</label><input id="rwAmount" name="amount" type="text" inputmode="decimal" placeholder="Örn. 50.000" required></div></div><p class="rw-help">İlk sigorta girişi 1 Ekim 2008’den önce olan emekliler içindir. Hesap 2026 parametreleriyle, yıl boyunca aynı aylık ücret varsayımıyla yapılır. Gelir vergisi kümülatif matraha göre aydan aya artabilir.</p><button class="rw-submit" type="submit">Hesapla</button></form></div>
<div class="rw-results" data-calculator-results hidden><h2>Emekli çalışan sonucu</h2><div class="rw-error" data-calculator-error hidden></div><div class="rw-result-grid"><article class="rw-result rw-result--primary"><span data-result="primary-label">Yıllık ortalama aylık net</span><strong data-result="primary">—</strong></article><article class="rw-result"><span>Aylık SGDP kesintisi (Ocak)</span><strong data-result="sgdp">—</strong></article><article class="rw-result"><span>Yıllık net toplam</span><strong data-result="annual-net">—</strong></article><article class="rw-result"><span>Normal çalışana göre yıllık net farkı</span><strong data-result="advantage">—</strong></article><article class="rw-result"><span>İşverene aylık ortalama maliyet</span><strong data-result="employer">—</strong></article></div><div class="rw-table-scroll"><table><caption class="visually-hidden">12 aylık emekli çalışan bordrosu</caption><thead><tr><th>Ay</th><th>Brüt</th><th>SGDP</th><th>Gelir vergisi</th><th>Damga</th><th>Net</th></tr></thead><tbody data-result="rows"></tbody></table></div></div></section>
<section class="rw-section"><h2>Emekli çalışan ile normal çalışan farkı</h2><div class="rw-table-scroll"><table><thead><tr><th>Kalem</th><th>Emekli çalışan</th><th>Normal çalışan</th></tr></thead><tbody><tr><td>Çalışan sosyal güvenlik primi</td><td>%${SGDP_EMPLOYEE_RATE_PCT.toLocaleString('tr-TR')} SGDP</td><td>%14 SGK</td></tr><tr><td>Çalışan işsizlik primi</td><td>Yok</td><td>%1</td></tr><tr><td>İşveren primi</td><td>%${SGDP_EMPLOYER_RATE_PCT.toLocaleString('tr-TR')} SGDP</td><td>%21,75 (teşviksiz)</td></tr><tr><td>İşveren işsizlik primi</td><td>Yok</td><td>%2</td></tr><tr><td>Gelir ve damga vergisi</td><td>Aynı tarife, asgari ücret istisnası dahil</td><td>Aynı</td></tr></tbody></table></div></section>
<section class="rw-section"><h2>Örnek: 2026'da aynı brütle emekli ve normal çalışan neti</h2><div class="rw-table-scroll"><table><thead><tr><th>Aylık brüt</th><th>Aylık SGDP</th><th>Emekli çalışan ort. net</th><th>Normal çalışan ort. net</th><th>Aylık fark</th></tr></thead><tbody>${exampleRows}</tbody></table></div><p>Ortalama net, 12 ayın netinin ortalamasıdır; gelir vergisi dilimi yıl içinde yükseldikçe aylık net düşebilir.</p></section>
<section class="rw-section"><h2>İlgili hesaplama araçları</h2><div class="rw-links"><a class="rw-link" href="/emeklilik-hesaplama/"><strong>Emeklilik Hesaplama</strong><span>Ne zaman emekli olacağınızı hesaplayın.</span></a><a class="rw-link" href="/emekli-zammi-hesaplama/"><strong>Emekli Zammı Hesaplama</strong><span>Ocak 2027 SSK ve Bağ-Kur zammı.</span></a><a class="rw-link" href="/"><strong>Maaş Hesaplama 2026</strong><span>Normal çalışan için brütten nete hesap.</span></a></div></section>
<section class="rw-section"><h2>Kaynaklar</h2><div class="rw-source-list"><a href="${SGK_SGDP}" rel="noopener noreferrer">SGK — Emeklilikten sonra tekrar çalışma ve SGDP ↗</a><a href="${DATA_2026.sources.sgk.url}" rel="noopener noreferrer">SGK — 2026 prime esas kazanç tutarları ↗</a><a href="${DATA_2026.sources.incomeTax.url}" rel="noopener noreferrer">GİB — ücret gelirlerinin vergilendirilmesi ↗</a><a href="/hesaplama-metodolojisi/">Maaşım.net hesaplama metodolojisi</a></div><p class="rw-disclaimer">Hesap bilgilendirme amaçlıdır; kesin bordro işvereninizin bordro kayıtlarına göre oluşur.</p></section>
<section class="rw-section rw-faq"><h2>Sık sorulan sorular</h2>${FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</section></div></main><script type="module" src="/assets/rw-calculator.js"></script></body></html>`;
}

export async function addRetiredWorkerCalculator(dist) {
  const dir = join(dist, RETIRED_WORKER_ROUTE.replace(/^\/+|\/+$/g, ''));
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'index.html'), page(), 'utf8');
  console.log('Emekli çalışan hesaplayıcı sayfası üretildi:', RETIRED_WORKER_ROUTE);
  return Object.freeze({ generated: 1 });
}
