import { PAYROLL_PARAMETERS_2026 } from './parameters-2026.js';
import {
  EMPLOYER_SCHEMES,
  calculatePayrollYear,
  calculateProgressiveTaxKurus,
  getApplicableIncomeTaxRatesPpm,
  multiplyRateRoundedKurus,
  solveMonthlyGrossForFixedNet,
  summarizePayroll,
  tlToKurus
} from './payroll-engine.js';

const MONTH_COUNT = 12;
const oneYear = (grossKurus) => Array(MONTH_COUNT).fill(grossKurus);
const zeroExtras = () => Array(MONTH_COUNT).fill(0);

function formatTl(kurus) {
  return `${(kurus / 100).toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} TL`;
}

function formatRate(ratePpm) {
  return `%${(ratePpm / 10_000).toLocaleString('tr-TR', { maximumFractionDigits: 2 })}`;
}

function assertAudit(condition, message) {
  if (!condition) throw new Error(message);
}

function payrollForGross(grossKurus, options = {}) {
  return calculatePayrollYear({
    baseGrossKurusByMonth: oneYear(grossKurus),
    extraGrossKurusByMonth: zeroExtras(),
    employerScheme: EMPLOYER_SCHEMES.OTHER,
    ...options
  });
}

function executeCase(definition) {
  try {
    const details = definition.run();
    return Object.freeze({
      id: definition.id,
      category: definition.category,
      title: definition.title,
      status: 'passed',
      details: Object.freeze(details)
    });
  } catch (error) {
    return Object.freeze({
      id: definition.id,
      category: definition.category,
      title: definition.title,
      status: 'failed',
      details: Object.freeze([error instanceof Error ? error.message : String(error)])
    });
  }
}

