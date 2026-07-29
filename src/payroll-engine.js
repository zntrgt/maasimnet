import { PAYROLL_PARAMETERS_2026 } from './parameters-2026.js';

const ONE_MILLION = 1_000_000;
const MONTH_COUNT = 12;

export const EMPLOYER_SCHEMES = Object.freeze({
  MANUFACTURING: 'manufacturing',
  OTHER: 'other',
  NONE: 'none'
});

function assertSafeKurus(value, fieldName) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new TypeError(`${fieldName} sıfır veya pozitif güvenli bir kuruş tamsayısı olmalıdır.`);
  }
}

function assertMonthArray(values, fieldName) {
  if (!Array.isArray(values) || values.length !== MONTH_COUNT) {
    throw new TypeError(`${fieldName} 12 aylık bir dizi olmalıdır.`);
  }
  values.forEach((value, index) => assertSafeKurus(value, `${fieldName}[${index}]`));
}

export function multiplyRateRoundedKurus(baseKurus, ratePpm) {
  assertSafeKurus(baseKurus, 'baseKurus');
  return Math.round((baseKurus * ratePpm) / ONE_MILLION);
}

export function calculateProgressiveTaxKurus(
  cumulativeBaseKurus,
  currentBaseKurus,
  { rounding = 'round', parameters = PAYROLL_PARAMETERS_2026 } = {}
) {
  assertSafeKurus(cumulativeBaseKurus, 'cumulativeBaseKurus');
  assertSafeKurus(currentBaseKurus, 'currentBaseKurus');

  let remainingKurus = currentBaseKurus;
  let positionKurus = cumulativeBaseKurus - currentBaseKurus;
  let taxNumerator = 0;

  for (const bracket of parameters.incomeTaxBrackets) {
    if (positionKurus < bracket.upToKurus) {
      const availableKurus = Number.isFinite(bracket.upToKurus)
        ? bracket.upToKurus - positionKurus
        : remainingKurus;
      const taxableKurus = Math.min(remainingKurus, availableKurus);

      if (taxableKurus > 0) {
        taxNumerator += taxableKurus * bracket.ratePpm;
        remainingKurus -= taxableKurus;
        positionKurus += taxableKurus;
      }
    }
    if (remainingKurus === 0) break;
  }

  return rounding === 'floor'
    ? Math.floor(taxNumerator / ONE_MILLION)
    : Math.round(taxNumerator / ONE_MILLION);
}

