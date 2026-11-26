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
  | 'golden'
  | 'cherry'
  | 'blackberry'
  | 'green_apple'
  | 'kiwi'
  | 'peach'
  | 'apricot'
  | 'pineapple'
  | 'coconut'
  | 'caramel'
  | 'vanilla_cream'
  | 'arabic_coffee'
  | 'cinnamon'
  | 'choco_mint'
  | 'hazelnut_choco'
  | 'pomegranate'
  | 'prickly_pear'
  | 'saffron'
  | 'taif_rose'
  | 'dragon_fruit'
  | 'mangosteen'
  | 'mountain_honey'
  | 'pistachio'
  | 'lychee'
  | 'matcha'
  | 'blue_crystal'
  | 'ruby_berry'
  | 'diamond_gum'
  | 'royal_emerald'
  | 'cosmic_crown';

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
  requiredRank: number; // Rank required to unlock ordering this product
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
  scooterShopX: number;
  scooterShopZ: number;
  scooterShopFrontZ: number;
  scooterShopDoorX: number;
  scooterShopDoorZ: number;
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
  const scooterShopX = houseX + 14.4;
  const scooterShopZ = -0.4;
  const scooterShopFrontZ = scooterShopZ + 2.2; // 1.8
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
    scooterShopX,
    scooterShopZ,
    scooterShopFrontZ,
    scooterShopDoorX: scooterShopX,
    scooterShopDoorZ: scooterShopFrontZ + 1.8, // 3.6 showroom front spot
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
    requiredRank: 1,
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
    requiredRank: 1,
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
    requiredRank: 1,
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
    requiredRank: 1,
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
    requiredRank: 1,
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
    requiredRank: 1,
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
    requiredRank: 1,
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
    requiredRank: 1,
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
    requiredRank: 1,
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
    requiredRank: 1,
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
    requiredRank: 1,
  },
  // Rank-Exclusive Products (2-3 new products unlocked at EVERY Rank from Rank 2 to Rank 15!)
  {
    id: 'cherry',
    nameAr: 'علك الكرز الحلو',
    nameEn: 'Sweet Cherry',
    color: '#e11d48',
    accent: '#fda4af',
    boxColor: '#9f1239',
    packsPerBox: PACKS_PER_BOX,
    boxCost: 160, // 20 SAR/pack -> 24 SAR fairPrice (+4 SAR)
    unitCost: 20,
    fairPrice: 24,
    minPrice: 10,
    maxPrice: 55,
    requiredRank: 2,
  },
  {
    id: 'blackberry',
    nameAr: 'علك التوت الأسود',
    nameEn: 'Blackberry Pop',
    color: '#6d28d9',
    accent: '#ddd6fe',
    boxColor: '#4c1d95',
    packsPerBox: PACKS_PER_BOX,
    boxCost: 176, // 22 SAR/pack -> 26 SAR fairPrice (+4 SAR)
    unitCost: 22,
    fairPrice: 26,
    minPrice: 10,
    maxPrice: 60,
    requiredRank: 2,
  },
  {
    id: 'green_apple',
    nameAr: 'علك التفاح الأخضر الحامض',
    nameEn: 'Sour Green Apple',
    color: '#84cc16',
    accent: '#ecfccb',
    boxColor: '#4d7c0f',
    packsPerBox: PACKS_PER_BOX,
    boxCost: 200, // 25 SAR/pack -> 30 SAR fairPrice (+5 SAR)
    unitCost: 25,
    fairPrice: 30,
    minPrice: 12,
    maxPrice: 68,
    requiredRank: 3,
  },
  {
    id: 'kiwi',
    nameAr: 'علك الكيوي المنعش',
    nameEn: 'Kiwi Splash',
    color: '#65a30d',
    accent: '#d9f99d',
    boxColor: '#3f6212',
    packsPerBox: PACKS_PER_BOX,
    boxCost: 216, // 27 SAR/pack -> 33 SAR fairPrice (+6 SAR)
    unitCost: 27,
    fairPrice: 33,
    minPrice: 12,
    maxPrice: 74,
    requiredRank: 3,
  },
  {
    id: 'peach',
    nameAr: 'علك الخوخ المنعش',
    nameEn: 'Fresh Peach',
    color: '#fb7185',
    accent: '#ffe4e6',
    boxColor: '#e11d48',
    packsPerBox: PACKS_PER_BOX,
    boxCost: 248, // 31 SAR/pack -> 37 SAR fairPrice (+6 SAR)
    unitCost: 31,
    fairPrice: 37,
    minPrice: 14,
    maxPrice: 82,
    requiredRank: 4,
  },
  {
    id: 'apricot',
    nameAr: 'علك المشمش الذهبي',
    nameEn: 'Golden Apricot',
    color: '#f97316',
    accent: '#ffedd5',
    boxColor: '#c2410c',
    packsPerBox: PACKS_PER_BOX,
    boxCost: 264, // 33 SAR/pack -> 40 SAR fairPrice (+7 SAR)
    unitCost: 33,
    fairPrice: 40,
    minPrice: 15,
    maxPrice: 88,
    requiredRank: 4,
  },
  {
    id: 'pineapple',
    nameAr: 'علك الأناناس الاستوائي',
    nameEn: 'Tropical Pineapple',
    color: '#facc15',
    accent: '#fef9c3',
    boxColor: '#ca8a04',
    packsPerBox: PACKS_PER_BOX,
    boxCost: 296, // 37 SAR/pack -> 44 SAR fairPrice (+7 SAR)
    unitCost: 37,
    fairPrice: 44,
    minPrice: 16,
    maxPrice: 96,
    requiredRank: 5,
  },
  {
    id: 'coconut',
    nameAr: 'علك جوز الهند الكريمي',
    nameEn: 'Creamy Coconut',
    color: '#e2e8f0',
    accent: '#f8fafc',
    boxColor: '#64748b',
    packsPerBox: PACKS_PER_BOX,
    boxCost: 312, // 39 SAR/pack -> 47 SAR fairPrice (+8 SAR)
    unitCost: 39,
    fairPrice: 47,
    minPrice: 18,
    maxPrice: 102,
    requiredRank: 5,
  },
  {
    id: 'caramel',
    nameAr: 'علك الكراميل المملح',
    nameEn: 'Salted Caramel',
    color: '#d97706',
    accent: '#fde68a',
    boxColor: '#92400e',
    packsPerBox: PACKS_PER_BOX,
    boxCost: 352, // 44 SAR/pack -> 52 SAR fairPrice (+8 SAR)
    unitCost: 44,
    fairPrice: 52,
    minPrice: 20,
    maxPrice: 115,
    requiredRank: 6,
  },
  {
    id: 'vanilla_cream',
    nameAr: 'علك الفانيلا بالكريمة',
    nameEn: 'Vanilla Cream',
    color: '#fde68a',
    accent: '#fffbeb',
    boxColor: '#b45309',
    packsPerBox: PACKS_PER_BOX,
    boxCost: 368, // 46 SAR/pack -> 55 SAR fairPrice (+9 SAR)
    unitCost: 46,
    fairPrice: 55,
    minPrice: 20,
    maxPrice: 120,
    requiredRank: 6,
  },
  {
    id: 'arabic_coffee',
    nameAr: 'علك القهوة العربية',
    nameEn: 'Arabic Coffee',
    color: '#92400e',
    accent: '#fcd34d',
    boxColor: '#451a03',
    packsPerBox: PACKS_PER_BOX,
    boxCost: 416, // 52 SAR/pack -> 62 SAR fairPrice (+10 SAR)
    unitCost: 52,
    fairPrice: 62,
    minPrice: 24,
    maxPrice: 135,
    requiredRank: 7,
  },
  {
    id: 'cinnamon',
    nameAr: 'علك القرفة الحارة',
    nameEn: 'Spicy Cinnamon',
    color: '#dc2626',
    accent: '#fecaca',
    boxColor: '#991b1b',
    packsPerBox: PACKS_PER_BOX,
    boxCost: 432, // 54 SAR/pack -> 65 SAR fairPrice (+11 SAR)
    unitCost: 54,
    fairPrice: 65,
    minPrice: 24,
    maxPrice: 142,
    requiredRank: 7,
  },
  {
    id: 'choco_mint',
    nameAr: 'علك الشوكولاتة بالنعناع',
    nameEn: 'Choco Mint',
    color: '#10b981',
    accent: '#a7f3d0',
    boxColor: '#065f46',
    packsPerBox: PACKS_PER_BOX,
    boxCost: 488, // 61 SAR/pack -> 72 SAR fairPrice (+11 SAR)
    unitCost: 61,
    fairPrice: 72,
    minPrice: 28,
    maxPrice: 155,
    requiredRank: 8,
  },
  {
    id: 'hazelnut_choco',
    nameAr: 'علك البندق بالشوكولاتة',
    nameEn: 'Choco Hazelnut',
    color: '#78350f',
    accent: '#fed7aa',
    boxColor: '#451a03',
    packsPerBox: PACKS_PER_BOX,
    boxCost: 504, // 63 SAR/pack -> 75 SAR fairPrice (+12 SAR)
    unitCost: 63,
    fairPrice: 75,
    minPrice: 28,
    maxPrice: 162,
    requiredRank: 8,
  },
  {
    id: 'pomegranate',
    nameAr: 'علك الرمان الملكي',
    nameEn: 'Royal Pomegranate',
    color: '#be123c',
    accent: '#fecdd3',
    boxColor: '#881337',
    packsPerBox: PACKS_PER_BOX,
    boxCost: 560, // 70 SAR/pack -> 83 SAR fairPrice (+13 SAR)
    unitCost: 70,
    fairPrice: 83,
    minPrice: 32,
    maxPrice: 180,
    requiredRank: 9,
  },
  {
    id: 'prickly_pear',
    nameAr: 'علك التين الشوكي',
    nameEn: 'Prickly Pear',
    color: '#ec4899',
    accent: '#fce7f3',
    boxColor: '#9d174d',
    packsPerBox: PACKS_PER_BOX,
    boxCost: 584, // 73 SAR/pack -> 87 SAR fairPrice (+14 SAR)
    unitCost: 73,
    fairPrice: 87,
    minPrice: 34,
    maxPrice: 190,
    requiredRank: 9,
  },
  {
    id: 'saffron',
    nameAr: 'علك الزعفران والهيل',
    nameEn: 'Saffron Cardamom',
    color: '#ea580c',
    accent: '#fed7aa',
    boxColor: '#9a3412',
    packsPerBox: PACKS_PER_BOX,
    boxCost: 640, // 80 SAR/pack -> 95 SAR fairPrice (+15 SAR)
    unitCost: 80,
    fairPrice: 95,
    minPrice: 36,
    maxPrice: 205,
    requiredRank: 10,
  },
  {
    id: 'taif_rose',
    nameAr: 'علك الورد الطائفي',
    nameEn: 'Taif Rose',
    color: '#f43f5e',
    accent: '#ffe4e6',
    boxColor: '#9f1239',
    packsPerBox: PACKS_PER_BOX,
    boxCost: 664, // 83 SAR/pack -> 99 SAR fairPrice (+16 SAR)
    unitCost: 83,
    fairPrice: 99,
    minPrice: 38,
    maxPrice: 215,
    requiredRank: 10,
  },
  {
    id: 'dragon_fruit',
    nameAr: 'علك فاكهة التنين',
    nameEn: 'Dragon Fruit',
    color: '#d946ef',
    accent: '#f5d0fe',
    boxColor: '#86198f',
    packsPerBox: PACKS_PER_BOX,
    boxCost: 720, // 90 SAR/pack -> 107 SAR fairPrice (+17 SAR)
    unitCost: 90,
    fairPrice: 107,
    minPrice: 40,
    maxPrice: 230,
    requiredRank: 11,
  },
  {
    id: 'mangosteen',
    nameAr: 'علك المانجوستين الاستوائي',
    nameEn: 'Tropical Mangosteen',
    color: '#9333ea',
    accent: '#f3e8ff',
    boxColor: '#581c87',
    packsPerBox: PACKS_PER_BOX,
    boxCost: 752, // 94 SAR/pack -> 112 SAR fairPrice (+18 SAR)
    unitCost: 94,
    fairPrice: 112,
    minPrice: 42,
    maxPrice: 242,
    requiredRank: 11,
  },
  {
    id: 'mountain_honey',
    nameAr: 'علك العسل الجبلي',
    nameEn: 'Mountain Honey',
    color: '#f59e0b',
    accent: '#fef3c7',
    boxColor: '#78350f',
    packsPerBox: PACKS_PER_BOX,
    boxCost: 808, // 101 SAR/pack -> 120 SAR fairPrice (+19 SAR)
    unitCost: 101,
    fairPrice: 120,
    minPrice: 45,
    maxPrice: 260,
    requiredRank: 12,
  },
  {
    id: 'pistachio',
    nameAr: 'علك الفستق الحلبي',
    nameEn: 'Pistachio Royal',
    color: '#4ade80',
    accent: '#dcfce7',
    boxColor: '#166534',
    packsPerBox: PACKS_PER_BOX,
    boxCost: 840, // 105 SAR/pack -> 125 SAR fairPrice (+20 SAR)
    unitCost: 105,
    fairPrice: 125,
    minPrice: 48,
    maxPrice: 270,
    requiredRank: 12,
  },
  {
    id: 'lychee',
    nameAr: 'علك الليتشي الياباني',
    nameEn: 'Japanese Lychee',
    color: '#f472b6',
    accent: '#fce7f3',
    boxColor: '#9d174d',
    packsPerBox: PACKS_PER_BOX,
    boxCost: 904, // 113 SAR/pack -> 134 SAR fairPrice (+21 SAR)
    unitCost: 113,
    fairPrice: 134,
    minPrice: 50,
    maxPrice: 290,
    requiredRank: 13,
  },
  {
    id: 'matcha',
    nameAr: 'علك الماتشا الياباني',
    nameEn: 'Japanese Matcha',
    color: '#16a34a',
    accent: '#bbf7d0',
    boxColor: '#14532d',
    packsPerBox: PACKS_PER_BOX,
    boxCost: 936, // 117 SAR/pack -> 140 SAR fairPrice (+23 SAR)
    unitCost: 117,
    fairPrice: 140,
    minPrice: 52,
    maxPrice: 302,
    requiredRank: 13,
  },
  {
    id: 'blue_crystal',
    nameAr: 'علك الكريستال الأزرق',
    nameEn: 'Blue Crystal',
    color: '#06b6d4',
    accent: '#cffafe',
    boxColor: '#155e75',
    packsPerBox: PACKS_PER_BOX,
    boxCost: 1008, // 126 SAR/pack -> 150 SAR fairPrice (+24 SAR)
    unitCost: 126,
    fairPrice: 150,
    minPrice: 58,
    maxPrice: 325,
    requiredRank: 14,
  },
  {
    id: 'ruby_berry',
    nameAr: 'علك الياقوت الأحمر',
    nameEn: 'Ruby Berry',
    color: '#e11d48',
    accent: '#fecdd3',
    boxColor: '#881337',
    packsPerBox: PACKS_PER_BOX,
    boxCost: 1048, // 131 SAR/pack -> 157 SAR fairPrice (+26 SAR)
    unitCost: 131,
    fairPrice: 157,
    minPrice: 60,
    maxPrice: 340,
    requiredRank: 14,
  },
  {
    id: 'diamond_gum',
    nameAr: 'علك الماس الأسطوري',
    nameEn: 'Diamond Legend',
    color: '#38bdf8',
    accent: '#fef08a',
    boxColor: '#0369a1',
    packsPerBox: PACKS_PER_BOX,
    boxCost: 1120, // 140 SAR/pack -> 168 SAR fairPrice (+28 SAR)
    unitCost: 140,
    fairPrice: 168,
    minPrice: 65,
    maxPrice: 360,
    requiredRank: 15,
  },
  {
    id: 'royal_emerald',
    nameAr: 'علك الزمرد الملكي',
    nameEn: 'Royal Emerald',
    color: '#059669',
    accent: '#a7f3d0',
    boxColor: '#064e3b',
    packsPerBox: PACKS_PER_BOX,
    boxCost: 1168, // 146 SAR/pack -> 176 SAR fairPrice (+30 SAR)
    unitCost: 146,
    fairPrice: 176,
    minPrice: 68,
    maxPrice: 380,
    requiredRank: 15,
  },
  {
    id: 'cosmic_crown',
    nameAr: 'علك التاج الكوني',
    nameEn: 'Cosmic Crown',
    color: '#eab308',
    accent: '#fef08a',
    boxColor: '#713f12',
    packsPerBox: PACKS_PER_BOX,
    boxCost: 1240, // 155 SAR/pack -> 188 SAR fairPrice (+33 SAR)
    unitCost: 155,
    fairPrice: 188,
    minPrice: 72,
    maxPrice: 405,
    requiredRank: 15,
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
    descAr: 'يحاسب الزبائن تلقائياً وبسرعة مع إكرامية بسيطة +2%',
    descEn: 'Instantly rings up customers with a small +2% tip',
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
    descAr: 'يُعرض على الشاشة الضخمة اليمنى · الزبائن يشترون علبة إضافية + 2% مكافأة بيع',
    descEn: 'Right Giant LED Screen · Shoppers buy +1 extra pack & +2% checkout bonus',
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
    descAr: 'يضيء الشاشة العملاقة فوق المحل · +2% إكرامية إضافية و +2 زبائن VIP',
    descEn: 'Towering Rooftop Jumbotron · +2% extra tip & +2 VIP shoppers',
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
    descAr: 'يُعرض على كل الشاشات الضخمة بالخارج معاً · أقصى إقبال للزبائن + 3% إكرامية',
    descEn: 'Lights up ALL Giant Outdoor Screens · Peak customer rush & +3% tip bonus',
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
  | 'puzzles'
  | 'ranks'
  | 'phone'
  | 'scooter';

export type ScooterId =
  | 'city_e'
  | 'mint_turbo'
  | 'crimson_racer'
  | 'cyber_neon'
  | 'golden_king';

export interface ScooterSpec {
  id: ScooterId;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
  cost: number;
  speed: number;
  bodyColor: string;
  trimColor: string;
  rimColor: string;
  glowColor?: string;
}

export const SCOOTERS: ScooterSpec[] = [
  {
    id: 'city_e',
    nameAr: 'سكوتر المدينة الكهربائي',
    nameEn: 'City E-Scooter',
    descAr: 'سكوتر اقتصادي عملي وسريع للتنقل والتوصيل في الحي',
    descEn: 'Practical electric city scooter for fast neighborhood rides',
    cost: 400,
    speed: 8.6,
    bodyColor: '#06b6d4',
    trimColor: '#0f172a',
    rimColor: '#e2e8f0',
  },
  {
    id: 'mint_turbo',
    nameAr: 'سكوتر التيربو الأخضر',
    nameEn: 'Turbo Mint Scooter',
    descAr: 'تسارع ممتاز وإطار رياضي أخضر لتوصيل الطلبات بسرعة',
    descEn: 'Sporty emerald frame with punchy acceleration for deliveries',
    cost: 650,
    speed: 10.2,
    bodyColor: '#10b981',
    trimColor: '#064e3b',
    rimColor: '#a7f3d0',
  },
  {
    id: 'crimson_racer',
    nameAr: 'سكوتر السباق الأحمر',
    nameEn: 'Crimson Racer',
    descAr: 'هيكل سباقات أحمر مع جنوط ذهبية وسرعة عالية جداً في الشارع',
    descEn: 'Racing crimson chassis with golden rims and high street speed',
    cost: 950,
    speed: 11.8,
    bodyColor: '#ef4444',
    trimColor: '#1e293b',
    rimColor: '#fbbf24',
  },
  {
    id: 'cyber_neon',
    nameAr: 'سكوتر سايبر النيون',
    nameEn: 'Cyber Neon Scooter',
    descAr: 'إضاءة نيون سفلية متوهجة وسرعة فائقة تجذب أنظار كل الحي',
    descEn: 'Glowing neon under-deck strip and supercharged speed',
    cost: 1400,
    speed: 13.4,
    bodyColor: '#a855f7',
    trimColor: '#1e1b4b',
    rimColor: '#38bdf8',
    glowColor: '#ec4899',
  },
  {
    id: 'golden_king',
    nameAr: 'سكوتر الملك الذهبي VIP',
    nameEn: 'Golden King VIP',
    descAr: 'أسرع سكوتر فاخر بالحي بهيكل ذهبي لامع وإضاءة ملكية!',
    descEn: 'Fastest luxury gold-plated scooter in the entire neighborhood!',
    cost: 2000,
    speed: 15.2,
    bodyColor: '#f59e0b',
    trimColor: '#451a03',
    rimColor: '#fef08a',
    glowColor: '#fde047',
  },
];

export const SCOOTER_MAP: Record<ScooterId, ScooterSpec> = SCOOTERS.reduce(
  (acc, s) => {
    acc[s.id] = s;
    return acc;
  },
  {} as Record<ScooterId, ScooterSpec>
);

export interface DeliveryHouseSpec {
  houseId: string;
  customerNameAr: string;
  customerNameEn: string;
  areaAr: string;
  areaEn: string;
  dropoffX: number;
  dropoffZ: number;
  baseDeliveryFee: number;
}

export function getNeighborhoodDeliveryHouses(bounds: ShopBounds): DeliveryHouseSpec[] {
  return [
    {
      houseId: 'left-1',
      customerNameAr: 'بيت أبو سعد',
      customerNameEn: 'Abu Saad House',
      areaAr: 'يسار المخزن',
      areaEn: 'Left of Warehouse',
      dropoffX: bounds.storageX - 6.8,
      dropoffZ: 2.35,
      baseDeliveryFee: 28,
    },
    {
      houseId: 'left-2',
      customerNameAr: 'بيت فهد',
      customerNameEn: 'Fahad House',
      areaAr: 'الشارع الغربي',
      areaEn: 'West Street',
      dropoffX: bounds.storageX - 13.6,
      dropoffZ: 2.1,
      baseDeliveryFee: 42,
    },
    {
      houseId: 'right-1',
      customerNameAr: 'بيت أبو ناصر',
      customerNameEn: 'Abu Nasser House',
      areaAr: 'بجانب بيت النوم',
      areaEn: 'Next to Sleep House',
      dropoffX: bounds.houseX + 7.2,
      dropoffZ: 2.35,
      baseDeliveryFee: 26,
    },
    {
      houseId: 'right-2',
      customerNameAr: 'بيت طارق',
      customerNameEn: 'Tariq House',
      areaAr: 'بجانب محل السكوترات',
      areaEn: 'Next to Scooter Shop',
      dropoffX: bounds.houseX + 21.8,
      dropoffZ: 2.1,
      baseDeliveryFee: 54,
    },
    {
      houseId: 'front-1',
      customerNameAr: 'بيت أم خالد',
      customerNameEn: 'Um Khalid House',
      areaAr: 'عبر الشارع (غرب)',
      areaEn: 'Across Street (West)',
      dropoffX: -16.5,
      dropoffZ: 18.2,
      baseDeliveryFee: 46,
    },
    {
      houseId: 'front-2',
      customerNameAr: 'بيت سلمان',
      customerNameEn: 'Salman House',
      areaAr: 'عبر الشارع',
      areaEn: 'Across the Street',
      dropoffX: -8.2,
      dropoffZ: 18.2,
      baseDeliveryFee: 36,
    },
    {
      houseId: 'front-3',
      customerNameAr: 'بيت أبو راشد',
      customerNameEn: 'Abu Rashid House',
      areaAr: 'مقابل المحل تماماً',
      areaEn: 'Directly Across Shop',
      dropoffX: 0.0,
      dropoffZ: 18.2,
      baseDeliveryFee: 32,
    },
    {
      houseId: 'front-4',
      customerNameAr: 'بيت نورة',
      customerNameEn: 'Noura House',
      areaAr: 'عبر الشارع (شرق)',
      areaEn: 'Across Street (East)',
      dropoffX: 8.2,
      dropoffZ: 18.2,
      baseDeliveryFee: 38,
    },
    {
      houseId: 'front-5',
      customerNameAr: 'بيت عبدالله',
      customerNameEn: 'Abdullah House',
      areaAr: 'عبر الشارع (أقصى الشرق)',
      areaEn: 'Across Street (Far East)',
      dropoffX: 16.5,
      dropoffZ: 18.2,
      baseDeliveryFee: 48,
    },
    {
      houseId: 'back-2',
      customerNameAr: 'بيت ماجد',
      customerNameEn: 'Majed House',
      areaAr: 'الممر الخلفي (غرب)',
      areaEn: 'Back Lane (West)',
      dropoffX: -14.0,
      dropoffZ: bounds.backZ - 5.6,
      baseDeliveryFee: 52,
    },
    {
      houseId: 'back-3',
      customerNameAr: 'بيت فيصل',
      customerNameEn: 'Faisal House',
      areaAr: 'خلف المحل',
      areaEn: 'Behind the Shop',
      dropoffX: -6.8,
      dropoffZ: bounds.backZ - 5.6,
      baseDeliveryFee: 44,
    },
    {
      houseId: 'back-4',
      customerNameAr: 'بيت بدر',
      customerNameEn: 'Badr House',
      areaAr: 'خلف المحل (شرق)',
      areaEn: 'Behind Shop (East)',
      dropoffX: 6.8,
      dropoffZ: bounds.backZ - 5.6,
      baseDeliveryFee: 44,
    },
    {
      houseId: 'back-5',
      customerNameAr: 'بيت زياد',
      customerNameEn: 'Ziyad House',
      areaAr: 'الممر الخلفي (أقصى الشرق)',
      areaEn: 'Back Lane (Far East)',
      dropoffX: 14.0,
      dropoffZ: bounds.backZ - 5.6,
      baseDeliveryFee: 55,
    },
  ];
}

export interface DeliveryOrder {
  id: number;
  houseId: string;
  customerNameAr: string;
  customerNameEn: string;
  areaAr: string;
  areaEn: string;
  flavor: GumFlavorId;
  quantity: number;
  gumTotal: number;
  deliveryFee: number;
  totalReward: number;
  dropoffX: number;
  dropoffZ: number;
}

export const GUM_RANK_COST = 300;
export const GUM_RANK_PACKS_STEP = 50;

export interface GumRankSpec {
  rank: number;
  nameAr: string;
  nameEn: string;
  color: string;
  badgeBg: string;
  requiredPacksTotal: number;
}

export const GUM_RANKS: GumRankSpec[] = [
  { rank: 1, nameAr: 'بائع مبتدئ', nameEn: 'Starter Seller', color: '#94a3b8', badgeBg: '#1e293b', requiredPacksTotal: 0 },
  { rank: 2, nameAr: 'بائع نشيط', nameEn: 'Active Seller', color: '#34d399', badgeBg: '#064e3b', requiredPacksTotal: 50 },
  { rank: 3, nameAr: 'بائع ماهر', nameEn: 'Skilled Seller', color: '#2dd4bf', badgeBg: '#134e4a', requiredPacksTotal: 100 },
  { rank: 4, nameAr: 'تاجر الحي', nameEn: 'Local Merchant', color: '#38bdf8', badgeBg: '#0c4a6e', requiredPacksTotal: 150 },
  { rank: 5, nameAr: 'خبير العلك', nameEn: 'Gum Expert', color: '#60a5fa', badgeBg: '#1e3a8a', requiredPacksTotal: 200 },
  { rank: 6, nameAr: 'نجم السوق', nameEn: 'Market Star', color: '#a78bfa', badgeBg: '#4c1d95', requiredPacksTotal: 250 },
  { rank: 7, nameAr: 'بطل المبيعات', nameEn: 'Sales Champion', color: '#e879f9', badgeBg: '#701a75', requiredPacksTotal: 300 },
  { rank: 8, nameAr: 'تاجر VIP', nameEn: 'VIP Trader', color: '#fbbf24', badgeBg: '#78350f', requiredPacksTotal: 350 },
  { rank: 9, nameAr: 'إمبراطور العلك', nameEn: 'Gum Emperor', color: '#fb923c', badgeBg: '#7c2d12', requiredPacksTotal: 400 },
  { rank: 10, nameAr: 'أسطورة العلك', nameEn: 'Gum Legend', color: '#fde047', badgeBg: '#713f12', requiredPacksTotal: 450 },
  { rank: 11, nameAr: 'تاجر المجرة', nameEn: 'Galaxy Trader', color: '#e879f9', badgeBg: '#4a044e', requiredPacksTotal: 500 },
  { rank: 12, nameAr: 'سلطان النكهات', nameEn: 'Sultan of Flavors', color: '#f59e0b', badgeBg: '#451a03', requiredPacksTotal: 550 },
  { rank: 13, nameAr: 'ملك المصانع', nameEn: 'Factory King', color: '#f472b6', badgeBg: '#500724', requiredPacksTotal: 600 },
  { rank: 14, nameAr: 'إمبراطور العالم', nameEn: 'World Emperor', color: '#22d3ee', badgeBg: '#164e63', requiredPacksTotal: 650 },
  { rank: 15, nameAr: 'سيد العلك الأبدي', nameEn: 'Eternal Gum Master', color: '#fef08a', badgeBg: '#422006', requiredPacksTotal: 700 },
];

export function getFlavorsUnlockedAtRank(rank: number): GumFlavorSpec[] {
  return GUM_FLAVORS.filter((f) => f.requiredRank === rank);
}

export function getGumRankSpec(rank: number): GumRankSpec {
  const safeRank = Math.max(1, Math.floor(rank));
  const preset = GUM_RANKS[safeRank - 1];
  if (preset) return preset;
  return {
    rank: safeRank,
    nameAr: `أسطورة العلك ★${safeRank}`,
    nameEn: `Gum Legend ★${safeRank}`,
    color: '#fde047',
    badgeBg: '#713f12',
    requiredPacksTotal: (safeRank - 1) * GUM_RANK_PACKS_STEP,
  };
}

export function getNextRankRequirements(currentRank: number): {
  nextRank: number;
  cost: number;
  requiredPacksTotal: number;
  nextSpec: GumRankSpec;
} {
  const safeRank = Math.max(1, Math.floor(currentRank));
  const nextRank = safeRank + 1;
  return {
    nextRank,
    cost: GUM_RANK_COST,
    requiredPacksTotal: safeRank * GUM_RANK_PACKS_STEP,
    nextSpec: getGumRankSpec(nextRank),
  };
}

export function formatGumPlayTime(totalSeconds: number, lang: 'ar' | 'en'): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  if (lang === 'ar') {
    if (hours > 0) return `${hours} س ${mins} د ${secs} ث`;
    if (mins > 0) return `${mins} د ${secs} ث`;
    return `${secs} ث`;
  }
  if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

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
  rank: number;
  totalPlaySeconds: number;
  totalSessions: number;
  totalCustomersServed: number;
  shelves: ShelfState[];
  prices: Record<GumFlavorId, number>;
  cratesOutside: DeliveryCrateState[];
  carriedCrate: CarriedCrateState | null;
  upgrades: UpgradeId[];
  ownedScooters: ScooterId[];
  equippedScooter: ScooterId | null;
  ridingScooter: boolean;
  totalDeliveriesCompleted: number;
  nextCrateId: number;
  savedAt: number;
}

