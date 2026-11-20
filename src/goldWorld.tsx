import React from 'react';

export type GoldItemKind =
  | 'gold_coin'
  | 'gold_bar'
  | 'gold_crown'
  | 'blue_diamond'
  | 'rust_anvil'
  | 'cursed_rock'
  | 'mimic_bomb';

export interface GoldStageConfig {
  stage: number;
  pointsNeeded: number;
  baseSpeed: number;
  spawnInterval: number;
  hazardChance: number;
  bombRatio: number;
  lateralDrift: number;
}

export interface GoldIndexEntry {
  kind: GoldItemKind;
  category: 'positive' | 'negative';
  nameAr: string;
  nameEn: string;
  valueAr: string;
  valueEn: string;
  benefitAr: string;
  benefitEn: string;
}

export interface GoldBgMotif {
  x: number;
  y: number;
  size: number;
  speed: number;
  rotation: number;
  rotSpeed: number;
  alpha: number;
  twinklePhase: number;
  twinkleSpeed: number;
  motif: 'diamond' | 'gold_spark' | 'coin' | 'ingot' | 'star_glint';
}

export interface GoldRenderItem {
  kind: GoldItemKind;
  x: number;
  y: number;
  radius: number;
  rotation: number;
  pulsePhase: number;
}

export const TOTAL_GOLD_STAGES = 15;
export const GOLD_UNLOCK_COST = 40;
export const MAX_DIAMONDS = 10;
export const DIAMOND_COST_COINS = 40;

export function getGoldStageClearCoins(remainingDiamonds: number): number {
  if (remainingDiamonds >= 3) return 30;
  if (remainingDiamonds === 2) return 20;
  return 10;
}

export const GOLD_ITEM_STATS: Record<
  GoldItemKind,
  {
    isTreasure: boolean;
    pointsDelta: number;
    diamondDamage: number;
    color: string;
    textColor: string;
  }
> = {
  gold_coin: {
    isTreasure: true,
    pointsDelta: 2,
    diamondDamage: 0,
    color: '#fbbf24',
    textColor: '#fef08a',
  },
  gold_bar: {
    isTreasure: true,
    pointsDelta: 3,
    diamondDamage: 0,
    color: '#f59e0b',
    textColor: '#fde68a',
  },
  gold_crown: {
    isTreasure: true,
    pointsDelta: 4,
    diamondDamage: 0,
    color: '#eab308',
    textColor: '#fef9c3',
  },
  blue_diamond: {
    isTreasure: true,
    pointsDelta: 6,
    diamondDamage: 0,
    color: '#38bdf8',
    textColor: '#e0f2fe',
  },
  rust_anvil: {
    isTreasure: false,
    pointsDelta: -2,
    diamondDamage: 1,
    color: '#9a3412',
    textColor: '#fca5a5',
  },
  cursed_rock: {
    isTreasure: false,
    pointsDelta: -3,
    diamondDamage: 1,
    color: '#dc2626',
    textColor: '#fca5a5',
  },
  mimic_bomb: {
    isTreasure: false,
    pointsDelta: -4,
    diamondDamage: 2,
    color: '#ef4444',
    textColor: '#fecaca',
  },
};

