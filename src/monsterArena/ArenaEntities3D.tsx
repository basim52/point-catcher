import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { MonsterArenaWorld } from './gameLogic';
import {
  ARENA_MONSTER_SPECS,
  ArenaMonsterEntity,
  ArenaPetEntity,
  MAX_PET_LEVEL,
  PET_SPECS,
  WEAPON_SPECS,
} from './types';

interface ArenaEntities3DProps {
  worldRef: React.MutableRefObject<MonsterArenaWorld>;
  renderTick: number;
  onPetClick?: (petEntityId: number) => void;
}

// Reusable math objects outside render loop (Zero GC)
const _pos = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _mat4 = new THREE.Matrix4();
const _color = new THREE.Color();

/**
 * Composite 3D Hero Warrior with live equipped 3D weapon and shield dome
 */
const HeroWarrior3D: React.FC<{
  worldRef: React.MutableRefObject<MonsterArenaWorld>;
}> = ({ worldRef }) => {
  const rootRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const weaponRef = useRef<THREE.Group>(null);
  const shieldRef = useRef<THREE.Mesh>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);

  const activeWeapon = worldRef.current.activeWeapon;
  const wSpec = WEAPON_SPECS[activeWeapon];

  useFrame(() => {
    const w = worldRef.current;
    if (!rootRef.current) return;
    rootRef.current.position.set(w.playerX, 0, w.playerZ);
    rootRef.current.rotation.y = w.playerAngle;

    if (bodyRef.current) {
      const bob = Math.abs(Math.sin(w.playerWalkPhase)) * 0.08;
      bodyRef.current.position.y = bob;
      const hurtScale = 1 + w.playerHurtFlash * 0.14;
      bodyRef.current.scale.set(hurtScale, hurtScale, hurtScale);
    }
    if (leftLegRef.current && rightLegRef.current) {
      const swing = Math.sin(w.playerWalkPhase) * 0.45;
      leftLegRef.current.rotation.x = swing;
      rightLegRef.current.rotation.x = -swing;
    }
    if (weaponRef.current) {
      weaponRef.current.position.z = 0.42 - w.playerRecoil * 0.18;
    }
    if (shieldRef.current) {
      shieldRef.current.visible = w.shieldBuffTimer > 0;
      shieldRef.current.rotation.y += 0.02;
    }
  });

  const isHeavyWeapon =
    activeWeapon === 'thunder_cannon' ||
    activeWeapon === 'dragon_flamethrower' ||
    activeWeapon === 'cosmic_annihilator' ||
    activeWeapon === 'venom_gatling';
  const isTwin = activeWeapon === 'twin_blasters';

  return (
    <group ref={rootRef}>
      {/* Ground Contact Shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <circleGeometry args={[0.72, 20]} />
        <meshBasicMaterial color="#050810" transparent opacity={0.48} depthWrite={false} />
      </mesh>

      {/* Player Orientation Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[0.74, 0.88, 28]} />
        <meshBasicMaterial color={wSpec.color} transparent opacity={0.75} depthWrite={false} />
      </mesh>

      {/* Fruit Energy Shield Dome */}
      <mesh ref={shieldRef} position={[0, 0.95, 0]} visible={false}>
        <sphereGeometry args={[1.25, 18, 14]} />
        <meshStandardMaterial
          color="#f472b6"
          emissive="#ec4899"
          emissiveIntensity={0.9}
          transparent
          opacity={0.28}
          depthWrite={false}
        />
      </mesh>

      <group ref={bodyRef}>
        {/* Animated Boots / Legs */}
        <mesh ref={leftLegRef} position={[-0.2, 0.28, 0]} castShadow>
          <boxGeometry args={[0.22, 0.54, 0.26]} />
          <meshStandardMaterial color="#1e293b" roughness={0.6} metalness={0.35} />
        </mesh>
        <mesh ref={rightLegRef} position={[0.2, 0.28, 0]} castShadow>
          <boxGeometry args={[0.22, 0.54, 0.26]} />
          <meshStandardMaterial color="#1e293b" roughness={0.6} metalness={0.35} />
        </mesh>

        {/* Armored Hunter Torso */}
        <mesh position={[0, 0.86, 0]} castShadow>
          <boxGeometry args={[0.66, 0.72, 0.44]} />
          <meshStandardMaterial color="#0f172a" roughness={0.38} metalness={0.68} />
        </mesh>
        {/* Glowing Energy Chest Core */}
        <mesh position={[0, 0.92, 0.24]}>
          <octahedronGeometry args={[0.13, 0]} />
          <meshStandardMaterial
            color={wSpec.color}
            emissive={wSpec.color}
            emissiveIntensity={1.6}
          />
        </mesh>
        {/* Shoulder Pauldrons */}
        <mesh position={[-0.44, 1.08, 0]} castShadow>
          <dodecahedronGeometry args={[0.22, 0]} />
          <meshStandardMaterial color="#334155" roughness={0.3} metalness={0.78} />
        </mesh>
        <mesh position={[0.44, 1.08, 0]} castShadow>
          <dodecahedronGeometry args={[0.22, 0]} />
          <meshStandardMaterial color="#334155" roughness={0.3} metalness={0.78} />
        </mesh>
        {/* Flowing Hunter Cape */}
        <mesh position={[0, 0.82, -0.32]} rotation={[0.22, 0, 0]} castShadow>
          <boxGeometry args={[0.58, 0.88, 0.08]} />
          <meshStandardMaterial color="#be123c" roughness={0.75} />
        </mesh>

        {/* Visor Helmet */}
        <mesh position={[0, 1.44, 0]} castShadow>
          <sphereGeometry args={[0.31, 14, 12]} />
          <meshStandardMaterial color="#1e293b" roughness={0.28} metalness={0.75} />
        </mesh>
        <mesh position={[0, 1.46, 0.22]}>
          <boxGeometry args={[0.42, 0.14, 0.16]} />
          <meshStandardMaterial
            color="#e0f2fe"
            emissive={wSpec.color}
            emissiveIntensity={1.8}
          />
        </mesh>

        {/* Live Equipped 3D Weapon Assembly */}
        <group ref={weaponRef} position={[0, 0.92, 0.42]}>
          {isTwin ? (
            <>
              <mesh position={[0.42, 0, 0.18]} castShadow>
                <boxGeometry args={[0.14, 0.18, 0.62]} />
                <meshStandardMaterial color="#334155" roughness={0.3} metalness={0.8} />
              </mesh>
              <mesh position={[0.42, 0.04, 0.5]}>
                <sphereGeometry args={[0.09, 8, 8]} />
                <meshStandardMaterial
                  color={wSpec.color}
                  emissive={wSpec.color}
                  emissiveIntensity={1.8}
                />
              </mesh>
              <mesh position={[-0.42, 0, 0.18]} castShadow>
                <boxGeometry args={[0.14, 0.18, 0.62]} />
                <meshStandardMaterial color="#334155" roughness={0.3} metalness={0.8} />
              </mesh>
              <mesh position={[-0.42, 0.04, 0.5]}>
                <sphereGeometry args={[0.09, 8, 8]} />
                <meshStandardMaterial
                  color={wSpec.color}
                  emissive={wSpec.color}
                  emissiveIntensity={1.8}
                />
              </mesh>
            </>
          ) : (
            <group position={[0.38, 0, 0.12]}>
              <mesh castShadow>
                <boxGeometry
                  args={[
                    isHeavyWeapon ? 0.26 : 0.16,
                    isHeavyWeapon ? 0.26 : 0.18,
                    isHeavyWeapon ? 1.05 : 0.75,
                  ]}
                />
                <meshStandardMaterial
                  color={wSpec.accent}
                  roughness={0.28}
                  metalness={0.78}
                />
              </mesh>
              <mesh position={[0, 0.04, isHeavyWeapon ? 0.56 : 0.4]}>
                <cylinderGeometry
                  args={[
                    isHeavyWeapon ? 0.12 : 0.075,
                    isHeavyWeapon ? 0.14 : 0.085,
                    0.26,
                    8,
                  ]}
                />
                <meshStandardMaterial
                  color={wSpec.color}
                  emissive={wSpec.color}
                  emissiveIntensity={1.8}
                />
              </mesh>
            </group>
          )}
        </group>
      </group>
    </group>
  );
};

