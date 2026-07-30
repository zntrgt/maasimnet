import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const EMPLOYER_BLOCK = `<div>
<label class="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2" for="select-employer-scheme">İşveren SGK Teşviki</label>
<select class="w-full bg-white/10 border border-white/10 rounded-xl h-11 px-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500" id="select-employer-scheme" onchange="calculate()">
<option class="text-slate-900" selected="" value="other">Diğer Sektörler – 2 Puan İndirimli</option>
<option class="text-slate-900" value="manufacturing">İmalat – 5 Puan İndirimli</option>
<option class="text-slate-900" value="none">SGK Prim İndirimi Yok</option>
</select>
<p class="mt-2 text-[10px] leading-relaxed text-white/40">Emekli çalışan seçildiğinde işveren SGDP oranı otomatik uygulanır.</p>
</div>`;

const EMPLOYER_OPTIONS = `<details class="employer-options">
<summary>İşveren maliyeti <span class="font-normal opacity-70">(opsiyonel)</span> <span aria-hidden="true">▾</span></summary>
<div class="employer-options__body">
<label class="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2" for="select-employer-scheme">İşveren SGK Teşviki</label>
<select class="w-full bg-white/10 border border-white/10 rounded-xl h-11 px-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500" id="select-employer-scheme" onchange="calculate()">
<option class="text-slate-900" selected="" value="other">Diğer Sektörler – 2 Puan İndirimli</option>
<option class="text-slate-900" value="manufacturing">İmalat – 5 Puan İndirimli</option>
<option class="text-slate-900" value="none">SGK Prim İndirimi Yok</option>
</select>
<p class="mt-2 text-[10px] leading-relaxed text-white/45">Bu seçim net maaşı etkilemez; yalnızca işveren maliyetini değiştirir. Emekli çalışan seçildiğinde SGDP otomatik uygulanır.</p>
<div class="employer-cost-result">
<span>Aylık ortalama işveren maliyeti</span>
<strong id="stat-avg-cost">0,00 ₺</strong>
<small id="detail-avg-cost">Yıllık toplam işveren maliyeti ÷ 12</small>
</div>
</div>
</details>`;

const REPRESENTATIVE_GROSS = `<!-- Netten brüte modunda tek temsili brüt -->
<section class="representative-gross" id="representative-gross" hidden aria-live="polite">
  <p>Ortalama Brüt</p>
  <strong id="representative-gross-value">0,00 ₺</strong>
  <span id="representative-gross-note">Bu neti tutmak için ortalama brüt yaklaşık 0,00 ₺; aylara göre değişir.</span>
  <button type="button" id="toggle-net-gross-table" class="secondary-toggle" onclick="toggleNetGrossTable()" aria-expanded="false">Aylık brüt dağılımını göster</button>
</section>`;

const PAYROLL_MARKER = '<!-- Bordro Özeti: masaüstünde 8 kolon, mobilde 4 kolonlu tablo -->';
const QUICK_NAV_MARKER = '<!-- Quick Nav -->';

