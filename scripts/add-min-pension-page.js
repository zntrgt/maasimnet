import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { isFinal, KNOWN_MONTHS, PERIOD_MONTHS, MIN_PENSION_KURUS, ZAM_DATA_CHECKED_AT, knownCumulativePct, scenarioPresets, emekliZam } from '../src/zam-2027-engine.js';
import { historyRows, latestMinPension, minPensionOutlook } from '../src/min-pension-engine.js';

const SITE = 'https://maasim.net';
export const MIN_PENSION_ROUTE = '/en-dusuk-emekli-maasi/';
const SOURCES = Object.freeze({
  law7590: 'https://www.sozcu.com.tr/en-dusuk-emekli-maasi-ne-kadar-oldu-2026-p341158',
  july2026: 'https://tr.euronews.com/2026/07/24/duzenleme-kabul-edildi-en-dusuk-emekli-ayligi-belli-oldu',
  jan2026: 'https://tr.euronews.com/2026/01/22/tbmmde-kabul-edildi-en-dusuk-emekli-maasi-20000-tl-oldu',
  jul2024: 'https://tr.euronews.com/2024/07/27/en-dusuk-emekli-maasinin-12500-tl-olmasini-ongoren-teklif-kabul-edildi',
  jul2024Raise: 'https://cnnturk.com/ekonomi/galeri/haber-emeklilerin-temmuz-ayi-zammi-belli-oldu-2128554',
  jan2024Raise: 'https://www.milliyet.com.tr/ekonomi/ssk-ve-bag-kur-emeklileri-icin-de-yuzde-49-25-zam-7068672',
  kokMaas: 'https://www.ey.com/tr_tr/insights/tax/en-dusuk-emekli-maasi-ve-kok-maas-kavrami'
});

