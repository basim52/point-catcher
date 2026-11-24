import React, { useRef, useState } from 'react';
import { getPetDamageMultiplier, getPetMaxHp } from './gameLogic';
import {
  ALL_FRUIT_IDS,
  ALL_PET_IDS,
  ALL_WEAPON_IDS,
  FRUIT_SPECS,
  FruitId,
  MAX_PET_LEVEL,
  MAX_PET_SQUAD,
  MonsterArenaHudSnapshot,
  PET_SPECS,
  PetId,
  WEAPON_SPECS,
  WeaponId,
} from './types';

export type ArenaShopTab = 'fruits' | 'weapons' | 'pets';

interface MonsterArenaUIProps {
  lang: 'ar' | 'en';
  hud: MonsterArenaHudSnapshot;
  soundEnabled: boolean;
  shopTab: ArenaShopTab | null;
  onOpenShopTab: (tab: ArenaShopTab) => void;
  onCloseShop: () => void;
  onContinueSaved: () => void;
  onStartNew: () => void;
  onPause: () => void;
  onResume: () => void;
  onToggleSound: () => void;
  onBuyFruit: (fruitId: FruitId) => void;
  onBuyOrEquipWeapon: (weaponId: WeaponId) => void;
  onBuyPet: (petId: PetId) => void;
  onMergePetPair: (petId: PetId, level: number) => void;
  onMergeAllPets: () => void;
  onMoveOrMergeSlot: (fromSlot: number, toSlot: number) => void;
  onClearPetSelection: () => void;
  onRecallAllPets: () => void;
  onDash: () => void;
  onJoystickMove: (x: number, z: number) => void;
  onExit: () => void;
}

const FRUIT_ICONS: Record<FruitId, string> = {
  apple: '🍎',
  banana: '🍌',
  watermelon: '🍉',
  mango: '🥭',
  dragonfruit: '🐉',
  golden_date: '🌴',
};

const PET_ICONS: Record<PetId, string> = {
  wolf: '🐺',
  falcon: '🦅',
  bear: '🐻',
  panther: '🐆',
  lion: '🦁',
  baby_dragon: '🐲',
};

const WEAPON_ICONS: Record<WeaponId, string> = {
  plasma_pistol: '🔫',
  twin_blasters: '⚡',
  scatter_shotgun: '🔥',
  frost_rifle: '❄️',
  thunder_cannon: '🌩️',
  venom_gatling: '☣️',
  dragon_flamethrower: '☄️',
  cosmic_annihilator: '🌌',
};

