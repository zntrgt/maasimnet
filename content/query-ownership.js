// Editorial target map: intent design, not measured Search Console rankings.
export const QUERY_OWNERSHIP = Object.freeze([
 {intent:'2026 maaş hesaplama; brütten nete; netten brüte',owner:'/',support:['/veriler/2026/','/blog/netten-brute-maas-neden-aylik-degisir/']},
 {intent:'2027 maaş tahmini; brütten nete 2027',owner:'/2027-maas-hesaplama/',support:['/veriler/2027/','/blog/2027-maas-zammi-beklentileri/']},
 {intent:'2027 resmî bordro verilerinin açıklanma durumu',owner:'/veriler/2027/',support:['/veriler/','/2027-maas-hesaplama/']},
 {intent:'vergi dilimi hesaplama; hangi ay üst dilime girerim',owner:'/vergi-dilimi-hesaplama/',support:['/blog/2026-maas-vergi-dilimleri/','/blog/is-degisikliginde-vergi-matrahi/']},
 {intent:'2026 ücret gelir vergisi tarifesi ve matrah rehberi',owner:'/blog/2026-maas-vergi-dilimleri/',support:['/vergi-dilimi-hesaplama/','/veriler/2026/']},
 {intent:'2026 SGK tavanı ve etkisi',owner:'/blog/2026-sgk-tavani/',support:['/sgk-prim-hesaplama/','/veriler/2026/']},
 {intent:'SGK primi hesaplama',owner:'/sgk-prim-hesaplama/',support:['/blog/2026-sgk-tavani/','/isveren-maliyeti-hesaplama/']},
 {intent:'kıdem tazminatı hesaplama; kıdem tazminatı tavanı',owner:'/kidem-tazminati-hesaplama/',support:['/tazminat-hesaplama/','/blog/kidem-tazminatina-dahil-odemeler/']},
 {intent:'net maaştan kıdem tazminatı hesaplama',owner:'/net-maastan-kidem-tazminati-hesaplama/',support:['/kidem-tazminati-hesaplama/']},
 {intent:'kıdem ve ihbar birlikte hesaplama',owner:'/tazminat-hesaplama/',support:['/kidem-tazminati-hesaplama/','/ihbar-tazminati-hesaplama/']},
 {intent:'kademeli emeklilik son durum; yasa çıktı mı; EMADDER tablosu',owner:'/kademeli-emeklilik/',support:['/emeklilik-hesaplama/']},
 {intent:'mevcut mevzuata göre ne zaman emekli olurum',owner:'/emeklilik-hesaplama/',support:['/kademeli-emeklilik/','/borclanma-hesaplama/']},
 {intent:'100.000 TL brüt kaç net; aylık maaş tablosu',owner:'/100000-brut-maas-hesaplama/',support:['/blog/100000-tl-brut-maas-neti-2026/','/']},
 {intent:'100.000 TL brüt iş teklifi değerlendirme',owner:'/blog/100000-tl-brut-maas-neti-2026/',support:['/100000-brut-maas-hesaplama/','/maas-teklifi-karsilastirma/']},
 {intent:'günlük ve saatlik ücret karşılığı',owner:'/gunluk-ucret-hesaplama/',support:['/asgari-ucret-hesaplama/','/fazla-mesai-hesaplama/']},
 {intent:'rapor parası; iş göremezlik ödeneği',owner:'/is-goremezlik-odenegi-hesaplama/',support:['/sgk-prim-hesaplama/','/eksik-gun-maas-hesaplama/']},
 ...Array.from({length:6},(_,i)=>({intent:(2020+i)+' yılı maaş hesaplama',owner:'/'+(2020+i)+'-maas-hesaplama/',support:[]}))
].map(Object.freeze));
