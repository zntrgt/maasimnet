import { DATA_2026 } from '../src/data-2026.js';
import { HISTORICAL_PAYROLL_CHECKED_AT } from '../src/historical-payroll-data.js';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const SITE_METADATA = Object.freeze({
  origin: 'https://maasim.net',
  defaultPublishedAt: '2026-07-29',
  defaultModifiedAt: '2026-07-29',
  releaseModifiedAt: '2026-09-04',
  blogReviewedAt: '2026-07-31',
  payrollDataReviewedAt: DATA_2026.checkedAt,
  historicalPayrollReviewedAt: HISTORICAL_PAYROLL_CHECKED_AT,
  releaseVersion: '1.21.0-historical-brutten-nete'
});

const PAGE_OVERRIDES = Object.freeze({
  '/': Object.freeze({ publishedAt: '2026-07-29', modifiedAt: '2026-09-04' }),
  '/hesaplama-araclari/': Object.freeze({ publishedAt: '2026-09-04', modifiedAt: '2026-09-04' }),
  '/hesaplama-metodolojisi/': Object.freeze({ publishedAt: '2026-07-29', modifiedAt: '2026-08-01' }),
  '/test-raporu/': Object.freeze({ publishedAt: '2026-08-01', modifiedAt: '2026-08-01' }),
  '/iletisim/': Object.freeze({ modifiedAt: '2026-07-30' }),
  '/cerez-politikasi/': Object.freeze({ modifiedAt: '2026-07-30' }),
  '/hakkimizda/': Object.freeze({ publishedAt: '2026-09-04', modifiedAt: '2026-09-04' }),
  '/editoryal-politika/': Object.freeze({ publishedAt: '2026-09-04', modifiedAt: '2026-09-04' }),
  '/kaynak-politikasi/': Object.freeze({ publishedAt: '2026-09-04', modifiedAt: '2026-09-04' }),
  '/tazminat-hesaplama/': Object.freeze({ publishedAt: '2026-09-04', modifiedAt: '2026-09-04' }),
  '/kidem-tazminati-hesaplama/': Object.freeze({ publishedAt: '2026-09-04', modifiedAt: '2026-09-04' }),
  '/ihbar-tazminati-hesaplama/': Object.freeze({ publishedAt: '2026-09-04', modifiedAt: '2026-09-04' }),
  '/issizlik-maasi-hesaplama/': Object.freeze({ publishedAt: '2026-09-04', modifiedAt: '2026-09-04' }),
  '/fazla-mesai-hesaplama/': Object.freeze({ publishedAt: '2026-09-04', modifiedAt: '2026-09-04' }),
  '/yillik-izin-ucreti-hesaplama/': Object.freeze({ publishedAt: '2026-09-04', modifiedAt: '2026-09-04' }),
  '/asgari-ucret-hesaplama/': Object.freeze({ publishedAt: '2026-09-04', modifiedAt: '2026-09-04' }),
  '/maas-zam-hesaplama/': Object.freeze({ publishedAt: '2026-09-04', modifiedAt: '2026-09-04' }),
  '/resmi-tatil-mesai-ucreti-hesaplama/': Object.freeze({ publishedAt: '2026-09-04', modifiedAt: '2026-09-04' }),
  '/hafta-tatili-ucreti-hesaplama/': Object.freeze({ publishedAt: '2026-09-04', modifiedAt: '2026-09-04' }),
  '/part-time-maas-hesaplama/': Object.freeze({ publishedAt: '2026-09-04', modifiedAt: '2026-09-04' }),
  '/eksik-gun-maas-hesaplama/': Object.freeze({ publishedAt: '2026-09-04', modifiedAt: '2026-09-04' }),
  '/sgk-prim-hesaplama/': Object.freeze({ publishedAt: '2026-09-04', modifiedAt: '2026-09-04' }),
  '/2025-maas-hesaplama/': Object.freeze({ publishedAt: '2026-09-04', modifiedAt: HISTORICAL_PAYROLL_CHECKED_AT }),
  '/2024-maas-hesaplama/': Object.freeze({ publishedAt: '2026-09-04', modifiedAt: HISTORICAL_PAYROLL_CHECKED_AT }),
  '/2023-maas-hesaplama/': Object.freeze({ publishedAt: '2026-09-04', modifiedAt: HISTORICAL_PAYROLL_CHECKED_AT }),
  '/2022-maas-hesaplama/': Object.freeze({ publishedAt: '2026-09-04', modifiedAt: HISTORICAL_PAYROLL_CHECKED_AT }),
  '/2021-maas-hesaplama/': Object.freeze({ publishedAt: '2026-09-04', modifiedAt: HISTORICAL_PAYROLL_CHECKED_AT }),
  '/2020-maas-hesaplama/': Object.freeze({ publishedAt: '2026-09-04', modifiedAt: HISTORICAL_PAYROLL_CHECKED_AT }),
  '/brutten-nete-2025/': Object.freeze({ publishedAt: '2026-09-04', modifiedAt: HISTORICAL_PAYROLL_CHECKED_AT }),
  '/brutten-nete-2024/': Object.freeze({ publishedAt: '2026-09-04', modifiedAt: HISTORICAL_PAYROLL_CHECKED_AT }),
  '/brutten-nete-2023/': Object.freeze({ publishedAt: '2026-09-04', modifiedAt: HISTORICAL_PAYROLL_CHECKED_AT }),
  '/brutten-nete-2022/': Object.freeze({ publishedAt: '2026-09-04', modifiedAt: HISTORICAL_PAYROLL_CHECKED_AT }),
  '/brutten-nete-2021/': Object.freeze({ publishedAt: '2026-09-04', modifiedAt: HISTORICAL_PAYROLL_CHECKED_AT }),
  '/brutten-nete-2020/': Object.freeze({ publishedAt: '2026-09-04', modifiedAt: HISTORICAL_PAYROLL_CHECKED_AT }),
  '/veriler/2026/': Object.freeze({ publishedAt: '2026-07-29', modifiedAt: DATA_2026.checkedAt }),
  '/veriler/2026/asgari-ucret/': Object.freeze({ publishedAt: '2026-07-29', modifiedAt: DATA_2026.checkedAt }),
  '/veriler/2026/vergi-dilimleri/': Object.freeze({ publishedAt: '2026-07-29', modifiedAt: DATA_2026.checkedAt }),
  '/veriler/2026/sgk-tavani/': Object.freeze({ publishedAt: '2026-07-29', modifiedAt: DATA_2026.checkedAt })
});