const esc = (value = '') => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const pct = (value) => `%${Number(value).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const tl = (kurus) => `${(kurus / 100).toLocaleString('tr-TR', { minimumFractionDigits: kurus % 100 ? 2 : 0, maximumFractionDigits: 2 })} TL`;
const fmtDate = (iso) => new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));

const latest = latestMinPension();
if (latest.kurus !== MIN_PENSION_KURUS) throw new Error('MIN_PENSION_HISTORY son satırı MIN_PENSION_KURUS ile aynı olmalı.');
const FINAL = isFinal();
const known = knownCumulativePct();
const knownLabel = `${KNOWN_MONTHS[0].label.split(' ')[0]}–${KNOWN_MONTHS.at(-1).label}`;
const remainingNames = PERIOD_MONTHS.slice(KNOWN_MONTHS.length);
const presets = scenarioPresets();
const defaultPreset = presets.find((p) => p.key === 'pka');
const defaultZam = emekliZam({ currentKurus: MIN_PENSION_KURUS, assumedMonthlyPct: FINAL ? 0 : defaultPreset.monthlyPct });
const rows = historyRows();
const indexedCount = rows.filter((r) => r.relation === 'same').length;
const LATEST_TEXT = tl(MIN_PENSION_KURUS);
const SUFFIX = { 1: "'inde", 2: "'sinde", 3: "'ünde", 4: "'ünde", 5: "'inde", 6: "'sında", 7: "'sinde", 8: "'inde", 9: "'unda", 0: "'ında" };
const share = `son ${rows.length} düzenlemenin ${indexedCount}${SUFFIX[indexedCount % 10]}`;
const RELATION = { same: 'Zam oranıyla aynı', above: 'Zam oranının üzerinde', below: 'Zam oranının altında' };

// Örnek: kök aylığı 15.000 TL olan emekli.
const example = minPensionOutlook({ kokKurus: 1_500_000, assumedMonthlyPct: FINAL ? 0 : defaultPreset.monthlyPct, floorMode: 'same' });

const page = {
  title: `En Düşük Emekli Maaşı 2026: ${LATEST_TEXT} · Ocak 2027'de Ne Olacak? | Maaşım.net`,
  h1: `En Düşük Emekli Maaşı: ${LATEST_TEXT} ve Ocak 2027 Senaryoları`,
  // Açıklamada kesme işareti (') kullanılmaz: meta kalite betiği içeriği ilk tırnakta keser.
  description: `En düşük emekli maaşı ${latest.label} itibarıyla ${LATEST_TEXT}. Ocak 2027 tabanı ne olur, zam size yansır mı? Kök aylığınızla hesaplayın.`,
  faq: [
    ['En düşük emekli maaşı ne kadar?', `SSK ve Bağ-Kur emeklileri için en düşük emekli aylığı ${latest.label}'dan itibaren ${LATEST_TEXT}. Tutar 7590 sayılı Kanunla belirlendi ve 31 Temmuz 2026'da Resmî Gazete'de yayımlandı.`],
    ['Ocak 2027\'de en düşük emekli maaşı ne kadar olacak?', `Henüz belli değil; taban aylık için yeni bir kanun gerekir. ${share[0].toUpperCase()}${share.slice(1)} taban, emekli zammıyla aynı oranda artırıldı. Bu örüntü sürerse ${FINAL ? '' : 'piyasa beklentisi senaryosunda '}Ocak 2027 tabanı yaklaşık ${tl(defaultZam.minPensionScenarioKurus)} olur.`],
    ['En düşük emekli maaşı alanlar zam alır mı?', 'Emekli zammı kök aylığa uygulanır. Kök aylığı tabanın altında kalanların eline geçen tutar, taban aylık yeni bir kanunla artırılmadıkça değişmez. Taban artırılırsa ödeme yeni tabana yükselir.'],
    ['Kök maaş nedir, nasıl öğrenilir?', 'Kök aylık, SGK’nın prim gününüz ve kazançlarınıza göre hesapladığı, taban desteği eklenmemiş aylıktır. e-Devlet’teki aylık ödeme dökümünüzde toplam tutardan Hazine desteği (5510 sayılı Kanun ek madde 19) satırını çıkararak bulabilirsiniz.'],
    ['Dul ve yetim aylığında taban nasıl uygulanır?', 'Taban aylık dosya bazında uygulanır: dosyadaki toplam aylık tabana tamamlanır ve hak sahipleri arasında hisseleri oranında paylaştırılır. Bu yüzden tek bir hak sahibinin aldığı tutar tabandan düşük olabilir.'],
    ['Memur emeklileri en düşük emekli maaşı düzenlemesine dahil mi?', 'Bu düzenleme SSK (4/a) ve Bağ-Kur (4/b) emeklilerini kapsar. Memur emeklilerinin (Emekli Sandığı, 4/c) aylığı katsayı sistemiyle belirlenir ve memur zammı oranında artar.']
  ]
};

function schema() {
  const url = `${SITE}${MIN_PENSION_ROUTE}`;
  return { '@context': 'https://schema.org', '@graph': [
    { '@type': 'WebPage', '@id': `${url}#page`, url, name: page.title, description: page.description, inLanguage: 'tr-TR', datePublished: ZAM_DATA_CHECKED_AT, dateModified: ZAM_DATA_CHECKED_AT },
    { '@type': 'WebApplication', '@id': `${url}#calculator`, url, name: 'En düşük emekli maaşı ve Ocak 2027 hesaplama', applicationCategory: 'FinanceApplication', operatingSystem: 'Web', isAccessibleForFree: true, description: page.description, offers: { '@type': 'Offer', price: 0, priceCurrency: 'TRY' } },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Hesaplama Araçları', item: `${SITE}/hesaplama-araclari/` },
      { '@type': 'ListItem', position: 3, name: 'En Düşük Emekli Maaşı', item: url }
    ] },
    { '@type': 'FAQPage', mainEntity: page.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }
  ] };
}

