import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const dist = join(process.cwd(), 'dist');
const primary = [
  '2026-maas-vergi-dilimleri',
  'netten-brute-maas-neden-aylik-degisir',
  '100000-tl-brut-maas-neti-2026',
  'prim-ikramiye-net-maasi-neden-dusurur',
  'is-teklifinin-yillik-degeri'
];
const secondary = [
  '2026-sgk-tavani',
  'is-degisikliginde-vergi-matrahi',
  '2026-yemek-karti-istisnasi'
];
const failures = [];

for (const slug of primary) {
  const html = await readFile(join(dist, 'blog', slug, 'index.html'), 'utf8');
  if (!html.includes('maasim-original-data')) failures.push(`${slug}: özgün veri bloğu yok`);
  if (!html.includes('/hesaplama-metodolojisi/')) failures.push(`${slug}: metodoloji bağlantısı yok`);
}

for (const slug of secondary) {
  const html = await readFile(join(dist, 'blog', slug, 'index.html'), 'utf8');
  if (!html.includes('maasim-original-data-secondary')) failures.push(`${slug}: ikinci özgün veri bloğu yok`);
  if (!html.includes('/hesaplama-metodolojisi/')) failures.push(`${slug}: metodoloji bağlantısı yok`);
}

const sgk = await readFile(join(dist, 'blog', '2026-sgk-tavani', 'index.html'), 'utf8');
for (const token of ['297.270 TL', 'SGK matrahı', 'Çalışan SGK + işsizlik']) {
  if (!sgk.includes(token)) failures.push(`2026-sgk-tavani: ${token} eksik`);
}

const jobChange = await readFile(join(dist, 'blog', 'is-degisikliginde-vergi-matrahi', 'index.html'), 'utf8');
for (const token of ['400.000 TL', '5.300.000 TL', 'Bu tablo kişisel vergi beyannamesi hesabı değildir']) {
  if (!jobChange.includes(token)) failures.push(`is-degisikliginde-vergi-matrahi: ${token} eksik`);
}

const meal = await readFile(join(dist, 'blog', '2026-yemek-karti-istisnasi', 'index.html'), 'utf8');
for (const token of ['300 TL', '158 TL', '22 gün', 'GV aylık karşılığı']) {
  if (!meal.includes(token)) failures.push(`2026-yemek-karti-istisnasi: ${token} eksik`);
}

if (failures.length) {
  console.error('Özgün blog veri doğrulaması başarısız:\n- ' + failures.join('\n- '));
  process.exit(1);
}

console.log(`Özgün blog veri doğrulaması başarılı: ${primary.length + secondary.length} yüksek değerli içerik.`);
