import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PlantMergeAudio } from './audio';
import {
  actionBuyAndPlant,
  actionInteractPlot,
  actionSellSelectedPlant,
  actionToggleSpeed,
  actionUpgradePower,
  actionWaterBoost,
  createInitialPlantMergeWorld,
  extractPlantMergeHud,
  PlantMergeWorld,
  resumeSavedPlantMergeRun,
  savePlantMergeWorldNow,
  startNewPlantMergeRun,
} from './gameLogic';
import { PlantMergeScene } from './PlantMergeScene';
import { PlantMergeUI } from './PlantMergeUI';
import {
  PlantMergeHudSnapshot,
  PlantTier,
  readPlantMergeSoundEnabled,
  savePlantMergeSoundEnabled,
} from './types';

export interface PlantMergeGameProps {
  lang: 'ar' | 'en';
  onExit: () => void;
}

/**
 * Custom vector preview artwork for the Games Hub card
 */
export const PlantMergePreviewArt: React.FC = () => (
  <svg
    viewBox="0 0 320 160"
    className="w-full h-full block"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="pmSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="58%" stopColor="#7dd3fc" />
        <stop offset="59%" stopColor="#3f8f3b" />
        <stop offset="100%" stopColor="#1e4d23" />
      </linearGradient>
    </defs>

    <rect width="320" height="160" fill="url(#pmSky)" />

    {/* Warm Sun */}
    <circle cx="48" cy="34" r="18" fill="#fef08a" opacity="0.95" />
    <circle cx="48" cy="34" r="26" fill="#fde047" opacity="0.25" />

    {/* Raised Garden Soil Plots (Left & Center) */}
    <rect x="24" y="102" width="70" height="34" rx="6" fill="#7c4a26" stroke="#b47d48" strokeWidth="3" />
    <rect x="104" y="102" width="70" height="34" rx="6" fill="#6b3e1e" stroke="#facc15" strokeWidth="3" />

    {/* Hero Plant 1: Pea Sprout */}
    <rect x="55" y="84" width="8" height="24" rx="3" fill="#16a34a" />
    <circle cx="59" cy="76" r="14" fill="#4ade80" stroke="#15803d" strokeWidth="2" />
    <rect x="70" y="71" width="12" height="10" rx="3" fill="#15803d" />
    <circle cx="64" cy="72" r="2.5" fill="#0f172a" />

    {/* Hero Plant 2: Evolved Crystal Sunflower */}
    <rect x="135" y="76" width="9" height="32" rx="3" fill="#15803d" />
    <circle cx="139" cy="64" r="19" fill="#facc15" stroke="#ca8a04" strokeWidth="2.5" />
    <circle cx="139" cy="64" r="10" fill="#92400e" />
    <polygon points="139,34 146,46 132,46" fill="#34d399" />

    {/* Flying Glowing Energy Bolt */}
    <circle cx="192" cy="70" r="7" fill="#fef08a" />
    <circle cx="177" cy="70" r="4" fill="#38bdf8" opacity="0.8" />

    {/* Monster Portal Glow on Far Right */}
    <ellipse cx="298" cy="96" rx="18" ry="38" fill="#581c87" stroke="#c084fc" strokeWidth="3" />

    {/* Approaching Boss / Monster on Right */}
    <g transform="translate(244, 90)">
      <rect x="-18" y="-12" width="36" height="38" rx="8" fill="#312e81" stroke="#a855f7" strokeWidth="2" />
      <polygon points="-14,-12 -22,-26 -6,-14" fill="#ef4444" />
      <polygon points="14,-12 22,-26 6,-14" fill="#ef4444" />
      <circle cx="-7" cy="0" r="3.5" fill="#fde047" />
      <circle cx="5" cy="0" r="3.5" fill="#fde047" />
      <polygon points="0,12 6,19 0,24 -6,19" fill="#f97316" />
    </g>
  </svg>
);

