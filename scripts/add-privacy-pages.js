import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const SITE = 'https://maasim.net';
const UPDATED_AT = '30 Temmuz 2026';
const LASTMOD = '2026-07-30';
const CONSENT_VERSION = '2026-07-30.1';

const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

function page({ path, title, description, body }) {
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)} | Maaşım.net</title><meta name="description" content="${escapeHtml(description)}"><meta name="robots" content="index,follow"><link rel="canonical" href="${SITE}${path}"><link rel="stylesheet" href="/assets/p0-content.css"><style>.legal-meta{display:flex;gap:12px;flex-wrap:wrap;margin:20px 0 30px}.legal-meta span{background:#ecfdf5;border:1px solid #99f6e4;border-radius:999px;padding:7px 11px;color:#0f766e;font-size:12px;font-weight:800}.legal-table-wrap{overflow:auto;margin:22px 0}.legal-table{width:100%;min-width:760px;border-collapse:collapse;background:#fff;border:1px solid #dbe4ee}.legal-table th,.legal-table td{padding:13px;border-bottom:1px solid #dbe4ee;text-align:left;vertical-align:top}.legal-table th{background:#f1f5f9}.legal-note{padding:18px;border-left:5px solid #0d9488;background:#ecfdf5}.legal-warning{padding:18px;border-left:5px solid #f59e0b;background:#fffbeb}</style><script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebPage', name: title, description, url: `${SITE}${path}`, inLanguage: 'tr-TR', dateModified: LASTMOD })}</script></head><body><nav></nav><main class="shell"><p class="crumb"><a href="/">Ana Sayfa</a> / ${escapeHtml(title)}</p><p class="eyebrow">Gizlilik ve Veri Koruma</p><h1>${escapeHtml(title)}</h1><p class="lead">${escapeHtml(description)}</p><div class="legal-meta"><span>Son güncelleme: ${UPDATED_AT}</span><span>Rıza sürümü: ${CONSENT_VERSION}</span></div><article class="content">${body}</article></main><footer></footer></body></html>`;
}

