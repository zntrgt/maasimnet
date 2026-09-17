import { createOfferExample, OFFER_MONTHS } from './offer-example.js';
import { createBonusComparison, bonusMoney, BONUS_ASSUMPTIONS, BONUS_TABLE_CSS } from './bonus-comparison.js';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  calculatePayrollYear,
  solveMonthlyGrossForFixedNet,
  summarizePayroll,
  tlToKurus,
  kurusToTl
} from '../src/payroll-engine.js';
import { DATA_2026 } from '../src/data-2026.js';

const MONTHS = Object.freeze([
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
]);

const TARGET_SLUGS = Object.freeze([
  '2026-maas-vergi-dilimleri',
  'netten-brute-maas-neden-aylik-degisir',
  '100000-tl-brut-maas-neti-2026',
  'prim-ikramiye-net-maasi-neden-dusurur',
  'is-teklifinin-yillik-degeri'
]);

const formatTl = (kurus, digits = 2) => new Intl.NumberFormat('tr-TR', {
  minimumFractionDigits: digits,
  maximumFractionDigits: digits
}).format(kurusToTl(kurus)) + ' TL';

const formatPct = (value) => new Intl.NumberFormat('tr-TR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1
}).format(value) + '%';

function payrollForGross(grossTl, extras = Array(12).fill(0)) {
  return calculatePayrollYear({
    baseGrossKurusByMonth: Array(12).fill(tlToKurus(grossTl)),
    extraGrossKurusByMonth: extras.map(tlToKurus)
  });
}

function firstMonthWithRate(rows, predicate) {
  const row = rows.find((item) => item.incomeTaxRatesPpm.some(predicate));
  return row ? MONTHS[row.month] : 'Yıl içinde görülmüyor';
}

function wrap(title, intro, body, note) {
  return `<section class="maasim-original-data" aria-label="Maaşım.net özgün hesaplama verisi">
    <p class="original-data-kicker">Maaşım.net özgün hesaplama</p>
    <h2>${title}</h2>
    <p>${intro}</p>
    ${body}
    <p class="original-data-method"><strong>Hesaplama notu:</strong> ${note} 2026 parametreleri son olarak ${DATA_2026.checkedAt} tarihinde kontrol edildi. <a href="/hesaplama-metodolojisi/">Hesaplama metodolojisini inceleyin.</a></p>
  </section>`;
}

function taxBracketBlock() {
  const grossLevels = [50_000, 75_000, 100_000, 150_000, 250_000];
  const rows = grossLevels.map((grossTl) => {
    const payroll = payrollForGross(grossTl);
    const summary = summarizePayroll(payroll);
    return `<tr>
      <td>${new Intl.NumberFormat('tr-TR').format(grossTl)} TL</td>
      <td>${firstMonthWithRate(payroll, (rate) => rate > 150_000)}</td>
      <td>${firstMonthWithRate(payroll, (rate) => rate >= 270_000)}</td>
      <td>${formatTl(summary.averageNetKurus)}</td>
    </tr>`;
  }).join('');

  return wrap(
    'Maaşım.net hesabı: brüt maaşa göre vergi dilimine geçiş ayları',
    'Aşağıdaki tablo yaklaşık oran kullanmak yerine Maaşım.net’in 2026 bordro motoruyla ay ay kümülatif gelir vergisi matrahı oluşturularak hesaplandı.',
    `<div class="table-scroll"><table class="table original-data-table"><thead><tr><th>Aylık brüt</th><th>%15 üzeri ilk ay</th><th>%27 görülen ilk ay</th><th>Yıllık ortalama net</th></tr></thead><tbody>${rows}</tbody></table></div>`,
    'Standart çalışan, ek ödeme yok, engellilik indirimi yok ve 12 ay aynı brüt ücret varsayılmıştır.'
  );
}

