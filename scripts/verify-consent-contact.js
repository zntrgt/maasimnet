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
  assert(google >= 0, `Google tag eksik: ${file}`);
  assert(cookieBot < consent && consent < google, `İzin/etiket sırası hatalı: ${file}`);
  assert(html.includes("analytics_storage: 'denied'"), `Analitik varsayılan reddi eksik: ${file}`);
  assert(html.includes("ad_storage: 'denied'"), `Reklam varsayılan reddi eksik: ${file}`);
  assert(html.includes('/cerez-politikasi/'), `Çerez politikası bağlantısı eksik: ${file}`);
  assert(html.includes('data-cookiebot-renew'), `Çerez tercihi yenileme kontrolü eksik: ${file}`);
  assert(header >= 0 && main >= 0 && footer >= 0, `Ortak sayfa kabuğu eksik: ${file}`);
  assert(header < main && main < footer, `Header/main/footer sırası hatalı: ${file}`);
}

const contact = await readFile(join(dist, 'iletisim', 'index.html'), 'utf8');
assert(contact.includes('id="contact-form"'), 'İletişim formu eksik.');
assert(contact.includes('name="privacyConsent"'), 'İletişim formu KVKK/gizlilik onayı eksik.');
assert(contact.includes('name="company"'), 'İletişim formu honeypot alanı eksik.');
assert(contact.includes('/assets/contact-form.js'), 'İletişim formu istemci kodu eksik.');

const contactClient = await readFile(join(dist, 'assets', 'contact-form.js'), 'utf8');
assert(contactClient.includes("fetch('/api/contact'"), 'İletişim API bağlantısı eksik.');
assert(contactClient.includes('generate_lead'), 'İletişim formu GA4 başarı olayı eksik.');

console.log(`İzin, ortak kabuk ve iletişim doğrulaması başarılı: ${files.length} HTML sayfası.`);
