import {
  calculatePayrollYear,
  solveMonthlyGrossForFixedNet,
  summarizePayroll,
  tlToKurus,
  kurusToTl
} from './payroll-engine.js';

import { ESTIMATE_PRESETS_2027 } from './data-2027.js';
import { PAYROLL_PARAMETERS_2026 } from './parameters-2026.js';

const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const RATE_PPM = [150000, 200000, 270000, 350000, 400000];
let currentMode = 'gross';
let entryMode = 'raise';
let selectedRaise = '30';
const salaryByMode = { raise: { gross: '100000', net: '' }, direct: { gross: '', net: '' } };
export const STANDARD_RAISES = Object.freeze([2700,3000,3500]);
const MAX_SALARY_TL = 10_000_000;
const MAX_PARAM_TL = 100_000_000;

const money = (value) => new Intl.NumberFormat('tr-TR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
}).format(value) + ' ₺';

// Accept Turkish grouping/comma decimals and ungrouped dot decimals; reject malformed and negative inputs.
export function parseEstimateNumber(value) {
  const raw = String(value ?? '').trim().replace(/\s/g,'');
  if(!raw) return NaN;
  if(/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(raw)) return Number(raw.replace(/\./g,'').replace(',','.'));
  if(/^\d+([.,]\d{1,2})?$/.test(raw)) return Number(raw.replace(',','.'));
  return NaN;
}
const numberValue = id => parseEstimateNumber(document.getElementById(id)?.value);
export function estimateParameters(minimum,ceiling,thresholdsTl) {
  if(![minimum,ceiling,...thresholdsTl].every(v=>Number.isFinite(v)&&v>0&&v<=MAX_PARAM_TL)||thresholdsTl.length!==4) throw new Error('Tahmini bordro parametreleri pozitif ve geçerli olmalıdır.');
  const thresholds=thresholdsTl.map(tlToKurus);
  if(thresholds.some((v,i)=>i>0&&v<=thresholds[i-1])) throw new Error('Vergi dilimi eşikleri küçükten büyüğe sıralanmalıdır.');
  if(ceiling<minimum) throw new Error('Tahmini SGK tavanı, tahmini brüt asgari ücretten düşük olamaz.');
  return {
    ...PAYROLL_PARAMETERS_2026,
    year:2027,
    minimumGrossKurus:tlToKurus(minimum),
    referenceMinimumNetKurus:0,
    sgkCeilingKurus:tlToKurus(ceiling),
    incomeTaxBrackets:thresholds.map((upToKurus,index)=>({upToKurus,ratePpm:RATE_PPM[index]})).concat({upToKurus:Infinity,ratePpm:RATE_PPM[4]})
  };
}
function buildParameters(){
 return estimateParameters(numberValue('estimate-minimum-gross'),numberValue('estimate-sgk-ceiling'),[1,2,3,4].map(i=>numberValue('estimate-bracket-'+i)));
}
function salaryKurus(tl){
 if(!Number.isFinite(tl)||tl<=0||tl>MAX_SALARY_TL) throw new Error('0 TL üzerinde ve en fazla 10.000.000 TL tutarında geçerli maaş gir.');
 return tlToKurus(tl);
}
export function raiseSalaryKurus(baseKurus,rateBps){
 if(!Number.isSafeInteger(baseKurus)||baseKurus<=0||!Number.isInteger(rateBps)||rateBps<0||rateBps>30000) throw new Error('Zam oranı %0 ile %300 arasında olmalıdır.');
 return Math.round(baseKurus*(10000+rateBps)/10000);
}
export function rowsFor(parameters, salaryTl, mode=currentMode) {
 const amount=salaryKurus(salaryTl);
 if(!['gross','net'].includes(mode)) throw new Error('Hesaplama yönü geçersiz.');
 // Full-month standard 4/a only. A fixed target net is solved separately in each month.
 const baseGrossKurusByMonth=mode==='net'
  ?solveMonthlyGrossForFixedNet({targetNetKurus:amount,employerScheme:'other',parameters})
  :Array(12).fill(amount);
 return calculatePayrollYear({baseGrossKurusByMonth,employerScheme:'other',parameters});
}
export function compareRaises({salaryTl,mode,parameters,rates=STANDARD_RAISES}){
 const base=salaryKurus(salaryTl);
 const baselineRows=rowsFor(PAYROLL_PARAMETERS_2026,salaryTl,mode);
 const baseline=summarizePayroll(baselineRows);
 const scenarios=rates.map(rateBps=>{
  const targetKurus=raiseSalaryKurus(base,rateBps);
  const rows=rowsFor(parameters,kurusToTl(targetKurus),mode);
  const summary=summarizePayroll(rows);
  return {rateBps,targetKurus,rows,summary,netDeltaKurus:summary.annualNetKurus-baseline.annualNetKurus};
 });
 return {baselineRows,baseline,scenarios};
}
const formatRates = (rates) => rates.map((rate) => '%' + (rate / 10000)).join(' → ') || '—';