function buildMetricHierarchy(metricsBlock) {
  const articles = metricsBlock.match(/<article class="metric-card[\s\S]*?<\/article>/g) || [];
  if (articles.length !== 9) throw new Error(`Beklenen 9 metrik kartı bulunamadı: ${articles.length}`);

  const compactIndexes = [1, 2, 3, 4, 5, 6, 8];
  const compactCards = compactIndexes.map((index) => {
    let article = articles[index].replace(/class="metric-card[^"]*"/, 'class="metric-card metric-card--compact"');
    if (index === 8) {
      article = article
        .replace('metric-info metric-info--light', 'metric-info')
        .replace('text-white', 'text-slate-900')
        .replace('opacity-80', 'text-slate-400');
    }
    return article;
  }).join('\n');

  return `<!-- Result Metrics Hierarchy -->
<section class="result-hierarchy" aria-label="Maaş sonucu özeti">
  <article class="metric-hero">
    <div class="metric-heading-row">
      <p class="metric-title">Aylık Ort. Net</p>
      <details class="metric-info metric-info--light">
        <summary aria-label="Aylık ortalama net açıklaması">ⓘ</summary>
        <div class="metric-popover">
          <strong>Aylık Ortalama Net</strong>
          <p>Ocak–Aralık dönemindeki net maaşların toplamının 12'ye bölünmesiyle bulunur.</p>
          <div class="metric-formula" id="detail-avg-net">12 aylık toplam net ÷ 12</div>
        </div>
      </details>
    </div>
    <h3 id="stat-avg-net">0,00 ₺</h3>
    <p id="stat-avg-net-context">Bu maaşla yıl ortalaması net 0,00 ₺, ilk ay 0,00 ₺.</p>
  </article>
  <details class="secondary-metrics" open>
    <summary>
      <span class="secondary-metrics__heading">
        <strong>Detaylı maaş özeti</strong>
        <small>Yıllık toplamlar, en yüksek ve en düşük net, kesinti oranı ve brüt değerler</small>
      </span>
      <span class="secondary-metrics__action" aria-hidden="true">Göster / gizle ▾</span>
    </summary>
    <div class="secondary-metrics-grid">${compactCards}</div>
  </details>
</section>`;
}

function placeResultsColumn(html, hierarchy) {
  const payrollStart = html.indexOf(PAYROLL_MARKER);
  if (payrollStart < 0) throw new Error('Bordro tablosu başlangıç işareti bulunamadı.');

  const calculatorEnd = html.indexOf('</section>', payrollStart);
  if (calculatorEnd < 0) throw new Error('Hesaplayıcı bölümü kapanışı bulunamadı.');

  return html.slice(0, payrollStart)
    + `<div class="calculator-results-column">\n${REPRESENTATIVE_GROSS}\n${hierarchy}\n`
    + html.slice(payrollStart, calculatorEnd)
    + '</div>\n'
    + html.slice(calculatorEnd);
}

function patchApp(appSource) {
  let app = appSource;
  app = app.replace(
    'const openPayrollDetails = new Set();',
    'const openPayrollDetails = new Set();\nlet hasValidResult = false;\nlet netGrossTableExpanded = false;'
  );
  app = app.replace(
    '  currentMode = mode;\n\n  const grossButton',
    '  currentMode = mode;\n  netGrossTableExpanded = false;\n\n  const grossButton'
  );
  app = app.replace(
    'function togglePayrollDetail(monthIndex) {',
    `function toggleNetGrossTable() {
  netGrossTableExpanded = !netGrossTableExpanded;
  updateResultVisibility();
}

function updateResultVisibility() {
  const tableShell = document.getElementById('payroll-results-shell');
  const representative = document.getElementById('representative-gross');
  const toggleButton = document.getElementById('toggle-net-gross-table');
  const isNetMode = currentMode === 'net';

  representative.hidden = !isNetMode || !hasValidResult;
  tableShell.hidden = isNetMode && !netGrossTableExpanded;
  toggleButton.setAttribute('aria-expanded', String(netGrossTableExpanded));
  toggleButton.textContent = netGrossTableExpanded
    ? 'Aylık brüt dağılımını gizle'
    : 'Aylık brüt dağılımını göster';
}

function togglePayrollDetail(monthIndex) {`
  );
  app = app.replace(
    '  payrolls = payrollRowsKurus.map(mapEngineRowToUi);\n  updateUI();',
    '  payrolls = payrollRowsKurus.map(mapEngineRowToUi);\n  hasValidResult = salaryValue > 0 && payrolls.length === 12 && payrolls.every((row) => Number.isFinite(row.net) && row.net >= 0);\n  updateUI();'
  );
  app = app.replace(
    `  const effectiveDeductionRate = averageGross > 0
    ? ((averageGross - averageNet) / averageGross) * 100
    : 0;`,
    `  const effectiveDeductionRate = averageGross > 0
    ? ((averageGross - averageNet) / averageGross) * 100
    : 0;
  const januaryNet = payrolls[0]?.net ?? 0;
  const csvButton = document.getElementById('download-csv-button');

  csvButton.disabled = !hasValidResult;
  csvButton.setAttribute('aria-disabled', String(!hasValidResult));
  document.getElementById('stat-avg-net-context').textContent = \`Bu maaşla yıl ortalaması net \${formatCurrency(averageNet)}, ilk ay \${formatCurrency(januaryNet)}.\`;
  document.getElementById('representative-gross-value').textContent = formatCurrency(averageGross);
  document.getElementById('representative-gross-note').textContent = \`Bu neti tutmak için ortalama brüt yaklaşık \${formatCurrency(averageGross)}; aylara göre değişir.\`;`
  );
  app = app.replace(
    '    renderPayrollChangeReason\n  });\n}',
    '    renderPayrollChangeReason\n  });\n  updateResultVisibility();\n}'
  );
  app = app.replace('function downloadCSV() {\n  const header', 'function downloadCSV() {\n  if (!hasValidResult) return;\n  const header');
  app = app.replace('  togglePayrollDetail,\n  calculateAndShowPayroll,', '  togglePayrollDetail,\n  toggleNetGrossTable,\n  calculateAndShowPayroll,');
  return app;
}

export async function applyResultHierarchy(distDir) {
  const indexPath = join(distDir, 'index.html');
  const cssPath = join(distDir, 'assets', 'styles.css');
  const appPath = join(distDir, 'assets', 'app.js');

  let html = await readFile(indexPath, 'utf8');
  let css = await readFile(cssPath, 'utf8');
  let app = await readFile(appPath, 'utf8');

  if (!html.includes(EMPLOYER_BLOCK)) throw new Error('İşveren teşviki bloğu bulunamadı.');
  html = html.replace(EMPLOYER_BLOCK, EMPLOYER_OPTIONS);
  html = html.replace(
    '<button type="button" class="cta-button cta-button--download" onclick="downloadCSV()">Bordroyu İndir (CSV)</button>',
    '<button type="button" class="cta-button cta-button--download" id="download-csv-button" onclick="downloadCSV()" disabled aria-disabled="true">Bordroyu İndir (CSV)</button>'
  );

  const metricsStart = html.indexOf('<!-- Hero Metrics');
  const metricsEnd = html.indexOf(QUICK_NAV_MARKER);
  if (metricsStart < 0 || metricsEnd < 0) throw new Error('Metrik bölümü sınırları bulunamadı.');

  const hierarchy = buildMetricHierarchy(html.slice(metricsStart, metricsEnd));
  html = html.slice(0, metricsStart) + html.slice(metricsEnd);
  html = placeResultsColumn(html, hierarchy);

  const hierarchyCss = await readFile(new URL('../src/result-hierarchy.css', import.meta.url), 'utf8');
  css += `\n${hierarchyCss}\n`;
  app = patchApp(app);

  await writeFile(indexPath, html);
  await writeFile(cssPath, css);
  await writeFile(appPath, app);
}