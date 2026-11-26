import React, { useEffect, useMemo, useRef, useState } from 'react';
import { partyAudio } from './audio';
import { HeroAvatarSvg } from './CharacterArt';
import type { MiniGamePlayProps } from './MiniGamesArcadeCanvas';
import { MARIO_MINI_GAME_MAP, mulberry32 } from './types';

const RHYTHM_KEYS = ['KeyA', 'KeyS', 'KeyD', 'KeyF'] as const;
const RHYTHM_COLORS = ['#ef4444', '#22c55e', '#3b82f6', '#facc15'] as const;
const RHYTHM_LABELS = ['A', 'S', 'D', 'F'] as const;

const MUSHROOM_COLORS = [
  { id: 'red', ar: 'أحمر', en: 'Red', bg: '#ef4444', ring: '#fecaca' },
  { id: 'green', ar: 'أخضر', en: 'Green', bg: '#22c55e', ring: '#bbf7d0' },
  { id: 'blue', ar: 'أزرق', en: 'Blue', bg: '#3b82f6', ring: '#bfdbfe' },
  { id: 'yellow', ar: 'أصفر', en: 'Yellow', bg: '#eab308', ring: '#fef08a' },
] as const;

const BOMB_SYMBOLS = [
  { id: 0, label: '★', color: '#facc15' },
  { id: 1, label: '▲', color: '#ef4444' },
  { id: 2, label: '●', color: '#38bdf8' },
  { id: 3, label: '◆', color: '#22c55e' },
] as const;

/**
 * Interactive Mario Party Board Engine powering 10 rapid-reflex, rhythm,
 * memory, whack-a-pipe, fishing, hammer-precision, and color-dash mini-games.
 */
