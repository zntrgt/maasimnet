import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { indexableBlogPosts, blogOutputPath } from '../content/blog-manifest.js';

const CSS_MARKER = '/* Blog visual overflow guard */';

const escapeXml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

function stripTags(value = '') {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function wrapWords(text, maxChars = 33, maxLines = 3) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars || !current) {
      current = candidate;
      continue;
    }
    lines.push(current);
    current = word;
  }
  if (current) lines.push(current);

  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines - 1);
  kept.push(lines.slice(maxLines - 1).join(' '));
  return kept;
}

function replaceHeroTitle(svg, title) {
  const titlePair = /<text x="115" y="(?:245|250)"[^>]*>[\s\S]*?<\/text><text x="115" y="(?:305|310)"[^>]*>[\s\S]*?<\/text>/i;
  if (!titlePair.test(svg)) return svg;

  const lines = wrapWords(title);
  const startY = lines.length === 3 ? 225 : 245;
  const fontSize = lines.length === 3 ? 40 : 44;
  const replacement = lines.map((line, index) =>
    `<text x="115" y="${startY + index * 58}" font-family="Arial" font-size="${fontSize}" font-weight="900" fill="#0f172a">${escapeXml(line)}</text>`
  ).join('');

  return svg.replace(titlePair, replacement);
}

export async function normalizeBlogVisuals(dist) {
  const cssPath = join(dist, 'assets', 'blog.css');
  let css = await readFile(cssPath, 'utf8');
  if (!css.includes(CSS_MARKER)) {
    css += `\n\n${CSS_MARKER}\n.layout > *, .layout article, .layout .body, .layout .sidebar { min-width: 0; }\n.layout article { overflow: hidden; }\n.layout h1, .layout h2, .layout h3, .card h2 { overflow-wrap: anywhere; word-break: normal; }\n.figure, .figure img, .table { max-width: 100%; }\n.figure { overflow: hidden; }\n.body { overflow-wrap: break-word; }\n@media (max-width: 1100px) { .layout { grid-template-columns: minmax(0, 1fr) 280px; gap: 32px; } }\n@media (max-width: 900px) { .layout { grid-template-columns: minmax(0, 1fr); } .sidebar { width: 100%; } }\n`;
    await writeFile(cssPath, css);
  }

  let updated = 0;
  for (const post of indexableBlogPosts) {
    const articleHtml = await readFile(join(dist, blogOutputPath(post)), 'utf8');
    const title = stripTags(articleHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || post.slug);
    const svgPath = join(dist, 'assets', `blog-${post.slug}.svg`);
    try {
      const svg = await readFile(svgPath, 'utf8');
      const normalized = replaceHeroTitle(svg, title);
      if (normalized !== svg) {
        await writeFile(svgPath, normalized);
        updated += 1;
      }
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }

  console.log(`blog görsel ve taşma koruması uygulandı; ${updated} hero başlığı normalize edildi`);
}
