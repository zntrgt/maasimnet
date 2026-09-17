import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  EMPLOYER_SCHEMES,
  calculatePayrollYear,
  summarizePayroll,
  tlToKurus
} from '../src/payroll-engine.js';

const MONTH_COUNT = 12;
const FIXED_GROSS_100K_KURUS = tlToKurus(100_000);
const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

export function formatTlFromKurus(valueKurus) {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(valueKurus / 100) + ' TL';
}

function calculateFixedGrossRows(employerScheme) {
  return calculatePayrollYear({
    baseGrossKurusByMonth: Array(MONTH_COUNT).fill(FIXED_GROSS_100K_KURUS),
    extraGrossKurusByMonth: Array(MONTH_COUNT).fill(0),
    employerScheme
  });
}

export function createGross100kScenarioData() {
  const otherRows = calculateFixedGrossRows(EMPLOYER_SCHEMES.OTHER);
  const manufacturingRows = calculateFixedGrossRows(EMPLOYER_SCHEMES.MANUFACTURING);
  const noDiscountRows = calculateFixedGrossRows(EMPLOYER_SCHEMES.NONE);
  const summary = summarizePayroll(otherRows);

  const values = Object.freeze({
    januaryNetKurus: otherRows[0].netKurus,
    decemberNetKurus: otherRows[11].netKurus,
    averageNetKurus: summary.averageNetKurus,
    annualNetKurus: summary.annualNetKurus,
    employerOtherKurus: otherRows[0].employerCostKurus,
    employerManufacturingKurus: manufacturingRows[0].employerCostKurus,
    employerNoDiscountKurus: noDiscountRows[0].employerCostKurus
  });

  return Object.freeze({
    values,
    rows: otherRows,
    replacements: Object.freeze({
      '{{SCENARIO_100K_JAN_NET}}': formatTlFromKurus(values.januaryNetKurus),
      '{{SCENARIO_100K_DEC_NET}}': formatTlFromKurus(values.decemberNetKurus),
      '{{SCENARIO_100K_AVG_NET}}': formatTlFromKurus(values.averageNetKurus),
      '{{SCENARIO_100K_ANNUAL_NET}}': formatTlFromKurus(values.annualNetKurus),
      '{{SCENARIO_100K_EMPLOYER_OTHER}}': formatTlFromKurus(values.employerOtherKurus),
      '{{SCENARIO_100K_EMPLOYER_MANUFACTURING}}': formatTlFromKurus(values.employerManufacturingKurus),
      '{{SCENARIO_100K_EMPLOYER_NONE}}': formatTlFromKurus(values.employerNoDiscountKurus)
    })
  });
}

export function replaceScenarioTokens(template, replacements) {
  let rendered = template;
  for (const [token, value] of Object.entries(replacements)) {
    rendered = rendered.replaceAll(token, value);
  }

  const remainingTokens = rendered.match(/\{\{SCENARIO_[A-Z0-9_]+\}\}/g);
  if (remainingTokens) {
    throw new Error(`Çözümlenmemiş senaryo tokenları: ${remainingTokens.join(', ')}`);
  }

  return rendered;
}

