import {
  calculateProgressiveTaxKurus,
  multiplyRateRoundedKurus
} from './payroll-engine.js';
import { PAYROLL_PARAMETERS_2026 } from './parameters-2026.js';

const ONE_MILLION = 1_000_000;
const DAILY_HOURS = 7.5;
const STANDARD_DAYS = 30;

function assertKurus(value, name) {
  if (!Number.isSafeInteger(value) || value < 0) throw new TypeError(`${name} sıfır veya pozitif güvenli bir kuruş tamsayısı olmalıdır.`);
}
function assertFinite(value, name) {
  if (!Number.isFinite(value) || value < 0) throw new TypeError(`${name} sıfır veya pozitif sonlu bir sayı olmalıdır.`);
}
function assertMonth(monthIndex) {
  if (!Number.isInteger(monthIndex) || monthIndex < 0 || monthIndex > 11) throw new RangeError('Ay 0 ile 11 arasında olmalıdır.');
}
function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }

export function get2026DailyPekLimits({ parameters = PAYROLL_PARAMETERS_2026 } = {}) {
  return Object.freeze({
    minimumDailyKurus: Math.round(parameters.minimumGrossKurus / STANDARD_DAYS),
    maximumDailyKurus: Math.round(parameters.sgkCeilingKurus / STANDARD_DAYS)
  });
}

function employeeContributionBase(grossKurus, sgkBaseKurus, retired, parameters) {
  assertKurus(grossKurus, 'grossKurus');
  assertKurus(sgkBaseKurus, 'sgkBaseKurus');
  const cappedBase = Math.min(sgkBaseKurus, parameters.sgkCeilingKurus);
  const employeeSgkOrSgdpKurus = multiplyRateRoundedKurus(
    cappedBase,
    retired ? parameters.employeeRatesPpm.retiredSgdp : parameters.employeeRatesPpm.sgk
  );
  const employeeUnemploymentKurus = retired
    ? 0
    : multiplyRateRoundedKurus(cappedBase, parameters.employeeRatesPpm.unemployment);
  const incomeTaxBaseKurus = Math.max(0, grossKurus - employeeSgkOrSgdpKurus - employeeUnemploymentKurus);
  return { cappedBase, employeeSgkOrSgdpKurus, employeeUnemploymentKurus, incomeTaxBaseKurus };
}

export function calculate2026MonthlyNet({
  grossKurus,
  sgkBaseKurus = grossKurus,
  monthIndex = 0,
  previousCumulativeTaxBaseKurus,
  retired = false,
  parameters = PAYROLL_PARAMETERS_2026
}) {
  assertMonth(monthIndex);
  assertKurus(grossKurus, 'grossKurus');
  assertKurus(sgkBaseKurus, 'sgkBaseKurus');
  if (previousCumulativeTaxBaseKurus !== undefined) assertKurus(previousCumulativeTaxBaseKurus, 'previousCumulativeTaxBaseKurus');

  const contribution = employeeContributionBase(grossKurus, sgkBaseKurus, retired, parameters);
  const previousBase = previousCumulativeTaxBaseKurus ?? contribution.incomeTaxBaseKurus * monthIndex;
  const cumulativeTaxBaseKurus = previousBase + contribution.incomeTaxBaseKurus;
  const calculatedIncomeTaxKurus = calculateProgressiveTaxKurus(
    cumulativeTaxBaseKurus,
    contribution.incomeTaxBaseKurus,
    { parameters }
  );

  const minimumContribution = employeeContributionBase(
    parameters.minimumGrossKurus,
    parameters.minimumGrossKurus,
    false,
    parameters
  );
  const minimumCumulativeKurus = minimumContribution.incomeTaxBaseKurus * (monthIndex + 1);
  const minimumWageIncomeTaxExemptionKurus = calculateProgressiveTaxKurus(
    minimumCumulativeKurus,
    minimumContribution.incomeTaxBaseKurus,
    { parameters }
  );
  const payableIncomeTaxKurus = Math.max(0, calculatedIncomeTaxKurus - minimumWageIncomeTaxExemptionKurus);

  const calculatedStampTaxKurus = multiplyRateRoundedKurus(grossKurus, parameters.stampTaxRatePpm);
  const minimumWageStampTaxExemptionKurus = multiplyRateRoundedKurus(parameters.minimumGrossKurus, parameters.stampTaxRatePpm);
  const payableStampTaxKurus = Math.max(0, calculatedStampTaxKurus - minimumWageStampTaxExemptionKurus);

  const totalEmployeeDeductionsKurus = contribution.employeeSgkOrSgdpKurus
    + contribution.employeeUnemploymentKurus
    + payableIncomeTaxKurus
    + payableStampTaxKurus;

  return Object.freeze({
    grossKurus,
    sgkBaseKurus: contribution.cappedBase,
    employeeSgkKurus: retired ? 0 : contribution.employeeSgkOrSgdpKurus,
    employeeSgdpKurus: retired ? contribution.employeeSgkOrSgdpKurus : 0,
    employeeUnemploymentKurus: contribution.employeeUnemploymentKurus,
    incomeTaxBaseKurus: contribution.incomeTaxBaseKurus,
    previousCumulativeTaxBaseKurus: previousBase,
    cumulativeTaxBaseKurus,
    calculatedIncomeTaxKurus,
    minimumWageIncomeTaxExemptionKurus,
    payableIncomeTaxKurus,
    payableStampTaxKurus,
    totalEmployeeDeductionsKurus,
    netKurus: grossKurus - totalEmployeeDeductionsKurus
  });
}

