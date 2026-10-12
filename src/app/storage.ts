/**
 * Kleine voorkeuren in de browser (#29). Mag ontbreken of falen (privévenster, geblokkeerde opslag):
 * de app werkt dan gewoon verder met standaardwaarden.
 */

const SOUND_KEY = 'eyeOfTheKat.sound';
const VOICE_KEY = 'eyeOfTheKat.voice';

export interface SoundPrefs {
  sound: boolean;
  voice: boolean;
}

/** Geluid en stem staan standaard aan. */
export function loadSoundPrefs(): SoundPrefs {
  try {
    return { sound: localStorage.getItem(SOUND_KEY) !== 'uit', voice: localStorage.getItem(VOICE_KEY) !== 'uit' };
  } catch {
    return { sound: true, voice: true };
  }
}

export function saveSoundPrefs(p: SoundPrefs): void {
  try {
    localStorage.setItem(SOUND_KEY, p.sound ? 'aan' : 'uit');
    localStorage.setItem(VOICE_KEY, p.voice ? 'aan' : 'uit');
  } catch {
    // Niet erg.
  }
}

/** JSON lezen/schrijven met foutopvang (voor profielen en meetgegevens). */
export function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function saveJson(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
