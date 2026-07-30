import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const PAYROLL_MARKER = '<!-- Bordro Özeti: masaüstünde 8 kolon, mobilde 4 kolonlu tablo -->';

export async function applyDashboardLayout(distDir) {
  const indexPath = join(distDir, 'index.html');
  let html = await readFile(indexPath, 'utf8');

  if (html.includes('class="calculator-table-full"')) {
    console.log('Dashboard tablo yerleşimi zaten uygulanmış.');
    return;
  }

  const resultsStart = html.indexOf('<div class="calculator-results-column">');
  const payrollStart = html.indexOf(PAYROLL_MARKER, resultsStart);
  if (resultsStart < 0 || payrollStart < 0) {
    throw new Error('Dashboard yerleşimi uygulanamadı: sonuç sütunu veya bordro tablosu bulunamadı.');
  }

  const payrollSectionEndTag = '</section>';
  const payrollSectionEnd = html.indexOf(payrollSectionEndTag, payrollStart);
  if (payrollSectionEnd < 0) {
    throw new Error('Dashboard yerleşimi uygulanamadı: bordro bölümü kapanışı bulunamadı.');
  }

  const payrollEnd = payrollSectionEnd + payrollSectionEndTag.length;
  const payrollHtml = html.slice(payrollStart, payrollEnd);
  const withoutPayroll = html.slice(0, payrollStart) + html.slice(payrollEnd);

  const resultsClose = withoutPayroll.indexOf('</div>', resultsStart);
  if (resultsClose < 0) {
    throw new Error('Dashboard yerleşimi uygulanamadı: sonuç sütunu kapanışı bulunamadı.');
  }

  const insertionPoint = resultsClose + '</div>'.length;
  html = withoutPayroll.slice(0, insertionPoint)
    + `\n<div class="calculator-table-full" data-dashboard-table="full-width">\n${payrollHtml}\n</div>`
    + withoutPayroll.slice(insertionPoint);

  await writeFile(indexPath, html);
  console.log('Dashboard yerleşimi uygulandı: üstte iki sütun, altta tam genişlik bordro tablosu.');
}
