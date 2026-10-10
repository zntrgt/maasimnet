// Emekli çalışan (SGDP) brütten nete ve netten brüte hesabı. Merkezi 2026 bordro motorunu kullanır;
// karşılaştırma için aynı brütle normal çalışan bordrosunu da hesaplar.
import { calculatePayrollYear, summarizePayroll, solveMonthlyGrossForFixedNet } from './payroll-engine.js';
import { PAYROLL_PARAMETERS_2026 } from './parameters-2026.js';

export const SGDP_EMPLOYEE_RATE_PCT = PAYROLL_PARAMETERS_2026.employeeRatesPpm.retiredSgdp / 10_000;
export const SGDP_EMPLOYER_RATE_PCT = PAYROLL_PARAMETERS_2026.employerRatesPpm.retiredSgdp / 10_000;
const MONTHS = 12;
const MAX_KURUS = 10_000_000_00; // 10 milyon TL

export function calculateRetiredWorker({ mode, amountKurus }) {
  if (mode !== 'gross' && mode !== 'net') throw new Error('Hesap yönünü seçin.');
  const amount = Math.round(Number(amountKurus));
  if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_KURUS) throw new Error('Aylık tutarı girin (0’dan büyük).');
  const grossByMonth = mode === 'gross'
    ? Array(MONTHS).fill(amount)
    : solveMonthlyGrossForFixedNet({ targetNetKurus: amount, retired: true });
  const retiredRows = calculatePayrollYear({ baseGrossKurusByMonth: grossByMonth, retired: true });
  const normalRows = calculatePayrollYear({ baseGrossKurusByMonth: grossByMonth, retired: false });
  const retired = summarizePayroll(retiredRows);
  const normal = summarizePayroll(normalRows);
  return {
    mode,
    rows: retiredRows,
    summary: retired,
    normalSummary: normal,
    annualNetAdvantageKurus: retired.annualNetKurus - normal.annualNetKurus,
    annualEmployerCostDifferenceKurus: retired.annualEmployerCostKurus - normal.annualEmployerCostKurus
  };
}