export interface GumShopHubStats {
  hasSave: boolean;
  day: number;
  money: number;
  shelvesCount: number;
  totalPacksSold: number;
  rank: number;
  totalPlaySeconds: number;
  totalSessions: number;
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
  rank: number;
  totalPlaySeconds: number;
  totalSessions: number;
  totalCustomersServed: number;
  totalDeliveriesCompleted: number;
  shelves: ShelfState[];
  prices: Record<GumFlavorId, number>;
  cratesOutsideCount: number;
  carriedCrate: CarriedCrateState | null;
  upgrades: UpgradeId[];
  ownedScooters: ScooterId[];
  equippedScooter: ScooterId | null;
  ridingScooter: boolean;
  availableDeliveries: DeliveryOrder[];
  activeDelivery: DeliveryOrder | null;
  activeDeliveryDistance: number | null;
  waitingCustomerCount: number;
  nearPrompt:
    | { kind: 'pickup_crate'; crateId: number; flavor: GumFlavorId }
    | { kind: 'checkout' }
    | { kind: 'house_door' }
    | { kind: 'bed' }
    | { kind: 'storage_door' }
    | { kind: 'scooter_shop' }
    | { kind: 'delivery_dropoff'; orderId: number }
    | null;
  lastSavedAt: number;
  notice: FloatingNotice | null;
  isOutside: boolean;
}

