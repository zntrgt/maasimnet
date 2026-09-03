import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const sourceDir = join(root, 'assets-source', 'direct');

export const blogImageAssignments = Object.freeze([
  {
    slug: 'is-yerinde-finansal-saglik',
    asset: 'is-yerinde-finansal-saglik-editorial.webp',
    alt: 'Modern bir ofiste finansal sağlık verilerini inceleyen Türk profesyoneller'
  },
  {
    slug: '2027-maas-zammi-beklentileri',
    asset: '2027-maas-zammi-beklentileri-editorial.webp',
    alt: '2027 maaş ve zam beklentilerini veri tabloları üzerinden değerlendiren Türk profesyoneller'
  },
  {
    slug: 'maas-zam-gorusmesi-nasil-yapilir',
    asset: 'maas-zam-gorusmesi-editorial.webp',
    alt: 'Ofiste yöneticiyle maaş ve zam görüşmesi yapan Türk çalışan'
  },
  {
    slug: 'is-teklifinin-yillik-degeri',
    asset: 'is-teklifinin-yillik-degeri-editorial.webp',
    alt: 'Bir iş teklifinin ücret ve yan hak paketini ofiste değerlendiren Türk profesyoneller'
  },
  {
    slug: 'isveren-katkili-bes',
    asset: 'isveren-katkili-bes-editorial.webp',
    alt: 'İşveren katkılı BES ve çalışan yan haklarını görüşen Türk profesyoneller'
  },
  {
    slug: 'esnek-yan-hak-butcesi',
    asset: 'esnek-yan-hak-butcesi-editorial.webp',
    alt: 'Esnek yan hak bütçesini birlikte planlayan Türk çalışma ekibi'
  },
  {
    slug: 'is-degisikliginde-vergi-matrahi',
    asset: 'is-degisikliginde-vergi-matrahi-editorial.webp',
    alt: 'İş değişikliğinde vergi matrahını bordro belgeleriyle inceleyen Türk çalışan ve danışman'
  },
  {
    slug: '2026-maas-vergi-dilimleri',
    asset: '2026-maas-vergi-dilimleri-editorial.webp',
    alt: '2026 maaş vergi dilimlerini tablo ve grafiklerle analiz eden Türk profesyoneller'
  },
  {
    slug: 'netten-brute-maas-neden-aylik-degisir',
    asset: 'netten-brute-maas-neden-aylik-degisir-editorial.webp',
    alt: 'Net ve brüt maaşın aylık değişimini ofiste hesaplayan Türk profesyoneller'
  },
  {
    slug: 'maas-hesaplama-siteleri-neden-farkli',
    asset: 'maas-hesaplama-siteleri-neden-farkli-editorial.webp',
    alt: 'Maaş hesaplama sonuçlarını belgeler ve bilgisayar üzerinden karşılaştıran Türk profesyoneller'
  }
]);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceAttribute(attributes, name, value) {
  const pattern = new RegExp(`\\b${name}="[^"]*"`, 'i');
  return pattern.test(attributes)
    ? attributes.replace(pattern, `${name}="${value}"`)
    : `${attributes} ${name}="${value}"`;
}

function updateHero(html, post) {
  const relative = `/assets/${post.asset}`;
  const absolute = `https://maasim.net${relative}`;
  const figureImage = /(<figure\b[^>]*>\s*<img\b)([^>]*)(>)/i;
  const match = html.match(figureImage);

  if (!match) throw new Error(`Hero image not found for ${post.slug}`);

  const currentSrc = match[2].match(/\bsrc="([^"]+)"/i)?.[1];
  if (!currentSrc) throw new Error(`Hero src not found for ${post.slug}`);

  let attributes = match[2];
  attributes = replaceAttribute(attributes, 'src', relative);
  attributes = replaceAttribute(attributes, 'alt', post.alt);
  attributes = replaceAttribute(attributes, 'width', '480');
  attributes = replaceAttribute(attributes, 'height', '270');
  attributes = replaceAttribute(attributes, 'loading', 'eager');
  attributes = replaceAttribute(attributes, 'decoding', 'async');
  attributes = replaceAttribute(attributes, 'fetchpriority', 'high');

  html = html.replace(figureImage, `$1${attributes}$3`);
  html = html.replaceAll(currentSrc, relative);

  const currentAbsolute = currentSrc.startsWith('http')
    ? currentSrc
    : `https://maasim.net${currentSrc.startsWith('/') ? '' : '/'}${currentSrc}`;

  html = html.replaceAll(currentAbsolute, absolute);
  html = html.replace(/(<meta\s+property="og:image"\s+content=")[^"]*(")/i, `$1${absolute}$2`);
  html = html.replace(/(<meta\s+name="twitter:image"\s+content=")[^"]*(")/i, `$1${absolute}$2`);
  html = html.replace(/(<meta\s+property="og:image:alt"\s+content=")[^"]*(")/i, `$1${post.alt}$2`);
  html = html.replace(/(<meta\s+name="twitter:image:alt"\s+content=")[^"]*(")/i, `$1${post.alt}$2`);
  return html;
}

function updateIndexCard(html, post) {
  const route = `/blog/${post.slug}/`;
  const anchorPattern = new RegExp(
    `(<a\\b[^>]*href="${escapeRegExp(route)}"[^>]*>[\\s\\S]*?<img\\b)([^>]*)(>)`,
    'i'
  );
  const match = html.match(anchorPattern);

  if (!match) throw new Error(`Blog index card not found for ${post.slug}`);

  let attributes = match[2];
  attributes = replaceAttribute(attributes, 'src', `/assets/${post.asset}`);
  attributes = replaceAttribute(attributes, 'alt', post.alt);
  attributes = replaceAttribute(attributes, 'width', '480');
  attributes = replaceAttribute(attributes, 'height', '270');
  attributes = replaceAttribute(attributes, 'loading', 'lazy');
  attributes = replaceAttribute(attributes, 'decoding', 'async');

  return html.replace(anchorPattern, `$1${attributes}$3`);
}

export async function applyBlogImages(dist) {
  const assetDir = join(dist, 'assets');
  await mkdir(assetDir, { recursive: true });

  for (const post of blogImageAssignments) {
    await cp(join(sourceDir, post.asset), join(assetDir, post.asset));

    const articlePath = join(dist, 'blog', post.slug, 'index.html');
    const articleHtml = await readFile(articlePath, 'utf8');
    await writeFile(articlePath, updateHero(articleHtml, post));
  }

  const indexPath = join(dist, 'blog', 'index.html');
  let indexHtml = await readFile(indexPath, 'utf8');
  for (const post of blogImageAssignments) indexHtml = updateIndexCard(indexHtml, post);
  await writeFile(indexPath, indexHtml);

  console.log(`blog içeriklerinde ve kartlarında ${blogImageAssignments.length} konuya özel editoryal görsel uygulandı`);
  return { applied: blogImageAssignments.length };
}
