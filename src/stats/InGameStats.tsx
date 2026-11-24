import React, { Component, lazy, Suspense, useCallback, useEffect, useState, type ReactNode } from 'react';
import { openStatsOverlay, useLongPress, useStatsAdminFlag, useStatsOpenRequests } from './adminAccess';

const StatsPage = lazy(() => import('./StatsPage'));

/** 📊 button: rendered only on devices where an admin has signed in. */
export const StatsAdminButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const isAdmin = useStatsAdminFlag();
  if (!isAdmin) return null;
  return (
    <button
      type="button"
      onClick={openStatsOverlay}
      aria-label="لوحة الإحصائيات الخاصة"
      title="الإحصائيات"
      className={`inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-lg border border-amber-300/40 bg-amber-400/15 px-2.5 text-sm font-bold text-amber-100 transition-colors hover:bg-amber-400/25 active:scale-[0.98] cursor-pointer ${className}`}
    >
      <span aria-hidden>📊</span>
      <span className="hidden sm:inline">الإحصائيات</span>
    </button>
  );
};

/** Wraps the game title: holding it ~2s opens the admin sign-in. */
export const AdminLongPressTitle: React.FC<{ className?: string; children: ReactNode }> = ({
  className = '',
  children,
}) => {
  const { handlers } = useLongPress(openStatsOverlay, 2000);
  return (
    <span {...handlers} className={`select-none [-webkit-touch-callout:none] ${className}`}>
      {children}
    </span>
  );
};

class LoadBoundary extends Component<{ onClose: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div dir="rtl" className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0b1020]/95 p-4 text-slate-100">
        <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
          <p className="text-lg font-extrabold">تعذّر فتح الإحصائيات</p>
          <p className="mt-2 text-sm text-slate-300">تأكد من الاتصال بالإنترنت ثم حاول مرة ثانية.</p>
          <button
            type="button"
            onClick={this.props.onClose}
            className="mt-5 min-h-11 w-full rounded-2xl bg-white px-4 font-bold text-slate-900"
          >
            رجوع للعبة
          </button>
        </div>
      </div>
    );
  }
}

/** Mounted once in the game; shows the dashboard as an in-game overlay on request. */
export const StatsOverlayHost: React.FC = () => {
  const [open, setOpen] = useState(false);
  const onOpen = useCallback(() => setOpen(true), []);
  const onClose = useCallback(() => setOpen(false), []);
  useStatsOpenRequests(onOpen);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open]);
  if (!open) return null;
  return (
    <LoadBoundary onClose={onClose}>
      <Suspense
        fallback={
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0b1020]/95 text-slate-200" dir="rtl">
            جارٍ التحميل…
          </div>
        }
      >
        <StatsPage variant="overlay" onClose={onClose} />
      </Suspense>
    </LoadBoundary>
  );
};
