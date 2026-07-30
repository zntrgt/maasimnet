const NBER_NEGOTIATION = 'https://www.nber.org/papers/w33903';
const NBER_SALARY_TABOO = 'https://www.nber.org/papers/w25145';
const HARVARD_FIRST_OFFER = 'https://www.pon.harvard.edu/daily/negotiation-skills-daily/when-to-make-the-first-offer-in-negotiation/';
const THORSTEINSON = 'https://onlinelibrary.wiley.com/doi/10.1111/j.1559-1816.2011.00779.x';

export const negotiationBlogQualityContent = {
  'maas-zam-gorusmesi-nasil-yapilir': {
    reviewer: 'Maaşım.net Editoryal Ekibi',
    reviewedAt: '31 Temmuz 2026',
    methodology: 'Akademik çalışmaların bulguları çalışma türü, örneklem ve bağlam belirtilerek özetlenir. Maaş tutarı örnekleri kişisel veri veya piyasa genellemesi üretmemek için X, Y ve Z değişkenleriyle gösterilir; araştırma yüzdeleri ise kaynak bulgusu olarak korunur.',
    decisionTitle: 'Maaş görüşmesine hangi kanıtlarla hazırlanılmalı?',
    intro: 'Başarılı bir maaş görüşmesi yalnız talep edilen tutara değil; rol kapsamı, ölçülebilir katkı, piyasa karşılaştırması, şirketin karar süreci ve ücret dışı alternatiflerin birlikte hazırlanmasına dayanır. Görüşmenin amacı karşı tarafı yenmek değil, iş ilişkisinin ekonomik koşullarını kanıta dayalı biçimde yeniden değerlendirmektir.',
    rows: [
      ['Rol kapsamı', 'Başlangıçtan bugüne eklenen sorumlulukları gösterir', 'Kademe ve ücret bandı gerekçesini güçlendirir', 'İş tanımı ve somut örneklerle doğrulayın'],
      ['Ölçülebilir katkı', 'Gelir, maliyet, hız, kalite veya risk etkisini gösterir', 'Talebi kişisel ihtiyaçtan iş değerine taşır', 'Sonuç ile kendi katkınızı ayırın'],
      ['Piyasa karşılaştırması', 'Benzer rol ve kıdem için dış referans sağlar', 'Çapanın gerçekçi olmasına yardım eder', 'Sektör, şirket ölçeği ve lokasyonu eşleştirin'],
      ['Müzakere alternatifi', 'Sabit ücret dışında konuşulabilecek değişkenleri tanımlar', 'Bütçe kısıtında anlaşma alanı yaratır', 'Prim, yan hak ve tarihli değerlendirmeyi yazılılaştırın']
    ],
    checklist: [
      'Rolünüzün son değerlendirmeden beri nasıl değiştiğini üç somut maddeyle yazın.',
      'Ölçülebilir üç iş sonucunu ve kullandığınız veri kaynağını hazırlayın.',
      'Talep edeceğiniz X–Y bandını ve kabul edilebilir alt sınırı önceden belirleyin.',
      'Sabit ücret mümkün değilse isteyeceğiniz prim, yan hak ve tarihli yeniden değerlendirme seçeneklerini sıralayın.',
      'Görüşmeyi karar sahibi, tarih ve ölçüt içeren yazılı bir özetle kapatın.'
    ],
    mistakes: 'Talebi yalnız kişisel giderlere veya enflasyona dayandırmak, gerçek dışı bir çapa kullanmak, başka teklif konusunda blöf yapmak ve “sonra konuşuruz” ifadesini tarih ile kriter olmadan kabul etmek görüşmenin etkisini azaltır.',
    extraFaq: [
      ['Maaş görüşmesinde ücret bandı nasıl söylenmeli?', 'Bandın alt ve üst sınırı X ve Y olarak ifade edilmeli; bu aralık rol kapsamı, piyasa verisi ve ölçülebilir katkıyla gerekçelendirilmelidir.'],
      ['Maaş görüşmesi sonunda ne yazılılaştırılmalı?', 'Karar, karar sahibi, yeniden değerlendirme tarihi, performans ölçütleri ve konuşulan ücret veya yan hak seçenekleri kısa bir e-postayla teyit edilmelidir.']
    ],
    sources: [
      [NBER_NEGOTIATION, 'NBER: Salary negotiations and employee outcomes'],
      [NBER_SALARY_TABOO, 'NBER: The Salary Taboo'],
      [HARVARD_FIRST_OFFER, 'Harvard Program on Negotiation: İlk teklif ve çapalama'],
      [THORSTEINSON, 'Thorsteinson: Maaş görüşmelerinde aşırı çapa deneyleri']
    ],
    cta: ['/maas-teklifi-karsilastirma/', 'Maaş teklifini toplam paketle karşılaştır', 'Mevcut maaş ve yeni teklifi başlangıç ayı, prim, yan hak ve yıllık net gelir üzerinden yan yana değerlendirin.']
  }
};
