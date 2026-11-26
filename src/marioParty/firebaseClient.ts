import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  MARIO_MINI_GAMES,
  type MarioMiniGameId,
  type PartyCharacterId,
  type PartyDirectoryEntry,
  type PartyFriendRequest,
  type PartyFriendship,
  type PartyInvite,
  type PartyProfile,
  type PartyRoom,
  type PartyRoomPlayer,
} from './types';

const PARTY_APP_NAME = 'mario-party-applet';

const app = getApps().some((a) => a.name === PARTY_APP_NAME)
  ? getApp(PARTY_APP_NAME)
  : initializeApp(firebaseConfig, PARTY_APP_NAME);

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid ?? null,
      email: auth.currentUser?.email ?? null,
      emailVerified: auth.currentUser?.emailVerified ?? null,
      isAnonymous: auth.currentUser?.isAnonymous ?? null,
      tenantId: auth.currentUser?.tenantId ?? null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

let connectionChecked = false;

export async function testConnection(): Promise<void> {
  if (connectionChecked) return;
  connectionChecked = true;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

void testConnection();

export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const cred = await signInWithPopup(auth, provider);
  return cred.user;
}

export async function signOutPartyUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Sanitizes any Arabic/English player display name to strictly match
 * blueprint bounds (2..24 chars) and produces a deterministic ASCII hex lookup key.
 */
export function sanitizeDisplayName(raw: string): string {
  const trimmed = raw.trim().replace(/\s+/g, ' ');
  return trimmed.slice(0, 24);
}

