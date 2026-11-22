import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { MAX_STOCK } from './types';
import { ShawarmaWorld } from './gameLogic';

interface ShopEnvironmentProps {
  worldRef: React.MutableRefObject<ShawarmaWorld>;
  isSoftwareGl: boolean;
}

function createTileTexture(maxAniso: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#f5e6d3';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = '#d4b898';
    ctx.lineWidth = 4;
    for (let x = 0; x <= 256; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 256);
      ctx.stroke();
    }
    for (let y = 0; y <= 256; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(5, 3);
  tex.anisotropy = Math.min(8, maxAniso);
  return tex;
}

function createWoodCounterTexture(maxAniso: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#c48d56';
    ctx.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 14) {
      ctx.fillStyle =
        y % 28 === 0 ? 'rgba(92,50,20,0.14)' : 'rgba(255,232,200,0.12)';
      ctx.fillRect(0, y, 256, 5);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 1);
  tex.anisotropy = Math.min(8, maxAniso);
  return tex;
}

/**
 * 3D Shawarma Shop Interior:
 * - Warm wood & stainless prep counter
 * - Spinning Vertical Shawarma Meat Spit with glowing red heat elements, animated manual/electric slicer & live meat tray
 * - Dedicated 3D Potato Chopping Station (whole potatoes, animated chopper blade, auto-chef arm, and live golden fries basket)
 * - 3D Contact Grill Press (الجريل) on the right
 * - Condiment Bowls + unlockable 3D shop props:
 *   Pomegranate Molasses bottle (دبس رمان), Melted Cheddar pot (جبنة شيدر),
 *   Sun Top orange juice cartons (سن توب), Cold Ayran frosted cups (لبن عيران), and VIP lantern string
 */
