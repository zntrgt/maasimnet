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
  'https://maasim.net/tazminat-hesaplama/',
  'https://maasim.net/kidem-tazminati-hesaplama/',
  'https://maasim.net/ihbar-tazminati-hesaplama/',
  'https://maasim.net/issizlik-maasi-hesaplama/',
  'https://maasim.net/sitemap.xml',
  ...preferred.map((post) => `https://maasim.net${blogRoute(post)}`)
];

for (const url of [...new Set(urls)]) console.log(url);
