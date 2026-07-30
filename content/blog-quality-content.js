const GIB = 'https://gib.gov.tr/vergi-konulari/1/11_ucret_geliri/11/73/327';
const SGK = 'https://www.sgk.gov.tr/Content/Post/2e0c9e1a-2cfe-4456-af10-49d3de0c58ba/Prime-Esas-Kazanc-Miktarlari-2026-01-14-10-35-39';
const CSGB = 'https://csgb.gov.tr/tr/istatistikler/calisma-hayati-istatistikleri/kidem-tazminati-tavan-miktari/';
const EGM = 'https://www.egm.org.tr/bireysel-emeklilik/devlet-katkisi/';
const KVKK = 'https://www.kvkk.gov.tr/Icerik/4199/Kisisel-Verilerin-Islenmesinde-Genel-Ilkeler';
const WHO = 'https://www.who.int/standards/classifications/frequently-asked-questions/burn-out-an-occupational-phenomenon';
const REMOTE = 'https://www.mevzuat.gov.tr/File/GeneratePdf?mevzuatNo=38293&mevzuatTur=KurumVeKurulusYonetmeligi&mevzuatTertip=5';

const common = {
  reviewer: 'Maaşım.net Editoryal Ekibi',
  reviewedAt: '30 Temmuz 2026',
  methodology: 'Rakamlar resmî kurumların yayımladığı 2026 parametreleriyle kontrol edilir; örnek senaryolar varsayım olarak açıkça etiketlenir. Mevzuat yorumu gerektiren konularda tek bir bordro örneği genelleştirilmez.'
};

