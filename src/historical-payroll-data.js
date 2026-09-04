const PPM = 1_000_000;

export const HISTORICAL_PAYROLL_CHECKED_AT = '2026-09-04';

const bracket = (upToTl, ratePercent) => Object.freeze({
  upToKurus: Number.isFinite(upToTl) ? Math.round(upToTl * 100) : Number.POSITIVE_INFINITY,
  ratePpm: Math.round((ratePercent / 100) * PPM)
});
const period = (fromMonth, minimumGrossTl, sgkCeilingTl, referenceMinimumNetTl) => Object.freeze({
  fromMonth,
  minimumGrossKurus: Math.round(minimumGrossTl * 100),
  sgkCeilingKurus: Math.round(sgkCeilingTl * 100),
  referenceMinimumNetKurus: Math.round(referenceMinimumNetTl * 100)
});

export const HISTORICAL_AGI_OPTIONS = Object.freeze([
  Object.freeze({ id: 'single', label: 'Bekâr / eşi çalışan, çocuksuz', ratePpm: 500_000 }),
  Object.freeze({ id: 'working-spouse-1', label: 'Eşi çalışan, 1 çocuk', ratePpm: 575_000 }),
  Object.freeze({ id: 'working-spouse-2', label: 'Eşi çalışan, 2 çocuk', ratePpm: 650_000 }),
  Object.freeze({ id: 'working-spouse-3', label: 'Eşi çalışan, 3 çocuk', ratePpm: 750_000 }),
  Object.freeze({ id: 'working-spouse-4', label: 'Eşi çalışan, 4 çocuk', ratePpm: 800_000 }),
  Object.freeze({ id: 'working-spouse-5', label: 'Eşi çalışan, 5+ çocuk', ratePpm: 850_000 }),
  Object.freeze({ id: 'nonworking-spouse', label: 'Eşi çalışmayan, çocuksuz', ratePpm: 600_000 }),
  Object.freeze({ id: 'nonworking-spouse-1', label: 'Eşi çalışmayan, 1 çocuk', ratePpm: 675_000 }),
  Object.freeze({ id: 'nonworking-spouse-2', label: 'Eşi çalışmayan, 2 çocuk', ratePpm: 750_000 }),
  // 3. çocukla birlikte teorik oran %85'e ulaşır. Daha fazla çocukta oran artsa da
  // AGİ, asgari ücret üzerinden hesaplanan gelir vergisini aşamadığı için fiilî üst sınır %85'tir.
  Object.freeze({ id: 'nonworking-spouse-3', label: 'Eşi çalışmayan, 3+ çocuk', ratePpm: 850_000 })
]);

const CSG_B_ARCHIVE = 'https://www.csgb.gov.tr/poco-pages/asgari-ucret/';
const GIB_INCOME_TAX_LAW = 'https://gib.gov.tr/mevzuat/kanun/433';

