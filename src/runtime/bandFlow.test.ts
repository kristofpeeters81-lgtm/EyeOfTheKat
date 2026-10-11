import { describe, expect, it } from 'vitest';
import { ColorTracker, maxMarkerArea, type ColorModel } from '../vision/color';
import { VisionEngine } from '../vision/engine';
import { renderScene, type PersonSpec } from '../vision/testing/scene';
import { BandFlow, boxFor } from './bandFlow';

const YELLOW: [number, number, number] = [240, 210, 30];
const W = 320;
const H = 240;
const person = (p: Partial<PersonSpec> = {}): PersonSpec => ({ cx: 160, footY: 216, height: 156, bands: YELLOW, ...p });

/** Een "geel blok" vooraan in het vak: het kind houdt de sok dicht bij de camera. */
function holding(seed: number) {
  const f = renderScene({ width: W, height: H, seed });
  const box = boxFor(W, H);
  for (let y = Math.ceil(box.y0); y < box.y1; y++) for (let x = Math.ceil(box.x0); x < box.x1; x++) f.data.set([...YELLOW, 255], (y * W + x) * 4);
  return f;
}

function setup(shirt?: [number, number, number]) {
  const engine = new VisionEngine();
  let tracker: ColorTracker | null = null;
  const flow = new BandFlow({
    enableMarkers: (m: ColorModel) => (tracker = new ColorTracker(m)),
    disableMarkers: () => (tracker = null),
  });
  let t = 0;
  let seed = 1;
  // Achtergrond + lichaam kalibreren.
  engine.startLearning();
  for (let i = 0; i < 30; i++) engine.process(renderScene({ width: W, height: H, seed: seed++ }), (t += 33));
  engine.calibrateBody();
  for (let i = 0; i < 40 && !engine.calibration; i++) engine.process(renderScene({ width: W, height: H, persons: [person({ shirt })], seed: seed++ }), (t += 33));
  const step = (frame = renderScene({ width: W, height: H, persons: [person({ shirt })], seed: seed++ })) => {
    const r = engine.process(frame, (t += 33));
    // Zoals de runtime: max. bandjesgrootte volgt de lichaamslengte (×2: groot beeld).
    if (tracker && r.calibration) tracker.maxArea = maxMarkerArea(r.calibration.height * 2);
    flow.update(frame, r, tracker ? tracker.find(frame) : null);
  };
  return { flow, step, holdingFrame: () => holding(seed++) };
}

describe('BandFlow', () => {
  it('leert de kleur, ziet 2 bandjes, en zet de modus aan', () => {
    const { flow, step, holdingFrame } = setup();
    for (let i = 0; i < 15; i++) step(holdingFrame());
    expect(flow.view().step).toBe('check');
    expect(flow.view().swatch).toMatch(/^hsl/);
    for (let i = 0; i < 40 && flow.view().step === 'check'; i++) step();
    expect(flow.view().step).toBe('done');
  });

  it('meldt een conflict als de trui dezelfde kleur heeft', () => {
    const { flow, step, holdingFrame } = setup([235, 200, 40]);
    for (let i = 0; i < 15; i++) step(holdingFrame());
    for (let i = 0; i < 80 && flow.view().step === 'check'; i++) step();
    expect(flow.view().step).toBe('conflict');
  });
});
