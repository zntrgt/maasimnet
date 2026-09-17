import { calculatePayrollYear, summarizePayroll, tlToKurus } from '../src/payroll-engine.js';
export const OFFER_MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
export function createOfferExample(startMonth = 6) {
  if (!Number.isInteger(startMonth) || startMonth < 0 || startMonth > 11) throw new RangeError('Başlangıç ayı 0–11 arasında olmalıdır');
  const baseline = calculatePayrollYear({baseGrossKurusByMonth:Array(12).fill(tlToKurus(100000))});
  const offer = calculatePayrollYear({baseGrossKurusByMonth:Array.from({length:12},(_,month)=>tlToKurus(month < startMonth ? 100000 : 120000))});
  const differences = offer.map((row,index)=>row.netKurus-baseline[index].netKurus);
  const annualDelta = differences.reduce((sum,value)=>sum+value,0);
  const activeMonths = 12-startMonth;
  return {startMonth, activeMonths, baseline, offer, differences, annualDelta,
    calendarAverageDelta:Math.round(annualDelta/12),
    activeAverageDelta:Math.round(annualDelta/activeMonths),
    baselineAnnualNet:summarizePayroll(baseline).annualNetKurus,
    offerAnnualNet:summarizePayroll(offer).annualNetKurus,
    grossDelta:tlToKurus(20000)*activeMonths,
    benefitDelta:tlToKurus(1000)*activeMonths};
}
