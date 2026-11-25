import assert from 'node:assert/strict';
export const SEARCH_RETRIEVAL=Object.freeze(['OAI-SearchBot','ChatGPT-User','Claude-SearchBot','Claude-User','PerplexityBot','Perplexity-User']);
export const TRAINING_BLOCKED=Object.freeze(['GPTBot','ClaudeBot','CCBot','Bytespider','meta-externalagent','Amazonbot','Applebot-Extended']);
export function verifyAiCrawlerPolicy(robots){
 const groups=new Map();let agents=[],hasRules=false,sitemaps=[];
 for(const raw of robots.split(/\r?\n/)){
  const line=raw.split('#')[0].trim();
  if(!line)continue;
  const match=line.match(/^([^:]+):\s*(.*)$/);
  if(!match)continue;
  const key=match[1].toLowerCase(),value=match[2].trim();
  if(key==='sitemap'){sitemaps.push(value);continue;}
  if(key==='user-agent'){
   if(hasRules){agents=[];hasRules=false;}
   const agent=value.toLowerCase();agents.push(agent);
   if(!groups.has(agent))groups.set(agent,[]);
  }else if(key==='allow'||key==='disallow'){
   for(const agent of agents)groups.get(agent).push(key+':'+value);
   hasRules=true;
  }
 }
 const expect=(agent,rules)=>assert.deepEqual(groups.get(agent.toLowerCase()),rules,'A18 robots policy drift: '+agent);
 expect('*',['allow:/']);
 for(const agent of SEARCH_RETRIEVAL)expect(agent,['allow:/']);
 for(const agent of TRAINING_BLOCKED)expect(agent,['disallow:/']);
 // Existing exception is deliberately retained, not a confirmed publisher decision.
 expect('Google-Extended',['allow:/']);
 assert.deepEqual(sitemaps,['https://maasim.net/sitemap.xml']);
 assert.match(robots,/^Content-Signal:\s*search=yes,ai-input=yes,ai-train=no,use=reference\s*$/m);
 return {searchRetrieval:SEARCH_RETRIEVAL.length,trainingBlocked:TRAINING_BLOCKED.length,googleExtended:'allow (existing exception; decision pending)'};
}
