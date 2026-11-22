import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { MAX_RALLY_PARTICLES } from './types';
import { DesertRallyWorld } from './gameLogic';

interface TrackEntitiesProps {
  worldRef: React.MutableRefObject<DesertRallyWorld>;
}

const MAX_COINS = 36;
const MAX_TRUCKS = 8;
const MAX_BARRIERS = 8;
const MAX_BOULDERS = 8;
const MAX_RAMPS = 4;
const MAX_PICKUPS = 4;

const _dummy = new THREE.Object3D();
const _color = new THREE.Color();
const TRUCK_COLORS = ['#0284c7', '#16a34a', '#7c3aed'] as const;

export const TrackEntities: React.FC<TrackEntitiesProps> = ({ worldRef }) => {
  const coinInstRef = useRef<THREE.InstancedMesh>(null);
  const particleInstRef = useRef<THREE.InstancedMesh>(null);

  const truckRefs = useRef<(THREE.Group | null)[]>([]);
  const truckBodyMats = useMemo(
    () =>
      Array.from({ length: MAX_TRUCKS }, (_, idx) => {
        return new THREE.MeshStandardMaterial({
          color: TRUCK_COLORS[idx % TRUCK_COLORS.length],
          roughness: 0.38,
          metalness: 0.35,
        });
      }),
    []
  );
  const barrierRefs = useRef<(THREE.Group | null)[]>([]);
  const boulderRefs = useRef<(THREE.Group | null)[]>([]);
  const rampRefs = useRef<(THREE.Group | null)[]>([]);
  const nitroRefs = useRef<(THREE.Group | null)[]>([]);
  const shieldRefs = useRef<(THREE.Group | null)[]>([]);

  useFrame(({ clock }) => {
    const world = worldRef.current;
    const t = clock.getElapsedTime();

    let coinIdx = 0;
    let truckIdx = 0;
    let barrierIdx = 0;
    let boulderIdx = 0;
    let rampIdx = 0;
    let nitroIdx = 0;
    let shieldIdx = 0;

    for (let i = 0; i < world.entities.length; i++) {
      const e = world.entities[i];
      if (e.kind === 'coin') {
        if (coinInstRef.current && coinIdx < MAX_COINS) {
          _dummy.position.set(e.x, e.y + Math.sin(t * 4 + e.id) * 0.08, e.z);
          _dummy.rotation.set(Math.PI / 2, 0, e.rotY);
          _dummy.scale.set(1, 1, 1);
          _dummy.updateMatrix();
          coinInstRef.current.setMatrixAt(coinIdx++, _dummy.matrix);
        }
      } else if (e.kind === 'rival_truck' && truckIdx < MAX_TRUCKS) {
        const g = truckRefs.current[truckIdx];
        if (g) {
          g.visible = true;
          g.position.set(e.x, 0, e.z);
          truckBodyMats[truckIdx].color.set(
            TRUCK_COLORS[e.tintIndex % TRUCK_COLORS.length]
          );
        }
        truckIdx++;
      } else if (e.kind === 'barrier' && barrierIdx < MAX_BARRIERS) {
        const g = barrierRefs.current[barrierIdx];
        if (g) {
          g.visible = true;
          g.position.set(e.x, 0, e.z);
        }
        barrierIdx++;
      } else if (e.kind === 'boulder' && boulderIdx < MAX_BOULDERS) {
        const g = boulderRefs.current[boulderIdx];
        if (g) {
          g.visible = true;
          g.position.set(e.x, 0, e.z);
          g.rotation.y = e.rotY;
        }
        boulderIdx++;
      } else if (e.kind === 'ramp' && rampIdx < MAX_RAMPS) {
        const g = rampRefs.current[rampIdx];
        if (g) {
          g.visible = true;
          g.position.set(e.x, 0, e.z);
        }
        rampIdx++;
      } else if (e.kind === 'nitro_cell' && nitroIdx < MAX_PICKUPS) {
        const g = nitroRefs.current[nitroIdx];
        if (g) {
          g.visible = true;
          g.position.set(e.x, e.y + Math.sin(t * 5 + e.id) * 0.14, e.z);
          g.rotation.y = e.rotY;
        }
        nitroIdx++;
      } else if (e.kind === 'shield_orb' && shieldIdx < MAX_PICKUPS) {
        const g = shieldRefs.current[shieldIdx];
        if (g) {
          g.visible = true;
          g.position.set(e.x, e.y + Math.sin(t * 4.5 + e.id) * 0.14, e.z);
          g.rotation.y = e.rotY;
        }
        shieldIdx++;
      }
    }

    // Hide unused instanced coins
    if (coinInstRef.current) {
      _dummy.scale.set(0, 0, 0);
      _dummy.position.set(0, -30, 0);
      _dummy.updateMatrix();
      for (let i = coinIdx; i < MAX_COINS; i++) {
        coinInstRef.current.setMatrixAt(i, _dummy.matrix);
      }
      coinInstRef.current.instanceMatrix.needsUpdate = true;
    }

    // Hide unused pooled meshes
    for (let i = truckIdx; i < MAX_TRUCKS; i++) {
      const g = truckRefs.current[i];
      if (g) g.visible = false;
    }
    for (let i = barrierIdx; i < MAX_BARRIERS; i++) {
      const g = barrierRefs.current[i];
      if (g) g.visible = false;
    }
    for (let i = boulderIdx; i < MAX_BOULDERS; i++) {
      const g = boulderRefs.current[i];
      if (g) g.visible = false;
    }
    for (let i = rampIdx; i < MAX_RAMPS; i++) {
      const g = rampRefs.current[i];
      if (g) g.visible = false;
    }
    for (let i = nitroIdx; i < MAX_PICKUPS; i++) {
      const g = nitroRefs.current[i];
      if (g) g.visible = false;
    }
    for (let i = shieldIdx; i < MAX_PICKUPS; i++) {
      const g = shieldRefs.current[i];
      if (g) g.visible = false;
    }

    // Update instanced particles (gold sparks, cyan nitro, sand dust)
    if (particleInstRef.current) {
      for (let i = 0; i < MAX_RALLY_PARTICLES; i++) {
        const p = world.particles[i];
        if (p.active) {
          const frac = Math.max(0.01, p.life / p.maxLife);
          const s = p.size * frac * 2.2;
          _dummy.position.set(p.x, p.y, p.z);
          _dummy.rotation.set(t * 4 + i, t * 3, 0);
          _dummy.scale.set(s, s, s);
          _dummy.updateMatrix();
          particleInstRef.current.setMatrixAt(i, _dummy.matrix);
          if (p.kind === 'gold') _color.set('#fde047');
          else if (p.kind === 'nitro') _color.set('#38bdf8');
          else _color.set('#e5b071');
          particleInstRef.current.setColorAt(i, _color);
        } else {
          _dummy.position.set(0, -30, 0);
          _dummy.scale.set(0, 0, 0);
          _dummy.updateMatrix();
          particleInstRef.current.setMatrixAt(i, _dummy.matrix);
        }
      }
      particleInstRef.current.instanceMatrix.needsUpdate = true;
      if (particleInstRef.current.instanceColor) {
        particleInstRef.current.instanceColor.needsUpdate = true;
      }
    }
  });

  return (
    <group>
      {/* Instanced Metallic Gold Coins */}
      <instancedMesh
        ref={coinInstRef}
        args={[undefined, undefined, MAX_COINS]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.42, 0.42, 0.11, 14]} />
        <meshStandardMaterial
          color="#fbbf24"
          emissive="#b45309"
          emissiveIntensity={0.28}
          metalness={0.88}
          roughness={0.18}
        />
      </instancedMesh>

      {/* Instanced Sparks & Desert Dust Particles */}
      <instancedMesh
        ref={particleInstRef}
        args={[undefined, undefined, MAX_RALLY_PARTICLES]}
        frustumCulled={false}
      >
        <dodecahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial roughness={0.4} metalness={0.3} />
      </instancedMesh>

      {/* Pooled Composite Rival Desert SUVs */}
      {Array.from({ length: MAX_TRUCKS }).map((_, idx) => (
        <group
          key={`truck-${idx}`}
          ref={(el) => {
            truckRefs.current[idx] = el;
          }}
          visible={false}
        >
          <mesh castShadow position={[0, 0.52, 0]} material={truckBodyMats[idx]}>
            <boxGeometry args={[1.64, 0.56, 3.05]} />
          </mesh>
          <mesh castShadow position={[0, 1.06, 0.1]}>
            <boxGeometry args={[1.42, 0.54, 1.65]} />
            <meshStandardMaterial color="#1e293b" roughness={0.25} metalness={0.6} />
          </mesh>
          {/* Rear taillights */}
          <mesh position={[-0.56, 0.62, 1.54]}>
            <boxGeometry args={[0.32, 0.14, 0.05]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
          <mesh position={[0.56, 0.62, 1.54]}>
            <boxGeometry args={[0.32, 0.14, 0.05]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
          {/* 4 Wheels */}
          {[
            [-0.84, 0.34, -0.95],
            [0.84, 0.34, -0.95],
            [-0.84, 0.34, 0.95],
            [0.84, 0.34, 0.95],
          ].map((wp, wi) => (
            <mesh
              key={wi}
              position={wp as [number, number, number]}
              rotation={[0, 0, Math.PI / 2]}
            >
              <cylinderGeometry args={[0.34, 0.34, 0.26, 10]} />
              <meshStandardMaterial color="#18181b" roughness={0.92} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Pooled Striped Jumpable Road Barriers */}
      {Array.from({ length: MAX_BARRIERS }).map((_, idx) => (
        <group
          key={`barrier-${idx}`}
          ref={(el) => {
            barrierRefs.current[idx] = el;
          }}
          visible={false}
        >
          <mesh castShadow position={[-0.72, 0.42, 0]}>
            <boxGeometry args={[0.16, 0.84, 0.2]} />
            <meshStandardMaterial color="#475569" roughness={0.7} />
          </mesh>
          <mesh castShadow position={[0.72, 0.42, 0]}>
            <boxGeometry args={[0.16, 0.84, 0.2]} />
            <meshStandardMaterial color="#475569" roughness={0.7} />
          </mesh>
          <mesh castShadow position={[0, 0.68, 0]}>
            <boxGeometry args={[1.85, 0.34, 0.24]} />
            <meshStandardMaterial color="#f97316" roughness={0.45} />
          </mesh>
          <mesh position={[0, 0.68, 0.13]}>
            <boxGeometry args={[0.62, 0.28, 0.02]} />
            <meshBasicMaterial color="#f8fafc" />
          </mesh>
        </group>
      ))}

      {/* Pooled Jumpable Canyon Boulders */}
      {Array.from({ length: MAX_BOULDERS }).map((_, idx) => (
        <group
          key={`boulder-${idx}`}
          ref={(el) => {
            boulderRefs.current[idx] = el;
          }}
          visible={false}
        >
          <mesh castShadow position={[0, 0.48, 0]} scale={[1.15, 0.82, 1.0]}>
            <dodecahedronGeometry args={[0.68, 0]} />
            <meshStandardMaterial color="#8c5439" roughness={0.95} />
          </mesh>
          <mesh position={[0.42, 0.25, 0.22]} scale={[0.65, 0.55, 0.65]}>
            <dodecahedronGeometry args={[0.5, 0]} />
            <meshStandardMaterial color="#a66b4c" roughness={0.94} />
          </mesh>
        </group>
      ))}

      {/* Pooled Glowing Desert Jump Ramps */}
      {Array.from({ length: MAX_RAMPS }).map((_, idx) => (
        <group
          key={`ramp-${idx}`}
          ref={(el) => {
            rampRefs.current[idx] = el;
          }}
          visible={false}
        >
          <mesh position={[0, 0.28, 0]} rotation={[0.24, 0, 0]}>
            <boxGeometry args={[1.95, 0.16, 2.5]} />
            <meshStandardMaterial
              color="#f59e0b"
              emissive="#d97706"
              emissiveIntensity={0.35}
              roughness={0.35}
              metalness={0.4}
            />
          </mesh>
          <mesh position={[0, 0.42, -0.45]} rotation={[0.24, 0, 0]}>
            <boxGeometry args={[1.35, 0.04, 0.45]} />
            <meshBasicMaterial color="#fef08a" />
          </mesh>
        </group>
      ))}

      {/* Pooled Cyan Nitro Cells */}
      {Array.from({ length: MAX_PICKUPS }).map((_, idx) => (
        <group
          key={`nitro-${idx}`}
          ref={(el) => {
            nitroRefs.current[idx] = el;
          }}
          visible={false}
        >
          <mesh>
            <cylinderGeometry args={[0.28, 0.28, 0.82, 10]} />
            <meshStandardMaterial
              color="#06b6d4"
              emissive="#0ea5e9"
              emissiveIntensity={0.65}
              metalness={0.65}
              roughness={0.2}
            />
          </mesh>
          <mesh position={[0, 0.46, 0]}>
            <cylinderGeometry args={[0.16, 0.24, 0.16, 10]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.85} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* Pooled Shield Orbs */}
      {Array.from({ length: MAX_PICKUPS }).map((_, idx) => (
        <group
          key={`shield-${idx}`}
          ref={(el) => {
            shieldRefs.current[idx] = el;
          }}
          visible={false}
        >
          <mesh>
            <octahedronGeometry args={[0.42, 0]} />
            <meshStandardMaterial
              color="#34d399"
              emissive="#059669"
              emissiveIntensity={0.6}
              metalness={0.5}
              roughness={0.2}
            />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.56, 0.05, 8, 20]} />
            <meshBasicMaterial color="#a7f3d0" />
          </mesh>
        </group>
      ))}
    </group>
  );
};
