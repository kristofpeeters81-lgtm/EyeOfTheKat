import { describe, expect, it } from 'vitest';
import { CSV_COLUMNS, MAX_ENTRIES, SessionLog, toCsv, type LogEntry } from './sessionLog';

const entry = (over: Partial<LogEntry> = {}): LogEntry => ({
  at: '2026-10-12T10:00:00.000Z',
  profileId: 'p1',
  name: 'Sam; "de snelle"',
  result: {
    stageId: 'log-roll',
    stars: 2,
    score: 1234,
    total: 24,
    detected: 18,
    auto: 5,
    manual: 1,
    activeMs: 61500,
    highZoneMs: 20500,
    avgPower: 41,
    peakPower: 88,
    durationMs: 95000,
    pauses: 1,
    markerMode: false,
    age: 9,
  },
  tech: { appVersion: '0.1.0-abc', fps: 28.46, procMs: 6.12, camera: '640×480', analysis: '160×120', orientation: 'liggend', device: 'Android' },
  ...over,
});

describe('SessionLog', () => {
  it('bewaart regels en de evaluatie bij de laatste regel van die ninja', () => {
    let saved: LogEntry[] = [];
    const log = new SessionLog([], (e) => (saved = e));
    log.add(entry());
    log.add(entry({ profileId: 'p2' }));
    log.rateLast('p1', { fun: 3 });
    log.rateLast('p1', { effort: 2 });
    expect(saved[0].fun).toBe(3);
    expect(saved[0].effort).toBe(2);
    expect(saved[1].fun).toBeUndefined();
  });

  it('houdt maximaal MAX_ENTRIES regels', () => {
    const log = new SessionLog([], () => undefined);
    for (let i = 0; i < MAX_ENTRIES + 5; i++) log.add(entry());
    expect(log.list()).toHaveLength(MAX_ENTRIES);
  });

  it('negeert kapotte opslag', () => {
    expect(new SessionLog(null as unknown as LogEntry[], () => undefined).list()).toEqual([]);
  });
});

describe('toCsv', () => {
  it('maakt een Excel-vriendelijke CSV (; en decimale komma, aanhalingstekens rond lastige tekst)', () => {
    const csv = toCsv([entry({ fun: 3 })]);
    const [header, row] = csv.replace('﻿', '').split('\r\n');
    expect(header.split(';')).toEqual([...CSV_COLUMNS]);
    expect(row).toContain('"Sam; ""de snelle"""');
    const cells = row.split(';');
    expect(cells).toContain('75'); // gezien_pct = 18/24
    expect(cells).toContain('62'); // actief_s = 61,5 s, afgerond
    expect(row).toContain('28,5');
    expect(row).toContain(';3;');
  });
});
