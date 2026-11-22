import {
  CUSTOMER_SLOT_X,
  CustomerOrder,
  defaultUpgrades,
  DRINK_META,
  DrinkId,
  HAPPY_REACTIONS_AR,
  HAPPY_REACTIONS_EN,
  MAX_SHAWARMA_LIVES,
  MAX_SHAWARMA_PARTICLES,
  MAX_STOCK,
  readShawarmaShopSave,
  readShawarmaStats,
  saveShawarmaShopSave,
  saveShawarmaStats,
  ShawarmaHudSnapshot,
  ShawarmaParticle,
  ShawarmaStatus,
  ShawarmaUpgrades,
  SHIFT_DURATION_SEC,
  SHOP_PRICES,
  TOPPING_META,
  ToppingId,
  WorkbenchState,
} from './types';
import { ShawarmaAudio } from './audio';

export type ShopUpgradeId =
  | 'slicer_upgrade'
  | 'fries_upgrade'
  | 'doubleSpit'
  | 'turboGrill'
  | 'vipDecor'
  | 'unlockPomegranate'
  | 'unlockCheese'
  | 'unlockSuntop'
  | 'unlockAyran';

export interface ShawarmaWorld {
  status: ShawarmaStatus;
  lang: 'ar' | 'en';
  day: number;
  timeLeft: number;
  cash: number;
  dayEarned: number;
  dayGoal: number;
  servedToday: number;
  totalServed: number;
  bestCash: number;
  bestDay: number;
  streak: number;
  lives: number;

  // Prep stocks & real timed slicing/chopping!
  meatStock: number;
  friesStock: number;
  meatSliceTimer: number;
  meatSliceDuration: number;
  friesChopTimer: number;
  friesChopDuration: number;
  autoFriesCooldown: number;

  workbench: WorkbenchState;
  customers: (CustomerOrder | null)[];
  upgrades: ShawarmaUpgrades;

  // 3D Animation triggers
  spitAngle: number;
  serveAnimTimer: number;
  serveTargetX: number;
  serveHasDrink: DrinkId | null;
  feedbackToast: { text: string; positive: boolean } | null;
  toastTimer: number;

  customerSpawnCooldown: number;
  nextCustomerId: number;
  particles: ShawarmaParticle[];
}

const NAMES_AR = ['أبو فهد', 'سارة', 'خالد', 'نورة', 'تركي', 'ريم', 'فهد', 'لينا', 'سعود'];
const NAMES_EN = ['Fahad', 'Sara', 'Khalid', 'Noura', 'Turki', 'Reem', 'Saud', 'Lina', 'Omar'];
const SHIRTS = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#db2777', '#0891b2'];
const HEADWEARS: ('ghutra' | 'cap' | 'hair')[] = ['ghutra', 'cap', 'hair'];

function goalForDay(day: number): number {
  return 85 + (day - 1) * 45;
}

function emptyWorkbench(): WorkbenchState {
  return {
    hasBread: false,
    hasMeat: false,
    toppings: [],
    drink: null,
    wrapped: false,
  };
}

function persistCareer(world: ShawarmaWorld): void {
  saveShawarmaShopSave({
    cash: world.cash,
    day: world.day,
    totalServed: world.totalServed,
    upgrades: { ...world.upgrades },
  });
  if (world.cash > world.bestCash || world.day > world.bestDay) {
    world.bestCash = Math.max(world.bestCash, world.cash);
    world.bestDay = Math.max(world.bestDay, world.day);
    saveShawarmaStats({ bestCash: world.bestCash, bestDay: world.bestDay });
  }
}

export function createInitialShawarmaWorld(lang: 'ar' | 'en'): ShawarmaWorld {
  const stats = readShawarmaStats();
  const saved = readShawarmaShopSave();
  const particles: ShawarmaParticle[] = Array.from(
    { length: MAX_SHAWARMA_PARTICLES },
    () => ({
      active: false,
      kind: 'steam',
      x: 0,
      y: -10,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      life: 0,
      maxLife: 0.6,
      size: 0.1,
    })
  );

  const day = saved ? saved.day : 1;
  return {
    status: 'START',
    lang,
    day,
    timeLeft: SHIFT_DURATION_SEC,
    cash: saved ? saved.cash : 0,
    dayEarned: 0,
    dayGoal: goalForDay(day),
    servedToday: 0,
    totalServed: saved ? saved.totalServed : 0,
    bestCash: stats.bestCash,
    bestDay: stats.bestDay,
    streak: 0,
    lives: MAX_SHAWARMA_LIVES,

    meatStock: 2,
    friesStock: 2,
    meatSliceTimer: 0,
    meatSliceDuration: 1.5,
    friesChopTimer: 0,
    friesChopDuration: 1.8,
    autoFriesCooldown: 0,

    workbench: emptyWorkbench(),
    customers: [null, null, null],
    upgrades: saved ? saved.upgrades : defaultUpgrades(),

    spitAngle: 0,
    serveAnimTimer: 0,
    serveTargetX: 0,
    serveHasDrink: null,
    feedbackToast: null,
    toastTimer: 0,

    customerSpawnCooldown: 0.6,
    nextCustomerId: 1,
    particles,
  };
}

