import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const root = process.cwd();
const appRoot = join(root, 'src', 'app');
const hostRoots = ['pages', 'services'].map((dir) => join(appRoot, dir));
const restrictedImports = [
  'components/editor-menu',
  'components/page-layout-editor',
  'components/property-panel',
  'models/block-schemas',
  'models/content-block.model',
  'page-layout-editor/internal',
  'utils/layout-utils',
];

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return walk(path);
    return path.endsWith('.ts') ? [path] : [];
  });
}

function importTargets(source) {
  const matches = source.matchAll(/from\s+['"]([^'"]+)['"]/g);
  return [...matches].map((match) => match[1]);
}

const violations = [];

for (const rootDir of hostRoots) {
  for (const file of walk(rootDir)) {
    const source = readFileSync(file, 'utf8');
    const relativeFile = relative(root, file);

    for (const target of importTargets(source)) {
      const normalizedTarget = target.replaceAll('\\', '/');
      const isRestricted = restrictedImports.some((restricted) =>
        normalizedTarget.includes(restricted)
      );
      const isPublicApi = normalizedTarget.includes('page-layout-editor/');

      if (isRestricted && !isPublicApi) {
        violations.push(`${relativeFile}${sep}${target}`);
      }
    }
  }
}

if (violations.length) {
  console.error('Host/editor boundary violations found:');
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log('Editor boundary check passed.');
