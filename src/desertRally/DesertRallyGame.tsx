import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  RallyHudSnapshot,
  readDesertRallySoundEnabled,
  saveDesertRallySoundEnabled,
} from './types';
import { DesertRallyAudio } from './audio';
import {
  createInitialRallyWorld,
  DesertRallyWorld,
  extractRallyHud,
  resetRallyWorld,
  shiftLane,
  triggerJump,
  triggerNitro,
} from './gameLogic';
import { DesertRallyScene } from './DesertRallyScene';
import { DesertRallyUI } from './DesertRallyUI';

export interface DesertRallyGameProps {
  lang: 'ar' | 'en';
  onExit: () => void;
}

/**
 * Custom vector preview artwork for the Games Hub card ("سباق الصحراء 3D")
 */
export const DesertRallyPreviewArt: React.FC = () => (
  <svg
    viewBox="0 0 320 160"
    className="w-full h-full block"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="drSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1d2b53" />
        <stop offset="50%" stopColor="#d95b54" />
        <stop offset="100%" stopColor="#f7b563" />
      </linearGradient>
      <linearGradient id="drRoad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#3c424d" />
        <stop offset="100%" stopColor="#1e222a" />
      </linearGradient>
    </defs>

    <rect width="320" height="160" fill="url(#drSky)" />

    {/* Canyon Sun */}
    <circle cx="206" cy="70" r="26" fill="#ffe49c" opacity="0.92" />
    <circle cx="206" cy="70" r="38" fill="#ff934f" opacity="0.28" />

    {/* Distant Canyon Mesas */}
    <polygon points="0,104 28,68 78,68 104,104" fill="#a84e2c" />
    <polygon points="222,104 248,62 296,62 320,104" fill="#9c4627" />

    {/* Desert Floor */}
    <rect x="0" y="98" width="320" height="62" fill="#d98c4f" />

    {/* Perspective Highway */}
    <polygon points="134,98 186,98 272,160 48,160" fill="url(#drRoad)" />
    <line x1="160" y1="102" x2="160" y2="156" stroke="#fbbf24" strokeWidth="3.5" strokeDasharray="8 8" />
    <line x1="134" y1="98" x2="48" y2="160" stroke="#f97316" strokeWidth="3" />
    <line x1="186" y1="98" x2="272" y2="160" stroke="#f97316" strokeWidth="3" />

    {/* Floating Gold Coins Ahead */}
    <circle cx="160" cy="108" r="5" fill="#fbbf24" stroke="#fef08a" strokeWidth="1.3" />
    <circle cx="160" cy="119" r="6" fill="#fbbf24" stroke="#fef08a" strokeWidth="1.4" />

    {/* Stylized Rear View of 3D Rally Buggy */}
    <ellipse cx="160" cy="150" rx="38" ry="6.5" fill="#120b06" opacity="0.55" />
    <rect x="128" y="132" width="12" height="18" rx="3" fill="#18181b" />
    <rect x="180" y="132" width="12" height="18" rx="3" fill="#18181b" />
    <rect x="134" y="124" width="52" height="20" rx="5" fill="#ea580c" stroke="#fed7aa" strokeWidth="1.2" />
    <polygon points="142,124 178,124 172,112 148,112" fill="#0f172a" />
    <rect x="132" y="114" width="56" height="4" rx="2" fill="#c2410c" />
    {/* Glowing Taillights + Twin Nitro Exhaust Glow */}
    <rect x="138" y="130" width="10" height="4.5" rx="1.5" fill="#ef4444" />
    <rect x="172" y="130" width="10" height="4.5" rx="1.5" fill="#ef4444" />
    <circle cx="151" cy="144" r="4.5" fill="#38bdf8" opacity="0.88" />
    <circle cx="169" cy="144" r="4.5" fill="#38bdf8" opacity="0.88" />
  </svg>
);

export const DesertRallyGame: React.FC<DesertRallyGameProps> = ({
  lang,
  onExit,
}) => {
  const worldRef = useRef<DesertRallyWorld>(createInitialRallyWorld(lang));
  const audioRef = useRef<DesertRallyAudio>(new DesertRallyAudio());

  // Sync language preference on world
  worldRef.current.lang = lang;

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = readDesertRallySoundEnabled();
    audioRef.current.setEnabled(saved);
    return saved;
  });

  const [hud, setHud] = useState<RallyHudSnapshot>(() =>
    extractRallyHud(worldRef.current)
  );

  const syncHud = useCallback(() => {
    setHud(extractRallyHud(worldRef.current));
  }, []);

  const handleStart = useCallback(() => {
    resetRallyWorld(worldRef.current);
    audioRef.current.setEnabled(soundEnabled);
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
      saveDesertRallySoundEnabled(next);
      audioRef.current.setEnabled(next);
      if (next && worldRef.current.status === 'PLAYING') {
        audioRef.current.startMusic();
      }
      return next;
    });
  }, []);

  const handleMoveLeft = useCallback(() => {
    shiftLane(worldRef.current, -1, audioRef.current);
  }, []);

  const handleMoveRight = useCallback(() => {
    shiftLane(worldRef.current, 1, audioRef.current);
  }, []);

  const handleJump = useCallback(() => {
    triggerJump(worldRef.current, audioRef.current);
  }, []);

  const handleNitro = useCallback(() => {
    if (triggerNitro(worldRef.current, audioRef.current)) {
      syncHud();
    }
  }, [syncHud]);

  // Desktop keyboard controls
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const world = worldRef.current;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        if (world.status === 'PLAYING') {
          e.preventDefault();
          shiftLane(world, -1, audioRef.current);
        }
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        if (world.status === 'PLAYING') {
          e.preventDefault();
          shiftLane(world, 1, audioRef.current);
        }
      } else if (
        e.code === 'ArrowUp' ||
        e.code === 'KeyW' ||
        e.code === 'Space'
      ) {
        if (world.status === 'PLAYING') {
          e.preventDefault();
          triggerJump(world, audioRef.current);
        }
      } else if (
        e.code === 'ShiftLeft' ||
        e.code === 'ShiftRight' ||
        e.code === 'ArrowDown' ||
        e.code === 'KeyS'
      ) {
        if (world.status === 'PLAYING') {
          e.preventDefault();
          if (triggerNitro(world, audioRef.current)) {
            syncHud();
          }
        }
      } else if (e.code === 'Escape' || e.code === 'KeyP') {
        if (world.status === 'PLAYING') {
          e.preventDefault();
          handlePause();
        } else if (world.status === 'PAUSED') {
          e.preventDefault();
          handleResume();
        }
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
  }, [handlePause, handleResume, syncHud]);

  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      audio.dispose();
    };
  }, []);

  return (
    <div
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-50 w-full h-full bg-[#1d2b53] overflow-hidden"
    >
      <DesertRallyScene
        worldRef={worldRef}
        audioRef={audioRef}
        onHudUpdate={setHud}
      />
      <DesertRallyUI
        lang={lang}
        hud={hud}
        soundEnabled={soundEnabled}
        onStart={handleStart}
        onPause={handlePause}
        onResume={handleResume}
        onRestart={handleStart}
        onToggleSound={handleToggleSound}
        onMoveLeft={handleMoveLeft}
        onMoveRight={handleMoveRight}
        onJump={handleJump}
        onNitro={handleNitro}
        onExit={onExit}
      />
    </div>
  );
};
