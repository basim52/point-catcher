import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import { isAnalyticsConfigured, STATS_ADMIN_EMAILS } from '../analytics/config';
import { applyAllTimeVisitFloor, periodStart, summarize, type Period, type SessionRecord } from './aggregate';
import {
  completeRedirectSignIn,
  fetchGameStats,
  fetchSessions,
  signInWithGoogle,
  signOutUser,
  syncPublicVisitCounts,
  watchUser,
} from './firebaseClient';
import { TRACKED_GAMES } from '../analytics/games';
import { consumeStatsRedirectPending, setStatsAdminFlag } from './adminAccess';
import { makeDemoSessions } from './demoData';

type DemoMode = 'data' | 'denied' | 'signin' | null;
const demoMode: DemoMode = (() => {
  if (!import.meta.env.DEV) return null;
  const v = new URLSearchParams(window.location.search).get('demo');
  return v === 'data' || v === 'denied' || v === 'signin' ? v : null;
})();

const PERIODS: { id: Period; label: string }[] = [
  { id: 'today', label: 'اليوم' },
  { id: '7d', label: 'آخر ٧ أيام' },
  { id: '30d', label: 'آخر ٣٠ يوم' },
  { id: 'all', label: 'الكل' },
];

const nf = new Intl.NumberFormat('ar-SA-u-nu-latn', { maximumFractionDigits: 1 });
const fmt = (n: number) => nf.format(n);

function signInErrorText(code: string): string {
  if (code === 'auth/unauthorized-domain') return 'هذا النطاق غير مضاف في إعدادات Firebase Authentication.';
  if (code === 'auth/popup-closed-by-user') return 'تم إغلاق نافذة Google قبل إكمال الدخول.';
  if (code === 'auth/network-request-failed') return 'لا يوجد اتصال بالإنترنت. حاول مرة ثانية.';
  return 'لم يكتمل تسجيل الدخول. حاول مرة ثانية.';
}

function isAdmin(user: User | null): boolean {
  if (!user || !user.emailVerified || !user.email) return false;
  return STATS_ADMIN_EMAILS.includes(user.email.toLowerCase());
}


const STATS_CACHE_KEY = 'pc_stats_last_summary_v1';

type CachedBoard = {
  period: Period;
  records: Array<{
    gameId: string;
    gameName: string;
    startedAt: string;
    durationSeconds: number;
    visit: boolean;
  }>;
  floors: Record<string, number>;
};

