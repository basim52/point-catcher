import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { partyAudio } from './audio';
import type { MiniGamePlayProps } from './MiniGamesArcadeCanvas';
import {
  MARIO_MINI_GAME_MAP,
  mulberry32,
  PARTY_CHARACTER_MAP,
  type PartyCharacterId,
} from './types';

// Reusable module-scope math helpers (zero per-frame GC)
const _vA = new THREE.Vector3();
const _vB = new THREE.Vector3();

type KartWorldId = 'mushroom' | 'desert' | 'ice' | 'lava' | 'rainbow';

interface KartWorldTheme {
  id: KartWorldId;
  nameAr: string;
  nameEn: string;
  skyHex: number;
  hemiSky: number;
  hemiGround: number;
  sunColor: number;
  rimColor: number;
  roadA: string;
  roadB: string;
  seaColor: string;
  seaEmissive: string;
  seaEmissiveInt: number;
  curbA: string;
  curbB: string;
  badgeColor: string;
  isRainbowRoad?: boolean;
}

const KART_WORLDS: KartWorldTheme[] = [
  {
    id: 'mushroom',
    nameAr: 'عالم الفطر',
    nameEn: 'Mushroom',
    skyHex: 0x38bdf8,
    hemiSky: 0xe0f2fe,
    hemiGround: 0x14532d,
    sunColor: 0xfff7ed,
    rimColor: 0x60a5fa,
    roadA: '#334155',
    roadB: '#475569',
    seaColor: '#16a34a',
    seaEmissive: '#052e16',
    seaEmissiveInt: 0.1,
    curbA: '#ef4444',
    curbB: '#ffffff',
    badgeColor: '#22c55e',
  },
  {
    id: 'desert',
    nameAr: 'عالم الصحراء',
    nameEn: 'Desert',
    skyHex: 0xf59e0b,
    hemiSky: 0xfef3c7,
    hemiGround: 0x92400e,
    sunColor: 0xffedd5,
    rimColor: 0xfbbf24,
    roadA: '#78350f',
    roadB: '#92400e',
    seaColor: '#d97706',
    seaEmissive: '#78350f',
    seaEmissiveInt: 0.14,
    curbA: '#facc15',
    curbB: '#7c2d12',
    badgeColor: '#f59e0b',
  },
  {
    id: 'ice',
    nameAr: 'عالم الجليد',
    nameEn: 'Ice World',
    skyHex: 0x7dd3fc,
    hemiSky: 0xf0f9ff,
    hemiGround: 0x0c4a6e,
    sunColor: 0xffffff,
    rimColor: 0x38bdf8,
    roadA: '#0ea5e9',
    roadB: '#38bdf8',
    seaColor: '#e0f2fe',
    seaEmissive: '#bae6fd',
    seaEmissiveInt: 0.2,
    curbA: '#38bdf8',
    curbB: '#ffffff',
    badgeColor: '#38bdf8',
  },
  {
    id: 'lava',
    nameAr: 'عالم الحمم',
    nameEn: 'Lava World',
    skyHex: 0x2b0b08,
    hemiSky: 0xff9e64,
    hemiGround: 0x450a0a,
    sunColor: 0xffedd5,
    rimColor: 0xf97316,
    roadA: '#292524',
    roadB: '#44403c',
    seaColor: '#dc2626',
    seaEmissive: '#ea580c',
    seaEmissiveInt: 0.65,
    curbA: '#f97316',
    curbB: '#1c1917',
    badgeColor: '#f97316',
  },
  {
    id: 'rainbow',
    nameAr: 'طريق قوس قزح',
    nameEn: 'Rainbow Road',
    skyHex: 0x0f172a,
    hemiSky: 0xc084fc,
    hemiGround: 0x1e1b4b,
    sunColor: 0xfef08a,
    rimColor: 0xec4899,
    roadA: '#ec4899',
    roadB: '#38bdf8',
    seaColor: '#090d1f',
    seaEmissive: '#312e81',
    seaEmissiveInt: 0.25,
    curbA: '#facc15',
    curbB: '#a855f7',
    badgeColor: '#ec4899',
    isRainbowRoad: true,
  },
];

const KART_WORLD_MAP: Record<KartWorldId, KartWorldTheme> = KART_WORLDS.reduce(
  (acc, w) => {
    acc[w.id] = w;
    return acc;
  },
  {} as Record<KartWorldId, KartWorldTheme>
);

function detectSoftwareGl(): boolean {
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return false;
  }
}

/** Procedural CanvasTexture generator (zero external assets / 404s) */
function makeCheckerTexture(
  c1: string,
  c2: string,
  squares = 8,
  anisotropy = 4
): THREE.CanvasTexture {
  const size = 256;
  const cv = document.createElement('canvas');
  cv.width = size;
  cv.height = size;
  const ctx = cv.getContext('2d')!;
  const step = size / squares;
  for (let y = 0; y < squares; y++) {
    for (let x = 0; x < squares; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? c1 : c2;
      ctx.fillRect(x * step, y * step, step, step);
    }
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = anisotropy;
  return tex;
}

function makeRainbowRoadTexture(anisotropy = 4): THREE.CanvasTexture {
  const size = 256;
  const cv = document.createElement('canvas');
  cv.width = size;
  cv.height = size;
  const ctx = cv.getContext('2d')!;
  const bands = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#38bdf8', '#6366f1', '#ec4899'];
  const bw = size / bands.length;
  bands.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(i * bw, 0, bw + 1, size);
  });
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  for (let y = 0; y < size; y += 32) {
    ctx.fillRect(0, y, size, 6);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = anisotropy;
  return tex;
}

function makeQuestionBlockTexture(anisotropy = 4): THREE.CanvasTexture {
  const size = 128;
  const cv = document.createElement('canvas');
  cv.width = size;
  cv.height = size;
  const ctx = cv.getContext('2d')!;
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, size - 10, size - 10);
  ctx.fillStyle = '#fef3c7';
  ctx.font = '900 84px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('?', size / 2, size / 2 + 6);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  return tex;
}

