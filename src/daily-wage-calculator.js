import {dailyWage} from './daily-wage-engine.js';
const el=id=>document.getElementById(id);
const fmt=k=>(k/100).toLocaleString('tr-TR',{style:'currency',currency:'TRY'});
el('dw-form')?.addEventListener('submit',e=>{
 e.preventDefault();el('dw-result').hidden=true;el('dw-error').hidden=true;
 try{
 const s=el('dw-monthly').value.trim();
 if(!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(s))throw new Error('Ücreti 50.000 veya 50.000,50 biçiminde gir.');
 const r=dailyWage(Math.round(Number(s.replace(/\./g,'').replace(',','.'))*100),el('dw-kind').value);
 const kind=r.kind==='gross'?'Brüt':'Net';
 el('dw-daily-label').textContent=kind+' günlük ücret';
 el('dw-hourly-label').textContent=kind+' saatlik ücret';
 el('dw-daily').textContent=fmt(r.dailyKurus);el('dw-hourly').textContent=fmt(r.hourlyKurus);
 el('dw-result').hidden=false;
 }catch(e){el('dw-error').textContent=e.message;el('dw-error').hidden=false;}
});
