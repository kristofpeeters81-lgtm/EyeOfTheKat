import { useEffect, useState } from 'react';
import { audio } from '../audio/director';
import { Spirit } from './Spirit';

/**
 * Verplichte rustpauze na een etappe (#26, #47): 30 s (45 s na sprint-etappes), met een herinnering om
 * te drinken. Niet over te slaan; enkel korter met de begeleider-optie "korte etappes" (#47).
 */
export function RestScreen({ ms, next, onDone }: { ms: number; next: string | null; onDone: () => void }) {
  const [left, setLeft] = useState(ms);

  useEffect(() => {
    audio.say('Goed gedaan! Drink een slokje water en blaas even uit.', 'hoog');
    const start = performance.now();
    const id = window.setInterval(() => {
      const l = Math.max(0, ms - (performance.now() - start));
      setLeft(l);
      if (l <= 0) window.clearInterval(id);
    }, 200);
    return () => window.clearInterval(id);
  }, [ms]);

  const frac = ms > 0 ? left / ms : 0;
  const r = 70;
  const c = 2 * Math.PI * r;
  return (
    <div className="screen col center" style={{ gap: 18, textAlign: 'center' }}>
      <Spirit talking size={64} />
      <h2>Even rusten</h2>
      <p className="spirit-text">💧 Drink een slokje water en blaas uit.</p>
      <svg width="180" height="180" viewBox="0 0 180 180" aria-label={`${Math.ceil(left / 1000)} seconden`}>
        <circle cx="90" cy="90" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="12" />
        <circle cx="90" cy="90" r={r} fill="none" stroke="var(--jade)" strokeWidth="12" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - frac)} transform="rotate(-90 90 90)" />
        <text x="90" y="104" textAnchor="middle" fill="var(--text)" style={{ font: '900 44px var(--font-title)' }}>
          {Math.ceil(left / 1000)}
        </text>
      </svg>
      {next && <p className="muted">Hierna: {next}</p>}
      <button className="btn" disabled={left > 0} onClick={onDone}>
        {left > 0 ? 'Rusten…' : 'Naar de kaart'}
      </button>
    </div>
  );
}