function netToGrossBlock() {
  const targetNetTl = 100_000;
  const grossByMonth = solveMonthlyGrossForFixedNet({ targetNetKurus: tlToKurus(targetNetTl) });
  const payroll = calculatePayrollYear({ baseGrossKurusByMonth: grossByMonth });
  const points = [0, 2, 5, 8, 11];
  const rows = points.map((index) => `<tr><td>${MONTHS[index]}</td><td>${formatTl(grossByMonth[index])}</td><td>${formatTl(payroll[index].netKurus)}</td><td>${payroll[index].incomeTaxRatesPpm.map((rate) => '%' + Math.round(rate / 10_000)).join(' → ')}</td></tr>`).join('');
  const minGross = Math.min(...grossByMonth);
  const maxGross = Math.max(...grossByMonth);

  return wrap(
    'Maaşım.net hesabı: aynı net maaş için gereken brüt neden yükseliyor?',
    `Aylık net hedef ${new Intl.NumberFormat('tr-TR').format(targetNetTl)} TL sabit tutulduğunda gerekli brüt tutar yıl boyunca aynı kalmıyor. Kümülatif vergi matrahı büyüdükçe işverenin aynı neti korumak için daha yüksek brüt ücret hesaplaması gerekiyor.`,
    `<div class="original-data-grid"><div><span>En düşük gerekli brüt</span><strong>${formatTl(minGross)}</strong></div><div><span>En yüksek gerekli brüt</span><strong>${formatTl(maxGross)}</strong></div><div><span>Yıl içi brüt farkı</span><strong>${formatTl(maxGross - minGross)}</strong></div></div><div class="table-scroll"><table class="table original-data-table"><thead><tr><th>Ay</th><th>Gerekli brüt</th><th>Hedef net</th><th>Vergi oranı</th></tr></thead><tbody>${rows}</tbody></table></div>`,
    `Her ay ${new Intl.NumberFormat('tr-TR').format(targetNetTl)} TL net hedeflenmiş ve brüt ücret merkezi ters çözüm motoruyla kuruş hassasiyetinde bulunmuştur.`
  );
}

function gross100kBlock() {
  const rows = payrollForGross(100_000);
  const summary = summarizePayroll(rows);
  const minimumNet = Math.min(...rows.map(row => row.netKurus));
  const minimumMonths = rows.filter(row => row.netKurus === minimumNet).map(row => MONTHS[row.month]).join(', ');
  const januaryProjection = rows[0].netKurus * 12;
  const tableRows = [
    ['Ocak netini 12 ile çarpmak', formatTl(januaryProjection), 'Yıllık bütçeyi olduğundan yüksek gösterir.'],
    ['Gerçek 12 aylık toplam net', formatTl(summary.annualNetKurus), 'Aynı dönem için teklif karşılaştırmasının temeli.'],
    ['Yanlış yıllıklaştırmanın farkı', formatTl(januaryProjection - summary.annualNetKurus), 'Ocak netine göre bütçelemenin yarattığı gelir farkı.'],
    ['En düşük aylık net', formatTl(minimumNet), minimumMonths + ': zorunlu giderlerinizi bu tutarla karşılaştırın.']
  ].map(([label, value, meaning]) => `<tr><th scope="row">${label}</th><td>${value}</td><td>${meaning}</td></tr>`).join('');

  return wrap(
    '100.000 TL brüt teklif: bütçeye yazılacak gerçek tutar',
    `Bu örnekte yıllık net gelir ${formatTl(summary.annualNetKurus)}, aylık ortalama ${formatTl(summary.averageNetKurus)} olur. Ocak netini 12 ile çarpmak yıllık geliri ${formatTl(januaryProjection - summary.annualNetKurus)} fazla gösterir.`,
    `<div class="original-data-grid"><div><span>Yıllık toplam net</span><strong>${formatTl(summary.annualNetKurus)}</strong></div><div><span>Aylık ortalama net</span><strong>${formatTl(summary.averageNetKurus)}</strong></div><div><span>En düşük aylık net</span><strong>${formatTl(minimumNet)}</strong></div></div><div class="table-scroll" role="region" aria-label="Teklif bütçesi karşılaştırması, yatay kaydırılabilir" tabindex="0"><table class="table original-data-table"><thead><tr><th scope="col">Karar göstergesi</th><th scope="col">Tutar</th><th scope="col">Nasıl kullanılır?</th></tr></thead><tbody>${tableRows}</tbody></table></div><p><a href="/100000-brut-maas-hesaplama/">Ay ay net maaş ve vergi dilimi tablosunu inceleyin →</a></p><p><a class="original-data-cta" href="/maas-teklifi-karsilastirma/">Mevcut maaşınızla yeni teklifi karşılaştırın →</a></p>`,
    'Ocak–Aralık 12 ay tam çalışma, her ay 100.000 TL brüt, başlangıçta sıfır kümülatif matrah, ek ödeme ve engellilik indirimi yok, standart çalışan varsayılmıştır. İşe giriş ayı veya önceki matrah değişirse bu yıllık toplam doğrudan kullanılamaz.'
  );
}