const historyTable = rows.map((r) => `<tr><td>${r.label}</td><td><strong>${tl(r.kurus)}</strong></td><td>${pct(r.floorPct)}</td><td>${pct(r.raisePct)}</td><td>${RELATION[r.relation]}</td></tr>`).join('');
const scenarioTable = FINAL
  ? `<tr><td>Kesinleşen Temmuz–Aralık 2026 enflasyonu</td><td>${pct(defaultZam.raisePct)}</td><td><strong>${tl(defaultZam.minPensionScenarioKurus)}</strong></td><td>${LATEST_TEXT}</td></tr>`
  : presets.map((p) => {
    const z = emekliZam({ currentKurus: MIN_PENSION_KURUS, assumedMonthlyPct: p.monthlyPct });
    return `<tr><td>${esc(p.label)}</td><td>${pct(z.raisePct)}</td><td><strong>${tl(z.minPensionScenarioKurus)}</strong></td><td>${LATEST_TEXT}</td></tr>`;
  }).join('');
const presetOptions = presets.map((p) => `<option value="${p.monthlyPct}"${p.key === 'pka' ? ' selected' : ''}>${esc(p.label)} → aylık ${pct(p.monthlyPct)}</option>`).join('') + '<option value="custom">Kendi varsayımımı gireceğim</option>';