export function startShiftDay(world: ShawarmaWorld, dayNum: number): void {
  world.status = 'PLAYING';
  world.day = dayNum;
  world.timeLeft = SHIFT_DURATION_SEC;
  world.dayEarned = 0;
  world.dayGoal = goalForDay(dayNum);
  world.servedToday = 0;
  world.streak = 0;
  world.lives = MAX_SHAWARMA_LIVES;
  world.meatStock = 2;
  world.friesStock = 2;
  world.meatSliceTimer = 0;
  world.friesChopTimer = 0;
  world.workbench = emptyWorkbench();
  world.customers = [null, null, null];
  world.customerSpawnCooldown = 0.5;
  world.feedbackToast = null;
  world.toastTimer = 0;

  persistCareer(world);
  spawnCustomerInSlot(world, 1);
}

export function restartDayShift(world: ShawarmaWorld): void {
  // Keep player's cash & bought shop upgrades, retry current day cleanly!
  startShiftDay(world, world.day);
}

export function extractShawarmaHud(world: ShawarmaWorld): ShawarmaHudSnapshot {
  const meatSliceProgress =
    world.meatSliceTimer > 0
      ? Math.min(1, 1 - world.meatSliceTimer / Math.max(0.05, world.meatSliceDuration))
      : 0;
  const friesChopProgress =
    world.friesChopTimer > 0
      ? Math.min(1, 1 - world.friesChopTimer / Math.max(0.05, world.friesChopDuration))
      : 0;

  return {
    status: world.status,
    day: world.day,
    timeLeft: Math.ceil(world.timeLeft),
    cash: world.cash,
    dayEarned: world.dayEarned,
    dayGoal: world.dayGoal,
    servedToday: world.servedToday,
    totalServed: world.totalServed,
    bestCash: world.bestCash,
    bestDay: world.bestDay,
    streak: world.streak,
    lives: world.lives,
    meatStock: world.meatStock,
    maxStock: MAX_STOCK,
    friesStock: world.friesStock,
    meatSliceProgress,
    friesChopProgress,
    workbench: {
      ...world.workbench,
      toppings: [...world.workbench.toppings],
    },
    customers: world.customers.map((c) => (c ? { ...c, toppings: [...c.toppings] } : null)),
    upgrades: { ...world.upgrades },
    feedbackToast: world.feedbackToast ? { ...world.feedbackToast } : null,
  };
}

function spawnParticles(
  world: ShawarmaWorld,
  x: number,
  y: number,
  z: number,
  kind: 'steam' | 'coin' | 'sizzle',
  count: number
): void {
  let n = 0;
  for (let i = 0; i < world.particles.length && n < count; i++) {
    const p = world.particles[i];
    if (!p.active) {
      p.active = true;
      p.kind = kind;
      p.x = x + (Math.random() - 0.5) * 0.5;
      p.y = y + Math.random() * 0.2;
      p.z = z + (Math.random() - 0.5) * 0.4;
      p.vx = (Math.random() - 0.5) * (kind === 'steam' ? 0.6 : 2.2);
      p.vy = kind === 'steam' ? 1.1 + Math.random() * 0.9 : 2.0 + Math.random() * 2.2;
      p.vz = (Math.random() - 0.5) * 0.8;
      p.maxLife = kind === 'steam' ? 0.75 : 0.6;
      p.life = p.maxLife;
      p.size = kind === 'coin' ? 0.14 : 0.11;
      n++;
    }
  }
}

function getAvailableToppings(upgrades: ShawarmaUpgrades): ToppingId[] {
  const list: ToppingId[] = ['garlic', 'pickles', 'fries', 'spicy'];
  if (upgrades.unlockPomegranate) list.push('pomegranate');
  if (upgrades.unlockCheese) list.push('cheese');
  return list;
}

