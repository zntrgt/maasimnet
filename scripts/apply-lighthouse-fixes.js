import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

async function listHtmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await listHtmlFiles(fullPath));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(fullPath);
  }
  return files;
}

function ensureEarlyCharset(html) {
  const withoutCharset = html.replace(/\s*<meta\s+charset=["'][^"']+["']\s*\/?\s*>/gi, '');
  return withoutCharset.replace(/<head([^>]*)>/i, '<head$1>\n<meta charset="utf-8">');
}

function improveAccessibleNames(html) {
  return html
    .replace(/<input([^>]*\bid=["']check-retired["'][^>]*)>/i, (match, attrs) => {
      if (/\baria-label=/i.test(attrs)) return match;
      return `<input${attrs} aria-label="Emekli çalışan">`;
    })
    .replace(/<select([^>]*\bid=["']select-disability["'][^>]*)>/i, (match, attrs) => {
      if (/\baria-label=/i.test(attrs)) return match;
      return `<select${attrs} aria-label="Engellilik derecesi">`;
    })
    .replace(/(<a\b[^>]*class=["'][^"']*site-brand[^"']*["'][^>]*>\s*<img\b[^>]*?)\s+alt=["'][^"']*["']/gi, '$1 alt=""');
}

function improveMetricHeadingOrder(html) {
  return html.replace(
    /<h3([^>]*\bid=["']stat-(?:avg-net|max-net|min-net|net-diff|total-net|avg-gross|total-gross|avg-employer-cost|effective-deduction)["'][^>]*)>([\s\S]*?)<\/h3>/gi,
    '<p$1>$2</p>'
  );
}

export async function applyLighthouseFixes(distDir) {
  const htmlFiles = await listHtmlFiles(distDir);
  for (const file of htmlFiles) {
    const original = await readFile(file, 'utf8');
    const updated = improveMetricHeadingOrder(improveAccessibleNames(ensureEarlyCharset(original)));
    if (updated !== original) await writeFile(file, updated);
  }

  const llms = `# Maaşım.net\n\nMaaşım.net, Türkiye için 2026 brütten nete ve netten brüte maaş hesaplama, vergi dilimi, SGK ve işveren maliyeti bilgileri sunar.\n\n## Temel sayfalar\n\n- [Maaş hesaplayıcı](https://maasim.net/)\n- [Hesaplama metodolojisi](https://maasim.net/hesaplama-metodolojisi/)\n- [Açık hesaplama test raporu](https://maasim.net/test-raporu/)\n- [2026 veri merkezi](https://maasim.net/veriler/2026/)\n- [Sık sorulan sorular](https://maasim.net/sss/)\n- [Maaş ve çalışma hayatı rehberleri](https://maasim.net/blog/)\n- [İletişim](https://maasim.net/iletisim/)\n\n## Kullanım notu\n\nİçerikler bilgilendirme amaçlıdır; resmî bordro, mali müşavirlik veya hukuk danışmanlığı yerine geçmez.\n`;
  await writeFile(join(distDir, 'llms.txt'), llms);

  console.log(`Lighthouse erişilebilirlik ve llms.txt düzeltmeleri uygulandı: ${htmlFiles.length} HTML`);
}
