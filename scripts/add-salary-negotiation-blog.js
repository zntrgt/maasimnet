import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const published = '2026-07-31';
const articlePath = '/blog/maas-zam-gorusmesi-nasil-yapilir/';
const articleUrl = `https://maasim.net${articlePath}`;
const heroPath = '/assets/maas-zam-gorusmesi.svg';
const heroUrl = `https://maasim.net${heroPath}`;

const sources = {
  nberNegotiation: 'https://www.nber.org/papers/w33903',
  nberNegotiable: 'https://www.nber.org/papers/w18511',
  nberSalaryTaboo: 'https://www.nber.org/papers/w25145',
  nberBenchmarking: 'https://www.nber.org/papers/w30570',
  nberTransparency: 'https://www.nber.org/papers/w28903',
  thorsteinson: 'https://onlinelibrary.wiley.com/doi/10.1111/j.1559-1816.2011.00779.x',
  harvardAnchor: 'https://www.pon.harvard.edu/daily/negotiation-skills-daily/when-to-make-the-first-offer-in-negotiation/',
  prospectTheory: 'https://doi.org/10.1142/9789814417358_0006',
  organizationalJustice: 'https://www.annualreviews.org/content/journals/10.1146/annurev-orgpsych-032414-111457',
  genderBacklash: 'https://www.sciencedirect.com/science/article/abs/pii/S0749597806000884',
  politeness: 'https://pubmed.ncbi.nlm.nih.gov/30865655/',
  remoteWork: 'https://pubs.aeaweb.org/doi/abs/10.1257/pandp.20251029'
};

const faq = [
  ['Maaş zammı istemek için en doğru zaman ne zamandır?', 'Bütçe ve ücret kararları kesinleşmeden önce, ölçülebilir bir başarıdan sonra veya rol kapsamı belirgin biçimde genişlediğinde görüşme açmak daha uygundur.'],
  ['Maaş görüşmesinde ilk rakamı çalışan mı söylemeli?', 'Piyasa aralığı ve rol değeri hakkında güçlü veriniz varsa gerçekçi ve savunulabilir bir ilk teklif çapa oluşturabilir. Bilginiz zayıfsa önce ücret bandını sormak daha güvenlidir.'],
  ['Zam isterken enflasyonu söylemek doğru mu?', 'Evet; ancak enflasyon tek gerekçe olmamalıdır. Talep rol kapsamı, performans sonuçları, piyasa ücretleri ve gelecekte üstlenilecek sorumluluklarla desteklenmelidir.'],
  ['Maaş görüşmesinde ne kadar zam istenmeli?', 'Herkes için geçerli tek bir oran yoktur. Mevcut paket, piyasa bandı, sorumluluk artışı, şirket bütçesi ve alternatif fırsatlar birlikte değerlendirilmelidir.'],
  ['Yönetici maaş talebini reddederse ne yapılmalı?', 'Ret gerekçesi, yeniden değerlendirme tarihi, gerekli performans kriterleri ve karar sahibi netleştirilmelidir. Sabit ücret mümkün değilse prim, yan hak, unvan veya tarihli ücret güncellemesi konuşulabilir.'],
  ['Başka bir iş teklifi maaş pazarlığında kullanılmalı mı?', 'Gerçek ve değerlendirmeye hazır bir teklif, tehdit olarak değil piyasa değerinin somut göstergesi olarak sunulabilir. Blöf güven ilişkisini ve mevcut işi riske atabilir.'],
  ['Maaş görüşmesi e-posta ile mi yüz yüze mi yapılmalı?', 'Asıl görüşmenin yüz yüze veya görüntülü yapılması genellikle daha etkilidir. E-posta, görüşme talep etmek ve sonrasında tarih, kriter ve kararları yazılılaştırmak için kullanılmalıdır.'],
  ['Kurucudan zam istemek farklı mıdır?', 'Evet. Kurucular sabit maliyet, nakit akışı, runway ve ekip içi emsal etkisine daha fazla odaklanabilir. Sabit ücretin yanında performans primi, opsiyon veya tarihli artış planı daha önemli hâle gelebilir.']
];

