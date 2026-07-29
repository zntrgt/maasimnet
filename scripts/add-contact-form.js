import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const FORM_MARKER = 'data-maasim-contact-form';

const formSection = `
<section class="contact-form-section" aria-labelledby="contact-form-title">
  <div class="contact-form-shell">
    <div class="contact-form-intro">
      <span class="contact-form-eyebrow">İLETİŞİM</span>
      <h2 id="contact-form-title">Mesajınızı bize iletin</h2>
      <p>Soru, düzeltme talebi, hesaplama bildirimi veya iş birliği öneriniz için formu doldurun. Bilgileriniz yalnızca talebinize yanıt vermek amacıyla kullanılır.</p>
    </div>

    <form class="contact-form-card" data-maasim-contact-form novalidate>
      <div class="contact-form-grid">
        <div class="contact-field">
          <label for="contact-name">Ad Soyad</label>
          <input id="contact-name" name="name" type="text" autocomplete="name" minlength="2" maxlength="100" required>
        </div>

        <div class="contact-field">
          <label for="contact-email">E-posta Adresi</label>
          <input id="contact-email" name="email" type="email" autocomplete="email" maxlength="160" required>
        </div>
      </div>

      <div class="contact-field">
        <label for="contact-subject">Konu</label>
        <select id="contact-subject" name="subject" required>
          <option value="">Konu seçin</option>
          <option value="general">Genel soru</option>
          <option value="calculation">Hesaplama veya teknik hata</option>
          <option value="content">İçerik düzeltme talebi</option>
          <option value="partnership">İş birliği</option>
          <option value="other">Diğer</option>
        </select>
      </div>

      <div class="contact-field">
        <label for="contact-message">Mesajınız</label>
        <textarea id="contact-message" name="message" rows="7" minlength="10" maxlength="4000" required></textarea>
        <span class="contact-field-hint">Lütfen kişisel finansal bilgilerinizi, T.C. kimlik numaranızı veya bordro belgenizi paylaşmayın.</span>
      </div>

      <div class="contact-honeypot" aria-hidden="true">
        <label for="contact-website">Web sitesi</label>
        <input id="contact-website" name="website" type="text" tabindex="-1" autocomplete="off">
      </div>

      <input name="startedAt" type="hidden" value="">

      <label class="contact-privacy">
        <input name="privacy" type="checkbox" required>
        <span>Paylaştığım bilgilerin talebime yanıt verilmesi amacıyla işleneceğine ilişkin bilgilendirmeyi okudum.</span>
      </label>

      <div class="contact-form-actions">
        <button class="contact-submit" type="submit">
          <span data-contact-button-label>Mesajı Gönder</span>
          <span class="contact-spinner" aria-hidden="true"></span>
        </button>
        <p class="contact-form-status" data-contact-status role="status" aria-live="polite"></p>
      </div>
    </form>
  </div>
</section>`;

const contactStyles = `
.contact-form-section {
  padding: 4rem 1.25rem 5rem;
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
}

.contact-form-shell {
  width: min(1120px, 100%);
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
  gap: 3rem;
  align-items: start;
}

.contact-form-intro {
  padding-top: 1rem;
}

.contact-form-eyebrow {
  display: inline-flex;
  margin-bottom: 1rem;
  color: #0f766e;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.14em;
}

.contact-form-intro h2 {
  margin: 0;
  color: #0f172a;
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1.08;
  letter-spacing: -0.04em;
}

.contact-form-intro p {
  margin: 1.25rem 0 0;
  max-width: 34rem;
  color: #475569;
  font-size: 1rem;
  line-height: 1.75;
}

.contact-form-card {
  position: relative;
  padding: clamp(1.25rem, 3vw, 2rem);
  border: 1px solid #e2e8f0;
  border-radius: 1.5rem;
  background: #ffffff;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.08);
}

.contact-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.contact-field {
  display: grid;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.contact-field label {
  color: #1e293b;
  font-size: 0.875rem;
  font-weight: 750;
}

.contact-field input,
.contact-field select,
.contact-field textarea {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 0.85rem;
  background: #ffffff;
  color: #0f172a;
  font: inherit;
  line-height: 1.4;
  transition: border-color 160ms ease, box-shadow 160ms ease;
}

.contact-field input,
.contact-field select {
  min-height: 3.25rem;
  padding: 0 0.9rem;
}

.contact-field textarea {
  min-height: 10rem;
  padding: 0.9rem;
  resize: vertical;
}

.contact-field input:focus,
.contact-field select:focus,
.contact-field textarea:focus {
  outline: none;
  border-color: #0f766e;
  box-shadow: 0 0 0 4px rgba(15, 118, 110, 0.12);
}

.contact-field-hint {
  color: #64748b;
  font-size: 0.75rem;
  line-height: 1.45;
}

.contact-privacy {
  display: flex;
  gap: 0.7rem;
  align-items: flex-start;
  color: #475569;
  font-size: 0.78rem;
  line-height: 1.5;
  cursor: pointer;
}

.contact-privacy input {
  width: 1rem;
  height: 1rem;
  margin-top: 0.15rem;
  accent-color: #0f766e;
  flex: 0 0 auto;
}

.contact-form-actions {
  margin-top: 1.35rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.contact-submit {
  min-height: 3.25rem;
  padding: 0 1.35rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  border: 0;
  border-radius: 0.9rem;
  background: #0f766e;
  color: #ffffff;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
  transition: transform 160ms ease, background 160ms ease, opacity 160ms ease;
}

.contact-submit:hover {
  background: #115e59;
  transform: translateY(-1px);
}

.contact-submit:disabled {
  cursor: wait;
  opacity: 0.7;
  transform: none;
}

.contact-spinner {
  width: 1rem;
  height: 1rem;
  display: none;
  border: 2px solid rgba(255, 255, 255, 0.45);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: contact-spin 700ms linear infinite;
}

.contact-submit.is-loading .contact-spinner {
  display: inline-block;
}

.contact-form-status {
  min-height: 1.4rem;
  margin: 0;
  color: #475569;
  font-size: 0.85rem;
  font-weight: 650;
}

.contact-form-status.is-success {
  color: #047857;
}

.contact-form-status.is-error {
  color: #b91c1c;
}

.contact-honeypot {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  overflow: hidden !important;
  clip: rect(0 0 0 0) !important;
  white-space: nowrap !important;
}

@keyframes contact-spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 820px) {
  .contact-form-section {
    padding: 3rem 1rem 4rem;
  }

  .contact-form-shell {
    grid-template-columns: 1fr;
    gap: 1.75rem;
  }

  .contact-form-intro {
    padding-top: 0;
  }
}

@media (max-width: 560px) {
  .contact-form-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .contact-form-card {
    border-radius: 1.15rem;
  }

  .contact-submit {
    width: 100%;
  }
}
`;

