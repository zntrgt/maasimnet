import { readFileSync } from 'node:fs';
export const GUIDE_DATE = '2026-09-17';
export const GUIDE_CATEGORIES = Object.freeze({budget:'Maaş bütçesi',net:'Net ücret',raise:'Zam kararları',bonus:'Prim ve ikramiye',offer:'İş teklifleri',benefit:'Yan hak değeri',tax:'Bordro okuma',timing:'Prim zamanlaması',split:'Prim taksitleri',purchasing:'Gelir ve gider dengesi'});
export const employeeGuides = readFileSync(new URL('./employee-topics.tsv', import.meta.url),'utf8').trim().split(/\r?\n/).map(line => {
  const parts = line.replace(/^\uFEFF/,'').split('|');
  if(parts.length!==7) throw new Error('İçerik satırı 7 alan içermeli');
  const [slug,title,kind,args,answer,detail,action] = parts;
  const cluster = ['offer','raise','timing','split','purchasing'].includes(kind) ? 'career-compensation' : kind==='benefit' || kind==='budget' ? 'benefits-wellbeing' : 'salary-2026';
  return Object.freeze({slug,title,kind,args:args.split(',').map(Number),answer,detail,action,cluster,generator:'employee',indexable:true,publishedAt:GUIDE_DATE,modifiedAt:GUIDE_DATE});
});
if(employeeGuides.length!==100 || new Set(employeeGuides.map(p=>p.slug)).size!==100) throw new Error('Tam 100 benzersiz çalışan rehberi gerekli');
