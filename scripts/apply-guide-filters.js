import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {employeeGuides,GUIDE_CATEGORIES} from '../content/employee-guides.js';
export async function applyGuideFilters(dist){
 const path=join(dist,'blog','index.html');let html=await readFile(path,'utf8');
 html=html.replace('Maaş ve zam gündemini kaynaklarıyla okuyun','Maaşını ve iş teklifini daha iyi değerlendir').replace('Beyaz yakalar için ücret görüşmeleri, enflasyon, brüt-net hesaplama ve vergi gündemi.','Maaş, prim, zam, bütçe ve iş teklifi kararları için kaynaklı rehberler ve açık varsayımlı hesaplama örnekleri.');
 for(const post of employeeGuides){const route=`/blog/${post.slug}/`;html=html.replaceAll(`href="${route}"`,`data-guide-kind="${post.kind}" href="${route}"`);}
 const controls=`<section class="guide-filters" aria-label="Blog yazısı bul"><label>Yazı ara<input id="guide-search" type="search" placeholder="Örn. prim, kira, teklif" autocomplete="off"></label><label>Konu<select id="guide-category"><option value="all">Tüm konular</option>${Object.entries(GUIDE_CATEGORIES).map(([key,label])=>`<option value="${key}">${label}</option>`).join('')}<option value="existing">Temel rehberler</option></select></label><p id="guide-count" role="status" aria-live="polite"></p></section>`;
 html=html.replace(/(<(?:section|div) class="cards"[^>]*>)/,controls+'$1');
 html=html.replace('</body>','<script src="/assets/guide-filters.js" defer></script></body>');
 await writeFile(path,html);
 await writeFile(join(dist,'assets','guide-filters.js'),`const search=document.getElementById('guide-search'),select=document.getElementById('guide-category'),status=document.getElementById('guide-count'),cards=[...document.querySelectorAll('.cards a.card')];function filter(){const query=search.value.trim().toLocaleLowerCase('tr-TR'),kind=select.value;let count=0;for(const card of cards){const match=(!query||card.textContent.toLocaleLowerCase('tr-TR').includes(query))&&(kind==='all'||(card.dataset.guideKind||'existing')===kind);card.hidden=!match;if(match)count++;}status.textContent=count+' yazı gösteriliyor';const hubs=document.querySelector('.blog-cluster-hubs');if(hubs)hubs.hidden=!!query||kind!=='all';}search.addEventListener('input',filter);select.addEventListener('change',filter);filter();`);
}
