import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const SITE = 'https://maasim.net';
const UPDATED_AT = '29 Temmuz 2026';
const LASTMOD = '2026-07-29';

const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

function page({ path, title, description, body }) {
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)} | Maaşım.net</title><meta name="description" content="${escapeHtml(description)}"><meta name="robots" content="index,follow"><link rel="canonical" href="${SITE}${path}"><link rel="stylesheet" href="/assets/p0-content.css"><style>.legal-meta{display:flex;gap:12px;flex-wrap:wrap;margin:20px 0 30px}.legal-meta span{background:#ecfdf5;border:1px solid #99f6e4;border-radius:999px;padding:7px 11px;color:#0f766e;font-size:12px;font-weight:800}.legal-table-wrap{overflow:auto;margin:22px 0}.legal-table{width:100%;min-width:760px;border-collapse:collapse;background:#fff;border:1px solid #dbe4ee}.legal-table th,.legal-table td{padding:13px;border-bottom:1px solid #dbe4ee;text-align:left;vertical-align:top}.legal-table th{background:#f1f5f9}.legal-note{padding:18px;border-left:5px solid #0d9488;background:#ecfdf5}.legal-warning{padding:18px;border-left:5px solid #f59e0b;background:#fffbeb}</style><script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebPage', name: title, description, url: `${SITE}${path}`, inLanguage: 'tr-TR', dateModified: LASTMOD })}</script></head><body><nav></nav><main class="shell"><p class="crumb"><a href="/">Ana Sayfa</a> / ${escapeHtml(title)}</p><p class="eyebrow">Gizlilik ve Veri Koruma</p><h1>${escapeHtml(title)}</h1><p class="lead">${escapeHtml(description)}</p><div class="legal-meta"><span>Son güncelleme: ${UPDATED_AT}</span><span>Rıza sürümü: 2026-07-29.1</span></div><article class="content">${body}</article></main><footer></footer></body></html>`;
}

function privacyPage() {
  return page({
    path: '/gizlilik/',
    title: 'Gizlilik Politikası',
    description: 'Maaşım.net üzerinde hangi verilerin, hangi amaçlarla ve hangi tercihlere bağlı olarak işlendiğini açıklar.',
    body: `
      <p class="legal-note"><strong>Temel ilke:</strong> Maaş hesaplayıcısına yazdığınız brüt maaş, net maaş, vergi matrahı ve diğer parasal sonuçlar Google Analytics veya reklam sağlayıcılarına gönderilmez.</p>
      <h2>1. Veri sorumlusu</h2>
      <p>Veri sorumlusu, Maaşım.net internet sitesini işleten ve güncel kimlik ile iletişim bilgileri <a href="/iletisim/">İletişim</a> sayfasında yayımlanan işletmecidir. KVKK kapsamındaki talepler aynı sayfadaki iletişim kanalı üzerinden iletilebilir.</p>
      <h2>2. İşlenen veri kategorileri</h2>
      <h3>Siteye erişim ve güvenlik kayıtları</h3><p>Sunucu güvenliği, hata teşhisi ve kötüye kullanımın önlenmesi amacıyla IP adresi, istek zamanı, istenen sayfa ve teknik tarayıcı bilgileri altyapı sağlayıcısı tarafından sınırlı süreyle işlenebilir.</p>
      <h3>Analitik veriler</h3><p>Yalnızca analitik izni verildiğinde temizlenmiş sayfa yolu, sayfa başlığı, yönlendiren kaynağın sınırlı bilgisi ve izinli kullanım olayları Google Analytics 4'e gönderilir. URL sorgu parametreleri ve maaş tutarları gönderilmez.</p>
      <h3>İletişim verileri</h3><p>İletişim formunu kullandığınızda paylaştığınız ad, e-posta adresi ve mesaj içeriği talebinizi yanıtlamak amacıyla işlenir. Form alanları Analytics olaylarına dahil edilmez.</p>
      <h2>3. İşleme amaçları ve hukuki sebepler</h2>
      <div class="legal-table-wrap"><table class="legal-table"><thead><tr><th>Faaliyet</th><th>Amaç</th><th>Hukuki sebep</th></tr></thead><tbody>
        <tr><td>Zorunlu teknik kayıtlar</td><td>Site güvenliği, hizmetin sunulması ve hataların giderilmesi</td><td>Bir hakkın tesisi veya korunması; veri sorumlusunun meşru menfaati</td></tr>
        <tr><td>Analitik ölçümleme</td><td>Sayfa ve hesaplayıcı kullanımını toplu olarak anlamak</td><td>Açık rıza</td></tr>
        <tr><td>Reklam teknolojileri</td><td>Reklam sunumu ve reklam performansının ölçülmesi</td><td>Açık rıza</td></tr>
        <tr><td>İletişim talepleri</td><td>Kullanıcı talebini yanıtlamak</td><td>Talebin niteliğine göre sözleşmenin kurulması/ifası, hukuki yükümlülük veya meşru menfaat</td></tr>
      </tbody></table></div>
      <h2>4. Veri aktarımı</h2><p>Analitik veya reklam izni verilmesi hâlinde Google hizmetleri devreye girebilir ve veriler yurt dışındaki sistemlerde işlenebilir. Bu aktarımın KVKK'nın yurt dışına aktarım hükümleri kapsamında uygun güvenceye dayanması gerekir. Rıza ekranı tek başına düzenli yurt dışı aktarımının hukuki mekanizması değildir.</p>
      <h2>5. Saklama</h2><p>Çerez tercihi tarayıcıdaki yerel depolamada en fazla 180 gün tutulur. Analitik saklama süresi Google Analytics mülk ayarından yönetilir. İletişim kayıtları talebin sonuçlandırılması ve olası hukuki yükümlülükler için gerekli süreyle sınırlı tutulur.</p>
      <h2>6. Haklarınız</h2><p>KVKK'nın 11. maddesi kapsamındaki bilgi talep etme, düzeltme, silme veya yok etme, aktarılan kişileri öğrenme, işlemeye itiraz etme ve zararın giderilmesini isteme haklarınızı kullanabilirsiniz.</p>
      <h2>7. Tercihlerin değiştirilmesi</h2><p>Sayfanın altındaki <button type="button" class="site-footer__cookie-button" data-consent-open>Çerez Tercihleri</button> düğmesiyle analitik ve reklam izinlerini istediğiniz zaman değiştirebilirsiniz.</p>`
  });
}

