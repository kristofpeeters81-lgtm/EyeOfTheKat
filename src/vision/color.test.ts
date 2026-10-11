import { describe, expect, it } from 'vitest';
import { ColorTracker, learnColor, MarkerPairing, rgbToHsv, type ColorModel } from './color';
import { MoveTracker } from './moves';
import { harness } from './testing/harness';
import { handPosition, renderScene, standing, type PersonSpec } from './testing/scene';

const YELLOW: [number, number, number] = [240, 210, 30];
const BIG = { width: 320, height: 240 };
/** Persoon op het grote beeld (320×240): alles × 2 tegenover de standaardpersoon. */
const big = (p: Partial<PersonSpec> = {}): PersonSpec => ({ cx: 160, footY: 216, height: 156, bands: YELLOW, ...p });

function learnedYellow(): ColorModel {
  const person = big({ rightArm: 'out' });
  const hand = handPosition(person, 1);
  const frame = renderScene({ ...BIG, persons: [person], seed: 3 });
  const m = learnColor(frame, { x0: hand.x - 6, y0: hand.y - 6, x1: hand.x + 6, y1: hand.y + 6 });
  if (typeof m === 'string') throw new Error(m);
  return m;
}

describe('rgbToHsv', () => {
  it('kent de basiskleuren', () => {
    expect(rgbToHsv(255, 0, 0)[0]).toBe(0);
    expect(rgbToHsv(0, 255, 0)[0]).toBe(120);
    expect(rgbToHsv(0, 0, 255)[0]).toBe(240);
    expect(rgbToHsv(128, 128, 128)[1]).toBe(0);
  });
});

describe('learnColor', () => {
  it('leert geel uit het vak rond het bandje', () => {
    const m = learnedYellow();
    expect(m.hue).toBeGreaterThan(45);
    expect(m.hue).toBeLessThan(60);
  });

  it('weigert een grijs/kleurloos vak', () => {
    const frame = renderScene({ ...BIG, seed: 2 });
    expect(learnColor(frame, { x0: 100, y0: 60, x1: 130, y1: 90 })).toBe('not-colorful');
  });
});

describe('ColorTracker', () => {
  it('vindt beide handen, ook met de armen in andere houdingen', () => {
    const tracker = new ColorTracker(learnedYellow());
    for (const arms of [{}, { leftArm: 'up', rightArm: 'out' }, { leftArm: 'out', rightArm: 'out' }] as Partial<PersonSpec>[]) {
      const p = big(arms);
      const r = tracker.find(renderScene({ ...BIG, persons: [p], seed: 5 }));
      expect(r.markers).toHaveLength(2);
      const xs = r.markers.map((m) => m.x).sort((a, b) => a - b);
      expect(Math.abs(xs[0] - handPosition(p, -1).x)).toBeLessThan(3);
      expect(Math.abs(xs[1] - handPosition(p, 1).x)).toBeLessThan(3);
      expect(r.stray).toBe(0);
    }
  });

  it('meldt storende kleur als de trui dezelfde kleur heeft', () => {
    const tracker = new ColorTracker(learnedYellow());
    const r = tracker.find(renderScene({ ...BIG, persons: [big({ shirt: [235, 200, 40] })], seed: 6 }));
    expect(r.stray + r.markers.reduce((a, m) => a + m.area, 0)).toBeGreaterThan(500);
  });
});

describe('MarkerPairing', () => {
  it('houdt links en rechts vast, ook als ze kruisen', () => {
    const pairing = new MarkerPairing();
    let p = pairing.pair([{ x: 10, y: 50, area: 9 }, { x: 90, y: 50, area: 9 }], 50);
    expect(p.left?.x).toBe(10);
    // Volgend beeld: kleine verschuiving, volgorde in de lijst omgekeerd.
    p = pairing.pair([{ x: 88, y: 52, area: 9 }, { x: 14, y: 48, area: 9 }], 50);
    expect(p.left?.x).toBe(14);
    expect(p.right?.x).toBe(88);
  });
});

describe('MoveTracker in kleurbandjes-modus', () => {
  it('telt een slag enkel als de hand zelf in het doelvlak is', () => {
    const h = harness();
    const tracker = new MoveTracker();
    const c = h.engine.calibration!;
    // Arm opzij, maar de hand (marker) zit nog naast het lichaam → geen slag.
    let r = h.frame([standing({ leftArm: 'out' })]);
    let events = tracker.update(r, [{ x: c.cxLow - 0.15 * c.height, y: c.top + 0.25 * c.height, area: 10 }]);
    expect(events.filter((e) => e.type === 'strike')).toHaveLength(0);
    // Hand echt in het linker doelvlak.
    r = h.frame([standing({ leftArm: 'out' })]);
    events = tracker.update(r, [{ x: c.cxLow - 0.5 * c.height, y: c.top + 0.25 * c.height, area: 10 }]);
    expect(events).toContainEqual(expect.objectContaining({ type: 'strike', zone: 'left' }));
  });
});
