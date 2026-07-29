import { connect } from 'cloudflare:sockets';

const SUBJECTS = Object.freeze({
  general: 'Genel soru',
  calculation: 'Hesaplama veya teknik hata',
  content: 'İçerik düzeltme talebi',
  partnership: 'İş birliği',
  other: 'Diğer'
});

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store'
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function isEmail(value) {
  return value.length <= 160
    && !/[\r\n]/.test(value)
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validatePayload(payload) {
  const name = cleanText(payload.name);
  const email = cleanText(payload.email).toLowerCase();
  const subjectKey = cleanText(payload.subject);
  const message = cleanText(payload.message);
  const privacyAccepted = payload.privacy === true || payload.privacy === 'on';
  const website = cleanText(payload.website);
  const startedAt = Number(payload.startedAt || 0);

  if (website) return { bot: true };

  if (!Number.isFinite(startedAt) || startedAt <= 0 || Date.now() - startedAt < 2500) {
    return { error: 'Form çok hızlı gönderildi. Lütfen birkaç saniye sonra tekrar deneyin.' };
  }

  if (name.length < 2 || name.length > 100) {
    return { error: 'Lütfen geçerli bir ad soyad girin.' };
  }

  if (!isEmail(email)) {
    return { error: 'Lütfen geçerli bir e-posta adresi girin.' };
  }

  if (!Object.hasOwn(SUBJECTS, subjectKey)) {
    return { error: 'Lütfen bir konu seçin.' };
  }

  if (message.length < 10 || message.length > 4000) {
    return { error: 'Mesajınız 10 ile 4.000 karakter arasında olmalıdır.' };
  }

  if (!privacyAccepted) {
    return { error: 'Bilgilendirme onayını işaretlemeniz gerekiyor.' };
  }

  return {
    data: {
      name,
      email,
      subject: SUBJECTS[subjectKey],
      message
    }
  };
}

function sanitizeMailbox(value, label) {
  const mailbox = cleanText(value);
  if (!isEmail(mailbox)) {
    throw new Error(`${label} geçerli bir e-posta adresi değil.`);
  }
  return mailbox;
}

function sanitizeHeader(value) {
  return cleanText(value).replace(/[\r\n]+/g, ' ');
}

function base64Encode(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  const chunkSize = 0x8000;

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }

  return btoa(binary);
}

function encodeHeader(value) {
  return `=?UTF-8?B?${base64Encode(sanitizeHeader(value))}?=`;
}

function wrapBase64(value) {
  return base64Encode(value).match(/.{1,76}/g)?.join('\r\n') || '';
}

function createResponseReader(readable) {
  const reader = readable.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  return {
    async read() {
      while (true) {
        const lines = buffer.split('\r\n');

        for (let index = 0; index < lines.length - 1; index += 1) {
          if (/^\d{3} /.test(lines[index])) {
            const response = lines.slice(0, index + 1).join('\r\n');
            buffer = lines.slice(index + 1).join('\r\n');
            return response;
          }
        }

        const chunk = await reader.read();
        if (chunk.done) {
          throw new Error('SMTP bağlantısı beklenmedik şekilde kapandı.');
        }
        buffer += decoder.decode(chunk.value, { stream: true });
      }
    },
    release() {
      reader.releaseLock();
    }
  };
}

function expectCode(response, allowedCodes) {
  const code = Number(response.slice(0, 3));
  if (!allowedCodes.includes(code)) {
    throw new Error(`SMTP beklenmeyen yanıt verdi: ${code || 'bilinmiyor'}`);
  }
}

function buildMessage({ fromAddress, toAddress, fromName, replyName, replyEmail, subject, message }) {
  const body = [
    'Maaşım.net iletişim formundan yeni mesaj',
    '',
    `Ad Soyad: ${replyName}`,
    `E-posta: ${replyEmail}`,
    `Konu: ${subject}`,
    `Tarih: ${new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })}`,
    '',
    'Mesaj:',
    message
  ].join('\r\n');

  const headers = [
    `From: ${encodeHeader(fromName)} <${fromAddress}>`,
    `To: <${toAddress}>`,
    `Reply-To: ${encodeHeader(replyName)} <${replyEmail}>`,
    `Subject: ${encodeHeader(`[Maaşım.net] ${subject}`)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${crypto.randomUUID()}@maasim.net>`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64'
  ];

  return `${headers.join('\r\n')}\r\n\r\n${wrapBase64(body)}\r\n`;
}

