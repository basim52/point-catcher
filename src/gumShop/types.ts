export type GumFlavorId =
  | 'mint'
  | 'lemon'
  | 'strawberry'
  | 'bubblegum'
  | 'watermelon'
  | 'mango'
  | 'mastic'
  | 'grape'
  | 'cola'
  | 'blueberry'
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
export const SHELF_MAX_STOCK = 6;
export const STORAGE_ROOM_COST = 200;
export const STORAGE_MAX_PACKS = 60;
export const AD_COST = 400;
export const AD_DURATION_DAYS = 3;
export const DAY_DURATION_SEC = 90;
export const RENT_INTERVAL_DAYS = 5;
export const MAX_SHELVES = 16;

export type ShopLevel = 1 | 2 | 3;

export interface ShopTierSpec {
  level: ShopLevel;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
  cost: number;
  halfW: number;
  backZ: number;
  maxShelves: number;
}

export const SHOP_TIERS: ShopTierSpec[] = [
  {
    level: 1,
    nameAr: 'محل علك صغير',
    nameEn: 'Small Gum Shop',
    descAr: 'المساحة الأساسية — تتسع حتى 8 رفوف',
    descEn: 'Starter floor plan — fits up to 8 shelves',
    cost: 0,
    halfW: 6.2,
    backZ: -5.8,
    maxShelves: 8,
  },
  {
    level: 2,
    nameAr: 'محل علك كبير (توسعة ١)',
    nameEn: 'Large Gum Shop (Expand 1)',
    descAr: 'يكبّر المحل ويفتح 4 رفوف إضافية (حتى 12 رفاً)',
    descEn: 'Expands shop walls & unlocks 4 extra shelves (up to 12)',
    cost: 350,
    halfW: 8.0,
    backZ: -7.8,
    maxShelves: 12,
  },
  {
    level: 3,
    nameAr: 'سوبر ماركت العلك (توسعة ٢)',
    nameEn: 'Mega Gum Market (Expand 2)',
    descAr: 'أكبر حجم للمحل ويفتح 4 رفوف VIP إضافية (حتى 16 رفاً)',
    descEn: 'Maximum shop size & unlocks 4 VIP shelves (up to 16)',
    cost: 750,
    halfW: 9.8,
    backZ: -9.8,
    maxShelves: 16,
  },
];

export interface ShopBounds {
  level: ShopLevel;
  halfW: number;
  backZ: number;
  doorZ: number;
  depth: number;
  centerZ: number;
  maxShelves: number;
  houseX: number;
  houseZ: number;
  houseFrontZ: number;
  houseDoorX: number;
  houseDoorZ: number;
  bedX: number;
  bedZ: number;
  storageX: number;
  storageZ: number;
  storageFrontZ: number;
  storageDoorX: number;
  storageDoorZ: number;
}

export const DEFAULT_CHECKOUT_POS = { x: 3.35, z: 1.35 };

export function getShopBounds(shopLevel: ShopLevel): ShopBounds {
  const tier = SHOP_TIERS.find((t) => t.level === shopLevel) ?? SHOP_TIERS[0];
  const doorZ = 3.0;
  const houseX = tier.halfW + 4.3;
  const houseZ = -0.3;
  const houseFrontZ = houseZ + 2.2; // 1.9
  const storageX = -(tier.halfW + 3.9);
  const storageZ = -0.3;
  const storageFrontZ = storageZ + 2.1; // 1.8
  return {
    level: tier.level,
    halfW: tier.halfW,
    backZ: tier.backZ,
    doorZ,
    depth: doorZ - tier.backZ,
    centerZ: (tier.backZ + doorZ) / 2,
    maxShelves: tier.maxShelves,
    houseX,
    houseZ,
    houseFrontZ,
    houseDoorX: houseX,
    houseDoorZ: houseFrontZ + 1.15, // 3.05 porch spot
    bedX: houseX + 0.95,
    bedZ: houseZ - 0.95, // -1.25 inside back-right corner
    storageX,
    storageZ,
    storageFrontZ,
    storageDoorX: storageX,
    storageDoorZ: storageFrontZ + 1.15, // 2.95 warehouse entry spot
  };
}

export function getDaysUntilRent(day: number): number {
  const rem = day % RENT_INTERVAL_DAYS;
  return rem === 0 ? 0 : RENT_INTERVAL_DAYS - rem;
}

