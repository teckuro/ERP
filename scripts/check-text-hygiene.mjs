import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const BASELINE_PATH = path.join(ROOT, 'scripts', 'text-hygiene-baseline.json');
const UPDATE_BASELINE = process.argv.includes('--update-baseline');

const SCAN_ROOTS = ['docs', 'src', 'tests'];
const TEXT_EXTENSIONS = new Set(['.md', '.html', '.ts']);
const SKIP_DIRS = new Set([
  '.angular',
  '.git',
  'coverage',
  'dist',
  'node_modules',
  'playwright-report',
  'test-results',
  'test-results-nomina-debug',
  'test-results-nomina-flow-debug',
]);

const MOJIBAKE_RE = /[\u00c3\u00c2\u00e2\ufffd]/;
const CONTROL_RE = /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/;

const ACCENT_RULES = [
  ['accion', 'acción'],
  ['actualizacion', 'actualización'],
  ['administracion', 'administración'],
  ['aplicacion', 'aplicación'],
  ['aprobacion', 'aprobación'],
  ['asignacion', 'asignación'],
  ['autenticacion', 'autenticación'],
  ['basica', 'básica'],
  ['bitacora', 'bitácora'],
  ['calculo', 'cálculo'],
  ['catalogo', 'catálogo'],
  ['codigo', 'código'],
  ['codigos', 'códigos'],
  ['comision', 'comisión'],
  ['configuracion', 'configuración'],
  ['confirmacion', 'confirmación'],
  ['contratacion', 'contratación'],
  ['creacion', 'creación'],
  ['critica', 'crítica'],
  ['decision', 'decisión'],
  ['definicion', 'definición'],
  ['descripcion', 'descripción'],
  ['diagnostico', 'diagnóstico'],
  ['documentacion', 'documentación'],
  ['edicion', 'edición'],
  ['ejecucion', 'ejecución'],
  ['eliminacion', 'eliminación'],
  ['estandar', 'estándar'],
  ['evaluacion', 'evaluación'],
  ['excepcion', 'excepción'],
  ['generacion', 'generación'],
  ['historico', 'histórico'],
  ['implementacion', 'implementación'],
  ['informacion', 'información'],
  ['integracion', 'integración'],
  ['liquidacion', 'liquidación'],
  ['logica', 'lógica'],
  ['modulo', 'módulo'],
  ['modulos', 'módulos'],
  ['nomina', 'nómina'],
  ['observacion', 'observación'],
  ['opcion', 'opción'],
  ['operacion', 'operación'],
  ['pagina', 'página'],
  ['parametro', 'parámetro'],
  ['parametros', 'parámetros'],
  ['periodo', 'período'],
  ['politica', 'política'],
  ['prevision', 'previsión'],
  ['proxima', 'próxima'],
  ['proximas', 'próximas'],
  ['relacion', 'relación'],
  ['remuneracion', 'remuneración'],
  ['repeticion', 'repetición'],
  ['revision', 'revisión'],
  ['segun', 'según'],
  ['tambien', 'también'],
  ['tecnica', 'técnica'],
  ['tecnico', 'técnico'],
  ['titulo', 'título'],
  ['ultima', 'última'],
  ['validacion', 'validación'],
  ['version', 'versión'],
];

const ACCENT_RES = ACCENT_RULES.map(([plain, accented]) => ({
  plain,
  accented,
  re: new RegExp(`(^|[^\\p{L}\\p{N}_])(${plain})(?=$|[^\\p{L}\\p{N}_])`, 'giu'),
}));

function toRelative(filePath) {
  return path.relative(ROOT, filePath).replaceAll(path.sep, '/');
}

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(path.join(dir, entry.name), files);
      continue;
    }

    if (entry.isFile() && TEXT_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      files.push(path.join(dir, entry.name));
    }
  }

  return files;
}

function normalizeExcerpt(value) {
  return value.replace(/\s+/g, ' ').trim().slice(0, 180);
}

function shouldIgnoreMojibake(file, line) {
  return file === 'docs/codex/estilos/README.md' && (line.includes('mojibake') || line.includes('Select-String'));
}

const TECHNICAL_LITERAL_RE =
  /^[a-z][a-z0-9_-]*(\.[a-z][a-z0-9_-]*)+$/i;
const IDENTIFIER_LITERAL_RE = /^[a-z][a-z0-9_-]*$/i;