export function calculatePayrollYear({
  baseGrossKurusByMonth,
  extraGrossKurusByMonth = Array(MONTH_COUNT).fill(0),
  retired = false,
  disabilityDegree = 0,
  employerScheme = EMPLOYER_SCHEMES.OTHER,
  parameters = PAYROLL_PARAMETERS_2026
}) {
  assertMonthArray(baseGrossKurusByMonth, 'baseGrossKurusByMonth');
  assertMonthArray(extraGrossKurusByMonth, 'extraGrossKurusByMonth');

  const disabilityDeductionKurus = parameters.disabilityDeductionKurus[disabilityDegree];
  if (disabilityDeductionKurus === undefined) throw new RangeError('Geçersiz engellilik derecesi.');

  const employerRatePpm = retired
    ? parameters.employerRatesPpm.retiredSgdp
    : parameters.employerRatesPpm[employerScheme];
  if (employerRatePpm === undefined) throw new RangeError('Geçersiz işveren teşvik seçeneği.');

  const minimumWageIncomeTaxBaseKurus =
    parameters.minimumGrossKurus
    - multiplyRateRoundedKurus(parameters.minimumGrossKurus, parameters.employeeRatesPpm.sgk)
    - multiplyRateRoundedKurus(parameters.minimumGrossKurus, parameters.employeeRatesPpm.unemployment);

  const minimumWageStampTaxExemptionKurus = multiplyRateRoundedKurus(
    parameters.minimumGrossKurus,
    parameters.stampTaxRatePpm
  );

  let cumulativeTaxBaseKurus = 0;
  let cumulativeMinimumWageTaxBaseKurus = 0;

  return baseGrossKurusByMonth.map((baseGrossKurus, month) => {
    const extraGrossKurus = extraGrossKurusByMonth[month];
    const grossKurus = baseGrossKurus + extraGrossKurus;
    const sgkBaseKurus = Math.min(grossKurus, parameters.sgkCeilingKurus);

    const employeeSgkOrSgdpKurus = multiplyRateRoundedKurus(
      sgkBaseKurus,
      retired ? parameters.employeeRatesPpm.retiredSgdp : parameters.employeeRatesPpm.sgk
    );
    const employeeUnemploymentKurus = retired
      ? 0
      : multiplyRateRoundedKurus(sgkBaseKurus, parameters.employeeRatesPpm.unemployment);

    const incomeTaxBaseKurus = Math.max(
      0,
      grossKurus - employeeSgkOrSgdpKurus - employeeUnemploymentKurus - disabilityDeductionKurus
    );
    cumulativeTaxBaseKurus += incomeTaxBaseKurus;

    const calculatedIncomeTaxKurus = calculateProgressiveTaxKurus(
      cumulativeTaxBaseKurus,
      incomeTaxBaseKurus,
      { parameters }
    );

    cumulativeMinimumWageTaxBaseKurus += minimumWageIncomeTaxBaseKurus;
    const minimumWageIncomeTaxExemptionKurus = calculateProgressiveTaxKurus(
      cumulativeMinimumWageTaxBaseKurus,
      minimumWageIncomeTaxBaseKurus,
      { rounding: 'floor', parameters }
    );
    const payableIncomeTaxKurus = Math.max(
      0,
      calculatedIncomeTaxKurus - minimumWageIncomeTaxExemptionKurus
    );

    const calculatedStampTaxKurus = multiplyRateRoundedKurus(
      grossKurus,
      parameters.stampTaxRatePpm
    );
    const payableStampTaxKurus = Math.max(
      0,
      calculatedStampTaxKurus - minimumWageStampTaxExemptionKurus
    );

    const totalEmployeeDeductionsKurus =
      employeeSgkOrSgdpKurus + employeeUnemploymentKurus + payableIncomeTaxKurus + payableStampTaxKurus;
    const netKurus = grossKurus - totalEmployeeDeductionsKurus;

    const employerSgkOrSgdpKurus = multiplyRateRoundedKurus(sgkBaseKurus, employerRatePpm);
    const employerUnemploymentKurus = retired
      ? 0
      : multiplyRateRoundedKurus(sgkBaseKurus, parameters.employerRatesPpm.unemployment);
    const employerCostKurus = grossKurus + employerSgkOrSgdpKurus + employerUnemploymentKurus;

    return Object.freeze({
      month,
      baseGrossKurus,
      extraGrossKurus,
      grossKurus,
      sgkBaseKurus,
      incomeTaxBaseKurus,
      cumulativeTaxBaseKurus,
      employeeSgkKurus: retired ? 0 : employeeSgkOrSgdpKurus,
      employeeUnemploymentKurus,
      employeeSgdpKurus: retired ? employeeSgkOrSgdpKurus : 0,
      calculatedIncomeTaxKurus,
      minimumWageIncomeTaxExemptionKurus,
      payableIncomeTaxKurus,
      calculatedStampTaxKurus,
      minimumWageStampTaxExemptionKurus,
      payableStampTaxKurus,
      totalEmployeeDeductionsKurus,
      netKurus,
      employerSgkOrSgdpKurus,
      employerUnemploymentKurus,
      employerCostKurus
    });
  });
}

