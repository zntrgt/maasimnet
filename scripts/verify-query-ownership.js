import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { QUERY_OWNERSHIP } from '../content/query-ownership.js';
import { canonicalOf,metaOf } from '../content/html-attrs.js';
import { consolidatedRedirectFor } from '../src/consolidated-redirects.js';
const dist=join(process.cwd(),'dist'),origin='https://maasim.net';
const sitemap=await readFile(join(dist,'sitemap.xml'),'utf8');
const routes=new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>new URL(m[1]).pathname));
const seen=new Set();
const pages=new Map();
for(const entry of QUERY_OWNERSHIP){
 assert.ok(entry.intent&&!seen.has(entry.intent),'Duplicate search intent: '+entry.intent);
 seen.add(entry.intent);
 assert.ok(!entry.support.includes(entry.owner),'Self-support: '+entry.owner);
 for(const path of [entry.owner,...entry.support]){
  if(pages.has(path))continue;
  assert.ok(routes.has(path)&&!consolidatedRedirectFor(path),'A13 non-indexable or redirect target: '+path);
  const html=await readFile(join(dist,path.replace(/^\/+|\/+$/g,''),'index.html'),'utf8');
  assert.equal(canonicalOf(html),origin+path);
  assert.doesNotMatch(metaOf(html,'name','robots')?.attrs.content||'',/\bnoindex\b/i);
  pages.set(path,html);
 }
}
const guide=pages.get('/blog/2026-maas-vergi-dilimleri/');
assert.match(guide,/<title>[^<]*Ücret Tarifesi ve Matrah Rehberi/);
assert.match(guide,/<a href="\/vergi-dilimi-hesaplama\/">Kendi maaşın ve önceki kümülatif matrahınla vergi dilimine geçiş ayını hesapla/);
const retirement=pages.get('/emeklilik-hesaplama/');
assert.ok(retirement.includes('Güncel TBMM teklifleri ve açıklamalar için'));
assert.doesNotMatch(retirement,/TBMM’de 2\/2755 ve 2\/2959 sayılı teklifler komisyonda bekliyor/);
assert.ok(pages.get('/blog/100000-tl-brut-maas-neti-2026/').includes('href="/100000-brut-maas-hesaplama/"'));
console.log('A13: '+QUERY_OWNERSHIP.length+' arama niyeti, '+pages.size+' mevcut kanonik URL; hedefler ve ayrıştırılmış içerik doğrulandı. Bu test GSC performansı ölçmez.');
