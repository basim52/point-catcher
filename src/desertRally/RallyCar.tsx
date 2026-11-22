import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { PLAYER_Z } from './types';
import { DesertRallyWorld } from './gameLogic';

interface RallyCarProps {
  worldRef: React.MutableRefObject<DesertRallyWorld>;
}

/**
 * Composite 12-part procedural 3D Desert Rally Buggy:
 * - Sculpted primary chassis & raised desert hood
 * - Tinted polycarbonate canopy & tubular roll cage
 * - Roof LED light bar, rear rally wing spoiler, twin chrome exhausts
 * - 4 rotating off-road wheels with metallic rims
 * - Grounded contact shadow, shield dome, and animated dual nitro exhaust flames
 */
export const RallyCar: React.FC<RallyCarProps> = ({ worldRef }) => {
  const rootRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const shadowRef = useRef<THREE.Mesh>(null);
  const shieldRef = useRef<THREE.Mesh>(null);
  const flamesRef = useRef<THREE.Group>(null);
  const wheelRefs = useRef<(THREE.Group | null)[]>([]);

  const shadowTex = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const ctx = c.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(64, 64, 12, 64, 64, 60);
      grad.addColorStop(0, 'rgba(30, 14, 5, 0.58)');
      grad.addColorStop(1, 'rgba(30, 14, 5, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  useEffect(() => {
    return () => {
      shadowTex.dispose();
    };
  }, [shadowTex]);

  useFrame(({ clock }) => {
    const world = worldRef.current;
    const t = clock.getElapsedTime();

    if (rootRef.current) {
      rootRef.current.position.set(world.carX, world.carY, PLAYER_Z);
    }

    if (bodyRef.current) {
      // Subtle suspension hum + dynamic roll & jump pitch
      const hum = world.carY <= 0.02 ? Math.sin(t * 28) * 0.015 : 0;
      bodyRef.current.position.y = hum;
      bodyRef.current.rotation.z = world.carRoll;
      bodyRef.current.rotation.x = world.carPitch;
      // Blink gently during post-hit invulnerability
      bodyRef.current.visible =
        world.invulnTimer <= 0 || Math.floor(t * 16) % 2 === 0;
    }

    if (shadowRef.current) {
      const airShrink = Math.max(0.45, 1 - world.carY * 0.18);
      shadowRef.current.position.set(world.carX, 0.03, PLAYER_Z);
      shadowRef.current.scale.set(airShrink, airShrink, 1);
    }

    for (let i = 0; i < wheelRefs.current.length; i++) {
      const w = wheelRefs.current[i];
      if (w) {
        w.rotation.x = -world.wheelSpin;
      }
    }

    if (shieldRef.current) {
      shieldRef.current.visible = world.shieldActive;
      if (world.shieldActive) {
        shieldRef.current.rotation.y = t * 1.4;
      }
    }

    if (flamesRef.current) {
      const boosting = world.nitroTimer > 0;
      flamesRef.current.visible = boosting;
      if (boosting) {
        const pulse = 0.85 + Math.sin(t * 48) * 0.25;
        flamesRef.current.scale.set(1, 1, pulse);
      }
    }
  });

  const wheelPositions: [number, number, number][] = [
    [-0.78, 0.34, -0.82],
    [0.78, 0.34, -0.82],
    [-0.82, 0.36, 0.8],
    [0.82, 0.36, 0.8],
  ];

  return (
    <>
      {/* Grounded contact shadow directly on asphalt */}
      <mesh
        ref={shadowRef}
        position={[0, 0.03, PLAYER_Z]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[2.3, 3.4]} />
        <meshBasicMaterial
          map={shadowTex}
          transparent
          depthWrite={false}
          opacity={0.78}
        />
      </mesh>

      <group ref={rootRef} position={[0, 0, PLAYER_Z]}>
        <group ref={bodyRef}>
          {/* Lower rugged chassis skid plate */}
          <mesh castShadow receiveShadow position={[0, 0.34, 0]}>
            <boxGeometry args={[1.42, 0.24, 2.55]} />
            <meshStandardMaterial color="#1f2937" roughness={0.82} metalness={0.25} />
          </mesh>

          {/* Main sculpted desert-rally crimson-orange body */}
          <mesh castShadow receiveShadow position={[0, 0.56, 0.05]}>
            <boxGeometry args={[1.52, 0.38, 2.38]} />
            <meshPhysicalMaterial
              color="#ea580c"
              roughness={0.28}
              metalness={0.38}
              clearcoat={0.7}
              clearcoatRoughness={0.2}
            />
          </mesh>

          {/* Racing white & gold center hood stripe */}
          <mesh position={[0, 0.76, -0.58]}>
            <boxGeometry args={[0.38, 0.02, 1.08]} />
            <meshStandardMaterial color="#fef3c7" roughness={0.35} />
          </mesh>

          {/* Sloped cockpit canopy */}
          <mesh castShadow position={[0, 0.94, 0.14]}>
            <boxGeometry args={[1.18, 0.44, 1.18]} />
            <meshPhysicalMaterial
              color="#0f172a"
              roughness={0.14}
              metalness={0.72}
              clearcoat={1.0}
            />
          </mesh>

          {/* Roof rally rack + bright LED light bar */}
          <mesh position={[0, 1.19, -0.26]}>
            <boxGeometry args={[0.96, 0.09, 0.14]} />
            <meshStandardMaterial color="#334155" roughness={0.6} metalness={0.5} />
          </mesh>
          <mesh position={[0, 1.19, -0.34]}>
            <boxGeometry args={[0.84, 0.055, 0.04]} />
            <meshBasicMaterial color="#fef08a" />
          </mesh>

          {/* Rear rally wing spoiler (two uprights + airfoil) */}
          <mesh castShadow position={[-0.54, 0.92, 1.05]}>
            <boxGeometry args={[0.08, 0.38, 0.24]} />
            <meshStandardMaterial color="#1e293b" roughness={0.5} metalness={0.4} />
          </mesh>
          <mesh castShadow position={[0.54, 0.92, 1.05]}>
            <boxGeometry args={[0.08, 0.38, 0.24]} />
            <meshStandardMaterial color="#1e293b" roughness={0.5} metalness={0.4} />
          </mesh>
          <mesh castShadow position={[0, 1.11, 1.09]} rotation={[0.14, 0, 0]}>
            <boxGeometry args={[1.56, 0.08, 0.34]} />
            <meshStandardMaterial color="#c2410c" roughness={0.3} metalness={0.45} />
          </mesh>

          {/* Front bumper bull bar & twin headlights */}
          <mesh position={[0, 0.42, -1.28]}>
            <boxGeometry args={[1.38, 0.14, 0.16]} />
            <meshStandardMaterial color="#475569" roughness={0.45} metalness={0.75} />
          </mesh>
          <mesh position={[-0.5, 0.58, -1.16]}>
            <boxGeometry args={[0.28, 0.12, 0.06]} />
            <meshBasicMaterial color="#fffbeb" />
          </mesh>
          <mesh position={[0.5, 0.58, -1.16]}>
            <boxGeometry args={[0.28, 0.12, 0.06]} />
            <meshBasicMaterial color="#fffbeb" />
          </mesh>

          {/* Rear glowing brake lights & twin chrome exhausts */}
          <mesh position={[-0.52, 0.62, 1.25]}>
            <boxGeometry args={[0.3, 0.11, 0.05]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
          <mesh position={[0.52, 0.62, 1.25]}>
            <boxGeometry args={[0.3, 0.11, 0.05]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
          <mesh position={[-0.36, 0.36, 1.32]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.09, 0.24, 10]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.22} metalness={0.92} />
          </mesh>
          <mesh position={[0.36, 0.36, 1.32]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.09, 0.24, 10]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.22} metalness={0.92} />
          </mesh>

          {/* 4 Rotating Off-Road Tires with Metallic Alloy Rims */}
          {wheelPositions.map((pos, idx) => (
            <group
              key={idx}
              ref={(el) => {
                wheelRefs.current[idx] = el;
              }}
              position={pos}
            >
              <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.34, 0.34, 0.28, 14]} />
                <meshStandardMaterial color="#18181b" roughness={0.92} />
              </mesh>
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.19, 0.19, 0.3, 8]} />
                <meshStandardMaterial color="#e2e8f0" roughness={0.25} metalness={0.85} />
              </mesh>
            </group>
          ))}

          {/* Twin Nitro Exhaust Thruster Flames */}
          <group ref={flamesRef} visible={false}>
            <mesh position={[-0.36, 0.36, 1.95]} rotation={[Math.PI / 2, 0, 0]}>
              <coneGeometry args={[0.15, 1.05, 8]} />
              <meshBasicMaterial color="#38bdf8" transparent opacity={0.88} />
            </mesh>
            <mesh position={[0.36, 0.36, 1.95]} rotation={[Math.PI / 2, 0, 0]}>
              <coneGeometry args={[0.15, 1.05, 8]} />
              <meshBasicMaterial color="#38bdf8" transparent opacity={0.88} />
            </mesh>
          </group>

          {/* Protective Energy Shield Dome */}
          <mesh ref={shieldRef} visible={false} position={[0, 0.68, 0]}>
            <sphereGeometry args={[1.68, 20, 14]} />
            <meshPhysicalMaterial
              color="#38bdf8"
              emissive="#0284c7"
              emissiveIntensity={0.45}
              transparent
              opacity={0.26}
              roughness={0.12}
              depthWrite={false}
            />
          </mesh>
        </group>
      </group>
    </>
  );
};
