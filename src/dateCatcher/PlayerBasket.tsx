import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { BASKET_Y } from './types';
import { DateCatcherWorld } from './gameLogic';

interface PlayerBasketProps {
  worldRef: React.MutableRefObject<DateCatcherWorld>;
}

/**
 * Generates a crisp woven palm-frond (خوص) CanvasTexture with diagonal herringbone/checker weave.
 */
function createWovenBasketTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#d4a359';
    ctx.fillRect(0, 0, 256, 128);

    const cellW = 16;
    const cellH = 16;
    for (let y = 0; y < 128; y += cellH) {
      for (let x = 0; x < 256; x += cellW) {
        const even = ((x / cellW) + (y / cellH)) % 2 === 0;
        ctx.fillStyle = even ? '#e6bc73' : '#b8833e';
        ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);
        // Subtle diagonal weave highlight
        ctx.strokeStyle = even ? '#f3d395' : '#966528';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(x + 2, y + cellH - 2);
        ctx.lineTo(x + cellW - 2, y + 2);
        ctx.stroke();
      }
    }
    // Traditional dark red-ochre geometric band around the middle of the woven basket
    ctx.fillStyle = '#9a3412';
    ctx.fillRect(0, 52, 256, 10);
    ctx.fillStyle = '#fef3c7';
    for (let x = 4; x < 256; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, 57);
      ctx.lineTo(x + 4, 53);
      ctx.lineTo(x + 8, 57);
      ctx.lineTo(x + 4, 61);
      ctx.closePath();
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 1);
  tex.anisotropy = Math.min(8, maxAnisotropy);
  return tex;
}

export const PlayerBasket: React.FC<PlayerBasketProps> = ({ worldRef }) => {
  const { gl } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const bodyScaleRef = useRef<THREE.Group>(null);
  const shieldRef = useRef<THREE.Mesh>(null);
  const magnetRingRef = useRef<THREE.Mesh>(null);
  const bodyMatRef = useRef<THREE.MeshStandardMaterial>(null);

  const weaveTex = useMemo(
    () => createWovenBasketTexture(gl.capabilities.getMaxAnisotropy()),
    [gl]
  );

  useEffect(() => {
    return () => {
      weaveTex.dispose();
    };
  }, [weaveTex]);

  useFrame(({ clock }) => {
    const world = worldRef.current;
    const g = groupRef.current;
    if (!g) return;

    const bounceY = Math.sin(world.basketBounce * Math.PI) * 0.16;
    g.position.set(world.basketX, BASKET_Y + bounceY, 0);
    g.rotation.z = world.basketTilt;

    if (bodyScaleRef.current) {
      const squashY = 1 + Math.sin(world.basketBounce * Math.PI) * 0.12;
      bodyScaleRef.current.scale.set(world.basketWidthScale, squashY, 1);
    }

    if (bodyMatRef.current) {
      if (world.basketHitFlash > 0.01) {
        bodyMatRef.current.emissive.setRGB(
          0.65 * world.basketHitFlash,
          0.12 * world.basketHitFlash,
          0.08 * world.basketHitFlash
        );
      } else {
        bodyMatRef.current.emissive.setRGB(0, 0, 0);
      }
    }

    const activeKind = world.activePowerUp?.kind ?? null;
    if (shieldRef.current) {
      shieldRef.current.visible = activeKind === 'shield';
      if (shieldRef.current.visible) {
        const pulse = 1 + Math.sin(clock.getElapsedTime() * 6) * 0.04;
        shieldRef.current.scale.set(
          world.basketWidthScale * pulse,
          pulse,
          pulse
        );
      }
    }

    if (magnetRingRef.current) {
      magnetRingRef.current.visible = activeKind === 'magnet';
      if (magnetRingRef.current.visible) {
        magnetRingRef.current.rotation.z = clock.getElapsedTime() * 2.8;
        const p = 1 + Math.sin(clock.getElapsedTime() * 7) * 0.08;
        magnetRingRef.current.scale.set(
          world.basketWidthScale * p,
          p,
          1
        );
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, BASKET_Y, 0]}>
      {/* Grounded contact shadow beneath basket */}
      <mesh position={[0, -BASKET_Y + 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.02, 20]} />
        <meshBasicMaterial color="#4a2b12" transparent opacity={0.35} depthWrite={false} />
      </mesh>

      {/* Scalable woven basket assembly (multi-part composite) */}
      <group ref={bodyScaleRef}>
        {/* Outer woven palm basket body (flared low-poly cylinder) */}
        <mesh castShadow receiveShadow position={[0, 0.04, 0]}>
          <cylinderGeometry args={[0.92, 0.58, 0.62, 16, 1, false]} />
          <meshStandardMaterial
            ref={bodyMatRef}
            map={weaveTex}
            roughness={0.82}
            metalness={0.04}
          />
        </mesh>

        {/* Inner dark warm hollow */}
        <mesh position={[0, 0.31, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.84, 16]} />
          <meshStandardMaterial color="#6e471e" roughness={0.95} />
        </mesh>

        {/* Thick braided palm rim */}
        <mesh castShadow position={[0, 0.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.91, 0.085, 8, 20]} />
          <meshStandardMaterial color="#e8c37d" roughness={0.75} metalness={0.05} />
        </mesh>

        {/* Lower braided reinforcement ring */}
        <mesh position={[0, -0.22, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.6, 0.05, 6, 16]} />
          <meshStandardMaterial color="#9e6d32" roughness={0.88} />
        </mesh>

        {/* Left & Right woven handles */}
        <mesh castShadow position={[-0.92, 0.2, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.16, 0.045, 6, 12, Math.PI]} />
          <meshStandardMaterial color="#c9954c" roughness={0.8} />
        </mesh>
        <mesh castShadow position={[0.92, 0.2, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <torusGeometry args={[0.16, 0.045, 6, 12, Math.PI]} />
          <meshStandardMaterial color="#c9954c" roughness={0.8} />
        </mesh>
      </group>

      {/* Protective Shield Dome (visible when Shield power-up active) */}
      <mesh ref={shieldRef} visible={false} position={[0, 0.25, 0]}>
        <sphereGeometry args={[1.18, 20, 14]} />
        <meshStandardMaterial
          color="#34d399"
          emissive="#10b981"
          emissiveIntensity={0.45}
          transparent
          opacity={0.28}
          roughness={0.2}
          depthWrite={false}
        />
      </mesh>

      {/* Magnet Aura Ring (visible when Magnet power-up active) */}
      <mesh
        ref={magnetRingRef}
        visible={false}
        position={[0, 0.38, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <torusGeometry args={[1.32, 0.045, 8, 24]} />
        <meshStandardMaterial
          color="#fb7185"
          emissive="#f43f5e"
          emissiveIntensity={0.85}
          roughness={0.25}
        />
      </mesh>
    </group>
  );
};