const graph = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://maasim.net/#organization',
      name: 'Maaşım.net',
      url: 'https://maasim.net/',
      logo: { '@type': 'ImageObject', url: 'https://maasim.net/assets/logo.svg' }
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: 'https://maasim.net/' },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://maasim.net/blog/' },
        { '@type': 'ListItem', position: 3, name: 'Maaş ve Zam Görüşmesi Nasıl Yapılır?', item: articleUrl }
      ]
    },
    {
      '@type': 'Article',
      headline: 'Maaş ve Zam Görüşmesi Nasıl Yapılır? Psikoloji ve Araştırmalara Dayalı Rehber',
      description: 'Yönetici veya kurucuyla maaş görüşmesini çapalama, güç dengesi, örgütsel adalet, piyasa verileri ve örnek konuşmalarla açıklayan bilimsel rehber.',
      mainEntityOfPage: articleUrl,
      datePublished: published,
      dateModified: published,
      inLanguage: 'tr-TR',
      author: { '@id': 'https://maasim.net/#organization' },
      publisher: { '@id': 'https://maasim.net/#organization' },
      image: heroUrl,
      about: ['maaş görüşmesi', 'zam görüşmesi', 'maaş pazarlığı', 'ücret müzakeresi', 'örgütsel psikoloji'],
      citation: Object.values(sources)
    },
    {
      '@type': 'FAQPage',
      mainEntity: faq.map(([name, text]) => ({
        '@type': 'Question',
        name,
        acceptedAnswer: { '@type': 'Answer', text }
      }))
    }
  ]
};

const heroSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675" role="img" aria-labelledby="title desc"><title id="title">Maaş ve zam görüşmesi için bilimsel hazırlık modeli</title><desc id="desc">Piyasa verisi, ölçülebilir katkı, hedef ücret bandı ve alternatif paket bileşenlerini gösteren görsel.</desc><rect width="1200" height="675" rx="36" fill="#eef6ff"/><rect x="65" y="75" width="1070" height="525" rx="32" fill="#fff" stroke="#cbd5e1"/><text x="110" y="145" font-family="Arial" font-size="42" font-weight="800" fill="#0f2747">Maaş görüşmesinin dört dayanağı</text><text x="110" y="190" font-family="Arial" font-size="22" fill="#475569">Talebi kişisel ihtiyaçtan çıkarıp iş gerekçesine dönüştürün.</text><g font-family="Arial"><g transform="translate(110 245)"><rect width="220" height="230" rx="24" fill="#eff6ff"/><text x="24" y="55" font-size="19" font-weight="700" fill="#1d4ed8">PİYASA VERİSİ</text><text x="24" y="105" font-size="44" font-weight="900" fill="#0f2747">X–Y</text><text x="24" y="150" font-size="18" fill="#475569">Savunulabilir ücret bandı</text></g><g transform="translate(360 245)"><rect width="220" height="230" rx="24" fill="#ecfdf5"/><text x="24" y="55" font-size="19" font-weight="700" fill="#047857">İŞ SONUCU</text><text x="24" y="105" font-size="44" font-weight="900" fill="#0f2747">KPI</text><text x="24" y="150" font-size="18" fill="#475569">Ölçülebilir katkı ve ROI</text></g><g transform="translate(610 245)"><rect width="220" height="230" rx="24" fill="#fff7ed"/><text x="24" y="55" font-size="19" font-weight="700" fill="#c2410c">GELECEK ROLÜ</text><text x="24" y="105" font-size="44" font-weight="900" fill="#0f2747">Z</text><text x="24" y="150" font-size="18" fill="#475569">Yeni sorumluluk kapsamı</text></g><g transform="translate(860 245)"><rect width="220" height="230" rx="24" fill="#f5f3ff"/><text x="24" y="55" font-size="19" font-weight="700" fill="#6d28d9">ALTERNATİFLER</text><text x="24" y="105" font-size="44" font-weight="900" fill="#0f2747">+</text><text x="24" y="150" font-size="18" fill="#475569">Prim, yan hak ve takvim</text></g></g><text x="110" y="550" font-family="Arial" font-size="20" fill="#475569">Net talep + iş birliği dili + yazılı takip</text></svg>`;

