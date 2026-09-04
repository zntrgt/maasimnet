import { DATA_2026 } from './data-2026.js';
import { multiplyRateRoundedKurus } from './payroll-engine.js';

function assertKurus(value, fieldName) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new TypeError(`${fieldName} sıfır veya pozitif güvenli bir kuruş tamsayısı olmalıdır.`);
  }
}

function assertInteger(value, fieldName, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new TypeError(`${fieldName} ${min} ile ${max} arasında bir tamsayı olmalıdır.`);
  }
}

function assertTriState(value, fieldName) {
  if (![true, false, null].includes(value)) {
    throw new TypeError(`${fieldName} true, false veya null olmalıdır.`);
  }
}

export function getUnemploymentBenefitDurationDays(premiumDaysLast3Years) {
  assertInteger(premiumDaysLast3Years, 'Son 3 yıldaki işsizlik sigortası prim günü', { min: 0, max: 1080 });
  if (premiumDaysLast3Years >= 1080) return 300;
  if (premiumDaysLast3Years >= 900) return 240;
  if (premiumDaysLast3Years >= 600) return 180;
  return 0;
}

export function get2026UnemploymentMonthlyGrossCapKurus() {
  return multiplyRateRoundedKurus(
    DATA_2026.payroll.minimumGrossKurus,
    DATA_2026.publishedData.unemployment.monthlyGrossCapRatePpm
  );
}

