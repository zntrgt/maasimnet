import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { canonicalOf, metaOf } from '../content/html-attrs.js';
import { GEO_CONTENT_ROUTES } from '../content/site-metadata.js';
import { CONSOLIDATED_REDIRECTS } from '../src/consolidated-redirects.js';

const ORIGIN='https://maasim.net';
const decode=s=>String(s||'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#(?:39|x27);|&apos;/gi,"'").replace(/&nbsp;/g,' ').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
const plain=s=>decode(s).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
const comparable=s=>plain(s).toLocaleLowerCase('tr-TR').replace(/[‘’“”]/g,"'").replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const cleanTitle=s=>s.replace(/\s*\|\s*Maaşım\.net\s*$/i,'').trim();
const nodesOf=html=>[...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].flatMap(([,body])=>{const d=JSON.parse(body);return Array.isArray(d)?d:d['@graph']||[d]});
const hasType=(n,t)=>[n['@type']].flat().includes(t);
const titleOf=html=>plain(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]);
const visibleOf=html=>comparable(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<!--[\s\S]*?-->/g,''));
const noindex=html=>/\bnoindex\b/i.test(metaOf(html,'name','robots')?.attrs.content||'');
async function files(dir){const out=[];for(const e of await readdir(dir,{withFileTypes:true})){const f=join(dir,e.name);if(e.isDirectory())out.push(...await files(f));else if(e.name.endsWith('.html'))out.push(f);}return out;}
function routeOf(dist,file){const p=relative(dist,file).split(sep).join('/');return p==='index.html'?'/':p.endsWith('/index.html')?'/'+p.slice(0,-'index.html'.length):'/'+p;}
function breadcrumbs(route,title,urls,hubHtml){
 const trail=[['Ana Sayfa','/']];
 let parent=route.startsWith('/blog/')&&route!=='/blog/'?['Blog','/blog/']:route.startsWith('/veriler/')&&route!=='/veriler/'?['Veri Merkezi','/veriler/']:null;
 if(!parent&&route!=='/hesaplama-araclari/'&&hubHtml.includes('href="'+route+'"'))parent=['Hesaplama Araçları','/hesaplama-araclari/'];
 if(parent&&urls.has(ORIGIN+parent[1]))trail.push(parent);
 trail.push([cleanTitle(title),route]);
 return {'@context':'https://schema.org','@type':'BreadcrumbList','@id':ORIGIN+route+'#breadcrumb',itemListElement:trail.map(([name,path],i)=>({'@type':'ListItem',position:i+1,name,item:ORIGIN+path}))};
}
export async function auditTechnicalSeo(dist,{repair=false}={}){
 const xml=await readFile(join(dist,'sitemap.xml'),'utf8');
 const locs=[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>decode(m[1].trim()));
 const urls=new Set(locs),pages=new Map(),warnings=[],errors=[],titles=new Map();
 let breadcrumbAdded=0,faqPages=0,breadcrumbPages=0;
 const hubHtml=await readFile(join(dist,'hesaplama-araclari','index.html'),'utf8');
 for(const file of await files(dist)){
   let html=await readFile(file,'utf8');const route=routeOf(dist,file),url=ORIGIN+route;
   const canonical=canonicalOf(html);
   if(noindex(html)||canonical!==url||Object.hasOwn(CONSOLIDATED_REDIRECTS,route)){
     if(urls.has(url))errors.push(route+': sitemap URL noindex, redirect veya self-canonical değil');
     continue;
   }
   const title=titleOf(html);
   pages.set(url,{route,title});
   if(!urls.has(url)){warnings.push(route+': self-canonical sayfa sitemap dışında (indexleme niyeti incele)');continue;}
   if(!title)errors.push(route+': title eksik');
   if([...html.matchAll(/<title\b/gi)].length!==1)errors.push(route+': tek title gerekli');
   const key=comparable(title);
   if(titles.has(key))errors.push(route+': tekrar eden title ('+titles.get(key)+')');else titles.set(key,route);
   if(title.length>75)warnings.push(route+': uzun title ('+title.length+' karakter; mutlak limit değildir)');
   let nodes=nodesOf(html);
   let crumb=nodes.filter(n=>hasType(n,'BreadcrumbList'));
   if(route!=='/'&&!crumb.length&&repair){
      const b=breadcrumbs(route,title,urls,hubHtml);
      html=html.replace(/<\/head>/i,'<script type="application/ld+json">'+JSON.stringify(b).replace(/</g,'\\u003c')+'</script></head>');
      await writeFile(file,html,'utf8');crumb=[b];breadcrumbAdded++;
   }
   if(route!=='/'&&!crumb.length)errors.push(route+': BreadcrumbList eksik');
   if(crumb.length)breadcrumbPages++;
   for(const c of crumb){
     const list=c.itemListElement;
     if(!Array.isArray(list)||list.length<2||list.some((x,i)=>x.position!==i+1||!x.name||(!x.item&&i<list.length-1)))warnings.push(route+': mevcut breadcrumb biçimi inceleme gerekli');
     else for(const [i,x] of list.entries()){
       const item=typeof x.item==='object'?x.item['@id']:x.item;
       if(item&&(!urls.has(item)||i===list.length-1&&item!==url))warnings.push(route+': breadcrumb hedefi sitemap/son URL ile uyumsuz: '+item);
     }
   }
   const faq=nodes.filter(n=>hasType(n,'FAQPage'));
   if(faq.length)faqPages++;
   const visible=faq.length?visibleOf(html):'';
   for(const f of faq){
     if(!Array.isArray(f.mainEntity)||!f.mainEntity.length){warnings.push(route+': FAQ mainEntity boş');continue;}
     for(const q of f.mainEntity){
       const question=comparable(q.name),answer=comparable(q.acceptedAnswer?.text);
       if(!question||!answer||!visible.includes(question)||!visible.includes(answer))warnings.push(route+': FAQ metni görünür içerikle birebir eşleşmedi: '+plain(q.name).slice(0,120));
     }
   }
 }
 for(const loc of urls)if(!pages.has(loc))errors.push(loc+': sitemap hedefi uygun statik HTML olarak bulunamadı');
 if(urls.size!==locs.length)errors.push('Sitemap tekrar eden URL içeriyor');
 const groups=[
   ['Maaş ve çalışan hakları hesaplama araçları',['/','/hesaplama-araclari/','/gunluk-ucret-hesaplama/','/is-goremezlik-odenegi-hesaplama/','/net-maastan-kidem-tazminati-hesaplama/',...GEO_CONTENT_ROUTES.filter(r=>r!=='/')]],
   ['Veri ve doğrulama',['/veriler/','/veriler/2026/','/veriler/2027/','/hesaplama-metodolojisi/','/test-raporu/','/kaynak-politikasi/','/editoryal-politika/']],
   ['Rehber ve iletişim',['/kademeli-emeklilik/','/blog/','/sss/','/sozluk/','/hakkimizda/','/iletisim/']]
 ];
 const linked=new Set();
 const llms=['# Maaşım.net','','> Türkiye’de maaş, vergi, SGK ve çalışan hakları için yıl bazında hesaplama araçları ve kaynaklı içerikler.','','2027 maaş aracı resmî parametreler kesinleşene kadar tahmin niteliğindedir. Hesaplamalar bilgilendirme amaçlıdır; resmî bordro veya kişisel danışmanlık değildir.'];
 for(const [name,paths] of groups){
   const links=[];
   for(const path of paths){
      const url=ORIGIN+path;
      if(linked.has(url)||!urls.has(url)||!pages.has(url))continue;
      linked.add(url);
      const title=cleanTitle(pages.get(url).title).replace(/[\[\]]/g,'');
      links.push('- ['+title+']('+url+')'+(path==='/2027-maas-hesaplama/'?' — Tahmin aracı, resmî 2027 bordrosu değildir.':''));
   }
   if(links.length)llms.push('','## '+name,'',...links);
 }
 for(const p of ['/','/veriler/','/veriler/2026/','/veriler/2027/','/2027-maas-hesaplama/','/blog/','/isveren-maliyeti-hesaplama/','/vergi-dilimi-hesaplama/'])if(!linked.has(ORIGIN+p))errors.push(p+': llms.txt zorunlu bağlantı eksik');
 const llmsText=llms.join('\n')+'\n';
 if(repair)await writeFile(join(dist,'llms.txt'),llmsText,'utf8');
 else if(await readFile(join(dist,'llms.txt'),'utf8')!==llmsText)errors.push('llms.txt son sitemap ve title listesiyle uyuşmuyor');
 const report={sitemapUrls:urls.size,checkedTitles:titles.size,breadcrumbPages,breadcrumbAdded,faqPages,llmsLinks:linked.size,errors,warnings};
 console.log('A7 teknik SEO: '+JSON.stringify(report));
 if(errors.length)throw new Error(errors.join('\n'));
 return report;
}
