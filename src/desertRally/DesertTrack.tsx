import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ROAD_WIDTH } from './types';
import { DesertRallyWorld } from './gameLogic';

interface DesertTrackProps {
  worldRef: React.MutableRefObject<DesertRallyWorld>;
  isSoftwareGl: boolean;
}

function createRoadTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Rich dark sun-baked desert asphalt
    ctx.fillStyle = '#2d3138';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle aggregate grit
    for (let i = 0; i < 600; i++) {
      const gx = (i * 73) % 512;
      const gy = (i * 139) % 512;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.09)';
      ctx.fillRect(gx, gy, 3, 3);
    }

    // Warm sandy shoulder edges + crisp red/white rumble strips
    ctx.fillStyle = '#c4834b';
    ctx.fillRect(0, 0, 26, 512);
    ctx.fillRect(486, 0, 26, 512);

    for (let y = 0; y < 512; y += 64) {
      ctx.fillStyle = (y / 64) % 2 === 0 ? '#f97316' : '#f8fafc';
      ctx.fillRect(26, y, 14, 32);
      ctx.fillRect(472, y, 14, 32);
    }

    // Two dashed golden lane dividers (3 lanes)
    ctx.fillStyle = '#fbbf24';
    for (let y = 16; y < 512; y += 96) {
      ctx.fillRect(178, y, 10, 48);
      ctx.fillRect(324, y, 10, 48);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 14);
  tex.anisotropy = Math.min(8, maxAnisotropy);
  return tex;
}

function createDesertSandTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#d98c4f';
    ctx.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 16) {
      ctx.strokeStyle =
        y % 32 === 0 ? 'rgba(255,220,170,0.22)' : 'rgba(138,72,30,0.2)';
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
  tex.repeat.set(14, 24);
  tex.anisotropy = Math.min(8, maxAnisotropy);
  return tex;
}

