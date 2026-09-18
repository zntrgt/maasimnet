import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { KADEMELI_EMEKLILIK as DATA } from '../content/kademeli-emeklilik.js';

const SITE = 'https://maasim.net';
const PATH = DATA.path;
const URL = `${SITE}${PATH}`;
const TITLE = 'Kademeli Emeklilik 2026 Son Durum: Çıkacak mı, Kimleri Kapsıyor?';
const DESCRIPTION = 'Kademeli emeklilik çıktı mı, 2026’da gelecek mi? 1999-2008 arası sigortalılar, TBMM teklifleri, EMADDER ve güncel SGK şartları.';
const AUTHOR_ID = `${SITE}/#editorial-team`;

const esc = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const fmt = (iso) => new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC'
}).format(new Date(`${iso}T00:00:00Z`));

const S = DATA.sources;

const faqs = [
  {
    q: 'Kademeli emeklilik çıktı mı?',
    a: 'Hayır. 18 Eylül 2026 itibarıyla 9 Eylül 1999 sonrası sigortalıların emeklilik yaş ve prim şartlarını yeniden kademelendiren yeni bir kanun yürürlüğe girmiş değil.'
  },
  {
    q: '2026’da kademeli emeklilik çıkacak mı?',
    a: 'Buna ilişkin kesinleşmiş resmî bir tarih veya takvim bulunmuyor. TBMM’de teklifler ve soru önergeleri var; ancak bunlar yürürlükte bir kanun anlamına gelmiyor.'
  },
  {
    q: '2000 ile 2008 arası kademeli emeklilik olacak mı?',
    a: 'Kesinleşmiş değil. Bu dönemi kapsayan kanun teklifleri TBMM’ye sunuldu ve bazıları komisyonda; kapsam ve şartlar ancak kabul edilen nihai kanun metniyle kesinleşebilir.'
  },
  {
    q: '99 sonrası kademeli emeklilik tablosu belli mi?',
    a: 'Hayır. İnternette dolaşan tablolar kanun tekliflerine veya sivil toplum önerilerine dayanabilir. Yürürlükte resmî bir 2026 kademeli emeklilik tablosu yoktur.'
  },
  {
    q: 'Kademeli emeklilik çıkarsa kimleri kapsar?',
    a: 'Henüz kesin kapsam yok. Mevcut bazı teklifler 8 Eylül 1999 ile 30 Nisan 2008 arasındaki sigorta başlangıçlarına odaklanıyor; nihai kapsam ancak yasalaşan metinle belirlenebilir.'
  },
  {
    q: 'Kademeli emeklilikte 25 yıl şartı var mı?',
    a: 'Mevcut 4/A mevzuatında 8 Eylül 1999-30 Nisan 2008 dönemi için 58/60 yaşla 7.000 gün seçeneğinin yanında 25 yıl sigortalılık ve en az 4.500 gün seçeneği de bulunur. Bu, henüz çıkmamış kademeli emeklilik düzenlemesi değildir.'
  },
  {
    q: 'Kademeli emeklilikte 2008 hangi ay esas alınıyor?',
    a: '4/A açısından SGK’nın resmî açıklamasında kritik tarih 30 Nisan 2008’dir. 30 Nisan 2008 sonrasında ilk kez sigortalı olanlar için 5510 sayılı Kanunla belirlenen şartlar uygulanır.'
  },
  {
    q: 'EMADDER’ın önerisi yasalaştı mı?',
    a: 'Hayır. EMADDER bir sivil toplum kuruluşudur. Derneğin Bakanlıkla görüşmesi ve model sunması, önerinin Bakanlık tarafından kabul edildiği veya kanunlaştığı anlamına gelmez.'
  }
];

const timelineHtml = DATA.timeline.map((item) => `
  <li class="ke-timeline__item">
    <time datetime="${esc(item.date)}">${esc(fmt(item.date))}</time>
    <div><strong>${esc(item.label)}</strong><p>${esc(item.text)}</p></div>
  </li>`).join('');

const faqHtml = faqs.map((item) => `
  <details class="ke-faq">
    <summary>${esc(item.q)}</summary>
    <p>${esc(item.a)}</p>
  </details>`).join('');

