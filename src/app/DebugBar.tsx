import { useEffect, useRef, useState } from 'react';
import { drawMask } from '../render/mask';
import { debugStore } from '../runtime/debug';
import { getSession } from '../runtime';

/**
 * Klein balkje met fps en Ninja Power, altijd zichtbaar; tik voor het volledige debugpaneel (#39).
 * Het paneel toont maskers (effen vormen), nooit het camerabeeld (#10).
 */

export const ZONE_COLORS = ['#6c7393', '#2ee6c5', '#ffb21e', '#ff4d6d'];
export const ZONE_NAMES = ['rust', 'matig', 'hoog', 'piek'];

export function DebugBar({ extra }: { extra?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [, setTick] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTick((t) => t + 1);
      const c = canvasRef.current;
      const m = debugStore.masks;
      if (c && m.mask) drawMask(c, m.mask, m.width, m.height, [46, 230, 197]);
    }, open ? 120 : 400);
    return () => window.clearInterval(id);
  }, [open]);

  const session = getSession();
  const stats = session.loopStats;
  const cam = session.camera;
  const { power, zone, values } = debugStore.data;

  return (
    <>
      <button className="debugbar" onClick={() => setOpen((o) => !o)} aria-label="Debugpaneel">
        <span>
          <b>{stats.fps.toFixed(0)}</b> fps
        </span>
        {power !== null && (
          <span>
            <span className="dot" style={{ background: ZONE_COLORS[zone] }} /> <b>{Math.round(power)}</b> power
          </span>
        )}
      </button>
      {open && (
        <div className="panel debugpanel">
          <canvas ref={canvasRef} className="pixel" />
          <table>
            <tbody>
              <tr>
                <td>versie</td>
                <td>{__APP_VERSION__}</td>
              </tr>
              <tr>
                <td>camera</td>
                <td>{cam ? `${cam.width}×${cam.height}${cam.frameRate ? ` @${Math.round(cam.frameRate)}` : ''} (${cam.facing === 'user' ? 'voor' : 'achter'})` : 'uit'}</td>
              </tr>
              <tr>
                <td>analyse</td>
                <td>
                  {stats.analysisWidth}×{stats.analysisHeight}
                </td>
              </tr>
              <tr>
                <td>verwerking</td>
                <td>{stats.procMs.toFixed(1)} ms/beeld</td>
              </tr>
              {power !== null && (
                <tr>
                  <td>Ninja Power</td>
                  <td>
                    {Math.round(power)} ({ZONE_NAMES[zone]})
                  </td>
                </tr>
              )}
              {Object.entries(values).map(([k, v]) => (
                <tr key={k}>
                  <td>{k}</td>
                  <td>{typeof v === 'number' ? (Number.isInteger(v) ? v : v.toFixed(2)) : v}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {extra}
        </div>
      )}
    </>
  );
}
