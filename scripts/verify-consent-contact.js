import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const dist = join(process.cwd(), 'dist');

async function walkHtml(dir, output = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await walkHtml(path, output);
    else if (entry.name.endsWith('.html')) output.push(path);
  }
  return output;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const files = await walkHtml(dist);
assert(files.length > 0, 'Dist içinde HTML bulunamadı.');

for (const file of files) {
  const html = await readFile(file, 'utf8');
  const cookieBot = html.indexOf('id="Cookiebot"');
  const consent = html.indexOf('data-maasim-consent-mode');
  const google = html.indexOf('data-maasim-google-tag');
  const header = html.indexOf('data-site-header');
  const main = html.indexOf('<main');
  const footer = html.indexOf('class="site-footer"');

  assert(cookieBot >= 0, `Cookiebot eksik: ${file}`);
  assert(consent >= 0, `Consent Mode eksik: ${file}`);
  assert(google >= 0, `Google tag yükleyicisi eksik: ${file}`);
  assert(cookieBot < consent && consent < google, `İzin/etiket sırası hatalı: ${file}`);
  assert(html.includes("analytics_storage: 'denied'"), `Analitik varsayılan reddi eksik: ${file}`);
  assert(html.includes("ad_storage: 'denied'"), `Reklam varsayılan reddi eksik: ${file}`);
  assert(!html.includes('<script async src="https://www.googletagmanager.com/gtag/js'), `GA4 izinden önce statik yükleniyor: ${file}`);
  assert(!html.includes('<script async src="https://pagead2.googlesyndication.com/pagead/js'), `AdSense izinden önce statik yükleniyor: ${file}`);
  assert(html.includes('Cookiebot?.consent?.statistics'), `GA4 istatistik izni kontrolü eksik: ${file}`);
  assert(html.includes('Cookiebot?.consent?.marketing'), `AdSense pazarlama izni kontrolü eksik: ${file}`);
  assert(html.includes("'maasim-ga4-script'"), `Dinamik GA4 yükleyicisi eksik: ${file}`);
  assert(html.includes("'maasim-adsense-script'"), `Dinamik AdSense yükleyicisi eksik: ${file}`);
  assert(html.includes('CookiebotOnConsentReady'), `İzin hazır olayı eksik: ${file}`);
  assert(html.includes('CookiebotOnDecline'), `İzin geri çekme kontrolü eksik: ${file}`);
  assert(html.includes('window.location.reload()'), `İzin geri çekilince etiket temizleme yenilemesi eksik: ${file}`);
  assert(html.includes('/cerez-politikasi/'), `Çerez politikası bağlantısı eksik: ${file}`);
  assert(html.includes('data-cookiebot-renew'), `Çerez tercihi yenileme kontrolü eksik: ${file}`);
  assert(header >= 0 && main >= 0 && footer >= 0, `Ortak sayfa kabuğu eksik: ${file}`);
  assert(header < main && main < footer, `Header/main/footer sırası hatalı: ${file}`);
  assert(html.slice(0, 1024).includes('<meta charset="utf-8">'), `Charset ilk 1024 baytta değil: ${file}`);
}

const home = await readFile(join(dist, 'index.html'), 'utf8');
assert(!/<h3[^>]*id=["']stat-(?:high-net|low-net)["']/i.test(home), 'Kalan metrik değerleri başlık etiketi kullanıyor.');
assert(home.includes('Bu Sayfadaki Maaş Terimleri'), 'Aynı adlı sözlük bağlantıları ayrıştırılmadı.');

const styles = await readFile(join(dist, 'assets', 'styles.css'), 'utf8');
assert(styles.includes('Erişilebilirlik kontrast düzeltmeleri'), 'Kontrast düzeltmeleri eksik.');

const contact = await readFile(join(dist, 'iletisim', 'index.html'), 'utf8');
assert(contact.includes('id="contact-form"'), 'İletişim formu eksik.');
assert(contact.includes('name="privacyConsent"'), 'İletişim formu KVKK/gizlilik onayı eksik.');
assert(contact.includes('name="company"'), 'İletişim formu honeypot alanı eksik.');
assert(contact.includes('/assets/contact-form.js'), 'İletişim formu istemci kodu eksik.');

const contactClient = await readFile(join(dist, 'assets', 'contact-form.js'), 'utf8');
assert(contactClient.includes("fetch('/api/contact'"), 'İletişim API bağlantısı eksik.');
assert(contactClient.includes('generate_lead'), 'İletişim formu GA4 başarı olayı eksik.');
assert(contactClient.includes('Cookiebot?.consent?.statistics'), 'İletişim event izin kontrolü eksik.');

const siteShell = await readFile(join(dist, 'assets', 'site-shell.js'), 'utf8');
assert(siteShell.includes('blog_cta_clicked'), 'Blog CTA ölçümü eksik.');
assert(siteShell.includes('CookiebotOnAccept'), 'İzin sonrası ölçüm yenilemesi eksik.');
assert(siteShell.includes('Cookiebot?.consent?.statistics'), 'Ortak analitik izin kontrolü eksik.');

const worker = await readFile(join(process.cwd(), 'src', 'worker.js'), 'utf8');
for (const header of [
  'strict-transport-security',
  'x-frame-options',
  'x-content-type-options',
  'referrer-policy',
  'permissions-policy',
  'cross-origin-opener-policy'
]) assert(worker.includes(`'${header}'`), `Güvenlik başlığı eksik: ${header}`);
assert(worker.includes('withSecurityHeaders(await env.ASSETS.fetch(request))'), 'Statik yanıtlara güvenlik başlıkları uygulanmıyor.');

console.log(`Basic Consent Mode, erişilebilirlik, güvenlik başlıkları, iletişim ve analitik doğrulaması başarılı: ${files.length} HTML sayfası.`);
