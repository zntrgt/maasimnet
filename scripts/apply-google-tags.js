import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const GA_MEASUREMENT_ID = 'G-988BB5B64E';
const ADSENSE_CLIENT = 'ca-pub-8614552230353945';
const CONSENT_MODE_MARKER = 'data-maasim-consent-mode';
const GOOGLE_TAG_MARKER = 'data-maasim-google-tag';
const ADSENSE_AUTO_MARKER = 'data-maasim-adsense-auto';
const CALCULATOR_ANALYTICS_MARKER = 'data-maasim-calculator-analytics';

const googleTagScripts = `<script async src="https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}" ${GOOGLE_TAG_MARKER}></script>
<script ${GOOGLE_TAG_MARKER}>
window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: true });
</script>`;

const adsenseAutoAdsScript = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}" crossorigin="anonymous" ${ADSENSE_AUTO_MARKER}></script>`;
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
  return html.replace(gaExternal, '').replace(gaInline, '').replace(adsense, '');
}

function injectGoogleTags(html) {
  const cleaned = stripExistingGoogleTags(html);
  const consentModeBlock = new RegExp(`<script\\b[^>]*${CONSENT_MODE_MARKER}[^>]*>[\\s\\S]*?<\\/script>`, 'i');
  if (!consentModeBlock.test(cleaned)) throw new Error('Consent Mode bloğu bulunamadı; Google etiketleri güvenli sırada eklenemedi.');
  return cleaned.replace(consentModeBlock, (block) => `${block}${googleTagScripts}${adsenseAutoAdsScript}`);
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
  console.log(`GA4 ve AdSense Auto Ads merkezi olarak uygulandı: ${files.length} sayfa`);
}
