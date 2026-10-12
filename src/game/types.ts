import type { HeroAction } from '../render/hero';
import type { MoveEvent, MoveState } from '../vision/moves';
import type { Zone } from '../vision/power';
import type { Presence } from '../vision/presence';
import type { BodyPose } from '../vision/types';

/**
 * Basistypes van de spellogica (etappes). Puur TypeScript, geen DOM/React (#14, #27): een etappe
 * krijgt per camerabeeld een `GameInput` en geeft gebeurtenissen terug (geluid, stem, UI).
 */

export type StageId = 'bridge-sprint' | 'duck-beams' | 'log-roll' | 'frog-leap' | 'stone-hop' | 'shadow-wall' | 'shadow-strike' | 'wall-climb' | 'the-eye' | 'warm-up';

/** Wat een etappe per beeld te weten krijgt. */
export interface GameInput {
  /** Tijd in ms (monotoon). */
  t: number;
  dt: number;
  events: MoveEvent[];
  state: MoveState;
  power: number;
  zone: Zone;
  legPower: number;
  presence: Presence;
  pose: BodyPose | null;
  /** Kleurbandjes-modus actief (#40). */
  markerMode: boolean;
}

export interface StageSettings {
  /** Leeftijd van de speler (6..12). */
  age: number;
  /** Testen: alle tijden × deze factor (begeleider-optie "korte etappes", #47). Standaard 1. */
  durationScale?: number;
}

export type SfxName = 'go' | 'tick' | 'hit' | 'miss' | 'star' | 'whoosh' | 'land' | 'success' | 'stumble' | 'pause' | 'step' | 'win';

export type StageEvent =
  | { type: 'say'; text: string; priority?: 'high' }
  | { type: 'sfx'; name: SfxName }
  | { type: 'phase'; phase: StagePhase }
  | { type: 'done' };

export type StagePhase = 'intro' | 'countdown' | 'active' | 'rest' | 'finished';

/** Hoe een obstakel/opdracht gehaald werd (#31). */
export type Outcome = 'detected' | 'auto' | 'manual';

export type StageKind = 'interval' | 'reps' | 'continuous' | 'hold';

/** Eindresultaat van een etappe (ook voor de export, #29). */
export interface StageResult {
  stageId: StageId;
  stars: 0 | 1 | 2 | 3;
  score: number;
  /** Obstakels of opdrachten in totaal, en hoe ze gehaald werden. */
  total: number;
  detected: number;
  auto: number;
  manual: number;
  /** Actieve inspanningstijd (zonder intro, rust of pauze). */
  activeMs: number;
  /** Tijd in de zones hoog + piek tijdens de inspanning (#44). */
  highZoneMs: number;
  avgPower: number;
  peakPower: number;
  durationMs: number;
  /** Aantal keer gepauzeerd (uit beeld / tweede persoon). */
  pauses: number;
  markerMode: boolean;
  age: number;
}

/** Info voor de HUD bovenaan het scherm. */
export interface HudInfo {
  title: string;
  /** Korte opdracht, bv. "SPRINT!" of "Spring over de stammen". */
  instruction: string;
  /** Voortgang van de hele etappe 0..1. */
  progress: number;
  /** Teller, bv. "3 / 8" of "12 s". */
  counter: string;
  /** Resterende seconden in de huidige fase (aftellen), of null. */
  timer: number | null;
  phase: StagePhase;
  paused: boolean;
  pauseReason: string | null;
}

/** Wat de held moet doen (voor de tekening). */
export interface HeroState {
  action: HeroAction;
  /** Loopintensiteit 0..1 (pas/armzwaai). */
  runIntensity: number;
  /** Extra verplaatsing van de held: x in "lanes"/eenheden, y = hoogte in lichaamslengtes. */
  offsetX: number;
  lift: number;
}

export interface Stage {
  readonly id: StageId;
  readonly kind: StageKind;
  readonly finished: boolean;
  update(input: GameInput): StageEvent[];
  /** Begeleider-knop (#31): huidige opdracht als gehaald tellen. */
  manualPass(): void;
  hud(): HudInfo;
  hero(): HeroState;
  result(): StageResult;
}
