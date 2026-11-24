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
  now: Date = new Date()
): StatsSummary {
  const since = periodStart(period, now);
  const byGame = new Map<string, { gameName: string; visits: number; seconds: number }>();
  for (const r of records) {
    if (since && r.startedAt < since) continue;
    const g = byGame.get(r.gameId) ?? { gameName: r.gameName, visits: 0, seconds: 0 };
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
