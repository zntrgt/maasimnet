import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const CONSENT_ASSET = '/assets/consent-manager.js';
const CONSENT_STYLES = '/assets/consent-manager.css';
const GA_ID = 'G-988BB5B64E';

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

function hasBooleanAttribute(attributes, name) {
  return new RegExp(`(?:^|\\s)${name}(?:\\s|=|$)`, 'i').test(attributes);
}

function escapeAttribute(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function blockMarketingExternalScript(attributes) {
  const src = attributeValue(attributes, 'src');
  const copied = [];
  for (const name of ['crossorigin', 'referrerpolicy', 'data-ad-client', 'data-ad-slot']) {
    const value = attributeValue(attributes, name);
    if (value) copied.push(`data-copy-${name}="${escapeAttribute(value)}"`);
  }
  return `<script type="text/plain" data-consent-category="marketing" data-consent-src="${escapeAttribute(src)}"${hasBooleanAttribute(attributes, 'async') ? ' data-consent-async="true"' : ''}${copied.length ? ` ${copied.join(' ')}` : ''}></script>`;
}

function transformScripts(html) {
  return html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (full, attributes, body) => {
    const type = attributeValue(attributes, 'type').toLowerCase();
    if (type === 'application/ld+json' || attributes.includes('data-consent-category')) return full;

    const src = attributeValue(attributes, 'src');
    if (/googletagmanager\.com\/(?:gtag\/js|gtm\.js)|google-analytics\.com/i.test(src)) {
      return '';
    }
    if (/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js/i.test(src)) {
      return blockMarketingExternalScript(attributes);
    }
    if (/adsbygoogle/i.test(body)) {
      return `<script type="text/plain" data-consent-category="marketing">${body}</script>`;
    }
    if (/\bgtag\s*\(|GoogleAnalyticsObject|googletagmanager\.com|google-analytics\.com/i.test(body)) {
      return '';
    }
    return full;
  });
}

function injectConsentManager(html) {
  if (html.includes(CONSENT_ASSET)) return html;
  const consentScript = `<script src="${CONSENT_ASSET}" data-ga-id="${GA_ID}"></script><link rel="stylesheet" href="${CONSENT_STYLES}">`;
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head([^>]*)>/i, `<head$1>${consentScript}`);
  }
  return `${consentScript}${html}`;
}

export function applyPrivacyToHtml(html) {
  let output = transformScripts(html);
  output = output.replace(/<noscript\b[^>]*>[\s\S]*?googletagmanager\.com[\s\S]*?<\/noscript>/gi, '');
  output = injectConsentManager(output);
  return output;
}

export async function applyPrivacyLayer(dist) {
  const files = await walkHtml(dist);
  for (const path of files) {
    const html = await readFile(path, 'utf8');
    await writeFile(path, applyPrivacyToHtml(html));
  }
  console.log(`rıza öncesi etiket engelleme uygulandı: ${files.length} sayfa`);
}
