import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePayrollYear,
  solveMonthlyGrossForFixedNet,
  summarizePayroll,
  tlToKurus,
  EMPLOYER_SCHEMES
} from '../src/payroll-engine.js';
import { PAYROLL_PARAMETERS_2026 } from '../src/parameters-2026.js';

const months = (value) => Array(12).fill(tlToKurus(value));
const zeros = () => Array(12).fill(0);

function createEstimateParameters2027(factor = 1.3) {
  const scale = (value) => Math.round(value * factor);
  return Object.freeze({
    ...PAYROLL_PARAMETERS_2026,
    year: 2027,
    minimumGrossKurus: scale(PAYROLL_PARAMETERS_2026.minimumGrossKurus),
    referenceMinimumNetKurus: scale(PAYROLL_PARAMETERS_2026.referenceMinimumNetKurus),
    sgkCeilingKurus: scale(PAYROLL_PARAMETERS_2026.sgkCeilingKurus),
    disabilityDeductionKurus: Object.freeze(
      Object.fromEntries(Object.entries(PAYROLL_PARAMETERS_2026.disabilityDeductionKurus)
        .map(([degree, value]) => [degree, scale(value)]))
    ),
    incomeTaxBrackets: Object.freeze(PAYROLL_PARAMETERS_2026.incomeTaxBrackets.map((bracket) => Object.freeze({
      ...bracket,
      upToKurus: Number.isFinite(bracket.upToKurus) ? scale(bracket.upToKurus) : Infinity
    })))
  });
}

test('2026 brütten nete: 12 aylık bordro ve kümülatif vergi akışı oluşur', () => {
  const rows = calculatePayrollYear({ baseGrossKurusByMonth: months(200000) });
  assert.equal(rows.length, 12);
  assert.ok(rows.every((row) => row.grossKurus === tlToKurus(200000)));
  assert.ok(rows.every((row) => row.netKurus > 0 && row.netKurus < row.grossKurus));
  assert.ok(rows.every((row, index) => index === 0 || row.cumulativeTaxBaseKurus > rows[index - 1].cumulativeTaxBaseKurus));
  assert.ok(rows.some((row) => row.incomeTaxRatesPpm.length > 1), 'Ay ortasında vergi dilimi geçişi bekleniyor.');

  const summary = summarizePayroll(rows);
  assert.equal(summary.annualGrossKurus, tlToKurus(200000 * 12));
  assert.ok(summary.highestNetRow.netKurus >= summary.lowestNetRow.netKurus);
});

test('2026 yıl ortasında maaş değişimi yalnız seçilen ay ve sonrasına uygulanır', () => {
  const gross = [...Array(6).fill(tlToKurus(100000)), ...Array(6).fill(tlToKurus(150000))];
  const rows = calculatePayrollYear({ baseGrossKurusByMonth: gross });
  assert.ok(rows.slice(0, 6).every((row) => row.baseGrossKurus === tlToKurus(100000)));
  assert.ok(rows.slice(6).every((row) => row.baseGrossKurus === tlToKurus(150000)));
  assert.equal(rows[5].month, 5);
  assert.equal(rows[6].month, 6);
});

test('2026 ek ödeme yalnız girilen ayın toplam brütünü etkiler', () => {
  const extras = zeros();
  extras[1] = tlToKurus(2500);
  const rows = calculatePayrollYear({ baseGrossKurusByMonth: months(100000), extraGrossKurusByMonth: extras });
  assert.equal(rows[0].grossKurus, tlToKurus(100000));
  assert.equal(rows[1].grossKurus, tlToKurus(102500));
  assert.equal(rows[2].grossKurus, tlToKurus(100000));
  assert.equal(rows[1].extraGrossKurus, tlToKurus(2500));
});

test('2026 netten brüte: hedef net her ay kuruş hassasiyetinde korunur', () => {
  const targetNetKurus = tlToKurus(100000);
  const solvedGrosses = solveMonthlyGrossForFixedNet({ targetNetKurus });
  const rows = calculatePayrollYear({ baseGrossKurusByMonth: solvedGrosses });

  assert.equal(solvedGrosses.length, 12);
  assert.ok(rows.every((row) => Math.abs(row.netKurus - targetNetKurus) <= 1));
  assert.ok(new Set(solvedGrosses).size > 1, 'Vergi dilimi ilerledikçe gerekli brüt tutar değişmelidir.');
});

test('2026 emekli seçeneğinde işsizlik primi sıfır ve SGDP aktiftir', () => {
  const rows = calculatePayrollYear({ baseGrossKurusByMonth: months(100000), retired: true });
  assert.ok(rows.every((row) => row.employeeUnemploymentKurus === 0));
  assert.ok(rows.every((row) => row.employerUnemploymentKurus === 0));
  assert.ok(rows.every((row) => row.employeeSgkKurus === 0));
  assert.ok(rows.every((row) => row.employeeSgdpKurus > 0));
});

test('2026 engellilik indirimi net ücreti düşürmez', () => {
  const standard = calculatePayrollYear({ baseGrossKurusByMonth: months(100000), disabilityDegree: 0 });
  const degreeOne = calculatePayrollYear({ baseGrossKurusByMonth: months(100000), disabilityDegree: 1 });
  assert.ok(degreeOne.every((row, index) => row.netKurus >= standard[index].netKurus));
});

test('2026 işveren teşvik seçeneği çalışan netini değiştirmez', () => {
  const other = calculatePayrollYear({
    baseGrossKurusByMonth: months(100000),
    employerScheme: EMPLOYER_SCHEMES.OTHER
  });
  const manufacturing = calculatePayrollYear({
    baseGrossKurusByMonth: months(100000),
    employerScheme: EMPLOYER_SCHEMES.MANUFACTURING
  });

  assert.ok(other.every((row, index) => row.netKurus === manufacturing[index].netKurus));
  assert.ok(manufacturing.every((row, index) => row.employerCostKurus <= other[index].employerCostKurus));
});

test('2027 tahmin parametreleriyle brütten nete ve netten brüte akışları çalışır', () => {
  const parameters = createEstimateParameters2027(1.3);
  const grossRows = calculatePayrollYear({
    baseGrossKurusByMonth: months(200000),
    parameters
  });
  assert.equal(grossRows.length, 12);
  assert.ok(grossRows.every((row) => row.netKurus > 0));

  const targetNetKurus = tlToKurus(120000);
  const solvedGrosses = solveMonthlyGrossForFixedNet({ targetNetKurus, parameters });
  const netRows = calculatePayrollYear({ baseGrossKurusByMonth: solvedGrosses, parameters });
  assert.ok(netRows.every((row) => Math.abs(row.netKurus - targetNetKurus) <= 1));
  assert.ok(new Set(solvedGrosses).size > 1);
});

test('hatalı kullanıcı girdileri sessizce hesaplanmaz', () => {
  assert.throws(() => calculatePayrollYear({ baseGrossKurusByMonth: [tlToKurus(100000)] }), /12 aylık/);
  assert.throws(() => calculatePayrollYear({ baseGrossKurusByMonth: months(100000), disabilityDegree: 9 }), /engellilik/);
  assert.throws(() => solveMonthlyGrossForFixedNet({ targetNetKurus: -1 }), /sıfır veya pozitif/);
});
