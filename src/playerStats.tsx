import React, { useMemo } from 'react';
import { DEVIL_TRAP_TOTAL_LEVELS, readDevilTrapStats } from './devilTrap/DevilTrapGame';
import { readMonsterArenaStats } from './monsterArena/types';
import { readPlantMergeStats } from './plantMerge/types';
import { read2048Stats } from './game2048';
import { readSnakeStats } from './gameSnake';
import { readShawarmaStats } from './shawarmaShop/types';

export interface PlayerLifetimeStats {
  totalPlaySeconds: number;
  totalSessions: number;
  firstPlayedAt: number;
  coinsSpent: number;
  coinsEarned: number;
  pinkCoinsSpent: number;
  pinkCoinsEarned: number;
  spaceCoinsSpent: number;
  spaceCoinsEarned: number;
  totalPurchases: number;
}

const LIFETIME_STATS_STORAGE_KEY = 'point_catcher_lifetime_stats_v1';

export function createDefaultLifetimeStats(): PlayerLifetimeStats {
  return {
    totalPlaySeconds: 0,
    totalSessions: 1,
    firstPlayedAt: Date.now(),
    coinsSpent: 0,
    coinsEarned: 0,
    pinkCoinsSpent: 0,
    pinkCoinsEarned: 0,
    spaceCoinsSpent: 0,
    spaceCoinsEarned: 0,
    totalPurchases: 0,
  };
}

export function readPlayerLifetimeStats(): PlayerLifetimeStats {
  if (typeof window === 'undefined') return createDefaultLifetimeStats();
  try {
    const raw = window.localStorage.getItem(LIFETIME_STATS_STORAGE_KEY);
    if (!raw) return createDefaultLifetimeStats();
    const parsed = JSON.parse(raw) as Partial<PlayerLifetimeStats>;
    const num = (v: unknown, fallback = 0) =>
      typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : fallback;
    return {
      totalPlaySeconds: num(parsed.totalPlaySeconds, 0),
      totalSessions: Math.max(1, num(parsed.totalSessions, 1)),
      firstPlayedAt: num(parsed.firstPlayedAt, Date.now()),
      coinsSpent: num(parsed.coinsSpent, 0),
      coinsEarned: num(parsed.coinsEarned, 0),
      pinkCoinsSpent: num(parsed.pinkCoinsSpent, 0),
      pinkCoinsEarned: num(parsed.pinkCoinsEarned, 0),
      spaceCoinsSpent: num(parsed.spaceCoinsSpent, 0),
      spaceCoinsEarned: num(parsed.spaceCoinsEarned, 0),
      totalPurchases: num(parsed.totalPurchases, 0),
    };
  } catch {
    return createDefaultLifetimeStats();
  }
}

export function savePlayerLifetimeStats(stats: PlayerLifetimeStats): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LIFETIME_STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // Ignore storage quota errors
  }
}

export function formatPlayDuration(totalSeconds: number, lang: 'ar' | 'en'): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;

  if (lang === 'ar') {
    if (hours > 0) return `${hours} س ${mins} د ${secs} ث`;
    if (mins > 0) return `${mins} د ${secs} ث`;
    return `${secs} ث`;
  }
  if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

export interface PlayerStatsPanelProps {
  lang: 'ar' | 'en';
  lifetimeStats: PlayerLifetimeStats;
  sessionSeconds: number;
  coins: number;
  pinkCoins: number;
  spaceCoins: number;
  bestScore: number;
  completedNormalCount: number;
  totalNormalStages: number;
  completedFruitCount: number;
  totalFruitStages: number;
  completedGoldCount: number;
  totalGoldStages: number;
  completedSpaceCount: number;
  totalSpaceStages: number;
  completedMonsterCount: number;
  totalMonsterStages: number;
  totalDiscoveredCount: number;
  totalBagCount: number;
  ownedUpgradesCount: number;
}

