import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MonsterArenaAudio } from './audio';
import {
  actionBuyFruit,
  actionBuyOrEquipWeapon,
  actionBuyPet,
  actionClearPetSelection,
  actionMergeAllPets,
  actionMergePetPair,
  actionMoveOrMergeSlot,
  actionMoveSelectedPetToArenaPoint,
  actionRecallAllPets,
  actionSelectOrMerge3DPet,
  actionTriggerDash,
  createInitialMonsterArenaWorld,
  extractMonsterArenaHud,
  MonsterArenaInput,
  MonsterArenaWorld,
  resumeMonsterArenaRun,
  saveMonsterArenaNow,
  startNewMonsterArenaRun,
} from './gameLogic';
import { MonsterArenaScene } from './MonsterArenaScene';
import { ArenaShopTab, MonsterArenaUI } from './MonsterArenaUI';
import {
  FruitId,
  MonsterArenaHudSnapshot,
  PetId,
  readMonsterArenaSoundEnabled,
  saveMonsterArenaSoundEnabled,
  WeaponId,
} from './types';

export interface MonsterArenaGameProps {
  lang: 'ar' | 'en';
  onExit: () => void;
}

export const MonsterArenaPreviewArt: React.FC = () => (
  <svg
    viewBox="0 0 320 180"
    className="w-full h-full object-cover"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="maSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#190e2e" />
        <stop offset="55%" stopColor="#3c1b3a" />
        <stop offset="100%" stopColor="#6b272d" />
      </linearGradient>
      <radialGradient id="maFloor" cx="50%" cy="68%" r="55%">
        <stop offset="0%" stopColor="#5b435c" />
        <stop offset="68%" stopColor="#35253a" />
        <stop offset="100%" stopColor="#1e1526" />
      </radialGradient>
      <linearGradient id="maBeam" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#e879f9" />
      </linearGradient>
    </defs>

    {/* Volcanic Dusk Sky */}
    <rect width="320" height="180" fill="url(#maSky)" />
    {/* Distant Colosseum Rim & Pillars */}
    <path
      d="M0 102 Q160 66 320 102 L320 180 L0 180 Z"
      fill="url(#maFloor)"
      stroke="#fb923c"
      strokeOpacity="0.65"
      strokeWidth="2.5"
    />
    {/* Torch Pillars */}
    <rect x="24" y="48" width="16" height="58" rx="3" fill="#3b2c44" />
    <circle cx="32" cy="44" r="9" fill="#f97316" />
    <circle cx="32" cy="44" r="4.5" fill="#fef08a" />
    <rect x="280" y="48" width="16" height="58" rx="3" fill="#3b2c44" />
    <circle cx="288" cy="44" r="9" fill="#f97316" />
    <circle cx="288" cy="44" r="4.5" fill="#fef08a" />

    {/* Arena Floor Ring */}
    <ellipse
      cx="160"
      cy="132"
      rx="116"
      ry="34"
      fill="none"
      stroke="#f59e0b"
      strokeOpacity="0.45"
      strokeWidth="2"
      strokeDasharray="8 6"
    />

    {/* Hero Warrior (left-center) */}
    <g transform="translate(88, 108)">
      <ellipse cx="0" cy="30" rx="16" ry="5" fill="#000" fillOpacity="0.38" />
      <rect x="-9" y="2" width="18" height="22" rx="4" fill="#2563eb" />
      <circle cx="0" cy="-7" r="9" fill="#1e293b" />
      <rect x="-6" y="-10" width="12" height="4.5" rx="2" fill="#38bdf8" />
      <rect x="8" y="4" width="18" height="6" rx="2" fill="#e879f9" />
    </g>

    {/* Companion Wolf + Flying Baby Dragon */}
    <g transform="translate(56, 128)">
      <ellipse cx="0" cy="14" rx="11" ry="3.5" fill="#000" fillOpacity="0.35" />
      <rect x="-10" y="-2" width="18" height="10" rx="4" fill="#64748b" />
      <circle cx="8" cy="-4" r="6" fill="#94a3b8" />
      <circle cx="10" cy="-5" r="1.5" fill="#38bdf8" />
    </g>
    <g transform="translate(110, 62)">
      <path d="M-16 0 L0 -10 L16 0 L0 6 Z" fill="#be123c" />
      <circle cx="0" cy="-1" r="6.5" fill="#fb923c" />
      <circle cx="3" cy="-2" r="1.5" fill="#fef08a" />
    </g>

    {/* Energy Plasma Beam */}
    <line
      x1="115"
      y1="114"
      x2="212"
      y2="104"
      stroke="url(#maBeam)"
      strokeWidth="4.5"
      strokeLinecap="round"
    />
    <circle cx="212" cy="104" r="9" fill="#e879f9" fillOpacity="0.6" />

    {/* 10-Min Horned Dread Titan Boss (right) */}
    <g transform="translate(232, 92)">
      <ellipse cx="0" cy="48" rx="30" ry="9" fill="#000" fillOpacity="0.45" />
      <rect x="-22" y="-6" width="44" height="44" rx="10" fill="#230733" stroke="#f43f5e" strokeWidth="2" />
      <circle cx="0" cy="-18" r="15" fill="#180524" stroke="#f43f5e" strokeWidth="1.5" />
      {/* Crown Horns */}
      <path d="M-11 -28 L-24 -46 L-6 -33 Z" fill="#f59e0b" />
      <path d="M11 -28 L24 -46 L6 -33 Z" fill="#f59e0b" />
      {/* Glowing Eyes & Core */}
      <circle cx="-5" cy="-19" r="2.8" fill="#fb7185" />
      <circle cx="5" cy="-19" r="2.8" fill="#fb7185" />
      <circle cx="0" cy="14" r="8" fill="#f43f5e" />
    </g>

    {/* Fruit & 10:00 Badge Accents */}
    <rect x="10" y="10" width="66" height="20" rx="6" fill="#2c0b1a" stroke="#f43f5e" strokeWidth="1.2" />
    <text x="43" y="24" textAnchor="middle" fill="#fecdd3" fontSize="10" fontWeight="800">
      10:00 BOSS
    </text>
    <circle cx="292" cy="158" r="11" fill="#166534" stroke="#4ade80" strokeWidth="1.5" />
    <text x="292" y="162" textAnchor="middle" fontSize="11">
      🍎
    </text>
  </svg>
);

