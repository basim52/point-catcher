import React, { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PLAYER_Z, RallyHudSnapshot } from './types';
import { DesertRallyAudio } from './audio';
import {
  DesertRallyWorld,
  extractRallyHud,
  shiftLane,
  stepRallyWorld,
  triggerJump,
  triggerNitro,
} from './gameLogic';
import { DesertTrack } from './DesertTrack';
import { RallyCar } from './RallyCar';
import { TrackEntities } from './TrackEntities';

interface DesertRallySceneProps {
  worldRef: React.MutableRefObject<DesertRallyWorld>;
  audioRef: React.MutableRefObject<DesertRallyAudio>;
  onHudUpdate: (snapshot: RallyHudSnapshot) => void;
}

function detectSoftwareGl(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return false;
  }
}

const ChaseCamController: React.FC<{
  worldRef: React.MutableRefObject<DesertRallyWorld>;
  audioRef: React.MutableRefObject<DesertRallyAudio>;
  onHudUpdate: (snapshot: RallyHudSnapshot) => void;
}> = ({ worldRef, audioRef, onHudUpdate }) => {
  const { camera } = useThree();
  const lastHudRef = useRef(0);

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const world = worldRef.current;
    const dirty = stepRallyWorld(world, dt, audioRef.current);

    // Dynamic third-person chase camera with smooth lateral follow, nitro FOV stretch & impact shake
    const targetCamX = world.carX * 0.62;
    const targetCamY = 3.55 + world.carY * 0.35;
    const targetCamZ = PLAYER_Z + (world.nitroTimer > 0 ? 5.6 : 6.15);

    const k = 1 - Math.exp(-8 * dt);
    camera.position.x += (targetCamX - camera.position.x) * k;
    camera.position.y += (targetCamY - camera.position.y) * k;
    camera.position.z += (targetCamZ - camera.position.z) * k;

    if (world.cameraShake > 0.005) {
      const t = clock.getElapsedTime() * 48;
      const mag = world.cameraShake * 0.24;
      camera.position.x += Math.sin(t) * mag;
      camera.position.y += Math.cos(t * 1.25) * mag * 0.65;
    }

    camera.lookAt(world.carX * 0.35, 1.15 + world.carY * 0.25, PLAYER_Z - 14);

    if (camera instanceof THREE.PerspectiveCamera) {
      const targetFov = world.nitroTimer > 0 ? 66 : 54;
      if (Math.abs(camera.fov - targetFov) > 0.05) {
        camera.fov += (targetFov - camera.fov) * (1 - Math.exp(-6 * dt));
        camera.updateProjectionMatrix();
      }
    }

    const now = performance.now();
    if (dirty && (world.status !== 'PLAYING' || now - lastHudRef.current >= 65)) {
      lastHudRef.current = now;
      onHudUpdate(extractRallyHud(world));
    }
  });

  return null;
};

export const DesertRallyScene: React.FC<DesertRallySceneProps> = ({
  worldRef,
  audioRef,
  onHudUpdate,
}) => {
  const isSoftwareGl = useMemo(() => detectSoftwareGl(), []);
  const [contextLost, setContextLost] = useState(false);
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (worldRef.current.status !== 'PLAYING') return;
    swipeStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const start = swipeStartRef.current;
    if (!start || worldRef.current.status !== 'PLAYING') return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    const threshold = 28;

    if (Math.abs(dx) >= threshold || Math.abs(dy) >= threshold) {
      if (Math.abs(dx) > Math.abs(dy)) {
        shiftLane(worldRef.current, dx > 0 ? 1 : -1, audioRef.current);
      } else if (dy < -threshold) {
        triggerJump(worldRef.current, audioRef.current);
      } else if (dy > threshold) {
        triggerNitro(worldRef.current, audioRef.current);
      }
      // Consume gesture cleanly so one swipe = one crisp lane shift/jump
      swipeStartRef.current = null;
    }
  };

  const handlePointerUp = () => {
    swipeStartRef.current = null;
  };

  return (
    <div
      className="relative w-full h-full touch-none select-none overflow-hidden"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {contextLost ? (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-[#1d2b53] via-[#d95b54] to-[#f7b563] text-white text-center p-6">
          <p className="text-lg font-bold">
            {worldRef.current.lang === 'ar'
              ? 'جاري إعادة تنشيط العرض ثلاثي الأبعاد...'
              : 'Restoring 3D graphics context...'}
          </p>
        </div>
      ) : (
        <Canvas
          shadows={!isSoftwareGl}
          dpr={isSoftwareGl ? 1 : [1, 2]}
          camera={{ position: [0, 3.55, PLAYER_Z + 6.15], fov: 54, near: 0.2, far: 160 }}
          gl={{
            antialias: !isSoftwareGl,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.06,
            outputColorSpace: THREE.SRGBColorSpace,
          }}
          onCreated={({ gl }) => {
            const canvas = gl.domElement;
            const onLost = (ev: Event) => {
              ev.preventDefault();
              setContextLost(true);
            };
            const onRestored = () => setContextLost(false);
            canvas.addEventListener('webglcontextlost', onLost, false);
            canvas.addEventListener('webglcontextrestored', onRestored, false);
          }}
        >
          <DesertTrack worldRef={worldRef} isSoftwareGl={isSoftwareGl} />
          <RallyCar worldRef={worldRef} />
          <TrackEntities worldRef={worldRef} />
          <ChaseCamController
            worldRef={worldRef}
            audioRef={audioRef}
            onHudUpdate={onHudUpdate}
          />
        </Canvas>
      )}
    </div>
  );
};
