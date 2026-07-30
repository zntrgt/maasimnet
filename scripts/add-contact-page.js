import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const page = `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>İletişim | Maaşım.net</title>
  <meta name="description" content="Maaşım.net ile hesaplama, içerik, veri doğruluğu ve iş birliği konularında iletişime geçin.">
  <link rel="canonical" href="https://maasim.net/iletisim/">
  <meta name="robots" content="index,follow">
  <style>
    :root{font-family:Inter,ui-sans-serif,system-ui,sans-serif;color:#0f172a;background:#f8fafc}*{box-sizing:border-box}body{margin:0}.contact-shell{width:min(1080px,calc(100% - 32px));margin:0 auto;padding:56px 0 84px}.contact-grid{display:grid;grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr);gap:38px;align-items:start}.contact-copy{padding:18px 4px}.eyebrow{display:inline-flex;padding:7px 11px;border-radius:999px;background:#ccfbf1;color:#115e59;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.08em}h1{font-size:clamp(38px,6vw,64px);line-height:1.02;letter-spacing:-.055em;margin:18px 0;color:#0f2747}.lead{font-size:18px;line-height:1.7;color:#475569}.contact-points{display:grid;gap:13px;margin-top:30px}.contact-point{padding:16px 18px;border:1px solid #e2e8f0;border-radius:16px;background:#fff}.contact-point strong{display:block;margin-bottom:5px;color:#0f2747}.contact-point span{font-size:14px;line-height:1.55;color:#64748b}.contact-card{padding:clamp(22px,4vw,38px);border:1px solid #dbe4ee;border-radius:24px;background:#fff;box-shadow:0 22px 70px rgba(15,39,71,.09)}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}.field{display:grid;gap:7px}.field--wide{grid-column:1/-1}label{font-size:13px;font-weight:850;color:#334155}input,select,textarea{width:100%;border:1px solid #cbd5e1;border-radius:12px;background:#fff;padding:13px 14px;font:inherit;color:#0f172a;outline:none;transition:border-color .15s,box-shadow .15s}input:focus,select:focus,textarea:focus{border-color:#0d9488;box-shadow:0 0 0 3px rgba(13,148,136,.13)}textarea{min-height:170px;resize:vertical}.consent{display:flex;align-items:flex-start;gap:10px;margin:3px 0}.consent input{width:18px;height:18px;margin-top:2px}.consent label{font-weight:600;line-height:1.5;color:#475569}.consent a{color:#0f766e}.submit-row{display:flex;align-items:center;gap:14px;flex-wrap:wrap}.submit-button{min-height:48px;border:0;border-radius:12px;padding:0 20px;background:#0f2747;color:#fff;font:inherit;font-weight:900;cursor:pointer}.submit-button:hover{background:#0d9488}.submit-button:disabled{opacity:.6;cursor:wait}.form-status{font-size:14px;font-weight:750}.form-status[data-state="success"]{color:#047857}.form-status[data-state="error"]{color:#b91c1c}.hp-field{position:absolute!important;left:-10000px!important;width:1px!important;height:1px!important;overflow:hidden!important}.privacy-note{margin-top:18px;font-size:12px;line-height:1.6;color:#64748b}@media(max-width:820px){.contact-grid{grid-template-columns:1fr}.contact-copy{padding:0}.form-grid{grid-template-columns:1fr}.field--wide{grid-column:auto}}@media(max-width:520px){.contact-shell{width:min(100% - 22px,1080px);padding-top:34px}.contact-card{border-radius:18px;padding:20px}}
  </style>
</head>
<body>
  <main class="contact-shell">
    <div class="contact-grid">
      <section class="contact-copy">
        <span class="eyebrow">İletişim</span>
        <h1>Nasıl yardımcı olabiliriz?</h1>
        <p class="lead">Hesaplama sonuçları, içeriklerdeki veriler, teknik sorunlar veya iş birliği talepleri için bize yazabilirsiniz.</p>
        <div class="contact-points">
          <div class="contact-point"><strong>Doğrudan e-posta</strong><span><a href="mailto:iletisim@maasim.net">iletisim@maasim.net</a></span></div>
          <div class="contact-point"><strong>Veri düzeltme bildirimi</strong><span>İlgili sayfanın adresini ve hatalı gördüğünüz değeri mesajınıza ekleyin.</span></div>
          <div class="contact-point"><strong>Yanıt süresi</strong><span>Mesajları iş günlerinde mümkün olan en kısa sürede inceliyoruz.</span></div>
        </div>
      </section>
      <section class="contact-card" aria-labelledby="contact-form-title">
        <h2 id="contact-form-title">Mesaj gönder</h2>
        <form id="contact-form" novalidate>
          <input type="hidden" name="startedAt" id="contact-started-at">
          <div class="hp-field" aria-hidden="true"><label for="company">Şirket</label><input id="company" name="company" tabindex="-1" autocomplete="off"></div>
          <div class="form-grid">
            <div class="field"><label for="name">Ad soyad</label><input id="name" name="name" maxlength="100" autocomplete="name" required></div>
            <div class="field"><label for="email">E-posta</label><input id="email" name="email" type="email" maxlength="160" autocomplete="email" required></div>
            <div class="field field--wide"><label for="subject">Konu</label><select id="subject" name="subject" required><option value="">Seçin</option><option>Hesaplama sonucu</option><option>İçerik veya veri düzeltme</option><option>Teknik sorun</option><option>İş birliği</option><option>Diğer</option></select></div>
            <div class="field field--wide"><label for="message">Mesaj</label><textarea id="message" name="message" minlength="20" maxlength="5000" required></textarea></div>
            <div class="field field--wide consent"><input id="privacy-consent" name="privacyConsent" type="checkbox" value="accepted" required><label for="privacy-consent"><a href="/gizlilik/" target="_blank" rel="noopener">Gizlilik Politikası</a> kapsamında mesajımın yanıtlanması amacıyla verdiğim iletişim bilgilerinin işlenmesini kabul ediyorum.</label></div>
            <div class="field field--wide submit-row"><button class="submit-button" type="submit">Mesajı gönder</button><span id="form-status" class="form-status" role="status" aria-live="polite"></span></div>
          </div>
        </form>
        <p class="privacy-note">Form verileri yalnızca talebinizi yanıtlamak ve kötüye kullanımı önlemek amacıyla işlenir. Hassas kişisel veri, parola veya kimlik belgesi göndermeyin.</p>
      </section>
    </div>
  </main>
  <script type="module" src="/assets/contact-form.js"></script>
</body>
</html>`;

export async function addContactPage(dist) {
  const dir = join(dist, 'iletisim');
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'index.html'), page);
  console.log('İletişim sayfası üretildi');
}
