const form = document.querySelector('#contact-form');
const status = document.querySelector('#form-status');
const startedAt = document.querySelector('#contact-started-at');

if (startedAt) startedAt.value = String(Date.now());

function track(name, params = {}) {
  if (typeof window.gtag === 'function') window.gtag('event', name, params);
}

function setStatus(message, state = '') {
  if (!status) return;
  status.textContent = message;
  if (state) status.dataset.state = state;
  else delete status.dataset.state;
}

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  setStatus('');

  if (!form.reportValidity()) return;

  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  setStatus('Gönderiliyor…');

  const payload = Object.fromEntries(new FormData(form).entries());

  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'accept': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || 'Mesaj gönderilemedi.');

    form.reset();
    startedAt.value = String(Date.now());
    setStatus('Mesajınız ulaştı. Teşekkür ederiz.', 'success');
    track('generate_lead', { lead_source: 'contact_form', form_name: 'iletisim' });
  } catch (error) {
    setStatus(error.message || 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.', 'error');
    track('contact_form_error', { form_name: 'iletisim' });
  } finally {
    button.disabled = false;
  }
});
