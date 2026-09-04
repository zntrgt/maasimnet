export const blogClusters = Object.freeze({
  'salary-2026': Object.freeze({
    title: '2026 Maaş, Vergi ve Bordro',
    description: 'Brüt-net maaş, vergi dilimleri, SGK tavanı, prim ve bordro hesaplama mantığını birlikte ele alan rehberler.',
    toolHref: '/#hesaplayici',
    toolLabel: 'Kendi maaşını hesapla'
  }),
  'career-compensation': Object.freeze({
    title: 'Kariyer, Zam ve Ücret Kararları',
    description: 'Maaş görüşmesi, zam beklentisi ve iş teklifi kararlarını yıllık toplam değer üzerinden değerlendiren rehberler.',
    toolHref: '/maas-teklifi-karsilastirma/',
    toolLabel: 'Maaş teklifini karşılaştır'
  }),
  'benefits-wellbeing': Object.freeze({
    title: 'Yan Haklar ve Çalışan Finansal Sağlığı',
    description: 'BES, esnek yan haklar, wellbeing, ev-ofis desteği ve yaşam evresine göre çalışan paketlerini değerlendiren rehberler.',
    toolHref: '/maas-teklifi-karsilastirma/',
    toolLabel: 'Toplam paketi karşılaştır'
  })
});

export const blogPosts = [
  { slug: '2027-maas-zammi-beklentileri', title: '2027 Maaş Zammı Beklentileri', cluster: 'career-compensation', generator: 'legacy', indexable: true },
  { slug: 'is-yerinde-finansal-saglik', title: 'İş Yerinde Finansal Sağlık', cluster: 'benefits-wellbeing', generator: 'legacy', indexable: true },
  { slug: 'maas-zam-gorusmesi-nasil-yapilir', title: 'Maaş ve Zam Görüşmesi Nasıl Yapılır?', cluster: 'career-compensation', generator: 'career', indexable: true },
  { slug: '2026-yemek-karti-istisnasi', title: '2026 Yemek Kartı İstisnası', cluster: 'salary-2026', generator: 'core', indexable: true },
  { slug: '2026-maas-vergi-dilimleri', title: '2026 Maaş Vergi Dilimleri', cluster: 'salary-2026', generator: 'core', indexable: true },
  { slug: 'is-degisikliginde-vergi-matrahi', title: 'İş Değişikliğinde Vergi Matrahı', cluster: 'salary-2026', generator: 'core', indexable: true },
  { slug: 'netten-brute-maas-neden-aylik-degisir', title: 'Netten Brüte Maaş Neden Aylık Değişir?', cluster: 'salary-2026', generator: 'core', indexable: true },
  { slug: 'maas-hesaplama-siteleri-neden-farkli', title: 'Maaş Hesaplama Siteleri Neden Farklı Sonuç Verir?', cluster: 'salary-2026', generator: 'core', indexable: true },
  { slug: '2026-sgk-tavani', title: '2026 SGK Tavanı', cluster: 'salary-2026', generator: 'core', indexable: true },
  { slug: '100000-tl-brut-maas-neti-2026', title: '100.000 TL Brüt Maaş Neti 2026', cluster: 'salary-2026', generator: 'core', indexable: true },
  { slug: 'prim-ikramiye-net-maasi-neden-dusurur', title: 'Prim ve İkramiye Net Maaşı Neden Düşürür?', cluster: 'salary-2026', generator: 'core', indexable: true },
  { slug: 'kidem-tazminatina-dahil-odemeler', title: 'Kıdem Tazminatına Dahil Ödemeler', cluster: 'salary-2026', generator: 'core', indexable: true },
  { slug: 'is-teklifinin-yillik-degeri', title: 'İş Teklifinin Yıllık Değeri', cluster: 'career-compensation', generator: 'core', indexable: true },
  { slug: 'isveren-katkili-bes', title: 'İşveren Katkılı BES', cluster: 'benefits-wellbeing', generator: 'benefits', indexable: true },
  { slug: 'esnek-yan-hak-butcesi', title: 'Esnek Yan Hak Bütçesi', cluster: 'benefits-wellbeing', generator: 'benefits', indexable: true },
  { slug: 'ev-ofis-destegi-vergi', title: 'Ev-Ofis Desteği ve Vergi', cluster: 'benefits-wellbeing', generator: 'benefits', indexable: true },
  { slug: 'mental-saglik-yan-haklari-burnout', title: 'Mental Sağlık Yan Hakları ve Burnout', cluster: 'benefits-wellbeing', generator: 'benefits', indexable: true },
  { slug: 'sirket-destekli-spor-wellness', title: 'Şirket Destekli Spor ve Wellness', cluster: 'benefits-wellbeing', generator: 'benefits', indexable: true },
  { slug: 'yasam-evresine-gore-yan-haklar', title: 'Yaşam Evresine Göre Yan Haklar', cluster: 'benefits-wellbeing', generator: 'benefits', indexable: true }
];

export const indexableBlogPosts = blogPosts.filter((post) => post.indexable);
export const blogRoute = (post) => `/blog/${post.slug}/`;
export const blogOutputPath = (post) => `blog/${post.slug}/index.html`;
export const postsInCluster = (cluster) => indexableBlogPosts.filter((post) => post.cluster === cluster);

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
    if (!post.title || String(post.title).trim().length < 5) {
      throw new Error(`Blog başlığı eksik: ${post.slug}`);
    }
    if (!blogClusters[post.cluster]) {
      throw new Error(`Geçersiz blog konu kümesi: ${post.slug} -> ${post.cluster}`);
    }
    seen.add(post.slug);
  }

  for (const cluster of Object.keys(blogClusters)) {
    if (!blogPosts.some((post) => post.cluster === cluster && post.indexable)) {
      throw new Error(`Boş blog konu kümesi: ${cluster}`);
    }
  }

  return true;
}
