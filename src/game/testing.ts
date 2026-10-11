import type { MoveEvent, MoveState } from '../vision/moves';
import type { GameInput, Stage, StageEvent } from './types';

/**
 * Testhulp voor etappes: speelt een etappe af met nep-invoer (geen camera nodig).
 */

export function idleState(): MoveState {
  return {
    airborne: false,
    low: false,
    lane: 0,
    zones: { left: false, right: false, up: false },
    armUp: { left: false, right: false },
    poses: { squat: false, star: false, 'arms-up': false },
    holdMs: { squat: 0, star: 0, 'arms-up': 0 },
  };
}

export interface Driver {
  t: number;
  events: StageEvent[];
  /** Eén beeld (33 ms) met de gegeven invoer. */
  tick(input?: Partial<GameInput>): StageEvent[];
  /** `ms` lang dezelfde invoer. */
  run(ms: number, input?: Partial<GameInput> | ((t: number) => Partial<GameInput>)): void;
  /** Tot de actieve fase begint (intro + aftellen). */
  toActive(): void;
  said(): string[];
}

export function drive(stage: Stage): Driver {
  const d: Driver = {
    t: 0,
    events: [],
    tick(input = {}) {
      d.t += 33;
      const full: GameInput = {
        t: d.t,
        dt: 33,
        events: [] as MoveEvent[],
        state: idleState(),
        power: 0,
        zone: 0,
        legPower: 0,
        presence: 'ok',
        pose: null,
        markerMode: false,
        ...input,
      };
      const ev = stage.update(full);
      d.events.push(...ev);
      return ev;
    },
    run(ms, input = {}) {
      const end = d.t + ms;
      while (d.t < end && !stage.finished) d.tick(typeof input === 'function' ? input(d.t) : input);
    },
    toActive() {
      for (let i = 0; i < 1000 && stage.hud().phase !== 'active'; i++) d.tick();
    },
    said() {
      return d.events.flatMap((e) => (e.type === 'say' ? [e.text] : []));
    },
  };
  return d;
}
