import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const GA_MEASUREMENT_ID = 'G-988BB5B64E';
const ADSENSE_CLIENT = 'ca-pub-8614552230353945';
const CONSENT_MODE_MARKER = 'data-maasim-consent-mode';
const GOOGLE_TAG_MARKER = 'data-maasim-google-tag';
const CALCULATOR_ANALYTICS_MARKER = 'data-maasim-calculator-analytics';

const googleTagLoader = `<script data-cookieconsent="ignore" ${GOOGLE_TAG_MARKER}>
(() => {
  const measurementId = '${GA_MEASUREMENT_ID}';
  const adsenseClient = '${ADSENSE_CLIENT}';
  let analyticsLoaded = false;
  let adsLoaded = false;

  const loadExternalScript = (id, src, attributes = {}) => {
    if (document.getElementById(id)) return document.getElementById(id);
    const script = document.createElement('script');
    script.id = id;
    script.async = true;
    script.src = src;
    Object.entries(attributes).forEach(([name, value]) => script.setAttribute(name, value));
    document.head.appendChild(script);
    return script;
  };

  const enableAnalytics = () => {
    if (analyticsLoaded || window.Cookiebot?.consent?.statistics !== true) return;
    analyticsLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
    window.gtag('consent', 'update', { analytics_storage: 'granted' });
    window.gtag('js', new Date());
    window.gtag('config', measurementId, { send_page_view: true });
    loadExternalScript('maasim-ga4-script', 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(measurementId));
  };

  const enableAds = () => {
    if (adsLoaded || window.Cookiebot?.consent?.marketing !== true) return;
    adsLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
    window.gtag('consent', 'update', {
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted'
    });
    loadExternalScript(
      'maasim-adsense-script',
      'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(adsenseClient),
      { crossorigin: 'anonymous' }
    );
  };

  const applyConsent = () => {
    enableAnalytics();
    enableAds();
  };

  const enforceRevocation = () => {
    const statisticsDenied = window.Cookiebot?.consent?.statistics !== true;
    const marketingDenied = window.Cookiebot?.consent?.marketing !== true;
    if ((analyticsLoaded && statisticsDenied) || (adsLoaded && marketingDenied)) {
      window.location.reload();
    }
  };

  window.addEventListener('CookiebotOnConsentReady', applyConsent);
  window.addEventListener('CookiebotOnAccept', applyConsent);
  window.addEventListener('CookiebotOnDecline', enforceRevocation);
  applyConsent();
})();
</script>`;

const calculatorAnalyticsScript = `<script type="module" src="/assets/calculator-analytics.js" ${CALCULATOR_ANALYTICS_MARKER}></script>`;

async function walkHtml(dir, output = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await walkHtml(path, output);
    else if (entry.name.endsWith('.html')) output.push(path);
  }
  return output;
}

function stripExistingGoogleTags(html) {
  const gaExternal = new RegExp(`<script\\b(?=[^>]*${GA_MEASUREMENT_ID})[^>]*><\\/script>\\s*`, 'gi');
  const gaInline = new RegExp(`<script\\b[^>]*>(?:(?!<\\/script>)[\\s\\S])*?${GA_MEASUREMENT_ID}(?:(?!<\\/script>)[\\s\\S])*?<\\/script>\\s*`, 'gi');
  const adsense = new RegExp(`<script\\b(?=[^>]*adsbygoogle\\.js\\?client=${ADSENSE_CLIENT})[^>]*><\\/script>\\s*`, 'gi');
  const markedLoader = new RegExp(`<script\\b[^>]*${GOOGLE_TAG_MARKER}[^>]*>[\\s\\S]*?<\\/script>\\s*`, 'gi');
  return html.replace(markedLoader, '').replace(gaExternal, '').replace(gaInline, '').replace(adsense, '');
}

function injectGoogleTags(html) {
  const cleaned = stripExistingGoogleTags(html);
  const consentModeBlock = new RegExp(`<script\\b[^>]*${CONSENT_MODE_MARKER}[^>]*>[\\s\\S]*?<\\/script>`, 'i');
  if (!consentModeBlock.test(cleaned)) throw new Error('Consent Mode bloğu bulunamadı; Google etiketleri güvenli sırada eklenemedi.');
  return cleaned.replace(consentModeBlock, (block) => `${block}${googleTagLoader}`);
}

function injectCalculatorAnalytics(html) {
  if (!html.includes('id="input-salary"') || html.includes(CALCULATOR_ANALYTICS_MARKER)) return html;
  return html.replace(/<\/body>/i, `${calculatorAnalyticsScript}</body>`);
}

export async function applyGoogleTags(dist) {
  const files = await walkHtml(dist);
  for (const path of files) {
    let html = await readFile(path, 'utf8');
    html = injectGoogleTags(html);
    html = injectCalculatorAnalytics(html);
    await writeFile(path, html);
  }
  console.log(`GA4 ve AdSense Basic Consent Mode ile uygulandı: ${files.length} sayfa`);
}
