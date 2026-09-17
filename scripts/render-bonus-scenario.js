import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createBonusComparison, bonusMoney, bonusComparisonTable, BONUS_ASSUMPTIONS, BONUS_TABLE_CSS } from './bonus-comparison.js';
export async function renderBonusScenario(distDir) {
  const path = join(distDir,'prim-ikramiye-maas-hesaplama','index.html');
  const data = createBonusComparison();
  let html = await readFile(path,'utf8');
  const content = `<section aria-labelledby="bonus-answer"><h2 id="bonus-answer">50.000 TL brüt primin net karşılığı ne kadar?</h2><p>Bu 2026 örneğinde Haziran netine <strong>${bonusMoney(data.paymentDelta)}</strong> eklenir. Prim dahil Haziran neti <strong>${bonusMoney(data.withBonus[5].netKurus)}</strong>, yıllık toplam net <strong>${bonusMoney(data.annualNet)}</strong> olur.</p><p><strong>Sonraki aylara etkisi:</strong> Bu örnekte Temmuz–Aralık netleri primsiz senaryoyla aynıdır. Primden önce de %27 dilimine ulaşılmıştır ve prim yıl içinde daha üst dilime geçirmemektedir. Her prim sonraki ay netini düşürmez.</p><p>${BONUS_ASSUMPTIONS}</p></section><h2>Primli ve primsiz 12 aylık karşılaştırma</h2>${bonusComparisonTable(data)}<h2>Brüt primin tamamı neden nete eklenmez?</h2><p>Bu örnekte ek ödeme çalışan SGK ve işsizlik primi, gelir vergisi ve damga vergisi kesintilerini artırır. Primli ayın toplam netinden primsiz ayın netini çıkarmak, primin o ay elinize geçen katkısını verir. Asgari ücret istisnası prim için ikinci kez uygulanmaz.</p><h2>Ödeme ayı değişirse ne olur?</h2><p>Prim vergi dilimine geçişi öne çekerse sonraki aylarda net fark doğabilir. <a href="/blog/prim-ikramiye-net-maasi-neden-dusurur/">Nisan ve Haziran primlerini karşılaştıran vergi rehberini okuyun.</a></p><h2>Kendi priminizi nasıl hesaplayabilirsiniz?</h2><ol><li><a href="/#hesaplayici">Hesaplayıcıda</a> aylık brüt maaşınızı girin.</li><li>12 aylık tabloda ödeme ayının Ek Brüt alanına primi ekleyin; temel brüt alanı sonraki ayların ücretini de değiştirir.</li><li>Ödeme ayı netini ve yıllık toplam neti primsiz sonuçla karşılaştırın.</li></ol><p><a href="/hesaplama-metodolojisi/">Yöntem ve varsayımlar</a> · <a href="/veriler/2026/">2026 parametreleri ve resmî kaynaklar</a></p>`;
  const article = /(<article\b[^>]*>)[\s\S]*?(<\/article>)/;
  if (!article.test(html)) throw new Error('Prim senaryosu içerik alanı bulunamadı');
  html = html.replace(article, `$1${content}$2`).replace('</head>',`<style>${BONUS_TABLE_CSS}</style></head>`);
  await writeFile(path,html);
}
