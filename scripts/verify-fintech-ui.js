import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const dist = join(root, 'dist');
const html = await readFile(join(dist, 'index.html'), 'utf8');
const css = await readFile(join(dist, 'assets', 'styles.css'), 'utf8');
const fintechJs = await readFile(join(dist, 'assets', 'fintech-ui.js'), 'utf8');
const humanizedJs = await readFile(join(dist, 'assets', 'humanized-ux.js'), 'utf8');
const app = await readFile(join(dist, 'assets', 'app.js'), 'utf8');
const shellCss = (await readFile(join(root, 'src', 'site-shell.css'), 'utf8')).trim();

const requiredHtml = [
  'data-fintech-ui="v2"',
  'data-enterprise-hero="v2"',
  'data-enterprise-trust="v2"',
  '<h1>Maaşını hesapla</h1>',
  '2026 mevzuatı kontrol edildi',
  'src="/assets/fintech-ui.js"',
  'class="calculator-layout',
  'class="calculator-results-column"',
  'class="calculator-table-full"',
  'data-dashboard-table="full-width"',
  'id="payroll-results-shell"',
  '>Vergi Dilimi</th>'
];
for (const token of requiredHtml) {
  if (!html.includes(token)) throw new Error(`Enterprise fintech UI HTML işareti eksik: ${token}`);
}

if (html.includes('class="human-quick-amounts"')) {
  throw new Error('Hızlı maaş tutarları statik HTML içinde bırakılmış; click listener bağlanmadan görünür hale gelebilir.');
}
for (const token of [
  'function ensureQuickAmounts()',
  "quick.addEventListener('click'",
  'data-human-amount',
  "input.dispatchEvent(new Event('input', { bubbles: true }))"
]) {
  if (!humanizedJs.includes(token)) throw new Error(`Hızlı maaş tutarı etkileşimi eksik: ${token}`);
}

for (const token of [
  '/* Enterprise Fintech UI v2',
  '--primary: #07111f',
  '--accent: #12b76a',
  'font-variant-numeric: tabular-nums',
  '.enterprise-hero',
  '.enterprise-trust-strip',
  'grid-template-columns: minmax(350px, .82fr) minmax(0, 1.18fr)',
  '.enterprise-form-card',
  '.enterprise-money-input',
  '.enterprise-input-clear',
  '.enterprise-advanced',
  '.cta-button--calculate',
  '.metric-hero',
  'position: sticky',
  '.enterprise-result-actions',
  '.enterprise-tax-bars',
  'grid-template-columns: repeat(12, minmax(0,1fr))',
  '.enterprise-mobile-sticky',
  '@media print',
  'grid-template-columns: repeat(4, minmax(0, 1fr))',
  '#payroll-results-shell .payroll-table'
]) {
  if (!css.includes(token)) throw new Error(`Enterprise fintech UI CSS kuralı eksik: ${token}`);
}

for (const token of [
  "const ENTERPRISE_UI_VERSION = 'v2'",
  'enhanceFormStructure()',
  'enterprise-input-clear',
  'data-enterprise-action="copy"',
  'data-enterprise-action="print"',
  'data-enterprise-action="email"',
  'enterprise-mobile-sticky',
  'new MutationObserver(',
  'navigator.clipboard.writeText',
  'window.print()',
  'mailto:?subject=',
  'updateTaxVisual()'
]) {
  if (!fintechJs.includes(token)) throw new Error(`Enterprise fintech UI etkileşimi eksik: ${token}`);
}
for (const forbidden of ['gtag(', 'fetch(', 'XMLHttpRequest']) {
  if (fintechJs.includes(forbidden)) throw new Error(`Enterprise UI finansal sonucu ağ/analytics katmanına taşımamalı: ${forbidden}`);
}

for (const token of ['class="tax-bracket-badge"', "'İşveren Maliyeti', 'Vergi Dilimi'"]) {
  if (!app.includes(token)) throw new Error(`Mevcut vergi dilimi uygulama çıktısı korunamadı: ${token}`);
}

const representativePages = [
  'index.html',
  join('blog', 'index.html'),
  join('veriler', '2026', 'index.html'),
  join('sss', 'index.html'),
  join('2027-maas-hesaplama', 'index.html'),
  join('yillik-izin-ucreti-hesaplama', 'index.html')
];

for (const relativePath of representativePages) {
  const page = await readFile(join(dist, relativePath), 'utf8');
  for (const token of [
    'data-site-shell-css="v3"',
    'class="site-header"',
    'class="site-footer"',
    '.site-header{',
    '.site-footer{',
    '.site-footer__grid{',
    '/* Legacy sayfa CSS\'lerinden ortak shell izolasyonu */'
  ]) {
    if (!page.includes(token)) throw new Error(`Ortak shell eksik (${token}): ${relativePath}`);
  }
  if (!page.includes(shellCss)) throw new Error(`Ortak shell CSS içeriği farklı: ${relativePath}`);
  if (page.includes('/assets/site-shell.css')) throw new Error(`Ayrı shell CSS isteği kaldı: ${relativePath}`);
  for (const navCopy of ['Hesaplama Araçları', 'İşveren Maliyeti', 'Kıdem &amp; İhbar', '2026 Verileri', 'SSS']) {
    if (!page.includes(navCopy)) throw new Error(`Enterprise header linki eksik (${navCopy}): ${relativePath}`);
  }
}

for (const route of [
  'tazminat-hesaplama',
  'issizlik-maasi-hesaplama',
  'fazla-mesai-hesaplama',
  'yillik-izin-ucreti-hesaplama',
  'asgari-ucret-hesaplama'
]) {
  const page = await readFile(join(dist, route, 'index.html'), 'utf8');
  if (!page.includes('--mn-emerald-500:#12b76a')) throw new Error(`${route}: ortak enterprise token sistemi eksik`);
  if (!page.includes('background:var(--mn-ink-950)!important')) throw new Error(`${route}: koyu sonuç paneli enterprise standardı eksik`);
  if (!page.includes('min-height:50px!important')) throw new Error(`${route}: form kontrol yüksekliği enterprise standardı eksik`);
}

if (!css.includes('@media (max-width: 700px)')) throw new Error('Enterprise UI mobile-first breakpoint eksik.');
if (!css.includes('@media (prefers-reduced-motion: reduce)')) throw new Error('Reduced-motion erişilebilirlik kuralı eksik.');

console.log('Enterprise fintech UI v2 doğrulandı: desktop/mobile, humanized hero, hızlı tutar etkileşimi, live output, paylaşım, trust ve sitewide token sistemi.');
