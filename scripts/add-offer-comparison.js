import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const page = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Maaş Teklifi Karşılaştırma 2026 | Maaşım.net</title>
<meta name="description" content="Mevcut maaşınla yeni iş teklifini; yıllık net gelir, aylık ortalama net, vergi dilimi ve toplam paket açısından karşılaştır.">
<link rel="canonical" href="https://maasim.net/maas-teklifi-karsilastirma/">
<link rel="stylesheet" href="/assets/styles.css">
<style>
.compare-shell{width:min(1180px,calc(100% - 32px));margin:0 auto;padding:48px 0 80px}.compare-hero{max-width:850px;margin-bottom:28px}.compare-hero h1{font-size:clamp(38px,6vw,68px);line-height:1.02;margin:10px 0 16px;color:#0f172a}.compare-hero p{font-size:18px;line-height:1.7;color:#475569}.compare-notice{padding:14px 16px;border:1px solid #99f6e4;background:#f0fdfa;border-radius:14px;color:#115e59;font-weight:700}.compare-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:24px}.compare-card{background:#fff;border:1px solid #dbe4ef;border-radius:20px;padding:24px;box-shadow:0 12px 35px rgba(15,23,42,.06)}.compare-card h2{margin:0 0 18px;color:#0f172a}.compare-field{display:grid;gap:7px;margin-bottom:15px}.compare-field label{font-weight:800;color:#334155;font-size:14px}.compare-field input,.compare-field select{min-height:48px;border:1px solid #cbd5e1;border-radius:11px;padding:0 13px;font:inherit;background:#fff}.compare-results{margin-top:24px}.compare-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.compare-metric{padding:20px;border-radius:18px;background:#0f2747;color:#fff}.compare-metric small{display:block;opacity:.75;font-weight:700;margin-bottom:8px}.compare-metric strong{font-size:clamp(21px,3vw,31px)}.compare-verdict{margin:18px 0;padding:22px;border-radius:18px;background:#0f9f8f;color:white;font-size:21px;font-weight:850}.compare-table{width:100%;border-collapse:collapse}.compare-table th,.compare-table td{padding:14px;border-bottom:1px solid #e2e8f0;text-align:left}.compare-table th{color:#475569}.compare-actions{display:flex;justify-content:flex-end;margin-top:18px}.compare-actions button{border:0;border-radius:11px;padding:12px 16px;font-weight:800;cursor:pointer}.privacy-note{margin-top:16px;color:#64748b;font-size:14px}@media(max-width:850px){.compare-grid,.compare-metrics{grid-template-columns:1fr}.compare-shell{padding-top:30px}.compare-table{font-size:14px}}
</style>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebApplication","name":"Maaş Teklifi Karşılaştırma","applicationCategory":"FinanceApplication","operatingSystem":"Web","url":"https://maasim.net/maas-teklifi-karsilastirma/"}</script>
</head>
<body>
<main class="compare-shell">
<section class="compare-hero"><span>İŞ DEĞİŞİKLİĞİ KARAR ARACI</span><h1>Maaş tekliflerini gerçek yıllık net gelirle karşılaştır</h1><p>Mevcut maaşınla yeni teklifini aynı bordro motorunda karşılaştır; aylık ortalama net, yıllık toplam net, yan haklar, işveren maliyeti ve vergi dilimine giriş ayını birlikte gör.</p><div class="compare-notice">Hesaplama 2026 parametreleriyle yapılır. Maaş tutarların yalnızca bu cihazın tarayıcısında saklanır ve sunucuya gönderilmez.</div></section>
<form id="comparison-form">
<div class="compare-grid">
<section class="compare-card"><h2>Mevcut paket</h2>
<div class="compare-field"><label for="current-mode">Maaş türü</label><select id="current-mode" data-compare-input><option value="gross">Brüt</option><option value="net">Net</option></select></div>
<div class="compare-field"><label for="current-salary">Aylık maaş</label><input id="current-salary" data-compare-input inputmode="decimal" value="150000"></div>
<div class="compare-field"><label for="current-extra">Aylık ek ödeme / prim</label><input id="current-extra" data-compare-input inputmode="decimal" value="0"></div>
<div class="compare-field"><label for="current-benefit">Aylık yan hak değeri</label><input id="current-benefit" data-compare-input inputmode="decimal" value="0"></div>
</section>
<section class="compare-card"><h2>Yeni teklif</h2>
<div class="compare-field"><label for="offer-mode">Maaş türü</label><select id="offer-mode" data-compare-input><option value="gross">Brüt</option><option value="net">Net</option></select></div>
<div class="compare-field"><label for="offer-salary">Aylık maaş</label><input id="offer-salary" data-compare-input inputmode="decimal" value="200000"></div>
<div class="compare-field"><label for="offer-extra">Aylık ek ödeme / prim</label><input id="offer-extra" data-compare-input inputmode="decimal" value="0"></div>
<div class="compare-field"><label for="offer-benefit">Aylık yan hak değeri</label><input id="offer-benefit" data-compare-input inputmode="decimal" value="0"></div>
<div class="compare-field"><label for="offer-start-month">Teklifin başlangıç ayı</label><select id="offer-start-month" data-compare-input><option value="0">Ocak</option><option value="1">Şubat</option><option value="2">Mart</option><option value="3">Nisan</option><option value="4">Mayıs</option><option value="5">Haziran</option><option value="6">Temmuz</option><option value="7">Ağustos</option><option value="8">Eylül</option><option value="9">Ekim</option><option value="10">Kasım</option><option value="11">Aralık</option></select></div>
</section></div></form>
<section class="compare-results" aria-live="polite"><div class="compare-metrics">
<div class="compare-metric"><small>Yıllık net fark</small><strong id="compare-annual-net-diff">—</strong></div>
<div class="compare-metric"><small>Aylık ortalama net fark</small><strong id="compare-average-net-diff">—</strong></div>
<div class="compare-metric"><small>Toplam paket farkı</small><strong id="compare-package-diff">—</strong></div>
<div class="compare-metric"><small>Yıllık işveren maliyeti farkı</small><strong id="compare-employer-cost-diff">—</strong></div>
</div><div class="compare-verdict" id="comparison-verdict">—</div>
<div class="compare-card"><table class="compare-table"><thead><tr><th>Gösterge</th><th>Mevcut</th><th>Yeni teklif</th></tr></thead><tbody>
<tr><th>Yıllık toplam net</th><td id="current-annual-net">—</td><td id="offer-annual-net">—</td></tr>
<tr><th>Aylık ortalama net</th><td id="current-average-net">—</td><td id="offer-average-net">—</td></tr>
<tr><th>%27 vergi dilimine giriş</th><td id="current-first-27">—</td><td id="offer-first-27">—</td></tr>
<tr><th>%35 vergi dilimine giriş</th><td id="current-first-35">—</td><td id="offer-first-35">—</td></tr>
</tbody></table><div class="compare-actions"><button type="button" id="comparison-reset">Verileri sıfırla</button></div><p class="privacy-note">Bu araç bilgilendirme amaçlıdır. Yan haklar nakit karşılığı olarak toplam pakete eklenir; vergiye tabi olup olmaması ayrıca modellenmez.</p></div></section>
</main>
<script type="module" src="/assets/offer-comparison.js"></script>
</body></html>`;

export async function addOfferComparison(distDir) {
  const dir = join(distDir, 'maas-teklifi-karsilastirma');
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'index.html'), page, 'utf8');

  const homePath = join(distDir, 'index.html');
  let home = await readFile(homePath, 'utf8');
  if (!home.includes('/maas-teklifi-karsilastirma/')) {
    home = home.replace(/(<\/main>)/i, `<section class="comparison-home-cta"><h2>Yeni iş teklifin gerçekten ne kadar kazandırıyor?</h2><p>Mevcut maaşınla yeni teklifi yıllık net gelir, vergi dilimi ve yan haklarla karşılaştır.</p><a href="/maas-teklifi-karsilastirma/">Maaş teklifini karşılaştır →</a></section>$1`);
    await writeFile(homePath, home, 'utf8');
  }
}
