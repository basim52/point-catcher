export type SessionRecord = {
  gameId: string;
  gameName: string;
  startedAt: Date;
  durationSeconds: number;
  visit: boolean;
};

export type Period = 'today' | '7d' | '30d' | 'all';

export type GameRow = {
  gameId: string;
  gameName: string;
  visits: number;
  totalSeconds: number;
  totalMinutes: number;
  avgMinutesPerVisit: number;
};

export type StatsSummary = {
  totalVisits: number;
  totalMinutes: number;
  rows: GameRow[];
  topGame: GameRow | null;
};

/** Start of the selected period in local time, or null for "all". */
export function periodStart(period: Period, now: Date = new Date()): Date | null {
  if (period === 'all') return null;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (period === '7d') start.setDate(start.getDate() - 6);
  if (period === '30d') start.setDate(start.getDate() - 29);
  return start;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function summarize(
  records: SessionRecord[],
  period: Period,
  now: Date = new Date(),
  catalogNames?: Record<string, string>
): StatsSummary {
  const since = periodStart(period, now);
  const byGame = new Map<string, { gameName: string; visits: number; seconds: number }>();
  if (catalogNames) {
    for (const [id, label] of Object.entries(catalogNames)) {
      byGame.set(id, { gameName: label, visits: 0, seconds: 0 });
    }
  }
  for (const r of records) {
    if (since && r.startedAt < since) continue;
    const g = byGame.get(r.gameId) ?? {
      gameName: catalogNames?.[r.gameId] ?? r.gameName,
      visits: 0,
      seconds: 0,
    };
    if (catalogNames?.[r.gameId]) g.gameName = catalogNames[r.gameId];
    if (r.visit) g.visits += 1;
    g.seconds += Math.max(0, r.durationSeconds);
    byGame.set(r.gameId, g);
  }
  const rows: GameRow[] = [...byGame.entries()]
    .map(([gameId, g]) => ({
      gameId,
      gameName: g.gameName,
      visits: g.visits,
      totalSeconds: g.seconds,
      totalMinutes: round1(g.seconds / 60),
      avgMinutesPerVisit: g.visits > 0 ? round1(g.seconds / 60 / g.visits) : 0,
    }))
    .sort((a, b) => b.totalSeconds - a.totalSeconds || b.visits - a.visits);
  const totalVisits = rows.reduce((n, r) => n + r.visits, 0);
  const totalSeconds = rows.reduce((n, r) => n + r.totalSeconds, 0);
  return {
    totalVisits,
    totalMinutes: round1(totalSeconds / 60),
    rows,
    topGame: rows.length > 0 && rows[0].totalSeconds > 0 ? rows[0] : null,
  };
}

/**
 * Raise all-time visit totals to at least the durable game_stats counters and
 * ensure every cataloged game in `names` is represented. Never lowers a row.
 */
export function applyAllTimeVisitFloor(
  summary: StatsSummary,
  floors: Record<string, number>,
  names: Record<string, string> = {}
): StatsSummary {
  const byId = new Map(summary.rows.map((r) => [r.gameId, { ...r }]));
  for (const [id, label] of Object.entries(names)) {
    const existing = byId.get(id);
    if (existing) {
      existing.gameName = label;
    } else {
      byId.set(id, {
        gameId: id,
        gameName: label,
        visits: 0,
        totalSeconds: 0,
        totalMinutes: 0,
        avgMinutesPerVisit: 0,
      });
    }
  }
  for (const [id, raw] of Object.entries(floors)) {
    const floor = Math.max(0, Math.floor(Number(raw) || 0));
    if (floor <= 0) continue;
    const row = byId.get(id) ?? {
      gameId: id,
      gameName: names[id] ?? id,
      visits: 0,
      totalSeconds: 0,
      totalMinutes: 0,
      avgMinutesPerVisit: 0,
    };
    if (floor > row.visits) {
      row.visits = floor;
      row.avgMinutesPerVisit = floor > 0 ? round1(row.totalSeconds / 60 / floor) : 0;
    }
    byId.set(id, row);
  }
  const rows = [...byId.values()].sort(
    (a, b) => b.totalSeconds - a.totalSeconds || b.visits - a.visits
  );
  return {
    totalVisits: rows.reduce((n, r) => n + r.visits, 0),
    totalMinutes: summary.totalMinutes,
    rows,
    topGame: rows.length > 0 && rows[0].totalSeconds > 0 ? rows[0] : null,
  };
}