function formatCountdown(totalSec: number): string {
  const clamped = Math.max(0, Math.ceil(totalSec));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const MonsterArenaUI: React.FC<MonsterArenaUIProps> = ({
  lang,
  hud,
  soundEnabled,
  shopTab,
  onOpenShopTab,
  onCloseShop,
  onContinueSaved,
  onStartNew,
  onPause,
  onResume,
  onToggleSound,
  onBuyFruit,
  onBuyOrEquipWeapon,
  onBuyPet,
  onMergePetPair,
  onMergeAllPets,
  onMoveOrMergeSlot,
  onClearPetSelection,
  onRecallAllPets,
  onDash,
  onJoystickMove,
  onExit,
}) => {
  const isAr = lang === 'ar';
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [pickedSlot, setPickedSlot] = useState<number | null>(null);
  const [dragFromSlot, setDragFromSlot] = useState<number | null>(null);

  // Virtual joystick state (bottom-left)
  const joyBaseRef = useRef<HTMLDivElement | null>(null);
  const activePointerRef = useRef<number | null>(null);
  const [joyKnob, setJoyKnob] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const MAX_JOY_RADIUS = 38;

  const updateJoystickFromEvent = (clientX: number, clientY: number) => {
    const el = joyBaseRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > MAX_JOY_RADIUS) {
      dx = (dx / dist) * MAX_JOY_RADIUS;
      dy = (dy / dist) * MAX_JOY_RADIUS;
    }
    setJoyKnob({ x: dx, y: dy });
    onJoystickMove(dx / MAX_JOY_RADIUS, dy / MAX_JOY_RADIUS);
  };

  const handleJoyDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    activePointerRef.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    updateJoystickFromEvent(e.clientX, e.clientY);
  };

  const handleJoyMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerRef.current !== e.pointerId) return;
    e.stopPropagation();
    updateJoystickFromEvent(e.clientX, e.clientY);
  };

  const handleJoyUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerRef.current !== e.pointerId) return;
    e.stopPropagation();
    activePointerRef.current = null;
    setJoyKnob({ x: 0, y: 0 });
    onJoystickMove(0, 0);
  };

  const energyPct = Math.max(
    0,
    Math.min(100, (hud.energy / Math.max(1, hud.maxEnergy)) * 100)
  );
  const warlordPct =
    hud.warlordMaxHp > 0
      ? Math.max(0, Math.min(100, (hud.warlordHp / hud.warlordMaxHp) * 100))
      : 0;
  const titanPct =
    hud.titanMaxHp > 0
      ? Math.max(0, Math.min(100, (hud.titanHp / hud.titanMaxHp) * 100))
      : 0;
  const ownedPetCount = hud.petRoster.length;
  const activeWeaponSpec = WEAPON_SPECS[hud.activeWeapon];
  const warlordUrgent = hud.warlordTimer <= 20 || hud.warlordActive;
  const titanUrgent = hud.titanTimer <= 30 || hud.titanActive;

  // Group current pet squad by (petId, level) for clean merge UI
  const petStackMap = new Map<string, { petId: PetId; level: number; count: number }>();
  for (const slot of hud.petRoster) {
    const key = `${slot.petId}:${slot.level}`;
    const existing = petStackMap.get(key);
    if (existing) {
      existing.count++;
    } else {
      petStackMap.set(key, { petId: slot.petId, level: slot.level, count: 1 });
    }
  }
  const petStacks = Array.from(petStackMap.values()).sort((a, b) =>
    a.petId === b.petId ? b.level - a.level : ALL_PET_IDS.indexOf(a.petId) - ALL_PET_IDS.indexOf(b.petId)
  );

  // Build 12-slot interactive board lookup for Drag & Tap Move/Merge
  const slotMap = new Map<
    number,
    { petId: PetId; level: number; slot: number; hp?: number; maxHp?: number }
  >();
  for (const s of hud.petRoster) {
    slotMap.set(s.slot, s);
  }
  const activeSourceSlot = dragFromSlot !== null ? dragFromSlot : pickedSlot;
  const activeSourcePet = activeSourceSlot !== null ? slotMap.get(activeSourceSlot) ?? null : null;

  const handleBoardSlotClick = (slotIdx: number) => {
    const occupant = slotMap.get(slotIdx);
    if (pickedSlot === null) {
      if (occupant) setPickedSlot(slotIdx);
      return;
    }
    if (pickedSlot === slotIdx) {
      setPickedSlot(null);
      return;
    }
    onMoveOrMergeSlot(pickedSlot, slotIdx);
    setPickedSlot(null);
  };

  const activeBuffs: Array<{ label: string; sec: number; colorClass: string }> = [];
  if (hud.speedBuffTimer > 0) {
    activeBuffs.push({
      label: isAr ? '⚡ سرعة' : '⚡ Speed',
      sec: Math.ceil(hud.speedBuffTimer),
      colorClass: 'border-amber-400/70 text-amber-200 bg-[#2a1f0b]/95',
    });
  }
  if (hud.damageBuffTimer > 0) {
    activeBuffs.push({
      label: isAr ? '🔥 ضرر +25%' : '🔥 DMG +25%',
      sec: Math.ceil(hud.damageBuffTimer),
      colorClass: 'border-orange-400/70 text-orange-200 bg-[#2c150c]/95',
    });
  }
  if (hud.shieldBuffTimer > 0) {
    activeBuffs.push({
      label: isAr ? '🛡️ درع' : '🛡️ Shield',
      sec: Math.ceil(hud.shieldBuffTimer),
      colorClass: 'border-pink-400/70 text-pink-200 bg-[#2b0f22]/95',
    });
  }
  if (hud.rapidFireBuffTimer > 0) {
    activeBuffs.push({
      label: isAr ? '☄️ إطلاق سريع' : '☄️ Rapid Fire',
      sec: Math.ceil(hud.rapidFireBuffTimer),
      colorClass: 'border-yellow-300/70 text-yellow-200 bg-[#2a230b]/95',
    });
  }

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-2.5 sm:p-4 text-slate-100 select-none"
    >
      {/* TOP HUD BAR */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Left/Start Group: Exit + Energy + Coins */}
          <div className="pointer-events-auto flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onExit}
              className="px-3 py-1.5 rounded-lg bg-[#161024]/95 hover:bg-[#231939] border border-slate-600/70 text-xs sm:text-sm font-bold text-slate-100 cursor-pointer transition-colors"
            >
              {isAr ? '← خروج' : '← Exit'}
            </button>

            {/* Energy / HP Bar */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#161024]/95 border border-emerald-500/45 min-w-[168px] sm:min-w-[205px]">
              <span className="text-sm font-bold text-emerald-300">
                {isAr ? 'الطاقة' : 'HP'}
              </span>
              <div className="flex-1 h-2.5 bg-slate-800 rounded-sm overflow-hidden border border-slate-700">
                <div
                  className="h-full transition-all duration-150"
                  style={{
                    width: `${energyPct}%`,
                    backgroundColor:
                      energyPct > 45 ? '#22c55e' : energyPct > 22 ? '#f59e0b' : '#ef4444',
                  }}
                />
              </div>
              <span className="font-num text-xs font-extrabold text-white whitespace-nowrap">
                {hud.energy}/{hud.maxEnergy}
              </span>
            </div>

            {/* Coins */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#241b0b]/95 border border-amber-400/55">
              <span className="text-sm">💰</span>
              <span className="font-num text-sm font-black text-amber-300">
                {hud.coins.toLocaleString()}
              </span>
            </div>

            {/* Wave & Kills */}
            <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-[#161024]/95 border border-indigo-400/40 text-xs font-bold">
              <span>
                {isAr ? 'الموجة' : 'Wave'}{' '}
                <strong className="font-num text-indigo-300">{hud.wave}</strong>
              </span>
              <span className="text-slate-500">|</span>
              <span>
                💀 <strong className="font-num text-rose-300">{hud.kills}</strong>
              </span>
            </div>
          </div>

          {/* Right/End Group: 3-Min Boss Timer + 10-Min Boss Timer + Sound + Pause */}
          <div className="pointer-events-auto flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* 3-Minute Warlord Boss Countdown */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs sm:text-sm font-extrabold ${
                warlordUrgent
                  ? 'bg-[#361607]/95 border-orange-400 text-orange-100'
                  : 'bg-[#21130e]/95 border-amber-500/55 text-amber-100'
              }`}
              title={
                isAr
                  ? 'العد التنازلي لظهور وحش الـ 3 دقائق القوي «سيد الحمم»'
                  : 'Countdown to 3-Minute Strong Inferno Warlord Boss'
              }
            >
              <span>🔥</span>
              <span className="hidden lg:inline text-xs opacity-90">
                {hud.warlordActive
                  ? isAr
                    ? 'سيد الحمم!'
                    : 'Warlord!'
                  : isAr
                  ? 'وحش 3د:'
                  : '3m Boss:'}
              </span>
              <span className="font-num text-xs sm:text-sm font-black tracking-wider">
                {formatCountdown(hud.warlordTimer)}
              </span>
            </div>

            {/* 10-Minute Titan Boss Countdown */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs sm:text-sm font-extrabold ${
                titanUrgent
                  ? 'bg-[#350d1b]/95 border-rose-500 text-rose-100'
                  : 'bg-[#1b122b]/95 border-purple-400/55 text-purple-100'
              }`}
              title={
                isAr
                  ? 'العد التنازلي لظهور وحش الـ 10 دقائق القوي'
                  : 'Countdown to 10-Minute Strong Dread Titan Boss'
              }
            >
              <span>👹</span>
              <span className="hidden lg:inline text-xs opacity-90">
                {hud.titanActive
                  ? isAr
                    ? 'الطاغية!'
                    : 'Titan!'
                  : isAr
                  ? 'زعيم 10د:'
                  : '10m Boss:'}
              </span>
              <span className="font-num text-xs sm:text-sm font-black tracking-wider">
                {formatCountdown(hud.titanTimer)}
              </span>
            </div>

            <button
              type="button"
              onClick={onToggleSound}
              aria-label={isAr ? 'الصوت' : 'Sound'}
              className="px-2.5 py-1.5 rounded-lg bg-[#161024]/95 hover:bg-[#231939] border border-slate-600/70 text-sm font-bold cursor-pointer"
            >
              {soundEnabled ? '🔊' : '🔇'}
            </button>

            {hud.status === 'PLAYING' && (
              <button
                type="button"
                onClick={onPause}
                aria-label={isAr ? 'إيقاف مؤقت' : 'Pause'}
                className="px-2.5 py-1.5 rounded-lg bg-[#161024]/95 hover:bg-[#231939] border border-slate-600/70 text-sm font-bold cursor-pointer"
              >
                ⏸️
              </button>
            )}
          </div>
        </div>

        {/* 3-MINUTE WARLORD BOSS HP BAR */}
        {hud.warlordActive && (
          <div className="mx-auto w-full max-w-xl px-3 py-2 rounded-xl bg-[#2a1106]/95 border-2 border-orange-500 shadow-lg">
            <div className="flex items-center justify-between text-xs sm:text-sm font-black text-orange-100 mb-1">
              <span>
                🔥{' '}
                {isAr
                  ? `وحش الـ 3 دقائق: سيد الحمم (مستوى ${hud.warlordLevel})`
                  : `3-Min Boss: Inferno Warlord (Lv.${hud.warlordLevel})`}
              </span>
              <span className="font-num text-amber-300">
                {hud.warlordHp.toLocaleString()} / {hud.warlordMaxHp.toLocaleString()}
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-950 rounded-sm overflow-hidden border border-orange-400/50">
              <div
                className="h-full bg-gradient-to-r from-orange-600 via-amber-500 to-yellow-300 transition-all duration-100"
                style={{ width: `${warlordPct}%` }}
              />
            </div>
          </div>
        )}

        {/* 10-MINUTE TITAN BOSS HP BAR */}
        {hud.titanActive && (
          <div className="mx-auto w-full max-w-xl px-3 py-2 rounded-xl bg-[#270914]/95 border-2 border-rose-500 shadow-lg">
            <div className="flex items-center justify-between text-xs sm:text-sm font-black text-rose-100 mb-1">
              <span>
                🔥{' '}
                {isAr
                  ? `وحش الـ 10 دقائق: الطاغية الأبدي (مستوى ${hud.titanLevel})`
                  : `10-Min Boss: Eternal Dread Titan (Lv.${hud.titanLevel})`}
              </span>
              <span className="font-num text-amber-300">
                {hud.titanHp.toLocaleString()} / {hud.titanMaxHp.toLocaleString()}
              </span>
            </div>
            <div className="h-3 w-full bg-slate-950 rounded-sm overflow-hidden border border-rose-400/50">
              <div
                className="h-full bg-gradient-to-r from-rose-600 via-red-500 to-amber-400 transition-all duration-100"
                style={{ width: `${titanPct}%` }}
              />
            </div>
          </div>
        )}

        {/* BANNER & ACTIVE FRUIT BUFFS */}
        <div className="flex flex-col items-center gap-1.5">
          {hud.bannerText && (
            <div
              className={`px-4 py-1.5 rounded-lg border text-xs sm:text-sm font-extrabold text-center max-w-xl ${
                hud.bannerTone === 'boss'
                  ? 'bg-[#360b1b]/95 border-rose-500 text-rose-100'
                  : hud.bannerTone === 'warn'
                  ? 'bg-[#331b08]/95 border-amber-400 text-amber-100'
                  : hud.bannerTone === 'shop'
                  ? 'bg-[#0e2a1e]/95 border-emerald-400 text-emerald-100'
                  : 'bg-[#161129]/95 border-sky-400/60 text-sky-100'
              }`}
            >
              {hud.bannerText}
            </div>
          )}

          {activeBuffs.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {activeBuffs.map((b) => (
                <span
                  key={b.label}
                  className={`px-2.5 py-0.5 rounded-md border text-[11px] font-bold ${b.colorClass}`}
                >
                  {b.label} <span className="font-num">{b.sec}s</span>
                </span>
              ))}
            </div>
          )}

          {/* 3D Selected Pet Helper Bar (Move or Merge Directly in 3D!) */}
          {hud.status === 'PLAYING' && !shopTab && hud.selectedPetInfo && (
            <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 px-3 py-1.5 rounded-xl bg-[#27143b]/95 border-2 border-amber-400 text-xs font-extrabold text-amber-100 shadow-lg">
              <span>
                {PET_ICONS[hud.selectedPetInfo.petId]}{' '}
                {isAr
                  ? `${PET_SPECS[hud.selectedPetInfo.petId].nameAr} (Lv.${hud.selectedPetInfo.level}) — اضغط على مثيله للدمج 🔀 أو على أرض الحلبة لنقله 📍`
                  : `${PET_SPECS[hud.selectedPetInfo.petId].nameEn} (Lv.${hud.selectedPetInfo.level}) — Tap a match to Merge 🔀 or the floor to Move 📍`}
              </span>
              <button
                type="button"
                onClick={onClearPetSelection}
                className="px-2 py-0.5 rounded bg-rose-700 hover:bg-rose-600 text-white text-[11px] cursor-pointer"
              >
                {isAr ? '✕ إلغاء' : '✕ Cancel'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM CONTROLS: VIRTUAL JOYSTICK + COLLAPSIBLE SHOP/DASH DOCK */}
      {hud.status === 'PLAYING' && !shopTab && (
        <div className="flex items-end justify-between gap-2 pb-1">
          {/* Bottom-Left Touch / Mouse Virtual Joystick (always LTR coordinates) */}
          <div dir="ltr" className="pointer-events-auto flex flex-col items-center gap-1">
            <div
              ref={joyBaseRef}
              onPointerDown={handleJoyDown}
              onPointerMove={handleJoyMove}
              onPointerUp={handleJoyUp}
              onPointerCancel={handleJoyUp}
              className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#150f24]/85 border-2 border-amber-400/50 touch-none flex items-center justify-center cursor-grab active:cursor-grabbing"
              aria-label={isAr ? 'عصا التحرك' : 'Movement Joystick'}
            >
              <div className="w-10 h-10 rounded-full border border-slate-500/40" />
              <div
                className="absolute w-11 h-11 rounded-full bg-amber-400 border-2 border-amber-100 shadow-md"
                style={{
                  transform: `translate(${joyKnob.x}px, ${joyKnob.y}px)`,
                }}
              />
            </div>
            <span className="text-[10px] font-bold text-slate-300 bg-[#120d1c]/85 px-2 py-0.5 rounded">
              WASD / {isAr ? 'اسحب للحركة' : 'Drag to Move'}
            </span>
          </div>

          {/* Bottom-Center / Right Collapsible Action Dock */}
          <div className="pointer-events-auto flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-2">
              <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#161024]/95 border border-slate-600/60 text-xs font-bold text-slate-200">
                <span>{WEAPON_ICONS[hud.activeWeapon]}</span>
                <span>{isAr ? activeWeaponSpec.nameAr : activeWeaponSpec.nameEn}</span>
              </span>
              <button
                type="button"
                onClick={() => setDockCollapsed((c) => !c)}
                className="px-2.5 py-1 rounded-lg bg-[#161024]/95 hover:bg-[#231939] border border-slate-600/70 text-[11px] font-bold text-slate-200 cursor-pointer"
              >
                {dockCollapsed
                  ? isAr
                    ? '▲ إظهار المتاجر'
                    : '▲ Show Shops'
                  : isAr
                  ? '▼ تصغير'
                  : '▼ Hide'}
              </button>
            </div>

            {!dockCollapsed && (
              <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2 p-1.5 rounded-xl bg-[#130e20]/95 border border-slate-600/60">
                {/* Fruit Energy Shop */}
                <button
                  type="button"
                  onClick={() => onOpenShopTab('fruits')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 border border-emerald-400/60 text-xs sm:text-sm font-extrabold text-white cursor-pointer transition-colors"
                >
                  <span>🍎</span>
                  <span>{isAr ? 'متجر الفواكه' : 'Fruit Shop'}</span>
                </button>

                {/* Weapons Shop */}
                <button
                  type="button"
                  onClick={() => onOpenShopTab('weapons')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-700 hover:bg-indigo-600 border border-indigo-400/60 text-xs sm:text-sm font-extrabold text-white cursor-pointer transition-colors"
                >
                  <span>⚔️</span>
                  <span>{isAr ? 'الأسلحة' : 'Weapons'}</span>
                  <span className="font-num text-[11px] px-1.5 py-0.5 rounded bg-black/30">
                    {hud.ownedWeapons.length}/{ALL_WEAPON_IDS.length}
                  </span>
                </button>

                {/* Companion Pets Shop */}
                <button
                  type="button"
                  onClick={() => onOpenShopTab('pets')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-700 hover:bg-amber-600 border border-amber-400/60 text-xs sm:text-sm font-extrabold text-white cursor-pointer transition-colors"
                >
                  <span>🐾</span>
                  <span>{isAr ? 'الحيوانات' : 'Battle Pets'}</span>
                  <span className="font-num text-[11px] px-1.5 py-0.5 rounded bg-black/30">
                    {ownedPetCount}/{MAX_PET_SQUAD}
                  </span>
                </button>

                {/* Quick Merge Pets Button when 2+ identical pets are ready */}
                {hud.mergeableCount > 0 && (
                  <button
                    type="button"
                    onClick={onMergeAllPets}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 border border-fuchsia-300 text-xs sm:text-sm font-black text-white cursor-pointer transition-colors"
                  >
                    <span>🔀</span>
                    <span>{isAr ? `دمج (${hud.mergeableCount})` : `Merge (${hud.mergeableCount})`}</span>
                  </button>
                )}

                {/* Recall Stationed Pets back to Hero */}
                {hud.hasStationedPets && (
                  <button
                    type="button"
                    onClick={onRecallAllPets}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-600 border border-cyan-300/70 text-xs sm:text-sm font-extrabold text-white cursor-pointer transition-colors"
                  >
                    <span>🧲</span>
                    <span>{isAr ? 'تجميع' : 'Recall'}</span>
                  </button>
                )}

                {/* Dash Ability */}
                <button
                  type="button"
                  onClick={onDash}
                  disabled={hud.dashCooldown > 0}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs sm:text-sm font-extrabold transition-colors ${
                    hud.dashCooldown > 0
                      ? 'bg-slate-800 border-slate-600 text-slate-400 cursor-not-allowed'
                      : 'bg-sky-600 hover:bg-sky-500 border-sky-300/70 text-white cursor-pointer'
                  }`}
                >
                  <span>⚡</span>
                  <span>
                    {hud.dashCooldown > 0
                      ? `${hud.dashCooldown.toFixed(1)}s`
                      : isAr
                      ? 'اندفاع'
                      : 'Dash'}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* UNIFIED SHOP MODAL (FRUITS / WEAPONS / BATTLE PETS) */}
      {shopTab && (
        <div className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-3 sm:p-5">
          <div className="w-full max-w-3xl max-h-[88vh] flex flex-col rounded-2xl bg-[#151024] border-2 border-amber-400/60 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-[#1d1533] border-b border-slate-700">
              <div className="flex items-center gap-3">
                <h2 className="text-base sm:text-lg font-black text-amber-200">
                  {shopTab === 'fruits'
                    ? isAr
                      ? '🍎 متجر الفواكه — طاقة وقوة دائمة'
                      : '🍎 Fruit Energy Shop'
                    : shopTab === 'weapons'
                    ? isAr
                      ? '⚔️ متجر الأسلحة القتالية'
                      : '⚔️ Arena Weapons Shop'
                    : isAr
                    ? '🐾 متجر الحيوانات المقاتلة'
                    : '🐾 Companion Battle Pets'}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <div className="px-2.5 py-1 rounded-lg bg-[#271e0b] border border-amber-400/50 text-xs sm:text-sm font-black text-amber-300 font-num">
                  💰 {hud.coins.toLocaleString()}
                </div>
                <div className="px-2.5 py-1 rounded-lg bg-[#0d261b] border border-emerald-400/50 text-xs sm:text-sm font-black text-emerald-300 font-num">
                  ❤️ {hud.energy}/{hud.maxEnergy}
                </div>
                <button
                  type="button"
                  onClick={onCloseShop}
                  className="px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-600 text-xs sm:text-sm font-extrabold text-white cursor-pointer"
                >
                  {isAr ? '✕ العودة للقتال' : '✕ Back to Fight'}
                </button>
              </div>
            </div>

            {/* Tab Switcher */}
            <div className="grid grid-cols-3 gap-1.5 p-2 bg-[#110c1d] border-b border-slate-800">
              <button
                type="button"
                onClick={() => onOpenShopTab('fruits')}
                className={`py-2 rounded-lg text-xs sm:text-sm font-extrabold cursor-pointer transition-colors ${
                  shopTab === 'fruits'
                    ? 'bg-emerald-600 text-white border border-emerald-300/70'
                    : 'bg-[#1c152e] text-slate-300 hover:bg-[#271d40]'
                }`}
              >
                🍎 {isAr ? 'الفواكه (6)' : 'Fruits (6)'}
              </button>
              <button
                type="button"
                onClick={() => onOpenShopTab('weapons')}
                className={`py-2 rounded-lg text-xs sm:text-sm font-extrabold cursor-pointer transition-colors ${
                  shopTab === 'weapons'
                    ? 'bg-indigo-600 text-white border border-indigo-300/70'
                    : 'bg-[#1c152e] text-slate-300 hover:bg-[#271d40]'
                }`}
              >
                ⚔️ {isAr ? `الأسلحة (${hud.ownedWeapons.length}/8)` : `Weapons (${hud.ownedWeapons.length}/8)`}
              </button>
              <button
                type="button"
                onClick={() => onOpenShopTab('pets')}
                className={`py-2 rounded-lg text-xs sm:text-sm font-extrabold cursor-pointer transition-colors ${
                  shopTab === 'pets'
                    ? 'bg-amber-600 text-white border border-amber-300/70'
                    : 'bg-[#1c152e] text-slate-300 hover:bg-[#271d40]'
                }`}
              >
                🐾 {isAr ? `الحيوانات (${ownedPetCount}/${MAX_PET_SQUAD})` : `Pets (${ownedPetCount}/${MAX_PET_SQUAD})`}
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4">
              {shopTab === 'fruits' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ALL_FRUIT_IDS.map((fruitId) => {
                    const spec = FRUIT_SPECS[fruitId];
                    const canAfford = hud.coins >= spec.cost;
                    return (
                      <div
                        key={fruitId}
                        className="flex flex-col justify-between gap-2.5 p-3.5 rounded-xl bg-[#1c152e] border border-slate-700"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-2xl border border-white/20"
                            style={{ backgroundColor: `${spec.color}33` }}
                          >
                            {FRUIT_ICONS[fruitId]}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="font-black text-sm sm:text-base text-white">
                                {isAr ? spec.nameAr : spec.nameEn}
                              </h3>
                              <span className="font-num text-xs font-black text-amber-300">
                                💰 {spec.cost}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                              {isAr ? spec.descAr : spec.descEn}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                          <span className="px-2 py-0.5 rounded bg-emerald-900/70 text-emerald-200 border border-emerald-500/40">
                            {spec.healAmount >= 9999
                              ? isAr
                                ? 'طاقة 100%'
                                : 'Full Energy'
                              : `+${spec.healAmount} ${isAr ? 'طاقة' : 'Energy'}`}
                          </span>
                          {spec.maxEnergyBonus > 0 && (
                            <span className="px-2 py-0.5 rounded bg-sky-900/70 text-sky-200 border border-sky-400/40">
                              +{spec.maxEnergyBonus}{' '}
                              {isAr ? 'حد أقصى دائم' : 'Max Energy'}
                            </span>
                          )}
                          {spec.speedBuffSec && (
                            <span className="px-2 py-0.5 rounded bg-amber-900/70 text-amber-200 border border-amber-400/40">
                              ⚡ {spec.speedBuffSec}s
                            </span>
                          )}
                          {spec.damageBuffSec && (
                            <span className="px-2 py-0.5 rounded bg-orange-900/70 text-orange-200 border border-orange-400/40">
                              🔥 +25% ({spec.damageBuffSec}s)
                            </span>
                          )}
                          {spec.shieldBuffSec && (
                            <span className="px-2 py-0.5 rounded bg-pink-900/70 text-pink-200 border border-pink-400/40">
                              🛡️ {spec.shieldBuffSec}s
                            </span>
                          )}
                          {spec.rapidFireBuffSec && (
                            <span className="px-2 py-0.5 rounded bg-yellow-900/70 text-yellow-200 border border-yellow-400/40">
                              ☄️ +35% ({spec.rapidFireBuffSec}s)
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => onBuyFruit(fruitId)}
                          disabled={!canAfford}
                          className={`w-full py-2 rounded-lg text-xs sm:text-sm font-black transition-colors ${
                            canAfford
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          {isAr
                            ? `شراء وتناول (${spec.cost} 💰)`
                            : `Buy & Eat (${spec.cost} 💰)`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {shopTab === 'weapons' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ALL_WEAPON_IDS.map((weaponId) => {
                    const spec = WEAPON_SPECS[weaponId];
                    const owned = hud.ownedWeapons.includes(weaponId);
                    const equipped = hud.activeWeapon === weaponId;
                    const canAfford = hud.coins >= spec.cost;
                    const rps = (1 / spec.fireInterval).toFixed(1);

                    return (
                      <div
                        key={weaponId}
                        className={`flex flex-col justify-between gap-2.5 p-3.5 rounded-xl border ${
                          equipped
                            ? 'bg-[#211a3d] border-sky-400'
                            : 'bg-[#1c152e] border-slate-700'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-2xl border border-white/20"
                            style={{ backgroundColor: `${spec.color}33` }}
                          >
                            {WEAPON_ICONS[weaponId]}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="font-black text-sm sm:text-base text-white">
                                {isAr ? spec.nameAr : spec.nameEn}
                              </h3>
                              <span className="font-num text-xs font-black text-amber-300">
                                {owned
                                  ? isAr
                                    ? 'مملوك'
                                    : 'Owned'
                                  : `💰 ${spec.cost.toLocaleString()}`}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                              {isAr ? spec.descAr : spec.descEn}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                          <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-200 border border-rose-500/40 font-num">
                            DMG {spec.damage}
                            {spec.pellets > 1 ? ` ×${spec.pellets}` : ''}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-600 font-num">
                            {rps}/s
                          </span>
                          {spec.splashRadius > 0 && (
                            <span className="px-2 py-0.5 rounded bg-orange-950 text-orange-200 border border-orange-500/40">
                              💥 {isAr ? 'انفجار' : 'Splash'}
                            </span>
                          )}
                          {spec.slowDuration > 0 && (
                            <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-200 border border-cyan-500/40">
                              ❄️ {isAr ? 'تجميد' : 'Freeze'}
                            </span>
                          )}
                          {spec.poisonDps > 0 && (
                            <span className="px-2 py-0.5 rounded bg-lime-950 text-lime-200 border border-lime-500/40">
                              ☣️ {isAr ? 'سم' : 'Poison'}
                            </span>
                          )}
                          {spec.pierce > 0 && (
                            <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-200 border border-purple-500/40">
                              ➶ {isAr ? 'اختراق' : 'Pierce'}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => onBuyOrEquipWeapon(weaponId)}
                          disabled={equipped || (!owned && !canAfford)}
                          className={`w-full py-2 rounded-lg text-xs sm:text-sm font-black transition-colors ${
                            equipped
                              ? 'bg-sky-700/60 text-sky-100 border border-sky-400/50 cursor-default'
                              : owned
                              ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer'
                              : canAfford
                              ? 'bg-amber-600 hover:bg-amber-500 text-white cursor-pointer'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          {equipped
                            ? isAr
                              ? '✓ السلاح المجهّز حالياً'
                              : '✓ Equipped'
                            : owned
                            ? isAr
                              ? 'تجهيز السلاح'
                              : 'Equip Weapon'
                            : isAr
                            ? `شراء وتجهيز (${spec.cost.toLocaleString()} 💰)`
                            : `Buy & Equip (${spec.cost.toLocaleString()} 💰)`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {shopTab === 'pets' && (
                <div className="flex flex-col gap-3">
                  {/* Interactive 12-Slot Drag & Tap Move/Merge Board */}
                  <div className="p-3 rounded-xl bg-[#1d1431] border border-fuchsia-400/50 flex flex-col gap-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-xs sm:text-sm font-black text-amber-200">
                          {isAr
                            ? `🐾 لوحة النقل والدمج (${ownedPetCount}/${MAX_PET_SQUAD}) — اسحب أو اضغط لنقل الحيوان ودمج المتشابهين!`
                            : `🐾 Move & Merge Board (${ownedPetCount}/${MAX_PET_SQUAD}) — Drag or tap to move pets & merge matches!`}
                        </div>
                        <div className="text-[11px] text-slate-300 mt-0.5">
                          {isAr
                            ? 'اسحب أي حيوان (أو اضغط عليه ثم على خانة أخرى) لنقله أو لدمجه مع مثيله حتى Lv.5 — ويمكنك أيضاً الضغط عليه مباشرة داخل الحلبة 3D!'
                            : 'Drag any pet (or tap source then target slot) to relocate, swap, or merge identical pets up to Lv.5 — or tap pets directly in the 3D Arena!'}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {hud.hasStationedPets && (
                          <button
                            type="button"
                            onClick={onRecallAllPets}
                            className="px-2.5 py-2 rounded-lg text-xs font-black bg-cyan-700 hover:bg-cyan-600 border border-cyan-300/60 text-white cursor-pointer"
                          >
                            🧲 {isAr ? 'تجميع حول البطل' : 'Recall All'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={onMergeAllPets}
                          disabled={hud.mergeableCount === 0}
                          className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-black transition-colors ${
                            hud.mergeableCount > 0
                              ? 'bg-fuchsia-600 hover:bg-fuchsia-500 border border-fuchsia-300 text-white cursor-pointer'
                              : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                          }`}
                        >
                          🔀{' '}
                          {hud.mergeableCount > 0
                            ? isAr
                              ? `دمج الكل (${hud.mergeableCount})`
                              : `Merge All (${hud.mergeableCount})`
                            : isAr
                            ? 'لا يوجد دمج جاهز'
                            : 'No Merges Ready'}
                        </button>
                      </div>
                    </div>

                    {/* 4x3 Interactive Move & Merge Grid */}
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 pt-1 border-t border-white/10">
                      {Array.from({ length: MAX_PET_SQUAD }, (_, slotIdx) => {
                        const occupant = slotMap.get(slotIdx) ?? null;
                        const isPicked = activeSourceSlot === slotIdx;
                        const canMergeHere =
                          activeSourcePet !== null &&
                          activeSourceSlot !== slotIdx &&
                          occupant !== null &&
                          occupant.petId === activeSourcePet.petId &&
                          occupant.level === activeSourcePet.level &&
                          occupant.level < MAX_PET_LEVEL;
                        const canMoveHere =
                          activeSourcePet !== null &&
                          activeSourceSlot !== slotIdx &&
                          occupant === null;

                        return (
                          <div
                            key={slotIdx}
                            draggable={Boolean(occupant)}
                            onDragStart={(e) => {
                              if (!occupant) return;
                              setDragFromSlot(slotIdx);
                              setPickedSlot(null);
                              e.dataTransfer.effectAllowed = 'move';
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = 'move';
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              if (dragFromSlot !== null && dragFromSlot !== slotIdx) {
                                onMoveOrMergeSlot(dragFromSlot, slotIdx);
                              }
                              setDragFromSlot(null);
                              setPickedSlot(null);
                            }}
                            onDragEnd={() => setDragFromSlot(null)}
                            onClick={() => handleBoardSlotClick(slotIdx)}
                            className={`relative min-h-[68px] rounded-xl border p-1.5 flex flex-col items-center justify-center text-center select-none transition-colors ${
                              isPicked
                                ? 'bg-amber-900/75 border-2 border-amber-300 cursor-grabbing'
                                : canMergeHere
                                ? 'bg-fuchsia-800/80 border-2 border-fuchsia-300 cursor-pointer'
                                : canMoveHere
                                ? 'bg-sky-900/45 border-dashed border-sky-400 cursor-pointer'
                                : occupant
                                ? 'bg-[#261a3d] hover:bg-[#312150] border-slate-600 cursor-grab'
                                : 'bg-[#130d21] border-slate-800 text-slate-600'
                            }`}
                          >
                            <span className="absolute top-1 start-1.5 text-[9px] font-num text-slate-500">
                              {slotIdx + 1}
                            </span>
                            {occupant ? (
                              <>
                                <span className="text-xl leading-none">
                                  {PET_ICONS[occupant.petId]}
                                </span>
                                <span className="text-[10px] font-black text-amber-300 font-num mt-0.5">
                                  Lv.{occupant.level}
                                </span>
                                <span className="text-[9px] font-bold text-slate-200 truncate w-full">
                                  {canMergeHere
                                    ? isAr
                                      ? '🔀 ادمج هنا'
                                      : '🔀 Merge!'
                                    : isAr
                                    ? PET_SPECS[occupant.petId].nameAr
                                    : PET_SPECS[occupant.petId].nameEn}
                                </span>
                                {(() => {
                                  const maxHp =
                                    occupant.maxHp ?? getPetMaxHp(occupant.petId, occupant.level);
                                  const hp = occupant.hp ?? maxHp;
                                  const pct = Math.max(0, Math.min(100, (hp / Math.max(1, maxHp)) * 100));
                                  return (
                                    <div className="w-full h-1.5 bg-slate-900 rounded-sm overflow-hidden mt-1 border border-slate-700">
                                      <div
                                        className="h-full"
                                        style={{
                                          width: `${pct}%`,
                                          backgroundColor:
                                            pct > 50 ? '#22c55e' : pct > 25 ? '#f59e0b' : '#ef4444',
                                        }}
                                      />
                                    </div>
                                  );
                                })()}
                              </>
                            ) : (
                              <span className="text-[10px] font-bold">
                                {canMoveHere
                                  ? isAr
                                    ? '📍 نقل هنا'
                                    : '📍 Move'
                                  : '—'}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {petStacks.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1 border-t border-white/10">
                        {petStacks.map((st) => {
                          const canMerge = st.count >= 2 && st.level < MAX_PET_LEVEL;
                          const pSpec = PET_SPECS[st.petId];
                          return (
                            <button
                              key={`${st.petId}-${st.level}`}
                              type="button"
                              disabled={!canMerge}
                              onClick={() => onMergePetPair(st.petId, st.level)}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-extrabold transition-colors ${
                                canMerge
                                  ? 'bg-fuchsia-900/80 hover:bg-fuchsia-700 border-fuchsia-400 text-fuchsia-100 cursor-pointer'
                                  : 'bg-black/35 border-slate-700 text-slate-200 cursor-default'
                              }`}
                            >
                              <span>{PET_ICONS[st.petId]}</span>
                              <span>{isAr ? pSpec.nameAr : pSpec.nameEn}</span>
                              <span className="font-num text-amber-300">Lv.{st.level}</span>
                              <span className="font-num px-1 rounded bg-black/40 text-white">
                                ×{st.count}
                              </span>
                              {canMerge && (
                                <span className="text-fuchsia-200">
                                  ➔ Lv.{st.level + 1} 🔀
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Buy & Merge Pet Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ALL_PET_IDS.map((petId) => {
                      const spec = PET_SPECS[petId];
                      const ownedOfType = hud.petRoster.filter((s) => s.petId === petId);
                      const highestLv = ownedOfType.reduce((m, s) => Math.max(m, s.level), 0);
                      const squadFull = ownedPetCount >= MAX_PET_SQUAD;
                      const canAfford = hud.coins >= spec.cost && !squadFull;

                      // Find lowest mergeable level for this animal
                      let mergeableLevel: number | null = null;
                      for (let lv = 1; lv < MAX_PET_LEVEL; lv++) {
                        const c = ownedOfType.filter((s) => s.level === lv).length;
                        if (c >= 2) {
                          mergeableLevel = lv;
                          break;
                        }
                      }

                      const levelCounts: Array<{ lv: number; count: number }> = [];
                      for (let lv = 1; lv <= MAX_PET_LEVEL; lv++) {
                        const c = ownedOfType.filter((s) => s.level === lv).length;
                        if (c > 0) levelCounts.push({ lv, count: c });
                      }

                      const previewDmg = Math.round(
                        spec.damage * getPetDamageMultiplier(Math.max(1, highestLv))
                      );

                      return (
                        <div
                          key={petId}
                          className={`flex flex-col justify-between gap-2.5 p-3.5 rounded-xl border ${
                            mergeableLevel !== null
                              ? 'bg-[#28163b] border-fuchsia-400'
                              : ownedOfType.length > 0
                              ? 'bg-[#221a35] border-amber-400/60'
                              : 'bg-[#1c152e] border-slate-700'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-2xl border border-white/20"
                              style={{ backgroundColor: `${spec.primaryColor}55` }}
                            >
                              {PET_ICONS[petId]}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <h3 className="font-black text-sm sm:text-base text-white">
                                  {isAr ? spec.nameAr : spec.nameEn}
                                </h3>
                                <span className="font-num text-xs font-black px-2 py-0.5 rounded bg-black/40 text-amber-300">
                                  {ownedOfType.length === 0
                                    ? `💰 ${spec.cost.toLocaleString()}`
                                    : isAr
                                    ? `تملك ${ownedOfType.length}`
                                    : `Owned ${ownedOfType.length}`}
                                </span>
                              </div>
                              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                                {isAr ? spec.descAr : spec.descEn}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-200 border border-emerald-500/40 font-num">
                              ❤️ HP {getPetMaxHp(petId, Math.max(1, highestLv))}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-200 border border-rose-500/40 font-num">
                              DMG {previewDmg}
                              {highestLv > 1 ? ` (Lv.${highestLv})` : ''}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-200 border border-indigo-500/40">
                              {spec.flying
                                ? isAr
                                  ? '🦅 طائر'
                                  : '🦅 Flying'
                                : spec.style === 'melee'
                                ? isAr
                                  ? '⚔️ قتال قريب'
                                  : '⚔️ Melee'
                                : isAr
                                ? '✨ قتال بعيد'
                                : '✨ Ranged'}
                            </span>
                            {spec.coinBonusPct && (
                              <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-200 border border-amber-500/40">
                                +{spec.coinBonusPct}% 💰 / Lv
                              </span>
                            )}
                            {levelCounts.map((lc) => (
                              <span
                                key={lc.lv}
                                className="px-1.5 py-0.5 rounded bg-fuchsia-950/90 text-fuchsia-200 border border-fuchsia-500/40 font-num"
                              >
                                {lc.count}× Lv.{lc.lv}
                              </span>
                            ))}
                          </div>

                          <div className="flex flex-col gap-1.5">
                            {mergeableLevel !== null && (
                              <button
                                type="button"
                                onClick={() => onMergePetPair(petId, mergeableLevel)}
                                className="w-full py-2 rounded-lg text-xs sm:text-sm font-black bg-fuchsia-600 hover:bg-fuchsia-500 border border-fuchsia-300 text-white cursor-pointer transition-colors"
                              >
                                {isAr
                                  ? `🔀 دمج 2× Lv.${mergeableLevel} ➔ Lv.${mergeableLevel + 1} (مجاني!)`
                                  : `🔀 Merge 2× Lv.${mergeableLevel} ➔ Lv.${mergeableLevel + 1} (Free!)`}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onBuyPet(petId)}
                              disabled={!canAfford}
                              className={`w-full py-2 rounded-lg text-xs sm:text-sm font-black transition-colors ${
                                canAfford
                                  ? 'bg-amber-600 hover:bg-amber-500 text-white cursor-pointer'
                                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                              }`}
                            >
                              {squadFull
                                ? isAr
                                  ? 'الفريق ممتلئ (ادمج أولاً 🔀)'
                                  : 'Squad Full (Merge First 🔀)'
                                : isAr
                                ? `+ شراء حيوان Lv.1 (${spec.cost.toLocaleString()} 💰)`
                                : `+ Buy Lv.1 Pet (${spec.cost.toLocaleString()} 💰)`}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* START OVERLAY */}
      {hud.status === 'START' && !shopTab && (
        <div className="pointer-events-auto fixed inset-0 z-30 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#161026] border-2 border-amber-400/60 p-5 sm:p-6 text-center shadow-2xl">
            <div className="text-4xl mb-2">🏟️⚔️🐺</div>
            <h1 className="text-2xl sm:text-3xl font-black text-amber-200">
              {isAr ? 'حلبة الوحوش 3D' : 'Monster Arena 3D'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              {isAr
                ? 'قاتل موجات الوحوش في الحلبة البركانية، اشترِ أسلحة أقوى وحيوانات تقاتل معك، وتناول الفواكه لرفع طاقتك قبل ظهور وحش الـ 10 دقائق الأسطوري!'
                : 'Battle waves of monsters in a 3D volcanic colosseum, buy stronger weapons & battle pets, eat fruits to boost your Energy, and survive the 10-Minute Dread Titan!'}
            </p>

            <div className="grid grid-cols-3 gap-2 my-4 text-xs font-bold">
              <div className="p-2.5 rounded-xl bg-[#1f1636] border border-emerald-500/40">
                <div className="text-lg">🍎</div>
                <div className="text-emerald-300 mt-0.5">
                  {isAr ? 'متجر فواكه' : 'Fruit Shop'}
                </div>
                <div className="text-[10px] text-slate-400">
                  {isAr ? 'طاقة + بفات دائمة' : 'Heal & Max HP'}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#1f1636] border border-rose-500/40">
                <div className="text-lg">🔥👹</div>
                <div className="text-rose-300 mt-0.5">
                  {isAr ? 'كل 3د و 10د' : '3m & 10m Boss'}
                </div>
                <div className="text-[10px] text-slate-400">
                  {isAr ? 'سيد الحمم + الطاغية' : 'Warlord + Titan'}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#1f1636] border border-amber-500/40">
                <div className="text-lg">🐾</div>
                <div className="text-amber-300 mt-0.5">
                  {isAr ? '8 أسلحة + 6 حيوانات' : '8 Guns + 6 Pets'}
                </div>
                <div className="text-[10px] text-slate-400">
                  {isAr ? 'تقاتل بجانبك' : 'Fight Beside You'}
                </div>
              </div>
            </div>

            {(hud.bestScore > 0 || hud.titansDefeated > 0) && (
              <div className="flex flex-wrap items-center justify-center gap-3 mb-4 text-xs font-bold text-slate-300 bg-black/30 rounded-xl py-2 px-3">
                <span>
                  🏆 {isAr ? 'أعلى نقاط:' : 'Best:'}{' '}
                  <strong className="font-num text-amber-300">
                    {hud.bestScore.toLocaleString()}
                  </strong>
                </span>
                <span>
                  🌊 {isAr ? 'أعلى موجة:' : 'Wave:'}{' '}
                  <strong className="font-num text-sky-300">{hud.bestWave}</strong>
                </span>
                <span>
                  👹 {isAr ? 'الطغاة:' : 'Titans:'}{' '}
                  <strong className="font-num text-rose-300">
                    {hud.titansDefeated}
                  </strong>
                </span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-2 mb-3 text-xs font-extrabold">
              <span className="px-2.5 py-1 rounded-lg bg-[#24120a] border border-orange-400/50 text-orange-200 font-num">
                🔥 {isAr ? 'عدّاد وحش 3د المحفوظ:' : 'Saved 3m Boss:'} {formatCountdown(hud.warlordTimer)}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[#240d1d] border border-purple-400/50 text-purple-200 font-num">
                👹 {isAr ? 'عدّاد زعيم 10د المحفوظ:' : 'Saved 10m Boss:'} {formatCountdown(hud.titanTimer)}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {hud.hasSavedRun && (
                <button
                  type="button"
                  onClick={onContinueSaved}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm sm:text-base cursor-pointer transition-colors"
                >
                  {isAr
                    ? `▶ استكمال الحلبة (موجة ${hud.savedWave} • ${hud.savedCoins.toLocaleString()} 💰)`
                    : `▶ Resume Arena (Wave ${hud.savedWave} • ${hud.savedCoins.toLocaleString()} 💰)`}
                </button>
              )}
              <button
                type="button"
                onClick={onStartNew}
                className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-sm sm:text-base cursor-pointer transition-colors"
              >
                {hud.hasSavedRun
                  ? isAr
                    ? '⚔️ بدء معركة جديدة'
                    : '⚔️ Start New Battle'
                  : isAr
                  ? '⚔️ ادخل الحلبة الآن'
                  : '⚔️ Enter Arena Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAUSED OVERLAY (only when shop modal is closed) */}
      {hud.status === 'PAUSED' && !shopTab && (
        <div className="pointer-events-auto fixed inset-0 z-30 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#161026] border-2 border-indigo-400/60 p-5 text-center shadow-2xl">
            <h2 className="text-xl font-black text-white mb-4">
              {isAr ? '⏸️ الحلبة متوقفة مؤقتاً' : '⏸️ Arena Paused'}
            </h2>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={onResume}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm cursor-pointer"
              >
                {isAr ? '▶ متابعة القتال' : '▶ Resume Battle'}
              </button>
              <button
                type="button"
                onClick={() => onOpenShopTab('fruits')}
                className="w-full py-2.5 rounded-xl bg-[#22183a] hover:bg-[#2d204d] border border-emerald-400/40 text-emerald-200 font-bold text-sm cursor-pointer"
              >
                🍎 {isAr ? 'فتح متجر الفواكه' : 'Open Fruit Shop'}
              </button>
              <button
                type="button"
                onClick={() => onOpenShopTab('weapons')}
                className="w-full py-2.5 rounded-xl bg-[#22183a] hover:bg-[#2d204d] border border-indigo-400/40 text-indigo-200 font-bold text-sm cursor-pointer"
              >
                ⚔️ {isAr ? 'فتح متجر الأسلحة' : 'Open Weapons Shop'}
              </button>
              <button
                type="button"
                onClick={() => onOpenShopTab('pets')}
                className="w-full py-2.5 rounded-xl bg-[#22183a] hover:bg-[#2d204d] border border-amber-400/40 text-amber-200 font-bold text-sm cursor-pointer"
              >
                🐾 {isAr ? 'فتح متجر الحيوانات' : 'Open Pets Shop'}
              </button>
              <button
                type="button"
                onClick={onStartNew}
                className="w-full py-2 rounded-xl bg-amber-700/80 hover:bg-amber-600 text-white font-bold text-xs cursor-pointer mt-1"
              >
                {isAr ? '🔄 إعادة من البداية' : '🔄 Restart Run'}
              </button>
              <button
                type="button"
                onClick={onExit}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer"
              >
                {isAr ? 'خروج إلى قائمة الألعاب' : 'Exit to Games Hub'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GAME OVER OVERLAY */}
      {hud.status === 'GAME_OVER' && (
        <div className="pointer-events-auto fixed inset-0 z-30 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#1a0d19] border-2 border-rose-500/70 p-6 text-center shadow-2xl">
            <div className="text-4xl mb-2">💥</div>
            <h2 className="text-2xl font-black text-rose-300">
              {isAr ? 'سقط البطل في الحلبة!' : 'Defeated in the Arena!'}
            </h2>
            <div className="grid grid-cols-2 gap-2.5 my-4 text-xs sm:text-sm font-bold">
              <div className="p-2.5 rounded-xl bg-black/35 border border-slate-700">
                <div className="text-slate-400">{isAr ? 'النقاط' : 'Score'}</div>
                <div className="font-num text-lg font-black text-amber-300">
                  {hud.score.toLocaleString()}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-black/35 border border-slate-700">
                <div className="text-slate-400">{isAr ? 'الموجة' : 'Wave'}</div>
                <div className="font-num text-lg font-black text-sky-300">{hud.wave}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-black/35 border border-slate-700">
                <div className="text-slate-400">{isAr ? 'الوحوش المهزومة' : 'Kills'}</div>
                <div className="font-num text-lg font-black text-rose-300">{hud.kills}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-black/35 border border-slate-700">
                <div className="text-slate-400">{isAr ? 'الطغاة المهزومون' : 'Titans Slain'}</div>
                <div className="font-num text-lg font-black text-purple-300">
                  {hud.titansDefeated}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={onStartNew}
                className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-sm sm:text-base cursor-pointer"
              >
                {isAr ? '⚔️ قتال مجدداً' : '⚔️ Fight Again'}
              </button>
              <button
                type="button"
                onClick={onExit}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm cursor-pointer"
              >
                {isAr ? 'خروج' : 'Exit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