function spawnCustomerInSlot(world: ShawarmaWorld, slot: 0 | 1 | 2): void {
  const pool = getAvailableToppings(world.upgrades);
  const toppingCount =
    world.day === 1
      ? 1 + Math.floor(Math.random() * 2)
      : Math.min(3, 1 + Math.floor(Math.random() * 3));

  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const toppings = shuffled.slice(0, toppingCount);

  // Pick optional drink if Sun Top or Ayran unlocked in the shop!
  const drinks: DrinkId[] = [];
  if (world.upgrades.unlockSuntop) drinks.push('suntop');
  if (world.upgrades.unlockAyran) drinks.push('ayran');
  let drink: DrinkId | null = null;
  if (drinks.length > 0 && Math.random() < 0.62) {
    drink = drinks[Math.floor(Math.random() * drinks.length)];
  }

  const basePatience = Math.max(21, 35 - (world.day - 1) * 1.6);
  const maxPatience = world.upgrades.vipDecor ? basePatience * 1.3 : basePatience;

  const idx = Math.floor(Math.random() * NAMES_AR.length);
  world.customers[slot] = {
    id: world.nextCustomerId++,
    slot,
    nameAr: NAMES_AR[idx],
    nameEn: NAMES_EN[idx],
    toppings,
    drink,
    patience: maxPatience,
    maxPatience,
    shirtColor: SHIRTS[Math.floor(Math.random() * SHIRTS.length)],
    headwear: HEADWEARS[Math.floor(Math.random() * HEADWEARS.length)],
    entered: 0,
    leaving: false,
    happy: false,
  };
}

export function actionSliceSpit(world: ShawarmaWorld, audio: ShawarmaAudio): void {
  if (world.status !== 'PLAYING') return;
  if (world.meatSliceTimer > 0) return;
  if (world.meatStock >= MAX_STOCK) {
    world.feedbackToast = {
      text: world.lang === 'ar' ? 'صينية الشاورما ممتلئة!' : 'Shawarma tray is full!',
      positive: true,
    };
    world.toastTimer = 1.2;
    return;
  }
  const lv = world.upgrades.slicerLevel;
  const duration = lv === 3 ? 0.35 : lv === 2 ? 0.85 : 1.5;
  world.meatSliceDuration = duration;
  world.meatSliceTimer = duration;
  audio.playSliceMeat(lv === 3);
  spawnParticles(world, -2.1, 1.85, 0.35, 'sizzle', 7);
}

export function actionChopPotatoes(world: ShawarmaWorld, audio: ShawarmaAudio): void {
  if (world.status !== 'PLAYING') return;
  if (world.friesChopTimer > 0) return;
  if (world.friesStock >= MAX_STOCK) {
    world.feedbackToast = {
      text: world.lang === 'ar' ? 'سلة البطاطس ممتلئة!' : 'Fries basket is full!',
      positive: true,
    };
    world.toastTimer = 1.2;
    return;
  }
  const lv = world.upgrades.friesLevel;
  const duration = lv === 3 ? 0.55 : lv === 2 ? 0.9 : 1.8;
  world.friesChopDuration = duration;
  world.friesChopTimer = duration;
  audio.playChopPotato();
  spawnParticles(world, 1.85, 1.35, 0.85, 'steam', 5);
}

export function actionPlaceBread(world: ShawarmaWorld, audio: ShawarmaAudio): void {
  if (world.status !== 'PLAYING') return;
  if (world.workbench.wrapped || world.workbench.hasBread) return;
  world.workbench.hasBread = true;
  audio.playPlaceBread();
}

export function actionAddMeatToWrap(world: ShawarmaWorld, audio: ShawarmaAudio): void {
  if (world.status !== 'PLAYING') return;
  if (world.workbench.wrapped) return;
  if (world.workbench.hasMeat) return;

  if (world.meatStock <= 0) {
    // Automatically start slicing spit and notify player!
    actionSliceSpit(world, audio);
    world.feedbackToast = {
      text:
        world.lang === 'ar'
          ? 'جاري تقطيع الشاورما من السيخ...'
          : 'Slicing fresh shawarma off the spit...',
      positive: true,
    };
    world.toastTimer = 1.3;
    return;
  }

  if (!world.workbench.hasBread) world.workbench.hasBread = true;
  world.meatStock -= 1;
  world.workbench.hasMeat = true;
  audio.playAddTopping();
  spawnParticles(world, 0, 1.25, 0.9, 'steam', 4);
}

