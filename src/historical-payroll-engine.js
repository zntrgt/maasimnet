import {
  calculateProgressiveTaxKurus,
  getApplicableIncomeTaxRatesPpm,
  multiplyRateRoundedKurus
} from './payroll-engine.js';
import {
  getHistoricalAgiOption,
  getHistoricalPayrollData,
  getHistoricalPeriod
} from './historical-payroll-data.js';

const MONTHS = 12;
const EMPLOYEE_SGK_PPM = 140_000;
const EMPLOYEE_UNEMPLOYMENT_PPM = 10_000;
const STAMP_TAX_PPM = 7_590;
const FIRST_BRACKET_PPM = 150_000;

function assertKurus(value, name) {
  if (!Number.isSafeInteger(value) || value < 0) throw new TypeError(`${name} sıfır veya pozitif güvenli kuruş tamsayısı olmalıdır.`);
}
function assertMonthlyArray(values, name) {
  if (!Array.isArray(values) || values.length !== MONTHS) throw new TypeError(`${name} 12 aylık bir dizi olmalıdır.`);
  values.forEach((value,index) => assertKurus(value, `${name}[${index}]`));
}
function taxParameters(data) { return { incomeTaxBrackets: data.incomeTaxBrackets }; }

export function calculateHistoricalAgiKurus(year, agiOptionId = 'single') {
  const data = getHistoricalPayrollData(year);
  if (!data.agiEnabled) return 0;
  const option = getHistoricalAgiOption(agiOptionId);
  const januaryMinimumGrossKurus = data.periods[0].minimumGrossKurus;
  const agiBaseKurus = multiplyRateRoundedKurus(januaryMinimumGrossKurus, option.ratePpm);
  return multiplyRateRoundedKurus(agiBaseKurus, FIRST_BRACKET_PPM);
}

