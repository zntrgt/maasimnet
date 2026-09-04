import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const SITE = 'https://maasim.net';
const MARKER = 'data-calculator-discovery="v1"';

const TOOL_CANDIDATES = Object.freeze([
  {
    path: '/',
    title: 'Maaş Hesaplama 2026',
    description: 'Brütten nete ve netten brüte maaşı 12 aylık vergi ve SGK akışıyla hesapla.',
    group: 'salary',
    keywords: ['maaş hesaplama', 'brütten nete', 'netten brüte']
  },
  {
    path: '/tazminat-hesaplama/',
    title: 'Kıdem ve İhbar Tazminatı Hesaplama',
    description: 'Kıdem ve ihbar tazminatını aynı ekranda ayrı ayrı ve toplam olarak hesapla.',
    group: 'termination',
    keywords: ['tazminat hesaplama', 'kıdem ihbar hesaplama']
  },
  {
    path: '/kidem-tazminati-hesaplama/',
    title: 'Kıdem Tazminatı Hesaplama 2026',
    description: 'Fiilî hizmet günü, giydirilmiş brüt ücret ve güncel kıdem tavanıyla hesapla.',
    group: 'termination',
    keywords: ['kıdem tazminatı hesaplama', 'kıdem hesaplama']
  },
  {
    path: '/ihbar-tazminati-hesaplama/',
    title: 'İhbar Tazminatı Hesaplama 2026',
    description: 'Hizmet süresine göre ihbar gününü ve brüt/net ihbar tazminatını hesapla.',
    group: 'termination',
    keywords: ['ihbar tazminatı hesaplama', 'ihbar süresi hesaplama']
  },
  {
    path: '/issizlik-maasi-hesaplama/',
    title: 'İşsizlik Maaşı Hesaplama 2026',
    description: 'Son 4 aylık SGK PEK, prim günü ve hak koşullarıyla işsizlik ödeneğini ve ödeme süresini hesapla.',
    group: 'benefit',
    keywords: ['işsizlik maaşı hesaplama', 'işsizlik ödeneği hesaplama', 'kaç ay işsizlik maaşı']
  },
  {
    path: '/isveren-maliyeti-hesaplama/',
    title: 'İşveren Maliyeti Hesaplama',
    description: 'Brüt ücretin işverene aylık ve yıllık toplam maliyetini karşılaştır.',
    group: 'salary',
    keywords: ['işveren maliyeti hesaplama']
  },
  {
    path: '/vergi-dilimi-hesaplama/',
    title: 'Vergi Dilimi Hesaplama 2026',
    description: 'Kümülatif gelir vergisi matrahının hangi vergi dilimine geçtiğini gör.',
    group: 'salary',
    keywords: ['vergi dilimi hesaplama', 'gelir vergisi dilimi']
  },
  {
    path: '/asgari-ucret-isveren-maliyeti/',
    title: 'Asgari Ücret İşveren Maliyeti 2026',
    description: '2026 asgari ücretinin teşvik seçeneklerine göre işverene maliyetini incele.',
    group: 'salary',
    keywords: ['asgari ücret işveren maliyeti']
  },
  {
    path: '/emekli-calisan-maas-hesaplama/',
    title: 'Emekli Çalışan Maaş Hesaplama',
    description: 'SGDP uygulanan emekli çalışan maaş ve işveren maliyeti senaryosunu incele.',
    group: 'salary',
    keywords: ['emekli çalışan maaş hesaplama', 'SGDP hesaplama']
  },
  {
    path: '/2027-maas-hesaplama/',
    title: '2027 Maaş Tahmin Aracı',
    description: 'Henüz kesinleşmemiş 2027 parametrelerini kendi varsayımlarınla senaryolaştır.',
    group: 'salary',
    keywords: ['2027 maaş hesaplama']
  }
]);

function distFile(dist, route) {
  if (route === '/') return join(dist, 'index.html');
  return join(dist, route.replace(/^\/+|\/+$/g, ''), 'index.html');
}

async function routeExists(dist, route) {
  try {
    await access(distFile(dist, route));
    return true;
  } catch {
    return false;
  }
}

function card(tool) {
  return `<a class="calculator-discovery__card" href="${tool.path}"><strong>${tool.title}</strong><span>${tool.description}</span><b>Hesapla →</b></a>`;
}

