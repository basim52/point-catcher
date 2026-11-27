import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { marioPartyMiniGameId } from '../analytics/games';
import { useGamePlayTracking } from '../analytics/tracker';
import { partyAudio } from './audio';
import { HeroAvatarSvg } from './CharacterArt';
import {
  auth,
  awardMyRoundRewards,
  buildRandomCupQueue,
  createOrUpdateProfile,
  createPartyRoom,
  fetchMyProfile,
  hostFinishRound,
  hostReturnToLobby,
  hostStartRound,
  hostUpdateRoomConfig,
  joinPartyRoom,
  leavePartyRoom,
  lookupPlayerByQuery,
  recordMatchProfileStats,
  removeFriendship,
  resetMyTournamentStats,
  respondToFriendRequest,
  respondToRoomInvite,
  sendFriendRequest,
  sendRoomInvite,
  signInWithGoogle,
  signOutPartyUser,
  subscribeFriendships,
  subscribeIncomingFriendRequests,
  subscribeIncomingInvites,
  subscribePartyRoom,
  subscribeRoomPlayers,
  syncMyLiveScore,
  touchPresence,
  updateMyRoomCharacter,
} from './firebaseClient';
import { MiniGamesArcadeCanvas } from './MiniGamesArcadeCanvas';
import { MiniGamesInteractiveBoard } from './MiniGamesInteractiveBoard';
import { MiniGames3DCanvas } from './MiniGames3DCanvas';
import {
  MiniGameTutorialScreen,
  PartyQuickGuideModal,
  type TutorialReadyPlayer,
} from './MiniGameTutorial';
import {
  MARIO_3D_MINI_GAMES,
  MARIO_CLASSIC_MINI_GAMES,
  MARIO_MINI_GAME_MAP,
  MARIO_MINI_GAMES,
  PARTY_CHARACTER_MAP,
  PARTY_CHARACTERS,
  recordMarioPartyMatchFinish,
  recordMarioPartyPlaySeconds,
  recordMarioPartyRoundStats,
  recordMarioPartyVisit,
  type MarioMiniGameId,
  type MiniGameCategory,
  type PartyCharacterId,
  type PartyDirectoryEntry,
  type PartyFriendRequest,
  type PartyFriendship,
  type PartyInvite,
  type PartyProfile,
  type PartyRoom,
  type PartyRoomPlayer,
} from './types';

export interface MarioPartyGameProps {
  lang: 'ar' | 'en';
  sfxEnabled: boolean;
  onExit: () => void;
}

/** Crisp Mario Party Preview Artwork for the Games Hub */
export const MarioPartyPreviewArt: React.FC = () => (
  <svg
    viewBox="0 0 360 180"
    className="w-full h-full block"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="mpSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1d4ed8" />
        <stop offset="55%" stopColor="#2563eb" />
        <stop offset="100%" stopColor="#38bdf8" />
      </linearGradient>
      <linearGradient id="mpBlock" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fde047" />
        <stop offset="100%" stopColor="#d97706" />
      </linearGradient>
      <linearGradient id="mpPipe" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#15803d" />
        <stop offset="35%" stopColor="#4ade80" />
        <stop offset="100%" stopColor="#166534" />
      </linearGradient>
    </defs>
    <rect width="360" height="180" fill="url(#mpSky)" />
    {/* Clouds */}
    <g fill="#ffffff" opacity="0.9">
      <circle cx="52" cy="40" r="14" />
      <circle cx="68" cy="36" r="17" />
      <circle cx="84" cy="42" r="12" />
      <circle cx="280" cy="34" r="13" />
      <circle cx="296" cy="30" r="16" />
      <circle cx="312" cy="36" r="12" />
    </g>
    {/* Rolling hills */}
    <path d="M 0 150 Q 70 98 150 150 Z" fill="#16a34a" />
    <path d="M 190 150 Q 285 90 360 150 Z" fill="#15803d" />
    {/* Ground brick strip */}
    <rect x="0" y="148" width="360" height="32" fill="#92400e" />
    <rect x="0" y="146" width="360" height="7" fill="#22c55e" />
    {/* Green Warp Pipe */}
    <rect x="278" y="102" width="46" height="46" fill="url(#mpPipe)" stroke="#052e16" strokeWidth="2.5" />
    <rect x="272" y="92" width="58" height="16" rx="4" fill="url(#mpPipe)" stroke="#052e16" strokeWidth="2.5" />
    {/* Question Block ? */}
    <rect x="148" y="42" width="64" height="64" rx="10" fill="url(#mpBlock)" stroke="#78350f" strokeWidth="3.5" />
    <circle cx="158" cy="52" r="3" fill="#78350f" />
    <circle cx="202" cy="52" r="3" fill="#78350f" />
    <circle cx="158" cy="96" r="3" fill="#78350f" />
    <circle cx="202" cy="96" r="3" fill="#78350f" />
    <text
      x="180"
      y="89"
      textAnchor="middle"
      fontFamily="system-ui, sans-serif"
      fontWeight="900"
      fontSize="42"
      fill="#fffbeb"
      stroke="#78350f"
      strokeWidth="2.5"
    >
      ?
    </text>
    {/* Floating Super Star */}
    <polygon
      points="92,52 99,68 117,70 103,81 107,98 92,89 77,98 81,81 67,70 85,68"
      fill="#facc15"
      stroke="#92400e"
      strokeWidth="2.5"
    />
    <circle cx="88" cy="74" r="2.2" fill="#1e293b" />
    <circle cx="96" cy="74" r="2.2" fill="#1e293b" />
    {/* Red Mario Cap Icon on left */}
    <circle cx="52" cy="126" r="19" fill="#ef4444" stroke="#7f1d1d" strokeWidth="2.5" />
    <rect x="33" y="133" width="40" height="8" rx="4" fill="#b91c1c" />
    <circle cx="52" cy="122" r="8" fill="#ffffff" />
    <text
      x="52"
      y="126"
      textAnchor="middle"
      fontFamily="system-ui, sans-serif"
      fontWeight="900"
      fontSize="11"
      fill="#dc2626"
    >
      25
    </text>
    {/* Gold Coins */}
    <ellipse cx="238" cy="64" rx="9" ry="13" fill="#facc15" stroke="#a16207" strokeWidth="2" />
    <rect x="236" y="57" width="4" height="14" rx="2" fill="#fef08a" />
    <ellipse cx="256" cy="48" rx="7" ry="10" fill="#fde047" stroke="#a16207" strokeWidth="2" />
  </svg>
);

