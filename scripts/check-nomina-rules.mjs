import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const featureRoot = path.join(repoRoot, 'src', 'app', 'features', 'nomina-mensual');
const rulesDir = path.join(featureRoot, 'rules');

const CONTRACT_ONLY_RULES = new Set([
  'proceso-mensual-flujo-completo.rules',
]);

function walk(dir) {
  return readdirSync(dir)
    .flatMap((entry) => {
      const full = path.join(dir, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) {
        return walk(full);
      }
      return stat.isFile() && full.endsWith('.ts') ? [full] : [];
    });
}

function normalize(file) {
  return path.relative(repoRoot, file).replaceAll(path.sep, '/');
}

const tsFiles = walk(featureRoot);
const ruleFiles = readdirSync(rulesDir)
  .filter((name) => name.endsWith('.rules.ts'))
  .map((name) => path.join(rulesDir, name))
  .sort();

const failures = [];
const report = [];

for (const ruleFile of ruleFiles) {
  const basename = path.basename(ruleFile, '.ts');
  const specFile = path.join(rulesDir, `${basename}.spec.ts`);
  if (!existsSync(specFile)) {
    failures.push(`${normalize(ruleFile)} no tiene spec ${path.basename(specFile)}`);
  }

  const importToken = basename;
  const references = tsFiles
    .filter((file) => file !== ruleFile && file !== specFile)
    .filter((file) => readFileSync(file, 'utf8').includes(importToken));

  const productiveReferences = references.filter((file) => !file.endsWith('.spec.ts'));
  const kind = productiveReferences.length > 0
    ? 'productive'
    : CONTRACT_ONLY_RULES.has(basename)
      ? 'contract-only'
      : 'unclassified';

  if (kind === 'unclassified') {
    failures.push(`${normalize(ruleFile)} no tiene uso productivo ni clasificacion contract-only`);
  }

  report.push({
    rule: basename,
    kind,
    spec: existsSync(specFile),
    productiveReferences: productiveReferences.map(normalize),
  });
}

for (const item of report) {
  const refs = item.productiveReferences.length;
  console.log(`${item.kind.padEnd(13)} ${item.spec ? 'spec' : 'no-spec'} ${String(refs).padStart(2)} ${item.rule}`);
}

if (failures.length > 0) {
  console.error('\nNomina rules audit failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`\nNomina rules audit OK. Rules revisadas: ${report.length}.`);
