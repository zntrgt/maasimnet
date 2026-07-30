import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const CSS_MARKER = '/* Tam genişlik SaaS dashboard bordro yerleşimi */';

export async function applyDashboardLayout(distDir) {
  const indexPath = join(distDir, 'index.html');
  const stylesPath = join(distDir, 'assets', 'styles.css');
  const html = await readFile(indexPath, 'utf8');
  let styles = await readFile(stylesPath, 'utf8');

  for (const token of [
    'class="calculator-results-column"',
    '<!-- Calculator Layout End -->',
    'class="calculator-table-full"',
    'id="payroll-results-shell"'
  ]) {
    if (!html.includes(token)) {
      throw new Error(`Dashboard yerleşimi eksik üretildi: ${token}`);
    }
  }

  if (!styles.includes(CSS_MARKER)) {
    const dashboardCss = await readFile(new URL('../src/dashboard-layout.css', import.meta.url), 'utf8');
    styles += `\n${dashboardCss}\n`;
    await writeFile(stylesPath, styles);
  }

  console.log('Dashboard yerleşimi doğrulandı: üstte form ve sonuçlar, altta bağımsız tam genişlik tablo.');
}
