import { useEffect, useRef, useState } from 'react';
import { CameraError } from '../camera/camera';
import { drawFrame } from '../render/mask';
import { getVision } from '../runtime/vision';

/**
 * Blok 1: camera starten en meten. Toont een kleine, grofkorrelige preview (het analysebeeld van
 * 160 pixels breed, #10/#46); het debugpaneel toont het bewegingsmasker.
 */

const ERRORS: Record<string, string> = {
  insecure: 'De camera werkt enkel via een https-link.',
  'no-api': 'Deze browser ondersteunt geen camera. Probeer Chrome.',
  denied: 'Geen toestemming voor de camera. Geef toestemming in de browserinstellingen en probeer opnieuw.',
  'not-found': 'Geen camera gevonden.',
  busy: 'De camera wordt al door een andere app gebruikt.',
  unknown: 'De camera kon niet starten.',
};

export function CameraCheck({ onBack }: { onBack: () => void }) {
  const previewRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const vision = getVision();
    const before = vision.debugMask;
    vision.debugMask = 'motion';
    let n = 0;
    vision.setListener((_r, frame) => {
      if (previewRef.current && n++ % 2 === 0) drawFrame(previewRef.current, frame);
    });
    vision
      .start()
      .then(() => setRunning(true))
      .catch((err: unknown) => setError(err instanceof CameraError ? ERRORS[err.code] : ERRORS.unknown));
    return () => {
      vision.setListener(null);
      vision.debugMask = before;
    };
  }, []);

  return (
    <div className="screen col">
      <div className="row">
        <button className="btn secondary small" onClick={onBack}>
          ← Terug
        </button>
        <h2 className="grow">Cameratest</h2>
      </div>
      {error ? (
        <div className="panel">{error}</div>
      ) : (
        <div className="col grow center">
          <canvas ref={previewRef} className="pixel" style={{ width: 'min(90vw, 60vh)', borderRadius: 16, background: 'var(--night-2)' }} />
          <p className="muted" style={{ maxWidth: 520, textAlign: 'center' }}>
            {running
              ? 'Dit grofkorrelige beeld is alles wat de app ziet. Het blijft op dit toestel en wordt niet bewaard. Tik rechtsonder op het balkje voor de metingen.'
              : 'Camera starten…'}
          </p>
        </div>
      )}
    </div>
  );
}
