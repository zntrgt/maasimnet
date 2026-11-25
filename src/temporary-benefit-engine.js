import { DATA_2026 } from './data-2026.js';
export const BENEFIT_2026=Object.freeze({
 year:2026,checkedAt:'2026-11-25',sicknessMinDays:90,sicknessWaitingDays:2,limitedDays:180,
 dailyMinimumKurus:DATA_2026.payroll.minimumGrossKurus/30,
 sources:Object.freeze({
  amendment:'https://cdn.tbmm.gov.tr/KKBSPublicFile/D28/Y2/KanunMetni/19f11649-9ebd-4f26-aad5-782852ec88c5.htm',
  gazette:'https://resmigazete.gov.tr/eskiler/2024/12/20241227-15.htm',
  sickness:'https://www.sgk.gov.tr/Content/Post/e33fffdb-16b9-4722-a9c1-2bd0a2a220d1/Hastalik-Hali-2025-02-27-11-27-26',
  accident:'https://sgk.gov.tr/Content/Post/7b0b48c6-ceba-472b-8011-c4a9b3125133/Is-Kazasi-2025-02-27-10-08-15',
  pek:DATA_2026.sources.sgk.url
 })
});
function integer(n,min,max,label){if(!Number.isSafeInteger(n)||n<min||n>max)throw new RangeError(label+' geçerli aralıkta olmalı.');}
export function calculateTemporaryBenefit({kind,priorDays,priorPekKurus,reportDays,treatment,activeInsurance,authorizedReport,noWork,ordinaryWagesOnly}){
 const p=BENEFIT_2026;
 if(!['sickness','accident','occupational'].includes(kind)||!['outpatient','inpatient'].includes(treatment))throw new RangeError('Geçerli rapor ve tedavi türünü seç.');
 integer(priorDays,0,360,'Önceki 12 aylık prim günü');
 integer(priorPekKurus,0,360000000,'Önceki 12 aylık prime esas kazanç');
 integer(reportDays,1,365,'Rapor süresi');
 if(!ordinaryWagesOnly)throw new RangeError('Arızi prim, ikramiye veya özel kazanç hesabı içeren bordrolar bu aracın kapsamı dışında.');
 if(!activeInsurance||!authorizedReport||!noWork)return {status:'ineligible',reason:'Sigortalılık, yetkili rapor ve raporlu sürede çalışmama koşullarını kontrol et.',payableDays:0,totalKurus:0};
 if(kind==='sickness'&&priorDays<p.sicknessMinDays)return {status:'ineligible',reason:'Hastalık ödeneği için önceki bir yılda en az 90 gün kısa vadeli sigorta primi gerekir.',payableDays:0,totalKurus:0};
 if(!priorDays)throw new RangeError('Önceki 12 ayda kazanç bulunmayan iş kazası veya meslek hastalığı için özel kazanç hesabı gerekir; SGK’ya başvur.');
 if(priorPekKurus===0)throw new RangeError('Prim günün için bildirilen toplam prime esas kazancı gir.');
 const rawDaily=priorPekKurus/priorDays;
 if(rawDaily>DATA_2026.payroll.sgkCeilingKurus/30)throw new RangeError('Günlük ortalama kazanç 2026 PEK üst sınırını aşıyor; girişlerini kontrol et.');
 const cap=priorDays<p.limitedDays?p.dailyMinimumKurus*2:null;
 const dailyBase=cap===null?rawDaily:Math.min(rawDaily,cap);
 const waiting=kind==='sickness'?Math.min(reportDays,p.sicknessWaitingDays):0;
 const payableDays=reportDays-waiting;
 const daily=dailyBase*(treatment==='inpatient'?1/2:2/3);
 return {status:'calculated',waitingDays:waiting,payableDays,rawDailyKurus:Math.round(rawDaily),dailyBaseKurus:Math.round(dailyBase),capKurus:cap,capApplied:cap!==null&&rawDaily>cap,dailyPaymentKurus:Math.round(daily),totalKurus:Math.round(daily*payableDays)};
}
