import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const COOKIEBOT_ID = 'fc0797fc-6cb3-4086-98c8-c276a7024462';
const COOKIEBOT_CONFIGURATION_MARKER = 'id="CookiebotConfiguration"';
const COOKIEBOT_MARKER = 'id="Cookiebot"';
const CONSENT_MODE_MARKER = 'data-maasim-consent-mode';
const COOKIEBOT_HINTS_MARKER = 'data-cookiebot-connection-hints';

const cookiebotConnectionHints = `<link rel="preconnect" href="https://consent.cookiebot.com" crossorigin ${COOKIEBOT_HINTS_MARKER}><link rel="preconnect" href="https://consentcdn.cookiebot.com" crossorigin><link rel="dns-prefetch" href="//consent.cookiebot.com"><link rel="dns-prefetch" href="//consentcdn.cookiebot.com">`;

const cookiebotConfiguration = `<script id="CookiebotConfiguration" type="application/json" data-cookieconsent="ignore">
{
  "Frameworks": {
    "IABTCF2": {
      "AllowedVendors": [755],
      "AllowedGoogleACVendors": [],
      "AllowedSpecialFeatures": []
    }
  }
}
</script>`;

const cookiebotScript = `<script id="Cookiebot" src="https://consent.cookiebot.com/uc.js" fetchpriority="high" data-cbid="${COOKIEBOT_ID}" data-blockingmode="auto" data-framework="TCFv2.2" data-culture="TR" type="text/javascript"></script>`;

const consentModeScript = `<script data-cookieconsent="ignore" ${CONSENT_MODE_MARKER}>
window['gtag_enable_tcf_support'] = true;
window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
gtag('consent', 'default', {
  ad_personalization: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  analytics_storage: 'denied',
  functionality_storage: 'denied',
  personalization_storage: 'denied',
  security_storage: 'granted',
  wait_for_update: 500
});
gtag('set', 'ads_data_redaction', true);
gtag('set', 'url_passthrough', false);
</script>`;

const cookieDeclarationScript = `<script id="CookieDeclaration" src="https://consent.cookiebot.com/${COOKIEBOT_ID}/cd.js" data-culture="TR" type="text/javascript" async></script>`;

