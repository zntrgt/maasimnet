import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const dist = join(process.cwd(), 'dist');
const html = await readFile(join(dist, 'index.html'), 'utf8');
const css = await readFile(join(dist, 'assets', 'styles.css'), 'utf8');
const js = await readFile(join(dist, 'assets', 'mobile-calculator-ux.js'), 'utf8');

for (const token of [
  'src="/assets/mobile-calculator-ux.js"',
  'data-fintech-ui="v2"',
  'id="input-salary"',
  'class="calculator-results-column"'
]) if (!html.includes(token)) throw new Error(`Mobile UX HTML contract eksik: ${token}`);

for (const token of [
  '/* Maaşım.net mobile calculator UX v2',
  '.enterprise-mobile-sticky{display:none!important}',
  '.enterprise-mobile-sticky.is-visible',
  'env(safe-area-inset-bottom,0px)',
  'env(safe-area-inset-left,0px)',
  'body.enterprise-input-active .enterprise-mobile-sticky',
  '.enterprise-money-input #input-salary',
  'width:var(--mobile-visual-viewport-width,100dvw)!important',
  'max-width:var(--mobile-visual-viewport-width,100dvw)!important',
  'transform:none!important',
  'box-sizing:border-box!important',
  '.metric-hero{position:static!important',
  'font-size:clamp(2.7rem,12.5vw,4rem)!important',
  '.enterprise-tax-bars{width:100%!important',
  'grid-template-columns:repeat(12,minmax(0,1fr))!important',
  '#payroll-results-shell,',
  'overflow-x:auto!important'
]) if (!css.includes(token)) throw new Error(`Mobile UX CSS contract eksik: ${token}`);

for (const token of [
  "const MOBILE_QUERY = '(max-width: 700px)'",
  'hasUsableResult()',
  'syncMainToVisualViewport()',
  "qs('body[data-fintech-ui=\"v2\"] > main')",
  'viewport?.width || document.documentElement.clientWidth',
  "main.style.setProperty('width', `${width}px`, 'important')",
  "main.style.setProperty('max-width', `${width}px`, 'important')",
  "document.documentElement.style.setProperty('--mobile-visual-viewport-width'",
  "sticky.classList.toggle('is-visible', shouldShow)",
  'new IntersectionObserver(',
  'entry.intersectionRatio >= 0.18',
  "document.body.classList.add('enterprise-input-active')",
  "document.body.classList.remove('enterprise-input-active')",
  "window.visualViewport?.addEventListener('resize', refresh",
  "window.visualViewport?.addEventListener('scroll', refresh",
  'inputValue > 0 && netValue > 0'
]) if (!js.includes(token)) throw new Error(`Mobile UX JS contract eksik: ${token}`);

for (const forbidden of ['fetch(', 'XMLHttpRequest', 'navigator.sendBeacon', 'gtag(', 'dataLayer.push']) {
  if (js.includes(forbidden)) throw new Error(`Mobile UX finansal girdiyi ağ/analytics katmanına taşıyamaz: ${forbidden}`);
}

console.log('Mobile calculator UX doğrulandı: Safari visualViewport width lock, input focus, contextual sticky, safe-area, compact result ve overflow guard.');