export const GUM_FLAVORS: GumFlavorSpec[] = [
  {
    id: 'mint',
    nameAr: 'علك النعناع',
    nameEn: 'Mint Fresh',
    color: '#14b8a6',
    accent: '#99f6e4',
    boxColor: '#0f766e',
    packsPerBox: PACKS_PER_BOX,
    boxCost: 88, // 11 SAR/pack wholesale -> 13 SAR fairPrice (+2 SAR slim profit)
    unitCost: 11,
    fairPrice: 13,
    minPrice: 5,
    maxPrice: 30,
  },
  {
    id: 'lemon',
    nameAr: 'علك الليمون الحامض',
    nameEn: 'Sour Lemon',
    color: '#eab308',
    accent: '#fef9c3',
    boxColor: '#a16207',
    packsPerBox: PACKS_PER_BOX,
    boxCost: 120, // 15 SAR/pack -> 18 SAR fairPrice (+3 SAR)
    unitCost: 15,
    fairPrice: 18,
    minPrice: 6,
    maxPrice: 40,
  },
  {
    id: 'strawberry',
    nameAr: 'علك الفراولة',
    nameEn: 'Berry Pop',
    color: '#f43f5e',
    accent: '#fecdd3',
    boxColor: '#be123c',
    packsPerBox: PACKS_PER_BOX,
    boxCost: 152, // 19 SAR/pack -> 22 SAR fairPrice (+3 SAR)
    unitCost: 19,
    fairPrice: 22,
    minPrice: 8,
    maxPrice: 50,
  },
  {
    id: 'bubblegum',
    nameAr: 'علك الفقاعات الوردي',
    nameEn: 'Pink Bubblegum',
    color: '#ec4899',
    accent: '#fbcfe8',
    boxColor: '#be185d',
    packsPerBox: PACKS_PER_BOX,
    boxCost: 184, // 23 SAR/pack -> 27 SAR fairPrice (+4 SAR)
    unitCost: 23,
    fairPrice: 27,
    minPrice: 10,
    maxPrice: 60,
  },
  {
    id: 'watermelon',
    nameAr: 'علك البطيخ',
    nameEn: 'Melon Splash',
    color: '#22c55e',
    accent: '#bbf7d0',
    boxColor: '#15803d',
    packsPerBox: PACKS_PER_BOX,
    boxCost: 216, // 27 SAR/pack -> 32 SAR fairPrice (+5 SAR)
    unitCost: 27,
    fairPrice: 32,
    minPrice: 12,
    maxPrice: 70,
  },
  {
    id: 'mango',
    nameAr: 'علك المانجو',
    nameEn: 'Mango Burst',
    color: '#fb923c',
    accent: '#fed7aa',
    boxColor: '#c2410c',
    packsPerBox: PACKS_PER_BOX,
    boxCost: 272, // 34 SAR/pack -> 40 SAR fairPrice (+6 SAR)
    unitCost: 34,
    fairPrice: 40,
    minPrice: 15,
    maxPrice: 90,
  },
  {
    id: 'mastic',
    nameAr: 'علك المستكة',
    nameEn: 'Royal Mastic',
    color: '#f59e0b',
    accent: '#fef08a',
    boxColor: '#b45309',
    packsPerBox: PACKS_PER_BOX,
    boxCost: 328, // 41 SAR/pack -> 48 SAR fairPrice (+7 SAR)
    unitCost: 41,
    fairPrice: 48,
    minPrice: 18,
    maxPrice: 105,
  },
  {
    id: 'grape',
    nameAr: 'علك العنب',
    nameEn: 'Grape Pop',
    color: '#a855f7',
    accent: '#e9d5ff',
    boxColor: '#6b21a8',
    packsPerBox: PACKS_PER_BOX,
    boxCost: 392, // 49 SAR/pack -> 57 SAR fairPrice (+8 SAR)
    unitCost: 49,
    fairPrice: 57,
    minPrice: 22,
    maxPrice: 125,
  },
  {
    id: 'cola',
    nameAr: 'علك الكولا',
    nameEn: 'Cola Fizz',
    color: '#b91c1c',
    accent: '#fca5a5',
    boxColor: '#7f1d1d',
    packsPerBox: PACKS_PER_BOX,
    boxCost: 464, // 58 SAR/pack -> 68 SAR fairPrice (+10 SAR)
    unitCost: 58,
    fairPrice: 68,
    minPrice: 25,
    maxPrice: 150,
  },
  {
    id: 'blueberry',
    nameAr: 'علك التوت الأزرق',
    nameEn: 'Blue Berry',
    color: '#3b82f6',
    accent: '#bfdbfe',
    boxColor: '#1d4ed8',
    packsPerBox: PACKS_PER_BOX,
    boxCost: 552, // 69 SAR/pack -> 80 SAR fairPrice (+11 SAR)
    unitCost: 69,
    fairPrice: 80,
    minPrice: 30,
    maxPrice: 175,
  },
  {
    id: 'golden',
    nameAr: 'علك الذهب الملكي',
    nameEn: 'Golden Bubble',
    color: '#8b5cf6',
    accent: '#fde047',
    boxColor: '#5b21b6',
    packsPerBox: PACKS_PER_BOX,
    boxCost: 672, // 84 SAR/pack -> 98 SAR fairPrice (+14 SAR)
    unitCost: 84,
    fairPrice: 98,
    minPrice: 35,
    maxPrice: 215,
  },
];

