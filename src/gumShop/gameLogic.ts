import { GumShopAudio } from './audio';
import {
  clearGumShopSave,
  computeDailyRent,
  createDefaultPrices,
  DAY_DURATION_SEC,
  EMERGENCY_GRANT_AMOUNT,
  getPriceVerdict,
  GUM_FLAVOR_MAP,
  GUM_FLAVORS,
  MIN_CRATE_COST,
  PACKS_PER_BOX,
  readGumShopSave,
  SHELF_MAX_STOCK,
  SHELF_SLOTS,
  SHOP_UPGRADES,
  writeGumShopSave,
  type CarriedCrateState,
  type CustomerEntity,
  type DeliveryCrateState,
  type FloatingNotice,
  type GumFlavorId,
  type GumShopHudSnapshot,
  type GumShopSaveData,
  type GumShopStatus,
  type ShelfState,
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
    | { kind: 'checkout' };
}

export interface GumShopWorld {
  lang: 'ar' | 'en';
  status: GumShopStatus;
  hasExistingSave: boolean;
  money: number;
  day: number;
  dayTimeLeft: number;
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
  version: number; // bumped whenever shelves, crates, or customers list changes
}

export const CHECKOUT_POS = { x: 3.35, z: 1.35 };
export const DOOR_Z = 3.0;
export const DOOR_HALF_WIDTH = 1.65;

const CUSTOMER_SHIRTS = ['#38bdf8', '#fb7185', '#a78bfa', '#34d399', '#fbbf24', '#f97316'];
const CUSTOMER_HAIR = ['#1e293b', '#451a03', '#78350f', '#0f172a', '#57534e'];

function getShelfCapacity(upgrades: UpgradeId[]): number {
  return upgrades.includes('stock_gloves') ? 24 : SHELF_MAX_STOCK;
}