function bonusBlock() {
  const april = createBonusComparison(3);
  const june = createBonusComparison(5);
  const table = [april,june].map(data => `<tr><th scope="row">${MONTHS[data.month]}</th><td>${bonusMoney(data.paymentDelta)}</td><td>${bonusMoney(data.laterDelta)}</td><td>${bonusMoney(data.annualDelta)}</td></tr>`).join('');
  return wrap(
    '50.000 TL prim: Nisan ve Haziran ödemesi arasındaki fark',
    `100.000 TL sabit brüt maaşta Nisan primi ödeme ayının netini ${bonusMoney(april.paymentDelta)} artırır; sonraki ayların toplam farkı ${bonusMoney(april.laterDelta)} olur. Haziran priminde ise sonraki ayların net farkı ${bonusMoney(june.laterDelta)} olur.`,
    `<div class="bonus-scroll" role="region" aria-label="Prim ödeme ayı karşılaştırması, yatay kaydırılabilir" tabindex="0"><table><caption>Aynı 50.000 TL brüt prim, iki ayrı ödeme zamanı</caption><thead><tr><th scope="col">Prim ayı</th><th scope="col">Ödeme ayı net artışı</th><th scope="col">Sonraki aylar toplam farkı</th><th scope="col">Yıllık net artışı</th></tr></thead><tbody>${table}</tbody></table></div><p>Nisan örneğinde Mayıs neti primsiz ${bonusMoney(april.baseline[4].netKurus)} yerine ${bonusMoney(april.withBonus[4].netKurus)} olur. Negatif fark, primsiz senaryoya kıyasla azalmadır; primin yıllık kazancı yok ettiği anlamına gelmez.</p><p>Haziran örneğinde sonraki ayların neti değişmez. Ödeme ayındaki fark ile yıllık net artışı aynı kavram değildir; iki ayrı senaryo için ayrı hesaplanmalıdır. Bu örneklerde yıllık net artışlarının eşit olması, bütün maaş ve prim tutarları için aynı sonucu garanti etmez.</p><p><a href="/prim-ikramiye-maas-hesaplama/">Haziran priminin tam 12 aylık karşılaştırmasını görün →</a></p>`,
    BONUS_ASSUMPTIONS
  );
}

