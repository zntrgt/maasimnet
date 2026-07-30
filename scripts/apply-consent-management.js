import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const BOOTSTRAP_MARKER = 'data-maasim-consent-bootstrap';
const ASSET_MARKER = '/assets/consent-manager.js';

const bootstrap = `<script ${BOOTSTRAP_MARKER}>
(function () {
  var key = 'maasim_consent_v1';
  var defaults = {
    ad_storage: 'denied',
    analytics_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    functionality_storage: 'denied',
    personalization_storage: 'denied',
    security_storage: 'granted',
    wait_for_update: 500
  };
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('consent', 'default', defaults);
  try {
    var saved = JSON.parse(window.localStorage.getItem(key) || 'null');
    if (saved && saved.version === 1 && saved.preferences) {
      window.gtag('consent', 'update', {
        analytics_storage: saved.preferences.analytics ? 'granted' : 'denied',
        ad_storage: saved.preferences.marketing ? 'granted' : 'denied',
        ad_user_data: saved.preferences.marketing ? 'granted' : 'denied',
        ad_personalization: saved.preferences.marketing ? 'granted' : 'denied',
        functionality_storage: saved.preferences.functional ? 'granted' : 'denied',
        personalization_storage: saved.preferences.functional ? 'granted' : 'denied',
        security_storage: 'granted'
      });
    }
  } catch (_) {}
})();
</script>`;

const css = `
:root { --consent-navy:#0f2747; --consent-blue:#0b5fff; --consent-bg:#fff; --consent-text:#172033; --consent-muted:#5d6878; --consent-border:#d9e0ea; }
.consent-lock { overflow: hidden; }
.consent-banner { position:fixed; inset:auto 16px 16px; z-index:9999; max-width:1180px; margin:auto; padding:20px; border:1px solid var(--consent-border); border-radius:18px; background:var(--consent-bg); box-shadow:0 20px 60px rgba(15,39,71,.2); color:var(--consent-text); font-family:inherit; }
.consent-banner[hidden], .consent-modal[hidden] { display:none !important; }
.consent-banner__layout { display:grid; grid-template-columns:minmax(0,1.45fr) minmax(420px,1fr); gap:22px; align-items:center; }
.consent-banner h2, .consent-modal h2 { margin:0 0 8px; color:var(--consent-navy); font-size:21px; line-height:1.25; }
.consent-banner p, .consent-modal p { margin:0; color:var(--consent-muted); font-size:14px; line-height:1.6; }
.consent-banner a, .consent-modal a { color:var(--consent-blue); text-underline-offset:3px; }
.consent-actions { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; }
.consent-button { min-height:46px; padding:10px 13px; border:1px solid var(--consent-navy); border-radius:11px; background:#fff; color:var(--consent-navy); font:700 14px/1.2 inherit; cursor:pointer; }
.consent-button:hover { background:#f4f7fb; }
.consent-button:focus-visible, .consent-toggle input:focus-visible + span { outline:3px solid rgba(11,95,255,.28); outline-offset:2px; }
.consent-button--accept { background:var(--consent-navy); color:#fff; }
.consent-button--accept:hover { background:#18365d; }
.consent-modal { position:fixed; inset:0; z-index:10000; display:grid; place-items:center; padding:20px; background:rgba(15,23,42,.58); }
.consent-modal__panel { width:min(650px,100%); max-height:min(760px,calc(100vh - 40px)); overflow:auto; border-radius:20px; background:#fff; box-shadow:0 28px 80px rgba(15,23,42,.3); }
.consent-modal__header { display:flex; justify-content:space-between; gap:20px; align-items:flex-start; padding:22px 22px 14px; border-bottom:1px solid var(--consent-border); }
.consent-modal__close { width:40px; height:40px; flex:0 0 40px; border:1px solid var(--consent-border); border-radius:50%; background:#fff; color:var(--consent-navy); font-size:24px; cursor:pointer; }
.consent-modal__body { display:grid; gap:12px; padding:18px 22px; }
.consent-category { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:18px; padding:16px; border:1px solid var(--consent-border); border-radius:14px; }
.consent-category h3 { margin:0 0 5px; color:var(--consent-navy); font-size:16px; }
.consent-toggle { position:relative; display:inline-flex; align-items:center; }
.consent-toggle input { position:absolute; opacity:0; pointer-events:none; }
.consent-toggle span { width:46px; height:26px; border-radius:999px; background:#aab4c2; position:relative; transition:.2s; }
.consent-toggle span::after { content:''; position:absolute; top:3px; left:3px; width:20px; height:20px; border-radius:50%; background:#fff; box-shadow:0 1px 3px rgba(0,0,0,.2); transition:.2s; }
.consent-toggle input:checked + span { background:var(--consent-blue); }
.consent-toggle input:checked + span::after { transform:translateX(20px); }
.consent-toggle input:disabled + span { opacity:.65; cursor:not-allowed; }
.consent-modal__footer { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; padding:16px 22px 22px; border-top:1px solid var(--consent-border); }
.consent-preferences-button { appearance:none; border:0; padding:0; background:none; color:inherit; font:inherit; text-align:left; cursor:pointer; text-decoration:underline; text-underline-offset:3px; }
@media (max-width:800px) { .consent-banner__layout { grid-template-columns:1fr; } .consent-actions { grid-template-columns:1fr; } }
@media (max-width:560px) { .consent-banner { inset:auto 8px 8px; padding:16px; border-radius:15px; } .consent-modal { padding:8px; } .consent-modal__panel { max-height:calc(100vh - 16px); border-radius:16px; } .consent-category { grid-template-columns:1fr auto; } .consent-modal__footer { grid-template-columns:1fr; } }
`;

