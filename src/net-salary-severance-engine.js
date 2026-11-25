import { calculatePayrollYear, calculateProgressiveTaxKurus } from './payroll-engine.js';
import { calculateSeverance, get2026SeveranceCeilingKurus } from './termination-engine.js';
import { PAYROLL_PARAMETERS_2026 as P } from './parameters-2026.js';

const MAX_GROSS=1000000000;
function assertMoney(n,name){if(!Number.isSafeInteger(n)||n<0||n>12000000000)throw new RangeError(name+' geçerli, negatif olmayan bir tutar olmalı.');}
export function calculateSalaryMonth(grossKurus,month,priorBaseKurus=null){
 if(!Number.isInteger(month)||month<1||month>12)throw new RangeError('Geçerli bir bordro ayı seç.');
 assertMoney(grossKurus,'Brüt maaş');
 if(priorBaseKurus!==null){assertMoney(priorBaseKurus,'Kümülatif matrah');if(month===1&&priorBaseKurus!==0)throw new RangeError('Ocak ayı öncesi matrah sıfır olmalı.');}
 const gross=Array(12).fill(priorBaseKurus===null?grossKurus:0);
 gross[month-1]=grossKurus;
 const row=calculatePayrollYear({baseGrossKurusByMonth:gross})[month-1];
 if(priorBaseKurus===null)return row;
 const calculatedIncomeTaxKurus=calculateProgressiveTaxKurus(priorBaseKurus+row.incomeTaxBaseKurus,row.incomeTaxBaseKurus);
 const payableIncomeTaxKurus=Math.max(0,calculatedIncomeTaxKurus-row.minimumWageIncomeTaxExemptionKurus);
 return {...row,calculatedIncomeTaxKurus,payableIncomeTaxKurus,cumulativeTaxBaseKurus:priorBaseKurus+row.incomeTaxBaseKurus,netKurus:row.netKurus+row.payableIncomeTaxKurus-payableIncomeTaxKurus};
}
export function calculateNetSalarySeverance({targetNetKurus,salaryMonth,priorBaseKurus=null,...input}){
 assertMoney(targetNetKurus,'Net maaş');
 get2026SeveranceCeilingKurus(input.endIso);
 if(!Number.isInteger(salaryMonth)||salaryMonth<1||salaryMonth>Number(input.endIso.slice(5,7)))throw new RangeError('Maaşın bordro ayı fesih ayından sonra olamaz.');
 if(targetNetKurus<P.referenceMinimumNetKurus)throw new RangeError('Bu araç 2026 tam ay net asgari ücretinden düşük maaşları hesaplamaz.');
 const net=g=>calculateSalaryMonth(g,salaryMonth,priorBaseKurus);
 let lo=P.minimumGrossKurus,hi=MAX_GROSS;
 if(net(hi).netKurus<targetNetKurus)throw new RangeError('Net maaş hesaplama sınırını aşıyor.');
 while(lo<hi){const mid=Math.floor((lo+hi)/2);if(net(mid).netKurus<targetNetKurus)lo=mid+1;else hi=mid;}
 // Kuruş yuvarlamalarından kaynaklanan küçük yerel sapmalarda en yakın aday.
 let best=net(lo);
 for(let g=Math.max(P.minimumGrossKurus,lo-12);g<=Math.min(MAX_GROSS,lo+12);g++){const r=net(g);const diff=Math.abs(r.netKurus-targetNetKurus),bestDiff=Math.abs(best.netKurus-targetNetKurus);if(diff<bestDiff||diff===bestDiff&&g<best.grossKurus)best=r;}
 const severance=calculateSeverance({...input,baseGrossKurus:best.grossKurus});
 return {salary:best,severance,targetNetKurus,netDifferenceKurus:best.netKurus-targetNetKurus,estimatedPriorBase:priorBaseKurus===null};
}
