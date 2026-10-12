import { describe, expect, it } from 'vitest';
import type { MoveEvent } from '../../vision/moves';
import { drive, idleState } from '../testing';
import { DuckBeams } from './duckBeams';
import { FROG_LEAP, FrogLeap } from './frogLeap';
import { LogRoll } from './logRoll';
import { StoneHop } from './stoneHop';
import type { TimedObstacleStage } from './timed';

/** Speelt een etappe met getimede obstakels perfect: doe de beweging net vóór elke aankomst. */
function playTimed(stage: TimedObstacleStage, action: 'jump' | 'low', perfect: boolean) {
  const d = drive(stage);
  d.toActive();
  for (let i = 0; i < 20000 && !stage.finished; i++) {
    const next = stage.obstacles.find((o) => o.result === 'pending');
    const dt = next ? next.at - stage.setClock : Infinity;
    const doIt = perfect && stage.isActive && dt < 200 && dt > -100;
    if (action === 'jump') d.tick(doIt ? { events: [{ type: 'jump', t: d.t } as MoveEvent], state: { ...idleState(), airborne: true } } : {});
    else d.tick(doIt ? { state: { ...idleState(), low: true } } : {});
  }
  return { d, r: stage.result() };
}

describe('Log Roll', () => {
  it('perfect springen: alle stammen gezien door de camera', () => {
    const { r } = playTimed(new LogRoll({ age: 12 }), 'jump', true);
    expect(r.total).toBe(24);
    expect(r.detected).toBe(24);
    expect(r.stars).toBeGreaterThanOrEqual(2);
  });

  it('niet springen: struikelen, toch uitgespeeld met 1 ster', () => {
    const { r, d } = playTimed(new LogRoll({ age: 12 }), 'jump', false);
    expect(r.auto).toBe(24);
    expect(r.stars).toBe(1);
    expect(d.events.some((e) => e.type === 'sfx' && e.name === 'stumble')).toBe(true);
  });

  it('6-jarigen: minder stammen en meer tijd ertussen', () => {
    const young = new LogRoll({ age: 6 });
    const old = new LogRoll({ age: 12 });
    expect(young.perSet).toBe(5);
    const dy = drive(young);
    const dold = drive(old);
    dy.toActive();
    dold.toActive();
    expect(young.obstacles[1].at - young.obstacles[0].at).toBeGreaterThan(old.obstacles[1].at - old.obstacles[0].at);
  });
});

describe('Duck Beams', () => {
  it('hurken op het juiste moment telt', () => {
    const { r } = playTimed(new DuckBeams({ age: 10 }), 'low', true);
    expect(r.detected).toBe(r.total);
  });

  it('de begeleider-knop telt het volgende obstakel als gehaald', () => {
    const stage = new DuckBeams({ age: 12 });
    const d = drive(stage);
    d.toActive();
    d.run(2000);
    stage.manualPass();
    expect(stage.result().manual).toBe(1);
  });
});

describe('Frog Leap', () => {
  it('telt kikkersprongen en springt naar het volgende platform', () => {
    const stage = new FrogLeap({ age: 12 });
    const d = drive(stage);
    d.toActive();
    for (let i = 0; i < 20000 && !stage.finished; i++) {
      const leap = stage.hud().phase === 'active' && stage.leapProgress === null && i % 40 === 0;
      d.tick(leap ? { events: [{ type: 'frogleap', t: d.t } as MoveEvent] } : {});
    }
    const r = stage.result();
    expect(r.total).toBe(18);
    expect(r.detected).toBe(18);
    expect(stage.platform).toBe(18);
  });

  it('vangnet: na 8 s zonder sprong springt de held toch', () => {
    const stage = new FrogLeap({ age: 12 });
    const d = drive(stage);
    d.toActive();
    d.run(FROG_LEAP.autoAfterMs + 500);
    expect(stage.result().auto).toBe(1);
  });
});

describe('Stone Hop', () => {
  it('hoppen naar de oplichtende steen, links en rechts om beurt', () => {
    const stage = new StoneHop({ age: 12 });
    const d = drive(stage);
    d.toActive();
    expect(stage.target).toBe(-1);
    let lane: -1 | 0 | 1 = 0;
    for (let i = 0; i < 20000 && !stage.finished; i++) {
      const events: MoveEvent[] = [];
      if (stage.hud().phase === 'active' && !stage.waiting && i % 10 === 0 && lane !== stage.target) {
        lane = stage.target;
        events.push({ type: 'lane', t: d.t, lane });
      }
      d.tick({ events, state: { ...idleState(), lane } });
    }
    const r = stage.result();
    expect(r.total).toBe(30);
    expect(r.detected).toBe(30);
  });
});
