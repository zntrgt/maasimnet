import {access,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {employeeGuides,DISCOVERABLE_EMPLOYEE_GUIDES,retiredEmployeeGuides} from '../content/employee-guides.js';
import {RETIRED_GUIDE_REDIRECTS} from '../src/retired-guide-redirects.js';
import {guideScenario} from './employee-guide-data.js';
import {employeeGuideImage} from '../content/employee-guide-images.js';
const dist=join(process.cwd(),'dist');
const sitemap=await readFile(join(dist,'sitemap.xml'),'utf8');
const index=await readFile(join(dist,'blog','index.html'),'utf8');
assert.deepEqual([...DISCOVERABLE_EMPLOYEE_GUIDES].sort(),['kira-artisi-maas-butcesi','kredi-taksiti-degisken-net-maas','maas-artmadan-gider-artisi','maas-butcesini-en-dusuk-aya-gore-kurmak','yillik-ortalama-net-butce']);
assert.equal(retiredEmployeeGuides.length,95,'95 birleştirilmiş rehber');
const retiredRoutes=new Set(retiredEmployeeGuides.map(p=>`/blog/${p.slug}/`));
const targetHtml=new Map();
for(const post of retiredEmployeeGuides){
 const route=`/blog/${post.slug}/`;
 assert.equal(RETIRED_GUIDE_REDIRECTS[route],post.redirectTo,post.slug+' 301 hedefi');
 await assert.rejects(access(join(dist,'blog',post.slug,'index.html')),post.slug+' ayrı sayfa olarak üretilmemeli');
 assert.ok(!sitemap.includes(`https://maasim.net${route}`),post.slug+' sitemap dışı');
 const [target,anchor]=post.redirectTo.split('#');
 if(!targetHtml.has(target)) targetHtml.set(target,await readFile(join(dist,target,'index.html'),'utf8'));
 const html=targetHtml.get(target);
 assert.ok(html.includes(`id="${anchor}"`),post.slug+' hedef çapası');
 assert.ok(html.includes(post.answer.replaceAll('&','&amp;')),post.slug+' cevap hedefe taşındı');
 assert.match(html,/<meta name="robots" content="index,follow/,target+' indekslenebilir hedef');
}
for(const file of ['index.html','blog/index.html','llms.txt']){const text=await readFile(join(dist,file),'utf8');for(const route of retiredRoutes)assert.ok(!text.includes(`href="${route}"`)&&!text.includes(`https://maasim.net${route}`),file+' eski rehber bağlantısı: '+route);}
for(const [ordinal, post] of employeeGuides.entries()){
 if(post.retired) continue;
 const html=await readFile(join(dist,'blog',post.slug,'index.html'),'utf8');
 const cover=employeeGuideImage({...post,coverKind:['budget','net','raise','offer','benefit','bonus','tax','timing','split','purchasing'][ordinal % 10]});
 const coverPath=`/assets/${cover.asset}`;
 assert.ok(html.includes(`class="figure guide-cover"><img src="${coverPath}"`),post.slug+' editorial cover');
 assert.ok(html.includes(`class="figure guide-chart"><img src="/assets/guide-${post.slug}.svg" width="1200" height="675" loading="lazy"`),post.slug+' separate uncropped chart');
 assert.ok(html.includes(`property="og:image" content="https://maasim.net${coverPath}"`),post.slug+' social cover');
 assert.ok(html.includes(`name="twitter:image" content="https://maasim.net${coverPath}"`),post.slug+' twitter cover');
 const bytes=await readFile(join(dist,'assets',cover.asset));
 assert.equal(bytes.toString('ascii',8,12),'WEBP',post.slug+' valid photo asset');
 const cards=[...index.matchAll(/<a\b[^>]*class="[^"]*\bcard\b[^"]*"[^>]*>[\s\S]*?<\/a>/g)].map(m=>m[0]);
 const guideCard=cards.find(card=>card.includes(`href="/blog/${post.slug}/"`));
 if(post.discoverable===false){assert.ok(!guideCard,post.slug+' hidden from blog index');assert.ok(!sitemap.includes(`https://maasim.net/blog/${post.slug}/`),post.slug+' hidden from sitemap');assert.match(html,/<meta name="robots" content="noindex,follow">/,post.slug+' noindex');}
 else{assert.ok(guideCard?.includes(`src="${coverPath}"`),post.slug+' card cover');assert.ok(sitemap.includes(`https://maasim.net/blog/${post.slug}/`),post.slug+' sitemap');assert.ok(index.includes(`href="/blog/${post.slug}/"`),post.slug+' index');assert.match(html,/<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">/,post.slug+' index');}
 const d=guideScenario(post);

 const guideTable = html.match(/<div class="guide-table"[\s\S]*?<\/div>/i)?.[0] || '';
 assert.equal((guideTable.match(/<th scope="row">/g)||[]).length,12,post.slug+' months');
 for(const row of d.table)for(const cell of row)assert.ok(html.includes(cell.replaceAll('&','&amp;')),post.slug+' '+cell);
 assert.ok(html.includes('id="kaynakca"'),post.slug+' sources');
 assert.ok(html.includes('Varsayımlar'),post.slug+' assumptions');
 const text=html.match(/<article\b[\s\S]*?<\/article>/)[0].replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
 assert.ok(text.split(' ').length>=300,post.slug+' useful article length');
 const schemas=[...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1])).flatMap(n=>n['@graph']||[n]);
 const faq=schemas.find(n=>n['@type']==='FAQPage');const visible=[...html.matchAll(/<summary>(.*?)<\/summary>/g)].map(m=>m[1]);
 assert.equal(schemas.find(n=>n['@type']==='Article').image,`https://maasim.net${coverPath}`,post.slug+' structured image');
 assert.deepEqual(faq.mainEntity.map(q=>q.name),visible,post.slug+' FAQ alignment');
}
assert.ok(index.includes('guide-search')&&index.includes('guide-category'));
console.log(`${employeeGuides.length-retiredEmployeeGuides.length} ayrı rehber ve ${retiredEmployeeGuides.length} birleştirilmiş durum: hesap, 12 ay, SSS, 301 hedefi, çapa ve keşif kontrolleri başarılı.`);

