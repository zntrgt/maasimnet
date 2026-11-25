import {calculateTemporaryBenefit} from './temporary-benefit-engine.js';
const el=id=>document.getElementById(id);
const form=el('tb-form');
const fmt=k=>(k/100).toLocaleString('tr-TR',{style:'currency',currency:'TRY'});
function amount(id){const s=el(id).value.trim().replace(/\s/g,'');if(!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(s))throw new Error('Kazancı 396.360 veya 396.360,50 biçiminde gir.');return Math.round(Number(s.replace(/\./g,'').replace(',','.'))*100);}
function int(id){const v=el(id).value;if(v===''||!el(id).checkValidity())throw new Error('Prim ve rapor günü alanlarını kontrol et.');return Number(v);}
if(form)form.addEventListener('submit',e=>{
 e.preventDefault();el('tb-error').hidden=true;el('tb-result').hidden=true;
 try{
 const r=calculateTemporaryBenefit({kind:el('tb-kind').value,priorDays:int('tb-prior-days'),priorPekKurus:amount('tb-pek'),reportDays:int('tb-report-days'),treatment:el('tb-treatment').value,activeInsurance:el('tb-active').checked,authorizedReport:el('tb-authorized').checked,noWork:el('tb-no-work').checked,ordinaryWagesOnly:el('tb-ordinary').checked});
 el('tb-total').textContent=fmt(r.totalKurus);el('tb-paid').textContent=r.payableDays+' gün';
 el('tb-daily-base').textContent=r.status==='calculated'?fmt(r.dailyBaseKurus):'—';
 el('tb-daily').textContent=r.status==='calculated'?fmt(r.dailyPaymentKurus):'—';
 el('tb-waiting').textContent=r.status==='calculated'?r.waitingDays+' gün':'—';
 el('tb-note').textContent=r.status==='ineligible'?r.reason:(r.floorApplied?'2026 günlük asgari kazanç alt sınırı uygulandı. ':'')+(r.capApplied?'180 günden az prim nedeniyle günlük kazanç tavanı uygulandı. ':'')+'Tutar tahminidir; nihai ödeme SGK tarafından belirlenir.';
 el('tb-result').hidden=false;
 }catch(err){el('tb-error').textContent=err.message;el('tb-error').hidden=false;}
});
