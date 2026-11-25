import { calculateNetSalarySeverance } from './net-salary-severance-engine.js';
const form=document.getElementById('ns-form');
const el=id=>document.getElementById(id);
const money=k=>(k/100).toLocaleString('tr-TR',{style:'currency',currency:'TRY'});
function read(id,optional=false){
 const raw=el(id).value.trim().replace(/\s/g,'');
 if(!raw){if(optional)return null;throw new Error('Gerekli tutarları gir.');}
 if(!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(raw))throw new Error('Tutarları 50.000 veya 50.000,50 biçiminde gir.');
 const n=Math.round(Number(raw.replace(/\./g,'').replace(',','.'))*100);
 if(!Number.isSafeInteger(n))throw new Error('Tutar çok büyük.');
 return n;
}
if(form){
 form.addEventListener('submit',e=>{
  e.preventDefault();el('ns-results').hidden=true;el('ns-error').hidden=true;
  try{
   const startIso=el('ns-start').value,endIso=el('ns-end').value;
   if(!startIso||!endIso)throw new Error('İşe giriş ve fesih tarihlerini gir.');
   const r=calculateNetSalarySeverance({startIso,endIso,salaryMonth:Number(el('ns-month').value),targetNetKurus:read('ns-net'),priorBaseKurus:read('ns-prior',true),mealKurus:read('ns-meal',true)??0,transportKurus:read('ns-transport',true)??0,regularOtherKurus:read('ns-other',true)??0,annualRegularBenefitsKurus:read('ns-bonus',true)??0,remainingStampTaxExemptionKurus:read('ns-exemption',true)??0});
   const s=r.severance;
   for(const [id,val] of Object.entries({'ns-converted':r.salary.grossKurus,'ns-dressed':s.dressedGrossKurus,'ns-cap':s.ceilingKurus,'ns-basis':s.basisKurus,'ns-gross-sev':s.grossKurus,'ns-stamp':s.stampTaxKurus,'ns-net-sev':s.netKurus,'ns-reconstructed':r.salary.netKurus}))el(id).textContent=money(val);
   el('ns-period').textContent=s.ceilingPeriod;
   el('ns-days').textContent=s.duration.totalDays+' gün';
   el('ns-note').textContent=[r.estimatedPriorBase?'Önceki matrah bilinmediği için Ocak ayından seçilen aya kadar aynı brüt maaş varsayıldı.':'Girilen önceki kümülatif matrah kullanıldı.',s.ceilingApplied?'Giydirilmiş ücret tavanı aştı; hesap tavandan yapıldı.':'',!s.eligibleByDuration?'Genel en az bir yıllık hizmet koşulu sağlanmadı.':'',r.netDifferenceKurus?'Net maaş kuruş yuvarlaması nedeniyle yaklaşık eşleşti.':'','Hak kazanma nedeni ayrıca değerlendirilmelidir.'].filter(Boolean).join(' ');
   el('ns-results').hidden=false;
  }catch(e){el('ns-error').textContent=e.message;el('ns-error').hidden=false;}
 });
}
