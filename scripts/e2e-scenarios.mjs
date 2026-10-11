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
};
