// Scenario's voor scripts/e2e.mjs. Kies er één met de omgevingsvariabele E2E_SCENARIO.
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
    await clickText(page, 'Spelen');
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

