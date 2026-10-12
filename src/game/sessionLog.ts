import type { StageResult } from './types';

/**
 * Meetgegevens (#28, #29): één regel per gespeelde etappe, plus de korte evaluatie van het kind.
 * Puur TypeScript; de opslag en het downloaden zitten in de app-laag. Nooit beelden (#3): enkel
 * getallen, de bijnaam en de leeftijd.
 */

export type Rating = 1 | 2 | 3;

export interface TechInfo {
  appVersion: string;
  /** Gemiddelde verwerkte beelden per seconde en verwerkingstijd per beeld. */
  fps: number;
  procMs: number;
  camera: string;
  analysis: string;
  orientation: 'liggend' | 'staand';
  device: string;
}

export interface LogEntry {
  /** Tijdstip (ISO). */
  at: string;
  profileId: string;
  name: string;
  result: StageResult;
  tech: TechInfo;
  /** Hoe leuk (1 = niet zo, 2 = oké, 3 = super). */
  fun?: Rating;
  /** Hoe zwaar (1 = makkelijk, 2 = goed, 3 = zwaar). */
  effort?: Rating;
}

export const MAX_ENTRIES = 1000;

export class SessionLog {
  private entries: LogEntry[];

  constructor(
    initial: LogEntry[],
    private readonly save: (e: LogEntry[]) => void,
  ) {
    this.entries = Array.isArray(initial) ? initial.filter((e) => e && e.result) : [];
  }

  list(): LogEntry[] {
    return [...this.entries];
  }

  add(e: LogEntry): number {
    this.entries.push(e);
    if (this.entries.length > MAX_ENTRIES) this.entries.splice(0, this.entries.length - MAX_ENTRIES);
    this.save(this.entries);
    return this.entries.length - 1;
  }

  /** Evaluatie toevoegen aan de laatste regel van deze ninja. */
  rateLast(profileId: string, change: { fun?: Rating; effort?: Rating }): void {
    for (let i = this.entries.length - 1; i >= 0; i--) {
      if (this.entries[i].profileId === profileId) {
        this.entries[i] = { ...this.entries[i], ...change };
        this.save(this.entries);
        return;
      }
    }
  }

  clear(): void {
    this.entries = [];
    this.save(this.entries);
  }
}

export const CSV_COLUMNS = [
  'tijdstip',
  'ninja',
  'leeftijd',
  'etappe',
  'sterren',
  'score',
  'opdrachten',
  'gezien',
  'vanzelf',
  'begeleider',
  'gezien_pct',
  'actief_s',
  'hoog_piek_s',
  'hoog_piek_pct',
  'gem_power',
  'piek_power',
  'duur_s',
  'pauzes',
  'bandjes',
  'leuk',
  'zwaar',
  'fps',
  'ms_per_beeld',
  'camera',
  'analyse',
  'stand',
  'versie',
  'toestel',
] as const;

function csvCell(v: string | number | undefined): string {
  if (v === undefined || v === null) return '';
  const s = String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Komma's als decimaalteken en ; als scheiding: opent meteen goed in Excel met Belgische instellingen. */
function num(n: number, digits = 0): string {
  return n.toFixed(digits).replace('.', ',');
}

export function toCsv(entries: LogEntry[]): string {
  const rows = entries.map((e) => {
    const r = e.result;
    const pct = (a: number, b: number) => (b > 0 ? num((a / b) * 100) : '');
    return [
      e.at,
      e.name,
      r.age,
      r.stageId,
      r.stars,
      r.score,
      r.total,
      r.detected,
      r.auto,
      r.manual,
      pct(r.detected, r.total),
      num(r.activeMs / 1000),
      num(r.highZoneMs / 1000),
      pct(r.highZoneMs, r.activeMs),
      r.avgPower,
      r.peakPower,
      num(r.durationMs / 1000),
      r.pauses,
      r.markerMode ? 'ja' : 'nee',
      e.fun ?? '',
      e.effort ?? '',
      num(e.tech.fps, 1),
      num(e.tech.procMs, 1),
      e.tech.camera,
      e.tech.analysis,
      e.tech.orientation,
      e.tech.appVersion,
      e.tech.device,
    ]
      .map(csvCell)
      .join(';');
  });
  // BOM: Excel herkent dan de UTF-8 (ë, é).
  return '﻿' + [CSV_COLUMNS.join(';'), ...rows].join('\r\n');
}