export async function renderScenarioPages(distDir) {
  const scenarioPath = join(distDir, '100000-brut-maas-hesaplama', 'index.html');
  const template = await readFile(scenarioPath, 'utf8');
  const scenario = createGross100kScenarioData();
  const tableRows = scenario.rows.map((row, index) => `<tr><th scope="row">${MONTHS[index]}</th><td>${formatTlFromKurus(row.netKurus)}</td><td>${row.incomeTaxRatesPpm.map(rate => '%' + rate / 10_000).join(' → ')}</td><td>${formatTlFromKurus(row.cumulativeTaxBaseKurus)}</td></tr>`).join('');
  const answer = `<section class="scenario-answer" aria-labelledby="scenario-answer-title"><h2 id="scenario-answer-title">100.000 TL brüt kaç TL net eder?</h2><p>2026 yılında 100.000 TL sabit aylık brüt maaşın Ocak neti <strong>${formatTlFromKurus(scenario.values.januaryNetKurus)}</strong>, yıllık ortalama neti <strong>${formatTlFromKurus(scenario.values.averageNetKurus)}</strong> ve 12 aylık toplam neti <strong>${formatTlFromKurus(scenario.values.annualNetKurus)}</strong> olur.</p><p>Varsayımlar: Ocak–Aralık tam çalışma, başlangıçta sıfır kümülatif matrah, standart çalışan, prim ve ek ödeme yok, engellilik indirimi yok. Kişisel koşullarınız sonucu değiştirebilir.</p><p><a href="#aylik-net-tablo">12 aylık tabloyu incele ↓</a> · <a href="/blog/100000-tl-brut-maas-neti-2026/">Bu maaş teklifini nasıl değerlendirmeli?</a></p></section>`;
  const table = `<section aria-labelledby="aylik-net-tablo"><h2 id="aylik-net-tablo">100.000 TL brüt maaşın 12 aylık net tablosu</h2><div class="scenario-table-scroll" role="region" aria-label="Aylık net maaş tablosu, yatay kaydırılabilir" tabindex="0"><table><caption>2026 · Her ay 100.000 TL brüt · Maaşım.net bordro motoruyla hesaplanmıştır</caption><thead><tr><th scope="col">Ay</th><th scope="col">Net maaş</th><th scope="col">Uygulanan vergi oranları</th><th scope="col">Kümülatif matrah</th></tr></thead><tbody>${tableRows}</tbody></table></div><p>Ok işareti, aynı ayın matrahının birden fazla vergi dilimine dağıldığını gösterir; maaşın tamamına son oran uygulanmaz. Asgari ücret vergi istisnasındaki değişim nedeniyle net bazı aylarda yeniden artabilir.</p><p><a href="/hesaplama-metodolojisi/">Hesaplama yöntemi</a> · <a href="/veriler/2026/">2026 parametreleri ve resmî kaynaklar</a></p></section>`;
  let rendered = replaceScenarioTokens(template, scenario.replacements);
  if (!rendered.includes('<div class="metric-boxes">') || !rendered.includes('<h2>Sonuç nasıl yorumlanmalı?</h2>')) throw new Error('100.000 TL senaryo bağlantı noktaları bulunamadı');
  rendered = rendered.replace('<div class="metric-boxes">', `${answer}<div class="metric-boxes">`)
    .replace('<h2>Sonuç nasıl yorumlanmalı?</h2>', `${table}<h2>Sonuç nasıl yorumlanmalı?</h2>`)
    .replace('Yıl içinde vergi dilimleri ilerledikçe aylık net azalır.', 'Vergi dilimi geçişleri neti düşürebilir; asgari ücret istisnasındaki artış ise bazı aylarda neti yeniden yükseltebilir.')
    .replace('</head>', `<style>.scenario-answer{padding:20px;background:#f0fdfa;border:1px solid #99f6e4;border-radius:16px;margin-bottom:24px}.scenario-table-scroll{overflow-x:auto;max-width:100%;margin:20px 0}.scenario-table-scroll:focus-visible{outline:3px solid #0f766e;outline-offset:3px}.scenario-table-scroll table{width:100%;border-collapse:collapse;font-size:14px}.scenario-table-scroll caption{text-align:left;color:#475569;padding-bottom:12px}.scenario-table-scroll th,.scenario-table-scroll td{padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;white-space:nowrap}.scenario-table-scroll thead{background:#f1f5f9}.scenario-table-scroll tbody tr:nth-child(even){background:#f8fafc}#aylik-net-tablo{scroll-margin-top:90px}</style></head>`);
  await writeFile(scenarioPath, rendered);

  return Object.freeze({
    renderedPages: 1,
    gross100k: scenario.values
  });
}
