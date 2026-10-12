import { STAGES } from '../game/catalog';
import type { StageId } from '../game/types';

/**
 * Tijdelijke etappekeuze (blok 6–9), tot de wereldkaart met profielen er is (blok 10).
 */
export function StagePicker({
  age,
  quick,
  demo,
  onDemo,
  onAge,
  onQuick,
  onPlay,
  onBack,
}: {
  age: number;
  quick: boolean;
  demo: boolean;
  onDemo: (d: boolean) => void;
  onAge: (a: number) => void;
  onQuick: (q: boolean) => void;
  onPlay: (id: StageId) => void;
  onBack: () => void;
}) {
  return (
    <div className="screen col" style={{ gap: 14 }}>
      <div className="row">
        <button className="btn secondary small" onClick={onBack}>
          ← Terug
        </button>
        <h2 className="grow">Etappes</h2>
      </div>
      <div className="row panel">
        <span>Leeftijd</span>
        {[6, 7, 8, 9, 10, 11, 12].map((a) => (
          <button key={a} className={`btn small${a === age ? '' : ' secondary'}`} onClick={() => onAge(a)}>
            {a}
          </button>
        ))}
        <label className="row" style={{ gap: 6, marginLeft: 'auto' }}>
          <input type="checkbox" checked={quick} onChange={(e) => onQuick(e.target.checked)} /> korte etappes (test)
        </label>
        <label className="row" style={{ gap: 6 }}>
          <input type="checkbox" checked={demo} onChange={(e) => onDemo(e.target.checked)} /> demo (zonder camera)
        </label>
      </div>
      <div className="stage-grid">
        {STAGES.map((s, i) => (
          <button key={s.id} className="stage-card panel" disabled={!s.create} onClick={() => onPlay(s.id)}>
            <small>
              {i + 1} · {s.type}
            </small>
            <b>{s.name}</b>
            <span>{s.blurb}</span>
            {!s.create && <em>nog niet gebouwd</em>}
          </button>
        ))}
      </div>
    </div>
  );
}