export const ShopEnvironment: React.FC<ShopEnvironmentProps> = ({
  worldRef,
  isSoftwareGl,
}) => {
  const { gl, scene } = useThree();
  const spitRef = useRef<THREE.Group>(null);
  const manualKnifeRef = useRef<THREE.Group>(null);
  const electricSlicerRef = useRef<THREE.Group>(null);
  const electricDiscRef = useRef<THREE.Mesh>(null);
  const meatPileRef = useRef<THREE.Group>(null);

  const potatoKnifeRef = useRef<THREE.Group>(null);
  const friesPileRef = useRef<THREE.Group>(null);
  const autoChefArmRef = useRef<THREE.Group>(null);

  const grillLidRef = useRef<THREE.Group>(null);

  // Unlockable Shop Props Refs
  const pomBottleRef = useRef<THREE.Group>(null);
  const cheesePotRef = useRef<THREE.Group>(null);
  const suntopCrateRef = useRef<THREE.Group>(null);
  const ayranCoolerRef = useRef<THREE.Group>(null);
  const vipDecorRef = useRef<THREE.Group>(null);

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envRT.texture;
    pmrem.dispose();
    return () => {
      scene.environment = null;
      envRT.dispose();
    };
  }, [gl, scene]);

  const maxAniso = gl.capabilities.getMaxAnisotropy();
  const tileTex = useMemo(() => createTileTexture(maxAniso), [maxAniso]);
  const woodTex = useMemo(() => createWoodCounterTexture(maxAniso), [maxAniso]);

  useEffect(() => {
    return () => {
      tileTex.dispose();
      woodTex.dispose();
    };
  }, [tileTex, woodTex]);

  useFrame(({ clock }) => {
    const world = worldRef.current;
    const t = clock.getElapsedTime();
    const u = world.upgrades;

    // 1. Shawarma Spit rotation & Double Spit plump scale
    if (spitRef.current) {
      spitRef.current.rotation.y = world.spitAngle;
      const sx = u.doubleSpit ? 1.16 : 1;
      spitRef.current.scale.set(sx, 1, sx);
    }

    // 2. Carving Knife vs Electric Slicer animation
    const isElectric = u.slicerLevel === 3;
    const isSlicing = world.meatSliceTimer > 0;
    const slicePhase = isSlicing
      ? 1 - world.meatSliceTimer / Math.max(0.05, world.meatSliceDuration)
      : 0;

    if (manualKnifeRef.current) {
      manualKnifeRef.current.visible = !isElectric;
      if (!isElectric) {
        if (isSlicing) {
          manualKnifeRef.current.position.set(
            -1.64 + Math.sin(slicePhase * Math.PI * 2) * 0.12,
            2.12 - slicePhase * 0.65,
            0.52
          );
          manualKnifeRef.current.rotation.z =
            -0.38 + Math.sin(slicePhase * Math.PI * 6) * 0.14;
        } else {
          manualKnifeRef.current.position.set(-1.35, 1.32, 0.72);
          manualKnifeRef.current.rotation.z = Math.PI / 2;
        }
      }
    }

    if (electricSlicerRef.current) {
      electricSlicerRef.current.visible = isElectric;
      if (isElectric) {
        if (isSlicing) {
          electricSlicerRef.current.position.set(
            -1.65 + Math.sin(slicePhase * Math.PI) * 0.08,
            2.1 - slicePhase * 0.7,
            0.54
          );
          electricSlicerRef.current.rotation.z = -0.25;
        } else {
          electricSlicerRef.current.position.set(-1.34, 1.34, 0.74);
          electricSlicerRef.current.rotation.z = 0.25;
        }
        if (electricDiscRef.current) {
          electricDiscRef.current.rotation.z = t * (isSlicing ? 26 : 3);
        }
      }
    }

    // 3. Sliced Meat Tray pile scales with meatStock
    if (meatPileRef.current) {
      const frac = world.meatStock / MAX_STOCK;
      meatPileRef.current.visible = world.meatStock > 0;
      meatPileRef.current.scale.set(
        0.75 + frac * 0.35,
        Math.max(0.18, frac),
        0.75 + frac * 0.35
      );
    }

    // 4. Potato Chopping Knife & Golden Fries Basket
    const isChopping = world.friesChopTimer > 0;
    if (potatoKnifeRef.current) {
      if (isChopping) {
        const chopWave = Math.abs(Math.sin(t * 24));
        potatoKnifeRef.current.position.set(1.42, 1.33 + chopWave * 0.26, 0.85);
        potatoKnifeRef.current.rotation.z = -0.28 - chopWave * 0.32;
      } else {
        potatoKnifeRef.current.position.set(1.52, 1.27, 1.05);
        potatoKnifeRef.current.rotation.z = Math.PI / 2;
      }
    }

    if (autoChefArmRef.current) {
      autoChefArmRef.current.visible = u.friesLevel === 3;
      if (u.friesLevel === 3) {
        autoChefArmRef.current.position.y =
          1.62 + (isChopping ? Math.sin(t * 26) * 0.14 : 0);
      }
    }

    if (friesPileRef.current) {
      const frac = world.friesStock / MAX_STOCK;
      friesPileRef.current.visible = world.friesStock > 0;
      friesPileRef.current.scale.set(1, Math.max(0.2, frac), 1);
    }

    // 5. Contact Grill Lid animation
    if (grillLidRef.current) {
      const targetAngle = world.serveAnimTimer > 0.22 ? 0.08 : -0.72;
      grillLidRef.current.rotation.x +=
        (targetAngle - grillLidRef.current.rotation.x) * 0.2;
    }

    // 6. Toggle Purchased Shop Props cleanly in 3D scene
    if (pomBottleRef.current) pomBottleRef.current.visible = u.unlockPomegranate;
    if (cheesePotRef.current) cheesePotRef.current.visible = u.unlockCheese;
    if (suntopCrateRef.current) suntopCrateRef.current.visible = u.unlockSuntop;
    if (ayranCoolerRef.current) ayranCoolerRef.current.visible = u.unlockAyran;
    if (vipDecorRef.current) vipDecorRef.current.visible = u.vipDecor;
  });

  const meatLayers = [
    { y: 0.16, rTop: 0.26, rBot: 0.16, col: '#7c3214' },
    { y: 0.34, rTop: 0.34, rBot: 0.26, col: '#9a411a' },
    { y: 0.52, rTop: 0.4, rBot: 0.34, col: '#843616' },
    { y: 0.7, rTop: 0.44, rBot: 0.4, col: '#a8491d' },
    { y: 0.88, rTop: 0.46, rBot: 0.44, col: '#8a3917' },
    { y: 1.06, rTop: 0.42, rBot: 0.46, col: '#9e441c' },
  ];

  return (
    <>
      <color attach="background" args={['#2b1b2d']} />
      <fog attach="fog" args={['#382135', 14, 34]} />

      {/* Warm Restaurant Lighting */}
      <hemisphereLight args={['#ffe4c4', '#4a291a', 0.95]} />
      <directionalLight
        position={[3, 7, 5]}
        intensity={1.7}
        color="#ffe2ba"
        castShadow={!isSoftwareGl}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={1}
        shadow-camera-far={22}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-3}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />
      <pointLight
        position={[-1.9, 1.9, 0.2]}
        intensity={2.4}
        distance={5}
        color="#ff6b2b"
      />
      <pointLight
        position={[0, 3.3, -1.2]}
        intensity={1.8}
        distance={8}
        color="#fde68a"
      />

      {/* Evening Street Outside Shop Window */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -4]}>
        <planeGeometry args={[40, 26]} />
        <meshStandardMaterial color="#3c2f3f" roughness={0.95} />
      </mesh>
      <mesh position={[0, 3.8, -11]}>
        <planeGeometry args={[28, 12]} />
        <meshBasicMaterial color="#46263d" />
      </mesh>

      {/* Main Shawarma Shop Serving Counter */}
      <mesh receiveShadow castShadow position={[0, 0.55, 0.7]}>
        <boxGeometry args={[7.8, 1.1, 2.25]} />
        <meshStandardMaterial map={tileTex} roughness={0.72} />
      </mesh>
      <mesh receiveShadow position={[0, 1.13, 0.7]}>
        <boxGeometry args={[8.0, 0.1, 2.4]} />
        <meshStandardMaterial map={woodTex} roughness={0.48} metalness={0.06} />
      </mesh>

      {/* Central Wooden Cutting Board for Shawarma Assembly */}
      <mesh receiveShadow position={[0, 1.2, 0.95]}>
        <boxGeometry args={[1.55, 0.05, 1.1]} />
        <meshStandardMaterial color="#d4a373" roughness={0.62} />
      </mesh>

      {/* Side Shop Pillars framing the serving window */}
      <mesh castShadow receiveShadow position={[-3.85, 2.4, -0.35]}>
        <boxGeometry args={[0.55, 4.8, 0.6]} />
        <meshStandardMaterial color="#7f1d1d" roughness={0.68} />
      </mesh>
      <mesh castShadow receiveShadow position={[3.85, 2.4, -0.35]}>
        <boxGeometry args={[0.55, 4.8, 0.6]} />
        <meshStandardMaterial color="#7f1d1d" roughness={0.68} />
      </mesh>

      {/* Striped Red & Cream Street-Food Awning above serving window */}
      <group position={[0, 3.65, -0.55]} rotation={[0.25, 0, 0]}>
        {[-3, -2, -1, 0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[i * 1.08, 0, 0]} castShadow>
            <boxGeometry args={[1.08, 0.16, 1.35]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? '#dc2626' : '#fef3c7'}
              roughness={0.75}
            />
          </mesh>
        ))}
      </group>

      {/* VIP Decor Upgrade: Warm Festive Golden String Bulbs */}
      <group ref={vipDecorRef} visible={false} position={[0, 3.35, -0.2]}>
        {[-2.8, -2.1, -1.4, -0.7, 0, 0.7, 1.4, 2.1, 2.8].map((bx, i) => (
          <mesh key={i} position={[bx, -Math.cos((bx / 3) * 1.1) * 0.18, 0]}>
            <sphereGeometry args={[0.065, 8, 8]} />
            <meshBasicMaterial color={i % 2 === 0 ? '#fde047' : '#fb923c'} />
          </mesh>
        ))}
      </group>

      {/* 2 Warm Hanging Brass Pendant Lamps */}
      {[-1.5, 1.5].map((lx, idx) => (
        <group key={idx} position={[lx, 3.3, 0.35]}>
          <mesh position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.7, 6]} />
            <meshStandardMaterial color="#27272a" roughness={0.5} />
          </mesh>
          <mesh>
            <coneGeometry args={[0.28, 0.24, 12]} />
            <meshStandardMaterial
              color="#b45309"
              metalness={0.7}
              roughness={0.28}
            />
          </mesh>
          <mesh position={[0, -0.1, 0]}>
            <sphereGeometry args={[0.09, 10, 8]} />
            <meshBasicMaterial color="#fef08a" />
          </mesh>
        </group>
      ))}

      {/* VERTICAL SHAWARMA GRILL MACHINE & SPINNING MEAT SPIT (Left side) */}
      <group position={[-2.25, 1.18, 0.32]}>
        <mesh receiveShadow position={[0, 0.06, 0]}>
          <boxGeometry args={[1.25, 0.12, 1.15]} />
          <meshStandardMaterial
            color="#cbd5e1"
            metalness={0.85}
            roughness={0.22}
          />
        </mesh>
        <mesh castShadow position={[0, 0.92, -0.45]}>
          <boxGeometry args={[1.15, 1.72, 0.26]} />
          <meshStandardMaterial
            color="#94a3b8"
            metalness={0.82}
            roughness={0.25}
          />
        </mesh>
        {[0.45, 0.9, 1.35].map((hy, i) => (
          <mesh key={i} position={[0, hy, -0.31]}>
            <boxGeometry args={[0.78, 0.22, 0.04]} />
            <meshStandardMaterial
              color="#ff4500"
              emissive="#ff5500"
              emissiveIntensity={1.6}
              roughness={0.3}
            />
          </mesh>
        ))}
        <mesh position={[0, 1.82, -0.05]}>
          <boxGeometry args={[1.2, 0.14, 1.05]} />
          <meshStandardMaterial
            color="#cbd5e1"
            metalness={0.86}
            roughness={0.22}
          />
        </mesh>

        {/* Spinning Skewer & Layered Golden-Brown Shawarma Meat Cone */}
        <group ref={spitRef} position={[0, 0.14, 0.05]}>
          <mesh position={[0, 0.82, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 1.65, 8]} />
            <meshStandardMaterial
              color="#e2e8f0"
              metalness={0.92}
              roughness={0.18}
            />
          </mesh>
          {meatLayers.map((layer, idx) => (
            <mesh key={idx} castShadow position={[0, layer.y, 0]}>
              <cylinderGeometry args={[layer.rTop, layer.rBot, 0.19, 14]} />
              <meshStandardMaterial
                color={layer.col}
                roughness={0.55}
                metalness={0.08}
              />
            </mesh>
          ))}
          <mesh position={[0, 1.24, 0]}>
            <sphereGeometry args={[0.2, 12, 8]} />
            <meshStandardMaterial color="#dc2626" roughness={0.4} />
          </mesh>
          <mesh position={[0, 1.4, 0]}>
            <sphereGeometry args={[0.14, 10, 8]} />
            <meshStandardMaterial color="#fef3c7" roughness={0.5} />
          </mesh>
        </group>

        {/* Stainless Tray Holding Freshly Sliced Shawarma Meat Pile */}
        <group position={[0.74, 0.07, 0.42]}>
          <mesh receiveShadow>
            <boxGeometry args={[0.62, 0.07, 0.56]} />
            <meshStandardMaterial
              color="#e2e8f0"
              metalness={0.84}
              roughness={0.22}
            />
          </mesh>
          <group ref={meatPileRef} position={[0, 0.04, 0]}>
            <mesh position={[0, 0.08, 0]} castShadow>
              <coneGeometry args={[0.24, 0.22, 10]} />
              <meshStandardMaterial color="#9a411a" roughness={0.55} />
            </mesh>
            <mesh position={[-0.08, 0.06, 0.05]}>
              <boxGeometry args={[0.14, 0.07, 0.1]} />
              <meshStandardMaterial color="#7c3214" roughness={0.6} />
            </mesh>
            <mesh position={[0.09, 0.06, -0.04]}>
              <boxGeometry args={[0.13, 0.07, 0.1]} />
              <meshStandardMaterial color="#b45309" roughness={0.5} />
            </mesh>
          </group>
        </group>
      </group>

      {/* Manual Carving Knife (Lv 1 & Lv 2) */}
      <group
        ref={manualKnifeRef}
        position={[-1.35, 1.32, 0.72]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <mesh position={[0, 0.25, 0]}>
          <boxGeometry args={[0.07, 0.52, 0.015]} />
          <meshStandardMaterial
            color="#f1f5f9"
            metalness={0.94}
            roughness={0.14}
          />
        </mesh>
        <mesh position={[0, -0.09, 0]}>
          <cylinderGeometry args={[0.035, 0.04, 0.2, 8]} />
          <meshStandardMaterial color="#1f2937" roughness={0.78} />
        </mesh>
      </group>

      {/* Upgraded Electric Rotary Shawarma Slicer (Lv 3) */}
      <group
        ref={electricSlicerRef}
        visible={false}
        position={[-1.34, 1.34, 0.74]}
      >
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.075, 0.08, 0.26, 10]} />
          <meshStandardMaterial
            color="#0284c7"
            metalness={0.65}
            roughness={0.28}
          />
        </mesh>
        <mesh position={[0, 0.26, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.13, 0.13, 0.05, 14]} />
          <meshStandardMaterial
            color="#cbd5e1"
            metalness={0.9}
            roughness={0.18}
          />
        </mesh>
        <mesh ref={electricDiscRef} position={[0, 0.26, 0.06]}>
          <cylinderGeometry args={[0.125, 0.125, 0.014, 14]} />
          <meshStandardMaterial
            color="#f8fafc"
            metalness={0.96}
            roughness={0.1}
          />
        </mesh>
      </group>

      {/* 4 Core Condiment Bowls along Back Edge (Garlic, Pickles, Spicy) + Empty/Base Slots */}
      {[
        { x: -0.95, col: '#f8fafc' },
        { x: -0.35, col: '#22c55e' },
        { x: 0.25, col: '#ef4444' },
      ].map((bowl, i) => (
        <group key={i} position={[bowl.x, 1.26, 0.02]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.22, 0.18, 0.15, 14]} />
            <meshStandardMaterial
              color="#e2e8f0"
              metalness={0.78}
              roughness={0.25}
            />
          </mesh>
          <mesh position={[0, 0.055, 0]}>
            <cylinderGeometry args={[0.185, 0.185, 0.06, 12]} />
            <meshStandardMaterial color={bowl.col} roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* SHOP UNLOCK: Pomegranate Molasses Bottle (دبس رمان) */}
      <group ref={pomBottleRef} visible={false} position={[0.78, 1.2, 0.04]}>
        <mesh castShadow position={[0, 0.18, 0]}>
          <cylinderGeometry args={[0.095, 0.11, 0.34, 12]} />
          <meshStandardMaterial
            color="#881337"
            roughness={0.18}
            metalness={0.15}
          />
        </mesh>
        <mesh position={[0, 0.39, 0]}>
          <cylinderGeometry args={[0.04, 0.07, 0.12, 10]} />
          <meshStandardMaterial color="#881337" roughness={0.18} />
        </mesh>
        <mesh position={[0, 0.46, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 0.05, 10]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.7} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.18, 0.098]}>
          <boxGeometry args={[0.11, 0.13, 0.015]} />
          <meshStandardMaterial color="#fff1f2" roughness={0.6} />
        </mesh>
      </group>

      {/* SHOP UNLOCK: Melted Cheddar Pot (جبنة شيدر سايحة) */}
      <group ref={cheesePotRef} visible={false} position={[-1.42, 1.26, 0.04]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.21, 0.18, 0.18, 14]} />
          <meshStandardMaterial
            color="#b45309"
            metalness={0.7}
            roughness={0.3}
          />
        </mesh>
        <mesh position={[0, 0.075, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 0.05, 12]} />
          <meshStandardMaterial
            color="#f59e0b"
            emissive="#d97706"
            emissiveIntensity={0.25}
            roughness={0.25}
          />
        </mesh>
      </group>

      {/* DEDICATED 3D POTATO CHOPPING STATION & GOLDEN FRIES BASKET (Right-Center) */}
      <group position={[1.45, 1.2, 0.85]}>
        {/* Mini Wooden Chopping Block for Potatoes */}
        <mesh receiveShadow position={[0, 0, 0]}>
          <boxGeometry args={[0.78, 0.05, 0.65]} />
          <meshStandardMaterial color="#c68b59" roughness={0.68} />
        </mesh>
        {/* Whole Raw Potatoes waiting to be chopped */}
        <mesh position={[-0.18, 0.09, 0.08]} scale={[1.25, 0.85, 0.9]} castShadow>
          <sphereGeometry args={[0.095, 10, 8]} />
          <meshStandardMaterial color="#b07d4f" roughness={0.85} />
        </mesh>
        <mesh position={[-0.02, 0.085, -0.12]} scale={[1.2, 0.8, 0.95]} castShadow>
          <sphereGeometry args={[0.09, 10, 8]} />
          <meshStandardMaterial color="#a16c3e" roughness={0.85} />
        </mesh>
        {/* Golden Fries Basket right behind the chopping block */}
        <group position={[0.02, 0.1, -0.58]}>
          <mesh castShadow>
            <boxGeometry args={[0.62, 0.18, 0.48]} />
            <meshStandardMaterial
              color="#94a3b8"
              metalness={0.82}
              roughness={0.28}
            />
          </mesh>
          <group ref={friesPileRef} position={[0, 0.05, 0]}>
            {[
              [-0.16, 0.08, 0.04, 0.25],
              [-0.04, 0.1, -0.06, -0.2],
              [0.08, 0.09, 0.06, 0.4],
              [0.18, 0.08, -0.05, -0.35],
              [0, 0.12, 0.02, 0.1],
            ].map(([fx, fy, fz, rot], idx) => (
              <mesh
                key={idx}
                position={[fx, fy, fz]}
                rotation={[0.2, rot, 0.12]}
                castShadow
              >
                <boxGeometry args={[0.065, 0.22, 0.065]} />
                <meshStandardMaterial color="#facc15" roughness={0.5} />
              </mesh>
            ))}
          </group>
        </group>
      </group>

      {/* Animated Potato Chopper Knife */}
      <group
        ref={potatoKnifeRef}
        position={[1.52, 1.27, 1.05]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <mesh position={[0, 0.16, 0]}>
          <boxGeometry args={[0.12, 0.28, 0.015]} />
          <meshStandardMaterial
            color="#e2e8f0"
            metalness={0.92}
            roughness={0.16}
          />
        </mesh>
        <mesh position={[0, -0.05, 0]}>
          <cylinderGeometry args={[0.028, 0.032, 0.16, 8]} />
          <meshStandardMaterial color="#92400e" roughness={0.75} />
        </mesh>
      </group>

      {/* Auto Potato Chef Mechanical Cutter Press (Lv 3) */}
      <group ref={autoChefArmRef} visible={false} position={[1.45, 1.62, 0.85]}>
        <mesh castShadow>
          <boxGeometry args={[0.32, 0.12, 0.28]} />
          <meshStandardMaterial
            color="#eab308"
            metalness={0.65}
            roughness={0.3}
          />
        </mesh>
        <mesh position={[0, -0.14, 0]}>
          <boxGeometry args={[0.22, 0.18, 0.2]} />
          <meshStandardMaterial
            color="#cbd5e1"
            metalness={0.85}
            roughness={0.22}
          />
        </mesh>
      </group>

      {/* SHOP UNLOCK: Sun Top Bright Orange Juice Cartons (سن توب) */}
      <group ref={suntopCrateRef} visible={false} position={[-0.95, 1.2, 1.15]}>
        {[
          [-0.12, 0],
          [0.08, -0.05],
        ].map(([sx, sz], i) => (
          <group key={i} position={[sx, 0.15, sz]} rotation={[0, i * 0.25, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.16, 0.26, 0.12]} />
              <meshStandardMaterial color="#f97316" roughness={0.35} />
            </mesh>
            {/* White/Yellow Sun Top emblem band */}
            <mesh position={[0, 0.02, 0.062]}>
              <boxGeometry args={[0.13, 0.09, 0.01]} />
              <meshStandardMaterial color="#fef08a" roughness={0.4} />
            </mesh>
            {/* Bendy yellow straw */}
            <mesh position={[0.04, 0.17, 0]} rotation={[0, 0, -0.25]}>
              <cylinderGeometry args={[0.012, 0.012, 0.12, 6]} />
              <meshStandardMaterial color="#fde047" roughness={0.4} />
            </mesh>
          </group>
        ))}
      </group>

      {/* SHOP UNLOCK: Cold Ayran Frosted Yogurt Cups (لبن عيران) */}
      <group ref={ayranCoolerRef} visible={false} position={[2.68, 1.2, 1.18]}>
        {[
          [-0.1, 0],
          [0.12, -0.06],
        ].map(([ax, az], i) => (
          <group key={i} position={[ax, 0.14, az]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.095, 0.072, 0.24, 12]} />
              <meshStandardMaterial color="#f0f9ff" roughness={0.25} />
            </mesh>
            {/* Green fresh mint foil lid */}
            <mesh position={[0, 0.125, 0]}>
              <cylinderGeometry args={[0.1, 0.1, 0.022, 12]} />
              <meshStandardMaterial color="#10b981" roughness={0.35} />
            </mesh>
          </group>
        ))}
      </group>

      {/* 3D CONTACT GRILL PRESS (الجريل / التوستر) on Far Right of Counter */}
      <group position={[2.55, 1.24, 0.36]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.05, 0.14, 0.88]} />
          <meshStandardMaterial
            color="#334155"
            metalness={0.72}
            roughness={0.35}
          />
        </mesh>
        <mesh position={[0, 0.08, 0]}>
          <boxGeometry args={[0.88, 0.03, 0.72]} />
          <meshStandardMaterial color="#1e293b" roughness={0.6} />
        </mesh>
        <group
          ref={grillLidRef}
          position={[0, 0.12, -0.38]}
          rotation={[-0.72, 0, 0]}
        >
          <mesh castShadow position={[0, 0.06, 0.38]}>
            <boxGeometry args={[1.02, 0.12, 0.84]} />
            <meshStandardMaterial
              color="#475569"
              metalness={0.78}
              roughness={0.28}
            />
          </mesh>
          <mesh position={[0, 0.06, 0.86]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.04, 0.04, 0.52, 8]} />
            <meshStandardMaterial color="#dc2626" roughness={0.5} />
          </mesh>
        </group>
      </group>
    </>
  );
};
