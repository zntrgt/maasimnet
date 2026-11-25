import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { AD_CLIENT, AD_SLOTS } from '../content/ad-slots.js';

export function verifyGoogleIntegration({html,adsTxt,sitemap,robots},measurementId){
 const pub=AD_CLIENT.replace(/^ca-/,'');
 const adsRows=adsTxt.split(/\r?\n/).map(x=>x.split('#')[0].trim()).filter(Boolean).map(x=>x.split(',').map(v=>v.trim()));
 assert.ok(adsRows.some(r=>r[0]==='google.com'&&r[1]===pub&&r[2]==='DIRECT'&&r[3]==='f08c47fec0942fa0'),'ads.txt: Google DIRECT publisher entry missing');
 const meta='<meta name="google-adsense-account" content="'+AD_CLIENT+'">';
 assert.ok(html.indexOf(meta)>=0&&html.indexOf(meta)<html.indexOf('</head>'),'AdSense account meta missing in head');
 assert.equal((html.match(/data-maasim-google-tag(?=[\s>])/g)||[]).length,1,'Duplicate/missing Google loader');
 assert.ok(html.includes(measurementId)&&html.includes(AD_CLIENT),'GA4 or AdSense ID missing');
 assert.ok(html.includes("Cookiebot?.consent?.statistics !== true")&&html.includes("Cookiebot?.consent?.marketing !== true"),'Consent guards missing');
 assert.ok(html.includes('id="Cookiebot"')&&html.indexOf('data-maasim-consent-mode')<html.indexOf('data-maasim-google-tag'),'Consent bootstrap missing or out of order');
 assert.ok(html.includes('data-ad-client="'+AD_CLIENT+'"')&&html.includes('data-ad-slot="'+AD_SLOTS.toolResult+'"'),'Home result ad unit missing');
 assert.match(sitemap,/<loc>https:\/\/maasim\.net\/<\/loc>/);
 assert.match(robots,/^Sitemap:\s*https:\/\/maasim\.net\/sitemap\.xml\s*$/m);
 return {publisher:pub,measurementId,adsTxt:'matching',homepage:'matching',sitemap:'matching',robots:'matching'};
}
const dir=process.argv[2];
if(dir){
 const get=name=>readFile(join(dir,name),'utf8');
 const config=JSON.parse(await readFile(new URL('../analytics/gsc-ga4-dashboard.json',import.meta.url),'utf8'));
 const [html,adsTxt,sitemap,robots]=await Promise.all(['index.html','ads.txt','sitemap.xml','robots.txt'].map(get));
 console.log('Google integration content checks: '+JSON.stringify(verifyGoogleIntegration({html,adsTxt,sitemap,robots},config.sources.google_analytics_4.measurement_id)));
}