const schema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE}/#organization`,
      name: 'Maaşım.net',
      url: `${SITE}/`
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE}/#website`,
      url: `${SITE}/`,
      name: 'Maaşım.net',
      publisher: { '@id': `${SITE}/#organization` },
      inLanguage: 'tr-TR'
    },
    {
      '@type': 'Article',
      '@id': `${URL}#article`,
      headline: TITLE,
      description: DESCRIPTION,
      url: URL,
      mainEntityOfPage: { '@id': `${URL}#page` },
      author: { '@type': 'Organization', '@id': AUTHOR_ID, name: 'Maaşım.net Editoryal Ekibi' },
      publisher: { '@id': `${SITE}/#organization` },
      datePublished: DATA.publishedAt,
      dateModified: DATA.modifiedAt,
      inLanguage: 'tr-TR',
      about: [
        'Kademeli emeklilik',
        'Türkiye emeklilik sistemi',
        'SGK',
        '1999-2008 sigorta başlangıcı'
      ],
      citation: [
        S.sgk4a,
        S.officialGazetteEyt,
        S.proposal2755,
        S.proposal2959,
        S.question37366,
        S.question48458,
        S.emadderMinistry
      ]
    },
    {
      '@type': 'WebPage',
      '@id': `${URL}#page`,
      url: URL,
      name: TITLE,
      description: DESCRIPTION,
      isPartOf: { '@id': `${SITE}/#website` },
      datePublished: DATA.publishedAt,
      dateModified: DATA.modifiedAt,
      inLanguage: 'tr-TR'
    },
    {
      '@type': 'FAQPage',
      '@id': `${URL}#faq`,
      mainEntity: faqs.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a }
      }))
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Kademeli Emeklilik 2026', item: URL }
      ]
    }
  ]
};

