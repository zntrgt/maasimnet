import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { auditTechnicalSeo } from '../scripts/technical-seo.js';
const paths=['/','/hesaplama-araclari/','/veriler/','/veriler/2026/','/veriler/2027/','/2027-maas-hesaplama/','/blog/','/isveren-maliyeti-hesaplama/','/vergi-dilimi-hesaplama/'];
const origin='https://maasim.net';
async function fixture(dir){
 for(const path of paths){
   const folder=join(dir,path.slice(1));await mkdir(folder,{recursive:true});
   const title=path==='/'?'Maaş hesaplama':path;
   const faq=path==='/vergi-dilimi-hesaplama/'?'<script type="application/ld+json">'+JSON.stringify({'@type':'FAQPage',mainEntity:[{'@type':'Question',name:'Vergi nedir?',acceptedAnswer:{'@type':'Answer',text:'Bir kamu geliridir.'}}]})+'</script>':'';
   await writeFile(join(folder,'index.html'),'<html><head><title>'+title+'</title><link rel="canonical" href="'+origin+path+'">'+faq+'</head><body><h1>'+title+'</h1><p>Vergi nedir? Bir kamu geliridir.</p><a href="/vergi-dilimi-hesaplama/">Araç</a></body></html>');
 }
 await writeFile(join(dir,'sitemap.xml'),'<urlset>'+paths.map(p=>'<url><loc>'+origin+p+'</loc></url>').join('')+'</urlset>');
}
test('A7 adds missing breadcrumbs, verifies titles and makes llms from canonical sitemap',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'maasim-seo-'));
 try{
   await fixture(dir);
   const report=await auditTechnicalSeo(dir,{repair:true});
   assert.equal(report.breadcrumbAdded,paths.length-1);
   assert.equal(report.faqPages,1);
   assert.equal(report.errors.length,0);
   const html=await readFile(join(dir,'vergi-dilimi-hesaplama','index.html'),'utf8');
   assert.match(html,/"@type":"BreadcrumbList"/);
   assert.match(html,/"name":"Hesaplama Araçları"/);
   assert.match(await readFile(join(dir,'llms.txt'),'utf8'),/Tahmin aracı, resmî 2027 bordrosu değildir/);
   assert.equal((await auditTechnicalSeo(dir)).breadcrumbAdded,0);
   const p=join(dir,'veriler','2027','index.html');
   await writeFile(p,(await readFile(p,'utf8')).replace('</head>','<meta name="robots" content="noindex"></head>'));
   await assert.rejects(auditTechnicalSeo(dir),/sitemap URL noindex/);
 }finally{await rm(dir,{recursive:true,force:true});}
});
