import { GumShopAudio } from './audio';
import {
  AD_CAMPAIGN_MAP,
  AD_COST,
  AD_DURATION_DAYS,
  clampCashierPosition,
  clampShelfPosition,
  clearGumShopSave,
  computeDailyRent,
  createDefaultPrices,
  DAY_DURATION_SEC,
  DEFAULT_CHECKOUT_POS,
  EMERGENCY_GRANT_AMOUNT,
  getDaysUntilRent,
  getPriceVerdict,
  getShopBounds,
  GUM_FLAVOR_MAP,
  GUM_FLAVORS,
  MIN_CRATE_COST,
  PACKS_PER_BOX,
  readGumShopSave,
  RENT_INTERVAL_DAYS,
  SHELF_MAX_STOCK,
  SHELF_SLOTS,
  SHOP_TIERS,
  SHOP_UPGRADES,
  STORAGE_MAX_PACKS,
  STORAGE_ROOM_COST,
  writeGumShopSave,
  type ActiveAdState,
  type AdCampaignId,
  type CarriedCrateState,
  type CustomerEntity,
  type DeliveryCrateState,
  type FloatingNotice,
  type GumFlavorId,
  type GumShopHudSnapshot,
  type GumShopSaveData,
  type GumShopStatus,
  type ShelfState,
  type ShopBounds,
  type ShopLevel,
  type UpgradeId,
} from './types';

export interface GumShopInput {
  moveX: number;
  moveZ: number;
}

export interface WalkTarget {
  x: number;
  z: number;
  action?:
    | { kind: 'pickup_crate'; crateId: number }
    | { kind: 'stock_shelf'; slotIndex: number }
    | { kind: 'checkout' }
    | { kind: 'open_house_puzzle' }
    | { kind: 'sleep_bed' }
    | { kind: 'storage_interact' };
}

export interface GumShopWorld {
  lang: 'ar' | 'en';
  status: GumShopStatus;
  hasExistingSave: boolean;
  money: number;
  day: number;
  dayTimeLeft: number;
  isNight: boolean;
  houseDoorUnlocked: boolean;
  solvedPuzzleIds: number[];
  pendingHousePuzzle: boolean;
  pendingOpenStorage: boolean;
  hasStorageRoom: boolean;
  storageStock: Partial<Record<GumFlavorId, number>>;
  activeAds: ActiveAdState[];
  shopLevel: ShopLevel;
  cashierX: number;
  cashierZ: number;
  sleepFadeTimer: number;
  unpaidRent: number;
  missedRentDays: number;
  totalEarned: number;
  totalPacksSold: number;
  todayRevenue: number;
  todayWholesale: number;
  todayPacksSold: number;
  shelves: ShelfState[];
  prices: Record<GumFlavorId, number>;
  cratesOutside: DeliveryCrateState[];
  carriedCrate: CarriedCrateState | null;
  upgrades: UpgradeId[];
  customers: CustomerEntity[];
  nextCrateId: number;
  nextCustomerId: number;
  spawnTimer: number;
  autoSaveTimer: number;
  lastSavedAt: number;
  playerX: number;
  playerZ: number;
  playerRotY: number;
  playerMoving: boolean;
  walkTarget: WalkTarget | null;
  notice: FloatingNotice | null;
  noticeTimer: number;
  nextNoticeId: number;
  version: number;
}

export const DOOR_Z = 3.0;
export const DOOR_HALF_WIDTH = 1.65;

const CUSTOMER_SHIRTS = ['#38bdf8', '#fb7185', '#a78bfa', '#34d399', '#fbbf24', '#f97316'];
const CUSTOMER_HAIR = ['#1e293b', '#451a03', '#78350f', '#0f172a', '#57534e'];

function getShelfCapacity(): number {
  return SHELF_MAX_STOCK;
}

export function getStorageTotalPacks(
  storageStock: Partial<Record<GumFlavorId, number>>
): number {
  let sum = 0;
  for (const f of GUM_FLAVORS) {
    sum += Math.max(0, storageStock[f.id] ?? 0);
  }
  return sum;
}

function getActiveAdBonuses(activeAds: ActiveAdState[]): {
  spawnDelayMult: number;
  extraMaxCustomers: number;
  extraBuyPacks: number;
  revenueBonus: number;
} {
  let spawnDelayMult = 1.0;
  let extraMaxCustomers = 0;
  let extraBuyPacks = 0;
  let revenueBonus = 0;

  for (const ad of activeAds) {
    if (ad.daysLeft <= 0) continue;
    if (ad.id === 'mega_flavors') {
      spawnDelayMult *= 0.72;
      extraMaxCustomers += 2;
    } else if (ad.id === 'super_offers') {
      extraBuyPacks += 1;
      revenueBonus += 0.12;
    } else if (ad.id === 'vip_crown') {
      extraMaxCustomers += 2;
      revenueBonus += 0.15;
    } else if (ad.id === 'viral_festival') {
      spawnDelayMult *= 0.68;
      extraMaxCustomers += 3;
      extraBuyPacks += 1;
      revenueBonus += 0.18;
    }
  }

  return {
    spawnDelayMult: Math.max(0.45, spawnDelayMult),
    extraMaxCustomers: Math.min(6, extraMaxCustomers),
    extraBuyPacks: Math.min(2, extraBuyPacks),
    revenueBonus: Math.min(0.45, revenueBonus),
  };
}

function advanceActiveAdsOneDay(world: GumShopWorld): void {
  if (world.activeAds.length === 0) return;
  world.activeAds = world.activeAds
    .map((ad) => ({ ...ad, daysLeft: ad.daysLeft - 1 }))
    .filter((ad) => ad.daysLeft > 0);
}

function getCashierStandPoint(world: GumShopWorld): { x: number; z: number } {
  const standX = world.cashierX >= 0 ? world.cashierX - 1.15 : world.cashierX + 1.15;
  return { x: standX, z: world.cashierZ };
}

export function isPointInsideHouse(x: number, z: number, bounds: ShopBounds): boolean {
  return (
    x > bounds.houseX - 2.15 &&
    x < bounds.houseX + 2.15 &&
    z > bounds.houseZ - 2.25 &&
    z < bounds.houseFrontZ
  );
}

function createFreshWorldData(): GumShopSaveData {
  const s0 = SHELF_SLOTS[0];
  const s1 = SHELF_SLOTS[1];
  return {
    version: 7,
    money: 150,
    day: 1,
    dayTimeLeft: DAY_DURATION_SEC,
    isNight: false,
    houseDoorUnlocked: false,
    solvedPuzzleIds: [],
    hasStorageRoom: false,
    storageStock: {},
    activeAds: [],
    shopLevel: 1,
    cashierX: DEFAULT_CHECKOUT_POS.x,
    cashierZ: DEFAULT_CHECKOUT_POS.z,
    unpaidRent: 0,
    missedRentDays: 0,
    totalEarned: 0,
    totalPacksSold: 0,
    todayRevenue: 0,
    todayWholesale: 0,
    todayPacksSold: 0,
    shelves: [
      {
        slotIndex: 0,
        style: 'wood',
        x: s0.x,
        z: s0.z,
        rotY: s0.rotY,
        flavor: 'mint',
        stock: 6,
      },
      {
        slotIndex: 1,
        style: 'wood',
        x: s1.x,
        z: s1.z,
        rotY: s1.rotY,
        flavor: 'strawberry',
        stock: 4,
      },
    ],
    prices: createDefaultPrices(),
    cratesOutside: [
      { id: 1, flavor: 'mint', packs: PACKS_PER_BOX, x: -3.1, z: 5.5 },
    ],
    carriedCrate: null,
    upgrades: [],
    nextCrateId: 2,
    savedAt: Date.now(),
  };
}

export function createGumShopWorld(lang: 'ar' | 'en'): GumShopWorld {
  const saved = readGumShopSave();
  const data = saved ?? createFreshWorldData();

  return {
    lang,
    status: 'TITLE',
    hasExistingSave: Boolean(saved),
    money: data.money,
    day: data.day,
    dayTimeLeft: data.dayTimeLeft,
    isNight: data.isNight || data.dayTimeLeft <= 0,
    houseDoorUnlocked: data.houseDoorUnlocked,
    solvedPuzzleIds: [...data.solvedPuzzleIds],
    pendingHousePuzzle: false,
    pendingOpenStorage: false,
    hasStorageRoom: data.hasStorageRoom,
    storageStock: { ...data.storageStock },
    activeAds: data.activeAds.map((a) => ({ ...a })),
    shopLevel: data.shopLevel,
    cashierX: data.cashierX,
    cashierZ: data.cashierZ,
    sleepFadeTimer: 0,
    unpaidRent: data.unpaidRent,
    missedRentDays: data.missedRentDays,
    totalEarned: data.totalEarned,
    totalPacksSold: data.totalPacksSold,
    todayRevenue: data.todayRevenue,
    todayWholesale: data.todayWholesale,
    todayPacksSold: data.todayPacksSold,
    shelves: data.shelves.map((s) => ({
      ...s,
      stock: Math.min(SHELF_MAX_STOCK, Math.max(0, s.stock)),
    })),
    prices: { ...data.prices },
    cratesOutside: data.cratesOutside.map((c) => ({ ...c })),
    carriedCrate: data.carriedCrate ? { ...data.carriedCrate } : null,
    upgrades: [...data.upgrades],
    customers: [],
    nextCrateId: data.nextCrateId,
    nextCustomerId: 1,
    spawnTimer: 2.2,
    autoSaveTimer: 0,
    lastSavedAt: data.savedAt,
    playerX: 0,
    playerZ: 0.4,
    playerRotY: 0,
    playerMoving: false,
    walkTarget: null,
    notice: null,
    noticeTimer: 0,
    nextNoticeId: 1,
    version: 1,
  };
}

