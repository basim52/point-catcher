// Dev-only sample data so the layout can be reviewed without real accounts.
import { TRACKED_GAMES } from '../analytics/games';
import type { SessionRecord } from './aggregate';

export function makeDemoSessions(now = new Date()): SessionRecord[] {
  const ids = Object.keys(TRACKED_GAMES) as (keyof typeof TRACKED_GAMES)[];
  const out: SessionRecord[] = [];
  let seed = 7;
  const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  ids.forEach((id, i) => {
    const weight = Math.max(1, 18 - i * 1.1);
    const visits = Math.round(weight * (1 + rand() * 3));
    for (let k = 0; k < visits; k++) {
      const daysAgo = Math.floor(rand() * 40);
      out.push({
        gameId: id,
        gameName: TRACKED_GAMES[id],
        startedAt: new Date(now.getTime() - daysAgo * 86400000 - rand() * 3600000),
        durationSeconds: Math.round(60 + rand() * 60 * weight),
        visit: true,
      });
    }
  });
  return out;
}
