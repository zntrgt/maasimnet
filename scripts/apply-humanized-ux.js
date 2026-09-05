import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const VERSION = 'v1';
const SCRIPT_SRC = '/assets/humanized-ux.js';
const HOME_CSS = '/assets/humanized-ux.css';
const TERMINATION_CSS = '/assets/humanized-termination.css';
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

function patchHome(html) {
  let output = markBody(html);
  output = addStylesheet(output, HOME_CSS);
  output = addScript(output);
  return output;
}

function patchTermination(html) {
  let output = markBody(html);
  output = output.replace('<details class="termination-options" open>', '<details class="termination-options">');
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

  console.log('Humanized UX v1 uygulandı: ana maaş hesaplayıcı + kıdem/ihbar akışları.');
}
