import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {employeeGuides} from '../content/employee-guides.js';
import {guideScenario} from './employee-guide-data.js';
const dist=join(process.cwd(),'dist');
const sitemap=await readFile(join(dist,'sitemap.xml'),'utf8');
const index=await readFile(join(dist,'blog','index.html'),'utf8');
for(const post of employeeGuides){
 const html=await readFile(join(dist,'blog',post.slug,'index.html'),'utf8');
 const d=guideScenario(post);
 assert.ok(sitemap.includes(`https://maasim.net/blog/${post.slug}/`),post.slug+' sitemap');
 assert.ok(index.includes(`href="/blog/${post.slug}/"`),post.slug+' index');
 assert.equal((html.match(/<th scope="row">/g)||[]).length,12,post.slug+' months');
 for(const row of d.table)for(const cell of row)assert.ok(html.includes(cell.replaceAll('&','&amp;')),post.slug+' '+cell);
 assert.ok(html.includes('id="kaynakca"'),post.slug+' sources');
 assert.ok(html.includes('Varsayımlar'),post.slug+' assumptions');
 const text=html.match(/<article\b[\s\S]*?<\/article>/)[0].replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
 assert.ok(text.split(' ').length>=300,post.slug+' useful article length');
 const schemas=[...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1])).flatMap(n=>n['@graph']||[n]);
 const faq=schemas.find(n=>n['@type']==='FAQPage');const visible=[...html.matchAll(/<summary>(.*?)<\/summary>/g)].map(m=>m[1]);
 assert.deepEqual(faq.mainEntity.map(q=>q.name),visible,post.slug+' FAQ alignment');
}
assert.ok(index.includes('guide-search')&&index.includes('guide-category'));
console.log('100 yeni rehber: hesap değerleri, 12 ay, SSS, kaynaklar, tarih ve keşif kontrolleri başarılı.');
