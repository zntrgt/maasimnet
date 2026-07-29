import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  EMPLOYER_SCHEMES,
  calculatePayrollYear,
  summarizePayroll,
  tlToKurus
} from '../src/payroll-engine.js';

const MONTH_COUNT = 12;
const FIXED_GROSS_100K_KURUS = tlToKurus(100_000);

export function formatTlFromKurus(valueKurus) {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(valueKurus / 100) + ' TL';
}

function calculateFixedGrossRows(employerScheme) {
  return calculatePayrollYear({
    baseGrossKurusByMonth: Array(MONTH_COUNT).fill(FIXED_GROSS_100K_KURUS),
    extraGrossKurusByMonth: Array(MONTH_COUNT).fill(0),
    employerScheme
  });
}

export function createGross100kScenarioData() {
  const otherRows = calculateFixedGrossRows(EMPLOYER_SCHEMES.OTHER);
  const manufacturingRows = calculateFixedGrossRows(EMPLOYER_SCHEMES.MANUFACTURING);
  const noDiscountRows = calculateFixedGrossRows(EMPLOYER_SCHEMES.NONE);
  const summary = summarizePayroll(otherRows);

  const values = Object.freeze({
    januaryNetKurus: otherRows[0].netKurus,
    decemberNetKurus: otherRows[11].netKurus,
    averageNetKurus: summary.averageNetKurus,
    annualNetKurus: summary.annualNetKurus,
    employerOtherKurus: otherRows[0].employerCostKurus,
    employerManufacturingKurus: manufacturingRows[0].employerCostKurus,
    employerNoDiscountKurus: noDiscountRows[0].employerCostKurus
  });

  return Object.freeze({
    values,
    replacements: Object.freeze({
      '{{SCENARIO_100K_JAN_NET}}': formatTlFromKurus(values.januaryNetKurus),
      '{{SCENARIO_100K_DEC_NET}}': formatTlFromKurus(values.decemberNetKurus),
      '{{SCENARIO_100K_AVG_NET}}': formatTlFromKurus(values.averageNetKurus),
      '{{SCENARIO_100K_ANNUAL_NET}}': formatTlFromKurus(values.annualNetKurus),
      '{{SCENARIO_100K_EMPLOYER_OTHER}}': formatTlFromKurus(values.employerOtherKurus),
      '{{SCENARIO_100K_EMPLOYER_MANUFACTURING}}': formatTlFromKurus(values.employerManufacturingKurus),
      '{{SCENARIO_100K_EMPLOYER_NONE}}': formatTlFromKurus(values.employerNoDiscountKurus)
    })
  });
}

export function replaceScenarioTokens(template, replacements) {
  let rendered = template;
  for (const [token, value] of Object.entries(replacements)) {
    rendered = rendered.replaceAll(token, value);
  }

  const remainingTokens = rendered.match(/\{\{SCENARIO_[A-Z0-9_]+\}\}/g);
  if (remainingTokens) {
    throw new Error(`Çözümlenmemiş senaryo tokenları: ${remainingTokens.join(', ')}`);
  }

  return rendered;
}

export async function renderScenarioPages(distDir) {
  const scenarioPath = join(distDir, '100000-brut-maas-hesaplama', 'index.html');
  const template = await readFile(scenarioPath, 'utf8');
  const scenario = createGross100kScenarioData();
  const rendered = replaceScenarioTokens(template, scenario.replacements);
  await writeFile(scenarioPath, rendered);

  return Object.freeze({
    renderedPages: 1,
    gross100k: scenario.values
  });
}
