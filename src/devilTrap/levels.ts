import type {
  BlockDef,
  DevilDifficulty,
  DevilLevelDef,
  SawDef,
  SpikeDef,
  TriggerDef,
} from './types';

/**
 * Logical canvas dimensions: 960 x 540 (16:9).
 * Player hitbox: 24 x 32. Door hitbox: 36 x 54.
 * Max jump height ~114px (safe step <= 85px).
 * Max horizontal jump reach ~216px + coyote (safe gaps <= 145px).
 *
 * 300 total stages: 100 Normal + 100 Hard + 100 Impossible.
 * Stages 1-5 of each tier are handcrafted iconic introductions.
 * Stages 6-100 are deterministically generated across 10 varied troll archetypes
 * with mathematically verified jump clearances and milestone boss stages every 10th level.
 */

function roomFrame(ceilingHeight = 105): BlockDef[] {
  return [
    { id: 'wall-l', x: 0, y: 0, w: 40, h: 540 },
    { id: 'wall-r', x: 920, y: 0, w: 40, h: 540 },
    { id: 'ceil', x: 0, y: 0, w: 960, h: ceilingHeight },
  ];
}

/** Deterministic PRNG (Mulberry32) so every stage 1..100 is identical every session */
function createRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

const TAUNTS_SURPRISE = [
  { ar: 'مفاجأة!', en: 'Surprise!' },
  { ar: 'خدعة!', en: 'Gotcha!' },
  { ar: 'انتبه!', en: 'Watch out!' },
  { ar: 'سقطت الأرض!', en: 'Floor gone!' },
  { ar: 'ليس بهذه السرعة!', en: 'Not so fast!' },
  { ar: 'إلى أين؟', en: 'Going somewhere?' },
];

const TAUNTS_DOOR = [
  { ar: 'هرب الباب!', en: 'Door fled!' },
  { ar: 'ليس هنا!', en: 'Over here!' },
  { ar: 'حاول مرة أخرى!', en: 'Catch me!' },
  { ar: 'خدعة أخيرة!', en: 'One last trick!' },
];

// ============================================================================
// HANDCRAFTED SIGNATURE LEVELS (Stages 1–5 per Difficulty Tier)
// ============================================================================

const HANDCRAFTED_NORMAL: DevilLevelDef[] = [
  {
    id: 'n-1',
    difficulty: 'normal',
    indexInTier: 1,
    titleAr: 'الخطوة البريئة',
    titleEn: 'Innocent Step',
    hintAr: 'الأرضية لا تثق بها أبداً… راقب تحت قدميك!',
    hintEn: 'Never trust flat ground... watch your step!',
    spawn: { x: 86, y: 368 },
    door: { x: 836, y: 346 },
    blocks: [
      ...roomFrame(),
      { id: 'f1', x: 40, y: 400, w: 290, h: 140 },
      { id: 'pit1', x: 330, y: 400, w: 105, h: 140 },
      { id: 'f2', x: 435, y: 400, w: 235, h: 140 },
      { id: 'pit2', x: 670, y: 400, w: 98, h: 140 },
      { id: 'f3', x: 768, y: 400, w: 152, h: 140 },
    ],
    spikes: [],
    triggers: [
      {
        id: 't-pit1',
        zone: { x: 278, y: 240, w: 70, h: 170 },
        taunt: { ar: 'مفاجأة!', en: 'Surprise!' },
        actions: [{ type: 'dropBlock', targetId: 'pit1' }],
      },
      {
        id: 't-pit2',
        zone: { x: 618, y: 240, w: 70, h: 170 },
        taunt: { ar: 'واحدة أخرى!', en: 'One more!' },
        actions: [{ type: 'dropBlock', targetId: 'pit2' }],
      },
    ],
  },
  {
    id: 'n-2',
    difficulty: 'normal',
    indexInTier: 2,
    titleAr: 'الحفرة المطاطية',
    titleEn: 'Elastic Pit',
    hintAr: 'الحفرة تتسع أثناء قفزك… والأشواك تختبئ أمام الباب!',
    hintEn: 'The pit widens mid-jump... and spikes hide near the door!',
    spawn: { x: 84, y: 368 },
    door: { x: 838, y: 346 },
    blocks: [
      ...roomFrame(),
      { id: 'f1', x: 40, y: 400, w: 265, h: 140 },
      { id: 'slide-floor', x: 395, y: 400, w: 175, h: 140 },
      { id: 'f2', x: 560, y: 400, w: 360, h: 140 },
    ],
    spikes: [{ id: 'sp1', x: 650, y: 378, w: 58, h: 22, dir: 'up', hidden: true }],
    triggers: [
      {
        id: 't-widen',
        zone: { x: 295, y: 200, w: 110, h: 200 },
        requireAirborne: true,
        taunt: { ar: 'اتسعت!', en: 'Wider!' },
        actions: [{ type: 'moveBlock', targetId: 'slide-floor', dx: 48, dy: 0, speed: 270 }],
      },
      {
        id: 't-sp1',
        zone: { x: 585, y: 250, w: 90, h: 160 },
        taunt: { ar: 'اقفز!', en: 'Jump!' },
        actions: [{ type: 'toggleSpike', targetId: 'sp1', show: true }],
      },
    ],
  },
  {
    id: 'n-3',
    difficulty: 'normal',
    indexInTier: 3,
    titleAr: 'السقف الساحق',
    titleEn: 'Falling Ceiling',
    hintAr: 'استدرج السقف ليهبط، ثم اقفز فوقه نحو الباب!',
    hintEn: 'Bait the ceiling slam, then hop right over it!',
    spawn: { x: 82, y: 368 },
    door: { x: 842, y: 346 },
    blocks: [
      ...roomFrame(),
      { id: 'f1', x: 40, y: 400, w: 880, h: 140 },
      { id: 'crusher', x: 685, y: 105, w: 76, h: 72 },
    ],
    spikes: [
      { id: 'sp1', x: 250, y: 378, w: 56, h: 22, dir: 'up', hidden: true },
      { id: 'sp2', x: 445, y: 378, w: 52, h: 22, dir: 'up', hidden: true },
      { id: 'sp3', x: 540, y: 378, w: 48, h: 22, dir: 'up', hidden: true },
    ],
    triggers: [
      {
        id: 't-sp1',
        zone: { x: 200, y: 250, w: 75, h: 160 },
        actions: [{ type: 'toggleSpike', targetId: 'sp1', show: true }],
      },
      {
        id: 't-sp2',
        zone: { x: 395, y: 250, w: 75, h: 160 },
        actions: [{ type: 'toggleSpike', targetId: 'sp2', show: true }],
      },
      {
        id: 't-sp3',
        zone: { x: 505, y: 250, w: 60, h: 160 },
        taunt: { ar: 'مرتين!', en: 'Twice!' },
        actions: [{ type: 'toggleSpike', targetId: 'sp3', show: true }],
      },
      {
        id: 't-crush',
        zone: { x: 655, y: 200, w: 110, h: 210 },
        taunt: { ar: 'احذر رأسك!', en: 'Watch your head!' },
        actions: [{ type: 'moveBlock', targetId: 'crusher', dx: 0, dy: 223, speed: 640 }],
      },
    ],
  },
  {
    id: 'n-4',
    difficulty: 'normal',
    indexInTier: 4,
    titleAr: 'الباب الهارب',
    titleEn: 'Runaway Door',
    hintAr: 'هل ظننت أن الباب سينتظرك بهدوء؟',
    hintEn: 'Did you really think the door would wait for you?',
    spawn: { x: 82, y: 368 },
    door: { x: 678, y: 346 },
    blocks: [
      ...roomFrame(),
      { id: 'start', x: 40, y: 400, w: 175, h: 140 },
      { id: 'c1', x: 255, y: 390, w: 92, h: 24, kind: 'crumble', crumbleDelay: 0.36 },
      { id: 'c2', x: 405, y: 380, w: 92, h: 24, kind: 'crumble', crumbleDelay: 0.36 },
      { id: 'end1', x: 545, y: 400, w: 120, h: 140 },
      { id: 'door-pit', x: 665, y: 400, w: 100, h: 140 },
      { id: 'end2', x: 765, y: 400, w: 155, h: 140 },
    ],
    spikes: [],
    triggers: [
      {
        id: 't-door-run',
        zone: { x: 605, y: 240, w: 85, h: 170 },
        taunt: { ar: 'إلى أين؟ ههه!', en: 'Not so fast!' },
        actions: [
          { type: 'moveDoor', dx: 162, dy: 0, speed: 480 },
          { type: 'dropBlock', targetId: 'door-pit' },
        ],
      },
    ],
  },
  {
    id: 'n-5',
    difficulty: 'normal',
    indexInTier: 5,
    titleAr: 'الجسر الخائن',
    titleEn: 'Traitor Bridge',
    hintAr: 'الجسر يتحرك تحتك… حافظ على قفزة منخفضة عند النهاية!',
    hintEn: 'The bridge shifts beneath you... stay low at the finish!',
    spawn: { x: 80, y: 368 },
    door: { x: 844, y: 346 },
    blocks: [
      ...roomFrame(),
      { id: 'start', x: 40, y: 400, w: 150, h: 140 },
      { id: 'b1', x: 225, y: 400, w: 112, h: 28 },
      { id: 'b2', x: 392, y: 400, w: 112, h: 28 },
      { id: 'b3', x: 558, y: 400, w: 116, h: 28 },
      { id: 'end', x: 745, y: 400, w: 175, h: 140 },
      { id: 'ceil-bar', x: 745, y: 105, w: 80, h: 165 },
    ],
    spikes: [{ id: 'ceil-sp', x: 750, y: 270, w: 70, h: 20, dir: 'down', hidden: true }],
    triggers: [
      {
        id: 't-shift',
        zone: { x: 405, y: 250, w: 90, h: 160 },
        taunt: { ar: 'تباعدت المنصة!', en: 'Gap widened!' },
        actions: [
          { type: 'moveBlock', targetId: 'b3', dx: 52, dy: 0, speed: 290 },
          { type: 'dropBlock', targetId: 'b1' },
        ],
      },
      {
        id: 't-ceil-sp',
        zone: { x: 645, y: 240, w: 115, h: 170 },
        taunt: { ar: 'انخفض!', en: 'Stay low!' },
        actions: [{ type: 'toggleSpike', targetId: 'ceil-sp', show: true }],
      },
    ],
  },
];

