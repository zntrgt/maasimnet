import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const CSS_MARKER = '/* Aylık gelir vergisi dilimi sütunu */';

function replaceRequired(source, search, replacement, errorMessage) {
  if (!source.includes(search)) throw new Error(errorMessage);
  return source.replace(search, replacement);
}

export async function applyTaxBracketColumn(distDir) {
  const indexPath = join(distDir, 'index.html');
  const appPath = join(distDir, 'assets', 'app.js');
  const stylesPath = join(distDir, 'assets', 'styles.css');

  let html = await readFile(indexPath, 'utf8');
  let app = await readFile(appPath, 'utf8');
  let styles = await readFile(stylesPath, 'utf8');

  app = replaceRequired(
    app,
    `function formatKurus(valueKurus) {\n  return formatCurrency(kurusToTl(valueKurus));\n}`,
    `function formatKurus(valueKurus) {\n  return formatCurrency(kurusToTl(valueKurus));\n}\n\nfunction formatIncomeTaxRates(ratePpmList) {\n  if (!Array.isArray(ratePpmList) || ratePpmList.length === 0) return '—';\n  return ratePpmList.map((ratePpm) => '%' + (ratePpm / 10000)).join(' → ');\n}`,
    'Vergi dilimi biçimleyicisi eklenemedi.'
  );

  app = replaceRequired(
    app,
    `    cumulativeTaxBase: kurusToTl(row.cumulativeTaxBaseKurus),\n    workerSgk:`,
    `    cumulativeTaxBase: kurusToTl(row.cumulativeTaxBaseKurus),\n    incomeTaxRatesPpm: row.incomeTaxRatesPpm,\n    workerSgk:`,
    'Bordro UI modeline vergi dilimi eklenemedi.'
  );

  app = replaceRequired(
    app,
    `        \${detailPair('Küm. G.V. Matrah', formatCurrency(row.cumulativeTaxBase))}\n        \${detailPair('Hesaplanan Gelir Vergisi', formatCurrency(row.grossIncomeTax))}`,
    `        \${detailPair('Küm. G.V. Matrah', formatCurrency(row.cumulativeTaxBase))}\n        \${detailPair('Uygulanan Vergi Dilimi', formatIncomeTaxRates(row.incomeTaxRatesPpm), 'text-teal-700')}\n        \${detailPair('Hesaplanan Gelir Vergisi', formatCurrency(row.grossIncomeTax))}`,
    'Aylık detay paneline vergi dilimi eklenemedi.'
  );

  app = replaceRequired(
    app,
    `      <td class="px-3 py-4 font-bold text-slate-900">\${formatCurrency(row.cost)}</td>\n      <td class="px-2 py-4 text-center">`,
    `      <td class="px-3 py-4 font-bold text-slate-900">\${formatCurrency(row.cost)}</td>\n      <td class="px-3 py-4 text-center"><span class="tax-bracket-badge">\${formatIncomeTaxRates(row.incomeTaxRatesPpm)}</span></td>\n      <td class="px-2 py-4 text-center">`,
    'Masaüstü tabloya vergi dilimi hücresi eklenemedi.'
  );

  app = app.replace('renderPayrollChangeReason(changeReason, 8)', 'renderPayrollChangeReason(changeReason, 9)');
  app = app.replace('colspan="8" class="bg-slate-50 p-4"', 'colspan="9" class="bg-slate-50 p-4"');

  app = replaceRequired(
    app,
    `'Toplam Kesinti', 'Net Maaş', 'İşveren SGK',\n    'İşveren İşsizlik', 'İşveren Maliyeti'`,
    `'Toplam Kesinti', 'Net Maaş', 'İşveren SGK',\n    'İşveren İşsizlik', 'İşveren Maliyeti', 'Vergi Dilimi'`,
    'CSV başlığına vergi dilimi eklenemedi.'
  );

  app = replaceRequired(
    app,
    `row.minimumWageIncomeTaxExemption, row.payableIncomeTax,\n      row.grossStampTax, row.minimumWageStampExemption, row.payableStampTax,\n      row.totalDeductions, row.net, row.employerSgk,\n      row.employerUnemployment, row.cost`,
    `row.minimumWageIncomeTaxExemption, row.payableIncomeTax,\n      row.grossStampTax, row.minimumWageStampExemption, row.payableStampTax,\n      row.totalDeductions, row.net, row.employerSgk,\n      row.employerUnemployment, row.cost, formatIncomeTaxRates(row.incomeTaxRatesPpm)`,
    'CSV satırına vergi dilimi eklenemedi.'
  );

  if (!html.includes('>Vergi Dilimi</th>')) {
    const detailHeaderPattern = /(<th[^>]*>\s*Detay\s*<\/th>)/i;
    if (!detailHeaderPattern.test(html)) throw new Error('Tablo Detay başlığı bulunamadı.');
    html = html.replace(
      detailHeaderPattern,
      '<th class="px-3 py-4 text-center whitespace-nowrap">Vergi Dilimi</th>\n$1'
    );
  }

  if (!styles.includes(CSS_MARKER)) {
    styles += `\n${CSS_MARKER}\n.tax-bracket-badge {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  min-width: 64px;\n  padding: 0.35rem 0.55rem;\n  border: 1px solid #a7f3d0;\n  border-radius: 999px;\n  background: #ecfdf5;\n  color: #047857;\n  font-size: 0.75rem;\n  font-weight: 800;\n  line-height: 1;\n  white-space: nowrap;\n  font-variant-numeric: tabular-nums;\n}\n.calculator-table-full .payroll-table { min-width: 1080px; }\n`;
  }

  await writeFile(indexPath, html, 'utf8');
  await writeFile(appPath, app, 'utf8');
  await writeFile(stylesPath, styles, 'utf8');
  console.log('Aylık gelir vergisi dilimi tabloya ve detay paneline eklendi.');
}