function render() {
  const errorBox = document.getElementById('estimate-error');
  errorBox.hidden = true;

  try {
    const salary = numberValue('estimate-salary');
    const parameters = buildParameters();
    let target=salary;
    let rows;
    const comparison=document.getElementById('estimate-compare');
    comparison.hidden=entryMode!=='raise';
    if(entryMode==='raise'){
      const customRaw=document.getElementById('estimate-custom-rate').value.trim();
      const custom=customRaw===''?null:parseEstimateNumber(customRaw);
      if(custom!==null&&(!Number.isFinite(custom)||custom<0||custom>300))throw new Error('Özel zam oranı %0–%300 arasında olmalıdır.');
      const customBps=custom===null?null:Math.round(custom*100);
      const rates=customBps===null?STANDARD_RAISES:[...new Set([...STANDARD_RAISES,customBps])];
      const data=compareRaises({salaryTl:salary,mode:currentMode,parameters,rates});
      const chosen=selectedRaise==='custom'?customBps:Number(selectedRaise)*100;
      const selection=data.scenarios.find(s=>s.rateBps===chosen)||data.scenarios.find(s=>s.rateBps===3000);
      rows=selection.rows;
      target=kurusToTl(selection.targetKurus);
      const baseline=data.baseline;
      const cell=n=>money(kurusToTl(n));
      const renderRow=(name,rs,ss,delta,active)=>'<tr'+(active?' data-selected="true"':'')+'><th scope="row">'+name+'</th><td>'+cell(ss.averageGrossKurus)+'</td><td>'+cell(rs[0].netKurus)+'</td><td>'+cell(rs[11].netKurus)+'</td><td>'+cell(ss.averageNetKurus)+'</td><td>'+cell(ss.annualNetKurus)+'</td><td>'+ (delta===null?'—':(delta>=0?'+':'−')+cell(Math.abs(delta)))+'</td></tr>';
      document.getElementById('estimate-compare-body').innerHTML=renderRow('2026 · hesaplanan',data.baselineRows,baseline,null,false)+data.scenarios.map(s=>renderRow('%'+(s.rateBps/100).toLocaleString('tr-TR')+' zam · 2027 tahmin',s.rows,s.summary,s.netDeltaKurus,s===selection)).join('');
      document.getElementById('estimate-compare-note').textContent=currentMode==='net'?'Net ücret sabit hedef olarak kabul edilir; zam doğrudan net hedefe uygulanır. Gereken brüt her ay yeniden hesaplanır.':'Brüt zammın nete etkisi 2026 bordrosuyla karşılaştırılır; 2027 vergi varsayımları tüm zam seçeneklerinde aynıdır.';
    }else rows=rowsFor(parameters,salary);
    const summary = summarizePayroll(rows);
    const averageNet = kurusToTl(summary.averageNetKurus);
    const averageGross = kurusToTl(summary.averageGrossKurus);

    document.getElementById('estimate-primary-label').textContent = currentMode === 'net'
      ? 'Tahmini aylık ortalama brüt'
      : 'Tahmini aylık ortalama net';
    document.getElementById('estimate-primary-value').textContent = money(currentMode === 'net' ? averageGross : averageNet);
    document.getElementById('estimate-metric-one-label').textContent = currentMode === 'net'
      ? 'Tahmini yıllık toplam brüt'
      : 'Tahmini yıllık toplam net';
    document.getElementById('estimate-metric-one').textContent = money(kurusToTl(
      currentMode === 'net' ? summary.annualGrossKurus : summary.annualNetKurus
    ));
    document.getElementById('estimate-employer-cost').textContent = money(kurusToTl(summary.averageEmployerCostKurus));
    document.getElementById('estimate-effective-rate').textContent = averageGross > 0
      ? '%' + (((averageGross - averageNet) / averageGross) * 100).toFixed(2).replace('.', ',')
      : '%0,00';
    document.getElementById('estimate-table-title').textContent = currentMode === 'net'
      ? '2027 netten brüte aylık tahmini maaş akışı'
      : '2027 brütten nete aylık tahmini maaş akışı';

    document.getElementById('estimate-table-body').innerHTML = rows.map((row) => `
      <tr>
        <th scope="row">${MONTHS[row.month]}</th>
        <td>${money(kurusToTl(row.grossKurus))}</td>
        <td>${money(kurusToTl(row.incomeTaxBaseKurus))}</td>
        <td>${formatRates(row.incomeTaxRatesPpm)}</td>
        <td>${money(kurusToTl(row.payableIncomeTaxKurus))}</td>
        <td>${money(kurusToTl(row.netKurus))}</td>
      </tr>`).join('');

    document.getElementById('estimate-assumption-summary').textContent =
      `${currentMode === 'net' ? money(target) + ' hedef net' : money(target) + ' brüt'}; ${money(numberValue('estimate-minimum-gross'))} tahmini asgari brüt ve ${money(numberValue('estimate-sgk-ceiling'))} tahmini SGK tavanıyla hesaplandı.`;
  } catch (error) {
    for(const id of ['estimate-primary-value','estimate-metric-one','estimate-employer-cost','estimate-effective-rate'])document.getElementById(id).textContent='—';
    for(const id of ['estimate-compare-body','estimate-table-body'])document.getElementById(id).innerHTML='';
    document.getElementById('estimate-assumption-summary').textContent='Geçerli maaş ve varsayımlar gir.';
    document.getElementById('estimate-compare-note').textContent='';
    errorBox.textContent = error.message || 'Tahmin hesaplanamadı.';
    errorBox.hidden = false;
  }
}

