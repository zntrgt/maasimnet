import {calculatePayrollYear,solveMonthlyGrossForFixedNet,summarizePayroll,tlToKurus} from '../src/payroll-engine.js';
export const months = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
export const money = n => new Intl.NumberFormat('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2}).format(n/100)+' TL';
const signedKurus = n => Math.round(n*100);
const payroll = (gross,extra=Array(12).fill(0)) => calculatePayrollYear({baseGrossKurusByMonth:gross.map(tlToKurus),extraGrossKurusByMonth:extra.map(tlToKurus)});
export function guideScenario(post){
 const [base,x,m,y,z] = post.args;
 const constant = Array(12).fill(base);
 let a=payroll(constant),b=a,headers,table,assumption,reading,metrics;
 const note='2026 parametreleri; on iki tam çalışma ayı; Ocakta sıfır kümülatif matrah; standart çalışan; engellilik indirimi yok. Hesap, çalışan özel kesintileri ve yıllık beyanname sonucunu içermez.';
 if(post.kind==='budget'){
  table=a.map((r,i)=>[months[i],money(r.netKurus),money(tlToKurus(x)),money(r.netKurus-tlToKurus(x))]);
  headers=['Ay','Net maaş','Gider varsayımı','Gider sonrası fark'];
  const margins=a.map(r=>r.netKurus-tlToKurus(x)); const min=Math.min(...margins);const minMonths=months.filter((_,i)=>margins[i]===min).join(', ');
  assumption=`Aylık brüt ${money(tlToKurus(base))}, aylık zorunlu gider ${money(tlToKurus(x))}. Prim ve zam yok; gider bütün aylarda sabit. ${note}`;
  metrics=[['En düşük gider sonrası fark',money(min)],['Bu farkın görüldüğü aylar',minMonths],['Yıllık gider sonrası fark',money(margins.reduce((s,v)=>s+v,0))]];
  reading=`Bu örnekte en dar ay veya aylar ${minMonths}; kalan tutar ${money(min)}. ${min<0?'Eksi sonuç, o ay gelirin varsayılan gideri karşılamadığını gösterir.':'Pozitif sonuç, yalnız modele girilen giderlerden sonra kalan alanı gösterir.'} Kalan tutar tahsil edilmemiş prim, borç limiti veya yatırım getirisi içermez. Aylık farkları toplamak yıl boyunca oluşan teorik alanı verir; ödemenin gün içindeki zamanlamasını açıklamaz.`;
 } else if(post.kind==='net'){
  const grosses=solveMonthlyGrossForFixedNet({targetNetKurus:tlToKurus(base)});
  a=calculatePayrollYear({baseGrossKurusByMonth:grosses});b=a;
  headers=['Ay','Gerekli brüt','Hedef net','Hesaplanan net']; table=a.map((r,i)=>[months[i],money(grosses[i]),money(tlToKurus(base)),money(r.netKurus)]);
  metrics=[['Aylık net hedef',money(tlToKurus(base))],['En düşük gerekli brüt',money(Math.min(...grosses))],['En yüksek gerekli brüt',money(Math.max(...grosses))]];
  assumption=`Her ay ${money(tlToKurus(base))} net hedefi. Prim ve zam yok; brüt her ay ayrı çözülür. ${note}`;
  reading=`Gerekli aylık brüt ${money(Math.min(...grosses))} ile ${money(Math.max(...grosses))} arasında hesaplanır. Bu aralık çalışanın net zam aldığını değil, aynı hedefi korumak için brütün nasıl değiştiğini gösterir. Her satır kendi kümülatif matrahıyla çözülür. Ücret sözleşmesi sabit brüt ise bu tablo yerine brütten nete senaryo kullanılmalıdır; iki ücret tanımı birbirinin yerine geçirilemez.`;
 } else if(post.kind==='tax'){
  headers=['Ay','Net maaş','Gelir vergisi oranları','Kümülatif matrah']; table=a.map((r,i)=>[months[i],money(r.netKurus),r.incomeTaxRatesPpm.map(v=>'%'+v/10000).join(' → '),money(r.cumulativeTaxBaseKurus)]);
  const min=Math.min(...a.map(r=>r.netKurus));const minMonths=months.filter((_,i)=>a[i].netKurus===min).join(', ');
  metrics=[['Yıllık toplam net',money(summarizePayroll(a).annualNetKurus)],['En düşük net',money(min)],['En düşük aylar',minMonths]];
  assumption=`Her ay ${money(tlToKurus(base))} sabit brüt; prim ve zam yok. ${note}`;
  reading=`Bu ücret düzeyinde en düşük net ${money(min)} ve ilgili aylar ${minMonths}. Oran sütunundaki birden fazla değer, matrahın ay içinde farklı dilimlere dağıldığını gösterir. Son oran bütün brüt ücretin kesinti oranı değildir. Kümülatif matrah yıl başından itibaren birikir; aylık net ise o ayın primleri, vergileri ve istisnalarıyla belirlenir. Bu iki sütun farklı soruları yanıtlar.`;
 } else {
  let labelA='Mevcut senaryo neti',labelB='Yeni senaryo neti';
  if(['raise','purchasing'].includes(post.kind)){
   b=payroll(constant.map((g,i)=>i<m?g:g*(1+x/100)));
   assumption=`Mevcut brüt ${money(tlToKurus(base))}; ${months[m]} ayından itibaren %${x} zam. Prim yok. ${note}`;
  } else if(['offer','benefit'].includes(post.kind)){
   b=payroll(constant.map((g,i)=>i<m?g:x));
   assumption=`Mevcut brüt ${money(tlToKurus(base))}; ${months[m]} ayından itibaren yeni brüt ${money(tlToKurus(x))}. Prim ve çalışma arası boşluk yok. Matrah yıl boyunca devam eder; yeni işverende sıfırlanma ve beyanname hesabı modellenmez. ${note}`;
  } else {
   const extrasA=Array(12).fill(0),extrasB=Array(12).fill(0);
   if(post.kind==='bonus'){extrasB[m]=x;labelA='Primsiz net';labelB='Primli net';}
   if(post.kind==='timing'){extrasA[m]=x;extrasB[y]=x;labelA=months[m]+' primiyle net';labelB=months[y]+' primiyle net';}
   if(post.kind==='split'){extrasA[m]=x;extrasB[m]=x/2;extrasB[y]=x/2;labelA='Tek ödemeyle net';labelB='İki taksitle net';}
   a=payroll(constant,extrasA);b=payroll(constant,extrasB);
   assumption=`Aylık brüt ${money(tlToKurus(base))}, toplam brüt prim ${money(tlToKurus(x))}. ${post.kind==='bonus'?months[m]+' ayında tek prim.':post.kind==='timing'?months[m]+' veya '+months[y]+' alternatif ödeme; iki prim birlikte ödenmez.':months[m]+' ayında tek prim veya '+months[m]+' ve '+months[y]+' aylarında iki eşit brüt taksit.'} Zam yok; örneklerde aylık toplam brüt SGK tavanının altında tutulmuştur. ${note}`;
  }
  const diffs=b.map((r,i)=>r.netKurus-a[i].netKurus),delta=diffs.reduce((s,v)=>s+v,0);
  table=a.map((r,i)=>[months[i],money(r.netKurus),money(b[i].netKurus),money(diffs[i])]);headers=['Ay',labelA,labelB,'Net fark (yeni − mevcut)'];
  metrics=[['İlk senaryo yıllık net',money(summarizePayroll(a).annualNetKurus)],['İkinci senaryo yıllık net',money(summarizePayroll(b).annualNetKurus)],['Yıllık net fark',money(delta)]];
  reading=`İkinci senaryonun yıllık neti, birinciye göre ${money(Math.abs(delta))} ${delta<0?'daha düşüktür':delta>0?'daha yüksektir':'fark gösterir; bu örnekte yıllık toplamlar eşittir'}. ${delta===0?'Eşit yıllık toplam ödeme tarihlerinin ve aylık katkıların aynı olduğu anlamına gelmez.':'Bu fark, tablodaki on iki aylık farkın toplamıdır; ilk değişen ayın farkını on ikiyle çarpmaktan elde edilmez.'} Eksi aylık değer ilgili ayda daha düşük neti gösterir. Bu bir model karşılaştırmasıdır; sözleşme koşulu veya piyasa ücret değerlendirmesi değildir.`;
  if(post.kind==='bonus'){
   const later=diffs.slice(m+1).reduce((s,v)=>s+v,0);
   reading+=` Prim ayının ek neti ${money(diffs[m])}, sonraki ayların toplam etkisi ${money(later)}. ${later===0?'Bu örnekte prim sonraki ayların netini değiştirmez.':'Sonraki ay farkı primsiz bordroya göredir; prim alınan ayla yapılan basit karşılaştırma değildir.'}`;
  }
  if(['raise','offer','benefit'].includes(post.kind))reading+=` Yeni ücretin geçerli olduğu ay sayısı ${12-m}. Takvim yılı ortalama farkı ${money(Math.round(delta/12))}; değişikliğin geçerli olduğu aylara bölünmüş fark ${money(Math.round(delta/(12-m)))}. Her ayın net farkı bu ortalamaya eşit olmak zorunda değildir.`;
  if(post.kind==='benefit'){
   const benefit=signedKurus(y)*(12-m);metrics.push(['Ayrı kullanım değeri farkı',money(benefit)]);
   assumption+=` Aylık kişisel yan hak değeri farkı ${money(signedKurus(y))}; yalnız yeni ücret döneminde. Bu tutar piyasa fiyatı veya vergi istisnası değildir.`;
   reading+=` Yan hakların dönemsel kişisel değer farkı ${money(benefit)}, maaş farkıyla birlikte ele alınan değer ${money(delta+benefit)}. Bu toplamın tamamı nakit ücret değildir; yan hakkın vergi ve SGK uygulaması bu toplama dahil edilmez.`;
  }
  if(post.kind==='purchasing'){
   const expenseA=tlToKurus(y),expenseB=tlToKurus(y*(1+z/100));
   table=a.map((r,i)=>[months[i],money(r.netKurus-expenseA),money(b[i].netKurus-expenseB),money((b[i].netKurus-expenseB)-(r.netKurus-expenseA))]);
   headers=['Ay','Eski gider sonrası','Yeni gider sonrası','Kalan alan farkı'];
   assumption+=` Eski gider ${money(expenseA)}, yeni gider ${money(expenseB)}; %${z} artış bütün yıl uygulanır. Gider yüzdesi varsayımdır, resmî enflasyon verisi veya tahmin değildir.`;
   reading+=` Yıllık ek gider ${money((expenseB-expenseA)*12)}. Gelir farkından bu ek gider çıkarıldığında yıllık kalan alan değişimi ${money(delta-(expenseB-expenseA)*12)} olur. Tablo nakit akışıdır, resmî reel ücret endeksi değildir.`;
  }
 }
 return {a,b,table,headers,assumption,reading,metrics};
}
