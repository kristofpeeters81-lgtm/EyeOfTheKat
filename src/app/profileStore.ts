import { ProfileBook, type Profile } from '../game/profiles';
import { loadJson, saveJson } from './storage';

/**
 * De profielen op dit toestel (#19, #29): bijnaam, leeftijd, held en voortgang. Nooit beelden.
 * Lukt opslaan niet (privévenster), dan werken de profielen tot de app sluit.
 */
const KEY = 'eyeOfTheKat.profiles';

let book: ProfileBook | null = null;

export function getProfiles(): ProfileBook {
  book ??= new ProfileBook({
    load: () => loadJson<Profile[]>(KEY, []),
    save: (p) => void saveJson(KEY, p),
  });
  return book;
}
