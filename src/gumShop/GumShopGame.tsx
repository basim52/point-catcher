import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GumShopAudio } from './audio';
import {
  actionBuyShelf,
  actionBuyUpgrade,
  actionCheckoutCustomers,
  actionEmergencyGrant,
  actionInteractNearest,
  actionOrderCrate,
  actionPayRentAndNextDay,
  actionResetShop,
  actionSetPrice,
  actionStartOrResume,
  CHECKOUT_POS,
  createGumShopWorld,
  extractGumShopHud,
  saveGumShopWorldNow,
  type GumShopInput,
  type GumShopWorld,
} from './gameLogic';
import { GumShopScene } from './GumShopScene';
import { GumShopUI } from './GumShopUI';
import {
  readGumShopSoundEnabled,
  saveGumShopSoundEnabled,
  type GumFlavorId,
  type GumShopHudSnapshot,
  type GumShopModalTab,
  type UpgradeId,
} from './types';

export interface GumShopGameProps {
  lang: 'ar' | 'en';
  onExit: () => void;
}

/**
 * Custom crisp SVG preview card for Gum Shop 3D ("بياع العلك 3D").
 */
export const GumShopPreviewArt: React.FC = () => (
  <svg
    viewBox="0 0 400 200"
    className="w-full h-full block"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="gumSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="65%" stopColor="#bae6fd" />
        <stop offset="100%" stopColor="#fef3c7" />
      </linearGradient>
      <linearGradient id="gumWall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fef3c7" />
        <stop offset="100%" stopColor="#fde68a" />
      </linearGradient>
    </defs>

    {/* Sunny Sky & Sidewalk */}
    <rect width="400" height="200" fill="url(#gumSky)" />
    <rect x="0" y="146" width="400" height="54" fill="#e5dcc8" />
    <line x1="0" y1="146" x2="400" y2="146" stroke="#c4b89f" strokeWidth="3" />

    {/* Cozy 3D Gum Shop Building */}
    <rect x="64" y="34" width="272" height="114" rx="6" fill="url(#gumWall)" stroke="#b45309" strokeWidth="3" />

    {/* Striped Candy Awning */}
    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
      <rect
        key={i}
        x={60 + i * 28}
        y="52"
        width="28"
        height="22"
        fill={i % 2 === 0 ? '#f43f5e' : '#fffbeb'}
      />
    ))}

    {/* Signboard with Gumball Dots */}
    <rect x="118" y="16" width="164" height="30" rx="8" fill="#134e4a" stroke="#fde047" strokeWidth="2.5" />
    <circle cx="138" cy="31" r="6" fill="#14b8a6" />
    <circle cx="154" cy="31" r="6" fill="#f43f5e" />
    <circle cx="246" cy="31" r="6" fill="#fbbf24" />
    <circle cx="262" cy="31" r="6" fill="#a855f7" />
    <rect x="168" y="27" width="64" height="8" rx="4" fill="#fef08a" />

    {/* Left Window showing Colorful 3D Gum Shelves Inside */}
    <rect x="80" y="84" width="84" height="54" rx="4" fill="#0f2940" stroke="#0d9488" strokeWidth="3" />
    {/* Shelf rows */}
    <rect x="86" y="102" width="72" height="4" fill="#d6a461" />
    <rect x="86" y="122" width="72" height="4" fill="#d6a461" />
    {/* Gum packs */}
    <rect x="90" y="91" width="14" height="11" rx="2" fill="#14b8a6" />
    <rect x="108" y="91" width="14" height="11" rx="2" fill="#14b8a6" />
    <rect x="126" y="91" width="14" height="11" rx="2" fill="#f43f5e" />
    <rect x="142" y="91" width="14" height="11" rx="2" fill="#f43f5e" />
    <rect x="90" y="111" width="14" height="11" rx="2" fill="#22c55e" />
    <rect x="108" y="111" width="14" height="11" rx="2" fill="#f59e0b" />
    <rect x="126" y="111" width="14" height="11" rx="2" fill="#8b5cf6" />
    <rect x="142" y="111" width="14" height="11" rx="2" fill="#fbbf24" />

    {/* Open Glass Center Door */}
    <rect x="176" y="84" width="48" height="64" fill="#1e3a5f" stroke="#0f766e" strokeWidth="3" />
    <rect x="172" y="148" width="56" height="8" rx="3" fill="#0d9488" />

    {/* Right Window + Price Tag */}
    <rect x="236" y="84" width="84" height="54" rx="4" fill="#0f2940" stroke="#0d9488" strokeWidth="3" />
    <rect x="246" y="94" width="32" height="34" rx="4" fill="#fef08a" />
    <rect x="252" y="103" width="20" height="5" rx="2" fill="#0f172a" />
    <rect x="252" y="113" width="14" height="5" rx="2" fill="#10b981" />
    <circle cx="298" cy="112" r="14" fill="#f43f5e" stroke="#fecdd3" strokeWidth="2.5" />

    {/* Outdoor Delivery Gum Crate Waiting on Sidewalk! */}
    <rect x="86" y="152" width="44" height="32" rx="3" fill="#d4a373" stroke="#78350f" strokeWidth="2.5" />
    <rect x="86" y="164" width="44" height="8" fill="#14b8a6" />
    {/* Pickup Arrow above Crate */}
    <polygon points="108,146 98,134 118,134" fill="#facc15" stroke="#b45309" strokeWidth="1.5" />

    {/* Shopkeeper Character Walking Outside */}
    <circle cx="282" cy="140" r="10" fill="#f5cba7" />
    <rect x="272" y="129" width="20" height="6" rx="3" fill="#f43f5e" />
    <rect x="271" y="151" width="22" height="24" rx="5" fill="#14b8a6" />
    <rect x="274" y="175" width="7" height="14" rx="2" fill="#1e293b" />
    <rect x="283" y="175" width="7" height="14" rx="2" fill="#1e293b" />
  </svg>
);

