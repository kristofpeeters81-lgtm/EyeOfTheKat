import { useState } from 'react';
import { stageInfo } from '../game/catalog';
import { exportCsv, exportJson, getLog } from './logStore';
import { getProfiles } from './profileStore';

/**
 * Meetgegevens voor begeleiders (#28, #29): overzicht, export naar CSV (Excel) en JSON, en wissen.
 * Alles staat enkel op dit toestel; exporteren = een bestand in Downloads.
 */
export function DataScreen({ onBack }: { onBack: () => void }) {
  const [, setV] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const entries = getLog().list();
  const last = entries.slice(-12).reverse();
  const pct = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)}%` : '-');
  const avg = (f: (n: number) => number) => (entries.length ? Math.round(entries.reduce((a, _e, i) => a + f(i), 0) / entries.length) : 0);
  const detectedPct = avg((i) => (entries[i].result.total ? (entries[i].result.detected / entries[i].result.total) * 100 : 0));
  const fps = avg((i) => entries[i].tech.fps);
  const fun = entries.filter((e) => e.fun);

  return (
    <div className="screen col" style={{ gap: 14 }}>
      <div className="row">
        <button className="btn secondary small" onClick={onBack}>
          ← Terug
        </button>
        <h2 className="grow">Meetgegevens</h2>
      </div>
      <div className="result-stats panel">
        <div>
          <b>{entries.length}</b>
          <span>gespeelde etappes</span>
        </div>
        <div>
          <b>{getProfiles().list().length}</b>
          <span>ninja’s</span>
        </div>
        <div>
          <b>{entries.length ? `${detectedPct}%` : '-'}</b>
          <span>gezien door de camera</span>
        </div>
        <div>
          <b>{entries.length ? fps : '-'}</b>
          <span>gem. fps</span>
        </div>
        <div>
          <b>{fun.length ? (fun.reduce((a, e) => a + (e.fun ?? 0), 0) / fun.length).toFixed(1) : '-'}</b>
          <span>leuk (1–3)</span>
        </div>
      </div>
      <div className="row">
        <button className="btn" disabled={!entries.length} onClick={exportCsv}>
          Export CSV (Excel)
        </button>
        <button className="btn secondary" onClick={exportJson}>
          Export JSON (alles)
        </button>
        {confirm ? (
          <button
            className="btn secondary small"
            onClick={() => {
              getLog().clear();
              setConfirm(false);
              setV((v) => v + 1);
            }}
          >
            Zeker? Alles wissen
          </button>
        ) : (
          <button className="btn secondary small" disabled={!entries.length} onClick={() => setConfirm(true)}>
            Meetgegevens wissen
          </button>
        )}
      </div>
      <p className="muted small-text">
        Enkel getallen, bijnamen en leeftijden: nooit beelden. Het bestand komt in Downloads op dit toestel. De ninja’s zelf blijven
        bewaard als je de meetgegevens wist.
      </p>
      {last.length > 0 && (
        <div className="panel data-table">
          <table>
            <thead>
              <tr>
                <th>Wanneer</th>
                <th>Ninja</th>
                <th>Etappe</th>
                <th>★</th>
                <th>Gezien</th>
                <th>Hoog/piek</th>
                <th>Leuk</th>
                <th>fps</th>
              </tr>
            </thead>
            <tbody>
              {last.map((e, i) => (
                <tr key={`${e.at}-${i}`}>
                  <td>{new Date(e.at).toLocaleString('nl-BE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                  <td>
                    {e.name} ({e.result.age})
                  </td>
                  <td>{stageInfo(e.result.stageId).name}</td>
                  <td>{e.result.stars}</td>
                  <td>{pct(e.result.detected, e.result.total)}</td>
                  <td>{pct(e.result.highZoneMs, e.result.activeMs)}</td>
                  <td>{e.fun ? ['🙁', '🙂', '🤩'][e.fun - 1] : ''}</td>
                  <td>{Math.round(e.tech.fps)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
