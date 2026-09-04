import { DATA_2026 } from './data-2026.js';
import {
  calculateProgressiveTaxKurus,
  getApplicableIncomeTaxRatesPpm,
  multiplyRateRoundedKurus
} from './payroll-engine.js';

function assertSafeKurus(value, fieldName) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new TypeError(`${fieldName} sıfır veya pozitif güvenli bir kuruş tamsayısı olmalıdır.`);
  }
}

function assertInteger(value, fieldName, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new TypeError(`${fieldName} ${min} ile ${max} arasında bir tamsayı olmalıdır.`);
  }
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
  premiumDays,
  retired,
  disabilityDegree
}) {
  const payroll = DATA_2026.payroll;
  const disabilityDeductionKurus = payroll.disabilityDeductionKurus[disabilityDegree];
  if (disabilityDeductionKurus === undefined) throw new RangeError('Geçersiz engellilik derecesi.');

  const dailyCeilingKurus = DATA_2026.publishedData.sgkCeiling.dailyKurus;
  const periodCeilingKurus = dailyCeilingKurus * premiumDays;
  const sgkBaseKurus = Math.min(grossKurus, periodCeilingKurus);
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
    premiumDays,
    periodCeilingKurus,
    sgkBaseKurus,
    employeeSocialKurus,
    employeeUnemploymentKurus,
    incomeTaxBaseKurus,
    cumulativeTaxBaseKurus,
    calculatedIncomeTaxKurus,
    payableIncomeTaxKurus,
    calculatedStampTaxKurus,
    payableStampTaxKurus,
    incomeTaxRatesPpm,
    netKurus: grossKurus - totalEmployeeDeductionsKurus
  });
}

export function calculateAnnualLeavePay({
  lastMonthlyGrossKurus,
  unusedLeaveDays,
  terminationMonthGrossKurus = 0,
  terminationMonthPremiumDays = 30,
  monthNumber,
  previousCumulativeTaxBaseKurus = 0,
  retired = false,
  disabilityDegree = 0
}) {
  assertSafeKurus(lastMonthlyGrossKurus, 'Son aylık brüt ücret');
  if (lastMonthlyGrossKurus === 0) throw new RangeError('Son aylık brüt ücret sıfırdan büyük olmalıdır.');
  assertInteger(unusedLeaveDays, 'Kullanılmayan izin günü', { min: 1, max: 3650 });
  assertSafeKurus(terminationMonthGrossKurus, 'Fesih ayındaki diğer brüt ücret');
  assertInteger(terminationMonthPremiumDays, 'Fesih ayı prim günü', { min: 1, max: 30 });
  assertInteger(monthNumber, 'Fesih ayı', { min: 1, max: 12 });
  assertSafeKurus(previousCumulativeTaxBaseKurus, 'Önceki kümülatif vergi matrahı');
  assertInteger(disabilityDegree, 'Engellilik derecesi', { min: 0, max: 3 });

  const dailyGrossKurus = Math.round(lastMonthlyGrossKurus / 30);
  const leaveGrossKurus = Math.round((lastMonthlyGrossKurus * unusedLeaveDays) / 30);

  const basePayroll = calculateEmployeePayroll({
    grossKurus: terminationMonthGrossKurus,
    monthNumber,
    previousCumulativeTaxBaseKurus,
    premiumDays: terminationMonthPremiumDays,
    retired,
    disabilityDegree
  });
  const withLeavePayroll = calculateEmployeePayroll({
    grossKurus: terminationMonthGrossKurus + leaveGrossKurus,
    monthNumber,
    previousCumulativeTaxBaseKurus,
    premiumDays: terminationMonthPremiumDays,
    retired,
    disabilityDegree
  });

  const incrementalSocialKurus = withLeavePayroll.employeeSocialKurus - basePayroll.employeeSocialKurus;
  const incrementalUnemploymentKurus = withLeavePayroll.employeeUnemploymentKurus - basePayroll.employeeUnemploymentKurus;
  const incrementalIncomeTaxKurus = withLeavePayroll.payableIncomeTaxKurus - basePayroll.payableIncomeTaxKurus;
  const incrementalStampTaxKurus = withLeavePayroll.payableStampTaxKurus - basePayroll.payableStampTaxKurus;
  const incrementalDeductionsKurus = incrementalSocialKurus + incrementalUnemploymentKurus + incrementalIncomeTaxKurus + incrementalStampTaxKurus;
  const leaveNetKurus = withLeavePayroll.netKurus - basePayroll.netKurus;

  return Object.freeze({
    lastMonthlyGrossKurus,
    unusedLeaveDays,
    dailyGrossKurus,
    leaveGrossKurus,
    terminationMonthGrossKurus,
    terminationMonthPremiumDays,
    basePayroll,
    withLeavePayroll,
    incrementalSocialKurus,
    incrementalUnemploymentKurus,
    incrementalIncomeTaxKurus,
    incrementalStampTaxKurus,
    incrementalDeductionsKurus,
    leaveNetKurus,
    incomeTaxRatesPpm: withLeavePayroll.incomeTaxRatesPpm,
    sgkCeilingKurus: withLeavePayroll.periodCeilingKurus
  });
}

export function annualLeaveEngineVersion() {
  return Object.freeze({
    year: DATA_2026.year,
    reviewedAt: DATA_2026.checkedAt,
    divisorDays: 30,
    sourceKeys: Object.freeze(['annualLeave', 'incomeTax', 'minimumWageTaxExemption', 'stampTax', 'sgk'])
  });
}
