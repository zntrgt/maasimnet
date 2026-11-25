import { calculatePayrollYear, calculateProgressiveTaxKurus, getApplicableIncomeTaxRatesPpm } from './payroll-engine.js';
import { PAYROLL_PARAMETERS_2026 as P } from './parameters-2026.js';

export const MONTHS_TR = Object.freeze(['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']);
export const TAX_BRACKETS = P.incomeTaxBrackets;

// At an exact boundary, the higher rate applies only to the next kuruş.
export function currentTaxRate(baseKurus) {
  return TAX_BRACKETS.find(b=>baseKurus<=b.upToKurus).ratePpm;
}
export function forecastTaxBrackets({grossKurus, priorBaseKurus=0, startMonth=1}) {
  if (!Number.isSafeInteger(grossKurus)||grossKurus<P.minimumGrossKurus||grossKurus>1_000_000_000) throw new RangeError('Tam ay için brüt maaş 33.030–10.000.000 TL arasında olmalı.');
  if (!Number.isSafeInteger(priorBaseKurus)||priorBaseKurus<0||priorBaseKurus>12_000_000_000) throw new RangeError('Kümülatif matrah 0–120.000.000 TL arasında olmalı.');
  if (!Number.isInteger(startMonth)||startMonth<1||startMonth>12) throw new RangeError('Geçerli bir başlangıç ayı seç.');
  if (startMonth===1&&priorBaseKurus!==0) throw new RangeError('Ocak ayı öncesinde aynı takvim yılına ait matrah sıfır olmalı.');
  const payroll=calculatePayrollYear({baseGrossKurusByMonth:Array(12).fill(grossKurus)})[0];
  const monthlyBaseKurus=payroll.incomeTaxBaseKurus;
  const transitions=TAX_BRACKETS.slice(0,-1).map((b,i)=>({
    thresholdKurus:b.upToKurus, ratePpm:TAX_BRACKETS[i+1].ratePpm,
    alreadyCrossed:priorBaseKurus>b.upToKurus, month:null
  }));
  let cumulative=priorBaseKurus;
  const rows=[];
  for(let month=startMonth;month<=12;month++){
    const before=cumulative;
    cumulative+=monthlyBaseKurus;
    for(const t of transitions) if(!t.alreadyCrossed&&t.month===null&&before<=t.thresholdKurus&&cumulative>t.thresholdKurus)t.month=month;
    rows.push({month,beforeKurus:before,cumulativeKurus:cumulative,monthlyBaseKurus,
      rates:getApplicableIncomeTaxRatesPpm(cumulative,monthlyBaseKurus),
      calculatedTaxKurus:calculateProgressiveTaxKurus(cumulative,monthlyBaseKurus)});
  }
  const next=transitions.find(t=>!t.alreadyCrossed);
  return {monthlyBaseKurus,initialRatePpm:currentTaxRate(priorBaseKurus),sgkBaseKurus:payroll.sgkBaseKurus,employeeSgkKurus:payroll.employeeSgkKurus,employeeUnemploymentKurus:payroll.employeeUnemploymentKurus,rows,transitions,next:next??null};
}
