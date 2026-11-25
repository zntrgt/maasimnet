import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { calculatePayrollYear, summarizePayroll, solveMonthlyGrossForFixedNet, tlToKurus } from '../src/payroll-engine.js';
import { DATA_2026 } from '../src/data-2026.js';
import { createBonusComparison } from './bonus-comparison.js';
import { formatTlFromKurus as money } from './render-scenarios.js';

const MONTHS=['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const fixedGross=amount=>Array(12).fill(tlToKurus(amount));
const regular=(base,options={})=>calculatePayrollYear({baseGrossKurusByMonth:base,...options});
export function buildScenarioComparisons(){
 const standard=regular(fixedGross(100000));
 const raised=regular([...fixedGross(100000).slice(0,6),...fixedGross(150000).slice(0,6)]);
 const fixedNet=regular(solveMonthlyGrossForFixedNet({targetNetKurus:tlToKurus(50000)}));
 const bonus=createBonusComparison();
 const rows=[
  ...[50000,75000,100000,150000,200000].map(amount=>({label:money(tlToKurus(amount))+' sabit brüt',rows:regular(fixedGross(amount))})),
  {label:'50.000 TL sabit net hedefi',rows:fixedNet},
  {label:'Temmuzda 100.000 → 150.000 TL brüt',rows:raised},
  {label:'100.000 TL brüt + Haziranda 50.000 TL prim',rows:bonus.withBonus},
  {label:'100.000 TL brüt, emekli çalışan (SGDP)',rows:regular(fixedGross(100000),{retired:true})}
 ].map(s=>({...s,summary:summarizePayroll(s.rows)}));
 return {rows,standard,raised,bonus,raiseSummary:summarizePayroll(raised),baselineSummary:summarizePayroll(standard)};
}
const sources='<p>Kaynaklar: <a href="'+DATA_2026.sources.minimumWage.url+'">ÇSGB asgari ücret</a> · <a href="'+DATA_2026.sources.incomeTax.url+'">GİB ücret geliri</a> · <a href="'+DATA_2026.sources.sgk.url+'">SGK prime esas kazanç</a> · <a href="/veriler/2026/">2026 verileri</a> · <a href="/hesaplama-metodolojisi/">Hesaplama yöntemi</a>.</p>';
const scope='<p>Örnekler 2026 Ocak–Aralık döneminde aynı işveren, 12 tam ay, sıfır başlangıç matrahı, engellilik indirimi ve belirtilenler dışında ek ödeme yok kabulüyle hesaplanır. SGDP satırı dışında standart çalışan; işveren maliyetinde diğer sektörlerde 2 puan indirim şartlarının sağlandığı varsayılır. Ücretler piyasa verisi değil, örnek senaryolardır. Asgari ücret vergi istisnaları ve kuruş yuvarlamaları merkezi motor tarafından uygulanır. Prim örneği SGK tavanını aşmaz.</p>';
const css='<style data-scenario-comparison-style="v1">.scenario-comparison{margin:28px 0}.scenario-comparison .scenario-scroll{overflow-x:auto;max-width:100%}.scenario-comparison table{width:100%;border-collapse:collapse;font-size:14px}.scenario-comparison th,.scenario-comparison td{padding:10px;text-align:left;border-bottom:1px solid #cbd5e1;white-space:nowrap}.scenario-comparison caption{text-align:left;padding:8px 0}.scenario-comparison .scenario-scroll:focus-visible{outline:2px solid #0f766e;outline-offset:2px}</style>';
function table(caption,headers,rows){
 return '<div class="scenario-scroll" role="region" aria-label="'+caption+'" tabindex="0"><table><caption>'+caption+'</caption><thead><tr>'+headers.map(h=>'<th scope="col">'+h+'</th>').join('')+'</tr></thead><tbody>'+rows.map(c=>'<tr><th scope="row">'+c[0]+'</th>'+c.slice(1).map(v=>'<td>'+v+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
}
export function scenarioHubBlock(data=buildScenarioComparisons()){
 const rows=data.rows.map(s=>[s.label,money(s.rows[0].netKurus),money(s.rows[11].netKurus),money(s.summary.averageNetKurus),money(s.summary.annualNetKurus),money(s.summary.annualGrossKurus),money(s.summary.annualEmployerCostKurus)]);
 return '<section class="scenario-comparison" data-scenario-comparison="hub"><h2>2026 maaş senaryoları: yıllık karşılaştırma</h2>'+scope+table('Maaş senaryoları — merkezi bordro motoru',['Senaryo','Ocak net','Aralık net','Ortalama net','Yıllık net','Yıllık brüt','Yıllık işveren maliyeti'],rows)+'<p>Sabit net hedefinde gereken brüt aydan aya değişebilir. Brütü sabit tutmak ile neti sabit tutmak farklı sonuçlar verir. <a href="/#hesaplayici">Kendi senaryonu hesapla</a> · <a href="/maas-teklifi-karsilastirma/">İş teklifini karşılaştır</a> · <a href="/vergi-dilimi-hesaplama/">Vergi dilimine geçişi hesapla</a>.</p>'+sources+'</section>';
}
export function raiseBlock(data=buildScenarioComparisons()){
 const rows=data.raised.map((r,i)=>[MONTHS[i],money(r.grossKurus),money(data.standard[i].netKurus),money(r.netKurus),money(r.netKurus-data.standard[i].netKurus),money(r.cumulativeTaxBaseKurus)]);
 return '<section class="scenario-comparison" data-scenario-comparison="raise"><h2>Temmuz zammının 12 aylık etkisi</h2>'+scope+'<p>100.000 TL sabit brüt ile Temmuzdan itibaren 150.000 TL brüt seçeneklerinin yıllık net farkı <strong>'+money(data.raiseSummary.annualNetKurus-data.baselineSummary.annualNetKurus)+'</strong> olur. Zam önceki altı ayı geriye dönük değiştirmez.</p>'+table('2026 — sabit brüt ve Temmuz zammı',['Ay','Zamlı brüt','Zamsız net','Zamlı net','Net fark','Zamlı kümülatif matrah'],rows)+sources+'<p><a href="/senaryolar/">Tüm maaş senaryolarını karşılaştır</a> · <a href="/maas-zam-hesaplama/">Zam oranını hesapla</a>.</p></section>';
}
function appendBlock(html,block){
 if(!/<\/main>/i.test(html))throw new Error('A15: main kapanışı yok');
 return html.replace(/<\/main>/i,block+'</main>').replace(/<\/head>/i,css+'</head>');
}
export async function applyScenarioComparisons(dist){
 const data=buildScenarioComparisons();
 const hub=join(dist,'senaryolar','index.html');
 let html=await readFile(hub,'utf8');
 await writeFile(hub,appendBlock(html,scenarioHubBlock(data)));
 const raise=join(dist,'temmuz-zam-senaryosu','index.html');
 html=await readFile(raise,'utf8');
 // Replace legacy printed numbers, including any repeated copies in structured data.
 const replacements=[
 ['84.812,89',money(data.raiseSummary.averageNetKurus)],
 ['1.017.754,63',money(data.raiseSummary.annualNetKurus)],
 ['96.724,95',money(data.raised[6].netKurus)],
 ['97.802,30',money(data.raised[7].netKurus)]
 ];
 for(const [old,value] of replacements){
  if(!html.includes(old))throw new Error('A15: eski zam örneği bulunamadı: '+old);
  html=html.replaceAll(old,value.replace(/ TL$/,''));
 }
 const laterEqual=data.raised.slice(7).every(r=>r.netKurus===data.raised[7].netKurus);
 if(!laterEqual)html=html.replace('Ağustos ve sonraki aylarda','Ağustos ayında');
 await writeFile(raise,appendBlock(html,raiseBlock(data)));
 console.log('A15 senaryolar: '+data.rows.length+' karşılaştırma, 12 aylık zam tablosu; '+JSON.stringify({average:data.raiseSummary.averageNetKurus,annual:data.raiseSummary.annualNetKurus,july:data.raised[6].netKurus,august:data.raised[7].netKurus,delta:data.raiseSummary.annualNetKurus-data.baselineSummary.annualNetKurus}));
}
