import { DATA_2026 } from './data-2026.js';
import { multiplyRateRoundedKurus } from './payroll-engine.js';

function assertInteger(value, fieldName, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new TypeError(`${fieldName} ${min} ile ${max} arasında bir tamsayı olmalıdır.`);
  }
}

export function calculateMinimumWage2026({ months = 1 } = {}) {
  assertInteger(months, 'Ay sayısı', { min: 1, max: 12 });
  const payroll = DATA_2026.payroll;
  const monthlyGrossKurus = payroll.minimumGrossKurus;
  const employeeSgkKurus = multiplyRateRoundedKurus(monthlyGrossKurus, payroll.employeeRatesPpm.sgk);
  const employeeUnemploymentKurus = multiplyRateRoundedKurus(monthlyGrossKurus, payroll.employeeRatesPpm.unemployment);
  const incomeTaxBaseKurus = monthlyGrossKurus - employeeSgkKurus - employeeUnemploymentKurus;
  const monthlyNetKurus = monthlyGrossKurus - employeeSgkKurus - employeeUnemploymentKurus;

  if (monthlyNetKurus !== payroll.referenceMinimumNetKurus) {
    throw new Error('2026 resmî net asgari ücret referansı ile hesap motoru eşleşmiyor.');
  }

  return Object.freeze({
    year: 2026,
    months,
    monthlyGrossKurus,
    employeeSgkKurus,
    employeeUnemploymentKurus,
    incomeTaxBaseKurus,
    incomeTaxKurus: 0,
    stampTaxKurus: 0,
    monthlyNetKurus,
    dailyGrossKurus: Math.round(monthlyGrossKurus / 30),
    dailyNetKurus: Math.round(monthlyNetKurus / 30),
    hourlyGrossKurus: Math.round(monthlyGrossKurus / 225),
    hourlyNetKurus: Math.round(monthlyNetKurus / 225),
    periodGrossKurus: monthlyGrossKurus * months,
    periodNetKurus: monthlyNetKurus * months,
    periodEmployeeSgkKurus: employeeSgkKurus * months,
    periodEmployeeUnemploymentKurus: employeeUnemploymentKurus * months
  });
}

export function minimumWageEngineVersion() {
  return Object.freeze({
    year: DATA_2026.year,
    reviewedAt: DATA_2026.checkedAt,
    monthlyGrossKurus: DATA_2026.payroll.minimumGrossKurus,
    referenceMinimumNetKurus: DATA_2026.payroll.referenceMinimumNetKurus,
    sourceKeys: Object.freeze(['minimumWage', 'minimumWageTaxExemption', 'sgk'])
  });
}
