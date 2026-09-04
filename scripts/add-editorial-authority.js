import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { EDITORIAL_AUTHORITY, editorialTeamSchema } from '../content/editorial-authority.js';
import { SITE_METADATA } from '../content/site-metadata.js';

const SITE = EDITORIAL_AUTHORITY.site.origin;
const PUBLISHED = SITE_METADATA.releaseModifiedAt;
const esc = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const organization = {
  '@type': 'Organization',
  '@id': EDITORIAL_AUTHORITY.site.organizationId,
  name: 'Maaşım.net',
  url: `${SITE}/`,
  logo: { '@type': 'ImageObject', url: `${SITE}/assets/logo.svg` },
  knowsAbout: [
    'Türkiye ücret bordrosu',
    'Brütten nete maaş hesaplama',
    'Netten brüte maaş hesaplama',
    'Gelir vergisi dilimleri',
    'SGK prime esas kazanç',
    'Çalışan yan hakları'
  ]
};

const css = `
:root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#0f172a;background:#f8fafc}*{box-sizing:border-box}body{margin:0}.authority-shell{width:min(1040px,calc(100% - 32px));margin:0 auto;padding:54px 0 88px}.authority-crumb{font-size:13px;color:#64748b}.authority-crumb a,.authority-section a,.authority-card a,.freshness a{color:#0f766e}.authority-eyebrow{display:inline-flex;margin-top:30px;padding:7px 11px;border-radius:999px;background:#ccfbf1;color:#115e59;font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.authority-shell h1{max-width:900px;margin:18px 0 16px;color:#0f2747;font-size:clamp(38px,6vw,62px);line-height:1.03;letter-spacing:-.05em}.authority-lead{max-width:850px;margin:0;color:#475569;font-size:19px;line-height:1.7}.authority-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin:34px 0}.authority-card,.authority-note,.freshness{padding:22px;border:1px solid #dbe4ee;border-radius:20px;background:#fff}.authority-card h2,.authority-section h2{margin-top:0;color:#0f2747}.authority-card p,.authority-section p,.authority-section li{color:#334155;line-height:1.7}.authority-section{margin-top:44px;max-width:900px}.authority-section h2{font-size:29px;margin-bottom:12px}.authority-steps{counter-reset:step;display:grid;gap:12px;padding:0;list-style:none}.authority-steps li{position:relative;padding:18px 18px 18px 58px;border:1px solid #e2e8f0;border-radius:16px;background:#fff}.authority-steps li:before{counter-increment:step;content:counter(step);position:absolute;left:17px;top:17px;width:28px;height:28px;border-radius:999px;background:#0f2747;color:#fff;display:grid;place-items:center;font-size:13px;font-weight:900}.authority-note{margin-top:24px;border-color:#99f6e4;background:#f0fdfa}.authority-links{display:flex;flex-wrap:wrap;gap:10px;margin-top:28px}.authority-links a{padding:10px 13px;border:1px solid #cbd5e1;border-radius:12px;background:#fff;color:#0f2747;text-decoration:none;font-size:13px;font-weight:850}.freshness{margin-top:38px;background:#f8fafc}.freshness strong{display:block;color:#0f2747}.freshness span{display:block;margin-top:5px;color:#475569;font-size:14px}.authority-meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:14px}.authority-meta div{padding:15px;border-top:1px solid #cbd5e1}.authority-meta dt{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#64748b}.authority-meta dd{margin:5px 0 0;font-weight:800;color:#0f2747}@media(max-width:720px){.authority-grid,.authority-meta{grid-template-columns:1fr}.authority-shell{width:min(100% - 22px,1040px);padding-top:34px}.authority-shell h1{font-size:40px}.authority-lead{font-size:17px}}
`;