function privacyPage() {
  return page({
    path: '/gizlilik/',
    title: 'Gizlilik Politikası',
    description: 'Maaşım.net üzerinde hangi verilerin hangi amaçlarla işlendiğini ve bağımsız yayın modelinin veri kullanım sınırlarını açıklar.',
    body: `
      <p class="legal-note"><strong>Bağımsızlık ve veri kullanım ilkesi:</strong> Maaşım.net bağımsız bir bilgi ve hesaplama yayınıdır. Herhangi bir işveren, finans kuruluşu, sigorta şirketi veya reklamvereni temsil etmez. Analitik veriler reklam hedefleme, yeniden pazarlama, kullanıcı profili oluşturma, veri satışı veya üçüncü taraf pazarlama faaliyeti için kullanılmaz.</p>
      <p class="legal-note"><strong>Hesaplama gizliliği:</strong> Hesaplayıcıya yazdığınız brüt maaş, net maaş, vergi matrahı, SGK matrahı, kesinti ve işveren maliyeti Google Analytics veya Google AdSense'e gönderilmez.</p>
      <h2>1. Veri sorumlusu</h2>
      <p>Veri sorumlusu, Maaşım.net internet sitesini işleten ve güncel kimlik ile iletişim bilgileri <a href="/iletisim/">İletişim</a> sayfasında yayımlanan işletmecidir. KVKK kapsamındaki talepler aynı sayfadaki iletişim kanalı üzerinden iletilebilir.</p>
      <h2>2. İşlenen veri kategorileri</h2>
      <h3>Siteye erişim ve güvenlik kayıtları</h3><p>Sunucu güvenliği, hata teşhisi ve kötüye kullanımın önlenmesi amacıyla IP adresi, istek zamanı, istenen sayfa ve sınırlı teknik tarayıcı bilgileri altyapı sağlayıcısı tarafından işlenebilir.</p>
      <h3>Analitik veriler</h3><p>Yalnızca izin verildiğinde temizlenmiş sayfa yolu, sayfa başlığı, yönlendiren kaynağın sınırlı bilgisi ve izinli ürün kullanım olayları Google Analytics 4'e gönderilir. URL sorgu parametreleri, form içerikleri ve parasal hesaplama değerleri gönderilmez. Google Signals, reklam kişiselleştirme sinyalleri ve User-ID kullanılmaz.</p>
      <h3>Reklam ve site finansmanı verileri</h3><p>Maaşım.net'in ücretsiz ve bağımsız yayımlanmasını finanse etmek amacıyla Google AdSense kullanılabilir. Reklam istekleri bağlamsal ve kişiselleştirilmemiş olarak yapılandırılır; yeniden pazarlama, ilgi alanı hedefleme ve Maaşım.net analitik verilerinden reklam kitlesi oluşturma yapılmaz. Google; sahtekârlıkla mücadele, sıklık sınırlama ve toplu reklam raporlaması için sınırlı teknik verileri işleyebilir.</p>
      <h3>İletişim verileri</h3><p>İletişim formunu kullandığınızda paylaştığınız ad, e-posta adresi ve mesaj içeriği talebinizi yanıtlamak amacıyla işlenir. Form alanları Analytics olaylarına dahil edilmez.</p>
      <h2>3. İşleme amaçları ve hukuki sebepler</h2>
      <div class="legal-table-wrap"><table class="legal-table"><thead><tr><th>Faaliyet</th><th>Amaç</th><th>Hukuki sebep</th></tr></thead><tbody>
        <tr><td>Zorunlu teknik kayıtlar</td><td>Site güvenliği, hizmetin sunulması ve hataların giderilmesi</td><td>Bir hakkın tesisi veya korunması; veri sorumlusunun meşru menfaati</td></tr>
        <tr><td>Analitik ölçümleme</td><td>Sayfa ve hesaplayıcı kullanımını toplu olarak anlamak ve hizmeti geliştirmek</td><td>Açık rıza</td></tr>
        <tr><td>Reklam ve site finansmanı</td><td>Bağlamsal reklam gösterimiyle bağımsız yayının sürdürülebilirliğini sağlamak</td><td>Çerez veya yerel depolama gerektiren işlemler bakımından açık rıza; bölgesel düzenlemelere göre Google CMP tercihleri</td></tr>
        <tr><td>İletişim talepleri</td><td>Kullanıcı talebini yanıtlamak</td><td>Talebin niteliğine göre sözleşmenin kurulması/ifası, hukuki yükümlülük veya meşru menfaat</td></tr>
      </tbody></table></div>
      <h2>4. Veri aktarımı</h2><p>Analitik veya reklam teknolojilerine izin verilmesi hâlinde Google hizmetleri devreye girebilir ve sınırlı teknik veriler yurt dışındaki sistemlerde işlenebilir. Rıza ekranı tek başına düzenli yurt dışı aktarımının hukuki mekanizması değildir; KVKK'nın 9. maddesindeki uygun aktarım mekanizması ayrıca değerlendirilmelidir.</p>
      <h2>5. Saklama</h2><p>Site tercih merkezi kaydı tarayıcıdaki yerel depolamada en fazla 180 gün tutulur. Analitik saklama süresi Google Analytics mülk ayarından yönetilir. İletişim kayıtları talebin sonuçlandırılması ve hukuki yükümlülükler için gerekli süreyle sınırlı tutulur.</p>
      <h2>6. Haklarınız</h2><p>KVKK'nın 11. maddesi kapsamındaki bilgi talep etme, düzeltme, silme veya yok etme, aktarılan kişileri öğrenme, işlemeye itiraz etme ve zararın giderilmesini isteme haklarınızı kullanabilirsiniz.</p>
      <h2>7. Tercihlerin değiştirilmesi</h2><p>Sayfanın altındaki <button type="button" class="site-footer__cookie-button" data-consent-open>Çerez Tercihleri</button> düğmesiyle tercihlerinizi değiştirebilirsiniz. EEA, Birleşik Krallık ve İsviçre'de bu bağlantı Google'ın Avrupa yönetmelikleri tercih ekranını yeniden açar.</p>`
  });
}

