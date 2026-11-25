import { join } from 'node:path';
import { auditContextualLinks } from './contextual-links.js';
await auditContextualLinks(join(process.cwd(),'dist'),{repair:process.argv.includes('--repair')});