function graph({ path, title, description, type = 'WebPage' }) {
  const url = `${SITE}${path}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      organization,
      editorialTeamSchema(),
      {
        '@type': 'WebSite',
        '@id': `${SITE}/#website`,
        url: `${SITE}/`,
        name: 'Maaşım.net',
        publisher: { '@id': EDITORIAL_AUTHORITY.site.organizationId },
        inLanguage: 'tr-TR'
      },
      {
        '@type': type,
        '@id': `${url}#page`,
        url,
        name: title,
        description,
        inLanguage: 'tr-TR',
        datePublished: PUBLISHED,
        dateModified: SITE_METADATA.releaseModifiedAt,
        isPartOf: { '@id': `${SITE}/#website` },
        publisher: { '@id': EDITORIAL_AUTHORITY.site.organizationId }
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: title, item: url }
        ]
      }
    ]
  };
}

function page({ path, title, description, eyebrow, body, type }) {
  const schema = graph({ path, title, description, type });
  return `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(title)} | Maaşım.net</title>
  <meta name="description" content="${esc(description)}">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <link rel="canonical" href="${SITE}${path}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${SITE}${path}">
  <meta property="og:site_name" content="Maaşım.net">
  <meta property="og:image" content="${SITE}/assets/logo.svg">
  <style>${css}</style>
  <script type="application/ld+json">${JSON.stringify(schema)}</script>
</head>
<body>
  <main class="authority-shell">
    <p class="authority-crumb"><a href="/">Ana Sayfa</a> / ${esc(title)}</p>
    <span class="authority-eyebrow">${esc(eyebrow)}</span>
    <h1>${esc(title)}</h1>
    <p class="authority-lead">${esc(description)}</p>
    ${body}
    <aside class="freshness" aria-label="Güncellik bilgisi">
      <strong>Güncellik</strong>
      <span>Son güncelleme: ${SITE_METADATA.releaseModifiedAt}</span>
      <span>Politika ve yöntem değişiklikleri yalnız anlamlı içerik güncellemesinde tarih yeniler.</span>
    </aside>
    <dl class="authority-meta">
      <div><dt>Yayınlayan</dt><dd>Maaşım.net</dd></div>
      <div><dt>Editoryal ekip</dt><dd>Maaşım.net Editoryal Ekibi</dd></div>
    </dl>
  </main>
</body>
</html>`;
}

const sharedPolicyLinks = `<div class="authority-links"><a href="/hakkimizda/">Hakkımızda</a><a href="/editoryal-politika/">Editoryal politika</a><a href="/kaynak-politikasi/">Kaynak politikası</a><a href="/hesaplama-metodolojisi/">Hesaplama metodolojisi</a><a href="/iletisim/">Düzeltme bildirimi</a></div>`;

const aboutBody = `
<section class="authority-grid" aria-label="Maaşım.net hakkında temel bilgiler">
  <article class="authority-card"><h2>Ne yapıyoruz?</h2><p>Maaşım.net, Türkiye’de ücret bordrosunu daha anlaşılır hale getirmek için maaş hesaplama araçları, resmî parametre sayfaları, senaryolar ve çalışma hayatı rehberleri yayımlar.</p></article>
  <article class="authority-card"><h2>Ne yapmıyoruz?</h2><p>Maaşım.net bir kamu kurumu, mali müşavirlik veya kişiye özel hukuk ya da vergi danışmanlığı hizmeti değildir. Hesaplar karar desteği içindir; resmî bordro yerine geçmez.</p></article>
  <article class="authority-card"><h2>Hesaplama temeli</h2><p>Bordro motoru; gelir vergisi tarifesi, SGK taban ve tavanı, çalışan primleri ve ilgili istisnaları ay bazında uygular. Teknik ayrıntılar <a href="/hesaplama-metodolojisi/">hesaplama metodolojisinde</a> açıklanır.</p></article>
  <article class="authority-card"><h2>İçerik temeli</h2><p>Kaynak önceliği resmî ve birincil belgelerdedir. Akademik veya ikincil kaynaklar konu gerektiriyorsa açıkça etiketlenerek kullanılır. Ayrıntılar <a href="/kaynak-politikasi/">kaynak politikasında</a> yer alır.</p></article>
</section>
<section class="authority-section"><h2>Şeffaflık ve düzeltme</h2><p>Her önemli veri güncellemesinde kullanılan parametreler, kaynaklar ve kontrol tarihleri gözden geçirilir. Hata veya güncellik sorunu bildirmek için ilgili URL ve gözlemle birlikte <a href="/iletisim/">iletişim sayfasından</a> bize ulaşabilirsiniz.</p>${sharedPolicyLinks}</section>`;

