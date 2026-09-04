import { DATA_2026 } from './data-2026.js';
import {
  calculateProgressiveTaxKurus,
  getApplicableIncomeTaxRatesPpm,
  multiplyRateRoundedKurus
} from './payroll-engine.js';

const ONE_MILLION = 1_000_000;

function assertKurus(value, fieldName) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new TypeError(`${fieldName} sıfır veya pozitif güvenli bir kuruş tamsayısı olmalıdır.`);
  }
}

function assertInteger(value, fieldName, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new TypeError(`${fieldName} ${min} ile ${max} arasında bir tamsayı olmalıdır.`);
  }
}

function assertHalfHourMinutes(value, fieldName) {
  assertInteger(value, fieldName, { min: 0, max: 60_000 });
  if (value % 30 !== 0) throw new RangeError(`${fieldName} 30 dakikalık adımlarla girilmelidir.`);
}

function getMinimumWageTaxExemptions(monthNumber) {
  const payroll = DATA_2026.payroll;
  const minimumIncomeTaxBaseKurus =
    payroll.minimumGrossKurus
    - multiplyRateRoundedKurus(payroll.minimumGrossKurus, payroll.employeeRatesPpm.sgk)
    - multiplyRateRoundedKurus(payroll.minimumGrossKurus, payroll.employeeRatesPpm.unemployment);
  const cumulativeMinimumIncomeTaxBaseKurus = minimumIncomeTaxBaseKurus * monthNumber;
  return Object.freeze({
    incomeTaxKurus: calculateProgressiveTaxKurus(
      cumulativeMinimumIncomeTaxBaseKurus,
      minimumIncomeTaxBaseKurus
    ),
    stampTaxKurus: multiplyRateRoundedKurus(payroll.minimumGrossKurus, payroll.stampTaxRatePpm)
  });
}

function calculateEmployeePayroll({
  grossKurus,
  monthNumber,
  previousCumulativeTaxBaseKurus,
  retired,
  disabilityDegree
}) {
  const payroll = DATA_2026.payroll;
  const disabilityDeductionKurus = payroll.disabilityDeductionKurus[disabilityDegree];
  if (disabilityDeductionKurus === undefined) throw new RangeError('Geçersiz engellilik derecesi.');

  const sgkBaseKurus = Math.min(grossKurus, payroll.sgkCeilingKurus);
  const employeeSocialKurus = multiplyRateRoundedKurus(
    sgkBaseKurus,
    retired ? payroll.employeeRatesPpm.retiredSgdp : payroll.employeeRatesPpm.sgk
  );
  const employeeUnemploymentKurus = retired
    ? 0
    : multiplyRateRoundedKurus(sgkBaseKurus, payroll.employeeRatesPpm.unemployment);
  const incomeTaxBaseKurus = Math.max(
    0,
    grossKurus - employeeSocialKurus - employeeUnemploymentKurus - disabilityDeductionKurus
  );
  const cumulativeTaxBaseKurus = previousCumulativeTaxBaseKurus + incomeTaxBaseKurus;
  const calculatedIncomeTaxKurus = calculateProgressiveTaxKurus(
    cumulativeTaxBaseKurus,
    incomeTaxBaseKurus
  );
  const incomeTaxRatesPpm = getApplicableIncomeTaxRatesPpm(
    cumulativeTaxBaseKurus,
    incomeTaxBaseKurus
  );
  const exemptions = getMinimumWageTaxExemptions(monthNumber);
  const payableIncomeTaxKurus = Math.max(0, calculatedIncomeTaxKurus - exemptions.incomeTaxKurus);
  const calculatedStampTaxKurus = multiplyRateRoundedKurus(grossKurus, payroll.stampTaxRatePpm);
  const payableStampTaxKurus = Math.max(0, calculatedStampTaxKurus - exemptions.stampTaxKurus);
  const totalEmployeeDeductionsKurus = employeeSocialKurus + employeeUnemploymentKurus + payableIncomeTaxKurus + payableStampTaxKurus;

  return Object.freeze({
    grossKurus,
    sgkBaseKurus,
    employeeSocialKurus,
    employeeUnemploymentKurus,
    incomeTaxBaseKurus,
    cumulativeTaxBaseKurus,
    calculatedIncomeTaxKurus,
    incomeTaxRatesPpm,
    minimumWageIncomeTaxExemptionKurus: exemptions.incomeTaxKurus,
    payableIncomeTaxKurus,
    calculatedStampTaxKurus,
    minimumWageStampTaxExemptionKurus: exemptions.stampTaxKurus,
    payableStampTaxKurus,
    totalEmployeeDeductionsKurus,
    netKurus: grossKurus - totalEmployeeDeductionsKurus
  });
}

function calculateGrossComponent({ monthlyGrossKurus, hourlyGrossOverrideKurus, minutes, ratePpm }) {
  if (minutes === 0) return 0;
  if (hourlyGrossOverrideKurus > 0) {
    return Math.round((hourlyGrossOverrideKurus * minutes * ratePpm) / (60 * ONE_MILLION));
  }
  return Math.round(
    (monthlyGrossKurus * minutes * ratePpm)
    / (DATA_2026.publishedData.overtime.standardMonthlyHours * 60 * ONE_MILLION)
  );
}

