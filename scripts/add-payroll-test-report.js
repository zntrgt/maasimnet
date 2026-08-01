import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getPageMetadata, SITE_METADATA } from '../content/site-metadata.js';
import { DATA_2026 } from '../src/data-2026.js';
import { runPayrollAudit } from '../src/payroll-audit.js';

const REPORT_PATH = '/test-raporu/';
const REPORT_MARKER = 'data-payroll-test-report-link';

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderCase(item) {
  const details = item.details.map((detail) => `<li>${escapeHtml(detail)}</li>`).join('');
  return `<article class="test-case test-case--${item.status}">
    <div class="test-case__head">
      <div><p>${escapeHtml(item.category)}</p><h2>${escapeHtml(item.title)}</h2></div>
      <strong>${item.status === 'passed' ? 'GEÇTİ' : 'BAŞARISIZ'}</strong>
    </div>
    <ul>${details}</ul>
    <code>${escapeHtml(item.id)}</code>
  </article>`;
}

function renderReport(audit) {
  const metadata = getPageMetadata(REPORT_PATH);
  const title = '2026 Maaş Hesaplama Açık Test Raporu';
  const description = 'Maaşım.net hesaplama motorunun vergi dilimi, SGK tavanı, asgari ücret, engellilik indirimi, yuvarlama ve netten brüte sınır testleri.';
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_METADATA.origin}/#organization`,
        name: 'Maaşım.net',
        url: `${SITE_METADATA.origin}/`
      },
      {
        '@type': 'WebPage',
        '@id': `${SITE_METADATA.origin}${REPORT_PATH}#page`,
        url: `${SITE_METADATA.origin}${REPORT_PATH}`,
        name: title,
        description,
        inLanguage: 'tr-TR',
        datePublished: metadata.publishedAt,
        dateModified: metadata.modifiedAt,
        isPartOf: { '@id': `${SITE_METADATA.origin}/#website` }
      },
      {
        '@type': 'Dataset',
        '@id': `${SITE_METADATA.origin}${REPORT_PATH}#test-results`,
        name: 'Maaşım.net 2026 bordro motoru sınır testleri',
        description: `${audit.total} yürütülebilir test senaryosunun sonuçları.`,
        dateModified: metadata.modifiedAt,
        creator: { '@id': `${SITE_METADATA.origin}/#organization` },
        variableMeasured: audit.cases.map((item) => ({
          '@type': 'PropertyValue',
          name: item.title,
          value: item.status
        }))
      }
    ]
  };

  return `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title} | Maaşım.net</title>
  <meta name="description" content="${description}">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <meta name="last-modified" content="${metadata.modifiedAt}">
  <link rel="canonical" href="${SITE_METADATA.origin}${REPORT_PATH}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${SITE_METADATA.origin}${REPORT_PATH}">
  <script type="application/ld+json">${JSON.stringify(graph)}</script>
  <style>
    *{box-sizing:border-box}body{margin:0;background:#f8fafc;color:#0f172a;font:16px/1.65 Inter,system-ui,sans-serif}.report-shell{width:min(1080px,calc(100% - 32px));margin:0 auto;padding:54px 0 80px}.crumb{font-size:13px}.crumb a,.report-shell a{color:#0f766e}.eyebrow{margin:38px 0 8px;color:#0f766e;font-size:12px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}h1{max-width:900px;margin:0;font-size:clamp(40px,7vw,72px);line-height:1.02;letter-spacing:-.05em}.lead{max-width:850px;color:#475569;font-size:20px}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:34px 0}.summary div,.test-case,.method,.limits,.freshness{border:1px solid #dbe4ee;border-radius:20px;background:#fff}.summary div{padding:20px}.summary span{display:block;color:#64748b;font-size:11px;font-weight:850;letter-spacing:.06em;text-transform:uppercase}.summary strong{display:block;margin-top:5px;font-size:27px}.summary .passed strong{color:#0f766e}.freshness{margin:22px 0 0;padding:22px}.freshness h2{margin:0 0 14px;font-size:18px}.freshness dl{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:0}.freshness dl div{border-top:1px solid #e2e8f0;padding-top:10px}.freshness dt{color:#64748b;font-size:11px;font-weight:850;letter-spacing:.06em;text-transform:uppercase}.freshness dd{margin:3px 0 0;font-weight:800}.section-title{margin:52px 0 18px;font-size:30px}.test-list{display:grid;gap:16px}.test-case{padding:23px}.test-case__head{display:flex;align-items:flex-start;justify-content:space-between;gap:24px}.test-case__head p{margin:0;color:#0f766e;font-size:11px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.test-case h2{margin:5px 0 10px;font-size:21px;line-height:1.3}.test-case__head>strong{border-radius:999px;background:#ecfdf5;color:#047857;padding:7px 11px;font-size:11px}.test-case ul{margin:10px 0 14px;padding-left:21px;color:#334155}.test-case code{color:#64748b;font-size:12px}.method,.limits{margin-top:22px;padding:24px}.method h2,.limits h2{margin-top:0}.source-list{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:0;list-style:none}.source-list li{border:1px solid #e2e8f0;border-radius:15px;padding:16px}.source-list b{display:block}.source-list span{display:block;margin:5px 0 10px;color:#64748b;font-size:13px}@media(max-width:760px){.summary,.source-list,.freshness dl{grid-template-columns:1fr 1fr}.test-case__head{display:block}.test-case__head>strong{display:inline-block;margin-top:8px}}@media(max-width:480px){.summary,.source-list,.freshness dl{grid-template-columns:1fr}}
  </style>
</head>
<body>
  <main class="report-shell">
    <p class="crumb"><a href="/">Ana Sayfa</a> / <a href="/hesaplama-metodolojisi/">Metodoloji</a> / Test Raporu</p>
    <p class="eyebrow">Çalıştırılabilir doğruluk kanıtı</p>
    <h1>${title}</h1>
    <p class="lead">Bu sayfa pazarlama metni değildir. Build ve CI sırasında çalışan aynı denetim kodunun sonuçlarını yayınlar. Herhangi bir senaryo başarısız olursa yayın build’i durur.</p>

    <section class="summary" aria-label="Test özeti">
      <div class="passed"><span>Durum</span><strong>${audit.status === 'passed' ? 'Tümü geçti' : 'Başarısız'}</strong></div>
      <div><span>Geçen test</span><strong>${audit.passed}/${audit.total}</strong></div>
      <div><span>Hesaplama yılı</span><strong>${audit.calculationYear}</strong></div>
      <div><span>Hesaplama hassasiyeti</span><strong>Kuruş düzeyi</strong></div>
    </section>

    <aside class="freshness" aria-label="Güncellik bilgisi">
      <h2>Güncellik bilgisi</h2>
      <dl>
        <div><dt>Son güncelleme</dt><dd>${metadata.modifiedAt}</dd></div>
        <div><dt>Son mevzuat kontrolü</dt><dd>${metadata.reviewedAt}</dd></div>
        <div><dt>Veri dönemi</dt><dd>${DATA_2026.validity.from}–${DATA_2026.validity.to}</dd></div>
      </dl>
    </aside>

    <h2 class="section-title">Test edilen sınırlar</h2>
    <section class="test-list">${audit.cases.map(renderCase).join('')}</section>

    <section class="method">
      <h2>Rapor nasıl üretiliyor?</h2>
      <p><code>src/payroll-audit.js</code> içindeki senaryolar doğrudan merkezi kuruş motorunu çalıştırır. <code>tests/payroll-audit.test.js</code> bütün senaryoların geçtiğini ve zorunlu kapsamın bulunduğunu doğrular. Bu sayfa aynı sonucu build sırasında HTML olarak üretir.</p>
      <p><a href="/hesaplama-metodolojisi/">Hesaplama metodolojisini incele →</a></p>
    </section>

    <section class="method">
      <h2>Resmî veri kaynakları</h2>
      <ul class="source-list">
        ${[DATA_2026.sources.minimumWage, DATA_2026.sources.incomeTax, DATA_2026.sources.sgk].map((source) => `<li><b>${escapeHtml(source.institution)}</b><span>${escapeHtml(source.documentTitle)}</span><a href="${escapeHtml(source.url)}" rel="noopener noreferrer">Resmî kaynağı aç ↗</a></li>`).join('')}
      </ul>
    </section>

    <section class="limits">
      <h2>Kapsam sınırı</h2>
      <p>Bu rapor standart 4/a çalışan bordro motorunun belirtilen sınırlarını doğrular. Eksik gün, ay ortasında işe giriş/çıkış, Ar-Ge ve teknopark istisnaları, serbest bölge, yabancı çalışan, haciz ve benzeri özel bordro rejimleri bu test raporunun kapsamı dışındadır.</p>
    </section>
  </main>
</body>
</html>`;
}