function isTechnicalTsLiteral(text) {
  if (!text || !/[a-z]/i.test(text)) return true;
  if (TECHNICAL_LITERAL_RE.test(text)) return true;
  if (/[/\\]/.test(text)) return true;
  if (/\.(ts|rules|spec|md|html|css|mjs|cjs|json)(\b|$)/i.test(text)) return true;
  if (/^app-[a-z0-9-]+$/i.test(text)) return true;
  if (/^[a-z0-9]+(-[a-z0-9]+)+$/i.test(text) && !/\s/.test(text)) return true;
  return false;
}

function isTsImportExportLine(line) {
  const trimmed = line.trimStart();
  return (
    trimmed.startsWith('import ') ||
    trimmed.startsWith('export type') ||
    trimmed.startsWith('export {') ||
    trimmed.startsWith('export *') ||
    (trimmed.startsWith('export ') && trimmed.includes(' from ')) ||
    trimmed.startsWith('console.')
  );
}

function isTsDomainKeyLiteral(line, text) {
  if (!IDENTIFIER_LITERAL_RE.test(text)) return false;

  const idFieldRe = /\b(id|field)\s*:\s*['"`]([^'"`]+)['"`]/g;
  let idFieldMatch;
  while ((idFieldMatch = idFieldRe.exec(line))) {
    if (idFieldMatch[2] === text) return true;
  }

  if (/\b(case|kind|selector|templateUrl|styleUrl)\s*:\s*['"`]/.test(line)) {
    return true;
  }
  if (/^\s*['"`][a-z][a-z0-9_-]*['"`]\s*,?\s*$/i.test(line.trim())) return true;
  return false;
}

function isTestTechnicalLine(file, line) {
  if (!file.startsWith('tests/')) return false;
  return (
    /\.locator\(|getByRole|formcontrolname|spawnSync|test\.describe|page\.|process\.execPath/.test(line) ||
    /#parametros-|\.parametros-|app-parametros-|'--periodo'|--reset-|--apply-/.test(line)
  );
}

function isLikelyUserFacingTsLine(line) {
  return /\b(header|label|title|message|mensaje|placeholder|aria-label)\s*:/i.test(line) ||
    /throw new Error|return\s*`/.test(line);
}

function shouldScanTsLiteral(line, text) {
  if (isTechnicalTsLiteral(text)) return false;
  if (isTsDomainKeyLiteral(line, text)) return false;
  if (IDENTIFIER_LITERAL_RE.test(text) && !isLikelyUserFacingTsLine(line)) return false;
  if (/\{ id: /.test(line) && IDENTIFIER_LITERAL_RE.test(text) && !/\b(header|label)\s*:\s*['"`]/.test(line)) {
    return false;
  }
  return true;
}

function templateLiteralProseChunks(text) {
  return text.split(/\$\{[^}]*\}/).filter((chunk) => /[a-záéíóúñ]/i.test(chunk));
}

function stripMarkdownBackticks(line) {
  return line
    .replace(/`[^`]*`/g, ' ')
    .replace(/\[[^\]]*\]\([^)]*\)/g, ' ');
}

function isSpecTestDescriptionLine(file, line) {
  if (!file.endsWith('.spec.ts')) return false;
  const trimmed = line.trimStart();
  return (
    trimmed.startsWith('it(') ||
    trimmed.startsWith('describe(') ||
    trimmed.startsWith('expect(')
  );
}

function htmlVisibleSegments(line) {
  const segments = [];

  const attrRe =
    /\b(?:placeholder|title|aria-label)\s*=\s*(['"])(.*?)\1/gi;
  let match;
  while ((match = attrRe.exec(line))) {
    if (match[2].trim()) segments.push(match[2]);
  }

  const labelRe = /<label\b[^>]*>([^<]*)<\/label>/gi;
  while ((match = labelRe.exec(line))) {
    if (match[1].trim()) segments.push(match[1]);
  }

  const textRe = />([^<]+)</g;
  while ((match = textRe.exec(line))) {
    const text = match[1].trim();
    if (!text || text.startsWith('{{') || text.startsWith('<!--')) continue;
    if (/^[\s{}\[\]|.:,;#%+\-*/\\()0-9]+$/i.test(text)) continue;
    segments.push(text);
  }

  return segments;
}

function textSegments(file, line) {
  if (file.endsWith('.ts')) {
    if (isTsImportExportLine(line)) return [];
    if (isSpecTestDescriptionLine(file, line)) return [];
    if (isTestTechnicalLine(file, line)) return [];

    const segments = [];
    const literalRe = /(['"`])((?:\\.|(?!\1).)*)(\1)/g;
    let match;
    while ((match = literalRe.exec(line))) {
      const quote = match[1];
      const text = match[2];
      if (!shouldScanTsLiteral(line, text)) continue;

      if (quote === '`' && text.includes('${')) {
        for (const chunk of templateLiteralProseChunks(text)) {
          if (/[a-záéíóúñ ]/i.test(chunk)) segments.push(chunk);
        }
        continue;
      }

      if (/[a-záéíóúñ ]/i.test(text)) segments.push(text);
    }
    return segments;
  }

  if (file.endsWith('.html')) {
    return htmlVisibleSegments(line);
  }

  if (file.endsWith('.md')) {
    const prose = stripMarkdownBackticks(line);
    return prose.trim() ? [prose] : [];
  }

  return [line];
}

