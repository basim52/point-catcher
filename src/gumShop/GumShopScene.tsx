import React, { Component, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GumShopAudio } from './audio';
import {
  DOOR_HALF_WIDTH,
  DOOR_Z,
  extractGumShopHud,
  stepGumShopWorld,
  type GumShopInput,
  type GumShopWorld,
} from './gameLogic';
import {
  AD_CAMPAIGN_MAP,
  AD_COST,
  DAY_DURATION_SEC,
  getShopBounds,
  GUM_FLAVOR_MAP,
  GUM_FLAVORS,
  SHELF_MAX_STOCK,
  STORAGE_MAX_PACKS,
  STORAGE_ROOM_COST,
  type ActiveAdState,
  type AdCampaignSpec,
  type DeliveryCrateState,
  type GumFlavorId,
  type GumShopHudSnapshot,
  type ShelfState,
  type ShopLevel,
} from './types';

interface GumShopSceneProps {
  worldRef: React.MutableRefObject<GumShopWorld>;
  inputRef: React.MutableRefObject<GumShopInput>;
  audioRef: React.MutableRefObject<GumShopAudio>;
  moveCashierMode: boolean;
  moveShelfMode: boolean;
  selectedShelfSlot: number | null;
  onHudUpdate: (snapshot: GumShopHudSnapshot) => void;
  onFloorClick: (x: number, z: number) => void;
  onMoveCashierTo: (x: number, z: number) => void;
  onMoveShelfTo: (x: number, z: number) => void;
  onCrateClick: (crateId: number, x: number, z: number) => void;
  onShelfClick: (slotIndex: number) => void;
  onCheckoutClick: () => void;
  onHouseDoorClick: () => void;
  onBedClick: () => void;
  onStorageClick: () => void;
  onAdScreenClick: () => void;
  onOpenHousePuzzle: () => void;
  onOpenStorageModal: () => void;
}

// Reusable module-level colors for zero-GC Day -> Dusk -> Night sky/lighting transitions
const SKY_DAY = new THREE.Color('#a7d8f0');
const SKY_DUSK = new THREE.Color('#f59e6c');
const SKY_NIGHT = new THREE.Color('#131c36');
const FOG_DAY = new THREE.Color('#cfe7f5');
const FOG_DUSK = new THREE.Color('#e8a882');
const FOG_NIGHT = new THREE.Color('#18223d');
const SUN_DAY = new THREE.Color('#fff3d6');
const SUN_DUSK = new THREE.Color('#ffae6b');
const SUN_NIGHT = new THREE.Color('#6b8cff');
const TMP_SKY = new THREE.Color();
const TMP_FOG = new THREE.Color();
const TMP_SUN = new THREE.Color();

function detectSoftwareGl(): boolean {
  if (typeof document === 'undefined') return false;
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

function createShopTileTexture(maxAniso: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const tile = 64;
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#fdf6e7' : '#d8f3dc';
        ctx.fillRect(x * tile, y * tile, tile, tile);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.28)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x * tile + 1, y * tile + 1, tile - 2, tile - 2);
      }
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2.5);
  tex.anisotropy = Math.min(8, Math.max(1, maxAniso));
  return tex;
}

function createSidewalkTexture(maxAniso: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#e5dcc8';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = '#c4b89f';
    ctx.lineWidth = 3;
    for (let i = 0; i <= 256; i += 64) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 256);
      ctx.moveTo(0, i);
      ctx.lineTo(256, i);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(16, 3);
  tex.anisotropy = Math.min(8, Math.max(1, maxAniso));
  return tex;
}

function createSignCanvasTexture(
  line1: string,
  line2: string,
  bgStart: string,
  bgEnd: string,
  accent: string,
  maxAniso: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 512, 256);
    grad.addColorStop(0, bgStart);
    grad.addColorStop(1, bgEnd);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    ctx.strokeStyle = accent;
    ctx.lineWidth = 10;
    ctx.strokeRect(10, 10, 492, 236);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 54px system-ui, -apple-system, sans-serif';
    ctx.fillText(line1, 256, 98);

    ctx.fillStyle = accent;
    ctx.font = 'bold 38px system-ui, -apple-system, sans-serif';
    ctx.fillText(line2, 256, 174);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, Math.max(1, maxAniso));
  return tex;
}

function createAdScreenTexture(
  campaign: AdCampaignSpec | null,
  daysLeft: number,
  lang: 'ar' | 'en',
  maxAniso: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    if (!campaign) {
      // Standby LED screen inviting player to rent an ad for 400 SAR
      const grad = ctx.createLinearGradient(0, 0, 1024, 512);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#1e293b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 512);

      // Subtle LED dot grid
      ctx.fillStyle = 'rgba(148, 163, 184, 0.14)';
      for (let gx = 24; gx < 1024; gx += 32) {
        for (let gy = 24; gy < 512; gy += 32) {
          ctx.fillRect(gx, gy, 4, 4);
        }
      }

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 14;
      ctx.strokeRect(20, 20, 984, 472);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#e0f2fe';
      ctx.font = 'bold 64px system-ui, -apple-system, sans-serif';
      ctx.fillText(lang === 'ar' ? 'مساحة إعلانية ضخمة' : 'GIANT AD BILLBOARD', 512, 182);

      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 56px system-ui, -apple-system, sans-serif';
      ctx.fillText(
        lang === 'ar' ? `أعلن لمحلك بـ ${AD_COST} ريال` : `ADVERTISE FOR ${AD_COST} SAR`,
        512,
        290
      );

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 34px system-ui, -apple-system, sans-serif';
      ctx.fillText(
        lang === 'ar' ? 'اضغط هنا لفتح لوحة الإعلانات' : 'Click here to launch an ad campaign',
        512,
        392
      );
    } else {
      // Active glowing high-impact LED Ad!
      const grad = ctx.createLinearGradient(0, 0, 1024, 512);
      grad.addColorStop(0, campaign.primaryColor);
      grad.addColorStop(0.55, '#0f172a');
      grad.addColorStop(1, campaign.primaryColor);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 512);

      // Decorative diagonal celebration stripes
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      for (let sx = -200; sx < 1200; sx += 110) {
        ctx.beginPath();
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx + 55, 0);
        ctx.lineTo(sx - 120, 512);
        ctx.lineTo(sx - 175, 512);
        ctx.closePath();
        ctx.fill();
      }

      // Colorful gumball medallions left & right
      const dotColors = ['#14b8a6', '#f43f5e', '#facc15', '#a855f7', '#22c55e'];
      dotColors.forEach((col, i) => {
        ctx.beginPath();
        ctx.arc(92, 102 + i * 78, 24, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(932, 102 + i * 78, 24, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();
        ctx.stroke();
      });

      // Bright LED outer border
      ctx.strokeStyle = campaign.accentColor;
      ctx.lineWidth = 18;
      ctx.strokeRect(18, 18, 988, 476);

      // Top LIVE badge
      ctx.fillStyle = campaign.accentColor;
      ctx.fillRect(362, 46, 300, 56);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 34px system-ui, -apple-system, sans-serif';
      ctx.fillText(
        lang === 'ar' ? `★ إعلان مباشر · ${daysLeft} يوم ★` : `★ LIVE AD · ${daysLeft}d LEFT ★`,
        512,
        75
      );

      // Main headline
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 84px system-ui, -apple-system, sans-serif';
      ctx.fillText(lang === 'ar' ? campaign.headlineAr : campaign.headlineEn, 512, 224);

      // Sub-title
      ctx.fillStyle = campaign.accentColor;
      ctx.font = 'bold 44px system-ui, -apple-system, sans-serif';
      ctx.fillText(lang === 'ar' ? campaign.titleAr : campaign.titleEn, 512, 336);

      // Bottom shop brand banner
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.font = 'bold 34px system-ui, -apple-system, sans-serif';
      ctx.fillText(
        lang === 'ar' ? 'بياع العلك 3D · 11 نكهة لذيذة!' : 'GUM SHOP 3D · 11 DELICIOUS FLAVORS!',
        512,
        428
      );
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, Math.max(1, maxAniso));
  return tex;
}