export function calculateOvertimePay({
  monthlyGrossKurus,
  overtime50Minutes = 0,
  extraTime25Minutes = 0,
  hourlyGrossOverrideKurus = 0,
  monthNumber,
  previousCumulativeTaxBaseKurus = 0,
  retired = false,
  disabilityDegree = 0,
  overtime50MinutesYearToDate = 0
}) {
  assertKurus(monthlyGrossKurus, 'Aylık brüt ücret');
  if (monthlyGrossKurus === 0) throw new RangeError('Aylık brüt ücret sıfırdan büyük olmalıdır.');
  assertKurus(hourlyGrossOverrideKurus, 'Saatlik brüt ücret');
  assertKurus(previousCumulativeTaxBaseKurus, 'Önceki kümülatif vergi matrahı');
  assertHalfHourMinutes(overtime50Minutes, '%50 fazla çalışma süresi');
  assertHalfHourMinutes(extraTime25Minutes, '%25 fazla sürelerle çalışma süresi');
  assertHalfHourMinutes(overtime50MinutesYearToDate, 'Yıl içindeki önceki fazla çalışma süresi');
  assertInteger(monthNumber, 'Ödeme ayı', { min: 1, max: 12 });
  assertInteger(disabilityDegree, 'Engellilik derecesi', { min: 0, max: 3 });

  if (overtime50Minutes === 0 && extraTime25Minutes === 0) {
    throw new RangeError('En az bir fazla çalışma süresi girilmelidir.');
  }

  const overtime = DATA_2026.publishedData.overtime;
  const regularHourlyGrossKurus = hourlyGrossOverrideKurus > 0
    ? hourlyGrossOverrideKurus
    : Math.round(monthlyGrossKurus / overtime.standardMonthlyHours);
  const overtime50GrossKurus = calculateGrossComponent({
    monthlyGrossKurus,
    hourlyGrossOverrideKurus,
    minutes: overtime50Minutes,
    ratePpm: overtime.overtimeRatePpm
  });
  const extraTime25GrossKurus = calculateGrossComponent({
    monthlyGrossKurus,
    hourlyGrossOverrideKurus,
    minutes: extraTime25Minutes,
    ratePpm: overtime.extraTimeRatePpm
  });
  const overtimeGrossKurus = overtime50GrossKurus + extraTime25GrossKurus;

  const basePayroll = calculateEmployeePayroll({
    grossKurus: monthlyGrossKurus,
    monthNumber,
    previousCumulativeTaxBaseKurus,
    retired,
    disabilityDegree
  });
  const withOvertimePayroll = calculateEmployeePayroll({
    grossKurus: monthlyGrossKurus + overtimeGrossKurus,
    monthNumber,
    previousCumulativeTaxBaseKurus,
    retired,
    disabilityDegree
  });

  const incrementalSocialKurus = withOvertimePayroll.employeeSocialKurus - basePayroll.employeeSocialKurus;
  const incrementalUnemploymentKurus = withOvertimePayroll.employeeUnemploymentKurus - basePayroll.employeeUnemploymentKurus;
  const incrementalIncomeTaxKurus = withOvertimePayroll.payableIncomeTaxKurus - basePayroll.payableIncomeTaxKurus;
  const incrementalStampTaxKurus = withOvertimePayroll.payableStampTaxKurus - basePayroll.payableStampTaxKurus;
  const incrementalDeductionsKurus = incrementalSocialKurus + incrementalUnemploymentKurus + incrementalIncomeTaxKurus + incrementalStampTaxKurus;
  const overtimeNetKurus = withOvertimePayroll.netKurus - basePayroll.netKurus;

  const annualLimitMinutes = overtime.annualOvertimeLimitMinutes;
  const overtime50MinutesAfter = overtime50MinutesYearToDate + overtime50Minutes;
  const annualLimitExceeded = overtime50MinutesAfter > annualLimitMinutes;
  const annualRemainingMinutes = Math.max(0, annualLimitMinutes - overtime50MinutesAfter);

  return Object.freeze({
    regularHourlyGrossKurus,
    hourlyGrossOverrideApplied: hourlyGrossOverrideKurus > 0,
    overtime50Minutes,
    extraTime25Minutes,
    overtime50GrossKurus,
    extraTime25GrossKurus,
    overtimeGrossKurus,
    basePayroll,
    withOvertimePayroll,
    incrementalSocialKurus,
    incrementalUnemploymentKurus,
    incrementalIncomeTaxKurus,
    incrementalStampTaxKurus,
    incrementalDeductionsKurus,
    overtimeNetKurus,
    incomeTaxRatesPpm: withOvertimePayroll.incomeTaxRatesPpm,
    overtime50MinutesYearToDate,
    overtime50MinutesAfter,
    annualLimitMinutes,
    annualLimitExceeded,
    annualRemainingMinutes,
    overtime50TimeOffMinutes: (overtime50Minutes * overtime.overtimeTimeOffRatePpm) / ONE_MILLION,
    extraTime25TimeOffMinutes: (extraTime25Minutes * overtime.extraTimeTimeOffRatePpm) / ONE_MILLION
  });
}

export function overtimeEngineVersion() {
  return Object.freeze({
    year: DATA_2026.year,
    reviewedAt: DATA_2026.checkedAt,
    standardMonthlyHours: DATA_2026.publishedData.overtime.standardMonthlyHours,
    overtimeRatePpm: DATA_2026.publishedData.overtime.overtimeRatePpm,
    extraTimeRatePpm: DATA_2026.publishedData.overtime.extraTimeRatePpm,
    annualOvertimeLimitMinutes: DATA_2026.publishedData.overtime.annualOvertimeLimitMinutes,
    sourceKeys: Object.freeze(['overtime', 'incomeTax', 'stampTax', 'sgk'])
  });
}