function kvkkPage() {
  return page({
    path: '/kvkk-aydinlatma-metni/',
    title: 'KVKK Aydınlatma Metni',
    description: '6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında Maaşım.net veri işleme faaliyetlerine ilişkin aydınlatma metni.',
    body: `
      <p class="legal-warning"><strong>Önemli:</strong> Veri sorumlusunun güncel ticari unvanı, tebligat adresi ve iletişim kanalları <a href="/iletisim/">İletişim</a> sayfasında eksiksiz olarak yayımlanmalıdır.</p>
      <h2>Veri sorumlusu ve temsilcisi</h2><p>Maaşım.net internet sitesini işleten, kimlik ve iletişim bilgileri İletişim sayfasında belirtilen işletmeci veri sorumlusudur.</p>
      <h2>Kişisel verilerin işlenme amaçları</h2><p>Veriler; internet sitesinin güvenli çalışmasını sağlamak, hesaplayıcı ve içeriklerin performansını izinli ölçümleme yoluyla değerlendirmek, reklam tercihlerini uygulamak, iletişim taleplerini yanıtlamak ve hukuki yükümlülükleri yerine getirmek amaçlarıyla işlenebilir.</p>
      <h2>Toplama yöntemi ve hukuki sebep</h2><p>Veriler; web sunucusu kayıtları, tercih yönetimi arayüzü, iletişim formu ve izin verilmesi hâlinde analitik/reklam teknolojileri aracılığıyla elektronik ortamda toplanır. Zorunlu işlemler KVKK'nın 5/2 maddesindeki ilgili şartlara, analitik ve reklam işlemleri ise açık rızaya dayanır.</p>
      <h2>Aktarım yapılan taraflar</h2><p>Teknik altyapı, barındırma, güvenlik, analitik ve reklam hizmeti sağlayıcılarıyla; hizmetin sunulması için gerekli, ölçülü ve hukuka uygun olduğu ölçüde veri paylaşılabilir. Yetkili kamu kurumlarıyla yalnızca hukuki yükümlülük bulunması hâlinde paylaşım yapılır.</p>
      <h2>Yurt dışına aktarım</h2><p>Google Analytics'e veya sertifikalı CMP bağlantısı tamamlandıktan sonra AdSense'e izin verilmesi, yurt dışına veri aktarımına yol açabilir. Düzenli aktarım için KVKK'nın 9. maddesinde öngörülen yeterlilik kararı veya uygun güvence mekanizmalarından uygulanabilir olanı ayrıca tesis edilmelidir.</p>
      <h2>İlgili kişinin hakları</h2><p>KVKK'nın 11. maddesi kapsamında kişisel verilerinizin işlenip işlenmediğini öğrenme, bilgi isteme, işleme amacını öğrenme, aktarılan üçüncü kişileri bilme, düzeltme, silme veya yok etme talep etme, bu işlemlerin aktarılan üçüncü kişilere bildirilmesini isteme, otomatik analiz sonucuna itiraz etme ve zararın giderilmesini talep etme haklarına sahipsiniz.</p>
      <h2>Başvuru</h2><p>Başvurunuzda ad-soyad, başvuru konusu ve talebinizi doğrulamaya yetecek iletişim bilgileri bulunmalıdır. Başvurular <a href="/iletisim/">İletişim</a> sayfasındaki güncel kanallar üzerinden iletilebilir.</p>`
  });
}

