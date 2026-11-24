import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { PlantMergeWorld } from './gameLogic';
import {
  COL_X,
  LANE_Z,
  MONSTER_SPECS,
  MonsterEntity,
  PlantEntity,
} from './types';

interface Entities3DProps {
  worldRef: React.MutableRefObject<PlantMergeWorld>;
  renderTick: number;
}

const _mat4 = new THREE.Matrix4();
const _pos = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _color = new THREE.Color();

/**
 * Composite 3D Plant Hero (11 evolving tiers, each 4-10 distinct parts, bottom-center grounded)
 */
const PlantHeroMesh: React.FC<{
  plant: PlantEntity;
  worldRef: React.MutableRefObject<PlantMergeWorld>;
}> = ({ plant, worldRef }) => {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const halo2Ref = useRef<THREE.Mesh>(null);
  const hpFillRef = useRef<THREE.Mesh>(null);
  const hpGroupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const live = worldRef.current.plants.find((p) => p.id === plant.id);
    if (!live || !groupRef.current) return;
    const t = clock.getElapsedTime();
    const isSel =
      worldRef.current.selectedPlot?.row === live.row &&
      worldRef.current.selectedPlot?.col === live.col;

    const sAnim =
      live.spawnAnim < 1
        ? 0.4 + 0.6 * live.spawnAnim + Math.sin(live.spawnAnim * Math.PI) * 0.25
        : 1;
    const hoverY = isSel ? 0.16 + Math.sin(t * 6) * 0.05 : 0;

    groupRef.current.position.set(
      COL_X[live.col],
      0.26 + hoverY,
      LANE_Z[live.row]
    );
    groupRef.current.scale.setScalar(sAnim);

    if (headRef.current) {
      const sway = Math.sin(t * 3.1 + live.id) * 0.06;
      headRef.current.rotation.z = sway + live.recoil * 0.24;
      headRef.current.position.x = -live.recoil * 0.14;
    }
    if (haloRef.current) {
      haloRef.current.rotation.y = t * 2.2;
      haloRef.current.rotation.x = Math.sin(t * 1.5) * 0.25;
    }
    if (halo2Ref.current) {
      halo2Ref.current.rotation.y = -t * 1.9;
      halo2Ref.current.rotation.z = Math.cos(t * 1.4) * 0.55;
    }
    if (hpGroupRef.current && hpFillRef.current) {
      const ratio = Math.max(0, live.hp / live.maxHp);
      hpGroupRef.current.visible = ratio < 0.99;
      hpFillRef.current.scale.x = Math.max(0.01, ratio);
      hpFillRef.current.position.x = -(1 - ratio) * 0.44;
    }
  });

  const tier = plant.tier;

  return (
    <group ref={groupRef} position={[COL_X[plant.col], 0.26, LANE_Z[plant.row]]}>
      {/* Contact Shadow Disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.48 + (tier >= 9 ? 0.08 : 0), 18]} />
        <meshBasicMaterial color="#0b1f0c" transparent opacity={0.38} depthWrite={false} />
      </mesh>

      {/* Tier 1: Pea Sprout (برعم البازلاء) */}
      {tier === 1 && (
        <group>
          <mesh position={[0, 0.28, 0]} castShadow>
            <cylinderGeometry args={[0.09, 0.13, 0.56, 8]} />
            <meshStandardMaterial color="#16a34a" roughness={0.75} />
          </mesh>
          <mesh position={[-0.22, 0.18, 0.16]} rotation={[0.3, 0.4, 0.8]} castShadow>
            <coneGeometry args={[0.16, 0.42, 6]} />
            <meshStandardMaterial color="#22c55e" roughness={0.68} />
          </mesh>
          <mesh position={[0.2, 0.18, -0.16]} rotation={[-0.3, -0.5, -0.8]} castShadow>
            <coneGeometry args={[0.16, 0.42, 6]} />
            <meshStandardMaterial color="#4ade80" roughness={0.68} />
          </mesh>
          <group ref={headRef} position={[0, 0.64, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.3, 14, 12]} />
              <meshStandardMaterial color="#4ade80" roughness={0.42} metalness={0.05} />
            </mesh>
            <mesh position={[0.28, 0.02, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.14, 0.1, 0.26, 10]} />
              <meshStandardMaterial color="#15803d" roughness={0.5} />
            </mesh>
            <mesh position={[0.14, 0.1, 0.21]}>
              <sphereGeometry args={[0.055, 8, 8]} />
              <meshStandardMaterial color="#0f172a" roughness={0.15} metalness={0.3} />
            </mesh>
            <mesh position={[0.14, 0.1, -0.21]}>
              <sphereGeometry args={[0.055, 8, 8]} />
              <meshStandardMaterial color="#0f172a" roughness={0.15} metalness={0.3} />
            </mesh>
          </group>
        </group>
      )}

      {/* Tier 2: Ember Tulip (زهرة النار) */}
      {tier === 2 && (
        <group>
          <mesh position={[0, 0.34, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.15, 0.68, 8]} />
            <meshStandardMaterial color="#15803d" roughness={0.78} />
          </mesh>
          {[-1, 1].map((d) => (
            <mesh
              key={d}
              position={[0, 0.2, d * 0.26]}
              rotation={[d * 0.65, 0, 0]}
              castShadow
            >
              <boxGeometry args={[0.28, 0.06, 0.42]} />
              <meshStandardMaterial color="#22c55e" roughness={0.72} />
            </mesh>
          ))}
          <group ref={headRef} position={[0, 0.78, 0]}>
            {[0, 1, 2, 3, 4].map((p) => {
              const a = (p * Math.PI * 2) / 5;
              return (
                <mesh
                  key={p}
                  position={[Math.cos(a) * 0.22, 0.08, Math.sin(a) * 0.22]}
                  rotation={[0, -a, -0.45]}
                  castShadow
                >
                  <coneGeometry args={[0.18, 0.48, 6]} />
                  <meshStandardMaterial
                    color={p % 2 === 0 ? '#ea580c' : '#ef4444'}
                    roughness={0.45}
                    metalness={0.08}
                  />
                </mesh>
              );
            })}
            <mesh position={[0.06, 0.12, 0]}>
              <octahedronGeometry args={[0.22, 0]} />
              <meshStandardMaterial
                color="#fef08a"
                emissive="#f97316"
                emissiveIntensity={1.25}
                roughness={0.2}
              />
            </mesh>
          </group>
        </group>
      )}

      {/* Tier 3: Frost Cactus (صبار الجليد) */}
      {tier === 3 && (
        <group>
          <group ref={headRef}>
            <mesh position={[0, 0.52, 0]} castShadow>
              <cylinderGeometry args={[0.28, 0.32, 1.02, 10]} />
              <meshStandardMaterial color="#0e7490" roughness={0.55} metalness={0.12} />
            </mesh>
            <mesh position={[0, 0.56, 0.38]} rotation={[0.5, 0, 0]} castShadow>
              <capsuleGeometry args={[0.12, 0.3, 6, 8]} />
              <meshStandardMaterial color="#06b6d4" roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.62, -0.38]} rotation={[-0.5, 0, 0]} castShadow>
              <capsuleGeometry args={[0.12, 0.3, 6, 8]} />
              <meshStandardMaterial color="#06b6d4" roughness={0.5} />
            </mesh>
            <mesh position={[0, 1.16, 0]} castShadow>
              <octahedronGeometry args={[0.28, 0]} />
              <meshStandardMaterial
                color="#a5f3fc"
                emissive="#22d3ee"
                emissiveIntensity={0.85}
                roughness={0.15}
                metalness={0.55}
              />
            </mesh>
            <mesh position={[0.26, 0.72, 0.12]}>
              <sphereGeometry args={[0.055, 8, 8]} />
              <meshStandardMaterial color="#ecfeff" emissive="#67e8f9" emissiveIntensity={1.2} />
            </mesh>
            <mesh position={[0.26, 0.72, -0.12]}>
              <sphereGeometry args={[0.055, 8, 8]} />
              <meshStandardMaterial color="#ecfeff" emissive="#67e8f9" emissiveIntensity={1.2} />
            </mesh>
          </group>
        </group>
      )}

      {/* Tier 4: Storm Sunflower (زهرة الصاعقة) */}
      {tier === 4 && (
        <group>
          <mesh position={[0, 0.44, 0]} castShadow>
            <cylinderGeometry args={[0.11, 0.17, 0.88, 8]} />
            <meshStandardMaterial color="#15803d" roughness={0.75} />
          </mesh>
          <group ref={headRef} position={[0, 0.96, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.34, 0.34, 0.18, 14]} />
              <meshStandardMaterial color="#92400e" roughness={0.35} metalness={0.6} />
            </mesh>
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
              const a = (i * Math.PI * 2) / 8;
              return (
                <mesh
                  key={i}
                  position={[0, Math.sin(a) * 0.42, Math.cos(a) * 0.42]}
                  rotation={[a, 0, 0]}
                  castShadow
                >
                  <boxGeometry args={[0.12, 0.18, 0.34]} />
                  <meshStandardMaterial
                    color="#facc15"
                    emissive="#eab308"
                    emissiveIntensity={0.45}
                    roughness={0.35}
                  />
                </mesh>
              );
            })}
            <mesh ref={haloRef}>
              <torusGeometry args={[0.56, 0.045, 8, 24]} />
              <meshStandardMaterial
                color="#fef08a"
                emissive="#facc15"
                emissiveIntensity={1.2}
                roughness={0.2}
                metalness={0.7}
              />
            </mesh>
          </group>
        </group>
      )}

      {/* Tier 5: Dragon Blossom (زهرة التنين) */}
      {tier === 5 && (
        <group>
          <mesh position={[0, 0.44, 0]} castShadow>
            <cylinderGeometry args={[0.16, 0.24, 0.88, 8]} />
            <meshStandardMaterial color="#581c87" roughness={0.62} metalness={0.2} />
          </mesh>
          {[0, 1, 2, 3].map((i) => {
            const a = (i * Math.PI) / 2 + 0.4;
            return (
              <mesh
                key={i}
                position={[Math.cos(a) * 0.32, 0.18, Math.sin(a) * 0.32]}
                rotation={[0, -a, -0.7]}
                castShadow
              >
                <coneGeometry args={[0.18, 0.5, 5]} />
                <meshStandardMaterial color="#7e22ce" roughness={0.55} />
              </mesh>
            );
          })}
          <group ref={headRef} position={[0, 0.96, 0]}>
            {[-0.24, 0.24].map((dz, idx) => (
              <group key={idx} position={[0.08, idx === 0 ? 0.08 : -0.04, dz]}>
                <mesh castShadow>
                  <dodecahedronGeometry args={[0.28, 0]} />
                  <meshStandardMaterial color="#c026d3" roughness={0.34} metalness={0.35} />
                </mesh>
                <mesh position={[0.25, 0, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
                  <coneGeometry args={[0.16, 0.32, 6]} />
                  <meshStandardMaterial
                    color="#f43f5e"
                    emissive="#e11d48"
                    emissiveIntensity={0.7}
                    roughness={0.3}
                  />
                </mesh>
                <mesh position={[0.14, 0.14, 0.12]}>
                  <sphereGeometry args={[0.055, 8, 8]} />
                  <meshStandardMaterial color="#fef08a" emissive="#facc15" emissiveIntensity={1.4} />
                </mesh>
              </group>
            ))}
          </group>
        </group>
      )}

      {/* Tier 6: Crystal Ancient (شجرة الكريستال) */}
      {tier === 6 && (
        <group>
          <mesh position={[0, 0.56, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.32, 1.12, 9]} />
            <meshStandardMaterial color="#d97706" roughness={0.32} metalness={0.68} />
          </mesh>
          <group ref={headRef} position={[0, 1.28, 0]}>
            <mesh castShadow>
              <dodecahedronGeometry args={[0.52, 0]} />
              <meshStandardMaterial
                color="#10b981"
                emissive="#059669"
                emissiveIntensity={0.6}
                roughness={0.22}
                metalness={0.45}
              />
            </mesh>
            <mesh position={[0, 0.62, 0]} castShadow>
              <octahedronGeometry args={[0.28, 0]} />
              <meshStandardMaterial
                color="#a7f3d0"
                emissive="#34d399"
                emissiveIntensity={1.45}
                roughness={0.12}
                metalness={0.75}
              />
            </mesh>
            <mesh ref={haloRef}>
              <torusGeometry args={[0.68, 0.055, 10, 28]} />
              <meshStandardMaterial
                color="#fde047"
                emissive="#f59e0b"
                emissiveIntensity={1.1}
                roughness={0.18}
                metalness={0.85}
              />
            </mesh>
          </group>
        </group>
      )}

      {/* Tier 7 (NEW #1): Venom Shroom (فطر السم) */}
      {tier === 7 && (
        <group>
          <mesh position={[0, 0.42, 0]} castShadow>
            <cylinderGeometry args={[0.24, 0.34, 0.84, 10]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.68} />
          </mesh>
          {/* Glowing Toxic Base Sacs */}
          {[0, 1, 2].map((i) => {
            const a = (i * Math.PI * 2) / 3;
            return (
              <mesh key={i} position={[Math.cos(a) * 0.32, 0.2, Math.sin(a) * 0.32]}>
                <sphereGeometry args={[0.14, 10, 8]} />
                <meshStandardMaterial
                  color="#a3e635"
                  emissive="#65a30d"
                  emissiveIntensity={1.1}
                  roughness={0.25}
                />
              </mesh>
            );
          })}
          <group ref={headRef} position={[0, 0.92, 0]}>
            {/* Broad Spotted Toxic Mushroom Cap */}
            <mesh scale={[1.15, 0.65, 1.15]} castShadow>
              <sphereGeometry args={[0.56, 16, 12]} />
              <meshStandardMaterial color="#581c87" roughness={0.4} metalness={0.2} />
            </mesh>
            {/* Glowing Lime Spore Spots */}
            {[
              [0.34, 0.24, 0.22],
              [-0.32, 0.26, 0.24],
              [0.08, 0.35, -0.34],
              [-0.22, 0.28, -0.28],
            ].map(([sx, sy, sz], i) => (
              <mesh key={i} position={[sx, sy, sz]}>
                <sphereGeometry args={[0.11, 8, 8]} />
                <meshStandardMaterial
                  color="#bef264"
                  emissive="#84cc16"
                  emissiveIntensity={1.4}
                />
              </mesh>
            ))}
            {/* Toxic Spore Cannon Snout */}
            <mesh position={[0.48, -0.06, 0]} rotation={[0, 0, -Math.PI / 2]}>
              <cylinderGeometry args={[0.16, 0.11, 0.32, 10]} />
              <meshStandardMaterial color="#4d7c0f" emissive="#84cc16" emissiveIntensity={0.6} />
            </mesh>
            <mesh ref={haloRef} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.08, 0]}>
              <torusGeometry args={[0.62, 0.04, 8, 22]} />
              <meshStandardMaterial color="#bef264" emissive="#84cc16" emissiveIntensity={1.2} />
            </mesh>
          </group>
        </group>
      )}

      {/* Tier 8 (NEW #2): Lunar Lotus (لوتس القمر) */}
      {tier === 8 && (
        <group>
          <mesh position={[0, 0.26, 0]} castShadow>
            <cylinderGeometry args={[0.48, 0.56, 0.2, 12]} />
            <meshStandardMaterial color="#1e3a8a" roughness={0.42} metalness={0.35} />
          </mesh>
          <group ref={headRef} position={[0, 0.72, 0]}>
            {/* Outer Sapphire Petals */}
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const a = (i * Math.PI * 2) / 6;
              return (
                <mesh
                  key={i}
                  position={[Math.cos(a) * 0.38, -0.05, Math.sin(a) * 0.38]}
                  rotation={[0, -a, -0.65]}
                  castShadow
                >
                  <coneGeometry args={[0.22, 0.62, 6]} />
                  <meshStandardMaterial
                    color="#3b82f6"
                    emissive="#1d4ed8"
                    emissiveIntensity={0.55}
                    roughness={0.28}
                    metalness={0.35}
                  />
                </mesh>
              );
            })}
            {/* Inner Silver Petals */}
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const a = (i * Math.PI * 2) / 6 + 0.52;
              return (
                <mesh
                  key={`in-${i}`}
                  position={[Math.cos(a) * 0.22, 0.12, Math.sin(a) * 0.22]}
                  rotation={[0, -a, -0.3]}
                  castShadow
                >
                  <coneGeometry args={[0.16, 0.52, 6]} />
                  <meshStandardMaterial color="#dbeafe" roughness={0.2} metalness={0.6} />
                </mesh>
              );
            })}
            {/* Levitating Moon Orb */}
            <mesh position={[0, 0.54, 0]}>
              <sphereGeometry args={[0.25, 14, 12]} />
              <meshStandardMaterial
                color="#eff6ff"
                emissive="#93c5fd"
                emissiveIntensity={1.6}
                roughness={0.12}
              />
            </mesh>
            {/* Orbiting Crescent Moon Ring */}
            <mesh ref={haloRef} position={[0, 0.54, 0]}>
              <torusGeometry args={[0.48, 0.06, 10, 24, Math.PI * 1.35]} />
              <meshStandardMaterial
                color="#fef08a"
                emissive="#facc15"
                emissiveIntensity={1.4}
                metalness={0.8}
              />
            </mesh>
          </group>
        </group>
      )}

      {/* Tier 9 (NEW #3): Volcano Palm (نخلة البركان) */}
      {tier === 9 && (
        <group>
          {/* Obsidian Volcanic Trunk */}
          <mesh position={[0, 0.58, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.34, 1.16, 8]} />
            <meshStandardMaterial color="#1c1917" roughness={0.78} metalness={0.3} />
          </mesh>
          {/* Glowing Lava Ring Cracks on Trunk */}
          <mesh position={[0, 0.52, 0]}>
            <cylinderGeometry args={[0.26, 0.28, 0.14, 8]} />
            <meshStandardMaterial color="#fb923c" emissive="#ea580c" emissiveIntensity={1.5} />
          </mesh>
          <group ref={headRef} position={[0, 1.24, 0]}>
            {/* 6 Radiating Molten Palm Fronds */}
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const a = (i * Math.PI * 2) / 6;
              return (
                <mesh
                  key={i}
                  position={[Math.cos(a) * 0.44, 0.04, Math.sin(a) * 0.44]}
                  rotation={[0, -a, -1.05]}
                  castShadow
                >
                  <coneGeometry args={[0.2, 0.78, 5]} />
                  <meshStandardMaterial
                    color={i % 2 === 0 ? '#be123c' : '#ea580c'}
                    emissive="#e11d48"
                    emissiveIntensity={0.65}
                    roughness={0.35}
                  />
                </mesh>
              );
            })}
            {/* Volcanic Magma Core */}
            <mesh position={[0, 0.28, 0]}>
              <dodecahedronGeometry args={[0.34, 0]} />
              <meshStandardMaterial
                color="#fef08a"
                emissive="#f97316"
                emissiveIntensity={1.75}
                roughness={0.18}
              />
            </mesh>
            <mesh ref={haloRef} position={[0, 0.28, 0]}>
              <torusGeometry args={[0.66, 0.05, 8, 26]} />
              <meshStandardMaterial color="#fb7185" emissive="#e11d48" emissiveIntensity={1.4} />
            </mesh>
          </group>
        </group>
      )}

      {/* Tier 10 (NEW #4): Starlight Orchid (زهرة النجم) */}
      {tier === 10 && (
        <group>
          <mesh position={[0, 0.52, 0]} castShadow>
            <cylinderGeometry args={[0.16, 0.26, 1.04, 9]} />
            <meshStandardMaterial color="#0369a1" roughness={0.28} metalness={0.65} />
          </mesh>
          <group ref={headRef} position={[0, 1.18, 0]}>
            {/* 5 Pointed Starlight Petals */}
            {[0, 1, 2, 3, 4].map((i) => {
              const a = (i * Math.PI * 2) / 5;
              return (
                <mesh
                  key={i}
                  position={[0, Math.sin(a) * 0.48, Math.cos(a) * 0.48]}
                  rotation={[a, 0, 0]}
                  castShadow
                >
                  <octahedronGeometry args={[0.24, 0]} />
                  <meshStandardMaterial
                    color="#38bdf8"
                    emissive="#0284c7"
                    emissiveIntensity={0.95}
                    roughness={0.15}
                    metalness={0.7}
                  />
                </mesh>
              );
            })}
            {/* Radiant Star Core */}
            <mesh>
              <octahedronGeometry args={[0.34, 0]} />
              <meshStandardMaterial
                color="#ffffff"
                emissive="#7dd3fc"
                emissiveIntensity={1.8}
                roughness={0.1}
              />
            </mesh>
            {/* Double Celestial Rings */}
            <mesh ref={haloRef}>
              <torusGeometry args={[0.72, 0.045, 10, 28]} />
              <meshStandardMaterial color="#bae6fd" emissive="#38bdf8" emissiveIntensity={1.5} />
            </mesh>
            <mesh ref={halo2Ref}>
              <torusGeometry args={[0.58, 0.04, 8, 24]} />
              <meshStandardMaterial color="#fde047" emissive="#f59e0b" emissiveIntensity={1.4} />
            </mesh>
          </group>
        </group>
      )}

      {/* Tier 11 (NEW #5): Galaxy Guardian (حارس المجرة) */}
      {tier === 11 && (
        <group>
          {/* Sacred White-Gold Crystal Pedestal & Trunk */}
          <mesh position={[0, 0.16, 0]} castShadow>
            <cylinderGeometry args={[0.46, 0.56, 0.32, 10]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.2} metalness={0.85} />
          </mesh>
          <mesh position={[0, 0.72, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.34, 1.12, 10]} />
            <meshStandardMaterial color="#fef3c7" roughness={0.22} metalness={0.75} />
          </mesh>
          <group ref={headRef} position={[0, 1.48, 0]}>
            {/* Cosmic Nebula Crown */}
            <mesh castShadow>
              <icosahedronGeometry args={[0.54, 0]} />
              <meshStandardMaterial
                color="#a855f7"
                emissive="#7e22ce"
                emissiveIntensity={0.95}
                roughness={0.18}
                metalness={0.65}
              />
            </mesh>
            {/* Hovering Golden Star Crown */}
            <mesh position={[0, 0.74, 0]} castShadow>
              <octahedronGeometry args={[0.34, 0]} />
              <meshStandardMaterial
                color="#fef08a"
                emissive="#facc15"
                emissiveIntensity={2.0}
                roughness={0.1}
                metalness={0.9}
              />
            </mesh>
            {/* Dual Counter-Rotating Galaxy Rings */}
            <mesh ref={haloRef}>
              <torusGeometry args={[0.82, 0.055, 10, 32]} />
              <meshStandardMaterial
                color="#fef08a"
                emissive="#f59e0b"
                emissiveIntensity={1.6}
                metalness={0.9}
              />
            </mesh>
            <mesh ref={halo2Ref}>
              <torusGeometry args={[0.66, 0.05, 10, 28]} />
              <meshStandardMaterial
                color="#67e8f9"
                emissive="#22d3ee"
                emissiveIntensity={1.6}
                metalness={0.8}
              />
            </mesh>
          </group>
        </group>
      )}

      {/* Floating 3D Health Bar (shown only when damaged) */}
      <group
        ref={hpGroupRef}
        position={[0, 1.55 + Math.min(0.85, tier * 0.075), 0]}
        visible={false}
      >
        <mesh>
          <planeGeometry args={[0.92, 0.12]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>
        <mesh ref={hpFillRef} position={[0, 0, 0.01]}>
          <planeGeometry args={[0.88, 0.08]} />
          <meshBasicMaterial color="#4ade80" />
        </mesh>
      </group>
    </group>
  );
};