const editorialBody = `
<section class="authority-section"><h2>İçerik üretim ve kontrol süreci</h2><ol class="authority-steps">
<li><strong>Arama niyeti ve kullanıcı ihtiyacı belirlenir.</strong> İçeriğin cevaplaması gereken ana soru ve karar noktası netleştirilir.</li>
<li><strong>Kaynak hiyerarşisi kurulur.</strong> Resmî mevzuat, kurum yayını, akademik çalışma veya konuya uygun birincil kaynaklar seçilir.</li>
<li><strong>Hesap veya iddia yeniden üretilebilir hale getirilir.</strong> Maaşım.net motorundan türetilen örnekler varsayımlarıyla birlikte gösterilir.</li>
<li><strong>Editoryal kontrol yapılır.</strong> Başlık, erken cevap, kaynak bağlantıları, tarih, yöntem, iç linkler ve kullanıcıyı yanıltabilecek kesinlik ifadeleri gözden geçirilir.</li>
<li><strong>Yayın sonrası güncellik izlenir.</strong> Mevzuat veya parametre değişirse ilgili içerik güncellenir; yalnız build çalıştığı için son güncelleme tarihi değiştirilmez.</li>
<li><strong>Düzeltmeler görünür biçimde uygulanır.</strong> Maddi hata tespit edilirse içerik düzeltilir; karar etkisi olan değişikliklerde güncelleme tarihi yenilenir.</li>
</ol></section>
<section class="authority-grid">
<article class="authority-card"><h2>Yazarlık</h2><p>Kurumsal içeriklerin yazarı <strong>Maaşım.net Editoryal Ekibi</strong> olarak gösterilir. Gerçek bir uzman incelemesi olmadığı sürece kişisel uzman adı veya unvanı üretilmez.</p></article>
<article class="authority-card"><h2>Yapay zekâ kullanımı</h2><p>Yapay zekâ araçları yapı, dil ve analiz desteğinde kullanılabilir; ancak mevzuat, finansal parametre veya akademik bulgu yalnız model çıktısına dayanarak yayımlanmaz. Kaynak ve hesap kontrolü ayrıca yapılır.</p></article>
<article class="authority-card"><h2>Ticari içerik</h2><p>Sponsorlu veya ticari iş birliği içeriği yayımlanırsa bunun editoryal içerikten ayrıldığı açık biçimde belirtilir. Ticari ilişki bordro motorundaki resmî parametreleri değiştirmez.</p></article>
<article class="authority-card"><h2>Güncellik</h2><p>Yayın tarihi ile son güncelleme tarihi aynı kavram değildir. <code>dateModified</code> yalnız içerikte anlamlı bir değişiklik olduğunda yenilenir.</p></article>
</section>
<div class="authority-note"><strong>Kanıt standardı:</strong> Kaynak seçimi <a href="/kaynak-politikasi/">Kaynak Politikası</a>, bordro hesapları ise <a href="/hesaplama-metodolojisi/">Hesaplama Metodolojisi</a> ile açıklanır.</div>${sharedPolicyLinks}`;

