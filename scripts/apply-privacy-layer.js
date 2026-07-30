import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const CONSENT_ASSET = '/assets/consent-manager.js';
const CONSENT_STYLES = '/assets/consent-manager.css';
const GA_ID = 'G-988BB5B64E';
const AD_CLIENT = 'ca-pub-8614552230353945';

async function walkHtml(directory, output = []) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await walkHtml(path, output);
    else if (entry.name.endsWith('.html')) output.push(path);
  }
  return output;
}

function attributeValue(attributes, name) {
  const match = attributes.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'));
  return match?.[2] || '';
}

function transformScripts(html) {
  return html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (full, attributes, body) => {
    const type = attributeValue(attributes, 'type').toLowerCase();
    if (type === 'application/ld+json') return full;

    const src = attributeValue(attributes, 'src');
    if (/googletagmanager\.com\/(?:gtag\/js|gtm\.js)|google-analytics\.com/i.test(src)) return '';
    if (/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js/i.test(src)) return '';
    if (/\bgtag\s*\(|GoogleAnalyticsObject|googletagmanager\.com|google-analytics\.com/i.test(body)) return '';
    if (/adsbygoogle/i.test(body)) return '';
    return full;
  });
}

function injectPrivacyBootstrap(html) {
  if (html.includes(CONSENT_ASSET)) return html;
  const bootstrap = `<script>window.adsbygoogle=window.adsbygoogle||[];window.adsbygoogle.pauseAdRequests=1;window.adsbygoogle.requestNonPersonalizedAds=1;</script><script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${AD_CLIENT}" crossorigin="anonymous" data-privacy-treatments="disablePersonalization" data-consent-managed="adsense"></script><script src="${CONSENT_ASSET}" data-ga-id="${GA_ID}" data-ad-client="${AD_CLIENT}"></script><link rel="stylesheet" href="${CONSENT_STYLES}">`;
  if (/<head[^>]*>/i.test(html)) return html.replace(/<head([^>]*)>/i, `<head$1>${bootstrap}`);
  return `${bootstrap}${html}`;
}

export function applyPrivacyToHtml(html) {
  let output = transformScripts(html);
  output = output.replace(/<noscript\b[^>]*>[\s\S]*?googletagmanager\.com[\s\S]*?<\/noscript>/gi, '');
  output = injectPrivacyBootstrap(output);
  return output;
}

export async function applyPrivacyLayer(dist) {
  const files = await walkHtml(dist);
  for (const path of files) {
    const html = await readFile(path, 'utf8');
    await writeFile(path, applyPrivacyToHtml(html));
  }
  console.log(`rıza ve reklam isteği kontrolü uygulandı: ${files.length} sayfa`);
}
