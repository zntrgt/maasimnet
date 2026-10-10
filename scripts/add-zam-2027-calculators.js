import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { KNOWN_MONTHS, PERIOD_MONTHS, MEMUR_RATES, MIN_PENSION_KURUS, ZAM_DATA_CHECKED_AT, JAN_SEP_CUMULATIVE_PCT, knownCumulativePct, scenarioPresets, emekliZam, memurZam } from '../src/zam-2027-engine.js';

const SITE = 'https://maasim.net';
export const EMEKLI_ROUTE = '/emekli-zammi-hesaplama/';
export const MEMUR_ROUTE = '/memur-zammi-hesaplama/';
const SOURCES = Object.freeze({
  tuik: 'https://veriportali.tuik.gov.tr/',
  tuikSep: 'https://www.forbes.com.tr/ekonomi/tuik-eylul-enflasyonunu-acikladi-eylul-2026-tuketici-fiyat-endeksi-tuik',
  threeMonth: 'https://www.sozcu.com.tr/emeklinin-3-aylik-zam-orani-kesinlesti-p366211',
  minPension: 'https://www.aa.com.tr/tr/gundem/en-dusuk-emekli-ayliginin-artirilmasina-yonelik-duzenlemeyi-de-iceren-kanun-teklifi-tbmm-genel-kurulunda-kabul-edildi/4008556',
  julyRaise: 'https://tr.euronews.com/business/2026/07/03/enflasyon-verisiyle-memur-ve-emekli-zamlari-belli-oldu-en-dusuk-emekli-maasi-ne-kadar-olac',
  hakem: 'https://medyascope.tv/2025/08/27/hakem-kurulunun-memur-maasi-karari-resmi-gazetede/',
  tcmb: 'https://tr.euronews.com/2026/08/13/merkez-bankasi-2026-yil-sonu-enflasyon-tahminini-yuzde-28e-yukseltti',
  pka: 'https://www.forbes.com.tr/haberler/tcmb-anketinde-yil-sonu-enflasyon-beklentisi-eylulde-yukseldi'
});

const esc = (value = '') => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const pct = (value) => `%${Number(value).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const tl = (kurus) => `${(kurus / 100).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
const fmtDate = (iso) => new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));
const known = knownCumulativePct();
const knownLabel = `${KNOWN_MONTHS[0].label.split(' ')[0]}–${KNOWN_MONTHS.at(-1).label}`;
const remainingNames = PERIOD_MONTHS.slice(KNOWN_MONTHS.length);
const presets = scenarioPresets();
const defaultPreset = presets.find((p) => p.key === 'pka');

const monthRows = PERIOD_MONTHS.map((name, i) => {
  const m = KNOWN_MONTHS[i];
  return `<tr><td>${name} 2026</td><td>${m ? pct(m.pct) : 'Açıklanmadı'}</td><td>${m ? 'Kesinleşti (TÜİK)' : 'Varsayım'}</td></tr>`;
}).join('');

function scenarioRows(kind) {
  return presets.map((p) => {
    if (kind === 'emekli') {
      const r = emekliZam({ currentKurus: MIN_PENSION_KURUS, assumedMonthlyPct: p.monthlyPct });
      return `<tr><td>${esc(p.label)}</td><td>${pct(p.monthlyPct)}</td><td><b>${pct(r.raisePct)}</b></td><td>${tl(r.minPensionScenarioKurus)}</td></tr>`;
    }
    const r = memurZam({ currentKurus: 7_025_700, assumedMonthlyPct: p.monthlyPct });
    return `<tr><td>${esc(p.label)}</td><td>${pct(p.monthlyPct)}</td><td>${pct(r.inflationPct)}</td><td>${pct(r.farkPct)}</td><td><b>${pct(r.raisePct)}</b></td></tr>`;
  }).join('');
}

const presetOptions = presets.map((p) => `<option value="${p.monthlyPct}"${p.key === 'pka' ? ' selected' : ''}>${esc(p.label)} → aylık ${pct(p.monthlyPct)}</option>`).join('') + '<option value="custom">Kendi varsayımımı gireceğim</option>';

