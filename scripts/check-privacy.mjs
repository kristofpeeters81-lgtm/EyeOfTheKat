// Privacycontrole (#2, #4, #48). Draait vóór elke test en build, en na de build met --dist.
//
// Faalt als:
//   1. er een AI/ML-pakket in package.json of package-lock.json staat;
//   2. de broncode (src/) een netwerk-API gebruikt (fetch, XHR, WebSocket, beacon, EventSource,
//      WebRTC) of een AI/ML-bibliotheek importeert;
//   3. (--dist) de gebouwde pagina de CSP `connect-src 'none'` niet bevat, of de bundel toch een
//      netwerk-API of ML-code bevat. Enkel sw.js (de offline-cache, eigen bestanden) mag fetch.
//
// Zo is "geen AI en niets verstuurd" niet alleen beloofd, maar bij elke build nagekeken.

import fs from 'node:fs';
import path from 'node:path';

const ML_PACKAGES = /(mediapipe|tensorflow|@tensorflow|tfjs|onnx|ml5|brain\.js|synaptic|face-api|handtrack|posenet|movenet|blazepose|transformers|opencv)/i;
const NETWORK_API = /\bfetch\s*\(|XMLHttpRequest|new\s+WebSocket|sendBeacon|EventSource|RTCPeerConnection|importScripts\s*\(/;

const errors = [];
const fail = (msg) => errors.push(msg);

function walk(dir, exts) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p, exts));
    else if (exts.some((e) => entry.name.endsWith(e))) out.push(p);
  }
  return out;
}

// 1. Pakketten
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
for (const name of Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })) {
  if (ML_PACKAGES.test(name)) fail(`AI/ML-pakket in package.json: ${name}`);
}
if (fs.existsSync('package-lock.json')) {
  const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
  for (const key of Object.keys(lock.packages ?? {})) {
    const name = key.replace(/^.*node_modules\//, '');
    if (name && ML_PACKAGES.test(name)) fail(`AI/ML-pakket in package-lock.json: ${name}`);
  }
}

// 2. Broncode (tests mogen niets anders: ook daar geen netwerk)
for (const file of walk('src', ['.ts', '.tsx'])) {
  const text = fs.readFileSync(file, 'utf8');
  const code = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  if (NETWORK_API.test(code)) fail(`Netwerk-API in ${file}: ${code.match(NETWORK_API)[0]}`);
  const imports = [...code.matchAll(/from\s+['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]/g)].map((m) => m[1] ?? m[2]);
  for (const spec of imports) if (ML_PACKAGES.test(spec)) fail(`AI/ML-import in ${file}: ${spec}`);
}

// 3. De gebouwde app
if (process.argv.includes('--dist')) {
  const html = fs.readFileSync('dist/index.html', 'utf8');
  if (!/Content-Security-Policy[^>]*connect-src 'none'/.test(html)) fail("dist/index.html: CSP met connect-src 'none' ontbreekt");
  for (const file of walk('dist', ['.js'])) {
    if (path.basename(file) === 'sw.js') continue;
    const text = fs.readFileSync(file, 'utf8');
    if (NETWORK_API.test(text)) fail(`Netwerk-API in de bundel ${file}: ${text.match(NETWORK_API)[0]}`);
    if (/\.tflite|\.onnx|\.task\b|tensorflow|mediapipe/i.test(text)) fail(`Sporen van ML-code in ${file}`);
  }
  for (const file of walk('dist', ['.tflite', '.onnx', '.task', '.wasm'])) fail(`Modelbestand/WASM in de build: ${file}`);
}

if (errors.length) {
  console.error('✗ Privacycontrole mislukt:\n  - ' + errors.join('\n  - '));
  process.exit(1);
}
console.log(`✓ Privacycontrole${process.argv.includes('--dist') ? ' (build)' : ''}: geen AI/ML, geen netwerk-API's`);
