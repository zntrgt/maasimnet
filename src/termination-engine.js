import { DATA_2026 } from './data-2026.js';
import {
  calculateProgressiveTaxKurus,
  getApplicableIncomeTaxRatesPpm,
  multiplyRateRoundedKurus
} from './payroll-engine.js';

const DAY_MS = 24 * 60 * 60 * 1000;

function parseIsoDate(value, fieldName) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    throw new TypeError(`${fieldName} YYYY-AA-GG biçiminde olmalıdır.`);
  }
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new RangeError(`${fieldName} geçerli bir tarih olmalıdır.`);
  }
  return date;
}

function iso(date) {
  return date.toISOString().slice(0, 10);
}

function addMonths(date, months) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const target = new Date(Date.UTC(year, month + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target;
}

function addYears(date, years) {
  return addMonths(date, years * 12);
}

function assertKurus(value, fieldName) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new TypeError(`${fieldName} sıfır veya pozitif güvenli bir kuruş tamsayısı olmalıdır.`);
  }
}

function buildDressedGross({
  baseGrossKurus,
  mealKurus,
  transportKurus,
  regularOtherKurus,
  annualRegularBenefitsKurus
}) {
  const annualRegularBenefitsMonthlyKurus = Math.round(annualRegularBenefitsKurus / 12);
  return Object.freeze({
    annualRegularBenefitsMonthlyKurus,
    dressedGrossKurus:
      baseGrossKurus
      + mealKurus
      + transportKurus
      + regularOtherKurus
      + annualRegularBenefitsMonthlyKurus
  });
}

export function getServiceDuration(startIso, endIso) {
  const start = parseIsoDate(startIso, 'İşe giriş tarihi');
  const end = parseIsoDate(endIso, 'İşten ayrılma tarihi');
  if (end <= start) throw new RangeError('İşten ayrılma tarihi işe giriş tarihinden sonra olmalıdır.');

  let years = 0;
  let cursor = start;
  while (addYears(cursor, 1) <= end) {
    cursor = addYears(cursor, 1);
    years += 1;
  }

  let months = 0;
  while (addMonths(cursor, 1) <= end) {
    cursor = addMonths(cursor, 1);
    months += 1;
  }

  const days = Math.round((end - cursor) / DAY_MS);
  const totalDays = Math.round((end - start) / DAY_MS);
  return Object.freeze({ years, months, days, totalDays });
}

export function get2026SeveranceCeilingKurus(endIso) {
  const end = parseIsoDate(endIso, 'İşten ayrılma tarihi');
  const year = end.getUTCFullYear();
  if (year !== 2026) {
    throw new RangeError('Bu hesaplayıcı kıdem tazminatı tavanını yalnız 2026 fesih tarihleri için doğrular.');
  }
  return end < new Date(Date.UTC(2026, 6, 1))
    ? DATA_2026.publishedData.severanceCeiling.firstHalfKurus
    : DATA_2026.publishedData.severanceCeiling.secondHalfKurus;
}

export function get2026MonthlyTaxExemptionCaps(endIso) {
  const end = parseIsoDate(endIso, 'İşten ayrılma tarihi');
  if (end.getUTCFullYear() !== 2026) {
    throw new RangeError('Asgari ücret vergi istisnası yalnız 2026 fesih tarihleri için hesaplanır.');
  }

  const payroll = DATA_2026.payroll;
  const minimumIncomeTaxBaseKurus =
    payroll.minimumGrossKurus
    - multiplyRateRoundedKurus(payroll.minimumGrossKurus, payroll.employeeRatesPpm.sgk)
    - multiplyRateRoundedKurus(payroll.minimumGrossKurus, payroll.employeeRatesPpm.unemployment);
  const monthNumber = end.getUTCMonth() + 1;
  const cumulativeMinimumIncomeTaxBaseKurus = minimumIncomeTaxBaseKurus * monthNumber;
  const incomeTaxKurus = calculateProgressiveTaxKurus(
    cumulativeMinimumIncomeTaxBaseKurus,
    minimumIncomeTaxBaseKurus
  );
  const stampTaxKurus = multiplyRateRoundedKurus(
    payroll.minimumGrossKurus,
    payroll.stampTaxRatePpm
  );

  return Object.freeze({
    monthNumber,
    incomeTaxKurus,
    stampTaxKurus
  });
}