export function calculateIncrementalMonthlyPay({
  baseGrossKurus,
  extraGrossKurus,
  monthIndex = 0,
  previousCumulativeTaxBaseKurus,
  retired = false,
  parameters = PAYROLL_PARAMETERS_2026
}) {
  assertKurus(baseGrossKurus, 'baseGrossKurus');
  assertKurus(extraGrossKurus, 'extraGrossKurus');
  assertMonth(monthIndex);

  const baseContribution = employeeContributionBase(
    baseGrossKurus,
    Math.min(baseGrossKurus, parameters.sgkCeilingKurus),
    retired,
    parameters
  );
  const previousBase = previousCumulativeTaxBaseKurus ?? baseContribution.incomeTaxBaseKurus * monthIndex;
  const base = calculate2026MonthlyNet({
    grossKurus: baseGrossKurus,
    sgkBaseKurus: Math.min(baseGrossKurus, parameters.sgkCeilingKurus),
    monthIndex,
    previousCumulativeTaxBaseKurus: previousBase,
    retired,
    parameters
  });
  const grossWithExtraKurus = baseGrossKurus + extraGrossKurus;
  const withExtra = calculate2026MonthlyNet({
    grossKurus: grossWithExtraKurus,
    sgkBaseKurus: Math.min(grossWithExtraKurus, parameters.sgkCeilingKurus),
    monthIndex,
    previousCumulativeTaxBaseKurus: previousBase,
    retired,
    parameters
  });

  return Object.freeze({
    base,
    withExtra,
    extraGrossKurus,
    extraNetKurus: withExtra.netKurus - base.netKurus,
    grossWithExtraKurus,
    netWithExtraKurus: withExtra.netKurus
  });
}

export function calculatePublicHolidayPay({
  monthlyGrossKurus,
  halfDayUnitsWorked,
  monthIndex = 0,
  previousCumulativeTaxBaseKurus,
  retired = false,
  parameters = PAYROLL_PARAMETERS_2026
}) {
  assertKurus(monthlyGrossKurus, 'monthlyGrossKurus');
  if (!Number.isInteger(halfDayUnitsWorked) || halfDayUnitsWorked < 1 || halfDayUnitsWorked > 30) {
    throw new RangeError('Resmî tatil çalışması 0,5 günlük adımlarla 0,5 ile 15 gün arasında olmalıdır.');
  }
  const dailyGrossKurus = Math.round(monthlyGrossKurus / STANDARD_DAYS);
  const extraGrossKurus = Math.round((dailyGrossKurus * halfDayUnitsWorked) / 2);
  const payroll = calculateIncrementalMonthlyPay({
    baseGrossKurus: monthlyGrossKurus,
    extraGrossKurus,
    monthIndex,
    previousCumulativeTaxBaseKurus,
    retired,
    parameters
  });
  return Object.freeze({
    dailyGrossKurus,
    daysWorked: halfDayUnitsWorked / 2,
    ...payroll
  });
}

