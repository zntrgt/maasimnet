import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DATA_2026 as D } from '../src/data-2026.js';
import { DATA_2027 as Y } from '../src/data-2027.js';
import { calculatePayrollYear, summarizePayroll } from '../src/payroll-engine.js';
import { employerCost } from '../src/employer-cost-engine.js';
import { HISTORICAL_PAYROLL_DATA } from '../src/historical-payroll-data.js';
import { DAILY_FLOOR_KURUS, RATES_PPM } from '../src/borrowing-engine.js';
import { KNOWN_MONTHS, knownCumulativePct, MIN_PENSION_KURUS } from '../src/zam-2027-engine.js';
import { latestCap } from '../src/rent-engine.js';

const P=D.payroll;
const fmt=k=>(k/100).toLocaleString('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2})+' TL';
const pct=n=>n.toLocaleString('tr-TR',{maximumFractionDigits:2})+'%';
const escape=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const wage=[D.sources.minimumWage.url,'ÇSGB'];
const tax=['https://gib.gov.tr/mevzuat/kanun/433/madde/6937','GİB'];
const sgk=[D.sources.sgk.url,'SGK'];
const rates=['https://sgk.gov.tr/Content/Post/c7812ea8-5087-413f-aeb5-d3c1d153e11a/Isveren-Prim-Oranlari-2026-01-13-04-52-38','SGK prim oranları'];
const law=['https://www.csgb.gov.tr/sikca-sorulan-sorular/calisma-genel-mudurlugu/%C4%B1s-kanunu/','ÇSGB / 4857 sayılı Kanun'];
const severance=[D.sources.severance.url,'ÇSGB'];
const tuik=['https://veriportali.tuik.gov.tr/tr/press/58291','TÜİK, 3 Kasım 2026'];
const method=['/hesaplama-metodolojisi/','Hesaplama metodolojisi'];
const payroll=(gross,retired=false)=>calculatePayrollYear({baseGrossKurusByMonth:Array(12).fill(gross),retired});
export function salaryExamples(){
 return [P.minimumGrossKurus,5000000,7500000,10000000,15000000].map(gross=>{
  const rows=payroll(gross);const s=summarizePayroll(rows);
  return {grossKurus:gross,januaryKurus:rows[0].netKurus,decemberKurus:rows[11].netKurus,averageKurus:s.averageNetKurus,annualKurus:s.annualNetKurus};
 });
}
const ref=salaryExamples()[3];
const standardCost=employerCost(10000000,'other').employerCostKurus;
const minimumCost=employerCost(P.minimumGrossKurus,'other').employerCostKurus;
const cumulative=pct(knownCumulativePct());
const entry=(path,answer,sources)=>({path,answer,sources});
export const GEO_ANSWERS=Object.freeze([
 entry('/',`2026’da her ay 100.000 TL brüt alan standart çalışan için Ocak neti ${fmt(ref.januaryKurus)}, Aralık neti ${fmt(ref.decemberKurus)}, 12 aylık ortalama net ${fmt(ref.averageKurus)} olur (sıfır başlangıç matrahı, ek ödeme ve engellilik indirimi yok).`,[wage,tax,sgk,method]),
 entry('/asgari-ucret-hesaplama/',`1 Ocak–31 Aralık 2026 döneminde aylık brüt asgari ücret ${fmt(P.minimumGrossKurus)}, net asgari ücret ${fmt(P.referenceMinimumNetKurus)}’dir.`,[wage]),
 entry('/maas-zam-hesaplama/','2026’da örnek olarak 50.000 TL maaşa %20 zam yapıldığında aynı ücret türündeki yeni maaş 60.000 TL olur; brüt zam net maaşın aynı oranda artacağı anlamına gelmez.',[method]),
 entry('/isveren-maliyeti-hesaplama/',`2026’da 100.000 TL brüt maaşın işverene aylık maliyeti diğer sektörlerde 2 puan indirimle ${fmt(standardCost)}, imalatta 5 puan indirimle ${fmt(employerCost(10000000,'manufacturing').employerCostKurus)} olur (indirim şartları sağlandığında).`,[wage,rates]),
 entry('/vergi-dilimi-hesaplama/','2026’da Ocak ayında sıfır matrahla başlayan, her ay 100.000 TL brüt alan standart çalışan Mart ayında %20, Mayıs ayında %27 ücret gelir vergisi dilimine geçer.',[tax,wage]),
 entry('/asgari-ucret-isveren-maliyeti/',`2026’da asgari ücretli standart çalışanın aylık işveren maliyeti diğer sektörlerde 2 puan prim indirimi şartları sağlandığında ${fmt(minimumCost)} olur (ilave destekler hariç).`,[wage]),
 entry('/emekli-calisan-maas-hesaplama/',`2026’da SGDP’ye tabi emekli çalışanın 100.000 TL brüt maaşı için Ocak neti ${fmt(payroll(10000000,true)[0].netKurus)} olur (sıfır başlangıç matrahı, ek ödeme ve kişisel indirim yok).`,[rates,tax,method]),
 entry('/2027-maas-hesaplama/',`24 Kasım 2026’da ilan edilen yeniden değerleme oranı %${(Y.revaluation.valueBps/100).toLocaleString('tr-TR')} olmakla birlikte 2027 asgari ücreti ve ücret gelir vergisi tarifesi henüz kesinleşmediğinden bu araçtaki sonuçlar tahmindir.`,[[Y.revaluation.sourceUrl,'Resmî Gazete, 24 Kasım 2026']]),
 entry('/tazminat-hesaplama/',`1 Temmuz–31 Aralık 2026’da hak kazanılan kıdem tazminatı için bir hizmet yılının brüt tavanı ${fmt(D.publishedData.severanceCeiling.secondHalfKurus)}, yasal ihbar süreleri ise kıdeme göre 2, 4, 6 veya 8 haftadır.`,[severance,law]),
 entry('/kidem-tazminati-hesaplama/',`1 Temmuz–31 Aralık 2026’da hak kazanılan kıdem tazminatının bir hizmet yılı için brüt tavanı ${fmt(D.publishedData.severanceCeiling.secondHalfKurus)}’dir.`,[severance]),
 entry('/ihbar-tazminati-hesaplama/','2026’da belirsiz süreli iş sözleşmesinde kanuni asgari ihbar süreleri kıdeme göre 2, 4, 6 veya 8 haftadır; tazminat hakkı fesih koşullarına bağlıdır.',[law]),
 entry('/issizlik-maasi-hesaplama/',`2026’da işsizlik ödeneği son 4 aylık prime esas kazancın günlük ortalamasının %40’ı üzerinden hesaplanır; aylık brüt ödenek ${fmt(Math.round(P.minimumGrossKurus*0.8))} tutarını aşamaz.`,[[D.sources.unemployment.url,'İŞKUR'],wage]),
 entry('/emeklilik-hesaplama/','2026’da 4/a kapsamında 1 Mayıs 2008 ve sonrasında ilk defa sigortalı olanlarda normal emeklilik için 7.200 prim günü ve prim şartının tamamlandığı tarihe bağlı yaş şartı aranır.',[['https://www.sgk.gov.tr/Content/Post/785eac3b-d260-47b5-8103-ae591b2ac320/4a-Hizmet-Akdi-ile-Calisanlar-2024-01-11-02-39-38','SGK 4/a']]),
 entry('/emekli-zammi-hesaplama/',`3 Kasım 2026 itibarıyla Temmuz–Ekim 2026 dört aylık birleşik TÜFE artışı ${cumulative} olup Ocak 2027 SSK/Bağ-Kur zammı için Kasım ve Aralık verileri henüz beklenmektedir.`,[tuik]),
 entry('/memur-zammi-hesaplama/',`3 Kasım 2026 itibarıyla Temmuz–Ekim 2026 dört aylık birleşik TÜFE artışı ${cumulative}; Ocak 2027 memur zammındaki enflasyon farkı henüz kesinleşmemiştir.`,[tuik]),
 entry('/en-dusuk-emekli-maasi/',`Temmuz 2026 ödeme döneminden itibaren 5510 sayılı Kanunun ek 19. maddesi kapsamındaki dosya bazında asgari aylık ödeme tutarı ${fmt(MIN_PENSION_KURUS)}’dir.`,[['https://www.resmigazete.gov.tr/eskiler/2026/07/20260731-2.htm','7590 sayılı Kanun, 31 Temmuz 2026']]),
 entry('/emekli-promosyonu/','2026’da emekli banka promosyonu 3 yıllık taahhüt karşılığı ödenir; erken banka değişikliğinde alınan promosyonun kalan süreye orantılı kısmının iadesi gerekir.',[['https://ordu.sgk.gov.tr/Content/Post/d5821676-c474-4544-b65c-d64a04a7b741/Genel-Bilgi-2024-12-26-02-07-58','SGK']]),
 entry('/borclanma-hesaplama/',`2026’da günlük asgari prime esas kazanç üzerinden askerlik borçlanması ${fmt(Math.round(DAILY_FLOOR_KURUS*RATES_PPM.askerlik/1000000))}, doğum borçlanması ${fmt(Math.round(DAILY_FLOOR_KURUS*RATES_PPM.dogum/1000000))} tutarındadır.`,[['https://www.sgk.gov.tr/Content/Post/fa958e8c-5b22-4ca0-a963-1d68de59159e/5510-Sayili-Kanuna-Gore-Borclanma-2026-04-29-10-35-23','SGK, 29 Nisan 2026'],wage]),
 entry('/kira-artis-orani-hesaplama/',`${latestCap().label} yenilemelerinde Ekim 2026 TÜFE on iki aylık ortalamasına göre genel kira artış tavanı %${latestCap().pct.toLocaleString('tr-TR')}’tür (TBK m.344 kapsamındaki özel durumlar saklıdır).`,[tuik,['https://www.mevzuat.gov.tr/mevzuatmetin/1.5.6098.pdf','Türk Borçlar Kanunu m.344']]),
 entry('/fazla-mesai-hesaplama/','2026’da haftalık 45 saati aşan olağan fazla çalışma için bir saatlik brüt ücret normal saatlik ücretin %50 artırılmasıyla hesaplanır.',[law]),
 entry('/yillik-izin-ucreti-hesaplama/','2026’da iş sözleşmesi sona erdiğinde hak edilmiş kullanılmayan yıllık izin ücreti son ücret üzerinden ödenir; örneğin aylık 60.000 TL brüt ve 10 gün için brüt karşılığı 20.000 TL’dir.',[law]),
 entry('/resmi-tatil-mesai-ucreti-hesaplama/','2026’da ulusal bayram veya genel tatil gününde çalışan işçiye normal ücretine ek olarak çalıştığı her gün için 1 günlük ücret ödenir (4857 m.47).',[law]),
 entry('/hafta-tatili-ucreti-hesaplama/','2026’da hafta tatili, şartları sağlayan işçiye 7 günlük dönem içinde en az 24 saat kesintisiz dinlenme hakkı sağlar; çalıştırılması halinde ilave ücret koşulları değerlendirilir.',[law]),
 entry('/part-time-maas-hesaplama/','2026’da örnek olarak aynı işin 45 saatlik haftalık brüt ücreti 60.000 TL ise, 22,5 saatlik kısmi süreli çalışma için süreyle orantılı brüt ücret 30.000 TL olur.',[law,sgk]),
 entry('/eksik-gun-maas-hesaplama/','2026’da aylık 60.000 TL brüt ücretli işçide 30 gün üzerinden kıst hesap uygulandığı varsayılırsa 20 ücretli günün brüt karşılığı 40.000 TL’dir.',[law,sgk]),
 entry('/sgk-prim-hesaplama/',`1 Ocak–31 Aralık 2026’da standart çalışan SGK payı %14, işsizlik primi %1 ve aylık prime esas kazanç üst sınırı ${fmt(P.sgkCeilingKurus)}’dir.`,[wage,sgk]),
 ...Object.values(HISTORICAL_PAYROLL_DATA).map(d=>entry('/'+d.year+'-maas-hesaplama/',`${d.year} Ocak döneminde aylık brüt asgari ücret ${fmt(d.periods[0].minimumGrossKurus)}, referans net asgari ücret ${fmt(d.periods[0].referenceMinimumNetKurus)}’dir${d.agiEnabled?' (bekâr, çocuksuz çalışan için AGİ dahil)':''}; hesaplama o yılın kurallarına göre yapılır.`,[[d.sourceUrls[0],'ÇSGB geçmiş yıl ücret arşivi'],[d.sourceUrls.at(-1),'GİB']])),
 entry('/maas-teklifi-karsilastirma/','2026’da iki maaş teklifi aynı aylık net tutarı verse bile yıllık toplam değer 12 aylık net maaş, prim ve yan haklarla birlikte karşılaştırılmalıdır.',[method]),
 entry('/prim-ikramiye-maas-hesaplama/','2026’da örnek olarak 50.000 TL aylık brüte 10.000 TL brüt ikramiye eklenirse o ay toplam brüt 60.000 TL olur; net artış kümülatif matraha ve prim kurallarına bağlıdır.',[tax,sgk,method])
]);
const sourcesHtml=items=>items.map(([url,label])=>`<a href="${escape(url)}">${escape(label)}</a>`).join(' · ');
const style='<style data-geo-answer-style="v1">.geo-direct-answer{margin:12px 0 16px;padding:12px 14px;border-left:3px solid #0f766e;background:#f0fdfa;color:#134e4a;font-size:15px;line-height:1.55}.geo-direct-answer a,.geo-salary-examples a{color:#0f766e;text-decoration:underline;text-underline-offset:2px}.geo-direct-answer small{display:block;margin-top:4px;font-size:12px}.geo-salary-examples{margin:24px 0;padding:18px;border:1px solid #dbe4ee;border-radius:14px;background:#fff;color:#0f172a}.geo-salary-examples h2{font-size:clamp(20px,3vw,26px);margin:0 0 12px}.geo-salary-scroll{overflow-x:auto}.geo-salary-examples table{width:100%;min-width:540px;border-collapse:collapse;font-size:14px}.geo-salary-examples th,.geo-salary-examples td{padding:10px;border-bottom:1px solid #dbe4ee;text-align:right;white-space:nowrap}.geo-salary-examples th:first-child{text-align:left}.geo-salary-examples p{font-size:14px;line-height:1.6;margin:12px 0 0}</style>';
function table(){
 return `<section class="geo-salary-examples" id="2026-brut-net-ornekleri" aria-labelledby="geo-salary-title"><h2 id="geo-salary-title">2026 brüt–net maaş örnekleri</h2><div class="geo-salary-scroll" role="region" aria-label="Brüt net maaş örnek tablosu" tabindex="0"><table><thead><tr><th scope="col">Aylık brüt</th><th scope="col">Ocak neti</th><th scope="col">Aralık neti</th><th scope="col">Aylık ortalama net</th></tr></thead><tbody>${salaryExamples().map(r=>`<tr><th scope="row">${fmt(r.grossKurus)}${r.grossKurus===P.minimumGrossKurus?' (asgari ücret)':''}</th><td>${fmt(r.januaryKurus)}</td><td>${fmt(r.decemberKurus)}</td><td>${fmt(r.averageKurus)}</td></tr>`).join('')}</tbody></table></div><p>Varsayım: 2026 Ocak–Aralık, aynı işveren, 12 tam ay, standart çalışan, sıfır başlangıç kümülatif matrahı, ek ödeme ve engellilik indirimi yok; ortalama net 12 aylık net toplamının 12’ye bölünmesidir.</p><p>Kaynak: ${sourcesHtml([wage,tax,sgk,method])} · <a href="/test-raporu/">Hesaplama testleri</a>.</p></section>`;
}
function insertAfterPayroll(html,block){
 const start=html.search(/<div\b[^>]*class="[^"]*\bcalculator-table-full\b[^"]*"[^>]*>/i);
 if(start<0)throw new Error('Ana sayfa bordro tablosu bulunamadı');
 const tags=/<\/?div\b[^>]*>/gi;tags.lastIndex=start;let depth=0;
 for(let m;(m=tags.exec(html));){depth+=m[0].startsWith('</')?-1:1;if(depth===0)return html.slice(0,tags.lastIndex)+block+html.slice(tags.lastIndex);}
 throw new Error('Ana sayfa bordro tablosu kapanışı bulunamadı');
}
export async function addGeoAnswers(dist){
 for(const a of GEO_ANSWERS){
  const path=join(dist,a.path.replace(/^\/+|\/+$/g,''),'index.html');
  let html=await readFile(path,'utf8');
  if(html.includes('data-geo-answer="v1"'))continue;
  if(!/<\/h1>/i.test(html))throw new Error('GEO H1 bulunamadı: '+a.path);
  html=html.replace(/<\/h1>/i,`</h1><p class="geo-direct-answer" data-geo-answer="v1">${escape(a.answer)} <small>Kaynak: ${sourcesHtml(a.sources)}</small></p>`);
  html=html.replace(/<\/head>/i,style+'</head>');
  if(a.path==='/')html=insertAfterPayroll(html,table());
  await writeFile(path,html,'utf8');
 }
}