class GumShopErrorBoundary extends Component<
  { lang: 'ar' | 'en'; onRetry: () => void; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { lang: 'ar' | 'en'; onRetry: () => void; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(): void {
    // Isolate WebGL errors safely
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-[#182436] text-amber-100 p-6 text-center">
          <p className="text-base font-bold mb-3">
            {this.props.lang === 'ar'
              ? 'تعذر تحميل العرض ثلاثي الأبعاد مؤقتاً'
              : 'Temporarily unable to load 3D shop view'}
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false });
              this.props.onRetry();
            }}
            className="px-5 py-2.5 rounded-lg bg-amber-400 text-slate-950 font-extrabold text-sm cursor-pointer"
          >
            {this.props.lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Enterable 3D Sleep House right beside the Gum Shop:
 * - Locked front door shows a glowing golden lock plaque; clicking opens the Door Lock Puzzle!
 * - Once unlocked, the door swings wide open, the roof lifts away cleanly to reveal the full
 *   cozy 3D bedroom interior (wood floor, woven rug, bed, nightstand lamp, wardrobe), and the
 *   player walks right inside to sleep on the bed at night!
 */
const SleepHouse3D: React.FC<{
  houseX: number;
  houseZ: number;
  isNight: boolean;
  houseDoorUnlocked: boolean;
  isSoftwareGl: boolean;
  onFloorClick: (x: number, z: number) => void;
  onHouseDoorClick: () => void;
  onBedClick: () => void;
}> = ({
  houseX,
  houseZ,
  isNight,
  houseDoorUnlocked,
  isSoftwareGl,
  onFloorClick,
  onHouseDoorClick,
  onBedClick,
}) => {
  const beaconRef = useRef<THREE.Group | null>(null);

  useFrame(({ clock }) => {
    if (beaconRef.current) {
      const t = clock.getElapsedTime();
      beaconRef.current.position.y = (houseDoorUnlocked ? 4.3 : 5.45) + Math.sin(t * 3.4) * 0.22;
      beaconRef.current.rotation.y = t * 1.4;
    }
  });

  const windowEmissive = isNight ? '#fbbf24' : '#38bdf8';
  const windowEmissiveIntensity = isNight ? 1.2 : 0.14;
  const wallH = 3.0;

  return (
    <group position={[houseX, 0, houseZ]}>
      {/* Warm Wood Bedroom Floor (clickable to walk inside once unlocked!) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.02, 0]}
        receiveShadow={!isSoftwareGl}
        onClick={(e) => {
          e.stopPropagation();
          if (houseDoorUnlocked) {
            onFloorClick(e.point.x, e.point.z);
          } else {
            onHouseDoorClick();
          }
        }}
      >
        <planeGeometry args={[4.2, 4.3]} />
        <meshStandardMaterial color="#d4a373" roughness={0.78} />
      </mesh>

      {/* Cozy Bedroom Rug */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.25, 0.035, 0.45]}>
        <planeGeometry args={[2.1, 1.65]} />
        <meshStandardMaterial color="#4f46e5" roughness={0.92} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.25, 0.04, 0.45]}>
        <planeGeometry args={[1.8, 1.35]} />
        <meshStandardMaterial color="#818cf8" roughness={0.9} />
      </mesh>

      {/* Hollow Perimeter Walls so Player Can Walk Inside! */}
      {/* Back Wall */}
      <mesh position={[0, wallH / 2, -2.2]} castShadow={!isSoftwareGl} receiveShadow={!isSoftwareGl}>
        <boxGeometry args={[4.4, wallH, 0.24]} />
        <meshStandardMaterial color="#fde8d7" roughness={0.84} />
      </mesh>
      {/* Left Wall (facing shop) */}
      <mesh position={[-2.15, wallH / 2, 0]} castShadow={!isSoftwareGl} receiveShadow={!isSoftwareGl}>
        <boxGeometry args={[0.24, wallH, 4.5]} />
        <meshStandardMaterial color="#fde8d7" roughness={0.84} />
      </mesh>
      {/* Right Wall */}
      <mesh position={[2.15, wallH / 2, 0]} castShadow={!isSoftwareGl} receiveShadow={!isSoftwareGl}>
        <boxGeometry args={[0.24, wallH, 4.5]} />
        <meshStandardMaterial color="#fde8d7" roughness={0.84} />
      </mesh>

      {/* Front Wall Left & Right Segments around Center Open Doorway (X in [-0.62, +0.62]) */}
      {[-1.44, 1.44].map((fx) => (
        <group key={fx} position={[fx, 0, 2.2]}>
          <mesh position={[0, wallH / 2, 0]} castShadow={!isSoftwareGl}>
            <boxGeometry args={[1.6, wallH, 0.24]} />
            <meshStandardMaterial color="#fde8d7" roughness={0.84} />
          </mesh>
          {/* Glowing Front Window */}
          <mesh position={[0, 1.85, 0.13]}>
            <boxGeometry args={[0.92, 0.92, 0.06]} />
            <meshStandardMaterial color="#78350f" roughness={0.7} />
          </mesh>
          <mesh position={[0, 1.85, 0.15]}>
            <boxGeometry args={[0.74, 0.74, 0.05]} />
            <meshStandardMaterial
              color={isNight ? '#fef08a' : '#bae6fd'}
              emissive={windowEmissive}
              emissiveIntensity={windowEmissiveIntensity}
              roughness={0.2}
            />
          </mesh>
        </group>
      ))}
      {/* Doorway Header Lintel */}
      <mesh position={[0, 2.6, 2.2]}>
        <boxGeometry args={[1.38, 0.82, 0.26]} />
        <meshStandardMaterial color="#fde8d7" roughness={0.84} />
      </mesh>

      {/* Timber Corner Pillars */}
      {[
        [-2.18, -2.2],
        [2.18, -2.2],
        [-2.18, 2.2],
        [2.18, 2.2],
      ].map(([cx, cz], idx) => (
        <mesh key={idx} position={[cx, wallH / 2, cz]}>
          <boxGeometry args={[0.18, wallH + 0.04, 0.18]} />
          <meshStandardMaterial color="#78350f" roughness={0.78} />
        </mesh>
      ))}

      {/* Swinging Wooden Front Door (Hinged on Left Jamb — Closed when Locked, Wide Open when Unlocked!) */}
      <group
        position={[-0.6, 0, 2.2]}
        rotation={[0, houseDoorUnlocked ? -1.8 : 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onHouseDoorClick();
        }}
      >
        <mesh position={[0.6, 1.1, 0]}>
          <boxGeometry args={[1.18, 2.18, 0.1]} />
          <meshStandardMaterial color="#92400e" roughness={0.62} />
        </mesh>
        {/* Brass Doorknob */}
        <mesh position={[1.02, 1.08, 0.09]}>
          <sphereGeometry args={[0.08, 10, 10]} />
          <meshStandardMaterial color="#facc15" roughness={0.25} metalness={0.8} />
        </mesh>
        {/* Glowing Golden Padlock Badge when Locked */}
        {!houseDoorUnlocked && (
          <group position={[0.6, 1.38, 0.1]}>
            <mesh>
              <boxGeometry args={[0.38, 0.34, 0.08]} />
              <meshStandardMaterial
                color="#facc15"
                emissive="#f59e0b"
                emissiveIntensity={0.85}
                roughness={0.25}
                metalness={0.65}
              />
            </mesh>
            <mesh position={[0, 0.22, 0]}>
              <torusGeometry args={[0.12, 0.035, 8, 16, Math.PI]} />
              <meshStandardMaterial color="#e2e8f0" roughness={0.3} metalness={0.8} />
            </mesh>
          </group>
        )}
      </group>

      {/* Door Overhang Awning & Porch Step */}
      <mesh position={[0, 2.32, 2.52]} rotation={[0.25, 0, 0]}>
        <boxGeometry args={[1.75, 0.1, 0.72]} />
        <meshStandardMaterial color="#7c2d12" roughness={0.72} />
      </mesh>
      <mesh
        position={[0, 0.06, 2.7]}
        receiveShadow={!isSoftwareGl}
        onClick={(e) => {
          e.stopPropagation();
          if (houseDoorUnlocked) {
            onFloorClick(houseX, houseZ + 1.1);
          } else {
            onHouseDoorClick();
          }
        }}
      >
        <boxGeometry args={[2.2, 0.12, 1.1]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.88} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.13, 2.8]}>
        <planeGeometry args={[1.3, 0.65]} />
        <meshStandardMaterial color={houseDoorUnlocked ? '#10b981' : '#f59e0b'} roughness={0.9} />
      </mesh>

      {/* Cozy Pitched Roof (Shown while locked; cleanly lifts away once unlocked so you see inside!) */}
      {!houseDoorUnlocked && (
        <group
          onClick={(e) => {
            e.stopPropagation();
            onHouseDoorClick();
          }}
        >
          <mesh position={[-1.25, 3.72, 0]} rotation={[0, 0, 0.56]} castShadow={!isSoftwareGl}>
            <boxGeometry args={[2.95, 0.22, 4.9]} />
            <meshStandardMaterial color="#c2410c" roughness={0.74} />
          </mesh>
          <mesh position={[1.25, 3.72, 0]} rotation={[0, 0, -0.56]} castShadow={!isSoftwareGl}>
            <boxGeometry args={[2.95, 0.22, 4.9]} />
            <meshStandardMaterial color="#c2410c" roughness={0.74} />
          </mesh>
          <mesh position={[0, 4.44, 0]}>
            <boxGeometry args={[0.3, 0.24, 5.0]} />
            <meshStandardMaterial color="#9a3412" roughness={0.72} />
          </mesh>
          <mesh position={[0, 3.66, 0]} rotation={[0, Math.PI / 4, 0]}>
            <cylinderGeometry args={[0.05, 2.6, 1.35, 4]} />
            <meshStandardMaterial color="#fbd3b6" roughness={0.85} />
          </mesh>
          {/* Brick Chimney */}
          <mesh position={[1.35, 4.35, -1.0]} castShadow={!isSoftwareGl}>
            <boxGeometry args={[0.62, 1.3, 0.62]} />
            <meshStandardMaterial color="#991b1b" roughness={0.88} />
          </mesh>
          <mesh position={[1.35, 5.04, -1.0]}>
            <boxGeometry args={[0.74, 0.14, 0.74]} />
            <meshStandardMaterial color="#7f1d1d" roughness={0.85} />
          </mesh>
        </group>
      )}

      {/* === FURNISHED 3D BEDROOM INTERIOR === */}
      {/* Cozy 3D Bed (Back-Right Corner — Click to Sleep at Night!) */}
      <group
        position={[0.95, 0, -0.95]}
        onClick={(e) => {
          e.stopPropagation();
          onBedClick();
        }}
      >
        {/* Glowing Ring beside Bed at Night */}
        {isNight && houseDoorUnlocked && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.85, 0.045, 0.4]}>
            <ringGeometry args={[0.45, 0.65, 24]} />
            <meshBasicMaterial color="#fde047" />
          </mesh>
        )}
        {/* Walnut Bed Frame */}
        <mesh position={[0, 0.24, 0]} castShadow={!isSoftwareGl}>
          <boxGeometry args={[1.52, 0.34, 2.06]} />
          <meshStandardMaterial color="#78350f" roughness={0.72} />
        </mesh>
        {/* Tall Wooden Headboard */}
        <mesh position={[0, 0.72, -0.98]} castShadow={!isSoftwareGl}>
          <boxGeometry args={[1.56, 1.12, 0.14]} />
          <meshStandardMaterial color="#5c2808" roughness={0.7} />
        </mesh>
        {/* Cream Mattress */}
        <mesh position={[0, 0.48, 0.02]}>
          <boxGeometry args={[1.4, 0.24, 1.9]} />
          <meshStandardMaterial color="#fefce8" roughness={0.88} />
        </mesh>
        {/* Cozy Indigo Blanket */}
        <mesh position={[0, 0.56, 0.32]}>
          <boxGeometry args={[1.44, 0.16, 1.32]} />
          <meshStandardMaterial
            color="#4338ca"
            emissive={isNight ? '#312e81' : '#000000'}
            emissiveIntensity={isNight ? 0.35 : 0}
            roughness={0.85}
          />
        </mesh>
        {/* Soft Pillow */}
        <mesh position={[0, 0.66, -0.62]}>
          <boxGeometry args={[0.92, 0.18, 0.44]} />
          <meshStandardMaterial color="#ffffff" roughness={0.9} />
        </mesh>
      </group>

      {/* Bedside Nightstand & Warm Lamp */}
      <group position={[-0.18, 0, -1.65]}>
        <mesh position={[0, 0.32, 0]} castShadow={!isSoftwareGl}>
          <boxGeometry args={[0.56, 0.64, 0.52]} />
          <meshStandardMaterial color="#92400e" roughness={0.72} />
        </mesh>
        <mesh position={[0, 0.78, 0]}>
          <cylinderGeometry args={[0.05, 0.08, 0.28, 10]} />
          <meshStandardMaterial color="#d97706" roughness={0.35} metalness={0.6} />
        </mesh>
        <mesh position={[0, 1.02, 0]}>
          <coneGeometry args={[0.24, 0.28, 12]} />
          <meshStandardMaterial
            color="#fef08a"
            emissive="#fbbf24"
            emissiveIntensity={isNight ? 1.5 : 0.45}
            roughness={0.35}
          />
        </mesh>
        {houseDoorUnlocked && (
          <pointLight
            position={[0, 1.3, 0.25]}
            intensity={isNight ? 2.4 : 0.9}
            distance={8}
            color="#fde68a"
          />
        )}
      </group>

      {/* Wooden Bedroom Wardrobe (Left Wall) */}
      <group position={[-1.55, 0, -0.8]}>
        <mesh position={[0, 0.95, 0]} castShadow={!isSoftwareGl}>
          <boxGeometry args={[0.78, 1.9, 1.48]} />
          <meshStandardMaterial color="#7c2d12" roughness={0.72} />
        </mesh>
        <mesh position={[0.41, 0.95, -0.14]}>
          <sphereGeometry args={[0.055, 8, 8]} />
          <meshStandardMaterial color="#facc15" roughness={0.3} metalness={0.75} />
        </mesh>
        <mesh position={[0.41, 0.95, 0.14]}>
          <sphereGeometry args={[0.055, 8, 8]} />
          <meshStandardMaterial color="#facc15" roughness={0.3} metalness={0.75} />
        </mesh>
      </group>

      {/* Porch Lantern & Night Glow */}
      <mesh position={[0.85, 2.02, 2.38]}>
        <boxGeometry args={[0.2, 0.28, 0.2]} />
        <meshStandardMaterial
          color="#fde047"
          emissive="#f59e0b"
          emissiveIntensity={isNight ? 1.8 : 0.2}
          roughness={0.2}
        />
      </mesh>
      {isNight && (
        <pointLight position={[0, 2.2, 3.1]} intensity={2.2} distance={10} color="#fbbf24" />
      )}

      {/* Floating Moon Beacon above House at Night */}
      {isNight && (
        <group ref={beaconRef} position={[0, houseDoorUnlocked ? 4.3 : 5.45, 0.4]}>
          <mesh>
            <octahedronGeometry args={[0.45, 0]} />
            <meshStandardMaterial
              color="#fde047"
              emissive="#f59e0b"
              emissiveIntensity={1.1}
              roughness={0.2}
              metalness={0.35}
            />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.68, 0.08, 10, 24]} />
            <meshStandardMaterial
              color="#818cf8"
              emissive="#6366f1"
              emissiveIntensity={0.95}
              roughness={0.25}
            />
          </mesh>
        </group>
      )}
    </group>
  );
};

/**
 * Composite 3D Warehouse / Storage Room on the left side of the Gum Shop (200 SAR):
 * - Unowned: concrete pad with "For Sale · 200 SAR" wooden signboard (clickable to buy).
 * - Owned: corrugated-metal & brick storage building with roll-up shutter, interior racks,
 *   and visible stacked colorful 3D gum crates matching real warehouse stock!
 */