function calculateHistoricalMonth({
  year,
  monthIndex,
  grossKurus,
  previousCumulativeTaxBaseKurus,
  previousCumulativeMinimumTaxBaseKurus,
  agiOptionId = 'single'
}) {
  assertKurus(grossKurus, 'grossKurus');
  assertKurus(previousCumulativeTaxBaseKurus, 'previousCumulativeTaxBaseKurus');
  assertKurus(previousCumulativeMinimumTaxBaseKurus, 'previousCumulativeMinimumTaxBaseKurus');
  const data = getHistoricalPayrollData(year);
  const period = getHistoricalPeriod(year, monthIndex);
  const params = taxParameters(data);

  const sgkBaseKurus = Math.min(grossKurus, period.sgkCeilingKurus);
  const employeeSgkKurus = multiplyRateRoundedKurus(sgkBaseKurus, EMPLOYEE_SGK_PPM);
  const employeeUnemploymentKurus = multiplyRateRoundedKurus(sgkBaseKurus, EMPLOYEE_UNEMPLOYMENT_PPM);
  const incomeTaxBaseKurus = Math.max(0, grossKurus - employeeSgkKurus - employeeUnemploymentKurus);
  const cumulativeTaxBaseKurus = previousCumulativeTaxBaseKurus + incomeTaxBaseKurus;
  const calculatedIncomeTaxKurus = calculateProgressiveTaxKurus(cumulativeTaxBaseKurus, incomeTaxBaseKurus, { parameters: params });
  const incomeTaxRatesPpm = getApplicableIncomeTaxRatesPpm(cumulativeTaxBaseKurus, incomeTaxBaseKurus, { parameters: params });

  let minimumWageIncomeTaxExemptionKurus = 0;
  let minimumWageStampTaxExemptionKurus = 0;
  let agiKurus = 0;
  let supplementalAgiKurus = 0;
  let cumulativeMinimumTaxBaseKurus = previousCumulativeMinimumTaxBaseKurus;

  if (data.minimumWageTaxExemption) {
    const minSgk = multiplyRateRoundedKurus(period.minimumGrossKurus, EMPLOYEE_SGK_PPM);
    const minUnemployment = multiplyRateRoundedKurus(period.minimumGrossKurus, EMPLOYEE_UNEMPLOYMENT_PPM);
    const minimumTaxBaseKurus = period.minimumGrossKurus - minSgk - minUnemployment;
    cumulativeMinimumTaxBaseKurus += minimumTaxBaseKurus;
    minimumWageIncomeTaxExemptionKurus = calculateProgressiveTaxKurus(
      cumulativeMinimumTaxBaseKurus,
      minimumTaxBaseKurus,
      { parameters: params }
    );
    minimumWageStampTaxExemptionKurus = multiplyRateRoundedKurus(period.minimumGrossKurus, STAMP_TAX_PPM);
  } else if (data.agiEnabled) {
    agiKurus = Math.min(calculatedIncomeTaxKurus, calculateHistoricalAgiKurus(year, agiOptionId));
  }

  let payableIncomeTaxKurus = Math.max(0, calculatedIncomeTaxKurus - minimumWageIncomeTaxExemptionKurus - agiKurus);
  const calculatedStampTaxKurus = multiplyRateRoundedKurus(grossKurus, STAMP_TAX_PPM);
  const payableStampTaxKurus = Math.max(0, calculatedStampTaxKurus - minimumWageStampTaxExemptionKurus);
  let netKurus = grossKurus - employeeSgkKurus - employeeUnemploymentKurus - payableIncomeTaxKurus - payableStampTaxKurus;

  // 2020-2021'de gelir vergisi tarifesi nedeniyle asgari ücretlinin neti Ocak referansının altına
  // düştüğünde uygulanan ilave AGİ korumasını yalnız tam asgari ücret senaryosunda modeller.
  if (data.agiEnabled && grossKurus === period.minimumGrossKurus && netKurus < period.referenceMinimumNetKurus) {
    supplementalAgiKurus = Math.min(payableIncomeTaxKurus, period.referenceMinimumNetKurus - netKurus);
    payableIncomeTaxKurus -= supplementalAgiKurus;
    netKurus += supplementalAgiKurus;
  }

  const totalEmployeeDeductionsKurus = employeeSgkKurus + employeeUnemploymentKurus + payableIncomeTaxKurus + payableStampTaxKurus;
  return Object.freeze({
    year,
    month: monthIndex,
    grossKurus,
    minimumGrossKurus: period.minimumGrossKurus,
    sgkCeilingKurus: period.sgkCeilingKurus,
    sgkBaseKurus,
    employeeSgkKurus,
    employeeUnemploymentKurus,
    incomeTaxBaseKurus,
    cumulativeTaxBaseKurus,
    incomeTaxRatesPpm,
    calculatedIncomeTaxKurus,
    agiKurus,
    supplementalAgiKurus,
    minimumWageIncomeTaxExemptionKurus,
    calculatedStampTaxKurus,
    minimumWageStampTaxExemptionKurus,
    payableIncomeTaxKurus,
    payableStampTaxKurus,
    totalEmployeeDeductionsKurus,
    netKurus,
    cumulativeMinimumTaxBaseKurus
  });
}

export function calculateHistoricalPayrollYear({ year, grossKurusByMonth, agiOptionId = 'single' }) {
  assertMonthlyArray(grossKurusByMonth, 'grossKurusByMonth');
  const data = getHistoricalPayrollData(year);
  if (!data.agiEnabled && agiOptionId !== 'single') agiOptionId = 'single';
  let cumulativeTaxBaseKurus = 0;
  let cumulativeMinimumTaxBaseKurus = 0;
  const rows = [];
  for (let monthIndex = 0; monthIndex < MONTHS; monthIndex += 1) {
    const row = calculateHistoricalMonth({
      year,
      monthIndex,
      grossKurus: grossKurusByMonth[monthIndex],
      previousCumulativeTaxBaseKurus: cumulativeTaxBaseKurus,
      previousCumulativeMinimumTaxBaseKurus: cumulativeMinimumTaxBaseKurus,
      agiOptionId
    });
    rows.push(row);
    cumulativeTaxBaseKurus = row.cumulativeTaxBaseKurus;
    cumulativeMinimumTaxBaseKurus = row.cumulativeMinimumTaxBaseKurus;
  }
  return Object.freeze(rows);
}