function updateEntry(){
  const isNet=currentMode==='net',raise=entryMode==='raise';
  document.getElementById('estimate-mode-gross').setAttribute('aria-pressed',String(!isNet));
  document.getElementById('estimate-mode-net').setAttribute('aria-pressed',String(isNet));
  for(const button of document.querySelectorAll('[data-estimate-entry]'))button.setAttribute('aria-pressed',String(button.dataset.estimateEntry===entryMode));
  document.getElementById('estimate-salary-label').textContent=(raise?'2026 ':'2027 beklenen ')+(isNet?'aylık net maaş':'aylık brüt maaş');
  document.getElementById('estimate-salary-note').textContent=isNet?'Sabit net hedef':'Sabit brüt';
  document.getElementById('estimate-raise-controls').hidden=!raise;
  document.getElementById('estimate-compare').hidden=!raise;
  document.getElementById('estimate-salary').value=salaryByMode[entryMode][currentMode];
  render();
}
function setMode(mode){
 if(!['gross','net'].includes(mode)||mode===currentMode)return;
 salaryByMode[entryMode][currentMode]=document.getElementById('estimate-salary').value;
 currentMode=mode;updateEntry();
}
function setEntry(mode){
 if(!['raise','direct'].includes(mode)||mode===entryMode)return;
 salaryByMode[entryMode][currentMode]=document.getElementById('estimate-salary').value;
 entryMode=mode;updateEntry();
}

function applyPreset(name) {
  const preset = ESTIMATE_PRESETS_2027[name];
  if (!preset) return;
  document.getElementById('estimate-minimum-gross').value = String(preset.minimum).replace('.', ',');
  document.getElementById('estimate-sgk-ceiling').value = String(preset.ceiling).replace('.', ',');
  preset.brackets.forEach((value, index) => {
    document.getElementById(`estimate-bracket-${index + 1}`).value = String(value).replace('.', ',');
  });
  document.querySelectorAll('[data-estimate-preset]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.estimatePreset === name));
  });
  render();
}

if(typeof document!=='undefined'){
document.querySelectorAll('[data-estimate-input]').forEach(input=>input.addEventListener('input',render));
document.querySelectorAll('[data-estimate-entry]').forEach(button=>button.addEventListener('click',()=>setEntry(button.dataset.estimateEntry)));
function selectRaise(rate){
 selectedRaise=rate;
 document.querySelectorAll('[data-estimate-raise]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.estimateRaise===rate)));
 render();
}
document.querySelectorAll('[data-estimate-raise]').forEach(b=>b.addEventListener('click',()=>selectRaise(b.dataset.estimateRaise)));
document.getElementById('estimate-custom-rate')?.addEventListener('input',e=>selectRaise(e.target.value.trim()===''?'30':'custom'));
document.querySelectorAll('[data-estimate-preset]').forEach(button=>button.addEventListener('click',()=>applyPreset(button.dataset.estimatePreset)));
document.querySelectorAll('[data-estimate-preset-link]').forEach(button=>button.addEventListener('click',()=>{
 applyPreset(button.dataset.estimatePresetLink);
 document.querySelector('.estimate-grid')?.scrollIntoView({behavior:'smooth',block:'start'});
}));
document.getElementById('estimate-mode-gross')?.addEventListener('click', () => setMode('gross'));
document.getElementById('estimate-mode-net')?.addEventListener('click', () => setMode('net'));
document.getElementById('estimate-reset')?.addEventListener('click', () => applyPreset('middle'));
updateEntry();
}