export const GumShopGame: React.FC<GumShopGameProps> = ({ lang, onExit }) => {
  const worldRef = useRef<GumShopWorld>(createGumShopWorld(lang));
  const inputRef = useRef<GumShopInput>({ moveX: 0, moveZ: 0 });
  const audioRef = useRef<GumShopAudio>(new GumShopAudio());
  const keysRef = useRef<Set<string>>(new Set());
  const joyRef = useRef({ x: 0, z: 0 });

  worldRef.current.lang = lang;

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = readGumShopSoundEnabled();
    audioRef.current.enabled = saved;
    return saved;
  });
  const [activeTab, setActiveTab] = useState<GumShopModalTab>('none');
  const [hud, setHud] = useState<GumShopHudSnapshot>(() =>
    extractGumShopHud(worldRef.current)
  );

  const syncNow = useCallback(() => {
    setHud(extractGumShopHud(worldRef.current));
  }, []);

  const recomputeInput = useCallback(() => {
    const keys = keysRef.current;
    let kx = 0;
    let kz = 0;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) kx -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) kx += 1;
    if (keys.has('KeyW') || keys.has('ArrowUp')) kz -= 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) kz += 1;
    inputRef.current.moveX = kx !== 0 ? kx : joyRef.current.x;
    inputRef.current.moveZ = kz !== 0 ? kz : joyRef.current.z;
  }, []);

  const handleJoystickMove = useCallback(
    (x: number, z: number) => {
      joyRef.current.x = x;
      joyRef.current.z = z;
      recomputeInput();
    },
    [recomputeInput]
  );

  const handleStartOrResume = useCallback(() => {
    actionStartOrResume(worldRef.current);
    syncNow();
  }, [syncNow]);

  const handleResetShop = useCallback(() => {
    actionResetShop(worldRef.current);
    setActiveTab('none');
    syncNow();
  }, [syncNow]);

  const handleOrderCrate = useCallback(
    (flavor: GumFlavorId) => {
      actionOrderCrate(worldRef.current, flavor, audioRef.current);
      syncNow();
    },
    [syncNow]
  );

  const handleSetPrice = useCallback(
    (flavor: GumFlavorId, price: number) => {
      actionSetPrice(worldRef.current, flavor, price);
      syncNow();
    },
    [syncNow]
  );

  const handleBuyShelf = useCallback(
    (slotIndex: number) => {
      actionBuyShelf(worldRef.current, slotIndex, audioRef.current);
      syncNow();
    },
    [syncNow]
  );

  const handleBuyUpgrade = useCallback(
    (upgradeId: UpgradeId) => {
      actionBuyUpgrade(worldRef.current, upgradeId, audioRef.current);
      syncNow();
    },
    [syncNow]
  );

  const handlePayRent = useCallback(() => {
    actionPayRentAndNextDay(worldRef.current, audioRef.current);
    setActiveTab('none');
    syncNow();
  }, [syncNow]);

  const handleEmergencyGrant = useCallback(() => {
    actionEmergencyGrant(worldRef.current, audioRef.current);
    syncNow();
  }, [syncNow]);

  const handleInteractNearest = useCallback(() => {
    actionInteractNearest(worldRef.current, audioRef.current);
    syncNow();
  }, [syncNow]);

  const handleFloorClick = useCallback((x: number, z: number) => {
    const world = worldRef.current;
    if (world.status !== 'PLAYING') return;
    world.walkTarget = { x, z };
  }, []);

  const handleCrateClick = useCallback((crateId: number, x: number, z: number) => {
    const world = worldRef.current;
    if (world.status !== 'PLAYING') return;
    world.walkTarget = {
      x,
      z,
      action: { kind: 'pickup_crate', crateId },
    };
  }, []);

  const handleShelfClick = useCallback((slotIndex: number, x: number, z: number) => {
    const world = worldRef.current;
    if (world.status !== 'PLAYING') return;
    world.walkTarget = {
      x,
      z: z < -2.5 ? z + 1.1 : z + 1.0,
      action: world.carriedCrate ? { kind: 'stock_shelf', slotIndex } : undefined,
    };
  }, []);

  const handleCheckoutClick = useCallback(() => {
    const world = worldRef.current;
    if (world.status !== 'PLAYING') return;
    const dist = Math.hypot(
      world.playerX - CHECKOUT_POS.x,
      world.playerZ - CHECKOUT_POS.z
    );
    if (dist <= 2.4) {
      actionCheckoutCustomers(world, audioRef.current, true);
      syncNow();
    } else {
      world.walkTarget = {
        x: CHECKOUT_POS.x - 1.1,
        z: CHECKOUT_POS.z,
        action: { kind: 'checkout' },
      };
    }
  }, [syncNow]);

  const handleGoOutsideToCrates = useCallback(() => {
    const world = worldRef.current;
    if (world.status !== 'PLAYING' || world.cratesOutside.length === 0) return;
    const first = world.cratesOutside[0];
    world.walkTarget = {
      x: first.x,
      z: first.z,
      action: { kind: 'pickup_crate', crateId: first.id },
    };
  }, []);

  const handleToggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      audioRef.current.enabled = next;
      saveGumShopSoundEnabled(next);
      return next;
    });
  }, []);

  const handleExit = useCallback(() => {
    saveGumShopWorldNow(worldRef.current);
    onExit();
  }, [onExit]);

  // Keyboard controls (WASD / Arrows / E to interact / Escape to close modal or exit)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        e.preventDefault();
        if (activeTab !== 'none') {
          setActiveTab('none');
        } else {
          handleExit();
        }
        return;
      }
      if (e.code === 'KeyE' && worldRef.current.status === 'PLAYING' && activeTab === 'none') {
        e.preventDefault();
        actionInteractNearest(worldRef.current, audioRef.current);
        syncNow();
        return;
      }
      if (
        e.code === 'KeyW' ||
        e.code === 'KeyA' ||
        e.code === 'KeyS' ||
        e.code === 'KeyD' ||
        e.code === 'ArrowUp' ||
        e.code === 'ArrowDown' ||
        e.code === 'ArrowLeft' ||
        e.code === 'ArrowRight'
      ) {
        keysRef.current.add(e.code);
        recomputeInput();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (keysRef.current.delete(e.code)) {
        recomputeInput();
      }
    };

    const onBlur = () => {
      keysRef.current.clear();
      joyRef.current.x = 0;
      joyRef.current.z = 0;
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
  }, [activeTab, handleExit, recomputeInput, syncNow]);

  // Guaranteed auto-save on tab switch, reload, close, or unmount!
  useEffect(() => {
    const saveNow = () => saveGumShopWorldNow(worldRef.current);
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
    <div className="fixed inset-0 z-50 w-full h-full bg-[#102030] overflow-hidden">
      <GumShopScene
        worldRef={worldRef}
        inputRef={inputRef}
        audioRef={audioRef}
        onHudUpdate={setHud}
        onFloorClick={handleFloorClick}
        onCrateClick={handleCrateClick}
        onShelfClick={handleShelfClick}
        onCheckoutClick={handleCheckoutClick}
      />

      <GumShopUI
        lang={lang}
        hud={hud}
        hasExistingSave={worldRef.current.hasExistingSave}
        soundEnabled={soundEnabled}
        activeTab={activeTab}
        onSetTab={setActiveTab}
        onStartOrResume={handleStartOrResume}
        onResetShop={handleResetShop}
        onOrderCrate={handleOrderCrate}
        onSetPrice={handleSetPrice}
        onBuyShelf={handleBuyShelf}
        onBuyUpgrade={handleBuyUpgrade}
        onPayRent={handlePayRent}
        onEmergencyGrant={handleEmergencyGrant}
        onInteractNearest={handleInteractNearest}
        onGoOutsideToCrates={handleGoOutsideToCrates}
        onCheckoutNow={handleCheckoutClick}
        onJoystickMove={handleJoystickMove}
        onToggleSound={handleToggleSound}
        onExit={handleExit}
      />
    </div>
  );
};
