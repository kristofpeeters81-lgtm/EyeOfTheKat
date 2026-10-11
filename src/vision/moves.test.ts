import { describe, expect, it } from 'vitest';
import { countEvents, emptyCounts, MoveTracker, type MoveCounts } from './moves';
import { harness, jumpClip, repeat, squatClip, still, type Clip } from './testing/harness';
import { standing } from './testing/scene';

function play(clip: Clip): { counts: MoveCounts; tracker: MoveTracker } {
  const h = harness();
  const tracker = new MoveTracker();
  const counts = emptyCounts();
  for (const p of clip) countEvents(counts, tracker.update(h.frame(p ? [p] : [])));
  return { counts, tracker };
}

describe('MoveTracker', () => {
  it('telt sprongen, en niets anders', () => {
    const { counts } = play(repeat(jumpClip(), 5));
    expect(counts.jump).toBe(5);
    expect(counts.squat).toBe(0);
    expect(counts.laneChanges).toBe(0);
    expect(counts.frogleap).toBe(0);
  });

  it('telt een kleine sprong niet (enkel op de tenen)', () => {
    const { counts } = play(repeat(jumpClip(3), 3));
    expect(counts.jump).toBe(0);
  });

  it('telt hurken, en geen sprongen', () => {
    const { counts } = play(repeat(squatClip(), 4));
    expect(counts.squat).toBe(4);
    expect(counts.jump).toBe(0);
  });

  it('herkent een kikkersprong: hurken en meteen springen', () => {
    const frog: Clip = [
      ...[0.3, 0.6, 1].map((squat) => standing({ squat })),
      ...still(4, { squat: 1 }),
      ...[6, 12, 14, 14, 12, 6].map((lift) => standing({ lift })),
      ...still(12),
    ];
    const { counts } = play(repeat(frog, 3));
    expect(counts.frogleap).toBe(3);
    expect(counts.squat).toBe(3);
    expect(counts.jump).toBe(3);
  });

  it('een sprong lang na een hurk is geen kikkersprong', () => {
    const { counts } = play([...squatClip(), ...still(40), ...jumpClip()]);
    expect(counts.frogleap).toBe(0);
    expect(counts.jump).toBe(1);
  });

  it('volgt de zijbaan: rechts, midden, links, midden', () => {
    const { counts, tracker } = play([...still(5), ...still(10, { cx: 104 }), ...still(10), ...still(10, { cx: 56 })]);
    expect(counts.laneChanges).toBe(3);
    expect(tracker.state.lane).toBe(-1);
  });

  it('armen spreiden verandert de zijbaan niet', () => {
    const { counts } = play(still(15, { leftArm: 'out', rightArm: 'out' }));
    expect(counts.laneChanges).toBe(0);
  });

  it('slagen: links, rechts en omhoog', () => {
    const { counts } = play([
      ...still(4),
      ...still(4, { leftArm: 'out' }),
      ...still(6),
      ...still(4, { rightArm: 'out' }),
      ...still(6),
      ...still(4, { rightArm: 'up' }),
      ...still(6),
    ]);
    expect(counts.strikeLeft).toBe(1);
    expect(counts.strikeRight).toBe(1);
    expect(counts.strikeUp).toBe(1);
  });

  it('reiken afwisselend links/rechts (klimmen)', () => {
    const climb: Clip = [...still(4, { leftArm: 'up' }), ...still(3), ...still(4, { rightArm: 'up' }), ...still(3)];
    const { counts } = play(repeat(climb, 3));
    expect(counts.reachLeft).toBe(3);
    expect(counts.reachRight).toBe(3);
  });

  it('springen telt niet als reiken', () => {
    const { counts } = play(repeat(jumpClip(), 3));
    expect(counts.reachLeft + counts.reachRight).toBe(0);
  });

  it('houdt een houding vast: ster', () => {
    const h = harness();
    const tracker = new MoveTracker();
    for (let i = 0; i < 45; i++) tracker.update(h.frame([standing({ leftArm: 'out', rightArm: 'out', legSpread: 0.25 })]));
    expect(tracker.state.poses.star).toBe(true);
    expect(tracker.state.holdMs.star).toBeGreaterThan(1000);
    expect(tracker.state.holdMs.squat).toBe(0);
  });

  it('lopen ter plaatse telt passen om beurt', () => {
    const run: Clip = [];
    for (let i = 0; i < 6; i++) {
      for (const lift of [5, 10, 10, 5]) run.push(standing({ kneeLift: i % 2 ? [lift, 0] : [0, lift] }));
    }
    const { counts } = play([...still(3), ...run]);
    expect(counts.step).toBeGreaterThanOrEqual(5);
    expect(counts.jump).toBe(0);
  });

  it('telt niets terwijl het kind (net) uit beeld is', () => {
    // Na terugkeer eerst even in beeld staan (aanwezigheid herstelt na 350 ms).
    const { counts } = play([...still(5), ...Array<null>(20).fill(null), ...repeat(jumpClip(), 2), ...still(15), ...repeat(jumpClip(), 2)]);
    // De eerste 2 sprongen vallen (deels) in de herstelperiode; de laatste 2 tellen zeker.
    expect(counts.jump).toBeGreaterThanOrEqual(2);
    expect(counts.jump).toBeLessThanOrEqual(3);
  });
});