/**
 * Composite 3D Companion Battle Pet (6 distinct animals)
 */
const CompanionPet3D: React.FC<{
  pet: ArenaPetEntity;
  worldRef: React.MutableRefObject<MonsterArenaWorld>;
  onPetClick?: (petEntityId: number) => void;
}> = ({ pet, worldRef, onPetClick }) => {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const leftWingRef = useRef<THREE.Mesh>(null);
  const rightWingRef = useRef<THREE.Mesh>(null);
  const selectRingRef = useRef<THREE.Mesh>(null);
  const mergeRingRef = useRef<THREE.Mesh>(null);
  const hpFillRef = useRef<THREE.Mesh>(null);
  const hpMatRef = useRef<THREE.MeshBasicMaterial>(null);

  const spec = PET_SPECS[pet.petId];

  useFrame(() => {
    const w = worldRef.current;
    const live = w.pets.find((p) => p.id === pet.id);
    if (!live || !groupRef.current) return;
    const hover = spec.flying
      ? 1.55 + Math.sin(live.animPhase) * 0.22
      : Math.abs(Math.sin(live.animPhase)) * 0.14;
    groupRef.current.position.set(live.x, hover, live.z);
    groupRef.current.rotation.y = live.angle;
    if (bodyRef.current) {
      const lunge = live.lungeTimer > 0 ? 1.16 : 1.0;
      const hurtPulse = 1 + live.hitFlash * 0.18;
      const mergeSizeMul = 1 + (live.level - 1) * 0.15;
      const finalScale = spec.scale * mergeSizeMul * lunge * hurtPulse;
      bodyRef.current.scale.set(finalScale, finalScale, finalScale);
    }
    if (leftWingRef.current && rightWingRef.current) {
      const flap = Math.sin(live.animPhase * 1.6) * 0.7;
      leftWingRef.current.rotation.z = flap;
      rightWingRef.current.rotation.z = -flap;
    }

    if (hpFillRef.current) {
      const ratio = Math.max(0.01, Math.min(1, live.hp / Math.max(1, live.maxHp)));
      const halfW = 0.44;
      hpFillRef.current.scale.x = ratio;
      hpFillRef.current.position.x = -(1 - ratio) * halfW;
      if (hpMatRef.current) {
        if (live.hitFlash > 0.25) {
          hpMatRef.current.color.set('#ffffff');
        } else if (ratio > 0.5) {
          hpMatRef.current.color.set('#22c55e');
        } else if (ratio > 0.25) {
          hpMatRef.current.color.set('#f59e0b');
        } else {
          hpMatRef.current.color.set('#ef4444');
        }
      }
    }

    const isSelected = w.selectedPetId === live.id;
    let isMergeTarget = false;
    if (!isSelected && w.selectedPetId !== null && live.level < MAX_PET_LEVEL) {
      const sel = w.pets.find((p) => p.id === w.selectedPetId);
      if (sel && sel.petId === live.petId && sel.level === live.level) {
        isMergeTarget = true;
      }
    }
    if (selectRingRef.current) selectRingRef.current.visible = isSelected;
    if (mergeRingRef.current) mergeRingRef.current.visible = isMergeTarget;
  });

  const id = pet.petId;

  return (
    <group
      ref={groupRef}
      onClick={(e) => {
        if (onPetClick) {
          e.stopPropagation();
          onPetClick(pet.id);
        }
      }}
    >
      {/* Generous Invisible Hit Target for Easy Tap/Click Move & Merge */}
      <mesh position={[0, 0.55, 0]}>
        <sphereGeometry args={[1.05, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Contact Shadow / Ally Aura Ring */}
      {!spec.flying && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <ringGeometry args={[0.42, 0.56, 18]} />
          <meshBasicMaterial
            color={pet.guardX !== null ? '#38bdf8' : spec.accentColor}
            transparent
            opacity={0.55}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Active Selection Ring (Yellow/Gold) */}
      <mesh
        ref={selectRingRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, spec.flying ? -1.4 : 0.05, 0]}
        visible={false}
      >
        <ringGeometry args={[0.68, 0.94, 28]} />
        <meshBasicMaterial color="#fde047" transparent opacity={0.95} depthWrite={false} />
      </mesh>

      {/* Matching Merge-Partner Highlight Ring (Fuchsia) */}
      <mesh
        ref={mergeRingRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, spec.flying ? -1.4 : 0.05, 0]}
        visible={false}
      >
        <ringGeometry args={[0.68, 0.96, 28]} />
        <meshBasicMaterial color="#e879f9" transparent opacity={0.95} depthWrite={false} />
      </mesh>

      <group ref={bodyRef} scale={spec.scale}>
        {/* 1. Battle Wolf */}
        {id === 'wolf' && (
          <group>
            <mesh position={[0, 0.36, 0]} castShadow>
              <boxGeometry args={[0.42, 0.38, 0.84]} />
              <meshStandardMaterial color="#64748b" roughness={0.68} />
            </mesh>
            <mesh position={[0, 0.54, 0.46]} castShadow>
              <boxGeometry args={[0.32, 0.3, 0.38]} />
              <meshStandardMaterial color="#475569" roughness={0.62} />
            </mesh>
            <mesh position={[-0.12, 0.76, 0.4]}>
              <coneGeometry args={[0.07, 0.22, 5]} />
              <meshStandardMaterial color="#334155" />
            </mesh>
            <mesh position={[0.12, 0.76, 0.4]}>
              <coneGeometry args={[0.07, 0.22, 5]} />
              <meshStandardMaterial color="#334155" />
            </mesh>
            <mesh position={[0, 0.5, -0.52]} rotation={[0.6, 0, 0]}>
              <coneGeometry args={[0.09, 0.4, 6]} />
              <meshStandardMaterial color="#94a3b8" />
            </mesh>
            <mesh position={[-0.09, 0.58, 0.65]}>
              <sphereGeometry args={[0.045, 8, 8]} />
              <meshStandardMaterial color="#7dd3fc" emissive="#38bdf8" emissiveIntensity={1.8} />
            </mesh>
            <mesh position={[0.09, 0.58, 0.65]}>
              <sphereGeometry args={[0.045, 8, 8]} />
              <meshStandardMaterial color="#7dd3fc" emissive="#38bdf8" emissiveIntensity={1.8} />
            </mesh>
          </group>
        )}

        {/* 2. Desert Falcon (Flying) */}
        {id === 'falcon' && (
          <group>
            <mesh castShadow>
              <capsuleGeometry args={[0.2, 0.44, 6, 10]} />
              <meshStandardMaterial color="#b45309" roughness={0.55} />
            </mesh>
            <mesh position={[0, 0.1, 0.36]}>
              <coneGeometry args={[0.11, 0.28, 6]} />
              <meshStandardMaterial color="#fde047" roughness={0.35} metalness={0.4} />
            </mesh>
            <mesh ref={leftWingRef} position={[-0.48, 0.06, 0]} castShadow>
              <boxGeometry args={[0.78, 0.06, 0.38]} />
              <meshStandardMaterial color="#92400e" roughness={0.6} />
            </mesh>
            <mesh ref={rightWingRef} position={[0.48, 0.06, 0]} castShadow>
              <boxGeometry args={[0.78, 0.06, 0.38]} />
              <meshStandardMaterial color="#92400e" roughness={0.6} />
            </mesh>
            <mesh position={[-0.09, 0.14, 0.24]}>
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshStandardMaterial color="#fef08a" emissive="#facc15" emissiveIntensity={1.8} />
            </mesh>
            <mesh position={[0.09, 0.14, 0.24]}>
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshStandardMaterial color="#fef08a" emissive="#facc15" emissiveIntensity={1.8} />
            </mesh>
          </group>
        )}

        {/* 3. Guardian Bear */}
        {id === 'bear' && (
          <group>
            <mesh position={[0, 0.5, 0]} castShadow>
              <boxGeometry args={[0.68, 0.72, 0.88]} />
              <meshStandardMaterial color="#78350f" roughness={0.82} />
            </mesh>
            {/* Golden Armor Collar */}
            <mesh position={[0, 0.74, 0.12]}>
              <boxGeometry args={[0.74, 0.24, 0.52]} />
              <meshStandardMaterial color="#d97706" roughness={0.32} metalness={0.78} />
            </mesh>
            <mesh position={[0, 0.82, 0.52]} castShadow>
              <sphereGeometry args={[0.28, 12, 10]} />
              <meshStandardMaterial color="#92400e" roughness={0.78} />
            </mesh>
            <mesh position={[-0.19, 1.04, 0.44]}>
              <sphereGeometry args={[0.09, 8, 8]} />
              <meshStandardMaterial color="#78350f" />
            </mesh>
            <mesh position={[0.19, 1.04, 0.44]}>
              <sphereGeometry args={[0.09, 8, 8]} />
              <meshStandardMaterial color="#78350f" />
            </mesh>
            <mesh position={[-0.1, 0.86, 0.78]}>
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshStandardMaterial color="#fef08a" emissive="#f59e0b" emissiveIntensity={1.6} />
            </mesh>
            <mesh position={[0.1, 0.86, 0.78]}>
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshStandardMaterial color="#fef08a" emissive="#f59e0b" emissiveIntensity={1.6} />
            </mesh>
          </group>
        )}

        {/* 4. Thunder Panther */}
        {id === 'panther' && (
          <group>
            <mesh position={[0, 0.38, 0]} castShadow>
              <boxGeometry args={[0.42, 0.38, 0.92]} />
              <meshStandardMaterial color="#1e1b4b" roughness={0.42} metalness={0.35} />
            </mesh>
            <mesh position={[0, 0.58, 0.08]}>
              <boxGeometry args={[0.46, 0.08, 0.62]} />
              <meshStandardMaterial color="#67e8f9" emissive="#06b6d4" emissiveIntensity={1.4} />
            </mesh>
            <mesh position={[0, 0.56, 0.5]} castShadow>
              <dodecahedronGeometry args={[0.23, 0]} />
              <meshStandardMaterial color="#312e81" roughness={0.4} metalness={0.4} />
            </mesh>
            <mesh position={[0, 0.52, -0.58]} rotation={[0.7, 0, 0]}>
              <cylinderGeometry args={[0.04, 0.06, 0.56, 6]} />
              <meshStandardMaterial color="#312e81" />
            </mesh>
            <mesh position={[-0.09, 0.6, 0.71]}>
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshStandardMaterial color="#cffafe" emissive="#22d3ee" emissiveIntensity={2.0} />
            </mesh>
            <mesh position={[0.09, 0.6, 0.71]}>
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshStandardMaterial color="#cffafe" emissive="#22d3ee" emissiveIntensity={2.0} />
            </mesh>
          </group>
        )}

        {/* 5. Golden Lion */}
        {id === 'lion' && (
          <group>
            <mesh position={[0, 0.44, 0]} castShadow>
              <boxGeometry args={[0.5, 0.46, 0.94]} />
              <meshStandardMaterial color="#d97706" roughness={0.62} />
            </mesh>
            {/* Royal Golden Mane */}
            <mesh position={[0, 0.66, 0.42]} castShadow>
              <dodecahedronGeometry args={[0.38, 0]} />
              <meshStandardMaterial color="#92400e" roughness={0.75} />
            </mesh>
            <mesh position={[0, 0.64, 0.58]}>
              <sphereGeometry args={[0.23, 10, 10]} />
              <meshStandardMaterial color="#f59e0b" roughness={0.55} />
            </mesh>
            <mesh position={[0, 0.52, -0.58]} rotation={[0.7, 0, 0]}>
              <cylinderGeometry args={[0.045, 0.055, 0.56, 6]} />
              <meshStandardMaterial color="#d97706" />
            </mesh>
            <mesh position={[-0.09, 0.68, 0.79]}>
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshStandardMaterial color="#fef08a" emissive="#facc15" emissiveIntensity={1.9} />
            </mesh>
            <mesh position={[0.09, 0.68, 0.79]}>
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshStandardMaterial color="#fef08a" emissive="#facc15" emissiveIntensity={1.9} />
            </mesh>
          </group>
        )}

        {/* 6. Companion Dragon (Flying) */}
        {id === 'baby_dragon' && (
          <group>
            <mesh castShadow>
              <boxGeometry args={[0.42, 0.38, 0.78]} />
              <meshStandardMaterial color="#be123c" roughness={0.35} metalness={0.45} />
            </mesh>
            <mesh position={[0, 0.16, 0.48]} castShadow>
              <dodecahedronGeometry args={[0.25, 0]} />
              <meshStandardMaterial color="#9f1239" roughness={0.32} metalness={0.45} />
            </mesh>
            {/* Golden Dragon Horns */}
            <mesh position={[-0.14, 0.4, 0.4]} rotation={[-0.4, 0, 0.3]}>
              <coneGeometry args={[0.06, 0.28, 5]} />
              <meshStandardMaterial color="#fde047" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[0.14, 0.4, 0.4]} rotation={[-0.4, 0, -0.3]}>
              <coneGeometry args={[0.06, 0.28, 5]} />
              <meshStandardMaterial color="#fde047" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Flapping Dragon Wings */}
            <mesh ref={leftWingRef} position={[-0.58, 0.14, -0.02]} castShadow>
              <boxGeometry args={[0.92, 0.06, 0.48]} />
              <meshStandardMaterial color="#881337" roughness={0.5} />
            </mesh>
            <mesh ref={rightWingRef} position={[0.58, 0.14, -0.02]} castShadow>
              <boxGeometry args={[0.92, 0.06, 0.48]} />
              <meshStandardMaterial color="#881337" roughness={0.5} />
            </mesh>
            <mesh position={[-0.1, 0.2, 0.7]}>
              <sphereGeometry args={[0.055, 8, 8]} />
              <meshStandardMaterial color="#fef08a" emissive="#f97316" emissiveIntensity={2.0} />
            </mesh>
            <mesh position={[0.1, 0.2, 0.7]}>
              <sphereGeometry args={[0.055, 8, 8]} />
              <meshStandardMaterial color="#fef08a" emissive="#f97316" emissiveIntensity={2.0} />
            </mesh>
          </group>
        )}

        {/* Glowing Merge Tier Halos for Merged Pets (Lv.2 .. Lv.5) */}
        {pet.level >= 2 && (
          <group position={[0, spec.flying ? 0.56 : 1.18, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.32 + (pet.level - 2) * 0.04, 0.045, 8, 22]} />
              <meshStandardMaterial
                color={
                  pet.level >= 5
                    ? '#e879f9'
                    : pet.level === 4
                    ? '#38bdf8'
                    : pet.level === 3
                    ? '#f472b6'
                    : '#fde047'
                }
                emissive={
                  pet.level >= 5
                    ? '#c026d3'
                    : pet.level === 4
                    ? '#0284c7'
                    : pet.level === 3
                    ? '#ec4899'
                    : '#f59e0b'
                }
                emissiveIntensity={1.7 + (pet.level - 2) * 0.25}
              />
            </mesh>
            {pet.level >= 4 && (
              <mesh rotation={[Math.PI / 3, 0, Math.PI / 5]}>
                <torusGeometry args={[0.42, 0.032, 8, 22]} />
                <meshStandardMaterial
                  color="#fef08a"
                  emissive="#f59e0b"
                  emissiveIntensity={2.0}
                />
              </mesh>
            )}
          </group>
        )}
      </group>

      {/* Floating 3D Companion Pet HP Bar */}
      <group position={[0, spec.flying ? 0.92 : 1.52 + (pet.level - 1) * 0.16, 0]}>
        <mesh>
          <planeGeometry args={[0.94, 0.12]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>
        <mesh ref={hpFillRef} position={[0, 0, 0.01]}>
          <planeGeometry args={[0.88, 0.075]} />
          <meshBasicMaterial ref={hpMatRef} color="#22c55e" />
        </mesh>
      </group>
    </group>
  );
};