export function actionToggleTopping(
  world: ShawarmaWorld,
  topping: ToppingId,
  audio: ShawarmaAudio
): void {
  if (world.status !== 'PLAYING') return;
  if (world.workbench.wrapped) return;
  if (world.workbench.toppings.includes(topping)) return;

  // Fries require chopped potato stock!
  if (topping === 'fries' && world.friesStock <= 0) {
    actionChopPotatoes(world, audio);
    world.feedbackToast = {
      text:
        world.lang === 'ar'
          ? 'لا توجد بطاطس مقطّعة! جاري تقطيع البطاطس...'
          : 'Out of fries! Chopping fresh potatoes...',
      positive: false,
    };
    world.toastTimer = 1.5;
    return;
  }

  if (!world.workbench.hasBread) world.workbench.hasBread = true;
  if (!world.workbench.hasMeat) {
    if (world.meatStock > 0) {
      world.meatStock -= 1;
      world.workbench.hasMeat = true;
    } else {
      actionSliceSpit(world, audio);
      world.feedbackToast = {
        text:
          world.lang === 'ar'
            ? 'قصّ لحم الشاورما من السيخ أولاً!'
            : 'Slice shawarma meat first!',
        positive: false,
      };
      world.toastTimer = 1.4;
      return;
    }
  }

  if (topping === 'fries') {
    world.friesStock -= 1;
  }
  world.workbench.toppings.push(topping);
  audio.playAddTopping();
  spawnParticles(world, 0, 1.28, 0.9, 'steam', 3);
}

export function actionSelectDrink(
  world: ShawarmaWorld,
  drink: DrinkId,
  audio: ShawarmaAudio
): void {
  if (world.status !== 'PLAYING') return;
  world.workbench.drink = world.workbench.drink === drink ? null : drink;
  if (world.workbench.drink) {
    audio.playPourDrink();
  }
}

export function actionClearWorkbench(world: ShawarmaWorld): void {
  if (world.status !== 'PLAYING') return;
  world.workbench = emptyWorkbench();
}

function ordersMatchExact(cust: CustomerOrder, wb: WorkbenchState): boolean {
  if (cust.toppings.length !== wb.toppings.length) return false;
  if (!cust.toppings.every((t) => wb.toppings.includes(t))) return false;
  if (cust.drink !== wb.drink) return false;
  return true;
}

