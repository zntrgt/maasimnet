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
const scenario = await readFile(join(dist, '100000-brut-maas-hesaplama', 'index.html'), 'utf8');
const monthlyRows = scenario.match(/<tbody>([\s\S]*?)<\/tbody>/)?.[1] || '';
if ((monthlyRows.match(/<tr>/g) || []).length !== 12) failures.push('100.000 TL senaryosu: 12 aylık tablo eksik');
for (const value of ['75.953,03 TL', '69.490,14 TL', '833.881,63 TL', '%15 → %20']) {
  if (!scenario.includes(value)) failures.push(`100.000 TL senaryosu: benchmark ${value} eksik`);
}
const offerGuide = await readFile(join(dist, 'blog', '100000-tl-brut-maas-neti-2026', 'index.html'), 'utf8');
if (!offerGuide.includes('100.000 TL Brüt Maaş Teklifi Nasıl Değerlendirilir?')) failures.push('100.000 TL rehberi: teklif niyeti başlıkta yok');
if (offerGuide.indexOf('class="maasim-original-data"') > offerGuide.indexOf('class="facts"')) failures.push('100.000 TL rehberi: özgün cevap üstte değil');
if (!offerGuide.includes('77.554,73 TL')) failures.push('100.000 TL rehberi: Ocak yıllıklaştırma farkı hatalı');

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