async function addMethodologyLink(distDir, audit) {
  const path = join(distDir, 'hesaplama-metodolojisi', 'index.html');
  let html = await readFile(path, 'utf8');
  if (html.includes(REPORT_MARKER)) return;

  const section = `<section ${REPORT_MARKER} class="bg-emerald-50 border border-emerald-200 rounded-[2rem] p-7 md:p-9 my-10"><p class="text-xs font-black uppercase tracking-widest text-emerald-700 mb-2">Açık doğruluk raporu</p><h2 class="text-2xl font-black text-slate-900">${audit.passed}/${audit.total} sınır testi geçti</h2><p class="text-sm text-slate-600">Vergi dilimleri, SGK tavanı, asgari ücret, engellilik indirimi, yuvarlama ve sabit net çözümü aynı motor üzerinde otomatik test edilir.</p><a class="inline-block mt-3 font-black text-emerald-700" href="${REPORT_PATH}">Test sonuçlarını ve kapsam sınırlarını gör →</a></section>`;

  if (!/<\/main>/i.test(html)) throw new Error('Metodoloji sayfasında </main> bulunamadı.');
  html = html.replace(/<\/main>/i, `${section}</main>`);
  await writeFile(path, html);
}

export async function addPayrollTestReport(distDir) {
  const audit = runPayrollAudit();
  if (audit.failed > 0) {
    const failures = audit.cases.filter((item) => item.status === 'failed').map((item) => `${item.id}: ${item.details.join(' ')}`);
    throw new Error(`Bordro test raporu başarısız:\n${failures.join('\n')}`);
  }

  const reportDir = join(distDir, 'test-raporu');
  await mkdir(reportDir, { recursive: true });
  await writeFile(join(reportDir, 'index.html'), renderReport(audit));
  await addMethodologyLink(distDir, audit);

  console.log(`açık bordro test raporu üretildi: ${audit.passed}/${audit.total}`);
  return audit;
}
