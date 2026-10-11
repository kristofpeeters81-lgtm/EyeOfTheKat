import { useEffect, useRef, useState } from 'react';
import { CameraError } from '../camera/camera';
import { drawPreview } from '../render/preview';
import { CalibrationFlow, type FlowView } from '../runtime/calibrationFlow';
import { getVision } from '../runtime/vision';
import type { BodyCalibration } from '../vision/types';
import { Spirit } from './Spirit';

/**
 * Kalibratiescherm (#30): toestel klaarzetten → opzij stappen → lege kamer leren → terugkomen in de
 * schaduw-ninja → klaar. Het camerabeeld is enkel zichtbaar tijdens het klaarzetten (#10).
 */

const CAMERA_ERRORS: Record<string, string> = {
  insecure: 'De camera werkt enkel via een https-link.',
  'no-api': 'Deze browser ondersteunt geen camera. Probeer Chrome.',
  denied: 'Geen toestemming voor de camera. Geef toestemming in de browserinstellingen en probeer opnieuw.',
  'not-found': 'Geen camera gevonden.',
  busy: 'De camera wordt al door een andere app gebruikt.',
  unknown: 'De camera kon niet starten.',
};

export interface CalibrateProps {
  /** Enkel het lichaam opnieuw (achtergrond al geleerd), bv. bij een nieuwe speler. */
  bodyOnly?: boolean;
  onDone: (c: BodyCalibration) => void;
  onBack: () => void;
  say?: (text: string) => void;
}

export function Calibrate({ bodyOnly, onDone, onBack, say }: CalibrateProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const flowRef = useRef<CalibrationFlow | null>(null);
  const [view, setView] = useState<FlowView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    const vision = getVision();
    const flow = new CalibrationFlow(vision.engine, (s) => say?.(s));
    flowRef.current = flow;
    let finished = false;
    vision.setListener((r, frame) => {
      flow.update(r, r.t);
      const v = flow.view();
      const c = canvasRef.current;
      if (c) {
        drawPreview(c, {
          frame: v.step === 'aim' ? frame : null,
          mask: v.step === 'aim' ? null : r.personMask,
          width: r.width,
          height: r.height,
          ghost: v.step === 'enter' || v.step === 'done' || v.step === 'aim',
          progress: v.step === 'enter' ? v.progress : v.step === 'done' ? 1 : 0,
          ok: r.space === 'ok',
        });
      }
      if (v.step === 'done' && !finished && flow.calibration) {
        finished = true;
        const calib = flow.calibration;
        window.setTimeout(() => doneRef.current(calib), 1400);
      }
    });
    vision
      .start()
      .then(() => {
        if (bodyOnly && vision.engine.currentPhase === 'running') flow.bodyOnly(performance.now());
      })
      .catch((err: unknown) => setError(err instanceof CameraError ? CAMERA_ERRORS[err.code] : CAMERA_ERRORS.unknown));
    const id = window.setInterval(() => setView(flow.view()), 100);
    return () => {
      window.clearInterval(id);
      vision.setListener(null);
    };
  }, [bodyOnly, say]);

  return (
    <div className="screen calibrate">
      <div className="row">
        <button className="btn secondary small" onClick={onBack}>
          ← Terug
        </button>
        <h2 className="grow">{view?.title ?? 'Camera starten…'}</h2>
      </div>
      {error ? (
        <div className="panel">{error}</div>
      ) : (
        <div className="calibrate-body">
          <div className="calibrate-preview">
            <canvas ref={canvasRef} />
            {view?.step === 'countdown' && view.count !== null && <div className="countdown">{view.count}</div>}
          </div>
          <div className="calibrate-side col">
            <Spirit talking={!!view && view.step !== 'aim'} />
            <p className="spirit-text">{view?.text}</p>
            {view?.step === 'aim' && (
              <>
                <ul className="tips muted">
                  <li>Zet het toestel rechtop of liggend, stevig, op heuphoogte.</li>
                  <li>Zorg voor 2 à 3 meter vrije ruimte ervoor, zonder spullen om over te struikelen.</li>
                  <li>Liefst een rustige achtergrond, geen tv of raam met beweging.</li>
                  <li>Dit kleine beeld blijft op dit toestel en verdwijnt zodra het spel start.</li>
                </ul>
                <button className="btn" onClick={() => flowRef.current?.begin(performance.now())}>
                  Klaar, start!
                </button>
              </>
            )}
            {view && (view.step === 'learning' || view.step === 'enter') && (
              <div className="bar">
                <div style={{ width: `${Math.round(view.progress * 100)}%` }} />
              </div>
            )}
            {view && view.step !== 'aim' && view.step !== 'done' && (
              <button className="btn secondary small" onClick={() => flowRef.current?.begin(performance.now())}>
                Opnieuw
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