function html() {
  const answer = `<p><strong>En düşük emekli maaşı ${latest.label}'dan beri ${LATEST_TEXT}.</strong> Tutar, 20.000 TL'lik tabanın Ocak–Haziran 2026 enflasyonu kadar (${pct(latest.raisePct)}) artırılmasıyla bulundu; 7590 sayılı Kanun 31 Temmuz 2026'da Resmî Gazete'de yayımlandı. SSK ve Bağ-Kur emeklilerinin yaşlılık, malullük ve ölüm aylıklarına dosya bazında uygulanır.</p><p><strong>Ocak 2027 tabanı henüz belli değil.</strong> Emekli zammı kendiliğinden tabana uygulanmaz; yeni bir kanun gerekir. ${share[0].toUpperCase()}${share.slice(1)} taban, emekli zammıyla aynı oranda artırıldı. Bu sürerse Ocak 2027 tabanı ${FINAL ? '' : 'piyasa beklentisi senaryosunda '}yaklaşık <strong>${tl(defaultZam.minPensionScenarioKurus)}</strong> olur.</p>`;
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(page.title)}</title><meta name="description" content="${esc(page.description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${SITE}${MIN_PENSION_ROUTE}"><meta property="og:type" content="website"><meta property="og:title" content="${esc(page.h1)}"><meta property="og:description" content="${esc(page.description)}"><meta property="og:url" content="${SITE}${MIN_PENSION_ROUTE}"><meta property="og:site_name" content="Maaşım.net"><script type="application/ld+json">${JSON.stringify(schema())}</script><link rel="stylesheet" href="/assets/zam-calculator.css"></head><body class="zam-page"><main><div class="zam-shell">
<header class="zam-hero"><span class="zam-eyebrow">SSK · Bağ-Kur · Taban aylık</span><h1>${page.h1}</h1><p>Kök aylığınızı girin; Ocak 2027 zammından sonra eline geçecek tutarı, taban aylığın artıp artmamasına göre görün.</p><div class="zam-freshness"><span>Son veri kontrolü: ${fmtDate(ZAM_DATA_CHECKED_AT)}</span><span>Güncel taban: ${LATEST_TEXT}</span></div></header>
<section class="zam-answer"><h2>Kısa cevap</h2>${answer}</section>
<section class="zam-grid" data-mp-calculator><div class="zam-panel"><form novalidate><h2>Bilgilerini gir</h2><div class="zam-stack"><div class="zam-field"><label for="kok">Kök aylığınız (TL)</label><input id="kok" name="kok" type="text" inputmode="decimal" placeholder="Örn. 15.000" required></div>${FINAL ? '<input type="hidden" name="scenario" value="0">' : `<div class="zam-field"><label for="scenario">${remainingNames.join(', ')} için enflasyon varsayımı</label><select id="scenario" name="scenario">${presetOptions}</select></div><div class="zam-field" data-custom-field hidden><label for="customMonthly">Kalan her ay için aylık enflasyon (%)</label><input id="customMonthly" name="customMonthly" type="text" inputmode="decimal" placeholder="Örn. 1,5"></div>`}<div class="zam-field"><label for="floorMode">Ocak 2027 taban aylık senaryosu</label><select id="floorMode" name="floorMode"><option value="indexed" selected>Taban zam oranında artar (${share} böyle oldu)</option><option value="same">Taban değişmez (yeni kanun çıkmazsa)</option><option value="custom">Taban tutarını ben gireceğim</option></select></div><div class="zam-field" data-custom-floor hidden><label for="customFloor">Ocak 2027 taban aylık (TL)</label><input id="customFloor" name="customFloor" type="text" inputmode="decimal" placeholder="Örn. 27.000"></div></div><p class="zam-help">Kök aylığınızı bilmiyorsanız: e-Devlet’teki aylık ödeme dökümünde toplam tutardan Hazine desteği (ek madde 19) satırını çıkarın. Bu satır yoksa kök aylığınız tabanın üzerindedir.</p><button class="zam-submit" type="submit">Ocak 2027 tutarını hesapla</button></form></div>
<div class="zam-results" data-calculator-results hidden><h2>Ocak 2027 ${FINAL ? 'tutarı' : 'tahmini'}</h2><div class="zam-error" data-calculator-error hidden></div><div class="zam-result-grid"><article class="zam-result zam-result--primary"><span>Eline geçecek aylık</span><strong data-result="payment">—</strong></article><article class="zam-result"><span>Zamlı kök aylık</span><strong data-result="kok">—</strong></article><article class="zam-result"><span>Hazine taban desteği</span><strong data-result="topup">—</strong></article><article class="zam-result"><span>Bugüne göre artış</span><strong data-result="effective">—</strong></article><article class="zam-result zam-result--status"><span>Zam size yansır mı?</span><strong data-result="note">—</strong></article></div><p class="zam-disclaimer"><strong>Önemli:</strong> Ocak 2027 tabanı kanunla belirlenecek${FINAL ? '' : ', zam oranı da Aralık enflasyonuyla kesinleşecek'}. Sonuç seçtiğiniz senaryonun hesabıdır.</p></div></section>
<section class="zam-section"><h2>Zam neden herkese yansımıyor?</h2><p>Emekli zammı <strong>kök aylığa</strong> uygulanır. Kök aylığı tabanın altında kalan emekliye aradaki fark Hazine tarafından “taban desteği” olarak ödenir ve bu destek kök aylığa eklenmez. Örneğin kök aylığı 15.000 TL olan bir emeklinin kökü Ocak 2027'de ${pct(example.raisePct)} zamla ${tl(example.newKokKurus)} olur ama hâlâ ${LATEST_TEXT} tabanının altında kalır. Taban artırılmazsa bu emeklinin eline geçen tutar değişmez; taban artırılırsa yeni tabanı alır.</p></section>
<section class="zam-section"><h2>Ocak 2027 taban aylık senaryoları</h2><p>Taban, emekli zammıyla aynı oranda artırılırsa oluşacak tutarlar. ${FINAL ? '' : `Kesinleşen ${knownLabel} enflasyonu ${pct(known)}; kalan aylar varsayımdır.`}</p><div class="zam-table-scroll"><table><thead><tr><th>Senaryo</th><th>Ocak 2027 emekli zammı</th><th>Taban zam oranında artarsa</th><th>Taban değişmezse</th></tr></thead><tbody>${scenarioTable}</tbody></table></div><p>Zam oranı ayrıntıları için <a href="/emekli-zammi-hesaplama/">emekli zammı hesaplama</a> sayfasına bakın.</p></section>
<section class="zam-section"><h2>En düşük emekli maaşı tarihçesi</h2><div class="zam-table-scroll"><table><thead><tr><th>Dönem</th><th>Taban aylık</th><th>Tabandaki artış</th><th>Aynı dönem emekli zammı</th><th>Karşılaştırma</th></tr></thead><tbody>${historyTable}</tbody></table></div><p>Ocak 2024 artışı, Nisan 2023'ten beri geçerli 7.500 TL'ye göre hesaplandı. Ocak 2024 zammına %11,68 ek zam dahildir.</p></section>
<section class="zam-section"><h2>Kimler kapsamda?</h2><ul><li><strong>SSK (4/a) ve Bağ-Kur (4/b)</strong> emeklileri: yaşlılık, malullük ve ölüm (dul/yetim) aylıkları.</li><li><strong>Dosya bazında uygulanır:</strong> dul ve yetim aylığında dosyadaki toplam tutar tabana tamamlanır, hak sahipleri hisseleri oranında paylaşır.</li><li><strong>Memur emeklileri (4/c)</strong> bu düzenlemeye değil katsayı sistemine tabidir: <a href="/memur-zammi-hesaplama/">memur zammı hesaplama</a>.</li></ul></section>
<section class="zam-section"><h2>İlgili hesaplama araçları</h2><div class="zam-links"><a class="zam-link" href="/emekli-zammi-hesaplama/"><strong>Emekli Zammı Hesaplama</strong><span>Ocak 2027 SSK ve Bağ-Kur zam oranı.</span></a><a class="zam-link" href="/emeklilik-hesaplama/"><strong>Emeklilik Hesaplama</strong><span>Ne zaman emekli olacağınızı hesaplayın.</span></a><a class="zam-link" href="/emekli-calisan-maas-hesaplama/"><strong>Emekli Çalışan Maaş Hesaplama</strong><span>Emekliyken çalışınca net maaşınız.</span></a></div></section>
<section class="zam-section"><h2>Kaynaklar</h2><div class="zam-source-list"><a href="${SOURCES.law7590}" rel="noopener noreferrer">7590 sayılı Kanun, Resmî Gazete 31 Temmuz 2026 (Sözcü) ↗</a><a href="${SOURCES.july2026}" rel="noopener noreferrer">Temmuz 2026 taban aylık düzenlemesi ve kapsamı (Euronews) ↗</a><a href="${SOURCES.jan2026}" rel="noopener noreferrer">Ocak 2026: 20.000 TL ve %12,19 zam (Euronews) ↗</a><a href="${SOURCES.jul2024}" rel="noopener noreferrer">Temmuz 2024: 12.500 TL (Euronews) ↗</a><a href="${SOURCES.jul2024Raise}" rel="noopener noreferrer">Temmuz 2024 emekli zammı %24,73 (CNN Türk) ↗</a><a href="${SOURCES.jan2024Raise}" rel="noopener noreferrer">Ocak 2024 emekli zammı %49,25 (Milliyet) ↗</a><a href="${SOURCES.kokMaas}" rel="noopener noreferrer">Kök maaş ve taban aylık tarihçesi (EY Türkiye) ↗</a></div><p class="zam-disclaimer">Bu sayfa bilgilendirme amaçlıdır. Kişisel aylık tutarınızı SGK hesaplar.</p></section>
<section class="zam-section zam-faq"><h2>Sık sorulan sorular</h2>${page.faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</section></div></main><script type="module" src="/assets/min-pension-calculator.js"></script></body></html>`;
}

export async function addMinPensionPage(dist) {
  const dir = join(dist, MIN_PENSION_ROUTE.replace(/^\/+|\/+$/g, ''));
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'index.html'), html(), 'utf8');
  console.log('En düşük emekli maaşı sayfası üretildi:', MIN_PENSION_ROUTE);
  return Object.freeze({ generated: 1 });
}
