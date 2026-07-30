export const blogPosts = [
  { slug: '2027-maas-zammi-beklentileri', generator: 'legacy', indexable: true },
  { slug: 'is-yerinde-finansal-saglik', generator: 'legacy', indexable: true },
  { slug: '2026-yemek-karti-istisnasi', generator: 'core', indexable: true },
  { slug: '2026-maas-vergi-dilimleri', generator: 'core', indexable: true },
  { slug: 'is-degisikliginde-vergi-matrahi', generator: 'core', indexable: true },
  { slug: 'netten-brute-maas-neden-aylik-degisir', generator: 'core', indexable: true },
  { slug: 'maas-hesaplama-siteleri-neden-farkli', generator: 'core', indexable: true },
  { slug: '2026-sgk-tavani', generator: 'core', indexable: true },
  { slug: '100000-tl-brut-maas-neti-2026', generator: 'core', indexable: true },
  { slug: 'prim-ikramiye-net-maasi-neden-dusurur', generator: 'core', indexable: true },
  { slug: 'kidem-tazminatina-dahil-odemeler', generator: 'core', indexable: true },
  { slug: 'is-teklifinin-yillik-degeri', generator: 'core', indexable: true },
  { slug: 'isveren-katkili-bes', generator: 'benefits', indexable: true },
  { slug: 'esnek-yan-hak-butcesi', generator: 'benefits', indexable: true },
  { slug: 'ev-ofis-destegi-vergi', generator: 'benefits', indexable: true },
  { slug: 'mental-saglik-yan-haklari-burnout', generator: 'benefits', indexable: true },
  { slug: 'sirket-destekli-spor-wellness', generator: 'benefits', indexable: true },
  { slug: 'yasam-evresine-gore-yan-haklar', generator: 'benefits', indexable: true }
];

export const indexableBlogPosts = blogPosts.filter((post) => post.indexable);
export const blogRoute = (post) => `/blog/${post.slug}/`;
export const blogOutputPath = (post) => `blog/${post.slug}/index.html`;

export function validateBlogManifest() {
  const validSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const seen = new Set();

  for (const post of blogPosts) {
    if (!validSlug.test(post.slug)) {
      throw new Error(`Geçersiz blog slug: ${post.slug}`);
    }
    if (seen.has(post.slug)) {
      throw new Error(`Tekrarlanan blog slug: ${post.slug}`);
    }
    seen.add(post.slug);
  }

  return true;
}
