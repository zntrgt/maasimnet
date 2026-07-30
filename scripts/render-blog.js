import { addBlog } from './add-blog.js';
import { addFinancialHealthBlog } from './add-financial-health-blog.js';
import { addCoreBlogCluster } from './add-core-blog-cluster.js';
import { addBenefitsBlogCluster } from './add-benefits-blog-cluster.js';
import { ensureBlogIndex } from './ensure-blog-index.js';
import { ensureBlogBreadcrumbSchema } from './ensure-blog-breadcrumb-schema.js';
import { applyBlogImages } from './apply-blog-images.js';
import { compactBlogIndex } from './compact-blog-index.js';
import { normalizeBlogVisuals } from './normalize-blog-visuals.js';
import { validateBlogManifest } from '../content/blog-manifest.js';

export async function renderBlog(dist) {
  validateBlogManifest();

  await addBlog(dist);
  await addFinancialHealthBlog(dist);
  await addCoreBlogCluster(dist);
  await addBenefitsBlogCluster(dist);

  await ensureBlogIndex(dist);
  await ensureBlogBreadcrumbSchema(dist);
  await applyBlogImages(dist);
  await compactBlogIndex(dist);
  await normalizeBlogVisuals(dist);

  console.log('blog üretim hattı tek giriş noktasından tamamlandı');
}