export function getNoticePeriod(startIso, endIso) {
  const start = parseIsoDate(startIso, 'İşe giriş tarihi');
  const end = parseIsoDate(endIso, 'İşten ayrılma tarihi');
  if (end <= start) throw new RangeError('İşten ayrılma tarihi işe giriş tarihinden sonra olmalıdır.');

  let weeks;
  if (end < addMonths(start, 6)) weeks = 2;
  else if (end < addMonths(start, 18)) weeks = 4;
  else if (end <= addYears(start, 3)) weeks = 6;
  else weeks = 8;

  return Object.freeze({ weeks, days: weeks * 7 });
}

export function calculateSeverance({
  startIso,
  endIso,
  baseGrossKurus,
  mealKurus = 0,
  transportKurus = 0,
  regularOtherKurus = 0,
  annualRegularBenefitsKurus = 0,
  remainingStampTaxExemptionKurus = 0
}) {
  for (const [name, value] of Object.entries({
    baseGrossKurus,
    mealKurus,
    transportKurus,
    regularOtherKurus,
    annualRegularBenefitsKurus,
    remainingStampTaxExemptionKurus
  })) {
    assertKurus(value, name);
  }

  const duration = getServiceDuration(startIso, endIso);
  const ceilingKurus = get2026SeveranceCeilingKurus(endIso);
  const taxExemptionCaps = get2026MonthlyTaxExemptionCaps(endIso);
  const { dressedGrossKurus, annualRegularBenefitsMonthlyKurus } = buildDressedGross({
    baseGrossKurus,
    mealKurus,
    transportKurus,
    regularOtherKurus,
    annualRegularBenefitsKurus
  });
  const basisKurus = Math.min(dressedGrossKurus, ceilingKurus);
  const eligibleByDuration = duration.totalDays >= 365;

  // Yargıtay uygulamasına göre kıdem yılı 365 gündür. Takvim aylarını 1/12
  // olarak varsaymak yerine fiilen geçen toplam takvim günü 365'e oranlanır.
  const serviceFactor = duration.totalDays / 365;
  const grossKurus = eligibleByDuration
    ? Math.round(basisKurus * serviceFactor)
    : 0;

  const calculatedStampTaxKurus = multiplyRateRoundedKurus(grossKurus, DATA_2026.payroll.stampTaxRatePpm);
  const stampTaxExemptionAppliedKurus = Math.min(
    remainingStampTaxExemptionKurus,
    taxExemptionCaps.stampTaxKurus,
    calculatedStampTaxKurus
  );
  const stampTaxKurus = calculatedStampTaxKurus - stampTaxExemptionAppliedKurus;
  const netKurus = grossKurus - stampTaxKurus;

  return Object.freeze({
    duration,
    serviceFactor,
    eligibleByDuration,
    baseGrossKurus,
    mealKurus,
    transportKurus,
    regularOtherKurus,
    annualRegularBenefitsKurus,
    annualRegularBenefitsMonthlyKurus,
    dressedGrossKurus,
    ceilingKurus,
    basisKurus,
    grossKurus,
    calculatedStampTaxKurus,
    stampTaxExemptionCapKurus: taxExemptionCaps.stampTaxKurus,
    stampTaxExemptionAppliedKurus,
    stampTaxKurus,
    incomeTaxKurus: 0,
    sgkKurus: 0,
    netKurus,
    ceilingApplied: dressedGrossKurus > ceilingKurus
  });
}

