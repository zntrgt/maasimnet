import { DATA_2026 } from '../src/data-2026.js';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const SITE_METADATA = Object.freeze({
  origin: 'https://maasim.net',
  defaultPublishedAt: '2026-07-29',
  releaseModifiedAt: '2026-08-01',
  payrollDataReviewedAt: DATA_2026.checkedAt,
  releaseVersion: '1.7.0-payroll-audit-dates-dashboard'
});

const PAGE_OVERRIDES = Object.freeze({
  '/': Object.freeze({ publishedAt: '2026-07-29', modifiedAt: '2026-08-01' }),
  '/hesaplama-metodolojisi/': Object.freeze({ publishedAt: '2026-07-29', modifiedAt: '2026-08-01' }),
  '/test-raporu/': Object.freeze({ publishedAt: '2026-08-01', modifiedAt: '2026-08-01' }),
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

export function getPageMetadata(pathname = '/') {
  const path = normalizeSitePath(pathname);
  const override = PAGE_OVERRIDES[path] || {};
  const isPayrollDataPage = path.startsWith('/veriler/2026/');

  const metadata = {
    path,
    publishedAt: override.publishedAt || SITE_METADATA.defaultPublishedAt,
    modifiedAt: override.modifiedAt || (isPayrollDataPage
      ? SITE_METADATA.payrollDataReviewedAt
      : SITE_METADATA.releaseModifiedAt),
    reviewedAt: isPayrollDataPage || path === '/' || path === '/hesaplama-metodolojisi/' || path === '/test-raporu/'
      ? SITE_METADATA.payrollDataReviewedAt
      : undefined
  };

  for (const [name, value] of Object.entries(metadata)) {
    if (name.endsWith('At') && value !== undefined && !ISO_DATE.test(value)) {
      throw new Error(`Geçersiz merkezi içerik tarihi: ${name}=${value}`);
    }
  }

  return Object.freeze(metadata);
}
