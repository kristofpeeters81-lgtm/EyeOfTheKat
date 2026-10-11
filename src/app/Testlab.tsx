import { useEffect, useRef, useState } from 'react';
import { drawLab } from '../render/lab';
import { getVision } from '../runtime/vision';
import { countEvents, emptyCounts, type HoldPose, type MoveCounts, type MoveState } from '../vision/moves';
import { ZONE_NAMES } from '../vision/power';
import { ZONE_COLORS } from './DebugBar';

/**
 * Testlab (#28, #39): elke beweging los testen. Doe een beweging 10× en kijk of de teller klopt.
 * Het silhouet is een effen vorm; rode vlakken = slagzones, oranje = reikzones (klimmen).
 */

interface Tile {
  key: keyof MoveCounts;
  label: string;
  hint: string;
}

const TILES: Tile[] = [
  { key: 'jump', label: 'Sprongen', hint: 'Log Roll' },
  { key: 'squat', label: 'Hurken', hint: 'Duck Beams' },
  { key: 'frogleap', label: 'Kikkersprongen', hint: 'Frog Leap' },
  { key: 'laneChanges', label: 'Zijstappen', hint: 'Stone Hop' },
  { key: 'step', label: 'Passen', hint: 'Bridge Sprint' },
  { key: 'strikeLeft', label: 'Slag links', hint: 'Shadow Strike' },
  { key: 'strikeRight', label: 'Slag rechts', hint: 'Shadow Strike' },
  { key: 'strikeUp', label: 'Slag omhoog', hint: 'Shadow Strike' },
  { key: 'reachLeft', label: 'Reik links', hint: 'Wall Climb' },
  { key: 'reachRight', label: 'Reik rechts', hint: 'Wall Climb' },
];

const HOLDS: { key: HoldPose; label: string }[] = [
  { key: 'squat', label: 'Hurkzit' },
  { key: 'star', label: 'Ster' },
  { key: 'arms-up', label: 'Armen omhoog' },
];

export function Testlab({ onBack, onRecalibrate, onBands }: { onBack: () => void; onRecalibrate: () => void; onBands: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const countsRef = useRef<MoveCounts>(emptyCounts());
  const stateRef = useRef<MoveState | null>(null);
  const powerRef = useRef({ power: 0, zone: 0, legs: 0, presence: 'ok' as string });
  const [, setTick] = useState(0);
  const [bands, setBands] = useState(() => getVision().markerMode);

  useEffect(() => {
    const vision = getVision();
    vision.setListener((r, _frame, moves) => {
      countEvents(countsRef.current, moves.events);
      stateRef.current = moves.state;
      powerRef.current = { power: r.power, zone: r.zone, legs: r.legPower, presence: r.presence };
      if (canvasRef.current) drawLab(canvasRef.current, r, moves.state, moves.markers ?? []);
    });
    void vision.start();
    const id = window.setInterval(() => setTick((t) => t + 1), 125);
    return () => {
      window.clearInterval(id);
      vision.setListener(null);
    };
  }, []);

  const counts = countsRef.current;
  const state = stateRef.current;
  const p = powerRef.current;
  const presenceText: Record<string, string> = { ok: '', missing: '⏸ Uit beeld', two: '⏸ Tweede persoon in beeld', scene: '⏸ Beeld veranderd: opnieuw kalibreren' };

  return (
    <div className="screen testlab">
      <div className="row">
        <button className="btn secondary small" onClick={onBack}>
          ← Terug
        </button>
        <h2 className="grow">Testlab</h2>
        <button className="btn secondary small" onClick={() => (countsRef.current = emptyCounts())}>
          Tellers op 0
        </button>
        <button
          className={`btn small${bands ? '' : ' secondary'}`}
          onClick={() => {
            const vision = getVision();
            if (bands) {
              vision.disableMarkers();
              setBands(false);
            } else if (vision.colorModel) {
              vision.enableMarkers(vision.colorModel);
              setBands(true);
            } else {
              onBands();
            }
          }}
        >
          Bandjes {bands ? 'aan' : 'uit'}
        </button>
        {bands && (
          <button className="btn secondary small" onClick={onBands}>
            Kleur opnieuw
          </button>
        )}
        <button className="btn secondary small" onClick={onRecalibrate}>
          Kalibreren
        </button>
      </div>
      <div className="testlab-body">
        <div className="testlab-view">
          <canvas ref={canvasRef} />
          {p.presence !== 'ok' && <div className="testlab-warning">{presenceText[p.presence]}</div>}
          <div className="powerbar">
            <div style={{ width: `${Math.round(p.power)}%`, background: ZONE_COLORS[p.zone] }} />
            <span>
              Ninja Power <b>{Math.round(p.power)}</b> · {ZONE_NAMES[p.zone]} · benen {Math.round(p.legs)}
            </span>
          </div>
        </div>
        <div className="testlab-side">
          <div className="tiles">
            {TILES.map((tile) => (
              <div key={tile.key} className="tile">
                <b key={counts[tile.key]} className="pop">
                  {counts[tile.key]}
                </b>
                <span>{tile.label}</span>
                <small>{tile.hint}</small>
              </div>
            ))}
          </div>
          <div className="holds">
            {HOLDS.map((hold) => (
              <div key={hold.key} className={`hold${state?.poses[hold.key] ? ' on' : ''}`}>
                <span>{hold.label}</span>
                <b>{((state?.holdMs[hold.key] ?? 0) / 1000).toFixed(1)} s</b>
              </div>
            ))}
          </div>
          <p className="muted small-text">
            Shadow Wall-houdingen tellen enkel als je redelijk stil staat. Wit gestippeld: je gekalibreerde hoofd, voeten en midden.
          </p>
        </div>
      </div>
    </div>
  );
}
