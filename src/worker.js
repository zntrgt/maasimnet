import { connect } from 'cloudflare:sockets';

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 5;
const rateBuckets = new Map();

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff'
  }
});

function clean(value, max) {
  return String(value || '').trim().replace(/\r/g, '').slice(0, max);
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && !/[\r\n]/.test(value);
}

function rateAllowed(ip) {
  const now = Date.now();
  const bucket = (rateBuckets.get(ip) || []).filter((stamp) => now - stamp < RATE_WINDOW_MS);
  if (bucket.length >= RATE_LIMIT) return false;
  bucket.push(now);
  rateBuckets.set(ip, bucket);
  return true;
}

function encodeHeader(value) {
  return `=?UTF-8?B?${btoa(unescape(encodeURIComponent(value)))}?=`;
}

function base64Utf8(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const encoded = btoa(binary);
  return encoded.match(/.{1,76}/g)?.join('\r\n') || '';
}

function escapeHtml(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function sendSmtp(env, payload) {
  if (!env.SMTP_PASSWORD) throw new Error('SMTP_SECRET_MISSING');

  const host = env.SMTP_HOST || 'mail.privateemail.com';
  const port = Number(env.SMTP_PORT || 465);
  const username = env.SMTP_USERNAME || 'iletisim@maasim.net';
  const recipient = env.CONTACT_RECIPIENT || username;
  const socket = connect({ hostname: host, port }, { secureTransport: 'on', allowHalfOpen: false });
  const writer = socket.writable.getWriter();
  const reader = socket.readable.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';

  async function readResponse(expected) {
    while (true) {
      const { value, done } = await reader.read();
      if (done) throw new Error('SMTP_CONNECTION_CLOSED');
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || '';
      for (const line of lines) {
        const match = line.match(/^(\d{3})([ -])/);
        if (!match || match[2] !== ' ') continue;
        const code = Number(match[1]);
        const accepted = Array.isArray(expected) ? expected : [expected];
        if (!accepted.includes(code)) throw new Error(`SMTP_${code}`);
        return line;
      }
    }
  }

  async function command(value, expected) {
    await writer.write(encoder.encode(`${value}\r\n`));
    return readResponse(expected);
  }

  const boundary = `maasim-${crypto.randomUUID()}`;
  const plain = `Maaşım.net iletişim formu\n\nAd soyad: ${payload.name}\nE-posta: ${payload.email}\nKonu: ${payload.subject}\n\nMesaj:\n${payload.message}\n\nGönderim zamanı: ${new Date().toISOString()}`;
  const html = `<h2>Maaşım.net iletişim formu</h2><p><strong>Ad soyad:</strong> ${escapeHtml(payload.name)}</p><p><strong>E-posta:</strong> ${escapeHtml(payload.email)}</p><p><strong>Konu:</strong> ${escapeHtml(payload.subject)}</p><hr><p style="white-space:pre-wrap">${escapeHtml(payload.message)}</p>`;
  const message = [
    `From: ${encodeHeader('Maaşım.net İletişim Formu')} <${username}>`,
    `To: <${recipient}>`,
    `Reply-To: <${payload.email}>`,
    `Subject: ${encodeHeader(`[Maaşım.net] ${payload.subject}`)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${crypto.randomUUID()}@maasim.net>`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    base64Utf8(plain),
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    base64Utf8(html),
    `--${boundary}--`,
    ''
  ].join('\r\n');

  try {
    await readResponse(220);
    await command('EHLO maasim.net', 250);
    await command('AUTH LOGIN', 334);
    await command(btoa(username), 334);
    await command(btoa(env.SMTP_PASSWORD), 235);
    await command(`MAIL FROM:<${username}>`, 250);
    await command(`RCPT TO:<${recipient}>`, [250, 251]);
    await command('DATA', 354);
    await writer.write(encoder.encode(`${message}\r\n.\r\n`));
    await readResponse(250);
    await command('QUIT', 221).catch(() => {});
  } finally {
    writer.releaseLock();
    reader.releaseLock();
    socket.close();
  }
}

async function handleContact(request, env) {
  if (request.method !== 'POST') return json({ message: 'Yalnızca POST desteklenir.' }, 405);
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > 20_000) return json({ message: 'İstek çok büyük.' }, 413);

  const origin = request.headers.get('origin');
  if (origin && new URL(origin).hostname !== new URL(request.url).hostname) return json({ message: 'Geçersiz kaynak.' }, 403);

  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  if (!rateAllowed(ip)) return json({ message: 'Çok fazla deneme yapıldı. Birkaç dakika sonra tekrar deneyin.' }, 429);

  let body;
  try { body = await request.json(); } catch { return json({ message: 'Geçersiz form verisi.' }, 400); }

  const payload = {
    name: clean(body.name, 100),
    email: clean(body.email, 160),
    subject: clean(body.subject, 120),
    message: clean(body.message, 5000),
    company: clean(body.company, 120),
    privacyConsent: clean(body.privacyConsent, 20),
    startedAt: Number(body.startedAt || 0)
  };

  if (payload.company) return json({ ok: true });
  const elapsed = Date.now() - payload.startedAt;
  if (!payload.startedAt || elapsed < 3000 || elapsed > 2 * 60 * 60 * 1000) return json({ message: 'Form süresi doğrulanamadı. Sayfayı yenileyip tekrar deneyin.' }, 400);
  if (payload.name.length < 2 || !validEmail(payload.email) || payload.subject.length < 2 || payload.message.length < 20 || payload.privacyConsent !== 'accepted') {
    return json({ message: 'Lütfen zorunlu alanları geçerli biçimde doldurun.' }, 400);
  }

  try {
    await sendSmtp(env, payload);
    return json({ ok: true });
  } catch (error) {
    console.error('contact_send_failed', error?.message || error);
    return json({ message: 'Mesaj şu anda gönderilemedi. Lütfen iletisim@maasim.net adresine e-posta gönderin.' }, 502);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/contact') return handleContact(request, env);
    return env.ASSETS.fetch(request);
  }
};