function makeContactShadowTexture(): THREE.CanvasTexture {
  const size = 128;
  const cv = document.createElement('canvas');
  cv.width = size;
  cv.height = size;
  const ctx = cv.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 60);
  grad.addColorStop(0, 'rgba(0,0,0,0.52)');
  grad.addColorStop(0.65, 'rgba(0,0,0,0.22)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Composite 10-part procedural 3D Mario Hero model (bottom-center pivoted at y=0).
 */
function buildHero3D(
  characterId: PartyCharacterId,
  opts: { withKart?: boolean; withBumperOrb?: boolean; shadowTex: THREE.Texture }
): THREE.Group {
  const spec = PARTY_CHARACTER_MAP[characterId];
  const root = new THREE.Group();

  const primaryMat = new THREE.MeshStandardMaterial({
    color: spec.primary,
    roughness: 0.35,
    metalness: 0.12,
  });
  const secondaryMat = new THREE.MeshStandardMaterial({
    color: spec.secondary,
    roughness: 0.62,
    metalness: 0.05,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: spec.accent,
    roughness: 0.22,
    metalness: 0.82,
  });
  const skinMat = new THREE.MeshStandardMaterial({
    color: spec.skin,
    roughness: 0.55,
    metalness: 0.0,
  });
  const bootMat = new THREE.MeshStandardMaterial({
    color: '#5c2d0c',
    roughness: 0.45,
    metalness: 0.15,
  });
  const whiteMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.3,
    metalness: 0.05,
  });
  const eyeMat = new THREE.MeshStandardMaterial({
    color: '#0f172a',
    roughness: 0.15,
    metalness: 0.2,
  });

  // Ground contact shadow plane
  const contactShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(opts.withKart ? 2.4 : 1.5, opts.withKart ? 2.9 : 1.5),
    new THREE.MeshBasicMaterial({
      map: opts.shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.6,
    })
  );
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = 0.025;
  contactShadow.name = 'contactShadow';
  root.add(contactShadow);

  // Fire-slow aura ring (shown when slowed by fire in Bowser Castle 3D)
  const slowAura = new THREE.Mesh(
    new THREE.TorusGeometry(0.95, 0.11, 8, 24),
    new THREE.MeshStandardMaterial({
      color: '#f97316',
      emissive: '#ef4444',
      emissiveIntensity: 0.9,
      roughness: 0.2,
    })
  );
  slowAura.rotation.x = Math.PI / 2;
  slowAura.position.y = 0.32;
  slowAura.visible = false;
  slowAura.name = 'fireSlowAura';
  root.add(slowAura);

  const actorYOffset = opts.withKart ? 0.52 : opts.withBumperOrb ? 0.95 : 0;

  // Optional 8-part 3D Mario Kart
  if (opts.withKart) {
    const kart = new THREE.Group();
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.38, 2.25), primaryMat);
    chassis.position.set(0, 0.42, 0);
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    kart.add(chassis);

    const nose = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.68, 0.72, 12),
      secondaryMat
    );
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 0.38, -1.3);
    nose.castShadow = true;
    kart.add(nose);

    const bumper = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.18, 0.28), accentMat);
    bumper.position.set(0, 0.28, -1.52);
    kart.add(bumper);

    const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 0.34), accentMat);
    spoiler.position.set(0, 0.95, 1.02);
    spoiler.rotation.x = 0.22;
    spoiler.castShadow = true;
    kart.add(spoiler);

    const pipeMat = new THREE.MeshStandardMaterial({
      color: '#cbd5e1',
      roughness: 0.18,
      metalness: 0.92,
    });
    for (const sx of [-0.36, 0.36]) {
      const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.56, 10), pipeMat);
      exhaust.rotation.x = Math.PI / 2.6;
      exhaust.position.set(sx, 0.62, 1.2);
      kart.add(exhaust);
    }

    const tireMat = new THREE.MeshStandardMaterial({
      color: '#1e293b',
      roughness: 0.82,
      metalness: 0.05,
    });
    const wheelPositions: [number, number, number][] = [
      [-0.86, 0.34, -0.78],
      [0.86, 0.34, -0.78],
      [-0.92, 0.4, 0.78],
      [0.92, 0.4, 0.78],
    ];
    for (const [wx, wy, wz] of wheelPositions) {
      const wheelGrp = new THREE.Group();
      wheelGrp.position.set(wx, wy, wz);
      const tire = new THREE.Mesh(
        new THREE.CylinderGeometry(wy, wy, 0.34, 16),
        tireMat
      );
      tire.rotation.z = Math.PI / 2;
      tire.castShadow = true;
      wheelGrp.add(tire);
      const hub = new THREE.Mesh(
        new THREE.CylinderGeometry(wy * 0.52, wy * 0.52, 0.37, 12),
        accentMat
      );
      hub.rotation.z = Math.PI / 2;
      wheelGrp.add(hub);
      kart.add(wheelGrp);
    }
    root.add(kart);
  }

  // Optional glossy Bumper Orb
  if (opts.withBumperOrb) {
    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.95, 24, 18),
      new THREE.MeshPhysicalMaterial({
        color: spec.primary,
        roughness: 0.16,
        metalness: 0.32,
        clearcoat: 1.0,
      })
    );
    orb.position.y = 0.95;
    orb.castShadow = true;
    orb.name = 'bumperOrb';
    root.add(orb);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.96, 0.09, 10, 28),
      accentMat
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.95;
    root.add(ring);
  }

  // Hero Body Assembly
  const hero = new THREE.Group();
  hero.position.y = actorYOffset;
  hero.name = 'heroBody';

  if (!opts.withKart) {
    for (const sx of [-0.22, 0.22]) {
      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.24, 0.44), bootMat);
      boot.position.set(sx, 0.12, -0.04);
      boot.castShadow = true;
      hero.add(boot);
    }
  }

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.44, 0.72, 14), secondaryMat);
  torso.position.y = 0.58;
  torso.castShadow = true;
  hero.add(torso);

  for (const sx of [-0.14, 0.14]) {
    const btn = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 10), accentMat);
    btn.position.set(sx, 0.64, -0.37);
    hero.add(btn);
  }

  for (const sx of [-0.52, 0.52]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.26, 6, 10), primaryMat);
    arm.position.set(sx, 0.62, -0.05);
    arm.rotation.z = sx < 0 ? 0.35 : -0.35;
    arm.castShadow = true;
    hero.add(arm);

    const glove = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), whiteMat);
    glove.position.set(sx * 1.08, 0.44, -0.14);
    hero.add(glove);
  }

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.39, 18, 16), skinMat);
  head.position.y = 1.24;
  head.castShadow = true;
  hero.add(head);

  for (const sx of [-0.13, 0.13]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), eyeMat);
    eye.position.set(sx, 1.28, -0.35);
    hero.add(eye);
  }
  const noseBall = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), skinMat);
  noseBall.position.set(0, 1.2, -0.4);
  hero.add(noseBall);

  if (characterId === 'rosa' || characterId === 'rosy') {
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.18, 0.24, 6), accentMat);
    crown.position.y = 1.66;
    crown.castShadow = true;
    hero.add(crown);
  } else if (characterId === 'toady') {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 14), whiteMat);
    cap.scale.set(1.12, 0.82, 1.12);
    cap.position.y = 1.56;
    cap.castShadow = true;
    hero.add(cap);
    for (const [dx, dz] of [
      [0, -0.45],
      [0.42, 0],
      [-0.42, 0],
      [0, 0.45],
    ]) {
      const spot = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 10), primaryMat);
      spot.position.set(dx, 1.58, dz);
      hero.add(spot);
    }
  } else {
    const capDome = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58),
      primaryMat
    );
    capDome.position.y = 1.3;
    capDome.castShadow = true;
    hero.add(capDome);

    const visor = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.08, 12), primaryMat);
    visor.scale.set(1, 1, 0.72);
    visor.position.set(0, 1.44, -0.32);
    visor.rotation.x = 0.16;
    hero.add(visor);

    const badge = new THREE.Mesh(new THREE.CircleGeometry(0.12, 14), whiteMat);
    badge.position.set(0, 1.52, -0.39);
    badge.rotation.y = Math.PI;
    hero.add(badge);
  }

  root.add(hero);
  return root;
}

function buildCoin3D(): THREE.Mesh {
  const mat = new THREE.MeshStandardMaterial({
    color: '#facc15',
    emissive: '#92400e',
    emissiveIntensity: 0.22,
    roughness: 0.18,
    metalness: 0.92,
  });
  const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.12, 16), mat);
  coin.rotation.x = Math.PI / 2;
  coin.castShadow = true;
  return coin;
}

function buildStar3D(): THREE.Group {
  const grp = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: '#fde047',
    emissive: '#f59e0b',
    emissiveIntensity: 0.45,
    roughness: 0.16,
    metalness: 0.85,
  });
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), mat);
  core.castShadow = true;
  grp.add(core);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.07, 8, 20), mat);
  grp.add(ring);
  return grp;
}

function buildShell3D(color = '#16a34a'): THREE.Group {
  const grp = new THREE.Group();
  const shellMat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.24,
    metalness: 0.25,
  });
  const rimMat = new THREE.MeshStandardMaterial({
    color: '#fef9c3',
    roughness: 0.5,
    metalness: 0.05,
  });
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(0.58, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.6),
    shellMat
  );
  dome.position.y = 0.2;
  dome.castShadow = true;
  grp.add(dome);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.11, 8, 18), rimMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.22;
  grp.add(rim);
  return grp;
}

/** 3D Road Barricade obstacle for Mario Kart 3D */
function buildRoadBarricade3D(): THREE.Group {
  const grp = new THREE.Group();
  const legMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.5, metalness: 0.6 });
  const redMat = new THREE.MeshStandardMaterial({ color: '#ef4444', roughness: 0.35 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.35 });
  const lampMat = new THREE.MeshStandardMaterial({
    color: '#facc15',
    emissive: '#f59e0b',
    emissiveIntensity: 0.8,
  });
  for (const sx of [-0.95, 0.95]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.05, 0.32), legMat);
    leg.position.set(sx, 0.52, 0);
    leg.castShadow = true;
    grp.add(leg);
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), lampMat);
    beacon.position.set(sx, 1.15, 0);
    grp.add(beacon);
  }
  for (let i = 0; i < 5; i++) {
    const plank = new THREE.Mesh(
      new THREE.BoxGeometry(0.44, 0.34, 0.16),
      i % 2 === 0 ? redMat : whiteMat
    );
    plank.position.set(-0.88 + i * 0.44, 0.78, 0);
    plank.castShadow = true;
    grp.add(plank);
  }
  return grp;
}

/** 3D Banana Peel obstacle for Mario Kart 3D */
function buildBananaPeel3D(): THREE.Group {
  const grp = new THREE.Group();
  const yMat = new THREE.MeshStandardMaterial({ color: '#facc15', roughness: 0.32, metalness: 0.08 });
  const tipMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.7 });
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.24, 0.48, 10), yMat);
  stem.position.y = 0.36;
  stem.castShadow = true;
  grp.add(stem);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.14, 8), tipMat);
  top.position.y = 0.65;
  grp.add(top);
  for (let i = 0; i < 3; i++) {
    const ang = (i / 3) * Math.PI * 2;
    const petal = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.09, 0.62), yMat);
    petal.position.set(Math.cos(ang) * 0.34, 0.12, Math.sin(ang) * 0.34);
    petal.rotation.y = -ang + Math.PI / 2;
    petal.rotation.x = 0.25;
    grp.add(petal);
  }
  return grp;
}

/** 3D Traffic Cones + Barrel cluster obstacle for Mario Kart 3D */
function buildBarrelCones3D(): THREE.Group {
  const grp = new THREE.Group();
  const barrelMat = new THREE.MeshStandardMaterial({ color: '#92400e', roughness: 0.72 });
  const bandMat = new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.3, metalness: 0.8 });
  const coneMat = new THREE.MeshStandardMaterial({ color: '#f97316', roughness: 0.38 });
  const stripeMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.35 });

  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.54, 1.05, 14), barrelMat);
  barrel.position.set(-0.32, 0.52, 0);
  barrel.castShadow = true;
  grp.add(barrel);
  for (const by of [0.28, 0.78]) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.05, 6, 16), bandMat);
    band.rotation.x = Math.PI / 2;
    band.position.set(-0.32, by, 0);
    grp.add(band);
  }
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.85, 12), coneMat);
  cone.position.set(0.55, 0.42, 0.12);
  cone.castShadow = true;
  grp.add(cone);
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.18, 12), stripeMat);
  ring.position.set(0.55, 0.48, 0.12);
  grp.add(ring);
  return grp;
}

