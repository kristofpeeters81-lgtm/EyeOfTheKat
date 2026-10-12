import { useState } from 'react';
import { totalScore, totalStars, type Profile } from '../game/profiles';
import { HeroPortrait } from './HeroPortrait';
import { getProfiles } from './profileStore';

/**
 * "Wie speelt?" (#19): profielkaarten, een nieuwe ninja maken, en het scorebord.
 */
export function ProfileSelect({ onPick, onNew, onEdit, onBack }: { onPick: (p: Profile) => void; onNew: () => void; onEdit: (p: Profile) => void; onBack: () => void }) {
  const [board, setBoard] = useState(false);
  const book = getProfiles();
  const profiles = book.list();

  return (
    <div className="screen col" style={{ gap: 16 }}>
      <div className="row">
        <button className="btn secondary small" onClick={onBack}>
          ← Terug
        </button>
        <h2 className="grow">{board ? 'Scorebord' : 'Wie speelt?'}</h2>
        {profiles.length > 1 && (
          <button className="btn secondary small" onClick={() => setBoard((b) => !b)}>
            {board ? 'Ninja’s' : '🏆 Scorebord'}
          </button>
        )}
      </div>
      {board ? (
        <div className="panel col" style={{ gap: 8 }}>
          {book.leaderboard().map((row, i) => (
            <div key={row.profile.id} className="row board-row">
              <b className="board-rank">{i + 1}</b>
              <HeroPortrait look={row.profile.look} size={44} />
              <span className="grow">
                <b>{row.profile.name}</b> <span className="muted">({row.profile.age} jaar)</span>
              </span>
              <span className="board-stars">★ {row.stars}</span>
              <span className="muted">{row.score} p</span>
            </div>
          ))}
          <p className="muted small-text">Doelen zijn per leeftijd geschaald: een 6-jarige en een 12-jarige spelen eerlijk tegen elkaar.</p>
        </div>
      ) : (
        <div className="profile-grid">
          {profiles.map((p) => (
            <div key={p.id} className="profile-card panel">
              <button className="profile-main" onClick={() => onPick(p)}>
                <HeroPortrait look={p.look} size={92} />
                <b>{p.name}</b>
                <span className="muted">
                  {p.age} jaar · ★ {totalStars(p)} · {totalScore(p)} p
                </span>
              </button>
              <button className="btn secondary small" onClick={() => onEdit(p)}>
                ✎ Aanpassen
              </button>
            </div>
          ))}
          <button className="profile-card panel profile-new" onClick={onNew}>
            <span className="plus">+</span>
            <b>Nieuwe ninja</b>
          </button>
        </div>
      )}
    </div>
  );
}
