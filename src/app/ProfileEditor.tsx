import { useState } from 'react';
import { ACCENT_UNLOCK, MAX_NAME, SUIT_UNLOCK, totalStars, type Profile } from '../game/profiles';
import { ACCENT_COLORS, DEFAULT_LOOK, HEROES, SUIT_COLORS, type HeroLook } from '../render/theme';
import { HeroPortrait } from './HeroPortrait';
import { getProfiles } from './profileStore';

/**
 * Nieuwe ninja maken of aanpassen (#19, #24): bijnaam, leeftijd, held en kleuren. Kleuren met een
 * slotje gaan open met sterren (#25). Geen foto, geen echte naam nodig.
 */
export function ProfileEditor({ profile, onSave, onCancel }: { profile: Profile | null; onSave: (p: Profile) => void; onCancel: () => void }) {
  const [name, setName] = useState(profile?.name ?? '');
  const [age, setAge] = useState(profile?.age ?? 9);
  const [look, setLook] = useState<HeroLook>(profile?.look ?? DEFAULT_LOOK);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const stars = profile ? totalStars(profile) : 0;

  const save = () => {
    const book = getProfiles();
    if (profile) {
      const p = book.update(profile.id, { name, age, look });
      if (p) onSave(p);
    } else {
      onSave(book.create(name, age, look));
    }
  };

  return (
    <div className="screen col" style={{ gap: 14 }}>
      <div className="row">
        <button className="btn secondary small" onClick={onCancel}>
          ← Terug
        </button>
        <h2 className="grow">{profile ? 'Ninja aanpassen' : 'Nieuwe ninja'}</h2>
      </div>
      <div className="editor">
        <div className="editor-preview panel">
          <HeroPortrait look={look} action="ready" size={170} />
          <b>{name.trim() || 'Ninja'}</b>
          <span className="muted">{HEROES.find((h) => h.id === look.id)?.tagline}</span>
        </div>
        <div className="col editor-fields">
          <label className="col field">
            <span>Bijnaam</span>
            <input value={name} maxLength={MAX_NAME} placeholder="bv. Snelle Sam" onChange={(e) => setName(e.target.value)} />
          </label>
          <div className="col field">
            <span>Leeftijd</span>
            <div className="row">
              {[6, 7, 8, 9, 10, 11, 12].map((a) => (
                <button key={a} className={`btn small${a === age ? '' : ' secondary'}`} onClick={() => setAge(a)}>
                  {a}
                </button>
              ))}
            </div>
          </div>
          <div className="col field">
            <span>Held</span>
            <div className="row hero-choices">
              {HEROES.map((h) => (
                <button key={h.id} className={`hero-choice${look.id === h.id ? ' on' : ''}`} onClick={() => setLook({ ...look, id: h.id })}>
                  <HeroPortrait look={{ ...look, id: h.id }} size={64} />
                  <small>{h.name}</small>
                </button>
              ))}
            </div>
          </div>
          <div className="col field">
            <span>Pak</span>
            <div className="row">
              {SUIT_COLORS.map((c, i) => {
                const locked = stars < SUIT_UNLOCK[i];
                return (
                  <button key={c} className={`swatch-btn${look.suit === c ? ' on' : ''}`} disabled={locked} style={{ background: c }} onClick={() => setLook({ ...look, suit: c })} title={locked ? `Nog ${SUIT_UNLOCK[i] - stars} ★` : ''}>
                    {locked ? `🔒${SUIT_UNLOCK[i]}` : ''}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="col field">
            <span>Hoofdband en gloed</span>
            <div className="row">
              {ACCENT_COLORS.map((c, i) => {
                const locked = stars < ACCENT_UNLOCK[i];
                return (
                  <button key={c} className={`swatch-btn${look.accent === c ? ' on' : ''}`} disabled={locked} style={{ background: c }} onClick={() => setLook({ ...look, accent: c })} title={locked ? `Nog ${ACCENT_UNLOCK[i] - stars} ★` : ''}>
                    {locked ? `🔒${ACCENT_UNLOCK[i]}` : ''}
                  </button>
                );
              })}
            </div>
            <small className="muted">🔒 = gaat open met sterren (nu ★ {stars})</small>
          </div>
          <div className="row">
            <button className="btn" onClick={save}>
              {profile ? 'Bewaren' : 'Maak mijn ninja'}
            </button>
            {profile &&
              (confirmDelete ? (
                <button
                  className="btn secondary small"
                  onClick={() => {
                    getProfiles().remove(profile.id);
                    onCancel();
                  }}
                >
                  Zeker? Wissen
                </button>
              ) : (
                <button className="btn secondary small" onClick={() => setConfirmDelete(true)}>
                  Wissen
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
