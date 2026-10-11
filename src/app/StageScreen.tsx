import { useEffect, useRef, useState } from 'react';
import { createStage, stageInfo } from '../game/catalog';
import type { GameInput, HudInfo, Stage, StageEvent, StageId, StageResult } from '../game/types';
import { fitCanvas, startLoop } from '../render/canvas';
import { StageRenderer } from '../render/stages';
import type { HeroLook } from '../render/theme';
import { getVision } from '../runtime/vision';
import { ZONE_COLORS } from './DebugBar';
import { ResultScreen } from './ResultScreen';
import { Spirit } from './Spirit';

/**
 * Een etappe spelen: canvas met de wereld en de held, HUD bovenaan, ondertitels van de Geest,
 * pauzescherm (#26), begeleider-knop (#31) en daarna het resultaat.
 */

export interface StageScreenProps {
  stageId: StageId;
  age: number;
  look: HeroLook;
  durationScale?: number;
  onEvent?: (e: StageEvent) => void;
  onExit: (result: StageResult | null) => void;
  onNext?: (result: StageResult) => void;
}

export function StageScreen({ stageId, age, look, durationScale, onEvent, onExit, onNext }: StageScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<Stage | null>(null);
  const [hud, setHud] = useState<HudInfo | null>(null);
  const [subtitle, setSubtitle] = useState('');
  const [power, setPower] = useState({ p: 0, zone: 0 });
  const [result, setResult] = useState<StageResult | null>(null);
  const [attempt, setAttempt] = useState(0);
  const eventRef = useRef(onEvent);
  eventRef.current = onEvent;
  const info = stageInfo(stageId);

  useEffect(() => {
    const stage = createStage(stageId, { age, durationScale });
    stageRef.current = stage;
    setResult(null);
    if (!stage) return;
    const renderer = new StageRenderer(stageId, look);
    const vision = getVision();
    let lastPower = { p: 0, zone: 0 };
    vision.setListener((r, _frame, moves) => {
      const input: GameInput = {
        t: r.t,
        dt: r.dt,
        events: moves.events,
        state: moves.state,
        power: r.power,
        zone: r.zone,
        legPower: r.legPower,
        presence: r.presence,
        pose: r.pose,
        markerMode: vision.markerMode,
      };
      const events = stage.update(input);
      for (const e of events) {
        eventRef.current?.(e);
        if (e.type === 'say') setSubtitle(e.text);
        if (e.type === 'done') window.setTimeout(() => setResult(stage.result()), 1800);
      }
      lastPower = { p: r.power, zone: r.zone };
    });
    void vision.start();
    const stopLoop = startLoop((t, dt) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const { w, h } = fitCanvas(canvas);
      const ctx = canvas.getContext('2d');
      if (ctx) renderer.draw(ctx, w, h, stage, t, dt);
    });
    const id = window.setInterval(() => {
      setHud(stage.hud());
      setPower(lastPower);
    }, 120);
    return () => {
      stopLoop();
      window.clearInterval(id);
      vision.setListener(null);
    };
  }, [stageId, age, look, durationScale, attempt]);

  if (!stageRef.current && !result) {
    return (
      <div className="screen col center">
        <h2>{info.name}</h2>
        <p className="muted">Deze etappe wordt nog gebouwd.</p>
        <button className="btn" onClick={() => onExit(null)}>
          Terug
        </button>
      </div>
    );
  }

  if (result) {
    return (
      <ResultScreen
        result={result}
        name={info.name}
        onRetry={() => setAttempt((a) => a + 1)}
        onExit={() => onExit(result)}
        onNext={onNext ? () => onNext(result) : undefined}
      />
    );
  }

  return (
    <div className="screen stage" style={{ padding: 0 }}>
      <canvas ref={canvasRef} className="stage-canvas" />
      {hud && (
        <div className="hud">
          <div className="hud-top">
            <div className="hud-title">
              <small>{info.dutch}</small>
              <b>{hud.title}</b>
            </div>
            <div className="hud-center">
              <div className={`hud-instruction${hud.phase === 'countdown' ? ' big' : ''}`}>{hud.instruction}</div>
              <div className="hud-progress">
                <div style={{ width: `${Math.round(hud.progress * 100)}%` }} />
              </div>
            </div>
            <div className="hud-right">
              <b>{hud.counter}</b>
              {hud.timer !== null && <span className="hud-timer">{hud.timer}</span>}
            </div>
          </div>
          <div className="hud-power">
            <div style={{ height: `${Math.round(power.p)}%`, background: ZONE_COLORS[power.zone] }} />
            <span>⚡</span>
          </div>
          {subtitle && (
            <div className="hud-subtitle">
              <Spirit talking size={44} />
              <p>{subtitle}</p>
            </div>
          )}
          <div className="hud-guide">
            <button className="btn secondary small" title="Begeleider: telt de huidige opdracht als gehaald" onClick={() => stageRef.current?.manualPass()}>
              ✓ Gehaald
            </button>
            <button className="btn secondary small" onClick={() => onExit(null)}>
              ■ Stop
            </button>
          </div>
          {hud.paused && (
            <div className="hud-pause">
              <div className="panel col center">
                <h2>⏸ Pauze</h2>
                <p>{hud.pauseReason}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
