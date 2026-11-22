import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  HudSnapshot,
  readDateCatcherSoundEnabled,
  saveDateCatcherSoundEnabled,
} from './types';
import { DateCatcherAudio } from './audio';
import {
  createInitialWorld,
  DateCatcherWorld,
  extractHudSnapshot,
  resetWorldForPlay,
} from './gameLogic';
import { DateCatcherScene } from './DateCatcherScene';
import { DateCatcherUI } from './DateCatcherUI';

export interface DateCatcherGameProps {
  onExit: () => void;
}

/**
 * Preview artwork card rendered in the Games Hub for "صيد التمر 3D"
 */
export const DateCatcherPreviewArt: React.FC = () => (
  <svg
    viewBox="0 0 320 160"
    className="w-full h-full block"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="dcSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#4c2a54" />
        <stop offset="52%" stopColor="#d96c5b" />
        <stop offset="100%" stopColor="#f5be72" />
      </linearGradient>
      <linearGradient id="dcSand" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#e8b668" />
        <stop offset="100%" stopColor="#c4873e" />
      </linearGradient>
    </defs>

    {/* Warm Sunset Sky */}
    <rect width="320" height="160" fill="url(#dcSky)" />

    {/* Low Sunset Sun */}
    <circle cx="160" cy="102" r="34" fill="#ffe49e" opacity="0.92" />
    <circle cx="160" cy="102" r="46" fill="#ffc46b" opacity="0.28" />

    {/* Distant Dunes */}
    <path d="M0 120 Q80 96 170 116 T320 110 L320 160 L0 160 Z" fill="#d99b4f" />
    <path d="M0 130 Q110 116 215 128 T320 124 L320 160 L0 160 Z" fill="url(#dcSand)" />

    {/* Background Palm Silhouettes */}
    <g opacity="0.55">
      <path d="M56 124 Q60 88 52 60" stroke="#5b3421" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M52 60 Q32 52 22 65 M52 60 Q40 42 28 45 M52 60 Q68 44 82 54 M52 60 Q70 58 78 70" stroke="#2f5b2d" strokeWidth="3.5" fill="none" strokeLinecap="round" />

      <path d="M268 124 Q264 90 272 62" stroke="#5b3421" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M272 62 Q252 50 240 60 M272 62 Q260 42 246 46 M272 62 Q290 48 302 58 M272 62 Q288 60 296 72" stroke="#2f5b2d" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    </g>

    {/* Overhead Hero Palm Fronds */}
    <path d="M160 6 Q110 12 72 34 M160 6 Q128 2 96 16 M160 6 Q210 12 248 34 M160 6 Q192 2 224 16" stroke="#2d6a31" strokeWidth="8" fill="none" strokeLinecap="round" />
    <path d="M160 8 Q135 20 110 38 M160 8 Q185 20 210 38" stroke="#3f853c" strokeWidth="6" fill="none" strokeLinecap="round" />

    {/* Falling Regular & Golden Dates */}
    <ellipse cx="116" cy="56" rx="6" ry="9" transform="rotate(-14 116 56)" fill="#6f2f12" stroke="#c87b44" strokeWidth="1.2" />
    <ellipse cx="204" cy="48" rx="6" ry="9" transform="rotate(12 204 48)" fill="#6f2f12" stroke="#c87b44" strokeWidth="1.2" />
    <ellipse cx="162" cy="72" rx="7" ry="10.5" fill="#f5b82e" stroke="#fef08a" strokeWidth="1.5" />
    <circle cx="159" cy="69" r="2.2" fill="#fffbeb" opacity="0.8" />

    {/* Woven Palm Basket (صحن خوص) */}
    <ellipse cx="160" cy="146" rx="40" ry="7" fill="#7c471b" opacity="0.45" />
    <path d="M124 122 L196 122 L187 143 Q160 148 133 143 Z" fill="#d9a45b" stroke="#8b5523" strokeWidth="2" />
    <ellipse cx="160" cy="122" rx="36" ry="6.5" fill="#b77b38" stroke="#f0c87e" strokeWidth="2" />
    <line x1="138" y1="128" x2="142" y2="143" stroke="#8b5523" strokeWidth="1.6" />
    <line x1="152" y1="129" x2="154" y2="144" stroke="#8b5523" strokeWidth="1.6" />
    <line x1="168" y1="129" x2="166" y2="144" stroke="#8b5523" strokeWidth="1.6" />
    <line x1="182" y1="128" x2="178" y2="143" stroke="#8b5523" strokeWidth="1.6" />
  </svg>
);

