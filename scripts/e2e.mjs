// Eind-tot-eind-test in echte Chrome (headless) met een nep-camera, op de GEBOUWDE versie
// (dus mét de CSP, #4).
//
// Gebruik:  npm run build && npm run e2e [-- <filmpje.y4m>]
//   Zonder filmpje gebruikt Chrome zijn eigen testbeeld. Een testfilmpje maken: npm run testvideo
//
// Controleert altijd:
//   - er gaat geen enkel verzoek naar buiten (ook niet naar de eigen server na het laden);
//   - geen CSP-schendingen of JavaScript-fouten;
// en per scenario (zie SCENARIOS onderaan) wat de app moet tonen.
// Screenshots komen in e2e-output/.

import { preview } from 'vite';
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { SCENARIOS } from './e2e-scenarios.mjs';

const video = process.argv[2];
if (video && !fs.existsSync(video)) {
  console.error(`Filmpje niet gevonden: ${video}`);
  process.exit(2);
}
const OUT = path.resolve('e2e-output');
fs.mkdirSync(OUT, { recursive: true });
const CHROME =
  process.env.CHROME_PATH ??
  ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome'].find((p) =>
    fs.existsSync(p),
  );

let failures = 0;
const check = (ok, label) => {
  console.log(`${ok ? '✓' : '✗'} ${label}`);
  if (!ok) failures++;
};

const server = await preview({ preview: { port: 4337, strictPort: true } });
const url = 'http://localhost:4337/';
const args = ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required', '--window-size=1280,800'];
if (video) args.push(`--use-file-for-fake-video-capture=${path.resolve(video)}`);
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clickText = async (page, text) => {
  const ok = await page.evaluate((t) => {
    const el = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim().toLowerCase().includes(t.toLowerCase()));
    if (el) el.click();
    return !!el;
  }, text);
  if (!ok) throw new Error(`Knop "${text}" niet gevonden`);
};
const debugValues = (page) =>
  page.evaluate(() => {
    const out = {};
    for (const tr of document.querySelectorAll('.debugpanel tr')) {
      const [k, v] = [...tr.querySelectorAll('td')].map((td) => td.textContent ?? '');
      out[k] = v;
    }
    out.__fps = Number(document.querySelector('.debugbar b')?.textContent ?? '0');
    return out;
  });

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  const external = [];
  const lateRequests = [];
  const errors = [];
  let loaded = false;
  page.on('request', (r) => {
    const u = new URL(r.url());
    if (u.protocol === 'data:' || u.protocol === 'blob:') return;
    if (!['localhost', '127.0.0.1'].includes(u.hostname)) external.push(r.url());
    else if (loaded && !u.pathname.endsWith('sw.js')) lateRequests.push(r.url());
  });
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.goto(url, { waitUntil: 'networkidle0' });
  // Na het laden mag de pagina zelf niets meer ophalen: het spel werkt volledig offline.
  await sleep(500);
  loaded = true;

  const name = process.env.E2E_SCENARIO ?? 'camera';
  const scenario = SCENARIOS[name];
  if (!scenario) throw new Error(`Onbekend scenario: ${name}`);
  console.log(`Scenario: ${name}`);
  await scenario({ page, clickText, debugValues, sleep, check, OUT, video });

  check(external.length === 0, `geen verzoeken naar andere domeinen${external.length ? `: ${external.slice(0, 3).join(', ')}` : ''}`);
  check(lateRequests.length === 0, `geen netwerkverzoeken tijdens het spelen${lateRequests.length ? `: ${lateRequests.slice(0, 3).join(', ')}` : ''}`);
  const csp = await page.evaluate(() => document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.getAttribute('content') ?? '');
  check(csp.includes("connect-src 'none'"), "CSP connect-src 'none' actief");
  // Probeer zelf iets te versturen: de CSP moet dat blokkeren.
  const blocked = await page.evaluate(async () => {
    try {
      await window.fetch('/manifest.webmanifest');
      return false;
    } catch {
      return true;
    }
  });
  check(blocked, 'een poging tot netwerkverkeer wordt door de CSP geblokkeerd');
  const realErrors = errors.filter((e) => !e.includes("connect-src 'none'") && !e.includes('Refused to connect') && !e.includes('Failed to fetch'));
  check(realErrors.length === 0, `geen fouten in de console${realErrors.length ? `: ${realErrors.slice(0, 3).join(' | ')}` : ''}`);
} catch (err) {
  console.error(err);
  failures++;
} finally {
  await browser.close();
  await server.close();
}

console.log(failures ? `\n${failures} controle(s) mislukt` : '\nAlles in orde');
process.exit(failures ? 1 : 0);