export const GUM_SHOP_SAVE_KEY = 'point_catcher_gum_shop_3d_save_v1';
const GUM_SHOP_SOUND_KEY = 'point_catcher_gum_shop_3d_sound_v1';

export function createDefaultPrices(): Record<GumFlavorId, number> {
  const prices = {} as Record<GumFlavorId, number>;
  for (const f of GUM_FLAVORS) {
    prices[f.id] = f.fairPrice;
  }
  return prices;
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

    const ownedScooters: ScooterId[] = Array.isArray(parsed.ownedScooters)
      ? Array.from(
          new Set(
            parsed.ownedScooters.filter(
              (s): s is ScooterId => typeof s === 'string' && s in SCOOTER_MAP
            )
          )
        )
      : [];

    const equippedScooter: ScooterId | null =
      typeof parsed.equippedScooter === 'string' &&
      ownedScooters.includes(parsed.equippedScooter as ScooterId)
        ? (parsed.equippedScooter as ScooterId)
        : (ownedScooters[ownedScooters.length - 1] ?? null);

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
      rank:
        typeof parsed.rank === 'number' && Number.isFinite(parsed.rank)
          ? Math.max(1, Math.floor(parsed.rank))
          : 1,
      totalPlaySeconds:
        typeof parsed.totalPlaySeconds === 'number' && Number.isFinite(parsed.totalPlaySeconds)
          ? Math.max(0, Math.floor(parsed.totalPlaySeconds))
          : 0,
      totalSessions:
        typeof parsed.totalSessions === 'number' && Number.isFinite(parsed.totalSessions)
          ? Math.max(0, Math.floor(parsed.totalSessions))
          : 1,
      totalCustomersServed:
        typeof parsed.totalCustomersServed === 'number' &&
        Number.isFinite(parsed.totalCustomersServed)
          ? Math.max(0, Math.floor(parsed.totalCustomersServed))
          : 0,
      totalDeliveriesCompleted:
        typeof parsed.totalDeliveriesCompleted === 'number' &&
        Number.isFinite(parsed.totalDeliveriesCompleted)
          ? Math.max(0, Math.floor(parsed.totalDeliveriesCompleted))
          : 0,
      shelves: validShelves,
      prices,
      cratesOutside,
      carriedCrate,
      upgrades: validUpgrades,
      ownedScooters,
      equippedScooter,
      ridingScooter: Boolean(parsed.ridingScooter) && equippedScooter !== null,
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
    return {
      hasSave: false,
      day: 1,
      money: 0,
      shelvesCount: 2,
      totalPacksSold: 0,
      rank: 1,
      totalPlaySeconds: 0,
      totalSessions: 0,
    };
  }
  return {
    hasSave: true,
    day: saved.day,
    money: saved.money,
    shelvesCount: saved.shelves.length,
    totalPacksSold: saved.totalPacksSold,
    rank: saved.rank,
    totalPlaySeconds: saved.totalPlaySeconds,
    totalSessions: saved.totalSessions,
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
