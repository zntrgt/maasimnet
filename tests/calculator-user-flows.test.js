import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EMPLOYER_SCHEMES,
  calculatePayrollYear,
  getApplicableIncomeTaxRatesPpm,
  solveMonthlyGrossForFixedNet,
  summarizePayroll,
  tlToKurus
} from '../src/payroll-engine.js';

const zeroExtras = () => Array(12).fill(0);
const twelve = (tl) => Array(12).fill(tlToKurus(tl));

function estimateParameters({ minimum, ceiling, brackets }) {
  return {
    year: 2027,
    minimumGrossKurus: tlToKurus(minimum),
    referenceMinimumNetKurus: 0,
    sgkCeilingKurus: tlToKurus(ceiling),
    stampTaxRatePpm: 7590,
    employeeRatesPpm: { sgk: 140000, unemployment: 10000, retiredSgdp: 75000 },
    employerRatesPpm: { manufacturing: 167500, other: 197500, none: 217500, unemployment: 20000, retiredSgdp: 247500 },
    disabilityDeductionKurus: { 0: 0, 1: 1200000, 2: 700000, 3: 300000 },
    incomeTaxBrackets: brackets.map((threshold, index) => ({
      upToKurus: tlToKurus(threshold),
      ratePpm: [150000, 200000, 270000, 350000][index]
    })).concat({ upToKurus: Number.POSITIVE_INFINITY, ratePpm: 400000 })
  };
}

const estimateScenarios = {
  cautious: estimateParameters({ minimum: 39636, ceiling: 356724, brackets: [228000, 480000, 1800000, 6360000] }),
  middle: estimateParameters({ minimum: 42939, ceiling: 386451, brackets: [247000, 520000, 1950000, 6890000] }),
  high: estimateParameters({ minimum: 46242, ceiling: 416178, brackets: [266000, 560000, 2100000, 7420000] })
};

test('2026 brütten nete akışı 12 ay boyunca tutarlı ve kümülatif matrah artandır', () => {
  const rows = calculatePayrollYear({
    baseGrossKurusByMonth: twelve(200000),
    extraGrossKurusByMonth: zeroExtras(),
    employerScheme: EMPLOYER_SCHEMES.OTHER
  });

  assert.equal(rows.length, 12);
  assert.ok(rows.every((row) => row.netKurus > 0 && row.netKurus < row.grossKurus));
  for (let index = 1; index < rows.length; index += 1) {
    assert.ok(rows[index].cumulativeTaxBaseKurus > rows[index - 1].cumulativeTaxBaseKurus);
  }
  assert.ok(rows.some((row) => row.incomeTaxRatesPpm.length === 2), 'En az bir ayda vergi dilimi geçişi görünmeli.');
});

test('2026 netten brüte akışı farklı hedeflerde aylık neti kuruş toleransıyla korur', () => {
  for (const targetTl of [30000, 50000, 100000, 250000]) {
    const targetNetKurus = tlToKurus(targetTl);
    const grossByMonth = solveMonthlyGrossForFixedNet({
      targetNetKurus,
      employerScheme: EMPLOYER_SCHEMES.OTHER
    });
    const rows = calculatePayrollYear({
      baseGrossKurusByMonth: grossByMonth,
      extraGrossKurusByMonth: zeroExtras(),
      employerScheme: EMPLOYER_SCHEMES.OTHER
    });

    assert.ok(rows.every((row) => Math.abs(row.netKurus - targetNetKurus) <= 1), `${targetTl} TL hedef net korunmalı.`);
    assert.equal(summarizePayroll(rows).annualNetKurus, targetNetKurus * 12);
  }
});

test('2026 maaş değişikliği yalnız seçilen aydan sonrasını etkiler', () => {
  const base = twelve(100000);
  for (let month = 6; month < 12; month += 1) base[month] = tlToKurus(150000);

  const rows = calculatePayrollYear({
    baseGrossKurusByMonth: base,
    extraGrossKurusByMonth: zeroExtras(),
    employerScheme: EMPLOYER_SCHEMES.OTHER
  });

  assert.ok(rows.slice(0, 6).every((row) => row.baseGrossKurus === tlToKurus(100000)));
  assert.ok(rows.slice(6).every((row) => row.baseGrossKurus === tlToKurus(150000)));
  assert.ok(rows[6].grossKurus > rows[5].grossKurus);
});

test('2026 tek aylık ek ödeme yalnız ilgili ay brütünü artırır, sonraki matrahı kümülatif etkiler', () => {
  const extras = zeroExtras();
  extras[1] = tlToKurus(25000);
  const rows = calculatePayrollYear({
    baseGrossKurusByMonth: twelve(100000),
    extraGrossKurusByMonth: extras,
    employerScheme: EMPLOYER_SCHEMES.OTHER
  });

  assert.equal(rows[1].grossKurus, tlToKurus(125000));
  assert.equal(rows.filter((row) => row.extraGrossKurus > 0).length, 1);
  assert.ok(rows[2].cumulativeTaxBaseKurus > rows[1].cumulativeTaxBaseKurus);
});

test('2026 emekli ve engellilik seçenekleri negatif veya bozuk sonuç üretmez', () => {
  for (const options of [
    { retired: true },
    { disabilityDegree: 1 },
    { disabilityDegree: 2 },
    { disabilityDegree: 3 }
  ]) {
    const rows = calculatePayrollYear({
      baseGrossKurusByMonth: twelve(100000),
      extraGrossKurusByMonth: zeroExtras(),
      employerScheme: EMPLOYER_SCHEMES.OTHER,
      ...options
    });
    assert.ok(rows.every((row) => row.netKurus >= 0 && row.totalEmployeeDeductionsKurus >= 0));
  }
});

test('2027 temkinli, orta ve yüksek senaryolar brütten nete geçerli 12 aylık sonuç üretir', () => {
  for (const [name, parameters] of Object.entries(estimateScenarios)) {
    const rows = calculatePayrollYear({
      baseGrossKurusByMonth: twelve(150000),
      extraGrossKurusByMonth: zeroExtras(),
      employerScheme: EMPLOYER_SCHEMES.OTHER,
      parameters
    });
    assert.equal(rows.length, 12, `${name} senaryosu 12 ay üretmeli.`);
    assert.ok(rows.every((row) => row.netKurus > 0 && row.employerCostKurus >= row.grossKurus));
  }
});

test('2027 senaryolarında netten brüte hedef net her ay korunur', () => {
  const targetNetKurus = tlToKurus(100000);
  for (const [name, parameters] of Object.entries(estimateScenarios)) {
    const grossByMonth = solveMonthlyGrossForFixedNet({
      targetNetKurus,
      employerScheme: EMPLOYER_SCHEMES.OTHER,
      parameters
    });
    const rows = calculatePayrollYear({
      baseGrossKurusByMonth: grossByMonth,
      extraGrossKurusByMonth: zeroExtras(),
      employerScheme: EMPLOYER_SCHEMES.OTHER,
      parameters
    });
    assert.ok(rows.every((row) => Math.abs(row.netKurus - targetNetKurus) <= 1), `${name} senaryosunda hedef net korunmalı.`);
    assert.ok(new Set(grossByMonth).size > 1, `${name} senaryosunda vergi ilerledikçe gerekli brüt değişmeli.`);
  }
});

test('vergi dilimi yardımcı fonksiyonu ay içi geçişte iki oran döndürür', () => {
  const rates = getApplicableIncomeTaxRatesPpm(tlToKurus(260000), tlToKurus(30000), {
    parameters: estimateScenarios.middle
  });
  assert.deepEqual(rates, [150000, 200000]);
});
