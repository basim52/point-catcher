import React from 'react';

export type GameMode = 'normal' | 'fruit' | 'gold' | 'space' | 'monster';

export function getFruitStageClearCoins(remainingCorn: number): number {
  if (remainingCorn >= 3) return 18;
  if (remainingCorn === 2) return 12;
  return 6;
}

export type FruitItemKind =
  | 'fruit_apple'
  | 'fruit_orange'
  | 'fruit_strawberry'
  | 'fruit_watermelon'
  | 'veg_broccoli'
  | 'veg_carrot'
  | 'veg_pepper';

export interface FruitStageConfig {
  stage: number;
  pointsNeeded: number;
  baseSpeed: number;
  spawnInterval: number;
  vegChance: number;
  pepperRatio: number;
  lateralDrift: number;
}

export interface FruitIndexEntry {
  kind: FruitItemKind;
  category: 'positive' | 'negative';
  minStage: number;
  nameAr: string;
  nameEn: string;
  valueAr: string;
  valueEn: string;
  benefitAr: string;
  benefitEn: string;
}

export interface FruitBgMotif {
  x: number;
  y: number;
  size: number;
  speed: number;
  rotation: number;
  rotSpeed: number;
  alpha: number;
  motif: 'apple' | 'orange' | 'strawberry' | 'watermelon' | 'leaf';
}

export interface FruitRenderItem {
  kind: FruitItemKind;
  x: number;
  y: number;
  radius: number;
  rotation: number;
  pulsePhase: number;
}

export const TOTAL_FRUIT_STAGES = 30;
export const FRUIT_UNLOCK_COST = 28;
export const MAX_CORN = 10;

export const FRUIT_ITEM_STATS: Record<
  FruitItemKind,
  {
    isFruit: boolean;
    pointsDelta: number;
    cornDamage: number;
    color: string;
    textColor: string;
  }
> = {
  fruit_apple: {
    isFruit: true,
    pointsDelta: 2,
    cornDamage: 0,
    color: '#ef4444',
    textColor: '#fecaca',
  },
  fruit_orange: {
    isFruit: true,
    pointsDelta: 3,
    cornDamage: 0,
    color: '#fb923c',
    textColor: '#fed7aa',
  },
  fruit_strawberry: {
    isFruit: true,
    pointsDelta: 4,
    cornDamage: 0,
    color: '#f43f5e',
    textColor: '#fecdd3',
  },
  fruit_watermelon: {
    isFruit: true,
    pointsDelta: 5,
    cornDamage: 0,
    color: '#22c55e',
    textColor: '#bbf7d0',
  },
  veg_broccoli: {
    isFruit: false,
    pointsDelta: -3,
    cornDamage: 1,
    color: '#16a34a',
    textColor: '#fca5a5',
  },
  veg_carrot: {
    isFruit: false,
    pointsDelta: -4,
    cornDamage: 1,
    color: '#ea580c',
    textColor: '#fca5a5',
  },
  veg_pepper: {
    isFruit: false,
    pointsDelta: -6,
    cornDamage: 2,
    color: '#dc2626',
    textColor: '#fecaca',
  },
};

export const FRUIT_INDEX_CATALOG: FruitIndexEntry[] = [
  {
    kind: 'fruit_apple',
    category: 'positive',
    minStage: 1,
    nameAr: 'التفاحة الحمراء',
    nameEn: 'Red Apple',
    valueAr: '+2 نقاط',
    valueEn: '+2 pts',
    benefitAr: 'فاكهة طازجة تزيد نقاطك بمقدار نقطتين عند التقاطها.',
    benefitEn: 'Fresh orchard apple that adds 2 points when caught.',
  },
  {
    kind: 'fruit_orange',
    category: 'positive',
    minStage: 1,
    nameAr: 'البرتقالة',
    nameEn: 'Sunny Orange',
    valueAr: '+3 نقاط',
    valueEn: '+3 pts',
    benefitAr: 'تزيد نقاطك بمقدار 3 نقاط لإنجاز مرحلة الفواكه بشكل أسرع.',
    benefitEn: 'Adds 3 points to help clear the fruit stage faster.',
  },
  {
    kind: 'fruit_strawberry',
    category: 'positive',
    minStage: 1,
    nameAr: 'الفراولة',
    nameEn: 'Strawberry',
    valueAr: '+4 نقاط',
    valueEn: '+4 pts',
    benefitAr: 'فاكهة لذيذة تمنحك 4 نقاط دفعة واحدة عند التقاطها.',
    benefitEn: 'Juicy strawberry worth 4 points on catch.',
  },
  {
    kind: 'fruit_watermelon',
    category: 'positive',
    minStage: 1,
    nameAr: 'البطيخة',
    nameEn: 'Watermelon',
    valueAr: '+5 نقاط',
    valueEn: '+5 pts',
    benefitAr: 'أعلى فاكهة قيمة في بستان الفواكه — تعطيك 5 نقاط دفعة واحدة!',
    benefitEn: 'Highest-value fruit in the orchard — awards 5 points at once!',
  },
  {
    kind: 'veg_broccoli',
    category: 'negative',
    minStage: 1,
    nameAr: 'البروكلي',
    nameEn: 'Broccoli',
    valueAr: '-3 نقاط · -1 ذرة',
    valueEn: '-3 pts · -1 Corn',
    benefitAr: 'خضار تنقص 3 من نقاطك وتنقص ذرة واحدة (روح) عند لمسها.',
    benefitEn: 'Vegetable that subtracts 3 points and removes 1 corn life on hit.',
  },
  {
    kind: 'veg_carrot',
    category: 'negative',
    minStage: 1,
    nameAr: 'الجزرة',
    nameEn: 'Carrot',
    valueAr: '-4 نقاط · -1 ذرة',
    valueEn: '-4 pts · -1 Corn',
    benefitAr: 'خضار تنقص 4 من نقاطك وتنقص ذرة واحدة (روح) عند لمسها.',
    benefitEn: 'Vegetable that subtracts 4 points and removes 1 corn life on hit.',
  },
  {
    kind: 'veg_pepper',
    category: 'negative',
    minStage: 4,
    nameAr: 'الفلفل الحار',
    nameEn: 'Chili Pepper',
    valueAr: '-6 نقاط · -2 ذرة',
    valueEn: '-6 pts · -2 Corn',
    benefitAr: 'فلفل حار سريع ينقص 6 نقاط وذرتَين دفعة واحدة (يبدأ من المرحلة 4).',
    benefitEn: 'Fast spicy chili that deducts 6 points and 2 corn lives (Stage 4+).',
  },
];

