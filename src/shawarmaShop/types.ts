export type ShawarmaStatus = 'START' | 'PLAYING' | 'PAUSED' | 'DAY_END' | 'GAME_OVER';

export type ToppingId =
  | 'garlic'
  | 'pickles'
  | 'fries'
  | 'spicy'
  | 'pomegranate'
  | 'cheese';

export type DrinkId = 'suntop' | 'ayran';

export interface CustomerOrder {
  id: number;
  slot: 0 | 1 | 2;
  nameAr: string;
  nameEn: string;
  toppings: ToppingId[];
  drink: DrinkId | null;
  patience: number;
  maxPatience: number;
  shirtColor: string;
  headwear: 'ghutra' | 'cap' | 'hair';
  entered: number;
  leaving: boolean;
  happy: boolean;
}

export interface WorkbenchState {
  hasBread: boolean;
  hasMeat: boolean;
  toppings: ToppingId[];
  drink: DrinkId | null;
  wrapped: boolean;
}

export interface ShawarmaUpgrades {
  slicerLevel: 1 | 2 | 3; // 1 = Manual knife, 2 = Sharp Steel, 3 = Electric Slicer
  friesLevel: 1 | 2 | 3; // 1 = Manual chop, 2 = Fast Cutter, 3 = Auto Potato Chef
  doubleSpit: boolean;
  turboGrill: boolean;
  vipDecor: boolean;
  unlockPomegranate: boolean; // دبس رمان
  unlockCheese: boolean; // جبنة شيدر
  unlockSuntop: boolean; // عصير سن توب
  unlockAyran: boolean; // لبن عيران
}

export interface ShawarmaParticle {
  active: boolean;
  kind: 'steam' | 'coin' | 'sizzle';
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  size: number;
}

export interface ShawarmaHudSnapshot {
  status: ShawarmaStatus;
  day: number;
  timeLeft: number;
  cash: number;
  dayEarned: number;
  dayGoal: number;
  servedToday: number;
  totalServed: number;
  bestCash: number;
  bestDay: number;
  streak: number;
  lives: number;
  meatStock: number;
  maxStock: number;
  friesStock: number;
  meatSliceProgress: number; // 0..1 while slicing
  friesChopProgress: number; // 0..1 while chopping potatoes
  workbench: WorkbenchState;
  customers: (CustomerOrder | null)[];
  upgrades: ShawarmaUpgrades;
  feedbackToast: { text: string; positive: boolean } | null;
}

export const MAX_SHAWARMA_LIVES = 3;
export const SHIFT_DURATION_SEC = 80;
export const MAX_STOCK = 6;
export const MAX_SHAWARMA_PARTICLES = 36;
export const CUSTOMER_SLOT_X = [-2.25, 0, 2.25] as const;

export const SHAWARMA_BEST_CASH_KEY = 'shawarma_3d_best_cash_v1';
export const SHAWARMA_BEST_DAY_KEY = 'shawarma_3d_best_day_v1';
export const SHAWARMA_SOUND_KEY = 'shawarma_3d_sound_v1';
export const SHAWARMA_SAVE_KEY = 'shawarma_3d_shop_save_v2';

export const TOPPING_META: Record<
  ToppingId,
  { nameAr: string; nameEn: string; color: string; extraPrice: number }
> = {
  garlic: { nameAr: 'ثومية', nameEn: 'Garlic', color: '#f8fafc', extraPrice: 3 },
  pickles: { nameAr: 'مخلل', nameEn: 'Pickles', color: '#4ade80', extraPrice: 3 },
  fries: { nameAr: 'بطاطس', nameEn: 'Fries', color: '#facc15', extraPrice: 4 },
  spicy: { nameAr: 'شطة', nameEn: 'Spicy', color: '#ef4444', extraPrice: 3 },
  pomegranate: {
    nameAr: 'دبس رمان',
    nameEn: 'Pom. Molasses',
    color: '#9f1239',
    extraPrice: 6,
  },
  cheese: {
    nameAr: 'جبنة شيدر',
    nameEn: 'Cheddar',
    color: '#f59e0b',
    extraPrice: 7,
  },
};

export const DRINK_META: Record<
  DrinkId,
  { nameAr: string; nameEn: string; color: string; price: number }
