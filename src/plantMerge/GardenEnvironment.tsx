import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { PlantMergeWorld } from './gameLogic';
import { COL_X, GRID_COLS, GRID_ROWS, LANE_Z, PLANT_SPECS } from './types';

interface GardenEnvironmentProps {
  worldRef: React.MutableRefObject<PlantMergeWorld>;
  isSoftwareGl: boolean;
  onSelectPlot: (row: number, col: number) => void;
  onOpenShop: () => void;
}

const _dummy = new THREE.Object3D();
const _tmpColor = new THREE.Color();

export const GardenEnvironment: React.FC<GardenEnvironmentProps> = ({
  worldRef,
  isSoftwareGl,
  onSelectPlot,
  onOpenShop,
}) => {
  const { gl, scene } = useThree();
  const [hoveredPlot, setHoveredPlot] = useState<string | null>(null);
  const portalRingRef = useRef<THREE.Mesh>(null);
  const portalInnerRef = useRef<THREE.Mesh>(null);
  const waterGlowRef = useRef<THREE.Mesh>(null);
  const cottageGroupRef = useRef<THREE.Group>(null);
  const cottageRoofRef = useRef<THREE.Mesh>(null);

  // Studio PBR reflections via RoomEnvironment + horizon fog
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const envTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envTarget.texture;
    scene.background = new THREE.Color('#7ec8e3');
    scene.fog = new THREE.FogExp2('#8fd3e8', 0.024);

    return () => {
      scene.environment = null;
      envTarget.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);

  // Procedural soil texture (sRGB with anisotropy)
  const soilTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#5c3a21';
      ctx.fillRect(0, 0, 128, 128);
      // Furrow rows
      for (let y = 0; y < 128; y += 16) {
        ctx.fillStyle = y % 32 === 0 ? '#4e301a' : '#6a4427';
        ctx.fillRect(0, y, 128, 10);
      }
      // Subtle organic pebbles
      for (let i = 0; i < 80; i++) {
        ctx.fillStyle = i % 2 === 0 ? 'rgba(34,20,10,0.35)' : 'rgba(130,90,56,0.3)';
        ctx.fillRect(
          (i * 37) % 124,
          (i * 61) % 124,
          3 + (i % 3),
          2 + (i % 3)
        );
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
    return tex;
  }, [gl]);

  // Procedural lush grass texture for the meadow
  const meadowTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#5ea342';
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 420; i++) {
        ctx.fillStyle =
          i % 3 === 0
            ? 'rgba(122, 189, 77, 0.35)'
            : i % 3 === 1
            ? 'rgba(62, 126, 44, 0.35)'
            : 'rgba(154, 206, 94, 0.25)';
        ctx.fillRect((i * 53) % 252, (i * 97) % 252, 4, 9);
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(16, 16);
    tex.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
    return tex;
  }, [gl]);

  useEffect(() => {
    return () => {
      soilTexture.dispose();
      meadowTexture.dispose();
    };
  }, [soilTexture, meadowTexture]);

  // Instanced background pine trees & boulders for natural outdoor perimeter
  const treeTrunksRef = useRef<THREE.InstancedMesh>(null);
  const treeCrownsRef = useRef<THREE.InstancedMesh>(null);
  const rocksRef = useRef<THREE.InstancedMesh>(null);

  const perimeterProps = useMemo(() => {
    const trees: Array<{ x: number; z: number; s: number; tint: string }> = [];
    // Back forest line
    for (let i = 0; i < 18; i++) {
      const x = -11 + i * 1.45 + Math.sin(i * 2.1) * 0.45;
      const z = -6.8 - (i % 3) * 1.7;
      trees.push({
        x,
        z,
        s: 0.85 + ((i * 19) % 10) * 0.045,
        tint: i % 3 === 0 ? '#2f7d32' : i % 3 === 1 ? '#3d8b40' : '#25662a',
      });
    }
    // Side groves near left farm & right dark woods
    const sideCoords = [
      [-10.2, -2.5],
      [-10.6, 2.8],
      [-9.5, 6.2],
      [12.2, -4.4],
      [12.8, 0.5],
      [11.9, 4.9],
      [8.4, 6.6],
      [-4.2, 7.2],
      [2.5, 7.6],
    ];
    sideCoords.forEach(([x, z], idx) => {
      trees.push({
        x,
        z,
        s: 0.9 + (idx % 4) * 0.14,
        tint: x > 7 ? '#2c4a3e' : '#347d38',
      });
    });

    const rocks: Array<{ x: number; z: number; sx: number; sy: number; sz: number; ry: number }> = [
      { x: -8.2, z: -5.2, sx: 1.1, sy: 0.65, sz: 0.9, ry: 0.4 },
      { x: 6.4, z: -5.5, sx: 1.25, sy: 0.72, sz: 0.95, ry: 1.2 },
      { x: 10.6, z: -4.2, sx: 1.35, sy: 0.95, sz: 1.1, ry: 2.1 },
      { x: 10.2, z: 4.5, sx: 1.2, sy: 0.8, sz: 1.0, ry: 0.9 },
      { x: -7.8, z: 5.4, sx: 0.95, sy: 0.55, sz: 0.85, ry: 1.8 },
      { x: 4.1, z: 5.8, sx: 0.85, sy: 0.48, sz: 0.8, ry: 0.5 },
      { x: -1.5, z: -5.8, sx: 0.9, sy: 0.52, sz: 0.75, ry: 2.6 },
    ];
    return { trees, rocks };
  }, []);

  useEffect(() => {
    if (treeTrunksRef.current && treeCrownsRef.current) {
      perimeterProps.trees.forEach((t, i) => {
        _dummy.position.set(t.x, 0.75 * t.s, t.z);
        _dummy.rotation.set(0, i * 0.9, 0);
        _dummy.scale.set(t.s, t.s, t.s);
        _dummy.updateMatrix();
        treeTrunksRef.current!.setMatrixAt(i, _dummy.matrix);

        _dummy.position.set(t.x, 2.25 * t.s, t.z);
        _dummy.rotation.set(0, i * 1.1, 0);
        _dummy.scale.set(t.s, t.s * 1.15, t.s);
        _dummy.updateMatrix();
        treeCrownsRef.current!.setMatrixAt(i, _dummy.matrix);
        _tmpColor.set(t.tint);
        treeCrownsRef.current!.setColorAt(i, _tmpColor);
      });
      treeTrunksRef.current.instanceMatrix.needsUpdate = true;
      treeCrownsRef.current.instanceMatrix.needsUpdate = true;
      if (treeCrownsRef.current.instanceColor) {
        treeCrownsRef.current.instanceColor.needsUpdate = true;
      }
      treeTrunksRef.current.computeBoundingSphere();
      treeCrownsRef.current.computeBoundingSphere();
    }

    if (rocksRef.current) {
      perimeterProps.rocks.forEach((r, i) => {
        _dummy.position.set(r.x, r.sy * 0.42, r.z);
        _dummy.rotation.set(0.15, r.ry, 0.1);
        _dummy.scale.set(r.sx, r.sy, r.sz);
        _dummy.updateMatrix();
        rocksRef.current!.setMatrixAt(i, _dummy.matrix);
      });
      rocksRef.current.instanceMatrix.needsUpdate = true;
      rocksRef.current.computeBoundingSphere();
    }
  }, [perimeterProps]);

  // Animate monster portal swirl & water-boost shimmer
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (portalRingRef.current) {
      portalRingRef.current.rotation.z = t * 1.3;
    }
    if (portalInnerRef.current) {
      const s = 0.94 + Math.sin(t * 3.5) * 0.06;
      portalInnerRef.current.scale.set(s, s, 1);
    }
    if (waterGlowRef.current) {
      const active = worldRef.current.waterBoostTimer > 0;
      waterGlowRef.current.visible = active;
      if (active) {
        const mat = waterGlowRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.18 + Math.sin(t * 6) * 0.07;
      }
    }
    if (cottageGroupRef.current) {
      const w = worldRef.current;
      const eatProg =
        w.status === 'EATING_HOUSE'
          ? w.houseEatProgress
          : w.status === 'GAME_OVER' && w.farmHp <= 0
          ? 1
          : 0;
      const dmgRatio = 1 - Math.max(0, w.farmHp) / Math.max(1, w.maxFarmHp);
      const biteMag = w.houseBiteShake * 0.22;
      const jx = biteMag > 0 ? Math.sin(t * 54) * biteMag : 0;
      const jz = biteMag > 0 ? Math.cos(t * 48) * biteMag : 0;
      const baseScale = Math.max(0.01, (1 - dmgRatio * 0.16) * (1 - eatProg * 0.98));

      cottageGroupRef.current.visible = eatProg < 0.99;
      cottageGroupRef.current.position.set(-7.05 + jx, -eatProg * 1.15, jz);
      cottageGroupRef.current.scale.set(
        baseScale * (1 + Math.sin(t * 32) * biteMag * 0.3),
        baseScale * (1 - Math.sin(t * 32) * biteMag * 0.25),
        baseScale
      );
      cottageGroupRef.current.rotation.z =
        -dmgRatio * 0.08 - eatProg * 0.55 + Math.sin(t * 42) * biteMag * 0.35;

      if (cottageRoofRef.current) {
        cottageRoofRef.current.position.y = 3.05 - eatProg * 0.85;
        cottageRoofRef.current.rotation.z = eatProg * 0.95;
        cottageRoofRef.current.rotation.x = eatProg * 0.45;
      }
    }
  });

  // Read selection state to highlight valid merge targets
  const world = worldRef.current;
  const sel = world.selectedPlot;
  const selectedPlant = sel
    ? world.plants.find((p) => p.row === sel.row && p.col === sel.col)
    : undefined;

  return (
    <group>
      {/* Balanced Warm Key + Cool Sky/Ground Hemisphere + Soft Rim */}
      <hemisphereLight args={['#c8eeff', '#4b7a38', 0.95]} />
      <directionalLight
        position={[-7, 14, 9]}
        intensity={1.55}
        color="#fff2d6"
        castShadow={!isSoftwareGl}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-13}
        shadow-camera-right={13}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[10, 6, -8]} intensity={0.48} color="#93c5fd" />

      {/* Expansive Natural Meadow Ground */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[1.5, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[76, 60]} />
        <meshStandardMaterial
          map={meadowTexture}
          roughness={0.95}
          metalness={0.0}
        />
      </mesh>

      {/* Subtle Monster Approach Dirt Lanes (3 tracks) */}
      {LANE_Z.map((z, row) => (
        <mesh
          key={`lane-${row}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[5.7, 0.02, z]}
          receiveShadow
        >
          <planeGeometry args={[6.8, 1.55]} />
          <meshStandardMaterial
            color={row % 2 === 0 ? '#7a5a3a' : '#705134'}
            roughness={0.94}
            metalness={0}
          />
        </mesh>
      ))}

      {/* Subtle Garden Patio Frame under the 3×5 Plots */}
      <mesh position={[-0.9, 0.04, 0]} receiveShadow>
        <boxGeometry args={[9.0, 0.08, 8.2]} />
        <meshStandardMaterial color="#87613d" roughness={0.88} metalness={0.02} />
      </mesh>

      {/* Watering Boost Shimmer Layer over Garden */}
      <mesh
        ref={waterGlowRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[-0.9, 0.27, 0]}
        visible={false}
      >
        <planeGeometry args={[8.6, 7.8]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.2}
          depthWrite={false}
        />
      </mesh>

      {/* 3×5 Interactive Raised Garden Soil Plots */}
      {Array.from({ length: GRID_ROWS }).map((_, row) =>
        Array.from({ length: GRID_COLS }).map((__, col) => {
          const key = `${row}-${col}`;
          const x = COL_X[col];
          const z = LANE_Z[row];
          const isSelected = sel?.row === row && sel?.col === col;
          const plantHere = world.plants.find(
            (p) => p.row === row && p.col === col
          );
          const isMoveTarget = Boolean(selectedPlant) && !plantHere;
          const isHovered = hoveredPlot === key;

          return (
            <group key={key} position={[x, 0.08, z]}>
              {/* Wooden Planter Rim */}
              <mesh position={[0, 0.07, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.48, 0.14, 1.84]} />
                <meshStandardMaterial
                  color={
                    isSelected
                      ? '#f59e0b'
                      : isMoveTarget
                      ? '#38bdf8'
                      : isHovered
                      ? '#b47d48'
                      : '#8c5a32'
                  }
                  roughness={0.82}
                  metalness={0.05}
                />
              </mesh>

              {/* Dark Fertile Soil Surface */}
              <mesh position={[0, 0.15, 0]} receiveShadow>
                <boxGeometry args={[1.3, 0.05, 1.64]} />
                <meshStandardMaterial
                  map={soilTexture}
                  color={(row + col) % 2 === 0 ? '#ffffff' : '#ebd9c5'}
                  roughness={0.96}
                  metalness={0}
                />
              </mesh>

              {/* Selection / Move Target Glow Ring */}
              {(isSelected || isMoveTarget || isHovered) && (
                <mesh
                  rotation={[-Math.PI / 2, 0, 0]}
                  position={[0, 0.19, 0]}
                >
                  <ringGeometry args={[0.52, 0.68, 28]} />
                  <meshBasicMaterial
                    color={
                      isSelected
                        ? '#fde047'
                        : isMoveTarget
                        ? '#38bdf8'
                        : '#86efac'
                    }
                    transparent
                    opacity={isSelected ? 0.92 : isMoveTarget ? 0.6 : 0.45}
                    depthWrite={false}
                  />
                </mesh>
              )}

              {/* Subtle Tier Color Dot Accent when Planted */}
              {plantHere && (
                <mesh
                  rotation={[-Math.PI / 2, 0, 0]}
                  position={[0, 0.185, 0.66]}
                >
                  <circleGeometry args={[0.11, 14]} />
                  <meshBasicMaterial
                    color={PLANT_SPECS[plantHere.tier].accentColor}
                  />
                </mesh>
              )}

              {/* Generous Invisible Raycast Hitbox for Easy Mobile/Desktop Taps */}
              <mesh
                position={[0, 0.55, 0]}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  setHoveredPlot(key);
                }}
                onPointerOut={() => {
                  setHoveredPlot((prev) => (prev === key ? null : prev));
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPlot(row, col);
                }}
              >
                <boxGeometry args={[1.52, 1.1, 1.9]} />
                <meshBasicMaterial visible={false} />
              </mesh>
            </group>
          );
        })
      )}

      {/* Composite 3D Farm Cottage / Greenhouse Base on the Left (x = -7.05) */}
      <group ref={cottageGroupRef} position={[-7.05, 0, 0]}>
        {/* Stone Foundation */}
        <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.3, 0.5, 7.6]} />
          <meshStandardMaterial color="#78716c" roughness={0.92} metalness={0.04} />
        </mesh>
        {/* Warm Timber Cottage Main Wall */}
        <mesh position={[-0.15, 1.45, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.95, 1.95, 5.4]} />
          <meshStandardMaterial color="#e7d3b0" roughness={0.85} metalness={0.02} />
        </mesh>
        {/* Pitched Terracotta Shingle Roof */}
        <mesh
          ref={cottageRoofRef}
          position={[-0.15, 3.05, 0]}
          rotation={[0, Math.PI / 4, 0]}
          castShadow
        >
          <coneGeometry args={[3.5, 1.65, 4]} />
          <meshStandardMaterial color="#b91c1c" roughness={0.68} metalness={0.08} />
        </mesh>
        {/* Warm Glowing Farm Window + Door */}
        <mesh position={[0.84, 1.25, 0]}>
          <boxGeometry args={[0.08, 1.4, 0.95]} />
          <meshStandardMaterial color="#6b3e1e" roughness={0.78} metalness={0.05} />
        </mesh>
        <mesh position={[0.85, 1.6, -1.65]}>
          <boxGeometry args={[0.08, 0.72, 0.82]} />
          <meshStandardMaterial
            color="#fef08a"
            emissive="#f59e0b"
            emissiveIntensity={0.75}
            roughness={0.25}
          />
        </mesh>
        <mesh position={[0.85, 1.6, 1.65]}>
          <boxGeometry args={[0.08, 0.72, 0.82]} />
          <meshStandardMaterial
            color="#fef08a"
            emissive="#f59e0b"
            emissiveIntensity={0.75}
            roughness={0.25}
          />
        </mesh>
        {/* Protective Wooden Picket Fence Posts along the Gate Line */}
        {[-3.4, -2.1, -0.8, 0.8, 2.1, 3.4].map((fz, i) => (
          <mesh key={`fp-${i}`} position={[1.38, 0.55, fz]} castShadow>
            <boxGeometry args={[0.2, 1.1, 0.2]} />
            <meshStandardMaterial color="#92562d" roughness={0.85} />
          </mesh>
        ))}
        <mesh position={[1.38, 0.78, 0]}>
          <boxGeometry args={[0.12, 0.14, 7.2]} />
          <meshStandardMaterial color="#a6683b" roughness={0.85} />
        </mesh>
      </group>

      {/* Composite 3D Plant Nursery Shop Booth (Clickable -> Opens Plant Shop) */}
      <group
        position={[-1.4, 0, -5.55]}
        onClick={(e) => {
          e.stopPropagation();
          onOpenShop();
        }}
      >
        {/* Wooden Shop Counter */}
        <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.2, 1.1, 1.15]} />
          <meshStandardMaterial color="#8c5a32" roughness={0.85} />
        </mesh>
        {/* Counter Trim */}
        <mesh position={[0, 1.14, 0.04]} castShadow>
          <boxGeometry args={[3.4, 0.14, 1.3]} />
          <meshStandardMaterial color="#d4a373" roughness={0.78} />
        </mesh>
        {/* Support Posts */}
        {[-1.42, 1.42].map((px, i) => (
          <mesh key={`sp-${i}`} position={[px, 1.85, 0]} castShadow>
            <boxGeometry args={[0.16, 1.5, 0.16]} />
            <meshStandardMaterial color="#6b3e1e" roughness={0.85} />
          </mesh>
        ))}
        {/* Striped Emerald & Gold Awning Canopy */}
        {[-1.1, -0.37, 0.37, 1.1].map((ax, i) => (
          <mesh
            key={`aw-${i}`}
            position={[ax, 2.66, 0.14]}
            rotation={[0.24, 0, 0]}
            castShadow
          >
            <boxGeometry args={[0.74, 0.14, 1.7]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? '#16a34a' : '#facc15'}
              roughness={0.58}
            />
          </mesh>
        ))}
        {/* Golden Shop Crest Gem */}
        <mesh position={[0, 3.06, 0.65]}>
          <octahedronGeometry args={[0.26, 0]} />
          <meshStandardMaterial
            color="#fef08a"
            emissive="#f59e0b"
            emissiveIntensity={1.2}
            roughness={0.2}
            metalness={0.7}
          />
        </mesh>
        {/* 3 Display Plant Pots on the Shop Counter */}
        {[
          { x: -0.9, col: '#4ade80' },
          { x: 0, col: '#f97316' },
          { x: 0.9, col: '#38bdf8' },
        ].map((item, i) => (
          <group key={`pot-${i}`} position={[item.x, 1.22, 0.15]}>
            <mesh position={[0, 0.16, 0]} castShadow>
              <cylinderGeometry args={[0.2, 0.14, 0.32, 8]} />
              <meshStandardMaterial color="#b45309" roughness={0.82} />
            </mesh>
            <mesh position={[0, 0.44, 0]} castShadow>
              <dodecahedronGeometry args={[0.22, 0]} />
              <meshStandardMaterial
                color={item.col}
                emissive={item.col}
                emissiveIntensity={0.45}
                roughness={0.35}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* Composite 3D Dark Monster Portal Arch on the Right (x = 9.4) */}
      <group position={[9.45, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        {/* Cracked Obsidian Pillars */}
        <mesh position={[-3.3, 1.85, 0]} castShadow>
          <boxGeometry args={[0.9, 3.7, 0.95]} />
          <meshStandardMaterial color="#272038" roughness={0.84} metalness={0.18} />
        </mesh>
        <mesh position={[3.3, 1.85, 0]} castShadow>
          <boxGeometry args={[0.9, 3.7, 0.95]} />
          <meshStandardMaterial color="#272038" roughness={0.84} metalness={0.18} />
        </mesh>
        {/* Top Stone Crossbeam */}
        <mesh position={[0, 3.85, 0]} castShadow>
          <boxGeometry args={[7.8, 0.75, 1.05]} />
          <meshStandardMaterial color="#31244a" roughness={0.8} metalness={0.22} />
        </mesh>
        {/* Glowing Violet Portal Vortex */}
        <mesh ref={portalRingRef} position={[0, 1.9, 0.08]}>
          <torusGeometry args={[2.1, 0.24, 12, 32]} />
          <meshStandardMaterial
            color="#a855f7"
            emissive="#9333ea"
            emissiveIntensity={1.15}
            roughness={0.25}
            metalness={0.45}
          />
        </mesh>
        <mesh ref={portalInnerRef} position={[0, 1.9, 0.02]}>
          <circleGeometry args={[1.95, 28]} />
          <meshBasicMaterial color="#3b0764" transparent opacity={0.78} />
        </mesh>
        {/* Twin Warning Braziers */}
        {[-3.3, 3.3].map((bx, i) => (
          <mesh key={`brz-${i}`} position={[bx, 4.1, 0]}>
            <octahedronGeometry args={[0.45, 0]} />
            <meshStandardMaterial
              color="#f97316"
              emissive="#ef4444"
              emissiveIntensity={1.4}
              roughness={0.2}
            />
          </mesh>
        ))}
      </group>

      {/* Instanced Perimeter Trees & Boulders */}
      <instancedMesh
        ref={treeTrunksRef}
        args={[undefined, undefined, perimeterProps.trees.length]}
        castShadow
      >
        <cylinderGeometry args={[0.18, 0.28, 1.5, 7]} />
        <meshStandardMaterial color="#6d4628" roughness={0.92} />
      </instancedMesh>
      <instancedMesh
        ref={treeCrownsRef}
        args={[undefined, undefined, perimeterProps.trees.length]}
        castShadow
      >
        <coneGeometry args={[1.15, 2.5, 7]} />
        <meshStandardMaterial color="#ffffff" roughness={0.85} />
      </instancedMesh>
      <instancedMesh
        ref={rocksRef}
        args={[undefined, undefined, perimeterProps.rocks.length]}
        castShadow
        receiveShadow
      >
        <dodecahedronGeometry args={[0.75, 0]} />
        <meshStandardMaterial color="#64748b" roughness={0.9} metalness={0.08} />
      </instancedMesh>
    </group>
  );
};
