import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {runInNewContext} from 'node:vm';
import {applyGoogleTags} from '../scripts/apply-google-tags.js';

const dir=await mkdtemp(join(tmpdir(),'maasim-google-'));
let loader;
try{
 await writeFile(join(dir,'index.html'),'<html><head><script data-maasim-consent-mode></script></head><body></body></html>');
 await applyGoogleTags(dir);
 loader=(await readFile(join(dir,'index.html'),'utf8')).match(/<script\b[^>]*data-maasim-google-tag[^>]*>([\s\S]*?)<\/script>/)[1];
}finally{await rm(dir,{recursive:true,force:true});}
function setup(statistics=false,marketing=false){
 const events=new Map(),scripts=new Map(),slots=[{dataset:{}}];
 let reloads=0;
 const window={Cookiebot:{consent:{statistics,marketing}},addEventListener:(n,fn)=>events.set(n,fn),location:{reload(){reloads++;}}};
 const document={readyState:'complete',documentElement:{dataset:{}},getElementById:id=>scripts.get(id),createElement:()=>({setAttribute(k,v){this[k]=v;}}),head:{appendChild(s){scripts.set(s.id,s);}},querySelectorAll:()=>slots.filter(s=>!s.dataset.maasimAdRequested)};
 runInNewContext(loader,{window,document});
 return {window,document,scripts,fire:n=>events.get(n)(),reloads:()=>reloads};
}
test('Google integration: no external tags before consent, separate categories and deduplication',()=>{
 const s=setup();
 assert.equal(s.scripts.size,0);
 s.window.Cookiebot.consent.statistics=true;s.fire('CookiebotOnAccept');
 assert.equal(s.scripts.size,1);
 assert.match(s.scripts.get('maasim-ga4-script').src,/G-988BB5B64E/);
 s.window.Cookiebot.consent.marketing=true;s.fire('CookiebotOnAccept');s.fire('CookiebotOnConsentReady');
 assert.equal(s.scripts.size,2);
 assert.equal(s.window.adsbygoogle.length,1);
 assert.equal(s.reloads(),0);
});
test('Google integration: partial withdrawal on accept reloads without loading new tag',()=>{
 const s=setup(true,false);
 s.window.Cookiebot.consent.statistics=false;s.window.Cookiebot.consent.marketing=true;
 s.fire('CookiebotOnAccept');s.fire('CookiebotOnConsentReady');
 assert.equal(s.reloads(),1);assert.equal(s.scripts.size,1);
 assert.ok(!s.scripts.has('maasim-adsense-script'));
});
test('Google integration: marketing withdrawal hides ads and reloads once',()=>{
 const s=setup(true,true);
 s.window.Cookiebot.consent.marketing=false;
 s.fire('CookiebotOnAccept');s.fire('CookiebotOnDecline');
 assert.equal(s.reloads(),1);
 assert.equal(s.document.documentElement.dataset.ads,'off');
});
