import { gunzipSync } from 'node:zlib';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const bundleDir = join(root, 'site-bundle');
const staticDir = join(root, 'static');

const chunkFiles = (await readdir(bundleDir))
  .filter((name) => /^\d{3}\.b64$/.test(name))
  .sort();

if (chunkFiles.length === 0) {
  throw new Error('site-bundle içinde statik kaynak parçaları bulunamadı.');
}

const encodedParts = await Promise.all(
  chunkFiles.map((name) => readFile(join(bundleDir, name), 'utf8'))
);
const compressed = Buffer.from(encodedParts.join(''), 'base64');
const manifest = JSON.parse(gunzipSync(compressed).toString('utf8'));

await rm(staticDir, { recursive: true, force: true });
await mkdir(staticDir, { recursive: true });

for (const [relativePath, encodedContent] of Object.entries(manifest)) {
  const targetPath = join(staticDir, relativePath);
  await mkdir(dirname(targetPath), { recursive: true });
  await writeFile(targetPath, Buffer.from(encodedContent, 'base64'));
}

const indexPath = join(staticDir, 'index.html');
let indexHtml = await readFile(indexPath, 'utf8');

function replaceRequired(source, searchValue, replacement, label) {
  if (!source.includes(searchValue)) {
    throw new Error(`Statik şablon güncellemesi uygulanamadı: ${label}`);
  }
  return source.replace(searchValue, replacement);
}

indexHtml = replaceRequired(
  indexHtml,
  '<input class="w-full bg-white/10 border border-white/10 rounded-2xl h-16 px-6 text-3xl font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all" id="input-salary" oninput="handleMainSalaryInput()" step="1000" type="number" value="100000"/>',
  '<input class="w-full bg-white/10 border border-white/10 rounded-2xl h-16 px-6 text-3xl font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all" id="input-salary" inputmode="decimal" data-money-input="true" data-raw-value="100000" oninput="handleMainSalaryInput(event)" autocomplete="off" type="text" value="100.000"/>',
  'ana maaş input formatı'
);

indexHtml = replaceRequired(
  indexHtml,
  '<p class="metric-title text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1">Net Maaş Farkı</p>',
  '<p class="metric-title text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Net Maaş Farkı</p>',
  'net maaş farkı nötr rengi'
);

indexHtml = replaceRequired(
  indexHtml,
  '<h3 class="text-xl font-bold text-slate-900" id="stat-net-diff">0 ₺</h3>',
  '<h3 class="text-xl font-bold text-slate-900" id="stat-net-diff">0 ₺</h3>\n    <p class="metric-card-note">Dilim değişimleri nedeniyle en yüksek ve en düşük ay neti arasındaki fark.</p>',
  'net maaş farkı açıklaması'
);

await writeFile(indexPath, indexHtml);

const stylesPath = join(staticDir, 'assets', 'styles.css');
let stylesCss = await readFile(stylesPath, 'utf8');
const uxStyles = `

/* Para inputları ve bordro yön değişimi açıklamaları */
.metric-card-note {
  margin-top: 0.45rem;
  color: #64748b;
  font-size: 0.72rem;
  line-height: 1.35;
}

.payroll-table .text-red-500,
.detail-grid .text-red-600 {
  color: #334155 !important;
}

.payroll-change-reason-row td {
  padding: 0.45rem 0.75rem 0.65rem;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.payroll-change-reason {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: #475569;
  font-size: 0.68rem;
  font-weight: 700;
  line-height: 1.35;
}

.payroll-change-reason-row--increase .payroll-change-reason {
  color: #0f766e;
}

.payroll-change-reason-row--decrease .payroll-change-reason {
  color: #475569;
}

@media (max-width: 767px) {
  .payroll-change-reason-row td {
    padding: 0.5rem 0.65rem;
  }

  .payroll-change-reason {
    font-size: 0.64rem;
  }
}
`;

if (!stylesCss.includes('/* Para inputları ve bordro yön değişimi açıklamaları */')) {
  stylesCss += uxStyles;
  await writeFile(stylesPath, stylesCss);
}

console.log(`static hazır: ${Object.keys(manifest).length} dosya`);
