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

const mainTag = html.match(/<main\b[^>]*>/i)?.[0] || '';
if (!mainTag) throw new Error('Mobile UX ana main etiketi bulunamadı.');
if (/class=["'][^"']*\bcontainer\b/i.test(mainTag)) {
  throw new Error(`Homepage main Tailwind container max-width kullanamaz: ${mainTag}`);
}

for (const token of [
  '/* Maaşım.net mobile calculator UX v5',
  '.enterprise-mobile-sticky{display:none!important}',
  '.enterprise-mobile-sticky.is-visible',
  'env(safe-area-inset-bottom,0px)',
  'body.enterprise-input-active .enterprise-mobile-sticky',
  '-webkit-text-size-adjust:100%',
  '.enterprise-form-card input:not(#input-salary)',
  'font-size:16px!important',
  '.enterprise-money-input #input-salary',
  'font-size:clamp(28px,8.5vw,36px)!important',
  'overflow-x:clip',
  '#payroll-results-shell{',
  'contain:inline-size',
  '-webkit-overflow-scrolling:touch'
]) if (!css.includes(token)) throw new Error(`Mobile UX CSS contract eksik: ${token}`);

for (const token of [
  "const MOBILE_QUERY = '(max-width: 700px)'",
  'hasUsableResult()',
  "sticky.classList.toggle('is-visible', shouldShow)",
  'new IntersectionObserver(',
  'entry.intersectionRatio >= 0.18',
  "document.body.classList.add('enterprise-input-active')",
  "document.body.classList.remove('enterprise-input-active')",
  "window.visualViewport?.addEventListener('resize', refresh",
  'inputValue > 0 && netValue > 0'
]) if (!js.includes(token)) throw new Error(`Mobile UX JS contract eksik: ${token}`);

for (const forbiddenCss of [
  '--mobile-visual-viewport-width',
  'width:100vw!important',
  'width:100dvw!important',
  'margin-left:calc(50% - 50vw)',
  'body[data-fintech-ui="v2"] main{\n    width:'
]) {
  if (css.includes(forbiddenCss)) throw new Error(`Mobile UX layout genişliğini override edemez: ${forbiddenCss}`);
}

for (const forbiddenJs of [
  'syncMainToVisualViewport',
  "main.style.setProperty('width'",
  "main.style.setProperty('max-width'",
  "--mobile-visual-viewport-width",
  'viewportMeta.setAttribute',
  'setupIosViewportRecovery',
  'maximum-scale=1',
  'minimum-scale=1',
  'fetch(', 'XMLHttpRequest', 'navigator.sendBeacon', 'gtag(', 'dataLayer.push'
]) {
  if (js.includes(forbiddenJs)) throw new Error(`Mobile UX yasaklı davranış içeriyor: ${forbiddenJs}`);
}

console.log('Mobile calculator UX doğrulandı: document overflow clip; geniş bordro tablosu inline-size containment içinde scroll ediyor; iOS input odak güvenliği 16px+; viewport meta runtime değiştirilmiyor.');