function cookiePage() {
  return page({
    path: '/cerez-politikasi/',
    title: 'Çerez Politikası',
    description: 'Maaşım.net çerez ve benzeri teknolojilerinin kategorilerini, amaçlarını, sürelerini ve tercih yönetimini açıklar.',
    body: `
      <p class="legal-note">Analitik ve reklam teknolojileri varsayılan olarak kapalıdır. Kullanıcı açık bir seçim yapmadan Google Analytics yüklenmez. AdSense ayrıca Google sertifikalı CMP bağlantısı hazır olmadan teknik olarak etkinleştirilmez.</p>
      <h2>Kullanılan kategoriler</h2>
      <div class="legal-table-wrap"><table class="legal-table"><thead><tr><th>Teknoloji</th><th>Sağlayıcı</th><th>Kategori</th><th>Amaç</th><th>Süre</th></tr></thead><tbody>
        <tr><td><code>maasim.consent</code> (yerel depolama)</td><td>Maaşım.net</td><td>Zorunlu</td><td>Analitik ve reklam tercihlerini, rıza sürümünü ve güncelleme zamanını saklamak</td><td>En fazla 180 gün veya politika sürümü değişene kadar</td></tr>
        <tr><td><code>_ga</code>, <code>_ga_*</code></td><td>Google Analytics</td><td>Analitik</td><td>İzinli sayfa görüntüleme ve ürün kullanım olaylarını ölçmek</td><td>Yapılandırma gereği en fazla 180 gün</td></tr>
        <tr><td>AdSense/reklam çerezleri</td><td>Google</td><td>Reklam</td><td>Reklam sunumu, sıklık kontrolü ve reklam performansı</td><td>Google'ın geçerli sağlayıcı ve çerez listesine göre değişir</td></tr>
      </tbody></table></div>
      <h2>Rıza modeli</h2><p>“Tümünü Kabul Et”, “Tümünü Reddet” ve “Tercihleri Yönet” seçenekleri aynı ilk ekranda sunulur. Önceden işaretli analitik veya reklam seçeneği bulunmaz. Zorunlu kategori kapatılamaz.</p>
      <h2>Google Consent Mode</h2><p>Google izin sinyalleri başlangıçta <code>denied</code> olarak ayarlanır. Analitik scripti yalnızca analitik izni sonrasında, reklam scriptleri yalnızca reklam izni ve sertifikalı CMP hazır sinyali sonrasında etkinleştirilir. İzin geri çekildiğinde sayfa yeniden yüklenerek daha önce etkinleşmiş üçüncü taraf scriptleri durdurulur.</p>
      <h2>Hangi bilgiler Analytics'e gönderilmez?</h2><p>Brüt veya net maaş, vergi matrahı, SGK matrahı, kesinti tutarı, işveren maliyeti, iletişim formu alanları ve serbest metin Analytics olaylarına dahil edilmez. Olay parametreleri teknik bir izin listesiyle sınırlandırılır.</p>
      <h2>Tercihinizi değiştirin</h2><p><button type="button" class="site-footer__cookie-button" data-consent-open>Çerez Tercihlerini Aç</button></p>
      <h2>Tarayıcı ayarları</h2><p>Tarayıcınız üzerinden çerezleri ve yerel depolamayı silebilir veya engelleyebilirsiniz. Zorunlu tercih kaydını silmeniz hâlinde rıza ekranı tekrar gösterilir.</p>`
  });
}

function addToSitemap(xml, paths) {
  const additions = paths
    .filter((path) => !xml.includes(`<loc>${SITE}${path}</loc>`))
    .map((path) => `<url><loc>${SITE}${path}</loc><lastmod>${LASTMOD}</lastmod></url>`)
    .join('');
  return xml.replace('</urlset>', `${additions}</urlset>`);
}

export async function addPrivacyPages(dist) {
  const pages = [
    { path: '/gizlilik/', html: privacyPage() },
    { path: '/kvkk-aydinlatma-metni/', html: kvkkPage() },
    { path: '/cerez-politikasi/', html: cookiePage() }
  ];

  for (const item of pages) {
    const directory = join(dist, item.path);
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, 'index.html'), item.html);
  }

  const sitemapPath = join(dist, 'sitemap.xml');
  const sitemap = await readFile(sitemapPath, 'utf8');
  await writeFile(sitemapPath, addToSitemap(sitemap, pages.map((item) => item.path)));
  console.log('gizlilik, KVKK ve çerez sayfaları eklendi');
}