function createFreshWorldData(): GumShopSaveData {
  return {
    version: 4,
    money: 150,
    day: 1,
    dayTimeLeft: DAY_DURATION_SEC,
    unpaidRent: 0,
    missedRentDays: 0,
    totalEarned: 0,
    totalPacksSold: 0,
    todayRevenue: 0,
    todayWholesale: 0,
    todayPacksSold: 0,
    shelves: [
      { slotIndex: 0, style: 'wood', flavor: 'mint', stock: 6 },
      { slotIndex: 1, style: 'wood', flavor: 'strawberry', stock: 4 },
    ],
    prices: createDefaultPrices(),
    cratesOutside: [
      // Give the player 1 starter crate right outside the door so they immediately experience going outside to pick it up!
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
    dayTimeLeft: data.dayTimeLeft > 0 ? data.dayTimeLeft : DAY_DURATION_SEC,
    unpaidRent: data.unpaidRent,
    missedRentDays: data.missedRentDays,
    totalEarned: data.totalEarned,
    totalPacksSold: data.totalPacksSold,
    todayRevenue: data.todayRevenue,
    todayWholesale: data.todayWholesale,
    todayPacksSold: data.todayPacksSold,
    shelves: data.shelves.map((s) => ({ ...s })),
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
    version: 4,
    money: Math.max(0, Math.round(world.money)),
    day: world.day,
    dayTimeLeft: Math.max(0, Math.min(DAY_DURATION_SEC, world.dayTimeLeft)),
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
  world.noticeTimer = 2.8;
}

export function actionStartOrResume(world: GumShopWorld): void {
  world.status = world.dayTimeLeft <= 0 ? 'RENT_DUE' : 'PLAYING';
  saveGumShopWorldNow(world);
}

export function actionResetShop(world: GumShopWorld): void {
  clearGumShopSave();
  const fresh = createFreshWorldData();
  world.money = fresh.money;
  world.day = fresh.day;
  world.dayTimeLeft = fresh.dayTimeLeft;
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
  // Neat grid on the sunlit outdoor sidewalk left of the shop door
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
  world.cratesOutside.push({
    id: world.nextCrateId++,
    flavor,
    packs: PACKS_PER_BOX,
    x: spot.x,
    z: spot.z,
  });
  world.version += 1;
  audio.playOrderDrop();
  pushNotice(
    world,
    `وصل كرتون ${spec.nameAr} خارج باب المحل! اخرج لأخذه`,
    `${spec.nameEn} crate arrived outside! Go pick it up`,
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

export function actionBuyShelf(
  world: GumShopWorld,
  slotIndex: number,
  audio: GumShopAudio
): boolean {
  const slot = SHELF_SLOTS[slotIndex];
  if (!slot) return false;
  if (world.shelves.some((s) => s.slotIndex === slotIndex)) return false;
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
    flavor: null,
    stock: 0,
  });
  world.shelves.sort((a, b) => a.slotIndex - b.slotIndex);
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

export function actionPickupCrate(
  world: GumShopWorld,
  crateId: number,
  audio: GumShopAudio
): boolean {
  if (world.carriedCrate) {
    audio.playWarn();
    pushNotice(
      world,
      'بيدك كرتون بالفعل! فرّغه في أحد الرفوف أولاً',
      'Hands full! Stock your current crate on a shelf first',
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
    `حملت كرتون ${spec.nameAr} (${crate.packs} علب) — ادخل وعبّئ الرف`,
    `Picked up ${spec.nameEn} (${crate.packs} packs) — stock a shelf inside`,
    'info'
  );
  saveGumShopWorldNow(world);
  return true;
}

export function actionStockShelf(
  world: GumShopWorld,
  slotIndex: number,
  audio: GumShopAudio
): boolean {
  const carried = world.carriedCrate;
  if (!carried) return false;
  const shelf = world.shelves.find((s) => s.slotIndex === slotIndex);
  if (!shelf) return false;

  const maxCap = getShelfCapacity(world.upgrades);
  if (shelf.flavor !== null && shelf.stock > 0 && shelf.flavor !== carried.flavor) {
    audio.playWarn();
    pushNotice(
      world,
      'هذا الرف يحتوي نوع علك آخر! اختر رفاً فارغاً أو من نفس النوع',
      'This shelf holds another flavor! Pick an empty or matching shelf',
      'warn'
    );
    return false;
  }

  const space = maxCap - shelf.stock;
  if (space <= 0) {
    audio.playWarn();
    pushNotice(
      world,
      'هذا الرف ممتلئ بالكامل! اختر رفاً آخر أو اشترِ رفوفاً جديدة',
      'Shelf is full! Use another shelf or buy new 3D shelves',
      'warn'
    );
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
    `تمت تعبئة +${add} علب من ${spec.nameAr} على الرف!`,
    `Stocked +${add} ${spec.nameEn} packs on shelf!`,
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

  let earnedTotal = 0;
  let packsTotal = 0;
  for (const c of waiting) {
    const bonusMult = manualBonus
      ? 1.15
      : world.upgrades.includes('auto_cashier')
      ? 1.1
      : 1.0;
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

export function actionPayRentAndNextDay(
  world: GumShopWorld,
  audio: GumShopAudio
): void {
  const dailyRent = computeDailyRent(world.day, world.shelves.length);
  const totalDue = dailyRent + world.unpaidRent;

  if (world.money >= totalDue) {
    world.money -= totalDue;
    world.unpaidRent = 0;
    world.missedRentDays = 0;
    audio.playBuyUpgrade();
    pushNotice(
      world,
      `تم دفع الإيجار (${totalDue} ريال) — أهلاً بك في اليوم ${world.day + 1}!`,
      `Rent paid (${totalDue} SAR) — Welcome to Day ${world.day + 1}!`,
      'good'
    );
  } else {
    // Player cannot afford rent -> evicted & restart shop from Day 1!
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

  world.day += 1;
  world.dayTimeLeft = DAY_DURATION_SEC;
  world.todayRevenue = 0;
  world.todayWholesale = 0;
  world.todayPacksSold = 0;
  world.customers = [];
  world.status = 'PLAYING';
  world.version += 1;
  saveGumShopWorldNow(world);
}

export function actionEmergencyGrant(world: GumShopWorld, audio: GumShopAudio): boolean {
  const totalStock =
    world.shelves.reduce((sum, s) => sum + s.stock, 0) +
    world.cratesOutside.reduce((sum, c) => sum + c.packs, 0) +
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
  // 1) Near waiting customer at checkout counter
  const hasWaiting = world.customers.some((c) => c.stage === 'WAITING_PAY');
  if (
    hasWaiting &&
    Math.hypot(world.playerX - CHECKOUT_POS.x, world.playerZ - CHECKOUT_POS.z) <= 2.35
  ) {
    return { kind: 'checkout' };
  }

  // 2) Carrying a crate & near a shelf
  if (world.carriedCrate) {
    let bestSlot = -1;
    let bestDist = 2.15;
    for (const shelf of world.shelves) {
      const slot = SHELF_SLOTS[shelf.slotIndex];
      if (!slot) continue;
      const d = Math.hypot(world.playerX - slot.x, world.playerZ - slot.z);
      if (d < bestDist) {
        bestDist = d;
        bestSlot = shelf.slotIndex;
      }
    }
    if (bestSlot !== -1) {
      return { kind: 'stock_shelf', slotIndex: bestSlot };
    }
  }

  // 3) Empty hands & near an outdoor delivery crate
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
  if (prompt.kind === 'pickup_crate') {
    return actionPickupCrate(world, prompt.crateId, audio);
  }
  if (prompt.kind === 'stock_shelf') {
    return actionStockShelf(world, prompt.slotIndex, audio);
  }
  return actionCheckoutCustomers(world, audio, true);
}

/**
 * Clamp movement against shop walls while keeping the front double glass door wide open.
 */
function resolvePlayerPosition(
  oldX: number,
  oldZ: number,
  nextX: number,
  nextZ: number
): { x: number; z: number } {
  let x = Math.max(-6.2, Math.min(6.2, nextX));
  let z = Math.max(-5.1, Math.min(8.2, nextZ));

  // Front storefront glass wall at Z = 3.0 with open doorway X in [-1.65, 1.65]
  const wallBandMin = DOOR_Z - 0.35;
  const wallBandMax = DOOR_Z + 0.35;
  const crossingWall =
    (oldZ <= wallBandMin && z > wallBandMin) ||
    (oldZ >= wallBandMax && z < wallBandMax) ||
    (z > wallBandMin && z < wallBandMax);

  if (crossingWall && Math.abs(x) > DOOR_HALF_WIDTH - 0.25) {
    // Keep player on their current side of the glass window wall
    if (oldZ <= DOOR_Z) {
      z = Math.min(z, wallBandMin);
    } else {
      z = Math.max(z, wallBandMax);
    }
  }

  // Interior side wall clamping when inside shop
  if (z < DOOR_Z) {
    x = Math.max(-5.45, Math.min(5.45, x));
  }

  return { x, z };
}

function spawnCustomer(world: GumShopWorld, audio: GumShopAudio): void {
  const stockedShelves = world.shelves.filter((s) => s.flavor !== null && s.stock > 0);
  const chosenShelf =
    stockedShelves.length > 0
      ? stockedShelves[Math.floor(Math.random() * stockedShelves.length)]
      : world.shelves[0];

  const startSide = Math.random() > 0.5 ? 1 : -1;
  const id = world.nextCustomerId++;

  world.customers.push({
    id,
    x: startSide * 6.8,
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

  // 1) Day timer & rent due check
  world.dayTimeLeft -= dt;
  if (world.dayTimeLeft <= 0) {
    world.dayTimeLeft = 0;
    world.status = 'RENT_DUE';
    saveGumShopWorldNow(world);
    return true;
  }

  // 2) Player movement (keyboard/joystick cancels click-to-walk target)
  const moveSpeed = world.upgrades.includes('sneakers') ? 6.6 : 4.7;
  const manualMag = Math.hypot(input.moveX, input.moveZ);
  if (manualMag > 0.08) {
    world.walkTarget = null;
    const nx = input.moveX / Math.max(1, manualMag);
    const nz = input.moveZ / Math.max(1, manualMag);
    const resolved = resolvePlayerPosition(
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
    // If crossing between indoors and outdoors, route automatically through the center glass doorway!
    const needDoor =
      (world.playerZ < DOOR_Z - 0.15 && wt.z > DOOR_Z + 0.15) ||
      (world.playerZ > DOOR_Z + 0.15 && wt.z < DOOR_Z - 0.15);
    const stepTargetX = needDoor && Math.abs(world.playerX) > 1.1 ? 0 : wt.x;
    const stepTargetZ = needDoor && Math.abs(world.playerX) > 1.1 ? DOOR_Z : wt.z;

    const mv = moveTowards(
      world.playerX,
      world.playerZ,
      stepTargetX,
      stepTargetZ,
      moveSpeed,
      dt
    );
    const resolved = resolvePlayerPosition(world.playerX, world.playerZ, mv.x, mv.z);
    world.playerX = resolved.x;
    world.playerZ = resolved.z;
    if (Math.hypot(stepTargetX - world.playerX, stepTargetZ - world.playerZ) > 0.05) {
      world.playerRotY = mv.rotY;
    }
    world.playerMoving = true;
    dirty = true;

    const distFinal = Math.hypot(wt.x - world.playerX, wt.z - world.playerZ);
    const arrivalRadius = wt.action ? 1.45 : 0.25;
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
        }
      }
    }
  } else {
    world.playerMoving = false;
  }

  // Smooth auto-pickup when walking right onto an outdoor crate with empty hands
  if (!world.carriedCrate && world.cratesOutside.length > 0) {
    const hitCrate = world.cratesOutside.find(
      (c) => Math.hypot(world.playerX - c.x, world.playerZ - c.z) <= 1.05
    );
    if (hitCrate) {
      actionPickupCrate(world, hitCrate.id, audio);
      dirty = true;
    }
  }

  // 3) Spawn neighborhood customers
  const maxCustomers = world.upgrades.includes('neon_sign') ? 6 : 4;
  world.spawnTimer -= dt;
  if (world.spawnTimer <= 0) {
    const hasAnyStock = world.shelves.some((s) => s.stock > 0);
    if (hasAnyStock && world.customers.length < maxCustomers) {
      spawnCustomer(world, audio);
      dirty = true;
    }
    const baseDelay = world.upgrades.includes('neon_sign') ? 3.2 : 4.8;
    world.spawnTimer = baseDelay + Math.random() * 2.2;
  }

  // 4) Update Customers AI
  for (let i = world.customers.length - 1; i >= 0; i--) {
    const c = world.customers[i];
    const custSpeed = 2.35;

    if (c.stage === 'ENTERING') {
      // Walk to doorway first, then into shelf
      const targetX = c.z > DOOR_Z + 0.2 ? 0 : (SHELF_SLOTS[c.targetShelfSlot]?.x ?? 0);
      const targetZ =
        c.z > DOOR_Z + 0.2
          ? DOOR_Z - 0.4
          : Math.min(2.0, (SHELF_SLOTS[c.targetShelfSlot]?.z ?? -2) + 1.15);
      const mv = moveTowards(c.x, c.z, targetX, targetZ, custSpeed, dt);
      c.x = mv.x;
      c.z = mv.z;
      c.rotY = mv.rotY;
      if (mv.arrived && c.z <= DOOR_Z) {
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

          // Strict pricing rule:
          // cheap / fair -> customers buy happily
          // high (غالي قليلاً) / rip_off (غالي جداً) -> 0% buy chance! Customer says "غالي رخصه!" and leaves.
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
              const wantQty =
                verdict === 'cheap' ? Math.min(3, shelf.stock) : Math.min(2, shelf.stock);
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
      const mv = moveTowards(c.x, c.z, CHECKOUT_POS.x - 1.1, CHECKOUT_POS.z, custSpeed, dt);
      c.x = mv.x;
      c.z = mv.z;
      c.rotY = mv.rotY;
      if (mv.arrived) {
        c.stage = 'WAITING_PAY';
        c.timer = world.upgrades.includes('auto_cashier') ? 0.6 : 4.2;
        dirty = true;
      }
    } else if (c.stage === 'WAITING_PAY') {
      // Auto-checkout immediately if player is right beside counter
      const playerNear =
        Math.hypot(world.playerX - CHECKOUT_POS.x, world.playerZ - CHECKOUT_POS.z) <= 2.1;
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
      const exitX = c.z < DOOR_Z ? 0 : c.x >= 0 ? 7.8 : -7.8;
      const exitZ = c.z < DOOR_Z ? DOOR_Z + 1.5 : 6.6;
      const mv = moveTowards(c.x, c.z, exitX, exitZ, custSpeed * 1.1, dt);
      c.x = mv.x;
      c.z = mv.z;
      c.rotY = mv.rotY;
      if (Math.abs(c.x) >= 7.2 && c.z >= DOOR_Z + 1.0) {
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
  return {
    status: world.status,
    money: world.money,
    day: world.day,
    dayTimeLeft: Math.ceil(world.dayTimeLeft),
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