function kvkkPage() {
  return page({
    path: '/kvkk-aydinlatma-metni/',
    title: 'KVKK Aydınlatma Metni',
    description: '6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında Maaşım.net veri işleme faaliyetlerine ilişkin aydınlatma metni.',
    body: `
      <p class="legal-warning"><strong>Yayın öncesi zorunlu alan:</strong> Veri sorumlusunun gerçek adı veya ticari unvanı, tebligat adresi ve başvuru iletişim kanalı <a href="/iletisim/">İletişim</a> sayfasında eksiksiz yayımlanmalıdır.</p>
      <h2>Veri sorumlusu ve yayın konumu</h2><p>Maaşım.net internet sitesini işleten, kimlik ve iletişim bilgileri İletişim sayfasında belirtilen işletmeci veri sorumlusudur. Maaşım.net bağımsız bir bilgi ve hesaplama yayınıdır; kullanıcı verileri herhangi bir işveren veya finansal ürün sağlayıcısı adına pazarlama amacıyla işlenmez.</p>
      <h2>Kişisel verilerin işlenme amaçları</h2><p>Veriler; internet sitesinin güvenli çalışmasını sağlamak, hesaplayıcı ve içeriklerin performansını izinli ve toplu ölçümleme yoluyla değerlendirmek, bağlamsal reklamlarla yayının finansmanını sağlamak, iletişim taleplerini yanıtlamak ve hukuki yükümlülükleri yerine getirmek amaçlarıyla işlenebilir.</p>
      <h2>Amaç dışı kullanım yasağı</h2><p>Analitik veriler yeniden pazarlama, kişisel reklam hedefleme, kredi veya sigorta profili çıkarma, çalışan değerlendirme, veri satışı ya da üçüncü tarafların pazarlama kampanyaları için kullanılmaz. Maaş hesaplama girdileri Analytics veya AdSense'e aktarılmaz.</p>
      <h2>Toplama yöntemi ve hukuki sebep</h2><p>Veriler; web sunucusu kayıtları, tercih yönetimi arayüzü, iletişim formu ve izin verilmesi hâlinde analitik/reklam teknolojileri aracılığıyla elektronik ortamda toplanır. Zorunlu işlemler KVKK'nın 5/2 maddesindeki ilgili şartlara; analitik ve çerez kullanan reklam işlemleri açık rızaya dayanır.</p>
      <h2>Aktarım yapılan taraflar</h2><p>Teknik altyapı, barındırma, güvenlik, Google Analytics ve Google AdSense sağlayıcılarıyla; yalnızca belirtilen amaçlar için gerekli ve ölçülü olduğu ölçüde veri paylaşılabilir. Yetkili kamu kurumlarıyla yalnız hukuki yükümlülük bulunması hâlinde paylaşım yapılır.</p>
      <h2>Yurt dışına aktarım</h2><p>Google Analytics veya Google AdSense'in etkinleşmesi yurt dışına veri aktarımına yol açabilir. Düzenli aktarım için KVKK'nın 9. maddesinde öngörülen yeterlilik kararı veya uygun güvence mekanizmalarından uygulanabilir olanı ayrıca tesis edilmelidir.</p>
      <h2>İlgili kişinin hakları</h2><p>KVKK'nın 11. maddesi kapsamında kişisel verilerinizin işlenip işlenmediğini öğrenme, bilgi isteme, işleme amacını öğrenme, aktarılan üçüncü kişileri bilme, düzeltme, silme veya yok etme talep etme, otomatik analiz sonucuna itiraz etme ve zararın giderilmesini talep etme haklarına sahipsiniz.</p>
      <h2>Başvuru</h2><p>Başvurunuzda ad-soyad, başvuru konusu ve talebinizi doğrulamaya yetecek iletişim bilgileri bulunmalıdır. Başvurular <a href="/iletisim/">İletişim</a> sayfasındaki güncel kanallar üzerinden iletilebilir.</p>`
  });
}

