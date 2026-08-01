import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EMPLOYER_SCHEMES,
  calculatePayrollYear,
  solveMonthlyGrossForFixedNet,
  summarizePayroll,
  tlToKurus
} from '../src/payroll-engine.js';

const twelve = (tl) => Array(12).fill(tlToKurus(tl));
const zeroExtras = Array(12).fill(0);

function runFixedGross(grossTl, options = {}) {
  return calculatePayrollYear({
    baseGrossKurusByMonth: twelve(grossTl),
    extraGrossKurusByMonth: zeroExtras,
    employerScheme: EMPLOYER_SCHEMES.OTHER,
    ...options
  });
}

test('100.000 TL sabit brüt kabul benchmarkını tam üretir', () => {
  const rows = runFixedGross(100_000);
  const summary = summarizePayroll(rows);
  assert.equal(rows[0].netKurus, 7_595_303);
  assert.equal(rows[11].netKurus, 6_715_680);
  assert.equal(summary.annualNetKurus, 83_388_163);
  assert.equal(summary.averageNetKurus, 6_949_014);
});

test('2026 asgari ücret neti 12 ay boyunca resmî referansla tam eşleşir', () => {
  const rows = runFixedGross(33_030);
  assert.ok(rows.every((row) => row.netKurus === 2_807_550));
  assert.ok(rows.every((row) => row.payableIncomeTaxKurus === 0));
  assert.ok(rows.every((row) => row.payableStampTaxKurus === 0));
});

test('aylık netler önce kuruşa yuvarlanır, yıllık toplam aylıkların toplamıdır', () => {
  const rows = runFixedGross(100_000);
  const summary = summarizePayroll(rows);
  assert.equal(summary.annualNetKurus, rows.reduce((sum, row) => sum + row.netKurus, 0));
});

test('500.000 TL brütte SGK matrahı tavanda kalır', () => {
  const rows = runFixedGross(500_000);
  assert.ok(rows.every((row) => row.sgkBaseKurus === 29_727_000));
});

test('Mart temel brüt değişikliği Mart-Aralık dönemine uygulanabilir', () => {
  const base = twelve(100_000);
  for (let month = 2; month < 12; month += 1) base[month] = tlToKurus(125_000);
  const rows = calculatePayrollYear({
    baseGrossKurusByMonth: base,
    extraGrossKurusByMonth: zeroExtras,
    employerScheme: EMPLOYER_SCHEMES.OTHER
  });
  assert.deepEqual(rows.map((row) => row.baseGrossKurus), base);
});

test('tek aylık prim yalnız seçilen ayın brütüne eklenir', () => {
  const extras = [...zeroExtras];
  extras[6] = tlToKurus(50_000);
  const rows = calculatePayrollYear({
    baseGrossKurusByMonth: twelve(100_000),
    extraGrossKurusByMonth: extras,
    employerScheme: EMPLOYER_SCHEMES.OTHER
  });
  assert.equal(rows[6].extraGrossKurus, tlToKurus(50_000));
  assert.equal(rows.filter((row) => row.extraGrossKurus !== 0).length, 1);
});

test('100.000 TL sabit aylık netten brüte çözüm her ay tam hedef neti verir', () => {
  const targetNetKurus = tlToKurus(100_000);
  const grossByMonth = solveMonthlyGrossForFixedNet({
    targetNetKurus,
    employerScheme: EMPLOYER_SCHEMES.OTHER
  });
  const rows = calculatePayrollYear({
    baseGrossKurusByMonth: grossByMonth,
    extraGrossKurusByMonth: zeroExtras,
    employerScheme: EMPLOYER_SCHEMES.OTHER
  });
  assert.ok(rows.every((row) => row.netKurus === targetNetKurus));
  assert.equal(summarizePayroll(rows).annualNetKurus, tlToKurus(1_200_000));
  assert.ok(new Set(grossByMonth).size > 1);
});

test('100.000 TL brütte işveren maliyeti teşvik türüne göre doğrudur', () => {
  const expected = {
    [EMPLOYER_SCHEMES.MANUFACTURING]: 11_875_000,
    [EMPLOYER_SCHEMES.OTHER]: 12_175_000,
    [EMPLOYER_SCHEMES.NONE]: 12_375_000
  };
  for (const [employerScheme, expectedCostKurus] of Object.entries(expected)) {
    const [january] = runFixedGross(100_000, { employerScheme });
    assert.equal(january.employerCostKurus, expectedCostKurus);
  }
});

test('emekli çalışanda işsizlik primi yoktur ve işveren maliyeti SGDP ile hesaplanır', () => {
  const [january] = runFixedGross(100_000, { retired: true });
  assert.equal(january.employeeUnemploymentKurus, 0);
  assert.equal(january.employerUnemploymentKurus, 0);
  assert.equal(january.employerCostKurus, 12_475_000);
});