export const HISTORICAL_PAYROLL_DATA = Object.freeze({
  2020: Object.freeze({
    year: 2020,
    periods: Object.freeze([period(0, 2943, 22072.50, 2324.71)]),
    incomeTaxBrackets: Object.freeze([
      bracket(22_000, 15), bracket(49_000, 20), bracket(180_000, 27), bracket(600_000, 35), bracket(Infinity, 40)
    ]),
    agiEnabled: true,
    minimumWageTaxExemption: false,
    sourceUrls: Object.freeze([
      CSG_B_ARCHIVE,
      'https://cdn.gib.gov.tr/api/gibportal-file/file/getFileResources?objectKey=arsiv%2Fonceki-dokumanlar%2F2020_ucret.pdf',
      GIB_INCOME_TAX_LAW
    ])
  }),
  2021: Object.freeze({
    year: 2021,
    periods: Object.freeze([period(0, 3577.50, 26831.40, 2825.90)]),
    incomeTaxBrackets: Object.freeze([
      bracket(24_000, 15), bracket(53_000, 20), bracket(190_000, 27), bracket(650_000, 35), bracket(Infinity, 40)
    ]),
    agiEnabled: true,
    minimumWageTaxExemption: false,
    sourceUrls: Object.freeze([
      CSG_B_ARCHIVE,
      'https://intvrg.gib.gov.tr/hazirbeyan/assets/pdf/2021_ucretgelirirehber.pdf',
      GIB_INCOME_TAX_LAW
    ])
  }),
  2022: Object.freeze({
    year: 2022,
    periods: Object.freeze([
      period(0, 5004, 37530, 4253.40),
      period(6, 6471, 48532.50, 5500.35)
    ]),
    incomeTaxBrackets: Object.freeze([
      bracket(32_000, 15), bracket(70_000, 20), bracket(250_000, 27), bracket(880_000, 35), bracket(Infinity, 40)
    ]),
    agiEnabled: false,
    minimumWageTaxExemption: true,
    sourceUrls: Object.freeze([CSG_B_ARCHIVE, GIB_INCOME_TAX_LAW])
  }),
  2023: Object.freeze({
    year: 2023,
    periods: Object.freeze([
      period(0, 10008, 75060, 8506.80),
      period(6, 13414.50, 100608.90, 11402.32)
    ]),
    incomeTaxBrackets: Object.freeze([
      bracket(70_000, 15), bracket(150_000, 20), bracket(550_000, 27), bracket(1_900_000, 35), bracket(Infinity, 40)
    ]),
    agiEnabled: false,
    minimumWageTaxExemption: true,
    sourceUrls: Object.freeze([CSG_B_ARCHIVE, GIB_INCOME_TAX_LAW])
  }),
  2024: Object.freeze({
    year: 2024,
    periods: Object.freeze([period(0, 20002.50, 150018.90, 17002.12)]),
    incomeTaxBrackets: Object.freeze([
      bracket(110_000, 15), bracket(230_000, 20), bracket(870_000, 27), bracket(3_000_000, 35), bracket(Infinity, 40)
    ]),
    agiEnabled: false,
    minimumWageTaxExemption: true,
    sourceUrls: Object.freeze([CSG_B_ARCHIVE, GIB_INCOME_TAX_LAW])
  }),
  2025: Object.freeze({
    year: 2025,
    periods: Object.freeze([period(0, 26005.50, 195041.40, 22104.67)]),
    incomeTaxBrackets: Object.freeze([
      bracket(158_000, 15), bracket(330_000, 20), bracket(1_200_000, 27), bracket(4_300_000, 35), bracket(Infinity, 40)
    ]),
    agiEnabled: false,
    minimumWageTaxExemption: true,
    sourceUrls: Object.freeze([
      CSG_B_ARCHIVE,
      'https://intvrg.gib.gov.tr/hazirbeyan/assets/pdf/2025UcretGeliriVergiRehberi.pdf',
      GIB_INCOME_TAX_LAW
    ])
  })
});

export const HISTORICAL_YEARS = Object.freeze(Object.keys(HISTORICAL_PAYROLL_DATA).map(Number).sort((a,b) => b-a));

export function getHistoricalPayrollData(year) {
  const data = HISTORICAL_PAYROLL_DATA[Number(year)];
  if (!data) throw new RangeError(`Desteklenmeyen tarihsel bordro yılı: ${year}`);
  return data;
}

export function getHistoricalPeriod(year, monthIndex) {
  if (!Number.isInteger(monthIndex) || monthIndex < 0 || monthIndex > 11) throw new RangeError('Ay 0 ile 11 arasında olmalıdır.');
  const data = getHistoricalPayrollData(year);
  let selected = data.periods[0];
  for (const candidate of data.periods) if (candidate.fromMonth <= monthIndex) selected = candidate;
  return selected;
}

export function getHistoricalAgiOption(id = 'single') {
  const option = HISTORICAL_AGI_OPTIONS.find((item) => item.id === id);
  if (!option) throw new RangeError(`Geçersiz AGİ seçeneği: ${id}`);
  return option;
}