const PAGES = {
  emekli: {
    route: EMEKLI_ROUTE,
    title: 'Emekli Zammı Hesaplama Ocak 2027: SSK ve Bağ-Kur Zam Oranı | Maaşım.net',
    h1: 'Emekli Zammı Hesaplama: Ocak 2027 SSK ve Bağ-Kur',
    description: `Ocak 2027 SSK ve Bağ-Kur emekli zammını hesaplayın. ${knownLabel} kesinleşen enflasyon ${pct(known)}; kalan aylar için TCMB ve piyasa senaryolarıyla yeni aylığınızı görün.`,
    eyebrow: 'SSK · Bağ-Kur · Ocak 2027',
    intro: 'Mevcut emekli aylığınızı girin; Temmuz–Aralık 2026 enflasyonuna göre Ocak 2027 zam oranını ve yeni aylığınızı görün. Açıklanmamış aylar için resmî tahminlerden türetilmiş senaryolardan birini seçin veya kendi varsayımınızı girin.',
    amountLabel: 'Mevcut aylık emekli maaşınız (TL)',
    placeholder: 'Örn. 23.552',
    answer: `<p><strong>Ocak 2027 emekli zammı henüz kesinleşmedi.</strong> SSK ve Bağ-Kur emeklilerinin Ocak zammı, Temmuz–Aralık 2026 dönemindeki 6 aylık enflasyona eşittir. ${knownLabel} döneminde kesinleşen oran <strong>${pct(known)}</strong>. Kalan ${remainingNames.join(', ')} ayları için piyasa beklentisiyle tahmini zam <strong>${pct(emekliZam({ currentKurus: MIN_PENSION_KURUS, assumedMonthlyPct: defaultPreset.monthlyPct }).raisePct)}</strong> civarında. Kesin oran, Aralık enflasyonunun açıklandığı Ocak 2027'nin ilk iş günlerinde belli olur.</p><p>En düşük emekli aylığı Temmuz 2026'dan beri <strong>${tl(MIN_PENSION_KURUS)}</strong>. Bu taban tutar kanunla belirlenir; zam oranı kendiliğinden tabana uygulanmaz, yeni bir yasal düzenleme gerekir.</p>`,
    scenarioHead: '<tr><th>Senaryo</th><th>Kalan aylar için aylık enflasyon</th><th>Ocak 2027 zam oranı</th><th>En düşük aylık zam oranıyla artarsa</th></tr>',
    method: '<p>Emekli zammı = Temmuz–Aralık 2026 kümülatif TÜFE değişimi. Aylık oranlar birleşik olarak çarpılır: (1 + Temmuz) × (1 + Ağustos) × … × (1 + Aralık) − 1. TÜİK resmî oranı endeks değerlerinden hesapladığı için sonuç ondalıkta birkaç puan farklı olabilir.</p><p><strong>Kapsam:</strong> SSK (4/a) ve Bağ-Kur (4/b) emeklileri. Emekli Sandığı (4/c) emeklileri memur zammı formülüne tabidir: <a href="/memur-zammi-hesaplama/">memur zammı hesaplama</a>.</p>',
    faq: [
      ['Ocak 2027 emekli zammı ne kadar olacak?', `Kesin oran Ocak 2027'nin ilk iş günlerinde Aralık enflasyonuyla belli olacak. ${knownLabel} kesinleşen enflasyon ${pct(known)}; kalan üç ay için TCMB tahmini ve piyasa beklentisine göre toplam zam ${presets.map((p) => pct(emekliZam({ currentKurus: MIN_PENSION_KURUS, assumedMonthlyPct: p.monthlyPct }).raisePct)).join(', ')} senaryolarında hesaplanır.`],
      ['Emekli zammı nasıl hesaplanır?', 'SSK ve Bağ-Kur emeklilerinin aylıkları, Ocak ve Temmuz aylarında önceki altı ayın TÜFE değişimi kadar artırılır. Ocak 2027 zammı için Temmuz–Aralık 2026 dönemi esas alınır.'],
      ['En düşük emekli aylığı Ocak 2027\'de ne olacak?', `En düşük emekli aylığı Temmuz 2026'dan itibaren ${tl(MIN_PENSION_KURUS)}. Taban tutarın artması için yeni bir kanun düzenlemesi gerekir; tabloda yalnızca zam oranı aynen uygulanırsa oluşacak tutar senaryo olarak gösterilir.`],
      ['3 aylık emekli zammı kesinleşti mi?', `${knownLabel} dönemindeki aylık enflasyon kesinleşti ve birleşik olarak ${pct(known)} oldu. Bu, Ocak zammının ilk yarısıdır; Ekim, Kasım ve Aralık verileriyle tamamlanır.`],
      ['Emekli Sandığı emeklileri bu hesaplamaya dahil mi?', 'Hayır. Emekli Sandığı (4/c) emeklileri memur maaş artışıyla aynı formüle tabidir: toplu sözleşme zammı ve enflasyon farkı.']
    ]
  },
  memur: {
    route: MEMUR_ROUTE,
    title: 'Memur Zammı Hesaplama Ocak 2027: Enflasyon Farkı ve Toplu Sözleşme | Maaşım.net',
    h1: 'Memur Zammı Hesaplama: Ocak 2027 Enflasyon Farkı',
    description: `Ocak 2027 memur ve memur emeklisi zammını hesaplayın: %${MEMUR_RATES.h1_2027} toplu sözleşme zammı ve 2026 ikinci yarı enflasyon farkı. Kesinleşen ${knownLabel} enflasyonu ${pct(known)}.`,
    eyebrow: 'Memur · Memur emeklisi · Ocak 2027',
    intro: 'Mevcut net maaşınızı veya emekli aylığınızı girin; 2027 ilk yarı toplu sözleşme zammı ile 2026 ikinci yarı enflasyon farkını birlikte hesaplayalım.',
    amountLabel: 'Mevcut aylık maaşınız veya emekli aylığınız (TL)',
    placeholder: 'Örn. 70.257',
    answer: `<p><strong>Ocak 2027 memur zammı iki parçadan oluşur:</strong> 2027'nin ilk yarısı için toplu sözleşmeyle belirlenen <strong>%${MEMUR_RATES.h1_2027}</strong> artış ve 2026'nın ikinci yarısında enflasyonun %${MEMUR_RATES.h2_2026} toplu sözleşme artışını aştığı kısım (enflasyon farkı). ${knownLabel} enflasyonu <strong>${pct(known)}</strong> oldu; %${MEMUR_RATES.h2_2026} sınırına yaklaşık ${pct(((1 + MEMUR_RATES.h2_2026 / 100) / (1 + known / 100) - 1) * 100)} kaldı. Piyasa beklentisiyle tahmini toplam zam <strong>${pct(memurZam({ currentKurus: 7_025_700, assumedMonthlyPct: defaultPreset.monthlyPct }).raisePct)}</strong>.</p><p>Aynı oran memur emeklilerine (Emekli Sandığı, 4/c) de uygulanır.</p>`,
    scenarioHead: '<tr><th>Senaryo</th><th>Kalan aylar için aylık enflasyon</th><th>6 aylık enflasyon</th><th>Enflasyon farkı</th><th>Ocak 2027 toplam zam</th></tr>',
    method: `<p>Enflasyon farkı = (1 + 6 aylık enflasyon) ÷ (1 + %${MEMUR_RATES.h2_2026}) − 1; enflasyon %${MEMUR_RATES.h2_2026}'nin altında kalırsa fark sıfırdır. Toplam zam = (1 + enflasyon farkı) × (1 + %${MEMUR_RATES.h1_2027}) − 1.</p><p>Oranlar 8. dönem toplu sözleşmesinden (Kamu Görevlileri Hakem Kurulu kararı): 2026 ikinci yarı %${MEMUR_RATES.h2_2026}, 2027 ilk yarı %${MEMUR_RATES.h1_2027}, 2027 ikinci yarı %4. Hesap, maaşın tüm kalemlerine aynı oranın uygulandığını varsayar; ek ödeme, tazminat veya seyyanen artış farkları ayrıca değerlendirilmelidir.</p>`,
    faq: [
      ['Ocak 2027 memur zammı ne kadar olacak?', `Kesin oran Aralık 2026 enflasyonu açıklanınca belli olur. Toplu sözleşmeden gelen %${MEMUR_RATES.h1_2027} kesin; buna 2026 ikinci yarı enflasyon farkı eklenir. Senaryolara göre toplam zam ${presets.map((p) => pct(memurZam({ currentKurus: 7_025_700, assumedMonthlyPct: p.monthlyPct }).raisePct)).join(', ')} olarak hesaplanır.`],
      ['Memur enflasyon farkı nasıl hesaplanır?', `2026'nın ikinci yarısında memur maaşlarına %${MEMUR_RATES.h2_2026} zam yapıldı. Temmuz–Aralık enflasyonu bunu aşarsa aşan kısım, (1 + enflasyon) ÷ (1 + %${MEMUR_RATES.h2_2026}) − 1 formülüyle Ocak 2027'de maaşa eklenir.`],
      ['Memur emeklisi zammı memur zammıyla aynı mı?', 'Evet. Emekli Sandığı (4/c) emeklilerinin aylıkları, memur maaş katsayılarına bağlı olduğu için aynı toplu sözleşme zammı ve enflasyon farkı oranında artar.'],
      ['2027 toplu sözleşme zammı kaç?', `8. dönem toplu sözleşme için Kamu Görevlileri Hakem Kurulu, 2027'nin ilk yarısı için %${MEMUR_RATES.h1_2027}, ikinci yarısı için %4 artış belirledi.`],
      ['Enflasyon farkı ne zaman belli olur?', 'Aralık 2026 enflasyonunun TÜİK tarafından açıklandığı Ocak 2027\'nin ilk iş günlerinde kesinleşir ve Ocak maaşına yansır.']
    ]
  }
};

