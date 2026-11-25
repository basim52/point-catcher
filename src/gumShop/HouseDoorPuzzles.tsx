import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  pickNextDoorPuzzleId,
  PUZZLE_BY_ID,
  PUZZLE_CATALOG,
  PUZZLE_CATEGORIES,
  PUZZLE_CATEGORY_MAP,
  TOTAL_PUZZLE_COUNT,
  type PuzzleCategoryId,
  type PuzzleDefinition,
  type PuzzleDifficulty,
} from './puzzlesData';

interface EngineProps {
  lang: 'ar' | 'en';
  variant: 0 | 1 | 2 | 3 | 4;
  onWin: () => void;
  onBeep?: (good: boolean) => void;
}

function shuffleArray<T>(arr: readonly T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

// ============================================================================
// ENGINE 1: MEMORY & MATCHING (Puzzles #01 - #05)
// ============================================================================
const MemoryEngine: React.FC<EngineProps> = ({ lang, variant, onWin, onBeep }) => {
  // Variant 3 = Flash Grid Recall (3x3 memory flash)
  if (variant === 3) {
    return <FlashGridRecallSub lang={lang} onWin={onWin} onBeep={onBeep} />;
  }

  const isMake10 = variant === 4;
  const is4x4 = variant === 2;

  const createDeck = useCallback(() => {
    if (isMake10) {
      const pairs: Array<[number, number]> = [
        [1, 9],
        [2, 8],
        [3, 7],
        [4, 6],
        [5, 5],
        [0, 10],
      ];
      const flat = pairs.flatMap(([a, b]) => [
        { label: String(a), val: a },
        { label: String(b), val: b },
      ]);
      return shuffleArray(flat).map((item, idx) => ({
        id: idx,
        label: item.label,
        val: item.val,
        matched: false,
      }));
    }
    const icons =
      variant === 0
        ? ['🔑', '🌙', '🍬', '⭐', '🏠', '💎']
        : variant === 1
        ? ['🍓', '🍉', '🍇', '🍋', '🫐', '🍒']
        : ['🔑', '🗝️', '👑', '💎', '🪙', '🏆', '🧲', '🧭'];
    const doubled = [...icons, ...icons];
    return shuffleArray(doubled).map((icon, idx) => ({
      id: idx,
      label: icon,
      val: idx,
      matched: false,
    }));
  }, [isMake10, variant]);

  const [tiles, setTiles] = useState(() => createDeck());
  const [flipped, setFlipped] = useState<number[]>([]);
  const [mismatch, setMismatch] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const matchedPairs = tiles.filter((t) => t.matched).length / 2;
  const totalPairs = tiles.length / 2;

  const handleClick = (id: number) => {
    if (mismatch.length > 0 || flipped.includes(id)) return;
    const tile = tiles[id];
    if (!tile || tile.matched) return;

    const next = [...flipped, id];
    setFlipped(next);
    if (next.length < 2) return;

    setMoves((m) => m + 1);
    const [aId, bId] = next;
    const a = tiles[aId];
    const b = tiles[bId];
    const isMatch = isMake10 ? a.val + b.val === 10 : a.label === b.label;

    if (isMatch) {
      onBeep?.(true);
      const updated = tiles.map((t) =>
        t.id === aId || t.id === bId ? { ...t, matched: true } : t
      );
      setTiles(updated);
      setFlipped([]);
      if (updated.every((t) => t.matched)) {
        timerRef.current = window.setTimeout(onWin, 320);
      }
    } else {
      onBeep?.(false);
      setMismatch([aId, bId]);
      timerRef.current = window.setTimeout(() => {
        setFlipped([]);
        setMismatch([]);
      }, 580);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-3 tabular-nums">
        <span>
          {lang === 'ar' ? `الأقفال المفتوحة: ${matchedPairs} / ${totalPairs}` : `Pairs: ${matchedPairs} / ${totalPairs}`}
        </span>
        <span>{lang === 'ar' ? `المحاولات: ${moves}` : `Moves: ${moves}`}</span>
      </div>
      <div className={`grid grid-cols-4 gap-2 ${is4x4 ? 'max-w-sm mx-auto' : ''}`}>
        {tiles.map((t) => {
          const open = t.matched || flipped.includes(t.id);
          const bad = mismatch.includes(t.id);
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => handleClick(t.id)}
              disabled={t.matched}
              className={`${is4x4 ? 'h-14 text-xl' : 'h-16 text-2xl'} rounded-xl border-2 font-black flex items-center justify-center transition-transform cursor-pointer tabular-nums ${
                t.matched
                  ? 'border-emerald-400 bg-emerald-500/20 text-emerald-100 scale-[0.96]'
                  : bad
                  ? 'border-rose-400 bg-rose-500/25 text-white'
                  : open
                  ? 'border-amber-300 bg-amber-400/20 text-white'
                  : 'border-sky-400/35 bg-[#152944] hover:bg-[#1e395e] text-sky-300'
              }`}
            >
              {open ? t.label : '❓'}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const FlashGridRecallSub: React.FC<{
  lang: 'ar' | 'en';
  onWin: () => void;
  onBeep?: (good: boolean) => void;
}> = ({ lang, onWin, onBeep }) => {
  const makeTarget = (count: number) => shuffleArray([0, 1, 2, 3, 4, 5, 6, 7, 8]).slice(0, count);
  const [round, setRound] = useState(1);
  const [targets, setTargets] = useState<number[]>(() => makeTarget(4));
  const [showing, setShowing] = useState(true);
  const [picked, setPicked] = useState<number[]>([]);
  const [wrongIdx, setWrongIdx] = useState<number | null>(null);

  useEffect(() => {
    setShowing(true);
    const id = window.setTimeout(() => setShowing(false), 1800);
    return () => window.clearTimeout(id);
  }, [targets]);

  const handleTap = (idx: number) => {
    if (showing || picked.includes(idx)) return;
    if (targets.includes(idx)) {
      onBeep?.(true);
      const next = [...picked, idx];
      setPicked(next);
      if (next.length === targets.length) {
        if (round >= 2) {
          window.setTimeout(onWin, 280);
        } else {
          window.setTimeout(() => {
            setRound(2);
            setPicked([]);
            setTargets(makeTarget(5));
          }, 400);
        }
      }
    } else {
      onBeep?.(false);
      setWrongIdx(idx);
      window.setTimeout(() => {
        setWrongIdx(null);
        setPicked([]);
        setTargets([...targets]);
      }, 650);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-3 tabular-nums">
        <span>
          {showing
            ? lang === 'ar'
              ? '👀 احفظ المربعات المضيئة...'
              : '👀 Memorize the glowing tiles...'
            : lang === 'ar'
            ? `اضغط المربعات (${picked.length}/${targets.length})`
            : `Tap the tiles (${picked.length}/${targets.length})`}
        </span>
        <span>{lang === 'ar' ? `جولة ${round}/2` : `Round ${round}/2`}</span>
      </div>
      <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto">
        {Array.from({ length: 9 }, (_, idx) => {
          const lit = (showing && targets.includes(idx)) || picked.includes(idx);
          const isWrong = wrongIdx === idx;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleTap(idx)}
              className={`h-20 rounded-xl border-2 text-2xl font-black transition-all cursor-pointer ${
                isWrong
                  ? 'border-rose-400 bg-rose-500/35 text-white'
                  : lit
                  ? 'border-amber-300 bg-amber-400/35 text-amber-100'
                  : 'border-white/15 bg-[#152944] hover:bg-[#1e395e] text-slate-500'
              }`}
            >
              {lit ? '⚡' : ''}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// ENGINE 2: SAFE & COMBINATION LOCKS (Puzzles #06 - #10)
// ============================================================================
const COLOR_OPTIONS = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠'] as const;

const SafeLockEngine: React.FC<EngineProps> = ({ lang, variant, onWin, onBeep }) => {
  // Variant 2 = Target Sum Dials
  if (variant === 2) {
    return <TargetSumDialSub lang={lang} onWin={onWin} onBeep={onBeep} />;
  }
  // Variant 3 = Binary Bit Lock
  if (variant === 3) {
    return <BinaryBitSub lang={lang} onWin={onWin} onBeep={onBeep} />;
  }
  // Variant 4 = Color Mastermind
  if (variant === 4) {
    return <ColorMastermindSub lang={lang} onWin={onWin} onBeep={onBeep} />;
  }

  // Variants 0 (3-digit) & 1 (4-digit) PIN Mastermind
  const len = variant === 0 ? 3 : 4;
  const [secret] = useState<number[]>(() => shuffleArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, len));
  const [digits, setDigits] = useState<number[]>(() => Array(len).fill(0));
  const [history, setHistory] = useState<Array<{ guess: string; exact: number; close: number }>>([]);

  const stepDigit = (idx: number, delta: number) => {
    setDigits((prev) => prev.map((d, i) => (i === idx ? (d + delta + 10) % 10 : d)));
  };

  const handleSubmit = () => {
    let exact = 0;
    let close = 0;
    for (let i = 0; i < len; i++) {
      if (digits[i] === secret[i]) exact++;
      else if (secret.includes(digits[i])) close++;
    }
    setHistory((prev) => [{ guess: digits.join(' '), exact, close }, ...prev].slice(0, 6));
    if (exact === len) {
      onBeep?.(true);
      window.setTimeout(onWin, 280);
    } else {
      onBeep?.(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-2.5" dir="ltr">
        {digits.map((d, idx) => (
          <div key={idx} className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={() => stepDigit(idx, 1)}
              className="w-12 h-9 rounded-lg border border-white/15 bg-slate-800 hover:bg-slate-700 text-white font-black cursor-pointer"
            >
              ▲
            </button>
            <div className="w-12 h-14 rounded-xl border-2 border-amber-400/60 bg-[#0b1525] flex items-center justify-center font-num text-2xl font-black text-amber-200 tabular-nums">
              {d}
            </div>
            <button
              type="button"
              onClick={() => stepDigit(idx, -1)}
              className="w-12 h-9 rounded-lg border border-white/15 bg-slate-800 hover:bg-slate-700 text-white font-black cursor-pointer"
            >
              ▼
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        className="w-full h-11 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm cursor-pointer"
      >
        {lang === 'ar' ? 'جرّب الشفرة' : 'Try Combination'}
      </button>

      <div className="text-[11px] text-slate-400 text-center">
        {lang === 'ar'
          ? '🟢 رقم صحيح في مكانه الصحيح · 🟡 رقم صحيح لكن في مكان خاطئ'
          : '🟢 Right digit & spot · 🟡 Right digit, wrong spot'}
      </div>

      {history.length > 0 && (
        <div className="space-y-1.5 max-h-36 overflow-y-auto">
          {history.map((h, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-[#14253d] px-3 py-1.5 text-xs font-bold tabular-nums"
            >
              <span dir="ltr" className="font-mono text-sm tracking-widest text-white">
                {h.guess}
              </span>
              <span className="text-slate-200">
                🟢 {h.exact} · 🟡 {h.close}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const TargetSumDialSub: React.FC<{
  lang: 'ar' | 'en';
  onWin: () => void;
  onBeep?: (good: boolean) => void;
}> = ({ lang, onWin, onBeep }) => {
  const [target] = useState(() => randInt(14, 28));
  const [dials, setDials] = useState([1, 2, 1, 2]);
  const sum = dials.reduce((a, b) => a + b, 0);

  const change = (idx: number, delta: number) => {
    const next = dials.map((v, i) => (i === idx ? Math.max(1, Math.min(9, v + delta)) : v));
    setDials(next);
    const nextSum = next.reduce((a, b) => a + b, 0);
    if (nextSum === target) {
      onBeep?.(true);
      window.setTimeout(onWin, 280);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl border border-amber-400/35 bg-[#14253d] px-4 py-2.5 text-sm font-black tabular-nums">
        <span className="text-amber-200">
          {lang === 'ar' ? `المجموع المطلوب: ${target}` : `Target Sum: ${target}`}
        </span>
        <span className={sum === target ? 'text-emerald-300' : 'text-sky-300'}>
          {lang === 'ar' ? `الحالي: ${sum}` : `Current: ${sum}`}
        </span>
      </div>
      <div className="flex items-center justify-center gap-2.5" dir="ltr">
        {dials.map((v, idx) => (
          <div key={idx} className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={() => change(idx, 1)}
              className="w-12 h-9 rounded-lg border border-white/15 bg-slate-800 hover:bg-slate-700 text-white font-black cursor-pointer"
            >
              +
            </button>
            <div className="w-12 h-14 rounded-xl border-2 border-sky-400/50 bg-[#0b1525] flex items-center justify-center font-num text-2xl font-black text-white tabular-nums">
              {v}
            </div>
            <button
              type="button"
              onClick={() => change(idx, -1)}
              className="w-12 h-9 rounded-lg border border-white/15 bg-slate-800 hover:bg-slate-700 text-white font-black cursor-pointer"
            >
              −
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const BinaryBitSub: React.FC<{
  lang: 'ar' | 'en';
  onWin: () => void;
  onBeep?: (good: boolean) => void;
}> = ({ lang, onWin, onBeep }) => {
  const weights = [16, 8, 4, 2, 1];
  const [target] = useState(() => randInt(7, 29));
  const [bits, setBits] = useState<boolean[]>([false, false, false, false, false]);
  const current = bits.reduce((acc, on, i) => acc + (on ? weights[i] : 0), 0);

  const toggle = (i: number) => {
    const next = bits.map((b, idx) => (idx === i ? !b : b));
    setBits(next);
    const val = next.reduce((acc, on, idx) => acc + (on ? weights[idx] : 0), 0);
    if (val === target) {
      onBeep?.(true);
      window.setTimeout(onWin, 280);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl border border-amber-400/35 bg-[#14253d] px-4 py-2.5 text-sm font-black tabular-nums">
        <span className="text-amber-200">
          {lang === 'ar' ? `الشفرة المطلوبة: ${target}` : `Target Code: ${target}`}
        </span>
        <span className={current === target ? 'text-emerald-300' : 'text-sky-300'}>
          {lang === 'ar' ? `الناتج: ${current}` : `Total: ${current}`}
        </span>
      </div>
      <div className="grid grid-cols-5 gap-2" dir="ltr">
        {weights.map((w, i) => (
          <button
            key={w}
            type="button"
            onClick={() => toggle(i)}
            className={`h-20 rounded-xl border-2 flex flex-col items-center justify-center gap-1 font-black transition-all cursor-pointer tabular-nums ${
              bits[i]
                ? 'border-emerald-400 bg-emerald-500/25 text-emerald-100'
                : 'border-white/15 bg-[#152944] hover:bg-[#1e395e] text-slate-300'
            }`}
          >
            <span className="text-xs opacity-80">+{w}</span>
            <span className="text-xl">{bits[i] ? '1' : '0'}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const ColorMastermindSub: React.FC<{
  lang: 'ar' | 'en';
  onWin: () => void;
  onBeep?: (good: boolean) => void;
}> = ({ lang, onWin, onBeep }) => {
  const [secret] = useState<number[]>(() => shuffleArray([0, 1, 2, 3, 4, 5]).slice(0, 4));
  const [guess, setGuess] = useState<number[]>([0, 1, 2, 3]);
  const [history, setHistory] = useState<Array<{ colors: string; exact: number; close: number }>>([]);

  const cycle = (i: number) => {
    setGuess((prev) => prev.map((c, idx) => (idx === i ? (c + 1) % COLOR_OPTIONS.length : c)));
  };

  const check = () => {
    let exact = 0;
    let close = 0;
    for (let i = 0; i < 4; i++) {
      if (guess[i] === secret[i]) exact++;
      else if (secret.includes(guess[i])) close++;
    }
    setHistory((prev) =>
      [{ colors: guess.map((c) => COLOR_OPTIONS[c]).join(' '), exact, close }, ...prev].slice(0, 6)
    );
    if (exact === 4) {
      onBeep?.(true);
      window.setTimeout(onWin, 280);
    } else {
      onBeep?.(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="text-xs text-slate-300 text-center">
        {lang === 'ar'
          ? 'اضغط على كل دائرة لتغيير لونها ثم اضغط فحص'
          : 'Tap each slot to cycle its color, then check'}
      </div>
      <div className="flex items-center justify-center gap-3" dir="ltr">
        {guess.map((c, i) => (
          <button
            key={i}
            type="button"
            onClick={() => cycle(i)}
            className="w-14 h-14 rounded-xl border-2 border-amber-300/60 bg-[#14253d] hover:bg-[#1e395e] text-3xl flex items-center justify-center cursor-pointer"
          >
            {COLOR_OPTIONS[c]}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={check}
        className="w-full h-11 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm cursor-pointer"
      >
        {lang === 'ar' ? 'فحص الألوان' : 'Check Colors'}
      </button>
      {history.length > 0 && (
        <div className="space-y-1.5 max-h-36 overflow-y-auto">
          {history.map((h, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-[#14253d] px-3 py-1.5 text-xs font-bold tabular-nums"
            >
              <span className="text-base tracking-wider">{h.colors}</span>
              <span>
                🟢 {h.exact} · 🟡 {h.close}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// ENGINE 3: LOGIC & LIGHTS GRIDS (Puzzles #11 - #15)
// ============================================================================
function applyLightsFlip(board: boolean[], idx: number, mode: 0 | 1 | 2): boolean[] {
  const next = [...board];
  const r = Math.floor(idx / 3);
  const c = idx % 3;
  const flip = (rr: number, cc: number) => {
    if (rr >= 0 && rr < 3 && cc >= 0 && cc < 3) {
      next[rr * 3 + cc] = !next[rr * 3 + cc];
    }
  };
  if (mode === 0) {
    flip(r, c);
    flip(r - 1, c);
    flip(r + 1, c);
    flip(r, c - 1);
    flip(r, c + 1);
  } else if (mode === 1) {
    flip(r, c);
    flip(r - 1, c - 1);
    flip(r - 1, c + 1);
    flip(r + 1, c - 1);
    flip(r + 1, c + 1);
  } else {
    for (let i = 0; i < 3; i++) {
      flip(r, i);
      if (i !== r) flip(i, c);
    }
  }
  return next;
}

const LightsGridEngine: React.FC<EngineProps> = ({ lang, variant, onWin, onBeep }) => {
  if (variant === 3) {
    return <RowColBalanceSub lang={lang} onWin={onWin} onBeep={onBeep} />;
  }
  if (variant === 4) {
    return <CoupledGearsSub lang={lang} onWin={onWin} onBeep={onBeep} />;
  }

  const mode = variant as 0 | 1 | 2;
  const [board, setBoard] = useState<boolean[]>(() => {
    let b = Array(9).fill(true);
    const clicks = shuffleArray([0, 1, 2, 3, 4, 5, 6, 7, 8]).slice(0, 3);
    for (const c of clicks) b = applyLightsFlip(b, c, mode);
    if (b.every(Boolean)) b = applyLightsFlip(b, 4, mode);
    return b;
  });

  const handleClick = (idx: number) => {
    const next = applyLightsFlip(board, idx, mode);
    setBoard(next);
    if (next.every(Boolean)) {
      onBeep?.(true);
      window.setTimeout(onWin, 280);
    }
  };

  const litCount = board.filter(Boolean).length;

  return (
    <div>
      <div className="text-xs font-bold text-slate-300 text-center mb-3 tabular-nums">
        {lang === 'ar' ? `المصابيح المضيئة: ${litCount} / 9` : `Lit Bulbs: ${litCount} / 9`}
      </div>
      <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto">
        {board.map((on, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleClick(idx)}
            className={`h-20 rounded-xl border-2 text-2xl font-black transition-all cursor-pointer ${
              on
                ? 'border-emerald-400 bg-emerald-500/25 text-amber-200'
                : 'border-white/15 bg-[#111d30] hover:bg-[#1a2c47] text-slate-600'
            }`}
          >
            {on ? '💡' : '○'}
          </button>
        ))}
      </div>
    </div>
  );
};

const RowColBalanceSub: React.FC<{
  lang: 'ar' | 'en';
  onWin: () => void;
  onBeep?: (good: boolean) => void;
}> = ({ lang, onWin, onBeep }) => {
  const [targets] = useState(() => {
    const sol = Array(9).fill(false);
    const chosen = shuffleArray([0, 1, 2, 3, 4, 5, 6, 7, 8]).slice(0, 5);
    for (const i of chosen) sol[i] = true;
    const rowT = [0, 1, 2].map((r) => [0, 1, 2].filter((c) => sol[r * 3 + c]).length);
    const colT = [0, 1, 2].map((c) => [0, 1, 2].filter((r) => sol[r * 3 + c]).length);
    return { rowT, colT };
  });

  const [grid, setGrid] = useState<boolean[]>(() => Array(9).fill(false));

  const toggle = (idx: number) => {
    const next = grid.map((v, i) => (i === idx ? !v : v));
    setGrid(next);
    const rowsOk = [0, 1, 2].every(
      (r) => [0, 1, 2].filter((c) => next[r * 3 + c]).length === targets.rowT[r]
    );
    const colsOk = [0, 1, 2].every(
      (c) => [0, 1, 2].filter((r) => next[r * 3 + c]).length === targets.colT[c]
    );
    if (rowsOk && colsOk) {
      onBeep?.(true);
      window.setTimeout(onWin, 280);
    }
  };

  return (
    <div className="max-w-[280px] mx-auto" dir="ltr">
      <div className="text-xs text-slate-300 text-center mb-2">
        {lang === 'ar'
          ? 'طابق عدد الأضواء في كل صف وعمود مع الأرقام'
          : 'Match each row & column lit count'}
      </div>
      <div className="grid grid-cols-4 gap-2 items-center">
        {[0, 1, 2].map((r) => {
          const curR = [0, 1, 2].filter((c) => grid[r * 3 + c]).length;
          return (
            <React.Fragment key={r}>
              {[0, 1, 2].map((c) => {
                const idx = r * 3 + c;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggle(idx)}
                    className={`h-14 rounded-xl border-2 text-xl cursor-pointer ${
                      grid[idx]
                        ? 'border-amber-300 bg-amber-400/25 text-amber-200'
                        : 'border-white/15 bg-[#152944] hover:bg-[#1e395e]'
                    }`}
                  >
                    {grid[idx] ? '●' : ''}
                  </button>
                );
              })}
              <div
                className={`h-14 rounded-lg flex items-center justify-center font-num font-black text-base tabular-nums ${
                  curR === targets.rowT[r] ? 'text-emerald-300' : 'text-amber-300'
                }`}
              >
                {targets.rowT[r]}
              </div>
            </React.Fragment>
          );
        })}
        {[0, 1, 2].map((c) => {
          const curC = [0, 1, 2].filter((r) => grid[r * 3 + c]).length;
          return (
            <div
              key={c}
              className={`h-9 flex items-center justify-center font-num font-black text-base tabular-nums ${
                curC === targets.colT[c] ? 'text-emerald-300' : 'text-amber-300'
              }`}
            >
              {targets.colT[c]}
            </div>
          );
        })}
        <div />
      </div>
    </div>
  );
};

const CoupledGearsSub: React.FC<{
  lang: 'ar' | 'en';
  onWin: () => void;
  onBeep?: (good: boolean) => void;
}> = ({ lang, onWin, onBeep }) => {
  const arrows = ['⬆️', '➡️', '⬇️', '⬅️'];
  const rotatePair = (arr: number[], idx: number) =>
    arr.map((v, i) => (i === idx || i === (idx + 1) % 4 ? (v + 1) % 4 : v));

  const [gears, setGears] = useState<number[]>(() => {
    let g = [0, 0, 0, 0];
    for (let k = 0; k < 4; k++) {
      g = rotatePair(g, randInt(0, 3));
    }
    if (g.every((v) => v === 0)) g = rotatePair(g, 0);
    return g;
  });

  const handleTurn = (idx: number) => {
    const next = rotatePair(gears, idx);
    setGears(next);
    if (next.every((v) => v === 0)) {
      onBeep?.(true);
      window.setTimeout(onWin, 280);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-xs text-slate-300 text-center">
        {lang === 'ar'
          ? 'اضغط على أي ترس لتدويره مع الترس المجاور — وجّه الكل للأعلى ⬆️'
          : 'Tap any gear to rotate it + its next neighbor — point all UP ⬆️'}
      </div>
      <div className="grid grid-cols-4 gap-2.5" dir="ltr">
        {gears.map((dir, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleTurn(i)}
            className={`h-20 rounded-xl border-2 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
              dir === 0
                ? 'border-emerald-400 bg-emerald-500/20'
                : 'border-amber-400/40 bg-[#152944] hover:bg-[#1e395e]'
            }`}
          >
            <span className="text-2xl">{arrows[dir]}</span>
            <span className="text-[11px] font-bold text-slate-300">G{i + 1}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// ENGINE 4: MATH & SPEED ARITHMETIC (Puzzles #16 - #20)
// ============================================================================
interface MathQuestion {
  prompt: string;
  options: string[];
  answer: string;
}

function generateMathQuestions(variant: 0 | 1 | 3 | 4): MathQuestion[] {
  const qs: MathQuestion[] = [];
  if (variant === 0) {
    for (let i = 0; i < 4; i++) {
      const op = i % 3;
      let a = randInt(4, 15);
      let b = randInt(2, 12);
      let ans = 0;
      let prompt = '';
      if (op === 0) {
        ans = a + b;
        prompt = `${a} + ${b} = ?`;
      } else if (op === 1) {
        if (a < b) [a, b] = [b, a];
        ans = a - b;
        prompt = `${a} − ${b} = ?`;
      } else {
        a = randInt(3, 9);
        b = randInt(2, 9);
        ans = a * b;
        prompt = `${a} × ${b} = ?`;
      }
      const opts = new Set<number>([ans]);
      while (opts.size < 4) {
        const fake = Math.max(0, ans + randInt(-6, 7));
        if (fake !== ans) opts.add(fake);
      }
      qs.push({ prompt, options: shuffleArray(Array.from(opts).map(String)), answer: String(ans) });
    }
  } else if (variant === 1) {
    for (let i = 0; i < 3; i++) {
      const b = randInt(3, 8);
      const c = randInt(3, 7);
      const right = b * c;
      const a = randInt(2, right - 2);
      const ans = right - a;
      const opts = new Set<number>([ans]);
      while (opts.size < 4) {
        const fake = Math.max(1, ans + randInt(-5, 6));
        if (fake !== ans) opts.add(fake);
      }
      qs.push({
        prompt: `? + ${a} = ${b} × ${c}`,
        options: shuffleArray(Array.from(opts).map(String)),
        answer: String(ans),
      });
    }
  } else if (variant === 3) {
    const templates = [
      () => {
        const start = randInt(2, 8);
        const step = randInt(3, 7);
        const seq = [0, 1, 2, 3].map((k) => start + k * step);
        return { seq, ans: start + 4 * step };
      },
      () => {
        const start = randInt(1, 3);
        const seq = [start, start * 2, start * 4, start * 8];
        return { seq, ans: start * 16 };
      },
      () => {
        const a = randInt(1, 4);
        const b = randInt(2, 5);
        const seq = [a, b, a + b, a + 2 * b];
        return { seq, ans: 2 * a + 3 * b };
      },
    ];
    for (const make of templates) {
      const { seq, ans } = make();
      const opts = new Set<number>([ans]);
      while (opts.size < 4) {
        const fake = Math.max(1, ans + randInt(-6, 8));
        if (fake !== ans) opts.add(fake);
      }
      qs.push({
        prompt: `${seq.join(' , ')} , ?`,
        options: shuffleArray(Array.from(opts).map(String)),
        answer: String(ans),
      });
    }
  } else {
    const ops = ['+', '−', '×', '÷'] as const;
    for (let i = 0; i < 4; i++) {
      const op = ops[i];
      let a = 0;
      let b = 0;
      let res = 0;
      if (op === '+') {
        a = randInt(5, 14);
        b = randInt(3, 9);
        res = a + b;
      } else if (op === '−') {
        b = randInt(3, 9);
        res = randInt(3, 12);
        a = b + res;
      } else if (op === '×') {
        a = randInt(3, 8);
        b = randInt(3, 7);
        res = a * b;
      } else {
        b = randInt(2, 6);
        res = randInt(3, 8);
        a = b * res;
      }
      qs.push({
        prompt: `${a} [ ? ] ${b} = ${res}`,
        options: [...ops],
        answer: op,
      });
    }
  }
  return qs;
}

const MathLockEngine: React.FC<EngineProps> = ({ lang, variant, onWin, onBeep }) => {
  if (variant === 2) {
    return <MultiplesHunterSub lang={lang} onWin={onWin} onBeep={onBeep} />;
  }

  const [questions] = useState(() => generateMathQuestions(variant as 0 | 1 | 3 | 4));
  const [step, setStep] = useState(0);
  const [wrongOpt, setWrongOpt] = useState<string | null>(null);
  const q = questions[step];

  const handleAnswer = (opt: string) => {
    if (opt === q.answer) {
      onBeep?.(true);
      setWrongOpt(null);
      if (step + 1 >= questions.length) {
        window.setTimeout(onWin, 260);
      } else {
        setStep((s) => s + 1);
      }
    } else {
      onBeep?.(false);
      setWrongOpt(opt);
      window.setTimeout(() => setWrongOpt(null), 450);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-xs font-bold text-slate-300 text-center tabular-nums">
        {lang === 'ar'
          ? `السؤال ${step + 1} من ${questions.length}`
          : `Question ${step + 1} of ${questions.length}`}
      </div>
      <div
        dir="ltr"
        className="rounded-xl border border-amber-400/45 bg-[#0b1525] py-5 px-4 text-center font-num text-2xl sm:text-3xl font-black text-amber-200 tabular-nums"
      >
        {q.prompt}
      </div>
      <div className="grid grid-cols-2 gap-2.5" dir="ltr">
        {q.options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => handleAnswer(opt)}
            className={`h-14 rounded-xl border-2 font-num text-xl font-black cursor-pointer transition-colors ${
              wrongOpt === opt
                ? 'border-rose-400 bg-rose-500/25 text-rose-100'
                : 'border-sky-400/35 bg-[#152944] hover:bg-[#1e395e] hover:border-amber-300 text-white'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};

const MultiplesHunterSub: React.FC<{
  lang: 'ar' | 'en';
  onWin: () => void;
  onBeep?: (good: boolean) => void;
}> = ({ lang, onWin, onBeep }) => {
  const [setup] = useState(() => {
    const divisor = [3, 4, 5, 6, 7][randInt(0, 4)];
    const multiples = shuffleArray([2, 3, 4, 5, 6, 7, 8, 9].map((k) => k * divisor)).slice(0, 5);
    const nonMultiples: number[] = [];
    while (nonMultiples.length < 7) {
      const n = randInt(5, 65);
      if (n % divisor !== 0 && !nonMultiples.includes(n)) nonMultiples.push(n);
    }
    return { divisor, numbers: shuffleArray([...multiples, ...nonMultiples]), totalTarget: 5 };
  });

  const [found, setFound] = useState<number[]>([]);
  const [wrong, setWrong] = useState<number | null>(null);

  const handleTap = (n: number) => {
    if (found.includes(n)) return;
    if (n % setup.divisor === 0) {
      onBeep?.(true);
      const next = [...found, n];
      setFound(next);
      if (next.length === setup.totalTarget) {
        window.setTimeout(onWin, 280);
      }
    } else {
      onBeep?.(false);
      setWrong(n);
      window.setTimeout(() => setWrong(null), 450);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-bold text-amber-200 bg-[#14253d] rounded-xl px-3.5 py-2 tabular-nums">
        <span>
          {lang === 'ar'
            ? `اختر مضاعفات الرقم ${setup.divisor}`
            : `Tap all multiples of ${setup.divisor}`}
        </span>
        <span>
          {found.length} / {setup.totalTarget}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2" dir="ltr">
        {setup.numbers.map((n) => {
          const isOk = found.includes(n);
          const isBad = wrong === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => handleTap(n)}
              className={`h-14 rounded-xl border-2 font-num text-lg font-black cursor-pointer tabular-nums ${
                isOk
                  ? 'border-emerald-400 bg-emerald-500/25 text-emerald-100'
                  : isBad
                  ? 'border-rose-400 bg-rose-500/25 text-rose-100'
                  : 'border-white/15 bg-[#152944] hover:bg-[#1e395e] text-white'
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// ENGINE 5: SEQUENCES & SIMON SAYS (Puzzles #21 - #25)
// ============================================================================
const SequenceEngine: React.FC<EngineProps> = ({ lang, variant, onWin, onBeep }) => {
  if (variant === 2) {
    return <StarlightOrderSub lang={lang} onWin={onWin} onBeep={onBeep} />;
  }

  const isSixKeys = variant === 4;
  const isReverse = variant === 3;
  const padCount = isSixKeys ? 6 : 4;
  const seqLen = variant === 1 ? 5 : 4;

  const pads = isSixKeys
    ? [
        { label: '🔑', bg: 'bg-amber-500/35 border-amber-300' },
        { label: '🌙', bg: 'bg-indigo-500/35 border-indigo-300' },
        { label: '🍬', bg: 'bg-pink-500/35 border-pink-300' },
        { label: '⭐', bg: 'bg-yellow-500/35 border-yellow-300' },
        { label: '💎', bg: 'bg-cyan-500/35 border-cyan-300' },
        { label: '🍀', bg: 'bg-emerald-500/35 border-emerald-300' },
      ]
    : [
        { label: variant === 1 ? '🎵' : '🔴', bg: 'bg-rose-500/40 border-rose-300' },
        { label: variant === 1 ? '🎶' : '🔵', bg: 'bg-sky-500/40 border-sky-300' },
        { label: variant === 1 ? '🎹' : '🟢', bg: 'bg-emerald-500/40 border-emerald-300' },
        { label: variant === 1 ? '🔔' : '🟡', bg: 'bg-amber-400/40 border-amber-300' },
      ];

  const [sequence] = useState<number[]>(() =>
    Array.from({ length: seqLen }, () => randInt(0, padCount - 1))
  );
  const [litPad, setLitPad] = useState<number | null>(null);
  const [playingDemo, setPlayingDemo] = useState(true);
  const [inputIdx, setInputIdx] = useState(0);
  const [errorFlash, setErrorFlash] = useState(false);

  const playDemo = useCallback(() => {
    setPlayingDemo(true);
    setInputIdx(0);
    const timers: number[] = [];
    sequence.forEach((pad, idx) => {
      timers.push(
        window.setTimeout(() => {
          setLitPad(pad);
        }, 350 + idx * 620)
      );
      timers.push(
        window.setTimeout(() => {
          setLitPad(null);
        }, 760 + idx * 620)
      );
    });
    timers.push(
      window.setTimeout(() => {
        setPlayingDemo(false);
      }, 420 + sequence.length * 620)
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [sequence]);

  useEffect(() => {
    return playDemo();
  }, [playDemo]);

  const expectedSeq = useMemo(
    () => (isReverse ? [...sequence].reverse() : sequence),
    [isReverse, sequence]
  );

  const handlePad = (idx: number) => {
    if (playingDemo) return;
    setLitPad(idx);
    window.setTimeout(() => setLitPad(null), 180);

    if (idx === expectedSeq[inputIdx]) {
      onBeep?.(true);
      const next = inputIdx + 1;
      setInputIdx(next);
      if (next >= expectedSeq.length) {
        window.setTimeout(onWin, 280);
      }
    } else {
      onBeep?.(false);
      setErrorFlash(true);
      window.setTimeout(() => {
        setErrorFlash(false);
        playDemo();
      }, 550);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-bold text-slate-300 tabular-nums">
        <span>
          {playingDemo
            ? lang === 'ar'
              ? '👀 راقب التسلسل جيداً...'
              : '👀 Watch carefully...'
            : errorFlash
            ? lang === 'ar'
              ? '❌ خطأ! أعد المحاولة'
              : '❌ Oops! Replaying...'
            : isReverse
            ? lang === 'ar'
              ? `أدخله بالعكس (${inputIdx}/${seqLen})`
              : `Tap in REVERSE (${inputIdx}/${seqLen})`
            : lang === 'ar'
            ? `أعد التسلسل (${inputIdx}/${seqLen})`
            : `Repeat (${inputIdx}/${seqLen})`}
        </span>
        <button
          type="button"
          disabled={playingDemo}
          onClick={playDemo}
          className="px-2.5 py-1 rounded-lg border border-white/15 bg-slate-800 hover:bg-slate-700 text-amber-200 cursor-pointer disabled:opacity-40"
        >
          {lang === 'ar' ? 'إعادة العرض' : 'Replay'}
        </button>
      </div>
      <div
        className={`grid ${isSixKeys ? 'grid-cols-3' : 'grid-cols-2'} gap-2.5 max-w-[280px] mx-auto`}
      >
        {pads.map((p, idx) => (
          <button
            key={idx}
            type="button"
            disabled={playingDemo}
            onClick={() => handlePad(idx)}
            className={`h-20 rounded-xl border-2 text-3xl flex items-center justify-center transition-all cursor-pointer ${
              litPad === idx
                ? `${p.bg} scale-95`
                : 'border-white/15 bg-[#152944] hover:bg-[#1e395e]'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const StarlightOrderSub: React.FC<{
  lang: 'ar' | 'en';
  onWin: () => void;
  onBeep?: (good: boolean) => void;
}> = ({ lang, onWin, onBeep }) => {
  const [stars] = useState<number[]>(() =>
    shuffleArray(Array.from({ length: 16 }, (_, i) => i)).slice(0, 5)
  );
  const [showing, setShowing] = useState(true);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = window.setTimeout(() => setShowing(false), 2400);
    return () => window.clearTimeout(t);
  }, []);

  const handleTap = (cellIdx: number) => {
    if (showing) return;
    if (cellIdx === stars[step]) {
      onBeep?.(true);
      const next = step + 1;
      setStep(next);
      if (next === stars.length) {
        window.setTimeout(onWin, 280);
      }
    } else {
      onBeep?.(false);
      setStep(0);
      setShowing(true);
      window.setTimeout(() => setShowing(false), 1800);
    }
  };

  return (
    <div className="space-y-3">
      <div className="text-xs font-bold text-amber-200 text-center tabular-nums">
        {showing
          ? lang === 'ar'
            ? '⭐ احفظ ترتيب النجوم من 1 إلى 5...'
            : '⭐ Memorize stars 1 → 5...'
          : lang === 'ar'
          ? `اضغط النجمة رقم ${step + 1}`
          : `Tap star #${step + 1}`}
      </div>
      <div className="grid grid-cols-4 gap-2 max-w-[260px] mx-auto" dir="ltr">
        {Array.from({ length: 16 }, (_, idx) => {
          const orderIdx = stars.indexOf(idx);
          const isStar = orderIdx !== -1;
          const revealed = isStar && (showing || orderIdx < step);
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleTap(idx)}
              className={`h-14 rounded-xl border-2 font-num text-lg font-black flex items-center justify-center cursor-pointer ${
                isStar && orderIdx < step
                  ? 'border-emerald-400 bg-emerald-500/25 text-emerald-100'
                  : revealed
                  ? 'border-amber-300 bg-amber-400/25 text-amber-100'
                  : isStar
                  ? 'border-sky-400/45 bg-[#183152] hover:bg-[#22436e] text-amber-300'
                  : 'border-white/10 bg-[#101c2e] text-slate-700'
              }`}
            >
              {revealed ? orderIdx + 1 : isStar ? '⭐' : ''}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// ENGINE 6: ORDERING & SORTING (Puzzles #26 - #30)
// ============================================================================
const OrderingEngine: React.FC<EngineProps> = ({ lang, variant, onWin, onBeep }) => {
  if (variant === 0) {
    return <Sliding8PuzzleSub lang={lang} onWin={onWin} onBeep={onBeep} />;
  }
  if (variant === 3 || variant === 4) {
    return <PairSwapSortSub lang={lang} isKeys={variant === 4} onWin={onWin} onBeep={onBeep} />;
  }

  // Variant 1 = Ascending 1..9, Variant 2 = Descending 9 random numbers
  const isDesc = variant === 2;
  const [board] = useState<number[]>(() => {
    if (!isDesc) return shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const nums = new Set<number>();
    while (nums.size < 9) nums.add(randInt(11, 98));
    return shuffleArray(Array.from(nums));
  });
  const sorted = useMemo(
    () => [...board].sort((a, b) => (isDesc ? b - a : a - b)),
    [board, isDesc]
  );
  const [step, setStep] = useState(0);
  const [bad, setBad] = useState<number | null>(null);

  const handleTap = (n: number) => {
    if (n === sorted[step]) {
      onBeep?.(true);
      const next = step + 1;
      setStep(next);
      if (next >= sorted.length) {
        window.setTimeout(onWin, 260);
      }
    } else {
      onBeep?.(false);
      setBad(n);
      window.setTimeout(() => setBad(null), 400);
    }
  };

  return (
    <div className="space-y-3">
      <div className="text-xs font-bold text-amber-200 text-center tabular-nums">
        {isDesc
          ? lang === 'ar'
            ? `اضغط من الأكبر إلى الأصغر (${step}/9)`
            : `Tap largest → smallest (${step}/9)`
          : lang === 'ar'
          ? `اضغط بالترتيب 1 → 9 (التالي: ${sorted[step] ?? '✓'})`
          : `Tap 1 → 9 in order (Next: ${sorted[step] ?? '✓'})`}
      </div>
      <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto" dir="ltr">
        {board.map((n) => {
          const done = sorted.indexOf(n) < step;
          return (
            <button
              key={n}
              type="button"
              disabled={done}
              onClick={() => handleTap(n)}
              className={`h-16 rounded-xl border-2 font-num text-xl font-black cursor-pointer tabular-nums ${
                done
                  ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300 opacity-55'
                  : bad === n
                  ? 'border-rose-400 bg-rose-500/25 text-white'
                  : 'border-sky-400/35 bg-[#152944] hover:bg-[#1e395e] text-white'
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const Sliding8PuzzleSub: React.FC<{
  lang: 'ar' | 'en';
  onWin: () => void;
  onBeep?: (good: boolean) => void;
}> = ({ lang, onWin, onBeep }) => {
  const [tiles, setTiles] = useState<number[]>(() => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 0];
    let blank = 8;
    let prevBlank = -1;
    for (let step = 0; step < 14; step++) {
      const r = Math.floor(blank / 3);
      const c = blank % 3;
      const neighbors: number[] = [];
      if (r > 0) neighbors.push((r - 1) * 3 + c);
      if (r < 2) neighbors.push((r + 1) * 3 + c);
      if (c > 0) neighbors.push(r * 3 + c - 1);
      if (c < 2) neighbors.push(r * 3 + c + 1);
      const choices = neighbors.filter((n) => n !== prevBlank);
      const pick = choices[randInt(0, choices.length - 1)];
      arr[blank] = arr[pick];
      arr[pick] = 0;
      prevBlank = blank;
      blank = pick;
    }
    return arr;
  });

  const handleSlide = (idx: number) => {
    const blank = tiles.indexOf(0);
    const r1 = Math.floor(idx / 3);
    const c1 = idx % 3;
    const r2 = Math.floor(blank / 3);
    const c2 = blank % 3;
    if (Math.abs(r1 - r2) + Math.abs(c1 - c2) !== 1) return;

    const next = [...tiles];
    next[blank] = next[idx];
    next[idx] = 0;
    setTiles(next);
    const solved = next.every((v, i) => (i === 8 ? v === 0 : v === i + 1));
    if (solved) {
      onBeep?.(true);
      window.setTimeout(onWin, 280);
    }
  };

  return (
    <div className="space-y-3">
      <div className="text-xs font-bold text-slate-300 text-center">
        {lang === 'ar' ? 'رتّب المربعات من 1 إلى 8 بالانزلاق' : 'Slide tiles into 1 → 8 order'}
      </div>
      <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto" dir="ltr">
        {tiles.map((v, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSlide(idx)}
            disabled={v === 0}
            className={`h-16 rounded-xl border-2 font-num text-2xl font-black transition-all ${
              v === 0
                ? 'border-dashed border-white/15 bg-[#091220]'
                : v === idx + 1
                ? 'border-emerald-400/70 bg-emerald-500/20 text-emerald-100 cursor-pointer'
                : 'border-amber-300/40 bg-[#152944] hover:bg-[#1e395e] text-white cursor-pointer'
            }`}
          >
            {v === 0 ? '' : v}
          </button>
        ))}
      </div>
    </div>
  );
};

const PairSwapSortSub: React.FC<{
  lang: 'ar' | 'en';
  isKeys: boolean;
  onWin: () => void;
  onBeep?: (good: boolean) => void;
}> = ({ lang, isKeys, onWin, onBeep }) => {
  const goal = useMemo(
    () =>
      isKeys
        ? [
            { id: 0, label: 'XS 🔑', sub: '1' },
            { id: 1, label: 'S 🔑', sub: '2' },
            { id: 2, label: 'M 🔑', sub: '3' },
            { id: 3, label: 'L 🔑', sub: '4' },
            { id: 4, label: 'XL 🔑', sub: '5' },
          ]
        : [
            { id: 0, label: '🔴', sub: '1' },
            { id: 1, label: '🟠', sub: '2' },
            { id: 2, label: '🟡', sub: '3' },
            { id: 3, label: '🟢', sub: '4' },
            { id: 4, label: '🔵', sub: '5' },
            { id: 5, label: '🟣', sub: '6' },
          ],
    [isKeys]
  );

  const [items, setItems] = useState(() => {
    let sh = shuffleArray(goal);
    if (sh.every((item, i) => item.id === i)) {
      sh = [sh[1], sh[0], ...sh.slice(2)];
    }
    return sh;
  });
  const [selected, setSelected] = useState<number | null>(null);

  const handleClick = (idx: number) => {
    if (selected === null) {
      setSelected(idx);
      return;
    }
    if (selected === idx) {
      setSelected(null);
      return;
    }
    const next = [...items];
    const tmp = next[selected];
    next[selected] = next[idx];
    next[idx] = tmp;
    setItems(next);
    setSelected(null);

    if (next.every((item, i) => item.id === i)) {
      onBeep?.(true);
      window.setTimeout(onWin, 280);
    }
  };

  return (
    <div className="space-y-3">
      <div className="text-xs text-slate-300 text-center">
        {isKeys
          ? lang === 'ar'
            ? 'اضغط بطاقتين لتبديلهما: XS → S → M → L → XL'
            : 'Tap two keys to swap: XS → S → M → L → XL'
          : lang === 'ar'
          ? 'اضغط لونين لتبديلهما بترتيب الطيف: 🔴 🟠 🟡 🟢 🔵 🟣'
          : 'Tap two tiles to swap into rainbow order: 🔴 🟠 🟡 🟢 🔵 🟣'}
      </div>
      <div className={`grid ${isKeys ? 'grid-cols-5' : 'grid-cols-6'} gap-2`} dir="ltr">
        {items.map((item, idx) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleClick(idx)}
            className={`h-20 rounded-xl border-2 font-black flex flex-col items-center justify-center cursor-pointer transition-all ${
              selected === idx
                ? 'border-cyan-300 bg-cyan-400/25 scale-105 text-white'
                : item.id === idx
                ? 'border-emerald-400/70 bg-emerald-500/20 text-white'
                : 'border-white/15 bg-[#152944] hover:bg-[#1e395e] text-white'
            }`}
          >
            <span className={isKeys ? 'text-xs sm:text-sm' : 'text-2xl'}>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// ENGINE 7: VISUAL PERCEPTION & SPOTTERS (Puzzles #31 - #35)
// ============================================================================
const PerceptionEngine: React.FC<EngineProps> = ({ lang, variant, onWin, onBeep }) => {
  if (variant === 0) return <OddOneOutSub lang={lang} onWin={onWin} onBeep={onBeep} />;
  if (variant === 1) return <CountGumSub lang={lang} onWin={onWin} onBeep={onBeep} />;
  if (variant === 2) return <StroopColorSub lang={lang} onWin={onWin} onBeep={onBeep} />;
  if (variant === 3) return <GreaterExprSub lang={lang} onWin={onWin} onBeep={onBeep} />;
  return <OppositeArrowSub lang={lang} onWin={onWin} onBeep={onBeep} />;
};

const OddOneOutSub: React.FC<{
  lang: 'ar' | 'en';
  onWin: () => void;
  onBeep?: (good: boolean) => void;
}> = ({ lang, onWin, onBeep }) => {
  const pairs: Array<[string, string]> = [
    ['😀', '😃'],
    ['🔒', '🔓'],
    ['🍬', '🍭'],
    ['🌙', '🌛'],
    ['🍎', '🍅'],
    ['⭐', '🌟'],
  ];
  const makeRound = () => {
    const [base, odd] = pairs[randInt(0, pairs.length - 1)];
    const oddIdx = randInt(0, 15);
    return { base, odd, oddIdx };
  };
  const [round, setRound] = useState(1);
  const [data, setData] = useState(() => makeRound());

  const handleTap = (idx: number) => {
    if (idx === data.oddIdx) {
      onBeep?.(true);
      if (round >= 3) window.setTimeout(onWin, 250);
      else {
        setRound((r) => r + 1);
        setData(makeRound());
      }
    } else {
      onBeep?.(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="text-xs font-bold text-amber-200 text-center tabular-nums">
        {lang === 'ar' ? `اكتشف الرمز المختلف · جولة ${round}/3` : `Find the odd icon · Round ${round}/3`}
      </div>
      <div className="grid grid-cols-4 gap-2 max-w-[260px] mx-auto">
        {Array.from({ length: 16 }, (_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleTap(idx)}
            className="h-14 rounded-xl border border-white/15 bg-[#152944] hover:bg-[#1e395e] text-2xl flex items-center justify-center cursor-pointer"
          >
            {idx === data.oddIdx ? data.odd : data.base}
          </button>
        ))}
      </div>
    </div>
  );
};

const CountGumSub: React.FC<{
  lang: 'ar' | 'en';
  onWin: () => void;
  onBeep?: (good: boolean) => void;
}> = ({ lang, onWin, onBeep }) => {
  const pool = ['🍬', '🍓', '🍉', '🍋'];
  const makeRound = () => {
    const target = pool[randInt(0, pool.length - 1)];
    const count = randInt(3, 8);
    const others = pool.filter((p) => p !== target);
    const cells = Array.from({ length: 16 }, (_, i) =>
      i < count ? target : others[randInt(0, others.length - 1)]
    );
    const opts = new Set<number>([count]);
    while (opts.size < 4) opts.add(randInt(2, 10));
    return { target, count, cells: shuffleArray(cells), options: shuffleArray(Array.from(opts)) };
  };
  const [round, setRound] = useState(1);
  const [data, setData] = useState(() => makeRound());

  const pick = (n: number) => {
    if (n === data.count) {
      onBeep?.(true);
      if (round >= 3) window.setTimeout(onWin, 250);
      else {
        setRound((r) => r + 1);
        setData(makeRound());
      }
    } else {
      onBeep?.(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="text-xs font-bold text-amber-200 text-center tabular-nums">
        {lang === 'ar'
          ? `كم عدد ${data.target} في الصينية؟ · جولة ${round}/3`
          : `How many ${data.target} in the tray? · Round ${round}/3`}
      </div>
      <div className="grid grid-cols-4 gap-1.5 max-w-[230px] mx-auto rounded-xl border border-white/10 bg-[#0b1525] p-2.5 text-center text-2xl">
        {data.cells.map((icon, i) => (
          <div key={i} className="h-10 flex items-center justify-center">
            {icon}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2" dir="ltr">
        {data.options.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => pick(n)}
            className="h-12 rounded-xl border-2 border-sky-400/35 bg-[#152944] hover:bg-[#1e395e] font-num text-lg font-black text-white cursor-pointer tabular-nums"
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
};

const STROOP_COLORS = [
  { id: 'red', ar: 'أحمر', en: 'RED', cls: 'text-rose-400', btn: 'bg-rose-500 hover:bg-rose-400' },
  { id: 'blue', ar: 'أزرق', en: 'BLUE', cls: 'text-sky-400', btn: 'bg-sky-500 hover:bg-sky-400' },
  { id: 'green', ar: 'أخضر', en: 'GREEN', cls: 'text-emerald-400', btn: 'bg-emerald-500 hover:bg-emerald-400' },
  { id: 'yellow', ar: 'أصفر', en: 'YELLOW', cls: 'text-amber-300', btn: 'bg-amber-400 hover:bg-amber-300 text-slate-950' },
] as const;

const StroopColorSub: React.FC<{
  lang: 'ar' | 'en';
  onWin: () => void;
  onBeep?: (good: boolean) => void;
}> = ({ lang, onWin, onBeep }) => {
  const makeQ = () => {
    const wordIdx = randInt(0, 3);
    let inkIdx = randInt(0, 3);
    if (inkIdx === wordIdx) inkIdx = (inkIdx + 1) % 4;
    return { wordIdx, inkIdx };
  };
  const [round, setRound] = useState(1);
  const [q, setQ] = useState(() => makeQ());

  const pick = (idx: number) => {
    if (idx === q.inkIdx) {
      onBeep?.(true);
      if (round >= 4) window.setTimeout(onWin, 250);
      else {
        setRound((r) => r + 1);
        setQ(makeQ());
      }
    } else {
      onBeep?.(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-xs font-bold text-slate-300 text-center tabular-nums">
        {lang === 'ar'
          ? `اختر لون الخط (وليس الكلمة!) · جولة ${round}/4`
          : `Tap the INK COLOR (not the word!) · Round ${round}/4`}
      </div>
      <div className="rounded-xl border border-white/15 bg-[#0b1525] py-6 text-center">
        <span className={`text-4xl font-black ${STROOP_COLORS[q.inkIdx].cls}`}>
          {lang === 'ar' ? STROOP_COLORS[q.wordIdx].ar : STROOP_COLORS[q.wordIdx].en}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {STROOP_COLORS.map((c, idx) => (
          <button
            key={c.id}
            type="button"
            onClick={() => pick(idx)}
            className={`h-12 rounded-xl font-black text-sm text-white cursor-pointer ${c.btn}`}
          >
            {lang === 'ar' ? c.ar : c.en}
          </button>
        ))}
      </div>
    </div>
  );
};

const GreaterExprSub: React.FC<{
  lang: 'ar' | 'en';
  onWin: () => void;
  onBeep?: (good: boolean) => void;
}> = ({ lang, onWin, onBeep }) => {
  const makePair = () => {
    const a1 = randInt(3, 9);
    const a2 = randInt(3, 8);
    const v1 = a1 * a2;
    const b1 = randInt(10, 28);
    let b2 = randInt(6, 25);
    if (b1 + b2 === v1) b2 += 3;
    const v2 = b1 + b2;
    const left = { label: `${a1} × ${a2}`, val: v1 };
    const right = { label: `${b1} + ${b2}`, val: v2 };
    return Math.random() < 0.5 ? [left, right] : [right, left];
  };
  const [round, setRound] = useState(1);
  const [pair, setPair] = useState(() => makePair());

  const pick = (side: 0 | 1) => {
    const other = side === 0 ? 1 : 0;
    if (pair[side].val > pair[other].val) {
      onBeep?.(true);
      if (round >= 4) window.setTimeout(onWin, 250);
      else {
        setRound((r) => r + 1);
        setPair(makePair());
      }
    } else {
      onBeep?.(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-xs font-bold text-amber-200 text-center tabular-nums">
        {lang === 'ar' ? `اختر القيمة الأكبر · جولة ${round}/4` : `Tap the LARGER value · Round ${round}/4`}
      </div>
      <div className="grid grid-cols-2 gap-3" dir="ltr">
        {([0, 1] as const).map((side) => (
          <button
            key={side}
            type="button"
            onClick={() => pick(side)}
            className="h-24 rounded-xl border-2 border-sky-400/45 bg-[#152944] hover:bg-[#1e395e] hover:border-amber-300 font-num text-2xl font-black text-white cursor-pointer tabular-nums"
          >
            {pair[side].label}
          </button>
        ))}
      </div>
    </div>
  );
};

const OppositeArrowSub: React.FC<{
  lang: 'ar' | 'en';
  onWin: () => void;
  onBeep?: (good: boolean) => void;
}> = ({ lang, onWin, onBeep }) => {
  const dirs = ['⬆️', '⬇️', '⬅️', '➡️'] as const;
  const opp = [1, 0, 3, 2];
  const [round, setRound] = useState(1);
  const [cur, setCur] = useState(() => randInt(0, 3));

  const pick = (idx: number) => {
    if (idx === opp[cur]) {
      onBeep?.(true);
      if (round >= 5) window.setTimeout(onWin, 250);
      else {
        setRound((r) => r + 1);
        setCur(randInt(0, 3));
      }
    } else {
      onBeep?.(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-xs font-bold text-amber-200 text-center tabular-nums">
        {lang === 'ar' ? `اضغط السهم المعاكس · جولة ${round}/5` : `Tap the OPPOSITE arrow · Round ${round}/5`}
      </div>
      <div className="rounded-xl border border-amber-400/40 bg-[#0b1525] py-5 text-center text-5xl">
        {dirs[cur]}
      </div>
      <div className="grid grid-cols-4 gap-2" dir="ltr">
        {dirs.map((d, idx) => (
          <button
            key={d}
            type="button"
            onClick={() => pick(idx)}
            className="h-14 rounded-xl border-2 border-sky-400/35 bg-[#152944] hover:bg-[#1e395e] text-2xl flex items-center justify-center cursor-pointer"
          >
            {d}
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// ENGINE 8: PATHS, PIPES & MAZES (Puzzles #36 - #40)
// ============================================================================
const PathMazeEngine: React.FC<EngineProps> = ({ lang, variant, onWin, onBeep }) => {
  if (variant === 0) return <PipeCircuitSub lang={lang} onWin={onWin} onBeep={onBeep} />;
  if (variant === 1) return <KeyMaze5x5Sub lang={lang} onWin={onWin} onBeep={onBeep} />;
  if (variant === 2) return <ChessKnightSub lang={lang} onWin={onWin} onBeep={onBeep} />;
  if (variant === 3) return <MirrorSymmetrySub lang={lang} onWin={onWin} onBeep={onBeep} />;
  return <OneStrokeTrailSub lang={lang} onWin={onWin} onBeep={onBeep} />;
};

// Pipe bits: N=1, E=2, S=4, W=8
function rotateMask(mask: number, times: number): number {
  let m = mask;
  for (let i = 0; i < times; i++) {
    let next = 0;
    if (m & 1) next |= 2;
    if (m & 2) next |= 4;
    if (m & 4) next |= 8;
    if (m & 8) next |= 1;
    m = next;
  }
  return m;
}

function pipeGlyph(mask: number): string {
  switch (mask) {
    case 5:
      return '┃';
    case 10:
      return '━';
    case 3:
      return '┗';
    case 6:
      return '┏';
    case 12:
      return '┓';
    case 9:
      return '┛';
    default:
      return '╋';
  }
}

const PipeCircuitSub: React.FC<{
  lang: 'ar' | 'en';
  onWin: () => void;
  onBeep?: (good: boolean) => void;
}> = ({ lang, onWin, onBeep }) => {
  // Solved path: (0,0)E -> (0,1)E -> (0,2)S -> (1,2)W -> (1,1)S -> (2,1)E -> (2,2)
  const solvedMasks = [2 | 4, 10, 12, 6, 3, 9, 10, 3, 8 | 1];
  // Use clean 2-connection bends/straights along a simple guaranteed path:
  // (0,0)[E+S? no: start only needs E=2 + W=8 => straight 10], (0,1)[W+S=12], (1,1)[N+E=3], (1,2)[W+S=12], (2,2)[N+E=3]
  const baseSolved = [
    10, 12, 6,
    6, 3, 12,
    3, 10, 9,
  ];
  // Check connectivity from (0,0) to (2,2):
  // (0,0)=10(E,W) -> E to (0,1)=12(S,W) -> S to (1,1)=3(N,E) -> E to (1,2)=12(S,W) -> S to (2,2)=9(N,W) ✓!
  void solvedMasks;

  const [masks, setMasks] = useState<number[]>(() =>
    baseSolved.map((m, idx) => rotateMask(m, (idx % 3) + 1))
  );

  const isConnected = (arr: number[]): Set<number> => {
    const visited = new Set<number>([0]);
    const queue = [0];
    while (queue.length > 0) {
      const u = queue.shift()!;
      const r = Math.floor(u / 3);
      const c = u % 3;
      const m = arr[u];
      const checks: Array<[number, number, number, number]> = [
        [r - 1, c, 1, 4],
        [r, c + 1, 2, 8],
        [r + 1, c, 4, 1],
        [r, c - 1, 8, 2],
      ];
      for (const [nr, nc, outBit, inBit] of checks) {
        if (nr < 0 || nr > 2 || nc < 0 || nc > 2) continue;
        const v = nr * 3 + nc;
        if (!visited.has(v) && (m & outBit) && (arr[v] & inBit)) {
          visited.add(v);
          queue.push(v);
        }
      }
    }
    return visited;
  };

  const powered = isConnected(masks);

  const rotateTile = (idx: number) => {
    const next = masks.map((m, i) => (i === idx ? rotateMask(m, 1) : m));
    setMasks(next);
    const p = isConnected(next);
    if (p.has(8)) {
      onBeep?.(true);
      window.setTimeout(onWin, 300);
    }
  };

  return (
    <div className="space-y-3">
      <div className="text-xs text-slate-300 text-center">
        {lang === 'ar'
          ? 'اضغط لتدوير الأنابيب وتوصيل ⚡ (أعلى اليسار) بـ 🔓 (أسفل اليمين)'
          : 'Tap pipes to rotate and connect ⚡ (top-left) to 🔓 (bottom-right)'}
      </div>
      <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto" dir="ltr">
        {masks.map((m, idx) => {
          const isLit = powered.has(idx);
          return (
            <button
              key={idx}
              type="button"
              onClick={() => rotateTile(idx)}
              className={`h-20 rounded-xl border-2 relative flex items-center justify-center text-4xl font-black cursor-pointer transition-colors ${
                isLit
                  ? 'border-amber-300 bg-amber-400/20 text-amber-200'
                  : 'border-white/15 bg-[#152944] hover:bg-[#1e395e] text-sky-300'
              }`}
            >
              <span>{pipeGlyph(m)}</span>
              {idx === 0 && <span className="absolute top-1 left-1.5 text-xs">⚡</span>}
              {idx === 8 && <span className="absolute bottom-1 right-1.5 text-xs">🔓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const MAZES_5X5 = [
  [
    [0, 1, 0, 0, 0],
    [0, 1, 0, 1, 0],
    [0, 0, 0, 1, 0],
    [1, 1, 0, 1, 0],
    [0, 0, 0, 0, 0],
  ],
  [
    [0, 0, 0, 1, 0],
    [1, 1, 0, 1, 0],
    [0, 0, 0, 0, 0],
    [0, 1, 1, 1, 0],
    [0, 0, 0, 0, 0],
  ],
];

const KeyMaze5x5Sub: React.FC<{
  lang: 'ar' | 'en';
  onWin: () => void;
  onBeep?: (good: boolean) => void;
}> = ({ lang, onWin, onBeep }) => {
  const [maze] = useState(() => MAZES_5X5[randInt(0, MAZES_5X5.length - 1)]);
  const [pos, setPos] = useState({ r: 0, c: 0 });

  const move = (dr: number, dc: number) => {
    const nr = pos.r + dr;
    const nc = pos.c + dc;
    if (nr < 0 || nr > 4 || nc < 0 || nc > 4 || maze[nr][nc] === 1) return;
    setPos({ r: nr, c: nc });
    if (nr === 4 && nc === 4) {
      onBeep?.(true);
      window.setTimeout(onWin, 260);
    }
  };

  return (
    <div className="space-y-3" dir="ltr">
      <div className="grid grid-cols-5 gap-1.5 max-w-[240px] mx-auto">
        {maze.map((row, r) =>
          row.map((wall, c) => {
            const isPlayer = pos.r === r && pos.c === c;
            const isGoal = r === 4 && c === 4;
            const adj = Math.abs(pos.r - r) + Math.abs(pos.c - c) === 1 && !wall;
            return (
              <button
                key={`${r}-${c}`}
                type="button"
                onClick={() => adj && move(r - pos.r, c - pos.c)}
                className={`h-11 rounded-lg border text-lg flex items-center justify-center ${
                  wall
                    ? 'border-slate-700 bg-slate-800'
                    : isPlayer
                    ? 'border-amber-300 bg-amber-400/30'
                    : isGoal
                    ? 'border-emerald-400 bg-emerald-500/25 cursor-pointer'
                    : adj
                    ? 'border-sky-400/50 bg-[#1a3354] hover:bg-[#244570] cursor-pointer'
                    : 'border-white/10 bg-[#101c2e]'
                }`}
              >
                {isPlayer ? '🔑' : isGoal ? '🚪' : ''}
              </button>
            );
          })
        )}
      </div>
      <div className="flex items-center justify-center gap-2">
        <button type="button" onClick={() => move(0, -1)} className="w-11 h-11 rounded-lg bg-slate-800 hover:bg-slate-700 text-lg cursor-pointer">⬅️</button>
        <button type="button" onClick={() => move(-1, 0)} className="w-11 h-11 rounded-lg bg-slate-800 hover:bg-slate-700 text-lg cursor-pointer">⬆️</button>
        <button type="button" onClick={() => move(1, 0)} className="w-11 h-11 rounded-lg bg-slate-800 hover:bg-slate-700 text-lg cursor-pointer">⬇️</button>
        <button type="button" onClick={() => move(0, 1)} className="w-11 h-11 rounded-lg bg-slate-800 hover:bg-slate-700 text-lg cursor-pointer">➡️</button>
      </div>
      <div className="text-[11px] text-slate-400 text-center">
        {lang === 'ar' ? 'اضغط على الأسهم أو المربع المجاور لتحريك المفتاح' : 'Use arrows or tap adjacent tiles'}
      </div>
    </div>
  );
};

const ChessKnightSub: React.FC<{
  lang: 'ar' | 'en';
  onWin: () => void;
  onBeep?: (good: boolean) => void;
}> = ({ lang, onWin, onBeep }) => {
  const [pos, setPos] = useState({ r: 0, c: 0 });
  const [keys, setKeys] = useState<string[]>(['1,2', '3,1', '2,3']);

  const isLegal = (r: number, c: number) => {
    const dr = Math.abs(r - pos.r);
    const dc = Math.abs(c - pos.c);
    return (dr === 2 && dc === 1) || (dr === 1 && dc === 2);
  };

  const jump = (r: number, c: number) => {
    if (!isLegal(r, c)) return;
    setPos({ r, c });
    const k = `${r},${c}`;
    if (keys.includes(k)) {
      onBeep?.(true);
      const rest = keys.filter((x) => x !== k);
      setKeys(rest);
      if (rest.length === 0) window.setTimeout(onWin, 280);
    }
  };

  return (
    <div className="space-y-3" dir="ltr">
      <div className="text-xs font-bold text-amber-200 text-center tabular-nums">
        {lang === 'ar'
          ? `المفاتيح المتبقية: ${keys.length} / 3`
          : `Keys Left: ${keys.length} / 3`}
      </div>
      <div className="grid grid-cols-4 gap-1.5 max-w-[240px] mx-auto">
        {Array.from({ length: 16 }, (_, idx) => {
          const r = Math.floor(idx / 4);
          const c = idx % 4;
          const here = pos.r === r && pos.c === c;
          const hasKey = keys.includes(`${r},${c}`);
          const legal = isLegal(r, c);
          return (
            <button
              key={idx}
              type="button"
              onClick={() => jump(r, c)}
              className={`h-14 rounded-xl border-2 text-2xl flex items-center justify-center transition-all ${
                here
                  ? 'border-cyan-300 bg-cyan-500/25'
                  : legal
                  ? 'border-emerald-400 bg-emerald-500/20 hover:bg-emerald-500/35 cursor-pointer'
                  : (r + c) % 2 === 0
                  ? 'border-white/10 bg-[#152944]'
                  : 'border-white/10 bg-[#0d1a2c]'
              }`}
            >
              {here ? '♞' : hasKey ? '🔑' : legal ? '•' : ''}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const MirrorSymmetrySub: React.FC<{
  lang: 'ar' | 'en';
  onWin: () => void;
  onBeep?: (good: boolean) => void;
}> = ({ lang, onWin, onBeep }) => {
  // 4x4 grid: left cols (0,1) fixed pattern, right cols (2,3) player draws mirror
  const [leftMask] = useState<boolean[]>(() => {
    const arr = Array(8).fill(false);
    const chosen = shuffleArray([0, 1, 2, 3, 4, 5, 6, 7]).slice(0, 4);
    for (const i of chosen) arr[i] = true;
    return arr;
  });
  const [rightMask, setRightMask] = useState<boolean[]>(() => Array(8).fill(false));

  const toggleRight = (r: number, rc: number) => {
    const idx = r * 2 + rc;
    const next = rightMask.map((v, i) => (i === idx ? !v : v));
    setRightMask(next);
    // Mirror check: left(r,0) === right(r,1) and left(r,1) === right(r,0)
    const ok = [0, 1, 2, 3].every(
      (row) =>
        leftMask[row * 2 + 0] === next[row * 2 + 1] &&
        leftMask[row * 2 + 1] === next[row * 2 + 0]
    );
    if (ok) {
      onBeep?.(true);
      window.setTimeout(onWin, 280);
    }
  };

  return (
    <div className="space-y-3" dir="ltr">
      <div className="text-xs text-slate-300 text-center">
        {lang === 'ar'
          ? 'اضغط على المربعات اليمنى لتعكس الشكل الأيسر كالمرآة'
          : 'Tap right-side tiles to mirror the left pattern'}
      </div>
      <div className="grid grid-cols-4 gap-2 max-w-[240px] mx-auto">
        {[0, 1, 2, 3].map((r) => (
          <React.Fragment key={r}>
            {[0, 1].map((c) => {
              const on = leftMask[r * 2 + c];
              return (
                <div
                  key={`L-${r}-${c}`}
                  className={`h-13 rounded-xl border-2 flex items-center justify-center ${
                    on
                      ? 'border-amber-300 bg-amber-400/35 text-amber-100'
                      : 'border-white/10 bg-[#0d1a2c]'
                  }`}
                >
                  {on ? '◆' : ''}
                </div>
              );
            })}
            {[0, 1].map((rc) => {
              const on = rightMask[r * 2 + rc];
              return (
                <button
                  key={`R-${r}-${rc}`}
                  type="button"
                  onClick={() => toggleRight(r, rc)}
                  className={`h-13 rounded-xl border-2 flex items-center justify-center cursor-pointer ${
                    on
                      ? 'border-cyan-300 bg-cyan-400/35 text-cyan-100'
                      : 'border-sky-400/30 bg-[#152944] hover:bg-[#1e395e]'
                  }`}
                >
                  {on ? '◆' : ''}
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

const TRAIL_SHAPES: number[][] = [
  [0, 1, 2, 6, 5, 9, 10],
  [4, 0, 1, 5, 6, 10, 11],
  [12, 8, 9, 5, 6, 7, 11],
];

const OneStrokeTrailSub: React.FC<{
  lang: 'ar' | 'en';
  onWin: () => void;
  onBeep?: (good: boolean) => void;
}> = ({ lang, onWin, onBeep }) => {
  const [shape] = useState<number[]>(() => TRAIL_SHAPES[randInt(0, TRAIL_SHAPES.length - 1)]);
  const [path, setPath] = useState<number[]>(() => [shape[0]]);
  const activeSet = useMemo(() => new Set(shape), [shape]);
  const last = path[path.length - 1];

  const handleTap = (idx: number) => {
    if (!activeSet.has(idx)) return;
    if (path.length > 1 && idx === path[path.length - 2]) {
      setPath(path.slice(0, -1));
      return;
    }
    if (path.includes(idx)) return;
    const r1 = Math.floor(last / 4);
    const c1 = last % 4;
    const r2 = Math.floor(idx / 4);
    const c2 = idx % 4;
    if (Math.abs(r1 - r2) + Math.abs(c1 - c2) !== 1) return;

    onBeep?.(true);
    const next = [...path, idx];
    setPath(next);
    if (next.length === shape.length) {
      window.setTimeout(onWin, 280);
    }
  };

  return (
    <div className="space-y-3" dir="ltr">
      <div className="flex items-center justify-between text-xs font-bold text-amber-200 tabular-nums">
        <span>
          {lang === 'ar'
            ? `المربعات المتصلة: ${path.length}/${shape.length}`
            : `Connected: ${path.length}/${shape.length}`}
        </span>
        <button
          type="button"
          onClick={() => setPath([shape[0]])}
          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
        >
          {lang === 'ar' ? 'إعادة' : 'Reset'}
        </button>
      </div>
      <div className="grid grid-cols-4 gap-2 max-w-[240px] mx-auto">
        {Array.from({ length: 16 }, (_, idx) => {
          const isValid = activeSet.has(idx);
          const posIdx = path.indexOf(idx);
          const isVisited = posIdx !== -1;
          const isHead = idx === last;
          return (
            <button
              key={idx}
              type="button"
              disabled={!isValid}
              onClick={() => handleTap(idx)}
              className={`h-14 rounded-xl border-2 font-num font-black text-base flex items-center justify-center ${
                !isValid
                  ? 'border-transparent bg-[#0a1322] opacity-30'
                  : isHead
                  ? 'border-amber-300 bg-amber-400/35 text-white cursor-pointer'
                  : isVisited
                  ? 'border-emerald-400 bg-emerald-500/25 text-emerald-100 cursor-pointer'
                  : 'border-sky-400/45 bg-[#152944] hover:bg-[#1e395e] text-sky-200 cursor-pointer'
              }`}
            >
              {isVisited ? posIdx + 1 : isValid ? '○' : ''}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// ENGINE 9: WORDS, ANAGRAMS & RIDDLES (Puzzles #41 - #45)
// ============================================================================
const WordCipherEngine: React.FC<EngineProps> = ({ lang, variant, onWin, onBeep }) => {
  if (variant === 0) return <WordUnscrambleSub lang={lang} onWin={onWin} onBeep={onBeep} />;
  if (variant === 1) return <RiddlesSub lang={lang} onWin={onWin} onBeep={onBeep} />;
  if (variant === 2) return <SymbolCipherSub lang={lang} onWin={onWin} onBeep={onBeep} />;
  if (variant === 3) return <OddWordOutSub lang={lang} onWin={onWin} onBeep={onBeep} />;
  return <AlphabetChainSub lang={lang} onWin={onWin} onBeep={onBeep} />;
};

const WordUnscrambleSub: React.FC<{
  lang: 'ar' | 'en';
  onWin: () => void;
  onBeep?: (good: boolean) => void;
}> = ({ lang, onWin, onBeep }) => {
  const words = useMemo(
    () =>
      lang === 'ar'
        ? shuffleArray([
            { word: 'مفتاح', hint: 'يفتح القفل والباب' },
            { word: 'علكة', hint: 'تبيعها في محلك!' },
            { word: 'سرير', hint: 'تنام عليه في الليل' },
            { word: 'نعناع', hint: 'نكهة علك منعشة' },
            { word: 'قمر', hint: 'يظهر في سماء الليل' },
          ]).slice(0, 2)
        : shuffleArray([
            { word: 'KEY', hint: 'Opens a locked door' },
            { word: 'GUM', hint: 'You sell it in your shop!' },
            { word: 'BED', hint: 'Sleep here at night' },
            { word: 'MINT', hint: 'Fresh green flavor' },
            { word: 'MOON', hint: 'Shines in the night sky' },
          ]).slice(0, 2),
    [lang]
  );

  const [round, setRound] = useState(0);
  const cur = words[round];
  const [tiles, setTiles] = useState<Array<{ ch: string; idx: number; used: boolean }>>(() =>
    shuffleArray(cur.word.split('').map((ch, idx) => ({ ch, idx, used: false })))
  );
  const [built, setBuilt] = useState('');

  const resetForWord = (word: string) => {
    setTiles(shuffleArray(word.split('').map((ch, idx) => ({ ch, idx, used: false }))));
    setBuilt('');
  };

  const tapTile = (tileIdx: number) => {
    const t = tiles[tileIdx];
    if (!t || t.used) return;
    const nextBuilt = built + t.ch;
    const nextTiles = tiles.map((item, i) => (i === tileIdx ? { ...item, used: true } : item));
    setTiles(nextTiles);
    setBuilt(nextBuilt);

    if (nextBuilt.length === cur.word.length) {
      if (nextBuilt === cur.word) {
        onBeep?.(true);
        if (round + 1 >= words.length) {
          window.setTimeout(onWin, 280);
        } else {
          window.setTimeout(() => {
            setRound(round + 1);
            resetForWord(words[round + 1].word);
          }, 360);
        }
      } else {
        onBeep?.(false);
        window.setTimeout(() => resetForWord(cur.word), 520);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs font-bold text-slate-300 tabular-nums">
        <span>
          {lang === 'ar' ? `تلميح: ${cur.hint}` : `Hint: ${cur.hint}`}
        </span>
        <span>
          {round + 1} / {words.length}
        </span>
      </div>
      <div className="rounded-xl border border-amber-400/50 bg-[#0b1525] py-4 text-center text-2xl font-black text-amber-200 tracking-widest min-h-[60px]">
        {built || '· · ·'}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {tiles.map((t, i) => (
          <button
            key={i}
            type="button"
            disabled={t.used}
            onClick={() => tapTile(i)}
            className={`w-13 h-13 rounded-xl border-2 text-xl font-black cursor-pointer ${
              t.used
                ? 'border-white/10 bg-slate-900 text-slate-600'
                : 'border-sky-400/45 bg-[#152944] hover:bg-[#1e395e] text-white'
            }`}
          >
            {t.ch}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => resetForWord(cur.word)}
        className="w-full h-9 rounded-lg border border-white/15 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 cursor-pointer"
      >
        {lang === 'ar' ? 'مسح الحروف' : 'Clear Letters'}
      </button>
    </div>
  );
};

const RIDDLE_POOL = [
  {
    qAr: 'ما هو الشيء الذي يكتب ولا يقرأ؟',
    qEn: 'What writes all day but can never read?',
    optsAr: ['القلم', 'الكتاب', 'الساعة', 'المفتاح'],
    optsEn: ['A Pen', 'A Book', 'A Clock', 'A Key'],
    ansIdx: 0,
  },
  {
    qAr: 'ما هو الشيء الذي له أسنان ولا يعض؟',
    qEn: 'What has teeth but can never bite?',
    optsAr: ['المشط', 'الأسد', 'الباب', 'القمر'],
    optsEn: ['A Comb', 'A Lion', 'A Door', 'The Moon'],
    ansIdx: 0,
  },
  {
    qAr: 'ما هو الشيء الذي كلما أخذت منه كبر؟',
    qEn: 'The more you take away from it, the bigger it gets. What is it?',
    optsAr: ['الحفرة', 'الصندوق', 'العلكة', 'النهر'],
    optsEn: ['A Hole', 'A Box', 'Gum', 'A River'],
    ansIdx: 0,
  },
  {
    qAr: 'ما هو الشيء الذي يمشي بلا أرجل ويبكي بلا عيون؟',
    qEn: 'What travels without legs and cries without eyes?',
    optsAr: ['السحابة', 'السيارة', 'الشجرة', 'الجبل'],
    optsEn: ['A Cloud', 'A Car', 'A Tree', 'A Mountain'],
    ansIdx: 0,
  },
  {
    qAr: 'كم شهراً في السنة يحتوي على 28 يوماً؟',
    qEn: 'How many months in a year have at least 28 days?',
    optsAr: ['جميع الشهور (12)', 'شهر واحد فقط', '6 شهور', '3 شهور'],
    optsEn: ['All 12 months', 'Only 1 month', '6 months', '3 months'],
    ansIdx: 0,
  },
];

const RiddlesSub: React.FC<{
  lang: 'ar' | 'en';
  onWin: () => void;
  onBeep?: (good: boolean) => void;
}> = ({ lang, onWin, onBeep }) => {
  const [riddles] = useState(() =>
    shuffleArray(RIDDLE_POOL)
      .slice(0, 2)
      .map((r) => {
        const list = (lang === 'ar' ? r.optsAr : r.optsEn).map((text, idx) => ({
          text,
          correct: idx === r.ansIdx,
        }));
        return {
          q: lang === 'ar' ? r.qAr : r.qEn,
          options: shuffleArray(list),
        };
      })
  );
  const [step, setStep] = useState(0);
  const [wrongText, setWrongText] = useState<string | null>(null);
  const cur = riddles[step];

  const pick = (opt: { text: string; correct: boolean }) => {
    if (opt.correct) {
      onBeep?.(true);
      setWrongText(null);
      if (step + 1 >= riddles.length) window.setTimeout(onWin, 260);
      else setStep((s) => s + 1);
    } else {
      onBeep?.(false);
      setWrongText(opt.text);
      window.setTimeout(() => setWrongText(null), 450);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-xs font-bold text-slate-400 text-center tabular-nums">
        {lang === 'ar' ? `فزورة ${step + 1} من 2` : `Riddle ${step + 1} of 2`}
      </div>
      <div className="rounded-xl border border-amber-400/45 bg-[#0b1525] p-4 text-center text-base sm:text-lg font-black text-amber-100 leading-relaxed">
        {cur.q}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {cur.options.map((opt) => (
          <button
            key={opt.text}
            type="button"
            onClick={() => pick(opt)}
            className={`h-12 px-3 rounded-xl border-2 text-sm font-extrabold cursor-pointer ${
              wrongText === opt.text
                ? 'border-rose-400 bg-rose-500/25 text-rose-100'
                : 'border-sky-400/35 bg-[#152944] hover:bg-[#1e395e] text-white'
            }`}
          >
            {opt.text}
          </button>
        ))}
      </div>
    </div>
  );
};

const SymbolCipherSub: React.FC<{
  lang: 'ar' | 'en';
  onWin: () => void;
  onBeep?: (good: boolean) => void;
}> = ({ lang, onWin, onBeep }) => {
  const [legend] = useState(() => ({
    gum: randInt(2, 6),
    key: randInt(4, 9),
    moon: randInt(1, 5),
  }));
  const [round, setRound] = useState(0);
  const questions = useMemo(() => {
    const q1 = { expr: '🍬 + 🔑 = ?', ans: legend.gum + legend.key };
    const q2 = { expr: '🔑 + 🌙 + 🍬 = ?', ans: legend.key + legend.moon + legend.gum };
    const q3 = { expr: '🍬 × 2 + 🌙 = ?', ans: legend.gum * 2 + legend.moon };
    return [q1, q2, q3].map((q) => {
      const opts = new Set<number>([q.ans]);
      while (opts.size < 4) opts.add(Math.max(1, q.ans + randInt(-4, 5)));
      return { ...q, options: shuffleArray(Array.from(opts)) };
    });
  }, [legend]);
  const cur = questions[round];

  const pick = (n: number) => {
    if (n === cur.ans) {
      onBeep?.(true);
      if (round + 1 >= questions.length) window.setTimeout(onWin, 260);
      else setRound((r) => r + 1);
    } else {
      onBeep?.(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-around rounded-xl border border-white/10 bg-[#14253d] py-2.5 text-sm font-black text-amber-200 tabular-nums" dir="ltr">
        <span>🍬 = {legend.gum}</span>
        <span>🔑 = {legend.key}</span>
        <span>🌙 = {legend.moon}</span>
      </div>
      <div className="rounded-xl border border-amber-400/45 bg-[#0b1525] py-5 text-center text-2xl font-black text-white" dir="ltr">
        {cur.expr}
      </div>
      <div className="grid grid-cols-2 gap-2.5" dir="ltr">
        {cur.options.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => pick(n)}
            className="h-12 rounded-xl border-2 border-sky-400/35 bg-[#152944] hover:bg-[#1e395e] font-num text-xl font-black text-white cursor-pointer tabular-nums"
          >
            {n}
          </button>
        ))}
      </div>
      <div className="text-[11px] text-slate-400 text-center tabular-nums">
        {lang === 'ar' ? `جولة ${round + 1}/3` : `Round ${round + 1}/3`}
      </div>
    </div>
  );
};

const ODD_WORD_GROUPS = [
  { ar: ['تفاح', 'موز', 'عنب', 'مفتاح'], en: ['Apple', 'Banana', 'Grape', 'Key'], odd: 3 },
  { ar: ['أحمر', 'أزرق', 'أخضر', 'سرير'], en: ['Red', 'Blue', 'Green', 'Bed'], odd: 3 },
  { ar: ['السبت', 'الأحد', 'الاثنين', 'نعناع'], en: ['Monday', 'Tuesday', 'Friday', 'Mint'], odd: 3 },
  { ar: ['قطة', 'أسد', 'حصان', 'باب'], en: ['Cat', 'Lion', 'Horse', 'Door'], odd: 3 },
  { ar: ['صيف', 'شتاء', 'ربيع', 'علكة'], en: ['Summer', 'Winter', 'Spring', 'Gum'], odd: 3 },
];

const OddWordOutSub: React.FC<{
  lang: 'ar' | 'en';
  onWin: () => void;
  onBeep?: (good: boolean) => void;
}> = ({ lang, onWin, onBeep }) => {
  const [rounds] = useState(() =>
    shuffleArray(ODD_WORD_GROUPS)
      .slice(0, 3)
      .map((g) =>
        shuffleArray(
          (lang === 'ar' ? g.ar : g.en).map((w, idx) => ({ w, isOdd: idx === g.odd }))
        )
      )
  );
  const [step, setStep] = useState(0);

  const pick = (item: { w: string; isOdd: boolean }) => {
    if (item.isOdd) {
      onBeep?.(true);
      if (step + 1 >= rounds.length) window.setTimeout(onWin, 260);
      else setStep((s) => s + 1);
    } else {
      onBeep?.(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-xs font-bold text-amber-200 text-center tabular-nums">
        {lang === 'ar'
          ? `اختر الكلمة الدخيلة · جولة ${step + 1}/3`
          : `Tap the odd word out · Round ${step + 1}/3`}
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {rounds[step].map((item) => (
          <button
            key={item.w}
            type="button"
            onClick={() => pick(item)}
            className="h-14 rounded-xl border-2 border-sky-400/35 bg-[#152944] hover:bg-[#1e395e] hover:border-amber-300 text-base font-black text-white cursor-pointer"
          >
            {item.w}
          </button>
        ))}
      </div>
    </div>
  );
};

const AlphabetChainSub: React.FC<{
  lang: 'ar' | 'en';
  onWin: () => void;
  onBeep?: (good: boolean) => void;
}> = ({ lang, onWin, onBeep }) => {
  const alpha =
    lang === 'ar'
      ? ['أ', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص']
      : ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'];

  const [rounds] = useState(() =>
    [1, 2, 1].map((stride) => {
      const start = randInt(0, alpha.length - 1 - stride * 3);
      const seq = [0, 1, 2].map((k) => alpha[start + k * stride]);
      const ans = alpha[start + 3 * stride];
      const opts = new Set<string>([ans]);
      while (opts.size < 4) opts.add(alpha[randInt(0, alpha.length - 1)]);
      return { seq, ans, options: shuffleArray(Array.from(opts)) };
    })
  );
  const [step, setStep] = useState(0);
  const cur = rounds[step];

  const pick = (ch: string) => {
    if (ch === cur.ans) {
      onBeep?.(true);
      if (step + 1 >= rounds.length) window.setTimeout(onWin, 260);
      else setStep((s) => s + 1);
    } else {
      onBeep?.(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-xs font-bold text-slate-300 text-center tabular-nums">
        {lang === 'ar' ? `أكمل سلسلة الحروف · جولة ${step + 1}/3` : `Complete the letter chain · Round ${step + 1}/3`}
      </div>
      <div className="rounded-xl border border-amber-400/45 bg-[#0b1525] py-5 text-center text-2xl font-black text-amber-200 tracking-widest">
        {cur.seq.join(' · ')} · ؟
      </div>
      <div className="grid grid-cols-4 gap-2">
        {cur.options.map((ch) => (
          <button
            key={ch}
            type="button"
            onClick={() => pick(ch)}
            className="h-14 rounded-xl border-2 border-sky-400/35 bg-[#152944] hover:bg-[#1e395e] text-xl font-black text-white cursor-pointer"
          >
            {ch}
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// ENGINE 10: TIMING, PRECISION & REFLEX (Puzzles #46 - #50)
// ============================================================================
const TimingReflexEngine: React.FC<EngineProps> = ({ lang, variant, onWin, onBeep }) => {
  if (variant === 0) return <GoldenTimingBarSub lang={lang} locksNeeded={3} onWin={onWin} onBeep={onBeep} />;
  if (variant === 1) return <WhackALockSub lang={lang} onWin={onWin} onBeep={onBeep} />;
  if (variant === 2) return <PrecisionSlidersSub lang={lang} onWin={onWin} onBeep={onBeep} />;
  if (variant === 3) return <StopwatchTargetSub lang={lang} onWin={onWin} onBeep={onBeep} />;
  return <RoyalGauntletSub lang={lang} onWin={onWin} onBeep={onBeep} />;
};

const GoldenTimingBarSub: React.FC<{
  lang: 'ar' | 'en';
  locksNeeded: number;
  onWin: () => void;
  onBeep?: (good: boolean) => void;
}> = ({ lang, locksNeeded, onWin, onBeep }) => {
  const [locks, setLocks] = useState(0);
  const [zoneStart, setZoneStart] = useState(() => randInt(25, 58));
  const zoneWidth = 22;
  const [pos, setPos] = useState(0);
  const posRef = useRef(0);
  const dirRef = useRef(1);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const speed = 78 + locks * 22;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      let next = posRef.current + dirRef.current * speed * dt;
      if (next >= 100) {
        next = 100;
        dirRef.current = -1;
      } else if (next <= 0) {
        next = 0;
        dirRef.current = 1;
      }
      posRef.current = next;
      setPos(next);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [locks]);

  const handleStop = () => {
    const p = posRef.current;
    if (p >= zoneStart && p <= zoneStart + zoneWidth) {
      onBeep?.(true);
      const next = locks + 1;
      setLocks(next);
      if (next >= locksNeeded) {
        window.setTimeout(onWin, 250);
      } else {
        setZoneStart(randInt(18, 62));
      }
    } else {
      onBeep?.(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-xs font-bold text-amber-200 text-center tabular-nums">
        {lang === 'ar'
          ? `الأقفال المفتوحة: ${locks} / ${locksNeeded}`
          : `Locks Released: ${locks} / ${locksNeeded}`}
      </div>
      <div className="relative h-12 rounded-xl border-2 border-white/15 bg-[#0b1525] overflow-hidden" dir="ltr">
        <div
          className="absolute top-0 bottom-0 bg-amber-400/35 border-x-2 border-amber-300"
          style={{ left: `${zoneStart}%`, width: `${zoneWidth}%` }}
        />
        <div
          className="absolute top-1 bottom-1 w-2.5 rounded-full bg-emerald-300 shadow-lg"
          style={{ left: `calc(${pos}% - 5px)` }}
        />
      </div>
      <button
        type="button"
        onClick={handleStop}
        className="w-full h-12 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-base cursor-pointer"
      >
        {lang === 'ar' ? '🎯 توقّف الآن!' : '🎯 STOP NOW!'}
      </button>
    </div>
  );
};

const WhackALockSub: React.FC<{
  lang: 'ar' | 'en';
  onWin: () => void;
  onBeep?: (good: boolean) => void;
}> = ({ lang, onWin, onBeep }) => {
  const [score, setScore] = useState(0);
  const [active, setActive] = useState<{ idx: number; trap: boolean }>({ idx: 4, trap: false });

  useEffect(() => {
    const id = window.setInterval(() => {
      setActive({ idx: randInt(0, 8), trap: Math.random() < 0.25 });
    }, 780);
    return () => window.clearInterval(id);
  }, []);

  const hit = (idx: number) => {
    if (idx !== active.idx) return;
    if (active.trap) {
      onBeep?.(false);
      setScore((s) => Math.max(0, s - 1));
    } else {
      onBeep?.(true);
      const next = score + 1;
      setScore(next);
      setActive({ idx: randInt(0, 8), trap: false });
      if (next >= 6) window.setTimeout(onWin, 240);
    }
  };

  return (
    <div className="space-y-3">
      <div className="text-xs font-bold text-amber-200 text-center tabular-nums">
        {lang === 'ar'
          ? `اصطد الأقفال الخضراء 🔓 (${score}/6) وتجنّب 💣`
          : `Tap green locks 🔓 (${score}/6) · Avoid 💣`}
      </div>
      <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto">
        {Array.from({ length: 9 }, (_, idx) => {
          const isHere = active.idx === idx;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => hit(idx)}
              className={`h-18 rounded-xl border-2 text-2xl font-black cursor-pointer transition-all ${
                isHere
                  ? active.trap
                    ? 'border-rose-400 bg-rose-500/30'
                    : 'border-emerald-400 bg-emerald-500/30'
                  : 'border-white/10 bg-[#111d30]'
              }`}
            >
              {isHere ? (active.trap ? '💣' : '🔓') : ''}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const PrecisionSlidersSub: React.FC<{
  lang: 'ar' | 'en';
  onWin: () => void;
  onBeep?: (good: boolean) => void;
}> = ({ lang, onWin, onBeep }) => {
  const [targets] = useState(() => [randInt(20, 80), randInt(20, 80), randInt(20, 80)]);
  const [vals, setVals] = useState([10, 90, 15]);
  const tol = 7;

  const update = (idx: number, v: number) => {
    const next = vals.map((old, i) => (i === idx ? v : old));
    setVals(next);
    if (next.every((cur, i) => Math.abs(cur - targets[i]) <= tol)) {
      onBeep?.(true);
      window.setTimeout(onWin, 280);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-xs text-slate-300 text-center">
        {lang === 'ar'
          ? 'حرّك الصمامات الثلاثة لتدخل داخل النطاق الأخضر'
          : 'Slide all 3 pressure bars into their green target zones'}
      </div>
      {(['A', 'B', 'C'] as const).map((label, i) => {
        const ok = Math.abs(vals[i] - targets[i]) <= tol;
        return (
          <div key={label} className="space-y-1.5" dir="ltr">
            <div className="flex items-center justify-between text-xs font-bold tabular-nums">
              <span className={ok ? 'text-emerald-300' : 'text-slate-300'}>
                {label} · {ok ? '✓' : `${vals[i]}%`}
              </span>
              <span className="text-amber-200">
                {lang === 'ar' ? `الهدف: ${targets[i]}%` : `Target: ${targets[i]}%`}
              </span>
            </div>
            <div className="relative">
              <div
                className="pointer-events-none absolute top-0 bottom-0 rounded bg-emerald-400/25 border border-emerald-400/60"
                style={{ left: `${targets[i] - tol}%`, width: `${tol * 2}%` }}
              />
              <input
                type="range"
                min={0}
                max={100}
                value={vals[i]}
                onChange={(e) => update(i, Number(e.target.value))}
                className="relative z-10 w-full accent-amber-400 cursor-pointer h-7"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const StopwatchTargetSub: React.FC<{
  lang: 'ar' | 'en';
  onWin: () => void;
  onBeep?: (good: boolean) => void;
}> = ({ lang, onWin, onBeep }) => {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [resultMsg, setResultMsg] = useState<string | null>(null);
  const startRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    const tick = (now: number) => {
      setElapsed((now - startRef.current) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  const handleToggle = () => {
    if (!running) {
      setResultMsg(null);
      setElapsed(0);
      startRef.current = performance.now();
      setRunning(true);
    } else {
      const sec = (performance.now() - startRef.current) / 1000;
      setRunning(false);
      setElapsed(sec);
      if (sec >= 2.55 && sec <= 3.45) {
        onBeep?.(true);
        setResultMsg(
          lang === 'ar' ? `🎯 رائع! توقفت عند ${sec.toFixed(2)} ثانية` : `🎯 Spot on! ${sec.toFixed(2)}s`
        );
        window.setTimeout(onWin, 340);
      } else {
        onBeep?.(false);
        setResultMsg(
          lang === 'ar'
            ? `توقفت عند ${sec.toFixed(2)}s — المطلوب بين 2.60 و 3.40 ثانية!`
            : `Stopped at ${sec.toFixed(2)}s — aim between 2.60s and 3.40s!`
        );
      }
    }
  };

  const hiddenAfter16 = running && elapsed > 1.65;

  return (
    <div className="space-y-4 text-center">
      <div className="rounded-xl border border-amber-400/45 bg-[#0b1525] py-6">
        <div className="font-num text-4xl font-black text-amber-200 tabular-nums" dir="ltr">
          {hiddenAfter16 ? '?.??s' : `${elapsed.toFixed(2)}s`}
        </div>
        <div className="text-xs text-slate-400 mt-1">
          {lang === 'ar' ? 'الهدف: 3.00 ثانية (يختفي العداد بعد 1.65s!)' : 'Target: 3.00s (display hides after 1.65s!)'}
        </div>
      </div>
      {resultMsg && <div className="text-xs font-bold text-sky-200">{resultMsg}</div>}
      <button
        type="button"
        onClick={handleToggle}
        className={`w-full h-12 rounded-xl font-black text-base cursor-pointer ${
          running
            ? 'bg-rose-500 hover:bg-rose-400 text-white'
            : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950'
        }`}
      >
        {running
          ? lang === 'ar'
            ? '⏹️ إيقاف المؤقت'
            : '⏹️ STOP TIMER'
          : lang === 'ar'
          ? '▶️ ابدأ العد إلى 3 ثوانٍ'
          : '▶️ START 3.0s TIMER'}
      </button>
    </div>
  );
};

const RoyalGauntletSub: React.FC<{
  lang: 'ar' | 'en';
  onWin: () => void;
  onBeep?: (good: boolean) => void;
}> = ({ lang, onWin, onBeep }) => {
  const [stage, setStage] = useState<1 | 2 | 3>(1);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-black text-amber-200 border-b border-white/10 pb-2 tabular-nums">
        <span>{lang === 'ar' ? `المرحلة ${stage} / 3` : `Stage ${stage} / 3`}</span>
        <span>
          {stage === 1
            ? lang === 'ar'
              ? '1. اختبار الحساب'
              : '1. Quick Math'
            : stage === 2
            ? lang === 'ar'
              ? '2. مرآة الأسهم'
              : '2. Arrow Reflex'
            : lang === 'ar'
            ? '3. الإيقاف الذهبي'
            : '3. Golden Stop'}
        </span>
      </div>
      {stage === 1 && (
        <MathLockEngine lang={lang} variant={4} onBeep={onBeep} onWin={() => setStage(2)} />
      )}
      {stage === 2 && (
        <OppositeArrowSub lang={lang} onBeep={onBeep} onWin={() => setStage(3)} />
      )}
      {stage === 3 && (
        <GoldenTimingBarSub lang={lang} locksNeeded={2} onBeep={onBeep} onWin={onWin} />
      )}
    </div>
  );
};

// ============================================================================
// MAIN DOOR PUZZLE MODAL (Dispatches any of the 50 puzzles!)
// ============================================================================
export interface DoorPuzzleModalProps {
  lang: 'ar' | 'en';
  puzzleId: number;
  solvedIds: number[];
  forDoorUnlock: boolean;
  onSelectPuzzle: (puzzleId: number) => void;
  onOpenIndex: () => void;
  onClose: () => void;
  onSolved: (puzzleId: number) => void;
  onPlayBeep?: (good: boolean) => void;
}

const DIFF_LABELS: Record<PuzzleDifficulty, { ar: string; en: string; color: string }> = {
  easy: { ar: 'سهل', en: 'Easy', color: 'text-emerald-300' },
  medium: { ar: 'متوسط', en: 'Medium', color: 'text-amber-300' },
  hard: { ar: 'صعب', en: 'Hard', color: 'text-rose-300' },
};

export const DoorPuzzleModal: React.FC<DoorPuzzleModalProps> = ({
  lang,
  puzzleId,
  solvedIds,
  forDoorUnlock,
  onSelectPuzzle,
  onOpenIndex,
  onClose,
  onSolved,
  onPlayBeep,
}) => {
  const puzzle: PuzzleDefinition = PUZZLE_BY_ID[puzzleId] ?? PUZZLE_CATALOG[0];
  const category = PUZZLE_CATEGORY_MAP[puzzle.category];
  const diff = DIFF_LABELS[puzzle.difficulty];
  const [runKey, setRunKey] = useState(0);
  const [justSolved, setJustSolved] = useState(false);

  useEffect(() => {
    setJustSolved(false);
    setRunKey((k) => k + 1);
  }, [puzzle.id]);

  const handleWin = useCallback(() => {
    setJustSolved(true);
    window.setTimeout(() => {
      onSolved(puzzle.id);
    }, 360);
  }, [onSolved, puzzle.id]);

  const handleRandomOther = () => {
    const nextId = pickNextDoorPuzzleId(solvedIds, puzzle.id);
    onSelectPuzzle(nextId);
  };

  const renderEngine = () => {
    const props: EngineProps = {
      lang,
      variant: puzzle.variant,
      onWin: handleWin,
      onBeep: onPlayBeep,
    };
    switch (puzzle.category) {
      case 'memory':
        return <MemoryEngine key={`${puzzle.id}-${runKey}`} {...props} />;
      case 'safe':
        return <SafeLockEngine key={`${puzzle.id}-${runKey}`} {...props} />;
      case 'lights':
        return <LightsGridEngine key={`${puzzle.id}-${runKey}`} {...props} />;
      case 'math':
        return <MathLockEngine key={`${puzzle.id}-${runKey}`} {...props} />;
      case 'sequence':
        return <SequenceEngine key={`${puzzle.id}-${runKey}`} {...props} />;
      case 'sorting':
        return <OrderingEngine key={`${puzzle.id}-${runKey}`} {...props} />;
      case 'perception':
        return <PerceptionEngine key={`${puzzle.id}-${runKey}`} {...props} />;
      case 'paths':
        return <PathMazeEngine key={`${puzzle.id}-${runKey}`} {...props} />;
      case 'words':
        return <WordCipherEngine key={`${puzzle.id}-${runKey}`} {...props} />;
      case 'timing':
        return <TimingReflexEngine key={`${puzzle.id}-${runKey}`} {...props} />;
    }
  };

  const numStr = String(puzzle.id).padStart(2, '0');
  const alreadySolved = solvedIds.includes(puzzle.id);

  return (
    <div className="pointer-events-auto fixed inset-0 z-40 bg-[#060e1a]/86 flex items-center justify-center p-3 sm:p-5">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-amber-400/60 bg-[#0e1b2e] p-4 sm:p-6 shadow-2xl">
        {/* Clean Header */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1 tabular-nums">
              <span>{numStr} / 50</span>
              <span aria-hidden="true">·</span>
              <span>{lang === 'ar' ? category.nameAr : category.nameEn}</span>
              <span aria-hidden="true">·</span>
              <span className={`font-bold ${diff.color}`}>
                {lang === 'ar' ? diff.ar : diff.en}
              </span>
              {alreadySolved && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-300 font-bold">
                    {lang === 'ar' ? 'محلول ✓' : 'Solved ✓'}
                  </span>
                </>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-black text-amber-200 leading-snug">
              {puzzle.icon} {lang === 'ar' ? puzzle.titleAr : puzzle.titleEn}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
              {lang === 'ar' ? puzzle.descAr : puzzle.descEn}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-3 rounded-lg border border-white/20 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white cursor-pointer shrink-0 whitespace-nowrap"
          >
            {lang === 'ar' ? 'إغلاق' : 'Close'}
          </button>
        </div>

        {/* Active Puzzle Stage */}
        <div className="my-4 pt-3 border-t border-white/10">
          {justSolved ? (
            <div className="rounded-xl border border-emerald-400 bg-emerald-500/20 py-8 text-center">
              <div className="text-3xl mb-1">🔓</div>
              <div className="text-base font-black text-emerald-200">
                {forDoorUnlock
                  ? lang === 'ar'
                    ? 'تم حل اللغز وفتح باب بيت النوم!'
                    : 'Puzzle Solved! Opening Sleep House Door!'
                  : lang === 'ar'
                  ? 'أحسنت! تم تسجيل اللغز في فهرس الألغاز'
                  : 'Solved! Recorded in your Puzzle Index'}
              </div>
            </div>
          ) : (
            renderEngine()
          )}
        </div>

        {/* Action Footer: Reset / Switch Puzzle / Open 50-Puzzle Index */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/10">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setRunKey((k) => k + 1)}
              className="h-9 px-3 rounded-lg border border-white/15 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 cursor-pointer whitespace-nowrap"
            >
              🔄 {lang === 'ar' ? 'إعادة' : 'Reset'}
            </button>
            <button
              type="button"
              onClick={handleRandomOther}
              className="h-9 px-3 rounded-lg border border-amber-400/40 bg-amber-500/15 hover:bg-amber-500/25 text-xs font-extrabold text-amber-200 cursor-pointer whitespace-nowrap"
            >
              🎲 {lang === 'ar' ? 'لغز آخر' : 'Switch Puzzle'}
            </button>
          </div>
          <button
            type="button"
            onClick={onOpenIndex}
            className="h-9 px-3.5 rounded-lg border border-sky-400/50 bg-sky-500/20 hover:bg-sky-500/30 text-xs font-extrabold text-sky-200 cursor-pointer whitespace-nowrap"
          >
            📚 {lang === 'ar' ? `فهرس الألغاز (${solvedIds.length}/50)` : `Puzzle Index (${solvedIds.length}/50)`}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// PUZZLE INDEX MODAL ("فهرس الألغاز" — Browse, Filter & Play all 50 Puzzles)
// ============================================================================
export interface PuzzleIndexModalProps {
  lang: 'ar' | 'en';
  solvedIds: number[];
  doorLocked: boolean;
  onPlayPuzzle: (puzzleId: number) => void;
  onClose: () => void;
}

export const PuzzleIndexModal: React.FC<PuzzleIndexModalProps> = ({
  lang,
  solvedIds,
  doorLocked,
  onPlayPuzzle,
  onClose,
}) => {
  const [category, setCategory] = useState<'all' | PuzzleCategoryId>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unsolved' | 'solved'>('all');
  const [query, setQuery] = useState('');

  const solvedSet = useMemo(() => new Set(solvedIds), [solvedIds]);
  const progressPct = Math.round((solvedIds.length / TOTAL_PUZZLE_COUNT) * 100);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PUZZLE_CATALOG.filter((p) => {
      if (category !== 'all' && p.category !== category) return false;
      const isSolved = solvedSet.has(p.id);
      if (statusFilter === 'solved' && !isSolved) return false;
      if (statusFilter === 'unsolved' && isSolved) return false;
      if (q) {
        const hay = `${p.id} ${p.titleAr} ${p.titleEn} ${p.descAr} ${p.descEn}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [category, statusFilter, query, solvedSet]);

  const handlePlayRandom = () => {
    const pool = filtered.length > 0 ? filtered : PUZZLE_CATALOG;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (pick) onPlayPuzzle(pick.id);
  };

  return (
    <div className="pointer-events-auto fixed inset-0 z-40 bg-[#060e1a]/84 flex items-center justify-center p-2.5 sm:p-5">
      <div className="w-full max-w-4xl max-h-[88vh] flex flex-col rounded-2xl border border-sky-400/55 bg-[#0d1a2e] shadow-2xl overflow-hidden">
        {/* Top Index Header */}
        <div className="p-4 sm:p-5 border-b border-white/10">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
            <div>
              <h2 className="text-lg sm:text-2xl font-black text-white">
                📚 {lang === 'ar' ? 'فهرس الألغاز (50 لغز متنوع)' : 'Puzzle Index (50 Diverse Puzzles)'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                {doorLocked
                  ? lang === 'ar'
                    ? 'اختر أي لغز من القائمة الـ 50 للعب فوراً وفتح باب بيت النوم!'
                    : 'Pick any of the 50 puzzles to play right now and unlock the Sleep House door!'
                  : lang === 'ar'
                  ? 'تصفح جميع الـ 50 لغزاً وتحدّ نفسك لإكمال الفهرس بالكامل.'
                  : 'Browse all 50 diverse puzzles and challenge yourself to complete the entire index.'}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handlePlayRandom}
                className="h-9 px-3.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black cursor-pointer whitespace-nowrap"
              >
                🎲 {lang === 'ar' ? 'لغز عشوائي' : 'Random Puzzle'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="h-9 px-3.5 rounded-lg border border-white/20 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white cursor-pointer whitespace-nowrap"
              >
                {lang === 'ar' ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>

          {/* Collection Progress Bar */}
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-1.5 tabular-nums">
            <span>
              {lang === 'ar'
                ? `التقدّم الكلي: ${solvedIds.length} من ${TOTAL_PUZZLE_COUNT} لغز`
                : `Completion: ${solvedIds.length} / ${TOTAL_PUZZLE_COUNT} puzzles`}
            </span>
            <span className="text-emerald-300">{progressPct}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden mb-3.5">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Search + Solved Filter */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                lang === 'ar' ? 'ابحث باسم اللغز أو رقمه (1-50)...' : 'Search puzzle name or number (1-50)...'
              }
              className="flex-1 min-w-[180px] h-9 px-3 rounded-lg border border-white/15 bg-[#091322] text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
            />
            <div className="flex items-center gap-1 p-1 rounded-lg bg-[#091322] border border-white/10">
              {(
                [
                  { id: 'all', ar: 'الكل', en: 'All' },
                  { id: 'unsolved', ar: 'غير محلول', en: 'Unsolved' },
                  { id: 'solved', ar: 'محلول ✓', en: 'Solved ✓' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`h-7 px-2.5 rounded-md text-xs font-bold cursor-pointer whitespace-nowrap transition-colors ${
                    statusFilter === tab.id
                      ? 'bg-amber-400 text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {lang === 'ar' ? tab.ar : tab.en}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setCategory('all')}
              className={`h-8 px-3 rounded-lg text-xs font-extrabold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                category === 'all'
                  ? 'bg-sky-400 text-slate-950'
                  : 'bg-[#14253d] text-slate-200 hover:bg-[#1d3454]'
              }`}
            >
              {lang === 'ar' ? 'الكل (50)' : 'All (50)'}
            </button>
            {PUZZLE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`h-8 px-3 rounded-lg text-xs font-extrabold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                  category === cat.id
                    ? 'bg-sky-400 text-slate-950'
                    : 'bg-[#14253d] text-slate-200 hover:bg-[#1d3454]'
                }`}
              >
                {cat.icon} {lang === 'ar' ? cat.nameAr : cat.nameEn}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Numbered 50-Puzzle Catalog */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              {lang === 'ar'
                ? 'لا توجد ألغاز تطابق البحث الحالي.'
                : 'No puzzles match your current filter.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {filtered.map((p) => {
                const isSolved = solvedSet.has(p.id);
                const cat = PUZZLE_CATEGORY_MAP[p.category];
                const diff = DIFF_LABELS[p.difficulty];
                const num = String(p.id).padStart(2, '0');
                return (
                  <div
                    key={p.id}
                    className={`rounded-xl border p-3.5 flex flex-col justify-between gap-3 transition-colors ${
                      isSolved
                        ? 'border-emerald-400/45 bg-[#102624]'
                        : 'border-white/10 bg-[#13233b]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400 mb-1 tabular-nums">
                        <div className="flex items-center gap-1.5 min-w-0 truncate">
                          <span className="font-bold text-slate-200">{num}.</span>
                          <span className="truncate">
                            {lang === 'ar' ? cat.nameAr : cat.nameEn}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className={`font-bold ${diff.color}`}>
                            {lang === 'ar' ? diff.ar : diff.en}
                          </span>
                        </div>
                        {isSolved && (
                          <span className="text-emerald-300 font-black shrink-0">✓</span>
                        )}
                      </div>
                      <div className="font-extrabold text-sm text-white leading-snug">
                        {p.icon} {lang === 'ar' ? p.titleAr : p.titleEn}
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed line-clamp-2">
                        {lang === 'ar' ? p.descAr : p.descEn}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onPlayPuzzle(p.id)}
                      className={`h-9 rounded-lg font-extrabold text-xs cursor-pointer transition-colors ${
                        isSolved
                          ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200'
                          : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                      }`}
                    >
                      {doorLocked
                        ? lang === 'ar'
                          ? '🔓 العب لفتح الباب'
                          : '🔓 Play to Unlock Door'
                        : isSolved
                        ? lang === 'ar'
                          ? 'إعادة اللعب'
                          : 'Play Again'
                        : lang === 'ar'
                        ? 'العب اللغز'
                        : 'Play Puzzle'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