const article = `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Maaş Görüşmesi Nasıl Yapılır? Bilimsel Zam Pazarlığı Rehberi | Maaşım.net</title>
  <meta name="description" content="Yönetici veya kurucuyla maaş görüşmesi nasıl yapılır? Çapalama, güç dengesi, piyasa verileri ve örnek konuşmalarla bilimsel zam pazarlığı rehberi.">
  <link rel="canonical" href="${articleUrl}">
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
  <meta property="og:type" content="article">
  <meta property="og:locale" content="tr_TR">
  <meta property="og:title" content="Maaş ve Zam Görüşmesi Nasıl Yapılır?">
  <meta property="og:description" content="Psikoloji, örgütsel sosyoloji ve müzakere araştırmalarına dayanan uygulamalı maaş görüşmesi rehberi.">
  <meta property="og:url" content="${articleUrl}">
  <meta property="og:image" content="${heroUrl}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/assets/favicon.svg">
  <link rel="stylesheet" href="/assets/blog.css">
  <script type="application/ld+json">${JSON.stringify(graph)}</script>
</head>
<body>
  <main class="shell">
    <div class="crumb"><a href="/">Ana Sayfa</a> › <a href="/blog/">Blog</a> › Maaş ve Zam Görüşmesi</div>
    <div class="layout">
      <article>
        <header>
          <span class="tag">Kariyer · Maaş Pazarlığı · Bilimsel Rehber</span>
          <h1>Maaş ve Zam Görüşmesi Nasıl Yapılır? Psikoloji ve Araştırmalara Dayalı Rehber</h1>
          <p class="lead">Yönetici veya kurucudan ücret artışı istemek yalnızca bir rakam konuşmak değildir. Görüşme; piyasa değeri, örgütsel statü, güç dengesi, bilişsel önyargılar ve şirket ekonomisinin aynı masada buluştuğu bir müzakeredir.</p>
          <p class="meta">Yayımlandı ve akademik kaynaklar son kontrol edildi: 31 Temmuz 2026 · 18 dakika</p>
        </header>

        <section class="answer">
          <h2>Kısa cevap: Maaş görüşmesi nasıl yapılmalı?</h2>
          <p><strong>Talebinizi kişisel giderlere değil, rolünüzün piyasa değeri ile yarattığınız iş sonucuna dayandırın.</strong> Görüşmeden önce hedef bandınızı, alt sınırınızı ve ücret dışı alternatiflerinizi belirleyin. Net fakat iş birliğine açık bir talep sunun; görüşmeyi tarih, kriter ve karar sahibiyle yazılılaştırarak kapatın.</p>
        </section>

        <figure class="figure"><img src="${heroPath}" width="1200" height="675" fetchpriority="high" alt="Maaş görüşmesinde piyasa verisi, iş sonucu, gelecek rolü ve alternatif paket bileşenleri"><figcaption>Maaş talebini kişisel ihtiyaçtan çıkarıp ölçülebilir bir iş gerekçesine dönüştüren dört katman.</figcaption></figure>

        <div class="body">
          <h2 id="neden-zor">Maaş görüşmesi neden bu kadar zor geliyor?</h2>
          <p>Maaş, yalnızca satın alma gücünü göstermez. Çalışan açısından ücret aynı zamanda kurum içindeki değer, statü, kıdem ve adalet algısıyla ilişkilidir. Bu nedenle açıklamasız bir ret, sadece finansal bir karar değil, “şirket beni nasıl görüyor?” sorusuna verilen ilişkisel bir cevap gibi hissedilebilir.</p>
          <p>Örgütsel adalet literatürü, çalışanların yalnızca sonuca değil; kararın hangi kurallarla verildiğine, kendilerine nasıl davranıldığına ve gerekçelerin ne kadar şeffaf olduğuna önem verdiğini gösterir. <a href="${sources.organizationalJustice}" rel="noopener noreferrer">Colquitt ve Zipay’ın örgütsel adalet derlemesi</a>, ücret ve terfi kararlarında süreç algısının çalışan tepkilerini güçlü biçimde etkilediğini ortaya koyar.</p>
          <p>Yönetici veya kurucu ise talebi farklı bir çerçeveden değerlendirir: kalıcı sabit maliyet, ekip içi ücret dengesi, bütçe takvimi, diğer çalışanlara yaratılacak emsal ve şirketin nakit akışı. İki tarafın aynı rakama farklı anlamlar yüklemesi görüşmenin duygusal yükünü artırır.</p>

          <h2 id="capalama">Çapalama etkisi: İlk rakam görüşmeyi nasıl şekillendirir?</h2>
          <p>Çapalama, karşılaşılan ilk sayının sonraki değerlendirmeler için referans noktası hâline gelmesidir. Thorsteinson’ın maaş teklifleri üzerine yaptığı deneylerde, yüksek başlangıç taleplerinin katılımcıların sunduğu maaş tekliflerini yukarı çekebildiği görüldü. <a href="${sources.thorsteinson}" rel="noopener noreferrer">Thorsteinson çalışmasını inceleyin</a>.</p>
          <p>Bu bulgu, rastgele ve savunulamaz bir rakam söylemek gerektiği anlamına gelmez. Gerçekçi olmayan talepler güvenilirliği zedeleyebilir. Güçlü bir çapa üç bileşene dayanmalıdır:</p>
          <ul><li>Benzer rollerin güncel piyasa aralığı</li><li>Sorumluluk kapsamı ve kıdem seviyesi</li><li>Ölçülebilir iş sonuçları ve gelecekte üstlenilecek rol</li></ul>
          <div class="note"><b>Örnek ifade:</b> “Pozisyonun güncel sorumluluk kapsamı, benzer rollerin piyasa ücretleri ve son dönemde üstlendiğim ek alanlar birlikte değerlendirildiğinde brüt ücretimin X–Y bandında konumlanmasının uygun olduğunu düşünüyorum.”</div>
          <p>Harvard Program on Negotiation da ilk teklifin belirsizliğin yüksek olduğu müzakerelerde güçlü bir çapa oluşturabileceğini; ancak karşı tarafın bütçesi ve alternatifleri hakkında çok az bilgi varsa önce ücret bandını sormanın daha güvenli olabileceğini vurgular. <a href="${sources.harvardAnchor}" rel="noopener noreferrer">Harvard müzakere notu</a>.</p>

          <h2 id="kayip-korkusu">Kayıptan kaçınma: “Beni kaybedersiniz” demek doğru mu?</h2>
          <p>Beklenti teorisine göre insanlar sonuçları bir referans noktasına göre kazanç veya kayıp olarak değerlendirir ve kayıplar çoğu durumda benzer büyüklükteki kazançlardan daha güçlü hissedilebilir. Ancak bu etkiyi her durumda geçerli sabit bir katsayıya indirgemek doğru değildir. <a href="${sources.prospectTheory}" rel="noopener noreferrer">Kahneman ve Tversky’nin beklenti teorisi</a>.</p>
          <p>Maaş görüşmesinde bu mekanizma, çalışanın ayrılmasının yaratacağı operasyonel maliyet üzerinden düşünülebilir: kurumsal hafıza kaybı, projelerin devri, işe alım süresi, adaptasyon maliyeti ve müşteri ilişkilerinin riske girmesi. Fakat bunları tehdit olarak kullanmak ters tepebilir.</p>
          <div class="compare"><div><b>Zayıf yaklaşım</b><p>“Bu zam olmazsa başka yere giderim ve projeler aksar.”</p></div><div><b>Daha güçlü yaklaşım</b><p>“Bu alanın operasyonel bilgisini ve önemli ilişkilerini uzun süredir yönetiyorum. Önümüzdeki dönemde sürekliliği koruyarak yeni sorumlulukları büyütmek istiyorum. Ücretimin rolün güncel kapsamıyla uyumlu hâle gelmesi uzun vadeli devamlılık açısından önemli.”</p></div></div>

          <h2 id="neden-pazarlik-yok">Çalışanlar neden maaş pazarlığı yapmıyor?</h2>
          <p>Çoğu çalışan, alacağı cevaptan çok görüşmeyi açmanın sosyal sonucundan çekinir: yöneticinin kızması, sadakatin sorgulanması, teklifin geri çekilmesi veya gelecekteki terfinin etkilenmesi.</p>
          <p>2025 tarihli NBER çalışması, ABD teknoloji sektöründe iş arayan üç binden fazla profesyonelin teklif ve müzakere davranışlarını inceledi. Örneklemde çalışanların yüzde 47’si en az bir teklif üzerinde pazarlık yaptı; yüzde 27’si tercih ettiği teklifin koşullarını iyileştirdi. Müzakere yoluyla ücret artışı ortalama yaklaşık yüzde 4 düzeyindeydi. <a href="${sources.nberNegotiation}" rel="noopener noreferrer">NBER çalışma belgesi</a>.</p>
          <p>Bu, pazarlık yapan herkesin zam alacağı anlamına gelmez. Daha doğru sonuç şudur: görüşmeyi hiç açmamak, olası bir iyileşme ihtimalini baştan sıfıra indirir.</p>
          <p>Ücretin pazarlığa açık olduğunun açıkça belirtilmesi de davranışı değiştirir. Yaklaşık iki bin beş yüz iş arayanla yapılan saha deneyinde, ücretin müzakere edilebilir olduğu açıkça yazıldığında cinsiyetler arasındaki görüşme başlatma farkı azaldı. <a href="${sources.nberNegotiable}" rel="noopener noreferrer">NBER saha deneyi</a>.</p>

          <h2 id="guc-asimetrisi">Güç asimetrisi: Yönetici ve çalışan masaya eşit oturmaz</h2>
          <p>İşveren genellikle bütçe aralığını, ekipteki diğer ücretleri, pozisyonun ikame edilebilirliğini ve gerçek ücret tavanını çalışandan daha iyi bilir. Çalışan ise kendi alternatifleri, ayrılma isteği ve kabul edeceği en düşük paket hakkında daha fazla bilgi sahibidir.</p>
          <p>Bu bilgi asimetrisini azaltmanın en etkili yolu, görüşmeye piyasa verisi ve rol kapsamı analiziyle hazırlanmaktır. NBER araştırmaları, şirketlerin piyasa ücret karşılaştırmalarına erişmesinin ücret dağılımını daraltabildiğini gösterir. <a href="${sources.nberBenchmarking}" rel="noopener noreferrer">Ücret kıyaslama çalışması</a>.</p>
          <p>Görüşmeden önce şu soruların cevabı hazır olmalıdır:</p>
          <ul><li>Benzer roller hangi ücret bandında?</li><li>İş tanımım başlangıçtan beri nasıl genişledi?</li><li>Şirket için kritik hangi bilgi, süreç veya ilişkilere sahibim?</li><li>Yerime birinin bulunması ve yetişmesi ne kadar sürer?</li><li>Şirketin bütçe ve büyüme dönemi nedir?</li><li>Ücret dışında hangi değişkenler müzakere edilebilir?</li></ul>

          <h2 id="maas-tabusu">Maaş konuşmasının tabu olması çalışanı nasıl zayıflatır?</h2>
          <p>Ücret bilgisi birçok iş yerinde sosyal olarak hassas kabul edilir. Çalışanlar hem kendi maaşlarını paylaşmaktan hem de iş arkadaşlarının maaşını sormaktan çekinebilir. NBER’in “Salary Taboo” çalışması, bu mahremiyet normlarının kurum içindeki ücret dağılımını öğrenmeyi zorlaştıran bilgi sürtünmeleri yarattığını gösterir. <a href="${sources.nberSalaryTaboo}" rel="noopener noreferrer">Salary Taboo çalışması</a>.</p>
          <p>Ancak ücret şeffaflığının etkisi tek yönlü değildir. İş arkadaşları arasındaki şeffaflık ücret farklarını daraltabilir; şirketlerin bireysel pazarlığa daha katı yaklaşmasına da yol açabilir. Şirketler arası ücret bilgisi ise çalışanların daha yüksek ücret veren işverenlere yönelmesini kolaylaştırabilir. <a href="${sources.nberTransparency}" rel="noopener noreferrer">Ücret şeffaflığı araştırması</a>.</p>

          <h2 id="ne-soylenmeli">Maaş görüşmesinde ne söylenmeli?</h2>
          <p>En güçlü görüşme anlatısı dört parçadan oluşur.</p>
          <h3>Rolün nasıl değiştiğini gösterin</h3><blockquote>“İşe başladığım dönemde sorumluluk alanım X ile sınırlıyken bugün X’in yanında Y ve Z süreçlerini de yönetiyorum.”</blockquote>
          <h3>Ürettiğiniz sonucu anlatın</h3><blockquote>“Son dönemde yürüttüğüm çalışmalar sonucunda X metriğinde anlamlı bir iyileşme sağlandı ve Y projesi planlanan süreden önce tamamlandı.”</blockquote>
          <h3>Piyasa ve şirket içi karşılığını kurun</h3><blockquote>“Benzer sorumluluk ve kıdem seviyesindeki roller için gördüğüm piyasa bandıyla mevcut paketim arasında belirgin bir fark oluştu.”</blockquote>
          <h3>Net ve müzakere edilebilir talebi söyleyin</h3><blockquote>“Bu kapsam doğrultusunda aylık brüt ücretimin X–Y bandında yeniden değerlendirilmesini konuşmak istiyorum.”</blockquote>

          <h2 id="enflasyon">Geçim sıkıntısı ve enflasyon hiç konuşulmamalı mı?</h2>
          <p>Enflasyonun ücret üzerindeki etkisini konuşmak yanlış değildir. Ancak yalnız kişisel giderlere dayanan bir talep, yöneticinin cevaplayabileceği kurumsal bir gerekçe oluşturmaz.</p>
          <div class="compare"><div><b>Zayıf gerekçe</b><p>“Kiralar ve faturalar çok arttı. Maaşım yetmiyor.”</p></div><div><b>Daha güçlü gerekçe</b><p>“Satın alma gücündeki değişimin yanında rolümün kapsamı ve ürettiğim sonuçlar da belirgin biçimde arttı. Piyasa verileri ve sorumluluk seviyem doğrultusunda ücretimin yeniden değerlendirilmesini istiyorum.”</p></div></div>

          <h2 id="is-birligi">İş birliği dili neden daha etkili olabilir?</h2>
          <p>Maaş görüşmesi karşı tarafı yenmeniz gereken tek seferlik bir mücadele değildir. Görüşmeden sonra aynı yöneticiyle çalışmaya devam edeceğiniz için ekonomik sonuç kadar ilişkinin niteliği de önemlidir.</p>
          <p>Deneysel çalışmalar, talep dilinin karşı tarafta oluşan duyguyu ve ekonomik kararı etkileyebildiğini gösterir. Daha nazik rica ve istek ifadeleri, sert talep diline göre daha olumlu sonuçlar ve gelecekte tekrar iş yapma konusunda daha yüksek isteklilik üretebilir. <a href="${sources.politeness}" rel="noopener noreferrer">İlgili deneysel çalışma</a>.</p>
          <div class="compare"><div><b>Kapatıcı dil</b><p>“Bu ücretin altında çalışmaya devam etmem mümkün değil.”</p></div><div><b>Net ve iş birlikçi dil</b><p>“Bu rolü uzun vadede sürdürmek istiyorum. Sorumluluklarımla ücretimi daha dengeli hâle getirecek bir çözümü birlikte oluşturabilir miyiz?”</p></div></div>

          <h2 id="cinsiyet">Kadın çalışanlar için sosyal maliyet farklı olabilir mi?</h2>
          <p>Bowles, Babcock ve Lai tarafından yürütülen deneylerde daha yüksek ücret için pazarlık başlatan kadın adaylar bazı değerlendirme koşullarında erkek adaylardan daha fazla sosyal tepkiyle karşılaştı. <a href="${sources.genderBacklash}" rel="noopener noreferrer">Araştırmanın özeti</a>.</p>
          <p>Bu bulgu kadınların daha az istemesi gerektiği anlamına gelmez. Sorunun bireysel cesaretten çok, benzer davranışların farklı çalışanlar için farklı sosyal maliyet yaratabilmesi olduğunu gösterir. Talebi kurum hedefleriyle ilişkilendirmek, önceden tanımlanmış kriterlere dayandırmak ve karar sürecini yazılılaştırmak sübjektif alanı daraltabilir. Asıl sorumluluk ise şeffaf ücret bantları ve nesnel terfi kriterleri kurması gereken işverendedir.</p>

          <h2 id="kurucu-yonetici">Kurucuyla görüşmek ile kurumsal yöneticiyle görüşmek aynı mı?</h2>
          <h3>Kurucuyla görüşürken</h3>
          <p>Kurucu; nakit akışı, runway, büyüme hızı, yatırım planı, sabit maliyetlerin sürdürülebilirliği ve ekip içinde yaratılacak emsale daha fazla odaklanabilir.</p>
          <blockquote>“Ücret artışının bütçeye kalıcı etkisini anlıyorum. Sabit ücret, performans primi ve belirli tarihte yeniden değerlendirme seçeneklerini birlikte ele alabiliriz.”</blockquote>
          <h3>Kurumsal yöneticiyle görüşürken</h3>
          <p>Yönetici çoğu zaman nihai bütçenin tek sahibi değildir; İK ücret bandı, yıllık bütçe takvimi, performans notu ve üst yönetim onayıyla sınırlı olabilir. Bu nedenle yöneticinin talebi yukarı taşıyabilmesi için savunulabilir bir iş gerekçesi hazırlamak gerekir.</p>
          <blockquote>“Bu talebi ücret komitesine taşırken kullanabileceğimiz performans ve piyasa verilerini birlikte netleştirebilir miyiz?”</blockquote>

          <h2 id="yan-haklar">Bütçe yoksa hangi yan haklar müzakere edilebilir?</h2>
          <p>“Bütçemiz yok” her zaman görüşmenin bittiği anlamına gelmez. Şunlar konuşulabilir:</p>
          <ul><li>Performans primi veya dönemsel bonus</li><li>Yemek ve ulaşım desteği</li><li>İşveren katkılı BES ve özel sağlık sigortası</li><li>Uzaktan veya hibrit çalışma</li><li>Ek izin</li><li>Eğitim ve sertifika bütçesi</li><li>Unvan veya kademe değişikliği</li><li>Hisse veya opsiyon</li><li>İmza ya da devam bonusu</li><li>Belirli tarihte bağlayıcı yeniden değerlendirme</li></ul>
          <p>Uzaktan çalışma ve esneklik çalışanlar açısından gerçek bir ekonomik değer yaratabilir. Araştırmalar bazı çalışanların benzer bir rolde esneklik için ücretin bir bölümünden vazgeçmeye razı olabildiğini gösterir. <a href="${sources.remoteWork}" rel="noopener noreferrer">AEA çalışması</a>.</p>
          <div class="cta-box"><h3>Teklifin gerçek yıllık değerini karşılaştırın</h3><p>Maaş, prim, yan hak ve başlangıç ayını birlikte hesaplayın.</p><a class="button" href="/maas-teklifi-karsilastirma/">Maaş teklifini karşılaştır</a></div>

          <h2 id="konusma-ornegi">Maaş görüşmesi konuşma örneği</h2>
          <blockquote>“Son dönemde rolümün kapsamı belirgin biçimde genişledi. Başlangıçtaki sorumluluklarıma ek olarak X ve Y alanlarını da üstlendim. Bu süreçte Z metriğinde ölçülebilir bir iyileşme sağladık ve kritik projeleri planlanan takvimde tamamladık.<br><br>Benzer kıdem ve sorumluluk düzeyindeki rollerin piyasa ücretlerini de inceledim. Mevcut ücretimin hem rolün güncel kapsamının hem de piyasa bandının altında kaldığını görüyorum.<br><br>Bu nedenle aylık brüt ücretimin X–Y bandında yeniden değerlendirilmesini konuşmak istiyorum. Şirketin bütçe koşullarını da dikkate alarak bunu sabit ücret, performans primi veya tarihli bir güncelleme planı üzerinden nasıl çözebileceğimizi değerlendirebilir miyiz?”</blockquote>

          <h2 id="ret">Yönetici “şu an mümkün değil” derse ne söylenmeli?</h2>
          <p>Hemen geri çekilmek veya tartışmaya girmek yerine kısıtın niteliğini anlamaya çalışın:</p>
          <ul><li>Karar bütçe nedeniyle mi, performans değerlendirmesi nedeniyle mi?</li><li>Talebin değerlendirilebilmesi için hangi kriterlerin karşılanması gerekiyor?</li><li>Bir sonraki ücret değerlendirmesi hangi tarihte?</li><li>O tarihte hangi hedeflere ve hangi banda bakılacak?</li><li>Kısmi artış veya performans primi mümkün mü?</li><li>Kararı tekrar ele almak için bugünden takvim oluşturulabilir mi?</li></ul>
          <blockquote>“Anlıyorum. Bunun geçici bir bütçe kısıtı mı, yoksa rol seviyemle ilgili bir değerlendirme mi olduğunu netleştirebilir miyiz? Konuyu belirli bir tarihte yeniden açacaksak hangi hedeflerin ve hangi ücret bandının değerlendirileceğini bugünden yazılı hâle getirmek isterim.”</blockquote>

          <h2 id="kontrol-listesi">Maaş görüşmesinden önce kontrol listesi</h2>
          <ul><li>Mevcut brüt ve net ücretimi biliyor muyum?</li><li>Yıllık toplam net gelirimi hesapladım mı?</li><li>Prim ve yan hakların yıllık değerini çıkardım mı?</li><li>Rolüm son değerlendirmeden beri nasıl değişti?</li><li>Ölçülebilir üç iş sonucum nedir?</li><li>Piyasa ücret bandı nedir?</li><li>Talep edeceğim X–Y bandı nedir?</li><li>Kabul edebileceğim alt sınır nedir?</li><li>Ücret olmazsa isteyeceğim alternatifler nelerdir?</li><li>Görüşme sonunda hangi tarih ve kararı almak istiyorum?</li></ul>
          <div class="cta-box"><h3>Görüşmeden önce maaşını hesapla</h3><p>Brüt, net, vergi dilimleri ve yıllık toplamı aynı ekranda görün.</p><a class="button" href="/#hesaplayici">2026 maaş hesaplama aracını aç</a></div>

          <h2 id="sonuc">Sonuç: Maaş istemek bir rica değil, iş ilişkisinin yeniden değerlendirilmesidir</h2>
          <p>Maaş görüşmesi “Beni seviyor musunuz?” veya “Bu zammı hak ediyor muyum?” konuşması değildir. Daha doğru soru şudur: üstlendiğim rol, yarattığım değer, piyasa koşulları ve şirketin gelecek beklentileri dikkate alındığında iş ilişkisinin ekonomik koşulları nasıl güncellenmeli?</p>
          <p>İyi bir maaş görüşmesi veriye dayanır, net bir talep içerir, karşı tarafın kısıtlarını anlamaya çalışır, alternatif değişkenleri masada tutar ve tarih ile kriterlerle sonuçlanır.</p>

          <h2 id="sss">Sık sorulan sorular</h2>
          ${faq.map(([question, answer]) => `<details><summary>${question}</summary><p>${answer}</p></details>`).join('')}

          <h2 id="kaynakca">Akademik kaynaklar</h2>
          <ul>
            <li><a href="${sources.nberNegotiation}" rel="noopener noreferrer">Cullen, Pakzad-Hurson ve Perez-Truglia — Pushing the Envelope: The Effects of Salary Negotiations</a> — NBER Working Paper.</li>
            <li><a href="${sources.thorsteinson}" rel="noopener noreferrer">Thorsteinson — Initiating Salary Discussions With an Extreme Request</a> — Journal of Applied Social Psychology.</li>
            <li><a href="${sources.prospectTheory}" rel="noopener noreferrer">Kahneman ve Tversky — Prospect Theory: An Analysis of Decision Under Risk</a>.</li>
            <li><a href="${sources.genderBacklash}" rel="noopener noreferrer">Bowles, Babcock ve Lai — Sometimes It Does Hurt to Ask</a>.</li>
            <li><a href="${sources.nberSalaryTaboo}" rel="noopener noreferrer">Cullen ve Perez-Truglia — The Salary Taboo</a> — NBER Working Paper.</li>
            <li><a href="${sources.nberBenchmarking}" rel="noopener noreferrer">Cullen, Li ve Perez-Truglia — What’s My Employee Worth?</a> — NBER Working Paper.</li>
            <li><a href="${sources.organizationalJustice}" rel="noopener noreferrer">Colquitt ve Zipay — Justice, Fairness, and Employee Reactions</a>.</li>
          </ul>
          <div class="note"><b>Kaynak notu:</b> NBER çalışma belgeleri ile hakemli dergi makaleleri aynı yayın türü değildir. Yazıda bu ayrım korunmuş, bulgular kesin nedensel kurallar gibi sunulmamıştır.</div>
        </div>
      </article>
      <aside><div class="side"><b>Bu rehberde</b><a href="#capalama">Çapalama etkisi</a><a href="#kayip-korkusu">Kayıptan kaçınma</a><a href="#guc-asimetrisi">Güç asimetrisi</a><a href="#ne-soylenmeli">Ne söylenmeli?</a><a href="#kurucu-yonetici">Kurucu ve yönetici farkı</a><a href="#yan-haklar">Yan haklar</a><a href="#konusma-ornegi">Konuşma örneği</a><a href="#kontrol-listesi">Kontrol listesi</a><a href="#sss">SSS</a></div></aside>
    </div>
  </main>
</body>
</html>`;

export async function addSalaryNegotiationBlog(dist) {
  const articleDir = join(dist, 'blog', 'maas-zam-gorusmesi-nasil-yapilir');
  await mkdir(articleDir, { recursive: true });
  await writeFile(join(articleDir, 'index.html'), article, 'utf8');
  await writeFile(join(dist, 'assets', 'maas-zam-gorusmesi.svg'), heroSvg, 'utf8');
  console.log('Maaş ve zam görüşmesi bilimsel rehberi eklendi.');
}
