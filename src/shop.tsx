import React from 'react';
import { CornIcon } from './fruitWorld';

export type CatcherSkinId = 'classic' | 'gold' | 'emerald' | 'royal' | 'ufo';
export type PlusPointSkinId = 'classic' | 'gems' | 'stars' | 'hearts' | 'coins';
export type MinusPointSkinId =
  | 'classic'
  | 'bombs'
  | 'skulls'
  | 'sawblades'
  | 'meteors';
export type SupplyId =
  | 'shield'
  | 'full_hearts'
  | 'full_corn'
  | 'one_heart'
  | 'one_corn';
export type ShopTab = 'skins' | 'points' | 'supplies';
export type PointsSubTab = 'plus' | 'minus';

export interface ShopState {
  ownedSkins: CatcherSkinId[];
  equippedSkin: CatcherSkinId;
  ownedPlusSkins: PlusPointSkinId[];
  equippedPlusSkin: PlusPointSkinId;
  ownedMinusSkins: MinusPointSkinId[];
  equippedMinusSkin: MinusPointSkinId;
  shields: number;
}

export interface SkinDefinition {
  id: CatcherSkinId;
  price: number;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
}

export interface PointSkinDefinition<T extends string> {
  id: T;
  price: number;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
}

export interface SupplyDefinition {
  id: SupplyId;
  price: number;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
}

export const SHOP_STORAGE_KEY = 'point_catcher_shop_v1';
export const MAX_SHIELDS = 5;
export const SHIELD_DURATION = 2;

export const SKIN_CATALOG: SkinDefinition[] = [
  {
    id: 'classic',
    price: 0,
    nameAr: 'السماوي الكلاسيكي',
    nameEn: 'Classic Sky',
    descAr: 'التصميم الأصلي الأنيق باللون السماوي وشعاع الالتقاط المضيء.',
    descEn: 'Original sky-blue hull with luminous energy catch beam.',
  },
  {
    id: 'gold',
    price: 20,
    nameAr: 'الملتقط الذهبي الملكي',
    nameEn: 'Royal Gold',
    descAr: 'هيكل ذهبي لامع مع جوهرة ياقوتية ومحركات لهب ذهبية.',
    descEn: 'Polished gold hull with ruby core jewel and golden thrusters.',
  },
  {
    id: 'emerald',
    price: 24,
    nameAr: 'الزمرد النيون',
    nameEn: 'Neon Emerald',
    descAr: 'هيكل زمردي مشع بشعاع طاقة أخضر وتفاصيل نيون حادة.',
    descEn: 'Radiant emerald chassis with bright jade energy field.',
  },
  {
    id: 'royal',
    price: 30,
    nameAr: 'الأرجواني الفضائي',
    nameEn: 'Cosmic Amethyst',
    descAr: 'تصميم بنفسجي فاخر بنواة متوهجة وحواف لؤلؤية.',
    descEn: 'Deep amethyst hull with radiant star core and pearl trim.',
  },
  {
    id: 'ufo',
    price: 36,
    nameAr: 'صحن الفضاء الطائر',
    nameEn: 'Flying Saucer UFO',
    descAr: 'صحن فضائي ثلاثي الأبعاد بقبة زجاجية وأضواء دوّارة وشعاع جذب.',
    descEn: '3D flying saucer with glass dome, rotating lights, and tractor beam.',
  },
];

export const SUPPLY_CATALOG: SupplyDefinition[] = [
  {
    id: 'shield',
    price: 12,
    nameAr: 'درع الحماية',
    nameEn: 'Shield Charge',
    descAr: 'يتفعّل تلقائياً عند لمس أي عائق أو خضار ويحميك بالكامل لمدة ثانيتين بدون خسارة قلوب أو ذرة أو نقاط.',
    descEn: 'Auto-activates on hazard or vegetable contact and protects you for 2 full seconds without losing hearts, corn, or points (stacks up to 5).',
  },
  {
    id: 'one_heart',
    price: 13,
    nameAr: '+1 قلب فوري',
    nameEn: '+1 Instant Heart',
    descAr: 'يضيف قلباً واحداً فوراً إلى رصيد القلوب في المراحل العادية.',
    descEn: 'Instantly adds 1 heart to your Normal Stages lives pool.',
  },
  {
    id: 'one_corn',
    price: 13,
    nameAr: '+1 ذرة فورية',
    nameEn: '+1 Instant Corn',
    descAr: 'يضيف ذرة واحدة فوراً إلى رصيد الذرة في عالم الفواكه.',
    descEn: 'Instantly adds 1 corn life to your Fruit World pool.',
  },
  {
    id: 'full_hearts',
    price: 100,
    nameAr: 'تعبئة القلوب (10/10)',
    nameEn: 'Full Hearts Refill',
    descAr: 'يعبّئ رصيد القلوب بالكامل إلى 10/10 دفعة واحدة.',
    descEn: 'Refills your entire Normal Stages heart pool back to 10/10.',
  },
  {
    id: 'full_corn',
    price: 100,
    nameAr: 'تعبئة الذرة (10/10)',
    nameEn: 'Full Corn Refill',
    descAr: 'يعبّئ رصيد الذرة في عالم الفواكه بالكامل إلى 10/10 دفعة واحدة.',
    descEn: 'Refills your entire Fruit World corn pool back to 10/10.',
  },
];

export const PLUS_POINT_CATALOG: PointSkinDefinition<PlusPointSkinId>[] = [
  {
    id: 'classic',
    price: 0,
    nameAr: 'النقاط الكلاسيكية',
    nameEn: 'Classic Shapes',
    descAr: 'الدائرة الوردية (+1)، الدائرة الخضراء (+2)، والمثلث الأزرق (+3) الأصلية.',
    descEn: 'Original pink circle (+1), green orb (+2), and blue triangle (+3).',
  },
  {
    id: 'gems',
    price: 18,
    nameAr: 'الجواهر الماسية',
    nameEn: 'Cut Diamonds',
    descAr: 'تحوّل النقاط الإيجابية إلى ألماسات مقطوعة ثلاثية الأبعاد بلمعان كريستالي.',
    descEn: 'Transforms positive points into faceted 3D diamonds with crystal shine.',
  },
  {
    id: 'stars',
    price: 24,
    nameAr: 'النجوم المتوهجة',
    nameEn: 'Glowing Stars',
    descAr: 'تحوّل النقاط إلى نجوم خماسية لامعة تدور بنعومة مع هالة مضيئة.',
    descEn: 'Turns positive points into radiant spinning 5-point stars.',
  },
  {
    id: 'hearts',
    price: 28,
    nameAr: 'القلوب اللامعة',
    nameEn: 'Glossy Hearts',
    descAr: 'تحوّل النقاط إلى قلوب زجاجية ثلاثية الأبعاد بألوان زاهية لكل قيمة.',
    descEn: 'Turns positive points into glossy 3D hearts color-coded by value.',
  },
  {
    id: 'coins',
    price: 34,
    nameAr: 'الميداليات الملكية',
    nameEn: 'Royal Medallions',
    descAr: 'عملات فاخرة بإطار ذهبي محفور ونواة ملوّنة تبرز قيمة كل نقطة.',
    descEn: 'Gold-rimmed collector medallions with vibrant value-coded cores.',
  },
];

