import { VisionEngine, type VisionResult } from '../engine';
import { renderScene, standing, type PersonSpec } from './scene';

/**
 * Testhulp: een motor met geleerde lege kamer en gekalibreerd lichaam (160×120), en een functie om
 * een reeks synthetische beelden af te spelen. Gebruikt door de detector- en game-tests.
 */

export const W = 160;
export const H = 120;

export interface Harness {
  engine: VisionEngine;
  t: number;
  seed: number;
  /** Speelt één beeld af en geeft het resultaat. */
  frame(persons: PersonSpec[], dt?: number): VisionResult;
  /** Speelt `n` beelden af met dezelfde persoon. */
  hold(person: PersonSpec | null, n: number, dt?: number): VisionResult;
}

export function harness(): Harness {
  const engine = new VisionEngine();
  const h: Harness = {
    engine,
    t: 0,
    seed: 1,
    frame(persons, dt = 33) {
      h.t += dt;
      return engine.process(renderScene({ width: W, height: H, persons, seed: h.seed++ }), h.t);
    },
    hold(person, n, dt = 33) {
      let r!: VisionResult;
      for (let i = 0; i < n; i++) r = h.frame(person ? [person] : [], dt);
      return r;
    },
  };
  engine.startLearning();
  for (let i = 0; i < 40 && engine.currentPhase !== 'running'; i++) h.frame([]);
  engine.calibrateBody();
  for (let i = 0; i < 60 && !engine.calibration; i++) h.frame([standing()]);
  if (!engine.calibration) throw new Error('kalibratie mislukt in de testhulp');
  return h;
}

/** Een beweging als reeks beelden: per beeld een persoon (null = uit beeld). */
export type Clip = (PersonSpec | null)[];

export function repeat(clip: Clip, times: number): Clip {
  return Array.from({ length: times }, () => clip).flat();
}

export const still = (n: number, p: Partial<PersonSpec> = {}): Clip => Array.from({ length: n }, () => standing(p));

/** Sprong: 3 beelden omhoog, 3 omlaag (±0,2 s in de lucht), dan 12 beelden staan. */
export const jumpClip = (height = 12): Clip => [...[1 / 3, 3 / 4, 1, 1, 3 / 4, 1 / 3].map((f) => standing({ lift: f * height })), ...still(12)];

/** Hurk: 4 beelden neer, 8 laag, 4 op, 8 staan. */
export const squatClip = (): Clip => [
  ...[0.25, 0.5, 0.75, 1].map((squat) => standing({ squat })),
  ...still(8, { squat: 1 }),
  ...[0.75, 0.5, 0.25, 0].map((squat) => standing({ squat })),
  ...still(8),
];