const HANDCRAFTED_HARD: DevilLevelDef[] = [
  {
    id: 'h-1',
    difficulty: 'hard',
    indexInTier: 1,
    titleAr: 'الفخ المزدوج',
    titleEn: 'Double Fakeout',
    hintAr: 'الأشواك تظهر في مكان الهبوط تماماً… مدّد قفزتك الأولى!',
    hintEn: 'Spikes erupt right where you land... stretch your jump!',
    spawn: { x: 80, y: 368 },
    door: { x: 848, y: 346 },
    blocks: [
      ...roomFrame(),
      { id: 'f1', x: 40, y: 400, w: 195, h: 140 },
      { id: 'f2', x: 325, y: 400, w: 225, h: 140 },
      { id: 'pit-mid', x: 550, y: 400, w: 105, h: 140 },
      { id: 'f3', x: 655, y: 400, w: 265, h: 140 },
      { id: 'low-ceil', x: 560, y: 105, w: 85, h: 130 },
    ],
    spikes: [
      { id: 'land-sp', x: 332, y: 378, w: 50, h: 22, dir: 'up', hidden: true },
      { id: 'ceil-sp', x: 565, y: 235, w: 75, h: 20, dir: 'down', hidden: true },
      { id: 'door-sp', x: 772, y: 378, w: 46, h: 22, dir: 'up', hidden: true },
    ],
    triggers: [
      {
        id: 't-land',
        zone: { x: 245, y: 210, w: 95, h: 200 },
        requireAirborne: true,
        taunt: { ar: 'هبوط خطر!', en: 'Hot landing!' },
        actions: [{ type: 'toggleSpike', targetId: 'land-sp', show: true }],
      },
      {
        id: 't-mid',
        zone: { x: 500, y: 240, w: 70, h: 170 },
        actions: [
          { type: 'dropBlock', targetId: 'pit-mid' },
          { type: 'toggleSpike', targetId: 'ceil-sp', show: true },
        ],
      },
      {
        id: 't-door',
        zone: { x: 722, y: 240, w: 65, h: 170 },
        taunt: { ar: 'آخر لحظة!', en: 'Last second!' },
        actions: [{ type: 'toggleSpike', targetId: 'door-sp', show: true }],
      },
    ],
  },
  {
    id: 'h-2',
    difficulty: 'hard',
    indexInTier: 2,
    titleAr: 'المنشار المطارد',
    titleEn: 'Chasing Saw',
    hintAr: 'لا تتوقف! اصعد الدرج بسرعة وتفادَ المنشار القادم من الأعلى.',
    hintEn: 'Keep moving! Climb fast and dodge the ambush saw.',
    spawn: { x: 96, y: 368 },
    door: { x: 854, y: 226 },
    blocks: [
      ...roomFrame(95),
      { id: 'f1', x: 40, y: 400, w: 240, h: 140 },
      { id: 's1', x: 340, y: 340, w: 170, h: 26 },
      { id: 's2-a', x: 575, y: 280, w: 65, h: 26 },
      { id: 's2-b', x: 640, y: 280, w: 92, h: 26, kind: 'crumble', crumbleDelay: 0.34 },
      { id: 'goal', x: 792, y: 280, w: 128, h: 260 },
    ],
    spikes: [],
    saws: [
      { id: 'saw-chase', x: 56, y: 374, r: 24, hidden: true },
      { id: 'saw-drop', x: 472, y: 122, r: 22, hidden: true },
    ],
    triggers: [
      {
        id: 't-chase',
        zone: { x: 155, y: 240, w: 70, h: 170 },
        taunt: { ar: 'اهرب!', en: 'Run!' },
        actions: [{ type: 'moveSaw', targetId: 'saw-chase', dx: 215, dy: 0, speed: 225, show: true }],
      },
      {
        id: 't-drop',
        zone: { x: 345, y: 180, w: 90, h: 180 },
        taunt: { ar: 'من الأعلى!', en: 'From above!' },
        actions: [{ type: 'moveSaw', targetId: 'saw-drop', dx: 0, dy: 194, speed: 370, show: true }],
      },
    ],
  },
  {
    id: 'h-3',
    difficulty: 'hard',
    indexInTier: 3,
    titleAr: 'الباب الكاذب',
    titleEn: 'The Fake Door',
    hintAr: 'الباب السفلي فخ! اصعد للممر العلوي للوصول للباب الحقيقي.',
    hintEn: 'The bottom door is a trap! Climb up to reach the real exit.',
    spawn: { x: 80, y: 368 },
    door: { x: 132, y: 161 },
    fakeDoors: [{ id: 'fake-1', x: 822, y: 346 }],
    blocks: [
      ...roomFrame(92),
      { id: 'f1', x: 40, y: 400, w: 430, h: 140 },
      { id: 'pit1', x: 470, y: 400, w: 112, h: 140 },
      { id: 'f2', x: 582, y: 400, w: 338, h: 140 },
      { id: 'pad', x: 678, y: 330, w: 66, h: 20, kind: 'bouncy' },
      { id: 'up1', x: 525, y: 245, w: 110, h: 22 },
      { id: 'up2', x: 355, y: 215, w: 115, h: 22 },
      { id: 'up3', x: 96, y: 215, w: 205, h: 22 },
    ],
    spikes: [
      { id: 'sp-low', x: 270, y: 378, w: 50, h: 22, dir: 'up', hidden: true },
      { id: 'sp-up', x: 232, y: 195, w: 42, h: 20, dir: 'up', hidden: true },
    ],
    triggers: [
      {
        id: 't-low-sp',
        zone: { x: 225, y: 250, w: 65, h: 160 },
        actions: [{ type: 'toggleSpike', targetId: 'sp-low', show: true }],
      },
      {
        id: 't-pit1',
        zone: { x: 425, y: 250, w: 65, h: 160 },
        actions: [{ type: 'dropBlock', targetId: 'pit1' }],
      },
      {
        id: 't-up-sp',
        zone: { x: 280, y: 110, w: 65, h: 120 },
        taunt: { ar: 'ليس بهذه السهولة!', en: 'Not so easy!' },
        actions: [{ type: 'toggleSpike', targetId: 'sp-up', show: true }],
      },
    ],
  },
  {
    id: 'h-4',
    difficulty: 'hard',
    indexInTier: 4,
    titleAr: 'أحجار الدومينو',
    titleEn: 'Domino Stones',
    hintAr: 'المنصات تنهار فوراً والمنصة الثالثة تهرب للأمام… حافظ على إيقاعك!',
    hintEn: 'Platforms crumble fast and the 3rd slides away — keep your rhythm!',
    spawn: { x: 82, y: 368 },
    door: { x: 862, y: 281 },
    blocks: [
      ...roomFrame(95),
      { id: 'start', x: 40, y: 400, w: 135, h: 140 },
      { id: 'p1', x: 215, y: 385, w: 82, h: 24, kind: 'crumble', crumbleDelay: 0.3 },
      { id: 'p2', x: 350, y: 360, w: 84, h: 24, kind: 'crumble', crumbleDelay: 0.28 },
      { id: 'p3', x: 488, y: 355, w: 88, h: 24, kind: 'crumble', crumbleDelay: 0.34 },
      { id: 'p4', x: 668, y: 335, w: 84, h: 24, kind: 'crumble', crumbleDelay: 0.26 },
      { id: 'end', x: 812, y: 335, w: 108, h: 205 },
    ],
    spikes: [{ id: 'lip-sp', x: 814, y: 315, w: 26, h: 20, dir: 'up', hidden: true }],
    triggers: [
      {
        id: 't-p3',
        zone: { x: 355, y: 220, w: 75, h: 155 },
        taunt: { ar: 'تزحزحت!', en: 'Shifted!' },
        actions: [{ type: 'moveBlock', targetId: 'p3', dx: 46, dy: 0, speed: 340 }],
      },
      {
        id: 't-lip',
        zone: { x: 715, y: 180, w: 90, h: 170 },
        taunt: { ar: 'اقفز أبعد!', en: 'Jump further!' },
        actions: [{ type: 'toggleSpike', targetId: 'lip-sp', show: true }],
      },
    ],
  },
  {
    id: 'h-5',
    difficulty: 'hard',
    indexInTier: 5,
    titleAr: 'العقل المقلوب',
    titleEn: 'Backwards Brain',
    hintAr: 'في المنتصف تنعكس أزرار اليمين واليسار… ثم تعود فجأة قبل النهاية!',
    hintEn: 'Left and Right invert mid-room... then snap back right before the end!',
    spawn: { x: 80, y: 368 },
    door: { x: 854, y: 346 },
    blocks: [
      ...roomFrame(),
      { id: 'f1', x: 40, y: 400, w: 225, h: 140 },
      { id: 'f2', x: 375, y: 400, w: 200, h: 140 },
      { id: 'f3', x: 690, y: 400, w: 230, h: 140 },
    ],
    spikes: [
      { id: 'sp-mid', x: 462, y: 378, w: 46, h: 22, dir: 'up', hidden: true },
      { id: 'sp-end', x: 774, y: 378, w: 44, h: 22, dir: 'up', hidden: true },
    ],
    triggers: [
      {
        id: 't-rev-on',
        zone: { x: 392, y: 230, w: 65, h: 180 },
        taunt: { ar: 'تحكم مقلوب!', en: 'Controls Reversed!' },
        actions: [
          { type: 'reverseControls', active: true },
          { type: 'toggleSpike', targetId: 'sp-mid', show: true },
        ],
      },
      {
        id: 't-rev-off',
        zone: { x: 710, y: 230, w: 65, h: 180 },
        taunt: { ar: 'عاد طبيعياً!', en: 'Back to normal!' },
        actions: [
          { type: 'reverseControls', active: false },
          { type: 'toggleSpike', targetId: 'sp-end', show: true },
        ],
      },
    ],
  },
];