const CanyonSkyDome: React.FC = () => {
  const skyMat = useMemo(() => {
    return new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uTop: { value: new THREE.Color('#1d2b53') },
        uMid: { value: new THREE.Color('#d95b54') },
        uHorizon: { value: new THREE.Color('#f7b563') },
      },
      vertexShader: `
        varying vec3 vPos;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vPos = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        uniform vec3 uTop;
        uniform vec3 uMid;
        uniform vec3 uHorizon;
        varying vec3 vPos;
        void main() {
          float h = clamp((normalize(vPos).y + 0.04) * 1.5, 0.0, 1.0);
          vec3 col = mix(uHorizon, uMid, smoothstep(0.0, 0.36, h));
          col = mix(col, uTop, smoothstep(0.32, 0.92, h));
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
        <sphereGeometry args={[120, 24, 16]} />
      </mesh>
      {/* Low desert canyon sun */}
      <mesh position={[12, 14, -85]}>
        <sphereGeometry args={[8.2, 20, 16]} />
        <meshBasicMaterial color="#ffe49c" fog={false} />
      </mesh>
      <mesh position={[12, 14, -86]}>
        <circleGeometry args={[14.5, 24]} />
        <meshBasicMaterial
          color="#ff934f"
          transparent
          opacity={0.28}
          fog={false}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};

interface SceneryProp {
  side: -1 | 1;
  offsetX: number;
  baseZ: number;
  kind: 'mesa' | 'cactus' | 'rock';
  scale: number;
}

const SCENERY_PROPS: SceneryProp[] = [
  { side: -1, offsetX: 14, baseZ: -10, kind: 'mesa', scale: 1.2 },
  { side: 1, offsetX: 16, baseZ: -26, kind: 'mesa', scale: 1.4 },
  { side: -1, offsetX: 18, baseZ: -48, kind: 'mesa', scale: 1.5 },
  { side: 1, offsetX: 14, baseZ: -68, kind: 'mesa', scale: 1.15 },
  { side: -1, offsetX: 6.4, baseZ: -4, kind: 'cactus', scale: 1.0 },
  { side: 1, offsetX: 6.8, baseZ: -14, kind: 'cactus', scale: 1.1 },
  { side: -1, offsetX: 7.2, baseZ: -28, kind: 'rock', scale: 1.1 },
  { side: 1, offsetX: 6.4, baseZ: -38, kind: 'cactus', scale: 0.95 },
  { side: -1, offsetX: 6.6, baseZ: -54, kind: 'cactus', scale: 1.05 },
  { side: 1, offsetX: 7.4, baseZ: -62, kind: 'rock', scale: 1.2 },
  { side: -1, offsetX: 7.0, baseZ: -74, kind: 'rock', scale: 0.9 },
  { side: 1, offsetX: 6.5, baseZ: -84, kind: 'cactus', scale: 1.0 },
];

const SCENERY_LOOP_SPAN = 96;

export const DesertTrack: React.FC<DesertTrackProps> = ({
  worldRef,
  isSoftwareGl,
}) => {
  const { gl, scene } = useThree();
  const propRefs = useRef<(THREE.Group | null)[]>([]);
  const scrollZRef = useRef(0);

  // Studio environment reflections for metallic rally bodywork & gold coins
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

  const maxAniso = gl.capabilities.getMaxAnisotropy();
  const roadTex = useMemo(() => createRoadTexture(maxAniso), [maxAniso]);
  const sandTex = useMemo(() => createDesertSandTexture(maxAniso), [maxAniso]);

  useEffect(() => {
    return () => {
      roadTex.dispose();
      sandTex.dispose();
    };
  }, [roadTex, sandTex]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const world = worldRef.current;

    // Scroll road & sand textures smoothly
    const texSpeed = world.status === 'START' ? 12 : world.status === 'PLAYING' ? world.speed : 0;
    roadTex.offset.y = (roadTex.offset.y + texSpeed * dt * 0.105) % 1;
    sandTex.offset.y = (sandTex.offset.y + texSpeed * dt * 0.14) % 1;

    // Loop roadside mesas, rocks & desert cacti smoothly
    scrollZRef.current = (scrollZRef.current + texSpeed * dt) % SCENERY_LOOP_SPAN;
    for (let i = 0; i < SCENERY_PROPS.length; i++) {
      const grp = propRefs.current[i];
      if (!grp) continue;
      const prop = SCENERY_PROPS[i];
      let z = prop.baseZ + scrollZRef.current;
      if (z > 14) z -= SCENERY_LOOP_SPAN;
      grp.position.set(prop.side * prop.offsetX, 0, z);
    }
  });

  return (
    <>
      <fog attach="fog" args={['#e8945e', 26, 95]} />
      <CanyonSkyDome />

      {/* Warm/Cool Balanced 3-Point Outdoor Lighting */}
      <hemisphereLight args={['#ffca99', '#8a4c28', 0.92]} />
      <directionalLight
        position={[14, 18, 12]}
        intensity={1.85}
        color="#ffe0b5"
        castShadow={!isSoftwareGl}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={2}
        shadow-camera-far={55}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={18}
        shadow-camera-bottom={-14}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[-10, 8, -14]} intensity={0.65} color="#38bdf8" />

      {/* Vast Terracotta Desert Floor */}
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.04, -36]}
      >
        <planeGeometry args={[180, 180]} />
        <meshStandardMaterial map={sandTex} roughness={0.95} metalness={0.02} />
      </mesh>

      {/* Endless Desert Asphalt Highway (elevated +0.02 to prevent Z-fighting) */}
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, -36]}
      >
        <planeGeometry args={[ROAD_WIDTH, 140]} />
        <meshStandardMaterial
          map={roadTex}
          roughness={0.82}
          metalness={0.08}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </mesh>

      {/* Scrolling Canyon Mesas, Sandstone Rocks & Stylized Desert Cacti */}
      {SCENERY_PROPS.map((prop, idx) => (
        <group
          key={idx}
          ref={(el) => {
            propRefs.current[idx] = el;
          }}
          position={[prop.side * prop.offsetX, 0, prop.baseZ]}
          scale={prop.scale}
        >
          {prop.kind === 'mesa' && (
            <group>
              <mesh position={[0, 2.2, 0]} receiveShadow>
                <cylinderGeometry args={[3.2, 5.2, 4.4, 7]} />
                <meshStandardMaterial color="#b45935" roughness={0.94} />
              </mesh>
              <mesh position={[0.4, 4.9, -0.3]}>
                <cylinderGeometry args={[2.1, 3.0, 1.3, 7]} />
                <meshStandardMaterial color="#c96e43" roughness={0.92} />
              </mesh>
            </group>
          )}
          {prop.kind === 'cactus' && (
            <group>
              <mesh castShadow position={[0, 1.1, 0]}>
                <cylinderGeometry args={[0.24, 0.28, 2.2, 7]} />
                <meshStandardMaterial color="#2f7a44" roughness={0.85} />
              </mesh>
              <mesh position={[0.42, 1.25, 0]} rotation={[0, 0, -0.4]}>
                <cylinderGeometry args={[0.14, 0.16, 0.85, 6]} />
                <meshStandardMaterial color="#388e4f" roughness={0.85} />
              </mesh>
              <mesh position={[-0.4, 1.45, 0]} rotation={[0, 0, 0.45]}>
                <cylinderGeometry args={[0.13, 0.15, 0.75, 6]} />
                <meshStandardMaterial color="#296b3b" roughness={0.85} />
              </mesh>
            </group>
          )}
          {prop.kind === 'rock' && (
            <mesh position={[0, 0.55, 0]} receiveShadow>
              <dodecahedronGeometry args={[0.85, 0]} />
              <meshStandardMaterial color="#9e5a38" roughness={0.95} />
            </mesh>
          )}
        </group>
      ))}

      {/* Subtle golden desert dust motes */}
      {!isSoftwareGl && (
        <Sparkles
          count={24}
          scale={[14, 5, 36]}
          position={[0, 2.4, -14]}
          size={2.0}
          speed={0.4}
          opacity={0.45}
          color="#fde68a"
        />
      )}
    </>
  );
};
