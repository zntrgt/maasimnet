import test from 'node:test';
import assert from 'node:assert/strict';
import {employeeGuides} from '../content/employee-guides.js';
import {guideScenario} from '../scripts/employee-guide-data.js';
import {getPageMetadata} from '../content/site-metadata.js';
const guide=slug=>employeeGuides.find(p=>p.slug===slug);
test('100 yeni rehber benzersiz amaç metni ve geçerli on iki aylık hesap sunar',()=>{
 assert.equal(employeeGuides.length,100);
 for(const field of ['slug','title','answer','detail','action']) assert.equal(new Set(employeeGuides.map(p=>p[field])).size,100,field);
 for(const post of employeeGuides){const d=guideScenario(post);assert.equal(d.table.length,12);assert.ok(d.table.every(r=>r.length===4));assert.doesNotMatch(JSON.stringify(d),/NaN|undefined|Infinity/);assert.equal(getPageMetadata(`/blog/${post.slug}/`).publishedAt,'2026-09-17');}
});
test('Nisan primi sonraki ay etkisini ödeme ayından ayırır',()=>{
 const d=guideScenario(guide('nisan-prim-mayis-net'));assert.equal(d.b[3].netKurus-d.a[3].netKurus,3362050);assert.equal(d.b[4].netKurus-d.a[4].netKurus,-297500);
});
test('sabit net rehberinde on iki ay hedef korunur',()=>{
 const d=guideScenario(guide('netten-brute-yuvarlama'));for(const r of d.a)assert.ok(Math.abs(r.netKurus-7777700)<=1);
});
test('teklif başlangıcından önce net fark yoktur; düşük teklifte yıllık fark negatiftir',()=>{
 const d=guideScenario(guide('ucret-dususu-is-teklifi'));assert.deepEqual(d.a.slice(0,6).map(r=>r.netKurus),d.b.slice(0,6).map(r=>r.netKurus));assert.ok(d.b.reduce((s,r)=>s+r.netKurus,0)<d.a.reduce((s,r)=>s+r.netKurus,0));
});
test('prim taksitleri aynı brüt toplamla iki alternatif oluşturur',()=>{
 const d=guideScenario(guide('tek-prim-iki-taksit'));assert.equal(d.a.reduce((s,r)=>s+r.netKurus,0),d.b.reduce((s,r)=>s+r.netKurus,0));assert.notEqual(d.a[2].netKurus,d.b[2].netKurus);
});
test('eksi yan hak farkı nakit bordrosuna eklenmez',()=>{
 const d=guideScenario(guide('servis-yerine-nakit-teklif'));assert.ok(d.metrics.some(x=>x[1]==='-6.000,00 TL'));assert.match(d.reading,/nakit ücret değildir/);
});
