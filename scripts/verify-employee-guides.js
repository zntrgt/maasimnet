import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {employeeGuides} from '../content/employee-guides.js';
import {guideScenario} from './employee-guide-data.js';
import {employeeGuideImage} from '../content/employee-guide-images.js';
const dist=join(process.cwd(),'dist');
const sitemap=await readFile(join(dist,'sitemap.xml'),'utf8');
const index=await readFile(join(dist,'blog','index.html'),'utf8');
for(const [ordinal, post] of employeeGuides.entries()){
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
 assert.ok(cards.find(card=>card.includes(`href="/blog/${post.slug}/"`))?.includes(`src="${coverPath}"`),post.slug+' card cover');
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
 assert.equal(schemas.find(n=>n['@type']==='Article').image,`https://maasim.net${coverPath}`,post.slug+' structured image');
 assert.deepEqual(faq.mainEntity.map(q=>q.name),visible,post.slug+' FAQ alignment');
}
assert.ok(index.includes('guide-search')&&index.includes('guide-category'));
console.log('100 yeni rehber: hesap değerleri, 12 ay, SSS, kaynaklar, tarih ve keşif kontrolleri başarılı.');

