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
} as const;

export type TrackedGameId = keyof typeof TRACKED_GAMES;

export function worldGameId(mode: string): TrackedGameId | null {
  const id = `world-${mode}`;
  return id in TRACKED_GAMES ? (id as TrackedGameId) : null;
}

export function miniGameId(id: string | null): TrackedGameId | null {
  if (!id) return null;
  const full = `mini-${id}`;
  return full in TRACKED_GAMES ? (full as TrackedGameId) : null;
}

export function gameNameFor(id: string): string {
  return (TRACKED_GAMES as Record<string, string>)[id] ?? id;
}
