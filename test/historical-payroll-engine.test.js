import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateHistoricalAgiKurus,
  calculateHistoricalPayrollYear,
  buildHistoricalHalfYearValues,
  solveHistoricalGrossForNet
} from '../src/historical-payroll-engine.js';
import {
  HISTORICAL_PAYROLL_DATA,
  getHistoricalPeriod
} from '../src/historical-payroll-data.js';

const officialMinimumPeriods = [
  { year: 2020, month: 0, gross: 294_300, net: 232_471, ceiling: 2_207_250 },
  { year: 2021, month: 0, gross: 357_750, net: 282_590, ceiling: 2_683_140 },
  { year: 2022, month: 0, gross: 500_400, net: 425_340, ceiling: 3_753_000 },
  { year: 2022, month: 6, gross: 647_100, net: 550_035, ceiling: 4_853_250 },
  { year: 2023, month: 0, gross: 1_000_800, net: 850_680, ceiling: 7_506_000 },
  { year: 2023, month: 6, gross: 1_341_450, net: 1_140_232, ceiling: 10_060_890 },
  { year: 2024, month: 0, gross: 2_000_250, net: 1_700_212, ceiling: 15_001_890 },
  { year: 2025, month: 0, gross: 2_600_550, net: 2_210_467, ceiling: 19_504_140 }
];

test('2020-2025 historical minimum wage periods match official gross, net and SGK ceilings', () => {
  for (const item of officialMinimumPeriods) {
    const period = getHistoricalPeriod(item.year, item.month);
    assert.equal(period.minimumGrossKurus, item.gross, `${item.year}/${item.month + 1} gross`);
    assert.equal(period.referenceMinimumNetKurus, item.net, `${item.year}/${item.month + 1} net`);
    assert.equal(period.sgkCeilingKurus, item.ceiling, `${item.year}/${item.month + 1} ceiling`);
  }
});

test('2020 January official minimum wage deduction benchmark is reproduced exactly', () => {
  const rows = calculateHistoricalPayrollYear({ year: 2020, grossKurusByMonth: Array(12).fill(294_300) });
  const jan = rows[0];
  assert.equal(jan.employeeSgkKurus, 41_202);
  assert.equal(jan.employeeUnemploymentKurus, 2_943);
  assert.equal(jan.agiKurus, 22_073);
  assert.equal(jan.payableIncomeTaxKurus, 15_450);
  assert.equal(jan.payableStampTaxKurus, 2_234);
  assert.equal(jan.netKurus, 232_471);
  for (const row of rows) assert.equal(row.netKurus, 232_471);
});

test('2021 January official minimum wage deduction benchmark is reproduced exactly', () => {
  const rows = calculateHistoricalPayrollYear({ year: 2021, grossKurusByMonth: Array(12).fill(357_750) });
  const jan = rows[0];
  assert.equal(jan.employeeSgkKurus, 50_085);
  assert.equal(jan.employeeUnemploymentKurus, 3_578);
  assert.equal(jan.agiKurus, 26_831);
  assert.equal(jan.payableIncomeTaxKurus, 18_782);
  assert.equal(jan.payableStampTaxKurus, 2_715);
  assert.equal(jan.netKurus, 282_590);
  for (const row of rows) assert.equal(row.netKurus, 282_590);
});

test('official 2020 and 2021 AGI amounts follow GIB family-status tables', () => {
  assert.equal(calculateHistoricalAgiKurus(2020, 'single'), 22_073);
  assert.equal(calculateHistoricalAgiKurus(2020, 'nonworking-spouse-2'), 33_109);
  assert.equal(calculateHistoricalAgiKurus(2020, 'working-spouse-5'), 37_523);
  assert.equal(calculateHistoricalAgiKurus(2021, 'single'), 26_831);
  assert.equal(calculateHistoricalAgiKurus(2021, 'working-spouse-1'), 30_856);
  assert.equal(calculateHistoricalAgiKurus(2021, 'nonworking-spouse-3'), 45_613);
});

test('GVK 32 additional AGI floor also protects slightly-above-minimum wages when tariff lowers net pay', () => {
  const rows = calculateHistoricalPayrollYear({ year: 2020, grossKurusByMonth: Array(12).fill(300_000) });
  assert.ok(rows[8].supplementalAgiKurus > 0);
  assert.equal(rows[8].netKurus, 232_471);
});

test('2022-2025 official minimum wages have zero payable income and stamp tax under minimum-wage exemption', () => {
  for (const year of [2022, 2023, 2024, 2025]) {
    const gross = Array.from({ length: 12 }, (_, month) => getHistoricalPeriod(year, month).minimumGrossKurus);
    const rows = calculateHistoricalPayrollYear({ year, grossKurusByMonth: gross });
    for (const row of rows) {
      assert.equal(row.payableIncomeTaxKurus, 0, `${year}/${row.month + 1} income tax`);
      assert.equal(row.payableStampTaxKurus, 0, `${year}/${row.month + 1} stamp tax`);
      assert.equal(row.netKurus, row.referenceMinimumNetKurus, `${year}/${row.month + 1} net`);
    }
  }
});

test('2022 and 2023 mid-year minimum wage changes are applied from July without resetting cumulative tax bases', () => {
  const rows2022 = calculateHistoricalPayrollYear({
    year: 2022,
    grossKurusByMonth: buildHistoricalHalfYearValues(500_400, 647_100)
  });
  assert.equal(rows2022[5].minimumGrossKurus, 500_400);
  assert.equal(rows2022[6].minimumGrossKurus, 647_100);
  assert.ok(rows2022[6].cumulativeMinimumTaxBaseKurus > rows2022[5].cumulativeMinimumTaxBaseKurus);

  const rows2023 = calculateHistoricalPayrollYear({
    year: 2023,
    grossKurusByMonth: buildHistoricalHalfYearValues(1_000_800, 1_341_450)
  });
  assert.equal(rows2023[5].netKurus, 850_680);
  assert.equal(rows2023[6].netKurus, 1_140_232);
});

test('historical wage tax brackets use the official wage-income thresholds for every year', () => {
  const thresholds = {
    2020: [22_000, 49_000, 180_000, 600_000],
    2021: [24_000, 53_000, 190_000, 650_000],
    2022: [32_000, 70_000, 250_000, 880_000],
    2023: [70_000, 150_000, 550_000, 1_900_000],
    2024: [110_000, 230_000, 870_000, 3_000_000],
    2025: [158_000, 330_000, 1_200_000, 4_300_000]
  };
  for (const [year, expected] of Object.entries(thresholds)) {
    const actual = HISTORICAL_PAYROLL_DATA[year].incomeTaxBrackets.slice(0, 4).map((item) => item.upToKurus / 100);
    assert.deepEqual(actual, expected, year);
  }
});

test('net-to-gross historical solver reproduces a fixed target net within one kurus across all months', () => {
  for (const year of [2020, 2021, 2022, 2023, 2024, 2025]) {
    const target = Array(12).fill(10_000_00);
    const result = solveHistoricalGrossForNet({ year, targetNetKurusByMonth: target });
    assert.equal(result.rows.length, 12);
    for (const row of result.rows) assert.ok(Math.abs(row.netKurus - 10_000_00) <= 1, `${year}/${row.month + 1}`);
  }
});
