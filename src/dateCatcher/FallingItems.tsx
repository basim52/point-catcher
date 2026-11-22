import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import {
  FallingEntity,
  MAX_ACTIVE_ITEMS,
  MAX_PARTICLES,
  POWERUP_META,
  PowerUpKind,
} from './types';
import { DateCatcherWorld } from './gameLogic';

interface FallingItemsProps {
  worldRef: React.MutableRefObject<DateCatcherWorld>;
}

// Reusable module-scope math objects for zero-GC 60fps instanced updates
const _dummy = new THREE.Object3D();
const _color = new THREE.Color();
const _goldColor = new THREE.Color('#fde047');
const _sandColor = new THREE.Color('#e8bd7b');

const MAX_SPECIAL_POOL = 12;

/**
 * Renders:
 * 1) InstancedMesh for regular glossy brown dates
 * 2) InstancedMesh for metallic shimmering golden dates
 * 3) InstancedMesh for golden catch sparkles & sand dust puffs
 * 4) Pooled composite meshes for Rutab Clusters, Grey Stones, Flapping Wasps, and Power-Up Orbs
 */
export const FallingItems: React.FC<FallingItemsProps> = ({ worldRef }) => {
  const normalDatesRef = useRef<THREE.InstancedMesh>(null);
  const goldenDatesRef = useRef<THREE.InstancedMesh>(null);
  const particlesRef = useRef<THREE.InstancedMesh>(null);

  const rutabRefs = useRef<(THREE.Group | null)[]>([]);
  const stoneRefs = useRef<(THREE.Mesh | null)[]>([]);
  const waspRefs = useRef<(THREE.Group | null)[]>([]);
  const waspLeftWingRefs = useRef<(THREE.Mesh | null)[]>([]);
  const waspRightWingRefs = useRef<(THREE.Mesh | null)[]>([]);
  const powerRefs = useRef<(THREE.Group | null)[]>([]);
  const powerMatRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);

  // Low-poly oval date geometry (slightly elongated smooth oval)
  const dateGeo = useMemo(() => {
    const g = new THREE.SphereGeometry(0.24, 10, 8);
    g.scale(0.82, 1.38, 0.82);
    return g;
  }, []);

  const particleGeo = useMemo(() => new THREE.OctahedronGeometry(1, 0), []);

  const normalDateMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#6e3214',
        roughness: 0.26,
        metalness: 0.08,
      }),
    []
  );

  const goldenDateMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#facc15',
        emissive: '#d97706',
        emissiveIntensity: 0.45,
        roughness: 0.16,
        metalness: 0.92,
      }),
    []
  );

  const particleMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#ffffff',
        transparent: true,
        opacity: 0.92,
      }),
    []
  );

  const poolIndices = useMemo(
    () => Array.from({ length: MAX_SPECIAL_POOL }, (_, i) => i),
    []
  );

  useFrame(({ clock }) => {
    const world = worldRef.current;
    const t = clock.getElapsedTime();

    // Pulse golden date shimmer gently
    goldenDateMat.emissiveIntensity = 0.42 + Math.sin(t * 7.5) * 0.24;

    let normalIdx = 0;
    let goldenIdx = 0;
    let rutabIdx = 0;
    let stoneIdx = 0;
    let waspIdx = 0;
    let powerIdx = 0;

    const items = world.items;
    for (let i = 0; i < items.length; i++) {
      const it: FallingEntity = items[i];

      if (it.kind === 'date' && normalDatesRef.current && normalIdx < MAX_ACTIVE_ITEMS) {
        _dummy.position.set(it.x, it.y, it.z);
        _dummy.rotation.set(it.rotX, it.rotY, it.rotZ);
        _dummy.scale.setScalar(it.scale);
        _dummy.updateMatrix();
        normalDatesRef.current.setMatrixAt(normalIdx, _dummy.matrix);
        normalIdx++;
      } else if (
        it.kind === 'golden_date' &&
        goldenDatesRef.current &&
        goldenIdx < MAX_ACTIVE_ITEMS
      ) {
        const pulse = 1.08 + Math.sin(t * 9 + it.phase) * 0.08;
        _dummy.position.set(it.x, it.y, it.z);
        _dummy.rotation.set(it.rotX, it.rotY, it.rotZ);
        _dummy.scale.setScalar(pulse);
        _dummy.updateMatrix();
        goldenDatesRef.current.setMatrixAt(goldenIdx, _dummy.matrix);
        goldenIdx++;
      } else if (it.kind === 'rutab_cluster' && rutabIdx < MAX_SPECIAL_POOL) {
        const g = rutabRefs.current[rutabIdx];
        if (g) {
          g.visible = true;
          g.position.set(it.x, it.y, it.z);
          g.rotation.set(0.15, t * 2.2 + it.phase, Math.sin(t * 3 + it.phase) * 0.14);
        }
        rutabIdx++;
      } else if (it.kind === 'stone' && stoneIdx < MAX_SPECIAL_POOL) {
        const m = stoneRefs.current[stoneIdx];
        if (m) {
          m.visible = true;
          m.position.set(it.x, it.y, it.z);
          m.rotation.set(it.rotX, it.rotY, it.rotZ);
        }
        stoneIdx++;
      } else if (it.kind === 'wasp' && waspIdx < MAX_SPECIAL_POOL) {
        const g = waspRefs.current[waspIdx];
        if (g) {
          g.visible = true;
          g.position.set(it.x, it.y, it.z);
          g.rotation.set(0.18, it.rotY, Math.sin(t * 8 + it.phase) * 0.12);
          const flap = Math.sin(t * 52 + it.phase) * 0.72;
          const lw = waspLeftWingRefs.current[waspIdx];
          const rw = waspRightWingRefs.current[waspIdx];
          if (lw) lw.rotation.z = 0.35 + flap;
          if (rw) rw.rotation.z = -0.35 - flap;
        }
        waspIdx++;
      } else if (
        (it.kind === 'magnet' ||
          it.kind === 'big_basket' ||
          it.kind === 'slow_mo' ||
          it.kind === 'shield') &&
        powerIdx < MAX_SPECIAL_POOL
      ) {
        const g = powerRefs.current[powerIdx];
        const mat = powerMatRefs.current[powerIdx];
        if (g) {
          g.visible = true;
          g.position.set(it.x, it.y, it.z);
          g.rotation.set(0, t * 2.6 + it.phase, Math.sin(t * 4 + it.phase) * 0.12);
          const s = 1 + Math.sin(t * 6 + it.phase) * 0.08;
          g.scale.setScalar(s);
        }
        if (mat) {
          const hex = POWERUP_META[it.kind as PowerUpKind].color;
          mat.color.set(hex);
          mat.emissive.set(hex);
        }
        powerIdx++;
      }
    }

    // Hide unused slots cleanly
    if (normalDatesRef.current) {
      normalDatesRef.current.count = normalIdx;
      normalDatesRef.current.instanceMatrix.needsUpdate = true;
    }
    if (goldenDatesRef.current) {
      goldenDatesRef.current.count = goldenIdx;
      goldenDatesRef.current.instanceMatrix.needsUpdate = true;
    }

    for (let i = rutabIdx; i < MAX_SPECIAL_POOL; i++) {
      const g = rutabRefs.current[i];
      if (g) g.visible = false;
    }
    for (let i = stoneIdx; i < MAX_SPECIAL_POOL; i++) {
      const m = stoneRefs.current[i];
      if (m) m.visible = false;
    }
    for (let i = waspIdx; i < MAX_SPECIAL_POOL; i++) {
      const g = waspRefs.current[i];
      if (g) g.visible = false;
    }
    for (let i = powerIdx; i < MAX_SPECIAL_POOL; i++) {
      const g = powerRefs.current[i];
      if (g) g.visible = false;
    }

    // Update Instanced Particles (Gold sparkles & Sand dust puffs)
    if (particlesRef.current) {
      let pCount = 0;
      for (let i = 0; i < world.particles.length; i++) {
        const p = world.particles[i];
        if (!p.active) continue;
        const frac = Math.max(0, p.life / p.maxLife);
        _dummy.position.set(p.x, p.y, p.z);
        _dummy.rotation.set(t * 4 + i, t * 3 + i, 0);
        _dummy.scale.setScalar(p.size * (0.35 + frac * 0.9));
        _dummy.updateMatrix();
        particlesRef.current.setMatrixAt(pCount, _dummy.matrix);
        _color.copy(p.kind === 'gold' ? _goldColor : _sandColor);
        particlesRef.current.setColorAt(pCount, _color);
        pCount++;
      }
      particlesRef.current.count = pCount;
      particlesRef.current.instanceMatrix.needsUpdate = true;
      if (particlesRef.current.instanceColor) {
        particlesRef.current.instanceColor.needsUpdate = true;
      }
    }
  });

  return (
    <group>
      {/* Instanced Normal Brown Dates */}
      <instancedMesh
        ref={normalDatesRef}
        args={[dateGeo, normalDateMat, MAX_ACTIVE_ITEMS]}
        castShadow
        frustumCulled={false}
      />

      {/* Instanced Metallic Golden Dates */}
      <instancedMesh
        ref={goldenDatesRef}
        args={[dateGeo, goldenDateMat, MAX_ACTIVE_ITEMS]}
        castShadow
        frustumCulled={false}
      />

      {/* Instanced Particles (Gold Sparkles & Sand Dust) */}
      <instancedMesh
        ref={particlesRef}
        args={[particleGeo, particleMat, MAX_PARTICLES]}
        frustumCulled={false}
      />

      {/* Pooled Rutab Clusters (عنقود رطب +10) */}
      {poolIndices.map((idx) => (
        <group
          key={`rutab-${idx}`}
          ref={(el) => {
            rutabRefs.current[idx] = el;
          }}
          visible={false}
        >
          {/* Green stem */}
          <mesh position={[0, 0.34, 0]}>
            <cylinderGeometry args={[0.04, 0.06, 0.32, 6]} />
            <meshStandardMaterial color="#16a34a" roughness={0.7} />
          </mesh>
          {/* Bunch of 5 glossy amber-gold rutab dates */}
          {[
            [0, 0.08, 0],
            [-0.17, -0.04, 0.08],
            [0.17, -0.04, -0.06],
            [-0.1, -0.22, -0.07],
            [0.11, -0.22, 0.09],
          ].map(([x, y, z], j) => (
            <mesh key={j} position={[x, y, z]} scale={[0.85, 1.32, 0.85]} castShadow>
              <sphereGeometry args={[0.145, 8, 6]} />
              <meshStandardMaterial
                color={j % 2 === 0 ? '#d97706' : '#f59e0b'}
                emissive="#b45309"
                emissiveIntensity={0.35}
                roughness={0.22}
                metalness={0.35}
              />
            </mesh>
          ))}
        </group>
      ))}

      {/* Pooled Rough Grey Stones (حصاة رمادية) */}
      {poolIndices.map((idx) => (
        <mesh
          key={`stone-${idx}`}
          ref={(el) => {
            stoneRefs.current[idx] = el;
          }}
          visible={false}
          castShadow
        >
          <dodecahedronGeometry args={[0.34, 0]} />
          <meshStandardMaterial
            color="#64748b"
            roughness={0.96}
            metalness={0.05}
            flatShading
          />
        </mesh>
      ))}

      {/* Pooled Flying Wasps (دبّور أصفر وأسود بجناحين يرفرفان) */}
      {poolIndices.map((idx) => (
        <group
          key={`wasp-${idx}`}
          ref={(el) => {
            waspRefs.current[idx] = el;
          }}
          visible={false}
        >
          {/* Yellow body */}
          <mesh castShadow scale={[0.85, 0.85, 1.35]}>
            <sphereGeometry args={[0.26, 10, 8]} />
            <meshStandardMaterial color="#facc15" roughness={0.35} />
          </mesh>
          {/* Black stripes */}
          <mesh position={[0, 0, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.21, 0.048, 6, 12]} />
            <meshStandardMaterial color="#18181b" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0, -0.1]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.19, 0.048, 6, 12]} />
            <meshStandardMaterial color="#18181b" roughness={0.5} />
          </mesh>
          {/* Head & tiny dark eyes */}
          <mesh position={[0, 0.03, 0.34]}>
            <sphereGeometry args={[0.15, 8, 6]} />
            <meshStandardMaterial color="#1e1b18" roughness={0.4} />
          </mesh>
          {/* Stinger cone */}
          <mesh position={[0, -0.02, -0.38]} rotation={[-Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.07, 0.2, 6]} />
            <meshStandardMaterial color="#18181b" roughness={0.4} />
          </mesh>
          {/* Flapping translucent wings */}
          <mesh
            ref={(el) => {
              waspLeftWingRefs.current[idx] = el;
            }}
            position={[-0.26, 0.22, 0.02]}
            scale={[1.4, 0.14, 0.7]}
          >
            <sphereGeometry args={[0.22, 8, 6]} />
            <meshStandardMaterial
              color="#f8fafc"
              transparent
              opacity={0.72}
              roughness={0.15}
            />
          </mesh>
          <mesh
            ref={(el) => {
              waspRightWingRefs.current[idx] = el;
            }}
            position={[0.26, 0.22, 0.02]}
            scale={[1.4, 0.14, 0.7]}
          >
            <sphereGeometry args={[0.22, 8, 6]} />
            <meshStandardMaterial
              color="#f8fafc"
              transparent
              opacity={0.72}
              roughness={0.15}
            />
          </mesh>
        </group>
      ))}

      {/* Pooled Glowing Power-Up Orbs */}
      {poolIndices.map((idx) => (
        <group
          key={`power-${idx}`}
          ref={(el) => {
            powerRefs.current[idx] = el;
          }}
          visible={false}
        >
          <mesh castShadow>
            <octahedronGeometry args={[0.36, 0]} />
            <meshStandardMaterial
              ref={(el) => {
                powerMatRefs.current[idx] = el;
              }}
              color="#38bdf8"
              emissive="#38bdf8"
              emissiveIntensity={0.65}
              roughness={0.18}
              metalness={0.65}
            />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.46, 0.038, 6, 16]} />
            <meshStandardMaterial
              color="#fef9c3"
              emissive="#fde047"
              emissiveIntensity={0.6}
              roughness={0.2}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
};
