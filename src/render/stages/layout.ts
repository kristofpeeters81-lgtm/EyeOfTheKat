/**
 * Indeling van een spelscène, zowel liggend als staand (#11): waar staat de grond, waar en hoe
 * groot is de held, en hoeveel pixels is één meter in de wereld.
 */

export interface SceneLayout {
  w: number;
  h: number;
  portrait: boolean;
  groundY: number;
  heroX: number;
  heroSize: number;
  /** Pixels per meter (zijaanzicht-scènes). */
  ppm: number;
}

export function sceneLayout(w: number, h: number, view: 'side' | 'front' = 'side'): SceneLayout {
  const portrait = h > w * 1.1;
  const groundY = h * (portrait ? 0.74 : 0.78);
  const heroSize = Math.min(h * (portrait ? 0.2 : 0.3), w * (portrait ? 0.34 : 0.2));
  const heroX = view === 'side' ? w * (portrait ? 0.3 : 0.32) : w * 0.5;
  // Eén lichaamslengte van de held ≈ 1,4 m.
  const ppm = heroSize / 1.4;
  return { w, h, portrait, groundY, heroX, heroSize, ppm };
}
