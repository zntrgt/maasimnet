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

export function getNoticePeriod(startIso, endIso) {
  const start = parseIsoDate(startIso, 'İşe giriş tarihi');
  const end = parseIsoDate(endIso, 'İşten ayrılma tarihi');
  if (end <= start) throw new RangeError('İşten ayrılma tarihi işe giriş tarihinden sonra olmalıdır.');

  let weeks;
  if (end < addMonths(start, 6)) weeks = 2;
  else if (end < addMonths(start, 18)) weeks = 4;
  else if (end < addYears(start, 3)) weeks = 6;
  else weeks = 8;

  return Object.freeze({ weeks, days: weeks * 7 });
}

export function calculateSeverance({
  startIso,
  endIso,
  baseGrossKurus,
  mealKurus = 0,
  transportKurus = 0,
  regularOtherKurus = 0
}) {
  for (const [name, value] of Object.entries({ baseGrossKurus, mealKurus, transportKurus, regularOtherKurus })) {
    assertKurus(value, name);
  }

  const duration = getServiceDuration(startIso, endIso);
  const ceilingKurus = get2026SeveranceCeilingKurus(endIso);
  const dressedGrossKurus = baseGrossKurus + mealKurus + transportKurus + regularOtherKurus;
  const basisKurus = Math.min(dressedGrossKurus, ceilingKurus);
  const eligibleByDuration = duration.years >= 1;

  const grossKurus = eligibleByDuration
    ? Math.round(
      basisKurus * duration.years
      + (basisKurus * duration.months) / 12
      + (basisKurus * duration.days) / 365
    )
    : 0;

  const stampTaxKurus = multiplyRateRoundedKurus(grossKurus, DATA_2026.payroll.stampTaxRatePpm);
  const netKurus = grossKurus - stampTaxKurus;

  return Object.freeze({
    duration,
    eligibleByDuration,
    dressedGrossKurus,
    ceilingKurus,
    basisKurus,
    grossKurus,
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
  previousCumulativeTaxBaseKurus = 0
}) {
  for (const [name, value] of Object.entries({ baseGrossKurus, mealKurus, transportKurus, regularOtherKurus, previousCumulativeTaxBaseKurus })) {
    assertKurus(value, name);
  }

  const duration = getServiceDuration(startIso, endIso);
  const noticePeriod = getNoticePeriod(startIso, endIso);
  const dressedGrossKurus = baseGrossKurus + mealKurus + transportKurus + regularOtherKurus;
  const grossKurus = Math.round((dressedGrossKurus * noticePeriod.days) / 30);
  const cumulativeAfterKurus = previousCumulativeTaxBaseKurus + grossKurus;
  const incomeTaxKurus = calculateProgressiveTaxKurus(cumulativeAfterKurus, grossKurus);
  const incomeTaxRatesPpm = getApplicableIncomeTaxRatesPpm(cumulativeAfterKurus, grossKurus);
  const stampTaxKurus = multiplyRateRoundedKurus(grossKurus, DATA_2026.payroll.stampTaxRatePpm);
  const netKurus = grossKurus - incomeTaxKurus - stampTaxKurus;

  return Object.freeze({
    duration,
    noticePeriod,
    dressedGrossKurus,
    grossKurus,
    previousCumulativeTaxBaseKurus,
    cumulativeAfterKurus,
    incomeTaxRatesPpm,
    incomeTaxKurus,
    stampTaxKurus,
    sgkKurus: 0,
    netKurus
  });
}

export function calculateTerminationPackage(input) {
  const severance = calculateSeverance(input);
  const notice = calculateNotice(input);
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
    sourceKeys: Object.freeze(['severance', 'sgk', 'incomeTax'])
  });
}

export const _internal = Object.freeze({ iso });