export const MiniGamesInteractiveBoard: React.FC<MiniGamePlayProps> = ({
  gameId,
  seed,
  durationSec,
  characterId,
  lang,
  onLiveUpdate,
}) => {
  const spec = MARIO_MINI_GAME_MAP[gameId];
  const rngRef = useRef<() => number>(mulberry32(seed || 777));
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(durationSec);
  const [feedback, setFeedback] = useState('');
  const scoreRef = useRef(0);
  const onLiveUpdateRef = useRef(onLiveUpdate);
  onLiveUpdateRef.current = onLiveUpdate;

  const addScore = (delta: number, msg?: string) => {
    scoreRef.current = Math.max(0, scoreRef.current + delta);
    setScore(scoreRef.current);
    if (msg) setFeedback(msg);
  };

  // Master countdown & live Firestore sync timer
  useEffect(() => {
    rngRef.current = mulberry32(seed || 777);
    scoreRef.current = 0;
    setScore(0);
    setTimeLeft(durationSec);
    setFeedback('');

    const startedAt = performance.now();
    const interval = window.setInterval(() => {
      const elapsedSec = (performance.now() - startedAt) / 1000;
      const rem = Math.max(0, durationSec - elapsedSec);
      const prog = Math.min(100, Math.round((elapsedSec / durationSec) * 100));
      setTimeLeft(Math.ceil(rem));
      if (rem <= 0) {
        onLiveUpdateRef.current(scoreRef.current, 100, true);
        window.clearInterval(interval);
      } else {
        onLiveUpdateRef.current(scoreRef.current, prog, false);
      }
    }, 380);

    return () => window.clearInterval(interval);
  }, [gameId, seed, durationSec]);

  // =================== #5: BOWSER BALLOON PUMP ===================
  const [balloonFill, setBalloonFill] = useState(0);
  const [pumpHeat, setPumpHeat] = useState(0);
  const [overheated, setOverheated] = useState(false);

  useEffect(() => {
    if (gameId !== 'balloon_pump_burst') return;
    setBalloonFill(0);
    setPumpHeat(0);
    setOverheated(false);
    const id = window.setInterval(() => {
      setPumpHeat((h) => {
        const next = Math.max(0, h - 7);
        if (next <= 25) setOverheated(false);
        return next;
      });
    }, 120);
    return () => window.clearInterval(id);
  }, [gameId, seed]);

  const handlePump = () => {
    if (overheated) {
      partyAudio.playHit();
      return;
    }
    setPumpHeat((h) => {
      const nh = h + 15;
      if (nh >= 100) {
        setOverheated(true);
        partyAudio.playHit();
        setFeedback(lang === 'ar' ? '🔥 المنفاخ ساخن! انتظر لحظة!' : '🔥 OVERHEATED! Cool down!');
        return 100;
      }
      return nh;
    });
    setBalloonFill((f) => {
      const nf = f + 14;
      if (nf >= 100) {
        addScore(45, lang === 'ar' ? '💥 بوووم! +45 نقطة!' : '💥 POP! +45 pts!');
        partyAudio.playStar();
        return 0;
      }
      addScore(3);
      partyAudio.playSelect();
      return nf;
    });
  };

  // =================== #7: WHACK-A-GOOMBA (9 WARP PIPES) ===================
  type PipePop = 'none' | 'goomba' | 'gold' | 'bomb';
  const [pipePops, setPipePops] = useState<PipePop[]>(() => new Array(9).fill('none'));

  useEffect(() => {
    if (gameId !== 'whack_goomba') return;
    const rng = mulberry32(seed + 71);
    const tick = () => {
      const next: PipePop[] = new Array(9).fill('none');
      const count = 2 + Math.floor(rng() * 2);
      for (let i = 0; i < count; i++) {
        const idx = Math.floor(rng() * 9);
        const r = rng();
        next[idx] = r < 0.2 ? 'gold' : r < 0.72 ? 'goomba' : 'bomb';
      }
      setPipePops(next);
    };
    tick();
    const id = window.setInterval(tick, 920);
    return () => window.clearInterval(id);
  }, [gameId, seed]);

  const handleWhack = (idx: number) => {
    const kind = pipePops[idx];
    if (kind === 'none') return;
    setPipePops((prev) => prev.map((v, i) => (i === idx ? 'none' : v)));
    if (kind === 'gold') {
      addScore(35, lang === 'ar' ? '🍄 فطر ذهبي +35!' : '🍄 Golden Shroom +35!');
      partyAudio.playStar();
    } else if (kind === 'goomba') {
      addScore(15, '+15');
      partyAudio.playCoin();
    } else {
      addScore(-25, lang === 'ar' ? '💣 قنبلة! -25' : '💣 BOB-OMB! -25');
      partyAudio.playHit();
    }
  };

  // =================== #8: STAR PANEL MEMORY ===================
  const [memRound, setMemRound] = useState(0);
  const [memShowing, setMemShowing] = useState(true);
  const [memStars, setMemStars] = useState<number[]>([]);
  const [memRevealed, setMemRevealed] = useState<number[]>([]);

  useEffect(() => {
    if (gameId !== 'mushroom_memory') return;
    const rng = mulberry32(seed + 88 + memRound * 31);
    const chosen: number[] = [];
    const targetCount = Math.min(7, 4 + memRound);
    while (chosen.length < targetCount) {
      const idx = Math.floor(rng() * 12);
      if (!chosen.includes(idx)) chosen.push(idx);
    }
    setMemStars(chosen);
    setMemRevealed([]);
    setMemShowing(true);
    const t = window.setTimeout(() => setMemShowing(false), 1850);
    return () => window.clearTimeout(t);
  }, [gameId, seed, memRound]);

  const handleMemTap = (idx: number) => {
    if (memShowing || memRevealed.includes(idx)) return;
    const nextRev = [...memRevealed, idx];
    setMemRevealed(nextRev);
    if (memStars.includes(idx)) {
      addScore(22, '★ +22');
      partyAudio.playCoin();
      const allFound = memStars.every((s) => nextRev.includes(s));
      if (allFound) {
        addScore(40, lang === 'ar' ? '✨ لوحة كاملة! +40' : '✨ BOARD CLEAR! +40');
        partyAudio.playStar();
        window.setTimeout(() => setMemRound((r) => r + 1), 450);
      }
    } else {
      addScore(-15, '💣 -15');
      partyAudio.playHit();
    }
  };

  // =================== #11: COUNT THE TOADS ===================
  const [countStage, setCountStage] = useState(0);
  const countData = useMemo(() => {
    const rng = mulberry32(seed + 111 + countStage * 53);
    const totalItems = 9 + Math.floor(rng() * 7);
    const items: Array<{ id: number; isToad: boolean; x: number; y: number }> = [];
    let toads = 0;
    for (let i = 0; i < totalItems; i++) {
      const isToad = rng() < 0.56;
      if (isToad) toads += 1;
      items.push({
        id: i,
        isToad,
        x: 10 + (i % 5) * 19 + rng() * 6,
        y: 16 + Math.floor(i / 5) * 28 + rng() * 8,
      });
    }
    if (toads === 0) {
      items[0].isToad = true;
      toads = 1;
    }
    const opts = new Set<number>([toads]);
    while (opts.size < 4) {
      const delta = Math.floor(rng() * 5) - 2;
      const cand = Math.max(1, toads + (delta === 0 ? 3 : delta));
      opts.add(cand);
    }
    return { items, toads, options: Array.from(opts).sort((a, b) => a - b) };
  }, [seed, countStage]);

  const handleCountPick = (val: number) => {
    if (val === countData.toads) {
      addScore(45, lang === 'ar' ? '✅ عدّ مثالي! +45' : '✅ EXACT COUNT! +45');
      partyAudio.playStar();
    } else {
      addScore(-15, lang === 'ar' ? `❌ العدد الصحيح ${countData.toads}` : `❌ Actual: ${countData.toads}`);
      partyAudio.playHit();
    }
    setCountStage((s) => s + 1);
  };

  // =================== #12: TREASURE BRICK SMASH ===================
  type BrickTile = { hp: number; kind: 'coin' | 'star' | 'empty' };
  const [bricks, setBricks] = useState<BrickTile[]>([]);
  const [brickWave, setBrickWave] = useState(0);

  useEffect(() => {
    if (gameId !== 'brick_smash_rush') return;
    const rng = mulberry32(seed + 122 + brickWave * 41);
    const next: BrickTile[] = Array.from({ length: 12 }, () => {
      const r = rng();
      return {
        hp: r < 0.28 ? 2 : 1,
        kind: r < 0.25 ? 'star' : r < 0.78 ? 'coin' : 'empty',
      };
    });
    setBricks(next);
  }, [gameId, seed, brickWave]);

  const handleBrickTap = (idx: number) => {
    setBricks((prev) => {
      const cur = prev[idx];
      if (!cur || cur.hp <= 0) return prev;
      const next = prev.map((b, i) => (i === idx ? { ...b, hp: b.hp - 1 } : b));
      if (cur.hp - 1 === 0) {
        if (cur.kind === 'star') {
          addScore(32, '★ +32');
          partyAudio.playStar();
        } else if (cur.kind === 'coin') {
          addScore(14, '🪙 +14');
          partyAudio.playCoin();
        } else {
          addScore(4);
          partyAudio.playSelect();
        }
        if (next.every((b) => b.hp <= 0)) {
          addScore(30, lang === 'ar' ? '💥 موجة طوب جديدة! +30' : '💥 NEW WAVE! +30');
          window.setTimeout(() => setBrickWave((w) => w + 1), 220);
        }
      } else {
        partyAudio.playSelect();
      }
      return next;
    });
  };

  // =================== #16: STAR RHYTHM BEAT ===================
  type BeatNote = { id: number; lane: number; y: number; hit: boolean };
  const [notes, setNotes] = useState<BeatNote[]>([]);
  const notesRef = useRef<BeatNote[]>([]);

  useEffect(() => {
    if (gameId !== 'star_rhythm_beat') return;
    const rng = mulberry32(seed + 166);
    let nextId = 1;
    let spawnAcc = 0;
    let last = performance.now();
    notesRef.current = [];
    setNotes([]);

    let raf = 0;
    const loop = (ts: number) => {
      const dt = Math.min(0.05, (ts - last) / 1000);
      last = ts;
      spawnAcc += dt;
      if (spawnAcc >= 0.56) {
        spawnAcc = 0;
        notesRef.current.push({ id: nextId++, lane: Math.floor(rng() * 4), y: 0, hit: false });
      }
      notesRef.current = notesRef.current
        .map((n) => ({ ...n, y: n.y + 62 * dt }))
        .filter((n) => n.y <= 108 && !n.hit);
      setNotes([...notesRef.current]);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [gameId, seed]);

  const handleBeatLane = (lane: number) => {
    const idx = notesRef.current.findIndex((n) => n.lane === lane && n.y >= 66 && n.y <= 98);
    if (idx !== -1) {
      const n = notesRef.current[idx];
      notesRef.current.splice(idx, 1);
      const dist = Math.abs(n.y - 82);
      if (dist <= 9) {
        addScore(30, lang === 'ar' ? '✨ مثالي! +30' : '✨ PERFECT! +30');
        partyAudio.playStar();
      } else {
        addScore(15, lang === 'ar' ? '👍 جيد +15' : '👍 GOOD +15');
        partyAudio.playCoin();
      }
    } else {
      addScore(-5, 'MISS -5');
      partyAudio.playHit();
    }
  };

  // =================== #17: CHEEP-CHEEP FISHING ===================
  const [fishBiting, setFishBiting] = useState<'wait' | 'normal' | 'gold'>('wait');
  const [fishCycle, setFishCycle] = useState(0);

  useEffect(() => {
    if (gameId !== 'cheep_fishing') return;
    const rng = mulberry32(seed + 177 + fishCycle * 37);
    setFishBiting('wait');
    const delayMs = 900 + Math.floor(rng() * 1450);
    let endTimer = 0;
    const biteTimer = window.setTimeout(() => {
      const isGold = rng() < 0.34;
      setFishBiting(isGold ? 'gold' : 'normal');
      partyAudio.playSelect();
      endTimer = window.setTimeout(() => {
        setFishBiting('wait');
        setFishCycle((c) => c + 1);
      }, 950);
    }, delayMs);
    return () => {
      window.clearTimeout(biteTimer);
      window.clearTimeout(endTimer);
    };
  }, [gameId, seed, fishCycle]);

  const handleFishYank = () => {
    if (fishBiting === 'gold') {
      addScore(55, lang === 'ar' ? '🐟 سمكة ذهبية! +55' : '🐟 GOLDEN CHEEP! +55');
      partyAudio.playStar();
      setFishCycle((c) => c + 1);
    } else if (fishBiting === 'normal') {
      addScore(28, lang === 'ar' ? '🐠 صيد ممتاز! +28' : '🐠 NICE CATCH! +28');
      partyAudio.playCoin();
      setFishCycle((c) => c + 1);
    } else {
      addScore(-12, lang === 'ar' ? '⏳ مبكر جداً! -12' : '⏳ TOO EARLY! -12');
      partyAudio.playHit();
    }
  };

  // =================== #21: GOLDEN HAMMER SLAM ===================
  const [needlePos, setNeedlePos] = useState(50);
  const needleRef = useRef({ pos: 50, dir: 1, speed: 125 });

  useEffect(() => {
    if (gameId !== 'hammer_nail_bash') return;
    needleRef.current = { pos: 20, dir: 1, speed: 120 };
    let last = performance.now();
    let raf = 0;
    const loop = (ts: number) => {
      const dt = Math.min(0.05, (ts - last) / 1000);
      last = ts;
      const st = needleRef.current;
      st.pos += st.dir * st.speed * dt;
      if (st.pos >= 100) {
        st.pos = 100;
        st.dir = -1;
      } else if (st.pos <= 0) {
        st.pos = 0;
        st.dir = 1;
      }
      setNeedlePos(st.pos);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [gameId, seed]);

  const handleHammerSlam = () => {
    const dist = Math.abs(needleRef.current.pos - 50);
    if (dist <= 9) {
      addScore(45, lang === 'ar' ? '🔨 ضربة ذهبية مثالية! +45' : '🔨 GOLDEN BULLSEYE! +45');
      needleRef.current.speed = Math.min(250, needleRef.current.speed + 14);
      partyAudio.playStar();
    } else if (dist <= 22) {
      addScore(20, lang === 'ar' ? '🔨 ضربة جيدة +20' : '🔨 GOOD HIT +20');
      partyAudio.playCoin();
    } else {
      addScore(-10, lang === 'ar' ? '❌ أخطأت المنتصف -10' : '❌ MISSED CENTER -10');
      partyAudio.playHit();
    }
  };

  // =================== #22: MUSHROOM MIX-UP (COLOR DASH) ===================
  const [colorRound, setColorRound] = useState(0);
  const targetColorIdx = useMemo(() => {
    const rng = mulberry32(seed + 222 + colorRound * 29);
    return Math.floor(rng() * 4);
  }, [seed, colorRound]);

  const handleColorPick = (idx: number) => {
    if (idx === targetColorIdx) {
      addScore(26, lang === 'ar' ? '🍄 قفزة سريعة! +26' : '🍄 SAFE JUMP! +26');
      partyAudio.playCoin();
    } else {
      addScore(-18, lang === 'ar' ? '🔥 لون خاطئ! -18' : '🔥 WRONG COLOR! -18');
      partyAudio.playHit();
    }
    setColorRound((r) => r + 1);
  };

  // =================== #23: HOT BOB-OMB RELAY ===================
  const [bombRound, setBombRound] = useState(0);
  const [bombStep, setBombStep] = useState(0);
  const bombSeq = useMemo(() => {
    const rng = mulberry32(seed + 233 + bombRound * 43);
    return [Math.floor(rng() * 4), Math.floor(rng() * 4), Math.floor(rng() * 4)];
  }, [seed, bombRound]);

  const handleBombSymbol = (symId: number) => {
    if (bombSeq[bombStep] === symId) {
      if (bombStep === 2) {
        addScore(36, lang === 'ar' ? '💣 تم تمرير القنبلة! +36' : '💣 BOMB PASSED! +36');
        partyAudio.playStar();
        setBombStep(0);
        setBombRound((r) => r + 1);
      } else {
        setBombStep((s) => s + 1);
        partyAudio.playSelect();
      }
    } else {
      addScore(-12, lang === 'ar' ? '⚡ سلك خاطئ! -12' : '⚡ WRONG WIRE! -12');
      setBombStep(0);
      partyAudio.playHit();
    }
  };

  // Keyboard shortcuts for Space / 1-9 / A-S-D-F
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (gameId === 'balloon_pump_burst') handlePump();
        else if (gameId === 'cheep_fishing') handleFishYank();
        else if (gameId === 'hammer_nail_bash') handleHammerSlam();
      } else if (gameId === 'star_rhythm_beat') {
        const lane = RHYTHM_KEYS.indexOf(e.code as (typeof RHYTHM_KEYS)[number]);
        if (lane !== -1) handleBeatLane(lane);
      } else if (gameId === 'whack_goomba' && e.key >= '1' && e.key <= '9') {
        handleWhack(Number(e.key) - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="w-full max-w-[740px] mx-auto flex flex-col gap-3">
      {/* Top Mini-Game HUD */}
      <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-900/95 border border-white/15">
        <div className="flex items-center gap-2.5">
          <HeroAvatarSvg characterId={characterId} size={34} />
          <div>
            <div className="font-bold text-amber-300 text-sm sm:text-base leading-tight">
              {lang === 'ar' ? spec.nameAr : spec.nameEn}
            </div>
            {feedback && <div className="text-xs font-bold text-emerald-300">{feedback}</div>}
          </div>
        </div>
        <div className="flex items-center gap-4 font-mono tabular-nums text-base sm:text-lg">
          <span className="text-amber-300 font-extrabold">{score} pts</span>
          <span className="text-cyan-300 font-bold">{timeLeft}s</span>
        </div>
      </div>

      {/* Main Interactive Arena */}
      <div className="rounded-2xl border-2 border-amber-400/45 bg-slate-950/95 p-4 sm:p-6 min-h-[340px] flex flex-col items-center justify-center shadow-2xl">
        {/* #5: BALLOON PUMP */}
        {gameId === 'balloon_pump_burst' && (
          <div className="flex flex-col items-center gap-4 w-full max-w-md">
            <div className="relative h-44 flex items-center justify-center">
              <div
                style={{
                  transform: `scale(${0.55 + (balloonFill / 100) * 0.95})`,
                  transition: 'transform 80ms ease-out',
                }}
                className="w-28 h-28 rounded-full bg-gradient-to-br from-rose-400 via-red-600 to-amber-500 border-4 border-amber-200 flex items-center justify-center text-3xl font-black text-white shadow-2xl"
              >
                {balloonFill}%
              </div>
            </div>
            <div className="w-full">
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>{lang === 'ar' ? 'حرارة المنفاخ' : 'Pump Heat'}</span>
                <span className={overheated ? 'text-rose-400 font-bold' : 'text-amber-300'}>
                  {pumpHeat}%
                </span>
              </div>
              <div className="h-3 rounded-full bg-slate-800 overflow-hidden">
                <div
                  style={{ width: `${pumpHeat}%` }}
                  className={`h-full transition-all ${overheated ? 'bg-rose-500' : 'bg-amber-400'}`}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handlePump}
              className={`w-full py-4 rounded-xl font-black text-xl transition-transform active:scale-95 cursor-pointer ${
                overheated
                  ? 'bg-slate-700 text-slate-400'
                  : 'bg-gradient-to-b from-amber-300 to-orange-500 text-slate-950 shadow-lg'
              }`}
            >
              {overheated
                ? lang === 'ar'
                  ? '🔥 انتظر التبريد...'
                  : '🔥 COOLING DOWN...'
                : lang === 'ar'
                ? '💨 اضغط للنفخ! (مسافة)'
                : '💨 PUMP FAST! (SPACE)'}
            </button>
          </div>
        )}

        {/* #7: WHACK-A-GOOMBA */}
        {gameId === 'whack_goomba' && (
          <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full max-w-md">
            {pipePops.map((pop, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleWhack(idx)}
                className="relative h-24 sm:h-28 rounded-2xl bg-gradient-to-b from-emerald-500 to-emerald-800 border-4 border-emerald-950 flex flex-col items-center justify-center active:scale-95 transition-transform cursor-pointer shadow-lg"
              >
                <div className="w-full h-3 bg-emerald-300/60 absolute top-0 left-0 rounded-t-xl" />
                {pop === 'goomba' && <span className="text-4xl">🍄</span>}
                {pop === 'gold' && <span className="text-4xl">⭐</span>}
                {pop === 'bomb' && <span className="text-4xl">💣</span>}
                {pop === 'none' && <span className="text-xs font-mono text-emerald-200/50">{idx + 1}</span>}
              </button>
            ))}
          </div>
        )}

        {/* #8: STAR PANEL MEMORY */}
        {gameId === 'mushroom_memory' && (
          <div className="w-full max-w-md flex flex-col items-center gap-3">
            <div className="text-sm font-bold text-amber-200">
              {memShowing
                ? lang === 'ar'
                  ? '👀 احفظ مواقع النجوم الآن!'
                  : '👀 MEMORIZE THE STAR TILES!'
                : lang === 'ar'
                ? '⭐ اضغط على جميع مربعات النجوم!'
                : '⭐ TAP EVERY SUPER STAR TILE!'}
            </div>
            <div className="grid grid-cols-4 gap-2.5 w-full">
              {Array.from({ length: 12 }, (_, idx) => {
                const isStar = memStars.includes(idx);
                const revealed = memShowing || memRevealed.includes(idx);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleMemTap(idx)}
                    className={`h-20 rounded-xl border-2 text-2xl font-black transition-all active:scale-95 cursor-pointer ${
                      revealed
                        ? isStar
                          ? 'bg-amber-400 border-amber-200 text-slate-950'
                          : 'bg-rose-900 border-rose-500 text-white'
                        : 'bg-indigo-700 hover:bg-indigo-600 border-indigo-400 text-amber-200'
                    }`}
                  >
                    {revealed ? (isStar ? '★' : '💣') : '?'}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* #11: COUNT THE TOADS */}
        {gameId === 'count_toads' && (
          <div className="w-full max-w-lg flex flex-col gap-4">
            <div className="relative h-48 rounded-xl bg-gradient-to-b from-sky-700 to-emerald-800 border-2 border-white/20 overflow-hidden">
              {countData.items.map((item) => (
                <div
                  key={item.id}
                  style={{ left: `${item.x}%`, top: `${item.y}%` }}
                  className="absolute text-3xl sm:text-4xl select-none"
                >
                  {item.isToad ? '🍄' : '🐢'}
                </div>
              ))}
            </div>
            <div className="text-center text-sm font-bold text-amber-200">
              {lang === 'ar' ? 'كم عدد الفطر 🍄 بالصورة؟' : 'How many Toad Mushrooms 🍄 are on stage?'}
            </div>
            <div className="grid grid-cols-4 gap-3">
              {countData.options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleCountPick(opt)}
                  className="py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-2xl font-mono cursor-pointer"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* #12: TREASURE BRICK SMASH */}
        {gameId === 'brick_smash_rush' && (
          <div className="grid grid-cols-4 gap-2.5 w-full max-w-lg">
            {bricks.map((b, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleBrickTap(idx)}
                disabled={b.hp <= 0}
                className={`h-20 rounded-xl border-2 text-2xl font-black transition-transform active:scale-90 cursor-pointer ${
                  b.hp <= 0
                    ? 'bg-slate-900/50 border-slate-800 text-amber-300'
                    : b.kind === 'star'
                    ? 'bg-gradient-to-b from-amber-400 to-amber-600 border-yellow-200 text-slate-950'
                    : 'bg-gradient-to-b from-orange-600 to-amber-900 border-amber-400/60 text-amber-100'
                }`}
              >
                {b.hp <= 0 ? (b.kind === 'star' ? '★' : b.kind === 'coin' ? '🪙' : '·') : b.hp === 2 ? '🧱' : '?'}
              </button>
            ))}
          </div>
        )}

        {/* #16: STAR RHYTHM BEAT */}
        {gameId === 'star_rhythm_beat' && (
          <div className="w-full max-w-md flex flex-col gap-3">
            <div className="relative h-60 grid grid-cols-4 gap-2 rounded-xl bg-slate-900 border border-white/15 p-2 overflow-hidden">
              {/* Target Hit Line */}
              <div
                style={{ top: '82%' }}
                className="absolute left-0 right-0 h-2 bg-amber-400/75 pointer-events-none"
              />
              {[0, 1, 2, 3].map((lane) => (
                <div key={lane} className="relative h-full bg-slate-950/75 rounded-lg">
                  {notes
                    .filter((n) => n.lane === lane)
                    .map((n) => (
                      <div
                        key={n.id}
                        style={{ top: `${n.y}%`, backgroundColor: RHYTHM_COLORS[lane] }}
                        className="absolute left-2 right-2 h-6 -translate-y-1/2 rounded-full border-2 border-white flex items-center justify-center text-xs font-black text-slate-950"
                      >
                        ★
                      </div>
                    ))}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[0, 1, 2, 3].map((lane) => (
                <button
                  key={lane}
                  type="button"
                  onPointerDown={() => handleBeatLane(lane)}
                  style={{ backgroundColor: RHYTHM_COLORS[lane] }}
                  className="py-4 rounded-xl text-slate-950 font-black text-lg active:scale-95 cursor-pointer shadow-lg"
                >
                  {RHYTHM_LABELS[lane]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* #17: CHEEP-CHEEP FISHING */}
        {gameId === 'cheep_fishing' && (
          <div className="w-full max-w-md flex flex-col items-center gap-5">
            <div
              className={`w-full h-44 rounded-2xl border-2 flex flex-col items-center justify-center transition-colors ${
                fishBiting === 'gold'
                  ? 'bg-amber-500/30 border-amber-300'
                  : fishBiting === 'normal'
                  ? 'bg-emerald-500/25 border-emerald-300'
                  : 'bg-sky-950 border-sky-700/60'
              }`}
            >
              <div className="text-5xl mb-2">
                {fishBiting === 'gold' ? '🌟🐟' : fishBiting === 'normal' ? '🐠💦' : '🎣'}
              </div>
              <div className="text-lg font-extrabold text-white">
                {fishBiting === 'gold'
                  ? lang === 'ar'
                    ? 'سمكة ذهبية! اسحب الآن!!'
                    : 'GOLDEN BITE! REEL NOW!!'
                  : fishBiting === 'normal'
                  ? lang === 'ar'
                    ? 'علقت سمكة! اسحب الآن!'
                    : 'BITE! REEL IT IN!'
                  : lang === 'ar'
                  ? 'انتظر حركة العوّامة...'
                  : 'Wait for the bobber splash...'}
              </div>
            </div>
            <button
              type="button"
              onClick={handleFishYank}
              className="w-full py-4 rounded-xl bg-gradient-to-b from-cyan-300 to-sky-500 hover:from-cyan-200 hover:to-sky-400 active:scale-95 text-slate-950 font-black text-xl cursor-pointer"
            >
              {lang === 'ar' ? '🎣 اسحب السنارة! (مسافة)' : '🎣 YANK LINE! (SPACE)'}
            </button>
          </div>
        )}

        {/* #21: GOLDEN HAMMER SLAM */}
        {gameId === 'hammer_nail_bash' && (
          <div className="w-full max-w-md flex flex-col items-center gap-6">
            <div className="text-5xl">🔨⭐</div>
            <div className="relative w-full h-12 rounded-xl bg-slate-800 border-2 border-white/20 overflow-hidden">
              {/* Green zone & Golden sweet spot */}
              <div className="absolute inset-y-0 left-[28%] right-[28%] bg-emerald-500/40" />
              <div className="absolute inset-y-0 left-[41%] right-[41%] bg-amber-400/85" />
              {/* Moving Needle */}
              <div
                style={{ left: `${needlePos}%` }}
                className="absolute top-0 bottom-0 w-2 -translate-x-1/2 bg-white shadow-lg"
              />
            </div>
            <button
              type="button"
              onClick={handleHammerSlam}
              className="w-full py-4 rounded-xl bg-gradient-to-b from-amber-300 to-orange-500 active:scale-95 text-slate-950 font-black text-xl cursor-pointer"
            >
              {lang === 'ar' ? '🔨 اضرب بالمطرقة! (مسافة)' : '🔨 SLAM HAMMER! (SPACE)'}
            </button>
          </div>
        )}

        {/* #22: MUSHROOM COLOR DASH */}
        {gameId === 'mushroom_color_dash' && (
          <div className="w-full max-w-md flex flex-col items-center gap-5">
            <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-slate-900 border border-white/20">
              <span className="text-sm font-bold text-slate-300">
                {lang === 'ar' ? 'اقفز على لون العلم:' : 'JUMP TO FLAG COLOR:'}
              </span>
              <span
                style={{ backgroundColor: MUSHROOM_COLORS[targetColorIdx].bg }}
                className="px-4 py-1.5 rounded-lg font-black text-slate-950 text-base"
              >
                {lang === 'ar'
                  ? MUSHROOM_COLORS[targetColorIdx].ar
                  : MUSHROOM_COLORS[targetColorIdx].en}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3.5 w-full">
              {MUSHROOM_COLORS.map((col, idx) => (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => handleColorPick(idx)}
                  style={{ backgroundColor: col.bg }}
                  className="h-28 rounded-2xl border-4 border-white/80 text-slate-950 font-black text-xl active:scale-95 transition-transform cursor-pointer shadow-xl flex flex-col items-center justify-center"
                >
                  <span className="text-3xl">🍄</span>
                  <span>{lang === 'ar' ? col.ar : col.en}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* #23: HOT BOB-OMB RELAY */}
        {gameId === 'bob_omb_pass' && (
          <div className="w-full max-w-md flex flex-col items-center gap-5">
            <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-900 border-2 border-rose-500/60 w-full">
              <div className="text-4xl">💣🔥</div>
              <div className="flex items-center gap-3">
                {bombSeq.map((symIdx, idx) => {
                  const sym = BOMB_SYMBOLS[symIdx];
                  const cleared = idx < bombStep;
                  return (
                    <div
                      key={idx}
                      style={{
                        borderColor: cleared ? '#22c55e' : sym.color,
                        color: cleared ? '#22c55e' : sym.color,
                      }}
                      className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center text-3xl font-black ${
                        cleared ? 'bg-emerald-950/60' : 'bg-slate-950'
                      }`}
                    >
                      {cleared ? '✓' : sym.label}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3 w-full">
              {BOMB_SYMBOLS.map((sym) => (
                <button
                  key={sym.id}
                  type="button"
                  onClick={() => handleBombSymbol(sym.id)}
                  style={{ borderColor: sym.color, color: sym.color }}
                  className="py-5 rounded-xl bg-slate-900 hover:bg-slate-800 border-2 text-3xl font-black active:scale-95 cursor-pointer"
                >
                  {sym.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="text-center text-xs text-slate-400">
        {lang === 'ar' ? spec.controlsAr : spec.controlsEn}
      </div>
    </div>
  );
};
