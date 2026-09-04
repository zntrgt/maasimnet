import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DATA_2026 } from '../src/data-2026.js';

const UI_VERSION = 'v2';
const CSS_MARKER = '/* Enterprise Fintech UI v2';
const SCRIPT_SRC = '/assets/fintech-ui.js';

function replaceHomeHero(html) {
  const mainStart = html.search(/<main\b/i);
  if (mainStart < 0) throw new Error('Enterprise UI uygulanamadı: main bulunamadı.');
  const headerStart = html.indexOf('<header', mainStart);
  const headerEndStart = headerStart >= 0 ? html.indexOf('</header>', headerStart) : -1;
  if (headerStart < 0 || headerEndStart < 0) throw new Error('Enterprise UI uygulanamadı: ana hero header bulunamadı.');
  const headerEnd = headerEndStart + '</header>'.length;

  const hero = `<header class="enterprise-hero" data-enterprise-hero="${UI_VERSION}">
    <p class="enterprise-hero__eyebrow">2026 · Güncel mevzuat · Kuruş bazlı hesap</p>
    <h1>2026 Brütten Nete Maaş Hesaplama</h1>
    <p class="enterprise-hero__lead">Net maaşınızı, vergi dilimi değişimini ve işveren maliyetini tek ekranda görün. Netten brüte hedef maaş hesabı da aynı 2026 bordro motoruyla çalışır.</p>
    <div class="enterprise-hero__meta" aria-label="Hesaplama kapsamı"><span>2026 gelir vergisi tarifesi</span><span>SGK tavanı</span><span>Asgari ücret istisnası</span><span>12 aylık bordro</span></div>
  </header>`;

  const trust = `<section class="enterprise-trust-strip" aria-label="Hesaplama güven bilgileri" data-enterprise-trust="${UI_VERSION}">
    <article class="enterprise-trust-item"><span class="enterprise-trust-item__icon" aria-hidden="true">✓</span><div><strong>2026 mevzuat verileri kontrol edildi</strong><span>SGK, GİB ve ÇSGB kaynaklarıyla güncel parametreler</span></div></article>
    <article class="enterprise-trust-item"><span class="enterprise-trust-item__icon" aria-hidden="true">₺</span><div><strong>Kuruş bazlı deterministik motor</strong><span>Ara işlemler yuvarlama sapmasını azaltmak için kuruş bazında yürür</span></div></article>
    <article class="enterprise-trust-item"><span class="enterprise-trust-item__icon" aria-hidden="true">⌁</span><div><strong>Hesaplama tarayıcıda yapılır</strong><span>Maaş tutarı hesap motorunda yerel olarak işlenir · <a href="/hesaplama-metodolojisi/">Metodoloji</a></span></div></article>
  </section>`;

  return html.slice(0, headerStart) + hero + trust + html.slice(headerEnd);
}

function markBody(html) {
  return html.replace(/<body([^>]*)>/i, (match, attrs) => {
    if (/\bdata-fintech-ui=["'][^"']*["']/i.test(attrs)) {
      return `<body${attrs.replace(/\bdata-fintech-ui=["'][^"']*["']/i, `data-fintech-ui="${UI_VERSION}"`)}>`;
    }
    return `<body${attrs} data-fintech-ui="${UI_VERSION}">`;
  });
}

function normalizeMainWidthOwnership(html) {
  return html.replace(/<main\b([^>]*)class=["']([^"']*)["']([^>]*)>/i, (match, before, className, after) => {
    const classes = className.split(/\s+/).filter(Boolean).filter((name) => name !== 'container');
    return `<main${before}class="${classes.join(' ')}"${after}>`;
  });
}

function addInteractionScript(html) {
  if (html.includes(SCRIPT_SRC)) return html;
  return html.replace(/<\/body>/i, `<script src="${SCRIPT_SRC}" defer></script></body>`);
}

export async function applyFintechUi(distDir) {
  const indexPath = join(distDir, 'index.html');
  const stylesPath = join(distDir, 'assets', 'styles.css');

  let html = await readFile(indexPath, 'utf8');
  let styles = await readFile(stylesPath, 'utf8');
  const fintechCss = await readFile(new URL('../src/fintech-ui.css', import.meta.url), 'utf8');

  for (const required of ['class="calculator-layout', 'id="payroll-results-shell"', 'class="result-hierarchy"', 'id="input-salary"']) {
    if (!html.includes(required)) throw new Error(`Enterprise fintech UI uygulanamadı: ${required} bulunamadı.`);
  }
  if (!fintechCss.includes(CSS_MARKER)) throw new Error('Enterprise fintech UI CSS v2 marker eksik.');
  if (DATA_2026.year !== 2026) throw new Error('Enterprise hero 2026 veri setiyle senkron değil.');

  html = replaceHomeHero(html);
  html = markBody(html);
  html = normalizeMainWidthOwnership(html);
  html = addInteractionScript(html);

  if (!styles.includes(CSS_MARKER)) styles += `\n${fintechCss}\n`;

  await writeFile(indexPath, html);
  await writeFile(stylesPath, styles);

  console.log('Enterprise fintech UI v2 uygulandı: hero + trust + live output + native main width ownership.');
}
