export type GumFlavorId =
  | 'mint'
  | 'strawberry'
  | 'watermelon'
  | 'mastic'
  | 'cola'
  | 'golden';

export interface GumFlavorSpec {
  id: GumFlavorId;
  nameAr: string;
  nameEn: string;
  color: string;
  accent: string;
  boxColor: string;
  packsPerBox: number;
  boxCost: number; // Wholesale cost per carton (8 packs)
  unitCost: number; // boxCost / packsPerBox
  fairPrice: number; // Ideal market selling price per pack
  minPrice: number;
  maxPrice: number;
}

export const PACKS_PER_BOX = 8;
export const SHELF_MAX_STOCK = 16;
export const DAY_DURATION_SEC = 90;
export const MAX_SHELVES = 8;

export const GUM_FLAVORS: GumFlavorSpec[] = [
  {
    id: 'mint',
    nameAr: 'علك النعناع',
    nameEn: 'Mint Fresh',
    color: '#14b8a6',
    accent: '#99f6e4',
    boxColor: '#0f766e',
    packsPerBox: PACKS_PER_BOX,
    boxCost: 106, // +232% (32 * 3.32)
    unitCost: 13,
    fairPrice: 8, // +50% selling price (5 * 1.5)
    minPrice: 2,
    maxPrice: 23,
  },
  {
    id: 'strawberry',
    nameAr: 'علك الفراولة',
    nameEn: 'Berry Pop',
    color: '#f43f5e',
    accent: '#fecdd3',
    boxColor: '#be123c',
    packsPerBox: PACKS_PER_BOX,
    boxCost: 159, // +232% (48 * 3.32)
    unitCost: 20,
    fairPrice: 12, // +50% selling price (8 * 1.5)
    minPrice: 3,
    maxPrice: 32,
  },
  {
    id: 'watermelon',
    nameAr: 'علك البطيخ',
    nameEn: 'Melon Splash',
    color: '#22c55e',
    accent: '#bbf7d0',
    boxColor: '#15803d',
    packsPerBox: PACKS_PER_BOX,
    boxCost: 239, // +232% (72 * 3.32)
    unitCost: 30,
    fairPrice: 17, // +50% selling price (11 * 1.5)
    minPrice: 5,
    maxPrice: 45,
  },
  {
    id: 'mastic',
    nameAr: 'علك المستكة',
    nameEn: 'Royal Mastic',
    color: '#f59e0b',
    accent: '#fef08a',
    boxColor: '#b45309',
    packsPerBox: PACKS_PER_BOX,
    boxCost: 372, // +232% (112 * 3.32)
    unitCost: 47,
    fairPrice: 27, // +50% selling price (18 * 1.5)
    minPrice: 8,
    maxPrice: 68,
  },
  {
    id: 'cola',
    nameAr: 'علك الكولا',
    nameEn: 'Cola Fizz',
    color: '#b91c1c',
    accent: '#fca5a5',
    boxColor: '#7f1d1d',
    packsPerBox: PACKS_PER_BOX,
    boxCost: 531, // +232% (160 * 3.32)
    unitCost: 66,
    fairPrice: 38, // +50% selling price (25 * 1.5)
    minPrice: 11,
    maxPrice: 95,
  },
  {
    id: 'golden',
    nameAr: 'علك الذهب الملكي',
    nameEn: 'Golden Bubble',
    color: '#8b5cf6',
    accent: '#fde047',
    boxColor: '#5b21b6',
    packsPerBox: PACKS_PER_BOX,
    boxCost: 797, // +232% (240 * 3.32)
    unitCost: 100,
    fairPrice: 56, // +50% selling price (37 * 1.5)
    minPrice: 15,
    maxPrice: 143,
  },
];

export const MIN_CRATE_COST = GUM_FLAVORS[0].boxCost;
export const EMERGENCY_GRANT_AMOUNT = 115;

export const GUM_FLAVOR_MAP: Record<GumFlavorId, GumFlavorSpec> = GUM_FLAVORS.reduce(
  (acc, f) => {
    acc[f.id] = f;
    return acc;
  },
  {} as Record<GumFlavorId, GumFlavorSpec>
);

export type ShelfStyle = 'wood' | 'acrylic' | 'gold';

export interface ShelfSlotSpec {
  slotIndex: number;
  x: number;
  z: number;
  rotY: number;
  cost: number;
  style: ShelfStyle;
  nameAr: string;
  nameEn: string;
}

