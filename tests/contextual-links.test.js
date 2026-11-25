import test from 'node:test';
import assert from 'node:assert/strict';
import { internalAnchorTargets, addMissingContextLinks, CONTEXTUAL_LINKS } from '../scripts/contextual-links.js';

test('A8 only adds contextual links missing from main; navigation and script strings do not count',()=>{
 const html='<html><head></head><body><nav><a href="/veriler/2027/">Header</a></nav><main><h1>2027 maaş</h1><p><a href="/blog/2027-maas-zammi-beklentileri/">Rehber</a></p><script>const a=\'<a href="/veriler/2027/">Script</a>\';</script></main></body></html>';
 const route='/2027-maas-hesaplama/';
 const r=addMissingContextLinks(html,route,CONTEXTUAL_LINKS[route]);
 assert.equal(r.added,1);
 assert.match(r.html,/<a href="\/veriler\/2027\/">2027 bordro verilerinin açıklanma durumu<\/a>/);
 assert.equal(addMissingContextLinks(r.html,route,CONTEXTUAL_LINKS[route]).added,0);
});
test('A8 extracts only same-origin anchor targets and skips fragment-only links',()=>{
 const links=internalAnchorTargets('<a href="../veriler/">rel</a><a href="https://maasim.net/veriler/2027/">abs</a><a href="https://example.com/">external</a><a href="#top">fragment</a><a href="/vergi-dilimi-hesaplama/?x=1&amp;y=2">query</a><!--<a href="/bad/">comment</a>-->','/blog/');
 assert.deepEqual([...links],['/veriler/','/veriler/2027/','/vergi-dilimi-hesaplama/']);
});
