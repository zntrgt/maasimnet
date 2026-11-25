import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { canonicalOf, metaOf } from '../content/html-attrs.js';
import { consolidatedRedirectFor } from '../src/consolidated-redirects.js';

const ORIGIN='https://maasim.net';
const labels=Object.freeze({
 '/gunluk-ucret-hesaplama/':'Günlük ve saatlik ücret hesaplama',
 '/part-time-maas-hesaplama/':'Part-time maaş hesaplama',
 '/fazla-mesai-hesaplama/':'Fazla mesai hesaplama',
 '/eksik-gun-maas-hesaplama/':'Eksik gün maaş hesaplama',
 '/is-goremezlik-odenegi-hesaplama/':'Rapor parası ve iş göremezlik ödeneği hesaplama',
 '/net-maastan-kidem-tazminati-hesaplama/':'Net maaştan kıdem tazminatı hesaplama',
 '/':'Brütten nete ve netten brüte maaş hesaplama',
 '/veriler/':'Yıllara göre bordro veri merkezi',
 '/veriler/2026/':'2026 resmî bordro verileri',
 '/veriler/2027/':'2027 bordro verilerinin açıklanma durumu',
 '/2027-maas-hesaplama/':'2027 maaş tahmin aracı',
 '/isveren-maliyeti-hesaplama/':'İşveren maliyeti hesaplama',
 '/vergi-dilimi-hesaplama/':'Vergi dilimine geçiş ayını hesapla',
 '/asgari-ucret-hesaplama/':'2026 asgari ücret hesaplama',
 '/sgk-prim-hesaplama/':'SGK ve işsizlik primi hesaplama',
 '/blog/2026-maas-vergi-dilimleri/':'2026 ücret gelir vergisi tarifesi ve örnekleri',
 '/blog/2026-sgk-tavani/':'2026 SGK tavanı ve bordro etkisi',
 '/blog/is-degisikliginde-vergi-matrahi/':'İş değişikliğinde vergi matrahı',
 '/blog/netten-brute-maas-neden-aylik-degisir/':'Netten brüte maaş neden aylık değişir?',
 '/blog/2027-maas-zammi-beklentileri/':'2027 asgari ücret ve maaş zammı beklentileri',
 '/blog/prim-ikramiye-net-maasi-neden-dusurur/':'Prim ve ikramiyenin net maaşa etkisi',
 '/prim-ikramiye-maas-hesaplama/':'Prim ve ikramiye maaş hesaplama',
 '/maas-teklifi-karsilastirma/':'İş teklifinin yıllık değerini karşılaştır',
 '/blog/is-teklifinin-yillik-degeri/':'İş teklifinin yıllık değeri rehberi',
 '/kidem-tazminati-hesaplama/':'Kıdem tazminatı hesaplama',
 '/ihbar-tazminati-hesaplama/':'İhbar tazminatı hesaplama',
 '/blog/kidem-tazminatina-dahil-odemeler/':'Kıdem tazminatına dahil ödemeler',
 '/tazminat-hesaplama/':'Kıdem ve ihbar tazminatı hesaplama',
 '/yillik-izin-ucreti-hesaplama/':'Kullanılmayan yıllık izin ücretini hesapla',
 '/emeklilik-hesaplama/':'Mevcut mevzuata göre emeklilik tarihini hesapla',
 '/kademeli-emeklilik/':'Kademeli emeklilik: teklif ve mevcut durum',
 '/borclanma-hesaplama/':'Askerlik ve doğum borçlanması hesaplama',
 '/emekli-calisan-maas-hesaplama/':'Emekli çalışan maaş hesaplama',
 '/emekli-zammi-hesaplama/':'Emekli zammı hesaplama',
 '/en-dusuk-emekli-maasi/':'En düşük emekli aylığı ve kök maaş',
 '/hesaplama-metodolojisi/':'Hesaplama metodolojisi',
 '/test-raporu/':'Hesap motoru doğrulama testleri'
});
export const CONTEXTUAL_LINKS=Object.freeze({
 '/gunluk-ucret-hesaplama/':['/','/part-time-maas-hesaplama/','/eksik-gun-maas-hesaplama/','/fazla-mesai-hesaplama/'],
 '/part-time-maas-hesaplama/':['/gunluk-ucret-hesaplama/'],
 '/eksik-gun-maas-hesaplama/':['/gunluk-ucret-hesaplama/'],
 '/fazla-mesai-hesaplama/':['/gunluk-ucret-hesaplama/'],
 '/is-goremezlik-odenegi-hesaplama/':['/sgk-prim-hesaplama/','/eksik-gun-maas-hesaplama/','/veriler/2026/'],
 '/net-maastan-kidem-tazminati-hesaplama/':['/kidem-tazminati-hesaplama/','/','/vergi-dilimi-hesaplama/'],
 '/':['/veriler/','/vergi-dilimi-hesaplama/','/isveren-maliyeti-hesaplama/'],
 '/veriler/':['/veriler/2026/','/veriler/2027/'],
 '/veriler/2026/':['/veriler/','/veriler/2027/','/vergi-dilimi-hesaplama/','/isveren-maliyeti-hesaplama/'],
 '/veriler/2027/':['/veriler/','/2027-maas-hesaplama/'],
 '/2027-maas-hesaplama/':['/veriler/2027/','/blog/2027-maas-zammi-beklentileri/'],
 '/blog/2027-maas-zammi-beklentileri/':['/2027-maas-hesaplama/','/veriler/2027/'],
 '/isveren-maliyeti-hesaplama/':['/','/sgk-prim-hesaplama/','/blog/2026-sgk-tavani/'],
 '/vergi-dilimi-hesaplama/':['/','/blog/2026-maas-vergi-dilimleri/','/blog/is-degisikliginde-vergi-matrahi/'],
 '/blog/2026-maas-vergi-dilimleri/':['/vergi-dilimi-hesaplama/','/'],
 '/blog/is-degisikliginde-vergi-matrahi/':['/vergi-dilimi-hesaplama/','/'],
 '/blog/netten-brute-maas-neden-aylik-degisir/':['/','/vergi-dilimi-hesaplama/'],
 '/asgari-ucret-hesaplama/':['/gunluk-ucret-hesaplama/','/isveren-maliyeti-hesaplama/','/veriler/2026/'],
 '/sgk-prim-hesaplama/':['/is-goremezlik-odenegi-hesaplama/','/blog/2026-sgk-tavani/','/isveren-maliyeti-hesaplama/'],
 '/blog/2026-sgk-tavani/':['/sgk-prim-hesaplama/','/isveren-maliyeti-hesaplama/'],
 '/prim-ikramiye-maas-hesaplama/':['/blog/prim-ikramiye-net-maasi-neden-dusurur/','/vergi-dilimi-hesaplama/'],
 '/blog/prim-ikramiye-net-maasi-neden-dusurur/':['/prim-ikramiye-maas-hesaplama/','/vergi-dilimi-hesaplama/'],
 '/maas-teklifi-karsilastirma/':['/blog/is-teklifinin-yillik-degeri/','/isveren-maliyeti-hesaplama/'],
 '/blog/is-teklifinin-yillik-degeri/':['/maas-teklifi-karsilastirma/'],
 '/kidem-tazminati-hesaplama/':['/net-maastan-kidem-tazminati-hesaplama/','/blog/kidem-tazminatina-dahil-odemeler/','/ihbar-tazminati-hesaplama/','/yillik-izin-ucreti-hesaplama/'],
 '/ihbar-tazminati-hesaplama/':['/kidem-tazminati-hesaplama/','/tazminat-hesaplama/'],
 '/blog/kidem-tazminatina-dahil-odemeler/':['/kidem-tazminati-hesaplama/','/tazminat-hesaplama/'],
 '/tazminat-hesaplama/':['/kidem-tazminati-hesaplama/','/ihbar-tazminati-hesaplama/'],
 '/emeklilik-hesaplama/':['/kademeli-emeklilik/','/borclanma-hesaplama/'],
 '/kademeli-emeklilik/':['/emeklilik-hesaplama/','/borclanma-hesaplama/'],
 '/borclanma-hesaplama/':['/emeklilik-hesaplama/'],
 '/emekli-calisan-maas-hesaplama/':['/isveren-maliyeti-hesaplama/','/sgk-prim-hesaplama/'],
 '/emekli-zammi-hesaplama/':['/en-dusuk-emekli-maasi/'],
 '/en-dusuk-emekli-maasi/':['/emekli-zammi-hesaplama/'],
 '/hesaplama-metodolojisi/':['/test-raporu/','/veriler/']
});
const marker='data-contextual-links="a8"';
const css='<style data-contextual-links-css="a8">.contextual-links-a8{margin:24px 0;padding:16px;border:1px solid #dbe4ee;border-radius:12px;background:#fff;color:#0f172a}.contextual-links-a8 h2{font-size:18px;margin:0 0 10px}.contextual-links-a8 ul{margin:0;padding-left:20px}.contextual-links-a8 li{margin:8px 0}.contextual-links-a8 a{color:#0f766e;text-decoration:underline;text-underline-offset:3px;overflow-wrap:anywhere}</style>';
const escape=s=>s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const mainOf=html=>html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1]||'';
export function internalAnchorTargets(html,source='/'){
 const out=new Set();
 const clean=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<!--[\s\S]*?-->/g,'');
 for(const [,quoted,unquoted] of clean.matchAll(/<a\b[^>]*?\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)){
  const href=(quoted??unquoted).replace(/&amp;/g,'&').trim();
  if(!href||href.startsWith('#'))continue;
  try{
   const u=new URL(href,ORIGIN+source);
   if(u.origin===ORIGIN)out.add(u.pathname);
  }catch{}
 }
 return out;
}
export function addMissingContextLinks(html,source,targets){
 const main=mainOf(html);
 if(!main)throw new Error(source+': ana içerik bulunamadı');
 const existing=internalAnchorTargets(main,source);
 const missing=targets.filter(t=>t!==source&&!existing.has(t));
 if(!missing.length)return {html,added:0};
 if(html.includes(marker))throw new Error(source+': mevcut A8 modülünde bağlantı eksik');
 const block='<nav class="contextual-links-a8" '+marker+' aria-label="Konuyla ilgili bağlantılar"><h2>İlgili hesaplamalar ve rehberler</h2><ul>'+missing.map(t=>'<li><a href="'+escape(t)+'">'+escape(labels[t])+'</a></li>').join('')+'</ul></nav>';
 return {html:html.replace(/<\/main>/i,block+'</main>').replace(/<\/head>/i,css+'</head>'),added:missing.length};
}
const fileFor=(dist,path)=>join(dist,path.replace(/^\/+|\/+$/g,''),'index.html');
export async function auditContextualLinks(dist,{repair=false}={}){
 const xml=await readFile(join(dist,'sitemap.xml'),'utf8');
 const paths=new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([,u])=>new URL(u).pathname));
 const pages=new Map();
 for(const path of paths)pages.set(path,await readFile(fileFor(dist,path),'utf8'));
 let addedLinks=0,changedPages=0,plannedLinks=0;
 for(const [source,targets] of Object.entries(CONTEXTUAL_LINKS)){
  if(!pages.has(source))throw new Error('A8 kaynak URL sitemap dışında: '+source);
  for(const t of targets){
   if(t===source||!labels[t]||!pages.has(t)||consolidatedRedirectFor(t)||canonicalOf(pages.get(t))!==ORIGIN+t||/\bnoindex\b/i.test(metaOf(pages.get(t),'name','robots')?.attrs.content||''))throw new Error(source+': A8 hedefi uygun kanonik sayfa değil: '+t);
  }
  plannedLinks+=targets.length;
  if(repair){
   const result=addMissingContextLinks(pages.get(source),source,targets);
   if(result.added){pages.set(source,result.html);await writeFile(fileFor(dist,source),result.html,'utf8');addedLinks+=result.added;changedPages++;}
  }
  const actual=internalAnchorTargets(mainOf(pages.get(source)),source);
  for(const t of targets)if(!actual.has(t))throw new Error(source+': içerik içi bağlantı eksik: '+t);
 }
 const edges=new Map([...pages].map(([path,html])=>[path,[...internalAnchorTargets(html,path)].filter(t=>t!==path&&paths.has(t))]));
 const reached=new Set(['/']),depth=new Map([['/',0]]),queue=['/'];
 for(let i=0;i<queue.length;i++)for(const target of edges.get(queue[i])||[])if(!reached.has(target)){reached.add(target);depth.set(target,depth.get(queue[i])+1);queue.push(target);}
 const unreachable=[...paths].filter(p=>!reached.has(p));
 const priority=['/veriler/','/veriler/2027/','/2027-maas-hesaplama/','/isveren-maliyeti-hesaplama/','/vergi-dilimi-hesaplama/'];
 for(const p of priority)if(!depth.has(p)||depth.get(p)>2)throw new Error('A8 öncelikli URL en fazla iki bağlantı adımında olmalı: '+p);
 const report={plannedPages:Object.keys(CONTEXTUAL_LINKS).length,plannedLinks,changedPages,addedLinks,sitemapPages:paths.size,reachedFromHome:reached.size,unreachable,maxDepth:Math.max(...depth.values()),priorityDepth:Object.fromEntries(priority.map(p=>[p,depth.get(p)]))};
 console.log('A8 internal links: '+JSON.stringify(report));
 return report;
}
