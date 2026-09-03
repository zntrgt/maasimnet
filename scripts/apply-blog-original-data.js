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
  const selected = [0, 2, 6, 11];
  const tableRows = selected.map((index) => `<tr><td>${MONTHS[index]}</td><td>${formatTl(rows[index].netKurus)}</td><td>${rows[index].incomeTaxRatesPpm.map((rate) => '%' + Math.round(rate / 10_000)).join(' → ')}</td><td>${formatTl(rows[index].cumulativeTaxBaseKurus)}</td></tr>`).join('');

  return wrap(
    'Maaşım.net hesabı: 100.000 TL brütün yıl içindeki net seyri',
    'Tek bir aylık net rakam yerine 12 aylık toplam ve vergi dilimi geçişleri birlikte değerlendirildiğinde brüt ücretin yıl içindeki gerçek net profili daha net görülür.',
    `<div class="original-data-grid"><div><span>Ocak neti</span><strong>${formatTl(rows[0].netKurus)}</strong></div><div><span>Yıllık ortalama net</span><strong>${formatTl(summary.averageNetKurus)}</strong></div><div><span>Yıllık toplam net</span><strong>${formatTl(summary.annualNetKurus)}</strong></div><div><span>En yüksek–en düşük net farkı</span><strong>${formatTl(summary.netDifferenceKurus)}</strong></div></div><div class="table-scroll"><table class="table original-data-table"><thead><tr><th>Ay</th><th>Net maaş</th><th>Vergi oranı</th><th>Kümülatif matrah</th></tr></thead><tbody>${tableRows}</tbody></table></div>`,
    '12 ay boyunca aylık brüt 100.000 TL, ek ödeme yok, standart çalışan varsayılmıştır.'
  );
}

function bonusBlock() {
  const baseline = payrollForGross(100_000);
  const extras = Array(12).fill(0);
  extras[5] = 50_000;
  const withBonus = payrollForGross(100_000, extras);
  const incrementalJuneNet = withBonus[5].netKurus - baseline[5].netKurus;
  const annualNetDelta = withBonus.reduce((sum, row, index) => sum + row.netKurus - baseline[index].netKurus, 0);
  const julyDelta = withBonus[6].netKurus - baseline[6].netKurus;
  const decemberDelta = withBonus[11].netKurus - baseline[11].netKurus;
  const retention = kurusToTl(incrementalJuneNet) / 50_000 * 100;

  return wrap(
    'Maaşım.net hesabı: tek seferlik primin net ve sonraki aylara etkisi',
    'Prim bordroda yalnız ödendiği ayı büyütmez; o ayın gelir vergisi matrahını artırdığı için sonraki aylardaki kümülatif vergi konumunu da değiştirebilir.',
    `<div class="original-data-grid"><div><span>Haziran brüt primi</span><strong>50.000 TL</strong></div><div><span>Haziran net artışı</span><strong>${formatTl(incrementalJuneNet)}</strong></div><div><span>Prim ayı nete dönüşüm oranı</span><strong>${formatPct(retention)}</strong></div><div><span>Yıllık toplam net farkı</span><strong>${formatTl(annualNetDelta)}</strong></div></div><div class="table-scroll"><table class="table original-data-table"><thead><tr><th>Dönem</th><th>Primsiz net</th><th>Primli senaryo neti</th><th>Fark</th></tr></thead><tbody><tr><td>Haziran</td><td>${formatTl(baseline[5].netKurus)}</td><td>${formatTl(withBonus[5].netKurus)}</td><td>${formatTl(incrementalJuneNet)}</td></tr><tr><td>Temmuz</td><td>${formatTl(baseline[6].netKurus)}</td><td>${formatTl(withBonus[6].netKurus)}</td><td>${formatTl(julyDelta)}</td></tr><tr><td>Aralık</td><td>${formatTl(baseline[11].netKurus)}</td><td>${formatTl(withBonus[11].netKurus)}</td><td>${formatTl(decemberDelta)}</td></tr></tbody></table></div>`,
    'Ana brüt ücret 12 ay boyunca 100.000 TL; yalnız Haziran ayında 50.000 TL ek brüt prim varsayılmıştır.'
  );
}

function offerBlock() {
  const current = calculatePayrollYear({ baseGrossKurusByMonth: Array(12).fill(tlToKurus(100_000)) });
  const offerGross = Array(12).fill(tlToKurus(100_000));
  for (let i = 6; i < 12; i += 1) offerGross[i] = tlToKurus(120_000);
  const offer = calculatePayrollYear({ baseGrossKurusByMonth: offerGross });
  const currentSummary = summarizePayroll(current);
  const offerSummary = summarizePayroll(offer);
  const annualNetDelta = offerSummary.annualNetKurus - currentSummary.annualNetKurus;
  const secondHalfNetDelta = offer.slice(6).reduce((sum, row, index) => sum + row.netKurus - current[index + 6].netKurus, 0);
  const employerCostDelta = offerSummary.annualEmployerCostKurus - currentSummary.annualEmployerCostKurus;

  return wrap(
    'Maaşım.net hesabı: yıl ortasında gelen iş teklifinin yıllık gerçek değeri',
    'Yeni teklif yılın ortasında başlıyorsa teklif edilen aylık farkı 12 ile çarpmak doğru sonucu vermez. Başlangıç ayı ve kümülatif vergi etkisi yıllık toplam üzerinden değerlendirilmelidir.',
    `<div class="original-data-grid"><div><span>Mevcut brüt</span><strong>100.000 TL</strong></div><div><span>Temmuzdan itibaren yeni brüt</span><strong>120.000 TL</strong></div><div><span>Yıllık net gelir farkı</span><strong>${formatTl(annualNetDelta)}</strong></div><div><span>Temmuz–Aralık net farkı</span><strong>${formatTl(secondHalfNetDelta)}</strong></div><div><span>Yıllık işveren maliyeti farkı</span><strong>${formatTl(employerCostDelta)}</strong></div></div><p><a class="original-data-cta" href="/maas-teklifi-karsilastirma/">Kendi mevcut maaşınızı ve yeni teklifinizi başlangıç ayıyla karşılaştırın →</a></p>`,
    'Örnek senaryoda mevcut brüt Ocak–Haziran 100.000 TL, yeni teklif Temmuz–Aralık 120.000 TL kabul edilmiştir; prim ve yan haklar dahil değildir.'
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
    blogCss += `\n${css}`;
    await writeFile(cssPath, blogCss, 'utf8');
  }

  console.log(`Maaşım.net özgün hesaplama verisi eklendi: ${TARGET_SLUGS.length} yüksek niyetli blog.`);
  return { enhanced: TARGET_SLUGS.length, slugs: [...TARGET_SLUGS] };
}
