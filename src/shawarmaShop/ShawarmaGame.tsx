import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  DrinkId,
  readShawarmaSoundEnabled,
  saveShawarmaSoundEnabled,
  ShawarmaHudSnapshot,
  ToppingId,
} from './types';
import { ShawarmaAudio } from './audio';
import {
  actionAddMeatToWrap,
  actionChopPotatoes,
  actionClearWorkbench,
  actionPlaceBread,
  actionPurchaseShopItem,
  actionSelectDrink,
  actionSliceSpit,
  actionToggleTopping,
  actionWrapAndServe,
  createInitialShawarmaWorld,
  extractShawarmaHud,
  restartDayShift,
  ShawarmaWorld,
  ShopUpgradeId,
  startShiftDay,
} from './gameLogic';
import { ShawarmaScene } from './ShawarmaScene';
import { ShawarmaUI } from './ShawarmaUI';

export interface ShawarmaGameProps {
  lang: 'ar' | 'en';
  onExit: () => void;
}

/**
 * Custom vector preview artwork for the Games Hub card ("ملك الشاورما 3D")
 */
export const ShawarmaPreviewArt: React.FC = () => (
  <svg
    viewBox="0 0 320 160"
    className="w-full h-full block"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="shBg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#3b1824" />
        <stop offset="100%" stopColor="#1e1017" />
      </linearGradient>
    </defs>

    <rect width="320" height="160" fill="url(#shBg)" />

    {/* Striped Red & Cream Street-Food Awning */}
    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
      <rect
        key={i}
        x={i * 40}
        y="0"
        width="40"
        height="26"
        fill={i % 2 === 0 ? '#dc2626' : '#fef3c7'}
      />
    ))}

    {/* Warm Countertop */}
    <rect x="0" y="114" width="320" height="46" fill="#c48d56" />
    <rect x="0" y="114" width="320" height="6" fill="#e5b884" />

    {/* Rotating Vertical Shawarma Spit Machine (Left) */}
    <rect x="30" y="42" width="54" height="72" rx="5" fill="#94a3b8" />
    <rect x="40" y="52" width="34" height="10" rx="2" fill="#ff5722" />
    <rect x="40" y="68" width="34" height="10" rx="2" fill="#ff5722" />
    <rect x="40" y="84" width="34" height="10" rx="2" fill="#ff5722" />
    <polygon
      points="40,54 74,54 66,104 48,104"
      fill="#9a411a"
      stroke="#6c2a0e"
      strokeWidth="2"
    />
    <line x1="42" y1="64" x2="72" y2="64" stroke="#7c3214" strokeWidth="2" />
    <line x1="44" y1="76" x2="70" y2="76" stroke="#7c3214" strokeWidth="2" />
    <line x1="46" y1="88" x2="68" y2="88" stroke="#7c3214" strokeWidth="2" />
    <circle cx="57" cy="49" r="7" fill="#dc2626" />

    {/* Freshly Wrapped 3D Shawarma Sandwich in Center */}
    <g transform="translate(168, 108) rotate(-14)">
      <rect
        x="-42"
        y="-15"
        width="84"
        height="30"
        rx="14"
        fill="#e6b66e"
        stroke="#a16207"
        strokeWidth="2"
      />
      <rect
        x="-42"
        y="-16"
        width="48"
        height="32"
        rx="6"
        fill="#f8fafc"
        stroke="#cbd5e1"
        strokeWidth="1.5"
      />
      <rect x="-2" y="-16" width="8" height="32" fill="#dc2626" />
      <circle cx="30" cy="-4" r="5" fill="#7c3214" />
      <circle cx="32" cy="4" r="4.5" fill="#22c55e" />
      <circle cx="24" cy="0" r="4" fill="#fffbeb" />
    </g>

    {/* Iconic Sun Top Orange Juice Box & Golden Coin on Right */}
    <g transform="translate(244, 72)">
      <rect
        x="0"
        y="10"
        width="26"
        height="36"
        rx="3"
        fill="#f97316"
        stroke="#fed7aa"
        strokeWidth="1.5"
      />
      <rect x="4" y="20" width="18" height="12" rx="2" fill="#fef08a" />
      <line
        x1="18"
        y1="10"
        x2="23"
        y2="0"
        stroke="#fde047"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </g>
    <circle
      cx="288"
      cy="66"
      r="13"
      fill="#fbbf24"
      stroke="#fef08a"
      strokeWidth="2.5"
    />
    <text
      x="288"
      y="71"
      textAnchor="middle"
      fill="#78350f"
      fontSize="12"
      fontWeight="900"
    >
      ﷼
    </text>
  </svg>
);