export const VALID_FRUIT_KINDS: FruitItemKind[] = FRUIT_INDEX_CATALOG.map(
  (entry) => entry.kind
);

export const FRUIT_STAGES: FruitStageConfig[] = (() => {
  const list: FruitStageConfig[] = [];
  for (let s = 1; s <= TOTAL_FRUIT_STAGES; s++) {
    const t = (s - 1) / (TOTAL_FRUIT_STAGES - 1);
    const tCurve = Math.pow(t, 0.88);
    const pointsNeeded = Math.round(52 + s * 15);
    list.push({
      stage: s,
      pointsNeeded,
      baseSpeed: 220 + tCurve * 315,
      spawnInterval: Math.max(0.21, 0.66 - tCurve * 0.42),
      vegChance: Math.min(0.56, 0.31 + tCurve * 0.25),
      pepperRatio:
        s < 4 ? 0 : Math.min(0.48, 0.22 + ((s - 4) / (TOTAL_FRUIT_STAGES - 4)) * 0.26),
      lateralDrift: 24 + tCurve * 102,
    });
  }
  return list;
})();

export function initFruitBgMotifs(width: number, height: number): FruitBgMotif[] {
  const count = Math.max(16, Math.min(28, Math.floor((width * height) / 22000)));
  const kinds: FruitBgMotif['motif'][] = [
    'apple',
    'orange',
    'strawberry',
    'watermelon',
    'leaf',
  ];
  const motifs: FruitBgMotif[] = [];
  for (let i = 0; i < count; i++) {
    motifs.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 13 + Math.random() * 14,
      speed: 14 + Math.random() * 20,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.65,
      alpha: 0.1 + Math.random() * 0.11,
      motif: kinds[i % kinds.length],
    });
  }
  return motifs;
}

