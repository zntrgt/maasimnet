// Maaşım.net kurum kimliği: yapılandırılmış verideki Organization ve WebSite düğümlerinin tek kaynağı.
// SAME_AS'e yalnızca markanın gerçekten sahip olduğu, aynı ad/logo/site linkini kullanan resmî hesaplar eklenir.
export const SITE = 'https://maasim.net';
export const ORG_ID = `${SITE}/#organization`;
export const WEBSITE_ID = `${SITE}/#website`;
export const LOGO_PNG = `${SITE}/assets/logo-512.png`;
export const DEFAULT_SOCIAL_IMAGE = `${SITE}/assets/og-maasim-2026.png`;

export const SAME_AS = Object.freeze([]);

export const ORGANIZATION = Object.freeze({
  '@type': 'Organization',
  '@id': ORG_ID,
  name: 'Maaşım.net',
  alternateName: 'Maasim.net',
  url: `${SITE}/`,
  logo: { '@type': 'ImageObject', '@id': `${SITE}/#logo`, url: LOGO_PNG, contentUrl: LOGO_PNG, width: 512, height: 512, caption: 'Maaşım.net' },
  image: { '@id': `${SITE}/#logo` },
  email: 'iletisim@maasim.net',
  description: 'Türkiye için maaş, bordro, vergi, SGK ve çalışan hakları hesaplama araçları ile kaynaklı rehberler.',
  ...(SAME_AS.length ? { sameAs: [...SAME_AS] } : {})
});

export const WEBSITE = Object.freeze({
  '@type': 'WebSite',
  '@id': WEBSITE_ID,
  url: `${SITE}/`,
  name: 'Maaşım.net',
  alternateName: 'Maasim.net',
  inLanguage: 'tr-TR',
  publisher: { '@id': ORG_ID }
});