function schema(page) {
  const url = `${SITE}${page.route}`;
  return { '@context': 'https://schema.org', '@graph': [
    { '@type': 'WebPage', '@id': `${url}#page`, url, name: page.title, description: page.description, inLanguage: 'tr-TR', datePublished: ZAM_DATA_CHECKED_AT, dateModified: ZAM_DATA_CHECKED_AT },
    { '@type': 'WebApplication', '@id': `${url}#calculator`, url, name: page.h1, applicationCategory: 'FinanceApplication', operatingSystem: 'Web', isAccessibleForFree: true, description: page.description, offers: { '@type': 'Offer', price: 0, priceCurrency: 'TRY' } },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Hesaplama Araçları', item: `${SITE}/hesaplama-araclari/` },
      { '@type': 'ListItem', position: 3, name: page.h1.split(':')[0], item: url }
    ] },
    { '@type': 'FAQPage', mainEntity: page.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }
  ] };
}

function html(kind) {
  const page = PAGES[kind];
  const other = kind === 'emekli' ? `<a class="zam-link" href="${MEMUR_ROUTE}"><strong>Memur Zammı Hesaplama</strong><span>Toplu sözleşme ve enflasyon farkıyla Ocak 2027 memur zammı.</span></a>` : `<a class="zam-link" href="${EMEKLI_ROUTE}"><strong>Emekli Zammı Hesaplama</strong><span>SSK ve Bağ-Kur emeklileri için Ocak 2027 zammı.</span></a>`;
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(page.title)}</title><meta name="description" content="${esc(page.description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${SITE}${page.route}"><meta property="og:type" content="website"><meta property="og:title" content="${esc(page.h1)}"><meta property="og:description" content="${esc(page.description)}"><meta property="og:url" content="${SITE}${page.route}"><meta property="og:site_name" content="Maaşım.net"><script type="application/ld+json">${JSON.stringify(schema(page))}</script><link rel="stylesheet" href="/assets/zam-calculator.css"></head><body class="zam-page"><main><div class="zam-shell">
<header class="zam-hero"><span class="zam-eyebrow">${page.eyebrow}</span><h1>${page.h1}</h1><p>${page.intro}</p><div class="zam-freshness"><span>Son veri kontrolü: ${fmtDate(ZAM_DATA_CHECKED_AT)}</span><span>Kesinleşen: ${knownLabel} ${pct(known)}</span></div></header>
<section class="zam-answer"><h2>Kısa cevap</h2>${page.answer}</section>
<section class="zam-grid" data-zam-calculator="${kind}"><div class="zam-panel"><form novalidate><h2>Bilgilerini gir</h2><div class="zam-stack"><div class="zam-field"><label for="currentAmount">${page.amountLabel}</label><input id="currentAmount" name="currentAmount" type="text" inputmode="decimal" placeholder="${page.placeholder}" required></div><div class="zam-field"><label for="scenario">${remainingNames.join(', ')} için enflasyon varsayımı</label><select id="scenario" name="scenario">${presetOptions}</select></div><div class="zam-field" data-custom-field hidden><label for="customMonthly">Kalan her ay için aylık enflasyon (%)</label><input id="customMonthly" name="customMonthly" type="text" inputmode="decimal" placeholder="Örn. 1,5"></div></div><p class="zam-help">TCMB ve piyasa senaryoları, Ocak–Eylül kümülatif enflasyonu (%${JAN_SEP_CUMULATIVE_PCT.toLocaleString('tr-TR')}) ile yıl sonu tahminini eşitleyen aylık oranı kullanır.</p><button class="zam-submit" type="submit">Ocak 2027 zammını hesapla</button></form></div>
<div class="zam-results" data-calculator-results hidden><h2>Ocak 2027 tahmini</h2><div class="zam-error" data-calculator-error hidden></div><div class="zam-result-grid"><article class="zam-result zam-result--primary"><span>Yeni aylık tutar</span><strong data-result="new">—</strong></article><article class="zam-result"><span>Zam oranı</span><strong data-result="rate">—</strong></article><article class="zam-result"><span>Aylık artış</span><strong data-result="increase">—</strong></article><article class="zam-result zam-result--status"><span>Hesabın dayanağı</span><strong data-result="basis">—</strong></article></div><p class="zam-disclaimer"><strong>Önemli:</strong> Kalan aylar varsayımdır; kesin oran Aralık 2026 enflasyonu açıklanınca belli olur.</p></div></section>
<section class="zam-section"><h2>Temmuz–Aralık 2026 aylık enflasyon</h2><div class="zam-table-scroll"><table><thead><tr><th>Ay</th><th>Aylık TÜFE</th><th>Durum</th></tr></thead><tbody>${monthRows}</tbody></table></div><p>Kesinleşen ${KNOWN_MONTHS.length} ayın birleşik değişimi: <strong>${pct(known)}</strong>. Kaynak: <a href="${SOURCES.tuikSep}" rel="noopener noreferrer">TÜİK Eylül 2026 TÜFE</a>, <a href="${SOURCES.threeMonth}" rel="noopener noreferrer">3 aylık oran</a>.</p></section>
<section class="zam-section"><h2>Ocak 2027 zam senaryoları</h2><p>Aşağıdaki oranlar tahmin değil, kalan aylar için farklı enflasyon varsayımlarının matematiksel sonucudur.</p><div class="zam-table-scroll"><table><thead>${page.scenarioHead}</thead><tbody>${scenarioRows(kind)}</tbody></table></div><p>Senaryo kaynakları: <a href="${SOURCES.tcmb}" rel="noopener noreferrer">TCMB Enflasyon Raporu III</a>, <a href="${SOURCES.pka}" rel="noopener noreferrer">Eylül 2026 Piyasa Katılımcıları Anketi</a>.</p></section>
<section class="zam-section"><h2>Hesaplama yöntemi</h2>${page.method}</section>
<section class="zam-section"><h2>İlgili hesaplama araçları</h2><div class="zam-links">${other}<a class="zam-link" href="/emeklilik-hesaplama/"><strong>Emeklilik Hesaplama</strong><span>Ne zaman emekli olacağınızı hesaplayın.</span></a><a class="zam-link" href="/blog/2027-maas-zammi-beklentileri/"><strong>2027 Asgari Ücret ve Maaş Zammı</strong><span>Güncel veriler ve senaryolar.</span></a></div></section>
<section class="zam-section"><h2>Kaynaklar</h2><div class="zam-source-list"><a href="${SOURCES.tuik}" rel="noopener noreferrer">TÜİK Veri Portalı ↗</a><a href="${SOURCES.julyRaise}" rel="noopener noreferrer">Temmuz 2026 memur ve emekli zamları (Euronews) ↗</a><a href="${SOURCES.minPension}" rel="noopener noreferrer">En düşük emekli aylığı düzenlemesi (AA, 24 Temmuz 2026) ↗</a><a href="${SOURCES.hakem}" rel="noopener noreferrer">8. dönem toplu sözleşme Hakem Kurulu kararı ↗</a></div><p class="zam-disclaimer">Bu sayfa bilgilendirme amaçlıdır. Kişisel aylık tutarınız SGK veya kurumunuz tarafından hesaplanır.</p></section>
<section class="zam-section zam-faq"><h2>Sık sorulan sorular</h2>${page.faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</section></div></main><script type="module" src="/assets/zam-2027-calculator.js"></script></body></html>`;
}

export async function addZam2027Calculators(dist) {
  for (const kind of ['emekli', 'memur']) {
    const dir = join(dist, PAGES[kind].route.replace(/^\/+|\/+$/g, ''));
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, 'index.html'), html(kind), 'utf8');
  }
  console.log('Ocak 2027 zam hesaplayıcıları üretildi:', EMEKLI_ROUTE, MEMUR_ROUTE);
  return Object.freeze({ generated: 2 });
}
