import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {verifyAiCrawlerPolicy} from '../scripts/ai-crawl-policy.js';
const robots=await readFile(new URL('../content/robots.txt',import.meta.url),'utf8');
test('A18 search and training policy remains explicit',()=>{
 const r=verifyAiCrawlerPolicy(robots);
 assert.equal(r.searchRetrieval,6);
 assert.equal(r.trainingBlocked,7);
 assert.match(r.googleExtended,/decision pending/);
});
test('A18 unintended blocks and training permissions fail validation',()=>{
 assert.throws(()=>verifyAiCrawlerPolicy(robots.replace('User-agent: OAI-SearchBot\nAllow: /','User-agent: OAI-SearchBot\nDisallow: /')));
 assert.throws(()=>verifyAiCrawlerPolicy(robots.replace('User-agent: GPTBot\nDisallow: /','User-agent: GPTBot\nAllow: /')));
 assert.throws(()=>verifyAiCrawlerPolicy(robots.replace('User-agent: Google-Extended\nAllow: /','User-agent: Google-Extended\nDisallow: /')));
});