export const MINUS_POINT_CATALOG: PointSkinDefinition<MinusPointSkinId>[] = [
  {
    id: 'classic',
    price: 0,
    nameAr: 'العوائق الكلاسيكية',
    nameEn: 'Classic Hazards',
    descAr: 'الأشواك الحمراء، المربع (-2)، السهم السريع، ونجمة التجميد الأصلية.',
    descEn: 'Original red spikes, heavy squares (-2), fast arrows, and freeze stars.',
  },
  {
    id: 'bombs',
    price: 20,
    nameAr: 'القنابل المشتعلة',
    nameEn: 'Lit Bombs',
    descAr: 'تحوّل العوائق إلى قنابل سوداء وحمراء ثلاثية الأبعاد بفتيل مشتعل.',
    descEn: 'Transforms hazards into 3D lit bombs with glowing fuses and sparks.',
  },
  {
    id: 'skulls',
    price: 26,
    nameAr: 'جماجم الخطر',
    nameEn: 'Danger Skulls',
    descAr: 'تحوّل العوائق إلى شارات جماجم قرمزية متوهجة بعيون حمراء حادة.',
    descEn: 'Turns hazards into glowing crimson warning skulls with piercing eyes.',
  },
  {
    id: 'sawblades',
    price: 30,
    nameAr: 'شفرات المنشار',
    nameEn: 'Crimson Sawblades',
    descAr: 'تحوّل العوائق إلى شفرات منشار معدنية حادة دوّارة بنواة نارية.',
    descEn: 'Turns hazards into spinning serrated metal sawblades with fiery cores.',
  },
  {
    id: 'meteors',
    price: 35,
    nameAr: 'النيازك الملتهبة',
    nameEn: 'Flaming Meteors',
    descAr: 'تحوّل العوائق إلى صخور نيازك بركانية مشتعلة بحمم متوهجة.',
    descEn: 'Turns hazards into molten volcanic meteors blazing with magma.',
  },
];

const VALID_SKIN_IDS: CatcherSkinId[] = SKIN_CATALOG.map((s) => s.id);
const VALID_PLUS_IDS: PlusPointSkinId[] = PLUS_POINT_CATALOG.map((s) => s.id);
const VALID_MINUS_IDS: MinusPointSkinId[] = MINUS_POINT_CATALOG.map((s) => s.id);

export function getDefaultShopState(): ShopState {
  return {
    ownedSkins: ['classic'],
    equippedSkin: 'classic',
    ownedPlusSkins: ['classic'],
    equippedPlusSkin: 'classic',
    ownedMinusSkins: ['classic'],
    equippedMinusSkin: 'classic',
    shields: 0,
  };
}

