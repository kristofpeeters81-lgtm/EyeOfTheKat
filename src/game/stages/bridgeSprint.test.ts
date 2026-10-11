import { describe, expect, it } from 'vitest';
import { ageFactor, computeStars, scaleCount, tempoFactor } from '../scaling';
import { drive } from '../testing';
import { BRIDGE, BridgeSprint } from './bridgeSprint';

describe('leeftijdsschaling', () => {
  it('0,6 op 6 jaar, 1,0 op 12 jaar, begrensd', () => {
    expect(ageFactor(6)).toBeCloseTo(0.6);
    expect(ageFactor(12)).toBeCloseTo(1);
    expect(ageFactor(9)).toBeCloseTo(0.8);
    expect(ageFactor(3)).toBeCloseTo(0.6);
    expect(scaleCount(8, 6)).toBe(5);
    expect(tempoFactor(6)).toBeCloseTo(0.8);
  });
  it('sterren', () => {
    expect(computeStars({ detectedFraction: null, highZoneFraction: 0.7 })).toBe(3);
    expect(computeStars({ detectedFraction: null, highZoneFraction: 0.1 })).toBe(1);
    expect(computeStars({ detectedFraction: 0.9, highZoneFraction: 0.1 })).toBe(2);
    expect(computeStars({ detectedFraction: 0.9, highZoneFraction: 0.1, needsIntensity: false })).toBe(3);
    expect(computeStars({ detectedFraction: 0.5, highZoneFraction: 0.9 })).toBe(1);
  });
});

describe('Bridge Sprint', () => {
  it('doorloopt intro → aftellen → 4 sprints met rust → klaar', () => {
    const stage = new BridgeSprint({ age: 12 });
    const d = drive(stage);
    d.toActive();
    expect(stage.hud().counter).toBe('Sprint 1/4');
    d.run(BRIDGE.sprintMs + 100, { legPower: 80, power: 70, zone: 3 });
    expect(stage.hud().phase).toBe('rest');
    for (let i = 0; i < 3; i++) {
      d.run(BRIDGE.restMs + 100);
      expect(stage.hud().phase).toBe('active');
      d.run(BRIDGE.sprintMs + 100, { legPower: 80, power: 70, zone: 3 });
    }
    expect(stage.finished).toBe(true);
    const r = stage.result();
    expect(r.stars).toBe(3);
    expect(r.detected).toBeGreaterThanOrEqual(58);
    expect(r.activeMs).toBeGreaterThan(59000);
    expect(d.said().some((s) => s.includes('brug'))).toBe(true);
  });

  it('wie niet loopt, struikelt maar valt nooit, en krijgt 1 ster', () => {
    const stage = new BridgeSprint({ age: 12 });
    const d = drive(stage);
    d.toActive();
    d.run(4 * (BRIDGE.sprintMs + BRIDGE.restMs) + 1000, { legPower: 5, power: 5 });
    expect(stage.finished).toBe(true);
    expect(d.events.some((e) => e.type === 'sfx' && e.name === 'stumble')).toBe(true);
    const r = stage.result();
    expect(r.stars).toBe(1);
    expect(r.detected).toBe(0);
    expect(r.auto).toBeGreaterThan(50);
  });

  it('de klok stopt als het kind uit beeld is', () => {
    const stage = new BridgeSprint({ age: 12 });
    const d = drive(stage);
    d.toActive();
    d.run(5000, { legPower: 60 });
    const before = stage.hud().timer;
    d.run(5000, { presence: 'missing' });
    expect(stage.hud().paused).toBe(true);
    expect(stage.hud().timer).toBe(before);
    expect(d.said()).toContain('Kom terug in beeld, ninja!');
    d.tick({ presence: 'ok' });
    expect(stage.hud().paused).toBe(false);
    expect(stage.result().pauses).toBe(1);
  });

  it('jonge kinderen: kortere sprints (min. 10 s) en tragere instorting', () => {
    const young = new BridgeSprint({ age: 6 });
    expect(young.sprintMs).toBeGreaterThanOrEqual(10000);
    expect(young.sprintMs).toBeLessThan(BRIDGE.sprintMs);
  });
});
