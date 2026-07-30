import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function applyAccessibilityPolish(distDir) {
  const indexPath = join(distDir, 'index.html');
  let html = await readFile(indexPath, 'utf8');

  html = html.replace(
    /<h3([^>]*\bid=["']stat-(?:high-net|low-net)["'][^>]*)>([\s\S]*?)<\/h3>/gi,
    '<p$1>$2</p>'
  );
  html = html.replace(
    /(<a\b[^>]*href=["']#sozluk["'][^>]*>)\s*Maaş Sözlüğü\s*(<\/a>)/gi,
    '$1Bu Sayfadaki Maaş Terimleri$2'
  );
  await writeFile(indexPath, html);

  const stylesPath = join(distDir, 'assets', 'styles.css');
  let css = await readFile(stylesPath, 'utf8');
  const marker = '/* Erişilebilirlik kontrast düzeltmeleri */';
  if (!css.includes(marker)) {
    css += `\n\n${marker}\n.metric-title, .site-freshness dt, body .text-slate-400 { color: #475569 !important; }\nbody .text-teal-600 { color: #0f766e !important; }\n.cta-button--calculate { background: #047857 !important; color: #fff !important; }\n.cta-button--calculate:hover { background: #065f46 !important; }\n`;
    await writeFile(stylesPath, css);
  }

  const shellPath = join(distDir, 'assets', 'site-shell.css');
  let shellCss = await readFile(shellPath, 'utf8');
  if (!shellCss.includes(marker)) {
    shellCss += `\n\n${marker}\n.site-brand span:last-child { color: #475569; }\n`;
    await writeFile(shellPath, shellCss);
  }

  console.log('Kalan erişilebilirlik ve kontrast düzeltmeleri uygulandı.');
}
