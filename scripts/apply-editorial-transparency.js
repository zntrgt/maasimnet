import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { indexableBlogPosts,blogRoute } from '../content/blog-manifest.js';
import { GEO_CONTENT_ROUTES,getPageMetadata,formatSiteDateTr } from '../content/site-metadata.js';
import { EDITORIAL_AUTHORITY } from '../content/editorial-authority.js';
import { DATA_2026 } from '../src/data-2026.js';
import { DATA_2027 } from '../src/data-2027.js';

export const TRANSPARENCY_ROUTES=Object.freeze([...new Set([
 ...indexableBlogPosts.map(blogRoute),...GEO_CONTENT_ROUTES,
 '/senaryolar/','/temmuz-zam-senaryosu/','/100000-brut-maas-hesaplama/','/net-maastan-kidem-tazminati-hesaplama/',
 '/is-goremezlik-odenegi-hesaplama/','/gunluk-ucret-hesaplama/',
 '/kademeli-emeklilik/','/veriler/2026/','/veriler/2027/'
])]);
const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const time=d=>d?'<time datetime="'+esc(d)+'">'+esc(formatSiteDateTr(d))+'</time>':'Ayrı kayıt bulunmuyor';
const row=(label,value)=>'<div><dt>'+esc(label)+'</dt><dd>'+value+'</dd></div>';
const link=(url,label)=>'<a href="'+esc(url)+'">'+esc(label)+'</a>';
const records=[
 ...Object.values(DATA_2026.sources),
 {institution:'Hazine ve Maliye Bakanlığı / Gelir İdaresi Başkanlığı',documentTitle:DATA_2027.revaluation.sourceTitle||'2026 yeniden değerleme oranı',legalBasis:'Vergi Usul Kanunu Genel Tebliği',url:DATA_2027.revaluation.sourceUrl,publishedAt:DATA_2027.revaluation.publishedAt}
];
function exactSourceLinks(html){
 const urls=new Set([...html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["']/gi)].map(m=>m[1].replace(/&amp;/g,'&')));
 return records.filter(s=>urls.has(s.url));
}
function sourceRecords(html){
 const matches=exactSourceLinks(html);
 const items=matches.map(s=>{
 const host=new URL(s.url).hostname;
 const primary=host.endsWith('.gov.tr')||host==='gov.tr';
 return '<li><strong>'+esc(s.institution)+'</strong> — '+link(s.url,s.documentTitle)+(primary?'':' (belgenin üçüncü taraf kopyası)')+'<br><small>'+esc(s.legalBasis||'Madde/bölüm ayrı kaydedilmemiş')+' · Yayın: '+time(s.publishedAt)+' · Kaynağa özel kontrol: '+time(s.reviewedAt)+'</small></li>';
 });
 return '<p>Temel kaynaklar ve ilgili belge bağlantıları sayfanın kendi kaynak bölümlerinde yer alır. Aşağıdaki kayıtlar, bu sayfada bağlantısı bulunan ve merkezi veri katmanında ayrıntıları kayıtlı belgeleri gösterir. Eksik tarih ve belge bilgileri tahmin edilmez.</p>'+(items.length?'<ul>'+items.join('')+'</ul>':'<p>Bu sayfanın merkezi kaynak kaydı ayrı olarak eşleştirilmemiştir; sayfadaki özgün kaynak bağlantılarını kullan.</p>');
}
const monthly2026=new Set(['/','/senaryolar/','/temmuz-zam-senaryosu/','/100000-brut-maas-hesaplama/','/isveren-maliyeti-hesaplama/','/vergi-dilimi-hesaplama/','/asgari-ucret-hesaplama/','/asgari-ucret-isveren-maliyeti/','/emekli-calisan-maas-hesaplama/','/net-maastan-kidem-tazminati-hesaplama/','/prim-ikramiye-maas-hesaplama/','/sgk-prim-hesaplama/','/veriler/2026/']);
const year2026=new Set([...monthly2026,'/tazminat-hesaplama/','/kidem-tazminati-hesaplama/','/ihbar-tazminati-hesaplama/','/issizlik-maasi-hesaplama/','/fazla-mesai-hesaplama/','/yillik-izin-ucreti-hesaplama/','/resmi-tatil-mesai-ucreti-hesaplama/','/hafta-tatili-ucreti-hesaplama/','/part-time-maas-hesaplama/','/eksik-gun-maas-hesaplama/','/gunluk-ucret-hesaplama/','/is-goremezlik-odenegi-hesaplama/']);
function scope(path){
 if(path==='/2027-maas-hesaplama/'||path==='/veriler/2027/')return '2027 senaryosu / açıklanma durumu; kesinleşmemiş veriler tahmin veya beklemede.';
 if(year2026.has(path))return '2026; ilgili mevzuat, bordro veya fesih dönemi sayfada açıklanır.';
 const historical=path.match(/^\/(202[0-5])-maas-hesaplama\/$/);
 if(historical)return historical[1]+' yılı; dönemsel kurallar kullanılır.';
 return 'İçerikte belirtilen tarih, konu ve örnek koşulları; tek bir ortak geçerlilik dönemi varsayılmaz.';
}
const css='<style data-editorial-transparency-style="v1">.editorial-transparency{margin:28px 0;color:inherit;border:1px solid #cbd5e1;border-radius:12px;padding:16px}.editorial-transparency h2{font-size:18px;margin:0 0 12px}.editorial-transparency p,.editorial-transparency li,.editorial-transparency dd,.editorial-transparency dt{font-size:14px;line-height:1.6;overflow-wrap:anywhere}.editorial-transparency dl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:12px 0}.editorial-transparency dt{font-weight:700}.editorial-transparency dd{margin:0}.editorial-transparency summary{cursor:pointer;font-weight:600}.editorial-transparency a{text-decoration:underline;text-underline-offset:2px}@media(max-width:640px){.editorial-transparency dl{grid-template-columns:1fr}}</style>';
export function addTransparencyBlock(html,path){
 if(html.includes('data-editorial-transparency="v1"'))return html;
 const meta=getPageMetadata(path);
 const blog=path.startsWith('/blog/');
 const author=blog?EDITORIAL_AUTHORITY.editorialTeam.name:'Maaşım.net';
 const fields=[
 ['Hazırlayan',link('/editoryal-politika/',author)],
 ['Teknik kontrol',link('/test-raporu/','Hesap motoru testleri')+'; bu bağlantı yazının bağımsız teknik inceleme onayı değildir.'],
 ['Hukuki / bağımsız uzman kontrolü','Bu sayfa için doğrulanmış bağımsız uzman onayı yayımlanmıyor.'],
 ['İlk yayın',time(meta.publishedAt)],
 ['Son güncelleme',time(meta.modifiedAt)],
 ['Kayıtlı içerik / veri kontrolü',time(meta.reviewedAt)],
 ['Geçerlilik kapsamı',esc(scope(path))],
 ['Hesaplama / veri sürümü',monthly2026.has(path)?esc(DATA_2026.engineVersion)+' · 2026 veri seti; '+link('/hesaplama-metodolojisi/','metodoloji'):'Sayfaya özgü yöntem ve kaynaklar; ayrı sürüm numarası belirtilmemiş.']
 ];
 const block='<section class="editorial-transparency" data-editorial-transparency="v1" aria-label="Yayın ve kaynak şeffaflığı"><h2>Yayın, kaynak ve kontrol bilgileri</h2><dl>'+fields.map(([l,v])=>row(l,v)).join('')+'</dl><details><summary>Temel kaynak kayıtları ve değişiklik geçmişi</summary>'+sourceRecords(html)+'<p><strong>Değişiklik geçmişi:</strong> Son kayıtlı içerik güncellemesi '+time(meta.modifiedAt)+'. Ayrıntılı geçmiş kaydı ayrıca yayımlanmamışsa bu tarih tam bir değişiklik günlüğü sayılmaz.</p></details><p>Bilgilendirme amaçlıdır; kişisel bordro, hukuk veya vergi danışmanlığı yerine geçmez. '+link('/kaynak-politikasi/','Kaynak politikası')+' · '+link('/iletisim/','Hata veya kaynak düzeltmesi bildir')+'</p></section>';
 const at=html.lastIndexOf('</main>');
 const fallback=html.lastIndexOf('</article>');
 const i=at>=0?at:fallback;
 if(i<0)throw new Error('A14 içerik kapanışı bulunamadı: '+path);
 return (html.slice(0,i)+block+html.slice(i)).replace(/<\/head>/i,css+'</head>');
}
export async function applyEditorialTransparency(dist){
 for(const path of TRANSPARENCY_ROUTES){
 const file=join(dist,path.replace(/^\/+|\/+$/g,''),'index.html');
 const html=await readFile(file,'utf8');
 await writeFile(file,addTransparencyBlock(html,path),'utf8');
 }
 console.log('A14 yayın şeffaflığı: '+TRANSPARENCY_ROUTES.length+' sayfa.');
}