// 8 neat interior 3D shelf positions inside the shop (interior X: -6.2..6.2, Z: -5.8..2.6)
export const SHELF_SLOTS: ShelfSlotSpec[] = [
  {
    slotIndex: 0,
    x: -4.4,
    z: -3.6,
    rotY: Math.PI / 2,
    cost: 0,
    style: 'wood',
    nameAr: 'رف خشبي ١',
    nameEn: 'Wood Shelf #1',
  },
  {
    slotIndex: 1,
    x: -4.4,
    z: -0.9,
    rotY: Math.PI / 2,
    cost: 0,
    style: 'wood',
    nameAr: 'رف خشبي ٢',
    nameEn: 'Wood Shelf #2',
  },
  {
    slotIndex: 2,
    x: -1.4,
    z: -4.3,
    rotY: 0,
    cost: 85,
    style: 'wood',
    nameAr: 'رف خشبي ٣',
    nameEn: 'Wood Shelf #3',
  },
  {
    slotIndex: 3,
    x: 1.5,
    z: -4.3,
    rotY: 0,
    cost: 140,
    style: 'acrylic',
    nameAr: 'رف أكريليك ٤',
    nameEn: 'Acrylic Display #4',
  },
  {
    slotIndex: 4,
    x: 4.4,
    z: -3.6,
    rotY: -Math.PI / 2,
    cost: 210,
    style: 'acrylic',
    nameAr: 'رف أكريليك ٥',
    nameEn: 'Acrylic Display #5',
  },
  {
    slotIndex: 5,
    x: 4.4,
    z: -0.9,
    rotY: -Math.PI / 2,
    cost: 290,
    style: 'acrylic',
    nameAr: 'رف أكريليك ٦',
    nameEn: 'Acrylic Display #6',
  },
  {
    slotIndex: 6,
    x: -1.4,
    z: -1.3,
    rotY: 0,
    cost: 420,
    style: 'gold',
    nameAr: 'رف ذهبي VIP ٧',
    nameEn: 'Gold VIP Shelf #7',
  },
  {
    slotIndex: 7,
    x: 1.5,
    z: -1.3,
    rotY: 0,
    cost: 580,
    style: 'gold',
    nameAr: 'رف ذهبي VIP ٨',
    nameEn: 'Gold VIP Shelf #8',
  },
];

export type UpgradeId = 'sneakers' | 'auto_cashier' | 'neon_sign' | 'stock_gloves';

export interface ShopUpgradeSpec {
  id: UpgradeId;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
  cost: number;
}

export const SHOP_UPGRADES: ShopUpgradeSpec[] = [
  {
    id: 'sneakers',
    nameAr: 'حذاء التوصيل السريع',
    nameEn: 'Speed Sneakers',
    descAr: 'سرعة مشي +40% لجلب كراتين العلك بسرعة',
    descEn: '+40% walking speed to haul gum boxes faster',
    cost: 120,
  },
  {
    id: 'auto_cashier',
    nameAr: 'كاشير ذكي تلقائي',
    nameEn: 'Smart Auto-Cashier',
    descAr: 'يحاسب الزبائن تلقائياً وبسرعة مع إكرامية +10%',
    descEn: 'Instantly rings up customers with +10% bonus tip',
    cost: 240,
  },
  {
    id: 'neon_sign',
    nameAr: 'لوحة المحل المضيئة',
    nameEn: 'Glowing Shop Sign',
    descAr: 'يجذب زبائن أكثر بنسبة +45% إلى محلك',
    descEn: 'Attracts +45% more customers into your shop',
    cost: 320,
  },
  {
    id: 'stock_gloves',
    nameAr: 'سعة رفوف مضاعفة',
    nameEn: 'Mega Shelf Capacity',
    descAr: 'يرفع سعة كل رف إلى 24 علبة علك بدلاً من 16',
    descEn: 'Expands every 3D shelf capacity from 16 to 24 packs',
    cost: 450,
  },
];

export interface ShelfState {
  slotIndex: number;
  style: ShelfStyle;
  flavor: GumFlavorId | null;
  stock: number;
}

export interface DeliveryCrateState {
  id: number;
  flavor: GumFlavorId;
  packs: number;
  x: number;
  z: number;
}

export interface CarriedCrateState {
  flavor: GumFlavorId;
  packs: number;
}

export type CustomerStage =
  | 'ENTERING'
  | 'BROWSING'
  | 'TO_CHECKOUT'
  | 'WAITING_PAY'
  | 'LEAVING';

export interface CustomerEntity {
  id: number;
  x: number;
  z: number;
  rotY: number;
  shirtColor: string;
  hairColor: string;
  stage: CustomerStage;
  targetShelfSlot: number;
  desiredFlavor: GumFlavorId | null;
  carriedFlavor: GumFlavorId | null;
  carriedQty: number;
  willPayAmount: number;
  timer: number;
  mood: 'neutral' | 'happy' | 'expensive' | 'empty';
}

