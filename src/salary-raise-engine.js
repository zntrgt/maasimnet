const RATE_SCALE = 10_000;
const MAX_RATE_BASIS_POINTS = 100_000;
const MIN_RATE_BASIS_POINTS = -9_999;

function assertKurus(value, fieldName, { min = 0 } = {}) {
  if (!Number.isSafeInteger(value) || value < min) {
    throw new TypeError(`${fieldName} geçerli bir kuruş tutarı olmalıdır.`);
  }
}

function assertRateBasisPoints(value) {
  if (!Number.isSafeInteger(value) || value < MIN_RATE_BASIS_POINTS || value > MAX_RATE_BASIS_POINTS) {
    throw new TypeError('Zam/değişim oranı -%99,99 ile %1.000,00 arasında olmalıdır.');
  }
}

function changeDirection(differenceKurus) {
  if (differenceKurus > 0) return 'increase';
  if (differenceKurus < 0) return 'decrease';
  return 'same';
}

export function calculateSalaryRaise({
  mode = 'new_salary',
  oldSalaryKurus,
  newSalaryKurus,
  rateBasisPoints
} = {}) {
  let oldKurus;
  let newKurus;
  let rateBps;

  if (mode === 'new_salary') {
    assertKurus(oldSalaryKurus, 'Eski maaş', { min: 1 });
    assertRateBasisPoints(rateBasisPoints);
    oldKurus = oldSalaryKurus;
    rateBps = rateBasisPoints;
    newKurus = Math.round(oldKurus * (RATE_SCALE + rateBps) / RATE_SCALE);
  } else if (mode === 'rate') {
    assertKurus(oldSalaryKurus, 'Eski maaş', { min: 1 });
    assertKurus(newSalaryKurus, 'Yeni maaş', { min: 0 });
    oldKurus = oldSalaryKurus;
    newKurus = newSalaryKurus;
    rateBps = Math.round((newKurus - oldKurus) * RATE_SCALE / oldKurus);
    assertRateBasisPoints(rateBps);
  } else if (mode === 'old_salary') {
    assertKurus(newSalaryKurus, 'Yeni maaş', { min: 0 });
    assertRateBasisPoints(rateBasisPoints);
    if (RATE_SCALE + rateBasisPoints <= 0) throw new TypeError('Bu oranla eski maaş hesaplanamaz.');
    newKurus = newSalaryKurus;
    rateBps = rateBasisPoints;
    oldKurus = Math.round(newKurus * RATE_SCALE / (RATE_SCALE + rateBps));
  } else {
    throw new TypeError('Geçersiz hesaplama modu.');
  }

  const differenceKurus = newKurus - oldKurus;
  return Object.freeze({
    mode,
    oldSalaryKurus: oldKurus,
    newSalaryKurus: newKurus,
    differenceKurus,
    annualDifferenceKurus: differenceKurus * 12,
    rateBasisPoints: rateBps,
    multiplier: (RATE_SCALE + rateBps) / RATE_SCALE,
    direction: changeDirection(differenceKurus)
  });
}

export function salaryRaiseEngineVersion() {
  return Object.freeze({
    engine: 'salary-raise-kurus-v1',
    rateScale: RATE_SCALE,
    minRateBasisPoints: MIN_RATE_BASIS_POINTS,
    maxRateBasisPoints: MAX_RATE_BASIS_POINTS
  });
}