export const DateCatcherGame: React.FC<DateCatcherGameProps> = ({ onExit }) => {
  const worldRef = useRef<DateCatcherWorld>(createInitialWorld());
  const audioRef = useRef<DateCatcherAudio>(new DateCatcherAudio());

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = readDateCatcherSoundEnabled();
    audioRef.current.setEnabled(saved);
    return saved;
  });

  const [hud, setHud] = useState<HudSnapshot>(() =>
    extractHudSnapshot(worldRef.current)
  );

  const syncHudNow = useCallback(() => {
    setHud(extractHudSnapshot(worldRef.current));
  }, []);

  const handleStart = useCallback(() => {
    resetWorldForPlay(worldRef.current);
    audioRef.current.setEnabled(soundEnabled);
    if (soundEnabled) {
      audioRef.current.startMusic();
    }
    syncHudNow();
  }, [soundEnabled, syncHudNow]);

  const handlePause = useCallback(() => {
    const world = worldRef.current;
    if (world.status !== 'PLAYING') return;
    world.status = 'PAUSED';
    world.keyLeft = false;
    world.keyRight = false;
    world.pointerDragging = false;
    audioRef.current.stopMusic();
    syncHudNow();
  }, [syncHudNow]);

  const handleResume = useCallback(() => {
    const world = worldRef.current;
    if (world.status !== 'PAUSED') return;
    world.status = 'PLAYING';
    if (soundEnabled) {
      audioRef.current.startMusic();
    }
    syncHudNow();
  }, [soundEnabled, syncHudNow]);

  const handleToggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      saveDateCatcherSoundEnabled(next);
      audioRef.current.setEnabled(next);
      if (next && worldRef.current.status === 'PLAYING') {
        audioRef.current.startMusic();
      }
      return next;
    });
  }, []);

  // Desktop keyboard controls: ArrowLeft / ArrowRight / A / D + Escape / P for pause
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const world = worldRef.current;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        world.keyLeft = true;
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        world.keyRight = true;
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

    const onKeyUp = (e: KeyboardEvent) => {
      const world = worldRef.current;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        world.keyLeft = false;
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        world.keyRight = false;
      }
    };

    const onBlurOrHide = () => {
      const world = worldRef.current;
      world.keyLeft = false;
      world.keyRight = false;
      world.pointerDragging = false;
      if (document.hidden && world.status === 'PLAYING') {
        handlePause();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlurOrHide);
    document.addEventListener('visibilitychange', onBlurOrHide);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlurOrHide);
      document.removeEventListener('visibilitychange', onBlurOrHide);
    };
  }, [handlePause, handleResume]);

  // Clean up Web Audio resources on unmount
  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      audio.dispose();
    };
  }, []);

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 w-full h-full bg-[#361b2e] overflow-hidden"
    >
      <DateCatcherScene
        worldRef={worldRef}
        audioRef={audioRef}
        onHudUpdate={setHud}
      />
      <DateCatcherUI
        hud={hud}
        soundEnabled={soundEnabled}
        onStart={handleStart}
        onPause={handlePause}
        onResume={handleResume}
        onRestart={handleStart}
        onToggleSound={handleToggleSound}
        onExit={onExit}
      />
    </div>
  );
};