const policyHtml = `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Çerez Politikası | Maaşım.net</title>
  <meta name="description" content="Maaşım.net çerez politikası; kullanılan çerez kategorileri, sağlayıcılar, saklama süreleri ve tercih yönetimi.">
  <link rel="canonical" href="https://maasim.net/cerez-politikasi/">
  <style>
    body{margin:0;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#172033;background:#f7f9fc}.policy-shell{width:min(920px,calc(100% - 32px));margin:0 auto;padding:52px 0 72px}.policy-card{padding:clamp(24px,5vw,52px);border:1px solid #d9e0ea;border-radius:22px;background:#fff;box-shadow:0 16px 50px rgba(15,39,71,.08)}h1,h2{color:#0f2747;line-height:1.2}h1{font-size:clamp(34px,6vw,54px);margin:0 0 16px}h2{margin:34px 0 10px;font-size:23px}p,li{font-size:16px;line-height:1.75;color:#465265}table{width:100%;border-collapse:collapse;margin:18px 0}th,td{padding:12px;border:1px solid #d9e0ea;text-align:left;vertical-align:top;font-size:14px;line-height:1.5}th{background:#f1f5f9;color:#0f2747}.policy-actions{margin:24px 0}.policy-button{display:inline-flex;min-height:46px;align-items:center;padding:0 16px;border-radius:11px;background:#0f2747;color:#fff;text-decoration:none;font-weight:750}.policy-button:hover{background:#18365d}.declaration-shell{margin-top:18px;padding:18px;border:1px solid #e2e8f0;border-radius:16px;overflow:auto}@media(max-width:650px){table,thead,tbody,tr,th,td{display:block}thead{position:absolute;left:-9999px}tr{margin-bottom:12px;border:1px solid #d9e0ea}td{border:0;border-bottom:1px solid #e8edf3}td:last-child{border-bottom:0}.declaration-shell{padding:12px}}
  </style>
</head>
<body>
  <main class="policy-shell"><article class="policy-card">
    <p><a href="/">← Maaşım.net ana sayfa</a></p>
    <h1>Çerez Politikası</h1>
    <p><strong>Son güncelleme: 30 Temmuz 2026</strong></p>
    <p>Bu politika, Maaşım.net üzerinde kullanılan çerezler ve benzeri araçların hangi amaçlarla kullanıldığını, hangi sağlayıcılar tarafından yerleştirildiğini ve tercihlerinizi nasıl yönetebileceğinizi açıklar.</p>

    <h2>1. Çerez kategorileri</h2>
    <table><thead><tr><th>Kategori</th><th>Amaç</th><th>Varsayılan durum</th></tr></thead><tbody><tr><td>Gerekli</td><td>Sitenin güvenli ve doğru çalışması ile izin tercihlerinin saklanması.</td><td>Her zaman etkin</td></tr><tr><td>İşlevsel</td><td>Dil, görünüm ve benzeri site tercihlerinin hatırlanması.</td><td>İzin verilene kadar kapalı</td></tr><tr><td>Analitik</td><td>Site kullanımını toplu olarak anlamak ve deneyimi geliştirmek.</td><td>İzin verilene kadar kapalı</td></tr><tr><td>Reklamlar</td><td>Reklam gösterimi, performans ölçümü, sıklık yönetimi ve geçersiz trafikle mücadele.</td><td>İzin verilene kadar kapalı</td></tr></tbody></table>

    <h2 id="cookie-declaration">2. Kullanılan çerezler ve izleyiciler</h2>
    <p>Aşağıdaki liste Cookiebot taramasıyla otomatik olarak güncellenir. Çerezin adı, sağlayıcısı, amacı, türü ve saklama süresi burada gösterilir.</p>
    <div class="declaration-shell">${cookieDeclarationScript}</div>

    <h2>3. Tercihlerinizi değiştirme</h2>
    <p>Sayfanın sol altındaki gizlilik düğmesini veya aşağıdaki bağlantıyı kullanarak izin tercihlerinizi istediğiniz zaman değiştirebilir ya da geri çekebilirsiniz.</p>
    <div class="policy-actions"><a class="policy-button" href="#cookie-declaration" data-cookiebot-renew>Çerez tercihlerini aç</a></div>

    <h2>4. Google ve IAB izin sinyalleri</h2>
    <p>Google Consent Mode v2 izinleri başlangıçta reddedilmiş olarak ayarlanır. Analitik ve reklam etiketleri, Cookiebot üzerinden yaptığınız tercihlere göre çalışır. Güvenlik amaçlı depolama her zaman etkin kalır.</p>
    <p>IAB TCF 2.3 kapsamında yalnızca sitede fiilen kullanılması planlanan Google Advertising Products sağlayıcısı kullanıcıya bildirilir. Google Additional Consent sağlayıcıları ve hassas konum ya da aktif cihaz taraması gibi özel özellikler etkin değildir. Maaşım.net, yayıncı olarak IAB TCF politikalarındaki yükümlülüklerini kabul eder.</p>

    <h2>5. Politika güncellemeleri</h2>
    <p>Kullanılan araçlar, sağlayıcılar veya hukuki gereklilikler değiştiğinde bu politika güncellenebilir. Güncel tarih sayfanın üst kısmında gösterilir.</p>
  </article></main>
  <script src="/assets/site-shell.js" defer></script>
</body>
</html>`;

async function walkHtml(dir, output = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await walkHtml(path, output);
    else if (entry.name.endsWith('.html')) output.push(path);
  }
  return output;
}

function injectCookiebot(html) {
  if (html.includes(COOKIEBOT_CONFIGURATION_MARKER) && html.includes(COOKIEBOT_MARKER) && html.includes(CONSENT_MODE_MARKER) && html.includes(COOKIEBOT_HINTS_MARKER)) return html;
  return html.replace(/<head([^>]*)>/i, `<head$1>${cookiebotConnectionHints}${cookiebotConfiguration}${cookiebotScript}${consentModeScript}`);
}

function injectFooterControls(html) {
  if (!html.includes('/cerez-politikasi/')) {
    html = html.replace(/(<a href="\/gizlilik\/">Gizlilik Politikası<\/a>)/i, '$1<a href="/cerez-politikasi/">Çerez Politikası</a>');
  }
  if (!html.includes('data-cookiebot-renew')) {
    html = html.replace(/(<a href="\/cerez-politikasi\/">Çerez Politikası<\/a>)/i, '$1<a href="/cerez-politikasi/#cookie-declaration" data-cookiebot-renew>Çerez Tercihleri</a>');
  }
  return html;
}

export async function applyConsentManagement(dist) {
  const policyDir = join(dist, 'cerez-politikasi');
  await mkdir(policyDir, { recursive: true });
  await writeFile(join(policyDir, 'index.html'), policyHtml);

  const files = await walkHtml(dist);
  for (const path of files) {
    let html = await readFile(path, 'utf8');
    html = injectCookiebot(html);
    html = injectFooterControls(html);
    await writeFile(path, html);
  }

  console.log(`Cookiebot CMP ve bağlantı öncelikleri uygulandı: ${files.length} sayfa`);
}