export type GumShopStatus = 'TITLE' | 'PLAYING' | 'RENT_DUE';

export type GumShopModalTab = 'none' | 'order' | 'pricing' | 'shelves';

export interface GumShopSaveData {
  version: number;
  money: number;
  day: number;
  dayTimeLeft: number;
  unpaidRent: number;
  missedRentDays: number;
  totalEarned: number;
  totalPacksSold: number;
  todayRevenue: number;
  todayWholesale: number;
  todayPacksSold: number;
  shelves: ShelfState[];
  prices: Record<GumFlavorId, number>;
  cratesOutside: DeliveryCrateState[];
  carriedCrate: CarriedCrateState | null;
  upgrades: UpgradeId[];
  nextCrateId: number;
  savedAt: number;
}

export interface GumShopHubStats {
  hasSave: boolean;
  day: number;
  money: number;
  shelvesCount: number;
  totalPacksSold: number;
}

export interface FloatingNotice {
  id: number;
  text: string;
  tone: 'good' | 'warn' | 'info';
}

export interface GumShopHudSnapshot {
  status: GumShopStatus;
  money: number;
  day: number;
  dayTimeLeft: number;
  dailyRent: number;
  unpaidRent: number;
  totalRentDue: number;
  totalEarned: number;
  totalPacksSold: number;
  todayRevenue: number;
  todayWholesale: number;
  todayPacksSold: number;
  shelves: ShelfState[];
  prices: Record<GumFlavorId, number>;
  cratesOutsideCount: number;
  carriedCrate: CarriedCrateState | null;
  upgrades: UpgradeId[];
  waitingCustomerCount: number;
  nearPrompt:
    | { kind: 'pickup_crate'; crateId: number; flavor: GumFlavorId }
    | { kind: 'stock_shelf'; slotIndex: number }
    | { kind: 'checkout' }
    | null;
  lastSavedAt: number;
  notice: FloatingNotice | null;
  isOutside: boolean;
}

export const GUM_SHOP_SAVE_KEY = 'point_catcher_gum_shop_3d_save_v1';
const GUM_SHOP_SOUND_KEY = 'point_catcher_gum_shop_3d_sound_v1';

export function createDefaultPrices(): Record<GumFlavorId, number> {
  return {
    mint: GUM_FLAVOR_MAP.mint.fairPrice,
    strawberry: GUM_FLAVOR_MAP.strawberry.fairPrice,
    watermelon: GUM_FLAVOR_MAP.watermelon.fairPrice,
    mastic: GUM_FLAVOR_MAP.mastic.fairPrice,
    cola: GUM_FLAVOR_MAP.cola.fairPrice,
    golden: GUM_FLAVOR_MAP.golden.fairPrice,
  };
}

export function computeDailyRent(day: number, shelvesCount: number): number {
  const base = 35;
  const dayGrowth = Math.max(0, day - 1) * 12;
  const shelfFee = Math.max(0, shelvesCount - 2) * 15;
  // Previous +250% rent (x3.5) reduced by 35% (x0.65 => x2.275)
  return Math.round((base + dayGrowth + shelfFee) * 3.5 * 0.65);
}

export function getPriceVerdict(
  flavor: GumFlavorId,
  price: number
): 'cheap' | 'fair' | 'high' | 'rip_off' {
  const spec = GUM_FLAVOR_MAP[flavor];
  const ratio = price / spec.fairPrice;
  if (ratio <= 0.85) return 'cheap';
  if (ratio <= 1.15) return 'fair';
  if (ratio <= 1.48) return 'high';
  return 'rip_off';
}