> = {
  suntop: {
    nameAr: 'سن توب',
    nameEn: 'Sun Top',
    color: '#fb923c',
    price: 12,
  },
  ayran: {
    nameAr: 'لبن عيران',
    nameEn: 'Cold Ayran',
    color: '#e0f2fe',
    price: 14,
  },
};

export const SHOP_PRICES = {
  slicerLv2: 70,
  slicerLv3: 160,
  friesLv2: 80,
  friesLv3: 175,
  doubleSpit: 110,
  turboGrill: 130,
  vipDecor: 155,
  unlockPomegranate: 90,
  unlockCheese: 110,
  unlockSuntop: 135,
  unlockAyran: 145,
} as const;

export const HAPPY_REACTIONS_AR = [
  'أحلى شاورما! تسلم يدك!',
  'شاورما عالأصول!',
  'الله يعطيك العافية!',
  'يا سلام على الطعم!',
  'أفضل محل شاورما في الحي!',
  'البطاطس مقرمشة ولا غلطة!',
];

export const HAPPY_REACTIONS_EN = [
  'Best shawarma in town!',
  'Crispy fries & juicy wrap!',
  'Perfect order, thanks!',
  'Amazing flavor!',
  '5-star shawarma chef!',
];

export function defaultUpgrades(): ShawarmaUpgrades {
  return {
    slicerLevel: 1,
    friesLevel: 1,
    doubleSpit: false,
    turboGrill: false,
    vipDecor: false,
    unlockPomegranate: false,
    unlockCheese: false,
    unlockSuntop: false,
    unlockAyran: false,
  };
}

export interface ShawarmaStats {
  bestCash: number;
  bestDay: number;
}

export interface ShawarmaShopSave {
  cash: number;
  day: number;
  totalServed: number;
  upgrades: ShawarmaUpgrades;
}

export function readShawarmaStats(): ShawarmaStats {
  try {
    const c = Number(window.localStorage.getItem(SHAWARMA_BEST_CASH_KEY) || 0);
    const d = Number(window.localStorage.getItem(SHAWARMA_BEST_DAY_KEY) || 0);
    return {
      bestCash: Number.isFinite(c) && c > 0 ? Math.floor(c) : 0,
      bestDay: Number.isFinite(d) && d > 0 ? Math.floor(d) : 0,
    };
  } catch {
    return { bestCash: 0, bestDay: 0 };
  }
}

export function saveShawarmaStats(stats: ShawarmaStats): void {
  try {
    window.localStorage.setItem(
      SHAWARMA_BEST_CASH_KEY,
      String(Math.max(0, Math.floor(stats.bestCash)))
    );
    window.localStorage.setItem(
      SHAWARMA_BEST_DAY_KEY,
      String(Math.max(0, Math.floor(stats.bestDay)))
    );
  } catch {
    // ignore storage errors
  }
}

export function readShawarmaShopSave(): ShawarmaShopSave | null {
  try {
    const raw = window.localStorage.getItem(SHAWARMA_SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ShawarmaShopSave>;
    return {
      cash: Math.max(0, Math.floor(Number(parsed.cash) || 0)),
      day: Math.max(1, Math.floor(Number(parsed.day) || 1)),
      totalServed: Math.max(0, Math.floor(Number(parsed.totalServed) || 0)),
      upgrades: {
        ...defaultUpgrades(),
        ...(parsed.upgrades || {}),
      },
    };
  } catch {
    return null;
  }
}

export function saveShawarmaShopSave(save: ShawarmaShopSave): void {
  try {
    window.localStorage.setItem(SHAWARMA_SAVE_KEY, JSON.stringify(save));
  } catch {
    // ignore storage errors
  }
}

export function readShawarmaSoundEnabled(): boolean {
  try {
    const raw = window.localStorage.getItem(SHAWARMA_SOUND_KEY);
    if (raw === null) return true;
    return raw === '1';
  } catch {
    return true;
  }
}

export function saveShawarmaSoundEnabled(enabled: boolean): void {
  try {
    window.localStorage.setItem(SHAWARMA_SOUND_KEY, enabled ? '1' : '0');
  } catch {
    // ignore storage errors
  }
}
