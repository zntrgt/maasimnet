import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const VERSION = 'v1';
const ASSET_VERSION = '2';
const SCRIPT_SRC = `/assets/humanized-ux.js?v=${ASSET_VERSION}`;
const HOME_CSS = `/assets/humanized-ux.css?v=${ASSET_VERSION}`;
const TERMINATION_CSS = `/assets/humanized-termination.css?v=${ASSET_VERSION}`;
const TERMINATION_ROUTES = [
  'tazminat-hesaplama',
  'kidem-tazminati-hesaplama',
  'ihbar-tazminati-hesaplama'
];

function markBody(html) {
  return html.replace(/<body([^>]*)>/i, (match, attrs) => {
    if (/\bdata-humanized-ux=["'][^"']*["']/i.test(attrs)) {
      return `<body${attrs.replace(/\bdata-humanized-ux=["'][^"']*["']/i, `data-humanized-ux="${VERSION}"`)}>`;
    }
    return `<body${attrs} data-humanized-ux="${VERSION}">`;
  });
}

function addStylesheet(html, href) {
  if (html.includes(`href="${href}"`) || html.includes(`href='${href}'`)) return html;
  return html.replace(/<\/head>/i, `<link rel="stylesheet" href="${href}"></head>`);
}

function addScript(html) {
  if (html.includes(SCRIPT_SRC)) return html;
  return html.replace(/<\/body>/i, `<script src="${SCRIPT_SRC}" defer></script></body>`);
}

