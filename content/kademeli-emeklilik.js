export const KADEMELI_EMEKLILIK = Object.freeze({
  path: '/kademeli-emeklilik/',
  publishedAt: '2026-09-18',
  modifiedAt: '2026-09-18',
  reviewedAt: '2026-09-18',
  status: 'Henüz yasalaşmadı',
  statusShort: 'Yürürlükte yeni bir kademeli emeklilik düzenlemesi yok',
  latestOfficialUpdate: '4 Eylül 2026 tarihli yeni yazılı soru önergesinin TBMM kayıtlarında cevaplanma süresi devam ediyor.',
  officialTableExists: false,
  sources: Object.freeze({
    sgk4a: 'https://www.sgk.gov.tr/Content/Post/785eac3b-d260-47b5-8103-ae591b2ac320/4a-Hizmet-Akdi-ile-Calisanlar-2024-01-11-02-39-38',
    officialGazetteEyt: 'https://www.resmigazete.gov.tr/eskiler/2023/03/20230303-8.htm',
    proposal2755: 'https://www.tbmm.gov.tr/Yasama/KanunTeklifi/ac4513e4-0434-4882-b725-0193972c74d8',
    proposal2959: 'https://www.tbmm.gov.tr/Yasama/KanunTeklifi/7867990f-266c-4a18-a4b1-01955ffff04a',
    question37366: 'https://www.tbmm.gov.tr/Denetim/Yazili-Soru-Onergesi-Detay/2af485ac-131a-4ada-8f59-019afd1c62cd',
    question45214: 'https://tbmm.gov.tr/Denetim/Yazili-Soru-Onergesi-Detay/55739033-1d8d-4756-9ee0-019e8d8562e2',
    question48458: 'https://www.tbmm.gov.tr/Denetim/Yazili-Soru-Onergesi-Detay/d0adc0ec-626b-4e78-b951-01a07ab9e70e',
    emadderMinistry: 'https://emadder.org.tr/detay.php?id=137',
    emadderHayatiYazici: 'https://emadder.org.tr/detay.php?id=101'
  }),
  timeline: Object.freeze([
    Object.freeze({
      date: '2026-09-18',
      label: 'Güncel kontrol',
      text: 'TBMM, SGK ve Resmî Gazete kayıtlarında yürürlüğe girmiş yeni bir kademeli emeklilik kanunu bulunmuyor.',
      kind: 'verification'
    }),
    Object.freeze({
      date: '2026-09-07',
      label: 'TBMM / Bakanlık yanıtı',
      text: '7/37366 esas numaralı yazılı soru önergesine verilen cevap TBMM kayıtlarına girdi. Yanıt mevcut EYT kapsamını yeniden açıklıyor; yeni bir kademeli emeklilik takvimi ilan etmiyor.',
      kind: 'official'
    }),
    Object.freeze({
      date: '2026-09-04',
      label: 'TBMM / Yeni soru önergesi',
      text: 'Kademeli emeklilik düzenlemesi talebine ilişkin 7/48458 esas numaralı yeni yazılı soru önergesi verildi. 18 Eylül itibarıyla cevaplanma süresi devam ediyor.',
      kind: 'official'
    }),
    Object.freeze({
      date: '2026-08-20',
      label: 'EMADDER / Bakanlık görüşmesi',
      text: 'EMADDER, Çalışma ve Sosyal Güvenlik Bakan Yardımcısı Ahmet Aydın ile görüştüğünü ve çözüm önerisini aktardığını açıkladı. Bu görüşme bir mevzuat değişikliği veya resmî kabul kararı anlamına gelmiyor.',
      kind: 'advocacy'
    }),
    Object.freeze({
      date: '2026-08-17',
      label: 'TBMM / Soru önergesi yanıtı',
      text: '3 Haziran 2026 tarihli, kademeli emeklilik taleplerine ilişkin 7/45214 esas numaralı soru önergesi cevaplandı.',
      kind: 'official'
    }),
    Object.freeze({
      date: '2025-03-03',
      label: 'TBMM / 2/2959',
      text: 'Kademeli emeklilik ve prim ödeme gün sayılarına ilişkin 2/2959 esas numaralı kanun teklifi TBMM’ye sunuldu. Teklif hâlen komisyonda.',
      kind: 'proposal'
    }),
    Object.freeze({
      date: '2024-12-05',
      label: 'TBMM / 2/2755',
      text: '8 Eylül 1999 ile 30 Nisan 2008 arasında sigorta başlangıcı olanlara kademeli emeklilik öngören 2/2755 esas numaralı teklif TBMM’ye sunuldu. Teklif hâlen komisyonda.',
      kind: 'proposal'
    })
  ])
});