export function summarizePayroll(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new TypeError('rows boş olmayan bir bordro dizisi olmalıdır.');
  }

  const annualNetKurus = rows.reduce((sum, row) => sum + row.netKurus, 0);
  const annualGrossKurus = rows.reduce((sum, row) => sum + row.grossKurus, 0);
  const annualEmployerCostKurus = rows.reduce((sum, row) => sum + row.employerCostKurus, 0);
  const highestNetRow = rows.reduce((highest, row) => row.netKurus > highest.netKurus ? row : highest);
  const lowestNetRow = rows.reduce((lowest, row) => row.netKurus < lowest.netKurus ? row : lowest);

  return Object.freeze({
    annualNetKurus,
    averageNetKurus: Math.round(annualNetKurus / rows.length),
    annualGrossKurus,
    averageGrossKurus: Math.round(annualGrossKurus / rows.length),
    annualEmployerCostKurus,
    averageEmployerCostKurus: Math.round(annualEmployerCostKurus / rows.length),
    highestNetRow,
    lowestNetRow,
    netDifferenceKurus: highestNetRow.netKurus - lowestNetRow.netKurus
  });
}

export function solveMonthlyGrossForFixedNet({
  targetNetKurus,
  retired = false,
  disabilityDegree = 0,
  employerScheme = EMPLOYER_SCHEMES.OTHER,
  parameters = PAYROLL_PARAMETERS_2026
}) {
  assertSafeKurus(targetNetKurus, 'targetNetKurus');
  if (targetNetKurus === 0) return Array(MONTH_COUNT).fill(0);

  const solvedGrosses = [];
  const zeroExtras = Array(MONTH_COUNT).fill(0);
  const maximumGrossKurus = 100_000_000_000;

  const calculateCandidateNetKurus = (month, candidateGrossKurus) => {
    const grossByMonth = Array(MONTH_COUNT).fill(0);
    solvedGrosses.forEach((grossKurus, index) => { grossByMonth[index] = grossKurus; });
    grossByMonth[month] = candidateGrossKurus;

    return calculatePayrollYear({
      baseGrossKurusByMonth: grossByMonth,
      extraGrossKurusByMonth: zeroExtras,
      retired,
      disabilityDegree,
      employerScheme,
      parameters
    })[month].netKurus;
  };

  for (let month = 0; month < MONTH_COUNT; month += 1) {
    let lowKurus = 0;
    let highKurus = Math.max(targetNetKurus * 3, parameters.minimumGrossKurus);

    while (calculateCandidateNetKurus(month, highKurus) < targetNetKurus && highKurus < maximumGrossKurus) {
      highKurus = Math.min(highKurus * 2, maximumGrossKurus);
    }

    let bestGrossKurus = highKurus;
    let bestDifferenceKurus = Math.abs(calculateCandidateNetKurus(month, highKurus) - targetNetKurus);

    while (lowKurus <= highKurus) {
      const middleKurus = Math.floor((lowKurus + highKurus) / 2);
      const calculatedNetKurus = calculateCandidateNetKurus(month, middleKurus);
      const differenceKurus = Math.abs(calculatedNetKurus - targetNetKurus);

      if (differenceKurus < bestDifferenceKurus || (differenceKurus === bestDifferenceKurus && middleKurus < bestGrossKurus)) {
        bestGrossKurus = middleKurus;
        bestDifferenceKurus = differenceKurus;
      }

      if (calculatedNetKurus < targetNetKurus) lowKurus = middleKurus + 1;
      else if (calculatedNetKurus > targetNetKurus) highKurus = middleKurus - 1;
      else {
        bestGrossKurus = middleKurus;
        break;
      }
    }

    solvedGrosses.push(bestGrossKurus);
  }

  return solvedGrosses;
}

export function tlToKurus(value) {
  if (!Number.isFinite(value) || value < 0) throw new TypeError('TL değeri sıfır veya pozitif sonlu bir sayı olmalıdır.');
  return Math.round(value * 100);
}

export function kurusToTl(value) {
  assertSafeKurus(value, 'value');
  return value / 100;
}
