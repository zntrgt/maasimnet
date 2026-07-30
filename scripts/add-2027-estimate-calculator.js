import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const ROUTE = '/2027-maas-hesaplama/';
const LASTMOD = '2026-07-30';

const pageCss = `
/* 2027 tahmini maaş hesaplama sayfası */
.estimate-2027-page { max-width: 1180px; margin: 0 auto; padding: 36px 24px 80px; }
.estimate-2027-hero { text-align: center; margin-bottom: 24px; }
.estimate-status-badge { display:inline-flex; align-items:center; gap:8px; padding:8px 12px; border-radius:999px; background:#fff7ed; border:1px solid #fdba74; color:#9a3412; font-size:12px; font-weight:900; letter-spacing:.06em; text-transform:uppercase; }
.estimate-2027-hero h1 { margin:18px auto 10px; max-width:900px; font-size:clamp(2rem,5vw,3.6rem); line-height:1.05; letter-spacing:-.04em; color:#0f172a; }
.estimate-2027-hero > p { max-width:780px; margin:0 auto; color:#475569; font-size:16px; }
.estimate-warning { display:grid; grid-template-columns:auto 1fr; gap:14px; margin:24px 0; padding:18px 20px; border:2px solid #f97316; border-radius:18px; background:#fff7ed; color:#7c2d12; box-shadow:0 12px 30px rgba(154,52,18,.08); }
.estimate-warning strong { display:block; margin-bottom:4px; font-size:16px; }
.estimate-warning p { margin:0; font-size:14px; line-height:1.55; }
.estimate-warning__icon { font-size:24px; line-height:1; }
.estimate-grid { display:grid; grid-template-columns:minmax(310px,380px) minmax(0,1fr); gap:24px; align-items:start; }
.estimate-panel { padding:22px; border-radius:22px; background:#0f172a; color:#fff; box-shadow:0 20px 50px rgba(15,23,42,.18); }
.estimate-panel h2 { margin:0 0 6px; font-size:22px; }
.estimate-panel__intro { margin:0 0 18px; color:#cbd5e1; font-size:13px; }
.estimate-presets { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-bottom:18px; }
.estimate-presets button { border:1px solid rgba(255,255,255,.16); border-radius:10px; padding:10px 8px; background:rgba(255,255,255,.07); color:#fff; font-size:11px; font-weight:800; cursor:pointer; }
.estimate-presets button[aria-pressed="true"] { background:#10b981; color:#052e26; border-color:#10b981; }
.estimate-field { margin-top:14px; }
.estimate-field label { display:flex; justify-content:space-between; gap:10px; margin-bottom:6px; color:#e2e8f0; font-size:12px; font-weight:800; }
.estimate-field small { color:#94a3b8; font-weight:500; }
.estimate-field input { width:100%; min-height:46px; padding:10px 12px; border:1px solid rgba(255,255,255,.16); border-radius:11px; background:rgba(255,255,255,.09); color:#fff; font:inherit; font-weight:800; font-variant-numeric:tabular-nums; }
.estimate-field input:focus { outline:none; border-color:#10b981; box-shadow:0 0 0 3px rgba(16,185,129,.22); }
.estimate-panel__note { margin:16px 0 0; padding:12px; border-radius:12px; background:rgba(249,115,22,.13); color:#fed7aa; font-size:12px; line-height:1.5; }
#estimate-reset { width:100%; margin-top:14px; min-height:42px; border:1px solid rgba(255,255,255,.2); border-radius:11px; background:transparent; color:#fff; font-weight:800; cursor:pointer; }
.estimate-results { min-width:0; }
.estimate-result-hero { padding:26px; border-radius:22px; background:linear-gradient(135deg,#047857,#10b981); color:#fff; box-shadow:0 18px 40px rgba(4,120,87,.18); }
.estimate-result-hero span { font-size:11px; font-weight:900; letter-spacing:.1em; text-transform:uppercase; opacity:.88; }
.estimate-result-hero strong { display:block; margin-top:8px; font-size:clamp(2.4rem,6vw,4.4rem); line-height:1; letter-spacing:-.045em; font-variant-numeric:tabular-nums; }
.estimate-result-hero p { margin:14px 0 0; font-size:13px; opacity:.9; }
.estimate-metrics { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; margin-top:14px; }
.estimate-metric { min-height:118px; padding:18px; border:1px solid #e2e8f0; border-radius:16px; background:#fff; display:flex; flex-direction:column; justify-content:space-between; }
.estimate-metric span { color:#64748b; font-size:10px; font-weight:900; letter-spacing:.09em; text-transform:uppercase; }
.estimate-metric strong { color:#0f172a; font-size:20px; font-variant-numeric:tabular-nums; }
.estimate-inline-warning { margin-top:14px; padding:14px 16px; border-left:4px solid #f97316; border-radius:10px; background:#fff7ed; color:#9a3412; font-size:13px; font-weight:700; }
.estimate-error { margin-top:12px; padding:12px; border-radius:10px; background:#fef2f2; color:#b91c1c; font-weight:700; }
.estimate-table-card { margin-top:24px; border:1px solid #e2e8f0; border-radius:20px; background:#fff; overflow:hidden; box-shadow:0 12px 32px rgba(15,23,42,.06); }
.estimate-table-card header { padding:18px 20px; border-bottom:1px solid #e2e8f0; }
.estimate-table-card h2 { margin:0; font-size:22px; }
.estimate-table-card p { margin:5px 0 0; color:#64748b; font-size:13px; }
.estimate-table-wrap { overflow-x:auto; }
.estimate-table { width:100%; min-width:760px; border-collapse:collapse; font-size:13px; }
.estimate-table th,.estimate-table td { padding:12px 14px; border-bottom:1px solid #e2e8f0; text-align:right; font-variant-numeric:tabular-nums; }
.estimate-table thead th { background:#f8fafc; color:#475569; font-size:11px; text-transform:uppercase; letter-spacing:.05em; }
.estimate-table th:first-child,.estimate-table td:first-child { text-align:left; }
.estimate-table tbody tr:last-child th,.estimate-table tbody tr:last-child td { border-bottom:0; }
.estimate-explainer { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; margin-top:24px; }
.estimate-info-card { padding:20px; border:1px solid #e2e8f0; border-radius:16px; background:#fff; }
.estimate-info-card h2 { margin:0 0 8px; font-size:20px; }
.estimate-info-card p,.estimate-info-card li { color:#475569; font-size:14px; line-height:1.6; }
.estimate-info-card ul { margin:8px 0 0; padding-left:20px; }
.estimate-final-warning { margin-top:24px; padding:20px; border-radius:16px; background:#7c2d12; color:#fff7ed; }
.estimate-final-warning h2 { margin:0 0 8px; font-size:20px; }
.estimate-final-warning p { margin:0; line-height:1.6; }
@media(max-width:850px){.estimate-grid{grid-template-columns:1fr}.estimate-metrics{grid-template-columns:1fr}.estimate-explainer{grid-template-columns:1fr}.estimate-2027-page{padding-inline:16px}.estimate-panel{position:static}.estimate-warning{grid-template-columns:1fr}.estimate-warning__icon{display:none}}
`;

