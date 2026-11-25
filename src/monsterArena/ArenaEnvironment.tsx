import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ARENA_RADIUS } from './types';

interface ArenaEnvironmentProps {
  isSoftwareGl: boolean;
  onFloorClick?: (x: number, z: number) => void;
}

/**
 * Procedural 512x512 sandstone/basalt colosseum arena tile texture
 */
function createArenaFloorTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#1b3147';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle glacial slate flagstones grid
    const tile = 64;
    for (let gx = 0; gx < 8; gx++) {
      for (let gy = 0; gy < 8; gy++) {
        const shade = ((gx * 7 + gy * 13) % 5) * 4;
        ctx.fillStyle = `rgb(${34 + shade}, ${60 + shade}, ${86 + shade})`;
        ctx.fillRect(gx * tile + 2, gy * tile + 2, tile - 4, tile - 4);
      }
    }

    // Fine frost-stone grain
    for (let i = 0; i < 900; i++) {
      const rx = Math.random() * 512;
      const ry = Math.random() * 512;
      ctx.fillStyle =
        Math.random() > 0.5 ? 'rgba(186,230,253,0.06)' : 'rgba(6,16,28,0.1)';
      ctx.fillRect(rx, ry, 2, 2);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(9, 9);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, maxAnisotropy);
  return tex;
}

