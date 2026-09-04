const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const SITE_ORIGIN = 'https://maasim.net';
const SITE_HOST = 'maasim.net';
const MAX_URLS = 10_000;

const key = String(process.env.INDEXNOW_KEY || '').trim();

if (!key) {
  console.log('INDEXNOW_KEY tanımlı değil; IndexNow adımı atlandı.');
  process.exit(0);
}

if (!/^[A-Za-z0-9-]{8,128}$/.test(key)) {
  throw new Error('INDEXNOW_KEY 8-128 karakter olmalı ve yalnızca harf, rakam veya tire içermelidir.');
}

// IndexNow Option 1: key file is hosted at the site root.
// In this mode keyLocation is intentionally omitted from submissions.
const keyLocation = `${SITE_ORIGIN}/${key}.txt`;

async function waitForPublicKeyFile({ attempts = 18, delayMs = 5_000 } = {}) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(`${keyLocation}?deploy_check=${Date.now()}-${attempt}`, {
        headers: {
          'cache-control': 'no-cache',
          pragma: 'no-cache'
        },
        redirect: 'follow'
      });
      const body = (await response.text()).trim();
      const finalUrl = new URL(response.url);

      if (
        response.ok &&
        body === key &&
        finalUrl.hostname === SITE_HOST &&
        finalUrl.pathname === `/${key}.txt`
      ) {
        console.log(`IndexNow kök anahtar dosyası doğrulandı (${attempt}/${attempts}).`);
        return;
      }

      console.log(
        `IndexNow anahtar dosyası henüz hazır değil: HTTP ${response.status}, final=${response.url} (${attempt}/${attempts}).`
      );
    } catch (error) {
      console.log(`IndexNow anahtar kontrolü başarısız (${attempt}/${attempts}): ${error.message}`);
    }

    if (attempt < attempts) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw new Error(`IndexNow anahtar dosyası canlıda doğrulanamadı: ${keyLocation}`);
}

async function readSitemapUrls() {
  const response = await fetch(`${SITE_ORIGIN}/sitemap.xml?indexnow=${Date.now()}`, {
    headers: {
      'cache-control': 'no-cache',
      pragma: 'no-cache'
    }
  });

  if (!response.ok) {
    throw new Error(`Sitemap alınamadı: HTTP ${response.status}`);
  }

  const xml = await response.text();
  const urls = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)]
    .map((match) => match[1].trim())
    .filter((value) => {
      try {
        return new URL(value).hostname === SITE_HOST;
      } catch {
        return false;
      }
    });

  const uniqueUrls = [...new Set(urls)];
  if (uniqueUrls.length === 0) {
    throw new Error('Sitemap içinde gönderilebilir canonical URL bulunamadı.');
  }
  if (uniqueUrls.length > MAX_URLS) {
    throw new Error(`Sitemap ${MAX_URLS} URL sınırını aşıyor: ${uniqueUrls.length}`);
  }

  return uniqueUrls;
}

async function diagnoseForbidden() {
  const diagnosticUrl = new URL(INDEXNOW_ENDPOINT);
  diagnosticUrl.searchParams.set('url', `${SITE_ORIGIN}/`);
  diagnosticUrl.searchParams.set('key', key);

  try {
    const response = await fetch(diagnosticUrl, { method: 'GET' });
    const body = (await response.text()).trim();
    return `tek-URL teşhisi HTTP ${response.status}${body ? `: ${body}` : ''}`;
  } catch (error) {
    return `tek-URL teşhisi çalıştırılamadı: ${error.message}`;
  }
}

await waitForPublicKeyFile();
const urlList = await readSitemapUrls();

const response = await fetch(INDEXNOW_ENDPOINT, {
  method: 'POST',
  headers: {
    'content-type': 'application/json; charset=utf-8'
  },
  body: JSON.stringify({
    host: SITE_HOST,
    key,
    urlList
  })
});

const responseBody = await response.text();
if (!response.ok) {
  const diagnostic = response.status === 403 ? await diagnoseForbidden() : '';
  throw new Error(
    `IndexNow gönderimi başarısız: HTTP ${response.status} ${responseBody}${diagnostic ? ` | ${diagnostic}` : ''}`.trim()
  );
}

console.log(`IndexNow gönderimi kabul edildi: ${urlList.length} URL, HTTP ${response.status}.`);
