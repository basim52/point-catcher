import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CLUSTER_X_POSITIONS, SPAWN_Y } from './types';
import { DateCatcherWorld } from './gameLogic';

interface PalmEnvironmentProps {
  worldRef: React.MutableRefObject<DateCatcherWorld>;
  isSoftwareGl: boolean;
}

function createSandTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#e4b36f';
    ctx.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 16) {
      ctx.strokeStyle = y % 32 === 0 ? 'rgba(255,235,195,0.28)' : 'rgba(176,118,56,0.22)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (let x = 0; x <= 256; x += 16) {
        const wave = Math.sin((x / 256) * Math.PI * 2) * 3.5;
        if (x === 0) ctx.moveTo(x, y + wave);
        else ctx.lineTo(x, y + wave);
      }
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 8);
  tex.anisotropy = Math.min(8, maxAnisotropy);
  return tex;
}

/**
 * Reusable low-poly stylized palm tree (curved segmented trunk + gently swaying arched fronds).
 */
const BackgroundPalm: React.FC<{
  position: [number, number, number];
  scale?: number;
  lean?: number;
  swayOffset?: number;
}> = ({ position, scale = 1, lean = 0.08, swayOffset = 0 }) => {
  const crownRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!crownRef.current) return;
    const t = clock.getElapsedTime();
    crownRef.current.rotation.z = Math.sin(t * 1.15 + swayOffset) * 0.065;
    crownRef.current.rotation.x = Math.cos(t * 0.85 + swayOffset) * 0.04;
  });

  const trunkSegments = [0, 1, 2, 3, 4, 5, 6];
  const frondAngles = [0, 1, 2, 3, 4, 5, 6, 7];

  return (
    <group position={position} scale={scale}>
      {/* Segmented curved trunk */}
      {trunkSegments.map((seg) => {
        const y = seg * 0.95 + 0.45;
        const xOff = Math.pow(seg * 0.22, 1.55) * lean * 4.5;
        const rBottom = 0.36 - seg * 0.025;
        const rTop = 0.33 - seg * 0.025;
        return (
          <mesh
            key={seg}
            castShadow
            receiveShadow
            position={[xOff, y, 0]}
            rotation={[0, 0, -lean * (0.4 + seg * 0.09)]}
          >
            <cylinderGeometry args={[rTop, rBottom, 1.02, 7]} />
            <meshStandardMaterial
              color={seg % 2 === 0 ? '#7c4d2b' : '#6b4022'}
              roughness={0.92}
            />
          </mesh>
        );
      })}

      {/* Swaying palm fronds crown */}
      <group
        ref={crownRef}
        position={[Math.pow(6 * 0.22, 1.55) * lean * 4.5, 6.85, 0]}
      >
        {/* Center fibrous crown bulb */}
        <mesh>
          <dodecahedronGeometry args={[0.42, 0]} />
          <meshStandardMaterial color="#5c381e" roughness={0.95} />
        </mesh>

        {frondAngles.map((idx) => {
          const yaw = (idx / frondAngles.length) * Math.PI * 2;
          const droop = idx % 2 === 0 ? 0.38 : 0.62;
          return (
            <group key={idx} rotation={[0, yaw, 0]}>
              {/* Inner frond stalk */}
              <mesh
                castShadow
                position={[1.05, 0.32 - droop * 0.25, 0]}
                rotation={[0, 0, -droop]}
              >
                <boxGeometry args={[2.1, 0.09, 0.42]} />
                <meshStandardMaterial
                  color={idx % 2 === 0 ? '#2f7a3e' : '#3a8f49'}
                  roughness={0.78}
                />
              </mesh>
              {/* Outer arched tip */}
              <mesh
                castShadow
                position={[2.45, -0.35 - droop * 0.45, 0]}
                rotation={[0, 0, -droop - 0.58]}
              >
                <coneGeometry args={[0.26, 1.55, 4]} />
                <meshStandardMaterial
                  color={idx % 2 === 0 ? '#3f964e' : '#2b6e37'}
                  roughness={0.75}
                />
              </mesh>
            </group>
          );
        })}
      </group>
    </group>
  );
};

/**
 * Overhead Hero Palm Canopy framing the top of the playfield with 5 hanging date clusters
 * that visibly shake right before dropping a date as a telegraph!
 */