function block(title, intro, tools, extraClass = '') {
  return `<section class="calculator-discovery ${extraClass}" ${MARKER}><div class="calculator-discovery__head"><p class="calculator-discovery__eyebrow">Hesaplama araçları</p><h2>${title}</h2><p>${intro}</p></div><div class="calculator-discovery__grid">${tools.map(card).join('')}</div><p class="calculator-discovery__all"><a href="/hesaplama-araclari/">Tüm hesaplama araçlarını gör →</a></p></section>`;
}

function insertBeforeMainEnd(html, section) {
  if (html.includes(MARKER)) return html;
  return html.replace(/<\/main>/i, `${section}</main>`);
}

function insertHome(html, section) {
  if (html.includes(MARKER)) return html;
  const faqStart = html.search(/<section\b[^>]*id=["'](?:sss|faq)["']/i);
  if (faqStart >= 0) return html.slice(0, faqStart) + section + html.slice(faqStart);
  return insertBeforeMainEnd(html, section);
}

function hubPage(tools) {
  const salary = tools.filter((tool) => tool.group === 'salary');
  const termination = tools.filter((tool) => tool.group === 'termination');
  const benefit = tools.filter((tool) => tool.group === 'benefit');
  const description = '2026 maaş, brütten nete, netten brüte, kıdem, ihbar, tazminat, işsizlik maaşı, vergi dilimi ve işveren maliyeti hesaplama araçlarını tek sayfadan açın.';
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${SITE}/hesaplama-araclari/#page`,
        url: `${SITE}/hesaplama-araclari/`,
        name: 'Maaş ve Çalışan Hakları Hesaplama Araçları 2026',
        description,
        inLanguage: 'tr-TR',
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: tools.map((tool, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: tool.title,
            url: `${SITE}${tool.path}`
          }))
        }
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Hesaplama Araçları', item: `${SITE}/hesaplama-araclari/` }
        ]
      }
    ]
  };
  const section = (heading, intro, items) => items.length ? `<section class="tools-hub__section"><h2>${heading}</h2><p>${intro}</p><div class="tools-hub__grid">${items.map(card).join('')}</div></section>` : '';
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Maaş ve Çalışan Hakları Hesaplama Araçları 2026 | Maaşım.net</title><meta name="description" content="${description}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${SITE}/hesaplama-araclari/"><meta property="og:type" content="website"><meta property="og:title" content="Maaş ve Çalışan Hakları Hesaplama Araçları 2026"><meta property="og:description" content="${description}"><meta property="og:url" content="${SITE}/hesaplama-araclari/"><script type="application/ld+json">${JSON.stringify(graph)}</script><style data-tools-hub-css>body{margin:0;background:#f8fafc;color:#0f172a;font-family:Inter,ui-sans-serif,system-ui,sans-serif}.tools-hub{max-width:1120px;margin:auto;padding:56px 20px 80px}.tools-hub__hero{max-width:850px;margin-bottom:44px}.tools-hub__hero p:first-child{font-size:12px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#0d9488}.tools-hub h1{font-size:clamp(38px,6vw,64px);line-height:1.04;letter-spacing:-.045em;margin:8px 0 16px}.tools-hub__hero>p:last-child{font-size:19px;line-height:1.7;color:#475569}.tools-hub__section{margin-top:44px}.tools-hub__section h2{font-size:30px;margin:0 0 8px}.tools-hub__section>p{color:#64748b;margin:0 0 20px;line-height:1.65}.tools-hub__grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.calculator-discovery__card{display:flex;min-width:0;flex-direction:column;gap:10px;min-height:180px;padding:22px;border:1px solid #dbe4ee;border-radius:22px;background:#fff;color:#0f172a;text-decoration:none;box-shadow:0 10px 30px rgba(15,23,42,.04)}.calculator-discovery__card strong{font-size:18px;line-height:1.3}.calculator-discovery__card span{color:#64748b;font-size:14px;line-height:1.55}.calculator-discovery__card b{margin-top:auto;color:#0d9488;font-size:13px}.calculator-discovery__card:hover{border-color:#5eead4;transform:translateY(-1px)}@media(max-width:850px){.tools-hub__grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.tools-hub{padding-top:36px}.tools-hub__grid{grid-template-columns:1fr}.calculator-discovery__card{min-height:0}}</style></head><body><main class="tools-hub"><div class="tools-hub__hero"><p>2026 · Maaşım.net</p><h1>Maaş ve Çalışan Hakları Hesaplama Araçları</h1><p>Maaş, bordro, vergi, işsizlik ve işten ayrılma hesaplarını tek merkezden açın. Her araç kendi arama niyetine ayrılmıştır.</p></div>${section('Maaş, vergi ve işveren hesapları','Brütten nete, netten brüte, vergi dilimi ve işveren maliyeti için ilgili aracı seçin.', salary)}${section('İşsizlik ve çalışan hakları','İşsizlik ödeneği miktarını, hak süresini ve temel koşulları hesaplayın.', benefit)}${section('Kıdem, ihbar ve tazminat hesapları','İşten ayrılma senaryosunda kıdem, ihbar veya ikisini birlikte hesaplayın.', termination)}</main></body></html>`;
}