export const blogQualityContent = {
  '2027-maas-zammi-beklentileri': {
    ...common,
    decisionTitle: '2027 maaş görüşmesine hangi veriyle hazırlanılmalı?',
    intro: 'Tek bir enflasyon oranını doğrudan zam oranı kabul etmek hatalıdır. Çalışan ve işveren, geçmiş satın alma gücü kaybını, ileriye dönük beklentiyi, piyasa ücret bandını ve rol değişimini ayrı kalemler halinde değerlendirmelidir.',
    rows: [
      ['Gerçekleşen enflasyon', 'Geçmiş kaybı ölçer', 'TÜİK aylık ve yıllık TÜFE', 'Tek başına gelecek zammı belirlemez'],
      ['İleriye dönük beklenti', 'Yeni ücretin aşınma riskini gösterir', 'TCMB raporu ve beklenti anketi', 'Tahmin, kesinleşmiş oran değildir'],
      ['Piyasa ücret bandı', 'Rolün yeniden işe alım maliyetini gösterir', 'Sektör ve kıdem bazlı veri', 'Şirket içi unvanla sınırlı kalmayın'],
      ['Performans ve rol kapsamı', 'Kişisel değer artışını ölçer', 'Hedef, sorumluluk ve terfi', 'Enflasyon telafisiyle karıştırmayın']
    ],
    checklist: ['Mevcut yıllık brüt ve 12 aylık ortalama neti çıkarın.', 'Enflasyon telafisi, performans ve terfi beklentisini ayrı yazın.', 'Alt, orta ve üst zam senaryolarını karşılaştırın.', 'Yeni vergi ve SGK parametreleri açıklanana kadar net rakamı kesin sonuç gibi sunmayın.'],
    mistakes: 'En büyük hata, TCMB tahminini veya tek bir piyasa beklentisini “resmî zam oranı” gibi sunmaktır. Bu yaklaşım hem finansal karar kalitesini düşürür hem de içeriğin güvenilirliğini zedeler.',
    extraFaq: [['2027 zam görüşmesinde brüt mü net mi konuşulmalı?', 'Karşılaştırma brüt üzerinden kurulmalı; karar etkisi 12 aylık ortalama net ve toplam paketle ayrıca gösterilmelidir.'], ['Enflasyon kadar zam almak satın alma gücünü tamamen korur mu?', 'Her zaman değil. Vergi dilimi, yan haklar, harcama sepeti ve zam tarihi çalışanın gerçek sonucunu değiştirebilir.']],
    sources: [[GIB, 'GİB ücret gelirleri ve vergi tarifesi'], [SGK, 'SGK prime esas kazanç sınırları']],
    cta: ['/senaryolar/', 'Zam senaryolarını karşılaştır', 'Farklı brüt ücret ve zam oranlarının yıllık net etkisini yan yana görün.']
  },
  'is-yerinde-finansal-saglik': {
    ...common,
    decisionTitle: 'Finansal sağlık programı hangi sırayla kurulmalı?',
    intro: 'Eğitim programından önce ücret temeli ve çalışanların nakit akışı sorunları ele alınmalıdır. Program, düşük ücreti kişisel bütçe disiplini sorunu gibi göstermemeli; ücret, kısa vadeli dayanıklılık, borç desteği ve uzun vadeli birikimi birlikte yönetmelidir.',
    rows: [['Ücret temeli', 'Piyasa bandı ve iç denge', 'Ücret adaleti ve öngörülebilirlik', 'Önce'], ['Acil durum desteği', 'Beklenmedik gider dayanıklılığı', 'Acil fon veya maaş avansı politikası', 'İkinci'], ['Borç danışmanlığı', 'Yüksek maliyetli borçların yönetimi', 'Gizli ve bağımsız danışmanlık', 'Üçüncü'], ['Uzun vadeli birikim', 'Emeklilik ve güvence', 'İşveren katkılı BES ve finansal eğitim', 'Dördüncü']],
    checklist: ['Anonim ihtiyaç araştırması yapın.', 'Ücret ve yan hak kullanımını gelir gruplarına göre analiz edin.', 'Danışmanlık verisini yöneticilerden ve performans sisteminden ayırın.', 'Program başarısını yalnız katılım sayısıyla değil finansal dayanıklılık göstergeleriyle ölçün.'],
    mistakes: 'Finansal wellbeing programını yalnız seminer serisine indirgemek “wellbeing washing” üretir. Çalışanın yapısal gelir problemi çözülmeden bütçe eğitimi verilmesi sorumluluğu yanlış yere taşır.',
    extraFaq: [['Finansal sağlık programında maaş avansı olmalı mı?', 'Olabilir; ancak ücret döngüsünü kalıcı borçlanmaya çevirmeyecek limit, tekrar kullanım ve danışmanlık kuralları gerekir.'], ['İşveren çalışanın borç bilgisini görebilir mi?', 'Bireysel borç ve danışmanlık bilgileri işverenden gizli tutulmalı; yalnız anonim toplu veriler raporlanmalıdır.']],
    sources: [[EGM, 'EGM BES devlet katkısı'], [SGK, 'SGK işveren BES ve özel sağlık uygulaması'], [KVKK, 'KVKK veri minimizasyonu ve amaçla sınırlılık']],
    cta: ['/blog/isveren-katkili-bes/', 'İşveren katkılı BES değerini incele', 'Uzun vadeli birikim desteğinin çalışan paketindeki gerçek değerini hesaplayın.']
  },
  '2026-yemek-karti-istisnasi': {
    ...common,
    decisionTitle: 'Yemek desteği bordroda nasıl kontrol edilmeli?',
    intro: 'Gelir vergisi ve SGK uygulaması aynı başlık altında değerlendirilmemelidir. Ödeme şekli, fiilî çalışma günü, işyerinde yemek verilip verilmediği ve limit üzerindeki bölüm ayrı kontrol edilmelidir.',
    rows: [['İşyerinde yemek', 'Ayni hizmet', 'Çalışana doğrudan yemek sağlanır', 'Belge ve hizmet kapsamı'], ['Yemek kartı', 'Amaçla sınırlı ödeme aracı', 'Çalışılan gün ve yemek amacı', 'Kartın kullanım kapsamı'], ['Nakit yemek yardımı', 'Bordro ödemesi', 'GV ve SGK koşulları ayrı', 'Limit üzeri ücret riski'], ['İzin/rapor günü', 'Fiilî çalışma yok', 'Şirket ödeme yapabilir', 'İstisna otomatik değildir']],
    checklist: ['Fiilî çalışma gününü bordro takvimiyle eşleştirin.', 'Gelir vergisi ve SGK istisnasını ayrı satırlarda kontrol edin.', 'Limit üzerindeki tutarı bordroda görünür gösterin.', 'Uzaktan çalışma ve ay ortası giriş/çıkış kurallarını politikaya yazın.'],
    mistakes: 'Kart hesabına yüklenen her tutarın otomatik olarak vergisiz olduğunu varsaymak yanlıştır. İstisna; ödeme amacı, tutar, gün ve uygulama koşullarıyla sınırlıdır.',
    extraFaq: [['Yemek kartı limiti aşılırsa ne olur?', 'İstisna sınırını aşan bölümün ücret ve prim uygulaması ödeme biçimine göre bordroda ayrıca değerlendirilir.'], ['Uzaktan çalışan yemek desteği alabilir mi?', 'Evet; ancak fiilî çalışma günü, ödeme biçimi ve şirket politikasının açık olması gerekir.']],
    sources: [[GIB, 'GİB 2026 ücret ve istisna bilgileri'], [SGK, 'SGK 2026 yemek parası istisnası']],
    cta: ['/#hesaplayici', 'Maaş ve yan hak etkisini ayır', 'Brüt maaşın 12 aylık netini hesaplayın; yemek desteğini ayrı yan hak olarak değerlendirin.']
  },
  '2026-maas-vergi-dilimleri': {
    ...common,
    decisionTitle: 'Vergi dilimi geçişi nasıl doğru yorumlanır?',
    intro: 'Vergi dilimi maaşın tamamına tek seferde uygulanmaz. Her ay oluşan vergi matrahı yıl içinde birikir ve yalnız ilgili sınırı aşan bölüm daha yüksek oranla vergilenir. Bu nedenle aylık net düşüşünü tek başına “zam kaybı” olarak okumak hatalıdır.',
    rows: [['Kümülatif matrah', 'Aylık vergi matrahlarının toplamı', 'Dilime geçiş tarihini belirler', 'Takvim yılı'], ['Marjinal oran', 'Son kazanılan liranın oranı', 'Yalnız aşan bölüme uygulanır', 'Toplam kazançla karıştırmayın'], ['Asgari ücret istisnası', 'Hesaplanan vergiden düşülen tutar', 'Ödenecek vergiyi azaltır', 'Matrahı sıfırlamaz'], ['Prim/ikramiye', 'Ek ücret geliri', 'Geçişi erkene çekebilir', 'Sonraki ayları da etkiler']],
    checklist: ['Aylık brütten çalışan SGK ve işsizlik primini düşerek matrahı bulun.', 'Ay ay kümülatif matrahı izleyin.', 'Sınırın aşıldığı ayda yalnız aşan bölüme üst oran uygulayın.', 'Sonucu aylık net yerine yıllık toplam ve ortalama netle değerlendirin.'],
    mistakes: '“Vergi dilimine girdim, maaşımın tamamı yüzde 27 vergilendi” ifadesi yanlıştır. Türkiye’de artan oranlı tarife dilimsel çalışır.',
    extraFaq: [['Vergi dilimi yıl ortasında sıfırlanır mı?', 'Hayır. Genel olarak takvim yılı boyunca birikir ve yeni takvim yılında yeniden başlar.'], ['Maaş artışı vergi dilimini nasıl etkiler?', 'Aylık matrah yükseldiği için sonraki dilimlere geçişi erkene çekebilir; yıllık ortalama net bu nedenle önemlidir.']],
    sources: [[GIB, 'GİB 2026 ücret geliri vergi tarifesi'], [SGK, 'SGK 2026 prime esas kazanç sınırları']],
    cta: ['/#hesaplayici', 'Kendi geçiş ayını hesapla', 'Brüt maaşınızı girerek vergi dilimi etkisini 12 ay boyunca görün.']
  },
  'is-degisikliginde-vergi-matrahi': {
    ...common,
    decisionTitle: 'İş değişikliğinde hangi üç hesap ayrı tutulmalı?',
    intro: 'Yeni işveren bordrosu, önceki işveren matrahı ve çalışanın yıllık beyan yükümlülüğü aynı şey değildir. Bordronun sıfır matrahla başlaması, yıl sonunda beyanname veya ek vergi çıkmayacağı anlamına gelmez.',
    rows: [['Yeni işveren bordrosu', 'Aylık stopaj hesabı', 'Sıfırdan veya devreden matrah', 'İşveren uygulaması'], ['Önceki ücretler', 'Yıl içindeki diğer işveren geliri', 'Beyan sınırı hesabı', 'Çalışan takibi'], ['Yıllık beyan', 'Tüm işveren ücretlerinin testi', 'Sınır aşılırsa beyanname', 'Kişisel yükümlülük'], ['Mahsup', 'Yıl içinde kesilen vergiler', 'Beyannamede düşülür', 'Belgeler saklanmalı']],
    checklist: ['Eski işverenden kümülatif matrah ve kesinti dökümü alın.', 'Yeni işverenin matrah politikasını yazılı sorun.', 'Birinci işveren dışındaki ücretleri yıl sonunda toplayın.', 'Beyan sınırları aşılıyorsa mali müşavir desteği alın.'],
    mistakes: 'Yeni işverenin vergiyi sıfırdan hesaplamasını “vergi avantajı” sanmak risklidir. Düşük stopaj, yıllık beyanda ek ödeme olarak geri dönebilir.',
    extraFaq: [['Önceki işveren matrahını yeni işverene vermek zorunlu mu?', 'Bordro uygulaması ve işveren politikası değişebilir; ancak çalışanın yıllık beyan sorumluluğu devam eder.'], ['İki işveren arasında boşluk olması sonucu değiştirir mi?', 'Hayır. Aynı takvim yılında iki farklı işverenden ücret alınması değerlendirmeyi doğurabilir.']],
    sources: [[GIB, 'GİB ücret gelirlerinin yıllık beyanı'], [GIB, 'GİB 2026 vergi tarifesi']],
    cta: ['/senaryolar/', 'İş değişikliği senaryosu kur', 'Eski ve yeni maaşınızı ay bazında karşılaştırarak yıllık net etkiyi görün.']
  },
  'netten-brute-maas-neden-aylik-degisir': {
    ...common,
    decisionTitle: 'Sabit net ücrette brüt neden yükselir?',
    intro: 'İşveren sabit net taahhüt ettiğinde, gelir vergisi oranı yükseldikçe aynı neti korumak için daha yüksek brüt ücret gerekir. Bu nedenle netten brüte hesap, tek aylık çarpanla değil ay ay ters çözümle yapılmalıdır.',
    rows: [['Ocak', 'Düşük kümülatif matrah', 'Görece düşük brüt gerekir', 'İlk dilim etkisi'], ['Üst dilime geçiş', 'Marjinal vergi artar', 'Brüt yükselir', 'Net sabit kalır'], ['SGK tavanı', 'Prim matrahı sınırlanır', 'Yüksek ücrette ilişki değişir', 'Tavan kontrolü'], ['Prim/ikramiye', 'Ek matrah yaratır', 'Sonraki ay brütünü etkileyebilir', 'Senaryo bazlı']],
    checklist: ['Hedef neti her ay ayrı çözün.', 'Kümülatif matrahı bir önceki aydan devredin.', 'Asgari ücret istisnasını ay bazında uygulayın.', 'Yıllık toplam brüt ve işveren maliyetini ayrıca raporlayın.'],
    mistakes: 'Bir ayın net/brüt oranını 12 aya kopyalamak, özellikle yüksek ücretlerde ciddi hata üretir.',
    extraFaq: [['Sabit net maaşta aylık net gerçekten aynı mı kalmalı?', 'Sözleşme sabit net ise normal koşullarda hedef net aynı kalır; brüt ve işveren maliyeti değişir.'], ['Netten brüte hesapta SGK tavanı neden önemlidir?', 'Tavan aşıldığında çalışan prim kesintisi artık aynı oranda artmaz ve ters hesap değişir.']],
    sources: [[GIB, 'GİB 2026 ücret tarifesi'], [SGK, 'SGK 2026 prim tavanı']],
    cta: ['/#hesaplayici', 'Netten brüte ay ay hesapla', 'Sabit net hedefiniz için gerekli brüt ücretleri 12 ay boyunca görün.']
  },
  'maas-hesaplama-siteleri-neden-farkli': {
    ...common,
    decisionTitle: 'İki hesaplayıcının sonucu nasıl karşılaştırılır?',
    intro: 'Sonuç farkı her zaman motorlardan birinin yanlış olduğu anlamına gelmez. Önce kullanılan yıl, çalışan statüsü, SGK tavanı, kümülatif matrah, asgari ücret istisnası, ek ödeme ve yuvarlama varsayımları karşılaştırılmalıdır.',
    rows: [['Parametre yılı', 'Vergi dilimleri ve asgari ücret', 'Yanlış yıl büyük fark yaratır', 'İlk kontrol'], ['Kümülatif matrah', 'Aylar arası vergi birikimi', 'Tek ay/yıllık sonuç ayrışır', 'İkinci kontrol'], ['Çalışan statüsü', 'Normal çalışan, emekli, engellilik', 'Prim ve vergi değişir', 'Üçüncü kontrol'], ['Ek ödemeler', 'Prim, ikramiye, yan hak', 'Matrah ve tavan etkisi', 'Dördüncü kontrol']],
    checklist: ['Aynı brüt, ay ve statüyü kullanın.', 'Detay dökümünde matrah ve istisna kalemlerini karşılaştırın.', 'Yuvarlamayı kuruş seviyesinde kontrol edin.', 'Kaynak ve metodoloji sayfası olmayan aracı karar için kullanmayın.'],
    mistakes: 'Sadece görünen net rakamı karşılaştırmak teşhisi imkânsızlaştırır. Güvenilir araç her kesintiyi ve varsayımı açıklamalıdır.',
    extraFaq: [['En doğru maaş hesaplama sitesi nasıl anlaşılır?', 'Resmî parametreleri, metodolojiyi, ay bazlı matrahı ve kesinti detayını açıkça gösteren araç tercih edilmelidir.'], ['Bordro ile hesaplayıcı arasında birkaç kuruş fark normal mi?', 'Yuvarlama ve bordro yazılımı sırası küçük fark yaratabilir; büyük farklarda parametreler incelenmelidir.']],
    sources: [[GIB, 'GİB ücret tarifesi'], [SGK, 'SGK prime esas kazançlar']],
    cta: ['/hesaplama-metodolojisi/', 'Hesaplama metodolojisini incele', 'Maaşım.net motorunun kullandığı parametre ve hesap sırasını görün.']
  },
  '2026-sgk-tavani': {
    ...common,
    decisionTitle: 'SGK tavanı yüksek maaşı nasıl değiştirir?',
    intro: 'Prime esas kazanç üst sınırı, brüt ücretin tamamının SGK primine tabi tutulmasını engeller. Tavanı aşan kısım gelir vergisi hesabında ücret olmaya devam eder; yalnız SGK ve işsizlik primi matrahı sınırlanır.',
    rows: [['Brüt tavan altında', 'Brütün tamamı prim matrahında', 'Kesinti ücretle artar', 'Normal durum'], ['Brüt tavan üstünde', 'Prim matrahı tavanda kalır', 'Çalışan primi sabitlenir', 'Yüksek ücret'], ['Ek ödeme aynı ay', 'Ücret + prim birlikte test edilir', 'Tavan aşımı olabilir', 'Aylık kontrol'], ['Sonraki aya devreden prim', 'Mevzuat koşullarıyla sınırlı', 'Bordro tekniği gerekir', 'Uzman kontrolü']],
    checklist: ['Aylık brüt ve ek ödemeleri birlikte değerlendirin.', 'Prime esas kazancı tavanla sınırlandırın.', 'Gelir vergisi matrahını SGK tavanıyla karıştırmayın.', 'İşveren maliyetinde teşvik ve sektör oranını ayrıca belirtin.'],
    mistakes: 'SGK tavanını “bu tutarın üzeri vergisizdir” şeklinde yorumlamak yanlıştır. Tavan yalnız sosyal güvenlik primi matrahını sınırlar.',
    extraFaq: [['2026 SGK tavanı aylık kaç TL?', 'Özel sektör 4/a çalışanları için 2026 aylık prime esas kazanç üst sınırı 297.270 TL’dir.'], ['SGK tavanı net maaşı artırır mı?', 'Tavan üzerindeki ücrette çalışan primi artmadığı için marjinal net daha yüksek olabilir; gelir vergisi devam eder.']],
    sources: [[SGK, 'SGK 2026 prime esas kazanç alt ve üst sınırları'], [GIB, 'GİB ücret gelirleri']],
    cta: ['/#hesaplayici', 'Tavan etkisini maaşında gör', 'Yüksek ücretlerde SGK tavanının aylık nete etkisini hesaplayın.']
  },
  '100000-tl-brut-maas-neti-2026': {
    ...common,
    decisionTitle: '100.000 TL brüt teklif nasıl değerlendirilir?',
    intro: 'Tek bir “kaç net?” cevabı yıllık karar için yetersizdir. Vergi dilimleri nedeniyle net ücret aylar içinde değişir; teklif yıllık toplam net, ortalama net, yan haklar ve işveren maliyetiyle değerlendirilmelidir.',
    rows: [['İlk ay neti', 'Düşük kümülatif matrah', 'En yüksek aylardan biri', 'Tek başına yanıltıcı'], ['Yıl ortası neti', 'Üst vergi dilimleri', 'Net düşebilir', 'Beklenen değişim'], ['Yıllık toplam net', '12 ayın toplamı', 'Teklif karşılaştırması için güçlü', 'Ana metrik'], ['Ortalama aylık net', 'Toplam / 12', 'Bütçe planlaması için uygun', 'Ana metrik']],
    checklist: ['İlk ay yerine 12 aylık tabloyu inceleyin.', 'Prim ve zam aylarını senaryoya ekleyin.', 'Yemek, yol, BES ve bonusu maaştan ayrı değerleyin.', 'Teklifleri aynı brüt/net tanımı ve aynı başlangıç ayıyla karşılaştırın.'],
    mistakes: 'Ocak netini 12 ile çarpmak yıllık geliri olduğundan yüksek gösterir.',
    extraFaq: [['100.000 TL brüt maaş her ay aynı neti verir mi?', 'Hayır. Kümülatif vergi matrahı nedeniyle aylık net yıl içinde değişebilir.'], ['İşveren maliyeti neden brütten yüksektir?', 'İşveren SGK ve işsizlik payları ile varsa diğer maliyetler brüt ücrete eklenir.']],
    sources: [[GIB, 'GİB 2026 ücret tarifesi'], [SGK, 'SGK 2026 prim parametreleri']],
    cta: ['/#hesaplayici', '100.000 TL senaryosunu değiştir', 'Başlangıç ayı, prim ve maaş artışını ekleyerek kişisel senaryonuzu oluşturun.']
  },
  'prim-ikramiye-net-maasi-neden-dusurur': {
    ...common,
    decisionTitle: 'Prim yalnız ödendiği ayı mı etkiler?',
    intro: 'Prim ve ikramiye ücret niteliğindeyse o ayın vergi ve prim matrahına eklenir. Kümülatif gelir vergisi matrahını yükselttiği için sonraki aylarda daha yüksek vergi dilimine daha erken geçilmesine de neden olabilir.',
    rows: [['Ödeme ayı', 'Brüt ücret + prim', 'SGK ve vergi matrahı yükselir', 'Anlık etki'], ['SGK tavanı', 'Toplam prime esas kazanç test edilir', 'Tavan üzerinde prim sınırlanır', 'Yüksek ücret'], ['Kümülatif matrah', 'Prim vergi toplamına eklenir', 'Sonraki ayları etkiler', 'Kalıcı yıl içi etki'], ['Yıllık toplam', 'Net prim + maaş toplamı', 'Gerçek kazancı gösterir', 'Karar metriği']],
    checklist: ['Primin brüt mü net mi tanımlandığını doğrulayın.', 'Ödeme ayındaki SGK tavanını kontrol edin.', 'Kümülatif matrahı prim sonrası devredin.', 'Sonraki aylardaki net değişimini yıllık tabloda gösterin.'],
    mistakes: 'Brüt prim tutarını doğrudan ele geçecek net ödeme gibi yorumlamak ve yalnız ödeme ayını hesaplamak yanlıştır.',
    extraFaq: [['Prim hangi ayın vergi matrahına girer?', 'Genel olarak ödendiği ayın ücret matrahında dikkate alınır; bordro ve hak ediş koşulları ayrıca kontrol edilir.'], ['Prim SGK tavanını aşarsa ne olur?', 'Aylık toplam prime esas kazanç tavanla sınırlanır; gelir vergisi değerlendirmesi devam eder.']],
    sources: [[SGK, 'SGK prim ve ikramiyelerin prime esas kazancı'], [GIB, 'GİB ücret gelirleri']],
    cta: ['/senaryolar/', 'Primli maaş senaryosu oluştur', 'Prim ayını ekleyerek o ay ve sonraki ayların netini karşılaştırın.']
  },
  'kidem-tazminatina-dahil-odemeler': {
    ...common,
    decisionTitle: 'Bir ödemenin kıdem hesabına girip girmediği nasıl anlaşılır?',
    intro: 'Temel ayrım ödemenin adı değil, süreklilik ve iş karşılığı niteliğidir. Düzenli sağlanan para veya para ile ölçülebilen menfaatler giydirilmiş ücrete dahil olabilir; tek seferlik ve arızi ödemeler farklı değerlendirilir.',
    rows: [['Çıplak brüt ücret', 'Asıl ücret', 'Dahil', 'Temel hesap'], ['Düzenli yemek/yol', 'Süreklilik taşıyan menfaat', 'Dahil olabilir', 'Ayni/nakdi değer'], ['Düzenli prim', 'Süreklilik ve ölçülebilirlik', 'Ortalama ile dahil olabilir', 'Dönem kontrolü'], ['Tek seferlik ödül', 'Arızi ödeme', 'Genellikle dahil edilmez', 'Somut olay']],
    checklist: ['Son 12 aylık bordro ve yan hak dökümünü çıkarın.', 'Ödemelerin düzenli, süreklilik taşıyan ve iş karşılığı olup olmadığını test edin.', 'Ayni menfaatlerin parasal karşılığını belgeleyin.', 'Giydirilmiş brütü kıdem tavanıyla karşılaştırın.'],
    mistakes: 'Sadece bordrodaki “temel brüt” satırına bakmak düzenli yan hakları dışarıda bırakabilir; tüm ödemeleri otomatik dahil etmek de aynı ölçüde yanlıştır.',
    extraFaq: [['Özel sağlık sigortası kıdeme dahil edilir mi?', 'Düzenli ve işveren tarafından sağlanan menfaatin niteliği somut olaya göre değerlendirilebilir; uzman görüşü gerekir.'], ['Kıdem tavanı hangi tarihe göre uygulanır?', 'İş sözleşmesinin sona erdiği tarihte geçerli tavan esas alınır.']],
    sources: [[CSGB, 'ÇSGB kıdem tazminatı tavanı'], ['https://www.mevzuat.gov.tr/mevzuatmetin/1.5.1475.pdf', '1475 sayılı İş Kanunu 14. madde']],
    cta: ['/senaryolar/', 'Kıdem senaryonu hesapla', 'Çalışma süresi, giydirilmiş ücret ve tavan etkisini birlikte değerlendirin.']
  },
  'is-teklifinin-yillik-degeri': {
    ...common,
    decisionTitle: 'İki iş teklifi hangi ortak ölçekte karşılaştırılır?',
    intro: 'Aylık net maaş tek başına yeterli değildir. Teklifler, 12 aylık net ücret, garanti bonus, olasılık ağırlıklı değişken ücret, nakde yakın yan haklar, uzun vadeli haklar ve çalışma koşullarıyla aynı tabloda karşılaştırılmalıdır.',
    rows: [['Sabit ücret', '12 aylık toplam net', 'Yüksek kesinlik', 'Temel değer'], ['Garanti bonus', 'Net ödeme tarihiyle', 'Yüksek kesinlik', 'Toplama ekle'], ['Performans bonusu', 'Hedef gerçekleşme olasılığı', 'Orta/düşük kesinlik', 'Olasılık ağırlığı'], ['Yan haklar', 'Gerçek kullanım değeri', 'Kişiye göre', 'Liste fiyatını kullanmayın'], ['Çalışma modeli', 'Zaman ve ulaşım maliyeti', 'Dolaylı değer', 'Ayrı göster']],
    checklist: ['Tüm teklifleri yıllık brüte ve yıllık nete çevirin.', 'Kullanmayacağınız yan haklara tam değer vermeyin.', 'Bonusun garanti, hedef ve üst sınırını ayırın.', 'İzin, hibrit çalışma ve ulaşım süresini parasal olmayan karar kriteri olarak ekleyin.'],
    mistakes: 'Şirketin “toplam paket değeri” rakamını sorgulamadan kabul etmek, kullanılmayan hakları ve belirsiz bonusu kesin gelir gibi sayar.',
    extraFaq: [['Yan hakların parasal değeri nasıl hesaplanır?', 'İşveren liste fiyatı yerine çalışanın gerçekten kullanacağı ikame maliyeti esas alınmalıdır.'], ['Hisse opsiyonu maaş paketine nasıl eklenir?', 'Hak ediş, kullanım fiyatı, likidite ve kayıp riski nedeniyle ayrı ve yüksek belirsizlikli kalem olarak gösterilmelidir.']],
    sources: [[GIB, 'GİB ücret gelirleri'], [SGK, 'SGK prime esas kazançlar'], [EGM, 'EGM BES devlet katkısı']],
    cta: ['/senaryolar/', 'İki teklifi yıllık karşılaştır', 'Maaş artışı ve başlangıç ayı senaryolarıyla yıllık net farkı görün.']
  },
  'isveren-katkili-bes': {
    ...common,
    decisionTitle: 'İşveren katkılı BES’in gerçek değeri nasıl hesaplanır?',
    intro: 'Aylık katkı tutarı tek başına yeterli değildir. Hak ediş süresi, çalışanın sistemde kalma olasılığı, fon giderleri, likidite kısıtı ve işveren katkısına devlet katkısı verilmemesi birlikte değerlendirilmelidir.',
    rows: [['Aylık işveren katkısı', 'Yıllık katkının temeli', 'Kesin nominal değer', '12 ile çarpın'], ['Hak ediş', 'İşten ayrılmada kazanılan oran', 'Değeri azaltabilir', 'Sözleşmeyi okuyun'], ['Devlet katkısı', 'Kişisel katkıya %20', 'İşveren katkısına yok', 'Ayrı hesap'], ['Likidite', 'Erken erişim sınırlı', 'Maaşla eşdeğer değil', 'Uzun vadeli']],
    checklist: ['Yıllık işveren katkısını çıkarın.', 'Hak ediş takvimini ve işten ayrılma kuralını okuyun.', 'Kişisel katkı ve işveren katkısını ayrı gösterin.', 'Teklifi karşılaştırırken BES’i nakit maaşla bire bir eşitlemeyin.'],
    mistakes: 'İşveren katkısına da yüzde 20 devlet katkısı geleceğini varsaymak yanlıştır.',
    extraFaq: [['İşveren katkılı BES işten ayrılınca tamamen kaybolur mu?', 'Planın hak ediş koşullarına bağlıdır; sözleşmedeki kazanılmış hak oranı kontrol edilmelidir.'], ['BES katkısı maaş artışı yerine kabul edilmeli mi?', 'Hayır. Likit ücret ile uzun vadeli ve koşullu birikim aynı ekonomik değere sahip değildir.']],
    sources: [[EGM, 'EGM BES devlet katkısı'], [SGK, 'SGK işveren BES ödemeleri']],
    cta: ['/blog/is-teklifinin-yillik-degeri/', 'Toplam paket içinde BES’i değerle', 'BES katkısını maaş, bonus ve diğer yan haklarla aynı yıllık tabloda karşılaştırın.']
  },
  'esnek-yan-hak-butcesi': {
    ...common,
    decisionTitle: 'Esnek yan hak bütçesi adil ve yönetilebilir nasıl kurulur?',
    intro: 'Çalışan seçimi sunmak, her seçeneği aynı vergi ve maliyet sonucuna sahip hale getirmez. Bütçe tasarımı; taban güvence, seçilebilir kategoriler, bordro sınıflandırması ve erişim eşitliği birlikte düşünülerek kurulmalıdır.',
    rows: [['Taban paket', 'Herkese zorunlu güvence', 'Sağlık ve yasal haklar', 'Seçim dışı'], ['Esnek bütçe', 'Çalışanın seçtiği kategoriler', 'İhtiyaca göre', 'Limitli'], ['Vergi motoru', 'Kategori bazlı bordro sonucu', 'Net değer değişebilir', 'Şeffaf gösterim'], ['Kullanılmayan bütçe', 'Devir/nakde dönüşüm', 'Politika kararı', 'Önceden açıklayın']],
    checklist: ['Kullanım verisi ve anonim ihtiyaç araştırması yapın.', 'Her kategorinin vergi/SGK sonucunu ayrı tanımlayın.', 'Mobil ve saha çalışanları için erişim eşitliğini test edin.', 'Kullanılmayan bütçe ve işten ayrılma kurallarını açık yazın.'],
    mistakes: 'Her çalışan için aynı katalog oluşturmak esneklik değildir; erişilemeyen veya vergisel değeri farklı seçenekleri eşitmiş gibi sunmak güveni düşürür.',
    extraFaq: [['Esnek bütçe nakde çevrilebilir mi?', 'Şirket politikası ve bordro sonucu belirler; nakde dönüşüm ücret niteliği doğurabilir.'], ['Esnek yan haklarda taban paket neden gerekir?', 'Çalışanın kritik sağlık ve güvence haklarını kısa vadeli tercihler uğruna kaybetmesini önler.']],
    sources: [[SGK, 'SGK prime esas kazanç istisnaları'], [GIB, 'GİB ücret ve yan hak uygulamaları'], [KVKK, 'KVKK veri minimizasyonu']],
    cta: ['/blog/is-teklifinin-yillik-degeri/', 'Esnek bütçenin gerçek değerini hesapla', 'Kullanacağınız hakların yıllık ikame maliyetini toplam paket içinde değerlendirin.']
  },
  'ev-ofis-destegi-vergi': {
    ...common,
    decisionTitle: 'Ev ofis desteğinde ekipman ile nakit ödeme nasıl ayrılır?',
    intro: 'Şirket mülkiyetindeki ekipmanın zimmetle verilmesi, belgeli masraf karşılığı ve çalışana serbest nakit ödenek verilmesi farklı hukuki ve bordro sonuçları doğurur. Politika bu modelleri tek “ev ofis desteği” başlığı altında karıştırmamalıdır.',
    rows: [['Şirket ekipmanı', 'Şirket satın alır ve zimmetler', 'İş aracı', 'İade/bakım kuralı'], ['Belgeli masraf', 'Gerçek gider karşılığı', 'İş amacı ve belge', 'Kontrollü'], ['Sabit nakit ödenek', 'Belgesiz düzenli ödeme', 'Ücret riski', 'Bordro kontrolü'], ['Ortak çalışma alanı', 'Tedarikçi hizmeti', 'Erişim ve güvenlik', 'Sözleşme']],
    checklist: ['Uzaktan çalışma sözleşmesine ekipman ve gider maddesi ekleyin.', 'Mülkiyet, bakım ve işten ayrılmada iade kuralını yazın.', 'Nakit ödeme ile masraf karşılığını bordroda ayırın.', 'Kişisel cihaz ve veri güvenliği riskini bilgi güvenliği politikasıyla yönetin.'],
    mistakes: 'Her ev ofis ödeneğini otomatik vergiden istisna kabul etmek veya çalışanın kişisel ekipman maliyetini ücretsiz şekilde üzerine bırakmak hatalıdır.',
    extraFaq: [['Şirket ekipmanı işten ayrılınca iade edilir mi?', 'Mülkiyet şirketteyse zimmet ve sözleşme koşullarına göre iade edilir.'], ['Elektrik ve internet desteği sabit ödenebilir mi?', 'Ödenebilir; ancak ödeme biçiminin ücret veya masraf karşılığı niteliği bordro ve belge düzeniyle değerlendirilmelidir.']],
    sources: [[REMOTE, 'Uzaktan Çalışma Yönetmeliği'], [KVKK, 'KVKK genel ilkeler'], [GIB, 'GİB ücret geliri yaklaşımı']],
    cta: ['/blog/is-teklifinin-yillik-degeri/', 'Ev ofis desteğini teklifte değerle', 'Ekipman, internet ve ulaşım tasarrufunu toplam paket karşılaştırmasına ekleyin.']
  },
  'mental-saglik-yan-haklari-burnout': {
    ...common,
    decisionTitle: 'Mental sağlık programı bireysel destek ile iş tasarımını nasıl birleştirir?',
    intro: 'Terapi, EAP ve koçluk erişimi önemlidir; ancak aşırı iş yükü, rol belirsizliği, düşük kontrol ve kötü yönetim devam ederken tek başına çözüm değildir. Etkili program bireysel destek ile örgütsel risk azaltımını birlikte yürütür.',
    rows: [['Psikolojik danışmanlık', 'Bireysel destek ve yönlendirme', 'Gizli olmalı', 'Kök nedeni tek başına çözmez'], ['İş yükü analizi', 'Fazla mesai ve kapasite', 'Örgütsel müdahale', 'Kök neden'], ['Yönetici eğitimi', 'Erken fark etme ve destek', 'Performans baskısından ayrı', 'Önleyici'], ['Dinlenme politikası', 'İzin ve bağlantı kesme', 'Fiilen kullanılabilir olmalı', 'Kültür']],
    checklist: ['Seans içeriğini ve kişi bazlı kullanımı yöneticiden gizleyin.', 'İş yükü, fazla mesai ve izin kullanımını ekip bazında izleyin.', 'Yönetici hedeflerine sürdürülebilir çalışma göstergesi ekleyin.', 'Kriz durumları için profesyonel yönlendirme protokolü kurun.'],
    mistakes: 'Yoğun fazla mesaiyi sürdürüp yalnız meditasyon uygulaması sunmak mental sağlık stratejisi değil, wellness washing’dir.',
    extraFaq: [['Mental sağlık günü tek başına etkili mi?', 'Kısa vadeli dinlenme sağlar; kronik iş yükü ve kültür sorunu değişmezse kalıcı çözüm olmaz.'], ['EAP kullanım oranı performans KPI’ı olabilir mi?', 'Hayır. Bireysel kullanım mahremdir; yalnız anonim hizmet kalitesi ve erişim göstergeleri izlenmelidir.']],
    sources: [[WHO, 'WHO burnout tanımı'], [KVKK, 'KVKK sağlık ve kişisel veri ilkeleri']],
    cta: ['/blog/is-yerinde-finansal-saglik/', 'Bütüncül wellbeing modelini incele', 'Finansal, fiziksel ve mental destekleri tek çalışan refahı çerçevesinde değerlendirin.']
  },
  'sirket-destekli-spor-wellness': {
    ...common,
    decisionTitle: 'Wellness programı kayıt değil gerçek kullanım nasıl üretir?',
    intro: 'Tek tedarikçiden spor üyeliği satın almak program tasarımı değildir. Çalışma lokasyonu, vardiya, engellilik, uzaktan çalışma ve zaman erişimi dikkate alınmalı; başarı aktivasyon yerine düzenli ve kapsayıcı kullanımla ölçülmelidir.',
    rows: [['Ofis çalışanı', 'Yakın spor ağı ve ergonomi', 'Zaman erişimi', 'Lokasyon'], ['Hibrit çalışan', 'Çok lokasyon + online seçenek', 'Esnek kullanım', 'Karma model'], ['Uzaktan çalışan', 'Yerel üyelik ve ev ergonomisi', 'Coğrafi erişim', 'Dağıtık'], ['Saha/vardiya', 'Saat bağımsız seçenek', 'Vardiya uyumu', 'Kapsayıcılık']],
    checklist: ['Lokasyon ve çalışma modeli bazında erişim haritası çıkarın.', 'Aylık aktif kullanım ve çalışan başına gerçek maliyeti ölçün.', 'Sağlık verisini performans sisteminden ayırın.', 'Yöneticilerin program için fiilen zaman tanımasını sağlayın.'],
    mistakes: 'Kayıt sayısını başarı saymak, hiç kullanılmayan üyelikleri görünmez kılar. Zorunlu adım yarışmaları da sağlık verisi ve kapsayıcılık riski yaratır.',
    extraFaq: [['Wellness bütçesi spor salonuyla sınırlı olmalı mı?', 'Hayır. Ergonomi, fiziksel aktivite, koruyucu sağlık ve farklı erişim seçenekleri birlikte sunulabilir.'], ['Kilo kaybı program KPI’ı olabilir mi?', 'Zorunlu veya performansa bağlı sağlık metriği olmamalıdır; katılım ve kişisel sağlık verisi mahrem tutulmalıdır.']],
    sources: [[KVKK, 'KVKK kişisel veri ilkeleri'], [WHO, 'WHO işyeri sağlığı yaklaşımı']],
    cta: ['/blog/esnek-yan-hak-butcesi/', 'Wellness bütçesini esnek tasarla', 'Farklı çalışma modellerine uygun seçenekleri tek bütçe içinde nasıl sunacağınızı inceleyin.']
  },
  'yasam-evresine-gore-yan-haklar': {
    ...common,
    decisionTitle: 'Yaşam evresi segmentasyonu nasıl uygulanır?',
    intro: 'Kuşak etiketi yerine çalışanın beyan ettiği ihtiyaç, bakım sorumluluğu, çalışma modeli, finansal hedefi ve yaşam geçişleri esas alınmalıdır. Segmentasyon hassas veri toplamaya değil, çalışanın seçenekler arasından ihtiyacını ifade etmesine dayanmalıdır.',
    rows: [['Kariyer başlangıcı', 'Ulaşım, eğitim, borç yönetimi', 'Esnek eğitim ve finansal destek', 'Gelir seviyesi değişebilir'], ['Küçük çocuklu', 'Bakım, sağlık, esnek zaman', 'Bakım bütçesi ve izin', 'Cinsiyete göre varsaymayın'], ['Bakım veren', 'Yaşlı/engelli yakını desteği', 'İzin ve danışmanlık', 'Hassas veri minimizasyonu'], ['Uzaktan çalışan', 'Ev ofis ve co-working', 'Ekipman ve lokasyon bütçesi', 'Çalışma modeli'], ['Emekliliğe yaklaşan', 'BES, sağlık, finansal plan', 'Uzun vadeli güvence', 'Yaş ayrımcılığından kaçının']],
    checklist: ['Anonim tercih anketi ve kullanım verisini birlikte analiz edin.', 'Çalışandan teşhis veya ayrıntılı aile bilgisi istemek yerine ihtiyacı seçmesini sağlayın.', 'Taban güvenceyi koruyup seçilebilir bütçe sunun.', 'Segmentleri yılda en az bir kez güncelleyin; çalışanı kalıcı etikete hapsetmeyin.'],
    mistakes: '“Z kuşağı deneyim, X kuşağı güvence ister” gibi genellemeler hem veri açısından zayıf hem de ayrımcı tasarıma açıktır. Yaş, ihtiyacın güvenilir vekili değildir.',
    extraFaq: [['Yaşam evresi segmentasyonu yaş bilgisi gerektirir mi?', 'Hayır. İhtiyaç ve tercih doğrudan sorulabilir; yaş yalnız zorunlu olmadığı sürece belirleyici veri olmamalıdır.'], ['Çalışan personası ne sıklıkla güncellenmeli?', 'Yaşam olayları ve çalışma modeli değişebileceği için en az yılda bir ve önemli geçişlerde güncellenmelidir.']],
    sources: [[KVKK, 'KVKK veri minimizasyonu ve amaçla sınırlılık'], [REMOTE, 'Uzaktan Çalışma Yönetmeliği'], [EGM, 'EGM BES bilgileri']],
    cta: ['/blog/esnek-yan-hak-butcesi/', 'Yaşam evresine uygun esnek paket kur', 'Taban güvence ve çalışan seçimini birleştiren bütçe modelini inceleyin.']
  }
};
