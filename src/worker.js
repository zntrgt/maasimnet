const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 5;
const rateBuckets = new Map();

const SECURITY_HEADERS = Object.freeze({
  'strict-transport-security': 'max-age=2592000; includeSubDomains',
  'x-frame-options': 'DENY',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'cross-origin-opener-policy': 'same-origin'
});

function withSecurityHeaders(response) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) headers.set(name, value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

const json = (body, status = 200) => withSecurityHeaders(new Response(JSON.stringify(body), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  }
}));

function clean(value, max) {
  return String(value || '').trim().replace(/\r/g, '').slice(0, max);
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && !/[\r\n]/.test(value);
}

function recentSubmissions(ip) {
  const now = Date.now();
  const bucket = (rateBuckets.get(ip) || []).filter((stamp) => now - stamp < RATE_WINDOW_MS);
  if (bucket.length) rateBuckets.set(ip, bucket);
  else rateBuckets.delete(ip);
  return bucket;
}

function rateAllowed(ip) {
  return recentSubmissions(ip).length < RATE_LIMIT;
}

function recordSuccessfulSubmission(ip) {
  const bucket = recentSubmissions(ip);
  bucket.push(Date.now());
  rateBuckets.set(ip, bucket);
}

async function saveToGoogleSheets(env, payload, request) {
  if (!env.GOOGLE_SHEETS_WEBHOOK_URL || !env.FORM_WEBHOOK_SECRET) {
    throw new Error('GOOGLE_SHEETS_CONFIG_MISSING');
  }

  const response = await fetch(env.GOOGLE_SHEETS_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      secret: env.FORM_WEBHOOK_SECRET,
      name: payload.name,
      email: payload.email,
      subject: payload.subject,
      message: payload.message,
      source: '/iletisim/',
      country: request.cf?.country || ''
    }),
    redirect: 'follow'
  });

  if (!response.ok) throw new Error(`GOOGLE_SHEETS_HTTP_${response.status}`);

  const result = await response.json().catch(() => null);
  if (!result?.ok) throw new Error(`GOOGLE_SHEETS_REJECTED_${result?.error || 'unknown'}`);
}

async function handleContact(request, env) {
  if (request.method !== 'POST') return json({ message: 'Yalnızca POST desteklenir.' }, 405);

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > 20_000) return json({ message: 'İstek çok büyük.' }, 413);

  const origin = request.headers.get('origin');
  if (origin && new URL(origin).hostname !== new URL(request.url).hostname) {
    return json({ message: 'Geçersiz kaynak.' }, 403);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ message: 'Geçersiz form verisi.' }, 400);
  }

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
  if (!payload.startedAt || elapsed < 3000 || elapsed > 2 * 60 * 60 * 1000) {
    return json({ message: 'Form süresi doğrulanamadı. Sayfayı yenileyip tekrar deneyin.' }, 400);
  }

  if (
    payload.name.length < 2 ||
    !validEmail(payload.email) ||
    payload.subject.length < 2 ||
    payload.message.length < 20 ||
    payload.privacyConsent !== 'accepted'
  ) {
    return json({ message: 'Lütfen zorunlu alanları geçerli biçimde doldurun.' }, 400);
  }

  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  if (!rateAllowed(ip)) {
    return json({ message: 'Çok fazla başarılı gönderim yapıldı. Birkaç dakika sonra tekrar deneyin.' }, 429);
  }

  try {
    await saveToGoogleSheets(env, payload, request);
    recordSuccessfulSubmission(ip);
    return json({ ok: true });
  } catch (error) {
    console.error('contact_sheet_save_failed', error?.message || error);
    return json({ message: 'Mesaj şu anda kaydedilemedi. Lütfen daha sonra tekrar deneyin.' }, 502);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/contact') return handleContact(request, env);
    return withSecurityHeaders(await env.ASSETS.fetch(request));
  }
};