const HANDCRAFTED_IMPOSSIBLE: DevilLevelDef[] = [
  {
    id: 'i-1',
    difficulty: 'impossible',
    indexInTier: 1,
    titleAr: 'الخدعة الثلاثية',
    titleEn: 'Triple Betrayal',
    hintAr: 'حافة تختفي، منشار مباغت، وباب يهرب في آخر شبر!',
    hintEn: 'Vanishing ledge, ambush saw, and a door that bolts at the last inch!',
    spawn: { x: 78, y: 368 },
    door: { x: 814, y: 346 },
    blocks: [
      ...roomFrame(98),
      { id: 's-a', x: 40, y: 400, w: 125, h: 140 },
      { id: 's-drop', x: 165, y: 400, w: 55, h: 140 },
      { id: 'm1', x: 278, y: 400, w: 170, h: 140 },
      { id: 'm2-a', x: 525, y: 400, w: 80, h: 140 },
      { id: 'm2-c', x: 605, y: 400, w: 72, h: 24, kind: 'crumble', crumbleDelay: 0.24 },
      { id: 'e-a', x: 752, y: 400, w: 46, h: 140 },
      { id: 'e-pit', x: 798, y: 400, w: 62, h: 140 },
      { id: 'e-b', x: 860, y: 400, w: 60, h: 140 },
      { id: 'low-c', x: 540, y: 98, w: 82, h: 145 },
    ],
    spikes: [{ id: 'ceil-s', x: 545, y: 243, w: 72, h: 20, dir: 'down', hidden: true }],
    saws: [{ id: 'ambush-saw', x: 448, y: 376, r: 22, hidden: true }],
    triggers: [
      {
        id: 't-sdrop',
        zone: { x: 122, y: 240, w: 60, h: 170 },
        taunt: { ar: 'اختفت الحافة!', en: 'Ledge gone!' },
        actions: [{ type: 'dropBlock', targetId: 's-drop' }],
      },
      {
        id: 't-saw',
        zone: { x: 292, y: 240, w: 65, h: 170 },
        taunt: { ar: 'اقفز فوقه!', en: 'Hop it!' },
        actions: [{ type: 'moveSaw', targetId: 'ambush-saw', dx: -210, dy: 0, speed: 320, show: true }],
      },
      {
        id: 't-ceil',
        zone: { x: 495, y: 230, w: 80, h: 180 },
        actions: [{ type: 'toggleSpike', targetId: 'ceil-s', show: true }],
      },
      {
        id: 't-door',
        zone: { x: 742, y: 230, w: 65, h: 180 },
        taunt: { ar: 'ليس هنا!', en: 'Nope!' },
        actions: [
          { type: 'moveDoor', dx: 54, dy: 0, speed: 460 },
          { type: 'dropBlock', targetId: 'e-pit' },
        ],
      },
    ],
  },
  {
    id: 'i-2',
    difficulty: 'impossible',
    indexInTier: 2,
    titleAr: 'جاذبية الشيطان',
    titleEn: "Devil's Gravity",
    hintAr: 'ستنقلب الجاذبية للسقف! اقفز للأسفل لتعبر فجوة السقف ثم استعد للهبوط.',
    hintEn: 'Gravity flips to the ceiling! Jump downward across the ceiling gap.',
    spawn: { x: 80, y: 388 },
    door: { x: 856, y: 366 },
    blocks: [
      { id: 'wall-l', x: 0, y: 0, w: 40, h: 540 },
      { id: 'wall-r', x: 920, y: 0, w: 40, h: 540 },
      { id: 'floor-l', x: 40, y: 420, w: 260, h: 120 },
      { id: 'floor-r', x: 615, y: 420, w: 305, h: 120 },
      { id: 'ceil-l', x: 40, y: 0, w: 315, h: 112 },
      { id: 'ceil-r', x: 465, y: 0, w: 455, h: 112 },
    ],
    spikes: [
      { id: 'c-sp', x: 525, y: 112, w: 50, h: 22, dir: 'down', hidden: true },
      { id: 'f-sp', x: 742, y: 398, w: 48, h: 22, dir: 'up', hidden: true },
    ],
    triggers: [
      {
        id: 't-flip-up',
        zone: { x: 220, y: 260, w: 65, h: 165 },
        taunt: { ar: 'انقلبت الجاذبية!', en: 'Gravity Flipped!' },
        actions: [{ type: 'flipGravity', dir: -1 }],
      },
      {
        id: 't-csp',
        zone: { x: 478, y: 112, w: 60, h: 140 },
        taunt: { ar: 'أشواك السقف!', en: 'Ceiling spikes!' },
        actions: [{ type: 'toggleSpike', targetId: 'c-sp', show: true }],
      },
      {
        id: 't-flip-down',
        zone: { x: 635, y: 112, w: 60, h: 140 },
        taunt: { ar: 'عودة للأرض!', en: 'Back down!' },
        actions: [{ type: 'flipGravity', dir: 1 }],
      },
      {
        id: 't-fsp',
        zone: { x: 695, y: 270, w: 60, h: 160 },
        actions: [{ type: 'toggleSpike', targetId: 'f-sp', show: true }],
      },
    ],
  },
  {
    id: 'i-3',
    difficulty: 'impossible',
    indexInTier: 3,
    titleAr: 'المكبس الساحق',
    titleEn: 'Crushing Press',
    hintAr: 'استدرج كل مكبس ليسقط، اقفز فوقه، واحذر المنشار فوق المكبس الثالث!',
    hintEn: 'Bait each crusher to slam down, hop over, and dodge the 3rd saw!',
    spawn: { x: 78, y: 368 },
    door: { x: 858, y: 346 },
    blocks: [
      ...roomFrame(100),
      { id: 'floor', x: 40, y: 400, w: 880, h: 140 },
      { id: 'p1', x: 205, y: 100, w: 96, h: 74 },
      { id: 'p2', x: 425, y: 100, w: 96, h: 74 },
      { id: 'p3', x: 645, y: 100, w: 96, h: 74 },
    ],
    spikes: [
      { id: 'sp-mid', x: 342, y: 378, w: 44, h: 22, dir: 'up', hidden: true },
      { id: 'sp-end', x: 786, y: 378, w: 42, h: 22, dir: 'up', hidden: true },
    ],
    saws: [{ id: 'saw-top', x: 840, y: 300, r: 21, hidden: true }],
    triggers: [
      {
        id: 't-p1',
        zone: { x: 175, y: 200, w: 120, h: 210 },
        taunt: { ar: 'مكبس ١!', en: 'Press 1!' },
        actions: [{ type: 'moveBlock', targetId: 'p1', dx: 0, dy: 226, speed: 660 }],
      },
      {
        id: 't-p2',
        zone: { x: 392, y: 200, w: 120, h: 210 },
        taunt: { ar: 'مكبس ٢!', en: 'Press 2!' },
        actions: [
          { type: 'moveBlock', targetId: 'p2', dx: 0, dy: 226, speed: 680 },
          { type: 'toggleSpike', targetId: 'sp-mid', show: true },
        ],
      },
      {
        id: 't-p3',
        zone: { x: 612, y: 200, w: 120, h: 210 },
        taunt: { ar: 'مكبس ٣ + منشار!', en: 'Press 3 + Saw!' },
        actions: [
          { type: 'moveBlock', targetId: 'p3', dx: 0, dy: 226, speed: 700 },
          { type: 'moveSaw', targetId: 'saw-top', dx: -250, dy: 0, speed: 290, show: true },
        ],
      },
      {
        id: 't-end',
        zone: { x: 748, y: 210, w: 50, h: 200 },
        actions: [{ type: 'toggleSpike', targetId: 'sp-end', show: true }],
      },
    ],
  },
  {
    id: 'i-4',
    difficulty: 'impossible',
    indexInTier: 4,
    titleAr: 'المنصات الشبحية',
    titleEn: 'Ghost Platforms',
    hintAr: 'المنصة الثانية وهمية… لكن تحتها منصة خفية ستنقذك في اللحظة الأخيرة!',
    hintEn: 'The 2nd ledge is a mirage... a hidden block beneath will catch you!',
    spawn: { x: 78, y: 368 },
    door: { x: 816, y: 301 },
    blocks: [
      ...roomFrame(95),
      { id: 'start', x: 40, y: 400, w: 145, h: 140 },
      { id: 'r1', x: 245, y: 380, w: 96, h: 24, kind: 'crumble', crumbleDelay: 0.28 },
      { id: 'fake-mid', x: 410, y: 345, w: 88, h: 22, kind: 'fakeSolid' },
      { id: 'ghost-real', x: 406, y: 412, w: 100, h: 24, kind: 'invisible' },
      { id: 'r3', x: 572, y: 355, w: 96, h: 24 },
      { id: 'goal-a', x: 740, y: 355, w: 44, h: 185 },
      { id: 'goal-c', x: 784, y: 355, w: 62, h: 24, kind: 'crumble', crumbleDelay: 0.2 },
      { id: 'goal-b', x: 846, y: 355, w: 74, h: 185 },
    ],
    spikes: [],
    saws: [{ id: 'boom-saw', x: 755, y: 332, r: 20, hidden: true }],
    triggers: [
      {
        id: 't-reveal',
        zone: { x: 355, y: 240, w: 120, h: 210 },
        taunt: { ar: 'منصة وهمية!', en: 'Fake ledge!' },
        actions: [{ type: 'revealBlock', targetId: 'ghost-real' }],
      },
      {
        id: 't-boom',
        zone: { x: 520, y: 200, w: 80, h: 190 },
        taunt: { ar: 'احذر المنشار!', en: 'Incoming saw!' },
        actions: [{ type: 'moveSaw', targetId: 'boom-saw', dx: -210, dy: 0, speed: 300, show: true }],
      },
      {
        id: 't-door',
        zone: { x: 735, y: 200, w: 65, h: 180 },
        taunt: { ar: 'هرب الباب!', en: 'Door fled!' },
        actions: [{ type: 'moveDoor', dx: 52, dy: 0, speed: 440 }],
      },
    ],
  },
  {
    id: 'i-5',
    difficulty: 'impossible',
    indexInTier: 5,
    titleAr: 'عرش الشيطان',
    titleEn: "The Devil's Throne",
    hintAr: 'حافة تختفي، جاذبية مقلوبة، منشار علوي، وهروب الباب في آخر لحظة!',
    hintEn: 'Vanishing ledge, gravity flip, ceiling saw, and a fleeing door!',
    spawn: { x: 76, y: 378 },
    door: { x: 802, y: 336 },
    blocks: [
      { id: 'wall-l', x: 0, y: 0, w: 40, h: 540 },
      { id: 'wall-r', x: 920, y: 0, w: 40, h: 540 },
      { id: 'ceil', x: 0, y: 0, w: 960, h: 108 },
      { id: 'st-a', x: 40, y: 410, w: 105, h: 130 },
      { id: 'st-drop', x: 145, y: 410, w: 55, h: 130 },
      { id: 'mid-f', x: 255, y: 410, w: 165, h: 130 },
      { id: 'catch-c', x: 585, y: 410, w: 112, h: 24, kind: 'crumble', crumbleDelay: 0.34 },
      { id: 'throne', x: 766, y: 390, w: 154, h: 150 },
    ],
    spikes: [
      { id: 'sp-1', x: 282, y: 388, w: 44, h: 22, dir: 'up', hidden: true },
      { id: 'sp-end', x: 800, y: 368, w: 42, h: 22, dir: 'up', hidden: true },
    ],
    saws: [{ id: 'ceil-saw', x: 640, y: 132, r: 22, hidden: true }],
    triggers: [
      {
        id: 't-lip',
        zone: { x: 108, y: 250, w: 55, h: 170 },
        actions: [{ type: 'dropBlock', targetId: 'st-drop' }],
      },
      {
        id: 't-sp1',
        zone: { x: 242, y: 250, w: 65, h: 170 },
        actions: [{ type: 'toggleSpike', targetId: 'sp-1', show: true }],
      },
      {
        id: 't-g-up',
        zone: { x: 365, y: 260, w: 65, h: 165 },
        taunt: { ar: 'للسقف!', en: 'To the ceiling!' },
        actions: [
          { type: 'flipGravity', dir: -1 },
          { type: 'moveSaw', targetId: 'ceil-saw', dx: -255, dy: 0, speed: 245, show: true },
        ],
      },
      {
        id: 't-g-down',
        zone: { x: 602, y: 108, w: 60, h: 150 },
        taunt: { ar: 'هبوط!', en: 'Drop!' },
        actions: [{ type: 'flipGravity', dir: 1 }],
      },
      {
        id: 't-final-door',
        zone: { x: 752, y: 220, w: 60, h: 185 },
        taunt: { ar: 'خدعة أخيرة!', en: 'One last trick!' },
        actions: [
          { type: 'moveDoor', dx: 66, dy: 0, speed: 460 },
          { type: 'toggleSpike', targetId: 'sp-end', show: true },
        ],
      },
    ],
  },
];