class PartyErrorBoundary extends React.Component<
  { lang: 'ar' | 'en'; onExit: () => void; children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { lang: 'ar' | 'en'; onExit: () => void; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: unknown) {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : String(error),
    };
  }

  render() {
    if (this.state.hasError) {
      const ar = this.props.lang === 'ar';
      return (
        <div
          dir={ar ? 'rtl' : 'ltr'}
          className="fixed inset-0 z-50 bg-[#081226] text-white flex items-center justify-center p-4"
        >
          <div className="max-w-md w-full rounded-2xl border border-rose-400/40 bg-[#0f1d38] p-6 text-center space-y-4">
            <h2 className="text-xl font-black text-rose-300">
              {ar ? 'حدث خطأ مؤقت في الاتصال' : 'Temporary Connection Error'}
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              {ar
                ? 'تعذّر إكمال العملية مع الخادم. يمكنك إعادة المحاولة أو العودة لصالة الألعاب.'
                : 'Could not complete the online request. You can retry or return to the Games Hub.'}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => this.setState({ hasError: false, message: '' })}
                className="h-10 px-5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-sm cursor-pointer"
              >
                {ar ? 'إعادة المحاولة' : 'Try Again'}
              </button>
              <button
                type="button"
                onClick={this.props.onExit}
                className="h-10 px-5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-bold text-sm cursor-pointer"
              >
                {ar ? 'خروج' : 'Exit'}
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

interface SoloState {
  phase: 'character_select' | 'tutorial' | 'playing' | 'round_result' | 'podium';
  mode: 'cup' | 'single';
  cupLength: 3 | 5 | 7 | 10;
  characterId: PartyCharacterId;
  botCharacterId: PartyCharacterId;
  cupQueue: MarioMiniGameId[];
  roundIndex: number;
  currentGameId: MarioMiniGameId;
  roundSeed: number;
  myScore: number;
  myProgress: number;
  botScore: number;
  botProgress: number;
  myStars: number;
  myCoins: number;
  botStars: number;
  botCoins: number;
  roundWinner: 'me' | 'bot' | 'tie';
}

const CATEGORY_FILTERS: { id: 'all' | MiniGameCategory; ar: string; en: string }[] = [
  { id: 'all', ar: 'الكل (25)', en: 'All (25)' },
  { id: 'platform', ar: 'منصات', en: 'Platform' },
  { id: 'reflex', ar: 'سرعة', en: 'Reflex' },
  { id: 'dodge', ar: 'تفادي', en: 'Dodge' },
  { id: 'puzzle', ar: 'ذكاء', en: 'Puzzle' },
  { id: 'sport', ar: 'رياضة', en: 'Sport' },
];

function getFriendInfo(f: PartyFriendship, myUid: string) {
  const isA = f.uidA === myUid;
  return {
    id: f.id,
    uid: isA ? f.uidB : f.uidA,
    displayName: isA ? f.nameB : f.nameA,
    friendCode: isA ? f.codeB : f.codeA,
    characterId: isA ? f.charB : f.charA,
  };
}

const MarioPartyGameInner: React.FC<MarioPartyGameProps> = ({
  lang,
  sfxEnabled,
  onExit,
}) => {
  const ar = lang === 'ar';

  useEffect(() => {
    partyAudio.enabled = sfxEnabled;
  }, [sfxEnabled]);

  // Auth & Profile state
  const [authReady, setAuthReady] = useState(false);
  const [fbUser, setFbUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<PartyProfile | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [favCharInput, setFavCharInput] = useState<PartyCharacterId>('marco');
  const [authBusy, setAuthBusy] = useState(false);
  const [toast, setToast] = useState<{ text: string; tone: 'ok' | 'err' | 'info' } | null>(null);

  // Friends & Invites
  const [friendSearch, setFriendSearch] = useState('');
  const [searchResult, setSearchResult] = useState<PartyDirectoryEntry | null>(null);
  const [searchBusy, setSearchBusy] = useState(false);
  const [incomingFriendReqs, setIncomingFriendReqs] = useState<PartyFriendRequest[]>([]);
  const [friendships, setFriendships] = useState<PartyFriendship[]>([]);
  const [incomingInvites, setIncomingInvites] = useState<PartyInvite[]>([]);

  // Online Room state
  const [activeRoomCode, setActiveRoomCode] = useState<string | null>(null);
  const [room, setRoom] = useState<PartyRoom | null>(null);
  const [roomPlayers, setRoomPlayers] = useState<PartyRoomPlayer[]>([]);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [createMode, setCreateMode] = useState<'cup' | 'single'>('cup');
  const [selectedGameId, setSelectedGameId] = useState<MarioMiniGameId>('coin_block_bash');
  const [gameCategory, setGameCategory] = useState<'all' | MiniGameCategory>('all');
  const [roomBusy, setRoomBusy] = useState(false);

  // Countdown & Pre-Game Tutorial before starting each mini-game (Zero-timer Ready system)
  const [countdownNum, setCountdownNum] = useState<number>(0);
  const [onlineUnlockedSeed, setOnlineUnlockedSeed] = useState<number>(0);
  const [myTutorialReadySeed, setMyTutorialReadySeed] = useState<number>(0);
  const [tutorialReadyBusy, setTutorialReadyBusy] = useState<boolean>(false);
  const onlineActiveStartAtMsRef = useRef<number>(0);
  const [showTutorialBeforeRound, setShowTutorialBeforeRound] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    try {
      return window.localStorage.getItem('point_catcher_mario_tutorial_v1') !== '0';
    } catch {
      return true;
    }
  });
  const [previewTutorialGameId, setPreviewTutorialGameId] = useState<MarioMiniGameId | null>(null);
  const [showQuickGuide, setShowQuickGuide] = useState<boolean>(false);

  const toggleShowTutorialBeforeRound = useCallback((next: boolean) => {
    setShowTutorialBeforeRound(next);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('point_catcher_mario_tutorial_v1', next ? '1' : '0');
      } catch {
        // ignore storage errors
      }
    }
  }, []);

  // Solo / Practice vs Rival Bot mode (accessible immediately, also has full Character Select + 25 Mini-Games)
  const [solo, setSolo] = useState<SoloState | null>(null);

  // Computer Bot live stats when playing alone inside an online room (so Computer is always in TOP!)
  const [roomBot, setRoomBot] = useState<{
    characterId: PartyCharacterId;
    roundScore: number;
    roundProgress: number;
    stars: number;
    coins: number;
  }>({
    characterId: 'koopa',
    roundScore: 0,
    roundProgress: 0,
    stars: 0,
    coins: 0,
  });
  const roomBotAwardedSeedRef = useRef<number>(0);
  const recordedSoloRoundSeedRef = useRef<number>(0);
  const recordedSoloPodiumSeedRef = useRef<number>(0);

  // URL invite code (?partyRoom=XXXXXX)
  const [pendingUrlRoom, setPendingUrlRoom] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const code = params.get('partyRoom');
    if (code && /^[A-Za-z0-9]{6,8}$/.test(code.trim())) {
      return code.trim().toUpperCase();
    }
    return null;
  });

  // Guards so host/player transitions fire once per roundSeed
  const hostFinishedSeedRef = useRef<number>(0);
  const rewardedSeedRef = useRef<number>(0);
  const recordedPodiumSeedRef = useRef<number>(0);
  const lastLiveSyncAtRef = useRef<number>(0);
  const myLocalScoreRef = useRef<number>(0);
  const hadPodiumRef = useRef<boolean>(false);

  // Count Mario Party entry and active play time in local player stats
  useEffect(() => {
    recordMarioPartyVisit();
    let pendingSecs = 0;
    const flush = () => {
      if (pendingSecs > 0) {
        recordMarioPartyPlaySeconds(pendingSecs);
        pendingSecs = 0;
      }
    };
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      pendingSecs += 1;
      if (pendingSecs >= 5) {
        flush();
      }
    }, 1000);
    const onHidden = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    document.addEventListener('visibilitychange', onHidden);
    window.addEventListener('beforeunload', flush);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onHidden);
      window.removeEventListener('beforeunload', flush);
      flush();
    };
  }, []);

  const showToast = useCallback((text: string, tone: 'ok' | 'err' | 'info' = 'info') => {
    setToast({ text, tone });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFbUser(user);
      if (!user) {
        setProfile(null);
        setAuthReady(true);
        return;
      }
      try {
        const existing = await fetchMyProfile(user.uid);
        if (existing) {
          setProfile(existing);
          setNameInput(existing.displayName);
          setFavCharInput(existing.favoriteCharacter);
          void touchPresence(user.uid);
        } else {
          setProfile(null);
          setNameInput((user.displayName ?? '').slice(0, 20));
          setFavCharInput('marco');
        }
      } catch {
        showToast(
          ar ? 'تعذر تحميل ملفك الشخصي. حاول مرة أخرى.' : 'Could not load your profile.',
          'err'
        );
      } finally {
        setAuthReady(true);
      }
    });
    return unsub;
  }, [ar, showToast]);

  // Subscribe to friends, friend requests, and incoming room invites once signed in with profile
  useEffect(() => {
    if (!profile) {
      setIncomingFriendReqs([]);
      setFriendships([]);
      setIncomingInvites([]);
      return;
    }
    const unsubReqs = subscribeIncomingFriendRequests(profile.uid, setIncomingFriendReqs);
    const unsubFriends = subscribeFriendships(profile.uid, setFriendships);
    const unsubInvites = subscribeIncomingInvites(profile.uid, setIncomingInvites);
    const hb = window.setInterval(() => void touchPresence(profile.uid), 45_000);
    return () => {
      unsubReqs();
      unsubFriends();
      unsubInvites();
      window.clearInterval(hb);
    };
  }, [profile]);

  // Auto-join room from ?partyRoom=XXXXXX link once profile is ready
  useEffect(() => {
    if (!profile || !pendingUrlRoom || activeRoomCode) return;
    const code = pendingUrlRoom;
    setPendingUrlRoom(null);
    setJoinCodeInput(code);
    void (async () => {
      try {
        const joined = await joinPartyRoom(code, profile, profile.favoriteCharacter);
        if (joined) {
          setActiveRoomCode(joined.roomCode);
          setSolo(null);
          showToast(
            ar ? `تم الدخول إلى الغرفة ${joined.roomCode}! اختر شخصيتك الآن.` : `Joined room ${joined.roomCode}! Pick your hero.`,
            'ok'
          );
        }
      } catch {
        showToast(ar ? 'لم نجد هذه الغرفة.' : 'Room not found.', 'err');
      }
    })();
  }, [profile, pendingUrlRoom, activeRoomCode, ar, showToast]);

  // Subscribe to active online room + its players
  useEffect(() => {
    if (!activeRoomCode) {
      setRoom(null);
      setRoomPlayers([]);
      return;
    }
    const unsubRoom = subscribePartyRoom(activeRoomCode, (r) => {
      if (!r || r.status === 'closed') {
        setRoom(null);
        setActiveRoomCode(null);
        showToast(ar ? 'تم إغلاق الغرفة.' : 'Room was closed.', 'info');
        return;
      }
      setRoom(r);
    });
    const unsubPlayers = subscribeRoomPlayers(activeRoomCode, setRoomPlayers);
    return () => {
      unsubRoom();
      unsubPlayers();
    };
  }, [activeRoomCode, ar, showToast]);

  const myPlayer = useMemo(() => {
    if (!profile) return null;
    return roomPlayers.find((p) => p.uid === profile.uid) ?? null;
  }, [roomPlayers, profile]);

  const isHost = Boolean(room && profile && room.hostUid === profile.uid);

  // Per-player Ready status during the zero-timer Online pre-game tutorial
  const onlineTutorialReadyList = useMemo<TutorialReadyPlayer[]>(() => {
    if (!room || room.status !== 'playing' || room.roundStartedAtMs !== 0) return [];
    const roomTs = room.updatedAtMs ?? 0;
    return roomPlayers.map((p) => {
      const isMe = p.uid === profile?.uid;
      const pTs = p.updatedAtMs ?? 0;
      const serverReady = Boolean(p.ready && roomTs > 0 && pTs >= roomTs);
      const localPendingReady = Boolean(
        isMe && p.ready && pTs === 0 && myTutorialReadySeed === room.roundSeed
      );
      return {
        uid: p.uid,
        displayName: p.displayName,
        characterId: p.characterId,
        isReady: serverReady || localPendingReady,
        isMe,
      };
    });
  }, [room, roomPlayers, profile?.uid, myTutorialReadySeed]);

  const isOnlineWaitingTutorial = Boolean(
    room &&
      room.status === 'playing' &&
      room.roundStartedAtMs === 0 &&
      onlineUnlockedSeed !== room.roundSeed
  );

  // Admin analytics: track each individual Mario Party mini-game played (solo & online).
  const activeMarioSubGame: MarioMiniGameId | null =
    solo && solo.phase === 'playing'
      ? solo.currentGameId
      : room && room.status === 'playing' && !isOnlineWaitingTutorial
        ? room.currentGameId
        : null;
  useGamePlayTracking(
    marioPartyMiniGameId(activeMarioSubGame),
    Boolean(activeMarioSubGame) && countdownNum === 0
  );

  // Unlock online round immediately once EVERY player in the room clicks Ready (NO timer!)
  useEffect(() => {
    if (!room || room.status !== 'playing') {
      setOnlineUnlockedSeed(0);
      setMyTutorialReadySeed(0);
      onlineActiveStartAtMsRef.current = 0;
      return;
    }
    if (room.roundStartedAtMs !== 0) return;
    if (onlineUnlockedSeed === room.roundSeed) return;
    if (
      onlineTutorialReadyList.length > 0 &&
      onlineTutorialReadyList.every((p) => p.isReady)
    ) {
      onlineActiveStartAtMsRef.current = Date.now() + 2100;
      setCountdownNum(3);
      setOnlineUnlockedSeed(room.roundSeed);
    }
  }, [room?.status, room?.roundSeed, room?.roundStartedAtMs, onlineUnlockedSeed, onlineTutorialReadyList]);

  const handleToggleOnlineTutorialReady = useCallback(async () => {
    if (!room || !profile || !myPlayer || tutorialReadyBusy) return;
    const currentlyReady =
      onlineTutorialReadyList.find((p) => p.uid === profile.uid)?.isReady ?? false;
    const nextReady = !currentlyReady;
    setTutorialReadyBusy(true);
    partyAudio.playSelect();
    try {
      setMyTutorialReadySeed(nextReady ? room.roundSeed : 0);
      await updateMyRoomCharacter(
        room.roomCode,
        profile.uid,
        profile.displayName,
        myPlayer.characterId,
        nextReady
      );
    } catch {
      showToast(ar ? 'تعذر تحديث الجاهزية. حاول مرة أخرى.' : 'Could not update ready state.', 'err');
    } finally {
      setTutorialReadyBusy(false);
    }
  }, [room, profile, myPlayer, tutorialReadyBusy, onlineTutorialReadyList, ar, showToast]);

  // Run crisp 3-2-1 kickoff countdown once online players are all Ready (or for legacy timed rooms)
  useEffect(() => {
    if (!room || room.status !== 'playing') {
      setCountdownNum(0);
      return;
    }

    // Zero-timer tutorial mode: wait until everyone clicked Ready!
    if (room.roundStartedAtMs === 0) {
      if (onlineUnlockedSeed !== room.roundSeed) {
        setCountdownNum(0);
        return;
      }
      myLocalScoreRef.current = 0;
      if (profile) {
        void syncMyLiveScore(room.roomCode, profile.uid, 0, 0, false);
      }
      setCountdownNum(3);
      partyAudio.playCountdown(false);
      const t1 = window.setTimeout(() => {
        setCountdownNum(2);
        partyAudio.playCountdown(false);
      }, 700);
      const t2 = window.setTimeout(() => {
        setCountdownNum(1);
        partyAudio.playCountdown(false);
      }, 1400);
      const t3 = window.setTimeout(() => {
        setCountdownNum(0);
        partyAudio.playCountdown(true);
      }, 2100);
      return () => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
        window.clearTimeout(t3);
      };
    }

    // Fallback for rooms with an explicit roundStartedAtMs timestamp
    myLocalScoreRef.current = 0;
    if (profile) {
      void syncMyLiveScore(room.roomCode, profile.uid, 0, 0, false);
    }
    const updateCd = () => {
      const msLeft = room.roundStartedAtMs - Date.now();
      if (msLeft <= 0) {
        setCountdownNum(0);
        return false;
      }
      const next = Math.min(3, Math.ceil(msLeft / 800));
      setCountdownNum((prev) => {
        if (prev !== next) partyAudio.playCountdown(false);
        return next;
      });
      return true;
    };

    if (!updateCd()) {
      partyAudio.playCountdown(true);
      return;
    }
    const interval = window.setInterval(() => {
      if (!updateCd()) {
        partyAudio.playCountdown(true);
        window.clearInterval(interval);
      }
    }, 120);
    return () => window.clearInterval(interval);
  }, [room?.status, room?.roundSeed, room?.roundStartedAtMs, room?.roomCode, profile?.uid, onlineUnlockedSeed]);

  // Host watchdog: ends the round when all players finish or grace timer expires
  useEffect(() => {
    if (!isHost || !room || room.status !== 'playing') return;
    if (hostFinishedSeedRef.current === room.roundSeed) return;
    // Never finish a round while players are reading the zero-timer tutorial!
    if (room.roundStartedAtMs === 0 && onlineUnlockedSeed !== room.roundSeed) return;

    const checkAndFinish = () => {
      if (hostFinishedSeedRef.current === room.roundSeed) return;

      const now = Date.now();
      const baseStartMs =
        room.roundStartedAtMs > 0
          ? room.roundStartedAtMs
          : onlineActiveStartAtMsRef.current || now;
      // CRITICAL: Never finish a round during the 3-2-1 countdown or early gameplay!
      // Stale `roundDone: true` flags from the previous round would otherwise cancel the new round instantly.
      const minFinishAt =
        baseStartMs + Math.max(5000, (room.roundDurationSec - 6) * 1000);
      const hardDeadline = baseStartMs + (room.roundDurationSec + 4) * 1000;
      if (now < minFinishAt) return;

      const allDone =
        roomPlayers.length > 0 && roomPlayers.every((p) => p.roundDone);
      const timedOut = now >= hardDeadline;
      if (!allDone && !timedOut) return;

      hostFinishedSeedRef.current = room.roundSeed;
      const sortedByRound = [...roomPlayers].sort((a, b) => b.roundScore - a.roundScore);
      const roundLeader = sortedByRound[0];
      const isLastRound = room.roundIndex + 1 >= room.totalRounds;
      const nextStatus: 'round_result' | 'podium' = isLastRound ? 'podium' : 'round_result';

      let winnerUid = roundLeader?.uid ?? room.hostUid;
      let winnerName = roundLeader?.displayName ?? room.hostName;
      if (isLastRound && roomPlayers.length > 0) {
        const projected = roomPlayers
          .map((p) => ({
            ...p,
            projStars: p.stars + (roundLeader && p.roundScore === roundLeader.roundScore && p.roundScore > 0 ? 1 : 0),
          }))
          .sort((a, b) => b.projStars - a.projStars || b.coins - a.coins || b.roundScore - a.roundScore);
        winnerUid = projected[0].uid;
        winnerName = projected[0].displayName;
      }

      void hostFinishRound(room.roomCode, nextStatus, winnerUid, winnerName).catch(() => {
        hostFinishedSeedRef.current = 0;
      });
    };

    checkAndFinish();
    const timer = window.setInterval(checkAndFinish, 500);
    return () => window.clearInterval(timer);
  }, [isHost, room, roomPlayers, onlineUnlockedSeed]);

  // Each player awards THEIR OWN stars & coins idempotently when round finishes
  useEffect(() => {
    if (!room || !profile || !myPlayer) return;
    if (room.status === 'podium') {
      hadPodiumRef.current = true;
    }
    if (room.status === 'lobby' && hadPodiumRef.current) {
      hadPodiumRef.current = false;
      void resetMyTournamentStats(room.roomCode, profile.uid);
      return;
    }
    if (room.status !== 'round_result' && room.status !== 'podium') return;
    if (rewardedSeedRef.current === room.roundSeed) return;
    rewardedSeedRef.current = room.roundSeed;

    const myScore = Math.max(myPlayer.roundScore, myLocalScoreRef.current);
    const maxScore = Math.max(myScore, ...roomPlayers.map((p) => p.roundScore));
    const wonRound = myScore > 0 && myScore >= maxScore;
    const rank =
      1 + roomPlayers.filter((p) => p.uid !== profile.uid && p.roundScore > myScore).length;
    const addStars = wonRound ? 1 : 0;
    const addCoins = rank === 1 ? 15 : rank === 2 ? 10 : 5;

    if (wonRound || room.status === 'podium') {
      partyAudio.playVictory();
    }

    void awardMyRoundRewards(
      room.roomCode,
      profile.uid,
      myPlayer.stars,
      myPlayer.coins,
      addStars,
      addCoins,
      myScore
    );
    // Clear tutorial Ready flag for the upcoming round so everyone explicitly clicks Ready next round
    void updateMyRoomCharacter(
      room.roomCode,
      profile.uid,
      profile.displayName,
      myPlayer.characterId,
      false
    ).catch(() => undefined);

    // Record every completed Online round so stats update even before the final podium
    recordMarioPartyRoundStats({
      starsEarned: addStars,
      roundScore: myScore,
    });

    if (room.status === 'podium' && recordedPodiumSeedRef.current !== room.roundSeed) {
      recordedPodiumSeedRef.current = room.roundSeed;
      const wonMatch = room.winnerUid === profile.uid;
      const totalEarnedStars = myPlayer.stars + addStars;
      void recordMatchProfileStats(profile, wonMatch, totalEarnedStars);
      recordMarioPartyMatchFinish({
        won: wonMatch,
        bestRoundScore: myScore,
      });
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              wins: prev.wins + (wonMatch ? 1 : 0),
              starsTotal: prev.starsTotal + totalEarnedStars,
              gamesPlayed: prev.gamesPlayed + 1,
            }
          : prev
      );
    }
  }, [room?.status, room?.roundSeed, room?.roomCode, room?.winnerUid, profile, myPlayer, roomPlayers]);

  // Record unified Mario Party local stats on EVERY Solo/Computer round & podium finish
  useEffect(() => {
    if (!solo || (solo.phase !== 'round_result' && solo.phase !== 'podium')) return;
    if (recordedSoloRoundSeedRef.current !== solo.roundSeed) {
      recordedSoloRoundSeedRef.current = solo.roundSeed;
      recordMarioPartyRoundStats({
        starsEarned: solo.roundWinner === 'me' ? 1 : 0,
        roundScore: solo.myScore,
      });
    }
    if (solo.phase === 'podium' && recordedSoloPodiumSeedRef.current !== solo.roundSeed) {
      recordedSoloPodiumSeedRef.current = solo.roundSeed;
      const wonSolo =
        solo.myStars > solo.botStars ||
        (solo.myStars === solo.botStars && solo.myCoins >= solo.botCoins);
      recordMarioPartyMatchFinish({
        won: wonSolo,
        bestRoundScore: solo.myScore,
      });
    }
  }, [
    solo?.phase,
    solo?.roundSeed,
    solo?.roundWinner,
    solo?.myStars,
    solo?.botStars,
    solo?.myCoins,
    solo?.botCoins,
    solo?.myScore,
  ]);

  // Solo mode rival bot live simulation during playing phase
  useEffect(() => {
    if (!solo || solo.phase !== 'playing') return;
    if (countdownNum > 0) return;

    const spec = MARIO_MINI_GAME_MAP[solo.currentGameId];
    const targetScore = 90 + (solo.roundSeed % 95);
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const elapsed = (Date.now() - startedAt) / 1000;
      const prog = Math.min(100, Math.round((elapsed / spec.durationSec) * 100));
      const wobble = Math.sin(elapsed * 2.4 + solo.roundSeed) * 6;
      const botScore = Math.max(0, Math.round((prog / 100) * targetScore + wobble));
      setSolo((prev) =>
        prev && prev.phase === 'playing'
          ? { ...prev, botProgress: prog, botScore }
          : prev
      );
    }, 250);
    return () => window.clearInterval(timer);
  }, [solo?.phase, solo?.roundSeed, solo?.currentGameId, countdownNum]);

  // Computer Bot simulation when playing an Online Room solo (1 human player) so Computer appears in TOP!
  useEffect(() => {
    if (!room || roomPlayers.length !== 1) return;
    const myChar = myPlayer?.characterId ?? 'marco';
    const botChar: PartyCharacterId = myChar === 'koopa' ? 'wario' : 'koopa';
    if (room.status === 'lobby') {
      setRoomBot({ characterId: botChar, roundScore: 0, roundProgress: 0, stars: 0, coins: 0 });
      return;
    }
    if (room.status !== 'playing' || countdownNum > 0 || isOnlineWaitingTutorial) return;

    setRoomBot((prev) => ({
      ...prev,
      characterId: botChar,
      roundScore: 0,
      roundProgress: 0,
    }));

    const targetScore = 95 + (room.roundSeed % 95);
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const elapsed = (Date.now() - startedAt) / 1000;
      const prog = Math.min(100, Math.round((elapsed / room.roundDurationSec) * 100));
      const wobble = Math.sin(elapsed * 2.3 + room.roundSeed) * 6;
      const botScore = Math.max(0, Math.round((prog / 100) * targetScore + wobble));
      setRoomBot((prev) => ({
        ...prev,
        characterId: botChar,
        roundProgress: prog,
        roundScore: botScore,
      }));
    }, 250);
    return () => window.clearInterval(timer);
  }, [room?.status, room?.roundSeed, room?.roundDurationSec, roomPlayers.length, countdownNum, isOnlineWaitingTutorial, myPlayer?.characterId]);

  // Award roomBot stars/coins once per round when playing alone in an online room
  useEffect(() => {
    if (!room || roomPlayers.length !== 1) return;
    if (room.status !== 'round_result' && room.status !== 'podium') return;
    if (roomBotAwardedSeedRef.current === room.roundSeed) return;
    roomBotAwardedSeedRef.current = room.roundSeed;

    const myScore = Math.max(myPlayer?.roundScore ?? 0, myLocalScoreRef.current);
    setRoomBot((prev) => {
      const botWon = prev.roundScore > myScore;
      return {
        ...prev,
        roundProgress: 100,
        stars: prev.stars + (botWon ? 1 : 0),
        coins: prev.coins + (botWon ? 15 : prev.roundScore === myScore ? 10 : 5),
      };
    });
  }, [room?.status, room?.roundSeed, roomPlayers.length, myPlayer?.roundScore]);

  // Countdown helper for solo mode
  useEffect(() => {
    if (!solo || solo.phase !== 'playing') return;
    setCountdownNum(3);
    partyAudio.playCountdown(false);
    const t1 = window.setTimeout(() => {
      setCountdownNum(2);
      partyAudio.playCountdown(false);
    }, 700);
    const t2 = window.setTimeout(() => {
      setCountdownNum(1);
      partyAudio.playCountdown(false);
    }, 1400);
    const t3 = window.setTimeout(() => {
      setCountdownNum(0);
      partyAudio.playCountdown(true);
    }, 2100);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [solo?.phase, solo?.roundSeed]);

  // Actions
  const handleGoogleSignIn = async () => {
    setAuthBusy(true);
    try {
      await signInWithGoogle();
      partyAudio.playSelect();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (!msg.includes('popup-closed-by-user')) {
        showToast(
          ar ? 'فشل تسجيل الدخول. تأكد من السماح بالنوافذ المنبثقة.' : 'Sign-in failed. Please allow popups and try again.',
          'err'
        );
      }
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbUser) return;
    const cleaned = nameInput.trim();
    if (cleaned.length < 2) {
      showToast(ar ? 'اكتب اسماً من حرفين على الأقل.' : 'Enter a name with at least 2 characters.', 'err');
      return;
    }
    setAuthBusy(true);
    try {
      const saved = await createOrUpdateProfile(fbUser.uid, cleaned, favCharInput, profile);
      setProfile(saved);
      setEditingProfile(false);
      partyAudio.playStar();
      showToast(
        ar ? `أهلاً ${saved.displayName}! كود الصداقة الخاص بك: ${saved.friendCode}` : `Welcome ${saved.displayName}! Friend Code: ${saved.friendCode}`,
        'ok'
      );
    } catch {
      showToast(ar ? 'تعذر حفظ الاسم. حاول مجدداً.' : 'Could not save profile.', 'err');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSearchFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendSearch.trim()) return;
    setSearchBusy(true);
    setSearchResult(null);
    try {
      const found = await lookupPlayerByQuery(friendSearch);
      if (!found) {
        showToast(
          ar ? 'لم نجد لاعباً بهذا الاسم أو الكود.' : 'No player found with that name or friend code.',
          'err'
        );
      } else if (profile && found.uid === profile.uid) {
        showToast(ar ? 'هذا حسابك أنت!' : 'That is your own account!', 'info');
      } else {
        setSearchResult(found);
        partyAudio.playSelect();
      }
    } catch {
      showToast(ar ? 'تعذر البحث الآن.' : 'Search failed.', 'err');
    } finally {
      setSearchBusy(false);
    }
  };

  const handleSendFriendRequest = async (target: PartyDirectoryEntry) => {
    if (!profile) return;
    try {
      await sendFriendRequest(profile, target);
      partyAudio.playCoin();
      setSearchResult(null);
      setFriendSearch('');
      showToast(
        ar ? `تم إرسال طلب صداقة إلى ${target.displayName}!` : `Friend request sent to ${target.displayName}!`,
        'ok'
      );
    } catch {
      showToast(ar ? 'تعذر إرسال الطلب.' : 'Could not send request.', 'err');
    }
  };

  const handleRespondFriendReq = async (req: PartyFriendRequest, accept: boolean) => {
    if (!profile) return;
    try {
      await respondToFriendRequest(profile, req, accept);
      partyAudio.playSelect();
      showToast(
        accept
          ? ar
            ? `أصبح ${req.fromName} صديقك الآن!`
            : `${req.fromName} is now your friend!`
          : ar
          ? 'تم رفض الطلب.'
          : 'Request declined.',
        accept ? 'ok' : 'info'
      );
    } catch {
      showToast(ar ? 'حدث خطأ.' : 'Action failed.', 'err');
    }
  };

  const handleCreateRoom = async (modeOverride?: 'cup' | 'single') => {
    if (!profile) return;
    setRoomBusy(true);
    try {
      const mode = modeOverride ?? createMode;
      const code = await createPartyRoom(profile, profile.favoriteCharacter, mode, selectedGameId);
      setActiveRoomCode(code);
      setSolo(null);
      partyAudio.playStar();
      showToast(
        ar ? `تم إنشاء الغرفة ${code}! اختر شخصيتك وادعُ أصدقاءك.` : `Room ${code} created! Pick your hero and invite friends.`,
        'ok'
      );
    } catch {
      showToast(ar ? 'تعذر إنشاء الغرفة.' : 'Could not create room.', 'err');
    } finally {
      setRoomBusy(false);
    }
  };

  const handleJoinByCode = async (e?: React.FormEvent, explicitCode?: string) => {
    if (e) e.preventDefault();
    if (!profile) return;
    const code = (explicitCode ?? joinCodeInput).trim().toUpperCase();
    if (code.length < 6) {
      showToast(ar ? 'أدخل كود غرفة من 6 أحرف.' : 'Enter a 6-character room code.', 'err');
      return;
    }
    setRoomBusy(true);
    try {
      const joined = await joinPartyRoom(code, profile, profile.favoriteCharacter);
      if (!joined) {
        showToast(ar ? 'لم نجد غرفة بهذا الكود.' : 'Room code not found.', 'err');
      } else {
        setActiveRoomCode(joined.roomCode);
        setJoinCodeInput('');
        setSolo(null);
        partyAudio.playStar();
      }
    } catch {
      showToast(ar ? 'تعذر الانضمام للغرفة.' : 'Could not join room.', 'err');
    } finally {
      setRoomBusy(false);
    }
  };

  const handleInviteFriend = async (friendUid: string, friendName: string) => {
    if (!profile) return;
    try {
      let targetRoomCode = activeRoomCode;
      let targetMode: 'cup' | 'single' = room?.mode ?? createMode;
      let targetGame: MarioMiniGameId = room?.currentGameId ?? selectedGameId;
      if (!targetRoomCode) {
        targetRoomCode = await createPartyRoom(
          profile,
          profile.favoriteCharacter,
          createMode,
          selectedGameId
        );
        setActiveRoomCode(targetRoomCode);
        setSolo(null);
      }
      await sendRoomInvite(profile, friendUid, targetRoomCode, targetMode, targetGame);
      partyAudio.playCoin();
      showToast(
        ar ? `تمت دعوة ${friendName} إلى الغرفة ${targetRoomCode}!` : `Invited ${friendName} to room ${targetRoomCode}!`,
        'ok'
      );
    } catch {
      showToast(ar ? 'تعذر إرسال الدعوة.' : 'Could not send invite.', 'err');
    }
  };

  const handleRespondInvite = async (inv: PartyInvite, accept: boolean) => {
    if (!profile) return;
    try {
      await respondToRoomInvite(inv.id, accept);
      if (accept) {
        const joined = await joinPartyRoom(inv.roomCode, profile, profile.favoriteCharacter);
        if (joined) {
          setActiveRoomCode(joined.roomCode);
          setSolo(null);
          partyAudio.playStar();
        } else {
          showToast(ar ? 'الغرفة لم تعد متاحة.' : 'Room is no longer active.', 'err');
        }
      }
    } catch {
      showToast(ar ? 'تعذر الاستجابة للدعوة.' : 'Invite response failed.', 'err');
    }
  };

  const handleLeaveRoom = async () => {
    if (activeRoomCode && profile) {
      await leavePartyRoom(activeRoomCode, profile.uid);
    }
    setActiveRoomCode(null);
    setRoom(null);
    setRoomPlayers([]);
  };

  const handleSelectRoomHero = async (charId: PartyCharacterId) => {
    partyAudio.playSelect();
    if (solo) {
      const botPool = PARTY_CHARACTERS.filter((c) => c.id !== charId);
      const nextBot =
        solo.botCharacterId === charId
          ? botPool[0].id
          : solo.botCharacterId;
      setSolo((prev) =>
        prev ? { ...prev, characterId: charId, botCharacterId: nextBot } : prev
      );
      return;
    }
    if (!room || !profile || !myPlayer) return;
    await updateMyRoomCharacter(room.roomCode, profile.uid, profile.displayName, charId, true);
  };

  const handleToggleReady = async () => {
    if (!room || !profile || !myPlayer) return;
    partyAudio.playSelect();
    await updateMyRoomCharacter(
      room.roomCode,
      profile.uid,
      profile.displayName,
      myPlayer.characterId,
      !myPlayer.ready
    );
  };

  const handleHostPickGame = async (gameId: MarioMiniGameId) => {
    partyAudio.playSelect();
    setSelectedGameId(gameId);
    if (solo) {
      const queue =
        solo.mode === 'cup' ? buildRandomCupQueue(solo.cupLength, gameId) : [gameId];
      setSolo((prev) =>
        prev ? { ...prev, currentGameId: gameId, cupQueue: queue } : prev
      );
      return;
    }
    if (!room || !isHost) return;
    const queue = room.mode === 'cup' ? buildRandomCupQueue(5, gameId) : [gameId];
    await hostUpdateRoomConfig(room.roomCode, room.mode, gameId, queue);
  };

  const handleHostSwitchMode = async (mode: 'cup' | 'single') => {
    partyAudio.playSelect();
    if (solo) {
      const queue =
        mode === 'cup'
          ? buildRandomCupQueue(solo.cupLength, solo.currentGameId)
          : [solo.currentGameId];
      setSolo((prev) => (prev ? { ...prev, mode, cupQueue: queue } : prev));
      return;
    }
    if (!room || !isHost) return;
    const queue = mode === 'cup' ? buildRandomCupQueue(5, room.currentGameId) : [room.currentGameId];
    await hostUpdateRoomConfig(room.roomCode, mode, queue[0], queue);
  };

  const handleSoloCupLength = (len: 3 | 5 | 7 | 10) => {
    partyAudio.playSelect();
    setSolo((prev) => {
      if (!prev) return prev;
      const queue = buildRandomCupQueue(len, undefined, prev.cupQueue);
      return {
        ...prev,
        mode: 'cup',
        cupLength: len,
        cupQueue: queue,
        currentGameId: queue[0],
      };
    });
  };

  const handleShuffleCupGames = async () => {
    partyAudio.playSelect();
    if (solo) {
      const queue = buildRandomCupQueue(solo.cupLength, undefined, solo.cupQueue);
      setSelectedGameId(queue[0]);
      setSolo((prev) =>
        prev
          ? { ...prev, mode: 'cup', cupQueue: queue, currentGameId: queue[0] }
          : prev
      );
      return;
    }
    if (!room || !isHost) return;
    const queue = buildRandomCupQueue(5, undefined, room.cupQueue);
    setSelectedGameId(queue[0]);
    await hostUpdateRoomConfig(room.roomCode, 'cup', queue[0], queue);
  };

  const handleHostLaunchMatch = async () => {
    if (!room || !isHost || !profile || roomBusy) return;
    setRoomBusy(true);
    try {
      const safeQueue =
        room.cupQueue.length > 0 ? room.cupQueue.slice(0, 10) : buildRandomCupQueue(5, room.currentGameId);
      const gameId = safeQueue[0] ?? room.currentGameId;
      const spec = MARIO_MINI_GAME_MAP[gameId] ?? MARIO_MINI_GAMES[0];
      hostFinishedSeedRef.current = 0;
      rewardedSeedRef.current = 0;
      recordedPodiumSeedRef.current = 0;
      myLocalScoreRef.current = 0;
      // Reset host player's roundDone BEFORE starting the round so watchdog never sees stale done state
      await syncMyLiveScore(room.roomCode, profile.uid, 0, 0, false);
      await hostStartRound(
        room.roomCode,
        room.mode,
        gameId,
        0,
        safeQueue.length,
        spec.durationSec,
        safeQueue
      );
    } catch {
      showToast(ar ? 'تعذر بدء المباراة. حاول مرة أخرى.' : 'Could not start match. Please retry.', 'err');
    } finally {
      setRoomBusy(false);
    }
  };

  const handleHostNextRound = async () => {
    if (!room || !isHost || !profile || roomBusy) return;
    setRoomBusy(true);
    try {
      const safeQueue =
        room.cupQueue.length > 0 ? room.cupQueue.slice(0, 10) : buildRandomCupQueue(5);
      const safeTotal = Math.max(1, Math.min(10, room.totalRounds || safeQueue.length));
      const nextIdx = room.roundIndex + 1;
      if (nextIdx >= safeTotal) {
        await hostReturnToLobby(room.roomCode);
        return;
      }
      const nextGameId = safeQueue[nextIdx] ?? MARIO_MINI_GAMES[nextIdx % MARIO_MINI_GAMES.length].id;
      const spec = MARIO_MINI_GAME_MAP[nextGameId] ?? MARIO_MINI_GAMES[0];
      hostFinishedSeedRef.current = 0;
      myLocalScoreRef.current = 0;
      // Reset host's own roundDone to false BEFORE transitioning room to 'playing'
      await syncMyLiveScore(room.roomCode, profile.uid, 0, 0, false);
      await hostStartRound(
        room.roomCode,
        room.mode,
        nextGameId,
        nextIdx,
        safeTotal,
        spec.durationSec,
        safeQueue
      );
    } catch {
      showToast(
        ar ? 'تعذر بدء الجولة التالية. اضغط مرة أخرى.' : 'Could not start next round. Tap again.',
        'err'
      );
    } finally {
      setRoomBusy(false);
    }
  };

  const handleCopyText = async (val: string, label: string) => {
    try {
      await navigator.clipboard.writeText(val);
      partyAudio.playCoin();
      showToast(label, 'ok');
    } catch {
      showToast(val, 'info');
    }
  };

  const handleCopyRoomLink = () => {
    if (!room) return;
    const url = new URL(window.location.href);
    url.searchParams.set('partyRoom', room.roomCode);
    void handleCopyText(
      url.toString(),
      ar ? `تم نسخ رابط الدعوة للغرفة ${room.roomCode}!` : `Invite link copied for room ${room.roomCode}!`
    );
  };

  // Start Solo / Multi-Game Cup vs Computer (defaults to 5 DIFFERENT mini-games, never just 1!)
  const openSoloPractice = () => {
    partyAudio.playSelect();
    const myChar = profile?.favoriteCharacter ?? 'marco';
    const botChar: PartyCharacterId = myChar === 'koopa' ? 'wario' : 'koopa';
    const queue = buildRandomCupQueue(5);
    setSelectedGameId(queue[0]);
    setSolo({
      phase: 'character_select',
      mode: 'cup',
      cupLength: 5,
      characterId: myChar,
      botCharacterId: botChar,
      cupQueue: queue,
      roundIndex: 0,
      currentGameId: queue[0],
      roundSeed: Math.floor(Math.random() * 1_000_000) + 1,
      myScore: 0,
      myProgress: 0,
      botScore: 0,
      botProgress: 0,
      myStars: 0,
      myCoins: 0,
      botStars: 0,
      botCoins: 0,
      roundWinner: 'tie',
    });
  };

  const startSoloRound = (idx = 0, reshuffleNewCup = false) => {
    const enterTutorial = showTutorialBeforeRound;
    setCountdownNum(enterTutorial ? 0 : 3);
    myLocalScoreRef.current = 0;
    setSolo((prev) => {
      if (!prev) return prev;
      const nextQueue =
        reshuffleNewCup && prev.mode === 'cup'
          ? buildRandomCupQueue(prev.cupLength, undefined, prev.cupQueue)
          : prev.cupQueue;
      const gId =
        prev.mode === 'cup' ? nextQueue[idx] ?? prev.currentGameId : prev.currentGameId;
      return {
        ...prev,
        phase: enterTutorial ? 'tutorial' : 'playing',
        cupQueue: nextQueue,
        roundIndex: idx,
        currentGameId: gId,
        roundSeed: Math.floor(Math.random() * 1_000_000) + 1,
        myScore: 0,
        myProgress: 0,
        botScore: 0,
        botProgress: 0,
        ...(idx === 0 ? { myStars: 0, myCoins: 0, botStars: 0, botCoins: 0 } : {}),
      };
    });
  };

  const beginSoloPlayingAfterTutorial = () => {
    partyAudio.playSelect();
    setCountdownNum(3);
    myLocalScoreRef.current = 0;
    setSolo((prev) => (prev && prev.phase === 'tutorial' ? { ...prev, phase: 'playing' } : prev));
  };

  // Live callback from Mini-Game engines (Online & Solo)
  const handleMiniGameLiveUpdate = useCallback(
    (score: number, progress: number, done: boolean) => {
      myLocalScoreRef.current = score;

      if (solo && solo.phase === 'playing') {
        if (!done) {
          setSolo((prev) =>
            prev && prev.phase === 'playing'
              ? { ...prev, myScore: score, myProgress: progress }
              : prev
          );
          return;
        }
        setSolo((prev) => {
          if (!prev || prev.phase !== 'playing') return prev;
          const winner: 'me' | 'bot' | 'tie' =
            score > prev.botScore ? 'me' : score < prev.botScore ? 'bot' : 'tie';
          const myStars = prev.myStars + (winner === 'me' ? 1 : 0);
          const botStars = prev.botStars + (winner === 'bot' ? 1 : 0);
          const myCoins = prev.myCoins + (winner === 'me' ? 15 : winner === 'tie' ? 10 : 5);
          const botCoins = prev.botCoins + (winner === 'bot' ? 15 : winner === 'tie' ? 10 : 5);
          const isLast = prev.mode === 'single' || prev.roundIndex + 1 >= prev.cupQueue.length;
          partyAudio.playVictory();
          return {
            ...prev,
            myScore: score,
            myProgress: 100,
            botProgress: 100,
            myStars,
            botStars,
            myCoins,
            botCoins,
            roundWinner: winner,
            phase: isLast ? 'podium' : 'round_result',
          };
        });
        return;
      }

      if (!room || !profile || room.status !== 'playing') return;
      const now = Date.now();
      if (done || now - lastLiveSyncAtRef.current >= 450) {
        lastLiveSyncAtRef.current = now;
        void syncMyLiveScore(room.roomCode, profile.uid, score, progress, done);
      }
    },
    [solo?.phase, room?.roomCode, room?.status, profile?.uid]
  );

  const filteredGames = useMemo(() => {
    if (gameCategory === 'all') return MARIO_CLASSIC_MINI_GAMES;
    return MARIO_CLASSIC_MINI_GAMES.filter((g) => g.category === gameCategory);
  }, [gameCategory]);

  // Helper to render the 8-Character Picker Grid
  const renderCharacterSelectGrid = (
    activeCharId: PartyCharacterId,
    onPick: (id: PartyCharacterId) => void,
    takenMap?: Record<string, string>
  ) => (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
      {PARTY_CHARACTERS.map((char) => {
        const selected = activeCharId === char.id;
        const takenBy = takenMap?.[char.id];
        return (
          <button
            key={char.id}
            type="button"
            onClick={() => onPick(char.id)}
            className={`relative rounded-2xl p-3 text-start transition-all border-2 cursor-pointer flex flex-col items-center text-center gap-1.5 ${
              selected
                ? 'border-amber-300 bg-gradient-to-b from-amber-400/20 to-[#13254a] shadow-[0_0_24px_rgba(250,204,21,0.28)] scale-[1.01]'
                : 'border-white/12 bg-[#0d1c38] hover:border-sky-300/60 hover:bg-[#13254a]'
            }`}
          >
            {selected && (
              <span className="absolute top-2 end-2 text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-400 text-slate-950">
                {ar ? 'اختيارك' : 'PICKED'}
              </span>
            )}
            <HeroAvatarSvg characterId={char.id} size={62} />
            <div className="font-extrabold text-sm text-white leading-tight mt-0.5">
              {ar ? char.nameAr : char.nameEn}
            </div>
            <div className="text-[11px] font-semibold" style={{ color: char.accent }}>
              {ar ? char.titleAr : char.titleEn}
            </div>
            <div className="text-[10.5px] text-slate-300 leading-snug line-clamp-2">
              {ar ? char.perkAr : char.perkEn}
            </div>
            {takenBy && !selected && (
              <div className="text-[10px] font-bold text-sky-300 mt-0.5 truncate max-w-full">
                {ar ? `مع ${takenBy}` : `With ${takenBy}`}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );

  // Helper to render the 25-Minigame Selector Grid
  const render25GamesBoard = (
    activeGameId: MarioMiniGameId,
    canPick: boolean,
    onPick: (id: MarioMiniGameId) => void
  ) => (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-black text-white">
            {ar ? 'اختر من 25 ميني قيم بأسلوب ماريو' : 'Choose from 25 Mario-Style Mini-Games'}
          </h3>
          <p className="text-xs text-slate-300">
            {canPick
              ? ar
                ? 'اضغط على أي لعبة لتحديدها فوراً أو اختر بطولة الكأس (5 جولات).'
                : 'Tap any mini-game to select it or launch a 5-round Star Cup.'
              : ar
              ? 'المضيف يختار اللعبة — يمكنك تصفّح الـ 25 لعبة هنا!'
              : 'Host selects the game — browse all 25 mini-games here!'}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORY_FILTERS.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setGameCategory(cat.id)}
              className={`h-8 px-2.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                gameCategory === cat.id
                  ? 'bg-sky-400 text-slate-950'
                  : 'bg-[#0e1e3a] text-slate-300 hover:bg-[#172c54] border border-white/10'
              }`}
            >
              {ar ? cat.ar : cat.en}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {filteredGames.map((g) => {
          const isPicked = activeGameId === g.id;
          return (
            <button
              key={g.id}
              type="button"
              disabled={!canPick}
              onClick={() => canPick && onPick(g.id)}
              className={`rounded-xl p-2.5 text-start border transition-all flex flex-col justify-between gap-1.5 ${
                isPicked
                  ? 'border-amber-300 bg-gradient-to-br from-amber-400/20 to-[#162b54] shadow-lg'
                  : 'border-white/10 bg-[#0b1830] hover:border-sky-300/50 hover:bg-[#122446]'
              } ${canPick ? 'cursor-pointer' : 'cursor-default opacity-90'}`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <span
                  className="font-num text-[11px] font-black px-1.5 py-0.5 rounded-md text-slate-950 shrink-0"
                  style={{ backgroundColor: g.accent }}
                >
                  #{g.num}
                </span>
                <span className="font-num text-[10px] font-semibold text-slate-400">
                  {g.durationSec}s
                </span>
              </div>
              <div className="font-extrabold text-xs text-white leading-snug">
                {ar ? g.nameAr : g.nameEn}
              </div>
              <div className="text-[10px] text-slate-300 leading-snug line-clamp-2">
                {ar ? g.ruleAr : g.ruleEn}
              </div>
            </button>
          );
        })}
      </div>

      {/* Dedicated 3D Games Section Underneath ("ألعاب 3D") */}
      <div className="pt-5 mt-5 border-t border-sky-400/25 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="font-num text-xs font-black px-2.5 py-1 rounded-lg bg-gradient-to-r from-sky-400 to-cyan-300 text-slate-950 shrink-0">
              3D
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-black text-sky-200">
                {ar ? 'ألعاب 3D' : '3D Games'}
              </h3>
              <p className="text-xs text-slate-300">
                {ar
                  ? '5 ألعاب ماريو ثلاثية الأبعاد — العبها أونلاين مع أصدقائك أو ضد البوت!'
                  : '5 Three.js 3D Mario mini-games — play online with friends or vs Bot!'}
              </p>
            </div>
          </div>
          <span className="font-num text-xs font-bold text-cyan-300 whitespace-nowrap">
            {ar ? '5 ألعاب ثلاثية الأبعاد' : '5 3D Games'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {MARIO_3D_MINI_GAMES.map((g) => {
            const isPicked = activeGameId === g.id;
            return (
              <button
                key={g.id}
                type="button"
                disabled={!canPick}
                onClick={() => canPick && onPick(g.id)}
                className={`rounded-xl p-3 text-start border-2 transition-all flex flex-col justify-between gap-2 ${
                  isPicked
                    ? 'border-amber-300 bg-gradient-to-br from-sky-500/25 via-indigo-900/60 to-amber-500/20 shadow-[0_0_20px_rgba(56,189,248,0.28)]'
                    : 'border-sky-400/30 bg-gradient-to-br from-[#0e2248] to-[#0a1630] hover:border-cyan-300/80 hover:from-[#132d5e]'
                } ${canPick ? 'cursor-pointer' : 'cursor-default opacity-90'}`}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span
                    className="font-num text-[11px] font-black px-2 py-0.5 rounded-md text-slate-950 shrink-0"
                    style={{ backgroundColor: g.accent }}
                  >
                    3D · #{g.num - 25}
                  </span>
                  <span className="font-num text-[10px] font-bold text-sky-200">
                    {g.durationSec}s
                  </span>
                </div>
                <div className="font-black text-xs sm:text-sm text-white leading-snug">
                  {ar ? g.nameAr : g.nameEn}
                </div>
                <div className="text-[10.5px] text-slate-200 leading-snug line-clamp-2">
                  {ar ? g.ruleAr : g.ruleEn}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  // Incoming Invites Banner (always visible in Hub & Lobby)
  const renderIncomingInvitesBanner = () => {
    if (incomingInvites.length === 0) return null;
    return (
      <div className="space-y-2 mb-4">
        {incomingInvites.map((inv) => {
          const gameSpec = MARIO_MINI_GAME_MAP[inv.gameId];
          return (
            <div
              key={inv.id}
              className="rounded-2xl border-2 border-amber-300/80 bg-gradient-to-r from-amber-500/20 via-[#15294f] to-sky-500/20 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl"
            >
              <div className="flex items-center gap-3 min-w-0">
                <HeroAvatarSvg characterId={inv.fromCharacter} size={46} className="shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-black text-amber-200 truncate">
                    {ar
                      ? `دعوة لعب مباشرة من ${inv.fromName}!`
                      : `Live Match Invite from ${inv.fromName}!`}
                  </div>
                  <div className="text-xs text-slate-200 truncate">
                    {inv.mode === 'cup'
                      ? ar
                        ? 'بطولة الكأس (5 ألعاب ماريو)'
                        : '5-Round Star Cup'
                      : ar
                      ? gameSpec.nameAr
                      : gameSpec.nameEn}{' '}
                    · <span className="font-num font-bold text-sky-300">{inv.roomCode}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => void handleRespondInvite(inv, true)}
                  className="h-9 px-4 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs whitespace-nowrap cursor-pointer"
                >
                  {ar ? 'قبول والدخول' : 'Accept & Join'}
                </button>
                <button
                  type="button"
                  onClick={() => void handleRespondInvite(inv, false)}
                  className="h-9 px-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-slate-200 font-bold text-xs whitespace-nowrap cursor-pointer"
                >
                  {ar ? 'رفض' : 'Decline'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // RENDER: ACTIVE MINI-GAME ARENA (Online OR Solo)
  const renderPlayingArena = () => {
    const isSolo = Boolean(solo && solo.phase === 'playing');
    const gameId: MarioMiniGameId = isSolo
      ? solo!.currentGameId
      : room!.currentGameId;
    const spec = MARIO_MINI_GAME_MAP[gameId];
    const seed = isSolo ? solo!.roundSeed : room!.roundSeed;
    const durationSec = isSolo ? spec.durationSec : room!.roundDurationSec;
    const myCharId: PartyCharacterId = isSolo
      ? solo!.characterId
      : myPlayer?.characterId ?? profile?.favoriteCharacter ?? 'marco';

    const rival = isSolo
      ? {
          characterId: solo!.botCharacterId,
          progress: solo!.botProgress,
          score: solo!.botScore,
        }
      : (() => {
          const other = roomPlayers.find((p) => p.uid !== profile?.uid);
          if (other) {
            return {
              characterId: other.characterId,
              progress: other.roundProgress,
              score: other.roundScore,
            };
          }
          return {
            characterId: roomBot.characterId,
            progress: roomBot.roundProgress,
            score: roomBot.roundScore,
          };
        })();

    const rawTopPlayers = isSolo
      ? [
          {
            uid: 'me',
            displayName: profile?.displayName ?? (ar ? 'أنت' : 'You'),
            characterId: solo!.characterId,
            roundScore: solo!.myScore,
            roundProgress: solo!.myProgress,
            stars: solo!.myStars,
            isMe: true,
            isBot: false,
          },
          {
            uid: 'bot',
            displayName: ar ? 'الكمبيوتر (بوت)' : 'Computer (Bot)',
            characterId: solo!.botCharacterId,
            roundScore: solo!.botScore,
            roundProgress: solo!.botProgress,
            stars: solo!.botStars,
            isMe: false,
            isBot: true,
          },
        ]
      : [
          ...roomPlayers.map((p) => ({
            uid: p.uid,
            displayName: p.displayName,
            characterId: p.characterId,
            roundScore:
              p.uid === profile?.uid
                ? Math.max(p.roundScore, myLocalScoreRef.current)
                : p.roundScore,
            roundProgress: p.roundProgress,
            stars: p.stars,
            isMe: p.uid === profile?.uid,
            isBot: false,
          })),
          ...(roomPlayers.length === 1
            ? [
                {
                  uid: 'room-bot',
                  displayName: ar ? 'الكمبيوتر (بوت)' : 'Computer (Bot)',
                  characterId: roomBot.characterId,
                  roundScore: roomBot.roundScore,
                  roundProgress: roomBot.roundProgress,
                  stars: roomBot.stars,
                  isMe: false,
                  isBot: true,
                },
              ]
            : []),
        ];

    const liveTopPlayers = [...rawTopPlayers].sort(
      (a, b) => b.roundScore - a.roundScore || b.stars - a.stars
    );

    const roundLabel = isSolo
      ? solo!.mode === 'cup'
        ? ar
          ? `الجولة ${solo!.roundIndex + 1} / ${solo!.cupQueue.length}`
          : `Round ${solo!.roundIndex + 1} / ${solo!.cupQueue.length}`
        : `#${spec.num}`
      : room!.mode === 'cup'
      ? ar
        ? `الجولة ${room!.roundIndex + 1} / ${room!.totalRounds}`
        : `Round ${room!.roundIndex + 1} / ${room!.totalRounds}`
      : `#${spec.num}`;

    return (
      <div className="mx-auto max-w-[920px] space-y-3">
        {/* Live TOP Leaderboard (Everyone playing with you + Computer Bot!) */}
        <div className="rounded-2xl border border-amber-300/35 bg-[#0a1630] p-2.5 space-y-2">
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <span className="font-num text-[11px] font-black px-2 py-0.5 rounded-md bg-amber-400 text-slate-950">
                TOP
              </span>
              <span className="text-xs font-black text-amber-200">
                {ar ? 'التوب المباشر (كل اللاعبين معك)' : 'Live TOP Leaderboard'}
              </span>
            </div>
            <span className="font-num text-[11px] text-slate-400">
              {ar ? `${liveTopPlayers.length} متنافسين` : `${liveTopPlayers.length} Players`}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {liveTopPlayers.map((p, idx) => (
              <div
                key={p.uid}
                className={`rounded-xl px-3 py-2 border flex items-center gap-2.5 ${
                  idx === 0
                    ? 'border-amber-300 bg-amber-400/15'
                    : p.isMe
                    ? 'border-sky-400/60 bg-sky-500/10'
                    : 'border-white/10 bg-[#0d1c38]'
                }`}
              >
                <span
                  className={`font-num text-xs font-black w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                    idx === 0
                      ? 'bg-amber-400 text-slate-950'
                      : idx === 1
                      ? 'bg-slate-300 text-slate-950'
                      : 'bg-slate-800 text-slate-200'
                  }`}
                >
                  #{idx + 1}
                </span>
                <HeroAvatarSvg characterId={p.characterId} size={34} className="shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-extrabold text-white truncate">
                      {p.displayName}
                    </span>
                    <span className="font-num text-xs font-black text-amber-300 shrink-0">
                      {p.roundScore}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          idx === 0 ? 'bg-amber-400' : 'bg-sky-400'
                        }`}
                        style={{ width: `${Math.min(100, p.roundProgress)}%` }}
                      />
                    </div>
                    <span className="font-num text-[10px] font-bold text-amber-200 shrink-0">
                      ★{p.stars}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mini-Game Banner */}
        <div className="rounded-xl border border-white/10 bg-[#0c1a34] px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="font-num text-xs font-black px-2 py-0.5 rounded-md text-slate-950 shrink-0"
              style={{ backgroundColor: spec.accent }}
            >
              {roundLabel}
            </span>
            <h2 className="text-sm sm:text-base font-black text-white truncate">
              {ar ? spec.nameAr : spec.nameEn}
            </h2>
          </div>
          <p className="text-xs text-sky-200">{ar ? spec.controlsAr : spec.controlsEn}</p>
        </div>

        {/* Pre-Game Tutorial (Zero-Timer Ready) OR Countdown Overlay OR Active Game Engine */}
        {(() => {
          if (!isSolo && isOnlineWaitingTutorial) {
            const amIReady =
              onlineTutorialReadyList.find((p) => p.uid === profile?.uid)?.isReady ?? false;
            return (
              <MiniGameTutorialScreen
                lang={lang}
                gameId={gameId}
                roundLabel={roundLabel}
                myCharId={myCharId}
                rivalCharId={rival?.characterId}
                readyPlayers={onlineTutorialReadyList}
                isMyReady={amIReady}
                readyBusy={tutorialReadyBusy}
                onToggleReady={() => void handleToggleOnlineTutorialReady()}
              />
            );
          }

          const msUntilOnlineStart =
            !isSolo && room && room.roundStartedAtMs > 0
              ? Math.max(0, room.roundStartedAtMs - Date.now())
              : 0;
          const effectiveCountdown =
            countdownNum > 0
              ? countdownNum
              : !isSolo && msUntilOnlineStart > 0
              ? Math.min(3, Math.ceil(msUntilOnlineStart / 800))
              : 0;
          if (effectiveCountdown > 0) {
            return (
              <div className="rounded-2xl border-2 border-amber-300/60 bg-gradient-to-b from-[#132957] to-[#0a1630] min-h-[360px] flex flex-col items-center justify-center p-6 text-center gap-4">
                <div className="flex items-center gap-4">
                  <HeroAvatarSvg characterId={myCharId} size={74} />
                  {rival && (
                    <>
                      <span className="text-2xl font-black text-amber-300">VS</span>
                      <HeroAvatarSvg characterId={rival.characterId} size={74} />
                    </>
                  )}
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  {ar ? spec.nameAr : spec.nameEn}
                </h3>
                <p className="text-sm text-slate-200 max-w-md">{ar ? spec.ruleAr : spec.ruleEn}</p>
                <div className="font-num text-6xl font-black text-amber-300 drop-shadow">
                  {effectiveCountdown}
                </div>
              </div>
            );
          }
          return null;
        })() ?? (spec.engine === 'three3d' ? (
          <MiniGames3DCanvas
            key={`${gameId}-${seed}`}
            gameId={gameId}
            seed={seed}
            durationSec={durationSec}
            characterId={myCharId}
            rivalCharacterId={rival?.characterId}
            rivalProgress={rival?.progress ?? 0}
            rivalScore={rival?.score ?? 0}
            lang={lang}
            onLiveUpdate={handleMiniGameLiveUpdate}
          />
        ) : spec.engine === 'canvas' ? (
          <MiniGamesArcadeCanvas
            key={`${gameId}-${seed}`}
            gameId={gameId}
            seed={seed}
            durationSec={durationSec}
            characterId={myCharId}
            rivalCharacterId={rival?.characterId}
            rivalProgress={rival?.progress ?? 0}
            rivalScore={rival?.score ?? 0}
            lang={lang}
            onLiveUpdate={handleMiniGameLiveUpdate}
          />
        ) : (
          <MiniGamesInteractiveBoard
            key={`${gameId}-${seed}`}
            gameId={gameId}
            seed={seed}
            durationSec={durationSec}
            characterId={myCharId}
            rivalCharacterId={rival?.characterId}
            rivalProgress={rival?.progress ?? 0}
            rivalScore={rival?.score ?? 0}
            lang={lang}
            onLiveUpdate={handleMiniGameLiveUpdate}
          />
        ))}
      </div>
    );
  };

  // RENDER: ROUND RESULT / FINAL PODIUM (Online OR Solo)
  const renderResultOrPodium = () => {
    const isSolo = Boolean(solo && (solo.phase === 'round_result' || solo.phase === 'podium'));
    const isPodium = isSolo ? solo!.phase === 'podium' : room!.status === 'podium';

    const standings = isSolo
      ? [
          {
            uid: 'me',
            displayName: profile?.displayName ?? (ar ? 'أنت' : 'You'),
            characterId: solo!.characterId,
            roundScore: solo!.myScore,
            stars: solo!.myStars,
            coins: solo!.myCoins,
          },
          {
            uid: 'bot',
            displayName: ar ? 'الكمبيوتر (بوت)' : 'Computer (Bot)',
            characterId: solo!.botCharacterId,
            roundScore: solo!.botScore,
            stars: solo!.botStars,
            coins: solo!.botCoins,
          },
        ].sort((a, b) =>
          isPodium
            ? b.stars - a.stars || b.coins - a.coins || b.roundScore - a.roundScore
            : b.roundScore - a.roundScore
        )
      : [
          ...roomPlayers,
          ...(roomPlayers.length === 1
            ? [
                {
                  uid: 'room-bot',
                  displayName: ar ? 'الكمبيوتر (بوت)' : 'Computer (Bot)',
                  characterId: roomBot.characterId,
                  roundScore: roomBot.roundScore,
                  stars: roomBot.stars,
                  coins: roomBot.coins,
                },
              ]
            : []),
        ].sort((a, b) =>
          isPodium
            ? b.stars - a.stars || b.coins - a.coins || b.roundScore - a.roundScore
            : b.roundScore - a.roundScore
        );

    const champion = standings[0];

    return (
      <div className="mx-auto max-w-[760px] space-y-5 py-2">
        <div className="rounded-3xl border-2 border-amber-300/70 bg-gradient-to-b from-[#1a2f63] via-[#101e40] to-[#0a142b] p-6 text-center space-y-4 shadow-2xl">
          <div className="text-xs font-black tracking-wider uppercase text-amber-300">
            {isPodium
              ? ar
                ? 'ترتيب التوب النهائي · TOP'
                : 'FINAL TOP PODIUM'
              : ar
              ? 'ترتيب التوب للجولة · TOP'
              : 'ROUND TOP STANDINGS'}
          </div>
          {champion && (
            <div className="flex flex-col items-center gap-2">
              <HeroAvatarSvg characterId={champion.characterId} size={96} />
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                {isPodium
                  ? ar
                    ? `التوب #1: ${champion.displayName}!`
                    : `TOP #1: ${champion.displayName}!`
                  : ar
                  ? `متصدر التوب: ${champion.displayName}`
                  : `TOP Leader: ${champion.displayName}`}
              </h2>
              <p className="text-sm text-amber-200 font-bold">
                {ar
                  ? PARTY_CHARACTER_MAP[champion.characterId].nameAr
                  : PARTY_CHARACTER_MAP[champion.characterId].nameEn}
              </p>
            </div>
          )}

          {/* TOP Standings list */}
          <div className="space-y-2 text-start pt-2">
            <div className="text-xs font-black text-amber-300 px-1">
              {ar ? 'قائمة التوب (كل من يلعب معك)' : 'TOP Leaderboard (All Players)'}
            </div>
            {standings.map((p, idx) => (
              <div
                key={p.uid}
                className={`rounded-2xl px-4 py-3 border flex items-center justify-between gap-3 ${
                  idx === 0
                    ? 'border-amber-300/70 bg-amber-400/15'
                    : 'border-white/10 bg-[#0b1630]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-num text-lg font-black text-amber-300 w-6 text-center shrink-0">
                    #{idx + 1}
                  </span>
                  <HeroAvatarSvg characterId={p.characterId} size={44} className="shrink-0" />
                  <div className="min-w-0">
                    <div className="font-extrabold text-sm sm:text-base text-white truncate">
                      {p.displayName}
                    </div>
                    <div className="text-xs text-slate-300">
                      {ar
                        ? PARTY_CHARACTER_MAP[p.characterId].nameAr
                        : PARTY_CHARACTER_MAP[p.characterId].nameEn}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:gap-5 font-num shrink-0">
                  <div className="text-center">
                    <div className="text-[10px] text-slate-400">{ar ? 'الجولة' : 'Round'}</div>
                    <div className="text-sm font-black text-sky-300">{p.roundScore}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] text-slate-400">{ar ? 'النجوم' : 'Stars'}</div>
                    <div className="text-sm font-black text-amber-300">★ {p.stars}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] text-slate-400">{ar ? 'العملات' : 'Coins'}</div>
                    <div className="text-sm font-black text-yellow-200">{p.coins}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Next Mini-Game Preview Banner between Cup Rounds */}
          {!isPodium && (() => {
            const nextQueue = isSolo ? solo!.cupQueue : room!.cupQueue;
            const nextIdx = (isSolo ? solo!.roundIndex : room!.roundIndex) + 1;
            const nextId = nextQueue[nextIdx];
            const nextSpec = nextId ? MARIO_MINI_GAME_MAP[nextId] : null;
            if (!nextSpec) return null;
            return (
              <div className="rounded-2xl border border-sky-400/40 bg-sky-500/10 px-4 py-3 text-start flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[11px] font-black text-sky-300">
                    {ar
                      ? `اللعبة التالية (الجولة ${nextIdx + 1} من ${nextQueue.length})`
                      : `UP NEXT (Round ${nextIdx + 1} of ${nextQueue.length})`}
                  </div>
                  <div className="text-sm sm:text-base font-black text-white truncate">
                    {nextSpec.is3D ? '3D · ' : `#${nextSpec.num} · `}
                    {ar ? nextSpec.nameAr : nextSpec.nameEn}
                  </div>
                  <div className="text-[11px] text-slate-300 truncate">
                    {ar ? nextSpec.ruleAr : nextSpec.ruleEn}
                  </div>
                </div>
                <span
                  className="font-num text-xs font-black px-2.5 py-1 rounded-lg text-slate-950 shrink-0"
                  style={{ backgroundColor: nextSpec.accent }}
                >
                  {nextSpec.is3D ? '3D' : `#${nextSpec.num}`}
                </span>
              </div>
            );
          })()}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            {isSolo ? (
              <>
                {!isPodium && (
                  <button
                    type="button"
                    onClick={() => startSoloRound(solo!.roundIndex + 1)}
                    className="h-11 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm cursor-pointer"
                  >
                    {ar
                      ? `ابدأ اللعبة التالية (${solo!.roundIndex + 2}/${solo!.cupQueue.length})`
                      : `Start Next Game (${solo!.roundIndex + 2}/${solo!.cupQueue.length})`}
                  </button>
                )}
                {isPodium && (
                  <button
                    type="button"
                    onClick={() => startSoloRound(0, true)}
                    className="h-11 px-6 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-sm cursor-pointer"
                  >
                    {solo!.mode === 'cup'
                      ? ar
                        ? 'بطولة جديدة بألعاب مختلفة'
                        : 'New Cup (Different Games)'
                      : ar
                      ? 'إعادة التحدي'
                      : 'Play Again'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    setSolo((prev) =>
                      prev ? { ...prev, phase: 'character_select' } : prev
                    )
                  }
                  className="h-11 px-5 rounded-xl border border-sky-300/40 bg-sky-500/15 hover:bg-sky-500/25 text-sky-100 font-bold text-sm cursor-pointer"
                >
                  {ar ? 'تغيير الشخصية أو الألعاب (30)' : 'Change Hero or Games (30)'}
                </button>
              </>
            ) : isHost ? (
              <>
                {!isPodium && (
                  <button
                    type="button"
                    disabled={roomBusy}
                    onClick={() => void handleHostNextRound()}
                    className="h-11 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-slate-950 font-black text-sm cursor-pointer"
                  >
                    {roomBusy
                      ? ar
                        ? 'جاري بدء الجولة التالية...'
                        : 'Starting Next Round...'
                      : ar
                      ? 'بدء الجولة التالية'
                      : 'Start Next Round'}
                  </button>
                )}
                <button
                  type="button"
                  disabled={roomBusy}
                  onClick={async () => {
                    if (roomBusy) return;
                    setRoomBusy(true);
                    try {
                      await hostReturnToLobby(room!.roomCode);
                    } catch {
                      showToast(ar ? 'تعذر العودة للوبي.' : 'Could not return to lobby.', 'err');
                    } finally {
                      setRoomBusy(false);
                    }
                  }}
                  className="h-11 px-6 rounded-xl bg-emerald-400 hover:bg-emerald-300 disabled:opacity-60 text-slate-950 font-black text-sm cursor-pointer"
                >
                  {ar
                    ? 'العودة لاختيار الشخصيات والألعاب'
                    : 'Back to Hero & Game Select'}
                </button>
              </>
            ) : (
              <div className="text-sm font-bold text-sky-200">
                {ar
                  ? `بانتظار المضيف (${room!.hostName}) للانتقال للجولة التالية...`
                  : `Waiting for host (${room!.hostName}) to continue...`}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // RENDER: PRE-MATCH CHARACTER SELECTION + 25-GAME ROOM LOBBY (Online OR Solo)
  const renderCharacterSelectLobby = () => {
    const isSolo = Boolean(solo && solo.phase === 'character_select');
    const currentCharId: PartyCharacterId = isSolo
      ? solo!.characterId
      : myPlayer?.characterId ?? profile?.favoriteCharacter ?? 'marco';
    const currentMode: 'cup' | 'single' = isSolo ? solo!.mode : room!.mode;
    const currentGameId: MarioMiniGameId = isSolo ? solo!.currentGameId : room!.currentGameId;
    const currentGameSpec = MARIO_MINI_GAME_MAP[currentGameId];

    const takenMap: Record<string, string> = {};
    if (!isSolo) {
      for (const p of roomPlayers) {
        if (p.uid !== profile?.uid) {
          takenMap[p.characterId] = p.displayName;
        }
      }
    }

    const canConfigure = isSolo || isHost;

    return (
      <div className="mx-auto max-w-[1040px] space-y-5">
        {renderIncomingInvitesBanner()}

        {/* Room Status Header */}
        <div className="rounded-2xl border border-sky-400/30 bg-[#0d1c38] p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black px-2.5 py-0.5 rounded-md bg-amber-400 text-slate-950">
                {isSolo
                  ? ar
                    ? 'تدريب ضد البوت'
                    : 'VS RIVAL BOT'
                  : ar
                  ? `غرفة أونلاين · ${room!.roomCode}`
                  : `ONLINE ROOM · ${room!.roomCode}`}
              </span>
              <h2 className="text-lg font-black text-white">
                {ar
                  ? 'اختر شخصيتك قبل البدء!'
                  : 'Choose Your Hero Before Starting!'}
              </h2>
            </div>
            <p className="text-xs text-slate-300">
              {isSolo
                ? ar
                  ? 'اختر أحد أبطال ماريو الـ8 ثم اختر أي لعبة من الـ25 ميني قيم وابدأ فوراً.'
                  : 'Pick any of the 8 Mario heroes, choose from 25 mini-games, and jump right in.'
                : ar
                ? 'شارك كود الغرفة أو ادعُ أصدقاءك مباشرة، وكل لاعب يختار شخصيته قبل الانطلاق!'
                : 'Share the room code or invite friends directly — every player picks their hero before kickoff!'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {!isSolo && room && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    void handleCopyText(
                      room.roomCode,
                      ar ? `تم نسخ كود الغرفة ${room.roomCode}` : `Copied room code ${room.roomCode}`
                    )
                  }
                  className="h-9 px-3.5 rounded-xl border border-amber-300/40 bg-amber-400/15 hover:bg-amber-400/25 text-amber-200 font-num font-black text-xs whitespace-nowrap cursor-pointer"
                >
                  {ar ? `نسخ الكود: ${room.roomCode}` : `Copy Code: ${room.roomCode}`}
                </button>
                <button
                  type="button"
                  onClick={handleCopyRoomLink}
                  className="h-9 px-3.5 rounded-xl border border-sky-300/40 bg-sky-500/15 hover:bg-sky-500/25 text-sky-200 font-bold text-xs whitespace-nowrap cursor-pointer"
                >
                  {ar ? 'نسخ رابط الدعوة' : 'Copy Invite Link'}
                </button>
                <button
                  type="button"
                  onClick={() => void handleLeaveRoom()}
                  className="h-9 px-3 rounded-xl border border-rose-400/40 bg-rose-500/15 hover:bg-rose-500/25 text-rose-200 font-bold text-xs whitespace-nowrap cursor-pointer"
                >
                  {ar ? 'مغادرة الغرفة' : 'Leave Room'}
                </button>
              </>
            )}
            {isSolo && (
              <button
                type="button"
                onClick={() => setSolo(null)}
                className="h-9 px-3.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-slate-200 font-bold text-xs whitespace-nowrap cursor-pointer"
              >
                {ar ? 'العودة للوبي الأونلاين' : 'Back to Online Lobby'}
              </button>
            )}
          </div>
        </div>

        {/* Players In Room + Quick Invite Friends (Online Mode) */}
        {!isSolo && room && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-[#0b1730] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-white">
                  {ar
                    ? `اللاعبون في الغرفة (${roomPlayers.length})`
                    : `Players in Room (${roomPlayers.length})`}
                </h3>
                <span className="text-xs text-slate-400">
                  {ar ? 'تحديث مباشر' : 'Live sync'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {roomPlayers.map((p) => {
                  const char = PARTY_CHARACTER_MAP[p.characterId];
                  const playerIsHost = p.uid === room.hostUid;
                  return (
                    <div
                      key={p.uid}
                      className={`rounded-xl p-2.5 border flex items-center gap-3 ${
                        p.uid === profile?.uid
                          ? 'border-amber-300/60 bg-amber-400/10'
                          : 'border-white/10 bg-[#102142]'
                      }`}
                    >
                      <HeroAvatarSvg characterId={p.characterId} size={46} className="shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-sm text-white truncate">
                            {p.displayName}
                          </span>
                          {playerIsHost && (
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 shrink-0">
                              {ar ? 'المضيف' : 'HOST'}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-sky-200 truncate">
                          {ar ? char.nameAr : char.nameEn}
                        </div>
                      </div>
                      <span
                        className={`text-[11px] font-black px-2 py-0.5 rounded-md shrink-0 ${
                          p.ready || playerIsHost
                            ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {p.ready || playerIsHost
                          ? ar
                            ? 'جاهز'
                            : 'READY'
                          : ar
                          ? 'يختار...'
                          : 'PICKING'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Invite Friends Panel inside Room */}
            <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-[#0b1730] p-4 space-y-3">
              <h3 className="text-sm font-black text-white">
                {ar ? 'ادعُ أصدقاءك للغرفة' : 'Invite Your Friends'}
              </h3>
              {friendships.length === 0 ? (
                <p className="text-xs text-slate-400 leading-relaxed">
                  {ar
                    ? 'يمكنك مشاركة كود الغرفة أو الرابط أعلاه مع أي صديق، أو إضافة أصدقاء من اللوبي الرئيسي لدعوتهم بضغطة زر.'
                    : 'Share the room code or link above, or add friends in the main lobby for 1-click invites.'}
                </p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto pe-1">
                  {friendships.map((f) => {
                    const fr = getFriendInfo(f, profile!.uid);
                    const alreadyIn = roomPlayers.some((p) => p.uid === fr.uid);
                    return (
                      <div
                        key={fr.id}
                        className="rounded-xl border border-white/10 bg-[#102142] px-3 py-2 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <HeroAvatarSvg characterId={fr.characterId} size={32} className="shrink-0" />
                          <span className="text-xs font-bold text-white truncate">
                            {fr.displayName}
                          </span>
                        </div>
                        {alreadyIn ? (
                          <span className="text-[11px] font-bold text-emerald-300 shrink-0">
                            {ar ? 'داخل الغرفة' : 'In Room'}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => void handleInviteFriend(fr.uid, fr.displayName)}
                            className="h-7 px-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] whitespace-nowrap cursor-pointer"
                          >
                            {ar ? 'دعوة' : 'Invite'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 1: PRE-MATCH 8-CHARACTER SELECTION */}
        <section className="rounded-2xl border-2 border-amber-400/35 bg-[#0b1730] p-4 sm:p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base sm:text-lg font-black text-amber-300">
                {ar ? '1. اختر شخصيتك (8 أبطال ماريو)' : '1. Pick Your Character (8 Mario Heroes)'}
              </h3>
              <p className="text-xs text-slate-300">
                {ar
                  ? 'بطلك المختار سيظهر داخل جميع الـ 25 لعبة وأمام أصدقائك!'
                  : 'Your chosen hero plays inside all 25 mini-games and appears to your friends!'}
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-amber-300/40 bg-amber-400/10 px-3 py-1.5">
              <HeroAvatarSvg characterId={currentCharId} size={32} />
              <span className="text-xs font-black text-amber-200 whitespace-nowrap">
                {ar
                  ? PARTY_CHARACTER_MAP[currentCharId].nameAr
                  : PARTY_CHARACTER_MAP[currentCharId].nameEn}
              </span>
            </div>
          </div>

          {renderCharacterSelectGrid(currentCharId, (id) => void handleSelectRoomHero(id), takenMap)}
        </section>

        {/* STEP 2: MODE, CUP LENGTH & START ACTION BAR */}
        <section className="rounded-2xl border border-emerald-400/35 bg-gradient-to-r from-[#0e2040] via-[#12264d] to-[#0f2438] p-4 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={!canConfigure}
                  onClick={() => void handleHostSwitchMode('cup')}
                  className={`h-9 px-3.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                    currentMode === 'cup'
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-[#0a162e] text-slate-300 border border-white/10'
                  } ${canConfigure ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  {ar
                    ? `بطولة ألعاب متنوعة (${isSolo ? solo!.cupLength : 5} جولات)`
                    : `Multi-Game Cup (${isSolo ? solo!.cupLength : 5} Rounds)`}
                </button>
                <button
                  type="button"
                  disabled={!canConfigure}
                  onClick={() => void handleHostSwitchMode('single')}
                  className={`h-9 px-3.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                    currentMode === 'single'
                      ? 'bg-sky-400 text-slate-950'
                      : 'bg-[#0a162e] text-slate-300 border border-white/10'
                  } ${canConfigure ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  {ar ? 'لعبة واحدة فقط' : 'Single Game Only'}
                </button>
                {isSolo && currentMode === 'cup' && (
                  <div className="flex items-center gap-1 bg-[#09152b] p-1 rounded-xl border border-white/10">
                    {([3, 5, 7, 10] as const).map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => handleSoloCupLength(cnt)}
                        className={`h-7 px-2.5 rounded-lg text-[11px] font-black transition-colors cursor-pointer whitespace-nowrap ${
                          solo!.cupLength === cnt
                            ? 'bg-emerald-400 text-slate-950'
                            : 'text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        {ar ? `${cnt} ألعاب` : `${cnt} Games`}
                      </button>
                    ))}
                  </div>
                )}
                {canConfigure && currentMode === 'cup' && (
                  <button
                    type="button"
                    onClick={() => void handleShuffleCupGames()}
                    className="h-9 px-3 rounded-xl border border-amber-300/40 bg-amber-400/15 hover:bg-amber-400/25 text-amber-200 font-black text-xs whitespace-nowrap cursor-pointer"
                  >
                    {ar ? 'تبديل الألعاب' : 'Shuffle Games'}
                  </button>
                )}
              </div>
              <div className="text-xs text-slate-200">
                {currentMode === 'cup'
                  ? ar
                    ? 'ستلعب ضد الكمبيوتر عدة ألعاب مختلفة واحدة تلو الأخرى:'
                    : 'You will play a multi-game series of different mini-games:'
                  : ar
                  ? 'اللعبة المحددة:'
                  : 'Selected Game:'}{' '}
                {currentMode === 'single' && (
                  <span className="font-black text-amber-300">
                    #{currentGameSpec.num} · {ar ? currentGameSpec.nameAr : currentGameSpec.nameEn}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  partyAudio.playSelect();
                  setPreviewTutorialGameId(currentGameId);
                }}
                className="h-12 px-4 rounded-xl border border-amber-300/45 bg-amber-400/15 hover:bg-amber-400/25 text-amber-200 font-black text-xs sm:text-sm whitespace-nowrap cursor-pointer"
              >
                {ar ? 'تعليم اللعبة' : 'Game Tutorial'}
              </button>
              {isSolo ? (
                <button
                  type="button"
                  onClick={() => startSoloRound(0)}
                  className="h-12 px-7 rounded-xl bg-gradient-to-b from-emerald-300 to-emerald-500 hover:from-emerald-200 hover:to-emerald-400 text-slate-950 font-black text-base shadow-lg whitespace-nowrap cursor-pointer"
                >
                  {solo!.mode === 'cup'
                    ? ar
                      ? `ابدأ بطولة ${solo!.cupLength} ألعاب!`
                      : `Start ${solo!.cupLength}-Game Cup!`
                    : ar
                    ? 'ابدأ اللعب الآن!'
                    : 'Start Match Now!'}
                </button>
            ) : isHost ? (
              <button
                type="button"
                onClick={() => void handleHostLaunchMatch()}
                className="h-12 px-7 rounded-xl bg-gradient-to-b from-amber-300 to-amber-500 hover:from-amber-200 hover:to-amber-400 text-slate-950 font-black text-base shadow-lg whitespace-nowrap cursor-pointer"
              >
                {ar
                  ? roomPlayers.length > 1
                    ? `ابدأ التحدي (${roomPlayers.length} لاعبين)!`
                    : 'ابدأ المباراة الآن!'
                  : roomPlayers.length > 1
                  ? `Start Match (${roomPlayers.length} Players)!`
                  : 'Start Match Now!'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handleToggleReady()}
                className={`h-12 px-7 rounded-xl font-black text-base shadow-lg whitespace-nowrap cursor-pointer ${
                  myPlayer?.ready
                    ? 'bg-emerald-400 text-slate-950'
                    : 'bg-sky-400 hover:bg-sky-300 text-slate-950'
                }`}
              >
                {myPlayer?.ready
                  ? ar
                    ? 'جاهز! بانتظار المضيف...'
                    : 'Ready! Waiting for Host...'
                  : ar
                  ? 'اضغط للاستعداد!'
                  : 'Tap to Ready Up!'}
              </button>
              )}
            </div>
          </div>

          {/* Visual Roadmap Strip of All Different Mini-Games in this Cup */}
          {currentMode === 'cup' && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/10">
              {(isSolo ? solo!.cupQueue : room!.cupQueue).map((gId, idx) => {
                const g = MARIO_MINI_GAME_MAP[gId];
                if (!g) return null;
                return (
                  <div
                    key={`${gId}-${idx}`}
                    className="flex items-center gap-1.5 rounded-lg bg-[#09152b] border border-white/12 px-2.5 py-1 text-[11px]"
                  >
                    <span
                      className="font-num font-black px-1.5 py-0.5 rounded text-[10px] text-slate-950"
                      style={{ backgroundColor: g.accent }}
                    >
                      {idx + 1}
                    </span>
                    <span className="font-bold text-white whitespace-nowrap">
                      {ar ? g.nameAr : g.nameEn}
                    </span>
                    {g.is3D && (
                      <span className="font-num text-[9px] font-black text-sky-300">3D</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* STEP 3: ALL 25 MARIO MINI-GAMES BOARD */}
        <section className="rounded-2xl border border-white/10 bg-[#0b1730] p-4 sm:p-5">
          {render25GamesBoard(currentGameId, canConfigure, (id) => void handleHostPickGame(id))}
        </section>
      </div>
    );
  };

  // RENDER: AUTH / PROFILE NAME CREATION SCREEN
  const renderAuthOrNameSetup = () => (
    <div className="mx-auto max-w-[880px] space-y-5 py-2">
      {/* Hero Banner */}
      <div className="rounded-3xl border-2 border-amber-300/45 bg-gradient-to-br from-[#1b3678] via-[#10214a] to-[#0a142d] p-6 sm:p-8 shadow-2xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2.5 max-w-xl">
            <div className="text-xs font-black tracking-wide uppercase text-amber-300">
              {ar
                ? 'أونلاين مع أصدقاء حقيقيين · 8 شخصيات · 25 ميني قيم'
                : 'LIVE ONLINE MULTIPLAYER · 8 HEROES · 25 MINI-GAMES'}
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight">
              {ar ? 'حفلة ماريو أونلاين — 25 ميني قيم!' : 'Mario Party Online — 25 Mini-Games!'}
            </h2>
            <p className="text-sm text-slate-200 leading-relaxed">
              {ar
                ? 'اكتب اسمك الخاص، أضف أصدقاءك بالاسم أو الكود، ادعهم بضغطة زر، اختر شخصيتك من 8 أبطال قبل البدء، وتنافسوا مباشرة في 25 ميني قيم بأسلوب ماريو!'
                : 'Pick your custom player name, add friends by name or friend code, send live match invites, pick from 8 Mario-style heroes before starting, and compete across 25 mini-games!'}
            </p>
          </div>
          <div className="grid grid-cols-4 gap-2 shrink-0">
            {PARTY_CHARACTERS.slice(0, 4).map((c) => (
              <div
                key={c.id}
                className="rounded-2xl bg-white/10 border border-white/15 p-1.5 flex items-center justify-center"
              >
                <HeroAvatarSvg characterId={c.id} size={48} />
              </div>
            ))}
          </div>
        </div>

        {!authReady ? (
          <div className="text-sm font-bold text-sky-200">
            {ar ? 'جاري الاتصال بالخادم...' : 'Connecting to server...'}
          </div>
        ) : !fbUser ? (
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              disabled={authBusy}
              onClick={() => void handleGoogleSignIn()}
              className="h-12 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-slate-950 font-black text-sm sm:text-base shadow-lg whitespace-nowrap cursor-pointer"
            >
              {authBusy
                ? ar
                  ? 'جاري تسجيل الدخول...'
                  : 'Signing in...'
                : ar
                ? 'تسجيل الدخول بحساب Google للعب أونلاين'
                : 'Sign in with Google to Play Online'}
            </button>
            <button
              type="button"
              onClick={openSoloPractice}
              className="h-12 px-5 rounded-xl border border-emerald-400/45 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-100 font-extrabold text-sm sm:text-base whitespace-nowrap cursor-pointer"
            >
              {ar ? 'جرّب الـ 25 لعبة والشخصيات ضد البوت' : 'Try 25 Games & Heroes vs Bot'}
            </button>
          </div>
        ) : (
          /* Signed in -> Write Custom Display Name + Pick Default Hero */
          <form onSubmit={handleSaveProfile} className="space-y-4 pt-2 border-t border-white/15">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-8 space-y-1.5">
                <label className="block text-xs font-extrabold text-amber-200">
                  {ar ? 'اكتب اسمك في اللعبة (يستطيع أصدقاؤك إضافتك به)' : 'Write Your Player Name (Friends can add you with it)'}
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  maxLength={24}
                  placeholder={ar ? 'مثال: أحمد البطل' : 'e.g. SuperAlex'}
                  className="w-full h-11 px-4 rounded-xl bg-[#071126] border-2 border-sky-400/40 focus:border-amber-300 text-white font-bold text-sm outline-none"
                />
              </div>
              <div className="sm:col-span-4">
                <button
                  type="submit"
                  disabled={authBusy}
                  className="w-full h-11 rounded-xl bg-emerald-400 hover:bg-emerald-300 disabled:opacity-60 text-slate-950 font-black text-sm cursor-pointer"
                >
                  {authBusy
                    ? ar
                      ? 'جاري الحفظ...'
                      : 'Saving...'
                    : profile
                    ? ar
                      ? 'حفظ التعديلات'
                      : 'Save Changes'
                    : ar
                    ? 'حفظ الاسم والدخول!'
                    : 'Save Name & Enter!'}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-extrabold text-sky-200">
                {ar ? 'اختر شخصيتك المفضلة:' : 'Pick your favorite hero:'}
              </div>
              {renderCharacterSelectGrid(favCharInput, (id) => {
                partyAudio.playSelect();
                setFavCharInput(id);
              })}
            </div>

            {profile && (
              <button
                type="button"
                onClick={() => setEditingProfile(false)}
                className="text-xs font-bold text-slate-300 hover:text-white cursor-pointer"
              >
                {ar ? 'إلغاء والعودة' : 'Cancel'}
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );

  // RENDER: ONLINE MULTIPLAYER HUB (Friends + Add Friend + Invites + Create/Join Room)
  const renderOnlineHub = () => {
    if (!profile) return null;
    return (
      <div className="mx-auto max-w-[1040px] space-y-5">
        {renderIncomingInvitesBanner()}

        {/* Profile Identity Strip */}
        <div className="rounded-2xl border border-amber-300/35 bg-gradient-to-r from-[#13254c] via-[#0e1e3e] to-[#112446] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <HeroAvatarSvg characterId={profile.favoriteCharacter} size={58} className="shrink-0" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white truncate">
                  {profile.displayName}
                </h2>
                <button
                  type="button"
                  onClick={() =>
                    void handleCopyText(
                      profile.friendCode,
                      ar ? `تم نسخ كودك: ${profile.friendCode}` : `Copied code: ${profile.friendCode}`
                    )
                  }
                  className="font-num text-xs font-black px-2.5 py-1 rounded-lg bg-amber-400/20 border border-amber-300/50 text-amber-200 hover:bg-amber-400/30 whitespace-nowrap cursor-pointer"
                >
                  {ar ? `كود الصداقة: ${profile.friendCode}` : `Friend Code: ${profile.friendCode}`}
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 mt-1 font-num">
                <span>
                  {ar ? 'الانتصارات:' : 'Wins:'}{' '}
                  <strong className="text-emerald-300">{profile.wins}</strong>
                </span>
                <span>
                  {ar ? 'النجوم:' : 'Stars:'}{' '}
                  <strong className="text-amber-300">★ {profile.starsTotal}</strong>
                </span>
                <span>
                  {ar ? 'المباريات:' : 'Matches:'}{' '}
                  <strong className="text-sky-300">{profile.gamesPlayed}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setNameInput(profile.displayName);
                setFavCharInput(profile.favoriteCharacter);
                setEditingProfile(true);
              }}
              className="h-9 px-3.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-slate-100 font-bold text-xs whitespace-nowrap cursor-pointer"
            >
              {ar ? 'تعديل الاسم / الشخصية' : 'Edit Name / Hero'}
            </button>
            <button
              type="button"
              onClick={() => void signOutPartyUser()}
              className="h-9 px-3.5 rounded-xl border border-rose-400/35 bg-rose-500/10 hover:bg-rose-500/20 text-rose-200 font-bold text-xs whitespace-nowrap cursor-pointer"
            >
              {ar ? 'تسجيل الخروج' : 'Sign Out'}
            </button>
          </div>
        </div>

        {/* Main 2-Column Online Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left 7 Cols: Create Room / Join Room / Solo Practice */}
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-2xl border border-sky-400/30 bg-[#0c1a34] p-5 space-y-4">
              <div>
                <h3 className="text-lg font-black text-white">
                  {ar ? 'ابدأ غرفة أونلاين مع أصدقائك' : 'Start an Online Room with Friends'}
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  {ar
                    ? 'أنشئ غرفة لاختيار الشخصيات الـ8 وبدء تحدي 25 ميني قيم مباشر ضد أصدقائك!'
                    : 'Create a room to pick from 8 Mario heroes and battle friends live across 25 mini-games!'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setCreateMode('cup')}
                  className={`rounded-xl p-3 text-start border-2 transition-all cursor-pointer ${
                    createMode === 'cup'
                      ? 'border-amber-300 bg-amber-400/15'
                      : 'border-white/10 bg-[#091429] hover:border-white/25'
                  }`}
                >
                  <div className="font-black text-sm text-amber-200">
                    {ar ? 'بطولة الكأس (5 جولات)' : 'Star Cup (5 Rounds)'}
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    {ar ? '5 ألعاب متتالية واجمع أكبر عدد نجوم!' : '5 mini-games in a row for the Star Trophy!'}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setCreateMode('single')}
                  className={`rounded-xl p-3 text-start border-2 transition-all cursor-pointer ${
                    createMode === 'single'
                      ? 'border-sky-300 bg-sky-400/15'
                      : 'border-white/10 bg-[#091429] hover:border-white/25'
                  }`}
                >
                  <div className="font-black text-sm text-sky-200">
                    {ar ? 'اختيار حر من 25 لعبة' : 'Free Pick (25 Games)'}
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    {ar ? 'اختر أي ميني قيم مفضلة والعبها فوراً!' : 'Choose any of the 25 mini-games directly!'}
                  </div>
                </button>
              </div>

              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  disabled={roomBusy}
                  onClick={() => void handleCreateRoom()}
                  className="flex-1 min-w-[200px] h-12 px-5 rounded-xl bg-gradient-to-b from-amber-300 to-amber-500 hover:from-amber-200 hover:to-amber-400 disabled:opacity-60 text-slate-950 font-black text-sm sm:text-base shadow-lg cursor-pointer"
                >
                  {roomBusy
                    ? ar
                      ? 'جاري الإنشاء...'
                      : 'Creating...'
                    : ar
                    ? 'إنشاء غرفة واختيار الشخصيات'
                    : 'Create Room & Pick Heroes'}
                </button>
                <button
                  type="button"
                  onClick={openSoloPractice}
                  className="h-12 px-4 rounded-xl border border-emerald-400/45 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-100 font-extrabold text-sm whitespace-nowrap cursor-pointer"
                >
                  {ar ? 'تدريب ضد البوت' : 'Practice vs Bot'}
                </button>
              </div>

              {/* Join Room by Code */}
              <form
                onSubmit={(e) => void handleJoinByCode(e)}
                className="pt-3 border-t border-white/10 flex gap-2"
              >
                <input
                  type="text"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  maxLength={8}
                  placeholder={ar ? 'أدخل كود غرفة صديقك (6 أحرف)...' : 'Enter friend room code (6 chars)...'}
                  className="flex-1 h-10 px-3.5 rounded-xl bg-[#071126] border border-white/15 focus:border-sky-400 text-white font-num font-bold text-sm uppercase outline-none"
                />
                <button
                  type="submit"
                  disabled={roomBusy}
                  className="h-10 px-5 rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-950 font-black text-sm whitespace-nowrap cursor-pointer"
                >
                  {ar ? 'انضمام' : 'Join'}
                </button>
              </form>
            </div>
          </div>

          {/* Right 5 Cols: Add Friends + Friend Requests + Friends List */}
          <div className="lg:col-span-5 rounded-2xl border border-emerald-400/25 bg-[#0c1a34] p-5 space-y-4">
            <div>
              <h3 className="text-base font-black text-white">
                {ar ? 'الأصدقاء والدعوات المباشرة' : 'Friends & Live Invites'}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                {ar
                  ? 'ابحث بالاسم أو كود الصداقة لإضافة شخص ودعوته للعب عليك!'
                  : 'Search by exact Name or Friend Code to add & challenge friends!'}
              </p>
            </div>

            {/* Add Friend Search */}
            <form onSubmit={handleSearchFriend} className="flex gap-2">
              <input
                type="text"
                value={friendSearch}
                onChange={(e) => setFriendSearch(e.target.value)}
                placeholder={ar ? 'اسم الصديق أو الكود...' : 'Friend name or code...'}
                className="flex-1 h-10 px-3 rounded-xl bg-[#071126] border border-white/15 focus:border-emerald-400 text-white text-xs sm:text-sm font-semibold outline-none"
              />
              <button
                type="submit"
                disabled={searchBusy}
                className="h-10 px-4 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs sm:text-sm whitespace-nowrap cursor-pointer"
              >
                {searchBusy ? '...' : ar ? 'بحث' : 'Find'}
              </button>
            </form>

            {searchResult && (
              <div className="rounded-xl border border-emerald-300/50 bg-emerald-400/10 p-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <HeroAvatarSvg characterId={searchResult.favoriteCharacter} size={40} className="shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-black text-white truncate">
                      {searchResult.displayName}
                    </div>
                    <div className="font-num text-[11px] text-emerald-200">
                      {searchResult.friendCode}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void handleSendFriendRequest(searchResult)}
                  className="h-8 px-3.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs whitespace-nowrap cursor-pointer"
                >
                  {ar ? 'إضافة صديق' : 'Add Friend'}
                </button>
              </div>
            )}

            {/* Incoming Friend Requests */}
            {incomingFriendReqs.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="text-xs font-black text-amber-300">
                  {ar
                    ? `طلبات صداقة واردة (${incomingFriendReqs.length})`
                    : `Incoming Friend Requests (${incomingFriendReqs.length})`}
                </div>
                {incomingFriendReqs.map((req) => (
                  <div
                    key={req.id}
                    className="rounded-xl border border-amber-300/35 bg-[#122446] p-2.5 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <HeroAvatarSvg characterId={req.fromCharacter} size={34} className="shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-white truncate">
                          {req.fromName}
                        </div>
                        <div className="font-num text-[10px] text-slate-300">{req.fromCode}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => void handleRespondFriendReq(req, true)}
                        className="h-7 px-2.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-[11px] cursor-pointer"
                      >
                        {ar ? 'قبول' : 'Accept'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleRespondFriendReq(req, false)}
                        className="h-7 px-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 font-bold text-[11px] cursor-pointer"
                      >
                        {ar ? 'رفض' : 'No'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Friends List */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="text-xs font-black text-sky-200">
                {ar
                  ? `قائمة الأصدقاء (${friendships.length})`
                  : `Your Friends (${friendships.length})`}
              </div>
              {friendships.length === 0 ? (
                <p className="text-xs text-slate-400 leading-relaxed">
                  {ar
                    ? 'لا يوجد أصدقاء بعد — شارك كود الصداقة الخاص بك أو ابحث عن اسم صديقك بالأعلى.'
                    : 'No friends yet — share your Friend Code or search your friend above.'}
                </p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pe-1">
                  {friendships.map((f) => {
                    const fr = getFriendInfo(f, profile.uid);
                    return (
                      <div
                        key={fr.id}
                        className="rounded-xl border border-white/10 bg-[#09152b] px-3 py-2 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <HeroAvatarSvg characterId={fr.characterId} size={36} className="shrink-0" />
                          <div className="min-w-0">
                            <div className="text-xs font-extrabold text-white truncate">
                              {fr.displayName}
                            </div>
                            <div className="font-num text-[10px] text-slate-400">
                              {fr.friendCode}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => void handleInviteFriend(fr.uid, fr.displayName)}
                            className="h-8 px-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs whitespace-nowrap cursor-pointer"
                          >
                            {ar ? 'دعوة للعب!' : 'Invite!'}
                          </button>
                          <button
                            type="button"
                            onClick={() => void removeFriendship(fr.id)}
                            title={ar ? 'حذف' : 'Remove'}
                            className="h-8 w-8 rounded-lg border border-white/10 bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-200 font-bold text-xs cursor-pointer"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preview of all 30 Mini-Games right from the Hub */}
        <section className="rounded-2xl border border-white/10 bg-[#0c1a34] p-4 sm:p-5">
          {render25GamesBoard(selectedGameId, true, (id) => {
            partyAudio.playSelect();
            setSelectedGameId(id);
          })}
        </section>
      </div>
    );
  };

  // RENDER: SOLO PRE-GAME TUTORIAL SCREEN (before each mini-game starts)
  const renderSoloTutorial = () => {
    if (!solo) return null;
    const spec = MARIO_MINI_GAME_MAP[solo.currentGameId];
    const roundLabel =
      solo.mode === 'cup'
        ? ar
          ? `الجولة ${solo.roundIndex + 1} / ${solo.cupQueue.length}`
          : `Round ${solo.roundIndex + 1} / ${solo.cupQueue.length}`
        : `#${spec.num}`;
    return (
      <div className="mx-auto max-w-[880px] space-y-3 py-1">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() =>
              setSolo((prev) => (prev ? { ...prev, phase: 'character_select' } : prev))
            }
            className="h-9 px-3.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-200 cursor-pointer"
          >
            {ar ? 'رجوع لاختيار الشخصية والألعاب' : 'Back to Hero & Game Select'}
          </button>
          <span className="font-num text-xs font-bold text-amber-300">
            {ar ? `النجوم: ★ ${solo.myStars}` : `Stars: ★ ${solo.myStars}`}
          </span>
        </div>

        <MiniGameTutorialScreen
          lang={lang}
          gameId={solo.currentGameId}
          roundLabel={roundLabel}
          myCharId={solo.characterId}
          rivalCharId={solo.botCharacterId}
          onStartNow={beginSoloPlayingAfterTutorial}
          showEveryRound={showTutorialBeforeRound}
          onToggleShowEveryRound={toggleShowTutorialBeforeRound}
        />
      </div>
    );
  };

  // Decide active view
  let content: React.ReactNode;
  if (solo) {
    if (solo.phase === 'character_select') {
      content = renderCharacterSelectLobby();
    } else if (solo.phase === 'tutorial') {
      content = renderSoloTutorial();
    } else if (solo.phase === 'playing') {
      content = renderPlayingArena();
    } else {
      content = renderResultOrPodium();
    }
  } else if (!authReady || !fbUser || !profile || editingProfile) {
    content = renderAuthOrNameSetup();
  } else if (room) {
    if (room.status === 'lobby') {
      content = renderCharacterSelectLobby();
    } else if (room.status === 'playing') {
      content = renderPlayingArena();
    } else {
      content = renderResultOrPodium();
    }
  } else {
    content = renderOnlineHub();
  }

  return (
    <div
      dir={ar ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-50 bg-[#060f22] text-slate-100 flex flex-col overflow-hidden select-none"
    >
      {/* Top Bar */}
      <header className="w-full border-b border-white/10 bg-[#0a1733]/95 shrink-0">
        <div className="mx-auto max-w-[1080px] h-14 px-3 sm:px-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              if (activeRoomCode && profile) {
                void leavePartyRoom(activeRoomCode, profile.uid);
              }
              onExit();
            }}
            className="h-9 px-3.5 rounded-lg border border-rose-400/40 bg-rose-500/15 hover:bg-rose-500/25 text-rose-200 hover:text-white text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 cursor-pointer"
          >
            {ar ? 'خروج' : 'Exit'}
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <span className="font-num text-xs font-black px-2 py-0.5 rounded bg-amber-400 text-slate-950 shrink-0">
              25 + 5 3D
            </span>
            <h1 className="text-sm sm:text-lg font-black text-white truncate">
              {ar ? 'حفلة ماريو أونلاين' : 'Mario Party Online'}
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                partyAudio.playSelect();
                setShowQuickGuide(true);
              }}
              className="h-8 px-3 rounded-lg border border-amber-300/45 bg-amber-400/15 hover:bg-amber-400/25 text-amber-200 text-xs font-black whitespace-nowrap cursor-pointer"
            >
              {ar ? 'كيف تلعب؟' : 'How to Play'}
            </button>
            {profile && !solo && (
              <span className="hidden sm:inline-block font-num text-xs font-bold text-amber-300 whitespace-nowrap">
                {profile.displayName} · {profile.friendCode}
              </span>
            )}
            <span className="hidden md:inline-block text-xs font-bold text-sky-300 whitespace-nowrap">
              {ar ? '8 شخصيات' : '8 Heroes'}
            </span>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {toast && (
        <div className="px-4 pt-3 shrink-0">
          <div
            className={`mx-auto max-w-[680px] rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold text-center border ${
              toast.tone === 'ok'
                ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-100'
                : toast.tone === 'err'
                ? 'bg-rose-500/20 border-rose-400/50 text-rose-100'
                : 'bg-sky-500/20 border-sky-400/50 text-sky-100'
            }`}
          >
            {toast.text}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-5 py-4 sm:py-6">
        {content}
      </main>

      {/* Preview Tutorial Modal (opened from Lobby "تعليم اللعبة" button) */}
      {previewTutorialGameId && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-5"
          onClick={() => setPreviewTutorialGameId(null)}
        >
          <div
            className="w-full max-w-3xl max-h-[90dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <MiniGameTutorialScreen
              lang={lang}
              gameId={previewTutorialGameId}
              roundLabel={`#${MARIO_MINI_GAME_MAP[previewTutorialGameId].num}`}
              myCharId={
                solo
                  ? solo.characterId
                  : myPlayer?.characterId ?? profile?.favoriteCharacter ?? 'marco'
              }
              rivalCharId={solo ? solo.botCharacterId : undefined}
              onClosePreview={() => setPreviewTutorialGameId(null)}
              onStartNow={() => setPreviewTutorialGameId(null)}
              startLabel={ar ? 'فهمت، جاهز للعب!' : 'Got It, Ready!'}
            />
          </div>
        </div>
      )}

      {/* Quick Start Guide Modal */}
      {showQuickGuide && (
        <PartyQuickGuideModal lang={lang} onClose={() => setShowQuickGuide(false)} />
      )}
    </div>
  );
};

export const MarioPartyGame: React.FC<MarioPartyGameProps> = (props) => (
  <PartyErrorBoundary lang={props.lang} onExit={props.onExit}>
    <MarioPartyGameInner {...props} />
  </PartyErrorBoundary>
);