export function drawFruitBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  motifs: FruitBgMotif[]
): void {
  // Warm lush orchard twilight gradient so vibrant 3D fruits & veggies pop cleanly
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#1c1026');
  bgGrad.addColorStop(0.45, '#24162d');
  bgGrad.addColorStop(0.82, '#1f2419');
  bgGrad.addColorStop(1, '#162617');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(-14, -14, width + 28, height + 28);

  // Soft warm sunlit canopy glow from top center
  const canopyGlow = ctx.createRadialGradient(
    width * 0.5,
    -height * 0.08,
    20,
    width * 0.5,
    height * 0.15,
    Math.max(width, height) * 0.72
  );
  canopyGlow.addColorStop(0, 'rgba(251, 146, 60, 0.17)');
  canopyGlow.addColorStop(0.45, 'rgba(244, 63, 94, 0.08)');
  canopyGlow.addColorStop(1, 'rgba(34, 197, 94, 0)');
  ctx.fillStyle = canopyGlow;
  ctx.fillRect(0, 0, width, height);

  // Subtle orchard diagonal trellis pattern
  ctx.strokeStyle = 'rgba(253, 224, 71, 0.035)';
  ctx.lineWidth = 1;
  const step = Math.max(54, Math.round(width / 11));
  ctx.beginPath();
  for (let x = -height; x < width + height; x += step) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x + height * 0.5, height);
    ctx.moveTo(x + height * 0.5, 0);
    ctx.lineTo(x, height);
  }
  ctx.stroke();

  // Drifting translucent fruit & leaf silhouettes across the orchard backdrop
  for (const m of motifs) {
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.rotate(m.rotation);
    ctx.globalAlpha = m.alpha;
    const s = m.size;

    if (m.motif === 'apple') {
      ctx.fillStyle = '#fb7185';
      ctx.beginPath();
      ctx.arc(-s * 0.24, 0, s * 0.52, 0, Math.PI * 2);
      ctx.arc(s * 0.24, 0, s * 0.52, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      ctx.ellipse(s * 0.22, -s * 0.62, s * 0.28, s * 0.13, -0.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (m.motif === 'orange') {
      ctx.fillStyle = '#fb923c';
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.64, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fde68a';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    } else if (m.motif === 'strawberry') {
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.moveTo(0, s * 0.72);
      ctx.quadraticCurveTo(s * 0.68, s * 0.1, s * 0.52, -s * 0.44);
      ctx.quadraticCurveTo(0, -s * 0.62, -s * 0.52, -s * 0.44);
      ctx.quadraticCurveTo(-s * 0.68, s * 0.1, 0, s * 0.72);
      ctx.closePath();
      ctx.fill();
    } else if (m.motif === 'watermelon') {
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.76, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.lineTo(0, -s * 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fb7185';
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.6, 0.18 * Math.PI, 0.82 * Math.PI);
      ctx.lineTo(0, -s * 0.16);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.7, s * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

export function drawFruitCanvasItem(
  ctx: CanvasRenderingContext2D,
  item: FruitRenderItem
): void {
  const r = item.radius * 1.1;
  const pulse = 1 + Math.sin(item.pulsePhase) * 0.045;
  const sway = Math.sin(item.pulsePhase * 0.65) * 0.08;

  ctx.save();
  ctx.translate(item.x, item.y);

  if (item.kind === 'fruit_apple') {
    const glow = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 1.95);
    glow.addColorStop(0, 'rgba(239, 68, 68, 0.42)');
    glow.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.95, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(sway);
    ctx.scale(pulse, pulse);

    // 3D Apple body (slightly indented top & bottom)
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.78);
    ctx.bezierCurveTo(r * 0.85, -r * 1.15, r * 1.22, -r * 0.05, r * 0.82, r * 0.75);
    ctx.bezierCurveTo(r * 0.42, r * 1.15, r * 0.14, r * 0.88, 0, r * 0.82);
    ctx.bezierCurveTo(-r * 0.14, r * 0.88, -r * 0.42, r * 1.15, -r * 0.82, r * 0.75);
    ctx.bezierCurveTo(-r * 1.22, -r * 0.05, -r * 0.85, -r * 1.15, 0, -r * 0.78);
    ctx.closePath();

    const grad = ctx.createRadialGradient(-r * 0.34, -r * 0.34, r * 0.08, 0, 0, r * 1.15);
    grad.addColorStop(0, '#fecaca');
    grad.addColorStop(0.28, '#ef4444');
    grad.addColorStop(0.72, '#b91c1c');
    grad.addColorStop(1, '#7f1d1d');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(254, 226, 226, 0.78)';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Stem & green leaf
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.72);
    ctx.quadraticCurveTo(r * 0.06, -r * 1.1, r * 0.2, -r * 1.24);
    ctx.stroke();

    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.ellipse(r * 0.38, -r * 1.0, r * 0.34, r * 0.16, -0.42, 0, Math.PI * 2);
    ctx.fill();

    // Specular shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.38, -r * 0.25, r * 0.22, r * 0.12, -0.6, 0, Math.PI * 2);
    ctx.fill();

    drawEmbossedLabel(ctx, '+2', r * 0.76, 0, r * 0.14, 'rgba(69, 10, 10, 0.75)');
  } else if (item.kind === 'fruit_orange') {
    const glow = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 2.0);
    glow.addColorStop(0, 'rgba(251, 146, 60, 0.46)');
    glow.addColorStop(1, 'rgba(251, 146, 60, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 2.0, 0, Math.PI * 2);
    ctx.fill();

    ctx.scale(pulse, pulse);

    const grad = ctx.createRadialGradient(-r * 0.34, -r * 0.36, r * 0.08, 0, 0, r * 1.08);
    grad.addColorStop(0, '#ffedd5');
    grad.addColorStop(0.26, '#fb923c');
    grad.addColorStop(0.68, '#ea580c');
    grad.addColorStop(1, '#7c2d12');
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(254, 215, 170, 0.85)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Leaf on top
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.ellipse(r * 0.26, -r * 0.96, r * 0.34, r * 0.15, -0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.68)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.35, -r * 0.34, r * 0.26, r * 0.13, -0.65, 0, Math.PI * 2);
    ctx.fill();

    drawEmbossedLabel(ctx, '+3', r * 0.78, 0, r * 0.1, 'rgba(124, 45, 18, 0.78)');
  } else if (item.kind === 'fruit_strawberry') {
    const glow = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 2.05);
    glow.addColorStop(0, 'rgba(244, 63, 94, 0.48)');
    glow.addColorStop(1, 'rgba(244, 63, 94, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 2.05, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(sway);
    ctx.scale(pulse, pulse);

    // Sculpted berry silhouette
    ctx.beginPath();
    ctx.moveTo(0, r * 1.12);
    ctx.bezierCurveTo(r * 0.95, r * 0.45, r * 1.15, -r * 0.62, r * 0.48, -r * 0.82);
    ctx.quadraticCurveTo(0, -r * 0.92, -r * 0.48, -r * 0.82);
    ctx.bezierCurveTo(-r * 1.15, -r * 0.62, -r * 0.95, r * 0.45, 0, r * 1.12);
    ctx.closePath();

    const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.08, 0, 0, r * 1.2);
    grad.addColorStop(0, '#ffe4e6');
    grad.addColorStop(0.26, '#fb7185');
    grad.addColorStop(0.65, '#e11d48');
    grad.addColorStop(1, '#881337');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(254, 205, 211, 0.85)';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Golden seeds
    ctx.fillStyle = '#fef08a';
    for (const [sx, sy] of [
      [-0.42, -0.25],
      [0.42, -0.25],
      [-0.28, 0.32],
      [0.28, 0.32],
      [0, -0.48],
    ]) {
      ctx.beginPath();
      ctx.ellipse(sx * r, sy * r, r * 0.06, r * 0.09, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Leafy green crown
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.moveTo(-r * 0.56, -r * 0.72);
    ctx.lineTo(-r * 0.18, -r * 1.05);
    ctx.lineTo(0, -r * 0.82);
    ctx.lineTo(r * 0.18, -r * 1.05);
    ctx.lineTo(r * 0.56, -r * 0.72);
    ctx.lineTo(0, -r * 0.56);
    ctx.closePath();
    ctx.fill();

    drawEmbossedLabel(ctx, '+4', r * 0.76, 0, r * 0.1, 'rgba(136, 19, 55, 0.82)');
  } else if (item.kind === 'fruit_watermelon') {
    const glow = ctx.createRadialGradient(0, 0, r * 0.25, 0, 0, r * 2.15);
    glow.addColorStop(0, 'rgba(34, 197, 94, 0.48)');
    glow.addColorStop(1, 'rgba(34, 197, 94, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 2.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(sway);
    ctx.scale(pulse, pulse);

    // Outer green rind
    ctx.beginPath();
    ctx.arc(0, -r * 0.18, r * 1.18, 0.14 * Math.PI, 0.86 * Math.PI);
    ctx.lineTo(0, -r * 0.96);
    ctx.closePath();
    const rindGrad = ctx.createLinearGradient(-r, 0, r, r);
    rindGrad.addColorStop(0, '#4ade80');
    rindGrad.addColorStop(0.55, '#16a34a');
    rindGrad.addColorStop(1, '#14532d');
    ctx.fillStyle = rindGrad;
    ctx.fill();
    ctx.strokeStyle = '#bbf7d0';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Inner pale rind
    ctx.beginPath();
    ctx.arc(0, -r * 0.18, r * 1.0, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.lineTo(0, -r * 0.92);
    ctx.closePath();
    ctx.fillStyle = '#dcfce7';
    ctx.fill();

    // Juicy ruby flesh
    ctx.beginPath();
    ctx.arc(0, -r * 0.18, r * 0.9, 0.16 * Math.PI, 0.84 * Math.PI);
    ctx.lineTo(0, -r * 0.88);
    ctx.closePath();
    const fleshGrad = ctx.createRadialGradient(-r * 0.2, -r * 0.35, r * 0.08, 0, 0, r);
    fleshGrad.addColorStop(0, '#fda4af');
    fleshGrad.addColorStop(0.35, '#f43f5e');
    fleshGrad.addColorStop(1, '#9f1239');
    ctx.fillStyle = fleshGrad;
    ctx.fill();

    // Seeds
    ctx.fillStyle = '#1e293b';
    for (const [sx, sy] of [
      [-0.34, 0.32],
      [0.34, 0.32],
      [0, 0.45],
    ]) {
      ctx.beginPath();
      ctx.ellipse(sx * r, sy * r, r * 0.06, r * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    drawEmbossedLabel(ctx, '+5', r * 0.76, 0, r * 0.02, 'rgba(136, 19, 55, 0.85)');
  } else if (item.kind === 'veg_broccoli') {
    // Crimson danger halo around vegetable
    ctx.strokeStyle = `rgba(239, 68, 68, ${0.42 + Math.sin(item.pulsePhase * 1.5) * 0.18})`;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.32, 0, Math.PI * 2);
    ctx.stroke();

    ctx.rotate(sway);
    ctx.scale(pulse, pulse);

    // Stalk
    const stalkGrad = ctx.createLinearGradient(-r * 0.28, 0, r * 0.28, r);
    stalkGrad.addColorStop(0, '#86efac');
    stalkGrad.addColorStop(1, '#15803d');
    ctx.fillStyle = stalkGrad;
    ctx.beginPath();
    ctx.moveTo(-r * 0.26, r * 0.05);
    ctx.lineTo(r * 0.26, r * 0.05);
    ctx.lineTo(r * 0.18, r * 0.96);
    ctx.lineTo(-r * 0.18, r * 0.96);
    ctx.closePath();
    ctx.fill();

    // 3D Broccoli florets
    for (const [fx, fy, fr] of [
      [-0.46, -0.14, 0.46],
      [0.46, -0.14, 0.46],
      [0, -0.46, 0.54],
      [-0.22, -0.32, 0.44],
      [0.22, -0.32, 0.44],
    ]) {
      const fGrad = ctx.createRadialGradient(
        fx * r - fr * r * 0.3,
        fy * r - fr * r * 0.3,
        r * 0.05,
        fx * r,
        fy * r,
        fr * r
      );
      fGrad.addColorStop(0, '#4ade80');
      fGrad.addColorStop(0.55, '#15803d');
      fGrad.addColorStop(1, '#052e16');
      ctx.fillStyle = fGrad;
      ctx.beginPath();
      ctx.arc(fx * r, fy * r, fr * r, 0, Math.PI * 2);
      ctx.fill();
    }

    drawEmbossedLabel(ctx, '-3', r * 0.78, 0, -r * 0.12, 'rgba(69, 10, 10, 0.85)');
  } else if (item.kind === 'veg_carrot') {
    ctx.strokeStyle = `rgba(239, 68, 68, ${0.42 + Math.sin(item.pulsePhase * 1.5) * 0.18})`;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.32, 0, Math.PI * 2);
    ctx.stroke();

    ctx.rotate(sway);
    ctx.scale(pulse, pulse);

    // Leafy green tuft
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.66);
    ctx.lineTo(-r * 0.38, -r * 1.15);
    ctx.moveTo(0, -r * 0.66);
    ctx.lineTo(0, -r * 1.22);
    ctx.moveTo(0, -r * 0.66);
    ctx.lineTo(r * 0.38, -r * 1.15);
    ctx.stroke();

    // 3D Tapered carrot body
    ctx.beginPath();
    ctx.moveTo(-r * 0.54, -r * 0.65);
    ctx.quadraticCurveTo(0, -r * 0.82, r * 0.54, -r * 0.65);
    ctx.lineTo(0, r * 1.12);
    ctx.closePath();

    const cGrad = ctx.createLinearGradient(-r * 0.5, -r * 0.6, r * 0.5, r * 0.9);
    cGrad.addColorStop(0, '#fed7aa');
    cGrad.addColorStop(0.32, '#f97316');
    cGrad.addColorStop(0.75, '#c2410c');
    cGrad.addColorStop(1, '#7c2d12');
    ctx.fillStyle = cGrad;
    ctx.fill();
    ctx.strokeStyle = '#fca5a5';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    drawEmbossedLabel(ctx, '-4', r * 0.76, 0, -r * 0.08, 'rgba(69, 10, 10, 0.88)');
  } else {
    // veg_pepper (spicy red chili: -6 pts & -2 corn)
    const aura = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 2.05);
    aura.addColorStop(0, 'rgba(220, 38, 38, 0.58)');
    aura.addColorStop(1, 'rgba(220, 38, 38, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, r * 2.05, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(252, 165, 165, ${0.5 + Math.sin(item.pulsePhase * 1.8) * 0.2})`;
    ctx.lineWidth = 1.9;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.35, 0, Math.PI * 2);
    ctx.stroke();

    ctx.rotate(sway);
    ctx.scale(pulse, pulse);

    // Stem
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(r * 0.26, -r * 0.74);
    ctx.quadraticCurveTo(r * 0.44, -r * 1.1, r * 0.66, -r * 1.06);
    ctx.stroke();

    // Curved 3D fiery chili pepper
    ctx.beginPath();
    ctx.moveTo(r * 0.25, -r * 0.78);
    ctx.bezierCurveTo(r * 0.96, -r * 0.4, r * 0.72, r * 0.86, -r * 0.62, r * 1.02);
    ctx.bezierCurveTo(r * 0.12, r * 0.48, -r * 0.16, -r * 0.35, -r * 0.18, -r * 0.68);
    ctx.quadraticCurveTo(r * 0.04, -r * 0.9, r * 0.25, -r * 0.78);
    ctx.closePath();

    const pGrad = ctx.createLinearGradient(-r * 0.5, -r * 0.7, r * 0.7, r);
    pGrad.addColorStop(0, '#fecaca');
    pGrad.addColorStop(0.32, '#ef4444');
    pGrad.addColorStop(0.7, '#b91c1c');
    pGrad.addColorStop(1, '#450a0a');
    ctx.fillStyle = pGrad;
    ctx.fill();
    ctx.strokeStyle = '#fecaca';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    drawEmbossedLabel(ctx, '-6', r * 0.78, r * 0.1, r * 0.06, 'rgba(69, 10, 10, 0.9)');
  }

  ctx.restore();
}

function drawEmbossedLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  fontSize: number,
  x: number,
  y: number,
  shadowColor: string
): void {
  ctx.font = `800 ${Math.round(fontSize)}px "Segoe UI", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = shadowColor;
  ctx.fillText(text, x + 1, y + 1.8);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, x, y);
}

export function drawFruitPearCatcher(
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
  const isCatchFlash = glowAlpha > 0.05;
  const bellyW = Math.max(28, w * 0.44);
  const neckW = bellyW * 0.48;
  const bottomY = h * 0.62;
  const topY = -h * 1.48;
  const totalH = bottomY - topY;

  // Helper to trace the bitten pear silhouette (intact plump left side, 3-scallop bite carved out of right side)
  const traceBittenPearPath = () => {
    ctx.beginPath();
    ctx.moveTo(0, topY);
    // Right top crown down to top lip of the bite
    ctx.bezierCurveTo(
      neckW * 0.96,
      topY,
      neckW * 0.98,
      topY + totalH * 0.22,
      neckW * 1.02,
      topY + totalH * 0.34
    );
    // Scalloped 3-tooth bite carved inward on the right flank
    ctx.quadraticCurveTo(
      bellyW * 0.14,
      topY + totalH * 0.39,
      bellyW * 0.22,
      topY + totalH * 0.49
    );
    ctx.quadraticCurveTo(
      bellyW * 0.02,
      topY + totalH * 0.59,
      bellyW * 0.28,
      topY + totalH * 0.68
    );
    ctx.quadraticCurveTo(
      bellyW * 0.44,
      topY + totalH * 0.78,
      bellyW * 0.86,
      topY + totalH * 0.79
    );
    // Lower-right intact belly curving down to bottom center
    ctx.bezierCurveTo(
      bellyW * 0.78,
      bottomY + 2,
      bellyW * 0.46,
      bottomY + 3,
      0,
      bottomY
    );
    // Full plump intact left belly -> inward left neck -> back to top crown
    ctx.bezierCurveTo(
      -bellyW * 0.72,
      bottomY + 3,
      -bellyW * 1.18,
      topY + totalH * 0.82,
      -bellyW * 0.96,
      topY + totalH * 0.56
    );
    ctx.bezierCurveTo(
      -neckW * 0.92,
      topY + totalH * 0.34,
      -neckW * 0.95,
      topY,
      0,
      topY
    );
    ctx.closePath();
  };

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.scale(scaleX, scaleY);

  // Warm orchard aura around the bitten pear catcher (flashes with caught fruit color)
  const auraGrad = ctx.createRadialGradient(0, -4, 6, 0, -2, bellyW * 1.9);
  auraGrad.addColorStop(
    0,
    isCatchFlash ? `${glowColor}99` : 'rgba(190, 242, 100, 0.5)'
  );
  auraGrad.addColorStop(
    0.55,
    isCatchFlash ? `${glowColor}33` : 'rgba(132, 204, 22, 0.18)'
  );
  auraGrad.addColorStop(1, 'rgba(132, 204, 22, 0)');
  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.ellipse(0, -2, bellyW * 1.85, h * 1.9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Soft ground shadow directly beneath the pear
  ctx.fillStyle = 'rgba(2, 18, 10, 0.46)';
  ctx.beginPath();
  ctx.ellipse(-2, bottomY + 5, bellyW * 0.82, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // 3D sunlit pear body fill
  traceBittenPearPath();
  const pearGrad = ctx.createRadialGradient(
    -bellyW * 0.38,
    topY + totalH * 0.4,
    3,
    -bellyW * 0.08,
    topY + totalH * 0.56,
    bellyW * 1.45
  );
  pearGrad.addColorStop(0, '#fef9c3');
  pearGrad.addColorStop(0.24, '#d9f99d');
  pearGrad.addColorStop(0.58, '#84cc16');
  pearGrad.addColorStop(0.88, '#4d7c0f');
  pearGrad.addColorStop(1, '#274409');
  ctx.fillStyle = pearGrad;
  ctx.fill();

  // Clipped inner details: exposed creamy pear flesh along the bite, core seeds, blush, and speckles
  ctx.save();
  traceBittenPearPath();
  ctx.clip();

  // Warm sun-kissed blush on lower-left intact cheek
  const blushGrad = ctx.createRadialGradient(
    -bellyW * 0.48,
    bottomY - 12,
    2,
    -bellyW * 0.48,
    bottomY - 12,
    bellyW * 0.72
  );
  blushGrad.addColorStop(0, 'rgba(251, 146, 60, 0.44)');
  blushGrad.addColorStop(0.6, 'rgba(250, 204, 21, 0.14)');
  blushGrad.addColorStop(1, 'rgba(251, 146, 60, 0)');
  ctx.fillStyle = blushGrad;
  ctx.fillRect(-bellyW * 1.2, topY, bellyW * 2.4, totalH + 6);

  // Subtle natural pear speckles on intact skin
  ctx.fillStyle = 'rgba(63, 98, 18, 0.35)';
  for (const [sx, sy, sr] of [
    [-0.56, 0.68, 1.3],
    [-0.28, 0.78, 1.1],
    [-0.4, 0.52, 1.15],
    [-0.14, 0.88, 1.2],
    [-0.64, 0.58, 1.0],
  ]) {
    ctx.beginPath();
    ctx.arc(sx * bellyW, topY + totalH * sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Exposed juicy creamy-white inner pear flesh recessed behind the bite rim
  const fleshGrad = ctx.createRadialGradient(
    bellyW * 0.34,
    topY + totalH * 0.56,
    2,
    bellyW * 0.24,
    topY + totalH * 0.56,
    bellyW * 0.74
  );
  fleshGrad.addColorStop(0, '#fffbeb');
  fleshGrad.addColorStop(0.62, '#fef3c7');
  fleshGrad.addColorStop(0.88, '#fde68a');
  fleshGrad.addColorStop(1, 'rgba(217, 249, 157, 0)');
  ctx.fillStyle = fleshGrad;
  ctx.beginPath();
  ctx.ellipse(
    bellyW * 0.38,
    topY + totalH * 0.56,
    bellyW * 0.58,
    totalH * 0.29,
    -0.14,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Subtle inner rim shadow separating green skin from exposed creamy flesh
  ctx.strokeStyle = 'rgba(132, 204, 22, 0.55)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(
    bellyW * 0.42,
    topY + totalH * 0.56,
    bellyW * 0.52,
    totalH * 0.26,
    -0.14,
    Math.PI * 0.55,
    Math.PI * 1.48
  );
  ctx.stroke();

  // Tiny dark-brown pear seeds peeking inside the exposed creamy core
  for (const [seedX, seedY, seedRot] of [
    [0.06, 0.52, -0.35],
    [0.14, 0.63, 0.25],
  ]) {
    ctx.save();
    ctx.translate(bellyW * seedX, topY + totalH * seedY);
    ctx.rotate(seedRot);
    ctx.beginPath();
    ctx.ellipse(0, 0, 2.1, 3.4, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#451a03';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-0.6, -1.1, 0.75, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();

  // Crisp bright rim outline around the bitten pear silhouette
  traceBittenPearPath();
  ctx.strokeStyle = isCatchFlash ? '#ffffff' : 'rgba(236, 252, 203, 0.92)';
  ctx.lineWidth = isCatchFlash ? 2.6 : 2;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Extra warm highlight right along the bitten edge so the bite silhouette pops cleanly
  ctx.strokeStyle = '#fef9c3';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(neckW * 1.02, topY + totalH * 0.34);
  ctx.quadraticCurveTo(
    bellyW * 0.14,
    topY + totalH * 0.39,
    bellyW * 0.22,
    topY + totalH * 0.49
  );
  ctx.quadraticCurveTo(
    bellyW * 0.02,
    topY + totalH * 0.59,
    bellyW * 0.28,
    topY + totalH * 0.68
  );
  ctx.quadraticCurveTo(
    bellyW * 0.44,
    topY + totalH * 0.78,
    bellyW * 0.86,
    topY + totalH * 0.79
  );
  ctx.stroke();

  // Glossy curved specular highlight along intact upper-left side
  ctx.save();
  ctx.translate(-bellyW * 0.42, topY + totalH * 0.56);
  ctx.rotate(-0.32);
  ctx.beginPath();
  ctx.ellipse(0, 0, bellyW * 0.14, totalH * 0.17, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.58)';
  ctx.fill();
  ctx.restore();

  // Secondary tiny top-left highlight dot
  ctx.beginPath();
  ctx.arc(-neckW * 0.36, topY + totalH * 0.24, 2.8, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.fill();

  // Curved woody stem at the top of the pear
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 3.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, topY + 2);
  ctx.quadraticCurveTo(3, topY - 9, 8, topY - 13);
  ctx.stroke();

  // Stem warm highlight
  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-0.5, topY + 1);
  ctx.quadraticCurveTo(2.5, topY - 8.5, 7, topY - 12);
  ctx.stroke();

  // Vibrant sculpted leaf branching off the stem
  ctx.save();
  ctx.translate(4, topY - 8);
  ctx.rotate(-0.42);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(8, -7, 17, -1);
  ctx.quadraticCurveTo(9, 6, 0, 0);
  ctx.closePath();
  const leafGrad = ctx.createLinearGradient(0, -5, 17, 4);
  leafGrad.addColorStop(0, '#86efac');
  leafGrad.addColorStop(0.55, '#22c55e');
  leafGrad.addColorStop(1, '#15803d');
  ctx.fillStyle = leafGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(220, 252, 231, 0.78)';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Leaf center vein
  ctx.strokeStyle = 'rgba(220, 252, 231, 0.7)';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(2, 0);
  ctx.lineTo(13, -1);
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}

export function CornIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {/* Husk leaves */}
      <path
        d="M5 13c0 5 3.5 8 7 9 3.5-1 7-4 7-9-2 1.2-4 3.5-7 5-3-1.5-5-3.8-7-5z"
        fill="#22c55e"
      />
      {/* Golden corn cob */}
      <ellipse
        cx="12"
        cy="10.2"
        rx="4.6"
        ry="7.4"
        fill="#facc15"
        stroke="#fef08a"
        strokeWidth="1.2"
      />
      {/* Corn kernels */}
      <line x1="9.6" y1="5.5" x2="9.6" y2="14.5" stroke="#ca8a04" strokeWidth="1" />
      <line x1="12" y1="4.2" x2="12" y2="15.5" stroke="#ca8a04" strokeWidth="1" />
      <line x1="14.4" y1="5.5" x2="14.4" y2="14.5" stroke="#ca8a04" strokeWidth="1" />
      <line x1="8" y1="8.2" x2="16" y2="8.2" stroke="#ca8a04" strokeWidth="0.9" />
      <line x1="7.8" y1="11.4" x2="16.2" y2="11.4" stroke="#ca8a04" strokeWidth="0.9" />
    </svg>
  );
}

export function FruitIndexIcon({ kind }: { kind: FruitItemKind }) {
  if (kind === 'fruit_apple') {
    return (
      <svg viewBox="0 0 24 24" className="w-8 h-8">
        <path
          d="M12 6.5c3.5-2 7 .8 6 6.2-.8 4.4-3.3 6.8-6 5.8-2.7 1-5.2-1.4-6-5.8-1-5.4 2.5-8.2 6-6.2z"
          fill="#dc2626"
          stroke="#fecaca"
          strokeWidth="1.4"
        />
        <path d="M12 6.5c0-2 .8-3 1.8-3.5" stroke="#92400e" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <ellipse cx="15.2" cy="4.6" rx="2.4" ry="1.2" transform="rotate(-25 15.2 4.6)" fill="#4ade80" />
        <text x="12" y="15.5" textAnchor="middle" fill="#ffffff" fontSize="8.5" fontWeight="800">
          +2
        </text>
      </svg>
    );
  }
  if (kind === 'fruit_orange') {
    return (
      <svg viewBox="0 0 24 24" className="w-8 h-8">
        <circle cx="12" cy="13" r="8.5" fill="#ea580c" stroke="#fed7aa" strokeWidth="1.5" />
        <ellipse cx="14.4" cy="4.5" rx="2.6" ry="1.2" transform="rotate(-20 14.4 4.5)" fill="#4ade80" />
        <text x="12" y="16" textAnchor="middle" fill="#ffffff" fontSize="8.5" fontWeight="800">
          +3
        </text>
      </svg>
    );
  }
  if (kind === 'fruit_strawberry') {
    return (
      <svg viewBox="0 0 24 24" className="w-8 h-8">
        <path
          d="M12 21c4.5-3.2 7.5-8.5 5.5-12.5-1.2-2.2-9.8-2.2-11 0C4.5 12.5 7.5 17.8 12 21z"
          fill="#e11d48"
          stroke="#fecdd3"
          strokeWidth="1.4"
        />
        <polygon points="7,7.5 10,4.5 12,6.5 14,4.5 17,7.5 12,8.5" fill="#22c55e" />
        <text x="12" y="15.5" textAnchor="middle" fill="#ffffff" fontSize="8.5" fontWeight="800">
          +4
        </text>
      </svg>
    );
  }
  if (kind === 'fruit_watermelon') {
    return (
      <svg viewBox="0 0 24 24" className="w-8 h-8">
        <path d="M3 10a9 9 0 0 0 18 0L12 3z" fill="#16a34a" stroke="#bbf7d0" strokeWidth="1.3" />
        <path d="M5.2 10.2a6.8 6.8 0 0 0 13.6 0L12 4.8z" fill="#f43f5e" />
        <text x="12" y="13.5" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="800">
          +5
        </text>
      </svg>
    );
  }
  if (kind === 'veg_broccoli') {
    return (
      <svg viewBox="0 0 24 24" className="w-8 h-8">
        <rect x="10" y="12" width="4" height="9" rx="1.2" fill="#4ade80" />
        <circle cx="8" cy="10" r="4.2" fill="#15803d" stroke="#fca5a5" strokeWidth="1.1" />
        <circle cx="16" cy="10" r="4.2" fill="#15803d" stroke="#fca5a5" strokeWidth="1.1" />
        <circle cx="12" cy="7.5" r="4.6" fill="#16a34a" stroke="#fca5a5" strokeWidth="1.1" />
        <text x="12" y="11" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="800">
          -3
        </text>
      </svg>
    );
  }
  if (kind === 'veg_carrot') {
    return (
      <svg viewBox="0 0 24 24" className="w-8 h-8">
        <path d="M12 7L9 3M12 7V2.5M12 7l3-4" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" />
        <polygon points="6.5,7 17.5,7 12,21.5" fill="#ea580c" stroke="#fca5a5" strokeWidth="1.3" strokeLinejoin="round" />
        <text x="12" y="13" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="800">
          -4
        </text>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="w-8 h-8">
      <path d="M14.5 6.5c1-2 2.4-2.8 3.6-2.5" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path
        d="M14.5 6.5c4 2.2 2.5 11.5-7 13.5 4.2-3.5 3.6-8.8 3-11.8.8-1.4 2.5-2.2 4-1.7z"
        fill="#dc2626"
        stroke="#fecaca"
        strokeWidth="1.3"
      />
      <text x="13" y="15" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="800">
        -6
      </text>
    </svg>
  );
}