// ============================================================================
// PROCEDURAL ARCHETYPE GENERATORS (Stages 6–100 per Difficulty Tier)
// All gaps <= 142px, step-ups <= 80px, crushers <= 74px => 100% beatable!
// ============================================================================

function tierPrefix(diff: DevilDifficulty): string {
  return diff === 'normal' ? 'n' : diff === 'hard' ? 'h' : 'i';
}

function tierFactor(diff: DevilDifficulty, index: number): number {
  // Progress 0..1 within the 100 stages of this tier
  const prog = Math.min(1, Math.max(0, (index - 5) / 95));
  if (diff === 'normal') return prog * 0.45;
  if (diff === 'hard') return 0.35 + prog * 0.45;
  return 0.65 + prog * 0.35;
}

function buildTrapdoorCorridor(
  rng: () => number,
  diff: DevilDifficulty,
  index: number
): DevilLevelDef {
  const f = tierFactor(diff, index);
  const pitCount = diff === 'normal' ? 2 : 3;
  const blocks: BlockDef[] = [...roomFrame()];
  const spikes: SpikeDef[] = [];
  const triggers: TriggerDef[] = [];

  const pitWBase = Math.round(86 + f * 28); // 86..114px
  const spacing = pitCount === 2 ? 275 : 210;
  let cursor = 40;
  const firstPitX = randInt(rng, 200, 245);

  for (let i = 0; i < pitCount; i += 1) {
    const pitX = i === 0 ? firstPitX : Math.min(720, cursor + randInt(rng, spacing - 35, spacing - 10));
    const pitW = Math.min(118, pitWBase + randInt(rng, -6, 8));

    // Solid runway before pit
    blocks.push({ id: `f-${i}`, x: cursor, y: 400, w: pitX - cursor, h: 140 });
    // Dropping trapdoor
    blocks.push({ id: `pit-${i}`, x: pitX, y: 400, w: pitW, h: 140 });

    const taunt = TAUNTS_SURPRISE[randInt(rng, 0, TAUNTS_SURPRISE.length - 1)];
    triggers.push({
      id: `t-pit-${i}`,
      zone: { x: pitX - 48, y: 240, w: 68, h: 170 },
      taunt: i === 0 ? taunt : undefined,
      actions: [{ type: 'dropBlock', targetId: `pit-${i}` }],
    });

    // Optional ambush floor spike on solid segment after first pit
    if (i === 1 && pitX - cursor >= 140 && rng() < 0.75) {
      const spW = randInt(rng, 38, 48);
      const spX = cursor + Math.floor((pitX - cursor - spW) / 2);
      spikes.push({ id: `sp-${i}`, x: spX, y: 378, w: spW, h: 22, dir: 'up', hidden: true });
      triggers.push({
        id: `t-sp-${i}`,
        zone: { x: spX - 55, y: 240, w: 72, h: 170 },
        actions: [{ type: 'toggleSpike', targetId: `sp-${i}`, show: true }],
      });
    }

    cursor = pitX + pitW;
  }

  // Final ledge
  blocks.push({ id: 'f-end', x: cursor, y: 400, w: 920 - cursor, h: 140 });

  const runawayDoor = rng() < 0.45 + f * 0.35 && 920 - cursor >= 140;
  let doorX = 846;
  if (runawayDoor) {
    doorX = Math.max(cursor + 32, 765);
    const shift = Math.min(95, 862 - doorX);
    if (shift >= 40) {
      const spX = doorX + 6;
      spikes.push({ id: 'sp-door', x: spX, y: 378, w: 36, h: 22, dir: 'up', hidden: true });
      triggers.push({
        id: 't-door-flee',
        zone: { x: doorX - 52, y: 230, w: 70, h: 180 },
        taunt: TAUNTS_DOOR[randInt(rng, 0, TAUNTS_DOOR.length - 1)],
        actions: [
          { type: 'moveDoor', dx: shift, dy: 0, speed: 440 + Math.round(f * 140) },
          { type: 'toggleSpike', targetId: 'sp-door', show: true },
        ],
      });
    } else {
      doorX = 846;
    }
  }

  return {
    id: `${tierPrefix(diff)}-${index}`,
    difficulty: diff,
    indexInTier: index,
    titleAr: `ممر الفخاخ #${index}`,
    titleEn: `Trapdoor Alley #${index}`,
    hintAr: 'احذر الحفر المخفية تحت الأرضية وراقب الباب عند النهاية!',
    hintEn: 'Watch out for collapsing floor panels and a tricky exit door!',
    spawn: { x: 80, y: 368 },
    door: { x: doorX, y: 346 },
    blocks,
    spikes,
    triggers,
  };
}