export const ArenaEnvironment: React.FC<ArenaEnvironmentProps> = ({
  isSoftwareGl,
  onFloorClick,
}) => {
  const { scene, gl } = useThree();
  const flameRefs = useRef<Array<THREE.Mesh | null>>([]);

  // Mandatory procedural RoomEnvironment for PBR reflections on armor & weapons
  useEffect(() => {
    let envTarget: THREE.WebGLRenderTarget | null = null;
    try {
      const pmrem = new THREE.PMREMGenerator(gl);
      envTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);
      scene.environment = envTarget.texture;
      pmrem.dispose();
    } catch {
      // Safe fallback if software WebGL cannot generate PMREM
    }
    return () => {
      scene.environment = null;
      envTarget?.dispose();
    };
  }, [gl, scene]);

  const floorTex = useMemo(
    () => createArenaFloorTexture(gl.capabilities.getMaxAnisotropy()),
    [gl]
  );

  useEffect(() => {
    return () => {
      floorTex.dispose();
    };
  }, [floorTex]);

  // 8 Ancient Colosseum Pillars around the circular battle ring
  const pillars = useMemo(() => {
    return Array.from({ length: 8 }, (_, idx) => {
      const ang = (idx / 8) * Math.PI * 2 + Math.PI / 8;
      const r = ARENA_RADIUS + 1.35;
      return {
        x: Math.cos(ang) * r,
        z: Math.sin(ang) * r,
        rotY: -ang,
      };
    });
  }, []);

  // Natural outer volcanic canyon boulders so the outdoor arena extends organically into horizon fog
  const outerRocks = useMemo(() => {
    return Array.from({ length: 24 }, (_, idx) => {
      const ang = (idx / 24) * Math.PI * 2 + (idx % 3) * 0.09;
      const dist = ARENA_RADIUS + 4.5 + (idx % 4) * 3.8;
      const scale = 1.6 + (idx % 5) * 0.75;
      return {
        x: Math.cos(ang) * dist,
        z: Math.sin(ang) * dist,
        scaleX: scale * (1 + (idx % 2) * 0.35),
        scaleY: scale * (0.9 + (idx % 3) * 0.45),
        scaleZ: scale * (1.1 - (idx % 2) * 0.2),
        rotY: idx * 0.7,
      };
    });
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    for (let i = 0; i < flameRefs.current.length; i++) {
      const mesh = flameRefs.current[i];
      if (!mesh) continue;
      const flicker = 0.88 + Math.sin(t * 9.5 + i * 1.4) * 0.16;
      mesh.scale.set(flicker, 0.9 + Math.cos(t * 11 + i) * 0.22, flicker);
    }
  });

  return (
    <group>
      {/* Glacial Sapphire Sky & Horizon-Matched Fog */}
      <color attach="background" args={['#081829']} />
      <fogExp2 attach="fog" args={['#081829', 0.017]} />

      {/* Crisp Key Light + Glacial Hemisphere Fill + Teal Rim Backlight */}
      <hemisphereLight args={['#7dd3fc', '#0f293a', 1.05]} />
      <directionalLight
        position={[18, 28, 16]}
        intensity={1.75}
        color="#e0f7ff"
        castShadow={!isSoftwareGl}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-24}
        shadow-camera-right={24}
        shadow-camera-top={24}
        shadow-camera-bottom={-24}
        shadow-camera-near={4}
        shadow-camera-far={72}
        shadow-bias={-0.0005}
        shadow-normalBias={0.025}
      />
      <directionalLight
        position={[-18, 14, -18]}
        intensity={0.7}
        color="#2dd4bf"
      />

      {/* Extended Outer Glacial Ground Plane (Never floating in an empty void) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.08, 0]}
        receiveShadow
      >
        <planeGeometry args={[140, 140]} />
        <meshStandardMaterial color="#0d2033" roughness={0.92} metalness={0.08} />
      </mesh>

      {/* Main Circular Colosseum Battle Floor */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
        onClick={(e) => {
          if (onFloorClick) {
            e.stopPropagation();
            onFloorClick(e.point.x, e.point.z);
          }
        }}
      >
        <circleGeometry args={[ARENA_RADIUS + 0.5, 48]} />
        <meshStandardMaterial
          map={floorTex}
          roughness={0.82}
          metalness={0.12}
        />
      </mesh>

      {/* Center Carved Crystal Medallion Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
        <ringGeometry args={[3.4, 3.85, 40]} />
        <meshStandardMaterial
          color="#06b6d4"
          emissive="#0891b2"
          emissiveIntensity={0.45}
          roughness={0.32}
          metalness={0.72}
          polygonOffset
          polygonOffsetFactor={-1}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
        <ringGeometry args={[11.2, 11.48, 48]} />
        <meshStandardMaterial
          color="#0e7490"
          roughness={0.5}
          metalness={0.5}
          polygonOffset
          polygonOffsetFactor={-1}
        />
      </mesh>

      {/* Glowing Outer Battle Rim Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[ARENA_RADIUS - 0.18, ARENA_RADIUS + 0.32, 64]} />
        <meshStandardMaterial
          color="#22d3ee"
          emissive="#06b6d4"
          emissiveIntensity={0.9}
          roughness={0.3}
          metalness={0.55}
          polygonOffset
          polygonOffsetFactor={-1}
        />
      </mesh>

      {/* Low Carved Frost-Stone Curb Around Perimeter */}
      <mesh position={[0, 0.28, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <torusGeometry args={[ARENA_RADIUS + 0.65, 0.38, 10, 56]} />
        <meshStandardMaterial color="#1e3a52" roughness={0.82} metalness={0.18} />
      </mesh>

      {/* 8 Composite Crystal-Stone Pillars with Cyan Plasma Braziers */}
      {pillars.map((p, idx) => (
        <group key={idx} position={[p.x, 0, p.z]} rotation={[0, p.rotY, 0]}>
          {/* Stepped Plinth Base */}
          <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.85, 0.8, 1.85]} />
            <meshStandardMaterial color="#162c42" roughness={0.85} />
          </mesh>
          {/* Main Fluted Column Shaft */}
          <mesh position={[0, 2.55, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.58, 0.72, 3.6, 8]} />
            <meshStandardMaterial color="#2a4a68" roughness={0.76} metalness={0.16} />
          </mesh>
          {/* Crystal Collar Ring */}
          <mesh position={[0, 4.3, 0]}>
            <cylinderGeometry args={[0.88, 0.7, 0.42, 8]} />
            <meshStandardMaterial color="#38bdf8" roughness={0.28} metalness={0.78} />
          </mesh>
          {/* Dark Alloy Brazier Bowl */}
          <mesh position={[0, 4.72, 0]} castShadow>
            <cylinderGeometry args={[0.92, 0.56, 0.5, 8]} />
            <meshStandardMaterial color="#0f172a" roughness={0.38} metalness={0.78} />
          </mesh>
          {/* Animated Cyan Plasma Flame Core */}
          <mesh
            ref={(el) => {
              flameRefs.current[idx] = el;
            }}
            position={[0, 5.25, 0]}
          >
            <coneGeometry args={[0.56, 1.25, 7]} />
            <meshStandardMaterial
              color="#a5f3fc"
              emissive="#06b6d4"
              emissiveIntensity={2.1}
              roughness={0.2}
            />
          </mesh>
        </group>
      ))}

      {/* Natural Outer Glacial Rock Formations */}
      {outerRocks.map((rock, idx) => (
        <mesh
          key={idx}
          position={[rock.x, rock.scaleY * 0.45, rock.z]}
          scale={[rock.scaleX, rock.scaleY, rock.scaleZ]}
          rotation={[0, rock.rotY, 0]}
          receiveShadow
        >
          <dodecahedronGeometry args={[1.2, 0]} />
          <meshStandardMaterial color="#12273c" roughness={0.9} metalness={0.08} />
        </mesh>
      ))}
    </group>
  );
};