function scanFile(absPath) {
  const file = toRelative(absPath);
  const text = fs.readFileSync(absPath, 'utf8');
  const lines = text.split(/\r?\n/);
  const findings = [];
  let inMarkdownFence = false;

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    if (file.endsWith('.md') && line.trimStart().startsWith('```')) {
      inMarkdownFence = !inMarkdownFence;
    }

    if (!shouldIgnoreMojibake(file, line) && MOJIBAKE_RE.test(line)) {
      findings.push({
        type: 'mojibake',
        file,
        line: lineNumber,
        token: 'mojibake',
        suggestion: 'Reescribir el texto en UTF-8 normal',
        excerpt: normalizeExcerpt(line),
      });
    }

    if (CONTROL_RE.test(line)) {
      findings.push({
        type: 'control-char',
        file,
        line: lineNumber,
        token: 'control-char',
        suggestion: 'Eliminar caracteres de control invisibles',
        excerpt: normalizeExcerpt(line),
      });
    }

    if (inMarkdownFence) return;

    for (const segment of textSegments(file, line)) {
      for (const rule of ACCENT_RES) {
        rule.re.lastIndex = 0;
        if (!rule.re.test(segment)) continue;

        findings.push({
          type: 'accent',
          file,
          line: lineNumber,
          token: rule.plain,
          suggestion: rule.accented,
          excerpt: normalizeExcerpt(line),
        });
      }
    }
  });

  return findings;
}

function findingKey(finding) {
  return [finding.type, finding.file, finding.token, finding.excerpt].join('|');
}

function readBaseline() {
  if (!fs.existsSync(BASELINE_PATH)) return new Set();
  const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
  return new Set(baseline.findings.map((finding) => finding.key));
}

const files = SCAN_ROOTS.flatMap((root) => walk(path.join(ROOT, root))).sort();
const findings = files.flatMap(scanFile);
const hardFailures = findings.filter((finding) => finding.type !== 'accent');
const accentFindings = findings.filter((finding) => finding.type === 'accent');

if (UPDATE_BASELINE) {
  const unique = new Map();
  for (const finding of accentFindings) {
    unique.set(findingKey(finding), {
      key: findingKey(finding),
      file: finding.file,
      token: finding.token,
      suggestion: finding.suggestion,
      excerpt: finding.excerpt,
    });
  }

  fs.writeFileSync(
    BASELINE_PATH,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        note: 'Deuda historica de acentos. El check falla solo si aparecen hallazgos nuevos no presentes aqui.',
        findings: [...unique.values()].sort((a, b) => a.key.localeCompare(b.key)),
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
  console.log(`Baseline actualizada: ${path.relative(ROOT, BASELINE_PATH)} (${unique.size} hallazgos).`);
}

const baseline = readBaseline();
const newAccentFindings = accentFindings.filter((finding) => !baseline.has(findingKey(finding)));
const failures = [...hardFailures, ...newAccentFindings];

if (failures.length) {
  console.error('Text hygiene check failed.');
  for (const finding of failures.slice(0, 80)) {
    console.error(
      `${finding.file}:${finding.line} [${finding.type}] "${finding.token}" -> ${finding.suggestion}\n  ${finding.excerpt}`,
    );
  }
  if (failures.length > 80) console.error(`... ${failures.length - 80} hallazgos adicionales.`);
  process.exit(1);
}

console.log(
  `Text hygiene OK. Archivos revisados: ${files.length}. Deuda acentos en baseline: ${baseline.size}. Hallazgos nuevos: 0.`,
);