function buildExpandingPitRoom(
  rng: () => number,
  diff: DevilDifficulty,
  index: number
): DevilLevelDef {
  const f = tierFactor(diff, index);
  const blocks: BlockDef[] = [...roomFrame()];
  const spikes: SpikeDef[] = [];
  const triggers: TriggerDef[] = [];

  const gap1 = Math.round(78 + f * 18); // base gap
  const slide1 = Math.round(30 + f * 20); // expands to <= 144px
  const p1End = randInt(rng, 225, 275);
  const midStart = p1End + gap1;
  const midW = randInt(rng, 210, 245);
  const gap2 = Math.round(86 + f * 26);
  const endStart = Math.min(725, midStart + midW + gap2);

  blocks.push({ id: 'f1', x: 40, y: 400, w: p1End - 40, h: 140 });
  blocks.push({ id: 'slide-mid', x: midStart, y: 400, w: midW, h: 140 });
  blocks.push({ id: 'f-end', x: endStart, y: 400, w: 920 - endStart, h: 140 });

  triggers.push({
    id: 't-expand',
    zone: { x: p1End - 8, y: 200, w: gap1 + 25, h: 205 },
    requireAirborne: true,
    taunt: { ar: 'اتسعت الحفرة!', en: 'Gap expanded!' },
    actions: [{ type: 'moveBlock', targetId: 'slide-mid', dx: slide1, dy: 0, speed: 240 + Math.round(f * 110) }],
  });

  // Low ceiling hazard over second gap
  const ceilX = midStart + midW - 10;
  blocks.push({ id: 'low-c', x: ceilX, y: 105, w: 86, h: 135 });
  spikes.push({ id: 'c-sp', x: ceilX + 6, y: 240, w: 74, h: 20, dir: 'down', hidden: true });
  triggers.push({
    id: 't-csp',
    zone: { x: ceilX - 45, y: 220, w: 115, h: 190 },
    actions: [{ type: 'toggleSpike', targetId: 'c-sp', show: true }],
  });

  // Landing ambush spike on final ledge if space allows
  if (920 - endStart >= 175) {
    const spX = endStart + randInt(rng, 32, 65);
    spikes.push({ id: 'end-sp', x: spX, y: 378, w: 42, h: 22, dir: 'up', hidden: true });
    triggers.push({
      id: 't-end-sp',
      zone: { x: spX - 58, y: 230, w: 72, h: 180 },
      taunt: { ar: 'اقفز!', en: 'Hop!' },
      actions: [{ type: 'toggleSpike', targetId: 'end-sp', show: true }],
    });
  }

  return {
    id: `${tierPrefix(diff)}-${index}`,
    difficulty: diff,
    indexInTier: index,
    titleAr: `الفجوة المتمددة #${index}`,
    titleEn: `Elastic Abyss #${index}`,
    hintAr: 'المنصة الوسطى تتراجع أثناء قفزتك، وحافظ على قفزة منخفضة عند السقف!',
    hintEn: 'The middle floor shifts mid-jump — stay low under the ceiling spikes!',
    spawn: { x: 80, y: 368 },
    door: { x: 850, y: 346 },
    blocks,
    spikes,
    triggers,
  };
}

function buildCrusherGauntlet(
  rng: () => number,
  diff: DevilDifficulty,
  index: number
): DevilLevelDef {
  const f = tierFactor(diff, index);
  const count = diff === 'normal' ? 2 : 3;
  const blocks: BlockDef[] = [...roomFrame(100), { id: 'floor', x: 40, y: 400, w: 880, h: 140 }];
  const spikes: SpikeDef[] = [];
  const saws: SawDef[] = [];
  const triggers: TriggerDef[] = [];

  const positions = count === 2 ? [290, 565] : [205, 425, 645];
  const pH = randInt(rng, 68, 74); // Always <= 74px, super clearable hop
  const dropDist = 400 - 100 - pH;

  positions.forEach((baseX, idx) => {
    const px = baseX + randInt(rng, -15, 15);
    const pw = randInt(rng, 82, 96);
    blocks.push({ id: `p-${idx}`, x: px, y: 100, w: pw, h: pH });

    const actions: TriggerDef['actions'] = [
      { type: 'moveBlock', targetId: `p-${idx}`, dx: 0, dy: dropDist, speed: Math.round(580 + f * 150) },
    ];

    if (idx === 1 && count === 3) {
      const spX = px - 72;
      spikes.push({ id: 'sp-between', x: spX, y: 378, w: 40, h: 22, dir: 'up', hidden: true });
      actions.push({ type: 'toggleSpike', targetId: 'sp-between', show: true });
    }

    if (idx === positions.length - 1 && diff !== 'normal' && rng() < 0.75) {
      saws.push({ id: 'top-saw', x: 850, y: 302, r: 20, hidden: true });
      actions.push({
        type: 'moveSaw',
        targetId: 'top-saw',
        dx: -245,
        dy: 0,
        speed: Math.round(255 + f * 85),
        show: true,
      });
    }

    triggers.push({
      id: `t-p-${idx}`,
      zone: { x: px - 34, y: 190, w: pw + 40, h: 215 },
      taunt: idx === 0 ? { ar: 'مكبس ساحق!', en: 'Incoming press!' } : undefined,
      actions,
    });
  });

  if (diff === 'impossible' || rng() < 0.45) {
    spikes.push({ id: 'sp-fin', x: 785, y: 378, w: 40, h: 22, dir: 'up', hidden: true });
    triggers.push({
      id: 't-fin',
      zone: { x: 742, y: 210, w: 58, h: 200 },
      actions: [{ type: 'toggleSpike', targetId: 'sp-fin', show: true }],
    });
  }

  return {
    id: `${tierPrefix(diff)}-${index}`,
    difficulty: diff,
    indexInTier: index,
    titleAr: `المكابس الساحقة #${index}`,
    titleEn: `Crusher Press #${index}`,
    hintAr: 'اقترب لتسقط المكابس السقفية ثم تراجع واقفز فوقها بذكاء!',
    hintEn: 'Bait each ceiling piston to slam down, step back, then hop right over it!',
    spawn: { x: 78, y: 368 },
    door: { x: 856, y: 346 },
    blocks,
    spikes,
    saws: saws.length ? saws : undefined,
    triggers,
  };
}