export function calculateWeeklyRestPay({
  monthlyGrossKurus,
  restDaysWorked,
  monthIndex = 0,
  previousCumulativeTaxBaseKurus,
  retired = false,
  parameters = PAYROLL_PARAMETERS_2026
}) {
  assertKurus(monthlyGrossKurus, 'monthlyGrossKurus');
  if (!Number.isInteger(restDaysWorked) || restDaysWorked < 1 || restDaysWorked > 6) {
    throw new RangeError('Hafta tatili çalışması 1 ile 6 gün arasında olmalıdır.');
  }
  const dailyGrossKurus = Math.round(monthlyGrossKurus / STANDARD_DAYS);
  const extraGrossKurus = Math.round(dailyGrossKurus * 1.5 * restDaysWorked);
  const payroll = calculateIncrementalMonthlyPay({
    baseGrossKurus: monthlyGrossKurus,
    extraGrossKurus,
    monthIndex,
    previousCumulativeTaxBaseKurus,
    retired,
    parameters
  });
  return Object.freeze({ dailyGrossKurus, restDaysWorked, multiplier: 1.5, ...payroll });
}

export function calculatePartTimePay({
  fullTimeEquivalentGrossKurus,
  weeklyHours,
  fullTimeWeeklyHours = 45,
  monthlyWorkedHours,
  monthIndex = 0,
  previousCumulativeTaxBaseKurus,
  retired = false,
  parameters = PAYROLL_PARAMETERS_2026
}) {
  assertKurus(fullTimeEquivalentGrossKurus, 'fullTimeEquivalentGrossKurus');
  assertFinite(weeklyHours, 'weeklyHours');
  assertFinite(fullTimeWeeklyHours, 'fullTimeWeeklyHours');
  assertFinite(monthlyWorkedHours, 'monthlyWorkedHours');
  if (weeklyHours <= 0 || fullTimeWeeklyHours <= 0 || weeklyHours > fullTimeWeeklyHours) throw new RangeError('Haftalık kısmi süre 0’dan büyük ve emsal tam süreyi aşmayacak şekilde girilmelidir.');
  if (monthlyWorkedHours <= 0 || monthlyWorkedHours > 225) throw new RangeError('Aylık toplam çalışma saati 0’dan büyük ve en fazla 225 olmalıdır.');

  const ratio = weeklyHours / fullTimeWeeklyHours;
  const grossKurus = Math.round(fullTimeEquivalentGrossKurus * ratio);
  const premiumDays = Math.min(30, Math.ceil(monthlyWorkedHours / DAILY_HOURS));
  const limits = get2026DailyPekLimits({ parameters });
  const pekFloorKurus = limits.minimumDailyKurus * premiumDays;
  const pekCeilingKurus = limits.maximumDailyKurus * premiumDays;
  const sgkBaseKurus = Math.min(grossKurus, pekCeilingKurus);
  const net = calculate2026MonthlyNet({
    grossKurus,
    sgkBaseKurus,
    monthIndex,
    previousCumulativeTaxBaseKurus,
    retired,
    parameters
  });

  return Object.freeze({
    ratio,
    grossKurus,
    premiumDays,
    monthlyWorkedHours,
    pekFloorKurus,
    pekCeilingKurus,
    belowPekFloor: grossKurus < pekFloorKurus,
    ...net
  });
}