export function readStoredShopState(): ShopState {
  const fallback = getDefaultShopState();
  try {
    const raw = window.localStorage.getItem(SHOP_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return fallback;

    const rawOwned = Array.isArray(parsed.ownedSkins) ? parsed.ownedSkins : [];
    const ownedSet = new Set<CatcherSkinId>(['classic']);
    for (const s of rawOwned) {
      if (typeof s === 'string' && VALID_SKIN_IDS.includes(s as CatcherSkinId)) {
        ownedSet.add(s as CatcherSkinId);
      }
    }
    const ownedSkins = Array.from(ownedSet);
    const equippedSkin: CatcherSkinId =
      typeof parsed.equippedSkin === 'string' &&
      ownedSet.has(parsed.equippedSkin as CatcherSkinId)
        ? (parsed.equippedSkin as CatcherSkinId)
        : 'classic';

    const rawPlusOwned = Array.isArray(parsed.ownedPlusSkins)
      ? parsed.ownedPlusSkins
      : [];
    const ownedPlusSet = new Set<PlusPointSkinId>(['classic']);
    for (const s of rawPlusOwned) {
      if (typeof s === 'string' && VALID_PLUS_IDS.includes(s as PlusPointSkinId)) {
        ownedPlusSet.add(s as PlusPointSkinId);
      }
    }
    const ownedPlusSkins = Array.from(ownedPlusSet);
    const equippedPlusSkin: PlusPointSkinId =
      typeof parsed.equippedPlusSkin === 'string' &&
      ownedPlusSet.has(parsed.equippedPlusSkin as PlusPointSkinId)
        ? (parsed.equippedPlusSkin as PlusPointSkinId)
        : 'classic';

    const rawMinusOwned = Array.isArray(parsed.ownedMinusSkins)
      ? parsed.ownedMinusSkins
      : [];
    const ownedMinusSet = new Set<MinusPointSkinId>(['classic']);
    for (const s of rawMinusOwned) {
      if (
        typeof s === 'string' &&
        VALID_MINUS_IDS.includes(s as MinusPointSkinId)
      ) {
        ownedMinusSet.add(s as MinusPointSkinId);
      }
    }
    const ownedMinusSkins = Array.from(ownedMinusSet);
    const equippedMinusSkin: MinusPointSkinId =
      typeof parsed.equippedMinusSkin === 'string' &&
      ownedMinusSet.has(parsed.equippedMinusSkin as MinusPointSkinId)
        ? (parsed.equippedMinusSkin as MinusPointSkinId)
        : 'classic';

    const shields = clampInt(parsed.shields, 0, MAX_SHIELDS);

    return {
      ownedSkins,
      equippedSkin,
      ownedPlusSkins,
      equippedPlusSkin,
      ownedMinusSkins,
      equippedMinusSkin,
      shields,
    };
  } catch {
    return fallback;
  }
}

export function persistShopState(state: ShopState): void {
  try {
    window.localStorage.setItem(SHOP_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

function clampInt(val: unknown, min: number, max: number): number {
  if (typeof val !== 'number' || !Number.isFinite(val)) return min;
  return Math.max(min, Math.min(max, Math.floor(val)));
}

export interface SkinPalette {
  accent: string;
  aura0: string;
  auraMid: string;
  beam1: string;
  flameMid: string;
  flameEnd: string;
  hullStops: [string, string, string, string];
  cockpit: string;
  core: string;
  tip: string;
}

export function getSkinPalette(skin: CatcherSkinId): SkinPalette {
  if (skin === 'gold') {
    return {
      accent: '#fbbf24',
      aura0: 'rgba(251, 191, 36, 0.56)',
      auraMid: 'rgba(245, 158, 11, 0.2)',
      beam1: 'rgba(253, 224, 71, 0.45)',
      flameMid: '#f59e0b',
      flameEnd: 'rgba(245, 158, 11, 0)',
      hullStops: ['#fffbeb', '#fde68a', '#f59e0b', '#92400e'],
      cockpit: '#291506',
      core: '#f43f5e',
      tip: '#fef08a',
    };
  }
  if (skin === 'emerald') {
    return {
      accent: '#34d399',
      aura0: 'rgba(16, 185, 129, 0.56)',
      auraMid: 'rgba(5, 150, 105, 0.2)',
      beam1: 'rgba(110, 231, 183, 0.46)',
      flameMid: '#10b981',
      flameEnd: 'rgba(16, 185, 129, 0)',
      hullStops: ['#ecfdf5', '#a7f3d0', '#10b981', '#065f46'],
      cockpit: '#042319',
      core: '#fde047',
      tip: '#6ee7b7',
    };
  }
  if (skin === 'royal') {
    return {
      accent: '#c084fc',
      aura0: 'rgba(168, 85, 247, 0.56)',
      auraMid: 'rgba(126, 34, 206, 0.22)',
      beam1: 'rgba(216, 180, 254, 0.46)',
      flameMid: '#a855f7',
      flameEnd: 'rgba(168, 85, 247, 0)',
      hullStops: ['#faf5ff', '#e9d5ff', '#9333ea', '#4c1d95'],
      cockpit: '#1c0b33',
      core: '#f472b6',
      tip: '#f0abfc',
    };
  }
  return {
    accent: '#38bdf8',
    aura0: 'rgba(56, 189, 248, 0.52)',
    auraMid: 'rgba(14, 165, 233, 0.18)',
    beam1: 'rgba(125, 211, 252, 0.42)',
    flameMid: '#38bdf8',
    flameEnd: 'rgba(56, 189, 248, 0)',
    hullStops: ['#ffffff', '#e0f2fe', '#38bdf8', '#0369a1'],
    cockpit: '#0c1930',
    core: '#fde047',
    tip: '#fbbf24',
  };
}

export function drawUfoCatcher(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  tilt: number,
  scaleX: number,
  scaleY: number,
  isFrozen: boolean,
  isTurbo: boolean,
  glowColor: string,
  glowAlpha: number
): void {
  const halfW = w / 2;
  const halfH = h / 2;
  const isCatchFlash = glowAlpha > 0.05;
  const tNow = performance.now() * 0.006;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.scale(scaleX, scaleY);

  // Ambient UFO glow
  const auraGrad = ctx.createRadialGradient(0, 0, 6, 0, 0, w * 0.95);
  auraGrad.addColorStop(
    0,
    isFrozen
      ? 'rgba(186, 230, 253, 0.65)'
      : isCatchFlash
      ? `${glowColor}99`
      : isTurbo
      ? 'rgba(52, 211, 153, 0.62)'
      : 'rgba(56, 189, 248, 0.52)'
  );
  auraGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, w * 0.92, h * 1.65, 0, 0, Math.PI * 2);
  ctx.fill();

  // Upward tractor beam
  const beamGrad = ctx.createLinearGradient(0, -halfH - 22, 0, -halfH);
  beamGrad.addColorStop(0, 'rgba(167, 243, 208, 0)');
  beamGrad.addColorStop(
    1,
    isCatchFlash ? `${glowColor}88` : 'rgba(52, 211, 153, 0.45)'
  );
  ctx.fillStyle = beamGrad;
  ctx.beginPath();
  ctx.moveTo(-halfW * 0.65, -halfH - 20);
  ctx.lineTo(halfW * 0.65, -halfH - 20);
  ctx.lineTo(halfW * 0.42, -halfH + 2);
  ctx.lineTo(-halfW * 0.42, -halfH + 2);
  ctx.closePath();
  ctx.fill();

  // Glass upper dome
  const domeGrad = ctx.createRadialGradient(-6, -halfH - 6, 2, 0, -halfH, halfW * 0.55);
  domeGrad.addColorStop(0, '#ecfeff');
  domeGrad.addColorStop(0.45, '#67e8f9');
  domeGrad.addColorStop(1, '#0e7490');
  ctx.fillStyle = domeGrad;
  ctx.beginPath();
  ctx.ellipse(0, -halfH + 4, halfW * 0.46, halfH * 0.95, 0, Math.PI, Math.PI * 2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(207, 250, 254, 0.9)';
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // Metallic saucer rim body
  const saucerGrad = ctx.createLinearGradient(0, -halfH + 2, 0, halfH + 2);
  saucerGrad.addColorStop(0, '#f8fafc');
  saucerGrad.addColorStop(0.45, '#94a3b8');
  saucerGrad.addColorStop(1, '#334155');
  ctx.fillStyle = saucerGrad;
  ctx.beginPath();
  ctx.ellipse(0, 3, halfW * 1.02, halfH * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Orbiting glowing saucer lights
  const lightCount = 5;
  for (let i = 0; i < lightCount; i++) {
    const frac = (i / (lightCount - 1)) * 2 - 1;
    const lx = frac * (halfW * 0.72);
    const ly = 3 + Math.cos(frac * 1.2) * 2.5;
    const blink = 0.5 + 0.5 * Math.sin(tNow + i * 1.1);
    ctx.beginPath();
    ctx.arc(lx, ly, 3, 0, Math.PI * 2);
    ctx.fillStyle =
      blink > 0.5
        ? isTurbo
          ? '#34d399'
          : '#fde047'
        : '#38bdf8';
    ctx.fill();
  }

  // Hover pulse glow beneath saucer
  if (!isFrozen) {
    const hoverGrad = ctx.createRadialGradient(0, halfH + 2, 2, 0, halfH + 4, halfW * 0.55);
    hoverGrad.addColorStop(0, 'rgba(52, 211, 153, 0.8)');
    hoverGrad.addColorStop(1, 'rgba(52, 211, 153, 0)');
    ctx.fillStyle = hoverGrad;
    ctx.beginPath();
    ctx.ellipse(0, halfH + 4, halfW * 0.55, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function drawCatcherShieldBubble(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  shields: number,
  isFruitMode: boolean,
  activeTimer: number = 0
): void {
  const isActive = activeTimer > 0;
  if (shields <= 0 && !isActive) return;

  const rx = isFruitMode ? Math.max(38, w * 0.58) : w * 0.64;
  const ry = isFruitMode ? h * 1.75 : h * 1.28;
  const cy = isFruitMode ? y - h * 0.42 : y;
  const now = performance.now();
  const pulse = isActive
    ? activeTimer < 0.45
      ? 0.65 + 0.35 * Math.sin(now * 0.032)
      : 0.9 + 0.1 * Math.sin(now * 0.012)
    : 0.88 + 0.12 * Math.sin(now * 0.006);

  ctx.save();
  ctx.translate(x, cy);

  const grad = ctx.createRadialGradient(0, 0, rx * 0.35, 0, 0, rx);
  if (isActive) {
    grad.addColorStop(0, 'rgba(56, 189, 248, 0.12)');
    grad.addColorStop(0.7, 'rgba(56, 189, 248, 0.28)');
    grad.addColorStop(1, `rgba(186, 230, 253, ${0.72 * pulse})`);
  } else {
    grad.addColorStop(0, 'rgba(56, 189, 248, 0.03)');
    grad.addColorStop(0.75, 'rgba(56, 189, 248, 0.14)');
    grad.addColorStop(1, `rgba(125, 211, 252, ${0.42 * pulse})`);
  }
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = isActive
    ? `rgba(224, 242, 254, ${0.95 * pulse})`
    : `rgba(186, 230, 253, ${0.78 * pulse})`;
  ctx.lineWidth = isActive ? 2.8 : 2;
  ctx.stroke();

  // Active 2-second protection timer bar & remaining seconds readout
  if (isActive) {
    const frac = Math.max(0, Math.min(1, activeTimer / SHIELD_DURATION));
    const barW = Math.min(72, Math.max(52, rx * 1.15));
    const barH = 5;
    const barY = -ry - 12;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(-barW / 2, barY, barW, barH, 2.5);
    ctx.fill();

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.roundRect(-barW / 2, barY, barW * frac, barH, 2.5);
    ctx.fill();

    ctx.fillStyle = '#e0f2fe';
    ctx.font = '800 11px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`${activeTimer.toFixed(1)}s`, 0, barY - 2);
  }

  // Small crisp count indicator at top-right of bubble when > 1 standby shield (or >= 1 while active)
  if ((isActive && shields > 0) || (!isActive && shields > 1)) {
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(rx * 0.7, -ry * 0.65, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#7dd3fc';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.fillStyle = '#e0f2fe';
    ctx.font = '800 10px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(shields), rx * 0.7, -ry * 0.65 + 0.5);
  }

  ctx.restore();
}

export interface PointCanvasRenderItem {
  kind: string;
  x: number;
  y: number;
  radius: number;
  rotation: number;
  pulsePhase: number;
}

export function drawCustomPlusPoint(
  ctx: CanvasRenderingContext2D,
  item: PointCanvasRenderItem,
  skin: PlusPointSkinId
): void {
  const isGreen = item.kind === 'green_circle';
  const isBlue = item.kind === 'blue_triangle';
  const label = isBlue ? '+3' : isGreen ? '+2' : '+1';
  const r = item.radius;
  const pulse = 1 + Math.sin(item.pulsePhase) * 0.06;

  const light = isBlue ? '#e0f2fe' : isGreen ? '#d1fae5' : '#fce7f3';
  const mid = isBlue ? '#38bdf8' : isGreen ? '#10b981' : '#f472b6';
  const deep = isBlue ? '#0369a1' : isGreen ? '#047857' : '#be185d';
  const glow = isBlue
    ? 'rgba(56, 189, 248, 0.5)'
    : isGreen
    ? 'rgba(16, 185, 129, 0.52)'
    : 'rgba(244, 114, 182, 0.5)';

  ctx.save();
  ctx.translate(item.x, item.y);
  ctx.scale(pulse, pulse);

  // Soft outer glow
  const aura = ctx.createRadialGradient(0, 0, r * 0.25, 0, 0, r * 1.55);
  aura.addColorStop(0, glow);
  aura.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.55, 0, Math.PI * 2);
  ctx.fill();

  if (skin === 'gems') {
    ctx.save();
    ctx.rotate(Math.sin(item.pulsePhase * 0.45) * 0.14);
    const grad = ctx.createLinearGradient(-r, -r, r, r);
    grad.addColorStop(0, light);
    grad.addColorStop(0.45, mid);
    grad.addColorStop(1, deep);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.12);
    ctx.lineTo(r * 0.96, -r * 0.12);
    ctx.lineTo(0, r * 1.12);
    ctx.lineTo(-r * 0.96, -r * 0.12);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Inner crystal facet sheen
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.02);
    ctx.lineTo(r * 0.48, -r * 0.15);
    ctx.lineTo(-r * 0.48, -r * 0.15);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  } else if (skin === 'stars') {
    ctx.save();
    ctx.rotate(item.rotation * 0.65);
    const grad = ctx.createRadialGradient(-r * 0.25, -r * 0.25, 2, 0, 0, r * 1.15);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.4, mid);
    grad.addColorStop(1, deep);
    ctx.fillStyle = grad;
    ctx.beginPath();
    const spikes = 5;
    const outerR = r * 1.16;
    const innerR = r * 0.54;
    for (let i = 0; i < spikes * 2; i++) {
      const ang = (i * Math.PI) / spikes - Math.PI / 2;
      const rad = i % 2 === 0 ? outerR : innerR;
      const px = Math.cos(ang) * rad;
      const py = Math.sin(ang) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();
  } else if (skin === 'hearts') {
    ctx.save();
    ctx.rotate(Math.sin(item.pulsePhase * 0.5) * 0.1);
    const grad = ctx.createRadialGradient(-r * 0.28, -r * 0.3, 2, 0, 0, r * 1.2);
    grad.addColorStop(0, light);
    grad.addColorStop(0.45, mid);
    grad.addColorStop(1, deep);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, r * 0.96);
    ctx.bezierCurveTo(-r * 1.22, r * 0.2, -r * 1.1, -r * 0.95, 0, -r * 0.34);
    ctx.bezierCurveTo(r * 1.1, -r * 0.95, r * 1.22, r * 0.2, 0, r * 0.96);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.7;
    ctx.stroke();

    // Gloss highlight
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.36, -r * 0.32, r * 0.22, r * 0.12, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else {
    // Royal Medallions ('coins')
    const rimGrad = ctx.createLinearGradient(-r, -r, r, r);
    rimGrad.addColorStop(0, '#fef08a');
    rimGrad.addColorStop(0.5, '#f59e0b');
    rimGrad.addColorStop(1, '#92400e');
    ctx.fillStyle = rimGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.04, 0, Math.PI * 2);
    ctx.fill();

    const coreGrad = ctx.createRadialGradient(-r * 0.25, -r * 0.25, 2, 0, 0, r * 0.8);
    coreGrad.addColorStop(0, light);
    coreGrad.addColorStop(0.5, mid);
    coreGrad.addColorStop(1, deep);
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#fef3c7';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.04, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Crisp value readout (+1 / +2 / +3)
  ctx.fillStyle = '#ffffff';
  ctx.font = `800 ${Math.max(10, Math.round(r * 0.62))}px "Segoe UI", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(15, 23, 42, 0.8)';
  ctx.shadowBlur = 4;
  ctx.fillText(label, 0, skin === 'hearts' ? -r * 0.04 : 0.5);

  ctx.restore();
}

export function drawCustomMinusPoint(
  ctx: CanvasRenderingContext2D,
  item: PointCanvasRenderItem,
  skin: MinusPointSkinId
): void {
  const isHeavy = item.kind === 'hazard_square';
  const isFreeze = item.kind === 'hazard_star';
  const isArrow = item.kind === 'hazard_arrow';
  const r = item.radius;
  const pulse = 1 + Math.sin(item.pulsePhase * 1.2) * 0.05;

  const rimColor = isFreeze ? '#7dd3fc' : isHeavy ? '#fca5a5' : '#fecaca';
  const glowColor = isFreeze
    ? 'rgba(56, 189, 248, 0.45)'
    : isHeavy
    ? 'rgba(220, 38, 38, 0.58)'
    : 'rgba(239, 68, 68, 0.48)';

  ctx.save();
  ctx.translate(item.x, item.y);
  ctx.scale(pulse, pulse);

  // Speed trail for fast hazard_arrow
  if (isArrow) {
    const trailGrad = ctx.createLinearGradient(0, -r * 2.4, 0, -r * 0.4);
    trailGrad.addColorStop(0, 'rgba(239, 68, 68, 0)');
    trailGrad.addColorStop(1, 'rgba(248, 113, 113, 0.55)');
    ctx.fillStyle = trailGrad;
    ctx.beginPath();
    ctx.moveTo(-r * 0.45, -r * 0.3);
    ctx.lineTo(0, -r * 2.5);
    ctx.lineTo(r * 0.45, -r * 0.3);
    ctx.closePath();
    ctx.fill();
  }

  // Danger aura
  const aura = ctx.createRadialGradient(0, 0, r * 0.25, 0, 0, r * 1.55);
  aura.addColorStop(0, glowColor);
  aura.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.55, 0, Math.PI * 2);
  ctx.fill();

  if (skin === 'bombs') {
    // Fuse & glowing spark
    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(r * 0.2, -r * 0.85);
    ctx.quadraticCurveTo(r * 0.65, -r * 1.35, r * 0.9, -r * 1.05);
    ctx.stroke();

    const sparkR = 3.5 + Math.sin(item.pulsePhase * 3) * 1.3;
    ctx.fillStyle = isFreeze ? '#7dd3fc' : '#facc15';
    ctx.beginPath();
    ctx.arc(r * 0.9, -r * 1.05, sparkR, 0, Math.PI * 2);
    ctx.fill();

    // Bomb iron sphere
    const bodyGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 2, 0, 0, r);
    bodyGrad.addColorStop(0, isFreeze ? '#38bdf8' : '#7f1d1d');
    bodyGrad.addColorStop(0.55, '#1e293b');
    bodyGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.96, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isFreeze ? '#7dd3fc' : '#ef4444';
    ctx.lineWidth = isHeavy ? 2.6 : 1.9;
    ctx.stroke();

    // Top fuse cap
    ctx.fillStyle = '#475569';
    ctx.fillRect(-r * 0.22, -r * 1.08, r * 0.44, r * 0.24);
  } else if (skin === 'skulls') {
    // Crimson danger medallion with crisp skull silhouette
    const bgGrad = ctx.createRadialGradient(-r * 0.2, -r * 0.25, 2, 0, 0, r * 1.05);
    bgGrad.addColorStop(0, isFreeze ? '#38bdf8' : '#ef4444');
    bgGrad.addColorStop(0.65, isFreeze ? '#0c4a6e' : '#991b1b');
    bgGrad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.02, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = rimColor;
    ctx.lineWidth = isHeavy ? 2.6 : 1.8;
    ctx.stroke();

    // Skull cranium + jaw
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(0, -r * 0.14, r * 0.56, Math.PI * 0.82, Math.PI * 2.18);
    ctx.lineTo(r * 0.34, r * 0.48);
    ctx.lineTo(-r * 0.34, r * 0.48);
    ctx.closePath();
    ctx.fill();

    // Glowing red / icy eye sockets
    ctx.fillStyle = isFreeze ? '#0284c7' : '#dc2626';
    ctx.beginPath();
    ctx.arc(-r * 0.22, -r * 0.12, r * 0.15, 0, Math.PI * 2);
    ctx.arc(r * 0.22, -r * 0.12, r * 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Teeth lines
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(-r * 0.12, r * 0.26);
    ctx.lineTo(-r * 0.12, r * 0.48);
    ctx.moveTo(r * 0.12, r * 0.26);
    ctx.lineTo(r * 0.12, r * 0.48);
    ctx.stroke();
  } else if (skin === 'sawblades') {
    ctx.save();
    ctx.rotate(item.rotation * 2.2);
    const teeth = isHeavy ? 10 : 8;
    const outerR = r * 1.12;
    const innerR = r * 0.72;
    const bladeGrad = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, outerR);
    bladeGrad.addColorStop(0, isFreeze ? '#bae6fd' : '#fca5a5');
    bladeGrad.addColorStop(0.55, isFreeze ? '#0284c7' : '#dc2626');
    bladeGrad.addColorStop(1, '#450a0a');
    ctx.fillStyle = bladeGrad;
    ctx.beginPath();
    for (let i = 0; i < teeth; i++) {
      const a0 = (i / teeth) * Math.PI * 2;
      const a1 = ((i + 0.42) / teeth) * Math.PI * 2;
      const a2 = ((i + 0.85) / teeth) * Math.PI * 2;
      if (i === 0) ctx.moveTo(Math.cos(a0) * innerR, Math.sin(a0) * innerR);
      else ctx.lineTo(Math.cos(a0) * innerR, Math.sin(a0) * innerR);
      ctx.lineTo(Math.cos(a1) * outerR, Math.sin(a1) * outerR);
      ctx.lineTo(Math.cos(a2) * innerR, Math.sin(a2) * innerR);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rimColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.34, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.restore();
  } else {
    // Flaming Meteors ('meteors')
    const flameGrad = ctx.createLinearGradient(0, -r * 1.9, 0, r * 0.4);
    flameGrad.addColorStop(0, isFreeze ? 'rgba(125,211,252,0)' : 'rgba(251,146,60,0)');
    flameGrad.addColorStop(0.65, isFreeze ? 'rgba(56,189,248,0.55)' : 'rgba(249,115,22,0.6)');
    flameGrad.addColorStop(1, isFreeze ? '#7dd3fc' : '#ef4444');
    ctx.fillStyle = flameGrad;
    ctx.beginPath();
    ctx.moveTo(-r * 0.85, 0);
    ctx.quadraticCurveTo(0, -r * 2.1, r * 0.85, 0);
    ctx.closePath();
    ctx.fill();

    ctx.save();
    ctx.rotate(item.rotation * 0.7);
    const rockGrad = ctx.createRadialGradient(-r * 0.25, -r * 0.25, 2, 0, 0, r);
    rockGrad.addColorStop(0, isFreeze ? '#bae6fd' : '#fb923c');
    rockGrad.addColorStop(0.45, isFreeze ? '#0369a1' : '#991b1b');
    rockGrad.addColorStop(1, '#1c1917');
    ctx.fillStyle = rockGrad;
    ctx.beginPath();
    const pts = 7;
    for (let i = 0; i < pts; i++) {
      const ang = (i / pts) * Math.PI * 2;
      const rad = r * (i % 2 === 0 ? 1.02 : 0.82);
      const px = Math.cos(ang) * rad;
      const py = Math.sin(ang) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = isFreeze ? '#e0f2fe' : '#fde047';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();
  }

  // Distinct crisp indicator badge for -2 Heavy Square or Freeze Star
  if (isHeavy) {
    ctx.fillStyle = '#ffffff';
    ctx.font = `900 ${Math.max(10, Math.round(r * 0.62))}px "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 4;
    ctx.fillText('-2', 0, 1);
  } else if (isFreeze) {
    ctx.fillStyle = '#e0f2fe';
    ctx.font = `900 ${Math.max(11, Math.round(r * 0.66))}px "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(2, 132, 199, 0.9)';
    ctx.shadowBlur = 5;
    ctx.fillText('❄', 0, 1);
  } else if (skin === 'bombs') {
    ctx.fillStyle = '#fecaca';
    ctx.font = `900 ${Math.max(10, Math.round(r * 0.56))}px "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isArrow ? '↓' : '-1', 0, 1);
  }

  ctx.restore();
}

function CoinMiniIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-3.5 h-3.5 text-amber-400 shrink-0"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9.5"
        fill="currentColor"
        stroke="#fef3c7"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function SkinArt({ id }: { id: CatcherSkinId }) {
  if (id === 'ufo') {
    return (
      <svg viewBox="0 0 36 24" className="w-9 h-7">
        <ellipse cx="18" cy="10" rx="8" ry="6" fill="#67e8f9" stroke="#ecfeff" strokeWidth="1.2" />
        <ellipse cx="18" cy="14" rx="15" ry="5" fill="#94a3b8" stroke="#ffffff" strokeWidth="1.3" />
        <circle cx="10" cy="14" r="1.5" fill="#fde047" />
        <circle cx="18" cy="15" r="1.5" fill="#34d399" />
        <circle cx="26" cy="14" r="1.5" fill="#fde047" />
      </svg>
    );
  }
  const pal = getSkinPalette(id);
  return (
    <svg viewBox="0 0 36 24" className="w-9 h-7">
      <path
        d="M3 8h5l2 3h16l2-3h5c1 4 0 9-4 10H7C3 17 2 12 3 8z"
        fill={pal.hullStops[2]}
        stroke="#ffffff"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <rect x="9" y="10" width="18" height="3.2" rx="1.6" fill={pal.accent} />
      <circle cx="18" cy="14.2" r="2" fill={pal.core} />
    </svg>
  );
}

function SupplyArt({ id }: { id: SupplyId }) {
  if (id === 'shield') {
    return (
      <svg viewBox="0 0 24 24" className="w-7 h-7 text-sky-300" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="currentColor" fillOpacity="0.2" />
      </svg>
    );
  }
  if (id === 'one_corn' || id === 'full_corn') {
    return <CornIcon className="w-7 h-7" />;
  }
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7 text-rose-500" fill="currentColor">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

function PlusPointArt({ id }: { id: PlusPointSkinId }) {
  if (id === 'gems') {
    return (
      <svg viewBox="0 0 28 28" className="w-7 h-7">
        <polygon
          points="14,3 24,13 14,25 4,13"
          fill="#38bdf8"
          stroke="#ffffff"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <polygon points="14,4 19,12 9,12" fill="rgba(255,255,255,0.45)" />
      </svg>
    );
  }
  if (id === 'stars') {
    return (
      <svg viewBox="0 0 28 28" className="w-7 h-7">
        <polygon
          points="14,3 17.2,10.2 25,11 19,16.2 20.8,24 14,19.8 7.2,24 9,16.2 3,11 10.8,10.2"
          fill="#f472b6"
          stroke="#ffffff"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (id === 'hearts') {
    return (
      <svg viewBox="0 0 28 28" className="w-7 h-7">
        <path
          d="M14 24.2C6 18.8 3.5 14 3.5 9.8 3.5 6.4 6.2 4 9.3 4c2 0 3.7 1 4.7 2.6C15 5 16.7 4 18.7 4c3.1 0 5.8 2.4 5.8 5.8 0 4.2-2.5 9-10.5 14.4z"
          fill="#10b981"
          stroke="#ffffff"
          strokeWidth="1.5"
        />
      </svg>
    );
  }
  if (id === 'coins') {
    return (
      <svg viewBox="0 0 28 28" className="w-7 h-7">
        <circle cx="14" cy="14" r="10.5" fill="#f59e0b" stroke="#fef3c7" strokeWidth="1.5" />
        <circle cx="14" cy="14" r="7.5" fill="#38bdf8" />
        <text x="14" y="17" textAnchor="middle" fill="#ffffff" fontSize="8.5" fontWeight="800">
          +3
        </text>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 28 28" className="w-7 h-7">
      <circle cx="9.5" cy="16.5" r="6" fill="#f472b6" stroke="#ffffff" strokeWidth="1.3" />
      <polygon points="19,5 25,16 13,16" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

function MinusPointArt({ id }: { id: MinusPointSkinId }) {
  if (id === 'bombs') {
    return (
      <svg viewBox="0 0 28 28" className="w-7 h-7">
        <path d="M16 7 Q20 3 23 5" fill="none" stroke="#fde68a" strokeWidth="2" strokeLinecap="round" />
        <circle cx="23.5" cy="5.5" r="2.2" fill="#facc15" />
        <circle cx="13" cy="16" r="8.5" fill="#1e293b" stroke="#ef4444" strokeWidth="1.8" />
        <text x="13" y="19" textAnchor="middle" fill="#fecaca" fontSize="8" fontWeight="800">
          -1
        </text>
      </svg>
    );
  }
  if (id === 'skulls') {
    return (
      <svg viewBox="0 0 28 28" className="w-7 h-7">
        <circle cx="14" cy="14" r="10.5" fill="#991b1b" stroke="#fecaca" strokeWidth="1.5" />
        <path d="M8.5 13.5a5.5 5.5 0 1 1 11 0v3.5h-2.5v2h-6v-2H8.5z" fill="#f8fafc" />
        <circle cx="11.8" cy="13.2" r="1.5" fill="#dc2626" />
        <circle cx="16.2" cy="13.2" r="1.5" fill="#dc2626" />
      </svg>
    );
  }
  if (id === 'sawblades') {
    return (
      <svg viewBox="0 0 28 28" className="w-7 h-7">
        <polygon
          points="14,2.5 16.5,7.2 21.8,5.8 20.5,11 25.5,14 20.5,17 21.8,22.2 16.5,20.8 14,25.5 11.5,20.8 6.2,22.2 7.5,17 2.5,14 7.5,11 6.2,5.8 11.5,7.2"
          fill="#dc2626"
          stroke="#fecaca"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <circle cx="14" cy="14" r="3.6" fill="#0f172a" stroke="#ffffff" strokeWidth="1.2" />
      </svg>
    );
  }
  if (id === 'meteors') {
    return (
      <svg viewBox="0 0 28 28" className="w-7 h-7">
        <path d="M7 15 Q14 2 21 15 Z" fill="#f97316" fillOpacity="0.7" />
        <polygon
          points="14,7 21,11 22,19 16,24 9,23 6,16 8,10"
          fill="#991b1b"
          stroke="#fde047"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 28 28" className="w-7 h-7">
      <polygon
        points="14,3 17,10 24,10 18.5,15 20.5,22 14,18 7.5,22 9.5,15 4,10 11,10"
        fill="#ef4444"
        stroke="#fecaca"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface ShopModalProps {
  lang: 'ar' | 'en';
  coins: number;
  lives: number;
  maxLives: number;
  corn: number;
  maxCorn: number;
  shop: ShopState;
  activeTab: ShopTab;
  pointsSubTab: PointsSubTab;
  onChangeTab: (tab: ShopTab) => void;
  onChangePointsSubTab: (sub: PointsSubTab) => void;
  onClose: () => void;
  onSelectOrBuySkin: (id: CatcherSkinId) => void;
  onSelectOrBuyPlusSkin: (id: PlusPointSkinId) => void;
  onSelectOrBuyMinusSkin: (id: MinusPointSkinId) => void;
  onBuySupply: (id: SupplyId) => void;
}

export function ShopModal({
  lang,
  coins,
  lives,
  maxLives,
  corn,
  maxCorn,
  shop,
  activeTab,
  pointsSubTab,
  onChangeTab,
  onChangePointsSubTab,
  onClose,
  onSelectOrBuySkin,
  onSelectOrBuyPlusSkin,
  onSelectOrBuyMinusSkin,
  onBuySupply,
}: ShopModalProps) {
  const isAr = lang === 'ar';

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center p-3 sm:p-5 bg-[#060c17]/82 backdrop-blur-[4px]">
      <div className="w-full max-w-lg max-h-full flex flex-col rounded-xl border border-white/14 bg-[#0f1a2e]/98 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-white whitespace-nowrap">
              {isAr ? 'المتجر' : 'Shop'}
            </h2>
            <span className="text-xs sm:text-sm text-amber-300 font-semibold font-num whitespace-nowrap inline-flex items-center gap-1">
              <span aria-hidden="true">·</span>
              <CoinMiniIcon />
              <span>{coins}</span>
              <span>{isAr ? 'فلوس' : 'Coins'}</span>
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={isAr ? 'إغلاق' : 'Close'}
            className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-white/10 bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 cursor-pointer shrink-0"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pt-3.5 pb-5 overflow-y-auto">
          {/* Category Tabs */}
          <div
            role="tablist"
            aria-label={isAr ? 'أقسام المتجر' : 'Shop categories'}
            className="grid grid-cols-3 gap-1.5 p-1 rounded-lg bg-slate-950/75 border border-white/10 mb-4"
          >
            {(
              [
                ['skins', isAr ? 'أشكال الملتقط' : 'Catcher'],
                ['points', isAr ? 'أشكال النقاط' : 'Point Shapes'],
                ['supplies', isAr ? 'الإمدادات' : 'Supplies'],
              ] as [ShopTab, string][]
            ).map(([tabKey, label]) => (
              <button
                key={tabKey}
                type="button"
                role="tab"
                aria-selected={activeTab === tabKey}
                onClick={() => onChangeTab(tabKey)}
                className={`h-9 px-2 rounded-md text-xs sm:text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 whitespace-nowrap cursor-pointer ${
                  activeTab === tabKey
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Point Shapes Tab (Plus / Minus sections) */}
          {activeTab === 'points' && (
            <div className="space-y-3" role="tabpanel">
              <div
                role="tablist"
                aria-label={isAr ? 'أقسام أشكال النقاط' : 'Point shape sections'}
                className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-slate-900/90 border border-white/10"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={pointsSubTab === 'plus'}
                  onClick={() => onChangePointsSubTab('plus')}
                  className={`h-8 px-3 rounded-md text-xs sm:text-sm font-bold transition-colors whitespace-nowrap cursor-pointer ${
                    pointsSubTab === 'plus'
                      ? 'bg-emerald-500 text-slate-950'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  {isAr ? 'قسم الزائد (+)' : 'Plus (+)'}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={pointsSubTab === 'minus'}
                  onClick={() => onChangePointsSubTab('minus')}
                  className={`h-8 px-3 rounded-md text-xs sm:text-sm font-bold transition-colors whitespace-nowrap cursor-pointer ${
                    pointsSubTab === 'minus'
                      ? 'bg-rose-500 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  {isAr ? 'قسم الناقص (-)' : 'Minus (-)'}
                </button>
              </div>

              {pointsSubTab === 'plus' ? (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400">
                    {isAr
                      ? 'تُغيّر أشكال النقاط الإيجابية (+1، +2، +3) في المراحل العادية.'
                      : 'Customizes positive point shapes (+1, +2, +3) in Normal Stages.'}
                  </p>
                  {PLUS_POINT_CATALOG.map((item) => {
                    const owned = shop.ownedPlusSkins.includes(item.id);
                    const equipped = shop.equippedPlusSkin === item.id;
                    const canAfford = !owned && coins >= item.price;
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center gap-3.5 p-3.5 rounded-lg border transition-colors ${
                          equipped
                            ? 'border-emerald-400/45 bg-emerald-500/10'
                            : 'border-white/10 bg-slate-900/80'
                        }`}
                      >
                        <div
                          className="w-12 h-12 rounded-lg border border-white/10 bg-[#0a1324] flex items-center justify-center shrink-0"
                          aria-hidden="true"
                        >
                          <PlusPointArt id={item.id} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-sm sm:text-base font-bold text-white truncate">
                              {isAr ? item.nameAr : item.nameEn}
                            </span>
                            {equipped && (
                              <span className="text-xs font-semibold text-emerald-300 whitespace-nowrap shrink-0">
                                {isAr ? 'مُجهّز' : 'Equipped'}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                            {isAr ? item.descAr : item.descEn}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={equipped || (!owned && !canAfford)}
                          onClick={() => onSelectOrBuyPlusSkin(item.id)}
                          className={`h-8 px-3 rounded-md inline-flex items-center justify-center gap-1.5 text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                            equipped
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/25 cursor-default'
                              : owned
                              ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 cursor-pointer'
                              : canAfford
                              ? 'bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 cursor-pointer'
                              : 'bg-slate-800 text-slate-500 border border-white/10 cursor-not-allowed'
                          }`}
                        >
                          {equipped ? (
                            <span>{isAr ? 'مفعّل' : 'Active'}</span>
                          ) : owned ? (
                            <span>{isAr ? 'تجهيز' : 'Equip'}</span>
                          ) : (
                            <>
                              <span className="font-num">{item.price}</span>
                              <CoinMiniIcon />
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400">
                    {isAr
                      ? 'تُغيّر أشكال العوائق الناقصة (الأشواك، المربع -2، السهم السريع، نجمة التجميد) في المراحل العادية.'
                      : 'Customizes hazard shapes (spikes, heavy squares, fast arrows, freeze stars) in Normal Stages.'}
                  </p>
                  {MINUS_POINT_CATALOG.map((item) => {
                    const owned = shop.ownedMinusSkins.includes(item.id);
                    const equipped = shop.equippedMinusSkin === item.id;
                    const canAfford = !owned && coins >= item.price;
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center gap-3.5 p-3.5 rounded-lg border transition-colors ${
                          equipped
                            ? 'border-rose-400/45 bg-rose-500/10'
                            : 'border-white/10 bg-slate-900/80'
                        }`}
                      >
                        <div
                          className="w-12 h-12 rounded-lg border border-white/10 bg-[#0a1324] flex items-center justify-center shrink-0"
                          aria-hidden="true"
                        >
                          <MinusPointArt id={item.id} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-sm sm:text-base font-bold text-white truncate">
                              {isAr ? item.nameAr : item.nameEn}
                            </span>
                            {equipped && (
                              <span className="text-xs font-semibold text-rose-300 whitespace-nowrap shrink-0">
                                {isAr ? 'مُجهّز' : 'Equipped'}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                            {isAr ? item.descAr : item.descEn}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={equipped || (!owned && !canAfford)}
                          onClick={() => onSelectOrBuyMinusSkin(item.id)}
                          className={`h-8 px-3 rounded-md inline-flex items-center justify-center gap-1.5 text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                            equipped
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/25 cursor-default'
                              : owned
                              ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 cursor-pointer'
                              : canAfford
                              ? 'bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 cursor-pointer'
                              : 'bg-slate-800 text-slate-500 border border-white/10 cursor-not-allowed'
                          }`}
                        >
                          {equipped ? (
                            <span>{isAr ? 'مفعّل' : 'Active'}</span>
                          ) : owned ? (
                            <span>{isAr ? 'تجهيز' : 'Equip'}</span>
                          ) : (
                            <>
                              <span className="font-num">{item.price}</span>
                              <CoinMiniIcon />
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Skins Tab */}
          {activeTab === 'skins' && (
            <div className="space-y-3" role="tabpanel">
              <p className="text-xs text-slate-400">
                {isAr
                  ? 'تعمل هذه الأشكال في المراحل العادية، بينما يحتفظ عالم الفواكه بملتقط الكمثرى المأكولة.'
                  : 'Skins apply to Normal Stages while Fruit World keeps the bitten pear catcher.'}
              </p>
              {SKIN_CATALOG.map((skin) => {
                const owned = shop.ownedSkins.includes(skin.id);
                const equipped = shop.equippedSkin === skin.id;
                const canAfford = !owned && coins >= skin.price;
                return (
                  <div
                    key={skin.id}
                    className={`flex items-center gap-3.5 p-3.5 rounded-lg border transition-colors ${
                      equipped
                        ? 'border-amber-400/45 bg-amber-500/10'
                        : 'border-white/10 bg-slate-900/80'
                    }`}
                  >
                    <div
                      className="w-12 h-12 rounded-lg border border-white/10 bg-[#0a1324] flex items-center justify-center shrink-0"
                      aria-hidden="true"
                    >
                      <SkinArt id={skin.id} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm sm:text-base font-bold text-white truncate">
                          {isAr ? skin.nameAr : skin.nameEn}
                        </span>
                        {equipped && (
                          <span className="text-xs font-semibold text-amber-300 whitespace-nowrap shrink-0">
                            {isAr ? 'مُجهّز' : 'Equipped'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                        {isAr ? skin.descAr : skin.descEn}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={equipped || (!owned && !canAfford)}
                      onClick={() => onSelectOrBuySkin(skin.id)}
                      className={`h-8 px-3 rounded-md inline-flex items-center justify-center gap-1.5 text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                        equipped
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/25 cursor-default'
                          : owned
                          ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 cursor-pointer'
                          : canAfford
                          ? 'bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 cursor-pointer'
                          : 'bg-slate-800 text-slate-500 border border-white/10 cursor-not-allowed'
                      }`}
                    >
                      {equipped ? (
                        <span>{isAr ? 'مفعّل' : 'Active'}</span>
                      ) : owned ? (
                        <span>{isAr ? 'تجهيز' : 'Equip'}</span>
                      ) : (
                        <>
                          <span className="font-num">{skin.price}</span>
                          <CoinMiniIcon />
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Supplies Tab */}
          {activeTab === 'supplies' && (
            <div className="space-y-3" role="tabpanel">
              {SUPPLY_CATALOG.map((sup) => {
                const isFull =
                  (sup.id === 'shield' && shop.shields >= MAX_SHIELDS) ||
                  ((sup.id === 'one_heart' || sup.id === 'full_hearts') &&
                    lives >= maxLives) ||
                  ((sup.id === 'one_corn' || sup.id === 'full_corn') &&
                    corn >= maxCorn);
                const canAfford = !isFull && coins >= sup.price;
                const stockText =
                  sup.id === 'shield'
                    ? isAr
                      ? `لديك ${shop.shields}/${MAX_SHIELDS}`
                      : `Owned ${shop.shields}/${MAX_SHIELDS}`
                    : sup.id === 'one_heart' || sup.id === 'full_hearts'
                    ? isAr
                      ? `القلوب ${lives}/${maxLives}`
                      : `Hearts ${lives}/${maxLives}`
                    : isAr
                    ? `الذرة ${corn}/${maxCorn}`
                    : `Corn ${corn}/${maxCorn}`;

                return (
                  <div
                    key={sup.id}
                    className="flex items-center gap-3.5 p-3.5 rounded-lg border border-white/10 bg-slate-900/80"
                  >
                    <div
                      className="w-12 h-12 rounded-lg border border-white/10 bg-[#0a1324] flex items-center justify-center shrink-0"
                      aria-hidden="true"
                    >
                      <SupplyArt id={sup.id} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm sm:text-base font-bold text-white truncate">
                          {isAr ? sup.nameAr : sup.nameEn}
                        </span>
                        <span className="font-num text-xs font-semibold text-slate-400 whitespace-nowrap shrink-0">
                          {stockText}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                        {isAr ? sup.descAr : sup.descEn}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isFull || !canAfford}
                      onClick={() => onBuySupply(sup.id)}
                      className={`h-8 px-3 rounded-md inline-flex items-center justify-center gap-1.5 text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                        isFull
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/25 cursor-default'
                          : canAfford
                          ? 'bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 cursor-pointer'
                          : 'bg-slate-800 text-slate-500 border border-white/10 cursor-not-allowed'
                      }`}
                    >
                      {isFull ? (
                        <span>{isAr ? 'ممتلئ' : 'Full'}</span>
                      ) : (
                        <>
                          <span className="font-num">{sup.price}</span>
                          <CoinMiniIcon />
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
