import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function applyFintechUi(distDir) {
  const indexPath = join(distDir, 'index.html');
  const stylesPath = join(distDir, 'assets', 'styles.css');

  let html = await readFile(indexPath, 'utf8');
  let styles = await readFile(stylesPath, 'utf8');
  const fintechCss = await readFile(new URL('../src/fintech-ui.css', import.meta.url), 'utf8');

  if (!html.includes('class="calculator-layout')) {
    throw new Error('Fintech UI uygulanamadı: calculator-layout bulunamadı.');
  }
  if (!html.includes('id="payroll-results-shell"')) {
    throw new Error('Fintech UI uygulanamadı: bordro sonuç kabuğu bulunamadı.');
  }
  if (!html.includes('class="result-hierarchy"')) {
    throw new Error('Fintech UI uygulanamadı: sonuç hiyerarşisi bulunamadı.');
  }

  html = html.replace(/<body([^>]*)>/i, (match, attrs) => {
    if (/\bdata-fintech-ui=/i.test(attrs)) return match;
    return `<body${attrs} data-fintech-ui="v1">`;
  });

  if (!styles.includes('/* Maaşım.net SaaS fintech arayüz sistemi */')) {
    styles += `\n${fintechCss}\n`;
  }

  await writeFile(indexPath, html);
  await writeFile(stylesPath, styles);

  console.log('SaaS fintech UI sistemi uygulandı.');
}