export function calculatePartialMonthPay({
  normalMonthlyGrossKurus,
  paidDays,
  monthIndex = 0,
  previousCumulativeTaxBaseKurus,
  retired = false,
  parameters = PAYROLL_PARAMETERS_2026
}) {
  assertKurus(normalMonthlyGrossKurus, 'normalMonthlyGrossKurus');
  if (!Number.isInteger(paidDays) || paidDays < 1 || paidDays > 30) throw new RangeError('Ücret ödenen gün sayısı 1 ile 30 arasında olmalıdır.');
  assertMonth(monthIndex);

  const grossKurus = Math.round((normalMonthlyGrossKurus * paidDays) / STANDARD_DAYS);
  const limits = get2026DailyPekLimits({ parameters });
  const pekCeilingKurus = limits.maximumDailyKurus * paidDays;
  const sgkBaseKurus = Math.min(grossKurus, pekCeilingKurus);
  const normalContribution = employeeContributionBase(
    normalMonthlyGrossKurus,
    Math.min(normalMonthlyGrossKurus, parameters.sgkCeilingKurus),
    retired,
    parameters
  );
  const previousBase = previousCumulativeTaxBaseKurus ?? normalContribution.incomeTaxBaseKurus * monthIndex;
  const net = calculate2026MonthlyNet({
    grossKurus,
    sgkBaseKurus,
    monthIndex,
    previousCumulativeTaxBaseKurus: previousBase,
    retired,
    parameters
  });

  return Object.freeze({
    normalMonthlyGrossKurus,
    paidDays,
    missingDays: STANDARD_DAYS - paidDays,
    dailyGrossKurus: Math.round(normalMonthlyGrossKurus / STANDARD_DAYS),
    ...net
  });
}

export function calculateSgkPremium({
  pekKurus,
  premiumDays = 30,
  employerScheme = 'other',
  retired = false,
  parameters = PAYROLL_PARAMETERS_2026
}) {
  assertKurus(pekKurus, 'pekKurus');
  if (!Number.isInteger(premiumDays) || premiumDays < 1 || premiumDays > 30) throw new RangeError('Prim gün sayısı 1 ile 30 arasında olmalıdır.');
  const limits = get2026DailyPekLimits({ parameters });
  const minimumPekKurus = limits.minimumDailyKurus * premiumDays;
  const maximumPekKurus = limits.maximumDailyKurus * premiumDays;
  if (pekKurus < minimumPekKurus || pekKurus > maximumPekKurus) {
    throw new RangeError(`PEK, ${premiumDays} gün için 2026 alt ve üst sınırları arasında olmalıdır.`);
  }

  const employeeRate = retired ? parameters.employeeRatesPpm.retiredSgdp : parameters.employeeRatesPpm.sgk;
  const employerRate = retired ? parameters.employerRatesPpm.retiredSgdp : parameters.employerRatesPpm[employerScheme];
  if (employerRate === undefined) throw new RangeError('Geçersiz işveren prim seçeneği.');

  const employeeSgkOrSgdpKurus = multiplyRateRoundedKurus(pekKurus, employeeRate);
  const employeeUnemploymentKurus = retired ? 0 : multiplyRateRoundedKurus(pekKurus, parameters.employeeRatesPpm.unemployment);
  const employerSgkOrSgdpKurus = multiplyRateRoundedKurus(pekKurus, employerRate);
  const employerUnemploymentKurus = retired ? 0 : multiplyRateRoundedKurus(pekKurus, parameters.employerRatesPpm.unemployment);
  const employeeTotalKurus = employeeSgkOrSgdpKurus + employeeUnemploymentKurus;
  const employerTotalKurus = employerSgkOrSgdpKurus + employerUnemploymentKurus;

  return Object.freeze({
    pekKurus,
    premiumDays,
    minimumPekKurus,
    maximumPekKurus,
    employeeSgkKurus: retired ? 0 : employeeSgkOrSgdpKurus,
    employeeSgdpKurus: retired ? employeeSgkOrSgdpKurus : 0,
    employeeUnemploymentKurus,
    employerSgkOrSgdpKurus,
    employerUnemploymentKurus,
    employeeTotalKurus,
    employerTotalKurus,
    totalPremiumKurus: employeeTotalKurus + employerTotalKurus,
    employeeTotalRatePpm: retired ? parameters.employeeRatesPpm.retiredSgdp : parameters.employeeRatesPpm.sgk + parameters.employeeRatesPpm.unemployment,
    employerTotalRatePpm: retired ? parameters.employerRatesPpm.retiredSgdp : employerRate + parameters.employerRatesPpm.unemployment
  });
}

export const WORKTIME_CONSTANTS = Object.freeze({ DAILY_HOURS, STANDARD_DAYS, ONE_MILLION });