function offerBlock() {
  const july = createOfferExample(6);
  const timings = [0,6,9].map(month => {
    const data = createOfferExample(month);
    return `<tr><th scope="row">${OFFER_MONTHS[month]}</th><td>${data.activeMonths}</td><td>${formatTl(data.grossDelta)}</td><td>${formatTl(data.annualDelta)}</td></tr>`;
  }).join('');
  const months = july.baseline.map((row,index) => `<tr><th scope="row">${OFFER_MONTHS[index]}</th><td>${formatTl(row.netKurus)}</td><td>${formatTl(july.offer[index].netKurus)}</td><td>${formatTl(july.differences[index])}</td></tr>`).join('');
  return wrap(
    'Temmuzda 100.000 TL’den 120.000 TL brüte geçişin net kazancı',
    `2026 boyunca 100.000 TL brütte kalmaya kıyasla Temmuzda başlayan 120.000 TL brüt teklif, bu varsayımlarla yıl sonuna kadar ${formatTl(july.annualDelta)} ek net sağlar. Bu tutar yeni ücretin 12 aylık kazancı değil, Temmuz–Aralık döneminin farkıdır.`,
    `<div class="original-data-grid"><div><span>Mevcut ücretle yıllık net</span><strong>${formatTl(july.baselineAnnualNet)}</strong></div><div><span>Temmuz geçişli yıllık net</span><strong>${formatTl(july.offerAnnualNet)}</strong></div><div><span>Bu yıl ek net kazanç</span><strong>${formatTl(july.annualDelta)}</strong></div></div><p><strong>İki farklı ortalama:</strong> Takvim yılının 12 ayına bölünmüş fark ${formatTl(july.calendarAverageDelta)}; teklifin geçerli olduğu ${july.activeMonths} aya bölünmüş fark ${formatTl(july.activeAverageDelta)} olur. Bunlar ortalamadır, her ay aynı net farkın oluştuğunu söylemez.</p><h3>Aynı teklif farklı aylarda başlarsa</h3><div class="bonus-scroll" role="region" aria-label="Teklif başlangıç ayı karşılaştırması, yatay kaydırılabilir" tabindex="0"><table><caption>Her örnekte mevcut aylık brüt 100.000 TL, yeni brüt 120.000 TL</caption><thead><tr><th scope="col">Başlangıç</th><th scope="col">Yeni ücretle ay</th><th scope="col">Bu yıl brüt fark</th><th scope="col">Bu yıl net fark</th></tr></thead><tbody>${timings}</tbody></table></div><details><summary>Temmuz başlangıcının 12 aylık net tablosunu aç</summary><div class="bonus-scroll" role="region" aria-label="Temmuz teklifi aylık net tablosu, yatay kaydırılabilir" tabindex="0"><table><caption>İlk altı ay iki senaryoda da aynı ücret</caption><thead><tr><th scope="col">Ay</th><th scope="col">Mevcut ücret sürerse</th><th scope="col">Temmuzda teklif başlarsa</th><th scope="col">Net fark</th></tr></thead><tbody>${months}</tbody></table></div></details><h3>Yan hakları nakit maaştan ayrı ekleyin</h3><p>Yeni teklifte her ay gerçekten kullanacağınız yan hak değeri ayrıca 1.000 TL daha yüksekse, altı ay için kişisel kullanım değeri farkı ${formatTl(july.benefitDelta)} olur. Maaş farkıyla birlikte değerlendirilen toplam ${formatTl(july.annualDelta+july.benefitDelta)} olur; bu toplamın tamamı banka hesabınıza yatacak nakit değildir. Örnek yan hak tutarı bir varsayımdır; vergi istisnası veya bordro neti hesabı değildir.</p><p><a class="original-data-cta" href="/maas-teklifi-karsilastirma/">Kendi maaşını, teklifini ve başlangıç ayını karşılaştır →</a></p>`,
    'Ocak–Aralık tam çalışma; Ocakta sıfır kümülatif matrah; standart çalışan; prim, engellilik indirimi ve ücret boşluğu yok. Gelir vergisi matrahı yıl boyunca kesintisiz devam eder. Yeni işverende matrahın sıfırlanması veya farklı bordro uygulaması modellenmez; yıllık beyanname ve ilave vergi hesabı yapılmaz. Gelecek yılın 12 aylık sonucu değildir.'
  );
}

