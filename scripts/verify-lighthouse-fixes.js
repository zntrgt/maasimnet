import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, 'dist');
const indexHtml = await readFile(join(dist, 'index.html'), 'utf8');
const llms = await readFile(join(dist, 'llms.txt'), 'utf8');

const headStart = indexHtml.indexOf('<head');
const charset = indexHtml.indexOf('<meta charset="utf-8">');
if (headStart < 0 || charset < headStart || charset > 1024) {
  throw new Error('UTF-8 charset HTML ilk 1024 baytı içinde değil.');
}
if (!/id=["']check-retired["'][^>]*aria-label=["']Emekli çalışan["']/i.test(indexHtml)) {
  throw new Error('Emekli çalışan kontrolünün erişilebilir adı eksik.');
}
if (!/id=["']select-disability["'][^>]*aria-label=["']Engellilik derecesi["']/i.test(indexHtml)) {
  throw new Error('Engellilik derecesi seçiminin erişilebilir adı eksik.');
}
if (/\bid=["']stat-avg-net["'][^>]*>/.test(indexHtml.match(/<h[1-6][^>]*\bid=["']stat-avg-net["'][^>]*>/i)?.[0] || '')) {
  throw new Error('Metrik değeri başlık etiketi olarak kalmış.');
}
if (!llms.startsWith('# Maaşım.net') || !llms.includes('https://maasim.net/') || !llms.includes('https://maasim.net/blog/')) {
  throw new Error('llms.txt başlık veya temel bağlantıları içermiyor.');
}

console.log('Lighthouse regresyon kontrolleri başarılı.');