const contactScript = `
(() => {
  const form = document.querySelector('[data-maasim-contact-form]');
  if (!form) return;

  const status = form.querySelector('[data-contact-status]');
  const button = form.querySelector('button[type="submit"]');
  const buttonLabel = form.querySelector('[data-contact-button-label]');
  const startedAt = form.elements.startedAt;

  const resetStartedAt = () => {
    startedAt.value = String(Date.now());
  };

  const setStatus = (message, type = '') => {
    status.textContent = message;
    status.className = 'contact-form-status' + (type ? ' is-' + type : '');
  };

  resetStartedAt();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    setStatus('');

    if (!form.reportValidity()) return;

    const payload = Object.fromEntries(new FormData(form).entries());
    payload.startedAt = Number(payload.startedAt || 0);

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);

    button.disabled = true;
    button.classList.add('is-loading');
    buttonLabel.textContent = 'Gönderiliyor';

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.message || 'Mesaj gönderilemedi.');
      }

      form.reset();
      resetStartedAt();
      setStatus('Mesajınız başarıyla iletildi. En kısa sürede dönüş yapacağız.', 'success');
    } catch (error) {
      const message = error && error.name === 'AbortError'
        ? 'İşlem zaman aşımına uğradı. Lütfen tekrar deneyin.'
        : (error && error.message) || 'Mesaj gönderilemedi. Lütfen tekrar deneyin.';
      setStatus(message, 'error');
    } finally {
      window.clearTimeout(timeout);
      button.disabled = false;
      button.classList.remove('is-loading');
      buttonLabel.textContent = 'Mesajı Gönder';
    }
  });
})();
`;

function injectBefore(html, closingTag, addition, label) {
  if (!html.includes(closingTag)) {
    throw new Error(`İletişim formu eklenemedi: ${label} bulunamadı.`);
  }
  return html.replace(closingTag, `${addition}\n${closingTag}`);
}

export async function addContactForm(distDir) {
  const pagePath = join(distDir, 'iletisim', 'index.html');
  const assetsDir = join(distDir, 'assets');
  let html = await readFile(pagePath, 'utf8');

  if (!html.includes(FORM_MARKER)) {
    html = injectBefore(
      html,
      html.includes('</main>') ? '</main>' : '</body>',
      formSection,
      'sayfa kapanış etiketi'
    );
    html = injectBefore(
      html,
      '</head>',
      '<link rel="stylesheet" href="/assets/contact-form.css">',
      'head kapanış etiketi'
    );
    html = injectBefore(
      html,
      '</body>',
      '<script src="/assets/contact-form.js" defer></script>',
      'body kapanış etiketi'
    );
  }

  await mkdir(assetsDir, { recursive: true });
  await Promise.all([
    writeFile(pagePath, html),
    writeFile(join(assetsDir, 'contact-form.css'), contactStyles.trimStart()),
    writeFile(join(assetsDir, 'contact-form.js'), contactScript.trimStart())
  ]);
}
