import { BridgeSprint } from './stages/bridgeSprint';
import type { Stage, StageId, StageSettings } from './types';

/**
 * Alle etappes, in de volgorde van de wereldkaart (#42, voorlopig).
 */

export interface StageInfo {
  id: StageId;
  /** Engelse naam (#37, #41). */
  name: string;
  /** Werknaam in het Nederlands (documentatie). */
  dutch: string;
  /** Korte uitleg voor op de kaart (Nederlands). */
  blurb: string;
  type: 'cardio' | 'kracht' | 'finale';
  /** Beweging die het kind doet. */
  move: string;
  /** Rust na de etappe (#47). */
  restAfterMs: number;
  create?: (s: StageSettings) => Stage;
}

export const STAGES: StageInfo[] = [
  { id: 'bridge-sprint', name: 'Bridge Sprint', dutch: 'Sprintbrug', blurb: 'De hangbrug stort in: sprint ter plaatse!', type: 'cardio', move: 'Lopen ter plaatse, knieën hoog', restAfterMs: 45000, create: (s) => new BridgeSprint(s) },
  { id: 'duck-beams', name: 'Duck Beams', dutch: 'Duikbalken', blurb: 'Hurk onder de zwaaiende balken door.', type: 'kracht', move: 'Hurken', restAfterMs: 30000 },
  { id: 'log-roll', name: 'Log Roll', dutch: 'Rollende stammen', blurb: 'Spring over de rollende boomstammen.', type: 'cardio', move: 'Springen', restAfterMs: 30000 },
  { id: 'frog-leap', name: 'Frog Leap', dutch: 'Kikkersprongen', blurb: 'Diep hurken en omhoog springen naar het volgende platform.', type: 'kracht', move: 'Hurken + springen', restAfterMs: 30000 },
  { id: 'stone-hop', name: 'Stone Hop', dutch: 'Springstenen', blurb: 'Hop links en rechts over de stenen in de rivier.', type: 'cardio', move: 'Zijwaarts springen', restAfterMs: 30000 },
  { id: 'shadow-wall', name: 'Shadow Wall', dutch: 'Schaduwmuur', blurb: 'Pas in het gat van de naderende muur en hou vast.', type: 'kracht', move: 'Houding vasthouden', restAfterMs: 30000 },
  { id: 'shadow-strike', name: 'Shadow Strike', dutch: 'Ninja-slagen', blurb: 'Sla de schaduwdoelen links, rechts en boven.', type: 'cardio', move: 'Slaan', restAfterMs: 45000 },
  { id: 'wall-climb', name: 'Wall Climb', dutch: 'Muurklim', blurb: 'Klim de muur op: om beurt je armen omhoog.', type: 'kracht', move: 'Afwisselend reiken + knie', restAfterMs: 30000 },
  { id: 'the-eye', name: 'The Eye', dutch: 'Finale', blurb: 'De laatste klim naar het Oog van de Kat.', type: 'finale', move: 'Alles door elkaar', restAfterMs: 45000 },
];

export function stageInfo(id: StageId): StageInfo {
  const s = STAGES.find((x) => x.id === id);
  if (!s) throw new Error(`Onbekende etappe ${id}`);
  return s;
}

export function createStage(id: StageId, settings: StageSettings): Stage | null {
  return stageInfo(id).create?.(settings) ?? null;
}
