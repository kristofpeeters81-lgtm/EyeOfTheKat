import { SessionLog, toCsv, type LogEntry, type TechInfo } from '../game/sessionLog';
import type { StageResult } from '../game/types';
import { getSession } from '../runtime';
import { getProfiles } from './profileStore';
import { loadJson, saveJson } from './storage';

/**
 * Meetgegevens op dit toestel (#29) en export naar CSV/JSON. Exporteren = een bestand downloaden
 * naar het toestel (geen netwerk, blijft binnen de CSP, #4).
 */
const KEY = 'eyeOfTheKat.log';

let log: SessionLog | null = null;

export function getLog(): SessionLog {
  log ??= new SessionLog(loadJson<LogEntry[]>(KEY, []), (e) => void saveJson(KEY, e));
  return log;
}

/** Korte toestelomschrijving voor de export (blijft lokaal): enkel het type, geen identificatie. */
function deviceName(): string {
  const ua = navigator.userAgent;
  if (/iPad|iPhone/.test(ua)) return 'iOS';
  const m = ua.match(/Android [\d.]+(; [^;)]+)?/);
  if (m) return m[0].replace(/;\s*/, ' ').replace(/Build.*$/, '').trim();
  if (/Windows/.test(ua)) return 'Windows';
  if (/Mac/.test(ua)) return 'Mac';
  return 'onbekend';
}

export function techInfo(): TechInfo {
  const s = getSession();
  const st = s.loopStats;
  const cam = s.camera;
  return {
    appVersion: __APP_VERSION__,
    fps: st.fps,
    procMs: st.procMs,
    camera: cam ? `${cam.width}×${cam.height}` : 'demo',
    analysis: st.analysisWidth ? `${st.analysisWidth}×${st.analysisHeight}` : '-',
    orientation: window.innerHeight > window.innerWidth ? 'staand' : 'liggend',
    device: deviceName(),
  };
}

export function logResult(profileId: string, name: string, result: StageResult): void {
  getLog().add({ at: new Date().toISOString(), profileId, name, result, tech: techInfo() });
}

function download(filename: string, content: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function stamp(): string {
  return new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
}

export function exportCsv(): void {
  download(`eye-of-the-kat-${stamp()}.csv`, toCsv(getLog().list()), 'text/csv;charset=utf-8');
}

export function exportJson(): void {
  const data = { app: 'The Eye of the Kat', version: __APP_VERSION__, exportedAt: new Date().toISOString(), profiles: getProfiles().list(), log: getLog().list() };
  download(`eye-of-the-kat-${stamp()}.json`, JSON.stringify(data, null, 2), 'application/json');
}
