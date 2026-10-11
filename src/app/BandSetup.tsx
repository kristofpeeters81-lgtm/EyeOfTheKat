import { useEffect, useRef, useState } from 'react';
import { drawBandPreview } from '../render/bands';
import { BandFlow, type BandView } from '../runtime/bandFlow';
import { getVision } from '../runtime/vision';
import { Spirit } from './Spirit';

/**
 * Kleurbandjes instellen (#18, #33): voorwerp in het vak houden → kleur geleerd → om de polsen en
 * terug in de schaduw-ninja → app ziet 2 bandjes en geen storende kleur → klaar.
 */
export function BandSetup({ onDone, onBack, say }: { onDone: () => void; onBack: () => void; say?: (s: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const flowRef = useRef<BandFlow | null>(null);
  const [view, setView] = useState<BandView | null>(null);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    const vision = getVision();
    vision.disableMarkers();
    vision.setHighRes(true);
    const flow = new BandFlow(vision, (s) => say?.(s));
    flowRef.current = flow;
    let finished = false;
    vision.setListener((r, frame, moves) => {
      flow.update(frame, r, moves.color);
      const v = flow.view();
      if (canvasRef.current) drawBandPreview(canvasRef.current, frame, v.step === 'hold', moves.color, v.swatch);
      if (v.step === 'done' && !finished) {
        finished = true;
        window.setTimeout(() => doneRef.current(), 1200);
      }
    });
    void vision.start();
    const id = window.setInterval(() => setView(flow.view()), 100);
    return () => {
      window.clearInterval(id);
      vision.setListener(null);
      // Niet afgewerkt = modus terug uit (enkel "done" laat de bandjes aan).
      if (!finished) vision.disableMarkers();
    };
  }, [say]);

  return (
    <div className="screen calibrate">
      <div className="row">
        <button className="btn secondary small" onClick={onBack}>
          ← Terug
        </button>
        <h2 className="grow">Kleurbandjes</h2>
      </div>
      <div className="calibrate-body">
        <div className="calibrate-preview">
          <canvas ref={canvasRef} />
        </div>
        <div className="calibrate-side col">
          <Spirit talking={view?.step !== 'hold'} />
          <p className="spirit-text">{view?.text}</p>
          {view?.swatch && (
            <div className="row">
              <span className="swatch" style={{ background: view.swatch }} />
              <span className="muted">geleerde kleur</span>
            </div>
          )}
          {view?.step === 'hold' && (
            <ul className="tips muted">
              <li>Kies iets fel en effen: een gekleurde sok, sjaaltje of scrunchie.</li>
              <li>Liefst een kleur die nergens anders in de kamer of op je kleren zit.</li>
              <li>Je hebt er twee nodig, één voor elke pols.</li>
            </ul>
          )}
          <div className="bar">
            <div style={{ width: `${Math.round((view?.progress ?? 0) * 100)}%` }} />
          </div>
          {(view?.step === 'conflict' || view?.step === 'check') && (
            <button className="btn secondary small" onClick={() => flowRef.current?.restart()}>
              Ander voorwerp
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
