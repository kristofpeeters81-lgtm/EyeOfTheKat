import { useEffect } from 'react';
import { audio } from '../audio/director';
import type { StageEvent } from '../game/types';

/**
 * Koppelt de gebeurtenissen van een etappe aan het geluid (#20): effecten, de stem van de Geest,
 * en muziek die meegaat met de Ninja Power-zone. Alles stopt bij het verlaten van het scherm.
 */
export function handleStageEvent(e: StageEvent): void {
  switch (e.type) {
    case 'say':
      audio.say(e.text, e.priority === 'high' ? 'hoog' : 'normaal');
      break;
    case 'sfx':
      audio.sfx(e.name);
      if (e.name === 'pause') audio.setPaused(true);
      if (e.name === 'go') audio.setPaused(false);
      break;
    case 'phase':
      if (e.phase === 'active' || e.phase === 'rest') audio.startMusic(0);
      if (e.phase === 'finished') audio.stopMusic();
      break;
    case 'done':
      break;
  }
}

/** De Geest spreekt (instelschermen): altijd met voorrang. Stabiele functie (geen nieuwe per render). */
export function sayHigh(text: string): void {
  audio.say(text, 'hoog');
}

/** Muziek stopt als het scherm verdwijnt. */
export function useStageAudioCleanup(): void {
  useEffect(() => () => audio.stopAll(), []);
}