export const ShawarmaGame: React.FC<ShawarmaGameProps> = ({ lang, onExit }) => {
  const worldRef = useRef<ShawarmaWorld>(createInitialShawarmaWorld(lang));
  const audioRef = useRef<ShawarmaAudio>(new ShawarmaAudio());

  worldRef.current.lang = lang;

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = readShawarmaSoundEnabled();
    audioRef.current.setEnabled(saved);
    return saved;
  });

  const [hud, setHud] = useState<ShawarmaHudSnapshot>(() =>
    extractShawarmaHud(worldRef.current)
  );

  const syncHud = useCallback(() => {
    setHud(extractShawarmaHud(worldRef.current));
  }, []);

  const handleStart = useCallback(() => {
    startShiftDay(worldRef.current, worldRef.current.day);
    audioRef.current.setEnabled(soundEnabled);
    if (soundEnabled) audioRef.current.startMusic();
    syncHud();
  }, [soundEnabled, syncHud]);

  const handleRestartDay = useCallback(() => {
    restartDayShift(worldRef.current);
    audioRef.current.setEnabled(soundEnabled);
    if (soundEnabled) audioRef.current.startMusic();
    syncHud();
  }, [soundEnabled, syncHud]);

  const handleNextDay = useCallback(() => {
    startShiftDay(worldRef.current, worldRef.current.day + 1);
    if (soundEnabled) audioRef.current.startMusic();
    syncHud();
  }, [soundEnabled, syncHud]);

  const handlePause = useCallback(() => {
    if (worldRef.current.status !== 'PLAYING') return;
    worldRef.current.status = 'PAUSED';
    audioRef.current.stopMusic();
    syncHud();
  }, [syncHud]);

  const handleResume = useCallback(() => {
    if (worldRef.current.status !== 'PAUSED') return;
    worldRef.current.status = 'PLAYING';
    if (soundEnabled) audioRef.current.startMusic();
    syncHud();
  }, [soundEnabled, syncHud]);

  const handleToggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      saveShawarmaSoundEnabled(next);
      audioRef.current.setEnabled(next);
      if (next && worldRef.current.status === 'PLAYING') {
        audioRef.current.startMusic();
      }
      return next;
    });
  }, []);

  const handleSliceSpit = useCallback(() => {
    actionSliceSpit(worldRef.current, audioRef.current);
    syncHud();
  }, [syncHud]);

  const handleChopPotatoes = useCallback(() => {
    actionChopPotatoes(worldRef.current, audioRef.current);
    syncHud();
  }, [syncHud]);

  const handlePlaceBread = useCallback(() => {
    actionPlaceBread(worldRef.current, audioRef.current);
    syncHud();
  }, [syncHud]);

  const handleAddMeat = useCallback(() => {
    actionAddMeatToWrap(worldRef.current, audioRef.current);
    syncHud();
  }, [syncHud]);

  const handleToggleTopping = useCallback(
    (tp: ToppingId) => {
      actionToggleTopping(worldRef.current, tp, audioRef.current);
      syncHud();
    },
    [syncHud]
  );

  const handleSelectDrink = useCallback(
    (dk: DrinkId) => {
      actionSelectDrink(worldRef.current, dk, audioRef.current);
      syncHud();
    },
    [syncHud]
  );

  const handleClearBoard = useCallback(() => {
    actionClearWorkbench(worldRef.current);
    syncHud();
  }, [syncHud]);

  const handleServe = useCallback(
    (slot?: 0 | 1 | 2) => {
      actionWrapAndServe(worldRef.current, audioRef.current, slot);
      syncHud();
    },
    [syncHud]
  );

  const handleBuyShopItem = useCallback(
    (item: ShopUpgradeId) => {
      if (actionPurchaseShopItem(worldRef.current, item, audioRef.current)) {
        syncHud();
      }
    },
    [syncHud]
  );

  // Desktop keyboard shortcuts: Q slice spit, E chop potatoes, 1-8 ingredients, 9/0 drinks, Space/Enter serve
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const world = worldRef.current;
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (world.status === 'PLAYING') {
          e.preventDefault();
          handlePause();
        } else if (world.status === 'PAUSED') {
          e.preventDefault();
          handleResume();
        }
        return;
      }
      if (world.status !== 'PLAYING') return;
      if (e.code === 'KeyQ') handleSliceSpit();
      else if (e.code === 'KeyE') handleChopPotatoes();
      else if (e.key === '1') handlePlaceBread();
      else if (e.key === '2') handleAddMeat();
      else if (e.key === '3') handleToggleTopping('garlic');
      else if (e.key === '4') handleToggleTopping('pickles');
      else if (e.key === '5') handleToggleTopping('fries');
      else if (e.key === '6') handleToggleTopping('spicy');
      else if (e.key === '7' && world.upgrades.unlockPomegranate)
        handleToggleTopping('pomegranate');
      else if (e.key === '8' && world.upgrades.unlockCheese)
        handleToggleTopping('cheese');
      else if (e.key === '9' && world.upgrades.unlockSuntop)
        handleSelectDrink('suntop');
      else if (e.key === '0' && world.upgrades.unlockAyran)
        handleSelectDrink('ayran');
      else if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleServe();
      } else if (e.code === 'Backspace') {
        e.preventDefault();
        handleClearBoard();
      }
    };

    const onHide = () => {
      if (document.hidden && worldRef.current.status === 'PLAYING') {
        handlePause();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [
    handlePause,
    handleResume,
    handleSliceSpit,
    handleChopPotatoes,
    handlePlaceBread,
    handleAddMeat,
    handleToggleTopping,
    handleSelectDrink,
    handleServe,
    handleClearBoard,
  ]);

  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      audio.dispose();
    };
  }, []);

  return (
    <div
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-50 w-full h-full bg-[#2b1b2d] overflow-hidden"
    >
      <ShawarmaScene
        worldRef={worldRef}
        audioRef={audioRef}
        onHudUpdate={setHud}
      />
      <ShawarmaUI
        lang={lang}
        hud={hud}
        soundEnabled={soundEnabled}
        onStart={handleStart}
        onNextDay={handleNextDay}
        onPause={handlePause}
        onResume={handleResume}
        onRestart={handleRestartDay}
        onToggleSound={handleToggleSound}
        onSliceSpit={handleSliceSpit}
        onChopPotatoes={handleChopPotatoes}
        onPlaceBread={handlePlaceBread}
        onAddMeat={handleAddMeat}
        onToggleTopping={handleToggleTopping}
        onSelectDrink={handleSelectDrink}
        onClearBoard={handleClearBoard}
        onServe={handleServe}
        onBuyShopItem={handleBuyShopItem}
        onExit={onExit}
      />
    </div>
  );
};
