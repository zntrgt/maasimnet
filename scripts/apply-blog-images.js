import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

const posts = [
  {
    slug: 'is-yerinde-finansal-saglik',
    asset: 'is-yerinde-finansal-saglik-editorial.webp',
    alt: 'Modern bir ofiste finansal sağlık verilerini inceleyen profesyoneller'
  },
  {
    slug: '2027-maas-zammi-beklentileri',
    asset: '2027-maas-zammi-beklentileri-editorial.webp',
    alt: '2027 maaş ve zam beklentilerini veri tabloları üzerinden değerlendiren ekip'
  },
  {
    slug: 'maas-zam-gorusmesi-nasil-yapilir',
    asset: 'maas-zam-gorusmesi-editorial.webp',
    alt: 'Yöneticiyle maaş ve zam görüşmesi yapan çalışan'
  },
  {
    slug: 'is-teklifinin-yillik-degeri',
    asset: 'is-teklifinin-yillik-degeri-editorial.webp',
    alt: 'Bir iş teklifinin ücret ve yan hak paketini değerlendiren profesyoneller'
  },
  {
    slug: 'isveren-katkili-bes',
    asset: 'isveren-katkili-bes-editorial.webp',
    alt: 'İşveren katkılı BES ve çalışan yan haklarını görüşen profesyoneller'
  },
  {
    slug: 'esnek-yan-hak-butcesi',
    asset: 'esnek-yan-hak-butcesi-editorial.webp',
    alt: 'Esnek yan hak bütçesini birlikte planlayan çalışma ekibi'
  },
  {
    slug: 'is-degisikliginde-vergi-matrahi',
    asset: 'is-degisikliginde-vergi-matrahi-editorial.webp',
    alt: 'İş değişikliğinde vergi matrahını bordro belgeleriyle inceleyen çalışan ve danışman'
  },
  {
    slug: '2026-maas-vergi-dilimleri',
    asset: '2026-maas-vergi-dilimleri-editorial.webp',
    alt: '2026 maaş vergi dilimlerini tablo ve grafiklerle analiz eden ekip'
  },
  {
    slug: 'netten-brute-maas-neden-aylik-degisir',
    asset: 'netten-brute-maas-neden-aylik-degisir-editorial.webp',
    alt: 'Net ve brüt maaşın aylık değişimini hesaplayan profesyoneller'
  },
  {
    slug: 'maas-hesaplama-siteleri-neden-farkli',
    asset: 'maas-hesaplama-siteleri-neden-farkli-editorial.webp',
    alt: 'Maaş hesaplama sonuçlarını belgeler ve bilgisayar üzerinden karşılaştıran ekip'
  }
];

const bundleParts = [
  'blog-editorial-images.part01.b64',
  'blog-editorial-images.part02.b64',
  'blog-editorial-images.part03.b64',
  'blog-editorial-images.part04.b64',
  'blog-editorial-images.part05.b64'
];

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
  attributes = replaceAttribute(attributes, 'width', '640');
  attributes = replaceAttribute(attributes, 'height', '360');

  html = html.replace(figureImage, `$1${attributes}$3`);
  html = html.replaceAll(currentSrc, relative);

  const currentAbsolute = currentSrc.startsWith('http')
    ? currentSrc
    : `https://maasim.net${currentSrc.startsWith('/') ? '' : '/'}${currentSrc}`;

  html = html.replaceAll(currentAbsolute, absolute);
  html = html.replace(/(<meta\s+property="og:image"\s+content=")[^"]*(")/i, `$1${absolute}$2`);
  html = html.replace(/(<meta\s+name="twitter:image"\s+content=")[^"]*(")/i, `$1${absolute}$2`);
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
  attributes = replaceAttribute(attributes, 'width', '640');
  attributes = replaceAttribute(attributes, 'height', '360');

  return html.replace(anchorPattern, `$1${attributes}$3`);
}

async function readImageBundle() {
  const encoded = (await Promise.all(
    bundleParts.map((name) => readFile(join(root, 'assets-source', name), 'utf8'))
  ))
    .join('')
    .replace(/[^A-Za-z0-9+/=]/g, '');

  return JSON.parse(gunzipSync(Buffer.from(encoded, 'base64')).toString('utf8'));
}

export async function applyBlogImages(dist) {
  const images = await readImageBundle();
  const assetDir = join(dist, 'assets');
  await mkdir(assetDir, { recursive: true });

  for (const post of posts) {
    const payload = images[post.asset];
    if (!payload) throw new Error(`Missing bundled image ${post.asset}`);

    await writeFile(join(assetDir, post.asset), Buffer.from(payload, 'base64'));

    const articlePath = join(dist, 'blog', post.slug, 'index.html');
    const articleHtml = await readFile(articlePath, 'utf8');
    await writeFile(articlePath, updateHero(articleHtml, post));
  }

  const indexPath = join(dist, 'blog', 'index.html');
  let indexHtml = await readFile(indexPath, 'utf8');
  for (const post of posts) indexHtml = updateIndexCard(indexHtml, post);
  await writeFile(indexPath, indexHtml);

  console.log(`blog içeriklerine ${posts.length} editoryal görsel uygulandı`);
}
