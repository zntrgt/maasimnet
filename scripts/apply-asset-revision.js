import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

async function htmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await htmlFiles(path));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(path);
  }
  return files;
}

function revisionToken() {
  const sha = String(process.env.GITHUB_SHA || '').trim();
  if (sha) return sha.slice(0, 12);
  return Date.now().toString(36);
}

function reviseAssetUrl(url, token) {
  if (!url.startsWith('/assets/')) return url;
  const [path, query = ''] = url.split('?');
  const params = new URLSearchParams(query);
  params.set('rev', token);
  return `${path}?${params.toString()}`;
}

export async function applyAssetRevision(distDir) {
  const token = revisionToken();
  const pages = await htmlFiles(distDir);

  for (const page of pages) {
    let html = await readFile(page, 'utf8');
    html = html.replace(/\b(src|href)=(["'])(\/assets\/[^"']+\.(?:js|mjs|css)(?:\?[^"']*)?)\2/gi,
      (match, attr, quote, url) => `${attr}=${quote}${reviseAssetUrl(url, token)}${quote}`);
    await writeFile(page, html, 'utf8');
  }

  console.log(`Frontend asset revision uygulandı: ${token} (${pages.length} HTML)`);
  return token;
}