export const PlantMergeGame: React.FC<PlantMergeGameProps> = ({
  lang,
  onExit,
}) => {
  const worldRef = useRef<PlantMergeWorld>(createInitialPlantMergeWorld(lang));
  const audioRef = useRef<PlantMergeAudio>(new PlantMergeAudio());

  worldRef.current.lang = lang;

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = readPlantMergeSoundEnabled();
    audioRef.current.setEnabled(saved);
    return saved;
  });

  const [shopOpen, setShopOpen] = useState(false);
  const [indexOpen, setIndexOpen] = useState(false);

  const [hud, setHud] = useState<PlantMergeHudSnapshot>(() =>
    extractPlantMergeHud(worldRef.current)
  );

  const syncHud = useCallback(() => {
    setHud(extractPlantMergeHud(worldRef.current));
  }, []);

  const handleOpenShop = useCallback(() => {
    if (worldRef.current.status !== 'PLAYING') return;
    setIndexOpen(false);
    setShopOpen(true);
  }, []);

  const handleCloseShop = useCallback(() => {
    setShopOpen(false);
  }, []);

  const handleOpenIndex = useCallback(() => {
    setShopOpen(false);
    setIndexOpen(true);
  }, []);

  const handleCloseIndex = useCallback(() => {
    setIndexOpen(false);
  }, []);

  const handleContinueSaved = useCallback(() => {
    setShopOpen(false);
    setIndexOpen(false);
    resumeSavedPlantMergeRun(worldRef.current, audioRef.current);
    audioRef.current.setEnabled(soundEnabled);
    if (soundEnabled) audioRef.current.startMusic();
    syncHud();
  }, [soundEnabled, syncHud]);

  const handleStartNew = useCallback(() => {
    setShopOpen(false);
    setIndexOpen(false);
    startNewPlantMergeRun(worldRef.current, audioRef.current);
    audioRef.current.setEnabled(soundEnabled);
    if (soundEnabled) audioRef.current.startMusic();
    syncHud();
  }, [soundEnabled, syncHud]);

  const handlePause = useCallback(() => {
    if (worldRef.current.status !== 'PLAYING') return;
    setShopOpen(false);
    worldRef.current.status = 'PAUSED';
    savePlantMergeWorldNow(worldRef.current);
    audioRef.current.stopMusic();
    syncHud();
  }, [syncHud]);

  const handleResume = useCallback(() => {
    if (worldRef.current.status !== 'PAUSED') return;
    worldRef.current.status = 'PLAYING';
    if (soundEnabled) audioRef.current.startMusic();
    syncHud();
  }, [soundEnabled, syncHud]);

  const handleExitWithSave = useCallback(() => {
    if (worldRef.current.status !== 'START' || worldRef.current.hasSavedGarden) {
      savePlantMergeWorldNow(worldRef.current);
    }
    audioRef.current.stopMusic();
    onExit();
  }, [onExit]);

  const handleToggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      savePlantMergeSoundEnabled(next);
      audioRef.current.setEnabled(next);
      if (next && worldRef.current.status === 'PLAYING') {
        audioRef.current.startMusic();
      }
      return next;
    });
  }, []);

  const handleSelectPlot = useCallback(
    (row: number, col: number) => {
      if (actionInteractPlot(worldRef.current, row, col, audioRef.current)) {
        syncHud();
      } else {
        syncHud();
      }
    },
    [syncHud]
  );

  const handleQuickBuyPlant = useCallback(() => {
    actionBuyAndPlant(
      worldRef.current,
      audioRef.current,
      worldRef.current.selectedShopTier
    );
    syncHud();
  }, [syncHud]);

  const handleBuySpecificPlant = useCallback(
    (tier: PlantTier) => {
      const ok = actionBuyAndPlant(worldRef.current, audioRef.current, tier);
      syncHud();
      if (ok) {
        setShopOpen(false);
      }
    },
    [syncHud]
  );

  const handleSellSelectedPlant = useCallback(() => {
    if (actionSellSelectedPlant(worldRef.current, audioRef.current)) {
      syncHud();
    }
  }, [syncHud]);

  const handleWaterBoost = useCallback(() => {
    if (actionWaterBoost(worldRef.current, audioRef.current)) {
      syncHud();
    }
  }, [syncHud]);

  const handleUpgradePower = useCallback(() => {
    if (actionUpgradePower(worldRef.current, audioRef.current)) {
      syncHud();
    }
  }, [syncHud]);

  const handleToggleSpeed = useCallback(() => {
    actionToggleSpeed(worldRef.current);
    syncHud();
  }, [syncHud]);

  // Close shop automatically if house eating finale / game over triggers
  useEffect(() => {
    if (hud.status !== 'PLAYING' && shopOpen) {
      setShopOpen(false);
    }
  }, [hud.status, shopOpen]);

  // Desktop keyboard shortcuts + auto-save on tab hide / beforeunload
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const world = worldRef.current;
      if (e.code === 'Escape') {
        if (shopOpen) {
          e.preventDefault();
          setShopOpen(false);
          return;
        }
        if (indexOpen) {
          e.preventDefault();
          setIndexOpen(false);
          return;
        }
        if (world.status === 'PLAYING') {
          e.preventDefault();
          handlePause();
        } else if (world.status === 'PAUSED') {
          e.preventDefault();
          handleResume();
        }
        return;
      }
      if (e.code === 'KeyP') {
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
      if (e.code === 'Space' || e.code === 'KeyQ') {
        e.preventDefault();
        handleQuickBuyPlant();
      } else if (e.code === 'KeyB' || e.code === 'KeyS') {
        setIndexOpen(false);
        setShopOpen((v) => !v);
      } else if (e.code === 'KeyI') {
        setShopOpen(false);
        setIndexOpen((v) => !v);
      } else if (e.code === 'KeyW') {
        handleWaterBoost();
      } else if (e.code === 'Delete' || e.code === 'Backspace') {
        handleSellSelectedPlant();
      }
    };

    const onHide = () => {
      if (document.hidden && worldRef.current.status === 'PLAYING') {
        handlePause();
      }
    };

    const onBeforeUnload = () => {
      if (worldRef.current.status !== 'START' || worldRef.current.hasSavedGarden) {
        savePlantMergeWorldNow(worldRef.current);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [
    shopOpen,
    indexOpen,
    handlePause,
    handleResume,
    handleQuickBuyPlant,
    handleWaterBoost,
    handleSellSelectedPlant,
  ]);

  useEffect(() => {
    const audio = audioRef.current;
    const world = worldRef.current;
    return () => {
      if (world.status !== 'START' || world.hasSavedGarden) {
        savePlantMergeWorldNow(world);
      }
      audio.dispose();
    };
  }, []);

  return (
    <div
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-50 w-full h-full bg-[#1a3320] overflow-hidden"
    >
      <PlantMergeScene
        worldRef={worldRef}
        audioRef={audioRef}
        onHudUpdate={setHud}
        onSelectPlot={handleSelectPlot}
        onOpenShop={handleOpenShop}
      />
      <PlantMergeUI
        lang={lang}
        hud={hud}
        soundEnabled={soundEnabled}
        shopOpen={shopOpen}
        indexOpen={indexOpen}
        onOpenShop={handleOpenShop}
        onCloseShop={handleCloseShop}
        onOpenIndex={handleOpenIndex}
        onCloseIndex={handleCloseIndex}
        onContinueSaved={handleContinueSaved}
        onStartNew={handleStartNew}
        onPause={handlePause}
        onResume={handleResume}
        onToggleSound={handleToggleSound}
        onQuickBuyPlant={handleQuickBuyPlant}
        onBuySpecificPlant={handleBuySpecificPlant}
        onSellSelectedPlant={handleSellSelectedPlant}
        onWaterBoost={handleWaterBoost}
        onUpgradePower={handleUpgradePower}
        onToggleSpeed={handleToggleSpeed}
        onExit={handleExitWithSave}
      />
    </div>
  );
};
