import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const CSS_MARKER = '/* Simetrik finansal metrik kart standardı */';

export async function applyMetricCardStandard(distDir) {
  const appPath = join(distDir, 'assets', 'app.js');
  const stylesPath = join(distDir, 'assets', 'styles.css');

  let app = await readFile(appPath, 'utf8');
  let styles = await readFile(stylesPath, 'utf8');

  app = app
    .replace(
      "document.getElementById('stat-high-net').innerText = `${MONTHS[summary.highestNetRow.month]}: ${formatCurrency(highestNet)}`;",
      "document.getElementById('stat-high-net').innerText = formatCurrency(highestNet);"
    )
    .replace(
      "document.getElementById('stat-low-net').innerText = `${MONTHS[summary.lowestNetRow.month]}: ${formatCurrency(lowestNet)}`;",
      "document.getElementById('stat-low-net').innerText = formatCurrency(lowestNet);"
    );

  if (!styles.includes(CSS_MARKER)) {
    const metricCss = await readFile(new URL('../src/metric-card-standard.css', import.meta.url), 'utf8');
    styles += `\n${metricCss}\n`;
  }

  await writeFile(appPath, app);
  await writeFile(stylesPath, styles);
  console.log('Metrik kart label/value hiyerarşisi standardize edildi.');
}