export function actionWrapAndServe(
  world: ShawarmaWorld,
  audio: ShawarmaAudio,
  preferredSlot?: 0 | 1 | 2
): void {
  if (world.status !== 'PLAYING') return;
  const wb = world.workbench;
  if (!wb.hasBread || !wb.hasMeat) {
    world.feedbackToast = {
      text:
        world.lang === 'ar'
          ? 'ضع خبز الصاج ولحم الشاورما أولاً!'
          : 'Place flatbread and shawarma meat first!',
      positive: false,
    };
    world.toastTimer = 1.5;
    audio.playWrongOrLeave();
    return;
  }

  let target: CustomerOrder | null = null;
  if (preferredSlot !== undefined) {
    const c = world.customers[preferredSlot];
    if (c && !c.leaving) target = c;
  }
  if (!target) {
    for (let i = 0; i < 3; i++) {
      const c = world.customers[i];
      if (c && !c.leaving && ordersMatchExact(c, wb)) {
        target = c;
        break;
      }
    }
  }
  if (!target) {
    let lowest = Infinity;
    for (let i = 0; i < 3; i++) {
      const c = world.customers[i];
      if (c && !c.leaving && c.patience < lowest) {
        lowest = c.patience;
        target = c;
      }
    }
  }

  if (!target) {
    world.feedbackToast = {
      text: world.lang === 'ar' ? 'لا يوجد زبون حالياً!' : 'No customer waiting!',
      positive: false,
    };
    world.toastTimer = 1.4;
    return;
  }

  const exact = ordersMatchExact(target, wb);
  const toppingValue = target.toppings.reduce(
    (sum, tp) => sum + TOPPING_META[tp].extraPrice,
    0
  );
  const drinkValue = target.drink ? DRINK_META[target.drink].price : 0;
  const slicerBonus = world.upgrades.slicerLevel === 3 ? 3 : 0;
  const spitBonus = world.upgrades.doubleSpit ? 5 : 0;
  const basePrice = 16 + toppingValue + drinkValue + slicerBonus + spitBonus;
  const patienceRatio = target.patience / Math.max(1, target.maxPatience);

  audio.playGrillWrap();
  world.serveAnimTimer = 0.55;
  world.serveTargetX = CUSTOMER_SLOT_X[target.slot];
  world.serveHasDrink = wb.drink;
  spawnParticles(world, 2.05, 1.35, 0.65, 'steam', 8);

  if (exact) {
    world.streak += 1;
    const speedTip = Math.round(patienceRatio * (world.upgrades.turboGrill ? 10 : 6));
    const vipTip = world.upgrades.vipDecor ? 5 : 0;
    const streakBonus = world.streak >= 3 ? Math.round(basePrice * 0.3) : 0;
    const totalPay = basePrice + speedTip + vipTip + streakBonus;

    world.cash += totalPay;
    world.dayEarned += totalPay;
    world.servedToday += 1;
    world.totalServed += 1;
    target.leaving = true;
    target.happy = true;

    const reactions =
      world.lang === 'ar' ? HAPPY_REACTIONS_AR : HAPPY_REACTIONS_EN;
    const msg = reactions[Math.floor(Math.random() * reactions.length)];
    world.feedbackToast = {
      text:
        world.lang === 'ar'
          ? `+${totalPay} ريال — ${msg}`
          : `+${totalPay} SAR — ${msg}`,
      positive: true,
    };
    world.toastTimer = 2.1;

    audio.playCashRegister();
    spawnParticles(world, CUSTOMER_SLOT_X[target.slot], 2.1, -1.2, 'coin', 11);
    persistCareer(world);
  } else {
    world.streak = 0;
    const partial = Math.max(6, Math.round(basePrice * 0.38));
    world.cash += partial;
    world.dayEarned += partial;
    world.servedToday += 1;
    target.leaving = true;
    target.happy = false;
    world.feedbackToast = {
      text:
        world.lang === 'ar'
          ? `الطلب غير مطابق (+${partial} ريال فقط)`
          : `Order mismatch (+${partial} SAR only)`,
      positive: false,
    };
    world.toastTimer = 2.0;
    audio.playWrongOrLeave();
    persistCareer(world);
  }

  world.workbench = emptyWorkbench();
}

export function actionPurchaseShopItem(
  world: ShawarmaWorld,
  item: ShopUpgradeId,
  audio: ShawarmaAudio
): boolean {
  const u = world.upgrades;
  if (item === 'slicer_upgrade') {
    if (u.slicerLevel === 1 && world.cash >= SHOP_PRICES.slicerLv2) {
      world.cash -= SHOP_PRICES.slicerLv2;
      u.slicerLevel = 2;
    } else if (u.slicerLevel === 2 && world.cash >= SHOP_PRICES.slicerLv3) {
      world.cash -= SHOP_PRICES.slicerLv3;
      u.slicerLevel = 3;
    } else {
      return false;
    }
  } else if (item === 'fries_upgrade') {
    if (u.friesLevel === 1 && world.cash >= SHOP_PRICES.friesLv2) {
      world.cash -= SHOP_PRICES.friesLv2;
      u.friesLevel = 2;
    } else if (u.friesLevel === 2 && world.cash >= SHOP_PRICES.friesLv3) {
      world.cash -= SHOP_PRICES.friesLv3;
      u.friesLevel = 3;
    } else {
      return false;
    }
  } else {
    if (u[item]) return false;
    const price = SHOP_PRICES[item];
    if (world.cash < price) return false;
    world.cash -= price;
    u[item] = true;
  }

  audio.playCashRegister();
  persistCareer(world);
  return true;
}

