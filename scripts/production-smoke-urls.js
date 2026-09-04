import { indexableBlogPosts, blogRoute, validateBlogManifest } from '../content/blog-manifest.js';

validateBlogManifest();

const preferred = [
  ...indexableBlogPosts.filter((post) => post.generator === 'core').slice(0, 1),
  ...indexableBlogPosts.filter((post) => post.generator === 'benefits').slice(0, 1)
];

const urls = [
  'https://maasim.net/version.json',
  'https://maasim.net/BingSiteAuth.xml',
  'https://maasim.net/test-raporu/',
  'https://maasim.net/blog/',
  'https://maasim.net/iletisim/',
  'https://maasim.net/cerez-politikasi/',
  'https://maasim.net/hesaplama-araclari/',
  'https://maasim.net/maas-zam-hesaplama/',
  'https://maasim.net/tazminat-hesaplama/',
  'https://maasim.net/kidem-tazminati-hesaplama/',
  'https://maasim.net/ihbar-tazminati-hesaplama/',
  'https://maasim.net/issizlik-maasi-hesaplama/',
  'https://maasim.net/fazla-mesai-hesaplama/',
  'https://maasim.net/yillik-izin-ucreti-hesaplama/',
  'https://maasim.net/asgari-ucret-hesaplama/',
  'https://maasim.net/2025-maas-hesaplama/',
  'https://maasim.net/2024-maas-hesaplama/',
  'https://maasim.net/2023-maas-hesaplama/',
  'https://maasim.net/2022-maas-hesaplama/',
  'https://maasim.net/2021-maas-hesaplama/',
  'https://maasim.net/2020-maas-hesaplama/',
  'https://maasim.net/sitemap.xml',
  ...preferred.map((post) => `https://maasim.net${blogRoute(post)}`)
];

for (const url of [...new Set(urls)]) console.log(url);