const blocks = Object.freeze({
  '2026-maas-vergi-dilimleri': taxBracketBlock,
  'netten-brute-maas-neden-aylik-degisir': netToGrossBlock,
  '100000-tl-brut-maas-neti-2026': gross100kBlock,
  'prim-ikramiye-net-maasi-neden-dusurur': bonusBlock,
  'is-teklifinin-yillik-degeri': offerBlock
});

function insertBlock(html, block, slug) {
  if (html.includes('maasim-original-data')) return html;
  if (['100000-tl-brut-maas-neti-2026', 'prim-ikramiye-net-maasi-neden-dusurur', 'is-teklifinin-yillik-degeri'].includes(slug)) {
    const answer = /(<section class="answer">[\s\S]*?<\/section>)/;
    if (!answer.test(html)) throw new Error('Teklif rehberi kısa cevap alanı bulunamadı');
    return html.replace(answer, `$1${block}`);
  }
  if (/<section\s+class="faq"[^>]*>/i.test(html)) {
    return html.replace(/<section\s+class="faq"[^>]*>/i, (match) => `${block}${match}`);
  }
  if (/<h2\b[^>]*id="sss"[^>]*>/i.test(html)) {
    return html.replace(/<h2\b[^>]*id="sss"[^>]*>/i, `${block}$&`);
  }
  if (/<h2\b[^>]*id="kaynakca"[^>]*>/i.test(html)) {
    return html.replace(/<h2\b[^>]*id="kaynakca"[^>]*>/i, `${block}$&`);
  }
  if (/<\/article>/i.test(html)) return html.replace(/<\/article>/i, `${block}</article>`);
  throw new Error(`Özgün veri bloğu için bağlantı noktası bulunamadı: ${slug}`);
}

const css = `
/* Maaşım.net özgün hesaplama veri blokları */
.maasim-original-data{margin:42px 0 30px;padding:24px;border:1px solid #99f6e4;border-radius:20px;background:linear-gradient(180deg,#f0fdfa 0%,#fff 100%)}
.maasim-original-data .original-data-kicker{margin:0 0 8px;color:#0f766e;font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
.maasim-original-data h2{margin-top:0}
.original-data-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:18px 0}
.original-data-grid>div{padding:15px;border:1px solid #ccfbf1;border-radius:14px;background:#fff}
.original-data-grid span{display:block;margin-bottom:7px;color:#64748b;font-size:12px;font-weight:800}
.original-data-grid strong{display:block;color:#0f172a;font-size:19px;line-height:1.25}
.original-data-table{margin-top:14px}
.original-data-method{margin:18px 0 0!important;padding-top:15px;border-top:1px solid #ccfbf1;color:#475569!important;font-size:13px!important}
.original-data-cta{font-weight:900}
@media(max-width:760px){.maasim-original-data{padding:18px}.original-data-grid{grid-template-columns:1fr 1fr}.original-data-grid strong{font-size:16px}}
@media(max-width:480px){.original-data-grid{grid-template-columns:1fr}}
`;

export async function applyBlogOriginalData(distDir) {
  for (const slug of TARGET_SLUGS) {
    const file = join(distDir, 'blog', slug, 'index.html');
    let html = await readFile(file, 'utf8');
    html = insertBlock(html, blocks[slug](), slug);
    await writeFile(file, html, 'utf8');
  }

  const cssPath = join(distDir, 'assets', 'blog.css');
  let blogCss = await readFile(cssPath, 'utf8');
  if (!blogCss.includes('/* Maaşım.net özgün hesaplama veri blokları */')) {
    blogCss += `\n${css}\n${BONUS_TABLE_CSS}`;
    await writeFile(cssPath, blogCss, 'utf8');
  }

  console.log(`Maaşım.net özgün hesaplama verisi eklendi: ${TARGET_SLUGS.length} yüksek niyetli blog.`);
  return { enhanced: TARGET_SLUGS.length, slugs: [...TARGET_SLUGS] };
}