function buildDominoStones(
  rng: () => number,
  diff: DevilDifficulty,
  index: number
): DevilLevelDef {
  const f = tierFactor(diff, index);
  const blocks: BlockDef[] = [...roomFrame(95), { id: 'start', x: 40, y: 400, w: 132, h: 140 }];
  const spikes: SpikeDef[] = [];
  const triggers: TriggerDef[] = [];

  const delay = Number(Math.max(0.21, 0.39 - f * 0.16).toFixed(2));
  const y1 = randInt(rng, 372, 395);
  const y2 = randInt(rng, 342, 370);
  const y3 = randInt(rng, 332, 362);
  const y4 = randInt(rng, 322, 355);

  blocks.push({ id: 's1', x: 212, y: y1, w: 84, h: 24, kind: 'crumble', crumbleDelay: delay });
  blocks.push({ id: 's2', x: 346, y: y2, w: 84, h: 24, kind: 'crumble', crumbleDelay: delay });
  blocks.push({ id: 's3', x: 482, y: y3, w: 88, h: 24, kind: 'crumble', crumbleDelay: delay + 0.04 });
  blocks.push({ id: 's4', x: 662, y: y4, w: 84, h: 24, kind: 'crumble', crumbleDelay: delay });
  blocks.push({ id: 'end', x: 806, y: y4, w: 114, h: 540 - y4 });

  // Shift stone 3 right when landing on stone 2
  const shift3 = randInt(rng, 30, 44);
  triggers.push({
    id: 't-s3',
    zone: { x: 350, y: 190, w: 78, h: 200 },
    taunt: { ar: 'تزحزحت المنصة!', en: 'Stone shifted!' },
    actions: [{ type: 'moveBlock', targetId: 's3', dx: shift3, dy: 0, speed: 320 }],
  });

  if (diff !== 'normal') {
    spikes.push({ id: 'lip', x: 808, y: y4 - 20, w: 26, h: 20, dir: 'up', hidden: true });
    triggers.push({
      id: 't-lip',
      zone: { x: 705, y: 160, w: 90, h: 200 },
      taunt: { ar: 'اقفز أبعد!', en: 'Jump further!' },
      actions: [{ type: 'toggleSpike', targetId: 'lip', show: true }],
    });
  }

  return {
    id: `${tierPrefix(diff)}-${index}`,
    difficulty: diff,
    indexInTier: index,
    titleAr: `أحجار الدومينو #${index}`,
    titleEn: `Domino Leap #${index}`,
    hintAr: 'المنصات تنهار تحت قدميك والثالثة تتزحزح… لا تتردد في القفز!',
    hintEn: 'Every stone crumbles on touch and the 3rd shifts — keep moving!',
    spawn: { x: 80, y: 368 },
    door: { x: 860, y: y4 - 54 },
    blocks,
    spikes,
    triggers,
  };
}

function buildSawStairs(
  rng: () => number,
  diff: DevilDifficulty,
  index: number
): DevilLevelDef {
  const f = tierFactor(diff, index);
  const reverseSlope = rng() < 0.4;
  const y1 = reverseSlope ? 300 : 400;
  const y2 = reverseSlope ? 345 : 345;
  const y3 = reverseSlope ? 395 : 290;

  const blocks: BlockDef[] = [
    ...roomFrame(95),
    { id: 'f1', x: 40, y: y1, w: 235, h: 540 - y1 },
    { id: 's1', x: 335, y: y2, w: 170, h: 26 },
    { id: 's2-a', x: 568, y: y3, w: 68, h: 26 },
    {
      id: 's2-b',
      x: 636,
      y: y3,
      w: 88,
      h: 26,
      kind: 'crumble',
      crumbleDelay: Number(Math.max(0.22, 0.38 - f * 0.14).toFixed(2)),
    },
    { id: 'goal', x: 786, y: y3, w: 134, h: 540 - y3 },
  ];

  const saws: SawDef[] = [
    { id: 'saw-chase', x: 54, y: y1 - 24, r: 22, hidden: true },
    { id: 'saw-mid', x: 472, y: 122, r: 21, hidden: true },
  ];
  const spikes: SpikeDef[] = [];
  const triggers: TriggerDef[] = [
    {
      id: 't-chase',
      zone: { x: 145, y: 160, w: 75, h: 260 },
      taunt: { ar: 'اهرب من المنشار!', en: 'Outrun the saw!' },
      actions: [
        {
          type: 'moveSaw',
          targetId: 'saw-chase',
          dx: 210,
          dy: 0,
          speed: Math.round(185 + f * 65),
          show: true,
        },
      ],
    },
    {
      id: 't-mid',
      zone: { x: 345, y: 140, w: 85, h: 250 },
      taunt: { ar: 'من الأعلى!', en: 'From above!' },
      actions: [
        {
          type: 'moveSaw',
          targetId: 'saw-mid',
          dx: 0,
          dy: y2 - 146,
          speed: Math.round(310 + f * 120),
          show: true,
        },
      ],
    },
  ];

  if (diff === 'impossible') {
    spikes.push({ id: 'sp-goal', x: 800, y: y3 - 20, w: 34, h: 20, dir: 'up', hidden: true });
    triggers.push({
      id: 't-sp-goal',
      zone: { x: 735, y: 140, w: 70, h: 270 },
      actions: [{ type: 'toggleSpike', targetId: 'sp-goal', show: true }],
    });
  }

  return {
    id: `${tierPrefix(diff)}-${index}`,
    difficulty: diff,
    indexInTier: index,
    titleAr: `مطاردة المناشير #${index}`,
    titleEn: `Saw Gauntlet #${index}`,
    hintAr: 'تحرك فوراً لتسبق المنشار وتفادَ المنشار الساقط من السقف!',
    hintEn: 'Move right away to outrun the saw and dodge the drop-saw!',
    spawn: { x: 92, y: y1 - 32 },
    door: { x: 856, y: y3 - 54 },
    blocks,
    spikes,
    saws,
    triggers,
  };
}

