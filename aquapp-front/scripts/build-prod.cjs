/**
 * 1) inject-api-url (NG_API_URL en environment.prod.ts)
 * 2) ng build --configuration=production --base-href=NG_BASE_HREF
 * 3) Escribe .htaccess en dist con RewriteBase acorde a la subcarpeta
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

function normalizeBaseHref(raw) {
  if (raw == null || String(raw).trim() === '') {
    return '/';
  }
  let b = String(raw).trim();
  if (!b.startsWith('/')) {
    b = '/' + b;
  }
  if (b.length > 1 && !b.endsWith('/')) {
    b += '/';
  }
  return b;
}

function writeHtaccess(browserDir, rewriteBase) {
  const rb =
    rewriteBase === '/' ? '/' : rewriteBase.endsWith('/') ? rewriteBase : rewriteBase + '/';
  const content = `# Aquapp dashboard (Angular) — generado por scripts/build-prod.cjs
DirectoryIndex index.html

<IfModule mod_autoindex.c>
  Options -Indexes
</IfModule>

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase ${rb}

  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  RewriteRule ^ index.html [L]
</IfModule>
`;
  fs.writeFileSync(path.join(browserDir, '.htaccess'), content, 'utf8');
  console.log('[build-prod] .htaccess creado con RewriteBase', rb);
}

const root = path.join(__dirname, '..');
const envLocal = path.join(root, '.env');
const envParent = path.join(root, '..', '.env');
let env = loadEnv(envLocal);
if (!Object.keys(env).length) {
  env = loadEnv(envParent);
}

execSync('node scripts/inject-api-url.cjs', { cwd: root, stdio: 'inherit' });

const baseHref = normalizeBaseHref(env.NG_BASE_HREF);
console.log('[build-prod] --base-href', baseHref);

const ngJs = path.join(root, 'node_modules', '@angular', 'cli', 'bin', 'ng.js');
try {
  execSync(
    `node "${ngJs}" build --configuration=production --base-href ${JSON.stringify(baseHref)}`,
    {
      cwd: root,
      stdio: 'inherit',
      shell: true,
      env: process.env,
    },
  );
} catch (e) {
  process.exit(e.status ?? 1);
}

const outDir = path.join(root, 'dist', 'aquapp-front', 'browser');
if (!fs.existsSync(path.join(outDir, 'index.html'))) {
  console.error('[build-prod] No se encontró dist/aquapp-front/browser/index.html');
  process.exit(1);
}

writeHtaccess(outDir, baseHref);
console.log('[build-prod] Listo. Sube el contenido de dist/aquapp-front/browser/ al servidor.');