const css = `
:root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#172033;background:#f6f8fb}*{box-sizing:border-box}body{margin:0}.ke-shell{width:min(1120px,calc(100% - 32px));margin:0 auto;padding:42px 0 80px}.ke-crumb{font-size:13px;color:#64748b;margin:0 0 22px}.ke-crumb a,.ke-article a,.ke-aside a{color:#0f766e;text-decoration-thickness:1px;text-underline-offset:3px}.ke-hero{padding:clamp(26px,5vw,54px);border:1px solid #dbe4ee;border-radius:28px;background:linear-gradient(135deg,#fff 0%,#f1f5f9 100%);box-shadow:0 24px 80px rgba(15,39,71,.07)}.ke-eyebrow{display:inline-flex;padding:7px 11px;border-radius:999px;background:#ccfbf1;color:#115e59;font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.ke-hero h1{max-width:900px;margin:16px 0;color:#0f2747;font-size:clamp(38px,6vw,64px);line-height:1.02;letter-spacing:-.05em}.ke-lead{max-width:860px;margin:0;color:#475569;font-size:19px;line-height:1.72}.ke-status{display:grid;grid-template-columns:1.45fr repeat(3,minmax(0,1fr));gap:12px;margin-top:28px}.ke-status__main,.ke-stat{padding:18px;border:1px solid #cbd5e1;border-radius:18px;background:#fff}.ke-status__main{border-color:#fbbf24;background:#fffbeb}.ke-status__main span,.ke-stat span{display:block;color:#64748b;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.05em}.ke-status__main strong{display:block;margin-top:7px;color:#92400e;font-size:21px}.ke-stat strong{display:block;margin-top:7px;color:#0f2747;font-size:16px}.ke-update-note{margin-top:14px;padding:14px 16px;border-radius:14px;background:#0f2747;color:#fff;font-size:14px;line-height:1.6}.ke-layout{display:grid;grid-template-columns:minmax(0,1fr) 280px;gap:42px;align-items:start;margin-top:42px}.ke-article{min-width:0}.ke-article section{scroll-margin-top:90px}.ke-article h2{margin:48px 0 14px;color:#0f2747;font-size:30px;line-height:1.18;letter-spacing:-.025em}.ke-article h3{margin:30px 0 10px;color:#19385e;font-size:22px}.ke-article p,.ke-article li{color:#334155;font-size:16.5px;line-height:1.78}.ke-article strong{color:#172033}.ke-answer{margin:18px 0 24px;padding:18px 20px;border-left:4px solid #0f766e;border-radius:0 14px 14px 0;background:#f0fdfa}.ke-answer strong{display:block;margin-bottom:5px;color:#115e59}.ke-warning{padding:18px 20px;border:1px solid #fde68a;border-radius:16px;background:#fffbeb;color:#78350f}.ke-warning strong{color:#78350f}.ke-table-wrap{overflow-x:auto;margin:20px 0}.ke-table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #e2e8f0}.ke-table th,.ke-table td{padding:13px 14px;border-bottom:1px solid #e2e8f0;text-align:left;vertical-align:top;font-size:14.5px;line-height:1.55}.ke-table th{background:#f8fafc;color:#0f2747}.ke-table td{color:#334155}.ke-source-tag{display:inline-flex;margin-left:6px;padding:2px 7px;border-radius:999px;background:#e2e8f0;color:#475569;font-size:11px;font-weight:800}.ke-aside{position:sticky;top:86px;padding:20px;border:1px solid #dbe4ee;border-radius:20px;background:#fff}.ke-aside h2{margin:0 0 12px;color:#0f2747;font-size:16px}.ke-aside nav{display:grid;gap:9px}.ke-aside nav a{font-size:13.5px;text-decoration:none}.ke-aside__meta{margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0;color:#64748b;font-size:12.5px;line-height:1.6}.ke-timeline{list-style:none;padding:0;margin:22px 0}.ke-timeline__item{display:grid;grid-template-columns:135px minmax(0,1fr);gap:18px;padding:18px 0;border-top:1px solid #e2e8f0}.ke-timeline__item time{color:#64748b;font-size:13px;font-weight:850}.ke-timeline__item strong{color:#0f2747}.ke-timeline__item p{margin:4px 0 0;font-size:15px}.ke-sources{display:grid;gap:10px;padding:0;list-style:none}.ke-sources li{padding:13px 15px;border:1px solid #e2e8f0;border-radius:14px;background:#fff}.ke-sources small{display:block;margin-top:4px;color:#64748b}.ke-faq{margin:10px 0;border:1px solid #dbe4ee;border-radius:14px;background:#fff;overflow:hidden}.ke-faq summary{cursor:pointer;padding:16px 18px;font-weight:850;color:#0f2747}.ke-faq p{margin:0;padding:0 18px 18px;font-size:15.5px}.ke-editorial{margin-top:34px;padding:20px;border:1px solid #99f6e4;border-radius:18px;background:#f0fdfa}.ke-editorial h2{margin-top:0;font-size:21px}.ke-links{display:flex;flex-wrap:wrap;gap:9px;margin-top:16px}.ke-links a{padding:9px 12px;border:1px solid #99f6e4;border-radius:10px;background:#fff;text-decoration:none;font-size:13px;font-weight:800}@media(max-width:900px){.ke-layout{grid-template-columns:1fr}.ke-aside{position:static;order:-1}.ke-status{grid-template-columns:1fr 1fr}.ke-status__main{grid-column:1/-1}}@media(max-width:620px){.ke-shell{width:min(100% - 22px,1120px);padding-top:28px}.ke-hero{padding:24px 20px;border-radius:20px}.ke-hero h1{font-size:38px}.ke-lead{font-size:17px}.ke-status{grid-template-columns:1fr}.ke-status__main{grid-column:auto}.ke-layout{gap:22px}.ke-article h2{font-size:26px}.ke-timeline__item{grid-template-columns:1fr;gap:5px}.ke-table th,.ke-table td{min-width:145px}}`;

