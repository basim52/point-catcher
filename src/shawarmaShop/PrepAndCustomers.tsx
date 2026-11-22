import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { CUSTOMER_SLOT_X, MAX_SHAWARMA_PARTICLES } from './types';
import { ShawarmaWorld } from './gameLogic';

interface PrepAndCustomersProps {
  worldRef: React.MutableRefObject<ShawarmaWorld>;
}

const _dummy = new THREE.Object3D();
const _color = new THREE.Color();

export const PrepAndCustomers: React.FC<PrepAndCustomersProps> = ({
  worldRef,
}) => {
  const breadRef = useRef<THREE.Group>(null);
  const meatRef = useRef<THREE.Group>(null);
  const garlicRef = useRef<THREE.Group>(null);
  const picklesRef = useRef<THREE.Group>(null);
  const friesRef = useRef<THREE.Group>(null);
  const spicyRef = useRef<THREE.Group>(null);
  const pomegranateRef = useRef<THREE.Group>(null);
  const cheeseRef = useRef<THREE.Group>(null);

  // Selected drink beside cutting board
  const traySuntopRef = useRef<THREE.Group>(null);
  const trayAyranRef = useRef<THREE.Group>(null);

  // Flying served Shawarma + drink
  const wrappedFlyRef = useRef<THREE.Group>(null);
  const flySuntopRef = useRef<THREE.Group>(null);
  const flyAyranRef = useRef<THREE.Group>(null);

  const customerRefs = useRef<(THREE.Group | null)[]>([]);
  const shirtMats = useMemo(
    () =>
      [0, 1, 2].map(
        () => new THREE.MeshStandardMaterial({ color: '#2563eb', roughness: 0.72 })
      ),
    []
  );
  const ghutraRefs = useRef<(THREE.Group | null)[]>([]);
  const capRefs = useRef<(THREE.Group | null)[]>([]);
  const hairRefs = useRef<(THREE.Mesh | null)[]>([]);
  const particleInstRef = useRef<THREE.InstancedMesh>(null);

  useFrame(({ clock }) => {
    const world = worldRef.current;
    const wb = world.workbench;
    const t = clock.getElapsedTime();

    // Update live 3D Shawarma layers on the wooden cutting board
    if (breadRef.current) breadRef.current.visible = wb.hasBread;
    if (meatRef.current) meatRef.current.visible = wb.hasMeat;
    if (garlicRef.current) garlicRef.current.visible = wb.toppings.includes('garlic');
    if (picklesRef.current) picklesRef.current.visible = wb.toppings.includes('pickles');
    if (friesRef.current) friesRef.current.visible = wb.toppings.includes('fries');
    if (spicyRef.current) spicyRef.current.visible = wb.toppings.includes('spicy');
    if (pomegranateRef.current)
      pomegranateRef.current.visible = wb.toppings.includes('pomegranate');
    if (cheeseRef.current) cheeseRef.current.visible = wb.toppings.includes('cheese');

    // Update selected drink next to cutting board
    if (traySuntopRef.current) traySuntopRef.current.visible = wb.drink === 'suntop';
    if (trayAyranRef.current) trayAyranRef.current.visible = wb.drink === 'ayran';

    // Animate freshly wrapped foil Shawarma (+ drink) sliding to served customer
    if (wrappedFlyRef.current) {
      if (world.serveAnimTimer > 0) {
        wrappedFlyRef.current.visible = true;
        const p = 1 - world.serveAnimTimer / 0.55;
        const x = THREE.MathUtils.lerp(0, world.serveTargetX, p);
        const y = 1.32 + Math.sin(p * Math.PI) * 0.65;
        const z = THREE.MathUtils.lerp(0.95, -0.75, p);
        wrappedFlyRef.current.position.set(x, y, z);
        wrappedFlyRef.current.rotation.y = p * 2.2;
        if (flySuntopRef.current)
          flySuntopRef.current.visible = world.serveHasDrink === 'suntop';
        if (flyAyranRef.current)
          flyAyranRef.current.visible = world.serveHasDrink === 'ayran';
      } else {
        wrappedFlyRef.current.visible = false;
      }
    }

    // Update 3 composite 3D customers standing at the shop window
    for (let i = 0; i < 3; i++) {
      const grp = customerRefs.current[i];
      const cust = world.customers[i];
      if (!grp) continue;
      if (!cust) {
        grp.visible = false;
        continue;
      }
      grp.visible = true;
      const enter = Math.max(0, Math.min(1, cust.entered));
      const impatience =
        !cust.leaving && cust.patience / Math.max(1, cust.maxPatience) < 0.35
          ? Math.sin(t * 14 + i) * 0.08
          : 0;
      const happyHop =
        cust.leaving && cust.happy ? Math.abs(Math.sin(t * 16)) * 0.22 : 0;
      const idleBob = Math.sin(t * 2.6 + i * 1.4) * 0.035;

      const x = CUSTOMER_SLOT_X[i] + impatience;
      const z = THREE.MathUtils.lerp(-3.2, -1.25, enter);
      grp.position.set(x, idleBob + happyHop, z);
      shirtMats[i].color.set(cust.shirtColor);

      const gRef = ghutraRefs.current[i];
      const cRef = capRefs.current[i];
      const hRef = hairRefs.current[i];
      if (gRef) gRef.visible = cust.headwear === 'ghutra';
      if (cRef) cRef.visible = cust.headwear === 'cap';
      if (hRef) hRef.visible = cust.headwear === 'hair';
    }

    // Update InstancedMesh steam, sizzle & coin particles
    if (particleInstRef.current) {
      for (let i = 0; i < MAX_SHAWARMA_PARTICLES; i++) {
        const p = world.particles[i];
        if (p.active) {
          const frac = Math.max(0.01, p.life / p.maxLife);
          const s =
            p.size * (p.kind === 'steam' ? 1.4 + (1 - frac) * 1.5 : frac * 1.8);
          _dummy.position.set(p.x, p.y, p.z);
          _dummy.rotation.set(t * 3 + i, t * 4, 0);
          _dummy.scale.set(s, s, s);
          _dummy.updateMatrix();
          particleInstRef.current.setMatrixAt(i, _dummy.matrix);
          if (p.kind === 'coin') _color.set('#fbbf24');
          else if (p.kind === 'sizzle') _color.set('#fb923c');
          else _color.set('#fff7ed');
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
      {/* LIVE 3D SHAWARMA ASSEMBLY ON THE CUTTING BOARD */}
      <group position={[0, 1.24, 0.95]}>
        {/* Step 1: Golden Toasted Saj Flatbread */}
        <group ref={breadRef} visible={false}>
          <mesh receiveShadow castShadow>
            <cylinderGeometry args={[0.52, 0.52, 0.025, 20]} />
            <meshStandardMaterial color="#f3d299" roughness={0.82} />
          </mesh>
          <mesh position={[-0.14, 0.015, 0.08]}>
            <cylinderGeometry args={[0.09, 0.09, 0.005, 8]} />
            <meshStandardMaterial color="#c99552" roughness={0.9} />
          </mesh>
          <mesh position={[0.16, 0.015, -0.1]}>
            <cylinderGeometry args={[0.07, 0.07, 0.005, 8]} />
            <meshStandardMaterial color="#c99552" roughness={0.9} />
          </mesh>
        </group>

        {/* Step 2: Juicy Sliced Shawarma Meat Strips */}
        <group ref={meatRef} visible={false} position={[0, 0.055, 0]}>
          {[
            [-0.18, 0, -0.05, 0.2],
            [0.0, 0.02, 0.02, -0.15],
            [0.18, 0, -0.02, 0.35],
            [-0.08, 0.04, 0.09, -0.4],
            [0.1, 0.04, 0.08, 0.5],
          ].map(([mx, my, mz, rot], idx) => (
            <mesh
              key={idx}
              position={[mx, my, mz]}
              rotation={[0, rot, 0]}
              castShadow
            >
              <boxGeometry args={[0.24, 0.055, 0.12]} />
              <meshStandardMaterial
                color={idx % 2 === 0 ? '#8c3b16' : '#a64b20'}
                roughness={0.5}
              />
            </mesh>
          ))}
        </group>

        {/* Topping: Creamy White Garlic Sauce (ثومية) */}
        <group ref={garlicRef} visible={false} position={[0, 0.11, 0]}>
          {[-0.16, 0, 0.16].map((gx, i) => (
            <mesh
              key={i}
              position={[gx, 0, i % 2 === 0 ? -0.04 : 0.05]}
              scale={[1.2, 0.55, 0.9]}
            >
              <sphereGeometry args={[0.08, 10, 8]} />
              <meshStandardMaterial color="#fffbeb" roughness={0.28} />
            </mesh>
          ))}
        </group>

        {/* Topping: Crisp Green Pickles (مخلل) */}
        <group ref={picklesRef} visible={false} position={[0, 0.105, 0]}>
          {[
            [-0.2, 0, 0.14],
            [0.02, 0.01, -0.15],
            [0.2, 0, 0.11],
          ].map(([px, py, pz], i) => (
            <mesh key={i} position={[px, py, pz]}>
              <cylinderGeometry args={[0.075, 0.075, 0.028, 10]} />
              <meshStandardMaterial color="#22c55e" roughness={0.45} />
            </mesh>
          ))}
        </group>

        {/* Topping: Golden Crispy Fries (بطاطس) */}
        <group ref={friesRef} visible={false} position={[0, 0.11, 0]}>
          {[
            [-0.14, 0, -0.1, 0.3],
            [0.04, 0.02, 0.12, -0.25],
            [0.16, 0.01, -0.08, 0.55],
            [-0.04, 0.03, 0.02, 0.1],
          ].map(([fx, fy, fz, rot], i) => (
            <mesh key={i} position={[fx, fy, fz]} rotation={[0, rot, 0]}>
              <boxGeometry args={[0.26, 0.04, 0.045]} />
              <meshStandardMaterial color="#facc15" roughness={0.55} />
            </mesh>
          ))}
        </group>

        {/* Topping: Fiery Red Chili Sauce (شطة) */}
        <group ref={spicyRef} visible={false} position={[0, 0.125, 0]}>
          {[-0.14, 0.02, 0.16].map((sx, i) => (
            <mesh
              key={i}
              position={[sx, 0, i % 2 === 0 ? 0.06 : -0.06]}
              scale={[1.1, 0.45, 0.85]}
            >
              <sphereGeometry args={[0.065, 8, 6]} />
              <meshStandardMaterial color="#ef4444" roughness={0.25} />
            </mesh>
          ))}
        </group>

        {/* Topping Unlock: Deep Ruby Pomegranate Molasses Drizzle (دبس رمان) */}
        <group ref={pomegranateRef} visible={false} position={[0, 0.135, 0]}>
          {[
            [-0.18, 0, 0.02, 0.4],
            [0.02, 0.01, -0.06, -0.35],
            [0.18, 0, 0.05, 0.5],
          ].map(([rx, ry, rz, rot], i) => (
            <mesh key={i} position={[rx, ry, rz]} rotation={[0, rot, 0]}>
              <boxGeometry args={[0.22, 0.024, 0.045]} />
              <meshStandardMaterial
                color="#881337"
                roughness={0.14}
                metalness={0.2}
              />
            </mesh>
          ))}
        </group>

        {/* Topping Unlock: Golden Melted Cheddar Ribbons (جبنة شيدر) */}
        <group ref={cheeseRef} visible={false} position={[0, 0.14, 0]}>
          {[-0.12, 0.08].map((cx, i) => (
            <mesh
              key={i}
              position={[cx, 0, i === 0 ? -0.02 : 0.04]}
              rotation={[0, i === 0 ? 0.2 : -0.25, 0]}
            >
              <boxGeometry args={[0.3, 0.028, 0.11]} />
              <meshStandardMaterial
                color="#f59e0b"
                emissive="#b45309"
                emissiveIntensity={0.2}
                roughness={0.24}
              />
            </mesh>
          ))}
        </group>

        {/* Selected Drink on Board Tray: Sun Top Orange Carton */}
        <group ref={traySuntopRef} visible={false} position={[0.62, 0.14, 0.12]}>
          <mesh castShadow>
            <boxGeometry args={[0.16, 0.26, 0.12]} />
            <meshStandardMaterial color="#f97316" roughness={0.35} />
          </mesh>
          <mesh position={[0, 0.02, 0.062]}>
            <boxGeometry args={[0.12, 0.08, 0.01]} />
            <meshStandardMaterial color="#fef08a" roughness={0.4} />
          </mesh>
          <mesh position={[0.04, 0.17, 0]} rotation={[0, 0, -0.25]}>
            <cylinderGeometry args={[0.012, 0.012, 0.12, 6]} />
            <meshStandardMaterial color="#fde047" roughness={0.4} />
          </mesh>
        </group>

        {/* Selected Drink on Board Tray: Cold Ayran Cup */}
        <group ref={trayAyranRef} visible={false} position={[0.62, 0.13, 0.12]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.095, 0.072, 0.24, 12]} />
            <meshStandardMaterial color="#f0f9ff" roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.125, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.022, 12]} />
            <meshStandardMaterial color="#10b981" roughness={0.35} />
          </mesh>
        </group>
      </group>

      {/* WRAPPED FOIL SHAWARMA (+ OPTIONAL DRINK) FLYING TO SERVED CUSTOMER */}
      <group ref={wrappedFlyRef} visible={false}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.13, 0.13, 0.62, 12]} />
          <meshStandardMaterial color="#e6b66e" roughness={0.72} />
        </mesh>
        <mesh position={[-0.12, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.14, 0.14, 0.38, 12]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.45} />
        </mesh>
        <mesh position={[-0.02, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.143, 0.143, 0.06, 12]} />
          <meshStandardMaterial color="#dc2626" roughness={0.4} />
        </mesh>

        {/* Flying Sun Top */}
        <group ref={flySuntopRef} visible={false} position={[0.42, 0.04, 0.05]}>
          <mesh>
            <boxGeometry args={[0.14, 0.24, 0.1]} />
            <meshStandardMaterial color="#f97316" roughness={0.35} />
          </mesh>
          <mesh position={[0.03, 0.15, 0]} rotation={[0, 0, -0.2]}>
            <cylinderGeometry args={[0.01, 0.01, 0.1, 6]} />
            <meshStandardMaterial color="#fde047" />
          </mesh>
        </group>

        {/* Flying Cold Ayran */}
        <group ref={flyAyranRef} visible={false} position={[0.42, 0.04, 0.05]}>
          <mesh>
            <cylinderGeometry args={[0.085, 0.065, 0.22, 10]} />
            <meshStandardMaterial color="#f0f9ff" roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.115, 0]}>
            <cylinderGeometry args={[0.09, 0.09, 0.02, 10]} />
            <meshStandardMaterial color="#10b981" />
          </mesh>
        </group>
      </group>

      {/* 3 ANIMATED COMPOSITE 3D CUSTOMERS AT THE SERVING WINDOW */}
      {[0, 1, 2].map((slotIdx) => (
        <group
          key={slotIdx}
          ref={(el) => {
            customerRefs.current[slotIdx] = el;
          }}
          visible={false}
          position={[CUSTOMER_SLOT_X[slotIdx], 0, -1.25]}
        >
          <mesh castShadow position={[0, 1.48, 0]} material={shirtMats[slotIdx]}>
            <cylinderGeometry args={[0.36, 0.42, 0.92, 12]} />
          </mesh>
          <mesh
            castShadow
            position={[-0.44, 1.48, 0.06]}
            rotation={[0.25, 0, 0.18]}
            material={shirtMats[slotIdx]}
          >
            <capsuleGeometry args={[0.11, 0.46, 6, 8]} />
          </mesh>
          <mesh
            castShadow
            position={[0.44, 1.48, 0.06]}
            rotation={[0.25, 0, -0.18]}
            material={shirtMats[slotIdx]}
          >
            <capsuleGeometry args={[0.11, 0.46, 6, 8]} />
          </mesh>
          <mesh castShadow position={[0, 2.24, 0]}>
            <sphereGeometry args={[0.3, 14, 12]} />
            <meshStandardMaterial color="#f1c29b" roughness={0.68} />
          </mesh>
          <mesh position={[-0.1, 2.28, 0.26]}>
            <sphereGeometry args={[0.042, 8, 8]} />
            <meshBasicMaterial color="#18181b" />
          </mesh>
          <mesh position={[0.1, 2.28, 0.26]}>
            <sphereGeometry args={[0.042, 8, 8]} />
            <meshBasicMaterial color="#18181b" />
          </mesh>
          <mesh position={[0, 2.15, 0.27]} rotation={[0, 0, Math.PI]}>
            <torusGeometry args={[0.06, 0.015, 6, 12, Math.PI]} />
            <meshBasicMaterial color="#7c2d12" />
          </mesh>

          <group
            ref={(el) => {
              ghutraRefs.current[slotIdx] = el;
            }}
            visible={false}
          >
            <mesh position={[0, 2.34, -0.02]}>
              <sphereGeometry
                args={[0.315, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.62]}
              />
              <meshStandardMaterial color="#fef2f2" roughness={0.78} />
            </mesh>
            <mesh position={[0, 2.12, -0.22]}>
              <boxGeometry args={[0.52, 0.48, 0.14]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.8} />
            </mesh>
            <mesh position={[0, 2.48, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.24, 0.036, 8, 18]} />
              <meshStandardMaterial color="#18181b" roughness={0.65} />
            </mesh>
          </group>

          <group
            ref={(el) => {
              capRefs.current[slotIdx] = el;
            }}
            visible={false}
          >
            <mesh position={[0, 2.38, 0]}>
              <sphereGeometry
                args={[0.31, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.5]}
              />
              <meshStandardMaterial color="#ea580c" roughness={0.7} />
            </mesh>
            <mesh position={[0, 2.36, 0.26]}>
              <boxGeometry args={[0.38, 0.04, 0.24]} />
              <meshStandardMaterial color="#c2410c" roughness={0.7} />
            </mesh>
          </group>

          <mesh
            ref={(el) => {
              hairRefs.current[slotIdx] = el;
            }}
            visible={false}
            position={[0, 2.38, -0.04]}
          >
            <sphereGeometry
              args={[0.32, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.58]}
            />
            <meshStandardMaterial color="#271c19" roughness={0.85} />
          </mesh>
        </group>
      ))}

      {/* Instanced Steam, Sizzle & Gold Coin Particles */}
      <instancedMesh
        ref={particleInstRef}
        args={[undefined, undefined, MAX_SHAWARMA_PARTICLES]}
        frustumCulled={false}
      >
        <dodecahedronGeometry args={[0.45, 0]} />
        <meshStandardMaterial roughness={0.35} metalness={0.35} />
      </instancedMesh>
    </group>
  );
};
