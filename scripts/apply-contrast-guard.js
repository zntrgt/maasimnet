import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const MARKER = 'data-contrast-guard="v1"';
const STYLE = `<style ${MARKER}>.text-white{color:#fff!important}.text-slate-100{color:#f1f5f9!important}.text-slate-200{color:#e2e8f0!important}.text-slate-300{color:#cbd5e1!important}.text-slate-400{color:#94a3b8!important}.text-slate-950{color:#020617!important}.text-teal-300{color:#5eead4!important}.text-teal-400{color:#2dd4bf!important}.bg-slate-900.text-white>h1,.bg-slate-900.text-white>h2,.bg-slate-900.text-white>h3,.bg-slate-900.text-white>h4,.bg-slate-950.text-white>h1,.bg-slate-950.text-white>h2,.bg-slate-950.text-white>h3,.bg-slate-950.text-white>h4{color:#fff!important}#sozluk.bg-slate-900 h2{color:#fff!important}</style>`;

async function htmlFiles(root) {
  const out = [];
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (entry.name.endsWith('.html')) out.push(path);
    }
  }
  await walk(root);
  return out;
}

export async function applyContrastGuard(dist) {
  let changed = 0;
  for (const file of await htmlFiles(dist)) {
    let html = await readFile(file, 'utf8');
    if (html.includes(MARKER)) continue;
    if (!/<\/head>/i.test(html)) throw new Error(`Kontrast guard uygulanamadı, </head> yok: ${file}`);
    html = html.replace(/<\/head>/i, `${STYLE}</head>`);
    await writeFile(file, html, 'utf8');
    changed += 1;
  }
  console.log(`Kontrast guard uygulandı: ${changed} sayfa.`);
  return Object.freeze({ changed });
}