export const INDEXABLE_STATIC_PATHS = Object.freeze([
  '/hesaplama-araclari/',
  '/test-raporu/',
  '/tazminat-hesaplama/',
  '/kidem-tazminati-hesaplama/',
  '/ihbar-tazminati-hesaplama/',
  '/issizlik-maasi-hesaplama/',
  '/fazla-mesai-hesaplama/',
  '/yillik-izin-ucreti-hesaplama/',
  '/asgari-ucret-hesaplama/',
  '/maas-zam-hesaplama/',
  '/resmi-tatil-mesai-ucreti-hesaplama/',
  '/hafta-tatili-ucreti-hesaplama/',
  '/part-time-maas-hesaplama/',
  '/eksik-gun-maas-hesaplama/',
  '/sgk-prim-hesaplama/',
  '/2025-maas-hesaplama/',
  '/2024-maas-hesaplama/',
  '/2023-maas-hesaplama/',
  '/2022-maas-hesaplama/',
  '/2021-maas-hesaplama/',
  '/2020-maas-hesaplama/',
  '/brutten-nete-2025/',
  '/brutten-nete-2024/',
  '/brutten-nete-2023/',
  '/brutten-nete-2022/',
  '/brutten-nete-2021/',
  '/brutten-nete-2020/'
]);

export function normalizeSitePath(pathname = '/') {
  const clean = String(pathname || '/').split(/[?#]/, 1)[0] || '/';
  if (clean === '/') return '/';
  return `/${clean.replace(/^\/+|\/+$/g, '')}/`;
}

export function formatSiteDateTr(isoDate) {
  if (!ISO_DATE.test(String(isoDate))) throw new Error(`Geçersiz tarih: ${isoDate}`);
  return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${isoDate}T00:00:00Z`));
}

export function getPageMetadata(pathname = '/') {
  const path = normalizeSitePath(pathname);
  const override = PAGE_OVERRIDES[path] || {};
  const isPayrollDataPage = path === '/veriler/2026/' || path.startsWith('/veriler/2026/');
  const isBlogPage = path === '/blog/' || path.startsWith('/blog/');
  const isTerminationCalculator = ['/tazminat-hesaplama/', '/kidem-tazminati-hesaplama/', '/ihbar-tazminati-hesaplama/'].includes(path);
  const isWorkerRightsCalculator = ['/issizlik-maasi-hesaplama/', '/fazla-mesai-hesaplama/', '/yillik-izin-ucreti-hesaplama/', '/resmi-tatil-mesai-ucreti-hesaplama/', '/hafta-tatili-ucreti-hesaplama/'].includes(path);
  const isPayrollUtilityCalculator = ['/asgari-ucret-hesaplama/', '/part-time-maas-hesaplama/', '/eksik-gun-maas-hesaplama/', '/sgk-prim-hesaplama/'].includes(path);
  const isSalaryRaiseCalculator = path === '/maas-zam-hesaplama/';
  const isHistoricalPayrollCalculator = /^\/202[0-5]-maas-hesaplama\/$/.test(path) || /^\/brutten-nete-202[0-5]\/$/.test(path);
  const isCalculatorHub = path === '/hesaplama-araclari/';

  const familyModifiedAt = isHistoricalPayrollCalculator
    ? SITE_METADATA.historicalPayrollReviewedAt
    : isPayrollDataPage
      ? SITE_METADATA.payrollDataReviewedAt
      : isBlogPage ? SITE_METADATA.blogReviewedAt : SITE_METADATA.defaultModifiedAt;
  const metadata = {
    path,
    publishedAt: override.publishedAt || SITE_METADATA.defaultPublishedAt,
    modifiedAt: override.modifiedAt || familyModifiedAt,
    reviewedAt: isHistoricalPayrollCalculator
      ? SITE_METADATA.historicalPayrollReviewedAt
      : isSalaryRaiseCalculator
        ? SITE_METADATA.releaseModifiedAt
        : isPayrollDataPage || isTerminationCalculator || isWorkerRightsCalculator || isPayrollUtilityCalculator || isCalculatorHub || path === '/' || path === '/hesaplama-metodolojisi/' || path === '/test-raporu/'
          ? SITE_METADATA.payrollDataReviewedAt
          : isBlogPage ? SITE_METADATA.blogReviewedAt : undefined
  };

  for (const [name, value] of Object.entries(metadata)) {
    if (name.endsWith('At') && value !== undefined && !ISO_DATE.test(value)) throw new Error(`Geçersiz merkezi içerik tarihi: ${name}=${value}`);
  }
  return Object.freeze(metadata);
}