const html = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>2027 Brüt Net Maaş Tahmini Hesaplama | Maaşım.net</title>
<meta name="description" content="Resmî 2027 verileri açıklanmadan önce kendi asgari ücret, SGK tavanı ve vergi dilimi tahminlerinizi girerek 2027 brüt-net maaş senaryosu hesaplayın.">
<link rel="canonical" href="https://maasim.net${ROUTE}">
<link rel="stylesheet" href="/assets/styles.css">
<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"WebPage","name":"2027 Brüt Net Maaş Tahmini Hesaplama","url":"https://maasim.net${ROUTE}","description":"Kullanıcı tarafından değiştirilebilir tahmini 2027 bordro parametreleriyle senaryo hesaplama sayfası."},{"@type":"WebApplication","name":"2027 Maaş Tahmini Hesaplama","applicationCategory":"FinanceApplication","operatingSystem":"Web","url":"https://maasim.net${ROUTE}","isAccessibleForFree":true,"description":"Resmî olmayan ve kullanıcı varsayımlarına dayanan 2027 maaş senaryosu hesaplama aracı."},{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Ana Sayfa","item":"https://maasim.net/"},{"@type":"ListItem","position":2,"name":"2027 Maaş Tahmini Hesaplama","item":"https://maasim.net${ROUTE}"}]}]}</script>
</head>
<body>
<main class="estimate-2027-page">
  <header class="estimate-2027-hero">
    <span class="estimate-status-badge">⚠ Tahmini parametreler · Resmî 2027 verisi değildir</span>
    <h1>2027 Brüt–Net Maaş Tahmini Hesaplama</h1>
    <p>2027 yılına ait asgari ücret, SGK tavanı ve gelir vergisi dilimi eşikleri henüz açıklanmadı. Aşağıdaki rakamları kendi beklentinize göre değiştirerek olası maaş senaryolarını hesaplayın.</p>
  </header>

  <aside class="estimate-warning" role="alert" aria-label="Önemli tahmin uyarısı">
    <div class="estimate-warning__icon" aria-hidden="true">⚠️</div>
    <div><strong>Bu bir tahmin aracıdır; bordro veya resmî hesaplama değildir.</strong><p>Sayfadaki başlangıç değerleri yalnızca 2026 parametrelerinin farklı artış oranlarıyla ileri taşındığı örnek senaryolardır. 2027 resmî rakamları yayımlandığında aynı URL güncellenecektir. İş teklifi, bordro, bütçe veya hukuki karar için bu sonuçları tek başına kullanmayın.</p></div>
  </aside>

  <section class="estimate-grid" aria-label="2027 tahmin hesaplayıcı">
    <form class="estimate-panel" onsubmit="return false">
      <h2>Kendi 2027 varsayımlarını gir</h2>
      <p class="estimate-panel__intro">Turuncu uyarılarla işaretlenen tüm sonuçlar, tamamen aşağıdaki tahmini değerlere dayanır.</p>
      <div class="estimate-presets" aria-label="Hazır tahmin senaryoları">
        <button type="button" data-estimate-preset="cautious" aria-pressed="false">Temkinli</button>
        <button type="button" data-estimate-preset="middle" aria-pressed="true">Orta</button>
        <button type="button" data-estimate-preset="high" aria-pressed="false">Yüksek</button>
      </div>
      <div class="estimate-field"><label for="estimate-gross">Tahmini aylık brüt maaş <small>Kişisel girdin</small></label><input id="estimate-gross" data-estimate-input inputmode="decimal" value="150000"></div>
      <div class="estimate-field"><label for="estimate-minimum-gross">Tahmini 2027 brüt asgari ücret <small>Resmî değil</small></label><input id="estimate-minimum-gross" data-estimate-input inputmode="decimal" value="42939"></div>
      <div class="estimate-field"><label for="estimate-sgk-ceiling">Tahmini aylık SGK tavanı <small>Resmî değil</small></label><input id="estimate-sgk-ceiling" data-estimate-input inputmode="decimal" value="386451"></div>
      <div class="estimate-field"><label for="estimate-bracket-1">%15 dilim üst sınırı <small>Tahmin</small></label><input id="estimate-bracket-1" data-estimate-input inputmode="decimal" value="247000"></div>
      <div class="estimate-field"><label for="estimate-bracket-2">%20 dilim üst sınırı <small>Tahmin</small></label><input id="estimate-bracket-2" data-estimate-input inputmode="decimal" value="520000"></div>
      <div class="estimate-field"><label for="estimate-bracket-3">%27 dilim üst sınırı <small>Tahmin</small></label><input id="estimate-bracket-3" data-estimate-input inputmode="decimal" value="1950000"></div>
      <div class="estimate-field"><label for="estimate-bracket-4">%35 dilim üst sınırı <small>Tahmin</small></label><input id="estimate-bracket-4" data-estimate-input inputmode="decimal" value="6890000"></div>
      <p class="estimate-panel__note"><strong>Varsayım:</strong> SGK, işsizlik ve damga vergisi oranlarının 2026 ile aynı kaldığı kabul edilir. Bu oranlar değişirse sonuçlar da değişir.</p>
      <button id="estimate-reset" type="button">Orta senaryoya dön</button>
    </form>

    <div class="estimate-results">
      <section class="estimate-result-hero">
        <span>Tahmini aylık ortalama net</span>
        <strong id="estimate-average-net">—</strong>
        <p id="estimate-assumption-summary">Tahmini parametrelerle hesaplanıyor.</p>
      </section>
      <div class="estimate-metrics">
        <article class="estimate-metric"><span>Tahmini yıllık toplam net</span><strong id="estimate-annual-net">—</strong></article>
        <article class="estimate-metric"><span>Tahmini aylık işveren maliyeti</span><strong id="estimate-employer-cost">—</strong></article>
        <article class="estimate-metric"><span>Tahmini efektif kesinti oranı</span><strong id="estimate-effective-rate">—</strong></article>
      </div>
      <div class="estimate-inline-warning">⚠ Yukarıdaki sonuçların tamamı resmî olmayan varsayımlarla üretilmiştir. “Tahmini” ibaresi kaldırılmadan paylaşılmalıdır.</div>
      <div id="estimate-error" class="estimate-error" hidden></div>
    </div>
  </section>

  <section class="estimate-table-card">
    <header><h2>Ocak–Aralık tahmini maaş akışı</h2><p>Ay içinde vergi dilimi değişiyorsa iki oran birlikte gösterilir. Tablodaki tüm tutarlar tahminidir.</p></header>
    <div class="estimate-table-wrap"><table class="estimate-table"><thead><tr><th>Ay</th><th>Brüt</th><th>G.V. Matrahı</th><th>Tahmini Dilim</th><th>Gelir Vergisi</th><th>Net Maaş</th></tr></thead><tbody id="estimate-table-body"></tbody></table></div>
  </section>

  <section class="estimate-explainer">
    <article class="estimate-info-card"><h2>Bu araç neyi hesaplıyor?</h2><p>Kullanıcının girdiği tahmini asgari ücret, SGK tavanı ve vergi dilimi eşiklerini merkezi kuruş bazlı bordro motoruna uygular; 12 aylık net maaş, gelir vergisi ve işveren maliyeti senaryosu üretir.</p></article>
    <article class="estimate-info-card"><h2>Henüz bilinmeyenler</h2><ul><li>2027 brüt ve net asgari ücret</li><li>2027 gelir vergisi dilimi eşikleri</li><li>2027 SGK tabanı ve tavanı</li><li>Prim ve vergi oranlarında olası değişiklikler</li><li>Yeni istisna veya mevzuat düzenlemeleri</li></ul></article>
    <article class="estimate-info-card"><h2>Hazır senaryolar nasıl üretildi?</h2><p>Temkinli, orta ve yüksek seçenekler; 2026 değerlerinin farklı artış oranlarıyla ileri taşındığı matematiksel örneklerdir. Ekonomik tahmin, resmî beklenti veya yatırım tavsiyesi değildir.</p></article>
    <article class="estimate-info-card"><h2>2027 verileri açıklanınca ne olacak?</h2><p>Bu URL korunacak, tahmini etiketler kaldırılmadan önce tüm resmî parametreler kaynaklarıyla doğrulanacak. Tahmin ve gerçekleşen değerler ayrıca karşılaştırılacak.</p><p><a href="/blog/2027-maas-zammi-beklentileri/">2027 maaş zammı beklentileri yazısını incele</a></p></article>
  </section>

  <aside class="estimate-final-warning"><h2>Son uyarı: Sonuçlar resmî değildir</h2><p>Bu sayfa yalnızca erken dönem senaryo planlaması içindir. 2027 bordrosu, iş sözleşmesi, ücret teklifi, vergi beyanı veya işveren bütçesi hazırlanırken resmî mevzuat ve uzman görüşü esas alınmalıdır.</p></aside>
</main>
<script type="module" src="/assets/estimate-2027.js"></script>
</body></html>`;

export async function add2027EstimateCalculator(distDir) {
  const pageDir = join(distDir, '2027-maas-hesaplama');
  const indexPath = join(pageDir, 'index.html');
  const stylesPath = join(distDir, 'assets', 'styles.css');
  const sitemapPath = join(distDir, 'sitemap.xml');
  await mkdir(pageDir, { recursive: true });
  await writeFile(indexPath, html, 'utf8');

  let css = await readFile(stylesPath, 'utf8');
  if (!css.includes('/* 2027 tahmini maaş hesaplama sayfası */')) {
    css += `\n${pageCss}\n`;
    await writeFile(stylesPath, css, 'utf8');
  }

  let sitemap = await readFile(sitemapPath, 'utf8');
  if (!sitemap.includes(`<loc>https://maasim.net${ROUTE}</loc>`)) {
    sitemap = sitemap.replace('</urlset>', `<url>\n<loc>https://maasim.net${ROUTE}</loc>\n<lastmod>${LASTMOD}</lastmod>\n</url>\n</urlset>`);
    await writeFile(sitemapPath, sitemap, 'utf8');
  }

  const blogPath = join(distDir, 'blog', '2027-maas-zammi-beklentileri', 'index.html');
  let blog = await readFile(blogPath, 'utf8');
  if (!blog.includes(ROUTE)) {
    blog = blog.replace(/<\/article>/i, `<aside class="blog-calculator-cta"><strong>2027 maaşını kendi varsayımlarınla hesapla</strong><p>Resmî rakamlar açıklanmadan önce asgari ücret, SGK tavanı ve vergi dilimi tahminlerini değiştirerek senaryo oluştur.</p><a href="${ROUTE}">2027 tahmini maaş hesaplayıcıyı aç</a></aside></article>`);
    await writeFile(blogPath, blog, 'utf8');
  }

  console.log('2027 tahmini maaş hesaplama sayfası, sitemap ve blog iç linki üretildi.');
}
