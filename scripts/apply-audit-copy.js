import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function applyAuditCopy(distDir) {
  const path = join(distDir, 'hesaplama-metodolojisi', 'index.html');
  const html = await readFile(path, 'utf8');
  const oldCopy = 'Hedef aylık ortalama neti üreten brüt tutar, alt ve üst sınırlar arasında iteratif aramayla bulunur.';
  if (!html.includes(oldCopy)) throw new Error('Netten brüte metodoloji metni bulunamadı.');
  await writeFile(path, html.replace(oldCopy, 'Girdiğiniz hedef net maaşı her ay sağlayan brüt ücret, kümülatif vergi matrahı dikkate alınarak ay ay iteratif aramayla bulunur. Net maaş sabit kalırken gerekli brüt ücret yıl içinde değişebilir; sonuçtaki ortalama brüt bu aylık brütlerin ortalamasıdır.'));
  const homePath = join(distDir, 'index.html');
  const home = await readFile(homePath, 'utf8');
  await writeFile(homePath, home.replace('Yılın ilk ayındaki (Ocak) matrahsız net ile yıl sonundaki en yüksek vergi dilimli net arasındaki farkı gösterir.', 'Hesaplanan 12 ay içindeki en yüksek ve en düşük net maaşı gösterir. En düşük net her zaman Aralık ayında oluşmaz; vergi istisnaları nedeniyle sonraki aylarda net yeniden artabilir.'));
}
