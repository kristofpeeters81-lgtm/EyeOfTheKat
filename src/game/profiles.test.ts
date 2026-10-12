import { describe, expect, it } from 'vitest';
import { ACCENT_COLORS, SUIT_COLORS } from '../render/theme';
import { STAGES } from './catalog';
import { currentStage, isUnlocked, memoryStorage, ProfileBook, totalStars } from './profiles';
import type { StageId, StageResult } from './types';

const result = (stageId: StageId, stars: 0 | 1 | 2 | 3, score = 100): StageResult => ({
  stageId,
  stars,
  score,
  total: 10,
  detected: 8,
  auto: 2,
  manual: 0,
  activeMs: 60000,
  highZoneMs: 20000,
  avgPower: 40,
  peakPower: 80,
  durationMs: 90000,
  pauses: 0,
  markerMode: false,
  age: 9,
});

describe('ProfileBook', () => {
  it('maakt profielen en bewaart ze', () => {
    const storage = memoryStorage();
    const book = new ProfileBook(storage);
    const p = book.create('  Snelle   Sam  ', 9);
    expect(p.name).toBe('Snelle Sam');
    expect(new ProfileBook(storage).list()).toHaveLength(1);
  });

  it('begrenst leeftijd en naam', () => {
    const book = new ProfileBook(memoryStorage());
    expect(book.create('Een hele lange ninjanaam die te lang is', 15).age).toBe(12);
    expect(book.create('', 3).name).toBe('Ninja');
  });

  it('etappes gaan één voor één open', () => {
    const book = new ProfileBook(memoryStorage());
    const p = book.create('Kai', 8);
    expect(isUnlocked(p, STAGES[0].id)).toBe(true);
    expect(isUnlocked(p, STAGES[1].id)).toBe(false);
    const r = book.record(p.id, result(STAGES[0].id, 1));
    expect(r.unlockedStage).toBe(STAGES[1].id);
    expect(isUnlocked(book.get(p.id)!, STAGES[1].id)).toBe(true);
    expect(currentStage(book.get(p.id)!)).toBe(STAGES[1].id);
  });

  it('bewaart het beste resultaat, geen dubbele sterren', () => {
    const book = new ProfileBook(memoryStorage());
    const p = book.create('Kai', 8);
    book.record(p.id, result('bridge-sprint', 2, 300));
    const again = book.record(p.id, result('bridge-sprint', 1, 500));
    expect(again.newStars).toBe(0);
    expect(again.unlockedStage).toBeNull();
    const pr = book.get(p.id)!.progress['bridge-sprint']!;
    expect(pr).toEqual({ stars: 2, bestScore: 500, plays: 2 });
  });

  it('kleuren gaan open met sterren', () => {
    const book = new ProfileBook(memoryStorage());
    const p = book.create('Kai', 8);
    // Kleur 2 (3 sterren nodig) wordt geweigerd.
    book.update(p.id, { look: { id: 'neko', accent: ACCENT_COLORS[2], suit: SUIT_COLORS[1] } });
    expect(book.get(p.id)!.look.accent).not.toBe(ACCENT_COLORS[2]);
    expect(book.get(p.id)!.look.suit).toBe(SUIT_COLORS[1]);
    expect(book.get(p.id)!.look.id).toBe('neko');
    const r = book.record(p.id, result('bridge-sprint', 3));
    expect(r.unlockedColors).toBe(1);
    book.update(p.id, { look: { id: 'neko', accent: ACCENT_COLORS[2], suit: SUIT_COLORS[1] } });
    expect(book.get(p.id)!.look.accent).toBe(ACCENT_COLORS[2]);
  });

  it('scorebord: meeste sterren eerst', () => {
    const book = new ProfileBook(memoryStorage());
    const a = book.create('A', 8);
    const b = book.create('B', 10);
    book.record(b.id, result('bridge-sprint', 3));
    book.record(a.id, result('bridge-sprint', 1));
    expect(book.leaderboard().map((x) => x.profile.name)).toEqual(['B', 'A']);
    expect(totalStars(book.get(b.id)!)).toBe(3);
  });

  it('kan tegen kapotte opslag', () => {
    const storage = memoryStorage([null as unknown as never]);
    expect(new ProfileBook(storage).list()).toEqual([]);
  });
});
