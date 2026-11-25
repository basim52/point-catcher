import React, { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { MonsterArenaAudio } from './audio';
import {
  extractMonsterArenaHud,
  MonsterArenaInput,
  MonsterArenaWorld,
  stepMonsterArenaWorld,
} from './gameLogic';
import { ArenaEnvironment } from './ArenaEnvironment';
import { ArenaEntities3D } from './ArenaEntities3D';
import { MonsterArenaHudSnapshot } from './types';

interface MonsterArenaSceneProps {
  worldRef: React.MutableRefObject<MonsterArenaWorld>;
  inputRef: React.MutableRefObject<MonsterArenaInput>;
  audioRef: React.MutableRefObject<MonsterArenaAudio>;
  onHudUpdate: (snapshot: MonsterArenaHudSnapshot) => void;
  onPetClick: (petEntityId: number) => void;
  onFloorClick: (x: number, z: number) => void;
}

class MonsterArenaErrorBoundary extends React.Component<
  { lang: 'ar' | 'en'; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { lang: 'ar' | 'en'; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      const isAr = this.props.lang === 'ar';
      return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-[#0a1929] text-cyan-100 text-center p-6">
          <div className="text-4xl">🏟️</div>
          <p className="text-base sm:text-lg font-extrabold">
            {isAr
              ? 'تعذّر تحميل العرض ثلاثي الأبعاد حالياً'
              : 'Unable to initialize the 3D Arena renderer'}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm cursor-pointer"
          >
            {isAr ? 'إعادة المحاولة' : 'Retry 3D View'}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
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

const ArenaLoopController: React.FC<{
  worldRef: React.MutableRefObject<MonsterArenaWorld>;
  inputRef: React.MutableRefObject<MonsterArenaInput>;
  audioRef: React.MutableRefObject<MonsterArenaAudio>;
  onHudUpdate: (snapshot: MonsterArenaHudSnapshot) => void;
  onSyncEntities: () => void;
}> = ({ worldRef, inputRef, audioRef, onHudUpdate, onSyncEntities }) => {
  const { camera } = useThree();
  const lastHudAtRef = useRef(0);
  const lastSigRef = useRef('');
  const lookTargetRef = useRef(new THREE.Vector3(0, 0.7, 0));

  useFrame((_, rawDt) => {
    const world = worldRef.current;
    const dirty = stepMonsterArenaWorld(
      world,
      rawDt,
      inputRef.current,
      audioRef.current
    );

    const dt = Math.min(rawDt, 0.05);
    let shakeX = 0;
    let shakeY = 0;
    if (world.shakeTimer > 0) {
      const mag = world.shakeIntensity * Math.min(1, world.shakeTimer / 0.35);
      shakeX = (Math.random() * 2 - 1) * mag;
      shakeY = (Math.random() * 2 - 1) * mag;
    }

    // Smooth damped 3rd-person angled follow camera
    const targetCamX = world.playerX * 0.85 + shakeX;
    const targetCamY = 14.5 + shakeY;
    const targetCamZ = world.playerZ * 0.85 + 14.2;

    camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCamX, 6.2, dt);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, targetCamY, 6.2, dt);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, targetCamZ, 6.2, dt);

    lookTargetRef.current.x = THREE.MathUtils.damp(
      lookTargetRef.current.x,
      world.playerX * 0.9,
      7.0,
      dt
    );
    lookTargetRef.current.z = THREE.MathUtils.damp(
      lookTargetRef.current.z,
      world.playerZ * 0.9,
      7.0,
      dt
    );
    camera.lookAt(lookTargetRef.current);

    // Sync React entity lists only when entities, pets, or equipped weapon change
    const sig = `${world.version}|${world.activeWeapon}|${world.pets
      .map((p) => `${p.id}:${p.level}`)
      .join(',')}|${world.monsters.map((m) => m.id).join(',')}`;
    if (sig !== lastSigRef.current) {
      lastSigRef.current = sig;
      onSyncEntities();
    }

    const now = performance.now();
    if (dirty && (world.status !== 'PLAYING' || now - lastHudAtRef.current >= 90)) {
      lastHudAtRef.current = now;
      onHudUpdate(extractMonsterArenaHud(world));
    }
  });

  return null;
};

export const MonsterArenaScene: React.FC<MonsterArenaSceneProps> = ({
  worldRef,
  inputRef,
  audioRef,
  onHudUpdate,
  onPetClick,
  onFloorClick,
}) => {
  const isSoftwareGl = useMemo(() => detectSoftwareGl(), []);
  const [contextLost, setContextLost] = useState(false);
  const [renderTick, setRenderTick] = useState(0);

  return (
    <div className="relative w-full h-full select-none overflow-hidden">
      {contextLost ? (
        <div className="w-full h-full flex items-center justify-center bg-[#181121] text-amber-100 text-center p-6">
          <p className="text-lg font-bold">
            {worldRef.current.lang === 'ar'
              ? 'جاري استعادة ساحة حلبة الوحوش 3D...'
              : 'Restoring 3D Monster Arena...'}
          </p>
        </div>
      ) : (
        <MonsterArenaErrorBoundary lang={worldRef.current.lang}>
          <Canvas
            shadows={!isSoftwareGl}
            dpr={isSoftwareGl ? 1 : [1, 2]}
            camera={{ position: [0, 14.5, 14.2], fov: 46, near: 0.2, far: 130 }}
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
              const onRestored = () => setContextLost(false);
              canvas.addEventListener('webglcontextlost', onLost, false);
              canvas.addEventListener('webglcontextrestored', onRestored, false);
            }}
          >
            <ArenaEnvironment isSoftwareGl={isSoftwareGl} onFloorClick={onFloorClick} />
            <ArenaEntities3D
              worldRef={worldRef}
              renderTick={renderTick}
              onPetClick={onPetClick}
            />
            <ArenaLoopController
              worldRef={worldRef}
              inputRef={inputRef}
              audioRef={audioRef}
              onHudUpdate={onHudUpdate}
              onSyncEntities={() => setRenderTick((v) => v + 1)}
            />
          </Canvas>
        </MonsterArenaErrorBoundary>
      )}
    </div>
  );
};