export function saveGumShopWorldNow(world: GumShopWorld): void {
  const now = Date.now();
  const payload: GumShopSaveData = {
    version: 7,
    money: Math.max(0, Math.round(world.money)),
    day: world.day,
    dayTimeLeft: Math.max(0, Math.min(DAY_DURATION_SEC, world.dayTimeLeft)),
    isNight: world.isNight,
    houseDoorUnlocked: world.houseDoorUnlocked,
    solvedPuzzleIds: [...world.solvedPuzzleIds],
    hasStorageRoom: world.hasStorageRoom,
    storageStock: { ...world.storageStock },
    activeAds: world.activeAds.map((a) => ({ ...a })),
    shopLevel: world.shopLevel,
    cashierX: world.cashierX,
    cashierZ: world.cashierZ,
    unpaidRent: Math.max(0, Math.round(world.unpaidRent)),
    missedRentDays: world.missedRentDays,
    totalEarned: Math.max(0, Math.round(world.totalEarned)),
    totalPacksSold: world.totalPacksSold,
    todayRevenue: Math.max(0, Math.round(world.todayRevenue)),
    todayWholesale: Math.max(0, Math.round(world.todayWholesale)),
    todayPacksSold: world.todayPacksSold,
    shelves: world.shelves.map((s) => ({ ...s })),
    prices: { ...world.prices },
    cratesOutside: world.cratesOutside.map((c) => ({ ...c })),
    carriedCrate: world.carriedCrate ? { ...world.carriedCrate } : null,
    upgrades: [...world.upgrades],
    nextCrateId: world.nextCrateId,
    savedAt: now,
  };
  writeGumShopSave(payload);
  world.lastSavedAt = now;
  world.hasExistingSave = true;
}

export function pushNotice(
  world: GumShopWorld,
  textAr: string,
  textEn: string,
  tone: 'good' | 'warn' | 'info' = 'info'
): void {
  world.notice = {
    id: world.nextNoticeId++,
    text: world.lang === 'ar' ? textAr : textEn,
    tone,
  };
  world.noticeTimer = 3.2;
}

export function actionStartOrResume(world: GumShopWorld): void {
  world.status = 'PLAYING';
  saveGumShopWorldNow(world);
}

export function actionResetShop(world: GumShopWorld): void {
  clearGumShopSave();
  const fresh = createFreshWorldData();
  world.money = fresh.money;
  world.day = fresh.day;
  world.dayTimeLeft = fresh.dayTimeLeft;
  world.isNight = false;
  world.houseDoorUnlocked = false;
  world.solvedPuzzleIds = [];
  world.pendingHousePuzzle = false;
  world.pendingOpenStorage = false;
  world.hasStorageRoom = false;
  world.storageStock = {};
  world.activeAds = [];
  world.shopLevel = 1;
  world.cashierX = fresh.cashierX;
  world.cashierZ = fresh.cashierZ;
  world.sleepFadeTimer = 0;
  world.unpaidRent = 0;
  world.missedRentDays = 0;
  world.totalEarned = 0;
  world.totalPacksSold = 0;
  world.todayRevenue = 0;
  world.todayWholesale = 0;
  world.todayPacksSold = 0;
  world.shelves = fresh.shelves.map((s) => ({ ...s }));
  world.prices = { ...fresh.prices };
  world.cratesOutside = fresh.cratesOutside.map((c) => ({ ...c }));
  world.carriedCrate = null;
  world.upgrades = [];
  world.customers = [];
  world.nextCrateId = fresh.nextCrateId;
  world.playerX = 0;
  world.playerZ = 0.4;
  world.walkTarget = null;
  world.status = 'PLAYING';
  world.version += 1;
  saveGumShopWorldNow(world);
}

function findNextCrateDropSpot(world: GumShopWorld): { x: number; z: number } {
  const cols = [-4.6, -3.55, -2.5, 2.5, 3.55, 4.6];
  const rows = [5.3, 6.45, 7.5];
  for (const rz of rows) {
    for (const cx of cols) {
      const taken = world.cratesOutside.some(
        (c) => Math.hypot(c.x - cx, c.z - rz) < 0.72
      );
      if (!taken) return { x: cx, z: rz };
    }
  }
  const idx = world.cratesOutside.length;
  return {
    x: -4.2 + (idx % 5) * 0.9,
    z: 5.8 + Math.floor(idx / 5) * 0.8,
  };
}

export function actionOrderCrate(
  world: GumShopWorld,
  flavor: GumFlavorId,
  audio: GumShopAudio
): boolean {
  const spec = GUM_FLAVOR_MAP[flavor];
  if (!spec) return false;
  if (world.cratesOutside.length >= 16) {
    audio.playWarn();
    pushNotice(
      world,
      'الرصيف الخارجي ممتلئ! اخرج وخذ الكراتين أولاً',
      'Sidewalk is full! Go outside and pick up crates first',
      'warn'
    );
    return false;
  }
  if (world.money < spec.boxCost) {
    audio.playWarn();
    pushNotice(
      world,
      `تحتاج ${spec.boxCost} ريال لطلب كرتون ${spec.nameAr}`,
      `Need ${spec.boxCost} SAR to order ${spec.nameEn}`,
      'warn'
    );
    return false;
  }

  world.money -= spec.boxCost;
  world.todayWholesale += spec.boxCost;
  const spot = findNextCrateDropSpot(world);
  const bonusPacks = world.upgrades.includes('stock_gloves') ? 2 : 0;
  world.cratesOutside.push({
    id: world.nextCrateId++,
    flavor,
    packs: PACKS_PER_BOX + bonusPacks,
    x: spot.x,
    z: spot.z,
  });
  world.version += 1;
  audio.playOrderDrop();
  pushNotice(
    world,
    bonusPacks > 0
      ? `وصل كرتون ${spec.nameAr} (${PACKS_PER_BOX + bonusPacks} علب مع مكافأة القفازات!) خارج الباب`
      : `وصل كرتون ${spec.nameAr} خارج باب المحل! اخرج لأخذه`,
    bonusPacks > 0
      ? `${spec.nameEn} crate (${PACKS_PER_BOX + bonusPacks} packs w/ gloves bonus!) arrived outside!`
      : `${spec.nameEn} crate arrived outside! Go pick it up`,
    'good'
  );
  saveGumShopWorldNow(world);
  return true;
}

export function actionSetPrice(
  world: GumShopWorld,
  flavor: GumFlavorId,
  newPrice: number
): void {
  const spec = GUM_FLAVOR_MAP[flavor];
  if (!spec) return;
  const clamped = Math.max(spec.minPrice, Math.min(spec.maxPrice, Math.round(newPrice)));
  world.prices[flavor] = clamped;
  saveGumShopWorldNow(world);
}

export function actionExpandShop(world: GumShopWorld, audio: GumShopAudio): boolean {
  if (world.shopLevel >= 3) return false;
  const nextLevel = (world.shopLevel + 1) as ShopLevel;
  const tier = SHOP_TIERS.find((t) => t.level === nextLevel);
  if (!tier) return false;

  if (world.money < tier.cost) {
    audio.playWarn();
    pushNotice(
      world,
      `تحتاج ${tier.cost} ريال لتكبير المحل إلى ${tier.nameAr}`,
      `Need ${tier.cost} SAR to expand to ${tier.nameEn}`,
      'warn'
    );
    return false;
  }

  world.money -= tier.cost;
  world.shopLevel = nextLevel;
  world.version += 1;
  audio.playBuyUpgrade();
  pushNotice(
    world,
    `مبروك! تم تكبير المحل إلى ${tier.nameAr} وفتح رفوف جديدة!`,
    `Expanded to ${tier.nameEn}! Extra 3D shelves unlocked!`,
    'good'
  );
  saveGumShopWorldNow(world);
  return true;
}

export function actionMoveCashier(
  world: GumShopWorld,
  targetX: number,
  targetZ: number,
  audio: GumShopAudio
): boolean {
  const clamped = clampCashierPosition(targetX, targetZ, world.shopLevel);

  const cashierHalfX = 0.78;
  const cashierHalfZ = 1.2;
  for (const shelf of world.shelves) {
    const box = getShelfBox(shelf);
    const overlapX = Math.abs(clamped.x - box.cx) < cashierHalfX + box.halfX + 0.12;
    const overlapZ = Math.abs(clamped.z - box.cz) < cashierHalfZ + box.halfZ + 0.12;
    if (overlapX && overlapZ) {
      audio.playWarn();
      pushNotice(
        world,
        'لا يمكن وضع الكاشير فوق رف! اختر مكاناً فارغاً داخل المحل',
        'Cannot place cashier on top of a shelf! Pick an open spot inside',
        'warn'
      );
      return false;
    }
  }

  world.cashierX = clamped.x;
  world.cashierZ = clamped.z;
  const safePlayer = resolvePlayerPosition(
    world,
    world.playerX,
    world.playerZ,
    world.playerX,
    world.playerZ
  );
  world.playerX = safePlayer.x;
  world.playerZ = safePlayer.z;
  world.version += 1;
  audio.playPickup();
  pushNotice(
    world,
    'تم نقل الكاشير إلى المكان الجديد داخل المحل!',
    'Cashier counter moved to its new spot!',
    'good'
  );
  saveGumShopWorldNow(world);
  return true;
}

