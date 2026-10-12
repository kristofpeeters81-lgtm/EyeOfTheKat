import { useEffect, useRef } from 'react';
import { STAGES } from '../game/catalog';
import { currentStage, isUnlocked, totalStars, type Profile } from '../game/profiles';
import type { StageId } from '../game/types';
import { fitCanvas, startLoop } from '../render/canvas';
import { PALETTE } from '../render/theme';
import { drawMountains, drawSky } from '../render/world';
import { HeroPortrait } from './HeroPortrait';

/**
 * De wereldkaart (#9, #42): een pad van 9 etappes de berg op, tot het Oog van de Kat. Een etappe gaat
 * open als de vorige uitgespeeld is (#25). Knoppen staan als gewone HTML-knoppen op het canvas.
 */

/** Plaats van elke etappe op de kaart (deel van breedte/hoogte). De laatste ligt net onder het Oog. */
export const MAP_NODES: [number, number][] = [
  [0.12, 0.86],
  [0.3, 0.8],
  [0.47, 0.73],
  [0.3, 0.63],
  [0.5, 0.56],
  [0.68, 0.49],
  [0.52, 0.4],
  [0.66, 0.32],
  [0.72, 0.23],
];

export function WorldMap({
  profile,
  onPlay,
  onSwitch,
  onEdit,
  onCalibrate,
  onHome,
}: {
  profile: Profile;
  onPlay: (id: StageId) => void;
  onSwitch: () => void;
  onEdit: () => void;
  onCalibrate: () => void;
  onHome: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const current = currentStage(profile);
  const done = STAGES.filter((s) => (profile.progress[s.id]?.stars ?? 0) >= 1).length;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return startLoop((t) => {
      const { w, h } = fitCanvas(canvas);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      drawSky(ctx, w, h, t);
      drawMountains(ctx, w, h, 0, t, 0.72);
      // Pad: gestippeld, en vol in jade voor het afgelegde stuk.
      const pts = MAP_NODES.map(([x, y]) => [x * w, y * h] as const);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.setLineDash([2, 14]);
      ctx.lineWidth = 6;
      ctx.strokeStyle = 'rgba(244, 241, 234, 0.55)';
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.lineTo(0.72 * w, 0.13 * h);
      ctx.stroke();
      ctx.setLineDash([]);
      if (done > 0) {
        ctx.strokeStyle = PALETTE.jade;
        ctx.lineWidth = 6;
        ctx.shadowColor = PALETTE.jade;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        pts.slice(0, Math.min(done + 1, pts.length)).forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    });
  }, [done]);

  return (
    <div className="screen map" style={{ padding: 0 }}>
      <canvas ref={canvasRef} className="stage-canvas" />
      <div className="map-header">
        <button className="btn secondary small" onClick={onHome}>
          ⌂
        </button>
        <div className="map-who panel" onClick={onEdit} role="button" tabIndex={0}>
          <HeroPortrait look={profile.look} size={40} />
          <span>
            <b>{profile.name}</b>
            <small className="muted">
              {profile.age} jaar · ★ {totalStars(profile)}
            </small>
          </span>
        </div>
        <span className="grow" />
        <button className="btn secondary small" onClick={onSwitch}>
          Andere ninja
        </button>
        <button className="btn secondary small" onClick={onCalibrate}>
          Kalibreren
        </button>
      </div>
      {STAGES.map((s, i) => {
        const [x, y] = MAP_NODES[i];
        const open = isUnlocked(profile, s.id);
        const stars = profile.progress[s.id]?.stars ?? 0;
        const isCurrent = s.id === current;
        return (
          <button
            key={s.id}
            className={`map-node${open ? '' : ' locked'}${isCurrent ? ' current' : ''}${s.type === 'finale' ? ' finale' : ''}`}
            style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
            disabled={!open}
            onClick={() => onPlay(s.id)}
            aria-label={`${s.name}${open ? '' : ' (op slot)'}`}
          >
            {isCurrent && (
              <span className="map-hero">
                <HeroPortrait look={profile.look} action="ready" size={54} />
              </span>
            )}
            <span className="map-dot">{open ? i + 1 : '🔒'}</span>
            <span className="map-label">
              <b>{s.name}</b>
              <span className="map-stars">{open ? [1, 2, 3].map((k) => (k <= stars ? '★' : '☆')).join('') : s.type}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