function readCachedBoard(): { period: Period; records: SessionRecord[]; floors: Record<string, number> } | null {
  try {
    const raw = sessionStorage.getItem(STATS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedBoard;
    if (!parsed || !Array.isArray(parsed.records)) return null;
    return {
      period: parsed.period,
      floors: parsed.floors && typeof parsed.floors === 'object' ? parsed.floors : {},
      records: parsed.records.map((r) => ({
        gameId: String(r.gameId ?? ''),
        gameName: String(r.gameName ?? ''),
        startedAt: new Date(r.startedAt),
        durationSeconds: Number(r.durationSeconds ?? 0),
        visit: r.visit !== false,
      })),
    };
  } catch {
    return null;
  }
}

function writeCachedBoard(period: Period, records: SessionRecord[], floors: Record<string, number>): void {
  try {
    const payload: CachedBoard = {
      period,
      floors,
      records: records.map((r) => ({
        gameId: r.gameId,
        gameName: r.gameName,
        startedAt: r.startedAt.toISOString(),
        durationSeconds: r.durationSeconds,
        visit: r.visit,
      })),
    };
    sessionStorage.setItem(STATS_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota / private mode
  }
}

type Variant = 'page' | 'overlay';

const Shell: React.FC<{ variant: Variant; children: React.ReactNode }> = ({ variant, children }) => (
  <div
    dir="rtl"
    lang="ar"
    role={variant === 'overlay' ? 'dialog' : undefined}
    aria-modal={variant === 'overlay' ? true : undefined}
    aria-label={variant === 'overlay' ? 'لوحة الإحصائيات' : undefined}
    className={
      variant === 'overlay'
        ? 'fixed inset-0 z-[100] h-[100dvh] w-full overflow-y-auto overscroll-contain bg-[#0b1020] text-slate-100'
        : 'min-h-[100dvh] w-full bg-[#0b1020] text-slate-100'
    }
    style={{ fontFamily: "'Cairo', 'Tajawal', system-ui, sans-serif" }}
  >
    {children}
  </div>
);

const BackButton: React.FC<{ onClose: () => void; className?: string }> = ({ onClose, className = '' }) => (
  <button
    type="button"
    onClick={onClose}
    className={`inline-flex min-h-10 items-center gap-1 rounded-xl border border-white/15 bg-white/5 px-3 text-xs font-bold text-slate-100 sm:text-sm ${className}`}
  >
    <span aria-hidden>→</span> رجوع للعبة
  </button>
);

const CenterCard: React.FC<{
  variant: Variant;
  onClose?: () => void;
  title: string;
  body?: string;
  children?: React.ReactNode;
}> = ({ variant, onClose, title, body, children }) => (
  <Shell variant={variant}>
    {onClose && (
      <div className="absolute right-3 top-3">
        <BackButton onClose={onClose} />
      </div>
    )}
    <div className="flex min-h-[100dvh] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-6 text-center shadow-2xl">
        <div className="mb-3 text-4xl" aria-hidden>📊</div>
        <h1 className="text-2xl font-extrabold">{title}</h1>
        {body && <p className="mt-2 text-sm leading-7 text-slate-300">{body}</p>}
        {children && <div className="mt-5 flex flex-col items-center gap-3">{children}</div>}
      </div>
    </div>
  </Shell>
);

type StatsPageProps = { variant?: Variant; onClose?: () => void };

const StatsPage: React.FC<StatsPageProps> = ({ variant = 'page', onClose }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(demoMode !== null);
  const [period, setPeriod] = useState<Period>('7d');
  const [appliedPeriod, setAppliedPeriod] = useState<Period>('7d');
  const [records, setRecords] = useState<SessionRecord[] | null>(null);
  const [visitFloors, setVisitFloors] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const lastAdminRef = useRef<User | null>(null);
  const [holdAdmin, setHoldAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [denied, setDenied] = useState(demoMode === 'denied');

  useEffect(() => {
    if (variant !== 'page') return;
    document.title = 'لوحة الإحصائيات | صياد النقاط';
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  useEffect(() => {
    if (demoMode || !isAnalyticsConfigured) return;
    consumeStatsRedirectPending();
    void completeRedirectSignIn().then((code) => {
      if (code) setError(signInErrorText(code));
    });
  }, []);

  useEffect(() => {
    if (demoMode || !isAnalyticsConfigured) return;
    let readyTimer: number | undefined;
    const stop = watchUser((u) => {
      setUser(u);
      if (u) {
        if (readyTimer !== undefined) window.clearTimeout(readyTimer);
        setAuthReady(true);
        return;
      }
      // Don't flash the sign-in screen if the persisted admin is about to arrive.
      if (readyTimer !== undefined) window.clearTimeout(readyTimer);
      readyTimer = window.setTimeout(() => setAuthReady(true), 800);
    });
    return () => {
      stop();
      if (readyTimer !== undefined) window.clearTimeout(readyTimer);
    };
  }, []);

  // Keep the last admin user through brief auth nulls (token refresh) so the board stays up.
  useEffect(() => {
    if (demoMode || !authReady) return;
    if (user && isAdmin(user)) {
      lastAdminRef.current = user;
      setHoldAdmin(true);
      setStatsAdminFlag(true);
      setDenied(false);
      return;
    }
    if (user && !isAdmin(user)) {
      lastAdminRef.current = null;
      setHoldAdmin(false);
      setStatsAdminFlag(false);
      setDenied(true);
      void signOutUser();
      return;
    }
    if (!lastAdminRef.current) {
      setHoldAdmin(false);
      return;
    }
    const t = window.setTimeout(() => {
      lastAdminRef.current = null;
      setHoldAdmin(false);
    }, 1500);
    return () => window.clearTimeout(t);
  }, [user, authReady]);

  const displayUser = (user && isAdmin(user) ? user : null) ?? (holdAdmin ? lastAdminRef.current : null);
  const admin = demoMode === 'data' || isAdmin(displayUser);

  const handleSignOut = () => {
    setStatsAdminFlag(false);
    void signOutUser();
    onClose?.();
  };

  useEffect(() => {
    if (!admin) return;
    if (demoMode === 'data') {
      setRecords(makeDemoSessions());
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchSessions(periodStart(period))
      .then((r) => {
        if (cancelled) return;
        setRecords(r);
        setAppliedPeriod(period);
        if (period === 'all') {
          void syncPublicVisitCounts(r);
          void fetchGameStats()
            .then((floors) => {
              if (cancelled) return;
              setVisitFloors(floors);
              writeCachedBoard(period, r, floors);
            })
            .catch(() => {
              if (!cancelled) writeCachedBoard(period, r, {});
            });
        } else {
          setVisitFloors({});
          writeCachedBoard(period, r, {});
        }
      })
      .catch(() => !cancelled && setError('تعذّر تحميل البيانات. تأكد من نشر قواعد Firestore ثم أعد المحاولة.'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [admin, period]);

  // Restore last board instantly on remount so numbers never flash empty.
  useEffect(() => {
    if (records) return;
    const cached = readCachedBoard();
    if (!cached || cached.records.length === 0) return;
    setRecords(cached.records);
    setPeriod(cached.period);
    setAppliedPeriod(cached.period);
    setVisitFloors(cached.floors);
  }, [records]);

  const summary = useMemo(() => {
    const base = summarize(records ?? [], appliedPeriod);
    return appliedPeriod === 'all'
      ? applyAllTimeVisitFloor(base, visitFloors, TRACKED_GAMES)
      : base;
  }, [records, appliedPeriod, visitFloors]);

  if (!demoMode && !isAnalyticsConfigured) {
    return (
      <CenterCard variant={variant} onClose={onClose} title="اللوحة غير مهيّأة" body="إعدادات Firebase غير موجودة في هذا النشر." />
    );
  }
  if (!authReady && !admin && !records) {
    return <CenterCard variant={variant} onClose={onClose} title="جارٍ التحميل…" />;
  }

  const handleSignIn = async () => {
    setSigningIn(true);
    setError(null);
    setDenied(false);
    try {
      await signInWithGoogle();
    } catch (e) {
      const code = (e as { code?: string }).code ?? 'unknown';
      console.warn('[stats] sign-in failed:', code);
      setError(signInErrorText(code));
    } finally {
      setSigningIn(false);
    }
  };

  if (denied) {
    return (
      <CenterCard variant={variant} onClose={onClose} title="غير مسموح" body="هذا الحساب لا يملك صلاحية عرض الإحصائيات، وتم تسجيل خروجه.">
        <button
          type="button"
          onClick={handleSignIn}
          disabled={signingIn}
          className="min-h-12 rounded-2xl border border-white/20 px-5 py-2 text-sm font-bold"
        >
          الدخول بحساب آخر
        </button>
      </CenterCard>
    );
  }

  if (demoMode === 'signin' || (!demoMode && !admin && !displayUser && authReady && !holdAdmin)) {
    return (
      <CenterCard variant={variant} onClose={onClose} title="لوحة الإحصائيات" body="هذه الصفحة خاصة. سجّل الدخول بحساب Google المسموح له.">
        <button
          type="button"
          onClick={handleSignIn}
          disabled={signingIn}
          className="min-h-12 w-full rounded-2xl bg-white px-5 py-3 text-base font-bold text-slate-900 shadow-lg transition active:scale-[0.98] disabled:opacity-60"
        >
          {signingIn ? 'جارٍ فتح Google…' : 'تسجيل الدخول بحساب Google'}
        </button>
        {error && <p className="text-sm text-rose-300">{error}</p>}
      </CenterCard>
    );
  }

  if (!admin) {
    return <CenterCard variant={variant} onClose={onClose} title="جارٍ التحقق…" />;
  }

  const maxSeconds = summary.rows[0]?.totalSeconds || 1;
  const email = demoMode ? 'بيانات تجريبية' : displayUser?.email ?? user?.email ?? '';

  return (
    <Shell variant={variant}>
      <div className="mx-auto w-full max-w-6xl px-3 pb-6 pt-3 sm:px-5">
        <header className="sticky top-0 z-10 -mx-3 mb-3 flex flex-wrap items-center justify-between gap-2 bg-[#0b1020]/95 px-3 py-2 backdrop-blur sm:-mx-5 sm:px-5">
          <div className="flex min-w-0 items-center gap-2">
            {onClose && <BackButton onClose={onClose} className="shrink-0" />}
            <div className="min-w-0">
            <h1 className="text-xl font-extrabold sm:text-2xl">📊 إحصائيات صياد النقاط</h1>
            <p className="truncate text-xs text-slate-400" dir="auto">{email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div role="tablist" aria-label="الفترة" className="flex rounded-2xl bg-white/5 p-1">
              {PERIODS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="tab"
                  aria-selected={period === p.id}
                  onClick={() => setPeriod(p.id)}
                  className={`min-h-10 whitespace-nowrap rounded-xl px-2.5 text-xs font-bold transition sm:px-3 sm:text-sm ${
                    period === p.id ? 'bg-cyan-400 text-slate-900' : 'text-slate-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {!demoMode && (
              <button
                type="button"
                onClick={handleSignOut}
                className="min-h-10 rounded-xl border border-white/15 px-3 text-xs font-bold text-slate-300"
              >
                خروج
              </button>
            )}
          </div>
        </header>

        {error && <p className="mb-3 rounded-2xl bg-rose-500/15 p-3 text-sm text-rose-200">{error}</p>}

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="col-span-2 rounded-3xl border border-amber-300/40 bg-gradient-to-l from-amber-400/25 to-fuchsia-500/20 p-4">
            <p className="text-xs font-bold text-amber-200">🏆 اللعبة الأعلى لعباً بالدقائق</p>
            {summary.topGame ? (
              <>
                <p className="mt-1 text-2xl font-extrabold leading-tight">{summary.topGame.gameName}</p>
                <p className="mt-1 text-sm text-slate-200">
                  {fmt(summary.topGame.totalMinutes)} دقيقة · {fmt(summary.topGame.visits)} زيارة
                </p>
              </>
            ) : (
              <p className="mt-1 text-lg font-bold text-slate-300">لا توجد بيانات بعد</p>
            )}
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-bold text-slate-400">إجمالي الزيارات</p>
            <p className="mt-1 text-3xl font-extrabold text-cyan-300">{fmt(summary.totalVisits)}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-bold text-slate-400">إجمالي الدقائق</p>
            <p className="mt-1 text-3xl font-extrabold text-lime-300">{fmt(summary.totalMinutes)}</p>
          </div>
        </section>

        {loading && <p className="mt-4 text-center text-sm text-slate-400">جارٍ تحميل البيانات…</p>}

        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <section className="min-w-0 rounded-3xl border border-white/10 bg-white/5 p-4">
            <h2 className="mb-3 text-base font-extrabold">الدقائق والزيارات لكل لعبة</h2>
            {summary.rows.length === 0 ? (
              <p className="text-sm text-slate-400">لا توجد جلسات في هذه الفترة.</p>
            ) : (
              <ul className="space-y-2">
                {summary.rows.map((r, i) => (
                  <li key={r.gameId} className="grid grid-cols-[7.5rem_1fr_auto] items-center gap-2 text-xs sm:grid-cols-[9rem_1fr_auto] sm:text-sm">
                    <span className="truncate font-bold" title={r.gameName}>{r.gameName}</span>
                    <span className="h-4 overflow-hidden rounded-full bg-white/10">
                      <span
                        className={`block h-full rounded-full ${i === 0 && r.totalSeconds > 0 ? 'bg-amber-300' : 'bg-cyan-400'}`}
                        style={{
                          width: `${r.totalSeconds > 0 ? Math.max(2, (r.totalSeconds / maxSeconds) * 100) : 0}%`,
                        }}
                      />
                    </span>
                    <span className="text-left tabular-nums whitespace-nowrap text-slate-300">
                      <span className="text-cyan-300 font-bold">{fmt(r.visits)} زيارة</span>
                      <span className="mx-1 text-slate-500">·</span>
                      <span>{fmt(r.totalMinutes)} د</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="min-w-0 rounded-3xl border border-white/10 bg-white/5 p-4">
            <h2 className="mb-3 text-base font-extrabold">تفاصيل الألعاب</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[20rem] text-right text-xs sm:text-sm">
                <thead className="text-slate-400">
                  <tr className="border-b border-white/10">
                    <th className="py-2 pe-2 font-bold">#</th>
                    <th className="py-2 pe-2 font-bold">اللعبة</th>
                    <th className="py-2 pe-2 font-bold">الزيارات</th>
                    <th className="py-2 pe-2 font-bold">الدقائق</th>
                    <th className="py-2 font-bold whitespace-nowrap">المتوسط</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.rows.map((r, i) => (
                    <tr key={r.gameId} className={`border-b border-white/5 ${i === 0 ? 'text-amber-200' : ''}`}>
                      <td className="py-2 pe-2 tabular-nums text-slate-400">{i + 1}</td>
                      <td className="py-2 pe-2 font-bold">{r.gameName}</td>
                      <td className="py-2 pe-2 tabular-nums">{fmt(r.visits)}</td>
                      <td className="py-2 pe-2 tabular-nums">{fmt(r.totalMinutes)}</td>
                      <td className="py-2 tabular-nums">{fmt(r.avgMinutesPerVisit)} د</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
        <p className="mt-4 text-center text-[11px] text-slate-500">
          الوقت المحسوب هو وقت اللعب الفعلي فقط (لا يُحسب وقت الخلفية). لا تُحفظ أي بيانات شخصية عن اللاعبين.
        </p>
      </div>
    </Shell>
  );
};

export default StatsPage;
