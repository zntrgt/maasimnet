import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const marker = '/* Compact blog card grid */';

function addBodyClass(html) {
  return html.replace(/<body([^>]*)>/i, (match, attrs) => {
    if (/\bclass="[^"]*\bblog-index\b[^"]*"/i.test(match)) return match;
    if (/\bclass="/i.test(match)) {
      return match.replace(/class="([^"]*)"/i, (_, classes) => `class="${classes} blog-index"`);
    }
    return `<body${attrs} class="blog-index">`;
  });
}

function wrapCardImages(html) {
  return html.replace(
    /(<a class="card"[^>]*>)\s*(<img\b[^>]*>)/gi,
    '$1<span class="card-media">$2</span>'
  );
}

const compactCss = `

${marker}
.blog-index .shell {
  max-width: 1200px;
  padding-top: 30px;
}

.blog-index .shell > header {
  max-width: 780px;
  margin-bottom: 28px;
}

.blog-index .shell > header h1 {
  font-size: clamp(32px, 4vw, 48px);
  line-height: 1.08;
  margin-bottom: 12px;
}

.blog-index .shell > header .lead {
  font-size: 18px;
  margin-bottom: 0;
}

.blog-index .cards {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}

.blog-index .card {
  min-width: 0;
  border-radius: 18px;
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
}

.blog-index .card:hover {
  transform: translateY(-3px);
  border-color: #99f6e4;
  box-shadow: 0 16px 34px rgba(15, 23, 42, .08);
}

.blog-index .card-media {
  display: block;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  background: #e2e8f0;
}

.blog-index .card-media img {
  display: block;
  width: 100%;
  height: 100%;
  aspect-ratio: auto;
  object-fit: cover;
  object-position: center;
  transition: transform .3s ease;
}

.blog-index .card:hover .card-media img {
  transform: scale(1.025);
}

.blog-index .card > div {
  padding: 16px 17px 18px;
}

.blog-index .card small {
  font-size: 10px;
  letter-spacing: .06em;
}

.blog-index .card h2 {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  margin: 7px 0 9px;
  font-size: 18px;
  line-height: 1.28;
}

.blog-index .card p {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  margin: 0;
  font-size: 14px;
  line-height: 1.55;
}

@media (max-width: 820px) {
  .blog-index .cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 620px) {
  .blog-index .shell {
    padding-top: 24px;
  }

  .blog-index .shell > header {
    margin-bottom: 22px;
  }

  .blog-index .cards {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .blog-index .card {
    display: grid;
    grid-template-columns: 112px minmax(0, 1fr);
  }

  .blog-index .card-media {
    aspect-ratio: 1 / 1;
  }

  .blog-index .card > div {
    padding: 13px 14px;
  }

  .blog-index .card h2 {
    margin-bottom: 0;
    font-size: 16px;
  }

  .blog-index .card p {
    display: none;
  }
}
`;

export async function compactBlogIndex(dist) {
  const indexPath = join(dist, 'blog', 'index.html');
  const cssPath = join(dist, 'assets', 'blog.css');

  let html = await readFile(indexPath, 'utf8');
  html = addBodyClass(html);
  html = wrapCardImages(html);
  await writeFile(indexPath, html);

  let css = await readFile(cssPath, 'utf8');
  if (!css.includes(marker)) {
    css += compactCss;
    await writeFile(cssPath, css);
  }

  console.log('blog kartları kompakt kare düzene geçirildi');
}