/**
 * Composite 3D Arena Monster Actor (7 species including the 10-Min Titan Boss)
 */
const ArenaMonster3D: React.FC<{
  monster: ArenaMonsterEntity;
  worldRef: React.MutableRefObject<MonsterArenaWorld>;
}> = ({ monster, worldRef }) => {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const hpFillRef = useRef<THREE.Mesh>(null);
  const frostRef = useRef<THREE.Mesh>(null);
  const poisonRef = useRef<THREE.Mesh>(null);

  const spec = ARENA_MONSTER_SPECS[monster.kind];

  useFrame(() => {
    const live = worldRef.current.monsters.find((m) => m.id === monster.id);
    if (!live || !groupRef.current) return;
    const bob = spec.flying
      ? 0.65 + Math.sin(live.walkPhase) * 0.2
      : Math.abs(Math.sin(live.walkPhase)) * 0.12;
    groupRef.current.position.set(live.x, bob, live.z);
    groupRef.current.rotation.y = live.angle;

    if (bodyRef.current) {
      const pulse = 1 + live.hitFlash * 0.16;
      bodyRef.current.scale.set(
        spec.scale * pulse,
        spec.scale * pulse,
        spec.scale * pulse
      );
    }
    if (hpFillRef.current) {
      const ratio = Math.max(0.01, live.hp / live.maxHp);
      const halfW =
        live.kind === 'titanBoss' ? 0.92 : live.kind === 'warlordBoss' ? 0.72 : 0.48;
      hpFillRef.current.scale.x = ratio;
      hpFillRef.current.position.x = -(1 - ratio) * halfW;
    }
    if (frostRef.current) frostRef.current.visible = live.slowTimer > 0;
    if (poisonRef.current) poisonRef.current.visible = live.poisonTimer > 0;
  });

  const k = monster.kind;
  const hpY =
    k === 'titanBoss'
      ? 4.4
      : k === 'warlordBoss'
      ? 3.45
      : k === 'minotaur'
      ? 2.45
      : k === 'brute'
      ? 2.2
      : 1.65;

  return (
    <group ref={groupRef}>
      {/* Contact Shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[spec.radius * 0.88, 16]} />
        <meshBasicMaterial color="#05070e" transparent opacity={0.44} depthWrite={false} />
      </mesh>
      <mesh
        ref={frostRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.04, 0]}
        visible={false}
      >
        <ringGeometry args={[spec.radius * 0.85, spec.radius * 1.1, 20]} />
        <meshBasicMaterial color="#67e8f9" transparent opacity={0.85} depthWrite={false} />
      </mesh>
      <mesh
        ref={poisonRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.05, 0]}
        visible={false}
      >
        <ringGeometry args={[spec.radius * 0.6, spec.radius * 0.78, 18]} />
        <meshBasicMaterial color="#a3e635" transparent opacity={0.85} depthWrite={false} />
      </mesh>

      <group ref={bodyRef} scale={spec.scale}>
        {/* Imp */}
        {k === 'imp' && (
          <group>
            <mesh position={[0, 0.42, 0]} castShadow>
              <sphereGeometry args={[0.38, 12, 10]} />
              <meshStandardMaterial color="#ea580c" roughness={0.55} />
            </mesh>
            <mesh position={[-0.18, 0.78, 0]} rotation={[0, 0, 0.35]}>
              <coneGeometry args={[0.09, 0.3, 6]} />
              <meshStandardMaterial color="#fef08a" roughness={0.35} />
            </mesh>
            <mesh position={[0.18, 0.78, 0]} rotation={[0, 0, -0.35]}>
              <coneGeometry args={[0.09, 0.3, 6]} />
              <meshStandardMaterial color="#fef08a" roughness={0.35} />
            </mesh>
            <mesh position={[-0.12, 0.48, 0.34]}>
              <sphereGeometry args={[0.065, 8, 8]} />
              <meshStandardMaterial color="#fef08a" emissive="#facc15" emissiveIntensity={1.6} />
            </mesh>
            <mesh position={[0.12, 0.48, 0.34]}>
              <sphereGeometry args={[0.065, 8, 8]} />
              <meshStandardMaterial color="#fef08a" emissive="#facc15" emissiveIntensity={1.6} />
            </mesh>
          </group>
        )}

        {/* Goblin */}
        {k === 'goblin' && (
          <group>
            <mesh position={[0, 0.46, 0]} castShadow>
              <capsuleGeometry args={[0.28, 0.36, 6, 10]} />
              <meshStandardMaterial color="#15803d" roughness={0.75} />
            </mesh>
            <mesh position={[0, 0.94, 0]} castShadow>
              <dodecahedronGeometry args={[0.26, 0]} />
              <meshStandardMaterial color="#16a34a" roughness={0.65} />
            </mesh>
            <mesh position={[0.34, 0.62, 0.28]} rotation={[0.5, 0, -0.25]} castShadow>
              <cylinderGeometry args={[0.07, 0.05, 0.66, 6]} />
              <meshStandardMaterial color="#78350f" roughness={0.9} />
            </mesh>
            <mesh position={[-0.1, 0.96, 0.23]}>
              <sphereGeometry args={[0.055, 8, 8]} />
              <meshStandardMaterial color="#fef08a" emissive="#f59e0b" emissiveIntensity={1.5} />
            </mesh>
            <mesh position={[0.1, 0.96, 0.23]}>
              <sphereGeometry args={[0.055, 8, 8]} />
              <meshStandardMaterial color="#fef08a" emissive="#f59e0b" emissiveIntensity={1.5} />
            </mesh>
          </group>
        )}

        {/* Lava Crawler */}
        {k === 'crawler' && (
          <group>
            <mesh position={[0, 0.32, -0.2]} scale={[1.05, 0.85, 1.25]} castShadow>
              <sphereGeometry args={[0.34, 12, 10]} />
              <meshStandardMaterial color="#3b0764" roughness={0.45} metalness={0.25} />
            </mesh>
            <mesh position={[0, 0.54, -0.24]}>
              <sphereGeometry args={[0.16, 8, 8]} />
              <meshStandardMaterial color="#bef264" emissive="#84cc16" emissiveIntensity={1.5} />
            </mesh>
            <mesh position={[0, 0.28, 0.28]} castShadow>
              <sphereGeometry args={[0.22, 10, 8]} />
              <meshStandardMaterial color="#1e1b4b" roughness={0.5} />
            </mesh>
            {[-0.12, 0, 0.12].map((ex, i) => (
              <mesh key={i} position={[ex, 0.34, 0.48]}>
                <sphereGeometry args={[0.045, 6, 6]} />
                <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={1.8} />
              </mesh>
            ))}
          </group>
        )}

        {/* Rock Brute */}
        {k === 'brute' && (
          <group>
            <mesh position={[0, 0.56, 0]} castShadow>
              <boxGeometry args={[0.76, 0.86, 0.62]} />
              <meshStandardMaterial color="#475569" roughness={0.88} />
            </mesh>
            <mesh position={[0, 1.12, 0.06]} castShadow>
              <boxGeometry args={[0.44, 0.36, 0.42]} />
              <meshStandardMaterial color="#334155" roughness={0.82} />
            </mesh>
            <mesh position={[0, 0.64, 0.34]}>
              <octahedronGeometry args={[0.17, 0]} />
              <meshStandardMaterial color="#fb923c" emissive="#ea580c" emissiveIntensity={1.6} />
            </mesh>
            <mesh position={[-0.12, 1.15, 0.28]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshStandardMaterial color="#fde047" emissive="#f97316" emissiveIntensity={1.7} />
            </mesh>
            <mesh position={[0.12, 1.15, 0.28]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshStandardMaterial color="#fde047" emissive="#f97316" emissiveIntensity={1.7} />
            </mesh>
          </group>
        )}

        {/* Inferno Wraith (Flying & Ranged) */}
        {k === 'wraith' && (
          <group>
            <mesh position={[0, 0.35, 0]} castShadow>
              <coneGeometry args={[0.42, 0.94, 10]} />
              <meshStandardMaterial
                color="#0e7490"
                emissive="#06b6d4"
                emissiveIntensity={0.6}
                transparent
                opacity={0.85}
              />
            </mesh>
            <mesh position={[0, 0.78, 0]}>
              <sphereGeometry args={[0.28, 12, 10]} />
              <meshStandardMaterial color="#cffafe" emissive="#22d3ee" emissiveIntensity={1.0} />
            </mesh>
            <mesh position={[-0.1, 0.82, 0.24]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshStandardMaterial color="#0f172a" emissive="#67e8f9" emissiveIntensity={1.8} />
            </mesh>
            <mesh position={[0.1, 0.82, 0.24]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshStandardMaterial color="#0f172a" emissive="#67e8f9" emissiveIntensity={1.8} />
            </mesh>
          </group>
        )}

        {/* Raging Minotaur */}
        {k === 'minotaur' && (
          <group>
            <mesh position={[0, 0.62, 0]} castShadow>
              <boxGeometry args={[0.8, 0.94, 0.68]} />
              <meshStandardMaterial color="#7f1d1d" roughness={0.68} />
            </mesh>
            <mesh position={[0, 1.24, 0.08]} castShadow>
              <boxGeometry args={[0.46, 0.42, 0.5]} />
              <meshStandardMaterial color="#450a0a" roughness={0.6} />
            </mesh>
            <mesh position={[-0.36, 1.44, 0.08]} rotation={[0, 0, 0.85]}>
              <coneGeometry args={[0.1, 0.46, 6]} />
              <meshStandardMaterial color="#fef3c7" roughness={0.4} />
            </mesh>
            <mesh position={[0.36, 1.44, 0.08]} rotation={[0, 0, -0.85]}>
              <coneGeometry args={[0.1, 0.46, 6]} />
              <meshStandardMaterial color="#fef3c7" roughness={0.4} />
            </mesh>
            <mesh position={[-0.12, 1.26, 0.34]}>
              <sphereGeometry args={[0.065, 8, 8]} />
              <meshStandardMaterial color="#fef08a" emissive="#f59e0b" emissiveIntensity={1.8} />
            </mesh>
            <mesh position={[0.12, 1.26, 0.34]}>
              <sphereGeometry args={[0.065, 8, 8]} />
              <meshStandardMaterial color="#fef08a" emissive="#f59e0b" emissiveIntensity={1.8} />
            </mesh>
          </group>
        )}

        {/* 3-Minute Strong Boss: Inferno Warlord */}
        {k === 'warlordBoss' && (
          <group>
            {/* Armored Molten Torso */}
            <mesh position={[0, 0.68, 0]} castShadow>
              <boxGeometry args={[0.92, 1.06, 0.76]} />
              <meshStandardMaterial color="#431407" roughness={0.38} metalness={0.68} />
            </mesh>
            {/* Blazing Magma Core */}
            <mesh position={[0, 0.74, 0.41]}>
              <octahedronGeometry args={[0.24, 0]} />
              <meshStandardMaterial color="#fef08a" emissive="#f97316" emissiveIntensity={2.0} />
            </mesh>
            {/* Horned Warlord Helm */}
            <mesh position={[0, 1.42, 0.05]} castShadow>
              <dodecahedronGeometry args={[0.36, 0]} />
              <meshStandardMaterial color="#7c2d12" roughness={0.35} metalness={0.72} />
            </mesh>
            <mesh position={[-0.3, 1.72, 0.04]} rotation={[0, 0, 0.65]}>
              <coneGeometry args={[0.11, 0.54, 6]} />
              <meshStandardMaterial color="#fb923c" emissive="#ea580c" emissiveIntensity={1.5} />
            </mesh>
            <mesh position={[0.3, 1.72, 0.04]} rotation={[0, 0, -0.65]}>
              <coneGeometry args={[0.11, 0.54, 6]} />
              <meshStandardMaterial color="#fb923c" emissive="#ea580c" emissiveIntensity={1.5} />
            </mesh>
            {/* Spiked Shoulder Pauldrons */}
            <mesh position={[-0.58, 1.05, 0]} castShadow>
              <dodecahedronGeometry args={[0.28, 0]} />
              <meshStandardMaterial color="#9a3412" roughness={0.34} metalness={0.74} />
            </mesh>
            <mesh position={[0.58, 1.05, 0]} castShadow>
              <dodecahedronGeometry args={[0.28, 0]} />
              <meshStandardMaterial color="#9a3412" roughness={0.34} metalness={0.74} />
            </mesh>
            {/* Molten War Hammer in Right Hand */}
            <group position={[0.66, 0.72, 0.42]} rotation={[0.45, 0, -0.15]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.065, 0.065, 1.15, 8]} />
                <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
              </mesh>
              <mesh position={[0, 0.52, 0]} castShadow>
                <boxGeometry args={[0.46, 0.3, 0.3]} />
                <meshStandardMaterial color="#ea580c" emissive="#f97316" emissiveIntensity={1.4} />
              </mesh>
            </group>
            {/* Blazing Eyes */}
            <mesh position={[-0.13, 1.46, 0.34]}>
              <sphereGeometry args={[0.075, 8, 8]} />
              <meshStandardMaterial color="#fef9c3" emissive="#facc15" emissiveIntensity={2.1} />
            </mesh>
            <mesh position={[0.13, 1.46, 0.34]}>
              <sphereGeometry args={[0.075, 8, 8]} />
              <meshStandardMaterial color="#fef9c3" emissive="#facc15" emissiveIntensity={2.1} />
            </mesh>
          </group>
        )}

        {/* 10-Minute Strong Boss: Eternal Dread Titan */}
        {k === 'titanBoss' && (
          <group>
            <mesh position={[0, 0.72, 0]} castShadow>
              <boxGeometry args={[1.05, 1.22, 0.88]} />
              <meshStandardMaterial color="#1e062c" roughness={0.32} metalness={0.72} />
            </mesh>
            <mesh position={[0, 0.78, 0.48]}>
              <octahedronGeometry args={[0.3, 0]} />
              <meshStandardMaterial color="#fef08a" emissive="#f43f5e" emissiveIntensity={2.2} />
            </mesh>
            <mesh position={[0, 1.56, 0.06]} castShadow>
              <icosahedronGeometry args={[0.42, 0]} />
              <meshStandardMaterial color="#3b0764" roughness={0.3} metalness={0.75} />
            </mesh>
            <mesh position={[-0.36, 1.98, 0]} rotation={[0, 0, 0.5]}>
              <coneGeometry args={[0.14, 0.72, 7]} />
              <meshStandardMaterial color="#f43f5e" emissive="#e11d48" emissiveIntensity={1.7} />
            </mesh>
            <mesh position={[0.36, 1.98, 0]} rotation={[0, 0, -0.5]}>
              <coneGeometry args={[0.14, 0.72, 7]} />
              <meshStandardMaterial color="#f43f5e" emissive="#e11d48" emissiveIntensity={1.7} />
            </mesh>
            <mesh position={[0, 2.26, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.62, 0.075, 10, 28]} />
              <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={1.8} />
            </mesh>
            <mesh position={[-0.68, 1.15, 0]} castShadow>
              <dodecahedronGeometry args={[0.34, 0]} />
              <meshStandardMaterial color="#881337" roughness={0.32} metalness={0.7} />
            </mesh>
            <mesh position={[0.68, 1.15, 0]} castShadow>
              <dodecahedronGeometry args={[0.34, 0]} />
              <meshStandardMaterial color="#881337" roughness={0.32} metalness={0.7} />
            </mesh>
            <mesh position={[-0.16, 1.6, 0.42]}>
              <sphereGeometry args={[0.09, 8, 8]} />
              <meshStandardMaterial color="#ffffff" emissive="#f43f5e" emissiveIntensity={2.3} />
            </mesh>
            <mesh position={[0.16, 1.6, 0.42]}>
              <sphereGeometry args={[0.09, 8, 8]} />
              <meshStandardMaterial color="#ffffff" emissive="#f43f5e" emissiveIntensity={2.3} />
            </mesh>
          </group>
        )}
      </group>

      {/* Floating 3D Monster HP Bar */}
      <group position={[0, hpY, 0]}>
        <mesh>
          <planeGeometry
            args={[k === 'titanBoss' ? 1.92 : k === 'warlordBoss' ? 1.5 : 1.02, 0.14]}
          />
          <meshBasicMaterial color="#0f172a" />
        </mesh>
        <mesh ref={hpFillRef} position={[0, 0, 0.01]}>
          <planeGeometry
            args={[k === 'titanBoss' ? 1.84 : k === 'warlordBoss' ? 1.44 : 0.96, 0.09]}
          />
          <meshBasicMaterial
            color={
              k === 'titanBoss'
                ? '#f43f5e'
                : k === 'warlordBoss'
                ? '#f97316'
                : '#ef4444'
            }
          />
        </mesh>
      </group>
    </group>
  );
};

export const ArenaEntities3D: React.FC<ArenaEntities3DProps> = ({
  worldRef,
  renderTick,
  onPetClick,
}) => {
  const projInstRef = useRef<THREE.InstancedMesh>(null);
  const pickupInstRef = useRef<THREE.InstancedMesh>(null);
  const partInstRef = useRef<THREE.InstancedMesh>(null);

  const MAX_PROJ = 140;
  const MAX_PICKUP = 70;
  const MAX_PART = 110;

  const projGeo = useMemo(() => new THREE.SphereGeometry(1, 10, 8), []);
  const pickupGeo = useMemo(() => new THREE.OctahedronGeometry(0.32, 0), []);
  const partGeo = useMemo(() => new THREE.OctahedronGeometry(1, 0), []);

  useEffect(() => {
    return () => {
      projGeo.dispose();
      pickupGeo.dispose();
      partGeo.dispose();
    };
  }, [projGeo, pickupGeo, partGeo]);

  useFrame(() => {
    const w = worldRef.current;

    if (projInstRef.current) {
      const n = Math.min(MAX_PROJ, w.projectiles.length);
      for (let i = 0; i < MAX_PROJ; i++) {
        if (i < n) {
          const p = w.projectiles[i];
          _pos.set(p.x, p.y, p.z);
          _quat.identity();
          _scale.set(p.size, p.size, p.size);
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

    if (pickupInstRef.current) {
      const n = Math.min(MAX_PICKUP, w.pickups.length);
      for (let i = 0; i < MAX_PICKUP; i++) {
        if (i < n) {
          const pk = w.pickups[i];
          const y = 0.42 + Math.sin(pk.phase) * 0.14;
          _pos.set(pk.x, y, pk.z);
          _quat.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, pk.phase * 0.9);
          _scale.set(1, 1, 1);
          _mat4.compose(_pos, _quat, _scale);
          pickupInstRef.current.setMatrixAt(i, _mat4);
          _color.set(pk.kind === 'coin' ? '#facc15' : '#4ade80');
          pickupInstRef.current.setColorAt(i, _color);
        } else {
          _mat4.makeScale(0, 0, 0);
          pickupInstRef.current.setMatrixAt(i, _mat4);
        }
      }
      pickupInstRef.current.instanceMatrix.needsUpdate = true;
      if (pickupInstRef.current.instanceColor) {
        pickupInstRef.current.instanceColor.needsUpdate = true;
      }
    }

    if (partInstRef.current) {
      const n = Math.min(MAX_PART, w.particles.length);
      for (let i = 0; i < MAX_PART; i++) {
        if (i < n) {
          const pt = w.particles[i];
          const s = pt.size * Math.max(0.05, pt.life / pt.maxLife);
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
      <HeroWarrior3D worldRef={worldRef} />

      {world.pets.map((pet) => (
        <CompanionPet3D
          key={pet.id}
          pet={pet}
          worldRef={worldRef}
          onPetClick={onPetClick}
        />
      ))}

      {world.monsters.map((monster) => (
        <ArenaMonster3D key={monster.id} monster={monster} worldRef={worldRef} />
      ))}

      <instancedMesh
        ref={projInstRef}
        args={[projGeo, undefined, MAX_PROJ]}
        frustumCulled={false}
      >
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={0.85}
          roughness={0.18}
        />
      </instancedMesh>

      <instancedMesh
        ref={pickupInstRef}
        args={[pickupGeo, undefined, MAX_PICKUP]}
        frustumCulled={false}
      >
        <meshStandardMaterial
          color="#ffffff"
          emissive="#fef08a"
          emissiveIntensity={0.6}
          metalness={0.65}
          roughness={0.22}
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