const page = `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(TITLE)} | Maaşım.net</title>
  <meta name="description" content="${esc(DESCRIPTION)}">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <link rel="canonical" href="${URL}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${esc(TITLE)}">
  <meta property="og:description" content="${esc(DESCRIPTION)}">
  <meta property="og:url" content="${URL}">
  <meta property="og:site_name" content="Maaşım.net">
  <meta property="og:image" content="${SITE}/assets/logo.svg">
  <meta property="article:published_time" content="${DATA.publishedAt}">
  <meta property="article:modified_time" content="${DATA.modifiedAt}">
  <style>${css}</style>
  <script type="application/ld+json">${JSON.stringify(schema)}</script>
</head>
<body>
  <main class="ke-shell">
    <p class="ke-crumb"><a href="/">Ana Sayfa</a> / Kademeli Emeklilik 2026</p>

    <header class="ke-hero">
      <span class="ke-eyebrow">Sürekli Güncellenen Dosya</span>
      <h1>${esc(TITLE)}</h1>
      <p class="ke-lead">Kademeli emeklilikle ilgili yürürlükteki mevzuatı, TBMM’deki teklifleri, Bakanlık yanıtlarını ve EMADDER gibi sivil toplum kuruluşlarının girişimlerini birbirine karıştırmadan takip ediyoruz. Bu sayfa yalnız doğrulanabilir bir gelişme olduğunda güncellenir.</p>

      <div class="ke-status" aria-label="Kademeli emeklilik güncel durum">
        <div class="ke-status__main"><span>2026 güncel durum</span><strong>${esc(DATA.status)}</strong></div>
        <div class="ke-stat"><span>Yeni yasa yürürlükte mi?</span><strong>Hayır</strong></div>
        <div class="ke-stat"><span>Resmî 2026 tablosu var mı?</span><strong>Hayır</strong></div>
        <div class="ke-stat"><span>Son kaynak kontrolü</span><strong>${esc(fmt(DATA.reviewedAt))}</strong></div>
      </div>
      <div class="ke-update-note"><strong>Son resmî gelişme:</strong> ${esc(DATA.latestOfficialUpdate)}</div>
    </header>

    <div class="ke-layout">
      <article class="ke-article">
        <section id="cikti-mi">
          <h2>Kademeli emeklilik çıktı mı?</h2>
          <div class="ke-answer"><strong>Kısa cevap: Hayır.</strong> 18 Eylül 2026 itibarıyla 9 Eylül 1999 sonrasında sigortalı olanların emeklilik yaş ve prim şartlarını yeniden kademelendiren yeni bir kanun yürürlüğe girmiş değil.</div>
          <p>Bu konuda en sık yapılan hata, <strong>kanun teklifi</strong>, <strong>soru önergesi</strong>, <strong>sivil toplum talebi</strong> ve <strong>yürürlüğe girmiş kanunu</strong> aynı şeymiş gibi aktarmak. Oysa hukuki sonuç doğuran aşama farklıdır: bir düzenlemenin emeklilik şartlarını gerçekten değiştirmesi için yasama sürecinin tamamlanması ve yürürlüğe girmesi gerekir.</p>
          <p>3 Mart 2023’te Resmî Gazete’de yayımlanan 7438 sayılı düzenleme EYT kapsamındaki kişiler açısından yaş şartını kaldırdı. Ancak bu düzenleme, 9 Eylül 1999 ve sonrasında ilk defa sigortalı olanlar için yeni bir kademeli emeklilik sistemi oluşturmadı. <a href="${S.officialGazetteEyt}" target="_blank" rel="noopener noreferrer">7438 sayılı düzenlemeyi Resmî Gazete’de görüntüleyebilirsiniz</a>.</p>
          <p>Çalışma ve Sosyal Güvenlik Bakanlığının 2026’da TBMM’ye gönderdiği yanıtlardan biri de mevcut EYT kapsamını yeniden açıklıyor. 7/37366 esas numaralı soru önergesine verilen ve 7 Eylül 2026’da TBMM kayıtlarına giren cevapta 8 Eylül 1999 ve öncesi ile 9 Eylül 1999 ve sonrası arasındaki mevcut kapsam ayrımı tekrar ediliyor. Bu yanıt <strong>yeni bir kademeli emeklilik modeli veya yürürlük tarihi ilan etmiyor</strong>. Bununla birlikte, bir yanıtta yeni düzenleme duyurulmaması, Bakanlık içinde hiçbir hazırlık bulunmadığının tek başına kanıtı olarak da yorumlanmamalı. <a href="${S.question37366}" target="_blank" rel="noopener noreferrer">TBMM kaydını inceleyin</a>.</p>
        </section>

        <section id="gelecek-mi">
          <h2>Kademeli emeklilik gelecek mi, ne zaman çıkacak?</h2>
          <div class="ke-answer"><strong>Bugün verilebilecek doğrulanmış cevap:</strong> Konu TBMM ve kamuoyu gündeminde; ancak kabul edilmiş bir düzenleme ve açıklanmış resmî bir yürürlük takvimi yok.</div>
          <p>“Kademeli emeklilik gelecek mi?” ve “kademeli emeklilik ne zaman?” aramaları doğal olarak bir tarih arıyor. Fakat mevcut resmî verilerden belirli bir ay veya yıl çıkarmak mümkün değil. TBMM’ye sunulmuş teklifler olması yasama sürecinin başladığını gösterir; tekliflerin komisyonda bulunması ise kanunlaştıkları anlamına gelmez.</p>
          <p>Örneğin 5 Aralık 2024’te sunulan <strong>2/2755</strong> esas numaralı teklif, 8 Eylül 1999 ile 30 Nisan 2008 arasında sigorta başlangıcı bulunan kişiler için emeklilik prim ve yaş şartlarının kademeli uygulanmasını amaçlıyor. TBMM’nin güncel kaydında teklifin son durumu <strong>“Komisyonda”</strong>. <a href="${S.proposal2755}" target="_blank" rel="noopener noreferrer">2/2755 sayılı teklifin TBMM kaydı</a>.</p>
          <p>3 Mart 2025’te sunulan <strong>2/2959</strong> esas numaralı başka bir teklif ise prim ödeme gün sayılarının düşürülmesi ve işçi, memur ve sözleşmeli personele ilişkin kademeli düzenlemeler öngörüyor. Bu teklif de TBMM kayıtlarında komisyonda. <a href="${S.proposal2959}" target="_blank" rel="noopener noreferrer">2/2959 sayılı teklifin TBMM kaydı</a>.</p>
          <div class="ke-warning"><strong>Neden “gelecek” demiyoruz?</strong> Çünkü Meclis’e teklif sunulması, teklifin kabul edileceği veya aynı içerikle yasalaşacağı anlamına gelmez. Bu sayfada tahmin yerine mevcut hukuki aşamayı gösteriyoruz.</div>
        </section>

        <section id="2026">
          <h2>2026’da kademeli emeklilik çıkacak mı?</h2>
          <p><strong>18 Eylül 2026 itibarıyla 2026 içinde yasalaşacağına dair kesinleşmiş resmî bir takvim bulunmuyor.</strong> Buna karşılık konu 2026 boyunca TBMM’de yazılı soru önergeleriyle gündeme gelmeye devam etti.</p>
          <p>3 Haziran 2026 tarihli 7/45214 esas numaralı önerge doğrudan kademeli emeklilik düzenlemesi yapılması yönündeki talepleri konu aldı ve 17 Ağustos 2026’da cevaplandı. <a href="${S.question45214}" target="_blank" rel="noopener noreferrer">TBMM’deki önerge kaydını görüntüleyin</a>.</p>
          <p>Daha güncel olarak 4 Eylül 2026 tarihinde <strong>7/48458</strong> esas numaralı yeni bir yazılı soru önergesi verildi. TBMM kayıtlarında 18 Eylül itibarıyla “15 günlük cevaplanma süresi devam ediyor” bilgisi yer alıyor. Bu kayıt, konunun hâlen Meclis gündemine taşındığını gösteriyor; tek başına bir yasa hazırlığı veya çıkış tarihi göstermiyor. <a href="${S.question48458}" target="_blank" rel="noopener noreferrer">Güncel TBMM kaydı</a>.</p>
        </section>

        <section id="1999-2008">
          <h2>1999-2008 arası kademeli emeklilik ne anlama geliyor?</h2>
          <p>Kademeli emeklilik tartışmasının merkezinde ağırlıklı olarak <strong>8 Eylül 1999 sonrasındaki sigorta başlangıçları ile 30 Nisan 2008 arasındaki dönem</strong> bulunuyor. Bunun nedeni, sosyal güvenlik mevzuatındaki geçiş tarihlerinin emeklilik yaş ve prim koşullarında belirgin farklılıklar yaratması.</p>
          <p>SGK’nın 4/A çalışanlar için yayımladığı mevcut kurallara göre 8 Eylül 1999 ile 30 Nisan 2008 arasında ilk defa hizmet akdiyle çalışmaya başlayanlar şu iki yoldan birindeki şartları sağlayarak yaşlılık aylığına hak kazanabiliyor:</p>

          <div class="ke-table-wrap">
            <table class="ke-table">
              <thead><tr><th>Mevcut 4/A yolu</th><th>Kadın</th><th>Erkek</th><th>Prim / sigortalılık şartı</th></tr></thead>
              <tbody>
                <tr><td>Normal yol</td><td>58 yaş</td><td>60 yaş</td><td>7.000 prim günü</td></tr>
                <tr><td>Alternatif yol</td><td>58 yaş</td><td>60 yaş</td><td>25 yıl sigortalılık + en az 4.500 gün</td></tr>
              </tbody>
            </table>
          </div>

          <p>Bu tablo <strong>kademeli emeklilik önerisi değil, bugün yürürlükteki 4/A şartlarının özetidir</strong>. Kaynak: <a href="${S.sgk4a}" target="_blank" rel="noopener noreferrer">SGK – 4/A Hizmet Akdi ile Çalışanlar</a>.</p>

          <h3>2000 ile 2008 arası kademeli emeklilik olacak mı?</h3>
          <p>Henüz kesinleşmiş değil. TBMM’de bu tarih aralığına odaklanan teklifler var; ancak bugün için 2000-2008 arasında işe başlayan herkese uygulanacak kesinleşmiş yeni yaş veya prim şartı bulunmuyor. Bir teklifin belirli yılları kapsaması ile o yıllar için kazanılmış bir emeklilik hakkı doğması aynı şey değildir.</p>

          <h3>Kademeli emeklilikte 2008 hangi ay?</h3>
          <p>Google’da sık aranan “kademeli emeklilik 2008 hangi ay?” sorusunda kritik ayrım <strong>30 Nisan 2008</strong>. SGK, 4/A kapsamında 8 Eylül 1999-30 Nisan 2008 arasında ilk kez sigortalı olanları bir dönem olarak ele alıyor; 30 Nisan 2008 sonrasında ilk kez sigortalı olanlar için 5510 sayılı Kanunla belirlenen şartların geçerli olduğunu açıklıyor. Bu nedenle yalnızca “2008 öncesi” demek teknik olarak yeterince hassas değildir.</p>
        </section>

        <section id="tablo">
          <h2>Kademeli emeklilik tablosu 2026 belli oldu mu?</h2>
          <div class="ke-answer"><strong>Hayır.</strong> Yürürlükte, SGK tarafından uygulanmak üzere yayımlanmış bir “2026 kademeli emeklilik tablosu” bulunmuyor.</div>
          <p>İnternette “99 sonrası kademeli emeklilik tablosu”, “2000-2008 kademeli emeklilik tablosu” veya belirli yaş ve prim günlerini kesinleşmiş gibi gösteren çok sayıda içerik bulunuyor. Bunların bir bölümü TBMM’ye sunulmuş tekliflerden, bir bölümü sivil toplum kuruluşlarının modellerinden, bir bölümü ise kaynağı belirsiz sosyal medya paylaşımlarından türetiliyor.</p>
          <p>Üstelik TBMM’ye sunulan teklifler dahi tek bir model önermiyor. 2/2755 ile 2/2959 aynı amaç çevresinde farklı düzenleme önerileri içeriyor. Dolayısıyla tekliflerden birindeki rakamları “resmî kademeli emeklilik tablosu” diye yayımlamak yanıltıcı olur.</p>
          <p>Maaşım.net’te ancak kabul edilen nihai düzenlemenin şartları hukuken kesinleştiğinde bunu <strong>“resmî tablo”</strong> olarak etiketleyeceğiz. Teklif aşamasındaki rakamlar varsa açıkça “kanun teklifindeki öneri” olarak ayrıştırılacak.</p>
        </section>

        <section id="kimleri-kapsar">
          <h2>Kademeli emeklilik çıkarsa kimleri kapsar?</h2>
          <p>Henüz yasa olmadığı için kesin kapsam bilinmiyor. Mevcut bazı teklifler 8 Eylül 1999 ile 30 Nisan 2008 arasındaki sigorta başlangıçlarına odaklanıyor. Ancak olası bir düzenlemenin 4/A çalışanları, 4/B Bağ-Kur kapsamındakileri ve 4/C kamu görevlilerini hangi şartlarla kapsayacağı; kadın ve erkekler için yaşların nasıl belirleneceği; prim gününün ne olacağı; başlangıç tarihinin gün bazında nereden çekileceği ancak kabul edilen metinle kesinleşebilir.</p>
          <p>Bu nedenle “1999-2008 arasındaki herkes kesin kapsama girecek” veya “şu yılda işe başlayan kesin şu yaşta emekli olacak” gibi ifadeler bugün için doğrulanmış bilgi değildir.</p>

          <h3>Kademeli emeklilikte 25 yıl şartı var mı?</h3>
          <p>Burada mevcut mevzuat ile olası yeni düzenleme sıkça birbirine karışıyor. Mevcut 4/A kurallarında 8 Eylül 1999-30 Nisan 2008 dönemi için 58/60 yaş ve 7.000 gün seçeneği bulunuyor. İkinci yol ise yine aynı yaşlarla <strong>25 yıldan beri sigortalı olmak ve en az 4.500 gün prim ödemek</strong>. Dolayısıyla “25 yıl” bugün yürürlükteki seçeneklerden birinin unsurudur; henüz yasalaşmamış kademeli emeklilik modelinin kesin şartı değildir.</p>
        </section>

        <section id="emadder">
          <h2>EMADDER’ın kademeli emeklilik talebi ne durumda?</h2>
          <p>Emeklilikte Adalet Derneği (EMADDER), 1999 sonrasında ilk kez sigortalı olanlar için kademeli emeklilik talebini kamuoyuna taşıyan sivil toplum kuruluşlarından biri. EMADDER’ın açıklamaları, <strong>derneğin kendi faaliyetleri ve talepleri açısından birincil kaynaktır</strong>; ancak devletin resmî kararı veya yürürlükteki mevzuat yerine geçmez.</p>
          <p>Dernek, 20 Ağustos 2026’da Çalışma ve Sosyal Güvenlik Bakan Yardımcısı Ahmet Aydın ile Bakanlıkta görüştüğünü ve kendi çözüm önerisini aktardığını açıkladı. <a href="${S.emadderMinistry}" target="_blank" rel="noopener noreferrer">EMADDER’ın 20 Ağustos açıklaması</a>. Dernek ayrıca 10 Ağustos 2026’da Hayati Yazıcı ile görüşme gerçekleştirdiğini duyurdu. <a href="${S.emadderHayatiYazici}" target="_blank" rel="noopener noreferrer">EMADDER’ın 10 Ağustos açıklaması</a>.</p>
          <p>Bu temaslar, kademeli emeklilik talebinin siyasi ve bürokratik muhataplarla görüşüldüğünü gösterir. Fakat görüşmenin yapılmış olması, sunulan modelin Bakanlıkça kabul edildiği, hükümet teklifine dönüştüğü veya yasalaşacağı anlamına gelmez. Sayfada bu iki statüyü özellikle ayrı tutuyoruz.</p>
        </section>

        <section id="gelismeler">
          <h2>Kademeli emeklilik son durum: gelişmeler zaman çizelgesi</h2>
          <p>Aşağıdaki kronoloji, “son dakika” başlıkları yerine doğrulanabilir kayıtların tarihini ve hukuki statüsünü takip eder. Yeni bir resmî gelişme olduğunda en yeni kayıt üste eklenir.</p>
          <ol class="ke-timeline">${timelineHtml}</ol>
        </section>

        <section id="nasil-guncelleniyor">
          <h2>Bu sayfa nasıl güncelleniyor?</h2>
          <p>Maaşım.net bu sayfayı sürekli güncellenen bir referans dosyası olarak tutar. Kaynak önceliği <strong>Resmî Gazete, TBMM, SGK ve Çalışma ve Sosyal Güvenlik Bakanlığı</strong> gibi birincil resmî kaynaklardadır. Sivil toplum kuruluşlarının açıklamaları yalnız kendi talep ve faaliyetlerini doğrulamak için; haber kaynakları ise mümkün olduğunda birincil belgeye ulaşmayı kolaylaştıran ikincil kaynak olarak kullanılır.</p>
          <p>Sayfanın “son güncelleme” tarihi her gün otomatik değiştirilmez. Yalnızca kullanıcının kararını veya konunun hukuki durumunu anlamlı biçimde etkileyen yeni bir bilgi eklendiğinde yenilenir. Böylece “güncel” görünmek için sahte tazelik oluşturulmaz.</p>
          <p>Bir kaynakta yeni teklif, komisyon işlemi, Bakanlık yanıtı veya sivil toplum görüşmesi görülmesi durumunda önce olayın statüsü belirlenir: <strong>kanun mu, teklif mi, soru önergesi mi, resmî açıklama mı, talep mi?</strong> Sayfadaki ana durum kutusu ancak gerçekten hukuki statüyü değiştiren bir gelişme varsa değiştirilir.</p>
        </section>

        <section id="kaynaklar">
          <h2>Temel kaynaklar</h2>
          <ul class="ke-sources">
            <li><a href="${S.sgk4a}" target="_blank" rel="noopener noreferrer"><strong>SGK — 4/A Hizmet Akdi ile Çalışanlar</strong></a><small>8 Eylül 1999-30 Nisan 2008 dönemi için yürürlükteki 4/A yaş ve prim şartları.</small></li>
            <li><a href="${S.officialGazetteEyt}" target="_blank" rel="noopener noreferrer"><strong>Resmî Gazete — 7438 sayılı Kanun</strong></a><small>EYT düzenlemesinin yayımlanan resmî metni.</small></li>
            <li><a href="${S.proposal2755}" target="_blank" rel="noopener noreferrer"><strong>TBMM — 2/2755 sayılı Kanun Teklifi</strong></a><small>1999-2008 dönemine kademeli şartlar öngören teklif; güncel statüsü komisyonda.</small></li>
            <li><a href="${S.proposal2959}" target="_blank" rel="noopener noreferrer"><strong>TBMM — 2/2959 sayılı Kanun Teklifi</strong></a><small>Kademeli emeklilik ve prim şartlarıyla ilgili farklı bir teklif; güncel statüsü komisyonda.</small></li>
            <li><a href="${S.question37366}" target="_blank" rel="noopener noreferrer"><strong>TBMM — 7/37366 Yazılı Soru Önergesi</strong></a><small>7 Eylül 2026’da kayda giren Bakanlık cevabını içerir.</small></li>
            <li><a href="${S.question48458}" target="_blank" rel="noopener noreferrer"><strong>TBMM — 7/48458 Yazılı Soru Önergesi</strong></a><small>4 Eylül 2026 tarihli güncel önerge; son durum sayfa kontrolünde doğrulanır.</small></li>
            <li><a href="${S.emadderMinistry}" target="_blank" rel="noopener noreferrer"><strong>EMADDER — Bakanlık görüşmesi açıklaması</strong></a><small>Derneğin kendi faaliyetine ilişkin birincil açıklama; resmî mevzuat kaynağı değildir.</small></li>
          </ul>

          <div class="ke-editorial">
            <h2>Editoryal not</h2>
            <p>Bu içerik emeklilik hakkı konusunda genel bilgilendirme sağlar; kişisel emeklilik tarihi hesabı değildir. İlk sigorta tarihi, statü, hizmet birleştirmesi ve özel durumlar sonucu değiştirebilir. Kesin kişisel işlem için SGK kayıtları ve yürürlükteki mevzuat esas alınmalıdır.</p>
            <div class="ke-links"><a href="/kaynak-politikasi/">Kaynak Politikası</a><a href="/editoryal-politika/">Editoryal Politika</a><a href="/sgk-prim-hesaplama/">SGK Prim Hesaplama</a><a href="/iletisim/">Düzeltme bildir</a></div>
          </div>
        </section>

        <section id="sss">
          <h2>Kademeli emeklilik hakkında sık sorulan sorular</h2>
          ${faqHtml}
        </section>
      </article>

      <aside class="ke-aside">
        <h2>Bu sayfada</h2>
        <nav aria-label="İçindekiler">
          <a href="#cikti-mi">Kademeli emeklilik çıktı mı?</a>
          <a href="#gelecek-mi">Gelecek mi, ne zaman?</a>
          <a href="#2026">2026’da çıkacak mı?</a>
          <a href="#1999-2008">1999-2008 arası</a>
          <a href="#tablo">2026 tablosu var mı?</a>
          <a href="#kimleri-kapsar">Kimleri kapsar?</a>
          <a href="#emadder">EMADDER ne diyor?</a>
          <a href="#gelismeler">Gelişmeler</a>
          <a href="#kaynaklar">Kaynaklar</a>
          <a href="#sss">SSS</a>
        </nav>
        <div class="ke-aside__meta">
          <strong>İlk yayın:</strong> ${esc(fmt(DATA.publishedAt))}<br>
          <strong>Son güncelleme:</strong> ${esc(fmt(DATA.modifiedAt))}<br>
          <strong>Son kaynak kontrolü:</strong> ${esc(fmt(DATA.reviewedAt))}
        </div>
      </aside>
    </div>
  </main>
</body>
</html>`;

export async function addKademeliEmeklilik(dist) {
  const dir = join(dist, PATH.replace(/^\\/+|\\/+$/g, ''));
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'index.html'), page);
  console.log(`Kademeli emeklilik canlı dosyası üretildi: ${PATH}`);
  return { generated: 1, path: PATH };
}
