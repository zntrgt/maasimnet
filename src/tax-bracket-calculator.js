import {forecastTaxBrackets,MONTHS_TR} from './tax-bracket-engine.js';
const form=document.getElementById('tax-bracket-form');
const el=id=>document.getElementById(id);
const money=k=>(k/100).toLocaleString('tr-TR',{style:'currency',currency:'TRY'});
const rate=r=>'%'+(r/10000).toLocaleString('tr-TR');
const read=id=>{
  const input=el(id);
  if(!input.checkValidity()||input.value.trim()==='')throw new Error('Geçerli tutarları gir.');
  return Math.round(Number(input.value)*100);
};
if(form){
  const error=el('tax-bracket-error'),results=el('tax-bracket-results'),summary=el('tax-summary');
  function render(){
    try{
      const r=forecastTaxBrackets({grossKurus:read('tax-gross'),priorBaseKurus:read('tax-prior'),startMonth:Number(el('tax-start-month').value)});
      el('tax-next').textContent=!r.next?'En yüksek dilimdesin':r.next.month?MONTHS_TR[r.next.month-1]+' · '+rate(r.next.ratePpm):'Bu yıl geçiş yok';
      el('tax-next-note').textContent=r.next?'Üst dilim eşiği: '+money(r.next.thresholdKurus):'%40 üzeri yeni bir dilim yok.';
      el('tax-current').textContent=rate(r.initialRatePpm);
      el('tax-monthly-base').textContent=money(r.monthlyBaseKurus);
      el('tax-sgk-base').textContent=money(r.sgkBaseKurus);
      el('tax-sgk').textContent=money(r.employeeSgkKurus);
      el('tax-unemployment').textContent=money(r.employeeUnemploymentKurus);
      el('tax-transition-body').innerHTML=r.transitions.map(t=>`<tr><th scope="row">${rate(t.ratePpm)}</th><td>${money(t.thresholdKurus)}</td><td>${t.alreadyCrossed?'Önceden geçildi':t.month?MONTHS_TR[t.month-1]:'Bu yıl geçilmiyor'}</td></tr>`).join('');
      el('tax-month-body').innerHTML=r.rows.map(row=>`<tr><th scope="row">${MONTHS_TR[row.month-1]}</th><td>${money(row.monthlyBaseKurus)}</td><td>${money(row.cumulativeKurus)}</td><td>${row.rates.map(rate).join(' → ')}</td><td>${money(row.calculatedTaxKurus)}</td></tr>`).join('');
      error.hidden=true;results.hidden=false;summary.hidden=false;
    }catch(e){error.textContent=e.message;error.hidden=false;results.hidden=true;summary.hidden=true;}
  }
  form.addEventListener('submit',e=>{e.preventDefault();render();});
  form.addEventListener('input',render);
  el('tax-start-month').addEventListener('change',()=>{if(el('tax-start-month').value==='1')el('tax-prior').value='0';render();});
  render();
}
