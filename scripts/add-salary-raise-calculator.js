import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const SITE = 'https://maasim.net';
const ROUTE = '/maas-zam-hesaplama/';
const TITLE = 'Maaş Zam Hesaplama: Yüzde Zam ve Yeni Maaş | Maaşım.net';
const DESCRIPTION = 'Eski maaş, yeni maaş veya zam oranından ikisini girin; üçüncü değeri, aylık farkı ve 12 aylık farkı anında hesaplayın.';

const FAQ = [
  ['Maaş zam oranı nasıl hesaplanır?', 'Yeni maaştan eski maaş çıkarılır; fark eski maaşa bölünür ve sonuç 100 ile çarpılır. Örneğin 50.000 TL’den 65.000 TL’ye çıkan maaşta artış oranı %30’dur.'],
  ['Yüzde 30 zamlı maaş nasıl hesaplanır?', 'Eski maaş 1,30 ile çarpılır. Örneğin 50.000 TL maaşa %30 zam uygulandığında yeni maaş 65.000 TL olur.'],
  ['Yeni maaştan eski maaş bulunabilir mi?', 'Evet. Yeni maaş, 1 + zam oranı katsayısına bölünür. 65.000 TL yeni maaş ve %30 zam için eski maaş 50.000 TL’dir.'],
  ['Net maaş ile brüt maaş için formül farklı mı?', 'Hayır. Yüzde değişim matematiği aynıdır; ancak karşılaştırdığınız iki tutarın aynı türde olması gerekir. Net maaşı net maaşla, brüt maaşı brüt maaşla karşılaştırın.'],
  ['Bu hesaplayıcı vergi veya SGK kesintisini hesaplıyor mu?', 'Hayır. Bu araç yalnızca maaş tutarları arasındaki matematiksel zam/değişim oranını hesaplar. Brütten nete bordro hesabı için ana Maaş Hesaplama aracını kullanın.'],
  ['Maaş düşmüşse negatif oran gösterir mi?', 'Evet. Yeni maaş eski maaştan düşükse sonuç negatif yüzde olarak gösterilir ve değişim Azalış olarak etiketlenir.']
];

function schema() {
  const url = `${SITE}${ROUTE}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', '@id': `${url}#page`, url, name: TITLE, description: DESCRIPTION, inLanguage: 'tr-TR' },
      { '@type': 'WebApplication', '@id': `${url}#calculator`, url, name: 'Maaş Zam Hesaplama', applicationCategory: 'FinanceApplication', operatingSystem: 'Web', isAccessibleForFree: true, description: DESCRIPTION, offers: { '@type': 'Offer', price: 0, priceCurrency: 'TRY' } },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Hesaplama Araçları', item: `${SITE}/hesaplama-araclari/` },
        { '@type': 'ListItem', position: 3, name: 'Maaş Zam Hesaplama', item: url }
      ]},
      { '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }
    ]
  };
}

