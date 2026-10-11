import { describe, expect, it } from 'vitest';
import { VisionEngine, type VisionResult } from './engine';
import { renderScene, standing, type PersonSpec, type SceneSpec } from './testing/scene';

const W = 160;
const H = 120;
let seed = 1;
const scene = (s: Partial<SceneSpec> = {}) => renderScene({ width: W, height: H, seed: seed++, ...s });

/** Engine met geleerde lege kamer. */
function learned(): { engine: VisionEngine; t: number } {
  const engine = new VisionEngine();
  engine.startLearning();
  let t = 0;
  for (let i = 0; i < 30 && engine.currentPhase !== 'running'; i++) engine.process(scene(), (t += 33));
  expect(engine.currentPhase).toBe('running');
  return { engine, t };
}

function run(engine: VisionEngine, t0: number, frames: number, persons: PersonSpec[], extra: Partial<SceneSpec> = {}): { r: VisionResult; t: number } {
  let t = t0;
  let r!: VisionResult;
  for (let i = 0; i < frames; i++) r = engine.process(scene({ persons, ...extra }), (t += 33));
  return { r, t };
}

/** Engine met kalibratie op een rechtop staande persoon. */
function calibrated(): { engine: VisionEngine; t: number } {
  const { engine, t: t0 } = learned();
  engine.calibrateBody();
  let t = t0;
  for (let i = 0; i < 40 && !engine.calibration; i++) t = run(engine, t, 1, [standing()]).t;
  expect(engine.calibration).not.toBeNull();
  return { engine, t };
}

describe('achtergrond leren', () => {
  it('leert een stille kamer in ±24 beelden', () => {
    const engine = new VisionEngine();
    engine.startLearning();
    let r!: VisionResult;
    for (let i = 0; i < 23; i++) r = engine.process(scene(), i * 33);
    expect(r.phase).toBe('learning');
    expect(r.learnProgress).toBeGreaterThan(0.9);
    r = engine.process(scene(), 24 * 33);
    expect(r.phase).toBe('running');
  });

  it('begint opnieuw als er tijdens het leren iets beweegt', () => {
    const engine = new VisionEngine();
    engine.startLearning();
    for (let i = 0; i < 10; i++) engine.process(scene(), i * 33);
    const r = engine.process(scene({ persons: [standing({ cx: 40 })] }), 11 * 33);
    expect(r.learnUnstable).toBe(true);
    expect(r.learnProgress).toBe(0);
  });
});

describe('silhouet', () => {
  it('vindt de persoon met de juiste maten', () => {
    const { engine, t } = learned();
    const { r } = run(engine, t, 3, [standing()]);
    const s = r.silhouette!;
    expect(s).not.toBeNull();
    expect(s.bottom).toBeGreaterThanOrEqual(105);
    expect(s.bottom).toBeLessThanOrEqual(109);
    expect(s.top).toBeGreaterThanOrEqual(28);
    expect(s.top).toBeLessThanOrEqual(33);
    expect(Math.abs(s.cxLow - 80)).toBeLessThan(2);
    expect(r.others).toHaveLength(0);
  });

  it('ziet een lege kamer als leeg', () => {
    const { engine, t } = learned();
    const { r } = run(engine, t, 3, []);
    expect(r.silhouette).toBeNull();
    expect(r.fgFraction).toBeLessThan(0.01);
  });

  it('negeert een schaduw op de vloer', () => {
    const { engine, t } = learned();
    const { r } = run(engine, t, 3, [], { shadow: [50, 94, 120, 120, 0.7] });
    expect(r.silhouette).toBeNull();
  });

  it('negeert een camera die de belichting bijregelt', () => {
    const { engine, t } = learned();
    const { r } = run(engine, t, 8, [], { gain: 1.2 });
    expect(r.fgFraction).toBeLessThan(0.02);
  });

  it('ziet de persoon nog als de camera bijregelt terwijl hij binnenkomt', () => {
    const { engine, t } = learned();
    const { r } = run(engine, t, 8, [standing()], { gain: 0.85 });
    expect(r.silhouette).not.toBeNull();
    expect(r.fgFraction).toBeLessThan(0.25);
  });
});

