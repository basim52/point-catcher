import React, { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ShawarmaHudSnapshot } from './types';
import { ShawarmaAudio } from './audio';
import {
  extractShawarmaHud,
  ShawarmaWorld,
  stepShawarmaWorld,
} from './gameLogic';
import { ShopEnvironment } from './ShopEnvironment';
import { PrepAndCustomers } from './PrepAndCustomers';

interface ShawarmaSceneProps {
  worldRef: React.MutableRefObject<ShawarmaWorld>;
  audioRef: React.MutableRefObject<ShawarmaAudio>;
  onHudUpdate: (snapshot: ShawarmaHudSnapshot) => void;
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

const ChefCameraController: React.FC<{
  worldRef: React.MutableRefObject<ShawarmaWorld>;
  audioRef: React.MutableRefObject<ShawarmaAudio>;
  onHudUpdate: (snapshot: ShawarmaHudSnapshot) => void;
}> = ({ worldRef, audioRef, onHudUpdate }) => {
  const { camera } = useThree();
  const lastHudRef = useRef(0);

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const world = worldRef.current;
    const dirty = stepShawarmaWorld(world, dt, audioRef.current);

    // Subtle chef head breathing overlooking the counter, spit & customers
    const t = clock.getElapsedTime();
    camera.position.set(
      Math.sin(t * 0.45) * 0.08,
      2.65 + Math.cos(t * 0.7) * 0.025,
      4.35
    );
    camera.lookAt(0, 1.55, -0.35);

    const now = performance.now();
    if (dirty && (world.status !== 'PLAYING' || now - lastHudRef.current >= 90)) {
      lastHudRef.current = now;
      onHudUpdate(extractShawarmaHud(world));
    }
  });

  return null;
};

export const ShawarmaScene: React.FC<ShawarmaSceneProps> = ({
  worldRef,
  audioRef,
  onHudUpdate,
}) => {
  const isSoftwareGl = useMemo(() => detectSoftwareGl(), []);
  const [contextLost, setContextLost] = useState(false);

  return (
    <div className="relative w-full h-full select-none overflow-hidden">
      {contextLost ? (
        <div className="w-full h-full flex items-center justify-center bg-[#2b1b2d] text-amber-100 text-center p-6">
          <p className="text-lg font-bold">
            {worldRef.current.lang === 'ar'
              ? 'جاري إعادة تنشيط العرض ثلاثي الأبعاد...'
              : 'Restoring 3D restaurant scene...'}
          </p>
        </div>
      ) : (
        <Canvas
          shadows={!isSoftwareGl}
          dpr={isSoftwareGl ? 1 : [1, 2]}
          camera={{ position: [0, 2.65, 4.35], fov: 50, near: 0.2, far: 60 }}
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
          <ShopEnvironment worldRef={worldRef} isSoftwareGl={isSoftwareGl} />
          <PrepAndCustomers worldRef={worldRef} />
          <ChefCameraController
            worldRef={worldRef}
            audioRef={audioRef}
            onHudUpdate={onHudUpdate}
          />
        </Canvas>
      )}
    </div>
  );
};