/**
 * Composite 3D Monster Actor (15 distinct species, bottom-center grounded, animated)
 */
const MonsterMesh: React.FC<{
  monster: MonsterEntity;
  worldRef: React.MutableRefObject<PlantMergeWorld>;
}> = ({ monster, worldRef }) => {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const leftWingRef = useRef<THREE.Mesh>(null);
  const rightWingRef = useRef<THREE.Mesh>(null);
  const hpFillRef = useRef<THREE.Mesh>(null);
  const frostAuraRef = useRef<THREE.Mesh>(null);
  const poisonAuraRef = useRef<THREE.Mesh>(null);

  const spec = MONSTER_SPECS[monster.kind];

  useFrame(() => {
    const live = worldRef.current.monsters.find((m) => m.id === monster.id);
    if (!live || !groupRef.current) return;

    const bob = spec.flying
      ? 0.54 + Math.sin(live.walkPhase) * 0.16
      : Math.abs(Math.sin(live.walkPhase)) * 0.13;
    const eatLungeX = live.isEatingHouse
      ? -Math.abs(Math.sin(live.walkPhase * 1.15)) * 0.52
      : 0;
    groupRef.current.position.set(live.x + eatLungeX, 0.08 + bob, live.z);

    if (bodyRef.current) {
      const chomp = live.isEatingHouse
        ? 0.28 + Math.sin(live.walkPhase * 1.8) * 0.36
        : live.isAttacking
        ? Math.sin(live.walkPhase * 1.4) * 0.25
        : 0;
      bodyRef.current.rotation.z = chomp + Math.sin(live.walkPhase) * 0.07;
      const hitPulse = 1 + live.hitFlash * 0.14;
      const eatStretch = live.isEatingHouse
        ? Math.abs(Math.sin(live.walkPhase * 1.8)) * 0.16
        : 0;
      bodyRef.current.scale.set(
        spec.scale * (hitPulse + eatStretch),
        spec.scale * (hitPulse - eatStretch * 0.45),
        spec.scale * hitPulse
      );
    }

    if (leftWingRef.current && rightWingRef.current) {
      const flap = Math.sin(live.walkPhase * 1.6) * 0.65;
      leftWingRef.current.rotation.x = flap;
      rightWingRef.current.rotation.x = -flap;
    }

    if (hpFillRef.current) {
      const ratio = Math.max(0, live.hp / live.maxHp);
      const halfW = live.kind === 'megaBoss' ? 0.69 : 0.48;
      hpFillRef.current.scale.x = Math.max(0.01, ratio);
      hpFillRef.current.position.x = -(1 - ratio) * halfW;
    }

    if (frostAuraRef.current) {
      frostAuraRef.current.visible = live.slowTimer > 0;
    }
    if (poisonAuraRef.current) {
      poisonAuraRef.current.visible = live.poisonTimer > 0;
    }
  });

  const kind = monster.kind;
  const hpBarHeight =
    kind === 'megaBoss'
      ? 3.7
      : kind === 'boss'
      ? 2.85
      : kind === 'dragon' || kind === 'iceYeti' || kind === 'magma'
      ? 2.15
      : kind === 'golem' || kind === 'orc' || kind === 'troll' || kind === 'darkKnight'
      ? 1.88
      : kind === 'mummy'
      ? 1.62
      : 1.48;

  return (
    <group ref={groupRef} position={[monster.x, 0.08, monster.z]}>
      {/* Ground Contact Shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.52 * spec.scale, 16]} />
        <meshBasicMaterial color="#090d16" transparent opacity={0.42} depthWrite={false} />
      </mesh>

      {/* Frost Slow Ring when chilled */}
      <mesh
        ref={frostAuraRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.04, 0]}
        visible={false}
      >
        <ringGeometry args={[0.48 * spec.scale, 0.66 * spec.scale, 20]} />
        <meshBasicMaterial color="#67e8f9" transparent opacity={0.85} depthWrite={false} />
      </mesh>

      {/* Poison Toxic Ring when poisoned */}
      <mesh
        ref={poisonAuraRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.06, 0]}
        visible={false}
      >
        <ringGeometry args={[0.34 * spec.scale, 0.46 * spec.scale, 18]} />
        <meshBasicMaterial color="#a3e635" transparent opacity={0.85} depthWrite={false} />
      </mesh>

      <group ref={bodyRef} scale={spec.scale}>
        {/* 1. Mud Slime */}
        {kind === 'slime' && (
          <group>
            <mesh position={[0, 0.34, 0]} scale={[1.1, 0.85, 1.05]} castShadow>
              <sphereGeometry args={[0.42, 14, 12]} />
              <meshStandardMaterial color="#65a30d" roughness={0.28} metalness={0.12} />
            </mesh>
            <mesh position={[0.04, 0.68, 0.16]} rotation={[0.3, 0, 0.3]}>
              <coneGeometry args={[0.1, 0.25, 6]} />
              <meshStandardMaterial color="#bef264" roughness={0.4} />
            </mesh>
            <mesh position={[0.04, 0.68, -0.16]} rotation={[-0.3, 0, 0.3]}>
              <coneGeometry args={[0.1, 0.25, 6]} />
              <meshStandardMaterial color="#bef264" roughness={0.4} />
            </mesh>
            <mesh position={[-0.36, 0.42, 0.15]}>
              <sphereGeometry args={[0.075, 8, 8]} />
              <meshStandardMaterial color="#fef08a" emissive="#facc15" emissiveIntensity={0.8} />
            </mesh>
            <mesh position={[-0.36, 0.42, -0.15]}>
              <sphereGeometry args={[0.075, 8, 8]} />
              <meshStandardMaterial color="#fef08a" emissive="#facc15" emissiveIntensity={0.8} />
            </mesh>
          </group>
        )}

        {/* 2. Bone Skeleton (NEW #1) */}
        {kind === 'skeleton' && (
          <group>
            {/* Spine & Ribcage */}
            <mesh position={[0, 0.45, 0]} castShadow>
              <cylinderGeometry args={[0.16, 0.14, 0.56, 8]} />
              <meshStandardMaterial color="#e2e8f0" roughness={0.7} />
            </mesh>
            {[0.38, 0.52, 0.64].map((ry, idx) => (
              <mesh key={idx} position={[0, ry, 0]} castShadow>
                <boxGeometry args={[0.26, 0.06, 0.42]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.65} />
              </mesh>
            ))}
            {/* Skull */}
            <mesh position={[-0.04, 0.94, 0]} castShadow>
              <sphereGeometry args={[0.25, 12, 10]} />
              <meshStandardMaterial color="#f1f5f9" roughness={0.6} />
            </mesh>
            {/* Dark Glowing Eye Sockets */}
            <mesh position={[-0.25, 0.96, 0.1]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshStandardMaterial color="#0f172a" emissive="#38bdf8" emissiveIntensity={0.9} />
            </mesh>
            <mesh position={[-0.25, 0.96, -0.1]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshStandardMaterial color="#0f172a" emissive="#38bdf8" emissiveIntensity={0.9} />
            </mesh>
            {/* Iron Bone Sword */}
            <mesh position={[-0.36, 0.58, 0.28]} rotation={[0.1, 0, 0.7]} castShadow>
              <boxGeometry args={[0.08, 0.72, 0.12]} />
              <meshStandardMaterial color="#94a3b8" roughness={0.3} metalness={0.75} />
            </mesh>
          </group>
        )}

        {/* 3. Venom Spider (NEW #2) */}
        {kind === 'spider' && (
          <group>
            {/* Glowing Venom Abdomen */}
            <mesh position={[0.26, 0.34, 0]} scale={[1.2, 0.9, 1.0]} castShadow>
              <sphereGeometry args={[0.32, 12, 10]} />
              <meshStandardMaterial color="#2e1065" roughness={0.42} metalness={0.2} />
            </mesh>
            <mesh position={[0.32, 0.54, 0]}>
              <sphereGeometry args={[0.15, 8, 8]} />
              <meshStandardMaterial color="#bef264" emissive="#84cc16" emissiveIntensity={1.4} />
            </mesh>
            {/* Thorax Head */}
            <mesh position={[-0.22, 0.28, 0]} castShadow>
              <sphereGeometry args={[0.22, 10, 8]} />
              <meshStandardMaterial color="#1e1b4b" roughness={0.5} />
            </mesh>
            {/* 6 Arachnid Legs */}
            {[-0.18, 0.04, 0.24].map((lx, idx) => (
              <React.Fragment key={idx}>
                <mesh position={[lx, 0.22, 0.36]} rotation={[0.7, 0, 0]}>
                  <cylinderGeometry args={[0.035, 0.025, 0.54, 6]} />
                  <meshStandardMaterial color="#1e1b4b" roughness={0.7} />
                </mesh>
                <mesh position={[lx, 0.22, -0.36]} rotation={[-0.7, 0, 0]}>
                  <cylinderGeometry args={[0.035, 0.025, 0.54, 6]} />
                  <meshStandardMaterial color="#1e1b4b" roughness={0.7} />
                </mesh>
              </React.Fragment>
            ))}
            {/* Red Spider Eyes */}
            {[-0.09, 0, 0.09].map((ez, idx) => (
              <mesh key={idx} position={[-0.41, 0.32, ez]}>
                <sphereGeometry args={[0.045, 6, 6]} />
                <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={1.5} />
              </mesh>
            ))}
          </group>
        )}

        {/* 4. Forest Goblin */}
        {kind === 'goblin' && (
          <group>
            <mesh position={[0, 0.42, 0]} castShadow>
              <capsuleGeometry args={[0.25, 0.34, 6, 10]} />
              <meshStandardMaterial color="#b91c1c" roughness={0.78} />
            </mesh>
            <mesh position={[-0.04, 0.88, 0]} castShadow>
              <dodecahedronGeometry args={[0.26, 0]} />
              <meshStandardMaterial color="#dc2626" roughness={0.62} />
            </mesh>
            <mesh position={[0, 0.92, 0.28]} rotation={[0.9, 0, 0]}>
              <coneGeometry args={[0.08, 0.28, 5]} />
              <meshStandardMaterial color="#991b1b" roughness={0.65} />
            </mesh>
            <mesh position={[0, 0.92, -0.28]} rotation={[-0.9, 0, 0]}>
              <coneGeometry args={[0.08, 0.28, 5]} />
              <meshStandardMaterial color="#991b1b" roughness={0.65} />
            </mesh>
            <mesh position={[-0.32, 0.56, 0.28]} rotation={[0.2, 0, 0.55]} castShadow>
              <cylinderGeometry args={[0.09, 0.05, 0.62, 7]} />
              <meshStandardMaterial color="#78350f" roughness={0.9} />
            </mesh>
            <mesh position={[-0.25, 0.91, 0.1]}>
              <sphereGeometry args={[0.055, 8, 8]} />
              <meshStandardMaterial color="#fde047" emissive="#facc15" emissiveIntensity={1.3} />
            </mesh>
            <mesh position={[-0.25, 0.91, -0.1]}>
              <sphereGeometry args={[0.055, 8, 8]} />
              <meshStandardMaterial color="#fde047" emissive="#facc15" emissiveIntensity={1.3} />
            </mesh>
          </group>
        )}

        {/* 4b. Iron Beetle (NEW Wave 2-5 #1) */}
        {kind === 'beetle' && (
          <group>
            {/* Domed Emerald-Bronze Armored Carapace */}
            <mesh position={[0.05, 0.36, 0]} scale={[1.25, 0.85, 1.0]} castShadow>
              <sphereGeometry args={[0.42, 14, 12]} />
              <meshStandardMaterial color="#047857" roughness={0.28} metalness={0.55} />
            </mesh>
            {/* Golden Carapace Spine Strip */}
            <mesh position={[0.05, 0.72, 0]}>
              <boxGeometry args={[0.72, 0.08, 0.14]} />
              <meshStandardMaterial color="#fbbf24" roughness={0.3} metalness={0.75} />
            </mesh>
            {/* Armored Head */}
            <mesh position={[-0.42, 0.3, 0]} castShadow>
              <dodecahedronGeometry args={[0.24, 0]} />
              <meshStandardMaterial color="#064e3b" roughness={0.35} metalness={0.5} />
            </mesh>
            {/* Forward Rhinoceros Horn */}
            <mesh position={[-0.68, 0.44, 0]} rotation={[0, 0, 0.95]} castShadow>
              <coneGeometry args={[0.1, 0.44, 6]} />
              <meshStandardMaterial color="#f59e0b" roughness={0.25} metalness={0.8} />
            </mesh>
            {/* 6 Stubby Beetle Legs */}
            {[-0.2, 0.04, 0.28].map((lx, idx) => (
              <React.Fragment key={idx}>
                <mesh position={[lx, 0.16, 0.4]} rotation={[0.6, 0, 0]}>
                  <cylinderGeometry args={[0.045, 0.035, 0.36, 6]} />
                  <meshStandardMaterial color="#022c22" roughness={0.6} />
                </mesh>
                <mesh position={[lx, 0.16, -0.4]} rotation={[-0.6, 0, 0]}>
                  <cylinderGeometry args={[0.045, 0.035, 0.36, 6]} />
                  <meshStandardMaterial color="#022c22" roughness={0.6} />
                </mesh>
              </React.Fragment>
            ))}
            {/* Glowing Amber Eyes */}
            <mesh position={[-0.62, 0.34, 0.11]}>
              <sphereGeometry args={[0.055, 8, 8]} />
              <meshStandardMaterial color="#fef08a" emissive="#f59e0b" emissiveIntensity={1.6} />
            </mesh>
            <mesh position={[-0.62, 0.34, -0.11]}>
              <sphereGeometry args={[0.055, 8, 8]} />
              <meshStandardMaterial color="#fef08a" emissive="#f59e0b" emissiveIntensity={1.6} />
            </mesh>
          </group>
        )}

        {/* 4c. Venom Wasp (NEW Wave 2-5 #2 — Flying) */}
        {kind === 'wasp' && (
          <group>
            {/* Striped Black & Gold Abdomen */}
            <mesh position={[0.24, 0.02, 0]} scale={[1.35, 0.88, 0.88]} castShadow>
              <sphereGeometry args={[0.26, 12, 10]} />
              <meshStandardMaterial color="#ca8a04" roughness={0.35} metalness={0.25} />
            </mesh>
            <mesh position={[0.24, 0.02, 0]}>
              <cylinderGeometry args={[0.23, 0.23, 0.14, 12]} />
              <meshStandardMaterial color="#18181b" roughness={0.5} />
            </mesh>
            {/* Glowing Poison Stinger */}
            <mesh position={[0.62, -0.02, 0]} rotation={[0, 0, -Math.PI / 2]}>
              <coneGeometry args={[0.08, 0.32, 6]} />
              <meshStandardMaterial color="#a3e635" emissive="#84cc16" emissiveIntensity={1.6} />
            </mesh>
            {/* Thorax & Wasp Head */}
            <mesh position={[-0.18, 0.08, 0]} castShadow>
              <sphereGeometry args={[0.21, 10, 10]} />
              <meshStandardMaterial color="#18181b" roughness={0.45} />
            </mesh>
            {/* Flapping Translucent Wings */}
            <mesh ref={leftWingRef} position={[0.02, 0.24, 0.42]} castShadow>
              <boxGeometry args={[0.38, 0.04, 0.68]} />
              <meshStandardMaterial
                color="#fef9c3"
                emissive="#fde047"
                emissiveIntensity={0.45}
                transparent
                opacity={0.78}
              />
            </mesh>
            <mesh ref={rightWingRef} position={[0.02, 0.24, -0.42]} castShadow>
              <boxGeometry args={[0.38, 0.04, 0.68]} />
              <meshStandardMaterial
                color="#fef9c3"
                emissive="#fde047"
                emissiveIntensity={0.45}
                transparent
                opacity={0.78}
              />
            </mesh>
            {/* Glowing Yellow Eyes */}
            <mesh position={[-0.36, 0.12, 0.09]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshStandardMaterial color="#fef08a" emissive="#eab308" emissiveIntensity={1.6} />
            </mesh>
            <mesh position={[-0.36, 0.12, -0.09]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshStandardMaterial color="#fef08a" emissive="#eab308" emissiveIntensity={1.6} />
            </mesh>
          </group>
        )}

        {/* 5. Spore Brute Mushroom Monster (NEW #3) */}
        {kind === 'mushroom' && (
          <group>
            <mesh position={[0, 0.38, 0]} castShadow>
              <cylinderGeometry args={[0.3, 0.36, 0.66, 10]} />
              <meshStandardMaterial color="#fef3c7" roughness={0.82} />
            </mesh>
            <mesh position={[0, 0.78, 0]} scale={[1.15, 0.68, 1.15]} castShadow>
              <sphereGeometry args={[0.5, 14, 12]} />
              <meshStandardMaterial color="#b91c1c" roughness={0.55} />
            </mesh>
            {[
              [-0.24, 0.96, 0.2],
              [0.22, 0.98, -0.18],
              [0, 1.08, 0.12],
            ].map(([x, y, z], i) => (
              <mesh key={i} position={[x, y, z]}>
                <sphereGeometry args={[0.1, 8, 8]} />
                <meshStandardMaterial color="#fffbeb" roughness={0.7} />
              </mesh>
            ))}
            <mesh position={[-0.3, 0.48, 0.12]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshStandardMaterial color="#f97316" emissive="#ea580c" emissiveIntensity={1.2} />
            </mesh>
            <mesh position={[-0.3, 0.48, -0.12]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshStandardMaterial color="#f97316" emissive="#ea580c" emissiveIntensity={1.2} />
            </mesh>
          </group>
        )}

        {/* 5b. Sand Mummy (NEW Wave 2-5 #3) */}
        {kind === 'mummy' && (
          <group>
            {/* Bandaged Torso */}
            <mesh position={[0, 0.48, 0]} castShadow>
              <cylinderGeometry args={[0.25, 0.28, 0.78, 10]} />
              <meshStandardMaterial color="#d6c39c" roughness={0.85} />
            </mesh>
            {/* Layered Bandage Wraps */}
            {[0.28, 0.48, 0.68].map((by, idx) => (
              <mesh key={idx} position={[0, by, 0]} rotation={[0.08 * (idx - 1), 0, 0.06]}>
                <torusGeometry args={[0.26, 0.045, 6, 14]} />
                <meshStandardMaterial color="#f5e6c8" roughness={0.9} />
              </mesh>
            ))}
            {/* Bandaged Head & Golden Pharaoh Crown */}
            <mesh position={[-0.02, 1.02, 0]} castShadow>
              <sphereGeometry args={[0.26, 12, 10]} />
              <meshStandardMaterial color="#e7d6b1" roughness={0.82} />
            </mesh>
            <mesh position={[-0.02, 1.15, 0]}>
              <cylinderGeometry args={[0.27, 0.27, 0.1, 10]} />
              <meshStandardMaterial color="#eab308" roughness={0.28} metalness={0.82} />
            </mesh>
            {/* Outstretched Mummy Arms */}
            <mesh position={[-0.38, 0.68, 0.24]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.075, 0.065, 0.56, 8]} />
              <meshStandardMaterial color="#d6c39c" roughness={0.85} />
            </mesh>
            <mesh position={[-0.38, 0.68, -0.24]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.075, 0.065, 0.56, 8]} />
              <meshStandardMaterial color="#d6c39c" roughness={0.85} />
            </mesh>
            {/* Cursed Turquoise Eyes */}
            <mesh position={[-0.25, 1.03, 0.1]}>
              <sphereGeometry args={[0.055, 8, 8]} />
              <meshStandardMaterial color="#99f6e4" emissive="#14b8a6" emissiveIntensity={1.8} />
            </mesh>
            <mesh position={[-0.25, 1.03, -0.1]}>
              <sphereGeometry args={[0.055, 8, 8]} />
              <meshStandardMaterial color="#99f6e4" emissive="#14b8a6" emissiveIntensity={1.8} />
            </mesh>
          </group>
        )}

        {/* 6. Shadow Wolf (NEW #4) */}
        {kind === 'wolf' && (
          <group>
            {/* Sleek Body */}
            <mesh position={[0.04, 0.4, 0]} castShadow>
              <boxGeometry args={[0.88, 0.38, 0.38]} />
              <meshStandardMaterial color="#1f2937" roughness={0.72} />
            </mesh>
            {/* Wolf Head & Snout */}
            <mesh position={[-0.48, 0.56, 0]} castShadow>
              <boxGeometry args={[0.36, 0.3, 0.3]} />
              <meshStandardMaterial color="#111827" roughness={0.68} />
            </mesh>
            <mesh position={[-0.72, 0.5, 0]}>
              <boxGeometry args={[0.22, 0.16, 0.18]} />
              <meshStandardMaterial color="#374151" roughness={0.65} />
            </mesh>
            {/* Pointed Ears */}
            <mesh position={[-0.4, 0.78, 0.11]}>
              <coneGeometry args={[0.07, 0.22, 5]} />
              <meshStandardMaterial color="#111827" />
            </mesh>
            <mesh position={[-0.4, 0.78, -0.11]}>
              <coneGeometry args={[0.07, 0.22, 5]} />
              <meshStandardMaterial color="#111827" />
            </mesh>
            {/* Tail */}
            <mesh position={[0.56, 0.54, 0]} rotation={[0, 0, -0.6]}>
              <coneGeometry args={[0.1, 0.42, 6]} />
              <meshStandardMaterial color="#374151" />
            </mesh>
            {/* Fierce Amber Eyes */}
            <mesh position={[-0.64, 0.62, 0.09]}>
              <sphereGeometry args={[0.048, 8, 8]} />
              <meshStandardMaterial color="#fef08a" emissive="#f59e0b" emissiveIntensity={1.6} />
            </mesh>
            <mesh position={[-0.64, 0.62, -0.09]}>
              <sphereGeometry args={[0.048, 8, 8]} />
              <meshStandardMaterial color="#fef08a" emissive="#f59e0b" emissiveIntensity={1.6} />
            </mesh>
          </group>
        )}

        {/* 7. Shadow Bat */}
        {kind === 'bat' && (
          <group>
            <mesh castShadow>
              <sphereGeometry args={[0.28, 12, 10]} />
              <meshStandardMaterial color="#4c1d95" roughness={0.52} metalness={0.22} />
            </mesh>
            <mesh ref={leftWingRef} position={[0.04, 0.06, 0.42]} castShadow>
              <boxGeometry args={[0.32, 0.05, 0.66]} />
              <meshStandardMaterial color="#6d28d9" roughness={0.68} />
            </mesh>
            <mesh ref={rightWingRef} position={[0.04, 0.06, -0.42]} castShadow>
              <boxGeometry args={[0.32, 0.05, 0.66]} />
              <meshStandardMaterial color="#6d28d9" roughness={0.68} />
            </mesh>
            <mesh position={[-0.24, 0.06, 0.1]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshStandardMaterial color="#f472b6" emissive="#ec4899" emissiveIntensity={1.5} />
            </mesh>
            <mesh position={[-0.24, 0.06, -0.1]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshStandardMaterial color="#f472b6" emissive="#ec4899" emissiveIntensity={1.5} />
            </mesh>
          </group>
        )}

        {/* 7b. Swamp Troll (NEW Wave 2-5 #4) */}
        {kind === 'troll' && (
          <group>
            {/* Hulking Mossy Torso */}
            <mesh position={[0, 0.54, 0]} castShadow>
              <boxGeometry args={[0.64, 0.84, 0.76]} />
              <meshStandardMaterial color="#0f766e" roughness={0.82} />
            </mesh>
            {/* Spiky Lime Moss Ridge */}
            {[0.46, 0.74].map((sy, idx) => (
              <mesh key={idx} position={[0.34, sy, 0]} rotation={[0, 0, -0.8]}>
                <coneGeometry args={[0.12, 0.3, 5]} />
                <meshStandardMaterial color="#84cc16" roughness={0.65} />
              </mesh>
            ))}
            {/* Troll Head & Tusks */}
            <mesh position={[-0.1, 1.08, 0]} castShadow>
              <dodecahedronGeometry args={[0.31, 0]} />
              <meshStandardMaterial color="#115e59" roughness={0.78} />
            </mesh>
            <mesh position={[-0.38, 0.98, 0.13]} rotation={[0, 0, 0.35]}>
              <coneGeometry args={[0.05, 0.2, 5]} />
              <meshStandardMaterial color="#fef3c7" roughness={0.5} />
            </mesh>
            <mesh position={[-0.38, 0.98, -0.13]} rotation={[0, 0, 0.35]}>
              <coneGeometry args={[0.05, 0.2, 5]} />
              <meshStandardMaterial color="#fef3c7" roughness={0.5} />
            </mesh>
            {/* Heavy Stone Club */}
            <mesh position={[-0.44, 0.68, 0.46]} rotation={[0.15, 0, 0.6]} castShadow>
              <cylinderGeometry args={[0.14, 0.07, 0.96, 7]} />
              <meshStandardMaterial color="#64748b" roughness={0.88} />
            </mesh>
            {/* Glowing Toxic Eyes */}
            <mesh position={[-0.37, 1.12, 0.11]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshStandardMaterial color="#d9f99d" emissive="#a3e635" emissiveIntensity={1.6} />
            </mesh>
            <mesh position={[-0.37, 1.12, -0.11]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshStandardMaterial color="#d9f99d" emissive="#a3e635" emissiveIntensity={1.6} />
            </mesh>
          </group>
        )}

        {/* 8. Armored Orc (NEW #5) */}
        {kind === 'orc' && (
          <group>
            <mesh position={[0, 0.5, 0]} castShadow>
              <boxGeometry args={[0.56, 0.74, 0.66]} />
              <meshStandardMaterial color="#15803d" roughness={0.76} />
            </mesh>
            {/* Iron Chestplate */}
            <mesh position={[-0.04, 0.56, 0]}>
              <boxGeometry args={[0.6, 0.4, 0.7]} />
              <meshStandardMaterial color="#475569" roughness={0.4} metalness={0.72} />
            </mesh>
            {/* Head + Iron Helmet */}
            <mesh position={[-0.05, 1.02, 0]} castShadow>
              <dodecahedronGeometry args={[0.28, 0]} />
              <meshStandardMaterial color="#166534" roughness={0.68} />
            </mesh>
            <mesh position={[-0.05, 1.16, 0]}>
              <cylinderGeometry args={[0.24, 0.3, 0.22, 8]} />
              <meshStandardMaterial color="#64748b" roughness={0.35} metalness={0.75} />
            </mesh>
            {/* Battle Axe */}
            <mesh position={[-0.38, 0.66, 0.42]} rotation={[0.1, 0, 0.5]} castShadow>
              <cylinderGeometry args={[0.05, 0.05, 0.85, 6]} />
              <meshStandardMaterial color="#78350f" />
            </mesh>
            <mesh position={[-0.56, 0.92, 0.42]} rotation={[0, 0, 0.4]}>
              <boxGeometry args={[0.28, 0.36, 0.08]} />
              <meshStandardMaterial color="#cbd5e1" roughness={0.25} metalness={0.85} />
            </mesh>
            <mesh position={[-0.28, 1.02, 0.1]}>
              <sphereGeometry args={[0.055, 8, 8]} />
              <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={1.4} />
            </mesh>
            <mesh position={[-0.28, 1.02, -0.1]}>
              <sphereGeometry args={[0.055, 8, 8]} />
              <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={1.4} />
            </mesh>
          </group>
        )}

        {/* 9. Mist Wraith / Ghost (NEW #6) */}
        {kind === 'ghost' && (
          <group>
            <mesh position={[0, 0.34, 0]} castShadow>
              <coneGeometry args={[0.4, 0.9, 10]} />
              <meshStandardMaterial
                color="#0e7490"
                emissive="#06b6d4"
                emissiveIntensity={0.6}
                transparent
                opacity={0.82}
                roughness={0.25}
              />
            </mesh>
            <mesh position={[0, 0.72, 0]}>
              <sphereGeometry args={[0.28, 12, 10]} />
              <meshStandardMaterial
                color="#cffafe"
                emissive="#22d3ee"
                emissiveIntensity={0.9}
                transparent
                opacity={0.88}
              />
            </mesh>
            <mesh position={[-0.22, 0.74, 0.1]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshStandardMaterial color="#0f172a" emissive="#67e8f9" emissiveIntensity={1.6} />
            </mesh>
            <mesh position={[-0.22, 0.74, -0.1]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshStandardMaterial color="#0f172a" emissive="#67e8f9" emissiveIntensity={1.6} />
            </mesh>
          </group>
        )}

        {/* 9b. Shadow Knight (NEW Wave 2-5 #5) */}
        {kind === 'darkKnight' && (
          <group>
            {/* Dark Steel Plate Armor */}
            <mesh position={[0, 0.56, 0]} castShadow>
              <boxGeometry args={[0.56, 0.82, 0.68]} />
              <meshStandardMaterial color="#1e1b4b" roughness={0.32} metalness={0.82} />
            </mesh>
            {/* Crimson Back Cape */}
            <mesh position={[0.32, 0.54, 0]} rotation={[0, 0, -0.15]}>
              <boxGeometry args={[0.08, 0.82, 0.6]} />
              <meshStandardMaterial color="#9f1239" roughness={0.75} />
            </mesh>
            {/* Armored Visor Helmet + Twin Horns */}
            <mesh position={[-0.04, 1.14, 0]} castShadow>
              <boxGeometry args={[0.38, 0.4, 0.4]} />
              <meshStandardMaterial color="#312e81" roughness={0.28} metalness={0.86} />
            </mesh>
            <mesh position={[-0.02, 1.42, 0.22]} rotation={[0.45, 0, 0.2]}>
              <coneGeometry args={[0.075, 0.34, 6]} />
              <meshStandardMaterial color="#c084fc" emissive="#9333ea" emissiveIntensity={1.1} />
            </mesh>
            <mesh position={[-0.02, 1.42, -0.22]} rotation={[-0.45, 0, 0.2]}>
              <coneGeometry args={[0.075, 0.34, 6]} />
              <meshStandardMaterial color="#c084fc" emissive="#9333ea" emissiveIntensity={1.1} />
            </mesh>
            {/* Tower Shield */}
            <mesh position={[-0.36, 0.56, -0.34]} castShadow>
              <boxGeometry args={[0.12, 0.68, 0.44]} />
              <meshStandardMaterial color="#334155" roughness={0.3} metalness={0.85} />
            </mesh>
            {/* Glowing Violet Greatsword */}
            <mesh position={[-0.46, 0.78, 0.4]} rotation={[0.1, 0, 0.55]} castShadow>
              <boxGeometry args={[0.1, 1.05, 0.14]} />
              <meshStandardMaterial color="#e879f9" emissive="#a855f7" emissiveIntensity={1.6} metalness={0.75} />
            </mesh>
            {/* Glowing Visor Slit */}
            <mesh position={[-0.24, 1.15, 0]}>
              <boxGeometry args={[0.05, 0.08, 0.28]} />
              <meshStandardMaterial color="#f5d0fe" emissive="#c084fc" emissiveIntensity={2.0} />
            </mesh>
          </group>
        )}

        {/* 10. Stone Golem */}
        {kind === 'golem' && (
          <group>
            <mesh position={[0, 0.56, 0]} castShadow>
              <boxGeometry args={[0.64, 0.86, 0.78]} />
              <meshStandardMaterial color="#475569" roughness={0.9} metalness={0.14} />
            </mesh>
            <mesh position={[-0.08, 1.12, 0]} castShadow>
              <boxGeometry args={[0.42, 0.36, 0.44]} />
              <meshStandardMaterial color="#334155" roughness={0.85} />
            </mesh>
            <mesh position={[-0.33, 0.62, 0]}>
              <octahedronGeometry args={[0.16, 0]} />
              <meshStandardMaterial color="#fb923c" emissive="#ea580c" emissiveIntensity={1.4} />
            </mesh>
            <mesh position={[-0.2, 0.42, 0.52]} castShadow>
              <dodecahedronGeometry args={[0.24, 0]} />
              <meshStandardMaterial color="#64748b" roughness={0.88} />
            </mesh>
            <mesh position={[-0.2, 0.42, -0.52]} castShadow>
              <dodecahedronGeometry args={[0.24, 0]} />
              <meshStandardMaterial color="#64748b" roughness={0.88} />
            </mesh>
            <mesh position={[-0.29, 1.15, 0.11]}>
              <boxGeometry args={[0.06, 0.07, 0.1]} />
              <meshStandardMaterial color="#fef08a" emissive="#f97316" emissiveIntensity={1.5} />
            </mesh>
            <mesh position={[-0.29, 1.15, -0.11]}>
              <boxGeometry args={[0.06, 0.07, 0.1]} />
              <meshStandardMaterial color="#fef08a" emissive="#f97316" emissiveIntensity={1.5} />
            </mesh>
          </group>
        )}

        {/* 11. Dune Scorpion (NEW #7) */}
        {kind === 'scorpion' && (
          <group>
            <mesh position={[0, 0.3, 0]} castShadow>
              <boxGeometry args={[0.82, 0.34, 0.52]} />
              <meshStandardMaterial color="#b45309" roughness={0.5} metalness={0.28} />
            </mesh>
            {/* Front Twin Pincer Claws */}
            <mesh position={[-0.52, 0.34, 0.34]} rotation={[0, 0.4, 0]} castShadow>
              <dodecahedronGeometry args={[0.2, 0]} />
              <meshStandardMaterial color="#92400e" roughness={0.45} metalness={0.35} />
            </mesh>
            <mesh position={[-0.52, 0.34, -0.34]} rotation={[0, -0.4, 0]} castShadow>
              <dodecahedronGeometry args={[0.2, 0]} />
              <meshStandardMaterial color="#92400e" roughness={0.45} metalness={0.35} />
            </mesh>
            {/* Curved Raised Stinger Tail */}
            <mesh position={[0.42, 0.62, 0]} rotation={[0, 0, -0.35]} castShadow>
              <cylinderGeometry args={[0.1, 0.14, 0.62, 8]} />
              <meshStandardMaterial color="#d97706" roughness={0.45} />
            </mesh>
            <mesh position={[0.16, 0.96, 0]} rotation={[0, 0, 1.1]}>
              <coneGeometry args={[0.11, 0.34, 6]} />
              <meshStandardMaterial color="#c084fc" emissive="#a855f7" emissiveIntensity={1.5} />
            </mesh>
            <mesh position={[-0.41, 0.38, 0.12]}>
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshStandardMaterial color="#fef08a" emissive="#facc15" emissiveIntensity={1.4} />
            </mesh>
            <mesh position={[-0.41, 0.38, -0.12]}>
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshStandardMaterial color="#fef08a" emissive="#facc15" emissiveIntensity={1.4} />
            </mesh>
          </group>
        )}

        {/* 12. Magma Elemental (NEW #8) */}
        {kind === 'magma' && (
          <group>
            <mesh position={[0, 0.58, 0]} castShadow>
              <dodecahedronGeometry args={[0.52, 0]} />
              <meshStandardMaterial color="#291007" roughness={0.78} metalness={0.25} />
            </mesh>
            {/* Glowing Molten Core & Shoulders */}
            <mesh position={[0, 0.62, 0]}>
              <sphereGeometry args={[0.38, 12, 10]} />
              <meshStandardMaterial color="#fb923c" emissive="#ea580c" emissiveIntensity={1.7} />
            </mesh>
            <mesh position={[0, 1.12, 0]} castShadow>
              <dodecahedronGeometry args={[0.3, 0]} />
              <meshStandardMaterial color="#451a03" roughness={0.65} />
            </mesh>
            <mesh position={[0, 0.94, 0.48]}>
              <octahedronGeometry args={[0.22, 0]} />
              <meshStandardMaterial color="#fde047" emissive="#f97316" emissiveIntensity={1.5} />
            </mesh>
            <mesh position={[0, 0.94, -0.48]}>
              <octahedronGeometry args={[0.22, 0]} />
              <meshStandardMaterial color="#fde047" emissive="#f97316" emissiveIntensity={1.5} />
            </mesh>
            <mesh position={[-0.25, 1.14, 0.1]}>
              <sphereGeometry args={[0.065, 8, 8]} />
              <meshStandardMaterial color="#ffffff" emissive="#facc15" emissiveIntensity={2.0} />
            </mesh>
            <mesh position={[-0.25, 1.14, -0.1]}>
              <sphereGeometry args={[0.065, 8, 8]} />
              <meshStandardMaterial color="#ffffff" emissive="#facc15" emissiveIntensity={2.0} />
            </mesh>
          </group>
        )}

        {/* 13. Frost Yeti (NEW #9) */}
        {kind === 'iceYeti' && (
          <group>
            <mesh position={[0, 0.62, 0]} castShadow>
              <boxGeometry args={[0.68, 0.92, 0.84]} />
              <meshStandardMaterial color="#e2e8f0" roughness={0.82} />
            </mesh>
            <mesh position={[-0.08, 1.2, 0]} castShadow>
              <sphereGeometry args={[0.32, 12, 10]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.78} />
            </mesh>
            {/* Glacial Blue Ice Horns */}
            <mesh position={[0, 1.48, 0.2]} rotation={[0.4, 0, 0.3]}>
              <coneGeometry args={[0.09, 0.36, 6]} />
              <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.85} />
            </mesh>
            <mesh position={[0, 1.48, -0.2]} rotation={[-0.4, 0, 0.3]}>
              <coneGeometry args={[0.09, 0.36, 6]} />
              <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.85} />
            </mesh>
            {/* Heavy Frost Fists */}
            <mesh position={[-0.26, 0.44, 0.56]} castShadow>
              <dodecahedronGeometry args={[0.26, 0]} />
              <meshStandardMaterial color="#bae6fd" roughness={0.3} metalness={0.3} />
            </mesh>
            <mesh position={[-0.26, 0.44, -0.56]} castShadow>
              <dodecahedronGeometry args={[0.26, 0]} />
              <meshStandardMaterial color="#bae6fd" roughness={0.3} metalness={0.3} />
            </mesh>
            <mesh position={[-0.36, 1.24, 0.11]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshStandardMaterial color="#ecfeff" emissive="#38bdf8" emissiveIntensity={1.6} />
            </mesh>
            <mesh position={[-0.36, 1.24, -0.11]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshStandardMaterial color="#ecfeff" emissive="#38bdf8" emissiveIntensity={1.6} />
            </mesh>
          </group>
        )}

        {/* 14. Shadow Drake / Dragon (NEW #10) */}
        {kind === 'dragon' && (
          <group>
            {/* Scaled Crimson-Black Torso */}
            <mesh position={[0, 0.24, 0]} castShadow>
              <boxGeometry args={[0.84, 0.46, 0.48]} />
              <meshStandardMaterial color="#7f1d1d" roughness={0.42} metalness={0.35} />
            </mesh>
            {/* Dragon Head & Snout */}
            <mesh position={[-0.56, 0.42, 0]} castShadow>
              <dodecahedronGeometry args={[0.28, 0]} />
              <meshStandardMaterial color="#991b1b" roughness={0.38} metalness={0.35} />
            </mesh>
            <mesh position={[-0.4, 0.66, 0.14]} rotation={[0.4, 0, -0.4]}>
              <coneGeometry args={[0.07, 0.3, 5]} />
              <meshStandardMaterial color="#facc15" metalness={0.7} />
            </mesh>
            <mesh position={[-0.4, 0.66, -0.14]} rotation={[-0.4, 0, -0.4]}>
              <coneGeometry args={[0.07, 0.3, 5]} />
              <meshStandardMaterial color="#facc15" metalness={0.7} />
            </mesh>
            {/* Flapping Dragon Wings */}
            <mesh ref={leftWingRef} position={[0.04, 0.42, 0.64]} castShadow>
              <boxGeometry args={[0.48, 0.06, 0.98]} />
              <meshStandardMaterial color="#450a0a" roughness={0.55} />
            </mesh>
            <mesh ref={rightWingRef} position={[0.04, 0.42, -0.64]} castShadow>
              <boxGeometry args={[0.48, 0.06, 0.98]} />
              <meshStandardMaterial color="#450a0a" roughness={0.55} />
            </mesh>
            {/* Fiery Tail */}
            <mesh position={[0.64, 0.22, 0]} rotation={[0, 0, -Math.PI / 2]}>
              <coneGeometry args={[0.14, 0.56, 6]} />
              <meshStandardMaterial color="#dc2626" emissive="#f97316" emissiveIntensity={0.7} />
            </mesh>
            <mesh position={[-0.78, 0.46, 0.1]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshStandardMaterial color="#fef08a" emissive="#facc15" emissiveIntensity={1.8} />
            </mesh>
            <mesh position={[-0.78, 0.46, -0.1]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshStandardMaterial color="#fef08a" emissive="#facc15" emissiveIntensity={1.8} />
            </mesh>
          </group>
        )}

        {/* 15. Boss: Dread Titan (ملك الظلام) */}
        {kind === 'boss' && (
          <group>
            <mesh position={[0, 0.68, 0]} castShadow>
              <boxGeometry args={[0.74, 1.05, 0.92]} />
              <meshStandardMaterial color="#1e1b4b" roughness={0.42} metalness={0.58} />
            </mesh>
            <mesh position={[-0.06, 1.38, 0]} castShadow>
              <dodecahedronGeometry args={[0.38, 0]} />
              <meshStandardMaterial color="#312e81" roughness={0.38} metalness={0.62} />
            </mesh>
            <mesh position={[0, 1.72, 0.28]} rotation={[0.45, 0, 0.25]} castShadow>
              <coneGeometry args={[0.12, 0.5, 6]} />
              <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={1.1} />
            </mesh>
            <mesh position={[0, 1.72, -0.28]} rotation={[-0.45, 0, 0.25]} castShadow>
              <coneGeometry args={[0.12, 0.5, 6]} />
              <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={1.1} />
            </mesh>
            <mesh position={[-0.38, 0.72, 0]}>
              <octahedronGeometry args={[0.24, 0]} />
              <meshStandardMaterial color="#fde047" emissive="#ef4444" emissiveIntensity={1.8} />
            </mesh>
            <mesh position={[0, 1.08, 0.58]} castShadow>
              <dodecahedronGeometry args={[0.26, 0]} />
              <meshStandardMaterial color="#7f1d1d" roughness={0.35} metalness={0.6} />
            </mesh>
            <mesh position={[0, 1.08, -0.58]} castShadow>
              <dodecahedronGeometry args={[0.26, 0]} />
              <meshStandardMaterial color="#7f1d1d" roughness={0.35} metalness={0.6} />
            </mesh>
            <mesh position={[-0.34, 1.42, 0.14]}>
              <sphereGeometry args={[0.075, 8, 8]} />
              <meshStandardMaterial color="#fef08a" emissive="#ef4444" emissiveIntensity={1.8} />
            </mesh>
            <mesh position={[-0.34, 1.42, -0.14]}>
              <sphereGeometry args={[0.075, 8, 8]} />
              <meshStandardMaterial color="#fef08a" emissive="#ef4444" emissiveIntensity={1.8} />
            </mesh>
          </group>
        )}

        {/* 16. 5-Minute Colossal Mega-Boss (العملاق المدمّر) */}
        {kind === 'megaBoss' && (
          <group>
            {/* Armored Obsidian Legs & Torso */}
            <mesh position={[0, 0.72, 0]} castShadow>
              <boxGeometry args={[0.88, 1.18, 1.06]} />
              <meshStandardMaterial color="#180624" roughness={0.35} metalness={0.68} />
            </mesh>
            {/* Volcanic Chest Reactor */}
            <mesh position={[-0.45, 0.78, 0]}>
              <octahedronGeometry args={[0.3, 0]} />
              <meshStandardMaterial
                color="#fef08a"
                emissive="#f43f5e"
                emissiveIntensity={2.1}
                roughness={0.15}
              />
            </mesh>
            {/* Colossal Armored Head */}
            <mesh position={[-0.08, 1.54, 0]} castShadow>
              <icosahedronGeometry args={[0.42, 0]} />
              <meshStandardMaterial color="#2e1065" roughness={0.32} metalness={0.7} />
            </mesh>
            {/* Twin Giant Curved Magma Horns */}
            <mesh position={[0.02, 1.98, 0.34]} rotation={[0.5, 0, 0.28]} castShadow>
              <coneGeometry args={[0.14, 0.68, 7]} />
              <meshStandardMaterial color="#f43f5e" emissive="#e11d48" emissiveIntensity={1.6} />
            </mesh>
            <mesh position={[0.02, 1.98, -0.34]} rotation={[-0.5, 0, 0.28]} castShadow>
              <coneGeometry args={[0.14, 0.68, 7]} />
              <meshStandardMaterial color="#f43f5e" emissive="#e11d48" emissiveIntensity={1.6} />
            </mesh>
            {/* Floating Dark Summoner Halo Crown */}
            <mesh position={[0, 2.22, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.58, 0.065, 10, 28]} />
              <meshStandardMaterial
                color="#c084fc"
                emissive="#a855f7"
                emissiveIntensity={1.8}
                metalness={0.8}
              />
            </mesh>
            {/* Massive Spiked Pauldrons & Gauntlets */}
            <mesh position={[0, 1.18, 0.68]} castShadow>
              <dodecahedronGeometry args={[0.34, 0]} />
              <meshStandardMaterial color="#7f1d1d" roughness={0.3} metalness={0.72} />
            </mesh>
            <mesh position={[0, 1.18, -0.68]} castShadow>
              <dodecahedronGeometry args={[0.34, 0]} />
              <meshStandardMaterial color="#7f1d1d" roughness={0.3} metalness={0.72} />
            </mesh>
            <mesh position={[-0.36, 0.56, 0.68]} castShadow>
              <dodecahedronGeometry args={[0.28, 0]} />
              <meshStandardMaterial color="#3b0764" emissive="#9333ea" emissiveIntensity={0.65} />
            </mesh>
            <mesh position={[-0.36, 0.56, -0.68]} castShadow>
              <dodecahedronGeometry args={[0.28, 0]} />
              <meshStandardMaterial color="#3b0764" emissive="#9333ea" emissiveIntensity={0.65} />
            </mesh>
            {/* Blazing Twin Eyes */}
            <mesh position={[-0.42, 1.58, 0.16]}>
              <sphereGeometry args={[0.09, 8, 8]} />
              <meshStandardMaterial color="#ffffff" emissive="#f43f5e" emissiveIntensity={2.2} />
            </mesh>
            <mesh position={[-0.42, 1.58, -0.16]}>
              <sphereGeometry args={[0.09, 8, 8]} />
              <meshStandardMaterial color="#ffffff" emissive="#f43f5e" emissiveIntensity={2.2} />
            </mesh>
          </group>
        )}
      </group>

      {/* Floating 3D Monster HP Bar */}
      <group position={[0, hpBarHeight, 0]}>
        <mesh>
          <planeGeometry args={[kind === 'megaBoss' ? 1.45 : 1.02, 0.14]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>
        <mesh ref={hpFillRef} position={[0, 0, 0.01]}>
          <planeGeometry args={[kind === 'megaBoss' ? 1.38 : 0.96, 0.09]} />
          <meshBasicMaterial
            color={
              kind === 'megaBoss'
                ? '#e11d48'
                : kind === 'boss'
                ? '#f43f5e'
                : kind === 'dragon'
                ? '#f97316'
                : '#ef4444'
            }
          />
        </mesh>
      </group>
    </group>
  );
};

export const Entities3D: React.FC<Entities3DProps> = ({
  worldRef,
  renderTick,
}) => {
  const projInstRef = useRef<THREE.InstancedMesh>(null);
  const partInstRef = useRef<THREE.InstancedMesh>(null);

  const MAX_PROJ = 96;
  const MAX_PART = 80;

  const projGeo = useMemo(() => new THREE.SphereGeometry(0.18, 10, 8), []);
  const partGeo = useMemo(() => new THREE.OctahedronGeometry(1, 0), []);

  useEffect(() => {
    return () => {
      projGeo.dispose();
      partGeo.dispose();
    };
  }, [projGeo, partGeo]);

  useFrame(() => {
    const world = worldRef.current;

    if (projInstRef.current) {
      const count = Math.min(MAX_PROJ, world.projectiles.length);
      for (let i = 0; i < MAX_PROJ; i++) {
        if (i < count) {
          const p = world.projectiles[i];
          const s = 0.82 + Math.min(1.1, p.tier * 0.1);
          _pos.set(p.x, p.y, p.z);
          _quat.identity();
          _scale.set(s * 1.25, s, s);
          _mat4.compose(_pos, _quat, _scale);
          projInstRef.current.setMatrixAt(i, _mat4);
          _color.set(p.color);
          projInstRef.current.setColorAt(i, _color);
        } else {
          _mat4.makeScale(0, 0, 0);
          projInstRef.current.setMatrixAt(i, _mat4);
        }
      }
      projInstRef.current.instanceMatrix.needsUpdate = true;
      if (projInstRef.current.instanceColor) {
        projInstRef.current.instanceColor.needsUpdate = true;
      }
    }

    if (partInstRef.current) {
      const count = Math.min(MAX_PART, world.particles.length);
      for (let i = 0; i < MAX_PART; i++) {
        if (i < count) {
          const pt = world.particles[i];
          const ratio = Math.max(0.05, pt.life / pt.maxLife);
          const s = pt.size * ratio;
          _pos.set(pt.x, pt.y, pt.z);
          _quat.identity();
          _scale.set(s, s, s);
          _mat4.compose(_pos, _quat, _scale);
          partInstRef.current.setMatrixAt(i, _mat4);
          _color.set(pt.color);
          partInstRef.current.setColorAt(i, _color);
        } else {
          _mat4.makeScale(0, 0, 0);
          partInstRef.current.setMatrixAt(i, _mat4);
        }
      }
      partInstRef.current.instanceMatrix.needsUpdate = true;
      if (partInstRef.current.instanceColor) {
        partInstRef.current.instanceColor.needsUpdate = true;
      }
    }
  });

  void renderTick;
  const world = worldRef.current;

  return (
    <group>
      {world.plants.map((plant) => (
        <PlantHeroMesh key={plant.id} plant={plant} worldRef={worldRef} />
      ))}

      {world.monsters.map((monster) => (
        <MonsterMesh key={monster.id} monster={monster} worldRef={worldRef} />
      ))}

      <instancedMesh
        ref={projInstRef}
        args={[projGeo, undefined, MAX_PROJ]}
        frustumCulled={false}
      >
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={0.65}
          roughness={0.2}
        />
      </instancedMesh>

      <instancedMesh
        ref={partInstRef}
        args={[partGeo, undefined, MAX_PART]}
        frustumCulled={false}
      >
        <meshBasicMaterial color="#ffffff" />
      </instancedMesh>
    </group>
  );
};
