import { ACCENT_COLORS, DEFAULT_LOOK, SUIT_COLORS, type HeroLook } from '../render/theme';
import { STAGES } from './catalog';
import type { StageId, StageResult } from './types';

/**
 * Spelersprofielen (#19), voortgang op de wereldkaart (#42), sterren en ontgrendelen (#25).
 * Puur TypeScript: de opslag (localStorage) zit achter een kleine interface, zodat dit in tests en
 * in B-world herbruikbaar is. Er wordt nooit een foto of beeld bewaard (#3, #19).
 */

export interface StageProgress {
  /** Beste aantal sterren (0 = nog niet uitgespeeld). */
  stars: number;
  bestScore: number;
  plays: number;
}

export interface Profile {
  id: string;
  /** Bijnaam (geen echte naam nodig). */
  name: string;
  age: number;
  look: HeroLook;
  progress: Partial<Record<StageId, StageProgress>>;
  createdAt: number;
}

export interface ProfileStorage {
  load(): Profile[];
  save(profiles: Profile[]): void;
}

export const MAX_NAME = 16;

/** Ontgrendelen met sterren (#25): kleuren. De eerste 2 accentkleuren en 3 pakkleuren zijn gratis. */
export const ACCENT_UNLOCK = [0, 0, 3, 6, 9, 12];
export const SUIT_UNLOCK = [0, 0, 0, 15, 18, 21];

export function totalStars(p: Profile): number {
  return Object.values(p.progress).reduce((a, s) => a + (s?.stars ?? 0), 0);
}

export function totalScore(p: Profile): number {
  return Object.values(p.progress).reduce((a, s) => a + (s?.bestScore ?? 0), 0);
}

/** Een etappe is open als ze de eerste is of als de vorige uitgespeeld is (#25). */
export function isUnlocked(p: Profile, id: StageId): boolean {
  const i = STAGES.findIndex((s) => s.id === id);
  if (i <= 0) return true;
  return (p.progress[STAGES[i - 1].id]?.stars ?? 0) >= 1;
}

/** De eerste etappe die nog niet uitgespeeld is (waar de held op de kaart staat). */
export function currentStage(p: Profile): StageId {
  return (STAGES.find((s) => (p.progress[s.id]?.stars ?? 0) < 1) ?? STAGES[STAGES.length - 1]).id;
}

export function accentUnlocked(p: Profile, index: number): boolean {
  return totalStars(p) >= (ACCENT_UNLOCK[index] ?? Infinity);
}

export function suitUnlocked(p: Profile, index: number): boolean {
  return totalStars(p) >= (SUIT_UNLOCK[index] ?? Infinity);
}

export function cleanName(name: string): string {
  return name.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME);
}

export function clampAge(age: number): number {
  return Math.min(12, Math.max(6, Math.round(age)));
}

let counter = 0;
function newId(now: number): string {
  counter++;
  return `p${now.toString(36)}${counter.toString(36)}`;
}

export class ProfileBook {
  private profiles: Profile[];

  constructor(private readonly storage: ProfileStorage) {
    this.profiles = storage.load().filter((p) => p && typeof p.id === 'string');
  }

  list(): Profile[] {
    return [...this.profiles];
  }

  get(id: string): Profile | null {
    return this.profiles.find((p) => p.id === id) ?? null;
  }

  create(name: string, age: number, look: HeroLook = DEFAULT_LOOK, now = Date.now()): Profile {
    const p: Profile = { id: newId(now), name: cleanName(name) || 'Ninja', age: clampAge(age), look: { ...look }, progress: {}, createdAt: now };
    this.profiles.push(p);
    this.persist();
    return p;
  }

  update(id: string, change: Partial<Pick<Profile, 'name' | 'age' | 'look'>>): Profile | null {
    const p = this.get(id);
    if (!p) return null;
    if (change.name !== undefined) p.name = cleanName(change.name) || p.name;
    if (change.age !== undefined) p.age = clampAge(change.age);
    if (change.look) {
      // Enkel ontgrendelde kleuren (#25).
      const ai = ACCENT_COLORS.indexOf(change.look.accent as (typeof ACCENT_COLORS)[number]);
      const si = SUIT_COLORS.indexOf(change.look.suit as (typeof SUIT_COLORS)[number]);
      p.look = {
        id: change.look.id,
        accent: ai >= 0 && accentUnlocked(p, ai) ? change.look.accent : p.look.accent,
        suit: si >= 0 && suitUnlocked(p, si) ? change.look.suit : p.look.suit,
      };
    }
    this.persist();
    return p;
  }

  remove(id: string): void {
    this.profiles = this.profiles.filter((p) => p.id !== id);
    this.persist();
  }

  /** Resultaat van een etappe verwerken; geeft terug wat er nieuw ontgrendeld werd. */
  record(id: string, r: StageResult): { newStars: number; unlockedStage: StageId | null; unlockedColors: number } {
    const p = this.get(id);
    if (!p) return { newStars: 0, unlockedStage: null, unlockedColors: 0 };
    const before = totalStars(p);
    const colorsBefore = ACCENT_UNLOCK.filter((n) => before >= n).length + SUIT_UNLOCK.filter((n) => before >= n).length;
    const wasDone = (p.progress[r.stageId]?.stars ?? 0) >= 1;
    const old = p.progress[r.stageId] ?? { stars: 0, bestScore: 0, plays: 0 };
    p.progress[r.stageId] = { stars: Math.max(old.stars, r.stars), bestScore: Math.max(old.bestScore, r.score), plays: old.plays + 1 };
    const after = totalStars(p);
    const colorsAfter = ACCENT_UNLOCK.filter((n) => after >= n).length + SUIT_UNLOCK.filter((n) => after >= n).length;
    const i = STAGES.findIndex((s) => s.id === r.stageId);
    const unlockedStage = !wasDone && r.stars >= 1 && i >= 0 && i < STAGES.length - 1 ? STAGES[i + 1].id : null;
    this.persist();
    return { newStars: after - before, unlockedStage, unlockedColors: colorsAfter - colorsBefore };
  }

  /** Scorebord (#19): sterren, dan punten. */
  leaderboard(): { profile: Profile; stars: number; score: number }[] {
    return this.profiles
      .map((profile) => ({ profile, stars: totalStars(profile), score: totalScore(profile) }))
      .sort((a, b) => b.stars - a.stars || b.score - a.score);
  }

  private persist(): void {
    this.storage.save(this.profiles);
  }
}

/** Opslag in het geheugen (tests). */
export function memoryStorage(initial: Profile[] = []): ProfileStorage & { data: Profile[] } {
  const s = {
    data: initial,
    load: () => JSON.parse(JSON.stringify(s.data)) as Profile[],
    save: (p: Profile[]) => {
      s.data = JSON.parse(JSON.stringify(p)) as Profile[];
    },
  };
  return s;
}
