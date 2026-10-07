import { access, readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import worker from '../src/worker.js';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const years = [2020, 2021, 2022, 2023, 2024, 2025];

for (const year of years) {
  for (const pathname of [`/brutten-nete-${year}`, `/brutten-nete-${year}/`]) {
    const response = await worker.fetch(new Request(`https://maasim.net${pathname}`), {
      ASSETS: { fetch: async () => new Response('not found', { status: 404 }) }
    });
    const expected = `https://maasim.net/${year}-maas-hesaplama/`;
    if (response.status !== 301 || response.headers.get('location') !== expected) {
      throw new Error(`${pathname} 301 hedefi hatalı: ${response.status} ${response.headers.get('location')}`);
    }
  }

  try {
    await access(join(dist, `brutten-nete-${year}`));
    throw new Error(`Eski brütten nete çıktısı dist içinde kaldı: ${year}`);
  } catch (error) {
    if (error.message.startsWith('Eski brütten nete')) throw error;
  }

  const targetHtml = await readFile(join(dist, `${year}-maas-hesaplama`, 'index.html'), 'utf8');
  if (!targetHtml.includes(`<title>${year} Maaş Hesaplama | Brütten Nete`)) {
    throw new Error(`${year} hedef sayfa başlığı hatalı`);
  }
}

const sitemap = await readFile(join(dist, 'sitemap.xml'), 'utf8');
for (const year of years) {
  if (sitemap.includes(`https://maasim.net/brutten-nete-${year}/`)) {
    throw new Error(`Eski brütten nete URL'si sitemap içinde: ${year}`);
  }
  if (!sitemap.includes(`<loc>https://maasim.net/${year}-maas-hesaplama/</loc>`)) {
    throw new Error(`Hedef maaş URL'si sitemap'te yok: ${year}`);
  }
}

async function verifyHtmlFiles(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await verifyHtmlFiles(path);
    else if (entry.isFile() && entry.name.endsWith('.html')) {
      const html = await readFile(path, 'utf8');
      if (/href=["']\/brutten-nete-202[0-5]\/?["']/i.test(html)) {
        throw new Error(`HTML eski yıl rehberine link veriyor: ${path}`);
      }
    }
  }
}
await verifyHtmlFiles(dist);

console.log('2020–2025 brütten nete eski URL yönlendirmeleri, canonical hedefler ve sitemap doğrulandı.');