export const MonsterArenaGame: React.FC<MonsterArenaGameProps> = ({
  lang,
  onExit,
}) => {
  const worldRef = useRef<MonsterArenaWorld>(createInitialMonsterArenaWorld(lang));
  const inputRef = useRef<MonsterArenaInput>({ moveX: 0, moveZ: 0 });
  const keysRef = useRef<Set<string>>(new Set());
  const joystickRef = useRef<{ x: number; z: number }>({ x: 0, z: 0 });
  const audioRef = useRef<MonsterArenaAudio>(new MonsterArenaAudio());
  const wasPlayingBeforeShopRef = useRef(false);

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = readMonsterArenaSoundEnabled();
    audioRef.current.setEnabled(saved);
    return saved;
  });

  const [shopTab, setShopTab] = useState<ArenaShopTab | null>(null);
  const [hud, setHud] = useState<MonsterArenaHudSnapshot>(() =>
    extractMonsterArenaHud(worldRef.current)
  );

  const syncHud = useCallback(() => {
    setHud(extractMonsterArenaHud(worldRef.current));
  }, []);

  const recomputeInput = useCallback(() => {
    const keys = keysRef.current;
    let kx = 0;
    let kz = 0;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) kx -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) kx += 1;
    if (keys.has('KeyW') || keys.has('ArrowUp')) kz -= 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) kz += 1;

    const jx = joystickRef.current.x;
    const jz = joystickRef.current.z;
    let mx = kx + jx;
    let mz = kz + jz;
    const len = Math.hypot(mx, mz);
    if (len > 1) {
      mx /= len;
      mz /= len;
    }
    inputRef.current.moveX = mx;
    inputRef.current.moveZ = mz;
  }, []);

  useEffect(() => {
    worldRef.current.lang = lang;
    syncHud();
  }, [lang, syncHud]);

  const handleOpenShopTab = useCallback(
    (tab: ArenaShopTab) => {
      const world = worldRef.current;
      if (!shopTab && world.status === 'PLAYING') {
        wasPlayingBeforeShopRef.current = true;
        world.status = 'PAUSED';
        saveMonsterArenaNow(world);
        syncHud();
      }
      setShopTab(tab);
    },
    [shopTab, syncHud]
  );

  const handleCloseShop = useCallback(() => {
    setShopTab(null);
    const world = worldRef.current;
    if (wasPlayingBeforeShopRef.current && world.status === 'PAUSED') {
      world.status = 'PLAYING';
      syncHud();
    }
    wasPlayingBeforeShopRef.current = false;
  }, [syncHud]);

  const handleContinueSaved = useCallback(() => {
    setShopTab(null);
    wasPlayingBeforeShopRef.current = false;
    resumeMonsterArenaRun(worldRef.current, audioRef.current);
    syncHud();
  }, [syncHud]);

  const handleStartNew = useCallback(() => {
    setShopTab(null);
    wasPlayingBeforeShopRef.current = false;
    startNewMonsterArenaRun(worldRef.current, audioRef.current);
    syncHud();
  }, [syncHud]);

  const handlePause = useCallback(() => {
    const world = worldRef.current;
    if (world.status === 'PLAYING') {
      world.status = 'PAUSED';
      saveMonsterArenaNow(world);
      syncHud();
    }
  }, [syncHud]);

  const handleResume = useCallback(() => {
    setShopTab(null);
    wasPlayingBeforeShopRef.current = false;
    const world = worldRef.current;
    if (world.status === 'PAUSED') {
      world.status = 'PLAYING';
      syncHud();
    }
  }, [syncHud]);

  const handleToggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      audioRef.current.setEnabled(next);
      saveMonsterArenaSoundEnabled(next);
      return next;
    });
  }, []);

  const handleBuyFruit = useCallback(
    (fruitId: FruitId) => {
      if (actionBuyFruit(worldRef.current, fruitId, audioRef.current)) {
        syncHud();
      }
    },
    [syncHud]
  );

  const handleBuyOrEquipWeapon = useCallback(
    (weaponId: WeaponId) => {
      if (actionBuyOrEquipWeapon(worldRef.current, weaponId, audioRef.current)) {
        syncHud();
      }
    },
    [syncHud]
  );

  const handleBuyPet = useCallback(
    (petId: PetId) => {
      if (actionBuyPet(worldRef.current, petId, audioRef.current)) {
        syncHud();
      } else {
        syncHud();
      }
    },
    [syncHud]
  );

  const handleMergePetPair = useCallback(
    (petId: PetId, level: number) => {
      if (actionMergePetPair(worldRef.current, petId, level, audioRef.current)) {
        syncHud();
      }
    },
    [syncHud]
  );

  const handleMergeAllPets = useCallback(() => {
    if (actionMergeAllPets(worldRef.current, audioRef.current)) {
      syncHud();
    }
  }, [syncHud]);

  const handleMoveOrMergeSlot = useCallback(
    (fromSlot: number, toSlot: number) => {
      if (actionMoveOrMergeSlot(worldRef.current, fromSlot, toSlot, audioRef.current)) {
        syncHud();
      }
    },
    [syncHud]
  );

  const handlePetClick3D = useCallback(
    (petEntityId: number) => {
      if (actionSelectOrMerge3DPet(worldRef.current, petEntityId, audioRef.current)) {
        syncHud();
      }
    },
    [syncHud]
  );

  const handleFloorClick3D = useCallback(
    (x: number, z: number) => {
      if (actionMoveSelectedPetToArenaPoint(worldRef.current, x, z, audioRef.current)) {
        syncHud();
      }
    },
    [syncHud]
  );

  const handleClearPetSelection = useCallback(() => {
    actionClearPetSelection(worldRef.current);
    syncHud();
  }, [syncHud]);

  const handleRecallAllPets = useCallback(() => {
    if (actionRecallAllPets(worldRef.current, audioRef.current)) {
      syncHud();
    }
  }, [syncHud]);

  const handleDash = useCallback(() => {
    if (actionTriggerDash(worldRef.current, inputRef.current, audioRef.current)) {
      syncHud();
    }
  }, [syncHud]);

  const handleJoystickMove = useCallback(
    (x: number, z: number) => {
      joystickRef.current.x = x;
      joystickRef.current.z = z;
      recomputeInput();
    },
    [recomputeInput]
  );

  const handleExit = useCallback(() => {
    saveMonsterArenaNow(worldRef.current);
    onExit();
  }, [onExit]);

  // Keyboard controls & shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      if (
        code === 'KeyW' ||
        code === 'KeyA' ||
        code === 'KeyS' ||
        code === 'KeyD' ||
        code === 'ArrowUp' ||
        code === 'ArrowDown' ||
        code === 'ArrowLeft' ||
        code === 'ArrowRight'
      ) {
        keysRef.current.add(code);
        recomputeInput();
        return;
      }

      if (code === 'Space' || code === 'ShiftLeft' || code === 'ShiftRight') {
        if (worldRef.current.status === 'PLAYING' && !shopTab) {
          e.preventDefault();
          handleDash();
        }
        return;
      }

      if (code === 'KeyF' && (worldRef.current.status === 'PLAYING' || shopTab)) {
        e.preventDefault();
        handleOpenShopTab('fruits');
        return;
      }
      if (code === 'KeyB' && (worldRef.current.status === 'PLAYING' || shopTab)) {
        e.preventDefault();
        handleOpenShopTab('weapons');
        return;
      }
      if (code === 'KeyG' && (worldRef.current.status === 'PLAYING' || shopTab)) {
        e.preventDefault();
        handleOpenShopTab('pets');
        return;
      }
      if (code === 'KeyM' && (worldRef.current.status === 'PLAYING' || shopTab === 'pets')) {
        e.preventDefault();
        handleMergeAllPets();
        return;
      }
      if (code === 'Escape' || code === 'KeyP') {
        if (shopTab) {
          handleCloseShop();
        } else if (worldRef.current.status === 'PLAYING') {
          handlePause();
        } else if (worldRef.current.status === 'PAUSED') {
          handleResume();
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (keysRef.current.delete(e.code)) {
        recomputeInput();
      }
    };

    const onBlur = () => {
      keysRef.current.clear();
      joystickRef.current.x = 0;
      joystickRef.current.z = 0;
      recomputeInput();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [
    recomputeInput,
    shopTab,
    handleDash,
    handleOpenShopTab,
    handleCloseShop,
    handlePause,
    handleResume,
    handleMergeAllPets,
  ]);

  // Auto-save on page hide / unload / exit & clean audio dispose on unmount
  useEffect(() => {
    const saveNow = () => {
      saveMonsterArenaNow(worldRef.current);
    };
    const onVisibility = () => {
      if (document.hidden) saveNow();
    };
    window.addEventListener('beforeunload', saveNow);
    window.addEventListener('pagehide', saveNow);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('beforeunload', saveNow);
      window.removeEventListener('pagehide', saveNow);
      document.removeEventListener('visibilitychange', onVisibility);
      saveNow();
      audioRef.current.dispose();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-[#140d1d] overflow-hidden">
      <MonsterArenaScene
        worldRef={worldRef}
        inputRef={inputRef}
        audioRef={audioRef}
        onHudUpdate={setHud}
        onPetClick={handlePetClick3D}
        onFloorClick={handleFloorClick3D}
      />
      <MonsterArenaUI
        lang={lang}
        hud={hud}
        soundEnabled={soundEnabled}
        shopTab={shopTab}
        onOpenShopTab={handleOpenShopTab}
        onCloseShop={handleCloseShop}
        onContinueSaved={handleContinueSaved}
        onStartNew={handleStartNew}
        onPause={handlePause}
        onResume={handleResume}
        onToggleSound={handleToggleSound}
        onBuyFruit={handleBuyFruit}
        onBuyOrEquipWeapon={handleBuyOrEquipWeapon}
        onBuyPet={handleBuyPet}
        onMergePetPair={handleMergePetPair}
        onMergeAllPets={handleMergeAllPets}
        onMoveOrMergeSlot={handleMoveOrMergeSlot}
        onClearPetSelection={handleClearPetSelection}
        onRecallAllPets={handleRecallAllPets}
        onDash={handleDash}
        onJoystickMove={handleJoystickMove}
        onExit={handleExit}
      />
    </div>
  );
};