export async function applyCalculatorDiscovery(dist) {
  const tools = [];
  for (const tool of TOOL_CANDIDATES) {
    if (await routeExists(dist, tool.path)) tools.push(tool);
  }

  for (const required of ['/', '/tazminat-hesaplama/', '/kidem-tazminati-hesaplama/', '/ihbar-tazminati-hesaplama/', '/issizlik-maasi-hesaplama/']) {
    if (!tools.some((tool) => tool.path === required)) throw new Error(`SEO iç link mimarisi için zorunlu hesaplayıcı bulunamadı: ${required}`);
  }

  const hubDir = join(dist, 'hesaplama-araclari');
  await mkdir(hubDir, { recursive: true });
  await writeFile(join(hubDir, 'index.html'), hubPage(tools), 'utf8');

  const homeFile = distFile(dist, '/');
  let home = await readFile(homeFile, 'utf8');
  const homeTools = [
    '/tazminat-hesaplama/',
    '/kidem-tazminati-hesaplama/',
    '/ihbar-tazminati-hesaplama/',
    '/issizlik-maasi-hesaplama/',
    '/isveren-maliyeti-hesaplama/',
    '/vergi-dilimi-hesaplama/'
  ].map((path) => tools.find((tool) => tool.path === path)).filter(Boolean);
  home = insertHome(home, block('Maaştan çalışan haklarına: diğer hesaplama araçları','Maaş hesabından sonra kıdem, ihbar, tazminat, işsizlik ödeneği, vergi dilimi ve işveren maliyeti araçlarına doğrudan geçin.', homeTools, 'calculator-discovery--home'));
  await writeFile(homeFile, home, 'utf8');

  const contextualTargets = [
    '/veriler/2026/',
    '/hesaplama-metodolojisi/',
    '/sss/',
    '/sozluk/',
    '/senaryolar/'
  ];
  const contextualTools = ['/', '/tazminat-hesaplama/', '/kidem-tazminati-hesaplama/', '/ihbar-tazminati-hesaplama/', '/issizlik-maasi-hesaplama/']
    .map((path) => tools.find((tool) => tool.path === path)).filter(Boolean);

  let contextualPages = 0;
  for (const route of contextualTargets) {
    if (!(await routeExists(dist, route))) continue;
    const file = distFile(dist, route);
    let html = await readFile(file, 'utf8');
    html = insertBeforeMainEnd(html, block('İlgili hesaplama araçları','Okuduğunuz bilgiyi kendi maaş, işsizlik veya tazminat senaryonuzla kontrol edin.', contextualTools, 'calculator-discovery--compact'));
    await writeFile(file, html, 'utf8');
    contextualPages += 1;
  }

  const blogRoute = '/blog/kidem-tazminatina-dahil-odemeler/';
  if (await routeExists(dist, blogRoute)) {
    const file = distFile(dist, blogRoute);
    let html = await readFile(file, 'utf8');
    const terminationTools = ['/kidem-tazminati-hesaplama/', '/ihbar-tazminati-hesaplama/', '/tazminat-hesaplama/']
      .map((path) => tools.find((tool) => tool.path === path)).filter(Boolean);
    html = insertBeforeMainEnd(html, block('Okuduktan sonra hesabını yap','Giydirilmiş brüte hangi ödemelerin girdiğini belirlediyseniz şimdi kıdem veya toplam tazminatınızı hesaplayın.', terminationTools, 'calculator-discovery--compact'));
    await writeFile(file, html, 'utf8');
    contextualPages += 1;
  }

  console.log(`Hesaplama araçları keşif mimarisi uygulandı: ${tools.length} aktif araç, ${contextualPages + 1} içerik yüzeyi, 1 hub.`);
  return Object.freeze({ tools: tools.length, contextualPages: contextualPages + 1, hub: '/hesaplama-araclari/' });
}
