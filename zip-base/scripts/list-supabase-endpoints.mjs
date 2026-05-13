import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const configPath = path.join(projectRoot, 'public', 'app-config.json');
const schemaPath = path.join(projectRoot, 'src', 'app', 'supabase', 'supabase.ts');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function getBlock(source, blockName, indent = '') {
  const startMarker = `${indent}${blockName}: {`;
  const start = source.indexOf(startMarker);
  if (start === -1) {
    return '';
  }

  let depth = 0;
  let bodyStart = -1;
  for (let i = start; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === '{') {
      depth += 1;
      if (bodyStart === -1) {
        bodyStart = i + 1;
      }
    } else if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(bodyStart, i);
      }
    }
  }

  return '';
}

function extractNames(sectionBody) {
  const names = [];
  const lines = sectionBody.split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s{6}([a-zA-Z_][a-zA-Z0-9_]*): \{$/);
    if (match) {
      names.push(match[1]);
    }
  }
  return names;
}

if (!fs.existsSync(configPath)) {
  console.error('Falta public/app-config.json. Copia public/app-config.example.json y completa tus valores.');
  process.exit(1);
}

if (!fs.existsSync(schemaPath)) {
  console.error('No existe src/app/supabase/supabase.ts.');
  process.exit(1);
}

const appConfig = readJson(configPath);
const supabaseUrl = (appConfig.supabaseUrl ?? '').replace(/\/$/, '');
if (!supabaseUrl) {
  console.error('Falta supabaseUrl en public/app-config.json.');
  process.exit(1);
}

const raw = fs.readFileSync(schemaPath, 'utf8');
const publicBlock = getBlock(raw, 'public', '  ');
const graphqlBlock = getBlock(raw, 'graphql_public', '  ');

const publicTables = extractNames(getBlock(publicBlock, 'Tables'));
const publicViews = extractNames(getBlock(publicBlock, 'Views'));
const publicFunctions = extractNames(getBlock(publicBlock, 'Functions'));
const graphqlFunctions = extractNames(getBlock(graphqlBlock, 'Functions'));

console.log(`Base URL: ${supabaseUrl}`);
console.log('');

console.log('REST tables');
for (const name of publicTables) {
  console.log(`${supabaseUrl}/rest/v1/${name}`);
}

console.log('');
console.log('REST views');
for (const name of publicViews) {
  console.log(`${supabaseUrl}/rest/v1/${name}`);
}

console.log('');
console.log('RPC functions');
for (const name of publicFunctions) {
  console.log(`${supabaseUrl}/rest/v1/rpc/${name}`);
}

if (graphqlFunctions.length > 0) {
  console.log('');
  console.log('GraphQL / graphql_public');
  console.log(`${supabaseUrl}/graphql/v1`);
  for (const name of graphqlFunctions) {
    console.log(`# function: ${name}`);
  }
}

console.log('');
console.log('Base services');
console.log(`${supabaseUrl}/auth/v1/`);
console.log(`${supabaseUrl}/storage/v1/`);
console.log(`${supabaseUrl}/realtime/v1/`);