export function encodeNameKey(displayName: string): string {
  const norm = sanitizeDisplayName(displayName).toLowerCase();
  const bytes = new TextEncoder().encode(norm);
  let hex = 'n_';
  for (let i = 0; i < bytes.length && hex.length < 116; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex.length >= 2 ? hex : 'n_00';
}

export function generateShortCode(len = 6): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < len; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

function tsToMs(val: unknown): number {
  if (val instanceof Timestamp) return val.toMillis();
  if (val && typeof val === 'object' && 'toMillis' in val) {
    const fn = (val as { toMillis?: () => number }).toMillis;
    if (typeof fn === 'function') return fn();
  }
  return Date.now();
}

export async function fetchMyProfile(uid: string): Promise<PartyProfile | null> {
  const path = `party_profiles/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'party_profiles', uid));
    if (!snap.exists()) return null;
    const d = snap.data();
    return {
      uid: String(d.uid),
      displayName: String(d.displayName),
      nameKey: String(d.nameKey),
      friendCode: String(d.friendCode),
      favoriteCharacter: (d.favoriteCharacter as PartyCharacterId) ?? 'marco',
      wins: Number(d.wins ?? 0),
      starsTotal: Number(d.starsTotal ?? 0),
      gamesPlayed: Number(d.gamesPlayed ?? 0),
      lastSeenAtMs: tsToMs(d.lastSeenAt),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function createOrUpdateProfile(
  uid: string,
  rawName: string,
  favoriteCharacter: PartyCharacterId,
  existingProfile: PartyProfile | null
): Promise<PartyProfile> {
  const displayName = sanitizeDisplayName(rawName);
  if (displayName.length < 2) {
    throw new Error('Display name must be at least 2 characters.');
  }
  const nameKey = encodeNameKey(displayName);
  const path = `party_profiles/${uid}`;

  try {
    if (!existingProfile) {
      // Pick a fresh unused 6-char friend code
      let friendCode = generateShortCode(6);
      for (let attempt = 0; attempt < 4; attempt++) {
        const check = await getDoc(doc(db, 'party_codes', friendCode));
        if (!check.exists()) break;
        friendCode = generateShortCode(6);
      }

      const nowTs = serverTimestamp();
      const batch = writeBatch(db);
      batch.set(doc(db, 'party_profiles', uid), {
        uid,
        displayName,
        nameKey,
        friendCode,
        favoriteCharacter,
        wins: 0,
        starsTotal: 0,
        gamesPlayed: 0,
        lastSeenAt: nowTs,
        createdAt: nowTs,
        updatedAt: nowTs,
      });
      batch.set(doc(db, 'party_codes', friendCode), {
        uid,
        displayName,
        friendCode,
        favoriteCharacter,
        createdAt: nowTs,
        updatedAt: nowTs,
      });
      await batch.commit();

      // Best-effort name lookup entry (gracefully skips if another player already claimed exact same name)
      try {
        const nameSnap = await getDoc(doc(db, 'party_names', nameKey));
        if (!nameSnap.exists()) {
          await setDoc(doc(db, 'party_names', nameKey), {
            uid,
            displayName,
            friendCode,
            favoriteCharacter,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch {
        // Friend code lookup is always guaranteed unique
      }

      return {
        uid,
        displayName,
        nameKey,
        friendCode,
        favoriteCharacter,
        wins: 0,
        starsTotal: 0,
        gamesPlayed: 0,
        lastSeenAtMs: Date.now(),
      };
    }

    // Update existing profile
    const nowTs = serverTimestamp();
    const batch = writeBatch(db);
    batch.update(doc(db, 'party_profiles', uid), {
      displayName,
      nameKey,
      favoriteCharacter,
      lastSeenAt: nowTs,
      updatedAt: nowTs,
    });
    batch.update(doc(db, 'party_codes', existingProfile.friendCode), {
      displayName,
      favoriteCharacter,
      updatedAt: nowTs,
    });
    await batch.commit();

    // Update name lookup index best-effort
    try {
      if (existingProfile.nameKey !== nameKey) {
        const oldNameSnap = await getDoc(doc(db, 'party_names', existingProfile.nameKey));
        if (oldNameSnap.exists() && oldNameSnap.data().uid === uid) {
          await deleteDoc(doc(db, 'party_names', existingProfile.nameKey));
        }
      }
      const newNameSnap = await getDoc(doc(db, 'party_names', nameKey));
      if (!newNameSnap.exists()) {
        await setDoc(doc(db, 'party_names', nameKey), {
          uid,
          displayName,
          friendCode: existingProfile.friendCode,
          favoriteCharacter,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else if (newNameSnap.data().uid === uid) {
        await updateDoc(doc(db, 'party_names', nameKey), {
          displayName,
          favoriteCharacter,
          updatedAt: serverTimestamp(),
        });
      }
    } catch {
      // ignore name collision
    }

    return {
      ...existingProfile,
      displayName,
      nameKey,
      favoriteCharacter,
      lastSeenAtMs: Date.now(),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function touchPresence(uid: string): Promise<void> {
  const path = `party_profiles/${uid}`;
  try {
    await updateDoc(doc(db, 'party_profiles', uid), {
      lastSeenAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch {
    // Non-fatal background heartbeat
  }
}

export async function lookupPlayerByQuery(rawQuery: string): Promise<PartyDirectoryEntry | null> {
  const cleaned = rawQuery.trim();
  if (cleaned.length < 2) return null;

  // 1) Try exact Friend Code lookup first if alphanumeric 6..8 chars
  const upperCode = cleaned.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (upperCode.length >= 6 && upperCode.length <= 8 && /^[A-Z0-9]+$/.test(upperCode)) {
    const codePath = `party_codes/${upperCode}`;
    try {
      const snap = await getDoc(doc(db, 'party_codes', upperCode));
      if (snap.exists()) {
        const d = snap.data();
        return {
          uid: String(d.uid),
          displayName: String(d.displayName),
          friendCode: String(d.friendCode),
          favoriteCharacter: (d.favoriteCharacter as PartyCharacterId) ?? 'marco',
        };
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, codePath);
    }
  }

  // 2) Try exact Display Name lookup (works for both Arabic and English!)
  const key = encodeNameKey(cleaned);
  const namePath = `party_names/${key}`;
  try {
    const snap = await getDoc(doc(db, 'party_names', key));
    if (snap.exists()) {
      const d = snap.data();
      return {
        uid: String(d.uid),
        displayName: String(d.displayName),
        friendCode: String(d.friendCode),
        favoriteCharacter: (d.favoriteCharacter as PartyCharacterId) ?? 'marco',
      };
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, namePath);
  }

  return null;
}

export function makeFriendshipId(uid1: string, uid2: string): string {
  return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
}

export async function sendFriendRequest(
  me: PartyProfile,
  target: PartyDirectoryEntry
): Promise<void> {
  if (me.uid === target.uid) return;
  const reqId = `${me.uid}_${target.uid}`;
  const path = `party_friend_requests/${reqId}`;
  try {
    const nowTs = serverTimestamp();
    await setDoc(doc(db, 'party_friend_requests', reqId), {
      fromUid: me.uid,
      fromName: me.displayName,
      fromCode: me.friendCode,
      fromCharacter: me.favoriteCharacter,
      toUid: target.uid,
      toName: target.displayName,
      toCode: target.friendCode,
      status: 'pending',
      createdAt: nowTs,
      updatedAt: nowTs,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function respondToFriendRequest(
  me: PartyProfile,
  req: PartyFriendRequest,
  accept: boolean
): Promise<void> {
  const reqPath = `party_friend_requests/${req.id}`;
  try {
    const nowTs = serverTimestamp();
    const batch = writeBatch(db);
    batch.update(doc(db, 'party_friend_requests', req.id), {
      status: accept ? 'accepted' : 'declined',
      updatedAt: nowTs,
    });
    if (accept) {
      const pairId = makeFriendshipId(req.fromUid, me.uid);
      const aIsFrom = req.fromUid < me.uid;
      batch.set(doc(db, 'party_friendships', pairId), {
        uidA: aIsFrom ? req.fromUid : me.uid,
        uidB: aIsFrom ? me.uid : req.fromUid,
        nameA: aIsFrom ? req.fromName : me.displayName,
        nameB: aIsFrom ? me.displayName : req.fromName,
        codeA: aIsFrom ? req.fromCode : me.friendCode,
        codeB: aIsFrom ? me.friendCode : req.fromCode,
        charA: aIsFrom ? req.fromCharacter : me.favoriteCharacter,
        charB: aIsFrom ? me.favoriteCharacter : req.fromCharacter,
        createdAt: nowTs,
        updatedAt: nowTs,
      });
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, reqPath);
  }
}

export async function removeFriendship(friendshipId: string): Promise<void> {
  const path = `party_friendships/${friendshipId}`;
  try {
    await deleteDoc(doc(db, 'party_friendships', friendshipId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeIncomingFriendRequests(
  uid: string,
  cb: (reqs: PartyFriendRequest[]) => void
): Unsubscribe {
  const path = 'party_friend_requests';
  const q = query(
    collection(db, path),
    where('toUid', '==', uid),
    where('status', '==', 'pending')
  );
  return onSnapshot(
    q,
    (snap) => {
      cb(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            fromUid: String(data.fromUid),
            fromName: String(data.fromName),
            fromCode: String(data.fromCode),
            fromCharacter: (data.fromCharacter as PartyCharacterId) ?? 'marco',
            toUid: String(data.toUid),
            toName: String(data.toName),
            toCode: String(data.toCode),
            status: (data.status as PartyFriendRequest['status']) ?? 'pending',
          };
        })
      );
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export function subscribeFriendships(
  uid: string,
  cb: (friends: PartyFriendship[]) => void
): Unsubscribe {
  const path = 'party_friendships';
  let listA: PartyFriendship[] = [];
  let listB: PartyFriendship[] = [];

  const emit = () => {
    const merged = new Map<string, PartyFriendship>();
    for (const f of [...listA, ...listB]) {
      merged.set(f.id, f);
    }
    cb(Array.from(merged.values()));
  };

  const mapDoc = (d: { id: string; data: () => Record<string, unknown> }): PartyFriendship => {
    const data = d.data();
    return {
      id: d.id,
      uidA: String(data.uidA),
      uidB: String(data.uidB),
      nameA: String(data.nameA),
      nameB: String(data.nameB),
      codeA: String(data.codeA),
      codeB: String(data.codeB),
      charA: (data.charA as PartyCharacterId) ?? 'marco',
      charB: (data.charB as PartyCharacterId) ?? 'marco',
    };
  };

  const unsubA = onSnapshot(
    query(collection(db, path), where('uidA', '==', uid)),
    (snap) => {
      listA = snap.docs.map(mapDoc);
      emit();
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );

  const unsubB = onSnapshot(
    query(collection(db, path), where('uidB', '==', uid)),
    (snap) => {
      listB = snap.docs.map(mapDoc);
      emit();
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );

  return () => {
    unsubA();
    unsubB();
  };
}

export function subscribeIncomingInvites(
  uid: string,
  cb: (invites: PartyInvite[]) => void
): Unsubscribe {
  const path = 'party_invites';
  const q = query(
    collection(db, path),
    where('toUid', '==', uid),
    where('status', '==', 'pending')
  );
  return onSnapshot(
    q,
    (snap) => {
      cb(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            fromUid: String(data.fromUid),
            fromName: String(data.fromName),
            fromCharacter: (data.fromCharacter as PartyCharacterId) ?? 'marco',
            toUid: String(data.toUid),
            roomCode: String(data.roomCode),
            mode: data.mode === 'cup' ? 'cup' : 'single',
            gameId: (data.gameId as MarioMiniGameId) ?? 'coin_block_bash',
            status: (data.status as PartyInvite['status']) ?? 'pending',
          };
        })
      );
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export async function sendRoomInvite(
  me: PartyProfile,
  toUid: string,
  roomCode: string,
  mode: 'cup' | 'single',
  gameId: MarioMiniGameId
): Promise<void> {
  const inviteId = `inv_${me.uid.slice(0, 12)}_${toUid.slice(0, 12)}_${Date.now().toString(36)}`;
  const path = `party_invites/${inviteId}`;
  try {
    const nowTs = serverTimestamp();
    await setDoc(doc(db, 'party_invites', inviteId), {
      fromUid: me.uid,
      fromName: me.displayName,
      fromCharacter: me.favoriteCharacter,
      toUid,
      roomCode,
      mode,
      gameId,
      status: 'pending',
      createdAt: nowTs,
      updatedAt: nowTs,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function respondToRoomInvite(inviteId: string, accept: boolean): Promise<void> {
  const path = `party_invites/${inviteId}`;
  try {
    await updateDoc(doc(db, 'party_invites', inviteId), {
      status: accept ? 'accepted' : 'declined',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function buildRandomCupQueue(
  rounds = 5,
  firstGameId?: MarioMiniGameId,
  excludeIds: MarioMiniGameId[] = []
): MarioMiniGameId[] {
  const allSpecs = [...MARIO_MINI_GAMES];
  const shuffle = <T,>(arr: T[]): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const picked: MarioMiniGameId[] = [];
  const pickedSet = new Set<MarioMiniGameId>();
  const usedCategories: string[] = [];

  const tryAdd = (id: MarioMiniGameId) => {
    if (pickedSet.has(id)) return false;
    const spec = allSpecs.find((g) => g.id === id);
    if (!spec) return false;
    picked.push(id);
    pickedSet.add(id);
    usedCategories.push(spec.category);
    return true;
  };

  if (firstGameId) {
    tryAdd(firstGameId);
  }

  // Prefer fresh games not in excludeIds first, then fall back to full pool if needed
  const freshSpecs = allSpecs.filter((g) => !excludeIds.includes(g.id) && !pickedSet.has(g.id));
  const poolThreeD = shuffle(freshSpecs.filter((g) => g.engine === 'three3d'));
  const poolCanvas = shuffle(freshSpecs.filter((g) => g.engine === 'canvas'));
  const poolBoard = shuffle(freshSpecs.filter((g) => g.engine === 'board'));

  // Interleave engines (3D, Arcade Canvas, Interactive Board) so every round feels totally fresh!
  const buckets = shuffle([poolThreeD, poolCanvas, poolBoard]);
  let bucketIdx = 0;
  let guard = 0;
  while (picked.length < rounds && guard < 120) {
    guard++;
    const bucket = buckets[bucketIdx % buckets.length];
    bucketIdx++;
    if (bucket.length === 0) continue;
    const lastCat = usedCategories[usedCategories.length - 1];
    // Try to pick a game whose category differs from the immediately preceding round
    const diffCatIdx = bucket.findIndex((g) => g.category !== lastCat);
    const chosen = diffCatIdx >= 0 ? bucket.splice(diffCatIdx, 1)[0] : bucket.shift();
    if (chosen) {
      tryAdd(chosen.id);
    }
  }

  // If rounds > available fresh games, fill remaining from full shuffled pool
  if (picked.length < rounds) {
    for (const spec of shuffle(allSpecs)) {
      if (picked.length >= rounds) break;
      tryAdd(spec.id);
    }
  }

  return picked;
}

export async function createPartyRoom(
  host: PartyProfile,
  characterId: PartyCharacterId,
  mode: 'cup' | 'single',
  initialGameId: MarioMiniGameId
): Promise<string> {
  let roomCode = generateShortCode(6);
  for (let i = 0; i < 4; i++) {
    const check = await getDoc(doc(db, 'party_rooms', roomCode));
    if (!check.exists()) break;
    roomCode = generateShortCode(6);
  }

  const cupQueue = mode === 'cup' ? buildRandomCupQueue(5, initialGameId) : [initialGameId];
  const path = `party_rooms/${roomCode}`;

  try {
    const nowTs = serverTimestamp();
    await setDoc(doc(db, 'party_rooms', roomCode), {
      roomCode,
      hostUid: host.uid,
      hostName: host.displayName,
      status: 'lobby',
      mode,
      currentGameId: cupQueue[0],
      roundIndex: 0,
      totalRounds: cupQueue.length,
      roundSeed: Math.floor(Math.random() * 1_000_000_000),
      roundStartedAtMs: 0,
      roundDurationSec: 22,
      cupQueue,
      winnerUid: '',
      winnerName: '',
      createdAt: nowTs,
      updatedAt: nowTs,
    });

    await setDoc(doc(db, 'party_rooms', roomCode, 'players', host.uid), {
      uid: host.uid,
      roomCode,
      displayName: host.displayName,
      characterId,
      ready: true,
      stars: 0,
      coins: 0,
      roundScore: 0,
      roundProgress: 0,
      roundDone: false,
      joinedAt: nowTs,
      updatedAt: nowTs,
    });

    return roomCode;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function joinPartyRoom(
  rawRoomCode: string,
  profile: PartyProfile,
  characterId: PartyCharacterId
): Promise<PartyRoom | null> {
  const roomCode = rawRoomCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (roomCode.length < 6 || roomCode.length > 8) return null;

  const roomPath = `party_rooms/${roomCode}`;
  try {
    const snap = await getDoc(doc(db, 'party_rooms', roomCode));
    if (!snap.exists()) return null;
    const d = snap.data();
    if (d.status === 'closed') return null;

    const playerRef = doc(db, 'party_rooms', roomCode, 'players', profile.uid);
    const playerSnap = await getDoc(playerRef);
    const nowTs = serverTimestamp();

    if (!playerSnap.exists()) {
      await setDoc(playerRef, {
        uid: profile.uid,
        roomCode,
        displayName: profile.displayName,
        characterId,
        ready: false,
        stars: 0,
        coins: 0,
        roundScore: 0,
        roundProgress: 0,
        roundDone: false,
        joinedAt: nowTs,
        updatedAt: nowTs,
      });
    } else {
      await updateDoc(playerRef, {
        displayName: profile.displayName,
        characterId,
        ready: false,
        updatedAt: nowTs,
      });
    }

    return parseRoomData(d);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, roomPath);
  }
}

export async function leavePartyRoom(roomCode: string, uid: string): Promise<void> {
  const path = `party_rooms/${roomCode}/players/${uid}`;
  try {
    await deleteDoc(doc(db, 'party_rooms', roomCode, 'players', uid));
  } catch {
    // Ignore if already deleted
  }
}

export async function updateMyRoomCharacter(
  roomCode: string,
  uid: string,
  displayName: string,
  characterId: PartyCharacterId,
  ready: boolean
): Promise<void> {
  const path = `party_rooms/${roomCode}/players/${uid}`;
  try {
    await updateDoc(doc(db, 'party_rooms', roomCode, 'players', uid), {
      displayName,
      characterId,
      ready,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function hostUpdateRoomConfig(
  roomCode: string,
  mode: 'cup' | 'single',
  currentGameId: MarioMiniGameId,
  cupQueue: MarioMiniGameId[]
): Promise<void> {
  const path = `party_rooms/${roomCode}`;
  try {
    await updateDoc(doc(db, 'party_rooms', roomCode), {
      mode,
      currentGameId,
      totalRounds: cupQueue.length,
      cupQueue,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function hostStartRound(
  roomCode: string,
  mode: 'cup' | 'single',
  currentGameId: MarioMiniGameId,
  roundIndex: number,
  totalRounds: number,
  durationSec: number,
  cupQueue: MarioMiniGameId[]
): Promise<void> {
  const path = `party_rooms/${roomCode}`;
  try {
    await updateDoc(doc(db, 'party_rooms', roomCode), {
      status: 'playing',
      mode,
      currentGameId,
      roundIndex,
      totalRounds,
      roundSeed: Math.floor(Math.random() * 1_000_000_000) + 1,
      roundStartedAtMs: Date.now() + 2600,
      roundDurationSec: Math.max(10, Math.min(60, Math.round(durationSec))),
      cupQueue,
      winnerUid: '',
      winnerName: '',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function syncMyLiveScore(
  roomCode: string,
  uid: string,
  roundScore: number,
  roundProgress: number,
  roundDone: boolean
): Promise<void> {
  const path = `party_rooms/${roomCode}/players/${uid}`;
  try {
    await updateDoc(doc(db, 'party_rooms', roomCode, 'players', uid), {
      roundScore: Math.max(0, Math.min(100000, Math.round(roundScore))),
      roundProgress: Math.max(0, Math.min(100, Math.round(roundProgress))),
      roundDone,
      updatedAt: serverTimestamp(),
    });
  } catch {
    // Live tick errors are non-fatal
  }
}

export async function awardMyRoundRewards(
  roomCode: string,
  uid: string,
  prevStars: number,
  prevCoins: number,
  addStars: number,
  addCoins: number,
  finalScore: number
): Promise<void> {
  const path = `party_rooms/${roomCode}/players/${uid}`;
  try {
    await updateDoc(doc(db, 'party_rooms', roomCode, 'players', uid), {
      stars: Math.min(100, prevStars + Math.max(0, Math.min(3, addStars))),
      coins: Math.min(10000, prevCoins + Math.max(0, Math.min(50, addCoins))),
      roundScore: Math.max(0, Math.min(100000, Math.round(finalScore))),
      roundProgress: 100,
      roundDone: true,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function hostFinishRound(
  roomCode: string,
  nextStatus: 'round_result' | 'podium',
  winnerUid: string,
  winnerName: string
): Promise<void> {
  const path = `party_rooms/${roomCode}`;
  try {
    await updateDoc(doc(db, 'party_rooms', roomCode), {
      status: nextStatus,
      winnerUid: winnerUid.slice(0, 128),
      winnerName: winnerName.slice(0, 24),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function hostReturnToLobby(roomCode: string): Promise<void> {
  const path = `party_rooms/${roomCode}`;
  try {
    await updateDoc(doc(db, 'party_rooms', roomCode), {
      status: 'lobby',
      roundIndex: 0,
      winnerUid: '',
      winnerName: '',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function resetMyTournamentStats(roomCode: string, uid: string): Promise<void> {
  const path = `party_rooms/${roomCode}/players/${uid}`;
  try {
    await updateDoc(doc(db, 'party_rooms', roomCode, 'players', uid), {
      stars: 0,
      coins: 0,
      roundScore: 0,
      roundProgress: 0,
      roundDone: false,
      ready: false,
      updatedAt: serverTimestamp(),
    });
  } catch {
    // Non-fatal
  }
}

export async function recordMatchProfileStats(
  profile: PartyProfile,
  won: boolean,
  earnedStars: number
): Promise<void> {
  const path = `party_profiles/${profile.uid}`;
  try {
    await updateDoc(doc(db, 'party_profiles', profile.uid), {
      wins: profile.wins + (won ? 1 : 0),
      starsTotal: profile.starsTotal + Math.max(0, Math.min(15, earnedStars)),
      gamesPlayed: profile.gamesPlayed + 1,
      lastSeenAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch {
    // Non-fatal stat bump
  }
}

function parseRoomData(d: Record<string, unknown>): PartyRoom {
  return {
    roomCode: String(d.roomCode ?? ''),
    hostUid: String(d.hostUid ?? ''),
    hostName: String(d.hostName ?? ''),
    status: (d.status as PartyRoom['status']) ?? 'lobby',
    mode: d.mode === 'cup' ? 'cup' : 'single',
    currentGameId: (d.currentGameId as MarioMiniGameId) ?? 'coin_block_bash',
    roundIndex: Number(d.roundIndex ?? 0),
    totalRounds: Number(d.totalRounds ?? 1),
    roundSeed: Number(d.roundSeed ?? 1),
    roundStartedAtMs: Number(d.roundStartedAtMs ?? 0),
    roundDurationSec: Number(d.roundDurationSec ?? 22),
    cupQueue: Array.isArray(d.cupQueue)
      ? (d.cupQueue as MarioMiniGameId[])
      : ['coin_block_bash'],
    winnerUid: String(d.winnerUid ?? ''),
    winnerName: String(d.winnerName ?? ''),
  };
}

export function subscribePartyRoom(
  roomCode: string,
  cb: (room: PartyRoom | null) => void
): Unsubscribe {
  const path = `party_rooms/${roomCode}`;
  return onSnapshot(
    doc(db, 'party_rooms', roomCode),
    (snap) => {
      if (!snap.exists()) {
        cb(null);
        return;
      }
      cb(parseRoomData(snap.data()));
    },
    (error) => handleFirestoreError(error, OperationType.GET, path)
  );
}

export function subscribeRoomPlayers(
  roomCode: string,
  cb: (players: PartyRoomPlayer[]) => void
): Unsubscribe {
  const path = `party_rooms/${roomCode}/players`;
  const q = query(collection(db, path), where('roomCode', '==', roomCode));
  return onSnapshot(
    q,
    (snap) => {
      const list: PartyRoomPlayer[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          uid: String(data.uid),
          roomCode: String(data.roomCode),
          displayName: String(data.displayName),
          characterId: (data.characterId as PartyCharacterId) ?? 'marco',
          ready: Boolean(data.ready),
          stars: Number(data.stars ?? 0),
          coins: Number(data.coins ?? 0),
          roundScore: Number(data.roundScore ?? 0),
          roundProgress: Number(data.roundProgress ?? 0),
          roundDone: Boolean(data.roundDone),
        };
      });
      list.sort((a, b) => b.stars - a.stars || b.roundScore - a.roundScore);
      cb(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}