function page() {
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${TITLE}</title><meta name="description" content="${DESCRIPTION}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${SITE}${ROUTE}"><meta property="og:type" content="website"><meta property="og:title" content="Maaş Zam Hesaplama"><meta property="og:description" content="${DESCRIPTION}"><meta property="og:url" content="${SITE}${ROUTE}"><meta property="og:site_name" content="Maaşım.net"><script type="application/ld+json">${JSON.stringify(schema())}</script><link rel="stylesheet" href="/assets/salary-raise-calculator.css"></head><body class="salary-raise-page"><main><div class="salary-raise-shell"><header class="salary-raise-hero"><span class="salary-raise-eyebrow">Maaş artışı · yüzde değişim</span><h1>Maaş Zam Hesaplama</h1><p>Eski maaş, yeni maaş veya zam oranından ikisini girin; üçüncü değeri, aylık farkı ve yıllık farkı anında görün.</p><div class="salary-raise-trust"><span>Kuruş bazlı deterministik hesap</span><span>Finansal değerler analytics’e gönderilmez</span><span>Net veya brüt tutarla kullanılabilir</span></div></header>
<section class="salary-raise-grid" data-salary-raise-calculator><div class="salary-raise-panel"><form novalidate><h2>Ne hesaplamak istiyorsun?</h2><p>İki bilgiyi girin; üçüncü alan otomatik sonuç olarak hesaplanır.</p><fieldset class="salary-raise-modes"><label class="salary-raise-mode"><input type="radio" name="calculation_mode" value="new_salary" checked><span><strong>Zamlı yeni maaşı bul</strong><span>Eski maaş + zam oranı → yeni maaş</span></span></label><label class="salary-raise-mode"><input type="radio" name="calculation_mode" value="rate"><span><strong>Zam oranını bul</strong><span>Eski maaş + yeni maaş → yüzde değişim</span></span></label><label class="salary-raise-mode"><input type="radio" name="calculation_mode" value="old_salary"><span><strong>Eski maaşı bul</strong><span>Yeni maaş + zam oranı → eski maaş</span></span></label></fieldset>
<div class="salary-raise-fields"><div class="salary-raise-field"><label for="salary-type">Maaş türü</label><select id="salary-type" name="salary_type"><option value="net">Net maaş</option><option value="gross">Brüt maaş</option></select></div><div class="salary-raise-row"><div class="salary-raise-field"><label for="old-salary">Eski maaş</label><input id="old-salary" name="old_salary" type="text" inputmode="decimal" autocomplete="off" data-money-input="true" placeholder="50.000,00"></div><div class="salary-raise-field"><label for="new-salary">Yeni maaş</label><input id="new-salary" name="new_salary" type="text" inputmode="decimal" autocomplete="off" data-money-input="true" placeholder="65.000,00"></div></div><div class="salary-raise-field"><label for="raise-rate">Zam / değişim oranı (%)</label><input id="raise-rate" name="rate" type="text" inputmode="decimal" autocomplete="off" placeholder="30,00"></div></div><button class="salary-raise-submit" type="submit">Maaş değişimini hesapla</button><div class="salary-raise-note"><strong>Önemli:</strong> Bu araç yüzde değişim matematiğini hesaplar; netten brüte veya brütten nete dönüşüm yapmaz. Karşılaştırdığınız maaşlar aynı türde olmalıdır.</div><div class="salary-raise-error" data-calculator-error hidden></div></form></div>
<div class="salary-raise-results" data-calculator-results hidden><h2>Sonuç</h2><div class="salary-raise-primary"><span data-primary-label>Yeni maaşın</span><strong data-result="primary">—</strong><small data-primary-helper>Eski maaş ve zam oranından hesaplandı.</small></div><div class="salary-raise-result-grid"><article class="salary-raise-result"><span>Eski maaş</span><strong data-result="old">—</strong></article><article class="salary-raise-result"><span>Yeni maaş</span><strong data-result="new">—</strong></article><article class="salary-raise-result"><span>Zam / değişim oranı</span><strong data-result="rate">—</strong></article><article class="salary-raise-result"><span>Değişim yönü</span><strong data-result="direction">—</strong></article><article class="salary-raise-result"><span>Aylık fark</span><strong data-result="difference">—</strong></article><article class="salary-raise-result"><span>12 aylık fark</span><strong data-result="annual-difference">—</strong></article></div><button type="button" class="salary-raise-copy" data-copy-result>Sonucu kopyala</button></div></section>
<section class="salary-raise-section"><h2>Maaş zammı formülleri</h2><table><thead><tr><th>Hesap</th><th>Formül</th></tr></thead><tbody><tr><td>Yeni maaş</td><td><code>Eski maaş × (1 + zam oranı / 100)</code></td></tr><tr><td>Zam oranı</td><td><code>(Yeni maaş − eski maaş) / eski maaş × 100</code></td></tr><tr><td>Eski maaş</td><td><code>Yeni maaş / (1 + zam oranı / 100)</code></td></tr></tbody></table></section>
<section class="salary-raise-section"><h2>Hızlı örnekler</h2><div class="salary-raise-example-grid"><article class="salary-raise-example"><strong>50.000 TL + %30</strong><span>Yeni maaş: 65.000 TL · aylık fark: 15.000 TL.</span></article><article class="salary-raise-example"><strong>40.000 TL → 50.000 TL</strong><span>Maaş artışı: %25,00.</span></article><article class="salary-raise-example"><strong>65.000 TL ve %30 zam</strong><span>Zam öncesi maaş: 50.000 TL.</span></article></div></section>
<section class="salary-raise-section"><h2>İlgili hesaplama araçları</h2><div class="salary-raise-links"><a class="salary-raise-link" href="/"><strong>Maaş Hesaplama 2026</strong><span>Brütten nete ve netten brüte bordro hesabı yap.</span></a><a class="salary-raise-link" href="/asgari-ucret-hesaplama/"><strong>Asgari Ücret Hesaplama</strong><span>2026 resmî net ve brüt asgari ücreti incele.</span></a><a class="salary-raise-link" href="/vergi-dilimi-hesaplama/"><strong>Vergi Dilimi Hesaplama</strong><span>Kümülatif gelir vergisi matrahını kontrol et.</span></a></div></section>
<section class="salary-raise-section"><h2>Hesaplama yöntemi</h2><p>Bu hesaplayıcı mevzuata bağlı bir bordro parametresi kullanmaz; yalnızca yüzde değişim aritmetiği uygular. Para tutarları kuruş cinsinden tamsayı olarak, oranlar yüzde puanın yüzde biri hassasiyetinde işlenir. Bordro, SGK ve gelir vergisi etkisini görmek için <a href="/">Maaş Hesaplama</a> aracını kullanın.</p></section>
<section class="salary-raise-section"><h2>Sık sorulan sorular</h2>${FAQ.map(([q,a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('')}</section>
</div></main><script type="module" src="/assets/salary-raise-calculator.js"></script></body></html>`;
}

export async function addSalaryRaiseCalculator(dist) {
  const dir = join(dist, ROUTE.replace(/^\/+|\/+$/g, ''));
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'index.html'), page(), 'utf8');
  console.log('Maaş zam hesaplayıcısı üretildi:', ROUTE);
  return Object.freeze({ generated: 1, route: ROUTE });
}