export const MIN_CRATE_COST = GUM_FLAVORS[0].boxCost;
export const EMERGENCY_GRANT_AMOUNT = 95;

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
  requiredShopLevel: ShopLevel;
  nameAr: string;
  nameEn: string;
}

// 16 interior 3D shelf positions: slots 0-7 (Level 1), 8-11 (Level 2), 12-15 (Level 3)
export const SHELF_SLOTS: ShelfSlotSpec[] = [
  {
    slotIndex: 0,
    x: -4.4,
    z: -3.6,
    rotY: Math.PI / 2,
    cost: 0,
    style: 'wood',
    requiredShopLevel: 1,
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
    requiredShopLevel: 1,
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
    requiredShopLevel: 1,
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
    requiredShopLevel: 1,
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
    requiredShopLevel: 1,
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
    requiredShopLevel: 1,
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
    requiredShopLevel: 1,
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
    requiredShopLevel: 1,
    nameAr: 'رف ذهبي VIP ٨',
    nameEn: 'Gold VIP Shelf #8',
  },
  // Level 2 Expanded Shelves (8-11)
  {
    slotIndex: 8,
    x: -6.5,
    z: -5.2,
    rotY: Math.PI / 2,
    cost: 260,
    style: 'acrylic',
    requiredShopLevel: 2,
    nameAr: 'رف توسعة ٩',
    nameEn: 'Expanded Shelf #9',
  },
  {
    slotIndex: 9,
    x: -2.2,
    z: -6.5,
    rotY: 0,
    cost: 310,
    style: 'acrylic',
    requiredShopLevel: 2,
    nameAr: 'رف توسعة ١٠',
    nameEn: 'Expanded Shelf #10',
  },
  {
    slotIndex: 10,
    x: 2.2,
    z: -6.5,
    rotY: 0,
    cost: 360,
    style: 'gold',
    requiredShopLevel: 2,
    nameAr: 'رف توسعة ١١',
    nameEn: 'Expanded Shelf #11',
  },
  {
    slotIndex: 11,
    x: 6.5,
    z: -5.2,
    rotY: -Math.PI / 2,
    cost: 420,
    style: 'gold',
    requiredShopLevel: 2,
    nameAr: 'رف توسعة ١٢',
    nameEn: 'Expanded Shelf #12',
  },
  // Level 3 Mega Market Shelves (12-15)
  {
    slotIndex: 12,
    x: -8.3,
    z: -7.6,
    rotY: Math.PI / 2,
    cost: 480,
    style: 'gold',
    requiredShopLevel: 3,
    nameAr: 'رف سوبر ماركت ١٣',
    nameEn: 'Mega Shelf #13',
  },
  {
    slotIndex: 13,
    x: -2.8,
    z: -8.5,
    rotY: 0,
    cost: 540,
    style: 'gold',
    requiredShopLevel: 3,
    nameAr: 'رف سوبر ماركت ١٤',
    nameEn: 'Mega Shelf #14',
  },
  {
    slotIndex: 14,
    x: 2.8,
    z: -8.5,
    rotY: 0,
    cost: 620,
    style: 'gold',
    requiredShopLevel: 3,
    nameAr: 'رف سوبر ماركت ١٥',
    nameEn: 'Mega Shelf #15',
  },
  {
    slotIndex: 15,
    x: 8.3,
    z: -7.6,
    rotY: -Math.PI / 2,
    cost: 700,
    style: 'gold',
    requiredShopLevel: 3,
    nameAr: 'رف سوبر ماركت ١٦',
    nameEn: 'Mega Shelf #16',
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
    nameAr: 'قفازات التعبئة السريعة',
    nameEn: 'Turbo Stock Gloves',
    descAr: 'مدى تعبئة تلقائية أوسع + علبتين مجاناً مع كل كرتون (كل رف 6 علب)',
    descEn: 'Wider auto-stock reach + 2 free bonus packs per crate (6 packs/shelf)',
    cost: 450,
  },
];

