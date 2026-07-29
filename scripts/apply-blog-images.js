import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

const replacements = [
  ['https://maasim.net/assets/is-yerinde-finansal-saglik.svg', 'https://maasim.net/assets/is-yerinde-finansal-saglik.webp'],
  ['/assets/is-yerinde-finansal-saglik.svg', '/assets/is-yerinde-finansal-saglik.webp'],
  ['https://maasim.net/assets/2027-maas-zammi-veri-ozeti.svg', 'https://maasim.net/assets/2027-maas-zammi-beklentileri.webp'],
  ['/assets/2027-maas-zammi-veri-ozeti.svg', '/assets/2027-maas-zammi-beklentileri.webp'],
  ['alt="İş yerinde finansal sağlığın ücret, kısa vadeli dayanıklılık, borç yönetimi ve uzun vadeli birikim olarak dört kademesi"', 'alt="Modern bir ofiste finansal planlama üzerine çalışan Türk profesyoneller"'],
  ['alt="Haziran 2026 yıllık TÜFE yüzde 32,11, TCMB 2027 tahmini yüzde 15 ve Temmuz 2026 piyasa beklentisi yüzde 21,47 karşılaştırması"', 'alt="Modern bir ofiste maaş ve zam verilerini inceleyen Türk profesyoneller"'],
  ['alt="2027 maaş beklentileri için enflasyon gerçekleşmesi, TCMB tahmini ve piyasa beklentisi"', 'alt="Maaş ve zam beklentilerini değerlendiren Türk profesyoneller"']
];

async function decodeAsset(sourceName, outputPath) {
  const encoded = (await readFile(join(root, 'assets-source', sourceName), 'utf8')).trim();
  await writeFile(outputPath, Buffer.from(encoded, 'base64'));
}

async function patchHtml(path) {
  let html = await readFile(path, 'utf8');
  for (const [from, to] of replacements) html = html.replaceAll(from, to);
  await writeFile(path, html);
}

export async function applyBlogImages(dist) {
  await decodeAsset('financial-health.webp.b64', join(dist, 'assets', 'is-yerinde-finansal-saglik.webp'));
  await decodeAsset('salary-outlook.webp.b64', join(dist, 'assets', '2027-maas-zammi-beklentileri.webp'));

  await patchHtml(join(dist, 'blog', 'index.html'));
  await patchHtml(join(dist, 'blog', 'is-yerinde-finansal-saglik', 'index.html'));
  await patchHtml(join(dist, 'blog', '2027-maas-zammi-beklentileri', 'index.html'));

  console.log('blog içerik görselleri uygulandı');
}
