import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {canonicalOf,metaOf} from '../content/html-attrs.js';
import {consolidatedRedirectFor} from '../src/consolidated-redirects.js';

const origin='https://maasim.net';
// Public URLs from the Nov 25 coverage export. No private performance metrics.
export const ACTIVE_ROUTES=Object.freeze([
 '/emekli-promosyonu/','/ihbar-tazminati-hesaplama/',
 '/blog/is-degisikliginde-vergi-matrahi/','/blog/2026-maas-vergi-dilimleri/',
 '/blog/maas-zam-gorusmesi-nasil-yapilir/','/blog/isveren-katkili-bes/',
 '/blog/is-yerinde-finansal-saglik/','/blog/esnek-yan-hak-butcesi/',
 '/blog/2026-sgk-tavani/','/blog/100000-tl-brut-maas-neti-2026/',
 '/blog/prim-ikramiye-net-maasi-neden-dusurur/',
 '/borclanma-hesaplama/','/eksik-gun-maas-hesaplama/','/en-dusuk-emekli-maasi/',
 '/hafta-tatili-ucreti-hesaplama/','/hakkimizda/','/is-degisikligi-vergi-matrahi/',
 '/kidem-tazminati-hesaplama/','/kira-artis-orani-hesaplama/','/part-time-maas-hesaplama/',
 '/prim-ikramiye-maas-hesaplama/','/resmi-tatil-mesai-ucreti-hesaplama/',
 '/senaryolar/','/sgk-prim-hesaplama/','/sss/','/tazminat-hesaplama/',
 '/temmuz-zam-senaryosu/','/test-raporu/'
]);
export const POLICY_ROUTES=Object.freeze(['/gizlilik/','/kullanim-kosullari/']);
export const LEGACY_ROUTES=Object.freeze([
 '/blog/basari-odulu-prim-butcesi/','/blog/aralik-ikramiye-yillik-net/','/blog/alti-aylik-prim-bolunurse/'
]);
const SLASH_ALIAS='/kidem-tazminati-hesaplama';
const SLASH_TARGET=SLASH_ALIAS+'/';
const sitemapUrls=xml=>new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1].trim()));
function checkPage(path,html,urls,required=true){
 const canonical=canonicalOf(html);
 assert.equal(canonical,origin+path,path+': canonical');
 const robots=metaOf(html,'name','robots')?.attrs.content||'';
 const listed=urls.has(origin+path);
 const noindex=/\bnoindex\b/i.test(robots);
 if(required||listed){
  assert.ok(listed,path+': missing sitemap entry');
  assert.ok(!noindex,path+': noindex');
 }
 assert.ok(/<h1\b[^>]*>[\s\S]*?<\/h1>/i.test(html),path+': missing H1');
 return {path,listed,noindex};
}
export async function auditCoverageBuild(dist){
 const urls=sitemapUrls(await readFile(join(dist,'sitemap.xml'),'utf8'));
 const get=p=>readFile(join(dist,p.slice(1),'index.html'),'utf8');
 for(const p of ACTIVE_ROUTES)checkPage(p,await get(p),urls);
 const policy=[];
 for(const p of POLICY_ROUTES)policy.push(checkPage(p,await get(p),urls,false));
 for(const p of LEGACY_ROUTES){
  assert.ok(!urls.has(origin+p),p+': legacy URL in sitemap');
  const target=consolidatedRedirectFor(p);
  assert.ok(target,p+': missing redirect mapping');
  const [path,anchor]=target.split('#');
  const html=await get(path);
  checkPage(path,html,urls);
  assert.ok(anchor&&html.includes('id="'+anchor+'"'),p+': missing redirect anchor');
 }
 assert.ok(!urls.has(origin+SLASH_ALIAS),'Noncanonical slash alias in sitemap');
 const result={active:ACTIVE_ROUTES.length,policy,retired:LEGACY_ROUTES.length,slashAlias:SLASH_ALIAS,scope:'build only, not Google index status'};
 console.log('Coverage build audit: '+JSON.stringify(result));
 return result;
}
async function getLive(path){
 const response=await fetch(origin+path,{redirect:'manual',headers:{'Cache-Control':'no-cache','User-Agent':'curl/8.5.0'},signal:AbortSignal.timeout(25000)});
 const body=await response.text();
 return {status:response.status,headers:response.headers,body};
}
export async function auditCoverageLive(){
 const {status,body}=await getLive('/sitemap.xml');
 assert.equal(status,200,'Live sitemap status');
 const urls=sitemapUrls(body);
 const results=[];
 const targets=[...ACTIVE_ROUTES,...POLICY_ROUTES];
 for(let i=0;i<targets.length;i+=4){
  const batch=await Promise.all(targets.slice(i,i+4).map(async p=>{
   const r=await getLive(p);
   assert.equal(r.status,200,p+': live HTTP');
   assert.match(r.headers.get('content-type')||'',/text\/html/i,p+': live content type');
   const required=ACTIVE_ROUTES.includes(p);
   if(required||urls.has(origin+p))assert.doesNotMatch(r.headers.get('x-robots-tag')||'',/\bnoindex\b/i,p+': X-Robots-Tag');
   return {...checkPage(p,r.body,urls,required),status:r.status};
  }));
  results.push(...batch);
 }
 const redirects=[];
 for(const p of [SLASH_ALIAS,...LEGACY_ROUTES]){
  const r=await getLive(p);
  const target=p===SLASH_ALIAS?SLASH_TARGET:consolidatedRedirectFor(p);
  assert.ok((p===SLASH_ALIAS?[301,302,307,308]:[301,308]).includes(r.status),p+': unexpected redirect status '+r.status);
  const location=r.headers.get('location');
  assert.ok(location,p+': no Location');
  assert.equal(new URL(location,origin+p).href,origin+target,p+': redirect target');
  assert.ok(!urls.has(origin+p),p+': alias/retired URL in live sitemap');
  redirects.push({path:p,status:r.status,location});
 }
 console.log('Coverage production audit: '+JSON.stringify({pages:results,redirects,scope:'ordinary HTTP requests, not verified Googlebot or index status'}));
}
if(process.argv[2]==='--live')await auditCoverageLive();