/** 3D Molten Lava Fire Pool (slows player down in Bowser Castle 3D) */
function buildLavaFirePool3D(): THREE.Group {
  const grp = new THREE.Group();
  const poolMat = new THREE.MeshStandardMaterial({
    color: '#ea580c',
    emissive: '#ef4444',
    emissiveIntensity: 0.9,
    roughness: 0.25,
  });
  const flameMat = new THREE.MeshStandardMaterial({
    color: '#fde047',
    emissive: '#f97316',
    emissiveIntensity: 0.95,
    roughness: 0.2,
  });
  const puddle = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.32, 0.14, 18), poolMat);
  puddle.position.y = 0.07;
  grp.add(puddle);
  for (let i = 0; i < 4; i++) {
    const ang = (i / 4) * Math.PI * 2;
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.72, 7), flameMat);
    flame.position.set(Math.cos(ang) * 0.56, 0.36, Math.sin(ang) * 0.56);
    grp.add(flame);
  }
  return grp;
}

function buildWarpPipe3D(height = 2.2): THREE.Group {
  const grp = new THREE.Group();
  const pipeMat = new THREE.MeshStandardMaterial({
    color: '#16a34a',
    roughness: 0.26,
    metalness: 0.35,
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: '#052e16',
    roughness: 0.9,
  });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.76, height, 18), pipeMat);
  body.position.y = height / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  grp.add(body);
  const lip = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.92, 0.45, 18), pipeMat);
  lip.position.y = height - 0.18;
  lip.castShadow = true;
  grp.add(lip);
  const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 0.08, 16), darkMat);
  hole.position.y = height + 0.02;
  grp.add(hole);
  return grp;
}

/** World-specific roadside 3D scenery prop for Mario Kart 3D */
function buildKartWorldProp(worldId: KartWorldId): THREE.Object3D {
  const grp = new THREE.Group();
  if (worldId === 'desert') {
    const pyr = new THREE.Mesh(
      new THREE.ConeGeometry(2.3, 3.6, 4),
      new THREE.MeshStandardMaterial({ color: '#d97706', roughness: 0.78 })
    );
    pyr.position.y = 1.8;
    grp.add(pyr);
    const cactus = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.32, 1.5, 6, 8),
      new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.7 })
    );
    cactus.position.set(1.8, 1.1, 0.9);
    grp.add(cactus);
    return grp;
  }
  if (worldId === 'ice') {
    const crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.5, 0),
      new THREE.MeshPhysicalMaterial({
        color: '#bae6fd',
        roughness: 0.15,
        metalness: 0.18,
        clearcoat: 1.0,
      })
    );
    crystal.scale.set(0.85, 1.8, 0.85);
    crystal.position.y = 1.8;
    grp.add(crystal);
    return grp;
  }
  if (worldId === 'lava') {
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.65, 0.95, 4.2, 8),
      new THREE.MeshStandardMaterial({ color: '#292524', roughness: 0.75 })
    );
    pillar.position.y = 2.1;
    grp.add(pillar);
    const brazier = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 10, 8),
      new THREE.MeshStandardMaterial({
        color: '#fb923c',
        emissive: '#ef4444',
        emissiveIntensity: 0.95,
      })
    );
    brazier.position.y = 4.4;
    grp.add(brazier);
    return grp;
  }
  if (worldId === 'rainbow') {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.6, 0.22, 10, 24),
      new THREE.MeshStandardMaterial({
        color: '#facc15',
        emissive: '#ec4899',
        emissiveIntensity: 0.75,
        roughness: 0.2,
        metalness: 0.8,
      })
    );
    ring.position.y = 2.6;
    grp.add(ring);
    return grp;
  }
  // Mushroom Kingdom default: Warp Pipe
  return buildWarpPipe3D(2.8);
}