export const GOLD_INDEX_CATALOG: GoldIndexEntry[] = [
  {
    kind: 'gold_coin',
    category: 'positive',
    nameAr: 'العملة الذهبية',
    nameEn: 'Gold Coin',
    valueAr: '+2 نقاط',
    valueEn: '+2 pts',
    benefitAr: 'عملة ذهب خالص تزيد نقاطك بمقدار نقطتين عند التقاطها.',
    benefitEn: 'Pure gold coin that awards 2 points when caught.',
  },
  {
    kind: 'gold_bar',
    category: 'positive',
    nameAr: 'سبيكة الذهب',
    nameEn: 'Gold Ingot',
    valueAr: '+3 نقاط',
    valueEn: '+3 pts',
    benefitAr: 'سبيكة ذهب لامعة تزيد نقاطك بمقدار 3 نقاط لإنهاء المرحلة أسرع.',
    benefitEn: 'Gleaming solid gold bar worth 3 points on catch.',
  },
  {
    kind: 'gold_crown',
    category: 'positive',
    nameAr: 'التاج الملكي',
    nameEn: 'Royal Crown',
    valueAr: '+4 نقاط',
    valueEn: '+4 pts',
    benefitAr: 'تاج ذهبي مرصّع بالجواهر يمنحك 4 نقاط دفعة واحدة.',
    benefitEn: 'Jeweled royal gold crown granting 4 points immediately.',
  },
  {
    kind: 'blue_diamond',
    category: 'positive',
    nameAr: 'الألماسة النادرة',
    nameEn: 'Rare Diamond',
    valueAr: '+6 نقاط',
    valueEn: '+6 pts',
    benefitAr: 'أثمن كنز في خزنة الذهب — تعطيك 6 نقاط دفعة واحدة!',
    benefitEn: 'Most precious gem in the gold vault — awards 6 points at once!',
  },
  {
    kind: 'rust_anvil',
    category: 'negative',
    nameAr: 'السندان الصدئ',
    nameEn: 'Rusty Anvil',
    valueAr: '-2 نقاط · -1 ألماسة',
    valueEn: '-2 pts · -1 Diamond',
    benefitAr: 'كتلة حديد صدئة ثقيلة تنقص نقطتين وألماسة واحدة عند لمسها.',
    benefitEn: 'Heavy rusted iron anvil that deducts 2 points and 1 diamond life.',
  },
  {
    kind: 'cursed_rock',
    category: 'negative',
    nameAr: 'حجر الفحم الناري',
    nameEn: 'Fiery Coal',
    valueAr: '-3 نقاط · -1 ألماسة',
    valueEn: '-3 pts · -1 Diamond',
    benefitAr: 'حجر فحم مشتعل متوهّج بالنار ينقص 3 نقاط وألماسة واحدة عند الاصطدام به.',
    benefitEn: 'Blazing fiery coal rock that deducts 3 points and 1 diamond life on impact.',
  },
  {
    kind: 'mimic_bomb',
    category: 'negative',
    nameAr: 'قنبلة الخزنة',
    nameEn: 'Vault Bomb',
    valueAr: '-4 نقاط · -2 ألماسة',
    valueEn: '-4 pts · -2 Diamonds',
    benefitAr: 'قنبلة حديدية سريعة تنقص 4 نقاط وألماستين دفعة واحدة (تبدأ من المرحلة 4).',
    benefitEn: 'Fast iron vault bomb deducting 4 points and 2 diamond lives (Stage 4+).',
  },
];

export const VALID_GOLD_KINDS: GoldItemKind[] = GOLD_INDEX_CATALOG.map(
  (entry) => entry.kind
);

export const GOLD_STAGES: GoldStageConfig[] = (() => {
  const list: GoldStageConfig[] = [];
  for (let s = 1; s <= TOTAL_GOLD_STAGES; s++) {
    const t = (s - 1) / (TOTAL_GOLD_STAGES - 1);
    const pointsNeeded = Math.round(58 + s * 18);
    list.push({
      stage: s,
      pointsNeeded,
      baseSpeed: 225 + t * 270,
      spawnInterval: Math.max(0.23, 0.65 - t * 0.38),
      hazardChance: 0.31 + t * 0.22,
      bombRatio: s < 4 ? 0 : 0.22 + ((s - 4) / (TOTAL_GOLD_STAGES - 4)) * 0.25,
      lateralDrift: 24 + t * 90,
    });
  }
  return list;
})();

export function initGoldBgMotifs(width: number, height: number): GoldBgMotif[] {
  const count = Math.max(36, Math.min(60, Math.floor((width * height) / 10500)));
  const kinds: GoldBgMotif['motif'][] = [
    'star_glint',
    'gold_spark',
    'diamond',
    'star_glint',
    'coin',
    'gold_spark',
    'ingot',
  ];
  const motifs: GoldBgMotif[] = [];
  for (let i = 0; i < count; i++) {
    const motif = kinds[i % kinds.length];
    motifs.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size:
        motif === 'star_glint'
          ? 8 + Math.random() * 14
          : motif === 'gold_spark'
          ? 9 + Math.random() * 15
          : 11 + Math.random() * 14,
      speed: 10 + Math.random() * 22,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.75,
      alpha:
        motif === 'star_glint' || motif === 'gold_spark'
          ? 0.24 + Math.random() * 0.34
          : 0.14 + Math.random() * 0.18,
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleSpeed: 1.8 + Math.random() * 3.4,
      motif,
    });
  }
  return motifs;
}

