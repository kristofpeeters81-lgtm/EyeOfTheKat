// Scenario's voor scripts/e2e.mjs. Kies er één met de omgevingsvariabele E2E_SCENARIO.
import fs from 'node:fs';
import path from 'node:path';

export const SCENARIOS = {
  /** Blok 1: camera start, beelden worden verwerkt. */
  async camera({ page, clickText, debugValues, sleep, check, OUT }) {
    await clickText(page, 'Cameratest');
    await sleep(3000);
    await page.click('.debugbar');
    await sleep(600);
    const v = await debugValues(page);
    check(v.__fps > 5, `beelden worden verwerkt (${v.__fps} fps)`);
    check(/\d+×\d+/.test(v.analyse ?? ''), `analysebeeld ${v.analyse}`);
    await page.screenshot({ path: path.join(OUT, 'camera.png') });
  },

  /** Blok 2: kalibratie met het synthetische filmpje (npm run testvideo). */
  async calibrate(ctx) {
    await clickTextEntry(ctx, 'Kalibreren');
    await calibrateFlow(ctx);
  },

  /** Blok 6: Bridge Sprint volledig spelen (gebruik E2E_QUERY=?snel=1 voor de korte versie). */
  async bridge(ctx) {
    const { page, clickText, sleep, check, OUT } = ctx;
    await clickText(page, 'Losse etappes');
    await calibrateFlow({ ...ctx, skipDebug: true });
    await page.waitForFunction(() => document.querySelector('h2')?.textContent?.includes('Etappes'), { timeout: 8000 });
    await clickText(page, 'Bridge Sprint');
    await sleep(1500);
    await page.screenshot({ path: path.join(OUT, 'bridge-1-intro.png') });
    await page.waitForFunction(() => document.querySelector('.hud-instruction')?.textContent?.includes('SPRINT'), { timeout: 15000 });
    await sleep(1500);
    await page.screenshot({ path: path.join(OUT, 'bridge-2-sprint.png') });
    const rest = await page
      .waitForFunction(() => document.querySelector('.hud-instruction')?.textContent?.includes('Rust'), { timeout: 20000 })
      .then(() => true)
      .catch(() => false);
    check(rest, 'na de sprint volgt een rustfase');
    await sleep(1000);
    await page.screenshot({ path: path.join(OUT, 'bridge-3-rust.png') });
    await page.setViewport({ width: 600, height: 900 });
    await sleep(1200);
    await page.screenshot({ path: path.join(OUT, 'bridge-4-staand.png') });
    await page.setViewport({ width: 1280, height: 800 });
    const done = await page
      .waitForFunction(() => !!document.querySelector('.result'), { timeout: 90000 })
      .then(() => true)
      .catch(() => false);
    check(done, 'de etappe eindigt met een resultaatscherm');
    await sleep(1500);
    await page.screenshot({ path: path.join(OUT, 'bridge-5-resultaat.png') });
    const stars = await page.evaluate(() => document.querySelectorAll('.star.on').length);
    check(stars >= 1, `minstens 1 ster (${stars})`);
  },

  /**
   * Demomodus: elke gebouwde etappe even door de bot laten spelen en een screenshot maken.
   * Gebruik: E2E_SCENARIO=demo E2E_QUERY="?demo=1&snel=1" npm run e2e
   * Optioneel E2E_STAGES="Log Roll,Stone Hop" om er enkele te kiezen.
   */
  async demo({ page, clickText, sleep, check, OUT }) {
    await clickText(page, 'Losse etappes');
    await page.waitForFunction(() => document.querySelector('h2')?.textContent?.includes('Etappes'), { timeout: 8000 });
    const names = await page.evaluate(() => [...document.querySelectorAll('.stage-card:not([disabled]) b')].map((b) => b.textContent ?? ''));
    const only = process.env.E2E_STAGES?.split(',').map((x) => x.trim());
    for (const name of names) {
      if (only && !only.includes(name)) continue;
      await clickText(page, name);
      await sleep(10000);
      const file = `demo-${name.toLowerCase().replace(/[^a-z]+/g, '-')}.png`;
      await page.screenshot({ path: path.join(OUT, file) });
      const hud = await page.evaluate(() => document.querySelector('.hud-instruction')?.textContent ?? '');
      check(hud.length > 0, `${name}: speelt (${hud})`);
      if (process.env.E2E_PORTRAIT) {
        await page.setViewport({ width: 600, height: 900 });
        await sleep(1500);
        await page.screenshot({ path: path.join(OUT, file.replace('.png', '-staand.png')) });
        await page.setViewport({ width: 1280, height: 800 });
      }
      await clickText(page, 'Stop');
      await page.waitForFunction(() => document.querySelector('h2')?.textContent?.includes('Etappes'), { timeout: 5000 });
    }
  },

  /**
   * Blok 10: een volledige ronde in demomodus: nieuwe ninja → kaart → opwarming → Bridge Sprint →
   * resultaat → rust → kaart met de volgende etappe open.
   * Gebruik: E2E_SCENARIO=reis E2E_QUERY="?demo=1&snel=1" npm run e2e
   */
  async reis({ page, clickText, sleep, check, OUT }) {
    await clickText(page, 'Spelen');
    await page.waitForFunction(() => document.querySelector('h2')?.textContent?.includes('Wie speelt'), { timeout: 5000 });
    await clickText(page, 'Nieuwe ninja');
    await page.type('input', 'Testninja');
    await clickText(page, 'Neko');
    await sleep(500);
    await page.screenshot({ path: path.join(OUT, 'reis-1-ninja.png') });
    await clickText(page, 'Maak mijn ninja');
    await page.waitForSelector('.map-node', { timeout: 5000 });
    await sleep(800);
    await page.screenshot({ path: path.join(OUT, 'reis-2-kaart.png') });
    const lockedBefore = await page.evaluate(() => document.querySelectorAll('.map-node.locked').length);
    check(lockedBefore === 8, `8 etappes op slot bij de start (${lockedBefore})`);
    await page.click('.map-node.current');
    await page.waitForFunction(() => document.querySelector('.hud-title b')?.textContent?.includes('Opwarming'), { timeout: 5000 });
    check(true, 'opwarming start bij de eerste etappe');
    await page.waitForFunction(() => document.querySelector('.hud-title b')?.textContent?.includes('Bridge Sprint'), { timeout: 60000 });
    check(true, 'na de opwarming start Bridge Sprint');
    await page.waitForSelector('.result', { timeout: 120000 });
    await sleep(1200);
    await page.screenshot({ path: path.join(OUT, 'reis-3-resultaat.png') });
    await clickText(page, 'Naar de kaart');
    await page.waitForFunction(() => document.querySelector('h2')?.textContent?.includes('Even rusten'), { timeout: 5000 });
    await page.screenshot({ path: path.join(OUT, 'reis-4-rust.png') });
    await page.waitForFunction(() => [...document.querySelectorAll('button')].some((b) => b.textContent?.includes('Naar de kaart') && !b.disabled), { timeout: 20000 });
    await clickText(page, 'Naar de kaart');
    await page.waitForSelector('.map-node', { timeout: 5000 });
    await sleep(800);
    const lockedAfter = await page.evaluate(() => document.querySelectorAll('.map-node.locked').length);
    // In demomodus wordt er niets opgeslagen: de kaart blijft dezelfde.
    check(lockedAfter === 8, `demo slaat geen voortgang op (${lockedAfter} op slot)`);
    await page.screenshot({ path: path.join(OUT, 'reis-5-kaart.png') });
    await page.setViewport({ width: 600, height: 900 });
    await sleep(800);
    await page.screenshot({ path: path.join(OUT, 'reis-6-kaart-staand.png') });
  },

  /** Blok 11: meetgegevens exporteren naar CSV (download controleren). */
  async export({ page, clickText, sleep, check, OUT }) {
    const dir = path.join(OUT, 'downloads');
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    const client = await page.createCDPSession();
    await client.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: dir });
    // Logboek vullen zoals na een echte etappe (getallen, geen beelden).
    await page.evaluate(() => {
      const result = { stageId: 'log-roll', stars: 2, score: 1500, total: 24, detected: 20, auto: 4, manual: 0, activeMs: 60000, highZoneMs: 30000, avgPower: 48, peakPower: 90, durationMs: 90000, pauses: 0, markerMode: false, age: 8 };
      const tech = { appVersion: 'e2e', fps: 29.5, procMs: 4.2, camera: '640×480', analysis: '160×120', orientation: 'liggend', device: 'Windows' };
      localStorage.setItem('eyeOfTheKat.log', JSON.stringify([{ at: new Date().toISOString(), profileId: 'p1', name: 'Zoë', result, tech, fun: 3, effort: 2 }]));
    });
    await page.reload({ waitUntil: 'networkidle0' });
    await clickText(page, 'Meetgegevens');
    await page.waitForFunction(() => document.querySelector('h2')?.textContent?.includes('Meetgegevens'), { timeout: 5000 });
    await page.screenshot({ path: path.join(OUT, 'meetgegevens.png') });
    await clickText(page, 'Export CSV');
    let file = null;
    for (let i = 0; i < 40 && !file; i++) {
      await sleep(250);
      file = fs.readdirSync(dir).find((f) => f.endsWith('.csv'));
    }
    check(!!file, `CSV gedownload (${file})`);
    if (file) {
      const csv = fs.readFileSync(path.join(dir, file), 'utf8');
      check(csv.startsWith('\uFEFFtijdstip;ninja;leeftijd;etappe'), 'CSV-kop klopt (met BOM voor Excel)');
      check(csv.includes('Zoë;8;log-roll;2;1500;24;20;4;0;83'), 'rij met de juiste waarden (ë intact, 20/24 = 83%)');
    }
  },

  /** Blok 5: stijlvoorbeeld (screenshots om te beoordelen). */
  async stijl({ page, clickText, sleep, OUT }) {
    await clickText(page, 'Stijl');
    for (let i = 1; i <= 4; i++) {
      await sleep(1300);
      await page.screenshot({ path: path.join(OUT, `stijl-${i}.png`) });
    }
    await page.setViewport({ width: 600, height: 900 });
    await sleep(800);
    await page.screenshot({ path: path.join(OUT, 'stijl-staand.png') });
  },

  /** Blok 3: Testlab telt de bewegingen uit het draaiboek van het synthetische filmpje. */
  async testlab(ctx) {
    const { page, sleep, check, OUT } = ctx;
    await clickTextEntry(ctx, 'Testlab');
    const camStart = Date.now();
    await calibrateFlow({ ...ctx, skipDebug: true });
    await page.waitForFunction(() => document.querySelector('h2')?.textContent?.includes('Testlab'), { timeout: 5000 });
    // Draaiboek: bewegingen van 17 s tot 37 s na de camera-start.
    const wait = 38200 - (Date.now() - camStart);
    if (wait > 0) await sleep(wait);
    const counts = await page.evaluate(() => {
      const out = {};
      for (const tile of document.querySelectorAll('.tile')) out[tile.querySelector('span')?.textContent ?? '?'] = Number(tile.querySelector('b')?.textContent ?? '0');
      return out;
    });
    await page.screenshot({ path: path.join(OUT, 'testlab.png') });
    console.log('  tellers:', JSON.stringify(counts));
    check(counts.Sprongen === 4, `4 sprongen (${counts.Sprongen})`);
    check(counts.Hurken === 3, `3 keer hurken (${counts.Hurken})`);
    check(counts.Zijstappen === 4, `4 zijbaanwissels (${counts.Zijstappen})`);
    check(counts.Passen >= 6, `passen bij lopen ter plaatse (${counts.Passen})`);
    check(counts.Kikkersprongen === 0, `geen kikkersprongen (${counts.Kikkersprongen})`);
  },
};

