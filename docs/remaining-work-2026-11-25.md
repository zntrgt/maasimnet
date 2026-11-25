# 25 Kasım 2026 — Kalan işler ve operasyonel kontrol listesi

Bu kayıt mevcut repository ve doğrulanmış görevlerin kapanış kontrolüdür. A17–A22'nin ayrıntılı özgün görev metni elde edilemedi. A17 mevcut araç fırsatlarının analizi, A18 crawler politikası olarak ele alındı. A19–A22'nin yerine yeni görevler atanmadı ve tamamlandı sayılmadı.

## A17: araç portföyü

Önce mevcut kanonik araçların keşfini iyileştir: part-time, eksik gün, SGK primi, maaş teklifi karşılaştırması, resmî tatil mesai ücreti, hafta tatili ücreti ve prim/ikramiye senaryosu hesaplama araçları merkezine eklendi. Yeni URL açılmadı; sorgu niyeti, kaynak ve hesaplama motoru korunur.

Yeni araç için adaylar (pazar talebi veya sıralama tahmini değildir):
- Yıllık izin **hakkı / gün sayısı**: mevcut kullanılmayan izin **ücreti** aracından farklı niyet. İş Kanunu, yaş ve kıdem, özel kapsam ve istisnalar doğrulanmalı.
- Analık iş göremezlik ödeneği: mevcut A11 aracında kapsam dışı. SGK şartları, 5510 m.17–18 ve rapor süresi doğrulandıktan sonra ayrı araç değerlendirilir.
- Yıl ortasında işveren değişikliğiyle bordro ve önceki vergi matrahı: mevcut senaryo, vergi dilimi ve ana bordro araçlarının yetenekleri önce karşılaştırılmalı. Gerekiyorsa mevcut URL iyileştirilir.
- 2027 resmî bordro aracı: tüm bağımlı parametrelerin doğrulanmasını bekler; tahmin aracı ayrı statüde kalır.

Yeni araç yayın kapısı: GSC sorgu/sayfa verisi ile ihtiyaç ve mevcut hedef kontrolü; birincil kaynaklar; kesin/tahmini ayrımı; merkezi hesaplama; sınır testleri; tek kanonik URL; sitemap/hub/llms; mobil etkileşim ve production doğrulaması. GSC hacmi ve rakip trafiği elde edilmediği için bu adaylar doğrulanmış SEO hacim sıralaması değildir.

## Açık operasyonel işler (A19–A22'nin orijinal kapsamı yerine geçmez)

| İş | Gereken veri/erişim | Doğrulama |
|---|---|---|
| Google indeks kontrolü | Search Console mülkü | Issue #10: URL Inspection, Google-selected canonical, tarama tarihi ve sitemap |
| Gerçek cannibalization | GSC query × page | analytics/query-ownership-a13.md, 28 günlük karşılaştırma |
| AI görünürlük ölçümü | Gerçek kaynak atıfları, sorgu ve tarih | Aynı soru setiyle düzenli ölçüm; bot HTTP erişimi, indeksleme ve atıf ayrı tutulur |
| Veri güncellemesi | RG, SGK, GİB, ÇSGB, TÜİK, TBMM | Önce kaynak ve geçerlilik tarihi, sonra parametre değişikliği, regresyon, canlı smoke |
| Mobil gerçek tarayıcı QA | Tarayıcı/cihaz | Form, hata, sonuç, gizlilik/çerez, CSV, görsel kontrast; HTML testi gerçek cihaz kanıtı değildir |
| Analitik ve reklam | İzinli GA4, Search Console ve reklam raporları | Ham ücret verisi eklenmez; gerçek izinli ölçüm ve CWV kontrolü; varsayımsal gelir yazılmaz |

Haftalık: 7 ve 28 tam günlük GSC, GA4 ve doğrulanmış bot erişim verilerini karşılaştır. Değişimleri mevsimsellik ve yayın tarihiyle ilişkilendir, kaynak ve tarihleri kaydet.
Aylık: Resmî dönemsel verileri, hesaplayıcı sonuçlarını, kırık bağlantıları, yönlendirmeleri, sitemap/llms/robots çıktısını ve mobil performansı gözden geçir. Yayın/güncelleme tarihleri ancak gerçek değişiklikte değişir.
Olay bazlı: 2027 asgari ücret veya yeni mevzuat, enflasyon ve tavan ilanları; etkilediği parametreler için statü, kaynak, geçerlilik ve test sonuçlarını kaydet. Resmî olmayan değeri kesinleştirme. Tüm CI geçmeden main'e merge etme; production kaydı olmadan canlıda demezsin.

Bu periyotlar önerilen operasyonel süreçtir; otomasyonun kurulduğu veya dış verinin incelendiği anlamına gelmez. A19–A22 kesin kabul kriterleri özgün metinle tekrar eşleştirilmelidir.
