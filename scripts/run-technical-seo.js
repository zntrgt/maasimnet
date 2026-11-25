import { join } from 'node:path';
import { auditTechnicalSeo } from './technical-seo.js';
await auditTechnicalSeo(join(process.cwd(),'dist'),{repair:process.argv.includes('--repair')});
