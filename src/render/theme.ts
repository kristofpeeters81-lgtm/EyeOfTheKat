/**
 * Stijl "Night Summit" (#23, voorlopig volgens #49): nachtelijke bergen in diep indigo, de ninja als
 * donker silhouet met een lichtrand in de accentkleur, en het Oog van de Kat als amber gloed op de
 * top. Alle kleuren van de spelwereld staan hier; de UI-kleuren staan in src/app/styles.css.
 */

export const PALETTE = {
  skyTop: '#0b1026',
  skyMid: '#1b2459',
  skyLow: '#3a2f6b',
  horizon: '#ff8a5c',
  star: '#f4f1ea',
  moon: '#fff3d6',
  mountainFar: '#232a5c',
  mountainMid: '#171d45',
  mountainNear: '#0e1333',
  ground: '#141a3a',
  groundTop: '#2b3470',
  eye: '#ffb21e',
  eyeHot: '#ff7a1a',
  eyePupil: '#0b1026',
  jade: '#2ee6c5',
  danger: '#ff4d6d',
  spirit: '#9be7ff',
  text: '#f4f1ea',
  wood: '#8a5a3c',
  woodDark: '#5c3a26',
  stone: '#5a6394',
  stoneDark: '#3b4170',
  water: '#1e6fa8',
  waterLight: '#58c4f5',
  lava: '#ff5a1f',
} as const;

/** Kleuren voor het ninjapak (#24). */
export const SUIT_COLORS = ['#1a1f3d', '#2b1a3d', '#10302e', '#3a1c1c', '#20262b', '#1c2c4d'] as const;
/** Accentkleuren: hoofdband, sjaal, gordel en lichtrand (#24). */
export const ACCENT_COLORS = ['#ffb21e', '#2ee6c5', '#ff4d6d', '#9b7bff', '#5fd35f', '#58c4f5'] as const;

export type HeroId = 'kage' | 'riku' | 'mei' | 'neko';

export interface HeroLook {
  id: HeroId;
  suit: string;
  accent: string;
}

export const HEROES: { id: HeroId; name: string; tagline: string }[] = [
  { id: 'kage', name: 'Kage', tagline: 'Stil als een schaduw' },
  { id: 'riku', name: 'Riku', tagline: 'Sneller dan de wind' },
  { id: 'mei', name: 'Mei', tagline: 'Springt het hoogst' },
  { id: 'neko', name: 'Neko', tagline: 'Landt altijd op vier poten' },
];

export const DEFAULT_LOOK: HeroLook = { id: 'kage', suit: SUIT_COLORS[0], accent: ACCENT_COLORS[0] };
