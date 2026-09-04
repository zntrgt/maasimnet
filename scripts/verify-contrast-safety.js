import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = process.cwd();
const dist = join(root,'dist');
const marker = 'data-contrast-guard="v1"';

async function walkHtml(dir) {
  const out = [];
  async function walk(current) {
    for (const entry of await readdir(current,{withFileTypes:true})) {
      const path = join(current,entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (entry.name.endsWith('.html')) out.push(path);
    }
  }
  await walk(dir);
  return out;
}

function normalizeHex(value) {
  const v = String(value || '').trim().toLowerCase();
  if (/^#[0-9a-f]{3}$/.test(v)) return `#${[...v.slice(1)].map((c)=>c+c).join('')}`;
  return /^#[0-9a-f]{6}$/.test(v) ? v : null;
}

for (const file of await walkHtml(dist)) {
  const html = await readFile(file,'utf8');
  if (!html.includes(marker)) throw new Error(`Kontrast guard eksik: ${relative(dist,file)}`);
  for (const style of html.matchAll(/style=["']([^"']+)["']/gi)) {
    const css = style[1];
    const fg = normalizeHex(css.match(/(?:^|;)\s*color\s*:\s*(#[0-9a-f]{3,6})/i)?.[1]);
    const bg = normalizeHex(css.match(/(?:^|;)\s*background(?:-color)?\s*:\s*(#[0-9a-f]{3,6})/i)?.[1]);
    if (fg && bg && fg === bg) throw new Error(`Aynı foreground/background rengi bulundu (${fg}): ${relative(dist,file)}`);
  }
}

const home = await readFile(join(dist,'index.html'),'utf8');
for (const token of [
  'id="sozluk"',
  'Maaş Terimleri Sözlüğü',
  '.text-white{color:#fff!important}',
  '#sozluk.bg-slate-900 h2{color:#fff!important}',
  '.text-slate-300{color:#cbd5e1!important}',
  '.text-slate-950{color:#020617!important}'
]) if (!home.includes(token)) throw new Error(`Ana sayfa sözlük/kontrast koruması eksik: ${token}`);

console.log('Kontrast güvenliği doğrulandı: sitewide guard + Maaş Terimleri Sözlüğü + inline same-color taraması.');