const js = `
(() => {
  'use strict';

  const STORAGE_KEY = 'maasim_consent_v1';
  const COOKIE_KEY = 'maasim_consent';
  const VERSION = 1;
  const VALID_CATEGORIES = ['analytics', 'marketing', 'functional'];
  const initialFocus = { value: null };

  const safeParse = (value) => {
    try { return JSON.parse(value); } catch (_) { return null; }
  };

  const normalize = (preferences = {}) => ({
    necessary: true,
    analytics: Boolean(preferences.analytics),
    marketing: Boolean(preferences.marketing),
    functional: Boolean(preferences.functional)
  });

  const readConsent = () => {
    const saved = safeParse(window.localStorage.getItem(STORAGE_KEY));
    if (!saved || saved.version !== VERSION || !saved.preferences) return null;
    return { ...saved, preferences: normalize(saved.preferences) };
  };

  const writeCookie = (preferences) => {
    const compact = [preferences.analytics ? 1 : 0, preferences.marketing ? 1 : 0, preferences.functional ? 1 : 0].join('');
    document.cookie = COOKIE_KEY + '=' + compact + '; Max-Age=15552000; Path=/; SameSite=Lax; Secure';
  };

  const consentModePayload = (preferences) => ({
    analytics_storage: preferences.analytics ? 'granted' : 'denied',
    ad_storage: preferences.marketing ? 'granted' : 'denied',
    ad_user_data: preferences.marketing ? 'granted' : 'denied',
    ad_personalization: preferences.marketing ? 'granted' : 'denied',
    functionality_storage: preferences.functional ? 'granted' : 'denied',
    personalization_storage: preferences.functional ? 'granted' : 'denied',
    security_storage: 'granted'
  });

  const activateBlockedScripts = (preferences) => {
    document.querySelectorAll('script[type="text/plain"][data-consent-category]').forEach((blocked) => {
      const category = blocked.dataset.consentCategory;
      if (!VALID_CATEGORIES.includes(category) || !preferences[category] || blocked.dataset.consentActivated === 'true') return;
      const script = document.createElement('script');
      [...blocked.attributes].forEach((attribute) => {
        if (!['type', 'data-consent-category', 'data-consent-activated'].includes(attribute.name)) script.setAttribute(attribute.name, attribute.value);
      });
      script.textContent = blocked.textContent;
      blocked.dataset.consentActivated = 'true';
      blocked.after(script);
    });
  };

  const saveConsent = (preferences, source = 'preferences') => {
    const normalized = normalize(preferences);
    const record = { version: VERSION, updatedAt: new Date().toISOString(), source, preferences: normalized };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    writeCookie(normalized);
    window.gtag?.('consent', 'update', consentModePayload(normalized));
    activateBlockedScripts(normalized);
    window.dispatchEvent(new CustomEvent('maasim:consentchange', { detail: record }));
    return record;
  };

  const categoryAllowed = (category) => category === 'necessary' || Boolean(readConsent()?.preferences?.[category]);

  const loadScriptByConsent = (category, src, attributes = {}) => {
    if (!VALID_CATEGORIES.includes(category)) throw new Error('Geçersiz izin kategorisi: ' + category);
    if (!categoryAllowed(category)) return false;
    if (document.querySelector('script[data-consent-src="' + CSS.escape(src) + '"]')) return true;
    const script = document.createElement('script');
    script.src = src;
    script.dataset.consentSrc = src;
    Object.entries(attributes).forEach(([name, value]) => script.setAttribute(name, String(value)));
    document.head.append(script);
    return true;
  };

  const banner = document.createElement('section');
  banner.className = 'consent-banner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-modal', 'false');
  banner.setAttribute('aria-labelledby', 'consent-banner-title');
  banner.hidden = true;
  banner.innerHTML = '<div class="consent-banner__layout"><div><h2 id="consent-banner-title">Gizlilik tercihlerinizi yönetin</h2><p>Zorunlu teknolojiler sitenin çalışması için gereklidir. Analitik, pazarlama ve işlevsel teknolojileri yalnızca izninizle kullanırız. Ayrıntılar için <a href="/cerez-politikasi/">Çerez Politikası</a> sayfasını inceleyebilirsiniz.</p></div><div class="consent-actions"><button class="consent-button" type="button" data-consent-reject>Tümünü Reddet</button><button class="consent-button" type="button" data-consent-manage>Tercihleri Yönet</button><button class="consent-button consent-button--accept" type="button" data-consent-accept>Tümünü Kabul Et</button></div></div>';

  const modal = document.createElement('section');
  modal.className = 'consent-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'consent-modal-title');
  modal.hidden = true;
  modal.innerHTML = '<div class="consent-modal__panel"><div class="consent-modal__header"><div><h2 id="consent-modal-title">Çerez tercihleri</h2><p>İzinlerinizi dilediğiniz zaman değiştirebilirsiniz.</p></div><button class="consent-modal__close" type="button" data-consent-close aria-label="Tercih penceresini kapat">×</button></div><div class="consent-modal__body"><div class="consent-category"><div><h3>Zorunlu</h3><p>Güvenlik, tercih kaydı ve temel site işlevleri için gereklidir. Kapatılamaz.</p></div><label class="consent-toggle"><input type="checkbox" checked disabled><span aria-hidden="true"></span></label></div><div class="consent-category"><div><h3>Analitik</h3><p>Site kullanımını toplu olarak anlamamıza ve deneyimi iyileştirmemize yardımcı olur.</p></div><label class="consent-toggle"><input type="checkbox" data-consent-category="analytics"><span aria-hidden="true"></span></label></div><div class="consent-category"><div><h3>Pazarlama</h3><p>Reklam performansı, yeniden pazarlama ve kişiselleştirilmiş reklam amaçlarıyla kullanılır.</p></div><label class="consent-toggle"><input type="checkbox" data-consent-category="marketing"><span aria-hidden="true"></span></label></div><div class="consent-category"><div><h3>İşlevsel</h3><p>Gelişmiş tercihleri ve üçüncü taraf özelliklerini hatırlamaya yardımcı olur.</p></div><label class="consent-toggle"><input type="checkbox" data-consent-category="functional"><span aria-hidden="true"></span></label></div></div><div class="consent-modal__footer"><button class="consent-button" type="button" data-consent-modal-reject>Tümünü Reddet</button><button class="consent-button" type="button" data-consent-save>Seçimlerimi Kaydet</button><button class="consent-button consent-button--accept" type="button" data-consent-modal-accept>Tümünü Kabul Et</button></div></div>';

  const syncInputs = () => {
    const current = readConsent()?.preferences || normalize();
    modal.querySelectorAll('[data-consent-category]').forEach((input) => { input.checked = Boolean(current[input.dataset.consentCategory]); });
  };

  const openPreferences = (trigger) => {
    initialFocus.value = trigger || document.activeElement;
    syncInputs();
    modal.hidden = false;
    document.documentElement.classList.add('consent-lock');
    modal.querySelector('[data-consent-close]')?.focus();
  };

  const closePreferences = () => {
    modal.hidden = true;
    document.documentElement.classList.remove('consent-lock');
    initialFocus.value?.focus?.();
  };

  const finish = (preferences, source) => {
    saveConsent(preferences, source);
    banner.hidden = true;
    closePreferences();
  };

  document.body.append(banner, modal);

  banner.querySelector('[data-consent-reject]').addEventListener('click', () => finish({}, 'reject-all'));
  banner.querySelector('[data-consent-accept]').addEventListener('click', () => finish({ analytics: true, marketing: true, functional: true }, 'accept-all'));
  banner.querySelector('[data-consent-manage]').addEventListener('click', (event) => openPreferences(event.currentTarget));
  modal.querySelector('[data-consent-close]').addEventListener('click', closePreferences);
  modal.querySelector('[data-consent-modal-reject]').addEventListener('click', () => finish({}, 'reject-all'));
  modal.querySelector('[data-consent-modal-accept]').addEventListener('click', () => finish({ analytics: true, marketing: true, functional: true }, 'accept-all'));
  modal.querySelector('[data-consent-save]').addEventListener('click', () => {
    const preferences = {};
    modal.querySelectorAll('[data-consent-category]').forEach((input) => { preferences[input.dataset.consentCategory] = input.checked; });
    finish(preferences, 'preferences');
  });

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-open-consent-preferences]');
    if (!trigger) return;
    event.preventDefault();
    openPreferences(trigger);
  });

  modal.addEventListener('click', (event) => { if (event.target === modal) closePreferences(); });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.hidden) closePreferences();
    if (event.key !== 'Tab' || modal.hidden) return;
    const focusable = [...modal.querySelectorAll('button:not([disabled]), input:not([disabled]), a[href]')];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });

  window.maasimConsent = { read: readConsent, save: saveConsent, open: openPreferences, isAllowed: categoryAllowed, loadScriptByConsent };

  const current = readConsent();
  if (current) activateBlockedScripts(current.preferences);
  else banner.hidden = false;
})();
`;

