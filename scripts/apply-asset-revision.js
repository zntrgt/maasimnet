import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

async function collectFiles(dir, predicate) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await collectFiles(path, predicate));
    else if (entry.isFile() && predicate(entry.name, path)) files.push(path);
  }
  return files;
}

function revisionToken() {
  const sha = String(process.env.GITHUB_SHA || '').trim();
  if (sha) return sha.slice(0, 12);
  return Date.now().toString(36);
}

function addRevision(url, token) {
  const [path, query = ''] = url.split('?');
  const params = new URLSearchParams(query);
  params.set('rev', token);
  return `${path}?${params.toString()}`;
}

function reviseHtmlAssetUrl(url, token) {
  return url.startsWith('/assets/') ? addRevision(url, token) : url;
}

function reviseModuleSpecifier(specifier, token) {
  if (!specifier.startsWith('./') && !specifier.startsWith('../')) return specifier;
  if (!/\.(?:js|mjs)(?:\?|$)/i.test(specifier)) return specifier;
  return addRevision(specifier, token);
}

export async function applyAssetRevision(distDir) {
  const token = revisionToken();
  const pages = await collectFiles(distDir, (name) => name.endsWith('.html'));
  const modules = await collectFiles(join(distDir, 'assets'), (name) => /\.(?:js|mjs)$/i.test(name));

  for (const page of pages) {
    let html = await readFile(page, 'utf8');
    html = html.replace(/\b(src|href)=(["'])(\/assets\/[^"']+\.(?:js|mjs|css)(?:\?[^"']*)?)\2/gi,
      (match, attr, quote, url) => `${attr}=${quote}${reviseHtmlAssetUrl(url, token)}${quote}`);
    await writeFile(page, html, 'utf8');
  }

  for (const modulePath of modules) {
    let source = await readFile(modulePath, 'utf8');
    source = source.replace(/(\bfrom\s*|\bimport\s*)(["'])(\.\.?\/[^"']+\.(?:js|mjs)(?:\?[^"']*)?)\2/g,
      (match, prefix, quote, specifier) => `${prefix}${quote}${reviseModuleSpecifier(specifier, token)}${quote}`);
    source = source.replace(/(\bimport\s*\(\s*)(["'])(\.\.?\/[^"']+\.(?:js|mjs)(?:\?[^"']*)?)\2(\s*\))/g,
      (match, prefix, quote, specifier, suffix) => `${prefix}${quote}${reviseModuleSpecifier(specifier, token)}${quote}${suffix}`);
    await writeFile(modulePath, source, 'utf8');
  }

  console.log(`Frontend asset revision uygulandı: ${token} (${pages.length} HTML, ${modules.length} JS modülü)`);
  return token;
}
