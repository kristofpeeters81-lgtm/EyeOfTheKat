// Alle eind-tot-eind-scenario's na elkaar (regressietest vóór een grote push).
//
// Gebruik: npm run build && npm run e2e:all
// Maakt eerst het synthetische testfilmpje als het nog niet bestaat (npm run testvideo).
// Duurt enkele minuten. Screenshots in e2e-output/.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const video = path.join('e2e-output', 'synthetisch.y4m');
if (!fs.existsSync(video)) {
  const r = spawnSync(process.execPath, ['scripts/make-test-video.mjs', video], { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const RUNS = [
  { scenario: 'camera' },
  { scenario: 'calibrate', video: true },
  { scenario: 'testlab', video: true },
  { scenario: 'bridge', video: true, query: '?snel=1' },
  { scenario: 'demo', query: '?demo=1&snel=1' },
  { scenario: 'reis', query: '?demo=1&snel=1' },
  { scenario: 'export' },
  { scenario: 'stijl' },
];

const results = [];
for (const run of RUNS) {
  console.log(`\n=== ${run.scenario} ===`);
  const t0 = Date.now();
  const r = spawnSync(process.execPath, ['scripts/e2e.mjs', ...(run.video ? [video] : [])], {
    stdio: 'inherit',
    env: { ...process.env, E2E_SCENARIO: run.scenario, E2E_QUERY: run.query ?? '' },
  });
  results.push({ scenario: run.scenario, ok: r.status === 0, s: Math.round((Date.now() - t0) / 1000) });
}

console.log('\n=== Samenvatting ===');
for (const r of results) console.log(`${r.ok ? '✓' : '✗'} ${r.scenario} (${r.s} s)`);
process.exit(results.every((r) => r.ok) ? 0 : 1);
