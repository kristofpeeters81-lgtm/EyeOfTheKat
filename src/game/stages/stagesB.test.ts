import { describe, expect, it } from 'vitest';
import type { MoveEvent, MoveState } from '../../vision/moves';
import { drive, idleState } from '../testing';
import { SHADOW_STRIKE, ShadowStrike } from './shadowStrike';
import { SHADOW_WALL, ShadowWall } from './shadowWall';
import { THE_EYE, TheEye } from './theEye';
import { WALL_CLIMB, WallClimb } from './wallClimb';

const withPose = (pose: 'squat' | 'star' | 'arms-up'): MoveState => {
  const s = idleState();
  s.poses[pose] = true;
  return s;
};

describe('Shadow Wall', () => {
  it('houding vasthouden: alle muren gehaald, 3 sterren zonder intensiteit', () => {
    const stage = new ShadowWall({ age: 12 });
    const d = drive(stage);
    d.toActive();
    for (let i = 0; i < 40000 && !stage.finished; i++) d.tick(stage.hud().phase === 'active' ? { state: withPose(stage.pose), power: 10 } : {});
    const r = stage.result();
    expect(r.total).toBe(4);
    expect(r.detected).toBe(4);
    expect(r.stars).toBe(3);
  });

  it('wiebelen (te veel beweging) telt niet als vasthouden', () => {
    const stage = new ShadowWall({ age: 12 });
    const d = drive(stage);
    d.toActive();
    d.run(SHADOW_WALL.holdMs + SHADOW_WALL.graceMs + 2000, { state: withPose('squat'), power: 80 });
    expect(stage.result().auto).toBe(1);
  });

  it('6-jarigen houden korter vast', () => {
    expect(new ShadowWall({ age: 6 }).holdMs).toBeCloseTo(9000);
  });
});

describe('Shadow Strike', () => {
  it('juiste kant slaan telt; verkeerde kant niet', () => {
    const stage = new ShadowStrike({ age: 12 });
    const d = drive(stage);
    d.toActive();
    d.run(700);
    expect(stage.target).toBe('left');
    d.tick({ events: [{ type: 'strike', t: d.t, zone: 'right' } as MoveEvent] });
    expect(stage.result().detected).toBe(0);
    d.tick({ events: [{ type: 'strike', t: d.t, zone: 'left' } as MoveEvent] });
    expect(stage.result().detected).toBe(1);
  });

  it('volledig spelen met elke keer de juiste slag', () => {
    const stage = new ShadowStrike({ age: 12 });
    const d = drive(stage);
    d.toActive();
    for (let i = 0; i < 40000 && !stage.finished; i++) {
      const tgt = stage.target;
      d.tick(tgt && stage.targetLeft < 0.7 ? { events: [{ type: 'strike', t: d.t, zone: tgt } as MoveEvent], power: 60, zone: 2 } : { power: 60, zone: 2 });
    }
    const r = stage.result();
    expect(r.total).toBe(SHADOW_STRIKE.perSet * SHADOW_STRIKE.sets);
    expect(r.detected).toBe(r.total);
    expect(r.stars).toBe(3);
  });
});

describe('Wall Climb', () => {
  it('enkel afwisselend reiken telt', () => {
    const stage = new WallClimb({ age: 12 });
    const d = drive(stage);
    d.toActive();
    d.tick({ events: [{ type: 'reach', t: d.t, side: 'right' } as MoveEvent] });
    expect(stage.grips).toBe(0);
    d.tick({ events: [{ type: 'reach', t: d.t, side: 'left' } as MoveEvent] });
    d.run(400);
    d.tick({ events: [{ type: 'reach', t: d.t, side: 'left' } as MoveEvent] });
    expect(stage.grips).toBe(1);
    d.tick({ events: [{ type: 'reach', t: d.t, side: 'right' } as MoveEvent] });
    expect(stage.grips).toBe(2);
  });

  it('vangnet: na 8 s klimt de held toch', () => {
    const stage = new WallClimb({ age: 12 });
    const d = drive(stage);
    d.toActive();
    d.run(WALL_CLIMB.autoAfterMs + 300);
    expect(stage.result().auto).toBe(1);
  });
});

describe('The Eye (finale)', () => {
  it('heeft sprints, stammen, balken en een slot', () => {
    const stage = new TheEye({ age: 12 });
    expect(stage.sprints).toHaveLength(3);
    expect(stage.obstacles.filter((o) => o.kind === 'log').length).toBeGreaterThan(5);
    expect(stage.obstacles.filter((o) => o.kind === 'beam').length).toBeGreaterThan(5);
    // Ongeveer 2 à 3 minuten voor 12 jaar.
    expect(stage.finalAt).toBeGreaterThan(100000);
    expect(stage.finalAt).toBeLessThan(180000);
  });

  it('perfect gespeeld: alles gezien, het Oog opent, 3 sterren', () => {
    const stage = new TheEye({ age: 12 });
    const d = drive(stage);
    d.toActive();
    let airUntil = -1;
    for (let i = 0; i < 20000 && !stage.finished; i++) {
      const next = stage.obstacles.find((o) => o.result === 'pending');
      const until = next ? next.at - stage.run : Infinity;
      const state = idleState();
      const events: MoveEvent[] = [];
      if (next?.kind === 'log' && until < 200 && until > 0 && d.t > airUntil) {
        events.push({ type: 'jump', t: d.t });
        airUntil = d.t + 400;
      }
      state.airborne = d.t < airUntil;
      state.low = next?.kind === 'beam' && until < 300 && until > -200;
      if (stage.inFinal) state.poses['arms-up'] = true;
      d.tick({ events, state, legPower: 70, power: 65, zone: 2 });
    }
    expect(stage.finished).toBe(true);
    const r = stage.result();
    expect(r.detected).toBe(r.total);
    expect(r.stars).toBe(3);
    expect(stage.eyeOpen).toBeGreaterThan(0.9);
    expect(d.said().some((s) => s.includes('Oog van de Kat bereikt'))).toBe(true);
  });

  it('niets doen: toch uitgespeeld (het slot gaat vanzelf na 12 s)', () => {
    const stage = new TheEye({ age: 12 });
    const d = drive(stage);
    d.toActive();
    d.run(stage.finalAt + THE_EYE.holdAutoMs + 5000);
    expect(stage.finished).toBe(true);
    expect(stage.result().stars).toBe(1);
  });
});
