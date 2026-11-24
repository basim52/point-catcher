import React, { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PlantMergeAudio } from './audio';
import {
  extractPlantMergeHud,
  PlantMergeWorld,
  stepPlantMergeWorld,
} from './gameLogic';
import { GardenEnvironment } from './GardenEnvironment';
import { Entities3D } from './Entities3D';
import { PlantMergeHudSnapshot } from './types';

interface PlantMergeSceneProps {
  worldRef: React.MutableRefObject<PlantMergeWorld>;
  audioRef: React.MutableRefObject<PlantMergeAudio>;
  onHudUpdate: (snapshot: PlantMergeHudSnapshot) => void;
  onSelectPlot: (row: number, col: number) => void;
  onOpenShop: () => void;
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

const GardenLoopController: React.FC<{
  worldRef: React.MutableRefObject<PlantMergeWorld>;
  audioRef: React.MutableRefObject<PlantMergeAudio>;
  onHudUpdate: (snapshot: PlantMergeHudSnapshot) => void;
  onSyncList: () => void;
}> = ({ worldRef, audioRef, onHudUpdate, onSyncList }) => {
  const { camera } = useThree();
  const lastHudAtRef = useRef(0);
  const lastSignatureRef = useRef('');

  useFrame(({ clock }, rawDt) => {
    const world = worldRef.current;
    const dirty = stepPlantMergeWorld(world, rawDt, audioRef.current);

    // Smooth tactical diorama camera overlooking all 3 lanes & both bases
    const t = clock.getElapsedTime();
    let shakeX = 0;
    let shakeY = 0;
    if (world.shakeTimer > 0) {
      const mag = world.shakeIntensity * (world.shakeTimer / 0.35);
      shakeX = (Math.random() * 2 - 1) * mag;
      shakeY = (Math.random() * 2 - 1) * mag;
    }

    const isEatingFinale = world.status === 'EATING_HOUSE';
    const targetX = isEatingFinale
      ? -3.4 + shakeX
      : 0.65 + Math.sin(t * 0.28) * 0.14 + shakeX;
    const targetY = isEatingFinale ? 6.6 + shakeY : 10.6 + shakeY;
    const targetZ = isEatingFinale ? 7.6 : 11.4;
    const dt = Math.min(rawDt, 0.05);
    camera.position.x = THREE.MathUtils.damp(camera.position.x, targetX, 5.5, dt);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, targetY, 5.5, dt);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, targetZ, 5.5, dt);
    camera.lookAt(isEatingFinale ? -6.0 : 0.9, isEatingFinale ? 1.05 : 0.35, 0);

    // Sync React entity list only when plant/monster set or version changes
    const sig = `${world.version}|${world.plants.map((p) => `${p.id}:${p.tier}`).join(',')}|${world.monsters
      .map((m) => m.id)
      .join(',')}`;
    if (sig !== lastSignatureRef.current) {
      lastSignatureRef.current = sig;
      onSyncList();
    }

    const now = performance.now();
    if (dirty && (world.status !== 'PLAYING' || now - lastHudAtRef.current >= 95)) {
      lastHudAtRef.current = now;
      onHudUpdate(extractPlantMergeHud(world));
    }
  });

  return null;
};

export const PlantMergeScene: React.FC<PlantMergeSceneProps> = ({
  worldRef,
  audioRef,
  onHudUpdate,
  onSelectPlot,
  onOpenShop,
}) => {
  const isSoftwareGl = useMemo(() => detectSoftwareGl(), []);
  const [contextLost, setContextLost] = useState(false);
  const [renderTick, setRenderTick] = useState(0);

  return (
    <div className="relative w-full h-full select-none overflow-hidden">
      {contextLost ? (
        <div className="w-full h-full flex items-center justify-center bg-[#182d1f] text-emerald-100 text-center p-6">
          <p className="text-lg font-bold">
            {worldRef.current.lang === 'ar'
              ? 'جاري إعادة تشغيل المزرعة ثلاثية الأبعاد...'
              : 'Restoring 3D garden scene...'}
          </p>
        </div>
      ) : (
        <Canvas
          shadows={!isSoftwareGl}
          dpr={isSoftwareGl ? 1 : [1, 2]}
          camera={{ position: [0.65, 10.6, 11.4], fov: 46, near: 0.2, far: 95 }}
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
          <GardenEnvironment
            worldRef={worldRef}
            isSoftwareGl={isSoftwareGl}
            onSelectPlot={onSelectPlot}
            onOpenShop={onOpenShop}
          />
          <Entities3D worldRef={worldRef} renderTick={renderTick} />
          <GardenLoopController
            worldRef={worldRef}
            audioRef={audioRef}
            onHudUpdate={onHudUpdate}
            onSyncList={() => setRenderTick((v) => v + 1)}
          />
        </Canvas>
      )}
    </div>
  );
};
