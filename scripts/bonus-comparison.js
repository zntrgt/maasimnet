import { calculatePayrollYear, summarizePayroll, tlToKurus } from '../src/payroll-engine.js';
export const BONUS_MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
export const bonusMoney = value => new Intl.NumberFormat('tr-TR', {minimumFractionDigits:2,maximumFractionDigits:2}).format(value / 100) + ' TL';
export function createBonusComparison(month = 5) {
  if (!Number.isInteger(month) || month < 0 || month > 11) throw new RangeError('Prim ayı 0–11 arasında olmalıdır');
  const baseGrossKurusByMonth = Array(12).fill(tlToKurus(100000));
  const extraGrossKurusByMonth = Array(12).fill(0);
  extraGrossKurusByMonth[month] = tlToKurus(50000);
  const baseline = calculatePayrollYear({baseGrossKurusByMonth});
  const withBonus = calculatePayrollYear({baseGrossKurusByMonth, extraGrossKurusByMonth});
  const differences = withBonus.map((row, i) => row.netKurus - baseline[i].netKurus);
  return {month, baseline, withBonus, differences, paymentDelta: differences[month], laterDelta: differences.slice(month + 1).reduce((a,b)=>a+b,0), annualDelta: differences.reduce((a,b)=>a+b,0), annualNet: summarizePayroll(withBonus).annualNetKurus};
}
export function bonusComparisonTable(data) {
  const rows = data.baseline.map((row,i) => `<tr><th scope="row">${BONUS_MONTHS[i]}</th><td>${bonusMoney(row.netKurus)}</td><td>${bonusMoney(data.withBonus[i].netKurus)}</td><td>${bonusMoney(data.differences[i])}</td></tr>`).join('');
  return `<div class="bonus-scroll" role="region" aria-label="Aylık prim karşılaştırması, yatay kaydırılabilir" tabindex="0"><table><caption>2026 · Her ay 100.000 TL brüt, yalnız ${BONUS_MONTHS[data.month]} ayında 50.000 TL brüt prim</caption><thead><tr><th scope="col">Ay</th><th scope="col">Primsiz net</th><th scope="col">Primli net</th><th scope="col">Net fark</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
export const BONUS_ASSUMPTIONS = 'Ocak–Aralık tam çalışma, başlangıçta sıfır kümülatif matrah, standart çalışan, engellilik indirimi ve başka ek ödeme yok. Brüt ücret sabittir; net ücret garantisi yoktur. Örnekler SGK tavanını aşmaz; tavan aşımında prim devri ayrıca değerlendirilmelidir.';
export const BONUS_TABLE_CSS = '.bonus-scroll{overflow-x:auto;max-width:100%;margin:20px 0}.bonus-scroll:focus-visible{outline:3px solid #0f766e;outline-offset:3px}.bonus-scroll table{width:100%;border-collapse:collapse;font-size:14px}.bonus-scroll caption{text-align:left;padding:10px 0;color:#475569}.bonus-scroll th,.bonus-scroll td{text-align:left;padding:12px;border-bottom:1px solid #e2e8f0;white-space:nowrap}.bonus-scroll thead{background:#f1f5f9}.bonus-scroll tbody tr:nth-child(even){background:#f8fafc}';
