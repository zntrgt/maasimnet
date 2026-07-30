import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const CSS_MARKER = '/* Aylık gelir vergisi dilimi sütunu */';

function replaceOnce(source, pattern, replacement, errorMessage) {
  if (!pattern.test(source)) throw new Error(errorMessage);
  pattern.lastIndex = 0;
  return source.replace(pattern, replacement);
}

export async function applyTaxBracketColumn(distDir) {
  const indexPath = join(distDir, 'index.html');
  const appPath = join(distDir, 'assets', 'app.js');
  const stylesPath = join(distDir, 'assets', 'styles.css');

  let html = await readFile(indexPath, 'utf8');
  let app = await readFile(appPath, 'utf8');
  let styles = await readFile(stylesPath, 'utf8');

  if (!app.includes('function formatIncomeTaxRates(')) {
    app = replaceOnce(
      app,
      /function formatKurus\(valueKurus\)\s*\{[\s\S]*?\n\}/,
      (match) => `${match}\n\nfunction formatIncomeTaxRates(ratePpmList) {\n  if (!Array.isArray(ratePpmList) || ratePpmList.length === 0) return '—';\n  return ratePpmList.map((ratePpm) => '%' + (ratePpm / 10000)).join(' → ');\n}`,
      'Vergi dilimi biçimleyicisi eklenemedi.'
    );
  }

  if (!app.includes('incomeTaxRatesPpm: row.incomeTaxRatesPpm')) {
    app = replaceOnce(
      app,
      /(cumulativeTaxBase:\s*kurusToTl\(row\.cumulativeTaxBaseKurus\),\s*\n)/,
      '$1    incomeTaxRatesPpm: row.incomeTaxRatesPpm,\n',
      'Bordro UI modeline vergi dilimi eklenemedi.'
    );
  }

  if (!app.includes("detailPair('Uygulanan Vergi Dilimi'")) {
    app = replaceOnce(
      app,
      /(\$\{detailPair\('Küm\. G\.V\. Matrah',\s*formatCurrency\(row\.cumulativeTaxBase\)\)\})/,
      `$1\n        \${detailPair('Uygulanan Vergi Dilimi', formatIncomeTaxRates(row.incomeTaxRatesPpm), 'text-teal-700')}`,
      'Aylık detay paneline vergi dilimi eklenemedi.'
    );
  }

  if (!app.includes('class="tax-bracket-badge"')) {
    app = replaceOnce(
      app,
      /(\s*<td class="px-3 py-4 font-bold text-slate-900">\$\{formatCurrency\(row\.cost\)\}<\/td>)(\s*\n\s*<td class="px-2 py-4 text-center">)/,
      `$1\n      <td class="px-3 py-4 text-center"><span class="tax-bracket-badge">\${formatIncomeTaxRates(row.incomeTaxRatesPpm)}</span></td>$2`,
      'Masaüstü tabloya vergi dilimi hücresi eklenemedi.'
    );
  }

  app = app.replaceAll('renderPayrollChangeReason(changeReason, 8)', 'renderPayrollChangeReason(changeReason, 9)');
  app = app.replaceAll('colspan="8" class="bg-slate-50 p-4"', 'colspan="9" class="bg-slate-50 p-4"');

  if (!app.includes("'İşveren Maliyeti', 'Vergi Dilimi'")) {
    app = replaceOnce(
      app,
      /('İşveren İşsizlik',\s*'İşveren Maliyeti')/,
      `'İşveren İşsizlik', 'İşveren Maliyeti', 'Vergi Dilimi'`,
      'CSV başlığına vergi dilimi eklenemedi.'
    );
  }

  if (!app.includes('row.cost, formatIncomeTaxRates(row.incomeTaxRatesPpm)')) {
    app = replaceOnce(
      app,
      /(row\.employerUnemployment,\s*row\.cost)(\s*\n\s*\])/,
      '$1, formatIncomeTaxRates(row.incomeTaxRatesPpm)$2',
      'CSV satırına vergi dilimi eklenemedi.'
    );
  }

  if (!html.includes('>Vergi Dilimi</th>')) {
    html = replaceOnce(
      html,
      /(<th[^>]*>\s*Detay\s*<\/th>)/i,
      '<th class="px-3 py-4 text-center whitespace-nowrap">Vergi Dilimi</th>\n$1',
      'Tablo Detay başlığı bulunamadı.'
    );
  }

  if (!styles.includes(CSS_MARKER)) {
    styles += `\n${CSS_MARKER}\n.tax-bracket-badge {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  min-width: 64px;\n  padding: 0.35rem 0.55rem;\n  border: 1px solid #a7f3d0;\n  border-radius: 999px;\n  background: #ecfdf5;\n  color: #047857;\n  font-size: 0.75rem;\n  font-weight: 800;\n  line-height: 1;\n  white-space: nowrap;\n  font-variant-numeric: tabular-nums;\n}\n`;
  }

  for (const token of [
    'function formatIncomeTaxRates(',
    'incomeTaxRatesPpm: row.incomeTaxRatesPpm',
    "detailPair('Uygulanan Vergi Dilimi'",
    'class="tax-bracket-badge"',
    "'İşveren Maliyeti', 'Vergi Dilimi'"
  ]) {
    if (!app.includes(token)) throw new Error(`Vergi dilimi build çıktısı eksik: ${token}`);
  }
  if (!html.includes('>Vergi Dilimi</th>')) throw new Error('Vergi Dilimi tablo başlığı üretilemedi.');

  await writeFile(indexPath, html, 'utf8');
  await writeFile(appPath, app, 'utf8');
  await writeFile(stylesPath, styles, 'utf8');
  console.log('Aylık gelir vergisi dilimi tabloya ve detay paneline eklendi.');
}