/** Klik de knop op het startscherm. */
async function clickTextEntry({ page, clickText }, text) {
  await clickText(page, text);
}

/** Volledige kalibratie doorlopen; geeft de tijd (ms sinds camera-start) terug waarop ze klaar was. */
export async function calibrateFlow({ page, clickText, debugValues, sleep, check, OUT, skipDebug }) {
  const camStart = Date.now();
  await page.waitForFunction(() => [...document.querySelectorAll('button')].some((b) => b.textContent?.includes('Klaar, start')), { timeout: 10000 });
  await sleep(500);
  await page.screenshot({ path: path.join(OUT, 'kalibratie-1-klaarzetten.png') });
  await clickText(page, 'Klaar, start');
  await sleep(2500);
  await page.screenshot({ path: path.join(OUT, 'kalibratie-2-aftellen.png') });
  await page.waitForFunction(() => document.querySelector('h2')?.textContent?.includes('Kom terug'), { timeout: 15000 });
  await sleep(1200);
  await page.screenshot({ path: path.join(OUT, 'kalibratie-3-terugkomen.png') });
  const ok = await page
    .waitForFunction(() => document.querySelector('h2')?.textContent?.includes('Klaar!'), { timeout: 15000 })
    .then(() => true)
    .catch(() => false);
  const doneAt = Date.now() - camStart;
  check(ok, `kalibratie afgerond na ${(doneAt / 1000).toFixed(1)} s`);
  if (skipDebug) return doneAt;
  await sleep(1600);
  await page.click('.debugbar');
  await sleep(500);
  const v = await debugValues(page);
  check(v.aanwezig === 'in beeld', `speler in beeld (${v.aanwezig})`);
  check(Math.abs(Number(v.hoogte) - 1) < 0.1, `hoogte ≈ 1 (${v.hoogte})`);
  await page.screenshot({ path: path.join(OUT, 'kalibratie-4-klaar.png') });
  await page.click('.debugbar');
  return doneAt;
}