const AUDIT_CASES = Object.freeze([
  Object.freeze({
    id: 'income-tax-bracket-boundaries',
    category: 'Vergi dilimleri',
    title: 'Gelir vergisi dilimlerinin tam sınırı ve bir kuruş üzeri',
    run() {
      const brackets = PAYROLL_PARAMETERS_2026.incomeTaxBrackets;
      const details = [];

      for (let index = 0; index < brackets.length - 1; index += 1) {
        const lower = brackets[index];
        const upper = brackets[index + 1];
        const limit = lower.upToKurus;
        const atLimit = getApplicableIncomeTaxRatesPpm(limit, 1);
        const oneKurusAbove = getApplicableIncomeTaxRatesPpm(limit + 1, 1);

        assertAudit(
          atLimit.length === 1 && atLimit[0] === lower.ratePpm,
          `${formatTl(limit)} sınırındaki son kuruş ${formatRate(lower.ratePpm)} oranında olmalı.`
        );
        assertAudit(
          oneKurusAbove.length === 1 && oneKurusAbove[0] === upper.ratePpm,
          `${formatTl(limit)} sınırının üzerindeki ilk kuruş ${formatRate(upper.ratePpm)} oranında olmalı.`
        );

        details.push(`${formatTl(limit)}: sınırdaki son kuruş ${formatRate(lower.ratePpm)}, sonraki kuruş ${formatRate(upper.ratePpm)}.`);
      }

      return details;
    }
  }),
  Object.freeze({
    id: 'sgk-ceiling-boundary',
    category: 'SGK tavanı',
    title: 'SGK prime esas kazanç tavanının altı, tam sınırı ve üzeri',
    run() {
      const ceiling = PAYROLL_PARAMETERS_2026.sgkCeilingKurus;
      const below = payrollForGross(ceiling - 1)[0];
      const at = payrollForGross(ceiling)[0];
      const above = payrollForGross(ceiling + 1)[0];

      assertAudit(below.sgkBaseKurus === ceiling - 1, 'Tavan altındaki brütün tamamı SGK matrahına girmeli.');
      assertAudit(at.sgkBaseKurus === ceiling, 'Tavan tutarı SGK matrahına tam girmeli.');
      assertAudit(above.sgkBaseKurus === ceiling, 'Tavan üzerindeki bir kuruş SGK matrahını artırmamalı.');
      assertAudit(above.employeeSgkKurus === at.employeeSgkKurus, 'Çalışan SGK primi tavan üzerinde artmamalı.');
      assertAudit(above.employeeUnemploymentKurus === at.employeeUnemploymentKurus, 'İşsizlik primi tavan üzerinde artmamalı.');

      return [
        `2026 aylık SGK tavanı ${formatTl(ceiling)} olarak uygulandı.`,
        `Tavan üzerindeki brüt artışı SGK ve işsizlik primi matrahını büyütmedi.`
      ];
    }
  }),
  Object.freeze({
    id: 'minimum-wage-boundary',
    category: 'Asgari ücret',
    title: 'Brüt asgari ücrette net referans ve vergi istisnaları',
    run() {
      const gross = PAYROLL_PARAMETERS_2026.minimumGrossKurus;
      const expectedNet = PAYROLL_PARAMETERS_2026.referenceMinimumNetKurus;
      const rows = payrollForGross(gross);

      for (const row of rows) {
        assertAudit(row.netKurus === expectedNet, 'Asgari ücret neti resmî referans tutarla eşleşmeli.');
        assertAudit(row.payableIncomeTaxKurus === 0, 'Asgari ücrette ödenecek gelir vergisi sıfır olmalı.');
        assertAudit(row.payableStampTaxKurus === 0, 'Asgari ücrette ödenecek damga vergisi sıfır olmalı.');
      }

      const below = payrollForGross(gross - 1)[0];
      const above = payrollForGross(gross + 1)[0];
      assertAudit(below.netKurus <= expectedNet, 'Asgari ücretin bir kuruş altındaki net referans neti aşmamalı.');
      assertAudit(above.netKurus >= expectedNet, 'Asgari ücretin bir kuruş üzerindeki net referans netin altına düşmemeli.');

      return [
        `Brüt ${formatTl(gross)} için 12 ayın her birinde net ${formatTl(expectedNet)} üretildi.`,
        'Gelir ve damga vergisi istisnaları hiçbir ayda negatif vergi oluşturmadı.'
      ];
    }
  }),
  Object.freeze({
    id: 'disability-deduction-boundaries',
    category: 'Engellilik indirimi',
    title: 'Engellilik derecelerinin vergi matrahına ve net ücrete etkisi',
    run() {
      const gross = tlToKurus(100_000);
      const rows = [0, 1, 2, 3].map((degree) => payrollForGross(gross, { disabilityDegree: degree })[0]);
      const base = rows[0];

      for (const degree of [1, 2, 3]) {
        const deduction = PAYROLL_PARAMETERS_2026.disabilityDeductionKurus[degree];
        assertAudit(
          base.incomeTaxBaseKurus - rows[degree].incomeTaxBaseKurus === deduction,
          `${degree}. derece indirimi vergi matrahını tanımlı tutar kadar azaltmalı.`
        );
      }

      assertAudit(rows[1].netKurus > rows[2].netKurus, '1. derece neti 2. dereceden yüksek olmalı.');
      assertAudit(rows[2].netKurus > rows[3].netKurus, '2. derece neti 3. dereceden yüksek olmalı.');
      assertAudit(rows[3].netKurus > rows[0].netKurus, '3. derece neti indirimsiz netten yüksek olmalı.');

      return [
        `100.000 TL brütte matrah indirimleri: 1. derece ${formatTl(PAYROLL_PARAMETERS_2026.disabilityDeductionKurus[1])}, 2. derece ${formatTl(PAYROLL_PARAMETERS_2026.disabilityDeductionKurus[2])}, 3. derece ${formatTl(PAYROLL_PARAMETERS_2026.disabilityDeductionKurus[3])}.`,
        'Net ücret sıralaması 1. derece > 2. derece > 3. derece > indirimsiz olarak doğrulandı.'
      ];
    }
  }),
  Object.freeze({
    id: 'rounding-half-kurus-boundaries',
    category: 'Yuvarlama',
    title: 'Yarım kuruş ve istisna vergisi yuvarlama sınırları',
    run() {
      assertAudit(multiplyRateRoundedKurus(1, 499_999) === 0, 'Yarım kuruşun altı aşağı yuvarlanmalı.');
      assertAudit(multiplyRateRoundedKurus(1, 500_000) === 1, 'Tam yarım kuruş yukarı yuvarlanmalı.');

      const rounded = calculateProgressiveTaxKurus(10, 10, { rounding: 'round' });
      const floored = calculateProgressiveTaxKurus(10, 10, { rounding: 'floor' });
      assertAudit(rounded === 2, '1,5 kuruş standart vergide 2 kuruşa yuvarlanmalı.');
      assertAudit(floored === 1, '1,5 kuruş istisna hesabında 1 kuruşa aşağı yuvarlanmalı.');

      return [
        '0,499999 kuruş aşağı; 0,5 kuruş yukarı yuvarlandı.',
        'Asgari ücret istisnasında kullanılan aşağı yuvarlama ile standart vergi yuvarlaması ayrı test edildi.'
      ];
    }
  }),
  Object.freeze({
    id: 'monthly-annual-rounding-consistency',
    category: 'Yuvarlama',
    title: 'Aylık netlerin toplamı ile yıllık toplamın tutarlılığı',
    run() {
      const rows = payrollForGross(tlToKurus(100_000));
      const summary = summarizePayroll(rows);
      const monthlySum = rows.reduce((sum, row) => sum + row.netKurus, 0);

      assertAudit(summary.annualNetKurus === monthlySum, 'Yıllık toplam, kuruşa yuvarlanmış aylık netlerin toplamı olmalı.');
      assertAudit(summary.averageNetKurus === Math.round(monthlySum / MONTH_COUNT), 'Aylık ortalama yıllık toplamdan bir kez yuvarlanmalı.');

      return [
        `100.000 TL sabit brütte yıllık net ${formatTl(summary.annualNetKurus)} olarak aylık satırların toplamından üretildi.`,
        `Aylık ortalama net ${formatTl(summary.averageNetKurus)} olarak tek kez yuvarlandı.`
      ];
    }
  }),
  Object.freeze({
    id: 'fixed-net-inversion',
    category: 'Netten brüte',
    title: 'Sabit hedef netin her ay kuruşu kuruşuna çözülmesi',
    run() {
      const target = tlToKurus(100_000);
      const grossByMonth = solveMonthlyGrossForFixedNet({
        targetNetKurus: target,
        employerScheme: EMPLOYER_SCHEMES.OTHER
      });
      const rows = calculatePayrollYear({
        baseGrossKurusByMonth: grossByMonth,
        extraGrossKurusByMonth: zeroExtras(),
        employerScheme: EMPLOYER_SCHEMES.OTHER
      });

      assertAudit(rows.every((row) => row.netKurus === target), 'Her ay hedef net tam olarak üretilmeli.');
      assertAudit(new Set(grossByMonth).size > 1, 'Kümülatif vergi nedeniyle aylık brütler değişmeli.');

      return [
        '100.000 TL hedef net Ocak–Aralık döneminin her ayında kuruşu kuruşuna üretildi.',
        'Vergi dilimi değiştikçe gerekli aylık brütlerin değiştiği doğrulandı.'
      ];
    }
  })
]);

export function runPayrollAudit() {
  const cases = AUDIT_CASES.map(executeCase);
  const passed = cases.filter((item) => item.status === 'passed').length;
  const failed = cases.length - passed;

  return Object.freeze({
    engineVersion: 'central-kurus-engine',
    calculationYear: PAYROLL_PARAMETERS_2026.year,
    total: cases.length,
    passed,
    failed,
    status: failed === 0 ? 'passed' : 'failed',
    cases: Object.freeze(cases)
  });
}
