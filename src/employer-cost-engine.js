import { calculatePayrollYear } from './payroll-engine.js';
import { PAYROLL_PARAMETERS_2026 as P } from './parameters-2026.js';

export const EMPLOYER_OPTIONS = Object.freeze([
  { id: 'other', label: 'Diğer sektörler – 2 puan indirimli', rate: P.employerRatesPpm.other, unemployment: P.employerRatesPpm.unemployment },
  { id: 'manufacturing', label: 'İmalat – 5 puan indirimli', rate: P.employerRatesPpm.manufacturing, unemployment: P.employerRatesPpm.unemployment },
  { id: 'none', label: 'İndirimsiz', rate: P.employerRatesPpm.none, unemployment: P.employerRatesPpm.unemployment },
  { id: 'retired', label: 'Emekli çalışan (SGDP)', rate: P.employerRatesPpm.retiredSgdp, unemployment: 0 }
].map(Object.freeze));

export function employerCost(grossKurus, scheme = 'other') {
  if (!Number.isSafeInteger(grossKurus) || grossKurus < P.minimumGrossKurus || grossKurus > 1_000_000_000) {
    throw new RangeError('Tam ay için brüt ücret 33.030 TL ile 10.000.000 TL arasında olmalı.');
  }
  if (!EMPLOYER_OPTIONS.some(o => o.id === scheme)) throw new RangeError('Geçerli bir prim seçeneği seç.');
  const retired = scheme === 'retired';
  const row = calculatePayrollYear({baseGrossKurusByMonth: Array(12).fill(grossKurus), employerScheme: retired ? 'none' : scheme, retired})[0];
  return Object.freeze({...row, annualEmployerCostKurus: row.employerCostKurus * 12});
}
