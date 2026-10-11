import { describe, expect, it } from 'vitest';
import { VisionEngine } from '../vision/engine';
import { renderScene, standing, type PersonSpec } from '../vision/testing/scene';
import { CalibrationFlow, COUNTDOWN_S } from './calibrationFlow';

describe('CalibrationFlow', () => {
  it('doorloopt aftellen → leren → binnenkomen → klaar', () => {
    const engine = new VisionEngine();
    const said: string[] = [];
    const flow = new CalibrationFlow(engine, (s) => said.push(s));
    let t = 0;
    let seed = 1;
    const step = (persons: PersonSpec[]) => {
      t += 33;
      const r = engine.process(renderScene({ width: 160, height: 120, persons, seed: seed++ }), t);
      flow.update(r, t);
    };
    flow.begin(t);
    expect(flow.view().step).toBe('countdown');
    // Tijdens het aftellen loopt het kind weg (het mag nog in beeld zijn).
    while (t < COUNTDOWN_S * 1000) step([standing({ cx: 150 })]);
    step([]);
    expect(flow.view().step).toBe('learning');
    for (let i = 0; i < 30 && flow.view().step === 'learning'; i++) step([]);
    expect(flow.view().step).toBe('enter');
    // Eerst te ver rechts: aanwijzing.
    for (let i = 0; i < 30; i++) step([standing({ cx: 125 })]);
    expect(flow.view().text).toMatch(/links/);
    for (let i = 0; i < 60 && flow.view().step === 'enter'; i++) step([standing()]);
    expect(flow.view().step).toBe('done');
    expect(flow.calibration?.height).toBeGreaterThan(70);
    expect(said.some((s) => s.includes('Stap opzij'))).toBe(true);
  });
});