function buildFakeDoorLoft(
  rng: () => number,
  diff: DevilDifficulty,
  index: number
): DevilLevelDef {
  const f = tierFactor(diff, index);
  const pitX = randInt(rng, 425, 475);
  const pitW = Math.round(94 + f * 20);
  const blocks: BlockDef[] = [
    ...roomFrame(92),
    { id: 'f1', x: 40, y: 400, w: pitX - 40, h: 140 },
    { id: 'pit1', x: pitX, y: 400, w: pitW, h: 140 },
    { id: 'f2', x: pitX + pitW, y: 400, w: 920 - (pitX + pitW), h: 140 },
    { id: 'pad', x: 678, y: 332, w: 66, h: 20, kind: 'bouncy' },
    { id: 'up1', x: 520, y: 246, w: 112, h: 22 },
    {
      id: 'up2',
      x: 345,
      y: 215,
      w: 116,
      h: 22,
      kind: diff === 'impossible' ? 'crumble' : 'solid',
      crumbleDelay: 0.34,
    },
    { id: 'up3', x: 92, y: 215, w: 202, h: 22 },
  ];

  const spikes: SpikeDef[] = [
    { id: 'sp-low', x: randInt(rng, 225, 290), y: 378, w: 46, h: 22, dir: 'up', hidden: true },
    { id: 'sp-up', x: 226, y: 195, w: 40, h: 20, dir: 'up', hidden: true },
  ];
  const saws: SawDef[] = [];
  const triggers: TriggerDef[] = [
    {
      id: 't-low',
      zone: { x: spikes[0].x - 52, y: 240, w: 70, h: 170 },
      actions: [{ type: 'toggleSpike', targetId: 'sp-low', show: true }],
    },
    {
      id: 't-pit',
      zone: { x: pitX - 46, y: 240, w: 68, h: 170 },
      actions: [{ type: 'dropBlock', targetId: 'pit1' }],
    },
    {
      id: 't-up',
      zone: { x: 274, y: 105, w: 65, h: 120 },
      taunt: { ar: 'ليس بهذه السهولة!', en: 'Almost there!' },
      actions: [{ type: 'toggleSpike', targetId: 'sp-up', show: true }],
    },
  ];

  if (diff !== 'normal' && rng() < 0.6) {
    saws.push({ id: 'up-saw', x: 350, y: 192, r: 19, hidden: true });
    triggers.push({
      id: 't-up-saw',
      zone: { x: 515, y: 105, w: 90, h: 150 },
      actions: [{ type: 'moveSaw', targetId: 'up-saw', dx: 185, dy: 0, speed: 250, show: true }],
    });
  }

  return {
    id: `${tierPrefix(diff)}-${index}`,
    difficulty: diff,
    indexInTier: index,
    titleAr: `الباب الخادع #${index}`,
    titleEn: `Decoy Exit #${index}`,
    hintAr: 'الباب السفلي مزيف! استخدم منصة القفز الخضراء للوصول للباب العلوي.',
    hintEn: 'The bottom door is a decoy! Bounce up to reach the real upper exit.',
    spawn: { x: 80, y: 368 },
    door: { x: 126, y: 161 },
    fakeDoors: [{ id: 'fake-1', x: 826, y: 346 }],
    blocks,
    spikes,
    saws: saws.length ? saws : undefined,
    triggers,
  };
}

function buildBackwardsBrain(
  rng: () => number,
  diff: DevilDifficulty,
  index: number
): DevilLevelDef {
  const f = tierFactor(diff, index);
  const gap1 = Math.round(96 + f * 22);
  const gap2 = Math.round(102 + f * 22);
  const f1End = randInt(rng, 240, 275);
  const f2Start = f1End + gap1;
  const f2W = randInt(rng, 195, 225);
  const f3Start = Math.min(705, f2Start + f2W + gap2);

  const blocks: BlockDef[] = [
    ...roomFrame(),
    { id: 'f1', x: 40, y: 400, w: f1End - 40, h: 140 },
    { id: 'f2', x: f2Start, y: 400, w: f2W, h: 140 },
    { id: 'f3', x: f3Start, y: 400, w: 920 - f3Start, h: 140 },
  ];

  const sp1X = f2Start + Math.floor(f2W * 0.44);
  const sp2X = Math.min(805, f3Start + 72);
  const spikes: SpikeDef[] = [
    { id: 'sp-mid', x: sp1X, y: 378, w: 42, h: 22, dir: 'up', hidden: true },
    { id: 'sp-end', x: sp2X, y: 378, w: 42, h: 22, dir: 'up', hidden: true },
  ];

  const stayReversedAtEnd = diff === 'impossible' && rng() < 0.45;
  const triggers: TriggerDef[] = [
    {
      id: 't-rev-1',
      zone: { x: f2Start + 14, y: 220, w: 60, h: 190 },
      taunt: { ar: 'تحكم مقلوب!', en: 'Controls Reversed!' },
      actions: [
        { type: 'reverseControls', active: true },
        { type: 'toggleSpike', targetId: 'sp-mid', show: true },
      ],
    },
    {
      id: 't-rev-2',
      zone: { x: f3Start + 14, y: 220, w: 60, h: 190 },
      taunt: stayReversedAtEnd
        ? { ar: 'ما زال مقلوباً!', en: 'Still reversed!' }
        : { ar: 'عاد طبيعياً!', en: 'Back to normal!' },
      actions: [
        ...(stayReversedAtEnd ? [] : [{ type: 'reverseControls' as const, active: false }]),
        { type: 'toggleSpike', targetId: 'sp-end', show: true },
      ],
    },
  ];

  return {
    id: `${tierPrefix(diff)}-${index}`,
    difficulty: diff,
    indexInTier: index,
    titleAr: `ارتباك العقل #${index}`,
    titleEn: `Mirror Mind #${index}`,
    hintAr: 'في المنصة الوسطى تنعكس حركة اليمين واليسار — ركّز جيداً!',
    hintEn: 'Left and Right flip on the middle ledge — stay sharp!',
    spawn: { x: 80, y: 368 },
    door: { x: 856, y: 346 },
    blocks,
    spikes,
    triggers,
  };
}

function buildGravityCorridor(
  rng: () => number,
  diff: DevilDifficulty,
  index: number
): DevilLevelDef {
  const f = tierFactor(diff, index);
  const gapX = randInt(rng, 345, 415);
  const gapW = Math.round(92 + f * 26); // 92..118px

  const blocks: BlockDef[] = [
    { id: 'wall-l', x: 0, y: 0, w: 40, h: 540 },
    { id: 'wall-r', x: 920, y: 0, w: 40, h: 540 },
    { id: 'floor-l', x: 40, y: 420, w: 265, h: 120 },
    { id: 'floor-r', x: 615, y: 420, w: 305, h: 120 },
    { id: 'ceil-l', x: 40, y: 0, w: gapX - 40, h: 112 },
    { id: 'ceil-r', x: gapX + gapW, y: 0, w: 920 - (gapX + gapW), h: 112 },
  ];

  const cSpX = Math.min(585, gapX + gapW + 42);
  const spikes: SpikeDef[] = [
    { id: 'c-sp', x: cSpX, y: 112, w: 44, h: 22, dir: 'down', hidden: true },
    { id: 'f-sp', x: randInt(rng, 725, 765), y: 398, w: 44, h: 22, dir: 'up', hidden: true },
  ];

  const triggers: TriggerDef[] = [
    {
      id: 't-up',
      zone: { x: 215, y: 250, w: 68, h: 175 },
      taunt: { ar: 'للسقف!', en: 'Gravity Flip!' },
      actions: [{ type: 'flipGravity', dir: -1 }],
    },
    {
      id: 't-csp',
      zone: { x: cSpX - 52, y: 112, w: 62, h: 145 },
      actions: [{ type: 'toggleSpike', targetId: 'c-sp', show: true }],
    },
    {
      id: 't-down',
      zone: { x: 632, y: 112, w: 62, h: 145 },
      taunt: { ar: 'عودة للأرض!', en: 'Drop down!' },
      actions: [{ type: 'flipGravity', dir: 1 }],
    },
    {
      id: 't-fsp',
      zone: { x: spikes[1].x - 56, y: 260, w: 64, h: 165 },
      actions: [{ type: 'toggleSpike', targetId: 'f-sp', show: true }],
    },
  ];

  return {
    id: `${tierPrefix(diff)}-${index}`,
    difficulty: diff,
    indexInTier: index,
    titleAr: `انقلاب الجاذبية #${index}`,
    titleEn: `Inverted Room #${index}`,
    hintAr: 'اقفز للأسفل أثناء المشي على السقف لتعبر فجوة السقف!',
    hintEn: 'Press Jump while walking on the ceiling to leap over the ceiling gap!',
    spawn: { x: 80, y: 388 },
    door: { x: 856, y: 366 },
    blocks,
    spikes,
    triggers,
  };
}