export function actionMoveShelf(
  world: GumShopWorld,
  slotIndex: number,
  targetX: number,
  targetZ: number,
  rotY: number,
  audio: GumShopAudio
): boolean {
  const shelf = world.shelves.find((s) => s.slotIndex === slotIndex);
  if (!shelf) return false;

  const clamped = clampShelfPosition(targetX, targetZ, rotY, world.shopLevel);
  const rotated = Math.abs(Math.sin(rotY)) > 0.5;
  const newHalfX = rotated ? 0.36 : 1.01;
  const newHalfZ = rotated ? 1.01 : 0.36;

  // Check collision against cashier counter
  const cashierOverlapX = Math.abs(clamped.x - world.cashierX) < newHalfX + 0.76 + 0.12;
  const cashierOverlapZ = Math.abs(clamped.z - world.cashierZ) < newHalfZ + 1.18 + 0.12;
  if (cashierOverlapX && cashierOverlapZ) {
    audio.playWarn();
    pushNotice(
      world,
      'لا يمكن وضع الرف فوق الكاشير! اختر مكاناً فارغاً',
      'Cannot place shelf on top of the cashier! Pick an open spot',
      'warn'
    );
    return false;
  }

  // Check collision against other shelves
  for (const other of world.shelves) {
    if (other.slotIndex === slotIndex) continue;
    const box = getShelfBox(other);
    const ox = Math.abs(clamped.x - box.cx) < newHalfX + box.halfX + 0.14;
    const oz = Math.abs(clamped.z - box.cz) < newHalfZ + box.halfZ + 0.14;
    if (ox && oz) {
      audio.playWarn();
      pushNotice(
        world,
        'لا يمكن وضع الرف فوق رف آخر! اختر مكاناً فارغاً',
        'Cannot overlap another shelf! Pick an open spot inside',
        'warn'
      );
      return false;
    }
  }

  shelf.x = clamped.x;
  shelf.z = clamped.z;
  shelf.rotY = rotY;

  const safePlayer = resolvePlayerPosition(
    world,
    world.playerX,
    world.playerZ,
    world.playerX,
    world.playerZ
  );
  world.playerX = safePlayer.x;
  world.playerZ = safePlayer.z;
  world.version += 1;
  audio.playPickup();
  pushNotice(
    world,
    'تم نقل الرف إلى المكان الجديد بنجاح!',
    'Shelf moved to its new spot!',
    'good'
  );
  saveGumShopWorldNow(world);
  return true;
}