export function calculateNotice({
  startIso,
  endIso,
  baseGrossKurus,
  mealKurus = 0,
  transportKurus = 0,
  regularOtherKurus = 0,
  annualRegularBenefitsKurus = 0,
  previousCumulativeTaxBaseKurus = 0,
  remainingIncomeTaxExemptionKurus = 0,
  remainingStampTaxExemptionKurus = 0
}) {
  for (const [name, value] of Object.entries({
    baseGrossKurus,
    mealKurus,
    transportKurus,
    regularOtherKurus,
    annualRegularBenefitsKurus,
    previousCumulativeTaxBaseKurus,
    remainingIncomeTaxExemptionKurus,
    remainingStampTaxExemptionKurus
  })) {
    assertKurus(value, name);
  }

  const duration = getServiceDuration(startIso, endIso);
  const noticePeriod = getNoticePeriod(startIso, endIso);
  const taxExemptionCaps = get2026MonthlyTaxExemptionCaps(endIso);
  const { dressedGrossKurus, annualRegularBenefitsMonthlyKurus } = buildDressedGross({
    baseGrossKurus,
    mealKurus,
    transportKurus,
    regularOtherKurus,
    annualRegularBenefitsKurus
  });
  const grossKurus = Math.round((dressedGrossKurus * noticePeriod.days) / 30);
  const cumulativeAfterKurus = previousCumulativeTaxBaseKurus + grossKurus;
  const calculatedIncomeTaxKurus = calculateProgressiveTaxKurus(cumulativeAfterKurus, grossKurus);
  const incomeTaxRatesPpm = getApplicableIncomeTaxRatesPpm(cumulativeAfterKurus, grossKurus);
  const incomeTaxExemptionAppliedKurus = Math.min(
    remainingIncomeTaxExemptionKurus,
    taxExemptionCaps.incomeTaxKurus,
    calculatedIncomeTaxKurus
  );
  const incomeTaxKurus = calculatedIncomeTaxKurus - incomeTaxExemptionAppliedKurus;
  const calculatedStampTaxKurus = multiplyRateRoundedKurus(grossKurus, DATA_2026.payroll.stampTaxRatePpm);
  const stampTaxExemptionAppliedKurus = Math.min(
    remainingStampTaxExemptionKurus,
    taxExemptionCaps.stampTaxKurus,
    calculatedStampTaxKurus
  );
  const stampTaxKurus = calculatedStampTaxKurus - stampTaxExemptionAppliedKurus;
  const netKurus = grossKurus - incomeTaxKurus - stampTaxKurus;

  return Object.freeze({
    duration,
    noticePeriod,
    baseGrossKurus,
    mealKurus,
    transportKurus,
    regularOtherKurus,
    annualRegularBenefitsKurus,
    annualRegularBenefitsMonthlyKurus,
    dressedGrossKurus,
    grossKurus,
    previousCumulativeTaxBaseKurus,
    cumulativeAfterKurus,
    incomeTaxRatesPpm,
    calculatedIncomeTaxKurus,
    incomeTaxExemptionCapKurus: taxExemptionCaps.incomeTaxKurus,
    incomeTaxExemptionAppliedKurus,
    incomeTaxKurus,
    calculatedStampTaxKurus,
    stampTaxExemptionCapKurus: taxExemptionCaps.stampTaxKurus,
    stampTaxExemptionAppliedKurus,
    stampTaxKurus,
    sgkKurus: 0,
    netKurus
  });
}

export function calculateTerminationPackage(input) {
  const remainingStampTaxExemptionKurus = input.remainingStampTaxExemptionKurus ?? 0;
  assertKurus(remainingStampTaxExemptionKurus, 'remainingStampTaxExemptionKurus');

  const stampTaxExemptionCapKurus = get2026MonthlyTaxExemptionCaps(input.endIso).stampTaxKurus;
  const packageStampTaxExemptionKurus = Math.min(
    remainingStampTaxExemptionKurus,
    stampTaxExemptionCapKurus
  );
  const severance = calculateSeverance({
    ...input,
    remainingStampTaxExemptionKurus: packageStampTaxExemptionKurus
  });
  const notice = calculateNotice({
    ...input,
    remainingStampTaxExemptionKurus: Math.max(
      0,
      packageStampTaxExemptionKurus - severance.stampTaxExemptionAppliedKurus
    )
  });
  return Object.freeze({
    severance,
    notice,
    grossTotalKurus: severance.grossKurus + notice.grossKurus,
    netTotalKurus: severance.netKurus + notice.netKurus
  });
}

export function terminationEngineVersion() {
  return Object.freeze({
    year: 2026,
    reviewedAt: DATA_2026.checkedAt,
    severanceCeilingPeriod: DATA_2026.publishedData.severanceCeiling.currentPeriod,
    severanceCeilingKurus: DATA_2026.publishedData.severanceCeiling.currentKurus,
    stampTaxRatePpm: DATA_2026.payroll.stampTaxRatePpm,
    sourceKeys: Object.freeze(['severance', 'sgk', 'incomeTax', 'stampTax', 'minimumWageTaxExemption'])
  });
}

export const _internal = Object.freeze({ iso });
