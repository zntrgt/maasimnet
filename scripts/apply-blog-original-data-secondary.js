import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { calculatePayrollYear, tlToKurus, kurusToTl } from '../src/payroll-engine.js';
import { DATA_2026 } from '../src/data-2026.js';

const TARGET_SLUGS = Object.freeze([
  '2026-sgk-tavani',
  'is-degisikliginde-vergi-matrahi',
  '2026-yemek-karti-istisnasi'
]);

const formatTl = (kurus, digits = 2) => new Intl.NumberFormat('tr-TR', {
  minimumFractionDigits: digits,
  maximumFractionDigits: digits
}).format(kurusToTl(kurus)) + ' TL';

const formatWholeTl = (kurus) => new Intl.NumberFormat('tr-TR', {
  maximumFractionDigits: 0
}).format(kurusToTl(kurus)) + ' TL';

function wrap(title, intro, body, note, label = 'Maaşım.net özgün hesaplama') {
  return `<section class="maasim-original-data" aria-label="Maaşım.net özgün veri analizi">
    <p class="original-data-kicker">${label}</p>
    <h2>${title}</h2>
    <p>${intro}</p>
    ${body}
    <p class="original-data-method"><strong>Hesaplama notu:</strong> ${note} 2026 parametreleri son olarak ${DATA_2026.checkedAt} tarihinde kontrol edildi. <a href="/hesaplama-metodolojisi/">Hesaplama metodolojisini inceleyin.</a></p>
  </section>`;
}

function sgkCeilingBlock() {
  const levels = [250_000, 297_270, 350_000, 500_000];
  const rows = levels.map((grossTl) => {
    const payroll = calculatePayrollYear({
      baseGrossKurusByMonth: Array(12).fill(tlToKurus(grossTl))
    });
    const january = payroll[0];
    const employeePremium = january.employeeSgkKurus + january.employeeUnemploymentKurus;
    return `<tr><td>${new Intl.NumberFormat('tr-TR').format(grossTl)} TL</td><td>${formatWholeTl(january.sgkBaseKurus)}</td><td>${formatTl(employeePremium)}</td><td>${january.sgkBaseKurus === DATA_2026.payroll.sgkCeilingKurus ? 'Tavanda' : 'Brüte eşit'}</td></tr>`;
  }).join('');

  return wrap(
    'Maaşım.net hesabı: SGK tavanı brüt ücret yükseldikçe neyi değiştiriyor?',
    `2026 aylık prime esas kazanç üst sınırı ${formatWholeTl(DATA_2026.payroll.sgkCeilingKurus)}. Brüt ücret bu seviyeyi aştığında SGK ve işsizlik primi hesabındaki matrah daha fazla yükselmiyor; gelir vergisi matrahı ve net ücret hesabı ise kendi kurallarıyla devam ediyor.`,
    `<div class="original-data-grid"><div><span>2026 aylık SGK tavanı</span><strong>${formatWholeTl(DATA_2026.payroll.sgkCeilingKurus)}</strong></div><div><span>Asgari ücretin katı</span><strong>${DATA_2026.publishedData.sgkCeiling.multiplier}×</strong></div></div><div class="table-scroll"><table class="table original-data-table"><thead><tr><th>Aylık brüt</th><th>SGK matrahı</th><th>Çalışan SGK + işsizlik</th><th>Durum</th></tr></thead><tbody>${rows}</tbody></table></div>`,
    'Tablo standart çalışan için Ocak bordrosunu gösterir; emekli/SGDP, engellilik indirimi ve ek ödeme varsayılmamıştır.'
  );
}

function jobChangeTaxBaseBlock() {
  const OTHER_EMPLOYERS_LIMIT = 400_000;
  const TOTAL_WAGE_LIMIT = 5_300_000;
  const scenarios = [
    { first: 900_000, other: 300_000 },
    { first: 900_000, other: 450_000 },
    { first: 5_000_000, other: 200_000 },
    { first: 5_100_000, other: 250_000 }
  ];
  const rows = scenarios.map(({ first, other }) => {
    const total = first + other;
    const otherTrigger = other > OTHER_EMPLOYERS_LIMIT;
    const totalTrigger = total > TOTAL_WAGE_LIMIT;
    const result = otherTrigger || totalTrigger ? 'Beyan eşiği aşılır' : 'Bu iki eşik aşılmaz';
    return `<tr><td>${new Intl.NumberFormat('tr-TR').format(first)} TL</td><td>${new Intl.NumberFormat('tr-TR').format(other)} TL</td><td>${new Intl.NumberFormat('tr-TR').format(total)} TL</td><td>${result}</td></tr>`;
  }).join('');

  return wrap(
    'Maaşım.net eşik analizi: iş değişikliğinde hangi toplamlar beyan riskini artırıyor?',
    'Yeni işveren bordroda farklı bir kümülatif matrah uygulayabilir; fakat yıllık beyan değerlendirmesi ayrı bir konudur. Aşağıdaki örnekler yalnızca yazıda açıklanan 2026 ücret geliri eşiklerinin sayısal kontrolünü gösterir.',
    `<div class="original-data-grid"><div><span>Birinci işveren dışındaki ücretler için eşik</span><strong>${new Intl.NumberFormat('tr-TR').format(OTHER_EMPLOYERS_LIMIT)} TL</strong></div><div><span>Toplam ücret için eşik</span><strong>${new Intl.NumberFormat('tr-TR').format(TOTAL_WAGE_LIMIT)} TL</strong></div></div><div class="table-scroll"><table class="table original-data-table"><thead><tr><th>Birinci işveren</th><th>Diğer işveren(ler)</th><th>Toplam ücret</th><th>Yalnız bu eşiklere göre</th></tr></thead><tbody>${rows}</tbody></table></div>`,
    'Bu tablo kişisel vergi beyannamesi hesabı değildir; yalnızca 2026 için yazıda belirtilen iki ücret eşiğini örnek senaryolarda test eder. İstisna, tevkifat ve diğer gelirler ayrıca değerlendirilmelidir.',
    'Maaşım.net özgün eşik analizi'
  );
}

