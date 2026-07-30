import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const PAYROLL_MARKER = '<!-- Bordro Özeti: masaüstünde 8 kolon, mobilde 4 kolonlu tablo -->';
const CSS_MARKER = '/* Tam genişlik SaaS dashboard bordro yerleşimi */';

export async function applyDashboardLayout(distDir) {
  const indexPath = join(distDir, 'index.html');
  const stylesPath = join(distDir, 'assets', 'styles.css');
  let html = await readFile(indexPath, 'utf8');
  let styles = await readFile(stylesPath, 'utf8');

  if (!html.includes('class="calculator-table-full"')) {
    const calculatorStart = html.indexOf('<section class="calculator-layout');
    const resultsStart = html.indexOf('<div class="calculator-results-column">', calculatorStart);
    const payrollStart = html.indexOf(PAYROLL_MARKER, resultsStart);
    if (calculatorStart < 0 || resultsStart < 0 || payrollStart < 0) {
      throw new Error('Dashboard yerleşimi uygulanamadı: hesaplayıcı, sonuç sütunu veya bordro tablosu bulunamadı.');
    }

    const payrollSectionEndTag = '</section>';
    const payrollSectionEnd = html.indexOf(payrollSectionEndTag, payrollStart);
    if (payrollSectionEnd < 0) {
      throw new Error('Dashboard yerleşimi uygulanamadı: bordro bölümü kapanışı bulunamadı.');
    }

    const payrollEnd = payrollSectionEnd + payrollSectionEndTag.length;
    let payrollHtml = html.slice(payrollStart, payrollEnd);

    // Eski üretimde sonuç sütununun kapanışı bordro section'ından hemen önce kalabiliyor.
    // Bu kapanışı bordro parçasından çıkarıp sonuç sütununu açıkça kapatıyoruz.
    payrollHtml = payrollHtml.replace(/\s*<\/div>\s*(?=<\/section>\s*$)/, '');

    let withoutPayroll = html.slice(0, payrollStart) + html.slice(payrollEnd);
    const calculatorSectionEnd = withoutPayroll.indexOf('</section>', resultsStart);
    if (calculatorSectionEnd < 0) {
      throw new Error('Dashboard yerleşimi uygulanamadı: ana hesaplayıcı section kapanışı bulunamadı.');
    }

    const calculatorClose = calculatorSectionEnd + '</section>'.length;
    const beforeCalculatorClose = withoutPayroll.slice(0, calculatorSectionEnd);
    const afterCalculatorClose = withoutPayroll.slice(calculatorClose);

    html = beforeCalculatorClose
      + '\n</div>\n</section>'
      + `\n<div class="calculator-table-full" data-dashboard-table="full-width">\n${payrollHtml}\n</div>`
      + afterCalculatorClose;
  }

  if (!styles.includes(CSS_MARKER)) {
    const dashboardCss = await readFile(new URL('../src/dashboard-layout.css', import.meta.url), 'utf8');
    styles += `\n${dashboardCss}\n`;
  }

  await writeFile(indexPath, html);
  await writeFile(stylesPath, styles);
  console.log('Dashboard yerleşimi uygulandı: üstte bağımsız iki sütun, altında tam genişlik bordro tablosu.');
}