const sourceBody = `
<section class="authority-section"><h2>Kaynak hiyerarşisi</h2><ol class="authority-steps">
<li><strong>Resmî mevzuat ve kurum belgeleri.</strong> Vergi, SGK, asgari ücret ve benzeri bordro parametrelerinde ilk tercih mevzuat veya yetkili kurum yayınıdır.</li>
<li><strong>Birincil araştırma ve akademik yayın.</strong> Davranış, müzakere veya çalışan deneyimi gibi konularda mümkün olduğunda araştırmanın kendisine bağlantı verilir.</li>
<li><strong>Kurumsal teknik dokümantasyon.</strong> Bir ürün, platform veya ölçüm özelliği anlatılıyorsa sağlayıcının güncel resmî dokümanı tercih edilir.</li>
<li><strong>İkincil kaynaklar.</strong> Yorum veya bağlam için kullanılabilir; birincil kaynağın yerine geçirilmez ve kesin mevzuat dayanağı gibi sunulmaz.</li>
</ol></section>
<section class="authority-grid">
<article class="authority-card"><h2>Rakamlar</h2><p>Rakam içeren bordro içerikleri mümkün olduğunda merkezi veri katmanı veya bordro motorundan üretilir. Aynı parametrenin farklı sayfalarda elle kopyalanması azaltılır.</p></article>
<article class="authority-card"><h2>Kaynak tarihi</h2><p>Dış bağlantının yalnız varlığı yeterli kabul edilmez. Belgenin geçerlilik dönemi ve içerikle ilişkisi kontrol edilir; özellikle yıllık parametrelerde dönem açıkça belirtilir.</p></article>
<article class="authority-card"><h2>Piyasa verileri</h2><p>Kaynağı, örneklemi veya dönemi bilinmeyen maaş ortalamaları kesin piyasa verisi gibi yayımlanmaz. Örnek ücretler kişisel öneri değil, senaryo olarak etiketlenir.</p></article>
<article class="authority-card"><h2>Çelişkili kaynaklar</h2><p>Kaynaklar farklı sonuç veriyorsa fark gizlenmez. Yetki, tarih ve kapsam karşılaştırılır; gerekli olduğunda sonuç yerine belirsizlik açıklanır.</p></article>
</section>
<section class="authority-section"><h2>Kaynak düzeltme talepleri</h2><p>Bozuk bağlantı, eski mevzuat veya yanlış yorum gördüğünüzde <a href="/iletisim/">iletişim formunda</a> sayfa adresini ve kontrol edilmesini istediğiniz bölümü paylaşabilirsiniz. Editoryal süreç <a href="/editoryal-politika/">Editoryal Politika</a>, hesaplama tekniği <a href="/hesaplama-metodolojisi/">Hesaplama Metodolojisi</a> içinde açıklanır.</p>${sharedPolicyLinks}</section>`;

const pages = [
  {
    path: '/hakkimizda/',
    title: 'Maaşım.net Hakkında',
    description: 'Maaşım.net’in maaş hesaplama yaklaşımını, kapsam sınırlarını, veri kaynaklarını ve editoryal şeffaflık ilkelerini inceleyin.',
    eyebrow: 'Kurumsal Bilgi',
    type: 'AboutPage',
    body: aboutBody
  },
  {
    path: '/editoryal-politika/',
    title: 'Editoryal Politika',
    description: 'Maaşım.net içeriklerinin nasıl araştırıldığını, yazıldığını, kaynak ve hesap kontrolünden geçirildiğini ve güncellendiğini öğrenin.',
    eyebrow: 'Editoryal Güven',
    type: 'WebPage',
    body: editorialBody
  },
  {
    path: '/kaynak-politikasi/',
    title: 'Kaynak Politikası',
    description: 'Maaşım.net’in resmî mevzuat, kurum belgeleri, akademik araştırmalar ve ikincil kaynaklar için kullandığı kanıt standardını inceleyin.',
    eyebrow: 'Kaynak ve Kanıt',
    type: 'WebPage',
    body: sourceBody
  }
];

export async function addEditorialAuthority(dist) {
  for (const item of pages) {
    const dir = join(dist, item.path.replace(/^\/+|\/+$/g, ''));
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, 'index.html'), page(item));
  }
  console.log(`Editoryal otorite sayfaları üretildi: ${pages.length}`);
  return { generated: pages.length, paths: pages.map((item) => item.path) };
}