export function readGumShopSave(): GumShopSaveData | null {
  try {
    const raw = window.localStorage.getItem(GUM_SHOP_SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GumShopSaveData>;
    if (!parsed || typeof parsed.money !== 'number' || !Array.isArray(parsed.shelves)) {
      return null;
    }

    const defaultPrices = createDefaultPrices();
    const prices: Record<GumFlavorId, number> = { ...defaultPrices };
    const isLegacyPreV4 = (parsed.version ?? 1) < 4;
    if (!isLegacyPreV4 && parsed.prices && typeof parsed.prices === 'object') {
      for (const f of GUM_FLAVORS) {
        const val = (parsed.prices as Record<string, unknown>)[f.id];
        if (typeof val === 'number' && Number.isFinite(val)) {
          prices[f.id] = Math.max(f.minPrice, Math.min(f.maxPrice, Math.round(val)));
        }
      }
    }

    const validShelves: ShelfState[] = parsed.shelves
      .filter(
        (s): s is ShelfState =>
          Boolean(s) &&
          typeof s.slotIndex === 'number' &&
          s.slotIndex >= 0 &&
          s.slotIndex < MAX_SHELVES
      )
      .map((s) => ({
        slotIndex: s.slotIndex,
        style: SHELF_SLOTS[s.slotIndex]?.style ?? 'wood',
        flavor: s.flavor && s.flavor in GUM_FLAVOR_MAP ? s.flavor : null,
        stock: typeof s.stock === 'number' && Number.isFinite(s.stock) ? Math.max(0, Math.floor(s.stock)) : 0,
      }));

    if (validShelves.length === 0) return null;

    const cratesOutside: DeliveryCrateState[] = Array.isArray(parsed.cratesOutside)
      ? parsed.cratesOutside
          .filter(
            (c): c is DeliveryCrateState =>
              Boolean(c) &&
              typeof c.id === 'number' &&
              typeof c.flavor === 'string' &&
              c.flavor in GUM_FLAVOR_MAP &&
              typeof c.packs === 'number' &&
              c.packs > 0
          )
          .map((c) => ({
            id: c.id,
            flavor: c.flavor,
            packs: Math.min(PACKS_PER_BOX, Math.max(1, Math.floor(c.packs))),
            x: typeof c.x === 'number' ? c.x : -2.2,
            z: typeof c.z === 'number' ? c.z : 6.4,
          }))
      : [];

    const carriedCrate: CarriedCrateState | null =
      parsed.carriedCrate &&
      typeof parsed.carriedCrate.flavor === 'string' &&
      parsed.carriedCrate.flavor in GUM_FLAVOR_MAP &&
      typeof parsed.carriedCrate.packs === 'number' &&
      parsed.carriedCrate.packs > 0
        ? {
            flavor: parsed.carriedCrate.flavor,
            packs: Math.min(PACKS_PER_BOX, Math.max(1, Math.floor(parsed.carriedCrate.packs))),
          }
        : null;

    const validUpgrades: UpgradeId[] = Array.isArray(parsed.upgrades)
      ? parsed.upgrades.filter(
          (u): u is UpgradeId =>
            u === 'sneakers' ||
            u === 'auto_cashier' ||
            u === 'neon_sign' ||
            u === 'stock_gloves'
        )
      : [];

    return {
      version: 4,
      money: Math.max(0, Math.round(parsed.money)),
      day: Math.max(1, Math.floor(parsed.day ?? 1)),
      dayTimeLeft: Math.max(
        0,
        Math.min(DAY_DURATION_SEC, Number(parsed.dayTimeLeft ?? DAY_DURATION_SEC))
      ),
      unpaidRent: Math.max(0, Math.round(parsed.unpaidRent ?? 0)),
      missedRentDays: Math.max(0, Math.floor(parsed.missedRentDays ?? 0)),
      totalEarned: Math.max(0, Math.round(parsed.totalEarned ?? 0)),
      totalPacksSold: Math.max(0, Math.floor(parsed.totalPacksSold ?? 0)),
      todayRevenue: Math.max(0, Math.round(parsed.todayRevenue ?? 0)),
      todayWholesale: Math.max(0, Math.round(parsed.todayWholesale ?? 0)),
      todayPacksSold: Math.max(0, Math.floor(parsed.todayPacksSold ?? 0)),
      shelves: validShelves,
      prices,
      cratesOutside,
      carriedCrate,
      upgrades: validUpgrades,
      nextCrateId: Math.max(1, Math.floor(parsed.nextCrateId ?? 1)),
      savedAt: typeof parsed.savedAt === 'number' ? parsed.savedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

export function writeGumShopSave(data: GumShopSaveData): void {
  try {
    window.localStorage.setItem(GUM_SHOP_SAVE_KEY, JSON.stringify(data));
  } catch {
    // ignore quota errors
  }
}

export function clearGumShopSave(): void {
  try {
    window.localStorage.removeItem(GUM_SHOP_SAVE_KEY);
  } catch {
    // ignore storage errors
  }
}

export function readGumShopHubStats(): GumShopHubStats {
  const saved = readGumShopSave();
  if (!saved) {
    return { hasSave: false, day: 1, money: 0, shelvesCount: 2, totalPacksSold: 0 };
  }
  return {
    hasSave: true,
    day: saved.day,
    money: saved.money,
    shelvesCount: saved.shelves.length,
    totalPacksSold: saved.totalPacksSold,
  };
}

export function readGumShopSoundEnabled(): boolean {
  try {
    const raw = window.localStorage.getItem(GUM_SHOP_SOUND_KEY);
    return raw === null ? true : raw === '1';
  } catch {
    return true;
  }
}

export function saveGumShopSoundEnabled(enabled: boolean): void {
  try {
    window.localStorage.setItem(GUM_SHOP_SOUND_KEY, enabled ? '1' : '0');
  } catch {
    // ignore
  }
}
