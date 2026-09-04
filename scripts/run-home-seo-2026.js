import { join } from 'node:path';
import { applyHomeSeo2026 } from './apply-home-seo-2026.js';

await applyHomeSeo2026(join(process.cwd(), 'dist'));
