import { DATA_2026 } from '../src/data-2026.js';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const SITE_METADATA = Object.freeze({
  origin: 'https://maasim.net',
  defaultPublishedAt: '2026-07-29',
  defaultModifiedAt: '2026-07-29',
  releaseModifiedAt: '2026-09-04',
  blogReviewedAt: '2026-07-31',
  payrollDataReviewedAt: DATA_2026.checkedAt,
  releaseVersion: '1.11.0-editorial-authority-ai-visibility'
});

const PAGE_OVERRIDES = Object.freeze({
  '/': Object.freeze({ publishedAt: '2026-07-29', modifiedAt: '2026-08-01' }),
  '/hesaplama-metodolojisi/': Object.freeze({ publishedAt: '2026-07-29', modifiedAt: '2026-08-01' }),
  '/test-raporu/': Object.freeze({ publishedAt: '2026-08-01', modifiedAt: '2026-08-01' }),
  '/iletisim/': Object.freeze({ modifiedAt: '2026-07-30' }),
  '/cerez-politikasi/': Object.freeze({ modifiedAt: '2026-07-30' }),
  '/hakkimizda/': Object.freeze({ publishedAt: '2026-09-04', modifiedAt: '2026-09-04' }),
  '/editoryal-politika/': Object.freeze({ publishedAt: '2026-09-04', modifiedAt: '2026-09-04' }),
  '/kaynak-politikasi/': Object.freeze({ publishedAt: '2026-09-04', modifiedAt: '2026-09-04' }),
  '/veriler/2026/': Object.freeze({ publishedAt: '2026-07-29', modifiedAt: DATA_2026.checkedAt }),
  '/veriler/2026/asgari-ucret/': Object.freeze({ publishedAt: '2026-07-29', modifiedAt: DATA_2026.checkedAt }),
  '/veriler/2026/vergi-dilimleri/': Object.freeze({ publishedAt: '2026-07-29', modifiedAt: DATA_2026.checkedAt }),
  '/veriler/2026/sgk-tavani/': Object.freeze({ publishedAt: '2026-07-29', modifiedAt: DATA_2026.checkedAt })
});

export const INDEXABLE_STATIC_PATHS = Object.freeze(['/test-raporu/']);

export function normalizeSitePath(pathname = '/') {
  const clean = String(pathname || '/').split(/[?#]/, 1)[0] || '/';
  if (clean === '/') return '/';
  return `/${clean.replace(/^\/+|\/+$/g, '')}/`;
}

export function formatSiteDateTr(isoDate) {
  if (!ISO_DATE.test(String(isoDate))) throw new Error(`Geçersiz tarih: ${isoDate}`);
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(`${isoDate}T00:00:00Z`));
}

export function getPageMetadata(pathname = '/') {
  const path = normalizeSitePath(pathname);
  const override = PAGE_OVERRIDES[path] || {};
  const isPayrollDataPage = path === '/veriler/2026/' || path.startsWith('/veriler/2026/');
  const isBlogPage = path === '/blog/' || path.startsWith('/blog/');

  const familyModifiedAt = isPayrollDataPage
    ? SITE_METADATA.payrollDataReviewedAt
    : isBlogPage
      ? SITE_METADATA.blogReviewedAt
      : SITE_METADATA.defaultModifiedAt;

  const metadata = {
    path,
    publishedAt: override.publishedAt || SITE_METADATA.defaultPublishedAt,
    modifiedAt: override.modifiedAt || familyModifiedAt,
    reviewedAt: isPayrollDataPage || path === '/' || path === '/hesaplama-metodolojisi/' || path === '/test-raporu/'
      ? SITE_METADATA.payrollDataReviewedAt
      : isBlogPage
        ? SITE_METADATA.blogReviewedAt
        : undefined
  };

  for (const [name, value] of Object.entries(metadata)) {
    if (name.endsWith('At') && value !== undefined && !ISO_DATE.test(value)) {
      throw new Error(`Geçersiz merkezi içerik tarihi: ${name}=${value}`);
    }
  }

  return Object.freeze(metadata);
}
