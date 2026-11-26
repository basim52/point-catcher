import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GumShopAudio } from './audio';
import {
  actionAcceptDeliveryOrder,
  actionAutoStockFromStorage,
  actionBuyAdCampaign,
  actionBuyScooter,
  actionBuyShelf,
  actionBuyStorageRoom,
  actionBuyUpgrade,
  actionCancelActiveDelivery,
  actionCheckoutCustomers,
  actionCompleteActiveDelivery,
  actionDepositCrateToStorage,
  actionEmergencyGrant,
  actionEquipScooter,
  actionExpandShop,
  actionInteractNearest,
  actionMoveCashier,
  actionMoveShelf,
  actionOrderCrate,
  actionPayRentAndNextDay,
  actionPromoteRank,
  actionRecordSolvedPuzzle,
  actionRefreshDeliveryOrders,
  actionResetShop,
  actionRotateShelf,
  actionSetPrice,
  actionSleepInHouse,
  actionStartOrResume,
  actionSweepCratesToStorage,
  actionToggleRideScooter,
  actionUnlockHouseDoor,
  actionWithdrawFromStorage,
  createGumShopWorld,
  extractGumShopHud,
  saveGumShopWorldNow,
  type GumShopInput,
  type GumShopWorld,
} from './gameLogic';
import { GumShopScene } from './GumShopScene';
import { GumShopUI } from './GumShopUI';
import { pickNextDoorPuzzleId } from './puzzlesData';
import {
  getShopBounds,
  readGumShopSoundEnabled,
  saveGumShopSoundEnabled,
  type AdCampaignId,
  type GumFlavorId,
  type GumShopHudSnapshot,
  type GumShopModalTab,
  type ScooterId,
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
    <rect x="30" y="34" width="240" height="114" rx="6" fill="url(#gumWall)" stroke="#b45309" strokeWidth="3" />

    {/* Striped Candy Awning */}
    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
      <rect
        key={i}
        x={27 + i * 27.5}
        y="52"
        width="27.5"
        height="20"
        fill={i % 2 === 0 ? '#f43f5e' : '#fffbeb'}
      />
    ))}

    {/* Signboard with Gumball Dots */}
    <rect x="74" y="16" width="152" height="28" rx="8" fill="#134e4a" stroke="#fde047" strokeWidth="2.5" />
    <circle cx="92" cy="30" r="5.5" fill="#14b8a6" />
    <circle cx="106" cy="30" r="5.5" fill="#f43f5e" />
    <circle cx="194" cy="30" r="5.5" fill="#fbbf24" />
    <circle cx="208" cy="30" r="5.5" fill="#a855f7" />
    <rect x="120" y="26" width="60" height="8" rx="4" fill="#fef08a" />

    {/* Left Window showing Colorful 3D Gum Shelves Inside */}
    <rect x="44" y="84" width="76" height="52" rx="4" fill="#0f2940" stroke="#0d9488" strokeWidth="3" />
    <rect x="50" y="102" width="64" height="4" fill="#d6a461" />
    <rect x="50" y="120" width="64" height="4" fill="#d6a461" />
    <rect x="54" y="91" width="12" height="10" rx="2" fill="#14b8a6" />
    <rect x="70" y="91" width="12" height="10" rx="2" fill="#f43f5e" />
    <rect x="86" y="91" width="12" height="10" rx="2" fill="#22c55e" />
    <rect x="54" y="110" width="12" height="10" rx="2" fill="#f59e0b" />
    <rect x="70" y="110" width="12" height="10" rx="2" fill="#8b5cf6" />
    <rect x="86" y="110" width="12" height="10" rx="2" fill="#fbbf24" />

    {/* Open Glass Center Door */}
    <rect x="130" y="84" width="42" height="64" fill="#1e3a5f" stroke="#0f766e" strokeWidth="3" />
    <rect x="126" y="148" width="50" height="8" rx="3" fill="#0d9488" />

    {/* Right Window */}
    <rect x="182" y="84" width="76" height="52" rx="4" fill="#0f2940" stroke="#0d9488" strokeWidth="3" />
    <rect x="192" y="94" width="28" height="32" rx="4" fill="#fef08a" />
    <circle cx="238" cy="110" r="12" fill="#f43f5e" stroke="#fecdd3" strokeWidth="2.5" />

    {/* Cozy Sleep House Next to the Shop! */}
    <rect x="286" y="74" width="94" height="74" rx="4" fill="#fde8d7" stroke="#9a3412" strokeWidth="2.5" />
    <polygon points="278,76 333,38 388,76" fill="#c2410c" stroke="#7c2d12" strokeWidth="2.5" />
    <rect x="352" y="42" width="12" height="22" fill="#991b1b" />
    <rect x="321" y="108" width="24" height="40" rx="2" fill="#92400e" />
    <circle cx="340" cy="128" r="2.5" fill="#facc15" />
    <rect x="296" y="92" width="18" height="18" rx="2" fill="#fef08a" stroke="#78350f" strokeWidth="2" />
    <rect x="352" y="92" width="18" height="18" rx="2" fill="#fef08a" stroke="#78350f" strokeWidth="2" />

    {/* Outdoor Delivery Gum Crate Waiting on Sidewalk */}
    <rect x="58" y="152" width="42" height="30" rx="3" fill="#d4a373" stroke="#78350f" strokeWidth="2.5" />
    <rect x="58" y="163" width="42" height="8" fill="#14b8a6" />
    <polygon points="79,146 70,135 88,135" fill="#facc15" stroke="#b45309" strokeWidth="1.5" />

    {/* Shopkeeper Character */}
    <circle cx="230" cy="140" r="10" fill="#f5cba7" />
    <rect x="220" y="129" width="20" height="6" rx="3" fill="#f43f5e" />
    <rect x="219" y="151" width="22" height="24" rx="5" fill="#14b8a6" />
    <rect x="222" y="175" width="7" height="14" rx="2" fill="#1e293b" />
    <rect x="231" y="175" width="7" height="14" rx="2" fill="#1e293b" />
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
  const [moveCashierMode, setMoveCashierMode] = useState<boolean>(false);
  const [moveShelfMode, setMoveShelfMode] = useState<boolean>(false);
  const [selectedShelfSlot, setSelectedShelfSlot] = useState<number | null>(null);
  const [housePuzzleOpen, setHousePuzzleOpen] = useState<boolean>(false);
  const [activePuzzleId, setActivePuzzleId] = useState<number>(() =>
    pickNextDoorPuzzleId(worldRef.current.solvedPuzzleIds)
  );
  const [puzzleForDoor, setPuzzleForDoor] = useState<boolean>(true);
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
    setMoveCashierMode(false);
    setMoveShelfMode(false);
    setSelectedShelfSlot(null);
    setHousePuzzleOpen(false);
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

  const handleExpandShop = useCallback(() => {
    actionExpandShop(worldRef.current, audioRef.current);
    syncNow();
  }, [syncNow]);

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

  const handleBuyStorageRoom = useCallback(() => {
    actionBuyStorageRoom(worldRef.current, audioRef.current);
    syncNow();
  }, [syncNow]);

  const handleDepositToStorage = useCallback(() => {
    actionDepositCrateToStorage(worldRef.current, audioRef.current);
    syncNow();
  }, [syncNow]);

  const handleWithdrawFromStorage = useCallback(
    (flavor: GumFlavorId) => {
      actionWithdrawFromStorage(worldRef.current, flavor, audioRef.current);
      syncNow();
    },
    [syncNow]
  );

  const handleSweepCratesToStorage = useCallback(() => {
    actionSweepCratesToStorage(worldRef.current, audioRef.current);
    syncNow();
  }, [syncNow]);

  const handleAutoStockFromStorage = useCallback(() => {
    actionAutoStockFromStorage(worldRef.current, audioRef.current);
    syncNow();
  }, [syncNow]);

  const handleBuyAdCampaign = useCallback(
    (adId: AdCampaignId) => {
      actionBuyAdCampaign(worldRef.current, adId, audioRef.current);
      syncNow();
    },
    [syncNow]
  );

  const handlePromoteRank = useCallback(() => {
    actionPromoteRank(worldRef.current, audioRef.current);
    syncNow();
  }, [syncNow]);

  const handleAcceptDeliveryOrder = useCallback(
    (orderId: number) => {
      const ok = actionAcceptDeliveryOrder(worldRef.current, orderId, audioRef.current);
      if (ok) {
        setActiveTab('none');
      }
      syncNow();
    },
    [syncNow]
  );

  const handleCancelActiveDelivery = useCallback(() => {
    actionCancelActiveDelivery(worldRef.current, audioRef.current);
    syncNow();
  }, [syncNow]);

  const handleRefreshDeliveries = useCallback(() => {
    actionRefreshDeliveryOrders(worldRef.current, audioRef.current);
    syncNow();
  }, [syncNow]);

  const handleGoToActiveDelivery = useCallback(() => {
    const world = worldRef.current;
    if (world.status !== 'PLAYING' || !world.activeDelivery) return;
    setActiveTab('none');
    setMoveCashierMode(false);
    setMoveShelfMode(false);
    setSelectedShelfSlot(null);
    const dist = Math.hypot(
      world.playerX - world.activeDelivery.dropoffX,
      world.playerZ - world.activeDelivery.dropoffZ
    );
    if (dist <= 3.1) {
      actionCompleteActiveDelivery(world, audioRef.current);
      syncNow();
    } else {
      world.walkTarget = {
        x: world.activeDelivery.dropoffX,
        z: world.activeDelivery.dropoffZ,
        action: { kind: 'delivery_dropoff' },
      };
    }
  }, [syncNow]);

  const handleOpenScooterShopModal = useCallback(() => {
    worldRef.current.pendingOpenScooterShop = false;
    setMoveCashierMode(false);
    setMoveShelfMode(false);
    setSelectedShelfSlot(null);
    setHousePuzzleOpen(false);
    setActiveTab('scooter');
  }, []);

  const handleScooterShopClick = useCallback(() => {
    const world = worldRef.current;
    if (world.status !== 'PLAYING') return;
    setMoveCashierMode(false);
    setMoveShelfMode(false);
    setSelectedShelfSlot(null);
    setHousePuzzleOpen(false);
    const bounds = getShopBounds(world.shopLevel);
    const dist = Math.hypot(
      world.playerX - bounds.scooterShopDoorX,
      world.playerZ - bounds.scooterShopDoorZ
    );
    if (dist <= 4.5) {
      setActiveTab('scooter');
    } else {
      setActiveTab('none');
      world.walkTarget = {
        x: bounds.scooterShopDoorX,
        z: bounds.scooterShopDoorZ,
        action: { kind: 'scooter_shop' },
      };
    }
  }, []);

  const handleBuyScooter = useCallback(
    (scooterId: ScooterId) => {
      actionBuyScooter(worldRef.current, scooterId, audioRef.current);
      syncNow();
    },
    [syncNow]
  );

  const handleEquipScooter = useCallback(
    (scooterId: ScooterId) => {
      actionEquipScooter(worldRef.current, scooterId, audioRef.current);
      syncNow();
    },
    [syncNow]
  );

  const handleToggleRideScooter = useCallback(() => {
    actionToggleRideScooter(worldRef.current, audioRef.current);
    syncNow();
  }, [syncNow]);

  const handleOpenStorageModal = useCallback(() => {
    worldRef.current.pendingOpenStorage = false;
    setMoveCashierMode(false);
    setMoveShelfMode(false);
    setSelectedShelfSlot(null);
    setHousePuzzleOpen(false);
    setActiveTab('storage');
  }, []);

  const handleAdScreenClick = useCallback(() => {
    if (worldRef.current.status !== 'PLAYING') return;
    setMoveCashierMode(false);
    setMoveShelfMode(false);
    setSelectedShelfSlot(null);
    setHousePuzzleOpen(false);
    setActiveTab('ads');
  }, []);

  const handleStorageClick = useCallback(() => {
    const world = worldRef.current;
    if (world.status !== 'PLAYING') return;
    setMoveCashierMode(false);
    setMoveShelfMode(false);
    setSelectedShelfSlot(null);
    setHousePuzzleOpen(false);

    if (!world.hasStorageRoom) {
      setActiveTab('storage');
      return;
    }

    const bounds = getShopBounds(world.shopLevel);
    const dist = Math.hypot(
      world.playerX - bounds.storageDoorX,
      world.playerZ - bounds.storageDoorZ
    );
    if (dist <= 2.5) {
      if (world.carriedCrate) {
        actionDepositCrateToStorage(world, audioRef.current);
        syncNow();
      } else {
        setActiveTab('storage');
      }
    } else {
      world.walkTarget = {
        x: bounds.storageDoorX,
        z: bounds.storageDoorZ,
        action: { kind: 'storage_interact' },
      };
    }
  }, [syncNow]);

  const handlePayRent = useCallback(() => {
    actionPayRentAndNextDay(worldRef.current, audioRef.current);
    setActiveTab('none');
    setMoveCashierMode(false);
    setMoveShelfMode(false);
    setSelectedShelfSlot(null);
    setHousePuzzleOpen(false);
    syncNow();
  }, [syncNow]);

  const handleEmergencyGrant = useCallback(() => {
    actionEmergencyGrant(worldRef.current, audioRef.current);
    syncNow();
  }, [syncNow]);

  const handleInteractNearest = useCallback(() => {
    const world = worldRef.current;
    actionInteractNearest(world, audioRef.current);
    if (world.pendingHousePuzzle) {
      world.pendingHousePuzzle = false;
      setActiveTab('none');
      setMoveCashierMode(false);
      setMoveShelfMode(false);
      setSelectedShelfSlot(null);
      setActivePuzzleId(pickNextDoorPuzzleId(world.solvedPuzzleIds));
      setPuzzleForDoor(true);
      setHousePuzzleOpen(true);
    } else if (world.pendingOpenStorage) {
      world.pendingOpenStorage = false;
      setMoveCashierMode(false);
      setMoveShelfMode(false);
      setSelectedShelfSlot(null);
      setHousePuzzleOpen(false);
      setActiveTab('storage');
    } else if (world.pendingOpenScooterShop) {
      world.pendingOpenScooterShop = false;
      setMoveCashierMode(false);
      setMoveShelfMode(false);
      setSelectedShelfSlot(null);
      setHousePuzzleOpen(false);
      setActiveTab('scooter');
    }
    syncNow();
  }, [syncNow]);

  const handleToggleMoveCashier = useCallback(() => {
    setActiveTab('none');
    setMoveShelfMode(false);
    setSelectedShelfSlot(null);
    setHousePuzzleOpen(false);
    setMoveCashierMode((prev) => !prev);
  }, []);

  const handleToggleMoveShelf = useCallback(() => {
    setActiveTab('none');
    setMoveCashierMode(false);
    setHousePuzzleOpen(false);
    setSelectedShelfSlot(null);
    setMoveShelfMode((prev) => !prev);
  }, []);

  const handleMoveCashierTo = useCallback(
    (x: number, z: number) => {
      const world = worldRef.current;
      if (world.status !== 'PLAYING') return;
      const moved = actionMoveCashier(world, x, z, audioRef.current);
      if (moved) {
        setMoveCashierMode(false);
      }
      syncNow();
    },
    [syncNow]
  );

  const handleMoveShelfTo = useCallback(
    (x: number, z: number) => {
      const world = worldRef.current;
      if (world.status !== 'PLAYING' || selectedShelfSlot === null) return;
      const shelf = world.shelves.find((s) => s.slotIndex === selectedShelfSlot);
      if (!shelf) return;
      const moved = actionMoveShelf(world, selectedShelfSlot, x, z, shelf.rotY, audioRef.current);
      if (moved) {
        setSelectedShelfSlot(null);
      }
      syncNow();
    },
    [selectedShelfSlot, syncNow]
  );

  const handleRotateSelectedShelf = useCallback(() => {
    const world = worldRef.current;
    if (world.status !== 'PLAYING' || selectedShelfSlot === null) return;
    actionRotateShelf(world, selectedShelfSlot, audioRef.current);
    syncNow();
  }, [selectedShelfSlot, syncNow]);

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

  const handleShelfClick = useCallback(
    (slotIndex: number) => {
      const world = worldRef.current;
      if (world.status !== 'PLAYING') return;
      if (moveShelfMode) {
        setSelectedShelfSlot((prev) => (prev === slotIndex ? null : slotIndex));
        return;
      }
      const shelf = world.shelves.find((s) => s.slotIndex === slotIndex);
      if (!shelf) return;
      const frontX = shelf.x + Math.sin(shelf.rotY) * 1.15;
      const frontZ = shelf.z + Math.cos(shelf.rotY) * 1.15;
      world.walkTarget = {
        x: frontX,
        z: frontZ,
        action: world.carriedCrate ? { kind: 'stock_shelf', slotIndex } : undefined,
      };
    },
    [moveShelfMode]
  );

  const handleCheckoutClick = useCallback(() => {
    const world = worldRef.current;
    if (world.status !== 'PLAYING') return;
    const dist = Math.hypot(
      world.playerX - world.cashierX,
      world.playerZ - world.cashierZ
    );
    if (dist <= 2.4) {
      actionCheckoutCustomers(world, audioRef.current, true);
      syncNow();
    } else {
      const standX = world.cashierX >= 0 ? world.cashierX - 1.15 : world.cashierX + 1.15;
      world.walkTarget = {
        x: standX,
        z: world.cashierZ,
        action: { kind: 'checkout' },
      };
    }
  }, [syncNow]);

  const handleOpenHousePuzzle = useCallback(() => {
    const world = worldRef.current;
    world.pendingHousePuzzle = false;
    setActiveTab('none');
    setMoveCashierMode(false);
    setMoveShelfMode(false);
    setSelectedShelfSlot(null);
    setActivePuzzleId(pickNextDoorPuzzleId(world.solvedPuzzleIds));
    setPuzzleForDoor(true);
    setHousePuzzleOpen(true);
  }, []);

  const handleOpenPuzzleIndex = useCallback(() => {
    worldRef.current.pendingHousePuzzle = false;
    setHousePuzzleOpen(false);
    setMoveCashierMode(false);
    setMoveShelfMode(false);
    setSelectedShelfSlot(null);
    setActiveTab((prev) => (prev === 'puzzles' ? 'none' : 'puzzles'));
  }, []);

  const handlePlayPuzzleFromIndex = useCallback((puzzleId: number) => {
    const world = worldRef.current;
    world.pendingHousePuzzle = false;
    setActiveTab('none');
    setMoveCashierMode(false);
    setMoveShelfMode(false);
    setSelectedShelfSlot(null);
    setActivePuzzleId(puzzleId);
    setPuzzleForDoor(!world.houseDoorUnlocked);
    setHousePuzzleOpen(true);
  }, []);

  const handleCloseHousePuzzle = useCallback(() => {
    worldRef.current.pendingHousePuzzle = false;
    setHousePuzzleOpen(false);
  }, []);

  const handlePuzzleBeep = useCallback((good: boolean) => {
    if (good) {
      audioRef.current.playPickup();
    } else {
      audioRef.current.playWarn();
    }
  }, []);

  const handleHouseDoorClick = useCallback(() => {
    const world = worldRef.current;
    if (world.status !== 'PLAYING') return;
    setActiveTab('none');
    setMoveCashierMode(false);
    setMoveShelfMode(false);
    setSelectedShelfSlot(null);
    const bounds = getShopBounds(world.shopLevel);

    if (!world.houseDoorUnlocked) {
      const dist = Math.hypot(
        world.playerX - bounds.houseDoorX,
        world.playerZ - bounds.houseDoorZ
      );
      if (dist <= 2.3) {
        setActivePuzzleId(pickNextDoorPuzzleId(world.solvedPuzzleIds));
        setPuzzleForDoor(true);
        setHousePuzzleOpen(true);
      } else {
        world.walkTarget = {
          x: bounds.houseDoorX,
          z: bounds.houseDoorZ,
          action: { kind: 'open_house_puzzle' },
        };
      }
      return;
    }

    // Door already unlocked -> walk right inside the house bedroom!
    world.walkTarget = {
      x: bounds.houseX,
      z: bounds.houseZ + 0.65,
    };
  }, []);

  const handleBedClick = useCallback(() => {
    const world = worldRef.current;
    if (world.status !== 'PLAYING') return;
    setActiveTab('none');
    setMoveCashierMode(false);
    setMoveShelfMode(false);
    setSelectedShelfSlot(null);
    const bounds = getShopBounds(world.shopLevel);

    if (!world.houseDoorUnlocked) {
      handleHouseDoorClick();
      return;
    }

    if (!world.isNight) {
      actionSleepInHouse(world, audioRef.current);
      syncNow();
      return;
    }

    const dist = Math.hypot(world.playerX - bounds.bedX, world.playerZ - bounds.bedZ);
    if (dist <= 2.0) {
      actionSleepInHouse(world, audioRef.current);
      syncNow();
    } else {
      world.walkTarget = {
        x: bounds.bedX - 0.9,
        z: bounds.bedZ + 0.45,
        action: { kind: 'sleep_bed' },
      };
    }
  }, [handleHouseDoorClick, syncNow]);

  const handleGoToHouse = useCallback(() => {
    if (worldRef.current.houseDoorUnlocked) {
      handleBedClick();
    } else {
      handleHouseDoorClick();
    }
  }, [handleBedClick, handleHouseDoorClick]);

  const handleSolveHousePuzzle = useCallback(
    (solvedPuzzleId: number) => {
      const world = worldRef.current;
      setHousePuzzleOpen(false);
      if (puzzleForDoor || !world.houseDoorUnlocked) {
        actionUnlockHouseDoor(world, audioRef.current, solvedPuzzleId);
        const bounds = getShopBounds(world.shopLevel);
        // Automatically step through the freshly opened door into the bedroom!
        world.walkTarget = {
          x: bounds.houseX,
          z: bounds.houseZ + 0.7,
        };
      } else {
        actionRecordSolvedPuzzle(world, solvedPuzzleId, audioRef.current);
        setActiveTab('puzzles');
      }
      syncNow();
    },
    [puzzleForDoor, syncNow]
  );

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

  // Keyboard controls (WASD / Arrows / E to interact / Escape to close modal or cancel move)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        e.preventDefault();
        if (housePuzzleOpen) {
          setHousePuzzleOpen(false);
        } else if (moveShelfMode) {
          setMoveShelfMode(false);
          setSelectedShelfSlot(null);
        } else if (moveCashierMode) {
          setMoveCashierMode(false);
        } else if (activeTab !== 'none') {
          setActiveTab('none');
        } else {
          handleExit();
        }
        return;
      }
      if (
        e.code === 'KeyE' &&
        worldRef.current.status === 'PLAYING' &&
        activeTab === 'none' &&
        !housePuzzleOpen
      ) {
        e.preventDefault();
        handleInteractNearest();
        return;
      }
      if (
        e.code === 'KeyR' &&
        worldRef.current.status === 'PLAYING' &&
        activeTab === 'none' &&
        !housePuzzleOpen
      ) {
        e.preventDefault();
        handleToggleRideScooter();
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
  }, [
    activeTab,
    housePuzzleOpen,
    moveCashierMode,
    moveShelfMode,
    handleExit,
    handleInteractNearest,
    handleToggleRideScooter,
    recomputeInput,
  ]);

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
        moveCashierMode={moveCashierMode}
        moveShelfMode={moveShelfMode}
        selectedShelfSlot={selectedShelfSlot}
        onHudUpdate={setHud}
        onFloorClick={handleFloorClick}
        onMoveCashierTo={handleMoveCashierTo}
        onMoveShelfTo={handleMoveShelfTo}
        onCrateClick={handleCrateClick}
        onShelfClick={handleShelfClick}
        onCheckoutClick={handleCheckoutClick}
        onHouseDoorClick={handleHouseDoorClick}
        onBedClick={handleBedClick}
        onStorageClick={handleStorageClick}
        onScooterShopClick={handleScooterShopClick}
        onDeliveryBeaconClick={handleGoToActiveDelivery}
        onAdScreenClick={handleAdScreenClick}
        onOpenHousePuzzle={handleOpenHousePuzzle}
        onOpenStorageModal={handleOpenStorageModal}
        onOpenScooterShopModal={handleOpenScooterShopModal}
      />

      <GumShopUI
        lang={lang}
        hud={hud}
        hasExistingSave={worldRef.current.hasExistingSave}
        soundEnabled={soundEnabled}
        activeTab={activeTab}
        moveCashierMode={moveCashierMode}
        moveShelfMode={moveShelfMode}
        selectedShelfSlot={selectedShelfSlot}
        housePuzzleOpen={housePuzzleOpen}
        activePuzzleId={activePuzzleId}
        puzzleForDoor={puzzleForDoor}
        onSetTab={(tab) => {
          setMoveCashierMode(false);
          setMoveShelfMode(false);
          setSelectedShelfSlot(null);
          setHousePuzzleOpen(false);
          setActiveTab(tab);
        }}
        onToggleMoveCashier={handleToggleMoveCashier}
        onToggleMoveShelf={handleToggleMoveShelf}
        onRotateSelectedShelf={handleRotateSelectedShelf}
        onSelectPuzzle={setActivePuzzleId}
        onPlayPuzzleFromIndex={handlePlayPuzzleFromIndex}
        onOpenPuzzleIndex={handleOpenPuzzleIndex}
        onCloseHousePuzzle={handleCloseHousePuzzle}
        onSolveHousePuzzle={handleSolveHousePuzzle}
        onPuzzleBeep={handlePuzzleBeep}
        onStartOrResume={handleStartOrResume}
        onResetShop={handleResetShop}
        onOrderCrate={handleOrderCrate}
        onSetPrice={handleSetPrice}
        onExpandShop={handleExpandShop}
        onBuyShelf={handleBuyShelf}
        onBuyUpgrade={handleBuyUpgrade}
        onBuyStorageRoom={handleBuyStorageRoom}
        onDepositToStorage={handleDepositToStorage}
        onWithdrawFromStorage={handleWithdrawFromStorage}
        onSweepCratesToStorage={handleSweepCratesToStorage}
        onAutoStockFromStorage={handleAutoStockFromStorage}
        onBuyAdCampaign={handleBuyAdCampaign}
        onPromoteRank={handlePromoteRank}
        onAcceptDeliveryOrder={handleAcceptDeliveryOrder}
        onCancelActiveDelivery={handleCancelActiveDelivery}
        onRefreshDeliveries={handleRefreshDeliveries}
        onGoToActiveDelivery={handleGoToActiveDelivery}
        onGoToScooterShop={handleScooterShopClick}
        onBuyScooter={handleBuyScooter}
        onEquipScooter={handleEquipScooter}
        onToggleRideScooter={handleToggleRideScooter}
        onPayRent={handlePayRent}
        onEmergencyGrant={handleEmergencyGrant}
        onInteractNearest={handleInteractNearest}
        onGoOutsideToCrates={handleGoOutsideToCrates}
        onGoToHouse={handleGoToHouse}
        onCheckoutNow={handleCheckoutClick}
        onJoystickMove={handleJoystickMove}
        onToggleSound={handleToggleSound}
        onExit={handleExit}
      />
    </div>
  );
};
