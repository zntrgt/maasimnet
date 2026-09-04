import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  blogClusters,
  indexableBlogPosts,
  blogOutputPath,
  blogRoute,
  postsInCluster,
  validateBlogManifest
} from '../content/blog-manifest.js';

validateBlogManifest();
const dist = join(process.cwd(), 'dist');
const failures = [];

for (const post of indexableBlogPosts) {
  const html = await readFile(join(dist, blogOutputPath(post)), 'utf8');
  const clusterPosts = postsInCluster(post.cluster).filter((item) => item.slug !== post.slug);
  const expectedMinimum = Math.min(2, clusterPosts.length);
  const clusterMarker = `data-topic-cluster="${post.cluster}"`;

  if (!html.includes(clusterMarker)) failures.push(`${post.slug}: topic cluster bölümü yok (${post.cluster})`);
  if (!html.includes(blogClusters[post.cluster].title)) failures.push(`${post.slug}: cluster başlığı görünür değil`);
  if (!html.includes(`href="${blogClusters[post.cluster].toolHref}"`)) failures.push(`${post.slug}: cluster tool CTA eksik`);

  const relatedCount = clusterPosts.filter((item) => html.includes(`href="${blogRoute(item)}"`)).length;
  if (relatedCount < expectedMinimum) {
    failures.push(`${post.slug}: aynı cluster iç linki yetersiz (${relatedCount}/${expectedMinimum})`);
  }
}

const indexHtml = await readFile(join(dist, 'blog', 'index.html'), 'utf8');
if (!indexHtml.includes('class="blog-cluster-hubs"')) failures.push('Blog index konu kümesi hub alanı yok');
for (const [clusterKey, cluster] of Object.entries(blogClusters)) {
  if (!indexHtml.includes(`data-blog-cluster="${clusterKey}"`)) failures.push(`Blog index cluster kartı yok: ${clusterKey}`);
  if (!indexHtml.includes(cluster.title)) failures.push(`Blog index cluster başlığı yok: ${cluster.title}`);
  const clusterPosts = postsInCluster(clusterKey);
  const linked = clusterPosts.filter((post) => indexHtml.includes(`href="${blogRoute(post)}"`)).length;
  if (linked < Math.min(3, clusterPosts.length)) failures.push(`Blog index cluster link kapsamı düşük: ${clusterKey} (${linked})`);
}

if (failures.length) {
  console.error('Topic cluster doğrulaması başarısız:\n- ' + failures.join('\n- '));
  process.exit(1);
}

console.log(`Topic cluster yapısı doğrulandı: ${Object.keys(blogClusters).length} küme, ${indexableBlogPosts.length} blog.`);
