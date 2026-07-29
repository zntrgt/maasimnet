import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const replacements = [
  {
    from: '<p class="notice">Bu sayfada 25 görünür soru bulunur; ana sayfada yalnız en sık sorulan 6 soru gösterilir. Bu sayfaya 25 soruluk FAQPage schema eklenmez.</p>',
    to: ''
  },
  {
    from: '<p class="notice">Bu merkezdeki sayısal değerler hesaplayıcı, tablolar ve Dataset schema tarafından aynı DATA_2026 nesnesinden okunur.</p>',
    to: '<p class="notice">Aşağıdaki tutarlar 2026 yılı için geçerli resmî ücret, vergi ve sosyal güvenlik verilerinden derlenmiştir.</p>'
  },
  {
    from: '<h2>Yıllandırma politikası</h2><p>Bu sayfa yalnız 2026 dönemini belgeler. Yeni yıl verileri ayrı URL’de yayımlanır; eski yıl sayfaları yeni yıla yönlendirilmez.</p>',
    to: ''
  }
];

const forbiddenVisiblePhrases = [
  'FAQPage schema',
  'Dataset schema',
  'DATA_2026',
  '25 görünür soru',
  'ana sayfada yalnız en sık sorulan 6 soru',
  'Yıllandırma politikası',
  'eski yıl sayfaları yeni yıla yönlendirilmez',
  'production artifact',
  'indexability report',
  'Hesaplama motoru',
  'central-kurus-engine',
  'p0-information-architecture'
];

function removeTechnicalMetadata(html) {
  return html.replace(
    /<div[^>]*>\s*<dt[^>]*>\s*(?:Hesaplama motoru|Sürüm)\s*<\/dt>[\s\S]*?<\/div>/gi,
    ''
  );
}

function visibleText(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function walk(dir, output = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await walk(path, output);
    else if (entry.name.endsWith('.html')) output.push(path);
  }
  return output;
}

export async function removeInternalCopy(dist) {
  const files = await walk(dist);
  for (const path of files) {
    let html = await readFile(path, 'utf8');
    for (const { from, to } of replacements) html = html.replaceAll(from, to);
    html = removeTechnicalMetadata(html);
    const text = visibleText(html);
    for (const phrase of forbiddenVisiblePhrases) {
      if (text.toLocaleLowerCase('tr-TR').includes(phrase.toLocaleLowerCase('tr-TR'))) {
        throw new Error(`Kullanıcıya açık iç uygulama notu bulundu: ${phrase} (${path})`);
      }
    }
    await writeFile(path, html);
  }
  console.log(`kullanıcıya açık iç uygulama notları temizlendi: ${files.length} sayfa`);
}
