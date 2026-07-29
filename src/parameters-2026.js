export const PAYROLL_PARAMETERS_2026 = Object.freeze({
  year: 2026,
  minimumGrossKurus: 3_303_000,
  referenceMinimumNetKurus: 2_807_550,
  sgkCeilingKurus: 29_727_000,
  stampTaxRatePpm: 7_590,
  employeeRatesPpm: Object.freeze({
    sgk: 140_000,
    unemployment: 10_000,
    retiredSgdp: 75_000
  }),
  employerRatesPpm: Object.freeze({
    manufacturing: 167_500,
    other: 197_500,
    none: 217_500,
    unemployment: 20_000,
    retiredSgdp: 247_500
  }),
  disabilityDeductionKurus: Object.freeze({
    0: 0,
    1: 1_200_000,
    2: 700_000,
    3: 300_000
  }),
  incomeTaxBrackets: Object.freeze([
    Object.freeze({ upToKurus: 19_000_000, ratePpm: 150_000 }),
    Object.freeze({ upToKurus: 40_000_000, ratePpm: 200_000 }),
    Object.freeze({ upToKurus: 150_000_000, ratePpm: 270_000 }),
    Object.freeze({ upToKurus: 530_000_000, ratePpm: 350_000 }),
    Object.freeze({ upToKurus: Number.POSITIVE_INFINITY, ratePpm: 400_000 })
  ])
});