export function actionRotateShelf(
  world: GumShopWorld,
  slotIndex: number,
  audio: GumShopAudio
): boolean {
  const shelf = world.shelves.find((s) => s.slotIndex === slotIndex);
  if (!shelf) return false;
  const nextRotY = (Math.round(shelf.rotY / (Math.PI / 2)) + 1) * (Math.PI / 2);
  const normalizedRot = ((nextRotY % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  return actionMoveShelf(world, slotIndex, shelf.x, shelf.z, normalizedRot, audio);
}

export function actionUnlockHouseDoor(
  world: GumShopWorld,
  audio: GumShopAudio,
  solvedPuzzleId?: number
): void {
  if (
    typeof solvedPuzzleId === 'number' &&
    solvedPuzzleId >= 1 &&
    solvedPuzzleId <= 50 &&
    !world.solvedPuzzleIds.includes(solvedPuzzleId)
  ) {
    world.solvedPuzzleIds = [...world.solvedPuzzleIds, solvedPuzzleId].sort((a, b) => a - b);
  }
  world.houseDoorUnlocked = true;
  world.pendingHousePuzzle = false;
  world.version += 1;
  audio.playBuyUpgrade();
  pushNotice(
    world,
    world.isNight
      ? '🔓 تم فتح باب البيت! ادخل للداخل واذهب للسرير للنوم'
      : '🔓 تم فتح باب البيت! يمكنك الدخول الآن (النوم متاح عند حلول الليل)',
    world.isNight
      ? '🔓 House door unlocked! Walk inside to the bed to sleep'
      : '🔓 House door unlocked! Walk inside anytime (sleeping opens at night)',
    'good'
  );
  saveGumShopWorldNow(world);
}

export function actionRecordSolvedPuzzle(
  world: GumShopWorld,
  puzzleId: number,
  audio: GumShopAudio
): void {
  const isNew =
    puzzleId >= 1 && puzzleId <= 50 && !world.solvedPuzzleIds.includes(puzzleId);
  if (isNew) {
    world.solvedPuzzleIds = [...world.solvedPuzzleIds, puzzleId].sort((a, b) => a - b);
  }
  world.version += 1;
  audio.playBuyUpgrade();
  pushNotice(
    world,
    `🎉 أحسنت! تم حل اللغز #${puzzleId} (${world.solvedPuzzleIds.length}/50 في فهرس الألغاز)`,
    `🎉 Nice! Solved Puzzle #${puzzleId} (${world.solvedPuzzleIds.length}/50 in Puzzle Index)`,
    'good'
  );
  saveGumShopWorldNow(world);
}

export function actionBuyShelf(
  world: GumShopWorld,
  slotIndex: number,
  audio: GumShopAudio
): boolean {
  const slot = SHELF_SLOTS[slotIndex];
  if (!slot) return false;
  if (world.shelves.some((s) => s.slotIndex === slotIndex)) return false;

  if (world.shopLevel < slot.requiredShopLevel) {
    audio.playWarn();
    pushNotice(
      world,
      'كبّر المحل أولاً لفتح هذا الرف!',
      'Expand your shop first to unlock this shelf!',
      'warn'
    );
    return false;
  }

  if (world.money < slot.cost) {
    audio.playWarn();
    pushNotice(
      world,
      `تحتاج ${slot.cost} ريال لشراء ${slot.nameAr}`,
      `Need ${slot.cost} SAR to buy ${slot.nameEn}`,
      'warn'
    );
    return false;
  }

  world.money -= slot.cost;
  world.shelves.push({
    slotIndex: slot.slotIndex,
    style: slot.style,
    x: slot.x,
    z: slot.z,
    rotY: slot.rotY,
    flavor: null,
    stock: 0,
  });
  world.shelves.sort((a, b) => a.slotIndex - b.slotIndex);
  const safePlayer = resolvePlayerPosition(
    world,
    world.playerX,
    world.playerZ,
    world.playerX,
    world.playerZ
  );
  world.playerX = safePlayer.x;
  world.playerZ = safePlayer.z;
  world.version += 1;
  audio.playBuyUpgrade();
  pushNotice(
    world,
    `تم تركيب ${slot.nameAr} داخل محلك!`,
    `${slot.nameEn} installed in your shop!`,
    'good'
  );
  saveGumShopWorldNow(world);
  return true;
}

export function actionBuyUpgrade(
  world: GumShopWorld,
  upgradeId: UpgradeId,
  audio: GumShopAudio
): boolean {
  const spec = SHOP_UPGRADES.find((u) => u.id === upgradeId);
  if (!spec) return false;
  if (world.upgrades.includes(upgradeId)) return false;
  if (world.money < spec.cost) {
    audio.playWarn();
    pushNotice(
      world,
      `تحتاج ${spec.cost} ريال لشراء ${spec.nameAr}`,
      `Need ${spec.cost} SAR for ${spec.nameEn}`,
      'warn'
    );
    return false;
  }

  world.money -= spec.cost;
  world.upgrades.push(upgradeId);
  world.version += 1;
  audio.playBuyUpgrade();
  pushNotice(world, `تم تفعيل: ${spec.nameAr}!`, `Unlocked: ${spec.nameEn}!`, 'good');
  saveGumShopWorldNow(world);
  return true;
}

export function actionBuyStorageRoom(world: GumShopWorld, audio: GumShopAudio): boolean {
  if (world.hasStorageRoom) return false;
  if (world.money < STORAGE_ROOM_COST) {
    audio.playWarn();
    pushNotice(
      world,
      `تحتاج ${STORAGE_ROOM_COST} ريال لبناء المخزن بجانب المحل`,
      `Need ${STORAGE_ROOM_COST} SAR to build the Warehouse next door`,
      'warn'
    );
    return false;
  }

  world.money -= STORAGE_ROOM_COST;
  world.hasStorageRoom = true;
  world.version += 1;
  audio.playBuyUpgrade();
  pushNotice(
    world,
    `🏬 مبروك! تم بناء المخزن على يسار المحل (يتسع حتى ${STORAGE_MAX_PACKS} علبة علك)!`,
    `🏬 Warehouse built on the left side of your shop (holds up to ${STORAGE_MAX_PACKS} packs)!`,
    'good'
  );
  saveGumShopWorldNow(world);
  return true;
}

export function actionDepositCrateToStorage(
  world: GumShopWorld,
  audio: GumShopAudio,
  silent = false
): boolean {
  if (!world.hasStorageRoom || !world.carriedCrate) return false;
  const used = getStorageTotalPacks(world.storageStock);
  const space = STORAGE_MAX_PACKS - used;
  if (space <= 0) {
    if (!silent) {
      audio.playWarn();
      pushNotice(
        world,
        `المخزن ممتلئ (${STORAGE_MAX_PACKS}/${STORAGE_MAX_PACKS} علبة)! اسحب منه أولاً`,
        `Warehouse is full (${STORAGE_MAX_PACKS}/${STORAGE_MAX_PACKS} packs)! Withdraw some first`,
        'warn'
      );
    }
    return false;
  }

  const flavor = world.carriedCrate.flavor;
  const add = Math.min(space, world.carriedCrate.packs);
  world.storageStock[flavor] = (world.storageStock[flavor] ?? 0) + add;
  world.carriedCrate.packs -= add;
  if (world.carriedCrate.packs <= 0) {
    world.carriedCrate = null;
  }
  world.version += 1;
  audio.playStock();
  const spec = GUM_FLAVOR_MAP[flavor];
  pushNotice(
    world,
    `🏬 تم تخزين +${add} علب ${spec.nameAr} داخل المخزن!`,
    `🏬 Stored +${add} ${spec.nameEn} packs inside Warehouse!`,
    'good'
  );
  saveGumShopWorldNow(world);
  return true;
}

export function actionWithdrawFromStorage(
  world: GumShopWorld,
  flavor: GumFlavorId,
  audio: GumShopAudio
): boolean {
  if (!world.hasStorageRoom) return false;
  if (world.carriedCrate) {
    audio.playWarn();
    pushNotice(
      world,
      'بيدك كرتون بالفعل! عبّئ الرفوف أو أودعه بالمخزن أولاً',
      'Hands full! Stock shelves or deposit your current crate first',
      'warn'
    );
    return false;
  }
  const available = world.storageStock[flavor] ?? 0;
  if (available <= 0) return false;

  const take = Math.min(SHELF_MAX_STOCK, available);
  const remaining = available - take;
  if (remaining <= 0) {
    delete world.storageStock[flavor];
  } else {
    world.storageStock[flavor] = remaining;
  }
  world.carriedCrate = { flavor, packs: take };
  world.version += 1;
  audio.playPickup();
  const spec = GUM_FLAVOR_MAP[flavor];
  pushNotice(
    world,
    `📦 سحبت ${take} علب ${spec.nameAr} من المخزن — اقترب من أي رف لتعبئته!`,
    `📦 Withdrew ${take} ${spec.nameEn} packs from Warehouse — walk near a shelf!`,
    'info'
  );
  saveGumShopWorldNow(world);
  return true;
}

export function actionSweepCratesToStorage(
  world: GumShopWorld,
  audio: GumShopAudio
): boolean {
  if (!world.hasStorageRoom || world.cratesOutside.length === 0) return false;
  let used = getStorageTotalPacks(world.storageStock);
  let movedPacks = 0;

  for (let i = world.cratesOutside.length - 1; i >= 0; i--) {
    const space = STORAGE_MAX_PACKS - used;
    if (space <= 0) break;
    const crate = world.cratesOutside[i];
    const add = Math.min(space, crate.packs);
    world.storageStock[crate.flavor] = (world.storageStock[crate.flavor] ?? 0) + add;
    crate.packs -= add;
    used += add;
    movedPacks += add;
    if (crate.packs <= 0) {
      world.cratesOutside.splice(i, 1);
    }
  }

  if (movedPacks === 0) {
    audio.playWarn();
    pushNotice(
      world,
      'المخزن ممتلئ بالكامل!',
      'Warehouse is completely full!',
      'warn'
    );
    return false;
  }

  world.version += 1;
  audio.playStock();
  pushNotice(
    world,
    `🏬 تم نقل ${movedPacks} علبة من الرصيف مباشرة إلى المخزن!`,
    `🏬 Swept ${movedPacks} sidewalk packs straight into the Warehouse!`,
    'good'
  );
  saveGumShopWorldNow(world);
  return true;
}

export function actionAutoStockFromStorage(
  world: GumShopWorld,
  audio: GumShopAudio
): boolean {
  if (!world.hasStorageRoom) return false;
  const maxCap = getShelfCapacity();
  let stockedTotal = 0;

  // Pass 1: Top up shelves that already have a flavor assigned
  for (const shelf of world.shelves) {
    if (!shelf.flavor || shelf.stock >= maxCap) continue;
    const avail = world.storageStock[shelf.flavor] ?? 0;
    if (avail <= 0) continue;
    const add = Math.min(maxCap - shelf.stock, avail);
    shelf.stock += add;
    stockedTotal += add;
    const rem = avail - add;
    if (rem <= 0) delete world.storageStock[shelf.flavor];
    else world.storageStock[shelf.flavor] = rem;
  }

  // Pass 2: Fill completely empty shelves with any available flavor in storage
  for (const shelf of world.shelves) {
    if (shelf.stock > 0) continue;
    const nextFlavor = GUM_FLAVORS.find((f) => (world.storageStock[f.id] ?? 0) > 0);
    if (!nextFlavor) break;
    const avail = world.storageStock[nextFlavor.id] ?? 0;
    const add = Math.min(maxCap, avail);
    shelf.flavor = nextFlavor.id;
    shelf.stock = add;
    stockedTotal += add;
    const rem = avail - add;
    if (rem <= 0) delete world.storageStock[nextFlavor.id];
    else world.storageStock[nextFlavor.id] = rem;
  }

  if (stockedTotal === 0) {
    audio.playWarn();
    pushNotice(
      world,
      'كل الرفوف ممتلئة (6/6) أو المخزن فارغ!',
      'All shelves are already full (6/6) or Warehouse is empty!',
      'warn'
    );
    return false;
  }

  world.version += 1;
  audio.playStock();
  pushNotice(
    world,
    `✨ تمت تعبئة الرفوف تلقائياً من المخزن (+${stockedTotal} علبة)!`,
    `✨ Auto-stocked shelves from Warehouse (+${stockedTotal} packs)!`,
    'good'
  );
  saveGumShopWorldNow(world);
  return true;
}

export function actionBuyAdCampaign(
  world: GumShopWorld,
  adId: AdCampaignId,
  audio: GumShopAudio
): boolean {
  const spec = AD_CAMPAIGN_MAP[adId];
  if (!spec) return false;

  if (world.money < AD_COST) {
    audio.playWarn();
    pushNotice(
      world,
      `تحتاج ${AD_COST} ريال لتشغيل ${spec.titleAr}`,
      `Need ${AD_COST} SAR to launch ${spec.titleEn}`,
      'warn'
    );
    return false;
  }

  world.money -= AD_COST;
  const existing = world.activeAds.find((a) => a.id === adId);
  if (existing) {
    existing.daysLeft = Math.min(30, existing.daysLeft + AD_DURATION_DAYS);
  } else {
    world.activeAds.push({ id: adId, daysLeft: AD_DURATION_DAYS });
  }

  // Trigger an immediate customer wave so the player feels the outdoor ad right away!
  world.spawnTimer = Math.min(world.spawnTimer, 0.8);
  world.version += 1;
  audio.playBuyUpgrade();
  pushNotice(
    world,
    `📢 تم تشغيل "${spec.titleAr}" على الشاشات الضخمة بالخارج لمدة ${AD_DURATION_DAYS} أيام!`,
    `📢 "${spec.titleEn}" is now LIVE on the giant outdoor screens for ${AD_DURATION_DAYS} days!`,
    'good'
  );
  saveGumShopWorldNow(world);
  return true;
}

export function actionPickupCrate(
  world: GumShopWorld,
  crateId: number,
  audio: GumShopAudio
): boolean {
  if (world.carriedCrate) {
    audio.playWarn();
    pushNotice(
      world,
      'بيدك كرتون بالفعل! اقترب من أي رف لتعبئته تلقائياً',
      'Hands full! Walk near any shelf to auto-stock it',
      'warn'
    );
    return false;
  }
  const idx = world.cratesOutside.findIndex((c) => c.id === crateId);
  if (idx === -1) return false;
  const crate = world.cratesOutside[idx];
  world.cratesOutside.splice(idx, 1);
  world.carriedCrate = { flavor: crate.flavor, packs: crate.packs };
  world.version += 1;
  audio.playPickup();
  const spec = GUM_FLAVOR_MAP[crate.flavor];
  pushNotice(
    world,
    `حملت كرتون ${spec.nameAr} (${crate.packs} علب) — اقترب من الرف ويتعبّأ تلقائياً!`,
    `Picked up ${spec.nameEn} (${crate.packs} packs) — walk near a shelf to auto-stock!`,
    'info'
  );
  saveGumShopWorldNow(world);
  return true;
}

export function actionStockShelf(
  world: GumShopWorld,
  slotIndex: number,
  audio: GumShopAudio,
  silentReject = false
): boolean {
  const carried = world.carriedCrate;
  if (!carried) return false;
  const shelf = world.shelves.find((s) => s.slotIndex === slotIndex);
  if (!shelf) return false;

  const maxCap = getShelfCapacity();
  if (shelf.flavor !== null && shelf.stock > 0 && shelf.flavor !== carried.flavor) {
    if (!silentReject) {
      audio.playWarn();
      pushNotice(
        world,
        'هذا الرف يحتوي نوع علك آخر! اقترب من رف فارغ أو من نفس النوع',
        'This shelf holds another flavor! Approach an empty or matching shelf',
        'warn'
      );
    }
    return false;
  }

  const space = maxCap - shelf.stock;
  if (space <= 0) {
    if (!silentReject) {
      audio.playWarn();
      pushNotice(
        world,
        'هذا الرف ممتلئ بالكامل! اقترب من رف آخر أو اشترِ رفوفاً جديدة',
        'Shelf is full! Walk to another shelf or buy new 3D shelves',
        'warn'
      );
    }
    return false;
  }

  const add = Math.min(space, carried.packs);
  shelf.flavor = carried.flavor;
  shelf.stock += add;
  carried.packs -= add;
  if (carried.packs <= 0) {
    world.carriedCrate = null;
  }
  world.version += 1;
  audio.playStock();
  const spec = GUM_FLAVOR_MAP[shelf.flavor];
  pushNotice(
    world,
    `تعبّأ الرف تلقائياً (+${add} علب ${spec.nameAr})!`,
    `Auto-stocked +${add} ${spec.nameEn} packs!`,
    'good'
  );
  saveGumShopWorldNow(world);
  return true;
}

export function actionCheckoutCustomers(
  world: GumShopWorld,
  audio: GumShopAudio,
  manualBonus: boolean
): boolean {
  const waiting = world.customers.filter((c) => c.stage === 'WAITING_PAY');
  if (waiting.length === 0) return false;

  const adBonuses = getActiveAdBonuses(world.activeAds);
  let earnedTotal = 0;
  let packsTotal = 0;
  for (const c of waiting) {
    const baseMult = manualBonus
      ? 1.15
      : world.upgrades.includes('auto_cashier')
      ? 1.1
      : 1.0;
    const bonusMult = baseMult + adBonuses.revenueBonus;
    const paid = Math.max(1, Math.round(c.willPayAmount * bonusMult));
    earnedTotal += paid;
    packsTotal += c.carriedQty;
    c.stage = 'LEAVING';
    c.mood = 'happy';
    c.carriedFlavor = null;
  }

  world.money += earnedTotal;
  world.totalEarned += earnedTotal;
  world.todayRevenue += earnedTotal;
  world.totalPacksSold += packsTotal;
  world.todayPacksSold += packsTotal;
  world.version += 1;
  audio.playCash();
  pushNotice(
    world,
    manualBonus
      ? `+${earnedTotal} ريال (مع إكرامية المحاسبة!)`
      : `+${earnedTotal} ريال من بيع العلك`,
    manualBonus
      ? `+${earnedTotal} SAR (with checkout tip!)`
      : `+${earnedTotal} SAR from gum sale`,
    'good'
  );
  saveGumShopWorldNow(world);
  return true;
}

/**
 * Sleeping on the bed inside the Sleep House ONLY works at Night!
 * - Every 5th day (Day 5, 10, 15, ...), rent is collected before morning starts.
 * - On all other days, the player wakes up refreshed on Day + 1 and the house door locks for a new puzzle.
 */
export function actionSleepInHouse(world: GumShopWorld, audio: GumShopAudio): boolean {
  if (world.status !== 'PLAYING') return false;

  if (!world.isNight) {
    audio.playWarn();
    pushNotice(
      world,
      '☀️ لا يمكنك النوم في النهار! انتظر حتى يحلّ الليل أولاً.',
      "☀️ You can't sleep during the day! Wait until night falls.",
      'warn'
    );
    return false;
  }

  if (!world.houseDoorUnlocked) {
    world.pendingHousePuzzle = true;
    return false;
  }

  world.walkTarget = null;
  world.playerMoving = false;

  const isRentDay = world.day % RENT_INTERVAL_DAYS === 0;
  if (isRentDay) {
    world.isNight = true;
    world.dayTimeLeft = 0;
    world.status = 'RENT_DUE';
    audio.playOrderDrop();
    saveGumShopWorldNow(world);
    return true;
  }

  const bounds = getShopBounds(world.shopLevel);
  world.day += 1;
  advanceActiveAdsOneDay(world);
  world.dayTimeLeft = DAY_DURATION_SEC;
  world.isNight = false;
  world.houseDoorUnlocked = false;
  world.todayRevenue = 0;
  world.todayWholesale = 0;
  world.todayPacksSold = 0;
  world.customers = [];
  world.playerX = bounds.houseDoorX - 1.3;
  world.playerZ = 4.6;
  world.playerRotY = -Math.PI / 2;
  world.sleepFadeTimer = 1.25;
  world.version += 1;
  audio.playBuyUpgrade();

  const left = getDaysUntilRent(world.day);
  pushNotice(
    world,
    left === 0
      ? `☀️ صباح اليوم ${world.day}! اليوم هو يوم دفع الإيجار عند النوم.`
      : `☀️ صباح اليوم ${world.day}! نمت جيداً — الإيجار بعد ${left} ${left === 1 ? 'يوم' : 'أيام'}.`,
    left === 0
      ? `☀️ Morning of Day ${world.day}! Rent is due tonight when you sleep.`
      : `☀️ Morning of Day ${world.day}! Rent due in ${left} day(s).`,
    'good'
  );
  saveGumShopWorldNow(world);
  return true;
}

export function actionPayRentAndNextDay(
  world: GumShopWorld,
  audio: GumShopAudio
): void {
  const cycleRent = computeDailyRent(world.day, world.shelves.length);
  const totalDue = cycleRent + world.unpaidRent;

  if (world.money >= totalDue) {
    world.money -= totalDue;
    world.unpaidRent = 0;
    world.missedRentDays = 0;
    audio.playBuyUpgrade();
    pushNotice(
      world,
      `تم دفع إيجار الـ ${RENT_INTERVAL_DAYS} أيام (${totalDue} ريال) — أهلاً باليوم ${world.day + 1}!`,
      `5-day rent paid (${totalDue} SAR) — Welcome to Day ${world.day + 1}!`,
      'good'
    );
  } else {
    audio.playWarn();
    actionResetShop(world);
    pushNotice(
      world,
      'ما قدرت تدفع الإيجار! تم إغلاق المحل وأعدت من البداية (اليوم 1).',
      'Could not pay rent! Shop closed — restarted from Day 1.',
      'warn'
    );
    return;
  }

  const bounds = getShopBounds(world.shopLevel);
  world.day += 1;
  advanceActiveAdsOneDay(world);
  world.dayTimeLeft = DAY_DURATION_SEC;
  world.isNight = false;
  world.houseDoorUnlocked = false;
  world.todayRevenue = 0;
  world.todayWholesale = 0;
  world.todayPacksSold = 0;
  world.customers = [];
  world.playerX = bounds.houseDoorX - 1.3;
  world.playerZ = 4.6;
  world.playerRotY = -Math.PI / 2;
  world.sleepFadeTimer = 1.25;
  world.status = 'PLAYING';
  world.version += 1;
  saveGumShopWorldNow(world);
}

export function actionEmergencyGrant(world: GumShopWorld, audio: GumShopAudio): boolean {
  const totalStock =
    world.shelves.reduce((sum, s) => sum + s.stock, 0) +
    world.cratesOutside.reduce((sum, c) => sum + c.packs, 0) +
    getStorageTotalPacks(world.storageStock) +
    (world.carriedCrate?.packs ?? 0);
  if (world.money >= MIN_CRATE_COST || totalStock > 0) return false;
  world.money += EMERGENCY_GRANT_AMOUNT;
  audio.playCash();
  pushNotice(
    world,
    `تم منحك ${EMERGENCY_GRANT_AMOUNT} ريال دعم طارئ لشراء كرتون علك والعودة للعمل!`,
    `+${EMERGENCY_GRANT_AMOUNT} SAR emergency restock grant added!`,
    'good'
  );
  saveGumShopWorldNow(world);
  return true;
}

export function findNearPrompt(world: GumShopWorld): GumShopHudSnapshot['nearPrompt'] {
  const bounds = getShopBounds(world.shopLevel);

  // 1) Near Bed inside the unlocked Sleep House
  if (
    world.houseDoorUnlocked &&
    Math.hypot(world.playerX - bounds.bedX, world.playerZ - bounds.bedZ) <= 2.0
  ) {
    return { kind: 'bed' };
  }

  // 2) Near Locked Sleep House front door -> open puzzle to unlock!
  if (
    !world.houseDoorUnlocked &&
    Math.hypot(world.playerX - bounds.houseDoorX, world.playerZ - bounds.houseDoorZ) <= 2.15
  ) {
    return { kind: 'house_door' };
  }

  // 2b) Near Storage Warehouse on the left side of the shop
  if (
    Math.hypot(world.playerX - bounds.storageDoorX, world.playerZ - bounds.storageDoorZ) <= 2.35
  ) {
    return { kind: 'storage_door' };
  }

  // 3) Near waiting customer at checkout counter
  const hasWaiting = world.customers.some((c) => c.stage === 'WAITING_PAY');
  if (
    hasWaiting &&
    Math.hypot(world.playerX - world.cashierX, world.playerZ - world.cashierZ) <= 2.35
  ) {
    return { kind: 'checkout' };
  }

  // 4) Empty hands & near an outdoor delivery crate
  if (!world.carriedCrate) {
    let bestCrate: DeliveryCrateState | null = null;
    let bestDist = 2.0;
    for (const c of world.cratesOutside) {
      const d = Math.hypot(world.playerX - c.x, world.playerZ - c.z);
      if (d < bestDist) {
        bestDist = d;
        bestCrate = c;
      }
    }
    if (bestCrate) {
      return { kind: 'pickup_crate', crateId: bestCrate.id, flavor: bestCrate.flavor };
    }
  }

  return null;
}

export function actionInteractNearest(world: GumShopWorld, audio: GumShopAudio): boolean {
  const prompt = findNearPrompt(world);
  if (!prompt) return false;
  if (prompt.kind === 'house_door') {
    world.pendingHousePuzzle = true;
    return true;
  }
  if (prompt.kind === 'bed') {
    return actionSleepInHouse(world, audio);
  }
  if (prompt.kind === 'storage_door') {
    if (world.hasStorageRoom && world.carriedCrate) {
      return actionDepositCrateToStorage(world, audio);
    }
    world.pendingOpenStorage = true;
    return true;
  }
  if (prompt.kind === 'pickup_crate') {
    return actionPickupCrate(world, prompt.crateId, audio);
  }
  return actionCheckoutCustomers(world, audio, true);
}

interface SolidBox {
  cx: number;
  cz: number;
  halfX: number;
  halfZ: number;
}

const PLAYER_RADIUS = 0.34;
const CUSTOMER_RADIUS = 0.28;

function getShelfBox(shelf: ShelfState): SolidBox {
  const rotated = Math.abs(Math.sin(shelf.rotY)) > 0.5;
  return {
    cx: shelf.x,
    cz: shelf.z,
    halfX: rotated ? 0.36 : 1.01,
    halfZ: rotated ? 1.01 : 0.36,
  };
}

function getSolidObstacles(world: GumShopWorld): SolidBox[] {
  const bounds = getShopBounds(world.shopLevel);
  const boxes: SolidBox[] = [];

  for (const shelf of world.shelves) {
    boxes.push(getShelfBox(shelf));
  }

  // Moveable 3D checkout counter
  boxes.push({
    cx: world.cashierX,
    cz: world.cashierZ,
    halfX: 0.76,
    halfZ: 1.18,
  });

  // Outdoor decorative trees (positioned outside the Warehouse & Right Billboard)
  boxes.push({ cx: -(bounds.halfW + 7.4), cz: 5.2, halfX: 0.45, halfZ: 0.45 });
  boxes.push({ cx: bounds.houseX + 6.4, cz: 5.2, halfX: 0.45, halfZ: 0.45 });

  // Solid steel pillar footings for the Giant Outdoor Billboards / LED Screens
  boxes.push({ cx: -(bounds.halfW + 3.2), cz: 7.6, halfX: 1.55, halfZ: 0.42 });
  boxes.push({ cx: bounds.houseX + 3.6, cz: 7.6, halfX: 1.55, halfZ: 0.42 });

  // Solid 3D Warehouse building on the left side when owned
  if (world.hasStorageRoom) {
    boxes.push({
      cx: bounds.storageX,
      cz: bounds.storageZ,
      halfX: 2.35,
      halfZ: 2.15,
    });
  }

  // Solid bedroom furniture inside the unlocked Sleep House (Bed + Wardrobe)
  if (world.houseDoorUnlocked) {
    boxes.push({
      cx: bounds.bedX,
      cz: bounds.bedZ,
      halfX: 0.78,
      halfZ: 1.05,
    });
    boxes.push({
      cx: bounds.houseX - 1.55,
      cz: bounds.houseZ - 0.8,
      halfX: 0.42,
      halfZ: 0.78,
    });
  }

  return boxes;
}

function pushOutOfBox(
  x: number,
  z: number,
  radius: number,
  box: SolidBox
): { x: number; z: number } {
  const minX = box.cx - box.halfX;
  const maxX = box.cx + box.halfX;
  const minZ = box.cz - box.halfZ;
  const maxZ = box.cz + box.halfZ;

  const clampedX = Math.max(minX, Math.min(maxX, x));
  const clampedZ = Math.max(minZ, Math.min(maxZ, z));
  const dx = x - clampedX;
  const dz = z - clampedZ;
  const distSq = dx * dx + dz * dz;

  if (distSq >= radius * radius) {
    return { x, z };
  }

  if (distSq > 1e-6) {
    const dist = Math.sqrt(distSq);
    const push = radius - dist;
    return {
      x: x + (dx / dist) * push,
      z: z + (dz / dist) * push,
    };
  }

  const penLeft = x - minX;
  const penRight = maxX - x;
  const penTop = z - minZ;
  const penBottom = maxZ - z;
  const minPen = Math.min(penLeft, penRight, penTop, penBottom);
  if (minPen === penLeft) return { x: minX - radius, z };
  if (minPen === penRight) return { x: maxX + radius, z };
  if (minPen === penTop) return { x, z: minZ - radius };
  return { x, z: maxZ + radius };
}

function clampToWallsAndHouse(
  oldX: number,
  oldZ: number,
  nextX: number,
  nextZ: number,
  shopLevel: ShopLevel,
  houseDoorUnlocked: boolean
): { x: number; z: number } {
  const bounds = getShopBounds(shopLevel);
  let x = Math.max(bounds.storageX - 2.6, Math.min(bounds.houseX + 4.8, nextX));
  let z = Math.max(bounds.backZ + 0.7, Math.min(8.3, nextZ));

  // Shop front storefront glass wall at Z = DOOR_Z spans X in [-halfW, +halfW]
  const wallBandMin = DOOR_Z - 0.35;
  const wallBandMax = DOOR_Z + 0.35;
  const insideFrontSpan = Math.abs(x) <= bounds.halfW + 0.35;
  const crossingFrontWall =
    (oldZ <= wallBandMin && z > wallBandMin) ||
    (oldZ >= wallBandMax && z < wallBandMax) ||
    (z > wallBandMin && z < wallBandMax);

  if (insideFrontSpan && crossingFrontWall && Math.abs(x) > DOOR_HALF_WIDTH - 0.25) {
    if (oldZ <= DOOR_Z) {
      z = Math.min(z, wallBandMin);
    } else {
      z = Math.max(z, wallBandMax);
    }
  }

  // Separation between shop interior & left/right outdoor corridors (Warehouse on left, Sleep House on right)
  if (z < DOOR_Z - 0.05) {
    if (oldX >= -(bounds.halfW - 0.2) && oldX <= bounds.halfW - 0.2) {
      x = Math.max(-(bounds.halfW - 0.7), Math.min(bounds.halfW - 0.7, x));
    } else if (oldX > bounds.halfW - 0.2) {
      x = Math.max(bounds.halfW + 0.55, x);
    } else {
      x = Math.min(-(bounds.halfW + 0.55), x);
    }
  }

  // Sleep House walls (solid when locked; enterable through center door when unlocked!)
  const houseMinX = bounds.houseX - 2.45;
  const houseMaxX = bounds.houseX + 2.45;
  const houseBackZ = bounds.houseZ - 2.25;
  const houseFrontZ = bounds.houseFrontZ; // 1.9
  const houseDoorHalf = 0.62;

  if (!houseDoorUnlocked) {
    if (x > houseMinX && x < houseMaxX && z < houseFrontZ + 0.55) {
      if (oldZ >= houseFrontZ + 0.45) {
        z = houseFrontZ + 0.55;
      } else if (oldX <= houseMinX) {
        x = houseMinX;
      } else {
        x = houseMaxX;
      }
    }
  } else {
    const wasInsideHouse = isPointInsideHouse(oldX, oldZ, bounds);
    if (wasInsideHouse) {
      // Clamp against interior left, right, and back walls of the Sleep House
      x = Math.max(bounds.houseX - 1.76, Math.min(bounds.houseX + 1.76, x));
      z = Math.max(houseBackZ + 0.42, z);
      // Front house wall: allow exiting only through open front doorway
      if (z > houseFrontZ - 0.28 && Math.abs(x - bounds.houseX) > houseDoorHalf) {
        z = houseFrontZ - 0.28;
      }
    } else {
      // Outside the unlocked Sleep House: allow entering through open doorway, block exterior walls
      if (x > houseMinX && x < houseMaxX && z < houseFrontZ + 0.35 && z > houseBackZ - 0.35) {
        const inDoorLane = Math.abs(x - bounds.houseX) <= houseDoorHalf && oldZ >= houseFrontZ - 0.1;
        if (!inDoorLane) {
          if (oldZ >= houseFrontZ + 0.25) {
            z = houseFrontZ + 0.35;
          } else if (oldX <= houseMinX) {
            x = houseMinX;
          } else {
            x = houseMaxX;
          }
        }
      }
    }
  }

  return { x, z };
}

function resolvePlayerPosition(
  world: GumShopWorld,
  oldX: number,
  oldZ: number,
  nextX: number,
  nextZ: number
): { x: number; z: number } {
  const obstacles = getSolidObstacles(world);
  let pos = clampToWallsAndHouse(
    oldX,
    oldZ,
    nextX,
    nextZ,
    world.shopLevel,
    world.houseDoorUnlocked
  );

  for (let pass = 0; pass < 2; pass++) {
    for (const box of obstacles) {
      pos = pushOutOfBox(pos.x, pos.z, PLAYER_RADIUS, box);
    }
    pos = clampToWallsAndHouse(
      oldX,
      oldZ,
      pos.x,
      pos.z,
      world.shopLevel,
      world.houseDoorUnlocked
    );
  }

  return pos;
}

function spawnCustomer(world: GumShopWorld, audio: GumShopAudio): void {
  const stockedShelves = world.shelves.filter((s) => s.flavor !== null && s.stock > 0);
  const chosenShelf =
    stockedShelves.length > 0
      ? stockedShelves[Math.floor(Math.random() * stockedShelves.length)]
      : world.shelves[0];

  const bounds = getShopBounds(world.shopLevel);
  const startSide = Math.random() > 0.5 ? 1 : -1;
  const id = world.nextCustomerId++;

  world.customers.push({
    id,
    x: startSide * (bounds.halfW + 1.2),
    z: 6.2 + (Math.random() - 0.5) * 0.9,
    rotY: startSide > 0 ? -Math.PI / 2 : Math.PI / 2,
    shirtColor: CUSTOMER_SHIRTS[id % CUSTOMER_SHIRTS.length],
    hairColor: CUSTOMER_HAIR[id % CUSTOMER_HAIR.length],
    stage: 'ENTERING',
    targetShelfSlot: chosenShelf ? chosenShelf.slotIndex : 0,
    desiredFlavor: chosenShelf?.flavor ?? null,
    carriedFlavor: null,
    carriedQty: 0,
    willPayAmount: 0,
    timer: 0,
    mood: 'neutral',
  });
  world.version += 1;
  audio.playDoorBell();
}

function moveTowards(
  curX: number,
  curZ: number,
  tx: number,
  tz: number,
  speed: number,
  dt: number
): { x: number; z: number; rotY: number; arrived: boolean } {
  const dx = tx - curX;
  const dz = tz - curZ;
  const dist = Math.hypot(dx, dz);
  if (dist <= 0.14) {
    return { x: tx, z: tz, rotY: Math.atan2(dx, dz), arrived: true };
  }
  const step = Math.min(dist, speed * dt);
  return {
    x: curX + (dx / dist) * step,
    z: curZ + (dz / dist) * step,
    rotY: Math.atan2(dx, dz),
    arrived: false,
  };
}

export function stepGumShopWorld(
  world: GumShopWorld,
  rawDt: number,
  input: GumShopInput,
  audio: GumShopAudio
): boolean {
  const dt = Math.min(rawDt, 0.05);
  let dirty = false;

  if (world.sleepFadeTimer > 0) {
    world.sleepFadeTimer = Math.max(0, world.sleepFadeTimer - dt);
    if (world.sleepFadeTimer === 0) dirty = true;
  }

  if (world.noticeTimer > 0) {
    world.noticeTimer -= dt;
    if (world.noticeTimer <= 0) {
      world.notice = null;
      dirty = true;
    }
  }

  if (world.status !== 'PLAYING') {
    return dirty;
  }

  const bounds = getShopBounds(world.shopLevel);

  // 1) Day -> Night countdown
  if (!world.isNight) {
    world.dayTimeLeft -= dt;
    if (world.dayTimeLeft <= 0) {
      world.dayTimeLeft = 0;
      world.isNight = true;
      audio.playDoorBell();
      pushNotice(
        world,
        world.houseDoorUnlocked
          ? '🌙 حلّ الليل! ادخل البيت ونم على السرير ليبدأ اليوم التالي'
          : '🌙 حلّ الليل! اذهب لبيت النوم بجانب المحل وحل لغز الباب للدخول والنوم',
        world.houseDoorUnlocked
          ? '🌙 Night fell! Walk into your house and sleep on the bed for tomorrow'
          : '🌙 Night fell! Head to the Sleep House and solve the door puzzle to enter and sleep',
        'info'
      );
      saveGumShopWorldNow(world);
      dirty = true;
    }
  }

  // 2) Player movement
  const moveSpeed = world.upgrades.includes('sneakers') ? 6.8 : 4.8;
  const manualMag = Math.hypot(input.moveX, input.moveZ);
  if (manualMag > 0.08) {
    world.walkTarget = null;
    const nx = input.moveX / Math.max(1, manualMag);
    const nz = input.moveZ / Math.max(1, manualMag);
    const resolved = resolvePlayerPosition(
      world,
      world.playerX,
      world.playerZ,
      world.playerX + nx * moveSpeed * dt,
      world.playerZ + nz * moveSpeed * dt
    );
    world.playerX = resolved.x;
    world.playerZ = resolved.z;
    world.playerRotY = Math.atan2(nx, nz);
    world.playerMoving = true;
    dirty = true;
  } else if (world.walkTarget) {
    const wt = world.walkTarget;
    const playerInsideShop = world.playerZ < DOOR_Z - 0.1 && Math.abs(world.playerX) <= bounds.halfW;
    const targetInsideShop = wt.z < DOOR_Z - 0.1 && Math.abs(wt.x) <= bounds.halfW;
    const playerInsideHouse = isPointInsideHouse(world.playerX, world.playerZ, bounds);
    const targetInsideHouse = isPointInsideHouse(wt.x, wt.z, bounds);

    let stepTargetX = wt.x;
    let stepTargetZ = wt.z;

    if (playerInsideShop !== targetInsideShop) {
      // Route cleanly through shop front center glass doorway
      if (playerInsideShop) {
        if (Math.abs(world.playerX) > 1.15) {
          stepTargetX = 0;
          stepTargetZ = DOOR_Z - 0.5;
        } else {
          stepTargetX = 0;
          stepTargetZ = DOOR_Z + 1.25;
        }
      } else if (playerInsideHouse) {
        // Exit house doorway first before heading to shop
        stepTargetX = bounds.houseX;
        stepTargetZ = bounds.houseFrontZ + 1.1;
      } else {
        if (Math.abs(world.playerX) > 1.15) {
          stepTargetX = 0;
          stepTargetZ = DOOR_Z + 1.25;
        } else {
          stepTargetX = 0;
          stepTargetZ = DOOR_Z - 0.5;
        }
      }
    } else if (playerInsideHouse !== targetInsideHouse && world.houseDoorUnlocked) {
      // Route cleanly through the unlocked Sleep House front doorway
      if (playerInsideHouse) {
        if (Math.abs(world.playerX - bounds.houseX) > 0.45) {
          stepTargetX = bounds.houseX;
          stepTargetZ = bounds.houseFrontZ - 0.65;
        } else {
          stepTargetX = bounds.houseX;
          stepTargetZ = bounds.houseFrontZ + 1.0;
        }
      } else {
        if (Math.abs(world.playerX - bounds.houseX) > 0.45 || world.playerZ < bounds.houseFrontZ + 0.5) {
          stepTargetX = bounds.houseX;
          stepTargetZ = bounds.houseFrontZ + 1.0;
        } else {
          stepTargetX = bounds.houseX;
          stepTargetZ = bounds.houseFrontZ - 0.65;
        }
      }
    }

    const mv = moveTowards(
      world.playerX,
      world.playerZ,
      stepTargetX,
      stepTargetZ,
      moveSpeed,
      dt
    );
    const prevX = world.playerX;
    const prevZ = world.playerZ;
    const resolved = resolvePlayerPosition(world, prevX, prevZ, mv.x, mv.z);
    world.playerX = resolved.x;
    world.playerZ = resolved.z;
    const movedDist = Math.hypot(world.playerX - prevX, world.playerZ - prevZ);
    if (Math.hypot(stepTargetX - world.playerX, stepTargetZ - world.playerZ) > 0.05) {
      world.playerRotY = mv.rotY;
    }
    world.playerMoving = movedDist > 0.002;
    dirty = true;

    const distFinal = Math.hypot(wt.x - world.playerX, wt.z - world.playerZ);
    const arrivalRadius = wt.action ? 1.55 : 0.35;
    if (distFinal <= arrivalRadius) {
      const pending = wt.action;
      world.walkTarget = null;
      world.playerMoving = false;
      if (pending) {
        if (pending.kind === 'pickup_crate') {
          actionPickupCrate(world, pending.crateId, audio);
        } else if (pending.kind === 'stock_shelf') {
          actionStockShelf(world, pending.slotIndex, audio);
        } else if (pending.kind === 'checkout') {
          actionCheckoutCustomers(world, audio, true);
        } else if (pending.kind === 'open_house_puzzle') {
          world.pendingHousePuzzle = true;
        } else if (pending.kind === 'sleep_bed') {
          actionSleepInHouse(world, audio);
        } else if (pending.kind === 'storage_interact') {
          if (world.hasStorageRoom && world.carriedCrate) {
            actionDepositCrateToStorage(world, audio);
          } else {
            world.pendingOpenStorage = true;
          }
        }
      }
    } else if (movedDist < 0.003 && dt > 0.001) {
      world.walkTarget = null;
      world.playerMoving = false;
    }
  } else {
    world.playerMoving = false;
  }

  // 2b) Auto-pickup outdoor delivery crate on contact
  if (!world.carriedCrate && world.cratesOutside.length > 0) {
    const hitCrate = world.cratesOutside.find(
      (c) => Math.hypot(world.playerX - c.x, world.playerZ - c.z) <= 1.15
    );
    if (hitCrate) {
      actionPickupCrate(world, hitCrate.id, audio);
      dirty = true;
    }
  }

  // 2b-ii) Auto-deposit carried crate when approaching owned Warehouse door
  if (
    world.hasStorageRoom &&
    world.carriedCrate &&
    Math.hypot(world.playerX - bounds.storageDoorX, world.playerZ - bounds.storageDoorZ) <= 1.65
  ) {
    if (actionDepositCrateToStorage(world, audio, true)) {
      dirty = true;
    }
  }

  // 2c) Auto-stock shelf on proximity (uses live shelf.x, shelf.z, max 6 packs/shelf!)
  if (world.carriedCrate) {
    const maxCap = getShelfCapacity();
    let bestShelfSlot = -1;
    let bestDist = world.upgrades.includes('stock_gloves') ? 2.85 : 2.15;
    for (const shelf of world.shelves) {
      if (shelf.stock >= maxCap) continue;
      if (shelf.flavor !== null && shelf.stock > 0 && shelf.flavor !== world.carriedCrate.flavor) {
        continue;
      }
      const dist = Math.hypot(world.playerX - shelf.x, world.playerZ - shelf.z);
      if (dist < bestDist) {
        bestDist = dist;
        bestShelfSlot = shelf.slotIndex;
      }
    }
    if (bestShelfSlot !== -1) {
      actionStockShelf(world, bestShelfSlot, audio, true);
      dirty = true;
    }
  }

  // 2d) Auto-sleep ONLY at Night when inside the unlocked house right beside the bed!
  if (
    world.isNight &&
    world.houseDoorUnlocked &&
    world.sleepFadeTimer <= 0 &&
    isPointInsideHouse(world.playerX, world.playerZ, bounds) &&
    Math.hypot(world.playerX - bounds.bedX, world.playerZ - bounds.bedZ) <= 1.65
  ) {
    actionSleepInHouse(world, audio);
    return true;
  }

  // 3) Spawn neighborhood customers during daytime (boosted by Giant Outdoor Ads!)
  const adBonuses = getActiveAdBonuses(world.activeAds);
  if (!world.isNight) {
    const maxCustomers =
      (world.upgrades.includes('neon_sign') ? 6 : 4) +
      (world.shopLevel - 1) * 2 +
      adBonuses.extraMaxCustomers;
    world.spawnTimer -= dt;
    if (world.spawnTimer <= 0) {
      const hasAnyStock = world.shelves.some((s) => s.stock > 0);
      if (hasAnyStock && world.customers.length < maxCustomers) {
        spawnCustomer(world, audio);
        dirty = true;
      }
      const baseDelay =
        (world.upgrades.includes('neon_sign') ? 3.0 : 4.5) * adBonuses.spawnDelayMult;
      world.spawnTimer = baseDelay + Math.random() * 1.9;
    }
  }

  // 4) Update Customers AI (uses live shelf.x, shelf.z, shelf.rotY + solid collision avoidance)
  const checkoutStand = getCashierStandPoint(world);
  const solidObstacles = getSolidObstacles(world);
  for (let i = world.customers.length - 1; i >= 0; i--) {
    const c = world.customers[i];
    const custSpeed = 2.4;

    if (c.stage === 'ENTERING') {
      const shelf = world.shelves.find((s) => s.slotIndex === c.targetShelfSlot);
      const frontX = shelf ? shelf.x + Math.sin(shelf.rotY) * 1.05 : 0;
      const frontZ = shelf ? Math.min(2.1, shelf.z + Math.cos(shelf.rotY) * 1.05) : -1;
      const targetX = c.z > DOOR_Z + 0.2 ? 0 : frontX;
      const targetZ = c.z > DOOR_Z + 0.2 ? DOOR_Z - 0.4 : frontZ;
      const mv = moveTowards(c.x, c.z, targetX, targetZ, custSpeed, dt);
      let cx = mv.x;
      let cz = mv.z;
      if (cz < DOOR_Z) {
        for (const box of solidObstacles) {
          const pushed = pushOutOfBox(cx, cz, CUSTOMER_RADIUS, box);
          cx = pushed.x;
          cz = pushed.z;
        }
      }
      c.x = cx;
      c.z = cz;
      c.rotY = mv.rotY;
      if ((mv.arrived || Math.hypot(c.x - frontX, c.z - frontZ) <= 0.45) && c.z <= DOOR_Z) {
        c.stage = 'BROWSING';
        c.timer = 1.2 + Math.random() * 0.9;
      }
    } else if (c.stage === 'BROWSING') {
      c.timer -= dt;
      if (c.timer <= 0) {
        const shelf = world.shelves.find(
          (s) => s.slotIndex === c.targetShelfSlot && s.flavor !== null && s.stock > 0
        );
        if (!shelf || !shelf.flavor) {
          c.mood = 'empty';
          c.stage = 'LEAVING';
        } else {
          const spec = GUM_FLAVOR_MAP[shelf.flavor];
          const price = world.prices[shelf.flavor];
          const verdict = getPriceVerdict(shelf.flavor, price);

          if (verdict === 'high' || verdict === 'rip_off') {
            c.mood = 'expensive';
            c.stage = 'LEAVING';
            audio.playWarn();
            pushNotice(
              world,
              `الزبون يقول: "غالي رخصه!" — ما أحد يشتري ${spec.nameAr} بـ ${price} ريال!`,
              `Customer says: "Too expensive, lower it!" — Nobody will buy ${spec.nameEn} for ${price} SAR!`,
              'warn'
            );
            dirty = true;
          } else {
            const buyChance = verdict === 'cheap' ? 1.0 : 0.96;
            if (Math.random() <= buyChance) {
              const baseQty = verdict === 'cheap' ? 3 : 2;
              const wantQty = Math.min(baseQty + adBonuses.extraBuyPacks, shelf.stock);
              const qty = Math.max(1, Math.min(shelf.stock, wantQty));
              shelf.stock -= qty;
              c.carriedFlavor = shelf.flavor;
              c.carriedQty = qty;
              c.willPayAmount = qty * price;
              c.stage = 'TO_CHECKOUT';
              c.mood = 'happy';
              world.version += 1;
              dirty = true;
            } else {
              c.mood = 'neutral';
              c.stage = 'LEAVING';
            }
          }
        }
      }
    } else if (c.stage === 'TO_CHECKOUT') {
      const mv = moveTowards(c.x, c.z, checkoutStand.x, checkoutStand.z, custSpeed, dt);
      c.x = mv.x;
      c.z = mv.z;
      c.rotY = mv.rotY;
      if (mv.arrived) {
        c.stage = 'WAITING_PAY';
        c.timer = world.upgrades.includes('auto_cashier') ? 0.6 : 4.2;
        dirty = true;
      }
    } else if (c.stage === 'WAITING_PAY') {
      const playerNear =
        Math.hypot(world.playerX - world.cashierX, world.playerZ - world.cashierZ) <= 2.15;
      if (playerNear) {
        actionCheckoutCustomers(world, audio, true);
        dirty = true;
        continue;
      }
      c.timer -= dt;
      if (c.timer <= 0) {
        actionCheckoutCustomers(world, audio, false);
        dirty = true;
      }
    } else if (c.stage === 'LEAVING') {
      const exitEdge = bounds.halfW + 2.2;
      const exitX = c.z < DOOR_Z ? 0 : c.x >= 0 ? exitEdge : -exitEdge;
      const exitZ = c.z < DOOR_Z ? DOOR_Z + 1.5 : 6.6;
      const mv = moveTowards(c.x, c.z, exitX, exitZ, custSpeed * 1.1, dt);
      c.x = mv.x;
      c.z = mv.z;
      c.rotY = mv.rotY;
      if (Math.abs(c.x) >= bounds.halfW + 1.5 && c.z >= DOOR_Z + 1.0) {
        world.customers.splice(i, 1);
        world.version += 1;
        dirty = true;
      }
    }
  }

  // 5) Periodic auto-save every 4 seconds
  world.autoSaveTimer += dt;
  if (world.autoSaveTimer >= 4.0) {
    world.autoSaveTimer = 0;
    saveGumShopWorldNow(world);
    dirty = true;
  }

  return dirty;
}

export function extractGumShopHud(world: GumShopWorld): GumShopHudSnapshot {
  const dailyRent = computeDailyRent(world.day, world.shelves.length);
  const daysUntilRent = getDaysUntilRent(world.day);
  const bounds = getShopBounds(world.shopLevel);
  return {
    status: world.status,
    money: world.money,
    day: world.day,
    dayTimeLeft: Math.ceil(world.dayTimeLeft),
    isNight: world.isNight,
    houseDoorUnlocked: world.houseDoorUnlocked,
    solvedPuzzleIds: [...world.solvedPuzzleIds],
    isInsideHouse: isPointInsideHouse(world.playerX, world.playerZ, bounds),
    hasStorageRoom: world.hasStorageRoom,
    storageStock: { ...world.storageStock },
    storageTotalPacks: getStorageTotalPacks(world.storageStock),
    activeAds: world.activeAds.map((a) => ({ ...a })),
    daysUntilRent,
    isRentDay: daysUntilRent === 0,
    shopLevel: world.shopLevel,
    cashierX: world.cashierX,
    cashierZ: world.cashierZ,
    sleepFadeActive: world.sleepFadeTimer > 0,
    dailyRent,
    unpaidRent: world.unpaidRent,
    totalRentDue: dailyRent + world.unpaidRent,
    totalEarned: world.totalEarned,
    totalPacksSold: world.totalPacksSold,
    todayRevenue: world.todayRevenue,
    todayWholesale: world.todayWholesale,
    todayPacksSold: world.todayPacksSold,
    shelves: world.shelves.map((s) => ({ ...s })),
    prices: { ...world.prices },
    cratesOutsideCount: world.cratesOutside.length,
    carriedCrate: world.carriedCrate ? { ...world.carriedCrate } : null,
    upgrades: [...world.upgrades],
    waitingCustomerCount: world.customers.filter((c) => c.stage === 'WAITING_PAY').length,
    nearPrompt: findNearPrompt(world),
    lastSavedAt: world.lastSavedAt,
    notice: world.notice ? { ...world.notice } : null,
    isOutside: world.playerZ > DOOR_Z,
  };
}