const StorageWarehouse3D: React.FC<{
  storageX: number;
  storageZ: number;
  hasStorageRoom: boolean;
  storageStock: Partial<Record<GumFlavorId, number>>;
  isNight: boolean;
  lang: 'ar' | 'en';
  isSoftwareGl: boolean;
  onStorageClick: () => void;
}> = ({
  storageX,
  storageZ,
  hasStorageRoom,
  storageStock,
  isNight,
  lang,
  isSoftwareGl,
  onStorageClick,
}) => {
  const { gl } = useThree();
  const maxAniso = gl.capabilities.getMaxAnisotropy();

  const signTex = useMemo(
    () =>
      hasStorageRoom
        ? createSignCanvasTexture(
            lang === 'ar' ? 'مخزن العلك' : 'GUM WAREHOUSE',
            lang === 'ar' ? `السعة ${STORAGE_MAX_PACKS} علبة` : `MAX ${STORAGE_MAX_PACKS} PACKS`,
            '#0f766e',
            '#134e4a',
            '#fde047',
            maxAniso
          )
        : createSignCanvasTexture(
            lang === 'ar' ? 'أرض المخزن للبيع' : 'WAREHOUSE LOT',
            lang === 'ar' ? `${STORAGE_ROOM_COST} ريال فقط` : `ONLY ${STORAGE_ROOM_COST} SAR`,
            '#92400e',
            '#78350f',
            '#fde047',
            maxAniso
          ),
    [hasStorageRoom, lang, maxAniso]
  );

  useEffect(() => {
    return () => {
      signTex.dispose();
    };
  }, [signTex]);

  // Build up to 9 visible stacked crates representing live flavors stored inside the warehouse
  const crateColors = useMemo(() => {
    const list: string[] = [];
    for (const f of GUM_FLAVORS) {
      const count = storageStock[f.id] ?? 0;
      const boxes = Math.ceil(count / 6);
      for (let i = 0; i < boxes && list.length < 9; i++) {
        list.push(f.color);
      }
    }
    return list;
  }, [storageStock]);

  if (!hasStorageRoom) {
    return (
      <group
        position={[storageX, 0, storageZ]}
        onClick={(e) => {
          e.stopPropagation();
          onStorageClick();
        }}
      >
        {/* Concrete Construction Pad */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow={!isSoftwareGl}>
          <planeGeometry args={[4.4, 4.1]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
          <ringGeometry args={[1.6, 1.85, 4]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
        {/* Wooden For-Sale Signpost */}
        <mesh position={[-0.75, 0.9, 1.25]} castShadow={!isSoftwareGl}>
          <boxGeometry args={[0.14, 1.8, 0.14]} />
          <meshStandardMaterial color="#78350f" roughness={0.85} />
        </mesh>
        <mesh position={[0.75, 0.9, 1.25]} castShadow={!isSoftwareGl}>
          <boxGeometry args={[0.14, 1.8, 0.14]} />
          <meshStandardMaterial color="#78350f" roughness={0.85} />
        </mesh>
        <mesh position={[0, 1.75, 1.25]} castShadow={!isSoftwareGl}>
          <boxGeometry args={[2.3, 1.15, 0.14]} />
          <meshStandardMaterial color="#78350f" roughness={0.75} />
        </mesh>
        <mesh position={[0, 1.75, 1.33]}>
          <planeGeometry args={[2.16, 1.04]} />
          <meshBasicMaterial map={signTex} />
        </mesh>
      </group>
    );
  }

  return (
    <group
      position={[storageX, 0, storageZ]}
      onClick={(e) => {
        e.stopPropagation();
        onStorageClick();
      }}
    >
      {/* Warehouse Concrete Slab */}
      <mesh position={[0, 0.06, 0]} receiveShadow={!isSoftwareGl}>
        <boxGeometry args={[4.6, 0.12, 4.3]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.9} />
      </mesh>

      {/* Main Corrugated Metal & Brick Walls */}
      <mesh position={[0, 1.65, -2.0]} castShadow={!isSoftwareGl} receiveShadow={!isSoftwareGl}>
        <boxGeometry args={[4.5, 3.2, 0.24]} />
        <meshStandardMaterial color="#334155" roughness={0.72} metalness={0.28} />
      </mesh>
      <mesh position={[-2.2, 1.65, 0]} castShadow={!isSoftwareGl} receiveShadow={!isSoftwareGl}>
        <boxGeometry args={[0.24, 3.2, 4.2]} />
        <meshStandardMaterial color="#475569" roughness={0.72} metalness={0.28} />
      </mesh>
      <mesh position={[2.2, 1.65, 0]} castShadow={!isSoftwareGl} receiveShadow={!isSoftwareGl}>
        <boxGeometry args={[0.24, 3.2, 4.2]} />
        <meshStandardMaterial color="#475569" roughness={0.72} metalness={0.28} />
      </mesh>

      {/* Front Side Pillars + Overhead Header around Wide Roll-Up Garage Opening */}
      {[-1.78, 1.78].map((px) => (
        <mesh key={px} position={[px, 1.65, 2.02]} castShadow={!isSoftwareGl}>
          <boxGeometry args={[0.96, 3.2, 0.28]} />
          <meshStandardMaterial color="#b45309" roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0, 2.88, 2.02]} castShadow={!isSoftwareGl}>
        <boxGeometry args={[2.68, 0.75, 0.3]} />
        <meshStandardMaterial color="#1e293b" roughness={0.55} metalness={0.35} />
      </mesh>

      {/* Partially Rolled-Up Steel Shutter */}
      <mesh position={[0, 2.38, 1.98]}>
        <boxGeometry args={[2.56, 0.42, 0.16]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.45} metalness={0.6} />
      </mesh>

      {/* Amber Safety Bumper Bollards flanking Door */}
      {[-1.42, 1.42].map((bx) => (
        <mesh key={bx} position={[bx, 0.42, 2.35]} castShadow={!isSoftwareGl}>
          <cylinderGeometry args={[0.1, 0.11, 0.84, 10]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.45} metalness={0.3} />
        </mesh>
      ))}

      {/* Sloped Industrial Steel Roof */}
      <mesh position={[0, 3.42, 0]} rotation={[0.08, 0, 0]} castShadow={!isSoftwareGl}>
        <boxGeometry args={[4.85, 0.22, 4.6]} />
        <meshStandardMaterial color="#0f766e" roughness={0.55} metalness={0.4} />
      </mesh>

      {/* Roof Signboard */}
      <mesh position={[0, 3.92, 2.02]} castShadow={!isSoftwareGl}>
        <boxGeometry args={[3.4, 0.92, 0.16]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh position={[0, 3.92, 2.12]}>
        <planeGeometry args={[3.22, 0.8]} />
        <meshBasicMaterial map={signTex} />
      </mesh>

      {/* Interior Storage Shelving Rack */}
      <mesh position={[0, 0.82, -1.35]}>
        <boxGeometry args={[3.6, 0.1, 0.9]} />
        <meshStandardMaterial color="#d4a373" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.64, -1.35]}>
        <boxGeometry args={[3.6, 0.1, 0.9]} />
        <meshStandardMaterial color="#d4a373" roughness={0.8} />
      </mesh>

      {/* Live Stacked 3D Gum Crates Inside Warehouse */}
      {crateColors.map((col, idx) => {
        const colIdx = idx % 3;
        const rowIdx = Math.floor(idx / 3);
        const cx = -1.1 + colIdx * 1.1;
        const cy = 0.42 + rowIdx * 0.72;
        const cz = rowIdx === 0 ? 0.25 : -1.2;
        return (
          <group key={idx} position={[cx, cy, cz]}>
            <mesh castShadow={!isSoftwareGl}>
              <boxGeometry args={[0.78, 0.58, 0.68]} />
              <meshStandardMaterial color="#d4a373" roughness={0.85} />
            </mesh>
            <mesh position={[0, 0.02, 0]}>
              <boxGeometry args={[0.8, 0.18, 0.7]} />
              <meshStandardMaterial color={col} roughness={0.4} />
            </mesh>
          </group>
        );
      })}

      {/* Loading Dock Pad in Front of Warehouse */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 2.85]}>
        <planeGeometry args={[2.6, 1.25]} />
        <meshStandardMaterial color="#0d9488" roughness={0.85} />
      </mesh>

      {/* Warm Overhead Loading Lamp */}
      <mesh position={[0, 2.58, 2.22]}>
        <boxGeometry args={[1.1, 0.12, 0.16]} />
        <meshStandardMaterial
          color="#fef08a"
          emissive="#fbbf24"
          emissiveIntensity={isNight ? 1.6 : 0.45}
          roughness={0.2}
        />
      </mesh>
      {isNight && (
        <pointLight position={[0, 2.35, 2.65]} intensity={1.8} distance={9} color="#fef08a" />
      )}
    </group>
  );
};

/**
 * Giant 3D Outdoor Billboard / LED Screen Unit with heavy steel frame, twin pillars,
 * floodlight bar, procedural CanvasTexture display, and subtle LED border glow.
 */
const GiantBillboardUnit3D: React.FC<{
  position: [number, number, number];
  rotationY?: number;
  screenWidth: number;
  screenHeight: number;
  pillarHeight: number;
  campaign: AdCampaignSpec | null;
  daysLeft: number;
  lang: 'ar' | 'en';
  isNight: boolean;
  isSoftwareGl: boolean;
  onClick: () => void;
}> = ({
  position,
  rotationY = 0,
  screenWidth,
  screenHeight,
  pillarHeight,
  campaign,
  daysLeft,
  lang,
  isNight,
  isSoftwareGl,
  onClick,
}) => {
  const { gl } = useThree();
  const maxAniso = gl.capabilities.getMaxAnisotropy();
  const ledStripRef = useRef<THREE.MeshStandardMaterial | null>(null);

  const screenTex = useMemo(
    () => createAdScreenTexture(campaign, daysLeft, lang, maxAniso),
    [campaign, daysLeft, lang, maxAniso]
  );

  useEffect(() => {
    return () => {
      screenTex.dispose();
    };
  }, [screenTex]);

  useFrame(({ clock }) => {
    if (ledStripRef.current) {
      if (campaign) {
        const pulse = 0.85 + Math.sin(clock.getElapsedTime() * 3.8) * 0.35;
        ledStripRef.current.emissiveIntensity = isNight ? pulse * 1.35 : pulse;
      } else {
        ledStripRef.current.emissiveIntensity = isNight ? 0.4 : 0.15;
      }
    }
  });

  const screenCenterY = pillarHeight + screenHeight / 2;
  const pillarOffset = screenWidth * 0.32;
  const accentColor = campaign ? campaign.accentColor : '#38bdf8';

  return (
    <group
      position={position}
      rotation={[0, rotationY, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {/* Twin Concrete Footings + Heavy Steel Support Pillars */}
      {[-pillarOffset, pillarOffset].map((px) => (
        <group key={px} position={[px, 0, 0]}>
          <mesh position={[0, 0.16, 0]} receiveShadow={!isSoftwareGl}>
            <boxGeometry args={[0.72, 0.32, 0.72]} />
            <meshStandardMaterial color="#64748b" roughness={0.9} />
          </mesh>
          <mesh position={[0, pillarHeight / 2 + 0.12, 0]} castShadow={!isSoftwareGl}>
            <cylinderGeometry args={[0.17, 0.21, pillarHeight + 0.24, 10]} />
            <meshStandardMaterial color="#1e293b" roughness={0.45} metalness={0.72} />
          </mesh>
        </group>
      ))}

      {/* Horizontal Steel Cross-Beam */}
      <mesh position={[0, pillarHeight + 0.05, 0]}>
        <boxGeometry args={[screenWidth * 0.75, 0.2, 0.24]} />
        <meshStandardMaterial color="#334155" roughness={0.45} metalness={0.68} />
      </mesh>

      {/* Main Metallic LED Cabinet Housing */}
      <mesh position={[0, screenCenterY, 0]} castShadow={!isSoftwareGl}>
        <boxGeometry args={[screenWidth + 0.36, screenHeight + 0.36, 0.38]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.65} />
      </mesh>

      {/* Glowing LED Accent Frame Trim */}
      <mesh position={[0, screenCenterY, 0.15]}>
        <boxGeometry args={[screenWidth + 0.16, screenHeight + 0.16, 0.12]} />
        <meshStandardMaterial
          ref={ledStripRef}
          color={accentColor}
          emissive={accentColor}
          emissiveIntensity={campaign ? 0.9 : 0.2}
          roughness={0.25}
        />
      </mesh>

      {/* Crisp Front LED Screen Face (Bright & Emissive when Ad Active!) */}
      <mesh position={[0, screenCenterY, 0.22]}>
        <planeGeometry args={[screenWidth, screenHeight]} />
        <meshStandardMaterial
          map={screenTex}
          emissiveMap={screenTex}
          emissive="#ffffff"
          emissiveIntensity={campaign ? (isNight ? 0.95 : 0.62) : isNight ? 0.35 : 0.16}
          roughness={0.22}
          metalness={0.1}
        />
      </mesh>

      {/* Top Floodlight Lamp Bar (3 Fixtures illuminating the Billboard) */}
      {[-screenWidth * 0.32, 0, screenWidth * 0.32].map((lx) => (
        <group key={lx} position={[lx, screenCenterY + screenHeight / 2 + 0.28, 0.35]}>
          <mesh rotation={[0.45, 0, 0]}>
            <boxGeometry args={[0.1, 0.08, 0.65]} />
            <meshStandardMaterial color="#334155" roughness={0.45} metalness={0.7} />
          </mesh>
          <mesh position={[0, -0.05, 0.28]}>
            <boxGeometry args={[0.38, 0.12, 0.18]} />
            <meshStandardMaterial
              color="#fef08a"
              emissive="#fbbf24"
              emissiveIntensity={campaign || isNight ? 1.5 : 0.35}
              roughness={0.2}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
};

/**
 * 3 Giant 3D Outdoor Billboards & Glowing LED Screens surrounding the Gum Shop!
 * 1) Left Highway Giant Billboard
 * 2) Right Plaza Giant LED Screen
 * 3) Towering Skyline Rooftop Mega-Jumbotron above the shop back wall
 */
const OutdoorAdScreens3D: React.FC<{
  halfW: number;
  backZ: number;
  houseX: number;
  activeAds: ActiveAdState[];
  lang: 'ar' | 'en';
  isNight: boolean;
  isSoftwareGl: boolean;
  onAdScreenClick: () => void;
}> = ({ halfW, backZ, houseX, activeAds, lang, isNight, isSoftwareGl, onAdScreenClick }) => {
  const resolveScreenAd = (
    slot: 'left' | 'right' | 'skyline'
  ): { campaign: AdCampaignSpec | null; daysLeft: number } => {
    const festival = activeAds.find((a) => a.id === 'viral_festival' && a.daysLeft > 0);
    const direct = activeAds.find(
      (a) => a.daysLeft > 0 && AD_CAMPAIGN_MAP[a.id]?.screenTarget === slot
    );
    const chosen = direct ?? festival ?? activeAds.find((a) => a.daysLeft > 0);
    if (!chosen) return { campaign: null, daysLeft: 0 };
    return {
      campaign: AD_CAMPAIGN_MAP[chosen.id] ?? null,
      daysLeft: chosen.daysLeft,
    };
  };

  const leftAd = resolveScreenAd('left');
  const rightAd = resolveScreenAd('right');
  const skylineAd = resolveScreenAd('skyline');

  return (
    <group>
      {/* 1) Left Highway Giant Outdoor Billboard */}
      <GiantBillboardUnit3D
        position={[-(halfW + 3.2), 0, 7.6]}
        rotationY={0.28}
        screenWidth={5.2}
        screenHeight={2.6}
        pillarHeight={2.35}
        campaign={leftAd.campaign}
        daysLeft={leftAd.daysLeft}
        lang={lang}
        isNight={isNight}
        isSoftwareGl={isSoftwareGl}
        onClick={onAdScreenClick}
      />

      {/* 2) Right Plaza Giant LED Screen */}
      <GiantBillboardUnit3D
        position={[houseX + 3.6, 0, 7.6]}
        rotationY={-0.28}
        screenWidth={5.2}
        screenHeight={2.6}
        pillarHeight={2.35}
        campaign={rightAd.campaign}
        daysLeft={rightAd.daysLeft}
        lang={lang}
        isNight={isNight}
        isSoftwareGl={isSoftwareGl}
        onClick={onAdScreenClick}
      />

      {/* 3) Towering Skyline Rooftop Mega-Jumbotron (Always Visible Above the Shop!) */}
      <GiantBillboardUnit3D
        position={[0, 3.65, backZ - 0.55]}
        rotationY={0}
        screenWidth={8.6}
        screenHeight={3.2}
        pillarHeight={1.25}
        campaign={skylineAd.campaign}
        daysLeft={skylineAd.daysLeft}
        lang={lang}
        isNight={isNight}
        isSoftwareGl={isSoftwareGl}
        onClick={onAdScreenClick}
      />
    </group>
  );
};

interface NeighborHouseSpec {
  id: string;
  x: number;
  z: number;
  rotY: number;
  wallColor: string;
  trimColor: string;
  roofColor: string;
  doorColor: string;
  scale?: number;
}

/**
 * Composite procedural 3D neighborhood house (foundation, stucco walls, trim,
 * pitched hip roof, brick chimney, porch awning, warm night-lit windows, hedges).
 */
const NeighborHouseUnit3D: React.FC<{
  spec: NeighborHouseSpec;
  isNight: boolean;
  isSoftwareGl: boolean;
}> = ({ spec, isNight, isSoftwareGl }) => {
  const s = spec.scale ?? 1;
  return (
    <group position={[spec.x, 0, spec.z]} rotation={[0, spec.rotY, 0]} scale={[s, s, s]}>
      {/* Concrete Foundation Plinth */}
      <mesh position={[0, 0.09, 0]} receiveShadow={!isSoftwareGl}>
        <boxGeometry args={[5.15, 0.18, 4.35]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.9} />
      </mesh>

      {/* Main Painted Stucco Walls */}
      <mesh position={[0, 1.65, 0]} castShadow={!isSoftwareGl} receiveShadow={!isSoftwareGl}>
        <boxGeometry args={[4.75, 2.95, 3.95]} />
        <meshStandardMaterial color={spec.wallColor} roughness={0.85} />
      </mesh>

      {/* Lower Exterior Wainscoting Band */}
      <mesh position={[0, 0.44, 0]}>
        <boxGeometry args={[4.85, 0.52, 4.05]} />
        <meshStandardMaterial color={spec.trimColor} roughness={0.82} />
      </mesh>

      {/* Pitched 4-Sided Hip Roof (aligned with X/Z walls via Math.PI/4 rotation) */}
      <mesh
        position={[0, 3.9, 0]}
        rotation={[0, Math.PI / 4, 0]}
        scale={[1, 1, 0.85]}
        castShadow={!isSoftwareGl}
      >
        <coneGeometry args={[3.82, 1.56, 4]} />
        <meshStandardMaterial color={spec.roofColor} roughness={0.72} metalness={0.08} />
      </mesh>

      {/* Brick Chimney */}
      <mesh position={[1.38, 4.08, -0.58]} castShadow={!isSoftwareGl}>
        <boxGeometry args={[0.56, 1.28, 0.56]} />
        <meshStandardMaterial color="#9a3412" roughness={0.88} />
      </mesh>
      <mesh position={[1.38, 4.76, -0.58]}>
        <boxGeometry args={[0.68, 0.12, 0.68]} />
        <meshStandardMaterial color="#334155" roughness={0.7} metalness={0.25} />
      </mesh>

      {/* Front Door Frame + Wooden Door + Brass Doorknob */}
      <mesh position={[0, 1.13, 1.99]}>
        <boxGeometry args={[1.14, 1.96, 0.08]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.1, 2.04]}>
        <boxGeometry args={[0.96, 1.84, 0.08]} />
        <meshStandardMaterial color={spec.doorColor} roughness={0.65} />
      </mesh>
      <mesh position={[0.32, 1.06, 2.1]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.25} metalness={0.78} />
      </mesh>

      {/* Porch Canopy Awning + Stone Doorstep */}
      <mesh position={[0, 2.26, 2.34]} rotation={[0.2, 0, 0]} castShadow={!isSoftwareGl}>
        <boxGeometry args={[1.76, 0.12, 0.84]} />
        <meshStandardMaterial color={spec.roofColor} roughness={0.68} />
      </mesh>
      <mesh position={[0, 0.07, 2.34]} receiveShadow={!isSoftwareGl}>
        <boxGeometry args={[1.5, 0.14, 0.72]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.88} />
      </mesh>

      {/* Porch Lamp */}
      <mesh position={[0.74, 1.92, 2.08]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial
          color="#fef08a"
          emissive="#fbbf24"
          emissiveIntensity={isNight ? 1.55 : 0.25}
          roughness={0.25}
        />
      </mesh>

      {/* Two Framed Front Windows (Warm Interior Glow at Night) */}
      {[-1.48, 1.48].map((wx) => (
        <group key={wx} position={[wx, 1.68, 2.0]}>
          <mesh>
            <boxGeometry args={[0.96, 1.0, 0.09]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0, 0.04]}>
            <boxGeometry args={[0.78, 0.82, 0.05]} />
            <meshStandardMaterial
              color={isNight ? '#fde047' : '#bae6fd'}
              emissive={isNight ? '#f59e0b' : '#000000'}
              emissiveIntensity={isNight ? 0.92 : 0}
              roughness={0.18}
              metalness={0.25}
            />
          </mesh>
          <mesh position={[0, -0.54, 0.08]}>
            <boxGeometry args={[1.06, 0.12, 0.22]} />
            <meshStandardMaterial color={spec.trimColor} roughness={0.75} />
          </mesh>
        </group>
      ))}

      {/* Cozy Front Yard Hedge Bushes + Entry Stepping Path */}
      {[-1.85, 1.85].map((hx) => (
        <mesh key={hx} position={[hx, 0.36, 2.42]} castShadow={!isSoftwareGl}>
          <dodecahedronGeometry args={[0.42, 0]} />
          <meshStandardMaterial color="#16a34a" roughness={0.88} />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 3.05]}>
        <planeGeometry args={[1.22, 1.25]} />
        <meshStandardMaterial color="#d6d3d1" roughness={0.9} />
      </mesh>
    </group>
  );
};

/**
 * Surrounding 3D Neighborhood Houses:
 * - Flanking houses beside the Warehouse & Sleep House
 * - Back neighborhood lane & cozy row of houses behind the shop
 * - Across-the-street far sidewalk & facing row of neighborhood houses
 */
const NeighborhoodHouses3D: React.FC<{
  storageX: number;
  houseX: number;
  backZ: number;
  sidewalkTex: THREE.CanvasTexture;
  isNight: boolean;
  isSoftwareGl: boolean;
}> = ({ storageX, houseX, backZ, sidewalkTex, isNight, isSoftwareGl }) => {
  const houses = useMemo<NeighborHouseSpec[]>(
    () => [
      // Flanking left & right neighbor homes (visible immediately beside the shop!)
      {
        id: 'left-1',
        x: storageX - 6.8,
        z: -0.5,
        rotY: 0,
        wallColor: '#fef3c7',
        trimColor: '#d97706',
        roofColor: '#c2410c',
        doorColor: '#78350f',
        scale: 1.0,
      },
      {
        id: 'left-2',
        x: storageX - 13.6,
        z: -0.8,
        rotY: 0.06,
        wallColor: '#dbeafe',
        trimColor: '#3b82f6',
        roofColor: '#1e3a8a',
        doorColor: '#1e293b',
        scale: 0.96,
      },
      {
        id: 'right-1',
        x: houseX + 7.2,
        z: -0.5,
        rotY: 0,
        wallColor: '#d1fae5',
        trimColor: '#10b981',
        roofColor: '#15803d',
        doorColor: '#7c2d12',
        scale: 1.0,
      },
      {
        id: 'right-2',
        x: houseX + 14.0,
        z: -0.8,
        rotY: -0.06,
        wallColor: '#ffedd5',
        trimColor: '#f97316',
        roofColor: '#9f1239',
        doorColor: '#451a03',
        scale: 0.96,
      },

      // Back neighborhood skyline row behind the back lane
      {
        id: 'back-1',
        x: -21.5,
        z: backZ - 8.6,
        rotY: 0,
        wallColor: '#fce7f3',
        trimColor: '#ec4899',
        roofColor: '#831843',
        doorColor: '#78350f',
        scale: 1.02,
      },
      {
        id: 'back-2',
        x: -14.0,
        z: backZ - 8.6,
        rotY: 0,
        wallColor: '#e0f2fe',
        trimColor: '#0284c7',
        roofColor: '#0f766e',
        doorColor: '#7c2d12',
        scale: 1.04,
      },
      {
        id: 'back-3',
        x: -6.8,
        z: backZ - 8.6,
        rotY: 0,
        wallColor: '#fef9c3',
        trimColor: '#eab308',
        roofColor: '#b45309',
        doorColor: '#713f12',
        scale: 0.98,
      },
      {
        id: 'back-4',
        x: 6.8,
        z: backZ - 8.6,
        rotY: 0,
        wallColor: '#ede9fe',
        trimColor: '#8b5cf6',
        roofColor: '#4c1d95',
        doorColor: '#431407',
        scale: 1.0,
      },
      {
        id: 'back-5',
        x: 14.0,
        z: backZ - 8.6,
        rotY: 0,
        wallColor: '#dcfce7',
        trimColor: '#22c55e',
        roofColor: '#166534',
        doorColor: '#78350f',
        scale: 1.04,
      },
      {
        id: 'back-6',
        x: 21.5,
        z: backZ - 8.6,
        rotY: 0,
        wallColor: '#ffedd5',
        trimColor: '#ea580c',
        roofColor: '#9a3412',
        doorColor: '#451a03',
        scale: 1.0,
      },

      // Across-the-street row facing the Gum Shop
      {
        id: 'front-1',
        x: -16.5,
        z: 21.2,
        rotY: Math.PI,
        wallColor: '#fef3c7',
        trimColor: '#f59e0b',
        roofColor: '#b91c1c',
        doorColor: '#78350f',
        scale: 1.02,
      },
      {
        id: 'front-2',
        x: -8.2,
        z: 21.2,
        rotY: Math.PI,
        wallColor: '#dbeafe',
        trimColor: '#2563eb',
        roofColor: '#1e3a8a',
        doorColor: '#334155',
        scale: 1.0,
      },
      {
        id: 'front-3',
        x: 0.0,
        z: 21.2,
        rotY: Math.PI,
        wallColor: '#d1fae5',
        trimColor: '#059669',
        roofColor: '#065f46',
        doorColor: '#7c2d12',
        scale: 1.04,
      },
      {
        id: 'front-4',
        x: 8.2,
        z: 21.2,
        rotY: Math.PI,
        wallColor: '#fce7f3',
        trimColor: '#db2777',
        roofColor: '#9d174d',
        doorColor: '#78350f',
        scale: 1.0,
      },
      {
        id: 'front-5',
        x: 16.5,
        z: 21.2,
        rotY: Math.PI,
        wallColor: '#ede9fe',
        trimColor: '#7c3aed',
        roofColor: '#5b21b6',
        doorColor: '#451a03',
        scale: 1.02,
      },
    ],
    [storageX, houseX, backZ]
  );

  return (
    <group>
      {/* Back Neighborhood Pedestrian Lane */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.02, backZ - 4.1]}
        receiveShadow={!isSoftwareGl}
      >
        <planeGeometry args={[76, 2.7]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
      </mesh>

      {/* Far Sidewalk & Curb Across the Asphalt Street */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[3, -0.01, 16.95]}
        receiveShadow={!isSoftwareGl}
      >
        <planeGeometry args={[88, 2.7]} />
        <meshStandardMaterial map={sidewalkTex} roughness={0.9} />
      </mesh>
      <mesh position={[3, 0.04, 15.65]}>
        <boxGeometry args={[88, 0.14, 0.28]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.85} />
      </mesh>

      {/* Cozy Neighborhood Houses */}
      {houses.map((spec) => (
        <NeighborHouseUnit3D
          key={spec.id}
          spec={spec}
          isNight={isNight}
          isSoftwareGl={isSoftwareGl}
        />
      ))}

      {/* Neighborhood Yard Trees along Back Row */}
      {[-17.8, -10.4, 10.4, 17.8].map((tx) => (
        <group key={tx} position={[tx, 0, backZ - 7.6]}>
          <mesh position={[0, 1.05, 0]} castShadow={!isSoftwareGl}>
            <cylinderGeometry args={[0.2, 0.28, 2.1, 8]} />
            <meshStandardMaterial color="#78350f" roughness={0.9} />
          </mesh>
          <mesh position={[0, 2.7, 0]} castShadow={!isSoftwareGl}>
            <dodecahedronGeometry args={[1.3, 0]} />
            <meshStandardMaterial color="#22c55e" roughness={0.82} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

interface StrollerSpec {
  id: number;
  lane: 'front_window' | 'front_curb' | 'back_lane' | 'far_sidewalk';
  zOffset: number;
  startFrac: number;
  initialDir: 1 | -1;
  speed: number;
  shirtColor: string;
  pantsColor: string;
  hairColor: string;
  skinColor: string;
  capColor: string | null;
  bagColor: string | null;
  pauseInterval: number;
}

const STROLLER_SPECS: StrollerSpec[] = [
  // Front shop-window promenade (right past the Gum Shop & Sleep House!)
  {
    id: 0,
    lane: 'front_window',
    zOffset: 4.18,
    startFrac: 0.2,
    initialDir: 1,
    speed: 1.45,
    shirtColor: '#f43f5e',
    pantsColor: '#1e293b',
    hairColor: '#1c1917',
    skinColor: '#f5cba7',
    capColor: '#0d9488',
    bagColor: '#fbbf24',
    pauseInterval: 9.5,
  },
  {
    id: 1,
    lane: 'front_window',
    zOffset: 4.44,
    startFrac: 0.72,
    initialDir: -1,
    speed: 1.32,
    shirtColor: '#3b82f6',
    pantsColor: '#334155',
    hairColor: '#78350f',
    skinColor: '#eab68b',
    capColor: null,
    bagColor: '#ec4899',
    pauseInterval: 11.2,
  },
  {
    id: 2,
    lane: 'front_window',
    zOffset: 4.28,
    startFrac: 0.48,
    initialDir: 1,
    speed: 1.62,
    shirtColor: '#10b981',
    pantsColor: '#1e3a8a',
    hairColor: '#292524',
    skinColor: '#f3d0b1',
    capColor: '#f59e0b',
    bagColor: null,
    pauseInterval: 13.0,
  },
  // Front curb sidewalk promenade (along billboards & street edge)
  {
    id: 3,
    lane: 'front_curb',
    zOffset: 8.32,
    startFrac: 0.14,
    initialDir: 1,
    speed: 1.55,
    shirtColor: '#a855f7',
    pantsColor: '#1e293b',
    hairColor: '#0f172a',
    skinColor: '#e2ab82',
    capColor: null,
    bagColor: '#38bdf8',
    pauseInterval: 10.4,
  },
  {
    id: 4,
    lane: 'front_curb',
    zOffset: 8.56,
    startFrac: 0.62,
    initialDir: -1,
    speed: 1.72,
    shirtColor: '#f97316',
    pantsColor: '#3f3f46',
    hairColor: '#451a03',
    skinColor: '#f5cba7',
    capColor: '#e11d48',
    bagColor: null,
    pauseInterval: 12.6,
  },
  {
    id: 5,
    lane: 'front_curb',
    zOffset: 8.42,
    startFrac: 0.88,
    initialDir: -1,
    speed: 1.38,
    shirtColor: '#06b6d4',
    pantsColor: '#0f172a',
    hairColor: '#92400e',
    skinColor: '#f1c29b',
    capColor: null,
    bagColor: '#22c55e',
    pauseInterval: 14.2,
  },
  // Back neighborhood lane (strolling past the backyard houses)
  {
    id: 6,
    lane: 'back_lane',
    zOffset: -3.7,
    startFrac: 0.28,
    initialDir: 1,
    speed: 1.48,
    shirtColor: '#eab308',
    pantsColor: '#1e293b',
    hairColor: '#1c1917',
    skinColor: '#f5cba7',
    capColor: '#2563eb',
    bagColor: null,
    pauseInterval: 15.0,
  },
  {
    id: 7,
    lane: 'back_lane',
    zOffset: -4.45,
    startFrac: 0.78,
    initialDir: -1,
    speed: 1.34,
    shirtColor: '#ec4899',
    pantsColor: '#334155',
    hairColor: '#57534e',
    skinColor: '#e8b48a',
    capColor: null,
    bagColor: '#a855f7',
    pauseInterval: 16.5,
  },
  // Far sidewalk across the street (strolling past the facing houses)
  {
    id: 8,
    lane: 'far_sidewalk',
    zOffset: 16.35,
    startFrac: 0.35,
    initialDir: 1,
    speed: 1.5,
    shirtColor: '#14b8a6',
    pantsColor: '#1e293b',
    hairColor: '#1c1917',
    skinColor: '#f5cba7',
    capColor: '#7c3aed',
    bagColor: null,
    pauseInterval: 14.0,
  },
  {
    id: 9,
    lane: 'far_sidewalk',
    zOffset: 17.05,
    startFrac: 0.82,
    initialDir: -1,
    speed: 1.4,
    shirtColor: '#ef4444',
    pantsColor: '#334155',
    hairColor: '#713f12',
    skinColor: '#ecc09a',
    capColor: null,
    bagColor: '#f59e0b',
    pauseInterval: 15.5,
  },
];

interface StrollerRuntimeState {
  x: number;
  dir: 1 | -1;
  walkPhase: number;
  pauseTimer: number;
  nextPauseTimer: number;
  rotY: number;
}

/**
 * Animated 3D Neighborhood Townsfolk strolling outside along the sidewalks,
 * shopfront promenade, and neighbor house lanes (zero GC allocations in useFrame).
 */
const NeighborhoodStrollers3D: React.FC<{
  storageX: number;
  houseX: number;
  backZ: number;
  isSoftwareGl: boolean;
}> = ({ storageX, houseX, backZ, isSoftwareGl }) => {
  const groupRefs = useRef<(THREE.Group | null)[]>([]);
  const leftLegRefs = useRef<(THREE.Mesh | null)[]>([]);
  const rightLegRefs = useRef<(THREE.Mesh | null)[]>([]);
  const leftArmRefs = useRef<(THREE.Mesh | null)[]>([]);
  const rightArmRefs = useRef<(THREE.Mesh | null)[]>([]);

  const minFrontX = storageX - 10.5;
  const maxFrontX = houseX + 10.5;

  const statesRef = useRef<StrollerRuntimeState[]>(
    STROLLER_SPECS.map((s) => {
      const minX = s.lane === 'back_lane' || s.lane === 'far_sidewalk' ? -20 : minFrontX;
      const maxX = s.lane === 'back_lane' || s.lane === 'far_sidewalk' ? 20 : maxFrontX;
      return {
        x: minX + (maxX - minX) * s.startFrac,
        dir: s.initialDir,
        walkPhase: s.id * 1.15,
        pauseTimer: 0,
        nextPauseTimer: 3.5 + (s.id % 4) * 2.2,
        rotY: s.initialDir > 0 ? Math.PI / 2 : -Math.PI / 2,
      };
    })
  );

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const states = statesRef.current;

    for (let i = 0; i < STROLLER_SPECS.length; i++) {
      const spec = STROLLER_SPECS[i];
      const st = states[i];
      const grp = groupRefs.current[i];
      if (!grp || !st) continue;

      const isFront = spec.lane === 'front_window' || spec.lane === 'front_curb';
      const minX = isFront ? minFrontX : -20.5;
      const maxX = isFront ? maxFrontX : 20.5;
      const laneZ = spec.lane === 'back_lane' ? backZ + spec.zOffset : spec.zOffset;

      let targetRotY = st.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      let swing = 0;
      let bobY = 0;

      if (st.pauseTimer > 0) {
        st.pauseTimer -= dt;
        // Turn casually to admire the shop window / billboards / houses
        targetRotY = isFront ? Math.PI : 0;
      } else {
        st.x += st.dir * spec.speed * dt;
        if (st.x >= maxX) {
          st.x = maxX;
          st.dir = -1;
        } else if (st.x <= minX) {
          st.x = minX;
          st.dir = 1;
        }

        st.nextPauseTimer -= dt;
        if (st.nextPauseTimer <= 0 && Math.abs(st.x) < 10.5) {
          st.pauseTimer = 1.6 + (spec.id % 3) * 0.55;
          st.nextPauseTimer = spec.pauseInterval;
        }

        st.walkPhase += dt * spec.speed * 5.2;
        swing = Math.sin(st.walkPhase) * 0.48;
        bobY = Math.abs(Math.sin(st.walkPhase)) * 0.042;
      }

      // Shortest-angle smooth turn
      let diff = targetRotY - st.rotY;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      st.rotY += diff * Math.min(1, dt * 8);

      grp.position.set(st.x, bobY, laneZ);
      grp.rotation.y = st.rotY;

      const lLeg = leftLegRefs.current[i];
      const rLeg = rightLegRefs.current[i];
      const lArm = leftArmRefs.current[i];
      const rArm = rightArmRefs.current[i];
      if (lLeg) lLeg.rotation.x = swing;
      if (rLeg) rLeg.rotation.x = -swing;
      if (lArm) lArm.rotation.x = -swing * 0.85;
      if (rArm) rArm.rotation.x = swing * 0.85;
    }
  });

  return (
    <group>
      {STROLLER_SPECS.map((s, idx) => (
        <group
          key={s.id}
          ref={(el) => {
            groupRefs.current[idx] = el;
          }}
        >
          {/* Left & Right Legs */}
          <mesh
            ref={(el) => {
              leftLegRefs.current[idx] = el;
            }}
            position={[-0.13, 0.34, 0]}
            castShadow={!isSoftwareGl}
          >
            <boxGeometry args={[0.16, 0.68, 0.18]} />
            <meshStandardMaterial color={s.pantsColor} roughness={0.8} />
          </mesh>
          <mesh
            ref={(el) => {
              rightLegRefs.current[idx] = el;
            }}
            position={[0.13, 0.34, 0]}
            castShadow={!isSoftwareGl}
          >
            <boxGeometry args={[0.16, 0.68, 0.18]} />
            <meshStandardMaterial color={s.pantsColor} roughness={0.8} />
          </mesh>

          {/* Torso / Shirt */}
          <mesh position={[0, 0.98, 0]} castShadow={!isSoftwareGl}>
            <boxGeometry args={[0.5, 0.66, 0.3]} />
            <meshStandardMaterial color={s.shirtColor} roughness={0.68} />
          </mesh>

          {/* Left & Right Swinging Arms */}
          <mesh
            ref={(el) => {
              leftArmRefs.current[idx] = el;
            }}
            position={[-0.33, 0.96, 0]}
          >
            <boxGeometry args={[0.13, 0.54, 0.14]} />
            <meshStandardMaterial color={s.shirtColor} roughness={0.72} />
          </mesh>
          <mesh
            ref={(el) => {
              rightArmRefs.current[idx] = el;
            }}
            position={[0.33, 0.96, 0]}
          >
            <boxGeometry args={[0.13, 0.54, 0.14]} />
            <meshStandardMaterial color={s.shirtColor} roughness={0.72} />
          </mesh>

          {/* Optional Handheld Shopping Tote Bag */}
          {s.bagColor && (
            <mesh position={[0.38, 0.64, 0.08]}>
              <boxGeometry args={[0.14, 0.28, 0.24]} />
              <meshStandardMaterial color={s.bagColor} roughness={0.55} />
            </mesh>
          )}

          {/* Head */}
          <mesh position={[0, 1.52, 0]} castShadow={!isSoftwareGl}>
            <sphereGeometry args={[0.23, 12, 12]} />
            <meshStandardMaterial color={s.skinColor} roughness={0.7} />
          </mesh>

          {/* Hair or Sun Cap */}
          {s.capColor ? (
            <group>
              <mesh position={[0, 1.69, 0]}>
                <cylinderGeometry args={[0.24, 0.24, 0.13, 12]} />
                <meshStandardMaterial color={s.capColor} roughness={0.55} />
              </mesh>
              <mesh position={[0, 1.66, 0.19]}>
                <boxGeometry args={[0.3, 0.04, 0.18]} />
                <meshStandardMaterial color={s.capColor} roughness={0.55} />
              </mesh>
            </group>
          ) : (
            <mesh position={[0, 1.65, -0.02]}>
              <sphereGeometry args={[0.21, 10, 10]} />
              <meshStandardMaterial color={s.hairColor} roughness={0.85} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
};

const ShopEnvironment: React.FC<{
  worldRef: React.MutableRefObject<GumShopWorld>;
  isSoftwareGl: boolean;
  shopLevel: ShopLevel;
  cashierX: number;
  cashierZ: number;
  isNight: boolean;
  houseDoorUnlocked: boolean;
  hasStorageRoom: boolean;
  storageStock: Partial<Record<GumFlavorId, number>>;
  activeAds: ActiveAdState[];
  lang: 'ar' | 'en';
  hasNeonSign: boolean;
  moveCashierMode: boolean;
  moveShelfSelected: boolean;
  onFloorClick: (x: number, z: number) => void;
  onMoveCashierTo: (x: number, z: number) => void;
  onMoveShelfTo: (x: number, z: number) => void;
  onCheckoutClick: () => void;
  onHouseDoorClick: () => void;
  onBedClick: () => void;
  onStorageClick: () => void;
  onAdScreenClick: () => void;
}> = ({
  worldRef,
  isSoftwareGl,
  shopLevel,
  cashierX,
  cashierZ,
  isNight,
  houseDoorUnlocked,
  hasStorageRoom,
  storageStock,
  activeAds,
  lang,
  hasNeonSign,
  moveCashierMode,
  moveShelfSelected,
  onFloorClick,
  onMoveCashierTo,
  onMoveShelfTo,
  onCheckoutClick,
  onHouseDoorClick,
  onBedClick,
  onStorageClick,
  onAdScreenClick,
}) => {
  const { scene, gl } = useThree();
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);
  const shopInteriorLightRef = useRef<THREE.PointLight | null>(null);

  const bounds = getShopBounds(shopLevel);

  useEffect(() => {
    scene.background = new THREE.Color('#a7d8f0');
    scene.fog = new THREE.FogExp2('#cfe7f5', 0.012);

    let envRT: THREE.WebGLRenderTarget | null = null;
    try {
      const pmrem = new THREE.PMREMGenerator(gl);
      envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
      scene.environment = envRT.texture;
      pmrem.dispose();
    } catch {
      // Direct lights still keep scene bright & crisp
    }
    return () => {
      scene.environment = null;
      if (envRT) envRT.dispose();
    };
  }, [gl, scene]);

  // Smooth Day -> Golden Dusk -> Cozy Night lighting transition (zero GC allocations)
  useFrame(() => {
    const world = worldRef.current;
    const progress = world.isNight
      ? 1
      : 1 - Math.max(0, Math.min(1, world.dayTimeLeft / DAY_DURATION_SEC));

    if (progress <= 0.62) {
      TMP_SKY.copy(SKY_DAY);
      TMP_FOG.copy(FOG_DAY);
      TMP_SUN.copy(SUN_DAY);
      if (dirLightRef.current) dirLightRef.current.intensity = 1.9;
      if (hemiLightRef.current) hemiLightRef.current.intensity = 0.92;
      if (shopInteriorLightRef.current) shopInteriorLightRef.current.intensity = 1.1;
    } else if (progress <= 0.88) {
      const t = (progress - 0.62) / 0.26;
      TMP_SKY.copy(SKY_DAY).lerp(SKY_DUSK, t);
      TMP_FOG.copy(FOG_DAY).lerp(FOG_DUSK, t);
      TMP_SUN.copy(SUN_DAY).lerp(SUN_DUSK, t);
      if (dirLightRef.current) dirLightRef.current.intensity = THREE.MathUtils.lerp(1.9, 1.35, t);
      if (hemiLightRef.current) hemiLightRef.current.intensity = THREE.MathUtils.lerp(0.92, 0.72, t);
      if (shopInteriorLightRef.current)
        shopInteriorLightRef.current.intensity = THREE.MathUtils.lerp(1.1, 1.65, t);
    } else {
      const t = Math.min(1, (progress - 0.88) / 0.12);
      TMP_SKY.copy(SKY_DUSK).lerp(SKY_NIGHT, t);
      TMP_FOG.copy(FOG_DUSK).lerp(FOG_NIGHT, t);
      TMP_SUN.copy(SUN_DUSK).lerp(SUN_NIGHT, t);
      if (dirLightRef.current) dirLightRef.current.intensity = THREE.MathUtils.lerp(1.35, 0.68, t);
      if (hemiLightRef.current) hemiLightRef.current.intensity = THREE.MathUtils.lerp(0.72, 0.52, t);
      if (shopInteriorLightRef.current)
        shopInteriorLightRef.current.intensity = THREE.MathUtils.lerp(1.65, 2.35, t);
    }

    if (scene.background instanceof THREE.Color) {
      scene.background.copy(TMP_SKY);
    }
    if (scene.fog instanceof THREE.FogExp2) {
      scene.fog.color.copy(TMP_FOG);
    }
    if (dirLightRef.current) {
      dirLightRef.current.color.copy(TMP_SUN);
    }
  });

  const tileTex = useMemo(
    () => createShopTileTexture(gl.capabilities.getMaxAnisotropy()),
    [gl]
  );
  const sidewalkTex = useMemo(
    () => createSidewalkTexture(gl.capabilities.getMaxAnisotropy()),
    [gl]
  );

  useEffect(() => {
    tileTex.repeat.set(Math.round(bounds.halfW * 0.5), Math.round(bounds.depth * 0.3));
    tileTex.needsUpdate = true;
  }, [tileTex, bounds.halfW, bounds.depth]);

  useEffect(() => {
    return () => {
      tileTex.dispose();
      sidewalkTex.dispose();
    };
  }, [tileTex, sidewalkTex]);

  const shopWidth = bounds.halfW * 2;
  const frontWinWidth = Math.max(2.0, bounds.halfW - DOOR_HALF_WIDTH);
  const frontWinCenter = DOOR_HALF_WIDTH + frontWinWidth / 2;
  const awningCount = Math.max(12, Math.floor(shopWidth));
  const awningStep = shopWidth / awningCount;
  const sidewalkLeft = bounds.storageX - 3.6;
  const sidewalkRight = bounds.houseX + 6.4;
  const sidewalkWidth = sidewalkRight - sidewalkLeft;
  const sidewalkCenterX = (sidewalkLeft + sidewalkRight) / 2;

  return (
    <group>
      {/* Dynamic Sun/Moon Directional Key + Hemisphere Fill + Warm Shop Interior Lamp */}
      <directionalLight
        ref={dirLightRef}
        color="#fff3d6"
        intensity={1.9}
        position={[12, 22, 16]}
        castShadow={!isSoftwareGl}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={2}
        shadow-camera-far={65}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
        shadow-bias={-0.0005}
      />
      <hemisphereLight ref={hemiLightRef} args={['#bae6fd', '#84cc16', 0.92]} />
      <pointLight
        ref={shopInteriorLightRef}
        position={[0, 4.4, bounds.centerZ]}
        intensity={1.1}
        distance={22}
        color="#fff7ed"
      />

      {/* Outer Grass / Neighborhood Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[3, -0.06, 2]} receiveShadow={!isSoftwareGl}>
        <planeGeometry args={[110, 90]} />
        <meshStandardMaterial color="#65a34e" roughness={0.95} />
      </mesh>

      {/* Asphalt Neighborhood Street */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[3, -0.03, 12.2]} receiveShadow={!isSoftwareGl}>
        <planeGeometry args={[90, 7]} />
        <meshStandardMaterial color="#334155" roughness={0.92} />
      </mesh>
      {[-16, -11, -6, -1, 4, 9, 14, 19, 24].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, -0.02, 12.2]}>
          <planeGeometry args={[2.6, 0.25]} />
          <meshStandardMaterial color="#fde047" roughness={0.7} />
        </mesh>
      ))}

      {/* Outdoor Sidewalk spanning Shop Front + Sleep House Front */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[sidewalkCenterX, -0.01, 6.0]}
        receiveShadow={!isSoftwareGl}
        onClick={(e) => {
          e.stopPropagation();
          onFloorClick(e.point.x, e.point.z);
        }}
      >
        <planeGeometry args={[sidewalkWidth, 6.4]} />
        <meshStandardMaterial map={sidewalkTex} roughness={0.9} />
      </mesh>

      {/* Curb Edge */}
      <mesh position={[sidewalkCenterX, 0.04, 8.95]}>
        <boxGeometry args={[sidewalkWidth, 0.14, 0.28]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.85} />
      </mesh>

      {/* Stepping-Stone Walkway to Sleep House Door */}
      {[3.15, 3.85, 4.55].map((sz) => (
        <mesh key={sz} rotation={[-Math.PI / 2, 0, 0]} position={[bounds.houseX, 0.01, sz]}>
          <planeGeometry args={[1.65, 0.55]} />
          <meshStandardMaterial color="#d6d3d1" roughness={0.88} />
        </mesh>
      ))}

      {/* Outdoor Delivery Drop Zone Mat (Left of Door) */}
      <group position={[-3.55, 0.01, 6.2]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[3.4, 3.0]} />
          <meshStandardMaterial color="#fef08a" roughness={0.75} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
          <planeGeometry args={[3.0, 2.6]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.8} />
        </mesh>
      </group>

      {/* Expandable Interior Shop Floor (Walk / Place Cashier / Place Selected Shelf) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, bounds.centerZ]}
        receiveShadow={!isSoftwareGl}
        onClick={(e) => {
          e.stopPropagation();
          if (moveCashierMode) {
            onMoveCashierTo(e.point.x, e.point.z);
          } else if (moveShelfSelected) {
            onMoveShelfTo(e.point.x, e.point.z);
          } else {
            onFloorClick(e.point.x, e.point.z);
          }
        }}
      >
        <planeGeometry args={[shopWidth, bounds.depth]} />
        <meshStandardMaterial
          map={tileTex}
          color={moveCashierMode || moveShelfSelected ? '#e0f2fe' : '#ffffff'}
          roughness={0.62}
          metalness={0.05}
        />
      </mesh>

      {/* Welcome Doorway Mat */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, DOOR_Z]}>
        <planeGeometry args={[3.0, 1.0]} />
        <meshStandardMaterial color="#0d9488" roughness={0.85} />
      </mesh>

      {/* Expandable Back Shop Wall */}
      <mesh position={[0, 2.2, bounds.backZ]} receiveShadow={!isSoftwareGl}>
        <boxGeometry args={[shopWidth + 0.3, 4.4, 0.3]} />
        <meshStandardMaterial color="#fef3c7" roughness={0.82} />
      </mesh>
      <mesh position={[0, 0.65, bounds.backZ + 0.18]}>
        <boxGeometry args={[shopWidth, 1.3, 0.08]} />
        <meshStandardMaterial color="#2dd4bf" roughness={0.7} />
      </mesh>

      {/* Expandable Left & Right Shop Side Walls */}
      <mesh position={[-bounds.halfW, 2.2, bounds.centerZ]} receiveShadow={!isSoftwareGl}>
        <boxGeometry args={[0.3, 4.4, bounds.depth + 0.2]} />
        <meshStandardMaterial color="#fde68a" roughness={0.82} />
      </mesh>
      <mesh position={[bounds.halfW, 2.2, bounds.centerZ]} receiveShadow={!isSoftwareGl}>
        <boxGeometry args={[0.3, 4.4, bounds.depth + 0.2]} />
        <meshStandardMaterial color="#fde68a" roughness={0.82} />
      </mesh>

      {/* Expandable Front Storefront Wall Segments */}
      {[-frontWinCenter, frontWinCenter].map((wx) => (
        <group key={wx} position={[wx, 0, DOOR_Z]}>
          <mesh position={[0, 0.52, 0]} castShadow={!isSoftwareGl}>
            <boxGeometry args={[frontWinWidth + 0.1, 1.04, 0.28]} />
            <meshStandardMaterial color="#fb7185" roughness={0.76} />
          </mesh>
          <mesh position={[0, 2.1, 0]}>
            <boxGeometry args={[Math.max(1.6, frontWinWidth - 0.25), 2.1, 0.08]} />
            <meshStandardMaterial
              color={isNight ? '#fef08a' : '#bae6fd'}
              emissive={isNight ? '#f59e0b' : '#000000'}
              emissiveIntensity={isNight ? 0.25 : 0}
              transparent
              opacity={0.3}
              roughness={0.12}
              metalness={0.35}
            />
          </mesh>
          <mesh position={[0, 3.7, 0]}>
            <boxGeometry args={[frontWinWidth + 0.1, 1.1, 0.3]} />
            <meshStandardMaterial color="#fef3c7" roughness={0.78} />
          </mesh>
        </group>
      ))}

      {/* Doorway Top Beam & Side Pillars */}
      <mesh position={[0, 3.7, DOOR_Z]}>
        <boxGeometry args={[3.5, 1.1, 0.32]} />
        <meshStandardMaterial color="#fef3c7" roughness={0.78} />
      </mesh>
      <mesh position={[-1.68, 1.75, DOOR_Z]}>
        <boxGeometry args={[0.16, 3.5, 0.32]} />
        <meshStandardMaterial color="#0f766e" roughness={0.5} />
      </mesh>
      <mesh position={[1.68, 1.75, DOOR_Z]}>
        <boxGeometry args={[0.16, 3.5, 0.32]} />
        <meshStandardMaterial color="#0f766e" roughness={0.5} />
      </mesh>

      {/* Expandable Striped Candy-Shop Awning */}
      {Array.from({ length: awningCount }, (_, idx) => {
        const ax = -bounds.halfW + awningStep * (idx + 0.5);
        return (
          <mesh
            key={idx}
            position={[ax, 3.25, DOOR_Z + 0.85]}
            rotation={[0.38, 0, 0]}
            castShadow={!isSoftwareGl}
          >
            <boxGeometry args={[awningStep, 0.12, 1.8]} />
            <meshStandardMaterial
              color={idx % 2 === 0 ? '#f43f5e' : '#fffbeb'}
              roughness={0.68}
            />
          </mesh>
        );
      })}

      {/* Storefront Signboard */}
      <group position={[0, 4.55, DOOR_Z + 0.18]}>
        <mesh castShadow={!isSoftwareGl}>
          <boxGeometry args={[5.8 + (shopLevel - 1) * 1.4, 0.92, 0.22]} />
          <meshStandardMaterial
            color={hasNeonSign || isNight ? '#0f172a' : '#134e4a'}
            emissive={hasNeonSign ? '#f43f5e' : isNight ? '#14b8a6' : '#0f766e'}
            emissiveIntensity={hasNeonSign ? 0.78 : isNight ? 0.45 : 0.15}
            roughness={0.35}
            metalness={0.3}
          />
        </mesh>
        {[-2.2, -1.5, 1.5, 2.2].map((ox, i) => (
          <mesh key={ox} position={[ox, 0, 0.16]}>
            <sphereGeometry args={[0.22, 12, 12]} />
            <meshStandardMaterial
              color={['#14b8a6', '#f43f5e', '#fbbf24', '#a855f7'][i]}
              emissive={
                hasNeonSign || isNight
                  ? ['#14b8a6', '#f43f5e', '#fbbf24', '#a855f7'][i]
                  : '#000000'
              }
              emissiveIntensity={hasNeonSign ? 0.78 : isNight ? 0.45 : 0}
              roughness={0.22}
              metalness={0.25}
            />
          </mesh>
        ))}
      </group>

      {/* Enterable Cozy 3D Sleep House right beside the shop! */}
      <SleepHouse3D
        houseX={bounds.houseX}
        houseZ={bounds.houseZ}
        isNight={isNight}
        houseDoorUnlocked={houseDoorUnlocked}
        isSoftwareGl={isSoftwareGl}
        onFloorClick={onFloorClick}
        onHouseDoorClick={onHouseDoorClick}
        onBedClick={onBedClick}
      />

      {/* 3D Storage Warehouse (200 SAR) on the left side of the shop! */}
      <StorageWarehouse3D
        storageX={bounds.storageX}
        storageZ={bounds.storageZ}
        hasStorageRoom={hasStorageRoom}
        storageStock={storageStock}
        isNight={isNight}
        lang={lang}
        isSoftwareGl={isSoftwareGl}
        onStorageClick={onStorageClick}
      />

      {/* 3 Giant 3D Outdoor Billboards & Glowing LED Ad Screens! */}
      <OutdoorAdScreens3D
        halfW={bounds.halfW}
        backZ={bounds.backZ}
        houseX={bounds.houseX}
        activeAds={activeAds}
        lang={lang}
        isNight={isNight}
        isSoftwareGl={isSoftwareGl}
        onAdScreenClick={onAdScreenClick}
      />

      {/* Surrounding 3D Neighborhood Houses & Lanes */}
      <NeighborhoodHouses3D
        storageX={bounds.storageX}
        houseX={bounds.houseX}
        backZ={bounds.backZ}
        sidewalkTex={sidewalkTex}
        isNight={isNight}
        isSoftwareGl={isSoftwareGl}
      />

      {/* Animated 3D Neighborhood Townsfolk Strolling Outside */}
      <NeighborhoodStrollers3D
        storageX={bounds.storageX}
        houseX={bounds.houseX}
        backZ={bounds.backZ}
        isSoftwareGl={isSoftwareGl}
      />

      {/* Outdoor Decorative Trees (outside Warehouse & Right Giant Screen) */}
      {[-(bounds.halfW + 7.4), bounds.houseX + 6.4].map((tx) => (
        <group key={tx} position={[tx, 0, 5.2]}>
          <mesh position={[0, 1.1, 0]} castShadow={!isSoftwareGl}>
            <cylinderGeometry args={[0.24, 0.34, 2.2, 8]} />
            <meshStandardMaterial color="#78350f" roughness={0.9} />
          </mesh>
          <mesh position={[0, 2.9, 0]} castShadow={!isSoftwareGl}>
            <dodecahedronGeometry args={[1.45, 0]} />
            <meshStandardMaterial color="#22c55e" roughness={0.82} />
          </mesh>
        </group>
      ))}

      {/* Moveable 3D Checkout Counter & Cash Register */}
      <group
        position={[cashierX, 0, cashierZ]}
        onClick={(e) => {
          e.stopPropagation();
          if (!moveCashierMode && !moveShelfSelected) {
            onCheckoutClick();
          }
        }}
      >
        {moveCashierMode && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
            <ringGeometry args={[1.25, 1.52, 32]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
        )}
        <mesh position={[0, 0.55, 0]} castShadow={!isSoftwareGl}>
          <boxGeometry args={[1.35, 1.1, 2.2]} />
          <meshStandardMaterial
            color={moveCashierMode ? '#0284c7' : '#b45309'}
            emissive={moveCashierMode ? '#0369a1' : '#000000'}
            emissiveIntensity={moveCashierMode ? 0.35 : 0}
            roughness={0.72}
          />
        </mesh>
        <mesh position={[0, 1.13, 0]}>
          <boxGeometry args={[1.5, 0.1, 2.35]} />
          <meshStandardMaterial color="#fef3c7" roughness={0.4} metalness={0.1} />
        </mesh>
        {/* Cash Register */}
        <mesh position={[0, 1.38, -0.35]} castShadow={!isSoftwareGl}>
          <boxGeometry args={[0.56, 0.4, 0.52]} />
          <meshStandardMaterial color="#1e293b" roughness={0.35} metalness={0.5} />
        </mesh>
        <mesh position={[-0.14, 1.62, -0.35]} rotation={[0, -0.3, 0]}>
          <boxGeometry args={[0.32, 0.24, 0.06]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#0284c7"
            emissiveIntensity={0.55}
            roughness={0.2}
          />
        </mesh>
        {/* Classic Glass Gumball Jar on Counter */}
        <mesh position={[0.1, 1.3, 0.55]}>
          <cylinderGeometry args={[0.22, 0.26, 0.26, 12]} />
          <meshStandardMaterial color="#e11d48" roughness={0.35} metalness={0.35} />
        </mesh>
        <mesh position={[0.1, 1.62, 0.55]}>
          <sphereGeometry args={[0.27, 14, 12]} />
          <meshStandardMaterial
            color="#f0f9ff"
            transparent
            opacity={0.45}
            roughness={0.1}
            metalness={0.2}
          />
        </mesh>
        <mesh position={[0.1, 1.6, 0.55]}>
          <sphereGeometry args={[0.18, 10, 10]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.35} />
        </mesh>
      </group>
    </group>
  );
};

/**
 * Dynamic, Moveable & Rotatable 3D Display Shelf showing real stacked 3D gum packs.
 */
const GumShelf3D: React.FC<{
  shelf: ShelfState;
  highlightStock: boolean;
  moveMode: boolean;
  isSelectedForMove: boolean;
  isSoftwareGl: boolean;
  onClick: () => void;
}> = ({ shelf, highlightStock, moveMode, isSelectedForMove, isSoftwareGl, onClick }) => {
  const frameColor =
    isSelectedForMove
      ? '#06b6d4'
      : shelf.style === 'gold'
      ? '#d97706'
      : shelf.style === 'acrylic'
      ? '#0284c7'
      : '#92400e';
  const boardColor =
    shelf.style === 'gold'
      ? '#fef08a'
      : shelf.style === 'acrylic'
      ? '#e0f2fe'
      : '#d6a461';
  const metalness = shelf.style === 'gold' ? 0.72 : shelf.style === 'acrylic' ? 0.25 : 0.05;

  const flavorSpec = shelf.flavor ? GUM_FLAVOR_MAP[shelf.flavor] : null;
  const visiblePacks = Math.min(SHELF_MAX_STOCK, shelf.stock);

  const ringColor = isSelectedForMove
    ? '#22d3ee'
    : moveMode
    ? '#fbbf24'
    : highlightStock
    ? '#34d399'
    : null;

  return (
    <group
      position={[shelf.x, 0, shelf.z]}
      rotation={[0, shelf.rotY, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {/* Status / Move Highlight Ring */}
      {ringColor && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <ringGeometry args={[1.05, 1.32, 28]} />
          <meshBasicMaterial color={ringColor} />
        </mesh>
      )}

      {/* Side Uprights */}
      {[-0.95, 0.95].map((ux) => (
        <mesh key={ux} position={[ux, 1.0, 0]} castShadow={!isSoftwareGl}>
          <boxGeometry args={[0.12, 2.0, 0.68]} />
          <meshStandardMaterial
            color={frameColor}
            emissive={isSelectedForMove ? '#0891b2' : '#000000'}
            emissiveIntensity={isSelectedForMove ? 0.4 : 0}
            roughness={0.45}
            metalness={metalness}
          />
        </mesh>
      ))}
      {/* Back Panel */}
      <mesh position={[0, 1.0, -0.32]}>
        <boxGeometry args={[1.9, 1.95, 0.06]} />
        <meshStandardMaterial color={boardColor} roughness={0.65} metalness={metalness * 0.5} />
      </mesh>
      {/* Top Flavor Banner Strip */}
      <mesh position={[0, 2.06, 0]}>
        <boxGeometry args={[2.02, 0.16, 0.72]} />
        <meshStandardMaterial
          color={flavorSpec ? flavorSpec.color : frameColor}
          roughness={0.35}
          metalness={metalness * 0.6}
        />
      </mesh>

      {/* 3 Horizontal Shelf Tiers */}
      {[0.38, 0.98, 1.56].map((ty) => (
        <mesh key={ty} position={[0, ty, 0]} receiveShadow={!isSoftwareGl}>
          <boxGeometry args={[1.88, 0.08, 0.64]} />
          <meshStandardMaterial color={boardColor} roughness={0.55} metalness={metalness * 0.4} />
        </mesh>
      ))}

      {/* Up to 6 Crisp 3D Gum Packs (2 packs per tier × 3 tiers = 6 packs max) */}
      {flavorSpec &&
        Array.from({ length: visiblePacks }, (_, idx) => {
          const tier = Math.floor(idx / 2);
          const col = idx % 2;
          const px = col === 0 ? -0.45 : 0.45;
          const py = [0.57, 1.17, 1.75][tier] ?? 0.57;
          const pz = 0.05;
          return (
            <group key={idx} position={[px, py, pz]}>
              <mesh castShadow={!isSoftwareGl}>
                <boxGeometry args={[0.56, 0.28, 0.28]} />
                <meshStandardMaterial color={flavorSpec.color} roughness={0.3} metalness={0.15} />
              </mesh>
              <mesh position={[0, 0, 0.146]}>
                <boxGeometry args={[0.42, 0.1, 0.015]} />
                <meshStandardMaterial color={flavorSpec.accent} roughness={0.35} />
              </mesh>
            </group>
          );
        })}
    </group>
  );
};

/**
 * Outdoor Delivery Gum Box sitting on the sidewalk with a bobbing beacon arrow.
 */
const OutdoorCrate3D: React.FC<{
  crate: DeliveryCrateState;
  isSoftwareGl: boolean;
  onClick: () => void;
}> = ({ crate, isSoftwareGl, onClick }) => {
  const arrowRef = useRef<THREE.Mesh | null>(null);
  const spec = GUM_FLAVOR_MAP[crate.flavor];

  useFrame(({ clock }) => {
    if (arrowRef.current) {
      arrowRef.current.position.y = 1.25 + Math.sin(clock.getElapsedTime() * 4.2 + crate.id) * 0.16;
      arrowRef.current.rotation.y = clock.getElapsedTime() * 1.8;
    }
  });

  return (
    <group
      position={[crate.x, 0, crate.z]}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <mesh position={[0, 0.32, 0]} castShadow={!isSoftwareGl}>
        <boxGeometry args={[0.74, 0.62, 0.64]} />
        <meshStandardMaterial color="#d4a373" roughness={0.86} />
      </mesh>
      <mesh position={[0, 0.34, 0]}>
        <boxGeometry args={[0.76, 0.18, 0.66]} />
        <meshStandardMaterial color={spec.color} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.64, 0]}>
        <boxGeometry args={[0.38, 0.02, 0.32]} />
        <meshStandardMaterial color={spec.accent} roughness={0.5} />
      </mesh>
      <mesh ref={arrowRef} position={[0, 1.25, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.18, 0.34, 6]} />
        <meshStandardMaterial
          color="#facc15"
          emissive="#f59e0b"
          emissiveIntensity={0.55}
          roughness={0.25}
        />
      </mesh>
    </group>
  );
};

/**
 * Dynamic entities: Shopkeeper Player + Neighborhood Customers + Camera Follow.
 */
const ShopActorsController: React.FC<{
  worldRef: React.MutableRefObject<GumShopWorld>;
  inputRef: React.MutableRefObject<GumShopInput>;
  audioRef: React.MutableRefObject<GumShopAudio>;
  isSoftwareGl: boolean;
  onHudUpdate: (snapshot: GumShopHudSnapshot) => void;
  onSyncVisuals: () => void;
  onCheckoutClick: () => void;
  onOpenHousePuzzle: () => void;
  onOpenStorageModal: () => void;
}> = ({
  worldRef,
  inputRef,
  audioRef,
  isSoftwareGl,
  onHudUpdate,
  onSyncVisuals,
  onCheckoutClick,
  onOpenHousePuzzle,
  onOpenStorageModal,
}) => {
  const { camera } = useThree();
  const playerGroupRef = useRef<THREE.Group | null>(null);
  const leftLegRef = useRef<THREE.Mesh | null>(null);
  const rightLegRef = useRef<THREE.Mesh | null>(null);
  const customerRefs = useRef<Record<number, THREE.Group | null>>({});
  const lastHudAtRef = useRef(0);
  const lastVersionRef = useRef(-1);
  const lastNightRef = useRef<boolean>(false);
  const lookTargetRef = useRef(new THREE.Vector3(0, 0.8, 0.5));

  useFrame(({ clock }, rawDt) => {
    const world = worldRef.current;
    const dirty = stepGumShopWorld(world, rawDt, inputRef.current, audioRef.current);
    const dt = Math.min(rawDt, 0.05);
    const t = clock.getElapsedTime();

    if (world.pendingHousePuzzle) {
      world.pendingHousePuzzle = false;
      onOpenHousePuzzle();
    }
    if (world.pendingOpenStorage) {
      world.pendingOpenStorage = false;
      onOpenStorageModal();
    }

    if (playerGroupRef.current) {
      playerGroupRef.current.position.set(world.playerX, 0, world.playerZ);
      playerGroupRef.current.rotation.y = world.playerRotY;
      const swing = world.playerMoving ? Math.sin(t * 13) * 0.45 : 0;
      if (leftLegRef.current) leftLegRef.current.rotation.x = swing;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -swing;
    }

    for (const c of world.customers) {
      const grp = customerRefs.current[c.id];
      if (grp) {
        grp.position.set(c.x, 0, c.z);
        grp.rotation.y = c.rotY;
      }
    }

    const tierOffset = world.shopLevel - 1;
    const camTargetX = world.playerX * 0.78;
    const camTargetY = 10.6 + tierOffset * 1.1;
    const camTargetZ = world.playerZ + 9.4 + tierOffset * 0.8;
    camera.position.x = THREE.MathUtils.damp(camera.position.x, camTargetX, 5.5, dt);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, camTargetY, 5.5, dt);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, camTargetZ, 5.5, dt);

    lookTargetRef.current.x = THREE.MathUtils.damp(
      lookTargetRef.current.x,
      world.playerX * 0.82,
      6.0,
      dt
    );
    lookTargetRef.current.z = THREE.MathUtils.damp(
      lookTargetRef.current.z,
      world.playerZ - 0.6,
      6.0,
      dt
    );
    camera.lookAt(lookTargetRef.current);

    if (world.version !== lastVersionRef.current || world.isNight !== lastNightRef.current) {
      lastVersionRef.current = world.version;
      lastNightRef.current = world.isNight;
      onSyncVisuals();
    }

    const now = performance.now();
    if (dirty || now - lastHudAtRef.current >= 140) {
      lastHudAtRef.current = now;
      onHudUpdate(extractGumShopHud(world));
    }
  });

  const world = worldRef.current;
  const carried = world.carriedCrate;
  const carriedSpec = carried ? GUM_FLAVOR_MAP[carried.flavor] : null;

  return (
    <group>
      {/* 3D Shopkeeper Player */}
      <group ref={playerGroupRef} position={[world.playerX, 0, world.playerZ]}>
        <mesh ref={leftLegRef} position={[-0.14, 0.34, 0]} castShadow={!isSoftwareGl}>
          <boxGeometry args={[0.18, 0.68, 0.2]} />
          <meshStandardMaterial color="#1e293b" roughness={0.75} />
        </mesh>
        <mesh ref={rightLegRef} position={[0.14, 0.34, 0]} castShadow={!isSoftwareGl}>
          <boxGeometry args={[0.18, 0.68, 0.2]} />
          <meshStandardMaterial color="#1e293b" roughness={0.75} />
        </mesh>
        <mesh position={[0, 1.0, 0]} castShadow={!isSoftwareGl}>
          <boxGeometry args={[0.56, 0.72, 0.34]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.94, 0.18]}>
          <boxGeometry args={[0.46, 0.64, 0.04]} />
          <meshStandardMaterial color="#14b8a6" roughness={0.65} />
        </mesh>
        <mesh position={[0, 1.56, 0]} castShadow={!isSoftwareGl}>
          <sphereGeometry args={[0.26, 14, 12]} />
          <meshStandardMaterial color="#f5cba7" roughness={0.7} />
        </mesh>
        <mesh position={[0, 1.74, 0.02]}>
          <cylinderGeometry args={[0.27, 0.27, 0.14, 14]} />
          <meshStandardMaterial color="#f43f5e" roughness={0.55} />
        </mesh>
        <mesh position={[0, 1.71, 0.22]}>
          <boxGeometry args={[0.34, 0.04, 0.2]} />
          <meshStandardMaterial color="#e11d48" roughness={0.55} />
        </mesh>
        <mesh
          position={[-0.36, 1.02, carriedSpec ? 0.24 : 0]}
          rotation={[carriedSpec ? -1.1 : 0, 0, 0]}
        >
          <boxGeometry args={[0.15, 0.56, 0.16]} />
          <meshStandardMaterial color="#f5cba7" roughness={0.7} />
        </mesh>
        <mesh
          position={[0.36, 1.02, carriedSpec ? 0.24 : 0]}
          rotation={[carriedSpec ? -1.1 : 0, 0, 0]}
        >
          <boxGeometry args={[0.15, 0.56, 0.16]} />
          <meshStandardMaterial color="#f5cba7" roughness={0.7} />
        </mesh>

        {carriedSpec && (
          <group position={[0, 1.05, 0.56]}>
            <mesh castShadow={!isSoftwareGl}>
              <boxGeometry args={[0.62, 0.46, 0.5]} />
              <meshStandardMaterial color="#d4a373" roughness={0.85} />
            </mesh>
            <mesh>
              <boxGeometry args={[0.64, 0.15, 0.52]} />
              <meshStandardMaterial color={carriedSpec.color} roughness={0.4} />
            </mesh>
          </group>
        )}
      </group>

      {/* 3D Neighborhood Customers */}
      {world.customers.map((c) => {
        const gumSpec = c.carriedFlavor ? GUM_FLAVOR_MAP[c.carriedFlavor] : null;
        return (
          <group
            key={c.id}
            ref={(el) => {
              customerRefs.current[c.id] = el;
            }}
            position={[c.x, 0, c.z]}
            onClick={(e) => {
              if (c.stage === 'WAITING_PAY') {
                e.stopPropagation();
                onCheckoutClick();
              }
            }}
          >
            <mesh position={[0, 0.35, 0]} castShadow={!isSoftwareGl}>
              <boxGeometry args={[0.4, 0.7, 0.28]} />
              <meshStandardMaterial color="#334155" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.98, 0]} castShadow={!isSoftwareGl}>
              <boxGeometry args={[0.52, 0.68, 0.32]} />
              <meshStandardMaterial color={c.shirtColor} roughness={0.68} />
            </mesh>
            <mesh position={[0, 1.52, 0]} castShadow={!isSoftwareGl}>
              <sphereGeometry args={[0.24, 12, 12]} />
              <meshStandardMaterial color="#f5cba7" roughness={0.7} />
            </mesh>
            <mesh position={[0, 1.66, -0.02]}>
              <sphereGeometry args={[0.22, 10, 10]} />
              <meshStandardMaterial color={c.hairColor} roughness={0.85} />
            </mesh>

            {gumSpec && (
              <mesh position={[0.22, 0.96, 0.32]}>
                <boxGeometry args={[0.26, 0.18, 0.14]} />
                <meshStandardMaterial color={gumSpec.color} roughness={0.3} />
              </mesh>
            )}

            {c.stage === 'WAITING_PAY' && (
              <mesh position={[0, 2.25, 0]}>
                <octahedronGeometry args={[0.22, 0]} />
                <meshStandardMaterial
                  color="#fde047"
                  emissive="#f59e0b"
                  emissiveIntensity={0.75}
                  roughness={0.2}
                />
              </mesh>
            )}

            {c.mood === 'expensive' && (
              <mesh position={[0, 2.22, 0]}>
                <boxGeometry args={[0.26, 0.26, 0.26]} />
                <meshStandardMaterial
                  color="#ef4444"
                  emissive="#b91c1c"
                  emissiveIntensity={0.55}
                />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
};

export const GumShopScene: React.FC<GumShopSceneProps> = ({
  worldRef,
  inputRef,
  audioRef,
  moveCashierMode,
  moveShelfMode,
  selectedShelfSlot,
  onHudUpdate,
  onFloorClick,
  onMoveCashierTo,
  onMoveShelfTo,
  onCrateClick,
  onShelfClick,
  onCheckoutClick,
  onHouseDoorClick,
  onBedClick,
  onStorageClick,
  onAdScreenClick,
  onOpenHousePuzzle,
  onOpenStorageModal,
}) => {
  const isSoftwareGl = useMemo(() => detectSoftwareGl(), []);
  const [contextLost, setContextLost] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [, setVisualTick] = useState(0);

  const world = worldRef.current;

  return (
    <div className="relative w-full h-full select-none overflow-hidden">
      {contextLost ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-[#182436] text-amber-100 p-6 text-center">
          <p className="text-base font-bold mb-3">
            {world.lang === 'ar'
              ? 'جاري استعادة محل بياع العلك 3D...'
              : 'Restoring Gum Shop 3D...'}
          </p>
          <button
            type="button"
            onClick={() => {
              setContextLost(false);
              setRetryKey((k) => k + 1);
            }}
            className="px-5 py-2 rounded-lg bg-amber-400 text-slate-950 font-bold text-sm cursor-pointer"
          >
            {world.lang === 'ar' ? 'إعادة التحميل' : 'Reload 3D'}
          </button>
        </div>
      ) : (
        <GumShopErrorBoundary
          lang={world.lang}
          onRetry={() => setRetryKey((k) => k + 1)}
        >
          <Canvas
            key={retryKey}
            shadows={!isSoftwareGl}
            dpr={isSoftwareGl ? 1 : [1, 2]}
            camera={{ position: [0, 10.6, 10.2], fov: 46, near: 0.2, far: 140 }}
            gl={{
              antialias: !isSoftwareGl,
              powerPreference: 'high-performance',
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.06,
              outputColorSpace: THREE.SRGBColorSpace,
            }}
            onCreated={({ gl }) => {
              const canvas = gl.domElement;
              const onLost = (ev: Event) => {
                ev.preventDefault();
                setContextLost(true);
              };
              const onRestored = () => setContextLost(false);
              canvas.addEventListener('webglcontextlost', onLost, false);
              canvas.addEventListener('webglcontextrestored', onRestored, false);
            }}
          >
            <ShopEnvironment
              worldRef={worldRef}
              isSoftwareGl={isSoftwareGl}
              shopLevel={world.shopLevel}
              cashierX={world.cashierX}
              cashierZ={world.cashierZ}
              isNight={world.isNight}
              houseDoorUnlocked={world.houseDoorUnlocked}
              hasStorageRoom={world.hasStorageRoom}
              storageStock={world.storageStock}
              activeAds={world.activeAds}
              lang={world.lang}
              hasNeonSign={world.upgrades.includes('neon_sign')}
              moveCashierMode={moveCashierMode}
              moveShelfSelected={moveShelfMode && selectedShelfSlot !== null}
              onFloorClick={onFloorClick}
              onMoveCashierTo={onMoveCashierTo}
              onMoveShelfTo={onMoveShelfTo}
              onCheckoutClick={onCheckoutClick}
              onHouseDoorClick={onHouseDoorClick}
              onBedClick={onBedClick}
              onStorageClick={onStorageClick}
              onAdScreenClick={onAdScreenClick}
            />

            {/* Purchased & Moveable 3D Display Shelves (Max 6 Packs Each!) */}
            {world.shelves.map((shelf) => {
              const compatible =
                Boolean(world.carriedCrate) &&
                shelf.stock < SHELF_MAX_STOCK &&
                (shelf.stock === 0 || shelf.flavor === world.carriedCrate?.flavor);
              return (
                <GumShelf3D
                  key={shelf.slotIndex}
                  shelf={shelf}
                  highlightStock={compatible}
                  moveMode={moveShelfMode}
                  isSelectedForMove={moveShelfMode && selectedShelfSlot === shelf.slotIndex}
                  isSoftwareGl={isSoftwareGl}
                  onClick={() => onShelfClick(shelf.slotIndex)}
                />
              );
            })}

            {/* Outdoor Delivery Crates */}
            {world.cratesOutside.map((crate) => (
              <OutdoorCrate3D
                key={crate.id}
                crate={crate}
                isSoftwareGl={isSoftwareGl}
                onClick={() => onCrateClick(crate.id, crate.x, crate.z)}
              />
            ))}

            {/* Player + Customers + Simulation Tick */}
            <ShopActorsController
              worldRef={worldRef}
              inputRef={inputRef}
              audioRef={audioRef}
              isSoftwareGl={isSoftwareGl}
              onHudUpdate={onHudUpdate}
              onSyncVisuals={() => setVisualTick((v) => v + 1)}
              onCheckoutClick={onCheckoutClick}
              onOpenHousePuzzle={onOpenHousePuzzle}
              onOpenStorageModal={onOpenStorageModal}
            />
          </Canvas>
        </GumShopErrorBoundary>
      )}
    </div>
  );
};
