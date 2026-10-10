import { readFileSync } from 'node:fs';
export const GUIDE_DATE = '2026-09-17';
export const DISCOVERABLE_EMPLOYEE_GUIDES = new Set(['maas-butcesini-en-dusuk-aya-gore-kurmak','kira-artisi-maas-butcesi','kredi-taksiti-degisken-net-maas','yillik-ortalama-net-butce','maas-artmadan-gider-artisi']);
export const GUIDE_CATEGORIES = Object.freeze({budget:'Maaş bütçesi',net:'Net ücret',raise:'Zam kararları',bonus:'Prim ve ikramiye',offer:'İş teklifleri',benefit:'Yan hak değeri',tax:'Bordro okuma',timing:'Prim zamanlaması',split:'Prim taksitleri',purchasing:'Gelir ve gider dengesi'});
// 95 şablon rehber Ekim 2026'da konu başına tek kapsamlı rehberde birleştirildi.
// Yalnız DISCOVERABLE_EMPLOYEE_GUIDES ayrı sayfa olarak yayımlanır; diğerleri hedef
// rehberin "Sık karşılaşılan durumlar" bölümüne taşınır ve 301 ile yönlendirilir.
export const GUIDE_TARGETS = Object.freeze({budget:'/blog/is-yerinde-finansal-saglik/',net:'/blog/netten-brute-maas-neden-aylik-degisir/',tax:'/blog/2026-maas-vergi-dilimleri/',raise:'/blog/maas-zam-gorusmesi-nasil-yapilir/',offer:'/blog/is-teklifinin-yillik-degeri/',benefit:'/blog/esnek-yan-hak-butcesi/',bonus:'/blog/prim-ikramiye-net-maasi-neden-dusurur/',timing:'/blog/prim-ikramiye-net-maasi-neden-dusurur/',split:'/blog/prim-ikramiye-net-maasi-neden-dusurur/',purchasing:'/blog/is-teklifinin-yillik-degeri/'});
export const employeeGuides = readFileSync(new URL('./employee-topics.tsv', import.meta.url),'utf8').trim().split(/\r?\n/).map(line => {
  const parts = line.replace(/^\uFEFF/,'').split('|');
  if(parts.length!==7) throw new Error('İçerik satırı 7 alan içermeli');
  const [slug,title,kind,args,answer,detail,action] = parts;
  const cluster = ['offer','raise','timing','split','purchasing'].includes(kind) ? 'career-compensation' : kind==='benefit' || kind==='budget' ? 'benefits-wellbeing' : 'salary-2026';
  return Object.freeze({slug,title,kind,args:args.split(',').map(Number),answer,detail,action,cluster,generator:'employee',indexable:true,discoverable:DISCOVERABLE_EMPLOYEE_GUIDES.has(slug),retired:!DISCOVERABLE_EMPLOYEE_GUIDES.has(slug),redirectTo:DISCOVERABLE_EMPLOYEE_GUIDES.has(slug)?null:`${GUIDE_TARGETS[kind]}#${slug}`,publishedAt:GUIDE_DATE,modifiedAt:GUIDE_DATE});
});
if(employeeGuides.length!==100 || new Set(employeeGuides.map(p=>p.slug)).size!==100) throw new Error('Tam 100 benzersiz çalışan rehberi gerekli');
export const publishedEmployeeGuides = Object.freeze(employeeGuides.filter(p=>!p.retired));
export const retiredEmployeeGuides = Object.freeze(employeeGuides.filter(p=>p.retired));
export const retiredGuideRedirects = Object.freeze(Object.fromEntries(retiredEmployeeGuides.map(p=>[`/blog/${p.slug}/`,p.redirectTo])));