export const PlayerStatsPanel: React.FC<PlayerStatsPanelProps> = ({
  lang,
  lifetimeStats,
  sessionSeconds,
  coins,
  pinkCoins,
  spaceCoins,
  bestScore,
  completedNormalCount,
  totalNormalStages,
  completedFruitCount,
  totalFruitStages,
  completedGoldCount,
  totalGoldStages,
  completedSpaceCount,
  totalSpaceStages,
  completedMonsterCount,
  totalMonsterStages,
  totalDiscoveredCount,
  totalBagCount,
  ownedUpgradesCount,
}) => {
  const isAr = lang === 'ar';

  const miniStats = useMemo(() => {
    const devil = readDevilTrapStats();
    const arena = readMonsterArenaStats();
    const plant = readPlantMergeStats();
    const g2048 = read2048Stats();
    const snake = readSnakeStats();
    const shawarma = readShawarmaStats();
    return { devil, arena, plant, g2048, snake, shawarma };
  }, []);

  const totalClearedStages =
    completedNormalCount +
    completedFruitCount +
    completedGoldCount +
    completedSpaceCount +
    completedMonsterCount;
  const totalAllStages =
    totalNormalStages +
    totalFruitStages +
    totalGoldStages +
    totalSpaceStages +
    totalMonsterStages;

  const totalAllSpent =
    lifetimeStats.coinsSpent +
    lifetimeStats.pinkCoinsSpent +
    lifetimeStats.spaceCoinsSpent;

  const firstPlayedLabel = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(isAr ? 'ar-SA' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(new Date(lifetimeStats.firstPlayedAt));
    } catch {
      return '';
    }
  }, [isAr, lifetimeStats.firstPlayedAt]);

  return (
    <div className="space-y-4 py-4">
      {/* 1. Play Time Summary */}
      <div className="rounded-xl border border-sky-400/25 bg-sky-950/25 p-3.5">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-300">
            {isAr ? 'مدة اللعب والنشاط' : 'Play Time & Activity'}
          </span>
          {firstPlayedLabel && (
            <span className="text-[11px] text-slate-400">
              {isAr ? `منذ ${firstPlayedLabel}` : `Since ${firstPlayedLabel}`}
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-[#0a1324]/90 border border-white/8 p-2.5">
            <div className="text-[11px] text-slate-400">
              {isAr ? 'إجمالي المدة' : 'Total Time'}
            </div>
            <div className="font-num text-sm sm:text-base font-extrabold text-sky-200 mt-0.5 tabular-nums">
              {formatPlayDuration(lifetimeStats.totalPlaySeconds, lang)}
            </div>
          </div>

          <div className="rounded-lg bg-[#0a1324]/90 border border-white/8 p-2.5">
            <div className="text-[11px] text-slate-400">
              {isAr ? 'هذه الجلسة' : 'This Session'}
            </div>
            <div className="font-num text-sm sm:text-base font-extrabold text-emerald-300 mt-0.5 tabular-nums">
              {formatPlayDuration(sessionSeconds, lang)}
            </div>
          </div>

          <div className="rounded-lg bg-[#0a1324]/90 border border-white/8 p-2.5">
            <div className="text-[11px] text-slate-400">
              {isAr ? 'عدد الجلسات' : 'Sessions'}
            </div>
            <div className="font-num text-sm sm:text-base font-extrabold text-white mt-0.5 tabular-nums">
              {lifetimeStats.totalSessions.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Currency Spending & Earnings */}
      <div className="rounded-xl border border-amber-400/25 bg-[#0b1528] p-3.5 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
            {isAr ? 'سجل العملات (المصروف والمكتسب)' : 'Currency Ledger (Spent & Earned)'}
          </span>
          <span className="font-num text-[11px] font-bold text-slate-300 tabular-nums">
            {isAr
              ? `${lifetimeStats.totalPurchases} عملية شراء`
              : `${lifetimeStats.totalPurchases} purchases`}
          </span>
        </div>

        <div className="space-y-2">
          {/* Gold Coins */}
          <div className="rounded-lg border border-amber-400/20 bg-amber-950/15 px-3 py-2.5">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs sm:text-sm font-bold text-amber-200">
                {isAr ? 'الفلوس الذهبية' : 'Gold Coins'}
              </span>
              <span className="font-num text-xs font-bold text-amber-300 tabular-nums">
                {isAr ? `الرصيد: ${coins.toLocaleString()}` : `Balance: ${coins.toLocaleString()}`}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between rounded-md bg-black/30 px-2.5 py-1.5">
                <span className="text-slate-400">{isAr ? 'المصروف' : 'Spent'}</span>
                <span className="font-num font-extrabold text-rose-300 tabular-nums">
                  {lifetimeStats.coinsSpent.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-md bg-black/30 px-2.5 py-1.5">
                <span className="text-slate-400">{isAr ? 'المكتسب' : 'Earned'}</span>
                <span className="font-num font-extrabold text-emerald-300 tabular-nums">
                  {lifetimeStats.coinsEarned.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Pink Coins */}
          <div className="rounded-lg border border-pink-400/20 bg-pink-950/15 px-3 py-2.5">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs sm:text-sm font-bold text-pink-200">
                {isAr ? 'العملات الوردية' : 'Pink Coins'}
              </span>
              <span className="font-num text-xs font-bold text-pink-300 tabular-nums">
                {isAr ? `الرصيد: ${pinkCoins.toLocaleString()}` : `Balance: ${pinkCoins.toLocaleString()}`}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between rounded-md bg-black/30 px-2.5 py-1.5">
                <span className="text-slate-400">{isAr ? 'المصروف' : 'Spent'}</span>
                <span className="font-num font-extrabold text-rose-300 tabular-nums">
                  {lifetimeStats.pinkCoinsSpent.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-md bg-black/30 px-2.5 py-1.5">
                <span className="text-slate-400">{isAr ? 'المكتسب' : 'Earned'}</span>
                <span className="font-num font-extrabold text-emerald-300 tabular-nums">
                  {lifetimeStats.pinkCoinsEarned.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Space Coins */}
          <div className="rounded-lg border border-violet-400/25 bg-violet-950/20 px-3 py-2.5">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs sm:text-sm font-bold text-violet-200">
                {isAr ? 'عملات الفضاء' : 'Space Coins'}
              </span>
              <span className="font-num text-xs font-bold text-cyan-300 tabular-nums">
                {isAr ? `الرصيد: ${spaceCoins.toLocaleString()}` : `Balance: ${spaceCoins.toLocaleString()}`}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between rounded-md bg-black/30 px-2.5 py-1.5">
                <span className="text-slate-400">{isAr ? 'المصروف' : 'Spent'}</span>
                <span className="font-num font-extrabold text-rose-300 tabular-nums">
                  {lifetimeStats.spaceCoinsSpent.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-md bg-black/30 px-2.5 py-1.5">
                <span className="text-slate-400">{isAr ? 'المكتسب' : 'Earned'}</span>
                <span className="font-num font-extrabold text-emerald-300 tabular-nums">
                  {lifetimeStats.spaceCoinsEarned.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 text-xs border-t border-white/8">
          <span className="text-slate-400">
            {isAr ? 'إجمالي كل ما صرفته' : 'Total All Currencies Spent'}
          </span>
          <span className="font-num font-extrabold text-amber-200 tabular-nums">
            {totalAllSpent.toLocaleString()}
          </span>
        </div>
      </div>

      {/* 3. Progress & Achievements */}
      <div className="rounded-xl border border-white/10 bg-[#0b1528] p-3.5 space-y-2.5">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
          {isAr ? 'التقدم والإنجازات' : 'Progress & Records'}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-black/25 border border-white/8 p-2.5">
            <div className="text-slate-400">{isAr ? 'أعلى نتيجة' : 'Best Score'}</div>
            <div className="font-num text-base font-extrabold text-white mt-0.5 tabular-nums">
              {bestScore.toLocaleString()}
            </div>
          </div>

          <div className="rounded-lg bg-black/25 border border-white/8 p-2.5">
            <div className="text-slate-400">{isAr ? 'المراحل المكتملة' : 'Stages Cleared'}</div>
            <div className="font-num text-base font-extrabold text-sky-300 mt-0.5 tabular-nums">
              {totalClearedStages}/{totalAllStages}
            </div>
          </div>

          <div className="rounded-lg bg-black/25 border border-white/8 p-2.5">
            <div className="text-slate-400">{isAr ? 'مكتشفات الاندكس' : 'Index Discovered'}</div>
            <div className="font-num text-base font-extrabold text-emerald-300 mt-0.5 tabular-nums">
              {totalDiscoveredCount}
            </div>
          </div>

          <div className="rounded-lg bg-black/25 border border-white/8 p-2.5">
            <div className="text-slate-400">{isAr ? 'المقتنيات والحقيبة' : 'Upgrades & Bag'}</div>
            <div className="font-num text-base font-extrabold text-amber-300 mt-0.5 tabular-nums">
              {ownedUpgradesCount} · {totalBagCount}
            </div>
          </div>
        </div>

        {/* Compact per-world completion bar */}
        <div className="grid grid-cols-5 gap-1.5 pt-1 text-center text-[10.5px]">
          <div className="rounded-md bg-sky-500/10 border border-sky-400/20 py-1.5 px-1">
            <div className="text-slate-400 truncate">{isAr ? 'عادي' : 'Norm'}</div>
            <div className="font-num font-bold text-sky-200 tabular-nums">
              {completedNormalCount}/{totalNormalStages}
            </div>
          </div>
          <div className="rounded-md bg-emerald-500/10 border border-emerald-400/20 py-1.5 px-1">
            <div className="text-slate-400 truncate">{isAr ? 'فواكه' : 'Fruit'}</div>
            <div className="font-num font-bold text-emerald-200 tabular-nums">
              {completedFruitCount}/{totalFruitStages}
            </div>
          </div>
          <div className="rounded-md bg-amber-500/10 border border-amber-400/20 py-1.5 px-1">
            <div className="text-slate-400 truncate">{isAr ? 'ذهبي' : 'Gold'}</div>
            <div className="font-num font-bold text-amber-200 tabular-nums">
              {completedGoldCount}/{totalGoldStages}
            </div>
          </div>
          <div className="rounded-md bg-violet-500/10 border border-violet-400/20 py-1.5 px-1">
            <div className="text-slate-400 truncate">{isAr ? 'فضاء' : 'Space'}</div>
            <div className="font-num font-bold text-violet-200 tabular-nums">
              {completedSpaceCount}/{totalSpaceStages}
            </div>
          </div>
          <div className="rounded-md bg-rose-500/10 border border-rose-400/20 py-1.5 px-1">
            <div className="text-slate-400 truncate">{isAr ? 'وحش' : 'Boss'}</div>
            <div className="font-num font-bold text-rose-200 tabular-nums">
              {completedMonsterCount}/{totalMonsterStages}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Mini-Games Snapshot */}
      <div className="rounded-xl border border-white/10 bg-[#0b1528] p-3.5 space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-emerald-300">
          {isAr ? 'ملخص صالة الألعاب' : 'Mini-Games Snapshot'}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-black/25 border border-white/8 p-2.5">
            <div className="text-slate-400">{isAr ? 'بوابة الشيطان 2D' : "Devil's Gate 2D"}</div>
            <div className="font-num font-bold text-amber-200 mt-0.5 tabular-nums">
              {miniStats.devil.completedLevelIds.length}/{DEVIL_TRAP_TOTAL_LEVELS}
              <span className="text-[10.5px] text-rose-300 ms-1.5">
                ({miniStats.devil.totalDeaths} {isAr ? 'وفاة' : 'deaths'})
              </span>
            </div>
          </div>

          <div className="rounded-lg bg-black/25 border border-white/8 p-2.5">
            <div className="text-slate-400">{isAr ? 'حلبة الوحوش 3D' : 'Monster Arena 3D'}</div>
            <div className="font-num font-bold text-rose-200 mt-0.5 tabular-nums">
              {miniStats.arena.bestScore.toLocaleString()}
              <span className="text-[10.5px] text-amber-300 ms-1.5">
                W{miniStats.arena.bestWave}
              </span>
            </div>
          </div>

          <div className="rounded-lg bg-black/25 border border-white/8 p-2.5">
            <div className="text-slate-400">{isAr ? 'مزرعة النباتات 3D' : 'Plant Defense 3D'}</div>
            <div className="font-num font-bold text-emerald-200 mt-0.5 tabular-nums">
              {miniStats.plant.bestScore.toLocaleString()}
              <span className="text-[10.5px] text-slate-400 ms-1.5">
                W{miniStats.plant.bestWave}
              </span>
            </div>
          </div>

          <div className="rounded-lg bg-black/25 border border-white/8 p-2.5">
            <div className="text-slate-400">{isAr ? '2048 · الثعبان · الشاورما' : '2048 · Snake · Shawarma'}</div>
            <div className="font-num font-bold text-sky-200 mt-0.5 tabular-nums truncate">
              {miniStats.g2048.bestScore} · {miniStats.snake.bestScore} · {miniStats.shawarma.bestCash}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