export type AdCampaignId =
  | 'mega_flavors'
  | 'super_offers'
  | 'vip_crown'
  | 'viral_festival';

export interface AdCampaignSpec {
  id: AdCampaignId;
  screenTarget: 'left' | 'right' | 'skyline' | 'all';
  titleAr: string;
  titleEn: string;
  headlineAr: string;
  headlineEn: string;
  descAr: string;
  descEn: string;
  cost: number;
  durationDays: number;
  primaryColor: string;
  accentColor: string;
}

export const AD_CAMPAIGNS: AdCampaignSpec[] = [
  {
    id: 'mega_flavors',
    screenTarget: 'left',
    titleAr: 'إعلان النكهات الطازجة',
    titleEn: 'Fresh Flavors Billboard',
    headlineAr: 'أطيب علك بالحي!',
    headlineEn: 'FRESHEST GUM IN TOWN!',
    descAr: 'يُعرض على اللوحة الضخمة اليسرى · +40% سرعة قدوم الزبائن و +2 زبائن بالمحل',
    descEn: 'Left Giant Billboard · +40% faster customer arrivals & +2 max shoppers',
    cost: AD_COST,
    durationDays: AD_DURATION_DAYS,
    primaryColor: '#0d9488',
    accentColor: '#fde047',
  },
  {
    id: 'super_offers',
    screenTarget: 'right',
    titleAr: 'إعلان العروض الذهبية',
    titleEn: 'Golden Deals LED Screen',
    headlineAr: 'عروض العلك الذهبية!',
    headlineEn: 'GOLDEN GUM DEALS!',
    descAr: 'يُعرض على الشاشة الضخمة اليمنى · الزبائن يشترون علبة إضافية + 12% مكافأة بيع',
    descEn: 'Right Giant LED Screen · Shoppers buy +1 extra pack & +12% checkout bonus',
    cost: AD_COST,
    durationDays: AD_DURATION_DAYS,
    primaryColor: '#d97706',
    accentColor: '#fef08a',
  },
  {
    id: 'vip_crown',
    screenTarget: 'skyline',
    titleAr: 'إعلان الشاشة العملاقة VIP',
    titleEn: 'Skyline VIP Jumbotron',
    headlineAr: 'بياع العلك رقم 1 ★',
    headlineEn: '#1 GUM SHOP VIP ★',
    descAr: 'يضيء الشاشة العملاقة فوق المحل · +15% أرباح إضافية و +2 زبائن VIP',
    descEn: 'Towering Rooftop Jumbotron · +15% extra revenue & +2 VIP shoppers',
    cost: AD_COST,
    durationDays: AD_DURATION_DAYS,
    primaryColor: '#7c3aed',
    accentColor: '#38bdf8',
  },
  {
    id: 'viral_festival',
    screenTarget: 'all',
    titleAr: 'إعلان مهرجان العلك الشامل',
    titleEn: 'Mega Gum Festival Takeover',
    headlineAr: 'مهرجان العلك الكبير!',
    headlineEn: 'MEGA GUM FESTIVAL!',
    descAr: 'يُعرض على كل الشاشات الضخمة بالخارج معاً · أقصى إقبال للزبائن + 18% أرباح',
    descEn: 'Lights up ALL Giant Outdoor Screens · Peak customer rush & +18% revenue',
    cost: AD_COST,
    durationDays: AD_DURATION_DAYS,
    primaryColor: '#e11d48',
    accentColor: '#facc15',
  },
];

export const AD_CAMPAIGN_MAP: Record<AdCampaignId, AdCampaignSpec> = AD_CAMPAIGNS.reduce(
  (acc, c) => {
    acc[c.id] = c;
    return acc;
  },
  {} as Record<AdCampaignId, AdCampaignSpec>
);

export interface ActiveAdState {
  id: AdCampaignId;
  daysLeft: number;
}