function staticHomeMarkup(html) {
  let output = html;

  output = output.replace(
    /<p\b[^>]*class=["'][^"']*enterprise-hero__eyebrow[^"']*["'][^>]*>[\s\S]*?<\/p>/i,
    '<p class="enterprise-hero__eyebrow">2026 mevzuatına göre güncel ✓</p>'
  );

  output = output.replace(
    /<section\b[^>]*class=["'][^"']*enterprise-trust-strip[^"']*["'][^>]*>[\s\S]*?<\/section>/i,
    `<section class="enterprise-trust-strip" aria-label="Hesaplama güven bilgileri" data-enterprise-trust="v2">
      <article class="enterprise-trust-item"><span class="enterprise-trust-item__icon" aria-hidden="true">✓</span><div><strong>2026 mevzuatı kontrol edildi</strong><span>SGK, GİB ve ÇSGB kaynaklarıyla güncel parametreler.</span></div></article>
    </section>`
  );

  output = output.replace(
    /(<label\b[^>]*id=["']salary-input-label["'][^>]*>)[\s\S]*?(<\/label>)/i,
    '$1Brüt maaşın$2'
  );

  const inputPattern = /<input\b(?=[^>]*\bid=["']input-salary["'])[^>]*>/i;
  if (inputPattern.test(output) && !output.includes('class="human-quick-amounts"')) {
    output = output.replace(inputPattern, (input) => `${input}
      <p class="human-field-feedback" id="human-salary-feedback" aria-live="polite"></p>
      <div class="human-quick-amounts" aria-label="Hızlı maaş tutarları">
        <button type="button" data-human-amount="50000">50 bin</button>
        <button type="button" data-human-amount="75000">75 bin</button>
        <button type="button" data-human-amount="100000">100 bin</button>
        <button type="button" data-human-amount="150000">150 bin</button>
      </div>`);
  }

  output = output.replace(
    /(<button\b[^>]*onclick=["']calculateAndShowPayroll\(\)["'][^>]*>)[\s\S]*?(<\/button>)/i,
    '$1Net maaşımı gör$2'
  );

  if (!output.includes('class="human-empty-state"')) {
    output = output.replace(
      '<article class="metric-hero">',
      `<article class="metric-hero is-human-empty">
        <div class="human-empty-state">
          <span class="human-empty-state__eyebrow">12 aylık maaş görünümün</span>
          <h2>Henüz hesap yapmadın</h2>
          <p>Maaşını gir, 12 aylık netini birlikte görelim.</p>
          <div class="human-empty-state__preview">Ocak → Aralık · Vergi dilimleri · Kesintiler · İşveren maliyeti</div>
        </div>`
    );
  }

  output = output.replace('>Aylık Ort. Net</p>', '>Aylık ortalama net maaşın</p>');
  return output;
}

function terminationCopy(type) {
  if (type === 'severance') return {
    h1: 'Kıdem tazminatını hesapla',
    lead: 'İşe giriş ve ayrılış tarihini, son brüt maaşını yaz. Kıdem tazminatını güncel 2026 tavanıyla görelim.',
    cta: 'Kıdemimi hesapla'
  };
  if (type === 'notice') return {
    h1: 'İhbar tazminatını hesapla',
    lead: 'Çalışma tarihlerini ve son brüt maaşını yaz. İhbar süreni ve tahmini net tazminatını birlikte görelim.',
    cta: 'İhbarımı hesapla'
  };
  return {
    h1: 'Tazminatını hesapla',
    lead: 'İşe giriş ve ayrılış tarihini, son brüt maaşını yaz. Kıdem ve ihbar tutarını birlikte görelim.',
    cta: 'Toplam tazminatımı gör'
  };
}

function staticTerminationMarkup(html) {
  const type = html.match(/data-termination-calculator=["'](combined|severance|notice)["']/i)?.[1] || 'combined';
  const copy = terminationCopy(type);
  let output = html;

  output = output.replace(
    /(<header\b[^>]*class=["'][^"']*termination-hero[^"']*["'][^>]*>[\s\S]*?<h1>)[\s\S]*?(<\/h1>)/i,
    `$1${copy.h1}$2`
  );
  output = output.replace(
    /(<header\b[^>]*class=["'][^"']*termination-hero[^"']*["'][^>]*>[\s\S]*?<\/h1>\s*<p>)[\s\S]*?(<\/p>)/i,
    `$1${copy.lead}$2`
  );
  output = output.replace(
    /(<span\b[^>]*class=["'][^"']*termination-eyebrow[^"']*["'][^>]*>)[\s\S]*?(<\/span>)/i,
    '$12026 mevzuatına göre güncel ✓$2'
  );
  output = output.replace('<details class="termination-options" open>', '<details class="termination-options">');
  output = output.replace(
    /(<button\b[^>]*class=["'][^"']*termination-submit[^"']*["'][^>]*>)[\s\S]*?(<\/button>)/i,
    `$1${copy.cta}$2`
  );
  output = output.replace('>İşe giriş tarihi</label>', '>İşe giriş tarihin</label>');
  output = output.replace('>İşten ayrılma tarihi</label>', '>İşten ayrılış tarihin</label>');
  output = output.replace('>Son aylık brüt ücret</label>', '>Son brüt maaşın</label>');
  output = output.replace(
    '<summary>Düzenli yan haklar ve primler</summary>',
    '<summary><span>Düzenli yan hakların var mı?</span><small>Yemek, yol veya düzenli primin varsa ekle.</small></summary>'
  );
  output = output.replace(
    '<summary>Gelişmiş vergi / bordro bilgileri</summary>',
    '<summary><span>Gelişmiş bordro bilgileri</span><small>Çoğu kullanıcı bu alanları boş bırakabilir.</small></summary>'
  );
  return output;
}

function patchHome(html) {
  let output = markBody(html);
  output = staticHomeMarkup(output);
  output = addStylesheet(output, HOME_CSS);
  output = addScript(output);
  return output;
}

function patchTermination(html) {
  let output = markBody(html);
  output = staticTerminationMarkup(output);
  output = addStylesheet(output, HOME_CSS);
  output = addStylesheet(output, TERMINATION_CSS);
  output = addScript(output);
  return output;
}

export async function applyHumanizedUx(distDir) {
  const homePath = join(distDir, 'index.html');
  let homeHtml = await readFile(homePath, 'utf8');
  homeHtml = patchHome(homeHtml);
  await writeFile(homePath, homeHtml, 'utf8');

  for (const route of TERMINATION_ROUTES) {
    const pagePath = join(distDir, route, 'index.html');
    let html = await readFile(pagePath, 'utf8');
    html = patchTermination(html);
    await writeFile(pagePath, html, 'utf8');
  }

  console.log('Humanized UX v1 uygulandı: kritik copy ve empty state statik HTML + etkileşim katmanı.');
}