describe('ruimte-check', () => {
  it('geeft een aanwijzing als de voeten buiten beeld zijn', () => {
    const { engine, t } = learned();
    expect(run(engine, t, 3, [standing({ footY: 125, height: 100 })]).r.space).toBe('feet');
  });
  it('vraagt opzij te schuiven als het kind niet in het midden staat', () => {
    const { engine, t } = learned();
    // Rechts op het (gespiegelde) scherm → naar links schuiven.
    expect(run(engine, t, 3, [standing({ cx: 120 })]).r.space).toBe('go-left');
  });
  it('is in orde voor een goed geplaatst kind', () => {
    const { engine, t } = learned();
    expect(run(engine, t, 3, [standing()]).r.space).toBe('ok');
  });
});

describe('kalibratie en houding', () => {
  it('legt de lichaamsmaten vast bij stilstaan', () => {
    const { engine } = calibrated();
    const c = engine.calibration!;
    expect(c.height).toBeGreaterThan(74);
    expect(c.height).toBeLessThan(82);
  });

  it('hurken verlaagt heightRatio', () => {
    const { engine, t } = calibrated();
    const p = run(engine, t, 3, [standing({ squat: 1 })]).r.pose!;
    expect(p.heightRatio).toBeLessThan(0.72);
    expect(p.feetRise).toBeCloseTo(0, 1);
  });

  it('springen tilt de voeten', () => {
    const { engine, t } = calibrated();
    const p = run(engine, t, 2, [standing({ lift: 10 })]).r.pose!;
    expect(p.feetRise).toBeGreaterThan(0.1);
    expect(p.topRise).toBeGreaterThan(0.1);
  });

  it('opzij stappen verschuift het lichaam, armen spreiden niet', () => {
    const { engine, t } = calibrated();
    const p1 = run(engine, t, 2, [standing({ cx: 100 })]).r.pose!;
    expect(p1.shift).toBeGreaterThan(0.2);
    const { engine: e2, t: t2 } = calibrated();
    const p2 = run(e2, t2, 2, [standing({ leftArm: 'out', rightArm: 'down' })]).r.pose!;
    expect(Math.abs(p2.shift)).toBeLessThan(0.05);
    expect(p2.widthRatio).toBeGreaterThan(1.4);
  });

  it('armen omhoog verhogen de bovenkant', () => {
    const { engine, t } = calibrated();
    const p = run(engine, t, 2, [standing({ leftArm: 'up', rightArm: 'up' })]).r.pose!;
    expect(p.topRise).toBeGreaterThan(0.1);
    expect(p.feetRise).toBeCloseTo(0, 1);
  });
});

describe('aanwezigheid', () => {
  it('meldt een tweede persoon na een korte vertraging', () => {
    const { engine, t } = calibrated();
    const two = [standing(), standing({ cx: 140, height: 70, footY: 106, shirt: [200, 60, 60] })];
    expect(run(engine, t, 2, two).r.presence).toBe('ok');
    expect(run(engine, t + 66, 20, two).r.presence).toBe('two');
  });

  it('meldt uit beeld, en weer in orde bij terugkeer', () => {
    const { engine, t } = calibrated();
    const gone = run(engine, t, 20, []);
    expect(gone.r.presence).toBe('missing');
    expect(run(engine, gone.t, 20, [standing()]).r.presence).toBe('ok');
  });
});

describe('Ninja Power', () => {
  it('is laag bij stilstaan en hoog bij snel bewegen', () => {
    const { engine, t } = calibrated();
    const still = run(engine, t, 30, [standing()]);
    expect(still.r.power).toBeLessThan(10);
    let tt = still.t;
    let r!: VisionResult;
    for (let i = 0; i < 40; i++) {
      const up = i % 2 === 0;
      r = engine.process(scene({ persons: [standing({ leftArm: up ? 'up' : 'out', rightArm: up ? 'out' : 'up', lift: up ? 6 : 0 })] }), (tt += 33));
    }
    expect(r.power).toBeGreaterThan(45);
  });
});
