import test from 'node:test';
import assert from 'node:assert/strict';
import {addTransparencyBlock,TRANSPARENCY_ROUTES} from '../scripts/apply-editorial-transparency.js';
import {DATA_2026} from '../src/data-2026.js';
import {getPageMetadata} from '../content/site-metadata.js';
const doc=body=>'<html><head></head><body><main>'+body+'</main></body></html>';
test('A14 source metadata is linked only when the source appears in the page',()=>{
 const source=DATA_2026.sources.minimumWage;
 const html=doc('<a href="'+source.url+'">Kaynak</a>');
 const result=addTransparencyBlock(html,'/gunluk-ucret-hesaplama/');
 assert.ok(result.includes(source.documentTitle));
 assert.ok(result.includes(source.legalBasis));
 assert.ok(result.includes('datetime="'+source.publishedAt+'"'));
 assert.ok(result.includes('Kaynağa özel kontrol: Ayrı kayıt bulunmuyor'));
 assert.ok(!result.includes(DATA_2026.sources.sgk.documentTitle));
 assert.equal(addTransparencyBlock(result,'/gunluk-ucret-hesaplama/'),result);
});
test('A14 no independent review or fictitious source access date',()=>{
 const path='/net-maastan-kidem-tazminati-hesaplama/';
 assert.equal(getPageMetadata(path).reviewedAt,undefined);
 const result=addTransparencyBlock(doc('<h1>Kıdem</h1>'),path);
 assert.match(result,/Kayıtlı içerik \/ veri kontrolü<\/dt><dd>Ayrı kayıt bulunmuyor/);
 assert.match(result,/doğrulanmış bağımsız uzman onayı yayımlanmıyor/);
 assert.match(result,/merkezi kaynak kaydı ayrı olarak eşleştirilmemiştir/);
 assert.ok(TRANSPARENCY_ROUTES.includes('/'));
 assert.ok(TRANSPARENCY_ROUTES.includes('/blog/2026-maas-vergi-dilimleri/'));
});
