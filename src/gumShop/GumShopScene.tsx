import React, { Component, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GumShopAudio } from './audio';
import {
  CHECKOUT_POS,
  DOOR_Z,
  extractGumShopHud,
  stepGumShopWorld,
  type GumShopInput,
  type GumShopWorld,
} from './gameLogic';
import {
  GUM_FLAVOR_MAP,
  SHELF_SLOTS,
  type DeliveryCrateState,
  type GumShopHudSnapshot,
  type ShelfState,
} from './types';

interface GumShopSceneProps {
  worldRef: React.MutableRefObject<GumShopWorld>;
  inputRef: React.MutableRefObject<GumShopInput>;
  audioRef: React.MutableRefObject<GumShopAudio>;
  onHudUpdate: (snapshot: GumShopHudSnapshot) => void;
  onFloorClick: (x: number, z: number) => void;
  onCrateClick: (crateId: number, x: number, z: number) => void;
  onShelfClick: (slotIndex: number, x: number, z: number) => void;
  onCheckoutClick: () => void;
}

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
  tex.repeat.set(8, 3);
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

const ShopEnvironment: React.FC<{
  isSoftwareGl: boolean;
  hasNeonSign: boolean;
  onFloorClick: (x: number, z: number) => void;
  onCheckoutClick: () => void;
}> = ({ isSoftwareGl, hasNeonSign, onFloorClick, onCheckoutClick }) => {
  const { scene, gl } = useThree();

  useEffect(() => {
    scene.background = new THREE.Color('#a7d8f0');
    scene.fog = new THREE.FogExp2('#cfe7f5', 0.014);

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

  const tileTex = useMemo(
    () => createShopTileTexture(gl.capabilities.getMaxAnisotropy()),
    [gl]
  );
  const sidewalkTex = useMemo(
    () => createSidewalkTexture(gl.capabilities.getMaxAnisotropy()),
    [gl]
  );

  useEffect(() => {
    return () => {
      tileTex.dispose();
      sidewalkTex.dispose();
    };
  }, [tileTex, sidewalkTex]);

  return (
    <group>
      {/* Sunlit Warm Key + Cool Sky Fill */}
      <directionalLight
        color="#fff3d6"
        intensity={1.9}
        position={[12, 22, 16]}
        castShadow={!isSoftwareGl}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={2}
        shadow-camera-far={55}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-bias={-0.0005}
      />
      <hemisphereLight args={['#bae6fd', '#84cc16', 0.9]} />
      <pointLight position={[0, 4.4, -1.5]} intensity={1.1} distance={15} color="#fff7ed" />

      {/* Outer Grass / Neighborhood Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 2]} receiveShadow={!isSoftwareGl}>
        <planeGeometry args={[80, 70]} />
        <meshStandardMaterial color="#65a34e" roughness={0.95} />
      </mesh>

      {/* Asphalt Neighborhood Street (beyond sidewalk) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 12.2]} receiveShadow={!isSoftwareGl}>
        <planeGeometry args={[60, 7]} />
        <meshStandardMaterial color="#334155" roughness={0.92} />
      </mesh>
      {/* Dashed Street Center Line */}
      {[-12, -7, -2, 3, 8, 13].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, -0.02, 12.2]}>
          <planeGeometry args={[2.6, 0.25]} />
          <meshStandardMaterial color="#fde047" roughness={0.7} />
        </mesh>
      ))}

      {/* Outdoor Sidewalk (Clickable to walk outside!) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 6.0]}
        receiveShadow={!isSoftwareGl}
        onClick={(e) => {
          e.stopPropagation();
          onFloorClick(e.point.x, e.point.z);
        }}
      >
        <planeGeometry args={[18, 6.2]} />
        <meshStandardMaterial map={sidewalkTex} roughness={0.9} />
      </mesh>

      {/* Curb Edge */}
      <mesh position={[0, 0.04, 8.95]}>
        <boxGeometry args={[18, 0.14, 0.28]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.85} />
      </mesh>

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

      {/* Interior Shop Floor (Clickable to walk inside!) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, -1.4]}
        receiveShadow={!isSoftwareGl}
        onClick={(e) => {
          e.stopPropagation();
          onFloorClick(e.point.x, e.point.z);
        }}
      >
        <planeGeometry args={[12.4, 8.8]} />
        <meshStandardMaterial map={tileTex} roughness={0.62} metalness={0.05} />
      </mesh>

      {/* Welcome Doorway Mat */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, DOOR_Z]}>
        <planeGeometry args={[3.0, 1.0]} />
        <meshStandardMaterial color="#0d9488" roughness={0.85} />
      </mesh>

      {/* Back Shop Wall */}
      <mesh position={[0, 2.2, -5.8]} receiveShadow={!isSoftwareGl}>
        <boxGeometry args={[12.6, 4.4, 0.3]} />
        <meshStandardMaterial color="#fef3c7" roughness={0.82} />
      </mesh>
      {/* Back Wall Mint Wainscoting Trim */}
      <mesh position={[0, 0.65, -5.62]}>
        <boxGeometry args={[12.4, 1.3, 0.08]} />
        <meshStandardMaterial color="#2dd4bf" roughness={0.7} />
      </mesh>

      {/* Left & Right Shop Side Walls */}
      <mesh position={[-6.2, 2.2, -1.4]} receiveShadow={!isSoftwareGl}>
        <boxGeometry args={[0.3, 4.4, 9.0]} />
        <meshStandardMaterial color="#fde68a" roughness={0.82} />
      </mesh>
      <mesh position={[6.2, 2.2, -1.4]} receiveShadow={!isSoftwareGl}>
        <boxGeometry args={[0.3, 4.4, 9.0]} />
        <meshStandardMaterial color="#fde68a" roughness={0.82} />
      </mesh>

      {/* Front Storefront Wall Segments (Open Center Doorway X in [-1.65, 1.65]) */}
      {[-3.95, 3.95].map((wx) => (
        <group key={wx} position={[wx, 0, DOOR_Z]}>
          {/* Lower Masonry Knee Wall */}
          <mesh position={[0, 0.52, 0]} castShadow={!isSoftwareGl}>
            <boxGeometry args={[4.6, 1.04, 0.28]} />
            <meshStandardMaterial color="#fb7185" roughness={0.76} />
          </mesh>
          {/* Large Clear Glass Storefront Window */}
          <mesh position={[0, 2.1, 0]}>
            <boxGeometry args={[4.3, 2.1, 0.08]} />
            <meshStandardMaterial
              color="#bae6fd"
              transparent
              opacity={0.28}
              roughness={0.12}
              metalness={0.35}
            />
          </mesh>
          {/* Top Header Beam */}
          <mesh position={[0, 3.7, 0]}>
            <boxGeometry args={[4.6, 1.1, 0.3]} />
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

      {/* Striped Candy-Shop Awning Above Storefront */}
      {Array.from({ length: 12 }, (_, idx) => {
        const ax = -5.5 + idx * 1.0;
        return (
          <mesh
            key={idx}
            position={[ax, 3.25, DOOR_Z + 0.85]}
            rotation={[0.38, 0, 0]}
            castShadow={!isSoftwareGl}
          >
            <boxGeometry args={[1.0, 0.12, 1.8]} />
            <meshStandardMaterial
              color={idx % 2 === 0 ? '#f43f5e' : '#fffbeb'}
              roughness={0.68}
            />
          </mesh>
        );
      })}

      {/* Storefront Signboard (Glows brighter when Neon Sign upgrade is bought!) */}
      <group position={[0, 4.55, DOOR_Z + 0.18]}>
        <mesh castShadow={!isSoftwareGl}>
          <boxGeometry args={[5.8, 0.92, 0.22]} />
          <meshStandardMaterial
            color={hasNeonSign ? '#0f172a' : '#134e4a'}
            emissive={hasNeonSign ? '#f43f5e' : '#0f766e'}
            emissiveIntensity={hasNeonSign ? 0.65 : 0.15}
            roughness={0.35}
            metalness={0.3}
          />
        </mesh>
        {/* Decorative 3D Gumball Orbs on Sign */}
        {[-2.2, -1.5, 1.5, 2.2].map((ox, i) => (
          <mesh key={ox} position={[ox, 0, 0.16]}>
            <sphereGeometry args={[0.22, 12, 12]} />
            <meshStandardMaterial
              color={['#14b8a6', '#f43f5e', '#fbbf24', '#a855f7'][i]}
              emissive={hasNeonSign ? ['#14b8a6', '#f43f5e', '#fbbf24', '#a855f7'][i] : '#000000'}
              emissiveIntensity={hasNeonSign ? 0.7 : 0}
              roughness={0.22}
              metalness={0.25}
            />
          </mesh>
        ))}
      </group>

      {/* Outdoor Decorative Trees */}
      {[-8.4, 8.4].map((tx) => (
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

      {/* 3D Checkout Counter & Cash Register (Clickable!) */}
      <group
        position={[CHECKOUT_POS.x, 0, CHECKOUT_POS.z]}
        onClick={(e) => {
          e.stopPropagation();
          onCheckoutClick();
        }}
      >
        <mesh position={[0, 0.55, 0]} castShadow={!isSoftwareGl}>
          <boxGeometry args={[1.35, 1.1, 2.2]} />
          <meshStandardMaterial color="#b45309" roughness={0.72} />
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
            emissiveIntensity={0.45}
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
 * Dynamic 3D Display Shelf showing real stacked 3D gum packs matching `shelf.stock`.
 */
const GumShelf3D: React.FC<{
  shelf: ShelfState;
  highlight: boolean;
  isSoftwareGl: boolean;
  onClick: () => void;
}> = ({ shelf, highlight, isSoftwareGl, onClick }) => {
  const slot = SHELF_SLOTS[shelf.slotIndex];
  if (!slot) return null;

  const frameColor =
    shelf.style === 'gold'
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
  const visiblePacks = Math.min(24, shelf.stock);

  return (
    <group
      position={[slot.x, 0, slot.z]}
      rotation={[0, slot.rotY, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {/* Highlight Ring when player carries a compatible crate */}
      {highlight && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
          <ringGeometry args={[1.02, 1.24, 28]} />
          <meshBasicMaterial color="#34d399" />
        </mesh>
      )}

      {/* Side Uprights */}
      {[-0.95, 0.95].map((ux) => (
        <mesh key={ux} position={[ux, 1.0, 0]} castShadow={!isSoftwareGl}>
          <boxGeometry args={[0.12, 2.0, 0.68]} />
          <meshStandardMaterial color={frameColor} roughness={0.45} metalness={metalness} />
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

      {/* Individual 3D Gum Packs stacked neatly across the 3 tiers */}
      {flavorSpec &&
        Array.from({ length: visiblePacks }, (_, idx) => {
          const tier = Math.floor(idx / 8); // 0, 1, 2
          const inTier = idx % 8;
          const col = inTier % 4;
          const row = Math.floor(inTier / 4); // 0 front, 1 back
          const px = -0.66 + col * 0.44;
          const py = [0.55, 1.15, 1.73][tier] ?? 0.55;
          const pz = row === 0 ? 0.14 : -0.1;
          return (
            <group key={idx} position={[px, py, pz]}>
              <mesh castShadow={!isSoftwareGl}>
                <boxGeometry args={[0.32, 0.24, 0.16]} />
                <meshStandardMaterial color={flavorSpec.color} roughness={0.32} metalness={0.15} />
              </mesh>
              <mesh position={[0, 0, 0.085]}>
                <boxGeometry args={[0.24, 0.08, 0.015]} />
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
      {/* Cardboard Shipping Box */}
      <mesh position={[0, 0.32, 0]} castShadow={!isSoftwareGl}>
        <boxGeometry args={[0.74, 0.62, 0.64]} />
        <meshStandardMaterial color="#d4a373" roughness={0.86} />
      </mesh>
      {/* Colored Gum Flavor Tape Band */}
      <mesh position={[0, 0.34, 0]}>
        <boxGeometry args={[0.76, 0.18, 0.66]} />
        <meshStandardMaterial color={spec.color} roughness={0.4} />
      </mesh>
      {/* Bright Top Label */}
      <mesh position={[0, 0.64, 0]}>
        <boxGeometry args={[0.38, 0.02, 0.32]} />
        <meshStandardMaterial color={spec.accent} roughness={0.5} />
      </mesh>
      {/* Floating Pickup Indicator Cone */}
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
}> = ({
  worldRef,
  inputRef,
  audioRef,
  isSoftwareGl,
  onHudUpdate,
  onSyncVisuals,
  onCheckoutClick,
}) => {
  const { camera } = useThree();
  const playerGroupRef = useRef<THREE.Group | null>(null);
  const leftLegRef = useRef<THREE.Mesh | null>(null);
  const rightLegRef = useRef<THREE.Mesh | null>(null);
  const customerRefs = useRef<Record<number, THREE.Group | null>>({});
  const lastHudAtRef = useRef(0);
  const lastVersionRef = useRef(-1);
  const lookTargetRef = useRef(new THREE.Vector3(0, 0.8, 0.5));

  useFrame(({ clock }, rawDt) => {
    const world = worldRef.current;
    const dirty = stepGumShopWorld(world, rawDt, inputRef.current, audioRef.current);
    const dt = Math.min(rawDt, 0.05);
    const t = clock.getElapsedTime();

    // Update player 3D transform & walking stride
    if (playerGroupRef.current) {
      playerGroupRef.current.position.set(world.playerX, 0, world.playerZ);
      playerGroupRef.current.rotation.y = world.playerRotY;
      const swing = world.playerMoving ? Math.sin(t * 13) * 0.45 : 0;
      if (leftLegRef.current) leftLegRef.current.rotation.x = swing;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -swing;
    }

    // Update customer 3D positions smoothly without React re-renders per frame
    for (const c of world.customers) {
      const grp = customerRefs.current[c.id];
      if (grp) {
        grp.position.set(c.x, 0, c.z);
        grp.rotation.y = c.rotY;
      }
    }

    // Smooth 3/4 follow camera that naturally pans inside <-> outside the glass doorway
    const camTargetX = world.playerX * 0.65;
    const camTargetY = 10.6;
    const camTargetZ = world.playerZ + 9.4;
    camera.position.x = THREE.MathUtils.damp(camera.position.x, camTargetX, 5.5, dt);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, camTargetY, 5.5, dt);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, camTargetZ, 5.5, dt);

    lookTargetRef.current.x = THREE.MathUtils.damp(
      lookTargetRef.current.x,
      world.playerX * 0.72,
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

    if (world.version !== lastVersionRef.current) {
      lastVersionRef.current = world.version;
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
        {/* Legs */}
        <mesh ref={leftLegRef} position={[-0.14, 0.34, 0]} castShadow={!isSoftwareGl}>
          <boxGeometry args={[0.18, 0.68, 0.2]} />
          <meshStandardMaterial color="#1e293b" roughness={0.75} />
        </mesh>
        <mesh ref={rightLegRef} position={[0.14, 0.34, 0]} castShadow={!isSoftwareGl}>
          <boxGeometry args={[0.18, 0.68, 0.2]} />
          <meshStandardMaterial color="#1e293b" roughness={0.75} />
        </mesh>
        {/* Torso + Mint Shopkeeper Apron */}
        <mesh position={[0, 1.0, 0]} castShadow={!isSoftwareGl}>
          <boxGeometry args={[0.56, 0.72, 0.34]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.94, 0.18]}>
          <boxGeometry args={[0.46, 0.64, 0.04]} />
          <meshStandardMaterial color="#14b8a6" roughness={0.65} />
        </mesh>
        {/* Head & Shop Cap */}
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
        {/* Arms */}
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

        {/* Visible Carried Gum Crate in Shopkeeper's Hands! */}
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

            {/* Gum Pack carried by Customer */}
            {gumSpec && (
              <mesh position={[0.22, 0.96, 0.32]}>
                <boxGeometry args={[0.26, 0.18, 0.14]} />
                <meshStandardMaterial color={gumSpec.color} roughness={0.3} />
              </mesh>
            )}

            {/* Waiting-to-Pay Golden Coin Beacon above Customer */}
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

            {/* Angry Red Marker if Gum was Too Expensive */}
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
  onHudUpdate,
  onFloorClick,
  onCrateClick,
  onShelfClick,
  onCheckoutClick,
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
            camera={{ position: [0, 10.6, 10.2], fov: 46, near: 0.2, far: 120 }}
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
              isSoftwareGl={isSoftwareGl}
              hasNeonSign={world.upgrades.includes('neon_sign')}
              onFloorClick={onFloorClick}
              onCheckoutClick={onCheckoutClick}
            />

            {/* Purchased 3D Display Shelves */}
            {world.shelves.map((shelf) => {
              const slot = SHELF_SLOTS[shelf.slotIndex];
              const compatible =
                Boolean(world.carriedCrate) &&
                (shelf.stock === 0 || shelf.flavor === world.carriedCrate?.flavor);
              return (
                <GumShelf3D
                  key={shelf.slotIndex}
                  shelf={shelf}
                  highlight={compatible}
                  isSoftwareGl={isSoftwareGl}
                  onClick={() => {
                    if (slot) onShelfClick(shelf.slotIndex, slot.x, slot.z);
                  }}
                />
              );
            })}

            {/* Outdoor Delivery Crates waiting on the Sidewalk */}
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
            />
          </Canvas>
        </GumShopErrorBoundary>
      )}
    </div>
  );
};
