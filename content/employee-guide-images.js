// Shared topic covers keep the employee guides in the site's editorial photo style.
const descriptions = {
  budget: 'Evde defter ve hesap makinesiyle aylık bütçesini planlayan çalışan',
  purchasing: 'Evde faturalarını ve günlük giderlerini değerlendiren çalışan',
  net: 'Ofiste bordrosunu bilgisayardaki bilgilerle karşılaştıran çalışan',
  raise: 'Yöneticisiyle maaş artışını görüşen çalışan',
  offer: 'Ev ofisinde iki iş teklifini değerlendiren çalışan',
  benefit: 'Ofiste çalışan yan hakları hakkında konuşan iki iş arkadaşı',
  bonus: 'Evde bilgisayarından prim ödemesini inceleyen çalışan',
  tax: 'Bordro uzmanıyla ücret kesintilerini inceleyen çalışan',
  timing: 'Takvim ve defter kullanarak ödeme tarihlerini planlayan çalışan',
  split: 'Evde ödeme planlarını birlikte düzenleyen çift'
};

export function employeeGuideImage(post) {
  const kinds = ['budget','net','raise','offer','benefit','bonus','tax','timing','split','purchasing'];
  const kind = post.coverKind || post.kind;
  const alt = descriptions[kind];
  if (!alt) throw new Error(`Rehber görseli tanımlanmamış: ${kind}`);
  return { asset: `employee-${kind}-editorial.webp`, alt, encoded: true, width: 1200, height: 675 };
}

