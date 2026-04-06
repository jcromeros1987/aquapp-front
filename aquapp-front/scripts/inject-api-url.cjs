/**
 * Lee NG_API_URL (o API_URL) desde .env y actualiza apiUrl en environment.prod.ts
 * antes de `ng build --configuration=production`.
 *
 * Búsqueda de .env: ./.env y ../.env (carpeta padre del proyecto Angular).
 * Si no hay variable, no modifica el archivo (se usa lo ya definido en environment.prod.ts).
 */
const fs = require('fs');
const path = require('path');

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  const out = {};
  const text = fs.readFileSync(filePath, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const eq = trimmed.indexOf('=');
    if (eq === -1) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function main() {
  const root = path.join(__dirname, '..');
  const envLocal = path.join(root, '.env');
  const envParent = path.join(root, '..', '.env');
  let env = loadEnv(envLocal);
  if (!Object.keys(env).length) {
    env = loadEnv(envParent);
  }

  const apiUrl = env.NG_API_URL || env.API_URL;
  if (!apiUrl || !String(apiUrl).trim()) {
    console.warn(
      '[inject-api-url] Sin NG_API_URL en .env — se mantiene apiUrl de environment.prod.ts.',
    );
    process.exit(0);
  }

  const trimmed = String(apiUrl).trim().replace(/\/+$/, '');
  const prodPath = path.join(root, 'src', 'environments', 'environment.prod.ts');
  let content = fs.readFileSync(prodPath, 'utf8');
  const escaped = trimmed.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const apiUrlPattern = /apiUrl:\s*['"][^'"]*['"]/;
  if (!apiUrlPattern.test(content)) {
    console.warn('[inject-api-url] No se encontró apiUrl en environment.prod.ts.');
    process.exit(1);
  }
  const next = content.replace(apiUrlPattern, `apiUrl: '${escaped}'`);
  if (next !== content) {
    fs.writeFileSync(prodPath, next, 'utf8');
  }
  console.log('[inject-api-url] apiUrl ->', trimmed);
}

main();
