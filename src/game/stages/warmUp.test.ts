import { describe, expect, it } from 'vitest';
import type { MoveEvent } from '../../vision/moves';
import { drive } from '../testing';
import { WARM_UP, WarmUp } from './warmUp';

describe('Opwarming', () => {
  it('lopen → armen → 3 hurken → klaar', () => {
    const stage = new WarmUp({ age: 9 });
    const d = drive(stage);
    d.toActive();
    expect(stage.hud().instruction).toContain('lopen');
    d.run(WARM_UP.jogMs + 100, { legPower: 30 });
    expect(stage.hud().instruction).toContain('Armen');
    d.run(WARM_UP.armsMs + 100);
    expect(stage.hud().instruction).toContain('hurken');
    for (let i = 0; i < 3; i++) {
      d.tick({ events: [{ type: 'squat', t: d.t, depth: 0.3 } as MoveEvent] });
      d.run(1000);
    }
    expect(stage.finished).toBe(true);
  });

  it('eindigt ook zonder hurken (na max. 25 s)', () => {
    const stage = new WarmUp({ age: 9 });
    const d = drive(stage);
    d.toActive();
    d.run(WARM_UP.jogMs + WARM_UP.armsMs + WARM_UP.squatMaxMs + 1000);
    expect(stage.finished).toBe(true);
  });
});