function mealAllowanceBlock() {
  const incomeTaxDaily = DATA_2026.publishedData.mealAllowance.incomeTaxDailyKurus;
  const sgkDaily = DATA_2026.publishedData.mealAllowance.sgkDailyKurus;
  const days = [20, 22, 26];
  const rows = days.map((dayCount) => `<tr><td>${dayCount} gün</td><td>${formatWholeTl(incomeTaxDaily * dayCount)}</td><td>${formatWholeTl(sgkDaily * dayCount)}</td><td>${formatWholeTl((incomeTaxDaily - sgkDaily) * dayCount)}</td></tr>`).join('');

  return wrap(
    'Maaşım.net hesabı: çalışma gününe göre yemek bedeli istisna karşılıkları',
    `Gelir vergisi ve SGK tarafındaki günlük tutarlar aynı değildir. 2026 merkezi veri setimizde gelir vergisi için günlük ${formatWholeTl(incomeTaxDaily)}, SGK için günlük ${formatWholeTl(sgkDaily)} referansı bulunuyor.`,
    `<div class="original-data-grid"><div><span>Günlük gelir vergisi referansı</span><strong>${formatWholeTl(incomeTaxDaily)}</strong></div><div><span>Günlük SGK referansı</span><strong>${formatWholeTl(sgkDaily)}</strong></div></div><div class="table-scroll"><table class="table original-data-table"><thead><tr><th>Fiilî çalışma</th><th>GV aylık karşılığı</th><th>SGK aylık karşılığı</th><th>İki referans arasındaki fark</th></tr></thead><tbody>${rows}</tbody></table></div>`,
    'Tutarlar yalnızca günlük referansların fiilî çalışma günüyle çarpımıdır. Ödeme şekli, yemek kartının niteliği ve mevzuattaki koşullar ayrıca kontrol edilmelidir.'
  );
}

const blocks = Object.freeze({
  '2026-sgk-tavani': sgkCeilingBlock,
  'is-degisikliginde-vergi-matrahi': jobChangeTaxBaseBlock,
  '2026-yemek-karti-istisnasi': mealAllowanceBlock
});

function insertBlock(html, block, slug) {
  if (html.includes('maasim-original-data-secondary')) return html;
  const marked = block.replace('class="maasim-original-data"', 'class="maasim-original-data maasim-original-data-secondary"');
  if (/<section\s+class="faq"[^>]*>/i.test(html)) {
    return html.replace(/<section\s+class="faq"[^>]*>/i, (match) => `${marked}${match}`);
  }
  if (/<h2\b[^>]*id="sss"[^>]*>/i.test(html)) {
    return html.replace(/<h2\b[^>]*id="sss"[^>]*>/i, `${marked}$&`);
  }
  if (/<h2\b[^>]*id="kaynakca"[^>]*>/i.test(html)) {
    return html.replace(/<h2\b[^>]*id="kaynakca"[^>]*>/i, `${marked}$&`);
  }
  if (/<\/article>/i.test(html)) return html.replace(/<\/article>/i, `${marked}</article>`);
  throw new Error(`İkinci özgün veri bloğu için bağlantı noktası bulunamadı: ${slug}`);
}

export async function applyBlogOriginalDataSecondary(dist) {
  let enhanced = 0;
  for (const slug of TARGET_SLUGS) {
    const path = join(dist, 'blog', slug, 'index.html');
    const html = await readFile(path, 'utf8');
    const block = blocks[slug]();
    const updated = insertBlock(html, block, slug);
    if (updated !== html) enhanced += 1;
    await writeFile(path, updated, 'utf8');
  }
  console.log(`Maaşım.net ikinci özgün veri paketi eklendi: ${enhanced} blog.`);
  return { enhanced, targetSlugs: [...TARGET_SLUGS] };
}
