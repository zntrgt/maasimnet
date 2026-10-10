// Etiket özniteliklerini sıradan bağımsız okur (bazı sayfalarda content önce, property sonra gelir).
const ATTR_RE = /([a-zA-Z:-]+)\s*=\s*"([^"]*)"/g;
export function tagAttrs(tag) {
  const out = {};
  for (const [, k, v] of tag.matchAll(ATTR_RE)) out[k.toLowerCase()] = v;
  return out;
}
export function findTag(html, name, predicate) {
  for (const [tag] of html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))) {
    const attrs = tagAttrs(tag);
    if (predicate(attrs)) return { tag, attrs };
  }
  return null;
}
export const canonicalOf = (html) => findTag(html, 'link', (a) => a.rel === 'canonical')?.attrs.href;
export const metaOf = (html, key, value) => findTag(html, 'meta', (a) => a[key] === value);