export function solveHistoricalGrossForNet({ year, targetNetKurusByMonth, agiOptionId = 'single' }) {
  assertMonthlyArray(targetNetKurusByMonth, 'targetNetKurusByMonth');
  getHistoricalPayrollData(year);
  let cumulativeTaxBaseKurus = 0;
  let cumulativeMinimumTaxBaseKurus = 0;
  const grossKurusByMonth = [];
  const rows = [];
  const maxGrossKurus = 100_000_000_000;

  for (let monthIndex = 0; monthIndex < MONTHS; monthIndex += 1) {
    const targetNetKurus = targetNetKurusByMonth[monthIndex];
    let low = 0;
    let high = Math.max(targetNetKurus * 3, getHistoricalPeriod(year, monthIndex).minimumGrossKurus);
    const candidate = (grossKurus) => calculateHistoricalMonth({
      year,
      monthIndex,
      grossKurus,
      previousCumulativeTaxBaseKurus: cumulativeTaxBaseKurus,
      previousCumulativeMinimumTaxBaseKurus: cumulativeMinimumTaxBaseKurus,
      agiOptionId
    });
    while (candidate(high).netKurus < targetNetKurus && high < maxGrossKurus) high = Math.min(high * 2, maxGrossKurus);

    let best = candidate(high);
    let bestDiff = Math.abs(best.netKurus - targetNetKurus);
    while (low <= high) {
      const middle = Math.floor((low + high) / 2);
      const row = candidate(middle);
      const diff = Math.abs(row.netKurus - targetNetKurus);
      if (diff < bestDiff || (diff === bestDiff && middle < best.grossKurus)) { best = row; bestDiff = diff; }
      if (row.netKurus < targetNetKurus) low = middle + 1;
      else if (row.netKurus > targetNetKurus) high = middle - 1;
      else { best = row; break; }
    }
    grossKurusByMonth.push(best.grossKurus);
    rows.push(best);
    cumulativeTaxBaseKurus = best.cumulativeTaxBaseKurus;
    cumulativeMinimumTaxBaseKurus = best.cumulativeMinimumTaxBaseKurus;
  }

  return Object.freeze({ grossKurusByMonth: Object.freeze(grossKurusByMonth), rows: Object.freeze(rows) });
}

export function historicalPayrollSummary(rows) {
  if (!Array.isArray(rows) || rows.length !== MONTHS) throw new TypeError('rows 12 aylık tarihsel bordro dizisi olmalıdır.');
  const annualGrossKurus = rows.reduce((sum,row) => sum + row.grossKurus, 0);
  const annualNetKurus = rows.reduce((sum,row) => sum + row.netKurus, 0);
  const annualTaxKurus = rows.reduce((sum,row) => sum + row.payableIncomeTaxKurus + row.payableStampTaxKurus, 0);
  const annualEmployeePremiumKurus = rows.reduce((sum,row) => sum + row.employeeSgkKurus + row.employeeUnemploymentKurus, 0);
  return Object.freeze({
    annualGrossKurus,
    annualNetKurus,
    averageGrossKurus: Math.round(annualGrossKurus / MONTHS),
    averageNetKurus: Math.round(annualNetKurus / MONTHS),
    annualTaxKurus,
    annualEmployeePremiumKurus
  });
}

export function buildHistoricalHalfYearValues(firstHalfKurus, secondHalfKurus = firstHalfKurus) {
  assertKurus(firstHalfKurus, 'firstHalfKurus');
  assertKurus(secondHalfKurus, 'secondHalfKurus');
  return Object.freeze(Array.from({ length: MONTHS }, (_, month) => month < 6 ? firstHalfKurus : secondHalfKurus));
}