export interface ShelfState {
  slotIndex: number;
  style: ShelfStyle;
  x: number;
  z: number;
  rotY: number;
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

export type GumShopModalTab =
  | 'none'
  | 'order'
  | 'pricing'
  | 'shelves'
  | 'storage'
  | 'ads'
  | 'puzzles';

export interface GumShopSaveData {
  version: number;
  money: number;
  day: number;
  dayTimeLeft: number;
  isNight: boolean;
  houseDoorUnlocked: boolean;
  solvedPuzzleIds: number[];
  hasStorageRoom: boolean;
  storageStock: Partial<Record<GumFlavorId, number>>;
  activeAds: ActiveAdState[];
  shopLevel: ShopLevel;
  cashierX: number;
  cashierZ: number;
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
  isNight: boolean;
  houseDoorUnlocked: boolean;
  solvedPuzzleIds: number[];
  isInsideHouse: boolean;
  hasStorageRoom: boolean;
  storageStock: Partial<Record<GumFlavorId, number>>;
  storageTotalPacks: number;
  activeAds: ActiveAdState[];
  daysUntilRent: number;
  isRentDay: boolean;
  shopLevel: ShopLevel;
  cashierX: number;
  cashierZ: number;
  sleepFadeActive: boolean;
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
    | { kind: 'checkout' }
    | { kind: 'house_door' }
    | { kind: 'bed' }
    | { kind: 'storage_door' }
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
    lemon: GUM_FLAVOR_MAP.lemon.fairPrice,
    strawberry: GUM_FLAVOR_MAP.strawberry.fairPrice,
    bubblegum: GUM_FLAVOR_MAP.bubblegum.fairPrice,
    watermelon: GUM_FLAVOR_MAP.watermelon.fairPrice,
    mango: GUM_FLAVOR_MAP.mango.fairPrice,
    mastic: GUM_FLAVOR_MAP.mastic.fairPrice,
    grape: GUM_FLAVOR_MAP.grape.fairPrice,
    cola: GUM_FLAVOR_MAP.cola.fairPrice,
    blueberry: GUM_FLAVOR_MAP.blueberry.fairPrice,
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

export function clampCashierPosition(
  rawX: number,
  rawZ: number,
  shopLevel: ShopLevel
): { x: number; z: number } {
  const bounds = getShopBounds(shopLevel);
  let x = Math.max(-(bounds.halfW - 1.15), Math.min(bounds.halfW - 1.15, rawX));
  const z = Math.max(bounds.backZ + 1.35, Math.min(bounds.doorZ - 1.45, rawZ));

  // Keep doorway lane clear so customers & player always walk in freely
  if (Math.abs(x) < 1.9 && z > 0.65) {
    x = x >= 0 ? 2.15 : -2.15;
  }

  return { x: Number(x.toFixed(2)), z: Number(z.toFixed(2)) };
}

export function clampShelfPosition(
  rawX: number,
  rawZ: number,
  rotY: number,
  shopLevel: ShopLevel
): { x: number; z: number } {
  const bounds = getShopBounds(shopLevel);
  const rotated = Math.abs(Math.sin(rotY)) > 0.5;
  const padX = rotated ? 0.8 : 1.38;
  const padZ = rotated ? 1.35 : 0.78;
  let x = Math.max(-(bounds.halfW - padX), Math.min(bounds.halfW - padX, rawX));
  const z = Math.max(bounds.backZ + padZ, Math.min(bounds.doorZ - padZ - 0.35, rawZ));

  // Keep front center doorway clear so customers and player always walk in freely
  if (Math.abs(x) < 1.9 && z > 0.55) {
    x = x >= 0 ? 2.25 : -2.25;
  }

  return { x: Number(x.toFixed(2)), z: Number(z.toFixed(2)) };
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
    const isLegacyPreV7 = (parsed.version ?? 1) < 7;
    if (!isLegacyPreV7 && parsed.prices && typeof parsed.prices === 'object') {
      for (const f of GUM_FLAVORS) {
        const val = (parsed.prices as Record<string, unknown>)[f.id];
        if (typeof val === 'number' && Number.isFinite(val)) {
          prices[f.id] = Math.max(f.minPrice, Math.min(f.maxPrice, Math.round(val)));
        }
      }
    }

    const shopLevel: ShopLevel =
      parsed.shopLevel === 3 ? 3 : parsed.shopLevel === 2 ? 2 : 1;

    const clampedCashier = clampCashierPosition(
      typeof parsed.cashierX === 'number' && Number.isFinite(parsed.cashierX)
        ? parsed.cashierX
        : DEFAULT_CHECKOUT_POS.x,
      typeof parsed.cashierZ === 'number' && Number.isFinite(parsed.cashierZ)
        ? parsed.cashierZ
        : DEFAULT_CHECKOUT_POS.z,
      shopLevel
    );

    const validShelves: ShelfState[] = parsed.shelves
      .filter(
        (s): s is ShelfState =>
          Boolean(s) &&
          typeof s.slotIndex === 'number' &&
          s.slotIndex >= 0 &&
          s.slotIndex < MAX_SHELVES
      )
      .map((s) => {
        const fallback = SHELF_SLOTS[s.slotIndex];
        const rotY =
          typeof s.rotY === 'number' && Number.isFinite(s.rotY)
            ? s.rotY
            : (fallback?.rotY ?? 0);
        const pos = clampShelfPosition(
          typeof s.x === 'number' && Number.isFinite(s.x) ? s.x : (fallback?.x ?? 0),
          typeof s.z === 'number' && Number.isFinite(s.z) ? s.z : (fallback?.z ?? -2),
          rotY,
          shopLevel
        );
        return {
          slotIndex: s.slotIndex,
          style: fallback?.style ?? 'wood',
          x: pos.x,
          z: pos.z,
          rotY,
          flavor: s.flavor && s.flavor in GUM_FLAVOR_MAP ? s.flavor : null,
          stock:
            typeof s.stock === 'number' && Number.isFinite(s.stock)
              ? Math.max(0, Math.min(SHELF_MAX_STOCK, Math.floor(s.stock)))
              : 0,
        };
      });

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
            packs: Math.min(PACKS_PER_BOX + 2, Math.max(1, Math.floor(c.packs))),
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
            packs: Math.min(PACKS_PER_BOX + 2, Math.max(1, Math.floor(parsed.carriedCrate.packs))),
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

    const solvedPuzzleIds: number[] = Array.isArray(parsed.solvedPuzzleIds)
      ? Array.from(
          new Set(
            parsed.solvedPuzzleIds.filter(
              (id): id is number =>
                typeof id === 'number' && Number.isInteger(id) && id >= 1 && id <= 50
            )
          )
        ).sort((a, b) => a - b)
      : [];

    const storageStock: Partial<Record<GumFlavorId, number>> = {};
    if (parsed.storageStock && typeof parsed.storageStock === 'object') {
      let runningTotal = 0;
      for (const f of GUM_FLAVORS) {
        const rawQty = (parsed.storageStock as Record<string, unknown>)[f.id];
        if (typeof rawQty === 'number' && Number.isFinite(rawQty) && rawQty > 0) {
          const clampedQty = Math.min(
            Math.max(0, STORAGE_MAX_PACKS - runningTotal),
            Math.floor(rawQty)
          );
          if (clampedQty > 0) {
            storageStock[f.id] = clampedQty;
            runningTotal += clampedQty;
          }
        }
      }
    }

    const activeAds: ActiveAdState[] = Array.isArray(parsed.activeAds)
      ? parsed.activeAds
          .filter(
            (a): a is ActiveAdState =>
              Boolean(a) &&
              typeof a.id === 'string' &&
              a.id in AD_CAMPAIGN_MAP &&
              typeof a.daysLeft === 'number' &&
              Number.isFinite(a.daysLeft) &&
              a.daysLeft > 0
          )
          .map((a) => ({
            id: a.id,
            daysLeft: Math.min(30, Math.max(1, Math.floor(a.daysLeft))),
          }))
      : [];

    const dayTimeLeft = Math.max(
      0,
      Math.min(DAY_DURATION_SEC, Number(parsed.dayTimeLeft ?? DAY_DURATION_SEC))
    );

    return {
      version: 7,
      money: Math.max(0, Math.round(parsed.money)),
      day: Math.max(1, Math.floor(parsed.day ?? 1)),
      dayTimeLeft,
      isNight: Boolean(parsed.isNight) || dayTimeLeft <= 0,
      houseDoorUnlocked: Boolean(parsed.houseDoorUnlocked),
      solvedPuzzleIds,
      hasStorageRoom: Boolean(parsed.hasStorageRoom),
      storageStock,
      activeAds,
      shopLevel,
      cashierX: clampedCashier.x,
      cashierZ: clampedCashier.z,
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
