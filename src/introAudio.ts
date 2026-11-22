// Opening Logo Audio Manager:
// 1) Built-in signature cinematic Web Audio fanfare for Point Catcher
// 2) Optional user-uploaded custom intro audio file persisted in IndexedDB

const DB_NAME = 'point_catcher_custom_audio_db';
const STORE_NAME = 'tracks';
const TRACK_KEY = 'intro_custom_music';

export interface CustomIntroTrackMeta {
  name: string;
  mimeType: string;
  updatedAt: number;
}

interface StoredCustomTrack extends CustomIntroTrackMeta {
  blob: Blob;
}

function openAudioDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = window.indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'));
  });
}

export async function saveCustomIntroAudio(file: File): Promise<CustomIntroTrackMeta> {
  const db = await openAudioDb();
  const record: StoredCustomTrack = {
    name: file.name,
    mimeType: file.type || 'audio/mpeg',
    updatedAt: Date.now(),
    blob: file,
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(record, TRACK_KEY);
    tx.oncomplete = () => {
      db.close();
      resolve({
        name: record.name,
        mimeType: record.mimeType,
        updatedAt: record.updatedAt,
      });
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error('Failed to save custom audio'));
    };
  });
}

export async function loadCustomIntroAudio(): Promise<StoredCustomTrack | null> {
  try {
    const db = await openAudioDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(TRACK_KEY);
      req.onsuccess = () => {
        db.close();
        const val = req.result as StoredCustomTrack | undefined;
        resolve(val && val.blob ? val : null);
      };
      req.onerror = () => {
        db.close();
        reject(req.error);
      };
    });
  } catch {
    return null;
  }
}

export async function clearCustomIntroAudio(): Promise<void> {
  try {
    const db = await openAudioDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(TRACK_KEY);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch {
    // ignore cleanup errors
  }
}

/**
 * Signature synthesized opening music for Point Catcher (~3.4s):
 * Warm celestial pad swell + crystalline ascending harp/bell arpeggio + triumphant golden chord resolve.
 * Returns { started: boolean, stop: () => void }.
 */
export function playSignatureIntroFanfare(): {
  started: boolean;
  stop: () => void;
} {
  if (typeof window === 'undefined') {
    return { started: false, stop: () => {} };
  }

  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AC) {
    return { started: false, stop: () => {} };
  }

  const ctx = new AC();
  let stopped = false;

  const stop = () => {
    if (stopped) return;
    stopped = true;
    try {
      ctx.close().catch(() => {});
    } catch {
      // ignore
    }
  };

  // Attempt resume; if suspended without user gesture, caller detects started=false
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  if (ctx.state !== 'running') {
    // Still schedule only if running; otherwise close cleanly so no queued noise leaks later
    stop();
    return { started: false, stop: () => {} };
  }

  const now = ctx.currentTime + 0.03;

  // Master gain with gentle fade-out at end
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.001, now);
  master.gain.linearRampToValueAtTime(0.85, now + 0.14);
  master.gain.setValueAtTime(0.85, now + 2.65);
  master.gain.exponentialRampToValueAtTime(0.001, now + 3.55);
  master.connect(ctx.destination);

  // 1. Deep Warm Sub Bass Resolve (D2 -> A2 -> D3)
  const bassNotes: [number, number, number][] = [
    [146.83, 0.0, 1.15],
    [110.0, 1.1, 0.85],
    [146.83, 1.85, 1.6],
  ];
  for (const [freq, offset, dur] of bassNotes) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + offset);
    g.gain.setValueAtTime(0.001, now + offset);
    g.gain.linearRampToValueAtTime(0.18, now + offset + 0.12);
    g.gain.exponentialRampToValueAtTime(0.001, now + offset + dur);
    osc.connect(g);
    g.connect(master);
    osc.start(now + offset);
    osc.stop(now + offset + dur + 0.05);
  }

  // 2. Lush Celestial Pad Swell (Dmaj9 shimmer)
  const padFreqs = [293.66, 369.99, 440.0, 554.37, 659.25];
  padFreqs.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const g = ctx.createGain();
    osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.detune.setValueAtTime((idx - 2) * 3.5, now);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.exponentialRampToValueAtTime(2400, now + 1.8);
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.036, now + 0.75);
    g.gain.exponentialRampToValueAtTime(0.001, now + 3.45);
    osc.connect(filter);
    filter.connect(g);
    g.connect(master);
    osc.start(now);
    osc.stop(now + 3.5);
  });

  // 3. Signature Crystalline Rising Melody (iconic 8-note logo motif)
  const motif: [number, number, number][] = [
    [587.33, 0.12, 0.36], // D5
    [739.99, 0.32, 0.36], // F#5
    [880.0, 0.52, 0.36],  // A5
    [1108.73, 0.72, 0.42], // C#6
    [1174.66, 0.96, 0.52], // D6
    [880.0, 1.32, 0.34],   // A5
    [1318.51, 1.56, 0.55], // E6
    [1479.98, 1.88, 1.45], // F#6 (golden sparkle resolve)
  ];
  for (const [freq, offset, dur] of motif) {
    const osc = ctx.createOscillator();
    const overtone = ctx.createOscillator();
    const g = ctx.createGain();
    const g2 = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + offset);
    g.gain.setValueAtTime(0.001, now + offset);
    g.gain.linearRampToValueAtTime(0.095, now + offset + 0.025);
    g.gain.exponentialRampToValueAtTime(0.001, now + offset + dur);

    overtone.type = 'sine';
    overtone.frequency.setValueAtTime(freq * 2, now + offset);
    g2.gain.setValueAtTime(0.001, now + offset);
    g2.gain.linearRampToValueAtTime(0.024, now + offset + 0.018);
    g2.gain.exponentialRampToValueAtTime(0.001, now + offset + dur * 0.65);

    osc.connect(g);
    overtone.connect(g2);
    g.connect(master);
    g2.connect(master);

    osc.start(now + offset);
    osc.stop(now + offset + dur + 0.05);
    overtone.start(now + offset);
    overtone.stop(now + offset + dur + 0.05);
  }

  // 4. Final Golden Star Shimmer Chime
  [1760.0, 2349.32].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const t = now + 2.02 + i * 0.08;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(0.032, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + 1.15);
    osc.connect(g);
    g.connect(master);
    osc.start(t);
    osc.stop(t + 1.2);
  });

  window.setTimeout(() => {
    stop();
  }, 3700);

  return { started: true, stop };
}
