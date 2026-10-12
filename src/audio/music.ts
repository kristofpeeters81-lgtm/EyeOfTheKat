/**
 * De muziek (#20): een zelfgemaakte "ninja-beat" (taiko-achtige trommels + pentatonische melodie),
 * volledig gesynthetiseerd, geen bestaande muziek. Overgenomen uit Idol Academy (src/audio/music.ts)
 * met een ander ritme en andere akkoorden. Dit bestand is puur (geen Web Audio): welke noten op welke
 * stap, en welk tempo bij welke Ninja Power-zone (#44). `synth.ts` maakt er geluid van.
 *
 * Opbouw per zone, zodat de muziek meegroeit met hoe hard je beweegt:
 *   0 rust   taiko + bas
 *   1 matig  + handklap + shaker
 *   2 hoog   + akkoordstoten
 *   3 piek   + snelle shaker + pentatonische melodie
 */

export type Instrument = 'kick' | 'clap' | 'hat' | 'bass' | 'chord' | 'arp';

export interface NoteEvent {
  instrument: Instrument;
  /** MIDI-nootnummers (1 voor bas/arp, 3 voor een akkoord; leeg voor drums). */
  midi: number[];
  /** Luidheid 0..1. */
  velocity: number;
  /** Lengte in stappen (16e noten). */
  steps: number;
}

export const STEPS_PER_BAR = 16;

/** Dm – B♭ – C – Am: donker en avontuurlijk. */
const PROGRESSION = [
  { bass: 38, chord: [62, 65, 69] }, // Dm
  { bass: 34, chord: [58, 62, 65] }, // Bb
  { bass: 36, chord: [60, 64, 67] }, // C
  { bass: 33, chord: [57, 60, 64] }, // Am
];

/** d-klein pentatonisch (d f g a c) voor de melodie. */
export const PENTATONIC = [74, 77, 79, 81, 84];

/** Tempo per zone (BPM). Het tempo schuift per maat geleidelijk naar het doel. */
export const TEMPO = { byZone: [100, 110, 120, 130], maxChangePerBar: 4 };

export function tempoTarget(zone: number): number {
  return TEMPO.byZone[Math.max(0, Math.min(3, zone))];
}

/** Eén maat verder: tempo zachtjes richting het doel (geen schokken in de muziek). */
export function nextTempo(current: number, zone: number): number {
  const target = tempoTarget(zone);
  const diff = Math.max(-TEMPO.maxChangePerBar, Math.min(TEMPO.maxChangePerBar, target - current));
  return current + diff;
}

export const midiToHz = (midi: number): number => 440 * Math.pow(2, (midi - 69) / 12);

/** Duur van één stap (16e noot) in seconden. */
export const stepSeconds = (bpm: number): number => 60 / bpm / 4;

/** Taiko-ritme: DON . . . . . DON . DON . . . DON . . . */
export const TAIKO_STEPS = [0, 6, 8, 12];
const BASS_STEPS = [0, 6, 8, 12, 14];
const MELODY = [0, 2, 3, 1, 4, 3, 1, 2];

/** Alle noten die op stap `step` van maat `bar` klinken bij een bepaald niveau (0..3). */
export function stepEvents(bar: number, step: number, level: number): NoteEvent[] {
  const chord = PROGRESSION[bar % PROGRESSION.length];
  const out: NoteEvent[] = [];
  if (TAIKO_STEPS.includes(step)) out.push({ instrument: 'kick', midi: [], velocity: step === 0 ? 1 : 0.8, steps: 1 });
  if (BASS_STEPS.includes(step)) out.push({ instrument: 'bass', midi: [chord.bass + (step === 14 ? 12 : 0)], velocity: 0.8, steps: 2 });
  if (level >= 1) {
    if (step === 4 || step === 12) out.push({ instrument: 'clap', midi: [], velocity: 0.75, steps: 1 });
    if (step % 4 === 2) out.push({ instrument: 'hat', midi: [], velocity: 0.5, steps: 1 });
  }
  if (level >= 2 && (step === 0 || step === 10)) out.push({ instrument: 'chord', midi: chord.chord, velocity: 0.42, steps: 3 });
  if (level >= 3) {
    if (step % 2 === 1) out.push({ instrument: 'hat', midi: [], velocity: 0.22, steps: 1 });
    if (step % 2 === 0) {
      const note = PENTATONIC[MELODY[(step / 2 + bar * 3) % MELODY.length]];
      out.push({ instrument: 'arp', midi: [note], velocity: 0.33, steps: 1 });
    }
  }
  return out;
}