const HeroPalmCanopy: React.FC<{
  worldRef: React.MutableRefObject<DateCatcherWorld>;
}> = ({ worldRef }) => {
  const frondsGroupRef = useRef<THREE.Group>(null);
  const clusterRefs = useRef<(THREE.Group | null)[]>([]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (frondsGroupRef.current) {
      frondsGroupRef.current.rotation.z = Math.sin(t * 0.9) * 0.018;
    }
    const timers = worldRef.current.clusterShakeTimers;
    for (let i = 0; i < CLUSTER_X_POSITIONS.length; i++) {
      const grp = clusterRefs.current[i];
      if (!grp) continue;
      const shake = timers[i] ?? 0;
      if (shake > 0) {
        const amp = Math.min(1, shake / 0.42) * 0.28;
        grp.rotation.z = Math.sin(t * 48 + i) * amp;
        grp.position.y = SPAWN_Y + 0.55 + Math.sin(t * 40) * 0.05;
      } else {
        grp.rotation.z = Math.sin(t * 1.4 + i * 1.1) * 0.04;
        grp.position.y = SPAWN_Y + 0.55;
      }
    }
  });

  const topFrondAngles = [-2.6, -2.15, -1.7, -1.25, -0.8, -0.35, 0.35, 0.8, 1.25, 1.7, 2.15, 2.6];

  return (
    <group>
      {/* Massive sturdy hero palm trunk rising right behind the playfield */}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((seg) => (
        <mesh
          key={seg}
          receiveShadow
          position={[0, seg * 1.02 + 0.5, -3.2]}
        >
          <cylinderGeometry
            args={[0.62 - seg * 0.02, 0.68 - seg * 0.02, 1.08, 8]}
          />
          <meshStandardMaterial
            color={seg % 2 === 0 ? '#754626' : '#63391e'}
            roughness={0.92}
          />
        </mesh>
      ))}

      {/* Overhead spreading canopy fronds */}
      <group ref={frondsGroupRef} position={[0, SPAWN_Y + 1.45, -1.5]}>
        <mesh>
          <dodecahedronGeometry args={[0.95, 0]} />
          <meshStandardMaterial color="#5c361c" roughness={0.94} />
        </mesh>

        {topFrondAngles.map((angle, idx) => (
          <group key={idx} rotation={[0, angle, 0]}>
            <mesh
              position={[2.4, 0.35, 0]}
              rotation={[0, 0, -0.22]}
            >
              <boxGeometry args={[4.8, 0.14, 0.65]} />
              <meshStandardMaterial
                color={idx % 2 === 0 ? '#2e7d3f' : '#3b944b'}
                roughness={0.76}
              />
            </mesh>
            <mesh
              position={[5.0, -0.45, 0]}
              rotation={[0, 0, -0.78]}
            >
              <coneGeometry args={[0.36, 2.0, 4]} />
              <meshStandardMaterial
                color={idx % 2 === 0 ? '#3f994f' : '#296e35'}
                roughness={0.75}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* 5 Hanging Date Clusters (عذوق التمر) across the playfield width */}
      {CLUSTER_X_POSITIONS.map((cx, idx) => (
        <group
          key={idx}
          ref={(el) => {
            clusterRefs.current[idx] = el;
          }}
          position={[cx, SPAWN_Y + 0.55, 0]}
        >
          {/* Golden-orange palm stalk */}
          <mesh position={[0, 0.55, 0]}>
            <cylinderGeometry args={[0.05, 0.08, 1.1, 6]} />
            <meshStandardMaterial color="#d97706" roughness={0.7} />
          </mesh>
          {/* Cluster of dates */}
          {[
            [0, 0, 0],
            [-0.18, -0.14, 0.1],
            [0.18, -0.14, 0.08],
            [-0.12, -0.3, -0.08],
            [0.14, -0.32, 0.06],
            [0, -0.42, 0.12],
          ].map(([dx, dy, dz], j) => (
            <mesh key={j} position={[dx, dy, dz]} scale={[1, 1.35, 1]}>
              <sphereGeometry args={[0.13, 8, 6]} />
              <meshStandardMaterial
                color={j % 2 === 0 ? '#6b2f12' : '#85401b'}
                roughness={0.38}
                metalness={0.08}
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
};

/**
 * Vertical Sunset Gradient Sky Dome (Orange -> Coral Pink -> Warm Twilight Violet)
 */
const SunsetSkyDome: React.FC = () => {
  const skyMat = useMemo(() => {
    return new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uTopColor: { value: new THREE.Color('#3b2454') },
        uMidColor: { value: new THREE.Color('#e86f68') },
        uHorizonColor: { value: new THREE.Color('#fbbf6a') },
      },
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        uniform vec3 uTopColor;
        uniform vec3 uMidColor;
        uniform vec3 uHorizonColor;
        varying vec3 vWorldPos;
        void main() {
          float h = clamp((normalize(vWorldPos).y + 0.05) * 1.45, 0.0, 1.0);
          vec3 col = mix(uHorizonColor, uMidColor, smoothstep(0.0, 0.42, h));
          col = mix(col, uTopColor, smoothstep(0.38, 0.95, h));
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
  }, []);

  useEffect(() => {
    return () => {
      skyMat.dispose();
    };
  }, [skyMat]);

  return (
    <group>
      <mesh material={skyMat}>
        <sphereGeometry args={[48, 24, 16]} />
      </mesh>
      {/* Low glowing sunset sun */}
      <mesh position={[0, 4.6, -26]}>
        <sphereGeometry args={[3.4, 20, 16]} />
        <meshBasicMaterial color="#ffe29a" fog={false} />
      </mesh>
      {/* Soft warm solar halo */}
      <mesh position={[0, 4.6, -26.5]}>
        <circleGeometry args={[5.8, 24]} />
        <meshBasicMaterial
          color="#ff9b54"
          transparent
          opacity={0.3}
          fog={false}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};

export const PalmEnvironment: React.FC<PalmEnvironmentProps> = ({
  worldRef,
  isSoftwareGl,
}) => {
  const { gl, scene } = useThree();

  // Populate procedural RoomEnvironment for rich metallic reflections on golden dates
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

  const sandTex = useMemo(
    () => createSandTexture(gl.capabilities.getMaxAnisotropy()),
    [gl]
  );

  useEffect(() => {
    return () => {
      sandTex.dispose();
    };
  }, [sandTex]);

  return (
    <>
      <fog attach="fog" args={['#f09b6c', 16, 46]} />
      <SunsetSkyDome />

      {/* Warm Sunset Key Light + Sky/Sand Hemisphere Fill + Subtle Rim */}
      <hemisphereLight args={['#ffb784', '#9e6232', 0.9]} />
      <directionalLight
        position={[6, 12, 8]}
        intensity={1.75}
        color="#ffd4a1"
        castShadow={!isSoftwareGl}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={1}
        shadow-camera-far={30}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={10}
        shadow-camera-bottom={-3}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[-6, 6, -6]} intensity={0.65} color="#fb7185" />

      {/* Vast Golden Sandy Oasis Ground */}
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
      >
        <planeGeometry args={[90, 90]} />
        <meshStandardMaterial map={sandTex} roughness={0.94} metalness={0.02} />
      </mesh>

      {/* Rolling Desert Dunes in the Background (Natural Outdoor Perimeter) */}
      <mesh position={[-11, -0.4, -14]} scale={[12, 2.2, 6]}>
        <sphereGeometry args={[1, 14, 10]} />
        <meshStandardMaterial color="#d99757" roughness={0.95} />
      </mesh>
      <mesh position={[12, -0.5, -16]} scale={[14, 2.6, 7]}>
        <sphereGeometry args={[1, 14, 10]} />
        <meshStandardMaterial color="#d18b4c" roughness={0.95} />
      </mesh>
      <mesh position={[0, -0.8, -20]} scale={[18, 2.1, 7]}>
        <sphereGeometry args={[1, 14, 10]} />
        <meshStandardMaterial color="#c98045" roughness={0.95} />
      </mesh>

      {/* Subtle Low-Poly Oasis Rocks & Desert Shrubs flanking playable zone */}
      {[
        { pos: [-6.4, 0.25, -1.5] as [number, number, number], s: 0.7 },
        { pos: [6.5, 0.28, -1.2] as [number, number, number], s: 0.8 },
        { pos: [-7.2, 0.2, -5.5] as [number, number, number], s: 1.0 },
        { pos: [7.4, 0.22, -6.2] as [number, number, number], s: 0.95 },
      ].map((r, i) => (
        <mesh key={i} position={r.pos} scale={r.s} receiveShadow>
          <dodecahedronGeometry args={[0.55, 0]} />
          <meshStandardMaterial color="#a8764c" roughness={0.95} />
        </mesh>
      ))}

      {/* 4 Swaying Background Palm Trees */}
      <BackgroundPalm position={[-7.8, 0, -7.5]} scale={1.08} lean={0.09} swayOffset={0.2} />
      <BackgroundPalm position={[-4.2, 0, -11.5]} scale={0.92} lean={-0.06} swayOffset={1.6} />
      <BackgroundPalm position={[4.8, 0, -11.2]} scale={0.96} lean={0.07} swayOffset={2.8} />
      <BackgroundPalm position={[8.2, 0, -7.2]} scale={1.12} lean={-0.09} swayOffset={4.1} />

      {/* Main Overhead Hero Palm Tree & Shaking Date Clusters */}
      <HeroPalmCanopy worldRef={worldRef} />

      {/* Warm drifting sunset oasis motes */}
      {!isSoftwareGl && (
        <Sparkles
          count={22}
          scale={[11, 7, 4]}
          position={[0, 3.8, -1]}
          size={2.2}
          speed={0.28}
          opacity={0.55}
          color="#ffe08a"
        />
      )}
    </>
  );
};