export function stepShawarmaWorld(
  world: ShawarmaWorld,
  rawDt: number,
  audio: ShawarmaAudio
): boolean {
  const dt = Math.min(rawDt, 0.05);
  let hudDirty = false;

  // Spin shawarma spit faster while actively carving
  const slicing = world.meatSliceTimer > 0;
  world.spitAngle += dt * (slicing ? 5.6 : 1.15);

  if (world.serveAnimTimer > 0) {
    world.serveAnimTimer = Math.max(0, world.serveAnimTimer - dt);
  }

  // Ambient heat steam off rotating spit
  if (Math.random() < dt * 3.2) {
    spawnParticles(world, -2.15, 2.25, 0.35, 'steam', 1);
  }

  for (let i = 0; i < world.particles.length; i++) {
    const p = world.particles[i];
    if (!p.active) continue;
    p.life -= dt;
    if (p.life <= 0) {
      p.active = false;
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.z += p.vz * dt;
    if (p.kind === 'coin') p.vy -= 5.2 * dt;
  }

  if (world.status !== 'PLAYING') {
    return false;
  }

  // Timed Meat Slicing progress
  if (world.meatSliceTimer > 0) {
    world.meatSliceTimer = Math.max(0, world.meatSliceTimer - dt);
    if (Math.random() < dt * 10) {
      spawnParticles(world, -2.05, 1.75, 0.45, 'sizzle', 1);
    }
    if (world.meatSliceTimer <= 0) {
      const yieldQty =
        world.upgrades.slicerLevel === 3
          ? 4
          : world.upgrades.slicerLevel === 2
          ? 3
          : 2;
      world.meatStock = Math.min(MAX_STOCK, world.meatStock + yieldQty);
      audio.playAddTopping();
    }
    hudDirty = true;
  }

  // Timed Potato Chopping progress
  if (world.friesChopTimer > 0) {
    world.friesChopTimer = Math.max(0, world.friesChopTimer - dt);
    if (world.friesChopTimer <= 0) {
      const yieldQty =
        world.upgrades.friesLevel === 3
          ? 4
          : world.upgrades.friesLevel === 2
          ? 3
          : 2;
      world.friesStock = Math.min(MAX_STOCK, world.friesStock + yieldQty);
      audio.playAddTopping();
      spawnParticles(world, 1.85, 1.35, 0.85, 'steam', 6);
    }
    hudDirty = true;
  } else if (world.upgrades.friesLevel === 3 && world.friesStock < 3) {
    // Auto Potato Chef Lv3 refills potatoes automatically!
    world.autoFriesCooldown -= dt;
    if (world.autoFriesCooldown <= 0) {
      world.autoFriesCooldown = 1.4;
      actionChopPotatoes(world, audio);
      hudDirty = true;
    }
  }

  if (world.toastTimer > 0) {
    world.toastTimer -= dt;
    if (world.toastTimer <= 0) {
      world.toastTimer = 0;
      world.feedbackToast = null;
      hudDirty = true;
    }
  }

  // Shift countdown
  world.timeLeft = Math.max(0, world.timeLeft - dt);
  if (world.timeLeft <= 0) {
    audio.stopMusic();
    if (world.dayEarned >= world.dayGoal) {
      world.status = 'DAY_END';
      persistCareer(world);
      audio.playDayComplete();
    } else {
      world.status = 'GAME_OVER';
      persistCareer(world);
      audio.playWrongOrLeave();
    }
    return true;
  }

  // Spawn customers in empty window slots
  world.customerSpawnCooldown -= dt;
  if (world.customerSpawnCooldown <= 0) {
    const emptySlots: (0 | 1 | 2)[] = [];
    for (let i = 0; i < 3; i++) {
      if (!world.customers[i]) emptySlots.push(i as 0 | 1 | 2);
    }
    if (emptySlots.length > 0) {
      const slot = emptySlots[Math.floor(Math.random() * emptySlots.length)];
      spawnCustomerInSlot(world, slot);
      const baseGap = Math.max(2.8, 5.4 - (world.day - 1) * 0.4);
      world.customerSpawnCooldown = baseGap + Math.random() * 1.4;
      hudDirty = true;
    } else {
      world.customerSpawnCooldown = 1.2;
    }
  }

  // Update customers patience & entrance/exit
  for (let i = 0; i < 3; i++) {
    const c = world.customers[i];
    if (!c) continue;
    if (c.leaving) {
      c.entered -= dt * 2.6;
      if (c.entered <= 0) {
        world.customers[i] = null;
        hudDirty = true;
      }
    } else {
      if (c.entered < 1) {
        c.entered = Math.min(1, c.entered + dt * 2.8);
      }
      c.patience -= dt;
      if (c.patience <= 0) {
        c.leaving = true;
        c.happy = false;
        world.streak = 0;
        world.lives = Math.max(0, world.lives - 1);
        world.feedbackToast = {
          text:
            world.lang === 'ar'
              ? `غادر ${c.nameAr} بسبب التأخير! (-1 قلب)`
              : `${c.nameEn} left waiting! (-1 Heart)`,
          positive: false,
        };
        world.toastTimer = 2.0;
        audio.playWrongOrLeave();
        if (world.lives <= 0) {
          world.status = 'GAME_OVER';
          audio.stopMusic();
          persistCareer(world);
        }
        hudDirty = true;
      }
    }
  }

  return hudDirty || true;
}
