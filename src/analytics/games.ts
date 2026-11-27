// Catalog of every trackable game. IDs must stay in sync with firestore.rules.
export const TRACKED_GAMES = {
  'world-normal': 'العالم العادي',
  'world-fruit': 'عالم الفواكه',
  'world-gold': 'العالم الذهبي',
  'world-space': 'عالم الفضاء',
  'world-monster': 'مراحل الوحش',
  'mini-devil-trap': 'بوابة الشيطان 2D',
  'mini-monster-arena': 'حلبة الوحوش 3D',
  'mini-plant-merge': 'مزرعة النباتات 3D',
  'mini-shawarma-shop': 'ملك الشاورما 3D',
  'mini-desert-rally': 'سباق الصحراء 3D',
  'mini-date-catcher': 'صيد التمر 3D',
  'mini-arrow-escape': 'لغز الأسهم',
  'mini-arrow-mosaic': 'فسيفساء الأسهم',
  'mini-fruit-merge': 'دمج الفواكه',
  'mini-neon-2048': 'تحدي 2048 النيون',
  'mini-neon-snake': 'ثعبان النيون',
  'mini-apple-catch': 'أمسك التفاح وتجنب الخضار',
  'mini-brick-breaker': 'تكسير النيون',
  'mini-gum-shop': 'بياع العلك 3D',
  'mini-fruit-slash': 'سيف الفواكه 2D',
  'mini-mario-party': 'حفلة ماريو أونلاين',
  'mini-mp-coin-block-bash': 'ماريو: ضرب مربعات العملات ؟',
  'mini-mp-pipe-sprint': 'ماريو: سباق أنابيب الفطر',
  'mini-mp-star-rain-catch': 'ماريو: مطر النجوم الخارقة',
  'mini-mp-cloud-tower-climb': 'ماريو: برج السحاب العالي',
  'mini-mp-balloon-pump-burst': 'ماريو: تحدي نفخ بالون باوزر',
  'mini-mp-lava-bridge-dash': 'ماريو: بلاط الحمم المتهاوي',
  'mini-mp-whack-goomba': 'ماريو: ضرب الغومبا من الأنابيب',
  'mini-mp-mushroom-memory': 'ماريو: ذاكرة مربعات النجوم',
  'mini-mp-fireball-duel': 'ماريو: مدفع الكرات النارية',
  'mini-mp-boo-red-light': 'ماريو: شبح بو نور أحمر وأخضر',
  'mini-mp-count-toads': 'ماريو: عدّ الفطر السريع',
  'mini-mp-brick-smash-rush': 'ماريو: تكسير طوب الكنز',
  'mini-mp-bullet-bill-dodge': 'ماريو: مدافع السفينة الطائرة',
  'mini-mp-coin-magnet-maze': 'ماريو: متاهة العملات والأنابيب',
  'mini-mp-paint-tiles-party': 'ماريو: حرب تلوين البلاط',
  'mini-mp-star-rhythm-beat': 'ماريو: إيقاع النجوم الموسيقي',
  'mini-mp-cheep-fishing': 'ماريو: صيد السمك الذهبي',
  'mini-mp-penguin-ice-slide': 'ماريو: تزلج جبل الجليد',
  'mini-mp-shell-soccer-kick': 'ماريو: ركلة صدفة الكوبا',
  'mini-mp-fire-bar-jump': 'ماريو: قفز الحبل الناري',
  'mini-mp-hammer-nail-bash': 'ماريو: مطرقة النجوم الدقيقة',
  'mini-mp-mushroom-color-dash': 'ماريو: جزر الفطر الملونة',
  'mini-mp-bob-omb-pass': 'ماريو: تمرير قنبلة بوب-أومب',
  'mini-mp-sky-balloon-pop': 'ماريو: منطاد سماء العملات',
  'mini-mp-crown-castle-sprint': 'ماريو: تحطيم قلعة التاج بالصدفة',
  'mini-mp-kart-drift-3d': 'ماريو 3D: سباق كارت ماريو',
  'mini-mp-sky-island-hop-3d': 'ماريو 3D: جزر السماء العائمة',
  'mini-mp-bumper-arena-3d': 'ماريو 3D: حلبة التصادم',
  'mini-mp-star-stadium-3d': 'ماريو 3D: ملعب النجوم',
  'mini-mp-bowser-tower-3d': 'ماريو 3D: قلعة الحمم النارية',
} as const;

export type TrackedGameId = keyof typeof TRACKED_GAMES;

export function isMarioSubGameId(id: string): boolean {
  return id.startsWith('mini-mp-');
}

export const MAIN_TRACKED_GAMES: Record<string, string> = Object.fromEntries(
  Object.entries(TRACKED_GAMES).filter(([id]) => !isMarioSubGameId(id))
);

export const MARIO_SUB_TRACKED_GAMES: Record<string, string> = Object.fromEntries(
  Object.entries(TRACKED_GAMES).filter(([id]) => isMarioSubGameId(id))
);

export function worldGameId(mode: string): TrackedGameId | null {
  const id = `world-${mode}`;
  return id in TRACKED_GAMES ? (id as TrackedGameId) : null;
}

export function miniGameId(id: string | null): TrackedGameId | null {
  if (!id) return null;
  const full = `mini-${id}`;
  return full in TRACKED_GAMES ? (full as TrackedGameId) : null;
}

export function marioPartyMiniGameId(id: string | null): TrackedGameId | null {
  if (!id) return null;
  const full = `mini-mp-${id.replace(/_/g, '-')}`;
  return full in TRACKED_GAMES ? (full as TrackedGameId) : null;
}

export function gameNameFor(id: string): string {
  return (TRACKED_GAMES as Record<string, string>)[id] ?? id;
}