async function sendSmtpMail(env, formData) {
  const username = sanitizeMailbox(env.SMTP_USERNAME, 'SMTP_USERNAME');
  const password = cleanText(env.SMTP_PASSWORD);
  const toAddress = sanitizeMailbox(env.CONTACT_TO || username, 'CONTACT_TO');
  const hostname = cleanText(env.SMTP_HOST) || 'mail.privateemail.com';
  const port = Number(env.SMTP_PORT || 465);
  const fromName = sanitizeHeader(env.SMTP_FROM_NAME || 'Maaşım.net İletişim Formu');

  if (!password) {
    throw new Error('SMTP_PASSWORD tanımlı değil.');
  }

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('SMTP_PORT geçersiz.');
  }

  const socket = connect({ hostname, port }, { secureTransport: 'on' });
  await socket.opened;

  const reader = createResponseReader(socket.readable);
  const writer = socket.writable.getWriter();
  const encoder = new TextEncoder();

  const writeLine = async (value) => {
    await writer.write(encoder.encode(`${value}\r\n`));
  };

  try {
    expectCode(await reader.read(), [220]);

    await writeLine('EHLO maasim.net');
    expectCode(await reader.read(), [250]);

    await writeLine('AUTH LOGIN');
    expectCode(await reader.read(), [334]);

    await writeLine(base64Encode(username));
    expectCode(await reader.read(), [334]);

    await writeLine(base64Encode(password));
    expectCode(await reader.read(), [235]);

    await writeLine(`MAIL FROM:<${username}>`);
    expectCode(await reader.read(), [250]);

    await writeLine(`RCPT TO:<${toAddress}>`);
    expectCode(await reader.read(), [250, 251]);

    await writeLine('DATA');
    expectCode(await reader.read(), [354]);

    const emailMessage = buildMessage({
      fromAddress: username,
      toAddress,
      fromName,
      replyName: formData.name,
      replyEmail: formData.email,
      subject: formData.subject,
      message: formData.message
    });

    const dotStuffed = emailMessage.replace(/(^|\r\n)\./g, '$1..');
    await writer.write(encoder.encode(`${dotStuffed}.\r\n`));
    expectCode(await reader.read(), [250]);

    await writeLine('QUIT');
    expectCode(await reader.read(), [221]);
  } finally {
    reader.release();
    writer.releaseLock();
    await socket.close().catch(() => {});
  }
}

async function withTimeout(promise, milliseconds) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('SMTP işlemi zaman aşımına uğradı.')), milliseconds);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function handleContactRequest(request, env) {
  if (request.method !== 'POST') {
    return json({ message: 'Yalnızca POST isteği desteklenir.' }, 405);
  }

  const requestUrl = new URL(request.url);
  const origin = request.headers.get('Origin');

  if (origin) {
    try {
      if (new URL(origin).host !== requestUrl.host) {
        return json({ message: 'Geçersiz istek kaynağı.' }, 403);
      }
    } catch {
      return json({ message: 'Geçersiz istek kaynağı.' }, 403);
    }
  }

  const contentType = request.headers.get('Content-Type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return json({ message: 'Geçersiz içerik türü.' }, 415);
  }

  const contentLength = Number(request.headers.get('Content-Length') || 0);
  if (contentLength > 20_000) {
    return json({ message: 'İstek boyutu çok büyük.' }, 413);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ message: 'Form verisi okunamadı.' }, 400);
  }

  const validation = validatePayload(payload || {});

  if (validation.bot) {
    return json({ ok: true });
  }

  if (validation.error) {
    return json({ message: validation.error }, 400);
  }

  try {
    await withTimeout(sendSmtpMail(env, validation.data), 15_000);
    return json({ ok: true });
  } catch (error) {
    console.error('contact_form_send_failed', error instanceof Error ? error.message : 'unknown_error');
    return json({ message: 'Mesaj şu anda iletilemedi. Lütfen daha sonra tekrar deneyin.' }, 502);
  }
}
