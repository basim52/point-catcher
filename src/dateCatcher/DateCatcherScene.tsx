import React, { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { HudSnapshot, PLAY_HALF_WIDTH } from './types';
import { DateCatcherAudio } from './audio';
import {
  DateCatcherWorld,
  extractHudSnapshot,
  stepWorld,
} from './gameLogic';
import { PalmEnvironment } from './PalmEnvironment';
import { PlayerBasket } from './PlayerBasket';
import { FallingItems } from './FallingItems';

interface DateCatcherSceneProps {
  worldRef: React.MutableRefObject<DateCatcherWorld>;
  audioRef: React.MutableRefObject<DateCatcherAudio>;
  onHudUpdate: (snapshot: HudSnapshot) => void;
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

const BASE_CAM_POS = new THREE.Vector3(0, 4.35, 11.4);
const BASE_CAM_TARGET = new THREE.Vector3(0, 3.1, 0);

const GameLoopController: React.FC<{
  worldRef: React.MutableRefObject<DateCatcherWorld>;
  audioRef: React.MutableRefObject<DateCatcherAudio>;
  onHudUpdate: (snapshot: HudSnapshot) => void;
}> = ({ worldRef, audioRef, onHudUpdate }) => {
  const { camera } = useThree();
  const lastHudSyncRef = useRef<number>(0);

  useFrame(({ clock }, delta) => {
    const world = worldRef.current;
    const dirty = stepWorld(world, delta, audioRef.current);

    // Subtle camera shake on obstacle hit, smoothly settling back to fixed angled view
    if (world.cameraShake > 0.005) {
      const t = clock.getElapsedTime() * 45;
      const mag = world.cameraShake * 0.22;
      camera.position.set(
        BASE_CAM_POS.x + Math.sin(t) * mag,
        BASE_CAM_POS.y + Math.cos(t * 1.3) * mag * 0.65,
        BASE_CAM_POS.z
      );
    } else {
      camera.position.copy(BASE_CAM_POS);
    }
    camera.lookAt(BASE_CAM_TARGET);

    const now = performance.now();
    if (
      dirty &&
      (world.status !== 'PLAYING' || now - lastHudSyncRef.current >= 55)
    ) {
      lastHudSyncRef.current = now;
      onHudUpdate(extractHudSnapshot(world));
    }
  });

  return null;
};

export const DateCatcherScene: React.FC<DateCatcherSceneProps> = ({
  worldRef,
  audioRef,
  onHudUpdate,
}) => {
  const isSoftwareGl = useMemo(() => detectSoftwareGl(), []);
  const [contextLost, setContextLost] = useState(false);

  const mapClientXToWorldX = (
    clientX: number,
    rect: DOMRect
  ): number => {
    const norm = (clientX - rect.left) / Math.max(1, rect.width); // 0..1
    const worldSpan = PLAY_HALF_WIDTH * 2.18;
    return (norm - 0.5) * worldSpan;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const world = worldRef.current;
    if (world.status !== 'PLAYING') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    world.pointerDragging = true;
    world.basketTargetX = mapClientXToWorldX(
      e.clientX,
      e.currentTarget.getBoundingClientRect()
    );
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const world = worldRef.current;
    if (!world.pointerDragging || world.status !== 'PLAYING') return;
    world.basketTargetX = mapClientXToWorldX(
      e.clientX,
      e.currentTarget.getBoundingClientRect()
    );
  };

  const handlePointerUp = () => {
    worldRef.current.pointerDragging = false;
  };

  return (
    <div
      className="relative w-full h-full touch-none select-none overflow-hidden"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onLostPointerCapture={handlePointerUp}
    >
      {contextLost ? (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-[#4c2a54] via-[#d96c5b] to-[#e6b36c] text-white text-center p-6">
          <p className="text-lg font-bold">
            جاري إعادة تنشيط العرض ثلاثي الأبعاد...
          </p>
        </div>
      ) : (
        <Canvas
          shadows={!isSoftwareGl}
          dpr={isSoftwareGl ? 1 : [1, 2]}
          camera={{ position: [0, 4.35, 11.4], fov: 46, near: 0.2, far: 90 }}
          gl={{
            antialias: !isSoftwareGl,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.08,
            outputColorSpace: THREE.SRGBColorSpace,
          }}
          onCreated={({ gl }) => {
            const canvas = gl.domElement;
            const onLost = (ev: Event) => {
              ev.preventDefault();
              setContextLost(true);
            };
            const onRestored = () => {
              setContextLost(false);
            };
            canvas.addEventListener('webglcontextlost', onLost, false);
            canvas.addEventListener('webglcontextrestored', onRestored, false);
          }}
        >
          <PalmEnvironment worldRef={worldRef} isSoftwareGl={isSoftwareGl} />
          <PlayerBasket worldRef={worldRef} />
          <FallingItems worldRef={worldRef} />
          <GameLoopController
            worldRef={worldRef}
            audioRef={audioRef}
            onHudUpdate={onHudUpdate}
          />
        </Canvas>
      )}
    </div>
  );
};