export function calculateUnemploymentBenefit({
  months,
  premiumDaysLast3Years,
  last120DaysUnderContract = null,
  involuntaryUnemployment = null,
  applicationAfterDays = null
}) {
  if (!Array.isArray(months) || months.length !== 4) {
    throw new TypeError('Son dört ay için dört PEK/prim günü satırı girilmelidir.');
  }

  let totalPekKurus = 0;
  let totalPremiumDaysLast4Months = 0;
  for (const [index, month] of months.entries()) {
    if (!month || typeof month !== 'object') throw new TypeError(`${index + 1}. ay bilgisi geçersiz.`);
    const pekKurus = month.pekKurus ?? 0;
    const premiumDays = month.premiumDays ?? 0;
    assertKurus(pekKurus, `${index + 1}. ay PEK`);
    assertInteger(premiumDays, `${index + 1}. ay prim günü`, { min: 0, max: 30 });
    if (premiumDays === 0 && pekKurus !== 0) {
      throw new RangeError(`${index + 1}. ay prim günü 0 ise PEK de 0 olmalıdır.`);
    }
    totalPekKurus += pekKurus;
    totalPremiumDaysLast4Months += premiumDays;
  }

  if (totalPremiumDaysLast4Months <= 0) {
    throw new RangeError('Son dört ayda en az bir prim günü bulunmalıdır.');
  }

  assertInteger(premiumDaysLast3Years, 'Son 3 yıldaki işsizlik sigortası prim günü', { min: 0, max: 1080 });
  assertTriState(last120DaysUnderContract, 'Son 120 gün hizmet akdine tabi olma bilgisi');
  assertTriState(involuntaryUnemployment, 'İşten ayrılma nedeni bilgisi');
  if (applicationAfterDays !== null) {
    assertInteger(applicationAfterDays, 'Başvuru gecikme günü', { min: 0, max: 3650 });
  }

  const averageDailyGrossKurus = Math.round(totalPekKurus / totalPremiumDaysLast4Months);
  const calculatedDailyGrossBenefitKurus = multiplyRateRoundedKurus(
    averageDailyGrossKurus,
    DATA_2026.publishedData.unemployment.benefitRatePpm
  );
  const monthlyGrossCapKurus = get2026UnemploymentMonthlyGrossCapKurus();
  const dailyGrossCapKurus = Math.round(monthlyGrossCapKurus / 30);
  const dailyGrossBenefitKurus = Math.min(calculatedDailyGrossBenefitKurus, dailyGrossCapKurus);
  const monthlyGrossBenefitKurus = dailyGrossBenefitKurus * 30;
  const monthlyStampTaxKurus = multiplyRateRoundedKurus(
    monthlyGrossBenefitKurus,
    DATA_2026.payroll.stampTaxRatePpm
  );
  const monthlyNetBenefitKurus = monthlyGrossBenefitKurus - monthlyStampTaxKurus;

  const statutoryDurationDays = getUnemploymentBenefitDurationDays(premiumDaysLast3Years);
  const delayedDaysLost = applicationAfterDays === null
    ? null
    : Math.max(0, applicationAfterDays - DATA_2026.publishedData.unemployment.applicationDaysWithoutLoss);
  const payableDurationDays = delayedDaysLost === null
    ? statutoryDurationDays
    : Math.max(0, statutoryDurationDays - delayedDaysLost);

  let eligibilityStatus = 'estimated-eligible';
  const reasons = [];
  if (premiumDaysLast3Years < DATA_2026.publishedData.unemployment.minimumPremiumDaysLast3Years) {
    eligibilityStatus = 'not-eligible';
    reasons.push('Son 3 yıldaki işsizlik sigortası prim günü 600 günün altında.');
  }
  if (last120DaysUnderContract === false) {
    eligibilityStatus = 'not-eligible';
    reasons.push('Fesih öncesindeki son 120 gün hizmet akdine tabi olma şartı sağlanmıyor.');
  }
  if (involuntaryUnemployment === false) {
    eligibilityStatus = 'not-eligible';
    reasons.push('İşsizlik kendi istek veya kusurunuz dışında görünmüyor.');
  }
  if (eligibilityStatus !== 'not-eligible' && (last120DaysUnderContract === null || involuntaryUnemployment === null)) {
    eligibilityStatus = 'needs-review';
    reasons.push('Hak kazanma değerlendirmesi için son 120 gün ve işten ayrılma nedeni teyit edilmelidir.');
  }
  if (delayedDaysLost !== null && delayedDaysLost > 0) {
    reasons.push(`30 günlük başvuru süresi ${delayedDaysLost} gün aşılmış; mücbir sebep yoksa bu süre toplam hak süresinden düşebilir.`);
  }

  const totalGrossBenefitKurus = dailyGrossBenefitKurus * payableDurationDays;
  const totalFullMonths = Math.floor(payableDurationDays / 30);
  const remainingDays = payableDurationDays % 30;
  const totalStampTaxKurus = monthlyStampTaxKurus * totalFullMonths
    + multiplyRateRoundedKurus(dailyGrossBenefitKurus * remainingDays, DATA_2026.payroll.stampTaxRatePpm);
  const totalNetBenefitKurus = totalGrossBenefitKurus - totalStampTaxKurus;

  return Object.freeze({
    totalPekKurus,
    totalPremiumDaysLast4Months,
    averageDailyGrossKurus,
    calculatedDailyGrossBenefitKurus,
    dailyGrossCapKurus,
    dailyGrossBenefitKurus,
    monthlyGrossCapKurus,
    monthlyGrossBenefitKurus,
    monthlyStampTaxKurus,
    monthlyNetBenefitKurus,
    capApplied: calculatedDailyGrossBenefitKurus > dailyGrossCapKurus,
    premiumDaysLast3Years,
    statutoryDurationDays,
    statutoryDurationMonths: statutoryDurationDays / 30,
    applicationAfterDays,
    delayedDaysLost,
    payableDurationDays,
    totalGrossBenefitKurus,
    totalStampTaxKurus,
    totalNetBenefitKurus,
    eligibilityStatus,
    eligibilityReasons: Object.freeze(reasons)
  });
}

export function unemploymentEngineVersion() {
  return Object.freeze({
    year: DATA_2026.year,
    reviewedAt: DATA_2026.checkedAt,
    benefitRatePpm: DATA_2026.publishedData.unemployment.benefitRatePpm,
    monthlyGrossCapKurus: get2026UnemploymentMonthlyGrossCapKurus(),
    stampTaxRatePpm: DATA_2026.payroll.stampTaxRatePpm,
    sourceKeys: Object.freeze(['unemployment', 'minimumWage', 'stampTax'])
  });
}
