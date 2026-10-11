import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Content-Security-Policy (#4): `connect-src 'none'` verbiedt de pagina élke netwerkverbinding
 * (fetch, XHR, WebSocket, beacon), ook naar de eigen site. Er is geen AI-model om te laden (#2),
 * dus de app heeft geen enkele verbinding nodig. Zelfs een bug kan geen beeld versturen.
 * Enkel in de build: de ontwikkelserver heeft een websocket nodig voor live herladen.
 */
export const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "media-src 'self' blob: mediastream:",
  "font-src 'self'",
  "worker-src 'self'",
  "manifest-src 'self'",
  "connect-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ');

function cspPlugin(): Plugin {
  return {
    name: 'kat-csp',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`);
    },
  };
}

/**
 * Service worker voor offline gebruik (#21): bewaart bij de installatie alle bestanden van de app.
 * Hij leeft buiten de pagina en haalt enkel de eigen bestanden op (zelfde domein); dat is de enige
 * plek met `fetch` in het project, en scripts/check-privacy.mjs laat enkel dit bestand toe (#48).
 */
function serviceWorkerPlugin(): Plugin {
  return {
    name: 'kat-sw',
    apply: 'build',
    generateBundle(_options, bundle) {
      const files = Object.keys(bundle).filter((f) => !f.endsWith('.map'));
      const all = ['./', './manifest.webmanifest', './icon.svg', ...files.map((f) => `./${f}`)];
      const version = createHash('sha256').update(all.join('|')).digest('hex').slice(0, 12);
      const sw = `// The Eye of the Kat — service worker, gegenereerd bij de build. Bewaart de app voor offline gebruik.
const CACHE = 'kat-${version}';
const FILES = ${JSON.stringify(all)};
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('kat-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      if (e.request.mode === 'navigate') return fetch(e.request).catch(() => caches.match('./'));
      return fetch(e.request);
    }),
  );
});
`;
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: sw });
    },
  };
}

/** Getoond in de app en in de export: zo weet je welke versie een toestel getest heeft. */
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8')) as { version: string };
const APP_VERSION = `${pkg.version}-${process.env.GITHUB_SHA?.slice(0, 7) ?? 'lokaal'}`;

export default defineConfig({
  // Relatieve paden: werkt op GitHub Pages onder /EyeOfTheKat/ (#36).
  base: './',
  define: { __APP_VERSION__: JSON.stringify(APP_VERSION) },
  plugins: [react(), cspPlugin(), serviceWorkerPlugin()],
  // Eigen vaste poorten, zodat een service worker van een ander project niet in de weg zit.
  server: { port: 5337, strictPort: true },
  preview: { port: 4337, strictPort: true },
  build: {
    target: 'es2020',
    // Geen polyfill die modules via fetch() laadt (die zou de CSP blokkeren).
    modulePreload: { polyfill: false },
  },
});