function buildGhostMirage(
  rng: () => number,
  diff: DevilDifficulty,
  index: number
): DevilLevelDef {
  const f = tierFactor(diff, index);
  const delay = Number(Math.max(0.2, 0.34 - f * 0.12).toFixed(2));
  const blocks: BlockDef[] = [
    ...roomFrame(95),
    { id: 'start', x: 40, y: 400, w: 145, h: 140 },
    { id: 'r1', x: 244, y: 382, w: 94, h: 24, kind: 'crumble', crumbleDelay: delay },
    { id: 'fake-mid', x: 408, y: 344, w: 88, h: 22, kind: 'fakeSolid' },
    { id: 'ghost-real', x: 404, y: 412, w: 102, h: 24, kind: 'invisible' },
    { id: 'r3', x: 572, y: 356, w: 96, h: 24 },
    { id: 'goal-a', x: 740, y: 356, w: 46, h: 184 },
    { id: 'goal-c', x: 786, y: 356, w: 58, h: 24, kind: 'crumble', crumbleDelay: 0.22 },
    { id: 'goal-b', x: 844, y: 356, w: 76, h: 184 },
  ];

  const saws: SawDef[] = [];
  const triggers: TriggerDef[] = [
    {
      id: 't-reveal',
      zone: { x: 352, y: 230, w: 120, h: 215 },
      taunt: { ar: 'سراب!', en: 'Mirage!' },
      actions: [{ type: 'revealBlock', targetId: 'ghost-real' }],
    },
    {
      id: 't-door',
      zone: { x: 734, y: 200, w: 65, h: 180 },
      taunt: TAUNTS_DOOR[randInt(rng, 0, TAUNTS_DOOR.length - 1)],
      actions: [{ type: 'moveDoor', dx: 54, dy: 0, speed: 440 }],
    },
  ];

  if (diff !== 'normal') {
    saws.push({ id: 'boom-saw', x: 755, y: 332, r: 20, hidden: true });
    triggers.push({
      id: 't-saw',
      zone: { x: 520, y: 200, w: 80, h: 190 },
      actions: [
        {
          type: 'moveSaw',
          targetId: 'boom-saw',
          dx: -205,
          dy: 0,
          speed: Math.round(260 + f * 75),
          show: true,
        },
      ],
    });
  }

  return {
    id: `${tierPrefix(diff)}-${index}`,
    difficulty: diff,
    indexInTier: index,
    titleAr: `سراب الأشباح #${index}`,
    titleEn: `Phantom Mirage #${index}`,
    hintAr: 'المنصة الوسطى وهمية — اهبط للمنصة المخفية أسفلها مباشرة!',
    hintEn: 'The upper mid block is fake — drop onto the hidden block right beneath!',
    spawn: { x: 78, y: 368 },
    door: { x: 814, y: 302 },
    blocks,
    spikes: [],
    saws: saws.length ? saws : undefined,
    triggers,
  };
}

function buildBossMilestone(
  rng: () => number,
  diff: DevilDifficulty,
  index: number
): DevilLevelDef {
  const f = tierFactor(diff, index);
  const isFinale = index === 100;
  const tierNameAr = diff === 'normal' ? 'العادي' : diff === 'hard' ? 'الصعب' : 'المستحيل';
  const tierNameEn = diff === 'normal' ? 'Normal' : diff === 'hard' ? 'Hard' : 'Impossible';

  const blocks: BlockDef[] = [
    { id: 'wall-l', x: 0, y: 0, w: 40, h: 540 },
    { id: 'wall-r', x: 920, y: 0, w: 40, h: 540 },
    { id: 'ceil', x: 0, y: 0, w: 960, h: 108 },
    { id: 'st-a', x: 40, y: 410, w: 108, h: 130 },
    { id: 'st-drop', x: 148, y: 410, w: 54, h: 130 },
    { id: 'mid-f', x: 256, y: 410, w: 168, h: 130 },
    {
      id: 'catch-c',
      x: 584,
      y: 410,
      w: 112,
      h: 24,
      kind: 'crumble',
      crumbleDelay: Number(Math.max(0.24, 0.36 - f * 0.1).toFixed(2)),
    },
    { id: 'throne', x: 764, y: 390, w: 156, h: 150 },
  ];

  const spikes: SpikeDef[] = [
    { id: 'sp-1', x: randInt(rng, 275, 310), y: 388, w: 44, h: 22, dir: 'up', hidden: true },
    { id: 'sp-end', x: 798, y: 368, w: 40, h: 22, dir: 'up', hidden: true },
  ];

  const saws: SawDef[] = [
    { id: 'ceil-saw', x: 645, y: 132, r: 21, hidden: true },
  ];

  const triggers: TriggerDef[] = [
    {
      id: 't-lip',
      zone: { x: 110, y: 250, w: 56, h: 170 },
      taunt: isFinale
        ? { ar: 'الاختبار الأخير!', en: 'The Final Test!' }
        : { ar: `اختبار #${index}!`, en: `Trial #${index}!` },
      actions: [{ type: 'dropBlock', targetId: 'st-drop' }],
    },
    {
      id: 't-sp1',
      zone: { x: spikes[0].x - 42, y: 250, w: 62, h: 170 },
      actions: [{ type: 'toggleSpike', targetId: 'sp-1', show: true }],
    },
    {
      id: 't-g-up',
      zone: { x: 365, y: 260, w: 66, h: 165 },
      taunt: { ar: 'انقلبت الجاذبية!', en: 'To the ceiling!' },
      actions: [
        { type: 'flipGravity', dir: -1 },
        {
          type: 'moveSaw',
          targetId: 'ceil-saw',
          dx: -255,
          dy: 0,
          speed: Math.round(210 + f * 70),
          show: true,
        },
      ],
    },
    {
      id: 't-g-down',
      zone: { x: 602, y: 108, w: 60, h: 150 },
      taunt: { ar: 'هبوط!', en: 'Drop!' },
      actions: [{ type: 'flipGravity', dir: 1 }],
    },
    {
      id: 't-final-door',
      zone: { x: 750, y: 220, w: 62, h: 185 },
      taunt: TAUNTS_DOOR[randInt(rng, 0, TAUNTS_DOOR.length - 1)],
      actions: [
        { type: 'moveDoor', dx: 64, dy: 0, speed: 460 },
        { type: 'toggleSpike', targetId: 'sp-end', show: true },
      ],
    },
  ];

  return {
    id: `${tierPrefix(diff)}-${index}`,
    difficulty: diff,
    indexInTier: index,
    titleAr: isFinale ? `👑 ملك ${tierNameAr}` : `★ اختبار الزعيم #${index}`,
    titleEn: isFinale ? `👑 ${tierNameEn} Finale` : `★ Milestone Trial #${index}`,
    hintAr: 'اختبار شامل: حافة تسقط، جاذبية مقلوبة مع منشار علوي، وباب هارب!',
    hintEn: 'Milestone gauntlet: vanishing lip, gravity flip with saw, and fleeing door!',
    spawn: { x: 76, y: 378 },
    door: { x: 802, y: 336 },
    blocks,
    spikes,
    saws,
    triggers,
  };
}

function generateTierLevels(
  diff: DevilDifficulty,
  handcrafted: DevilLevelDef[]
): DevilLevelDef[] {
  const result: DevilLevelDef[] = [...handcrafted];
  const baseSeed = diff === 'normal' ? 10007 : diff === 'hard' ? 20011 : 30013;

  // Curated archetype pools per difficulty tier
  const normalPool = [
    buildTrapdoorCorridor,
    buildExpandingPitRoom,
    buildCrusherGauntlet,
    buildDominoStones,
    buildSawStairs,
    buildFakeDoorLoft,
  ];
  const hardPool = [
    buildTrapdoorCorridor,
    buildExpandingPitRoom,
    buildCrusherGauntlet,
    buildDominoStones,
    buildSawStairs,
    buildFakeDoorLoft,
    buildBackwardsBrain,
    buildGravityCorridor,
    buildGhostMirage,
  ];
  const impossiblePool = [
    buildGravityCorridor,
    buildCrusherGauntlet,
    buildGhostMirage,
    buildBackwardsBrain,
    buildSawStairs,
    buildDominoStones,
    buildFakeDoorLoft,
    buildExpandingPitRoom,
    buildTrapdoorCorridor,
  ];

  const pool =
    diff === 'normal' ? normalPool : diff === 'hard' ? hardPool : impossiblePool;

  for (let idx = handcrafted.length + 1; idx <= 100; idx += 1) {
    const rng = createRng(baseSeed + idx * 7919);
    if (idx % 10 === 0) {
      result.push(buildBossMilestone(rng, diff, idx));
    } else {
      const builder = pool[(idx - 6) % pool.length];
      result.push(builder(rng, diff, idx));
    }
  }

  return result;
}

export const LEVELS_NORMAL: DevilLevelDef[] = generateTierLevels('normal', HANDCRAFTED_NORMAL);
export const LEVELS_HARD: DevilLevelDef[] = generateTierLevels('hard', HANDCRAFTED_HARD);
export const LEVELS_IMPOSSIBLE: DevilLevelDef[] = generateTierLevels(
  'impossible',
  HANDCRAFTED_IMPOSSIBLE
);

export const DEVIL_TRAP_LEVELS_PER_TIER = 100;

export const DEVIL_TRAP_LEVELS: DevilLevelDef[] = [
  ...LEVELS_NORMAL,
  ...LEVELS_HARD,
  ...LEVELS_IMPOSSIBLE,
];

export const DEVIL_TRAP_TOTAL_LEVELS = DEVIL_TRAP_LEVELS.length; // 300

export function getLevelsByDifficulty(diff: DevilDifficulty): DevilLevelDef[] {
  if (diff === 'normal') return LEVELS_NORMAL;
  if (diff === 'hard') return LEVELS_HARD;
  return LEVELS_IMPOSSIBLE;
}
