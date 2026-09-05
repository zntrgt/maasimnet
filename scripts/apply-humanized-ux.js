import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const VERSION = 'v1';
const ASSET_VERSION = '5';
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

function patchHumanizedRuntime(js) {
  let output = js;

  output = output.replace(
    "const MOBILE_QUERY = '(max-width: 700px)';",
    "const MOBILE_QUERY = '(max-width: 700px)';\nlet homeResultCommitted = false;"
  );

  const usableResultPattern = /function hasUsableHomeResult\(\) \{[\s\S]*?\n\}/;
  if (!usableResultPattern.test(output)) {
    throw new Error('Humanized runtime usable result bloğu bulunamadı.');
  }
  output = output.replace(usableResultPattern, `function hasUsableHomeResult() {
  const inputValue = currentSalaryValue();
  const netValue = parseCurrency(qs('#stat-avg-net')?.textContent);
  return homeResultCommitted && inputValue > 0 && netValue > 0;
}`);

  const primaryPattern = /function configurePrimaryAction\(\) \{[\s\S]*?\n\}\n\nfunction ensureMobileCta/;
  if (!primaryPattern.test(output)) {
    throw new Error('Humanized runtime primary action bloğu bulunamadı.');
  }
  output = output.replace(primaryPattern, `function configurePrimaryAction() {
  const primary = qs('.cta-button--calculate');
  if (!primary || primary.dataset.humanAction === HUMANIZED_UX_VERSION) return;
  primary.dataset.humanAction = HUMANIZED_UX_VERSION;
  primary.addEventListener('click', (event) => {
    if (!validateSalary()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    if (window.matchMedia(MOBILE_QUERY).matches) qs('#input-salary')?.blur();
    window.setTimeout(() => {
      homeResultCommitted = true;
      refreshHomeState();
    }, 0);
  }, { capture: true });
}

function ensureMobileCta`);

  const mobilePattern = /function setupHomeMobileCta\(\) \{[\s\S]*?\n\}\n\nfunction refreshHomeState/;
  if (!mobilePattern.test(output)) {
    throw new Error('Humanized runtime mobil CTA bloğu bulunamadı.');
  }
  output = output.replace(mobilePattern, `function setupHomeMobileCta() {
  const sticky = ensureMobileCta({ label: salaryModeCopy().cta });
  const button = qs('[data-human-home-cta]', sticky);
  if (!button || button.dataset.bound === 'true') return;
  button.dataset.bound = 'true';
  button.addEventListener('click', () => {
    if (!validateSalary()) return;
    qs('#input-salary')?.blur();
    if (typeof window.calculateAndShowPayroll === 'function') {
      window.calculateAndShowPayroll();
      homeResultCommitted = true;
      refreshHomeState();
      return;
    }
    qs('.cta-button--calculate')?.click();
  });
}

function refreshHomeState`);

  const refreshPattern = /function refreshHomeState\(\) \{[\s\S]*?\n\}\n\nfunction initializeHomeUx/;
  if (!refreshPattern.test(output)) {
    throw new Error('Humanized runtime home state bloğu bulunamadı.');
  }
  output = output.replace(refreshPattern, `function refreshHomeState() {
  if (!qs('#hesaplayici')) return;
  const valid = hasUsableHomeResult();
  const hero = qs('.metric-hero');
  const empty = hero ? qs('.human-empty-state', hero) : null;
  hero?.classList.toggle('is-human-empty', !valid);
  hero?.classList.toggle('has-human-result', valid);
  if (empty) {
    empty.hidden = valid;
    empty.setAttribute('aria-hidden', String(valid));
  }
  document.body.classList.toggle('human-has-result', valid);
  setSalaryModeCopy();
  setResultCopy();
  updateExportState();
  updateTaxInsight();
}

function initializeHomeUx`);

  const inputListenerPattern = /  const input = qs\('#input-salary'\);\n  input\?\.addEventListener\('input', \(\) => \{\n    if \(currentSalaryValue\(\) > 0\) clearSalaryError\(\);\n    refreshHomeState\(\);\n  \}\);/;
  if (!inputListenerPattern.test(output)) {
    throw new Error('Humanized runtime input state bloğu bulunamadı.');
  }
  output = output.replace(inputListenerPattern, `  const input = qs('#input-salary');
  input?.addEventListener('input', () => {
    if (currentSalaryValue() > 0) clearSalaryError();
    else homeResultCommitted = false;
    refreshHomeState();
  });`);

  const observerPattern = /  const payrollBody = qs\('#payroll-body'\);\n  if \(payrollBody\) \{\n    new MutationObserver\(\(\) => \{\n      humanizeSalaryJourney\(\);\n      refreshHomeState\(\);\n    \}\)\.observe\(payrollBody, \{ childList: true, subtree: true, characterData: true \}\);\n  \}\n\n  refreshHomeState\(\);/;
  if (!observerPattern.test(output)) {
    throw new Error('Humanized runtime payroll observer bloğu bulunamadı.');
  }
  output = output.replace(observerPattern, `  const payrollBody = qs('#payroll-body');
  if (payrollBody) {
    new MutationObserver(() => {
      humanizeSalaryJourney();
      refreshHomeState();
    }).observe(payrollBody, { childList: true, subtree: true, characterData: true });
  }

  const resultValue = qs('#stat-avg-net');
  if (resultValue) {
    new MutationObserver(() => refreshHomeState())
      .observe(resultValue, { childList: true, subtree: true, characterData: true });
  }

  refreshHomeState();`);

  if (output.includes("primary.removeAttribute('onclick')")) {
    throw new Error('Humanized runtime ana hesaplama onclick davranışını hâlâ siliyor.');
  }
  for (const token of [
    "let homeResultCommitted = false;",
    'return homeResultCommitted && inputValue > 0 && netValue > 0;',
    'homeResultCommitted = true;',
    'empty.hidden = valid;',
    "const resultValue = qs('#stat-avg-net');"
  ]) {
    if (!output.includes(token)) throw new Error(`Humanized runtime deterministik sonuç state işareti eksik: ${token}`);
  }

  return output;
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
  if (inputPattern.test(output) && !output.includes('id="human-salary-feedback"')) {
    output = output.replace(inputPattern, (input) => `${input}
      <p class="human-field-feedback" id="human-salary-feedback" aria-live="polite"></p>`);
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
  const runtimePath = join(distDir, 'assets', 'humanized-ux.js');
  let runtimeJs = await readFile(runtimePath, 'utf8');
  runtimeJs = patchHumanizedRuntime(runtimeJs);
  await writeFile(runtimePath, runtimeJs, 'utf8');

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

  console.log('Humanized UX v1 uygulandı: gerçek hesaplama aksiyonu sonuç stateini deterministik olarak açıyor.');
}