function cookiePage() {
  return page({
    path: '/cerez-politikasi/',
    title: 'Çerez Politikası',
    description: 'Maaşım.net çerez ve benzeri teknolojilerinin kategorilerini, amaçlarını, sürelerini ve bölgesel tercih yönetimini açıklar.',
    body: `
      <p class="legal-note">Maaşım.net analitik verileri pazarlama amacıyla kullanmaz. AdSense yalnızca bağımsız yayının finansmanı için bağlamsal ve kişiselleştirilmemiş reklam gösterecek şekilde yapılandırılır.</p>
      <h2>Kullanılan kategoriler</h2>
      <div class="legal-table-wrap"><table class="legal-table"><thead><tr><th>Teknoloji</th><th>Sağlayıcı</th><th>Kategori</th><th>Amaç</th><th>Süre</th></tr></thead><tbody>
        <tr><td><code>maasim.consent</code> (yerel depolama)</td><td>Maaşım.net</td><td>Zorunlu</td><td>Analitik ve reklam/site finansmanı tercihlerini, rıza sürümünü ve güncelleme zamanını saklamak</td><td>En fazla 180 gün veya politika sürümü değişene kadar</td></tr>
        <tr><td><code>_ga</code>, <code>_ga_*</code></td><td>Google Analytics</td><td>Analitik</td><td>İzinli sayfa görüntüleme ve ürün kullanım olaylarını ölçmek; pazarlama veya yeniden hedefleme yapmamak</td><td>Yapılandırma gereği en fazla 180 gün</td></tr>
        <tr><td>AdSense ve Google CMP teknolojileri</td><td>Google</td><td>Reklam ve site finansmanı</td><td>Bağlamsal, kişiselleştirilmemiş reklam sunumu; sıklık kontrolü, sahtekârlıkla mücadele ve toplu raporlama</td><td>Google'ın geçerli sağlayıcı ve çerez listesine göre değişir</td></tr>
      </tbody></table></div>
      <h2>Bölgesel rıza modeli</h2><p>Türkiye ve Google'ın Avrupa mesajının uygulanmadığı bölgelerde Maaşım.net tercih merkezi “Tümünü Kabul Et”, “Tümünü Reddet” ve “Tercihleri Yönet” seçeneklerini sunar. EEA, Birleşik Krallık ve İsviçre'de Google AdSense Privacy &amp; Messaging tarafından yayımlanan IAB TCF uyumlu Avrupa yönetmelikleri mesajı kullanılır.</p>
      <h2>Reklam isteği güvenliği</h2><p>AdSense etiketi mesajın çalışabilmesi için sayfada yüklenir; ancak reklam istekleri kullanıcı tercihi sonuçlanana kadar teknik olarak duraklatılır. Tüm reklam isteklerinde kişiselleştirmeyi devre dışı bırakan ayarlar uygulanır. EEA, Birleşik Krallık ve İsviçre'de reklam istekleri Google CMP'nin TCF kararı sonrasında; diğer bölgelerde site tercih merkezindeki reklam izni sonrasında başlatılır.</p>
      <h2>Google Consent Mode</h2><p><code>analytics_storage</code>, <code>ad_storage</code>, <code>ad_user_data</code> ve <code>ad_personalization</code> başlangıçta <code>denied</code> durumundadır. Maaşım.net kendi tercih merkezinde <code>ad_user_data</code> ve <code>ad_personalization</code> değerlerini her durumda kapalı tutar. Google'ın Avrupa mesajında Consent Mode entegrasyonu ayrıca AdSense panelinden etkinleştirilmelidir.</p>
      <h2>Tercihinizi değiştirin</h2><p><button type="button" class="site-footer__cookie-button" data-consent-open>Çerez Tercihlerini Aç</button></p>
      <h2>Tarayıcı ayarları</h2><p>Tarayıcınız üzerinden çerezleri ve yerel depolamayı silebilir veya engelleyebilirsiniz. Site tercih kaydını silmeniz hâlinde rıza ekranı tekrar gösterilir.</p>`
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
