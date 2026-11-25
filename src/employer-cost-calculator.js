import { employerCost, EMPLOYER_OPTIONS } from './employer-cost-engine.js';

const form = document.getElementById('employer-cost-form');
const fmt = k => (k / 100).toLocaleString('tr-TR', {style:'currency',currency:'TRY'});
const put = (id,k) => {document.getElementById(id).textContent=fmt(k);};
if (form) {
  const error = document.getElementById('employer-cost-error');
  const results = document.getElementById('employer-cost-results');
  function calculate() {
    try {
      const input = document.getElementById('employer-gross');
      if (!input.checkValidity() || input.value.trim() === '') throw new Error('Tam ay için geçerli bir brüt maaş gir.');
      const gross = Math.round(Number(input.value) * 100);
      const scheme = document.getElementById('employer-scheme').value;
      const r = employerCost(gross,scheme);
      put('employer-total',r.employerCostKurus);
      put('employer-annual',r.annualEmployerCostKurus);
      put('employer-gross-result',r.grossKurus);
      put('employer-base',r.sgkBaseKurus);
      put('employer-premium',r.employerSgkOrSgdpKurus);
      put('employer-unemployment',r.employerUnemploymentKurus);
      document.getElementById('employer-selected').textContent=EMPLOYER_OPTIONS.find(o=>o.id===scheme).label;
      for (const o of EMPLOYER_OPTIONS) put('employer-comparison-'+o.id,employerCost(gross,o.id).employerCostKurus);
      error.hidden=true; results.hidden=false;
    } catch(e) { error.textContent=e.message; error.hidden=false; results.hidden=true; }
  }
  form.addEventListener('submit', e=>{e.preventDefault();calculate();});
  form.addEventListener('input',calculate);
  calculate();
}