const policyHtml = `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Çerez Politikası | Maaşım.net</title>
  <meta name="description" content="Maaşım.net çerez ve benzeri teknolojiler politikası; kullanılan kategoriler, amaçlar, saklama süreleri ve tercih yönetimi.">
  <link rel="canonical" href="https://maasim.net/cerez-politikasi/">
  <style>
    body{margin:0;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#172033;background:#f7f9fc}.policy-shell{width:min(880px,calc(100% - 32px));margin:0 auto;padding:52px 0 72px}.policy-card{padding:clamp(24px,5vw,52px);border:1px solid #d9e0ea;border-radius:22px;background:#fff;box-shadow:0 16px 50px rgba(15,39,71,.08)}h1,h2{color:#0f2747;line-height:1.2}h1{font-size:clamp(34px,6vw,54px);margin:0 0 16px}h2{margin:32px 0 10px;font-size:23px}p,li{font-size:16px;line-height:1.75;color:#465265}table{width:100%;border-collapse:collapse;margin:18px 0}th,td{padding:12px;border:1px solid #d9e0ea;text-align:left;vertical-align:top;font-size:14px;line-height:1.5}th{background:#f1f5f9;color:#0f2747}.policy-actions{margin-top:28px}.policy-actions button{min-height:46px;padding:10px 16px;border:0;border-radius:11px;background:#0f2747;color:#fff;font:700 15px/1.2 inherit;cursor:pointer}@media(max-width:650px){table,thead,tbody,tr,th,td{display:block}thead{position:absolute;left:-9999px}tr{margin-bottom:12px;border:1px solid #d9e0ea}td{border:0;border-bottom:1px solid #e8edf3}td:last-child{border-bottom:0}}
  </style>
</head>
<body>
  <main class="policy-shell"><article class="policy-card">
    <p><a href="/">← Maaşım.net ana sayfa</a></p>
    <h1>Çerez Politikası</h1>
    <p><strong>Son güncelleme: 30 Temmuz 2026</strong></p>
    <p>Bu politika, Maaşım.net üzerinde kullanılan çerezler, yerel depolama ve benzeri teknolojilerin hangi amaçlarla işlendiğini ve tercihlerinizi nasıl yönetebileceğinizi açıklar.</p>
    <h2>1. Kategoriler</h2>
    <table><thead><tr><th>Kategori</th><th>Amaç</th><th>Varsayılan durum</th></tr></thead><tbody><tr><td>Zorunlu</td><td>Güvenlik, tercih kaydı ve temel site işlevleri.</td><td>Her zaman etkin</td></tr><tr><td>Analitik</td><td>Ziyaret ve kullanım verilerini toplu olarak ölçmek.</td><td>İzin verilene kadar kapalı</td></tr><tr><td>Pazarlama</td><td>Reklam ölçümü, yeniden pazarlama ve kişiselleştirme.</td><td>İzin verilene kadar kapalı</td></tr><tr><td>İşlevsel</td><td>Gelişmiş tercihleri ve üçüncü taraf özelliklerini hatırlamak.</td><td>İzin verilene kadar kapalı</td></tr></tbody></table>
    <h2>2. Kullanılan zorunlu kayıtlar</h2>
    <table><thead><tr><th>Ad</th><th>Tür</th><th>Amaç</th><th>Süre</th></tr></thead><tbody><tr><td>maasim_consent</td><td>Birinci taraf çerez</td><td>İzin tercihlerinin kısa kodunu saklar.</td><td>180 gün</td></tr><tr><td>maasim_consent_v1</td><td>Yerel depolama</td><td>Seçilen kategorileri, tercih kaynağını ve güncelleme tarihini saklar.</td><td>Tercih silinene veya güncellenene kadar</td></tr></tbody></table>
    <h2>3. Analitik ve reklam araçları</h2>
    <p>Analitik veya pazarlama araçları kullanıldığında ilgili kodlar, kullanıcı açıkça izin verene kadar çalıştırılmaz. Google etiketleri için izin sinyalleri varsayılan olarak reddedilmiş durumdadır. Kullanılan sağlayıcılar ve çerez adları değişirse bu tablo güncellenir.</p>
    <h2>4. Tercihinizi değiştirme</h2>
    <p>Footer alanındaki “Çerez Tercihleri” bağlantısını veya aşağıdaki düğmeyi kullanarak izinlerinizi dilediğiniz zaman değiştirebilir ya da geri çekebilirsiniz. Tarayıcı ayarlarınızdan saklanan verileri ayrıca silebilirsiniz.</p>
    <div class="policy-actions"><button type="button" data-open-consent-preferences>Çerez Tercihlerini Aç</button></div>
    <h2>5. Politika güncellemeleri</h2>
    <p>Kullanılan teknolojiler, sağlayıcılar veya hukuki gereklilikler değiştiğinde bu politika güncellenebilir. Güncel tarih bu sayfanın üst kısmında gösterilir.</p>
  </article></main>
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

function injectBootstrap(html) {
  if (html.includes(BOOTSTRAP_MARKER)) return html;
  return html.replace(/<head([^>]*)>/i, `<head$1>${bootstrap}`);
}

function injectAssets(html) {
  if (!html.includes('/assets/consent-manager.css')) {
    html = html.replace(/<\/head>/i, '<link rel="stylesheet" href="/assets/consent-manager.css"></head>');
  }
  if (!html.includes(ASSET_MARKER)) {
    html = html.replace(/<\/body>/i, '<script src="/assets/consent-manager.js" defer></script></body>');
  }
  return html;
}

function injectFooterControls(html) {
  if (!html.includes('/cerez-politikasi/')) {
    html = html.replace(/(<a href="\/gizlilik\/">Gizlilik Politikası<\/a>)/i, '$1<a href="/cerez-politikasi/">Çerez Politikası</a>');
  }
  if (!html.includes('data-open-consent-preferences')) {
    html = html.replace(/(<a href="\/cerez-politikasi\/">Çerez Politikası<\/a>)/i, '$1<button class="consent-preferences-button" type="button" data-open-consent-preferences>Çerez Tercihleri</button>');
  }
  return html;
}

export async function applyConsentManagement(dist) {
  const assetsDir = join(dist, 'assets');
  const policyDir = join(dist, 'cerez-politikasi');
  await mkdir(assetsDir, { recursive: true });
  await mkdir(policyDir, { recursive: true });
  await writeFile(join(assetsDir, 'consent-manager.css'), css);
  await writeFile(join(assetsDir, 'consent-manager.js'), js);
  await writeFile(join(policyDir, 'index.html'), policyHtml);

  const files = await walkHtml(dist);
  for (const path of files) {
    let html = await readFile(path, 'utf8');
    html = injectBootstrap(html);
    html = injectFooterControls(html);
    html = injectAssets(html);
    await writeFile(path, html);
  }

  console.log(`izin yönetimi uygulandı: ${files.length} sayfa`);
}
