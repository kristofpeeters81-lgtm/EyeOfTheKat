import { useState } from 'react';
import type { Rating } from '../game/sessionLog';
import type { StageResult } from '../game/types';
import { Spirit } from './Spirit';

/** Resultaat van een etappe (#25, #28): sterren, score en de metingen. */
export function ResultScreen({
  result,
  name,
  onRetry,
  onExit,
  onNext,
  onRate,
}: {
  result: StageResult;
  name: string;
  onRetry: () => void;
  onExit: () => void;
  onNext?: () => void;
  /** Korte evaluatie door het kind (#28): hoe leuk en hoe zwaar (1..3). */
  onRate?: (r: { fun?: Rating; effort?: Rating }) => void;
}) {
  const [fun, setFun] = useState<Rating | null>(null);
  const [effort, setEffort] = useState<Rating | null>(null);
  const r = result;
  const sec = (ms: number) => `${Math.round(ms / 1000)} s`;
  const high = r.activeMs > 0 ? Math.round((r.highZoneMs / r.activeMs) * 100) : 0;
  const lines = ['Goed geprobeerd, ninja.', 'Sterk gedaan, ninja!', 'Fantastisch! Het Oog ziet je kracht.'];
  return (
    <div className="screen col center result">
      <Spirit talking size={64} />
      <h2>{name}</h2>
      <div className="stars" aria-label={`${r.stars} van de 3 sterren`}>
        {[1, 2, 3].map((i) => (
          <span key={i} className={`star${i <= r.stars ? ' on' : ''}`} style={{ animationDelay: `${i * 0.25}s` }}>
            ★
          </span>
        ))}
      </div>
      <p className="spirit-text">{lines[Math.max(0, r.stars - 1)]}</p>
      <div className="result-stats panel">
        <div>
          <b>{r.score}</b>
          <span>punten</span>
        </div>
        <div>
          <b>{sec(r.activeMs)}</b>
          <span>actief bewogen</span>
        </div>
        <div>
          <b>{high}%</b>
          <span>hoog/piek</span>
        </div>
        <div>
          <b>{r.avgPower}</b>
          <span>gem. power</span>
        </div>
        <div>
          <b>
            {r.detected}/{r.total}
          </b>
          <span>gezien door de camera</span>
        </div>
        {(r.auto > 0 || r.manual > 0) && (
          <div>
            <b>
              {r.auto}+{r.manual}
            </b>
            <span>vanzelf + begeleider</span>
          </div>
        )}
      </div>
      {onRate && (
        <div className="rating panel">
          <div className="row center">
            <span>Hoe leuk?</span>
            {(['🙁', '🙂', '🤩'] as const).map((emo, i) => (
              <button
                key={emo}
                className={`rate-btn${fun === i + 1 ? ' on' : ''}`}
                aria-label={['niet zo leuk', 'oké', 'super leuk'][i]}
                onClick={() => {
                  setFun((i + 1) as Rating);
                  onRate({ fun: (i + 1) as Rating });
                }}
              >
                {emo}
              </button>
            ))}
          </div>
          <div className="row center">
            <span>Hoe zwaar?</span>
            {(['makkelijk', 'goed', 'zwaar'] as const).map((label, i) => (
              <button
                key={label}
                className={`btn small${effort === i + 1 ? '' : ' secondary'}`}
                onClick={() => {
                  setEffort((i + 1) as Rating);
                  onRate({ effort: (i + 1) as Rating });
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="row center">
        <button className="btn secondary" onClick={onRetry}>
          Opnieuw
        </button>
        <button className="btn secondary" onClick={onExit}>
          Naar de kaart
        </button>
        {onNext && (
          <button className="btn" onClick={onNext}>
            Verder →
          </button>
        )}
      </div>
    </div>
  );
}