export function drawGoldBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  motifs: GoldBgMotif[]
): void {
  const nowSec = performance.now() * 0.001;

  // Rich luminous royal gold & warm amber treasury backdrop
  const bgGrad = ctx.createLinearGradient(0, 0, width * 0.25, height);
  bgGrad.addColorStop(0, '#251705');
  bgGrad.addColorStop(0.28, '#3f2808');
  bgGrad.addColorStop(0.62, '#2d1c06');
  bgGrad.addColorStop(0.88, '#1b1206');
  bgGrad.addColorStop(1, '#120c05');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Radiant overhead gilded chandelier spotlight (pulsing softly)
  const topPulse = 0.92 + Math.sin(nowSec * 1.4) * 0.08;
  const topGoldGlow = ctx.createRadialGradient(
    width * 0.5,
    height * 0.02,
    10,
    width * 0.5,
    height * 0.12,
    Math.max(width, height) * 0.75
  );
  topGoldGlow.addColorStop(0, `rgba(254, 249, 195, ${0.34 * topPulse})`);
  topGoldGlow.addColorStop(0.28, `rgba(251, 191, 36, ${0.24 * topPulse})`);
  topGoldGlow.addColorStop(0.6, `rgba(217, 119, 6, ${0.1 * topPulse})`);
  topGoldGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = topGoldGlow;
  ctx.fillRect(0, 0, width, height);

  // Dual diamond-cyan & champagne-gold prism pools on flanks
  const rightDiamondGlow = ctx.createRadialGradient(
    width * 0.86,
    height * 0.24,
    6,
    width * 0.86,
    height * 0.24,
    width * 0.44
  );
  rightDiamondGlow.addColorStop(0, 'rgba(125, 211, 252, 0.2)');
  rightDiamondGlow.addColorStop(0.45, 'rgba(56, 189, 248, 0.08)');
  rightDiamondGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');
  ctx.fillStyle = rightDiamondGlow;
  ctx.fillRect(0, 0, width, height);

  const leftGoldPool = ctx.createRadialGradient(
    width * 0.14,
    height * 0.42,
    6,
    width * 0.14,
    height * 0.42,
    width * 0.42
  );
  leftGoldPool.addColorStop(0, 'rgba(253, 224, 71, 0.18)');
  leftGoldPool.addColorStop(0.5, 'rgba(245, 158, 11, 0.07)');
  leftGoldPool.addColorStop(1, 'rgba(245, 158, 11, 0)');
  ctx.fillStyle = leftGoldPool;
  ctx.fillRect(0, 0, width, height);

  // Warm reflective golden floor glow near the bottom rail
  const floorGlow = ctx.createRadialGradient(
    width * 0.5,
    height * 1.02,
    12,
    width * 0.5,
    height * 0.96,
    width * 0.68
  );
  floorGlow.addColorStop(0, 'rgba(251, 191, 36, 0.24)');
  floorGlow.addColorStop(0.5, 'rgba(217, 119, 6, 0.09)');
  floorGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = floorGlow;
  ctx.fillRect(0, 0, width, height);

  // Animated diagonal volumetric golden light shafts (god-rays)
  ctx.save();
  const rayDefs = [
    { baseX: 0.2, widthFrac: 0.16, sway: 28, speed: 0.45, color: '254, 240, 138', alpha: 0.12 },
    { baseX: 0.5, widthFrac: 0.22, sway: 34, speed: 0.35, color: '251, 191, 36', alpha: 0.14 },
    { baseX: 0.8, widthFrac: 0.15, sway: 24, speed: 0.52, color: '186, 230, 253', alpha: 0.1 },
  ];
  for (let i = 0; i < rayDefs.length; i++) {
    const ray = rayDefs[i];
    const rx = width * ray.baseX + Math.sin(nowSec * ray.speed + i * 1.9) * ray.sway;
    const rw = Math.max(70, width * ray.widthFrac);
    const slant = width * 0.18;
    const grad = ctx.createLinearGradient(rx, 0, rx + slant * 0.5, height * 0.92);
    grad.addColorStop(0, `rgba(${ray.color}, ${ray.alpha})`);
    grad.addColorStop(0.55, `rgba(${ray.color}, ${ray.alpha * 0.45})`);
    grad.addColorStop(1, `rgba(${ray.color}, 0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(rx - rw * 0.35, 0);
    ctx.lineTo(rx + rw * 0.35, 0);
    ctx.lineTo(rx + slant + rw * 0.72, height);
    ctx.lineTo(rx + slant - rw * 0.52, height);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Gleaming Art-Deco diamond-cut gold lattice with subtle metallic sheen
  ctx.save();
  ctx.strokeStyle = 'rgba(253, 224, 71, 0.085)';
  ctx.lineWidth = 1;
  const step = 68;
  for (let x = -height; x < width + height; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + height * 0.55, height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + height * 0.55, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  ctx.restore();

  // Sweeping metallic gold specular shine band gliding across the vault
  ctx.save();
  const sweepCycle = (nowSec * 0.22) % 1;
  const sweepPos = -width * 0.45 + sweepCycle * (width * 1.9 + height * 0.5);
  const sheenGrad = ctx.createLinearGradient(
    sweepPos - 90,
    0,
    sweepPos + 90,
    height * 0.65
  );
  sheenGrad.addColorStop(0, 'rgba(254, 249, 195, 0)');
  sheenGrad.addColorStop(0.45, 'rgba(254, 240, 138, 0.09)');
  sheenGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.13)');
  sheenGrad.addColorStop(0.55, 'rgba(254, 240, 138, 0.09)');
  sheenGrad.addColorStop(1, 'rgba(254, 249, 195, 0)');
  ctx.fillStyle = sheenGrad;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  // Ornate gilded vault border glow lines along left & right edges
  ctx.save();
  const edgeGradL = ctx.createLinearGradient(0, 0, 26, 0);
  edgeGradL.addColorStop(0, 'rgba(251, 191, 36, 0.2)');
  edgeGradL.addColorStop(1, 'rgba(251, 191, 36, 0)');
  ctx.fillStyle = edgeGradL;
  ctx.fillRect(0, 0, 26, height);

  const edgeGradR = ctx.createLinearGradient(width, 0, width - 26, 0);
  edgeGradR.addColorStop(0, 'rgba(251, 191, 36, 0.2)');
  edgeGradR.addColorStop(1, 'rgba(251, 191, 36, 0)');
  ctx.fillStyle = edgeGradR;
  ctx.fillRect(width - 26, 0, 26, height);
  ctx.restore();

  // Drifting, twinkling gold, diamond & starlight treasure motifs
  for (const m of motifs) {
    const twinkle = 0.45 + 0.55 * Math.sin(nowSec * m.twinkleSpeed + m.twinklePhase);
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.rotate(m.rotation);
    ctx.globalAlpha = Math.min(0.88, m.alpha * (0.55 + twinkle * 0.95));
    const s = m.size;

    if (m.motif === 'diamond') {
      // Soft cyan diamond halo
      const dHalo = ctx.createRadialGradient(0, 0, 1, 0, 0, s * 1.15);
      dHalo.addColorStop(0, 'rgba(186, 230, 253, 0.65)');
      dHalo.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = dHalo;
      ctx.beginPath();
      ctx.arc(0, 0, s * 1.15, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#bae6fd';
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.72);
      ctx.lineTo(s * 0.58, -s * 0.14);
      ctx.lineTo(0, s * 0.76);
      ctx.lineTo(-s * 0.58, -s * 0.14);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.1;
      ctx.stroke();

      // Inner facet glint
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.48);
      ctx.lineTo(s * 0.24, -s * 0.14);
      ctx.lineTo(0, s * 0.12);
      ctx.lineTo(-s * 0.24, -s * 0.14);
      ctx.closePath();
      ctx.fill();
    } else if (m.motif === 'coin') {
      const coinGrad = ctx.createLinearGradient(-s * 0.5, -s * 0.5, s * 0.5, s * 0.5);
      coinGrad.addColorStop(0, '#fef9c3');
      coinGrad.addColorStop(0.5, '#fbbf24');
      coinGrad.addColorStop(1, '#b45309');
      ctx.fillStyle = coinGrad;
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fef9c3';
      ctx.lineWidth = 1.3;
      ctx.stroke();
    } else if (m.motif === 'ingot') {
      const ingotGrad = ctx.createLinearGradient(-s * 0.6, -s * 0.3, s * 0.6, s * 0.3);
      ingotGrad.addColorStop(0, '#fef08a');
      ingotGrad.addColorStop(0.5, '#f59e0b');
      ingotGrad.addColorStop(1, '#92400e');
      ctx.fillStyle = ingotGrad;
      ctx.beginPath();
      ctx.moveTo(-s * 0.55, -s * 0.28);
      ctx.lineTo(s * 0.55, -s * 0.28);
      ctx.lineTo(s * 0.72, s * 0.3);
      ctx.lineTo(-s * 0.72, s * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#fef9c3';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else if (m.motif === 'star_glint') {
      // Bright pulsing white-gold starlight cross flare
      const scaleTwinkle = 0.65 + twinkle * 0.6;
      const fs = s * scaleTwinkle;
      const glare = ctx.createRadialGradient(0, 0, 0.5, 0, 0, fs * 0.95);
      glare.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      glare.addColorStop(0.35, 'rgba(254, 240, 138, 0.55)');
      glare.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = glare;
      ctx.beginPath();
      ctx.arc(0, 0, fs * 0.95, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(0, -fs * 0.9);
      ctx.quadraticCurveTo(0, 0, fs * 0.9, 0);
      ctx.quadraticCurveTo(0, 0, 0, fs * 0.9);
      ctx.quadraticCurveTo(0, 0, -fs * 0.9, 0);
      ctx.quadraticCurveTo(0, 0, 0, -fs * 0.9);
      ctx.closePath();
      ctx.fill();
    } else {
      // Radiant 4-point gold twinkle sparkle with bright white center
      const fs = s * (0.7 + twinkle * 0.45);
      const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, fs * 0.85);
      glow.addColorStop(0, 'rgba(254, 249, 195, 0.85)');
      glow.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, fs * 0.85, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.moveTo(0, -fs * 0.72);
      ctx.quadraticCurveTo(0, 0, fs * 0.72, 0);
      ctx.quadraticCurveTo(0, 0, 0, fs * 0.72);
      ctx.quadraticCurveTo(0, 0, -fs * 0.72, 0);
      ctx.quadraticCurveTo(0, 0, 0, -fs * 0.72);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, fs * 0.14, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

export function drawGoldCanvasItem(
  ctx: CanvasRenderingContext2D,
  item: GoldRenderItem
): void {
  const r = item.radius;
  const pulse = 1 + Math.sin(item.pulsePhase) * 0.055;
  const stats = GOLD_ITEM_STATS[item.kind];

  ctx.save();
  ctx.translate(item.x, item.y);
  ctx.scale(pulse, pulse);

  // Soft radiance aura
  const aura = ctx.createRadialGradient(0, 0, r * 0.25, 0, 0, r * 1.55);
  aura.addColorStop(
    0,
    stats.isTreasure
      ? item.kind === 'blue_diamond'
        ? 'rgba(56, 189, 248, 0.58)'
        : 'rgba(251, 191, 36, 0.52)'
      : 'rgba(239, 68, 68, 0.45)'
  );
  aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.55, 0, Math.PI * 2);
  ctx.fill();

  if (item.kind === 'gold_coin') {
    const rimGrad = ctx.createLinearGradient(-r, -r, r, r);
    rimGrad.addColorStop(0, '#fef9c3');
    rimGrad.addColorStop(0.45, '#f59e0b');
    rimGrad.addColorStop(1, '#92400e');
    ctx.fillStyle = rimGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.98, 0, Math.PI * 2);
    ctx.fill();

    const innerGrad = ctx.createRadialGradient(-r * 0.25, -r * 0.25, 2, 0, 0, r * 0.78);
    innerGrad.addColorStop(0, '#fef08a');
    innerGrad.addColorStop(0.55, '#eab308');
    innerGrad.addColorStop(1, '#b45309');
    ctx.fillStyle = innerGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.74, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#fef9c3';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.98, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#451a03';
    ctx.font = `900 ${Math.max(10, Math.round(r * 0.62))}px "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+2', 0, 1);
  } else if (item.kind === 'gold_bar') {
    ctx.save();
    ctx.rotate(Math.sin(item.pulsePhase * 0.5) * 0.1);
    const barGrad = ctx.createLinearGradient(-r, -r * 0.6, r, r * 0.7);
    barGrad.addColorStop(0, '#fef9c3');
    barGrad.addColorStop(0.35, '#fbbf24');
    barGrad.addColorStop(0.75, '#d97706');
    barGrad.addColorStop(1, '#78350f');
    ctx.fillStyle = barGrad;
    ctx.beginPath();
    ctx.moveTo(-r * 0.78, -r * 0.52);
    ctx.lineTo(r * 0.78, -r * 0.52);
    ctx.lineTo(r * 1.1, r * 0.56);
    ctx.lineTo(-r * 1.1, r * 0.56);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#fef3c7';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Beveled top specular plane
    ctx.fillStyle = 'rgba(255, 255, 255, 0.38)';
    ctx.beginPath();
    ctx.moveTo(-r * 0.68, -r * 0.42);
    ctx.lineTo(r * 0.68, -r * 0.42);
    ctx.lineTo(r * 0.52, -r * 0.04);
    ctx.lineTo(-r * 0.52, -r * 0.04);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#451a03';
    ctx.font = `900 ${Math.max(10, Math.round(r * 0.58))}px "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+3', 0, r * 0.16);
    ctx.restore();
  } else if (item.kind === 'gold_crown') {
    ctx.save();
    ctx.rotate(Math.sin(item.pulsePhase * 0.45) * 0.08);
    const crownGrad = ctx.createLinearGradient(0, -r * 0.9, 0, r * 0.8);
    crownGrad.addColorStop(0, '#fef9c3');
    crownGrad.addColorStop(0.45, '#fbbf24');
    crownGrad.addColorStop(1, '#b45309');
    ctx.fillStyle = crownGrad;
    ctx.beginPath();
    ctx.moveTo(-r * 0.96, r * 0.66);
    ctx.lineTo(-r * 1.04, -r * 0.48);
    ctx.lineTo(-r * 0.45, r * 0.04);
    ctx.lineTo(0, -r * 0.82);
    ctx.lineTo(r * 0.45, r * 0.04);
    ctx.lineTo(r * 1.04, -r * 0.48);
    ctx.lineTo(r * 0.96, r * 0.66);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#fef3c7';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Embedded jewels on crown band
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(0, r * 0.34, r * 0.17, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(-r * 0.52, r * 0.36, r * 0.13, 0, Math.PI * 2);
    ctx.arc(r * 0.52, r * 0.36, r * 0.13, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fef9c3';
    ctx.font = `900 ${Math.max(10, Math.round(r * 0.56))}px "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(69, 26, 3, 0.9)';
    ctx.shadowBlur = 4;
    ctx.fillText('+4', 0, -r * 0.12);
    ctx.restore();
  } else if (item.kind === 'blue_diamond') {
    ctx.save();
    ctx.rotate(Math.sin(item.pulsePhase * 0.55) * 0.14);
    const diaGrad = ctx.createLinearGradient(-r, -r, r, r);
    diaGrad.addColorStop(0, '#ffffff');
    diaGrad.addColorStop(0.28, '#bae6fd');
    diaGrad.addColorStop(0.65, '#38bdf8');
    diaGrad.addColorStop(1, '#0284c7');
    ctx.fillStyle = diaGrad;
    ctx.beginPath();
    ctx.moveTo(-r * 0.56, -r * 0.84);
    ctx.lineTo(r * 0.56, -r * 0.84);
    ctx.lineTo(r * 1.06, -r * 0.18);
    ctx.lineTo(0, r * 1.06);
    ctx.lineTo(-r * 1.06, -r * 0.18);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Facet lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(-r * 1.02, -r * 0.18);
    ctx.lineTo(r * 1.02, -r * 0.18);
    ctx.moveTo(-r * 0.54, -r * 0.82);
    ctx.lineTo(-r * 0.34, -r * 0.18);
    ctx.lineTo(0, r * 1.02);
    ctx.moveTo(r * 0.54, -r * 0.82);
    ctx.lineTo(r * 0.34, -r * 0.18);
    ctx.lineTo(0, r * 1.02);
    ctx.stroke();

    ctx.fillStyle = '#082f49';
    ctx.font = `900 ${Math.max(10, Math.round(r * 0.58))}px "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+6', 0, -r * 0.02);
    ctx.restore();
  } else if (item.kind === 'rust_anvil') {
    const anvilGrad = ctx.createLinearGradient(0, -r * 0.8, 0, r * 0.9);
    anvilGrad.addColorStop(0, '#78716c');
    anvilGrad.addColorStop(0.5, '#44403c');
    anvilGrad.addColorStop(1, '#1c1917');
    ctx.fillStyle = anvilGrad;
    ctx.beginPath();
    ctx.moveTo(-r * 1.06, -r * 0.42);
    ctx.lineTo(r * 0.82, -r * 0.42);
    ctx.lineTo(r * 0.82, -r * 0.04);
    ctx.lineTo(r * 0.42, r * 0.18);
    ctx.lineTo(r * 0.72, r * 0.74);
    ctx.lineTo(-r * 0.76, r * 0.74);
    ctx.lineTo(-r * 0.44, r * 0.16);
    ctx.lineTo(-r * 0.68, -r * 0.08);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.fillStyle = '#fecaca';
    ctx.font = `900 ${Math.max(10, Math.round(r * 0.56))}px "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('-2', 0, r * 0.24);
  } else if (item.kind === 'cursed_rock') {
    ctx.save();
    ctx.rotate(item.rotation * 0.8);
    const rockGrad = ctx.createRadialGradient(-r * 0.25, -r * 0.25, 2, 0, 0, r);
    rockGrad.addColorStop(0, '#57534e');
    rockGrad.addColorStop(0.6, '#292524');
    rockGrad.addColorStop(1, '#0c0a09');
    ctx.fillStyle = rockGrad;
    ctx.beginPath();
    const pts = 7;
    for (let i = 0; i < pts; i++) {
      const ang = (i / pts) * Math.PI * 2;
      const rad = r * (i % 2 === 0 ? 1.02 : 0.78);
      const px = Math.cos(ang) * rad;
      const py = Math.sin(ang) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Glowing fiery lava cracks
    ctx.strokeStyle = '#fb923c';
    ctx.lineWidth = 1.9;
    ctx.beginPath();
    ctx.moveTo(-r * 0.45, -r * 0.2);
    ctx.lineTo(0, 0);
    ctx.lineTo(r * 0.4, -r * 0.35);
    ctx.moveTo(0, 0);
    ctx.lineTo(r * 0.15, r * 0.5);
    ctx.stroke();

    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(-r * 0.36, -r * 0.16);
    ctx.lineTo(0, 0);
    ctx.lineTo(r * 0.32, -r * 0.28);
    ctx.moveTo(0, 0);
    ctx.lineTo(r * 0.12, r * 0.4);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#fecaca';
    ctx.font = `900 ${Math.max(10, Math.round(r * 0.56))}px "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 4;
    ctx.fillText('-3', 0, 1);
  } else {
    // Vault Bomb ('mimic_bomb'): -4 pts & -2 diamonds
    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(r * 0.22, -r * 0.82);
    ctx.quadraticCurveTo(r * 0.65, -r * 1.32, r * 0.92, -r * 1.0);
    ctx.stroke();

    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(r * 0.92, -r * 1.0, 3.6 + Math.sin(item.pulsePhase * 3) * 1.2, 0, Math.PI * 2);
    ctx.fill();

    const bombGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 2, 0, 0, r);
    bombGrad.addColorStop(0, '#991b1b');
    bombGrad.addColorStop(0.55, '#1f2937');
    bombGrad.addColorStop(1, '#030712');
    ctx.fillStyle = bombGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.96, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = `900 ${Math.max(10, Math.round(r * 0.56))}px "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 4;
    ctx.fillText('-2💎', 0, 1);
  }

  ctx.restore();
}

export function drawGoldTreasureCatcher(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  tilt: number,
  scaleX: number,
  scaleY: number,
  glowColor: string,
  glowAlpha: number
): void {
  const halfW = w / 2;
  const halfH = h / 2;
  const isCatchFlash = glowAlpha > 0.05;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.scale(scaleX, scaleY);

  // Warm gold & diamond aura
  const auraGrad = ctx.createRadialGradient(0, 0, 6, 0, 0, w * 0.95);
  auraGrad.addColorStop(
    0,
    isCatchFlash ? `${glowColor}99` : 'rgba(251, 191, 36, 0.56)'
  );
  auraGrad.addColorStop(0.55, 'rgba(56, 189, 248, 0.16)');
  auraGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');
  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, w * 0.92, h * 1.65, 0, 0, Math.PI * 2);
  ctx.fill();

  // Golden treasure catching beam
  const beamGrad = ctx.createLinearGradient(0, -halfH - 22, 0, -halfH);
  beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0)');
  beamGrad.addColorStop(
    1,
    isCatchFlash ? `${glowColor}88` : 'rgba(251, 191, 36, 0.45)'
  );
  ctx.fillStyle = beamGrad;
  ctx.beginPath();
  ctx.moveTo(-halfW * 0.72, -halfH - 20);
  ctx.lineTo(halfW * 0.72, -halfH - 20);
  ctx.lineTo(halfW * 0.56, -halfH + 2);
  ctx.lineTo(-halfW * 0.56, -halfH + 2);
  ctx.closePath();
  ctx.fill();

  // Ornate 3D Solid Gold Collector Tray / Crown Cradle
  const hullGrad = ctx.createLinearGradient(0, -halfH - 4, 0, halfH + 4);
  hullGrad.addColorStop(0, '#fefce8');
  hullGrad.addColorStop(0.32, '#fde047');
  hullGrad.addColorStop(0.68, '#d97706');
  hullGrad.addColorStop(1, '#78350f');
  ctx.fillStyle = hullGrad;
  ctx.beginPath();
  ctx.moveTo(-halfW, -halfH * 0.55);
  ctx.lineTo(-halfW * 0.76, -halfH * 0.55);
  ctx.lineTo(-halfW * 0.62, -halfH * 0.12);
  ctx.lineTo(halfW * 0.62, -halfH * 0.12);
  ctx.lineTo(halfW * 0.76, -halfH * 0.55);
  ctx.lineTo(halfW, -halfH * 0.55);
  ctx.quadraticCurveTo(halfW * 0.95, halfH + 3, halfW * 0.55, halfH + 3);
  ctx.lineTo(-halfW * 0.55, halfH + 3);
  ctx.quadraticCurveTo(-halfW * 0.95, halfH + 3, -halfW, -halfH * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#fef9c3';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Velvet royal dark trim band across center
  ctx.fillStyle = '#291506';
  ctx.beginPath();
  ctx.roundRect(-halfW * 0.58, -1.5, w * 0.58, 9, 4.5);
  ctx.fill();

  // 3 inlaid sparkling faceted cyan-white diamonds along the gold band
  const diamondPositions = [-halfW * 0.34, 0, halfW * 0.34];
  diamondPositions.forEach((dx, idx) => {
    const ds = idx === 1 ? 6.5 : 4.6;
    const dGrad = ctx.createLinearGradient(dx - ds, -ds, dx + ds, ds);
    dGrad.addColorStop(0, '#ffffff');
    dGrad.addColorStop(0.45, '#7dd3fc');
    dGrad.addColorStop(1, '#0284c7');
    ctx.fillStyle = dGrad;
    ctx.beginPath();
    ctx.moveTo(dx, 3 - ds);
    ctx.lineTo(dx + ds, 3);
    ctx.lineTo(dx, 3 + ds);
    ctx.lineTo(dx - ds, 3);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // Soft gold hover shimmer underneath
  const flameGrad = ctx.createRadialGradient(0, halfH + 4, 2, 0, halfH + 6, halfW * 0.55);
  flameGrad.addColorStop(0, 'rgba(254, 240, 138, 0.85)');
  flameGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');
  ctx.fillStyle = flameGrad;
  ctx.beginPath();
  ctx.ellipse(0, halfH + 5, halfW * 0.52, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function DiamondIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 28"
      className={className}
      aria-hidden="true"
    >
      <polygon
        points="8,4 20,4 25.5,11 14,25 2.5,11"
        fill="#38bdf8"
        stroke="#e0f2fe"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <polygon points="8,4 20,4 17.5,11 10.5,11" fill="#bae6fd" />
      <polygon points="10.5,11 17.5,11 14,24" fill="#0284c7" fillOpacity="0.45" />
      <line x1="3" y1="11" x2="25" y2="11" stroke="#ffffff" strokeWidth="1.1" strokeOpacity="0.8" />
    </svg>
  );
}

export function GoldIndexIcon({ kind }: { kind: GoldItemKind }) {
  if (kind === 'gold_coin') {
    return (
      <svg viewBox="0 0 28 28" className="w-7 h-7">
        <circle cx="14" cy="14" r="10.5" fill="#f59e0b" stroke="#fef9c3" strokeWidth="1.5" />
        <circle cx="14" cy="14" r="7.5" fill="#fbbf24" />
        <text x="14" y="17.5" textAnchor="middle" fill="#451a03" fontSize="9" fontWeight="900">
          +2
        </text>
      </svg>
    );
  }
  if (kind === 'gold_bar') {
    return (
      <svg viewBox="0 0 28 28" className="w-7 h-7">
        <polygon
          points="7,8 21,8 25,20 3,20"
          fill="#f59e0b"
          stroke="#fef3c7"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <polygon points="8.5,9.5 19.5,9.5 18,13 10,13" fill="rgba(255,255,255,0.45)" />
        <text x="14" y="18.2" textAnchor="middle" fill="#451a03" fontSize="8" fontWeight="900">
          +3
        </text>
      </svg>
    );
  }
  if (kind === 'gold_crown') {
    return (
      <svg viewBox="0 0 28 28" className="w-7 h-7">
        <polygon
          points="4,21 3,10 9.5,14.5 14,6 18.5,14.5 25,10 24,21"
          fill="#fbbf24"
          stroke="#fef9c3"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <circle cx="14" cy="17.2" r="2.1" fill="#38bdf8" />
        <circle cx="8.5" cy="17.4" r="1.5" fill="#f43f5e" />
        <circle cx="19.5" cy="17.4" r="1.5" fill="#f43f5e" />
      </svg>
    );
  }
  if (kind === 'blue_diamond') {
    return <DiamondIcon className="w-7 h-7" />;
  }
  if (kind === 'rust_anvil') {
    return (
      <svg viewBox="0 0 28 28" className="w-7 h-7">
        <polygon
          points="3,10 23,10 23,14 19,16.5 21.5,22 6.5,22 9,16 6.5,13"
          fill="#57534e"
          stroke="#f87171"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (kind === 'cursed_rock') {
    return (
      <svg viewBox="0 0 28 28" className="w-7 h-7">
        <path
          d="M14 1.5 C16.5 4.2 18.5 5.6 17.5 8.5 C16.3 7.4 15.2 7.2 14.2 8.2 C13.2 6.8 11.8 6.8 10.8 8.3 C9.8 5.8 11.6 4 14 1.5 Z"
          fill="#f97316"
        />
        <polygon
          points="14,5 22,9 24,17 18,24 9,23.5 4,16.5 7,9"
          fill="#292524"
          stroke="#f97316"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M9 12 L14 15 L19 11 M14 15 L16 21"
          stroke="#fbbf24"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 28 28" className="w-7 h-7">
      <path d="M16 7 Q20 3 23 5" fill="none" stroke="#fde68a" strokeWidth="2" strokeLinecap="round" />
      <circle cx="23.5" cy="5.5" r="2.2" fill="#facc15" />
      <circle cx="13" cy="16" r="8.5" fill="#1f2937" stroke="#ef4444" strokeWidth="1.9" />
      <text x="13" y="19" textAnchor="middle" fill="#fecaca" fontSize="8" fontWeight="900">
        -2
      </text>
    </svg>
  );
}