export const MiniGames3DCanvas: React.FC<MiniGamePlayProps> = ({
  gameId,
  seed,
  durationSec,
  characterId,
  rivalCharacterId,
  rivalProgress = 0,
  lang,
  onLiveUpdate,
}) => {
  const ar = lang === 'ar';
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [hudScore, setHudScore] = useState(0);
  const [hudTime, setHudTime] = useState(durationSec);
  const [hudBanner, setHudBanner] = useState('');
  const [isFireSlowed, setIsFireSlowed] = useState(false);

  // Mario Kart 3D World state (supports picking any of 5 worlds OR auto-cycling worlds!)
  const [kartWorldMode, setKartWorldMode] = useState<'auto' | KartWorldId>('auto');
  const [activeKartWorld, setActiveKartWorld] = useState<KartWorldId>('mushroom');
  const kartWorldModeRef = useRef<'auto' | KartWorldId>('auto');
  kartWorldModeRef.current = kartWorldMode;

  const keysRef = useRef<Record<string, boolean>>({});
  const jumpQueuedRef = useRef(false);
  const rivalProgressRef = useRef(rivalProgress);
  rivalProgressRef.current = rivalProgress;
  const onLiveUpdateRef = useRef(onLiveUpdate);
  onLiveUpdateRef.current = onLiveUpdate;

  const spec = MARIO_MINI_GAME_MAP[gameId];

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareGl();
    const rng = mulberry32(seed || 2026);

    const width = container.clientWidth || 720;
    const height = container.clientHeight || 420;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    // Studio environment reflections
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envRT.texture;
    pmrem.dispose();

    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const shadowTex = makeContactShadowTexture();
    const qBlockTex = makeQuestionBlockTexture(maxAniso);

    const isLavaCastle = gameId === 'bowser_tower_3d';
    const isKart = gameId === 'kart_drift_3d';
    const obstacleCount = isKart ? 12 : 11;

    const initialWorldId: KartWorldId =
      kartWorldModeRef.current === 'auto' ? 'mushroom' : kartWorldModeRef.current;
    let appliedKartWorld: KartWorldId = initialWorldId;
    if (isKart) setActiveKartWorld(initialWorldId);

    const skyHex = isLavaCastle
      ? 0x2b0b08
      : isKart
      ? KART_WORLD_MAP[initialWorldId].skyHex
      : gameId === 'bumper_arena_3d'
      ? 0x1e2b6b
      : 0x38bdf8;
    scene.background = new THREE.Color(skyHex);
    scene.fog = new THREE.Fog(skyHex, 24, 92);

    const camera = new THREE.PerspectiveCamera(56, width / height, 0.2, 160);

    // 3-point warm/cool studio lighting rig
    const hemi = new THREE.HemisphereLight(
      isLavaCastle ? 0xff9e64 : 0xe0f2fe,
      isLavaCastle ? 0x450a0a : 0x14532d,
      0.85
    );
    scene.add(hemi);

    const sun = new THREE.DirectionalLight(isLavaCastle ? 0xffedd5 : 0xfff7ed, 1.55);
    sun.position.set(14, 24, 16);
    if (!isSoftwareGl) {
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      sun.shadow.camera.near = 2;
      sun.shadow.camera.far = 75;
      const d = 22;
      sun.shadow.camera.left = -d;
      sun.shadow.camera.right = d;
      sun.shadow.camera.top = d;
      sun.shadow.camera.bottom = -d;
      sun.shadow.bias = -0.0005;
      sun.shadow.normalBias = 0.02;
    }
    scene.add(sun);

    const rimLight = new THREE.DirectionalLight(isLavaCastle ? 0xf97316 : 0x60a5fa, 0.55);
    rimLight.position.set(-14, 10, -18);
    scene.add(rimLight);

    const playerMesh = buildHero3D(characterId, {
      withKart: isKart,
      withBumperOrb: gameId === 'bumper_arena_3d',
      shadowTex,
    });
    scene.add(playerMesh);

    const rivalMesh = buildHero3D(
      rivalCharacterId ?? (characterId === 'koopa' ? 'wario' : 'koopa'),
      {
        withKart: isKart,
        withBumperOrb: gameId === 'bumper_arena_3d',
        shadowTex,
      }
    );
    scene.add(rivalMesh);

    const fireSlowAuraObj = playerMesh.getObjectByName('fireSlowAura');

    // Shared game state
    let score = 0;
    let finished = false;
    let lastHudPush = 0;
    let px = 0;
    let py = 0;
    let pz = 0;
    let vx = 0;
    let vy = 0;
    let vz = 0;
    let jumpsLeft = 2;
    let boostTimer = 0;
    let stunTimer = 0;
    let fireSlowTimer = 0;
    let fireHitGrace = 0;

    interface PickupItem {
      mesh: THREE.Object3D;
      x: number;
      y: number;
      z: number;
      kind: 'coin' | 'star' | 'boost';
      active: boolean;
      respawnAt: number;
    }
    interface HazardItem {
      mesh: THREE.Object3D;
      x: number;
      y: number;
      z: number;
      vx: number;
      vz: number;
      radius: number;
      kind?: 'firebar' | 'lavapool' | 'barricade' | 'banana' | 'barrel' | 'shell';
    }
    interface PlatformTile {
      mesh: THREE.Object3D;
      x: number;
      y: number;
      z: number;
      rx: number;
      rz: number;
      isSpring?: boolean;
    }

    const pickups: PickupItem[] = [];
    const hazards: HazardItem[] = [];
    const platforms: PlatformTile[] = [];
    const scrollScenery: THREE.Object3D[] = [];
    const kartPropSlots: { z: number; side: number; obj: THREE.Object3D }[] = [];

    // References for dynamic world switching in Mario Kart 3D
    let kartRoadMat: THREE.MeshStandardMaterial | null = null;
    let kartSeaMat: THREE.MeshStandardMaterial | null = null;
    let kartCurbMatA: THREE.MeshStandardMaterial | null = null;
    let kartCurbMatB: THREE.MeshStandardMaterial | null = null;
    const worldRoadTextures: Partial<Record<KartWorldId, THREE.CanvasTexture>> = {};

    const addPoints = (delta: number, bannerText?: string) => {
      score = Math.max(0, score + delta);
      setHudScore(score);
      if (bannerText) setHudBanner(bannerText);
    };

    const applyKartWorldTheme = (worldId: KartWorldId, announce = false) => {
      const theme = KART_WORLD_MAP[worldId];
      appliedKartWorld = worldId;
      setActiveKartWorld(worldId);

      scene.background = new THREE.Color(theme.skyHex);
      scene.fog = new THREE.Fog(theme.skyHex, 24, 92);
      hemi.color.setHex(theme.hemiSky);
      hemi.groundColor.setHex(theme.hemiGround);
      sun.color.setHex(theme.sunColor);
      rimLight.color.setHex(theme.rimColor);

      if (kartRoadMat) {
        if (!worldRoadTextures[worldId]) {
          const tex = theme.isRainbowRoad
            ? makeRainbowRoadTexture(maxAniso)
            : makeCheckerTexture(theme.roadA, theme.roadB, 6, maxAniso);
          tex.repeat.set(theme.isRainbowRoad ? 1 : 2, 18);
          worldRoadTextures[worldId] = tex;
        }
        kartRoadMat.map = worldRoadTextures[worldId]!;
        kartRoadMat.emissive.set(theme.isRainbowRoad ? '#312e81' : '#000000');
        kartRoadMat.emissiveIntensity = theme.isRainbowRoad ? 0.35 : 0;
        kartRoadMat.needsUpdate = true;
      }
      if (kartSeaMat) {
        kartSeaMat.color.set(theme.seaColor);
        kartSeaMat.emissive.set(theme.seaEmissive);
        kartSeaMat.emissiveIntensity = theme.seaEmissiveInt;
      }
      if (kartCurbMatA) kartCurbMatA.color.set(theme.curbA);
      if (kartCurbMatB) kartCurbMatB.color.set(theme.curbB);

      // Swap roadside 3D props to match the new world!
      for (const slot of kartPropSlots) {
        const curZ = slot.obj.position.z;
        scene.remove(slot.obj);
        const nextObj = buildKartWorldProp(worldId);
        nextObj.position.set(slot.side * 8.4, -1.6, curZ);
        scene.add(nextObj);
        slot.obj = nextObj;
      }

      if (announce) {
        partyAudio.playStar();
        setHudBanner(
          ar ? `🌍 الدخول إلى ${theme.nameAr}!` : `🌍 Entering ${theme.nameEn}!`
        );
      }
    };

    // Decorative clouds in sky
    if (!isLavaCastle) {
      const cloudMat = new THREE.MeshStandardMaterial({
        color: '#ffffff',
        roughness: 0.85,
        metalness: 0,
      });
      for (let i = 0; i < 14; i++) {
        const cl = new THREE.Group();
        for (let k = -1; k <= 1; k++) {
          const puff = new THREE.Mesh(
            new THREE.SphereGeometry(k === 0 ? 2.2 : 1.5, 10, 8),
            cloudMat
          );
          puff.position.set(k * 1.6, k === 0 ? 0.4 : 0, 0);
          cl.add(puff);
        }
        cl.position.set((rng() - 0.5) * 90, 12 + rng() * 10, -10 - rng() * 65);
        scene.add(cl);
      }
    }

    // =========================================================
    // SCENE SETUP FOR EACH OF THE 5 THREE.JS 3D MARIO GAMES
    // =========================================================
    if (isKart || isLavaCastle) {
      const initTheme = isKart ? KART_WORLD_MAP[initialWorldId] : KART_WORLD_MAP.lava;
      const roadTex = initTheme.isRainbowRoad
        ? makeRainbowRoadTexture(maxAniso)
        : makeCheckerTexture(initTheme.roadA, initTheme.roadB, 6, maxAniso);
      roadTex.repeat.set(initTheme.isRainbowRoad ? 1 : 2, 18);
      if (isKart) worldRoadTextures[initialWorldId] = roadTex;

      const roadMat = new THREE.MeshStandardMaterial({
        map: roadTex,
        roughness: 0.72,
        metalness: 0.1,
      });
      if (isKart) kartRoadMat = roadMat;

      const road = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.5, 130), roadMat);
      road.position.set(0, -0.25, -48);
      road.receiveShadow = true;
      scene.add(road);

      const seaMat = new THREE.MeshStandardMaterial({
        color: initTheme.seaColor,
        emissive: initTheme.seaEmissive,
        emissiveIntensity: initTheme.seaEmissiveInt,
        roughness: isLavaCastle ? 0.35 : 0.88,
      });
      if (isKart) kartSeaMat = seaMat;

      const outerSea = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), seaMat);
      outerSea.rotation.x = -Math.PI / 2;
      outerSea.position.set(0, -1.8, -45);
      scene.add(outerSea);

      const curbMatA = new THREE.MeshStandardMaterial({ color: initTheme.curbA, roughness: 0.4 });
      const curbMatB = new THREE.MeshStandardMaterial({ color: initTheme.curbB, roughness: 0.4 });
      if (isKart) {
        kartCurbMatA = curbMatA;
        kartCurbMatB = curbMatB;
      }

      for (let i = 0; i < 18; i++) {
        const zPos = 8 - i * 7;
        for (const sx of [-5.5, 5.5]) {
          const post = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, isLavaCastle ? 1.8 : 0.55, 4.5),
            i % 2 === 0 ? curbMatA : curbMatB
          );
          post.position.set(sx, isLavaCastle ? 0.6 : 0.15, zPos);
          scene.add(post);
          scrollScenery.push(post);
        }
        if (i % 3 === 0) {
          const side = i % 2 === 0 ? -1 : 1;
          const prop = isKart
            ? buildKartWorldProp(initialWorldId)
            : buildKartWorldProp('lava');
          prop.position.set(side * 8.4, -1.6, zPos);
          scene.add(prop);
          if (isKart) {
            kartPropSlots.push({ z: zPos, side, obj: prop });
          } else {
            scrollScenery.push(prop);
          }
        }
      }

      // Coins, Stars, Boost Pads
      const lanes = [-3.1, 0, 3.1];
      const boostMat = new THREE.MeshStandardMaterial({
        color: '#38bdf8',
        emissive: '#0ea5e9',
        emissiveIntensity: 0.7,
        roughness: 0.2,
        metalness: 0.5,
      });
      for (let i = 0; i < 16; i++) {
        const lane = lanes[Math.floor(rng() * 3)];
        const isStar = i % 5 === 0;
        const isBoost = !isStar && i % 4 === 1;
        const mesh = isStar
          ? buildStar3D()
          : isBoost
          ? new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.08, 2.4), boostMat)
          : buildCoin3D();
        const yPos = isBoost ? 0.04 : 1.05;
        const zPos = -14 - i * 6.5;
        mesh.position.set(lane, yPos, zPos);
        scene.add(mesh);
        pickups.push({
          mesh,
          x: lane,
          y: yPos,
          z: zPos,
          kind: isStar ? 'star' : isBoost ? 'boost' : 'coin',
          active: true,
          respawnAt: 0,
        });
      }

      // Hazards / Obstacles
      for (let i = 0; i < obstacleCount; i++) {
        const lane = lanes[Math.floor(rng() * 3)];
        let mesh: THREE.Object3D;
        let radius = 0.9;
        let kind: HazardItem['kind'] = 'shell';
        let hVx = 0;

        if (isLavaCastle) {
          // Alternate between Spinning 3D Bowser Fire-Bars and Molten Lava Fire Pools (both SLOW you down!)
          if (i % 2 === 0) {
            const barGrp = new THREE.Group();
            const fireMat = new THREE.MeshStandardMaterial({
              color: '#fb923c',
              emissive: '#ea580c',
              emissiveIntensity: 0.9,
              roughness: 0.2,
            });
            for (let b = -1; b <= 1; b++) {
              const orb = new THREE.Mesh(new THREE.SphereGeometry(0.46, 10, 10), fireMat);
              orb.position.set(b * 0.74, 0.56, 0);
              barGrp.add(orb);
            }
            mesh = barGrp;
            radius = 1.1;
            kind = 'firebar';
          } else {
            mesh = buildLavaFirePool3D();
            radius = 1.2;
            kind = 'lavapool';
          }
        } else {
          // Rich Mario Kart 3D Obstacles: Barricade, Barrel+Cones, Banana Peel, Koopa Shell!
          const roll = i % 4;
          if (roll === 0) {
            mesh = buildRoadBarricade3D();
            radius = 1.15;
            kind = 'barricade';
          } else if (roll === 1) {
            mesh = buildBarrelCones3D();
            radius = 1.05;
            kind = 'barrel';
          } else if (roll === 2) {
            mesh = buildBananaPeel3D();
            radius = 0.8;
            kind = 'banana';
          } else {
            mesh = buildShell3D(i % 8 === 3 ? '#dc2626' : '#16a34a');
            radius = 0.85;
            kind = 'shell';
            hVx = i % 8 === 3 ? (rng() < 0.5 ? 2.4 : -2.4) : 0;
          }
        }

        const zPos = -20 - i * 8.8;
        mesh.position.set(lane, 0.04, zPos);
        scene.add(mesh);
        hazards.push({
          mesh,
          x: lane,
          y: 0.04,
          z: zPos,
          vx: hVx,
          vz: 0,
          radius,
          kind,
        });
      }

      px = 0;
      py = 0;
      pz = 2.5;
      rivalMesh.position.set(2.8, 0, -2);
      camera.position.set(0, 6.2, 11.2);
      camera.lookAt(0, 1.2, -12);
    } else if (gameId === 'sky_island_hop_3d') {
      const cloudFloor = new THREE.Mesh(
        new THREE.PlaneGeometry(240, 240),
        new THREE.MeshStandardMaterial({ color: '#e0f2fe', roughness: 0.95 })
      );
      cloudFloor.rotation.x = -Math.PI / 2;
      cloudFloor.position.y = -7;
      scene.add(cloudFloor);

      const grassTex = makeCheckerTexture('#22c55e', '#16a34a', 4, maxAniso);
      const islandMat = new THREE.MeshStandardMaterial({ map: grassTex, roughness: 0.7 });
      const dirtMat = new THREE.MeshStandardMaterial({ color: '#92400e', roughness: 0.85 });
      const springMat = new THREE.MeshStandardMaterial({
        color: '#ef4444',
        roughness: 0.3,
        metalness: 0.15,
      });

      const addIsland = (x: number, y: number, z: number, rx: number, rz: number, isSpring = false) => {
        const grp = new THREE.Group();
        if (isSpring) {
          const cap = new THREE.Mesh(
            new THREE.CylinderGeometry(rx, rx * 0.82, 0.55, 18),
            springMat
          );
          cap.position.y = -0.28;
          cap.receiveShadow = true;
          grp.add(cap);
          const stem = new THREE.Mesh(
            new THREE.CylinderGeometry(rx * 0.45, rx * 0.52, 1.8, 12),
            new THREE.MeshStandardMaterial({ color: '#fef3c7', roughness: 0.7 })
          );
          stem.position.y = -1.35;
          grp.add(stem);
        } else {
          const top = new THREE.Mesh(new THREE.BoxGeometry(rx * 2, 0.55, rz * 2), islandMat);
          top.position.y = -0.28;
          top.receiveShadow = true;
          grp.add(top);
          const base = new THREE.Mesh(
            new THREE.BoxGeometry(rx * 1.75, 1.3, rz * 1.75),
            dirtMat
          );
          base.position.y = -1.2;
          grp.add(base);
        }
        grp.position.set(x, y, z);
        scene.add(grp);
        platforms.push({ mesh: grp, x, y, z, rx, rz, isSpring });
      };

      addIsland(0, 0, 0, 4.6, 4.6, false);
      const ringCoords: [number, number, number, boolean][] = [
        [-6.5, 0.9, -4.5, false],
        [6.5, 0.9, -4.5, false],
        [0, 1.8, -8.5, true],
        [-7.2, 1.6, 3.8, true],
        [7.2, 1.6, 3.8, false],
        [0, 1.0, 7.6, false],
        [-3.5, 2.7, -13.0, false],
        [3.5, 2.7, -13.0, false],
      ];
      for (const [ix, iy, iz, spring] of ringCoords) {
        addIsland(ix, iy, iz, spring ? 2.1 : 2.8, spring ? 2.1 : 2.8, spring);
        const item = spring ? buildStar3D() : buildCoin3D();
        item.position.set(ix, iy + 1.25, iz);
        scene.add(item);
        pickups.push({
          mesh: item,
          x: ix,
          y: iy + 1.25,
          z: iz,
          kind: spring ? 'star' : 'coin',
          active: true,
          respawnAt: 0,
        });
      }

      const qBlock = new THREE.Mesh(
        new THREE.BoxGeometry(1.3, 1.3, 1.3),
        new THREE.MeshStandardMaterial({ map: qBlockTex, roughness: 0.35, metalness: 0.25 })
      );
      qBlock.position.set(0, 3.1, 0);
      scene.add(qBlock);
      const topStar = buildStar3D();
      topStar.position.set(0, 4.5, 0);
      scene.add(topStar);
      pickups.push({
        mesh: topStar,
        x: 0,
        y: 4.5,
        z: 0,
        kind: 'star',
        active: true,
        respawnAt: 0,
      });

      px = 0;
      py = 0.05;
      pz = 1.6;
      rivalMesh.position.set(-2, 0.05, -1.5);
      camera.position.set(0, 10.5, 13.5);
      camera.lookAt(0, 1.2, -2);
    } else if (gameId === 'bumper_arena_3d') {
      const arenaTex = makeCheckerTexture('#4f46e5', '#6366f1', 8, maxAniso);
      const disc = new THREE.Mesh(
        new THREE.CylinderGeometry(10.5, 9.6, 1.2, 36),
        new THREE.MeshStandardMaterial({ map: arenaTex, roughness: 0.55, metalness: 0.15 })
      );
      disc.position.y = -0.6;
      disc.receiveShadow = true;
      scene.add(disc);

      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(10.5, 0.32, 12, 48),
        new THREE.MeshStandardMaterial({
          color: '#facc15',
          emissive: '#a16207',
          emissiveIntensity: 0.35,
          roughness: 0.22,
          metalness: 0.85,
        })
      );
      rim.rotation.x = Math.PI / 2;
      rim.position.y = 0.05;
      scene.add(rim);

      const botColors = ['#16a34a', '#ef4444', '#f97316', '#06b6d4'];
      for (let i = 0; i < 4; i++) {
        const ang = (i / 4) * Math.PI * 2 + 0.4;
        const bot = buildShell3D(botColors[i]);
        bot.scale.setScalar(1.35);
        const bx = Math.cos(ang) * 5.6;
        const bz = Math.sin(ang) * 5.6;
        bot.position.set(bx, 0, bz);
        scene.add(bot);
        hazards.push({
          mesh: bot,
          x: bx,
          y: 0,
          z: bz,
          vx: (rng() - 0.5) * 4,
          vz: (rng() - 0.5) * 4,
          radius: 0.95,
        });
      }

      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2;
        const r = 4.2 + (i % 2) * 3.1;
        const isStar = i % 2 === 0;
        const mesh = isStar ? buildStar3D() : buildCoin3D();
        const x = Math.cos(ang) * r;
        const z = Math.sin(ang) * r;
        mesh.position.set(x, 1.1, z);
        scene.add(mesh);
        pickups.push({
          mesh,
          x,
          y: 1.1,
          z,
          kind: isStar ? 'star' : 'coin',
          active: true,
          respawnAt: 0,
        });
      }

      px = 0;
      py = 0;
      pz = 3.5;
      rivalMesh.position.set(0, 0, -4.5);
      camera.position.set(0, 14.5, 14.5);
      camera.lookAt(0, 0.5, 0);
    } else {
      const turfTex = makeCheckerTexture('#16a34a', '#15803d', 12, maxAniso);
      turfTex.repeat.set(3, 3);
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(160, 160),
        new THREE.MeshStandardMaterial({ map: turfTex, roughness: 0.82 })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);

      for (let i = 0; i < 12; i++) {
        const ang = (i / 12) * Math.PI * 2;
        const pipe = buildWarpPipe3D(2.6 + (i % 2) * 0.9);
        pipe.position.set(Math.cos(ang) * 12.2, 0, Math.sin(ang) * 12.2);
        scene.add(pipe);
      }

      const ped = new THREE.Mesh(
        new THREE.CylinderGeometry(2.1, 2.5, 0.6, 18),
        new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.3, metalness: 0.65 })
      );
      ped.position.y = 0.3;
      ped.receiveShadow = true;
      scene.add(ped);

      for (let i = 0; i < 14; i++) {
        const ang = rng() * Math.PI * 2;
        const r = 2.4 + rng() * 8.2;
        const isStar = i < 4;
        const mesh = isStar ? buildStar3D() : buildCoin3D();
        const x = Math.cos(ang) * r;
        const z = Math.sin(ang) * r;
        mesh.position.set(x, 1.0, z);
        scene.add(mesh);
        pickups.push({
          mesh,
          x,
          y: 1.0,
          z,
          kind: isStar ? 'star' : 'coin',
          active: true,
          respawnAt: 0,
        });
      }

      const stoneMat = new THREE.MeshStandardMaterial({
        color: '#64748b',
        roughness: 0.65,
        metalness: 0.25,
      });
      const spikeMat = new THREE.MeshStandardMaterial({
        color: '#ef4444',
        roughness: 0.3,
        metalness: 0.45,
      });
      for (let i = 0; i < 4; i++) {
        const grp = new THREE.Group();
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.95, 0), stoneMat);
        rock.castShadow = true;
        grp.add(rock);
        for (let s = 0; s < 4; s++) {
          const spike = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.55, 6), spikeMat);
          const a = (s / 4) * Math.PI * 2;
          spike.position.set(Math.cos(a) * 0.9, 0, Math.sin(a) * 0.9);
          spike.rotation.z = -Math.cos(a) * (Math.PI / 2);
          spike.rotation.x = Math.sin(a) * (Math.PI / 2);
          grp.add(spike);
        }
        const a = (i / 4) * Math.PI * 2;
        const hx = Math.cos(a) * 7.5;
        const hz = Math.sin(a) * 7.5;
        grp.position.set(hx, 0.95, hz);
        scene.add(grp);
        hazards.push({
          mesh: grp,
          x: hx,
          y: 0.95,
          z: hz,
          vx: Math.cos(a + 1.8) * 5.2,
          vz: Math.sin(a + 1.8) * 5.2,
          radius: 1.0,
        });
      }

      px = 0;
      py = 0;
      pz = 5.5;
      rivalMesh.position.set(-4, 0, -4);
      camera.position.set(0, 13.5, 15.5);
      camera.lookAt(0, 0.8, 0);
    }

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        if (e.code === 'Space') e.preventDefault();
        if (e.code === 'Space' || isKart || isLavaCastle) {
          jumpQueuedRef.current = true;
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || 720;
      const h = container.clientHeight || 420;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    let frameId = 0;
    let disposed = false;
    const startPerf = performance.now();
    let prevPerf = startPerf;

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    };

    const step = (dt: number, elapsed: number) => {
      const k = keysRef.current;
      const moveX =
        (k['ArrowRight'] || k['KeyD'] ? 1 : 0) - (k['ArrowLeft'] || k['KeyA'] ? 1 : 0);
      const moveZ =
        (k['ArrowDown'] || k['KeyS'] ? 1 : 0) - (k['ArrowUp'] || k['KeyW'] ? 1 : 0);

      if (boostTimer > 0) boostTimer = Math.max(0, boostTimer - dt);
      if (stunTimer > 0) stunTimer = Math.max(0, stunTimer - dt);
      if (fireHitGrace > 0) fireHitGrace = Math.max(0, fireHitGrace - dt);

      const wasSlowed = fireSlowTimer > 0;
      if (fireSlowTimer > 0) fireSlowTimer = Math.max(0, fireSlowTimer - dt);
      const nowSlowed = fireSlowTimer > 0;
      if (wasSlowed !== nowSlowed) {
        setIsFireSlowed(nowSlowed);
      }
      if (fireSlowAuraObj) {
        fireSlowAuraObj.visible = nowSlowed;
        if (nowSlowed) {
          fireSlowAuraObj.rotation.z += dt * 7;
          const pulse = 1 + Math.sin(elapsed * 16) * 0.1;
          fireSlowAuraObj.scale.set(pulse, pulse, 1);
        }
      }

      // Dynamic Mario Kart 3D World Switching (manual pick OR automatic cycle every 5.2s!)
      if (isKart) {
        const desiredWorld: KartWorldId =
          kartWorldModeRef.current === 'auto'
            ? KART_WORLDS[Math.floor(elapsed / 5.2) % KART_WORLDS.length].id
            : kartWorldModeRef.current;
        if (desiredWorld !== appliedKartWorld) {
          applyKartWorldTheme(desiredWorld, true);
        }
      }

      // Animate all pickups
      for (const p of pickups) {
        if (!p.active && elapsed >= p.respawnAt) {
          p.active = true;
          p.mesh.visible = true;
        }
        if (p.active && p.kind !== 'boost') {
          p.mesh.rotation.y += dt * 3.1;
          p.mesh.position.y = p.y + Math.sin(elapsed * 4 + p.x) * 0.16;
        }
      }

      if (isKart || isLavaCastle) {
        // In Bowser Castle 3D, fire noticeably slows down your forward speed & steering!
        const baseSpeed = isLavaCastle && fireSlowTimer > 0
          ? 8.5
          : boostTimer > 0
          ? 34
          : stunTimer > 0
          ? 10.5
          : 22;
        const speed = baseSpeed + elapsed * 0.3;
        const steerSpeed = isLavaCastle && fireSlowTimer > 0 ? 6.2 : 11.5;

        px = THREE.MathUtils.clamp(px + moveX * steerSpeed * dt, -4.1, 4.1);

        if (jumpQueuedRef.current && py <= 0.05) {
          vy = isLavaCastle && fireSlowTimer > 0 ? 9.6 : 11.4;
          partyAudio.playJump();
        }
        jumpQueuedRef.current = false;

        vy -= 28 * dt;
        py = Math.max(0, py + vy * dt);
        if (py === 0) vy = 0;

        playerMesh.position.set(px, py, pz);
        // Spin wobble if hit by banana/obstacle in Kart 3D
        if (isKart && stunTimer > 0) {
          playerMesh.rotation.y = Math.sin(elapsed * 26) * 0.48;
        } else {
          playerMesh.rotation.y = THREE.MathUtils.damp(playerMesh.rotation.y, 0, 10, dt);
        }
        playerMesh.rotation.z = THREE.MathUtils.damp(
          playerMesh.rotation.z,
          -moveX * 0.16,
          10,
          dt
        );

        // Distance score (slower gain while slowed by fire!)
        if (Math.floor(elapsed * 2) > Math.floor((elapsed - dt) * 2)) {
          addPoints(
            boostTimer > 0 ? 4 : fireSlowTimer > 0 ? 1 : 2
          );
        }

        // Scroll scenery & world props
        for (const s of scrollScenery) {
          s.position.z += speed * dt;
          if (s.position.z > 14) s.position.z -= 126;
        }
        for (const slot of kartPropSlots) {
          slot.obj.position.z += speed * dt;
          if (slot.obj.position.z > 14) slot.obj.position.z -= 126;
        }

        // Scroll pickups
        const lanes = [-3.1, 0, 3.1];
        for (const p of pickups) {
          p.z += speed * dt;
          if (p.z > 12) {
            p.z -= 104;
            p.x = lanes[Math.floor(rng() * 3)];
            p.active = true;
            p.mesh.visible = true;
          }
          p.mesh.position.x = p.x;
          p.mesh.position.z = p.z;
          if (p.active && Math.abs(p.x - px) < 1.25 && Math.abs(p.z - pz) < 1.55 && py < 2.2) {
            p.active = false;
            p.mesh.visible = false;
            if (p.kind === 'boost') {
              boostTimer = 2.2;
              fireSlowTimer = 0;
              partyAudio.playStar();
              addPoints(15, ar ? 'تيربو خارق +15!' : 'TURBO BOOST +15!');
            } else if (p.kind === 'star') {
              partyAudio.playStar();
              addPoints(25, ar ? 'نجمة خارقة +25!' : 'SUPER STAR +25!');
            } else {
              partyAudio.playCoin();
              addPoints(10);
            }
          }
        }

        // Scroll hazards / obstacles
        for (const h of hazards) {
          h.z += speed * dt;
          if (h.vx !== 0) {
            h.x += h.vx * dt;
            if (h.x > 3.6 || h.x < -3.6) h.vx = -h.vx;
          }
          if (h.kind === 'firebar') {
            h.mesh.rotation.y += dt * 3.8;
          } else if (h.kind === 'shell') {
            h.mesh.rotation.y += dt * 7;
          } else if (h.kind === 'lavapool') {
            h.mesh.rotation.y += dt * 1.4;
          }

          if (h.z > 12) {
            h.z -= obstacleCount * 8.8;
            h.x = lanes[Math.floor(rng() * 3)];
          }
          h.mesh.position.set(h.x, h.y, h.z);

          const jumpClearHeight = h.kind === 'lavapool' || h.kind === 'banana' ? 0.72 : 1.28;
          const collided =
            Math.abs(h.x - px) < h.radius + 0.42 &&
            Math.abs(h.z - pz) < 1.15 &&
            py < jumpClearHeight;

          if (collided) {
            if (isLavaCastle) {
              // Fire in Fire Castle slows you down!
              fireSlowTimer = 2.6;
              boostTimer = 0;
              if (fireHitGrace <= 0) {
                fireHitGrace = 0.75;
                partyAudio.playHit();
                addPoints(
                  -4,
                  ar ? '🔥 النار أبطأتك! اقفز فوقها!' : '🔥 FIRE SLOWED YOU DOWN!'
                );
              }
            } else if (stunTimer <= 0) {
              stunTimer = 1.05;
              boostTimer = 0;
              partyAudio.playHit();
              const msg =
                h.kind === 'banana'
                  ? ar
                    ? 'انزلقت على قشر الموز! -6'
                    : 'BANANA SLIP! -6'
                  : h.kind === 'barricade'
                  ? ar
                    ? 'اصطدمت بحاجز الطريق! -8'
                    : 'HIT ROAD BARRICADE! -8'
                  : h.kind === 'barrel'
                  ? ar
                    ? 'عائق براميل وأقماع! -7'
                    : 'HIT BARREL OBSTACLE! -7'
                  : ar
                  ? 'صدفة كوبا! -8'
                  : 'KOOPA SHELL HIT! -8';
              addPoints(h.kind === 'banana' ? -6 : -8, msg);
            }
          }
        }

        const rivalTargetZ =
          -1.5 - (rivalProgressRef.current - (elapsed / durationSec) * 100) * 0.14;
        rivalMesh.position.x = Math.sin(elapsed * 1.4 + seed) * 2.8;
        rivalMesh.position.z = THREE.MathUtils.damp(
          rivalMesh.position.z,
          THREE.MathUtils.clamp(rivalTargetZ, -10, 4),
          4,
          dt
        );

        camera.position.x = THREE.MathUtils.damp(camera.position.x, px * 0.48, 6, dt);
        camera.position.y = THREE.MathUtils.damp(
          camera.position.y,
          boostTimer > 0 ? 5.6 : fireSlowTimer > 0 ? 6.7 : 6.2,
          5,
          dt
        );
        camera.lookAt(px * 0.35, 1.1, -12);
      } else if (gameId === 'sky_island_hop_3d') {
        const moveSpeed = 9.2;
        vx = THREE.MathUtils.damp(vx, moveX * moveSpeed, 10, dt);
        vz = THREE.MathUtils.damp(vz, moveZ * moveSpeed, 10, dt);
        px += vx * dt;
        pz += vz * dt;

        if (jumpQueuedRef.current && jumpsLeft > 0) {
          vy = jumpsLeft === 2 ? 11.4 : 10.2;
          jumpsLeft -= 1;
          partyAudio.playJump();
        }
        jumpQueuedRef.current = false;

        vy -= 26 * dt;
        const prevY = py;
        py += vy * dt;

        for (const plat of platforms) {
          if (
            Math.abs(px - plat.x) <= plat.rx + 0.35 &&
            Math.abs(pz - plat.z) <= plat.rz + 0.35 &&
            prevY >= plat.y - 0.15 &&
            py <= plat.y + 0.12 &&
            vy <= 0
          ) {
            py = plat.y;
            if (plat.isSpring) {
              vy = 15.2;
              jumpsLeft = 1;
              partyAudio.playJump();
              addPoints(5, ar ? 'فطر نطاط! +5' : 'BOUNCE PAD! +5');
            } else {
              vy = 0;
              jumpsLeft = 2;
            }
          }
        }

        if (py < -5.8) {
          px = 0;
          py = 2.4;
          pz = 0;
          vx = 0;
          vy = 0;
          vz = 0;
          jumpsLeft = 2;
          partyAudio.playHit();
          addPoints(-6, ar ? 'عودة للجزيرة!' : 'Back to island!');
        }

        playerMesh.position.set(px, py, pz);
        if (Math.hypot(vx, vz) > 0.6) {
          playerMesh.rotation.y = Math.atan2(-vx, -vz);
        }

        for (const p of pickups) {
          if (!p.active) continue;
          const dist = Math.hypot(px - p.x, py + 0.8 - p.y, pz - p.z);
          if (dist < 1.55) {
            p.active = false;
            p.mesh.visible = false;
            p.respawnAt = elapsed + 3.2;
            if (p.kind === 'star') {
              partyAudio.playStar();
              addPoints(25, ar ? 'نجمة السماء +25!' : 'SKY STAR +25!');
            } else {
              partyAudio.playCoin();
              addPoints(12);
            }
          }
        }

        rivalMesh.position.set(
          Math.cos(elapsed * 0.9) * 5.2,
          1.2 + Math.abs(Math.sin(elapsed * 3.1)) * 2.2,
          Math.sin(elapsed * 0.9) * 5.2 - 3
        );
        rivalMesh.rotation.y = -elapsed * 0.9;

        camera.position.x = THREE.MathUtils.damp(camera.position.x, px * 0.55, 5, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, 9.5 + py * 0.45, 5, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, pz + 12.5, 5, dt);
        camera.lookAt(px * 0.6, py + 0.8, pz - 1.5);
      } else if (gameId === 'bumper_arena_3d') {
        const accel = boostTimer > 0 ? 32 : 20;
        vx += moveX * accel * dt;
        vz += moveZ * accel * dt;
        const drag = Math.exp(-2.6 * dt);
        vx *= drag;
        vz *= drag;

        if (jumpQueuedRef.current && boostTimer <= 0) {
          boostTimer = 0.7;
          const len = Math.hypot(moveX, moveZ) || 1;
          vx += (moveX / len) * 10;
          vz += (moveZ / len) * 10;
          partyAudio.playJump();
        }
        jumpQueuedRef.current = false;

        px += vx * dt;
        pz += vz * dt;

        const distCenter = Math.hypot(px, pz);
        if (distCenter > 10.6) {
          px = 0;
          pz = 0;
          vx = 0;
          vz = 0;
          partyAudio.playHit();
          addPoints(-8, ar ? 'سقطت من الحافة! -8' : 'RING OUT! -8');
        }

        playerMesh.position.set(px, 0, pz);
        if (Math.hypot(vx, vz) > 0.5) {
          playerMesh.rotation.y = Math.atan2(-vx, -vz);
        }

        for (const h of hazards) {
          const toCenterLen = Math.hypot(h.x, h.z) || 1;
          if (toCenterLen > 3.5) {
            h.vx += (-h.x / toCenterLen) * 3.4 * dt;
            h.vz += (-h.z / toCenterLen) * 3.4 * dt;
          }
          h.x += h.vx * dt;
          h.z += h.vz * dt;
          h.vx *= Math.exp(-1.1 * dt);
          h.vz *= Math.exp(-1.1 * dt);
          h.mesh.rotation.y += dt * 4.5;

          const dx = h.x - px;
          const dz = h.z - pz;
          const d = Math.hypot(dx, dz);
          if (d < 1.95 && d > 0.001) {
            const nx = dx / d;
            const nz = dz / d;
            const power = boostTimer > 0 ? 18 : 13;
            h.vx = nx * power + vx * 0.5;
            h.vz = nz * power + vz * 0.5;
            vx -= nx * 4.2;
            vz -= nz * 4.2;
            partyAudio.playCoin();
            addPoints(8, ar ? 'صدمة قوية! +8' : 'BUMP! +8');
          }

          if (Math.hypot(h.x, h.z) > 10.8) {
            partyAudio.playStar();
            addPoints(30, ar ? 'إقصاء رائع +30!' : 'KNOCKOUT +30!');
            const ang = rng() * Math.PI * 2;
            h.x = Math.cos(ang) * 4.5;
            h.z = Math.sin(ang) * 4.5;
            h.vx = 0;
            h.vz = 0;
          }
          h.mesh.position.set(h.x, 0, h.z);
        }

        for (const p of pickups) {
          if (!p.active) continue;
          if (Math.hypot(px - p.x, pz - p.z) < 1.65) {
            p.active = false;
            p.mesh.visible = false;
            p.respawnAt = elapsed + 2.8;
            const ang = rng() * Math.PI * 2;
            const r = 2.5 + rng() * 6.5;
            p.x = Math.cos(ang) * r;
            p.z = Math.sin(ang) * r;
            p.mesh.position.set(p.x, p.y, p.z);
            if (p.kind === 'star') {
              partyAudio.playStar();
              addPoints(20, ar ? 'نجمة التاج +20!' : 'CROWN STAR +20!');
            } else {
              partyAudio.playCoin();
              addPoints(10);
            }
          }
        }

        rivalMesh.position.set(Math.sin(elapsed * 1.1) * 5.2, 0, Math.cos(elapsed * 1.1) * 5.2);
        rivalMesh.rotation.y = elapsed * 1.1;

        camera.position.x = THREE.MathUtils.damp(camera.position.x, px * 0.35, 5, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, 14.5 + pz * 0.25, 5, dt);
        camera.lookAt(px * 0.25, 0.6, pz * 0.25);
      } else {
        const runSpeed = stunTimer > 0 ? 5.5 : 10.6;
        vx = THREE.MathUtils.damp(vx, moveX * runSpeed, 12, dt);
        vz = THREE.MathUtils.damp(vz, moveZ * runSpeed, 12, dt);
        px += vx * dt;
        pz += vz * dt;

        const r = Math.hypot(px, pz);
        if (r > 10.6) {
          px = (px / r) * 10.6;
          pz = (pz / r) * 10.6;
        }

        if (jumpQueuedRef.current && py <= 0.05) {
          vy = 11.4;
          partyAudio.playJump();
        }
        jumpQueuedRef.current = false;
        vy -= 28 * dt;
        py = Math.max(0, py + vy * dt);
        if (py === 0) vy = 0;

        playerMesh.position.set(px, py, pz);
        if (Math.hypot(vx, vz) > 0.6) {
          playerMesh.rotation.y = Math.atan2(-vx, -vz);
        }

        for (const h of hazards) {
          h.x += h.vx * dt;
          h.z += h.vz * dt;
          h.mesh.rotation.x += h.vz * dt * 0.9;
          h.mesh.rotation.z -= h.vx * dt * 0.9;
          const hr = Math.hypot(h.x, h.z);
          if (hr > 10.3) {
            const nx = h.x / hr;
            const nz = h.z / hr;
            const dot = h.vx * nx + h.vz * nz;
            h.vx -= 2 * dot * nx;
            h.vz -= 2 * dot * nz;
            h.x = nx * 10.2;
            h.z = nz * 10.2;
          }
          h.mesh.position.set(h.x, h.y, h.z);
          if (
            stunTimer <= 0 &&
            Math.hypot(px - h.x, pz - h.z) < h.radius + 0.5 &&
            py < 1.35
          ) {
            stunTimer = 0.9;
            partyAudio.playHit();
            addPoints(-8, ar ? 'تجنّب الصخرة! -8' : 'DODGE BOULDER! -8');
          }
        }

        for (const p of pickups) {
          if (!p.active) continue;
          if (Math.hypot(px - p.x, pz - p.z) < 1.45 && py < 2.3) {
            p.active = false;
            p.mesh.visible = false;
            p.respawnAt = elapsed + 2.4;
            const ang = rng() * Math.PI * 2;
            const dist = 2.6 + rng() * 7.6;
            p.x = Math.cos(ang) * dist;
            p.z = Math.sin(ang) * dist;
            p.mesh.position.set(p.x, p.y, p.z);
            if (p.kind === 'star') {
              partyAudio.playStar();
              addPoints(25, ar ? 'نجمة الملعب +25!' : 'STADIUM STAR +25!');
            } else {
              partyAudio.playCoin();
              addPoints(10);
            }
          }
        }

        _vA.set(Math.cos(elapsed * 1.15) * 6.5, 0, Math.sin(elapsed * 1.15) * 6.5);
        _vB.subVectors(_vA, rivalMesh.position);
        rivalMesh.position.copy(_vA);
        rivalMesh.rotation.y = Math.atan2(-_vB.x, -_vB.z);

        camera.position.x = THREE.MathUtils.damp(camera.position.x, px * 0.42, 6, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, 15.2 + pz * 0.35, 6, dt);
        camera.lookAt(px * 0.45, 0.8, pz * 0.45);
      }
    };

    const tick = () => {
      if (disposed) return;
      const now = performance.now();
      const dt = Math.min(0.05, Math.max(0.001, (now - prevPerf) / 1000));
      prevPerf = now;
      const elapsed = (now - startPerf) / 1000;
      const remaining = Math.max(0, durationSec - elapsed);

      if (!finished) {
        step(dt, elapsed);
        if (now - lastHudPush > 140) {
          lastHudPush = now;
          setHudTime(Math.ceil(remaining));
          onLiveUpdateRef.current(
            score,
            Math.min(100, Math.round((elapsed / durationSec) * 100)),
            false
          );
        }
        if (remaining <= 0) {
          finished = true;
          setHudTime(0);
          onLiveUpdateRef.current(score, 100, true);
        }
      }

      renderer.render(scene, camera);

      if (!disposed) {
        if (isSoftwareGl) afterDraw(tick);
        else frameId = requestAnimationFrame(tick);
      }
    };

    if (isSoftwareGl) afterDraw(tick);
    else frameId = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', onResize);

      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const m = obj as THREE.Mesh;
          m.geometry?.dispose();
          if (Array.isArray(m.material)) m.material.forEach((mat) => mat.dispose());
          else m.material?.dispose();
        }
      });
      Object.values(worldRoadTextures).forEach((t) => t?.dispose());
      shadowTex.dispose();
      qBlockTex.dispose();
      envRT.dispose();
      renderer.dispose();
      if (container) container.innerHTML = '';
    };
  }, [gameId, seed, durationSec, characterId, rivalCharacterId, ar]);

  const holdKey = (code: string, down: boolean) => {
    keysRef.current[code] = down;
    if (down && code === 'Space') jumpQueuedRef.current = true;
  };

  const is4Way =
    gameId === 'sky_island_hop_3d' ||
    gameId === 'bumper_arena_3d' ||
    gameId === 'star_stadium_3d';

  const currentWorldTheme = KART_WORLD_MAP[activeKartWorld];

  return (
    <div className="space-y-2.5">
      {/* Compact Top Solid HUD Strip */}
      <div className="rounded-xl border border-amber-300/35 bg-[#0b1933] px-3.5 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-num text-[11px] font-black px-2 py-0.5 rounded bg-sky-400 text-slate-950 shrink-0">
            3D
          </span>
          <span className="text-xs sm:text-sm font-black text-white truncate">
            {ar ? spec.nameAr : spec.nameEn}
          </span>
          {gameId === 'kart_drift_3d' && (
            <span
              className="text-[11px] font-black px-2 py-0.5 rounded-md text-slate-950 whitespace-nowrap shrink-0"
              style={{ backgroundColor: currentWorldTheme.badgeColor }}
            >
              {ar ? currentWorldTheme.nameAr : currentWorldTheme.nameEn}
            </span>
          )}
          {gameId === 'bowser_tower_3d' && isFireSlowed && (
            <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-orange-500 text-white whitespace-nowrap shrink-0">
              {ar ? '🔥 تباطؤ بسبب النار!' : '🔥 SLOWED BY FIRE!'}
            </span>
          )}
        </div>
        {hudBanner && (
          <span className="text-xs font-black text-amber-300 truncate">
            {hudBanner}
          </span>
        )}
        <div className="flex items-center gap-4 font-num shrink-0">
          <span className="text-xs sm:text-sm font-black text-amber-300">
            {ar ? 'النقاط' : 'Score'}: {hudScore}
          </span>
          <span className="text-xs sm:text-sm font-black text-sky-300">
            {hudTime}s
          </span>
        </div>
      </div>

      {/* Mario Kart 3D Worlds Selector Strip (5 Worlds + Auto-Cycle) */}
      {gameId === 'kart_drift_3d' && (
        <div className="rounded-xl border border-sky-400/30 bg-[#0b1933] px-3 py-2 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-black text-sky-200 me-1 whitespace-nowrap">
            {ar ? 'عوالم السباق:' : 'Race Worlds:'}
          </span>
          <button
            type="button"
            onClick={() => setKartWorldMode('auto')}
            className={`h-7 px-2.5 rounded-lg text-[11px] font-black transition-colors whitespace-nowrap cursor-pointer ${
              kartWorldMode === 'auto'
                ? 'bg-amber-400 text-slate-950'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
          >
            {ar ? 'تلقائي (كل العوالم)' : 'Auto (All 5)'}
          </button>
          {KART_WORLDS.map((w) => {
            const isSel = kartWorldMode === w.id || (kartWorldMode === 'auto' && activeKartWorld === w.id);
            return (
              <button
                key={w.id}
                type="button"
                onClick={() => setKartWorldMode(w.id)}
                className={`h-7 px-2.5 rounded-lg text-[11px] font-black transition-colors whitespace-nowrap cursor-pointer border ${
                  kartWorldMode === w.id
                    ? 'border-white text-slate-950'
                    : isSel
                    ? 'border-amber-300 text-white bg-slate-800'
                    : 'border-white/10 text-slate-300 bg-slate-900 hover:bg-slate-800'
                }`}
                style={kartWorldMode === w.id ? { backgroundColor: w.badgeColor } : undefined}
              >
                {ar ? w.nameAr : w.nameEn}
              </button>
            );
          })}
        </div>
      )}

      {/* Dedicated Isolated WebGL Viewport Container */}
      <div className="relative w-full aspect-[16/9] max-h-[450px] rounded-2xl overflow-hidden border-2 border-sky-400/40 bg-[#071126] shadow-2xl">
        <div ref={mountRef} className="w-full h-full" />
      </div>

      {/* Touch & Quick Action Control Dock Below Viewport */}
      <div className="rounded-xl border border-white/10 bg-[#0b1933] p-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onPointerDown={() => holdKey('ArrowLeft', true)}
            onPointerUp={() => holdKey('ArrowLeft', false)}
            onPointerLeave={() => holdKey('ArrowLeft', false)}
            className="h-11 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-sky-500 active:text-slate-950 text-white font-black text-sm select-none cursor-pointer"
          >
            {ar ? 'يسار' : 'LEFT'}
          </button>
          {is4Way && (
            <>
              <button
                type="button"
                onPointerDown={() => holdKey('ArrowUp', true)}
                onPointerUp={() => holdKey('ArrowUp', false)}
                onPointerLeave={() => holdKey('ArrowUp', false)}
                className="h-11 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-sky-500 active:text-slate-950 text-white font-black text-sm select-none cursor-pointer"
              >
                {ar ? 'أمام' : 'UP'}
              </button>
              <button
                type="button"
                onPointerDown={() => holdKey('ArrowDown', true)}
                onPointerUp={() => holdKey('ArrowDown', false)}
                onPointerLeave={() => holdKey('ArrowDown', false)}
                className="h-11 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-sky-500 active:text-slate-950 text-white font-black text-sm select-none cursor-pointer"
              >
                {ar ? 'خلف' : 'DOWN'}
              </button>
            </>
          )}
          <button
            type="button"
            onPointerDown={() => holdKey('ArrowRight', true)}
            onPointerUp={() => holdKey('ArrowRight', false)}
            onPointerLeave={() => holdKey('ArrowRight', false)}
            className="h-11 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-sky-500 active:text-slate-950 text-white font-black text-sm select-none cursor-pointer"
          >
            {ar ? 'يمين' : 'RIGHT'}
          </button>
        </div>

        <button
          type="button"
          onPointerDown={() => holdKey('Space', true)}
          onPointerUp={() => holdKey('Space', false)}
          onPointerLeave={() => holdKey('Space', false)}
          className="h-11 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-slate-950 font-black text-sm select-none cursor-pointer"
        >
          {gameId === 'bumper_arena_3d'
            ? ar
              ? 'اندفاع تيربو!'
              : 'TURBO DASH!'
            : ar
            ? 'قفز!'
            : 'JUMP!'}
        </button>
      </div>
    </div>
  );
};
