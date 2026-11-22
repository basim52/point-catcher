import React, { useState } from 'react';
import {
  DRINK_META,
  DrinkId,
  MAX_SHAWARMA_LIVES,
  ShawarmaHudSnapshot,
  SHOP_PRICES,
  TOPPING_META,
  ToppingId,
} from './types';
import { ShopUpgradeId } from './gameLogic';

interface ShawarmaUIProps {
  lang: 'ar' | 'en';
  hud: ShawarmaHudSnapshot;
  soundEnabled: boolean;
  onStart: () => void;
  onNextDay: () => void;
  onPause: () => void;
  onResume: () => void;
  onRestart: () => void;
  onToggleSound: () => void;
  onSliceSpit: () => void;
  onChopPotatoes: () => void;
  onPlaceBread: () => void;
  onAddMeat: () => void;
  onToggleTopping: (t: ToppingId) => void;
  onSelectDrink: (d: DrinkId) => void;
  onClearBoard: () => void;
  onServe: (slot?: 0 | 1 | 2) => void;
  onBuyShopItem: (item: ShopUpgradeId) => void;
  onExit: () => void;
}

const COPY = {
  ar: {
    title: 'ملك الشاورما 3D',
    kicker: 'محاكي بيع الشاورما ثلاثي الأبعاد',
    subtitle:
      'قصّ الشاورما من السيخ، قطّع البطاطس الطازجة، حضّر الطلبات، واشترِ من متجر المحل تطويرات تسرّع التقطيع وإضافات شهية مثل سن توب ودبس الرمان وجبنة الشيدر!',
    start: (day: number) => (day > 1 ? `واصل اليوم ${day}` : 'افتح المحل وابدأ!'),
    openShop: 'متجر المحل',
    howToPlay: 'كيف ألعب',
    exit: 'خروج',
    exitToHub: 'خروج إلى الصالة',
    soundOn: 'الصوت: تشغيل',
    soundOff: 'الصوت: مكتوم',
    day: (d: number) => `اليوم ${d}`,
    currency: 'ريال',
    wallet: 'الرصيد',
    time: 'الوقت',
    pause: 'إيقاف',
    sliceSpitBtn: 'قصّ السيخ',
    slicingNow: 'جاري القصّ...',
    chopPotatoBtn: 'قطّع بطاطس',
    choppingNow: 'جاري التقطيع...',
    autoChefTag: 'آلي',
    electricTag: 'كهربائي',
    breadBtn: 'خبز صاج',
    meatBtn: 'لحم شاورما',
    serveBtn: 'لفّ وتقديم',
    clearBtn: 'إعادة',
    serveCustomerHint: 'اضغط للتقديم',
    readyLabel: 'على الطاولة:',
    emptyBoard: 'قصّ اللحم وقطّع البطاطس ثم حضّر الساندويتش',
    pausedTitle: 'المحل متوقف مؤقتاً',
    resume: 'استئناف العمل',
    restart: 'إعادة اليوم',
    dayCompleteTitle: (d: number) => `انتهى اليوم ${d} بنجاح!`,
    dayCompleteSub: 'حققت هدف المبيعات — اشترِ تطويرات وإضافات من المتجر لليوم التالي!',
    nextDayBtn: (d: number) => `ابدأ اليوم ${d}`,
    shopTitle: 'متجر محل الشاورما',
    shopClose: 'إغلاق المتجر',
    tabEquip: 'المعدات والسرعة',
    tabMenu: 'إضافات ومشروبات',
    owned: 'مُفعّل',
    maxed: 'أقصى مستوى',
    gameOverTitle: 'أغلق المحل لليوم!',
    gameOverSub: 'يمكنك تطوير أدواتك في المتجر بفلوسك الحالية ثم إعادة اليوم.',
    earnedTotal: 'رصيد المحل',
    bestCash: 'أعلى رصيد',
    servedCount: 'شاورما مباعة',
    playAgain: 'أعد محاولة اليوم',
    howTitle: 'طريقة اللعب في ملك الشاورما 3D',
    howClose: 'إغلاق',
    howStart: 'فهمت — افتح المحل!',
    rules: [
      '1) قصّ لحم الشاورما من السيخ (زر «قصّ السيخ») وقطّع البطاطس (زر «قطّع بطاطس») لتعبئة المخزون قبل التحضير.',
      '2) ضع خبز الصاج، أضف لحم الشاورما، ثم الإضافات المطلوبة للزبون (ثومية، مخلل، بطاطس، شطة... وإضافات المتجر!).',
      '3) إذا طلب الزبون مشروباً (سن توب أو لبن عيران)، اضغط على المشروب لإضافته بجانب الشاورما قبل التقديم.',
      '4) اضغط «لفّ وتقديم» أو اضغط مباشرة على بطاقة الزبون لتسليم الطلب وقبض الريالات!',
      '5) افتح «متجر المحل» لشراء سكين أسرع أو ماكينة تقطيع كهربائية، وشيف بطاطس آلي، وإضافات جديدة (دبس رمان، جبنة شيدر، سن توب، لبن عيران) ترفع أرباحك!',
    ],
  },
  en: {
    title: 'Shawarma King 3D',
    kicker: '3D Street-Food Shawarma Shop',
    subtitle:
      'Slice rotating shawarma meat, chop fresh potatoes into fries, serve exact orders, and visit the Shop for faster slicers, auto potato chef, Sun Top, Pomegranate Molasses & Cheddar!',
    start: (day: number) => (day > 1 ? `Continue Day ${day}` : 'Open Shop!'),
    openShop: 'Shop & Upgrades',
    howToPlay: 'How to Play',
    exit: 'Exit',
    exitToHub: 'Exit to Hub',
    soundOn: 'Sound: On',
    soundOff: 'Sound: Muted',
    day: (d: number) => `Day ${d}`,
    currency: 'SAR',
    wallet: 'Cash',
    time: 'Time',
    pause: 'Pause',
    sliceSpitBtn: 'Slice Spit',
    slicingNow: 'Slicing...',
    chopPotatoBtn: 'Chop Fries',
    choppingNow: 'Chopping...',
    autoChefTag: 'AUTO',
    electricTag: 'ELEC',
    breadBtn: 'Flatbread',
    meatBtn: 'Meat',
    serveBtn: 'Wrap & Serve',
    clearBtn: 'Clear',
    serveCustomerHint: 'Tap to Serve',
    readyLabel: 'On Board:',
    emptyBoard: 'Slice meat & chop fries, then build the wrap',
    pausedTitle: 'Shop Paused',
    resume: 'Resume Shift',
    restart: 'Retry Day',
    dayCompleteTitle: (d: number) => `Day ${d} Complete!`,
    dayCompleteSub: 'Target beaten — spend your SAR in the shop before tomorrow!',
    nextDayBtn: (d: number) => `Start Day ${d}`,
    shopTitle: 'Shawarma Shop Store',
    shopClose: 'Close Shop',
    tabEquip: 'Equipment & Speed',
    tabMenu: 'Menu Add-Ons & Drinks',
    owned: 'Owned',
    maxed: 'MAXED',
    gameOverTitle: 'Shift Over!',
    gameOverSub: 'Upgrade your tools in the shop with your saved SAR and retry!',
    earnedTotal: 'Shop Cash',
    bestCash: 'Best Cash',
    servedCount: 'Wraps Served',
    playAgain: 'Retry Day',
    howTitle: 'How to Play Shawarma King 3D',
    howClose: 'Close',
    howStart: 'Got It — Open Shop!',
    rules: [
      '1) Tap "Slice Spit" to carve shawarma stock and "Chop Fries" to chop fresh potatoes before adding fries.',
      '2) Assemble Flatbread + Meat + requested toppings (Garlic, Pickles, Fries, Spicy, plus Shop unlocks!).',
      '3) If a customer asks for a drink (Sun Top or Cold Ayran), tap it before serving.',
      '4) Tap "Wrap & Serve" (or tap the customer ticket) to serve and collect SAR!',
      '5) Spend SAR in the Shop for an Electric Shawarma Slicer, Auto Potato Chef, Pomegranate Molasses, Cheddar, Sun Top & Ayran!',
    ],
  },
} as const;

const HeartSvg: React.FC<{ filled: boolean }> = ({ filled }) => (
  <svg
    viewBox="0 0 24 24"
    className="w-4 h-4 sm:w-5 sm:h-5"
    fill={filled ? '#fb7185' : 'rgba(255,255,255,0.14)'}
    stroke={filled ? '#ffe4e6' : 'rgba(255,228,230,0.35)'}
    strokeWidth="1.8"
    aria-hidden="true"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const SoundSvg: React.FC<{ enabled: boolean }> = ({ enabled }) => (
  <svg
    viewBox="0 0 24 24"
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.1"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    {enabled ? (
      <>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      </>
    ) : (
      <>
        <line x1="23" y1="9" x2="17" y2="15" />
        <line x1="17" y1="9" x2="23" y2="15" />
      </>
    )}
  </svg>
);

interface ShopPanelProps {
  lang: 'ar' | 'en';
  hud: ShawarmaHudSnapshot;
  onBuyShopItem: (item: ShopUpgradeId) => void;
}

const ShopItemsGrid: React.FC<ShopPanelProps> = ({
  lang,
  hud,
  onBuyShopItem,
}) => {
  const [tab, setTab] = useState<'equip' | 'menu'>('equip');
  const isAr = lang === 'ar';
  const t = COPY[lang];
  const u = hud.upgrades;

  const slicerPrice =
    u.slicerLevel === 1
      ? SHOP_PRICES.slicerLv2
      : u.slicerLevel === 2
      ? SHOP_PRICES.slicerLv3
      : 0;
  const friesPrice =
    u.friesLevel === 1
      ? SHOP_PRICES.friesLv2
      : u.friesLevel === 2
      ? SHOP_PRICES.friesLv3
      : 0;

  const equipmentItems: {
    id: ShopUpgradeId;
    title: string;
    desc: string;
    badge: string;
    price: number;
    maxed: boolean;
    accent: string;
  }[] = [
    {
      id: 'slicer_upgrade',
      title:
        u.slicerLevel === 1
          ? isAr
            ? 'سكين شاورما فولاذي حاد'
            : 'Sharp Steel Knife'
          : isAr
          ? 'ماكينة تقطيع شاورما كهربائية'
          : 'Electric Rotary Slicer',
      desc:
        u.slicerLevel === 1
          ? isAr
            ? 'تقطيع أسرع (0.85 ثانية) ويعطيك 3 حصص لحم'
            : 'Faster 0.85s slicing, yields 3 portions'
          : u.slicerLevel === 2
          ? isAr
            ? 'تقطيع فائق (0.35 ثانية) + 4 حصص + 3 ريال إضافية لكل شاورما'
            : 'Ultra-fast 0.35s slicing, 4 portions & +3 SAR bonus'
          : isAr
          ? 'أسرع ماكينة كهربائية مُفعّلة (+3 ريال لكل شاورما)'
          : 'Electric Slicer active (+3 SAR per wrap)',
      badge: `Lv ${u.slicerLevel}/3`,
      price: slicerPrice,
      maxed: u.slicerLevel >= 3,
      accent: '#fb923c',
    },
    {
      id: 'fries_upgrade',
      title:
        u.friesLevel === 1
          ? isAr
            ? 'قطّاعة بطاطس سريعة'
            : 'Fast Potato Cutter'
          : isAr
          ? 'شيف بطاطس آلي'
          : 'Auto Potato Chef',
      desc:
        u.friesLevel === 1
          ? isAr
            ? 'تقطيع بطاطس بنصف الوقت (0.9 ثانية) ويعطيك 3 حصص'
            : 'Half-time 0.9s chopping, yields 3 portions'
          : u.friesLevel === 2
          ? isAr
            ? 'يقطّع البطاطس تلقائياً كلما نقصت السلة ويعطيك 4 حصص!'
            : 'Auto-chops potatoes whenever basket runs low!'
          : isAr
          ? 'الشيف الآلي يقطّع البطاطس تلقائياً لك طوال اليوم'
          : 'Auto-refills fresh fries continuously',
      badge: `Lv ${u.friesLevel}/3`,
      price: friesPrice,
      maxed: u.friesLevel >= 3,
      accent: '#facc15',
    },
    {
      id: 'doubleSpit',
      title: isAr ? 'سيخ شاورما دبل' : 'Double Meat Spit',
      desc: isAr
        ? '+5 ريال إضافية على سعر كل ساندويتش شاورما'
        : '+5 SAR extra value on every wrap',
      badge: u.doubleSpit ? t.owned : '+5',
      price: SHOP_PRICES.doubleSpit,
      maxed: u.doubleSpit,
      accent: '#ea580c',
    },
    {
      id: 'turboGrill',
      title: isAr ? 'شواية جريل تيربو' : 'Turbo Contact Grill',
      desc: isAr
        ? 'تحمير أسرع وبقشيش سرعة مضاعف حتى +10 ريال'
        : 'Bigger speed tips up to +10 SAR',
      badge: u.turboGrill ? t.owned : 'TURBO',
      price: SHOP_PRICES.turboGrill,
      maxed: u.turboGrill,
      accent: '#ef4444',
    },
    {
      id: 'vipDecor',
      title: isAr ? 'ديكور المحل الفاخر' : 'VIP Shop Decor',
      desc: isAr
        ? 'إضاءة دافئة +30% صبر للزبائن وبقشيش ثابت +5 ريال'
        : '+30% customer patience & +5 SAR flat tip',
      badge: u.vipDecor ? t.owned : 'VIP',
      price: SHOP_PRICES.vipDecor,
      maxed: u.vipDecor,
      accent: '#fde047',
    },
  ];

  const menuItems: {
    id: ShopUpgradeId;
    title: string;
    desc: string;
    tag: string;
    price: number;
    owned: boolean;
    dotColor: string;
  }[] = [
    {
      id: 'unlockPomegranate',
      title: isAr ? 'دبس رمان أصلي' : 'Pomegranate Molasses',
      desc: isAr
        ? 'إضافة فاخرة على الشاورما تزيد سعر الطلب +6 ريال'
        : 'Rich ruby glaze topping (+6 SAR per order)',
      tag: isAr ? 'إضافة +6 ريال' : '+6 SAR Topping',
      price: SHOP_PRICES.unlockPomegranate,
      owned: u.unlockPomegranate,
      dotColor: '#9f1239',
    },
    {
      id: 'unlockCheese',
      title: isAr ? 'جبنة شيدر سايحة' : 'Melted Cheddar Cheese',
      desc: isAr
        ? 'صوص جبنة شيدر ذهبي يرفع سعر الشاورما +7 ريال'
        : 'Golden melted cheddar topping (+7 SAR per order)',
      tag: isAr ? 'إضافة +7 ريال' : '+7 SAR Topping',
      price: SHOP_PRICES.unlockCheese,
      owned: u.unlockCheese,
      dotColor: '#f59e0b',
    },
    {
      id: 'unlockSuntop',
      title: isAr ? 'عصير سن توب' : 'Sun Top Orange Juice',
      desc: isAr
        ? 'المشروب الأشهر مع الشاورما! يربحك +12 ريال إضافية لكل طلب'
        : 'Classic orange juice carton (+12 SAR with order!)',
      tag: isAr ? 'مشروب +12 ريال' : '+12 SAR Drink',
      price: SHOP_PRICES.unlockSuntop,
      owned: u.unlockSuntop,
      dotColor: '#fb923c',
    },
    {
      id: 'unlockAyran',
      title: isAr ? 'لبن عيران بارد' : 'Cold Ayran Drink',
      desc: isAr
        ? 'لبن عيران منعش بالنعناع يربحك +14 ريال إضافية لكل طلب'
        : 'Chilled mint ayran cup (+14 SAR with order!)',
      tag: isAr ? 'مشروب +14 ريال' : '+14 SAR Drink',
      price: SHOP_PRICES.unlockAyran,
      owned: u.unlockAyran,
      dotColor: '#38bdf8',
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* 2 Clean Shop Category Tabs */}
      <div className="grid grid-cols-2 gap-1.5 bg-white/6 p-1 rounded-xl border border-white/10">
        <button
          type="button"
          onClick={() => setTab('equip')}
          className={`h-9 rounded-lg text-xs sm:text-sm font-black transition-colors cursor-pointer ${
            tab === 'equip'
              ? 'bg-amber-400 text-[#261105]'
              : 'text-amber-100/80 hover:text-amber-50'
          }`}
        >
          {t.tabEquip}
        </button>
        <button
          type="button"
          onClick={() => setTab('menu')}
          className={`h-9 rounded-lg text-xs sm:text-sm font-black transition-colors cursor-pointer ${
            tab === 'menu'
              ? 'bg-amber-400 text-[#261105]'
              : 'text-amber-100/80 hover:text-amber-50'
          }`}
        >
          {t.tabMenu}
        </button>
      </div>

      {/* Items List */}
      <div className="space-y-2 max-h-[44vh] overflow-y-auto pe-0.5">
        {tab === 'equip'
          ? equipmentItems.map((item) => {
              const canBuy = !item.maxed && hud.cash >= item.price;
              return (
                <div
                  key={item.id}
                  className="rounded-xl bg-white/6 border border-white/10 p-3 flex items-center justify-between gap-2.5"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.accent }}
                      />
                      <span className="text-xs sm:text-sm font-extrabold text-amber-50">
                        {item.title}
                      </span>
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-white/10 text-amber-200">
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-amber-100/75 mt-0.5 leading-snug">
                      {item.desc}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={!canBuy}
                    onClick={() => onBuyShopItem(item.id)}
                    className={`h-9 px-3 rounded-lg text-xs font-black whitespace-nowrap shrink-0 cursor-pointer ${
                      item.maxed
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 cursor-default'
                        : canBuy
                        ? 'bg-amber-400 hover:bg-amber-300 text-[#261105]'
                        : 'bg-white/10 text-white/40 cursor-not-allowed'
                    }`}
                  >
                    {item.maxed ? t.maxed : `${item.price} ${t.currency}`}
                  </button>
                </div>
              );
            })
          : menuItems.map((item) => {
              const canBuy = !item.owned && hud.cash >= item.price;
              return (
                <div
                  key={item.id}
                  className="rounded-xl bg-white/6 border border-white/10 p-3 flex items-center justify-between gap-2.5"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 border border-white/30"
                        style={{ backgroundColor: item.dotColor }}
                      />
                      <span className="text-xs sm:text-sm font-extrabold text-amber-50">
                        {item.title}
                      </span>
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-amber-400/15 text-amber-200 border border-amber-300/25">
                        {item.tag}
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-amber-100/75 mt-0.5 leading-snug">
                      {item.desc}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={!canBuy}
                    onClick={() => onBuyShopItem(item.id)}
                    className={`h-9 px-3 rounded-lg text-xs font-black whitespace-nowrap shrink-0 cursor-pointer ${
                      item.owned
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 cursor-default'
                        : canBuy
                        ? 'bg-amber-400 hover:bg-amber-300 text-[#261105]'
                        : 'bg-white/10 text-white/40 cursor-not-allowed'
                    }`}
                  >
                    {item.owned ? t.owned : `${item.price} ${t.currency}`}
                  </button>
                </div>
              );
            })}
      </div>
    </div>
  );
};

export const ShawarmaUI: React.FC<ShawarmaUIProps> = ({
  lang,
  hud,
  soundEnabled,
  onStart,
  onNextDay,
  onPause,
  onResume,
  onRestart,
  onToggleSound,
  onSliceSpit,
  onChopPotatoes,
  onPlaceBread,
  onAddMeat,
  onToggleTopping,
  onSelectDrink,
  onClearBoard,
  onServe,
  onBuyShopItem,
  onExit,
}) => {
  const [showHow, setShowHow] = useState(false);
  const [showShopModal, setShowShopModal] = useState(false);

  const t = COPY[lang];
  const isAr = lang === 'ar';
  const wb = hud.workbench;
  const u = hud.upgrades;
  const canServe = wb.hasBread && wb.hasMeat;

  const unlockedToppings: ToppingId[] = ['garlic', 'pickles', 'fries', 'spicy'];
  if (u.unlockPomegranate) unlockedToppings.push('pomegranate');
  if (u.unlockCheese) unlockedToppings.push('cheese');

  const unlockedDrinks: DrinkId[] = [];
  if (u.unlockSuntop) unlockedDrinks.push('suntop');
  if (u.unlockAyran) unlockedDrinks.push('ayran');

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      style={{ fontFamily: "'Cairo', 'Tajawal', sans-serif" }}
      className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between select-none"
    >
      {/* TOP BAR + CUSTOMER ORDER TICKETS DURING SHIFT */}
      {(hud.status === 'PLAYING' || hud.status === 'PAUSED') && (
        <div className="w-full px-2.5 sm:px-5 pt-2 sm:pt-3 flex flex-col gap-1.5">
          <div className="mx-auto w-full max-w-[980px] flex items-center justify-between gap-2">
            {/* Day, Earnings vs Goal, Wallet & Timer */}
            <div className="rounded-xl bg-[#241317]/92 border border-amber-300/35 px-2.5 sm:px-4 py-1.5 shadow-lg flex items-center gap-2 sm:gap-3.5">
              <div className="flex flex-col leading-tight">
                <span className="text-[10px] sm:text-xs font-bold text-amber-200/80">
                  {t.day(hud.day)}
                </span>
                <span className="text-xs sm:text-lg font-black text-amber-300 tabular-nums leading-none">
                  {hud.dayEarned}/{hud.dayGoal}{' '}
                  <span className="text-[10px] font-bold">{t.currency}</span>
                </span>
              </div>
              <div className="h-6 w-px bg-white/15" />
              <div className="hidden sm:flex flex-col leading-tight">
                <span className="text-[10px] font-bold text-emerald-200/80">
                  {t.wallet}
                </span>
                <span className="text-sm font-black text-emerald-300 tabular-nums leading-none">
                  {hud.cash} {t.currency}
                </span>
              </div>
              <div className="hidden sm:block h-6 w-px bg-white/15" />
              <div className="flex flex-col leading-tight">
                <span className="text-[10px] sm:text-xs font-bold text-orange-200/80">
                  {t.time}
                </span>
                <span
                  className={`text-xs sm:text-lg font-black tabular-nums leading-none ${
                    hud.timeLeft <= 15 ? 'text-rose-400' : 'text-white'
                  }`}
                >
                  {hud.timeLeft}s
                </span>
              </div>
            </div>

            {/* Hearts + Streak */}
            <div className="flex items-center gap-1.5">
              <div className="rounded-xl bg-[#241317]/92 border border-rose-300/25 px-2 sm:px-2.5 py-1.5 shadow-lg flex items-center gap-1">
                {Array.from({ length: MAX_SHAWARMA_LIVES }).map((_, idx) => (
                  <HeartSvg key={idx} filled={idx < hud.lives} />
                ))}
              </div>
              {hud.streak >= 2 && (
                <div className="hidden sm:block rounded-xl bg-amber-500 text-[#261105] px-2.5 py-1 text-xs font-black shadow-lg tabular-nums">
                  🔥 ×{hud.streak}
                </div>
              )}
            </div>

            {/* Sound & Pause */}
            <div className="pointer-events-auto flex items-center gap-1.5">
              <button
                type="button"
                onClick={onToggleSound}
                aria-label={soundEnabled ? t.soundOff : t.soundOn}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#241317]/92 hover:bg-[#381d22] border border-amber-300/30 text-amber-100 flex items-center justify-center shadow-lg cursor-pointer"
              >
                <SoundSvg enabled={soundEnabled} />
              </button>
              <button
                type="button"
                onClick={hud.status === 'PAUSED' ? onResume : onPause}
                className="h-9 sm:h-10 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#261105] font-extrabold text-xs sm:text-sm shadow-lg inline-flex items-center gap-1 cursor-pointer"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-4 h-4"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
                <span className="hidden sm:inline">{t.pause}</span>
              </button>
            </div>
          </div>

          {/* 3 CUSTOMER ORDER TICKETS ALIGNED WITH THE 3D WINDOW SLOTS */}
          <div
            dir="ltr"
            className="mx-auto w-full max-w-[820px] grid grid-cols-3 gap-1.5 sm:gap-3 pt-0.5"
          >
            {([0, 1, 2] as const).map((slotIdx) => {
              const cust = hud.customers[slotIdx];
              if (!cust || cust.leaving) {
                return <div key={slotIdx} className="h-[74px] sm:h-[82px]" />;
              }
              const patPct = Math.max(
                0,
                Math.min(100, (cust.patience / Math.max(1, cust.maxPatience)) * 100)
              );
              const barColor =
                patPct > 50 ? '#4ade80' : patPct > 25 ? '#facc15' : '#f43f5e';
              const isExactMatch =
                canServe &&
                cust.toppings.length === wb.toppings.length &&
                cust.toppings.every((tp) => wb.toppings.includes(tp)) &&
                cust.drink === wb.drink;

              return (
                <button
                  key={cust.id}
                  type="button"
                  dir={isAr ? 'rtl' : 'ltr'}
                  onClick={() => onServe(slotIdx)}
                  className={`pointer-events-auto text-start rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 shadow-xl border transition-transform active:scale-[0.98] cursor-pointer ${
                    isExactMatch
                      ? 'bg-[#173620]/95 border-emerald-400 ring-2 ring-emerald-300/60'
                      : 'bg-[#261419]/92 border-amber-300/35 hover:border-amber-200/70'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[11px] sm:text-xs font-black text-amber-100 truncate">
                      {isAr ? cust.nameAr : cust.nameEn}
                    </span>
                    {isExactMatch && (
                      <span className="text-[9.5px] sm:text-[10.5px] font-black text-emerald-300 whitespace-nowrap">
                        {t.serveCustomerHint}
                      </span>
                    )}
                  </div>

                  {/* Requested toppings + optional drink */}
                  <div className="flex flex-wrap items-center gap-1 mb-1.5">
                    {cust.toppings.map((tp) => {
                      const m = TOPPING_META[tp];
                      const added = wb.toppings.includes(tp);
                      return (
                        <span
                          key={tp}
                          className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9.5px] sm:text-[11px] font-bold border ${
                            added
                              ? 'bg-emerald-500/25 border-emerald-400/60 text-emerald-100'
                              : 'bg-white/10 border-white/15 text-amber-50'
                          }`}
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: m.color }}
                          />
                          <span>{isAr ? m.nameAr : m.nameEn}</span>
                        </span>
                      );
                    })}
                    {cust.drink && (
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9.5px] sm:text-[11px] font-black border ${
                          wb.drink === cust.drink
                            ? 'bg-emerald-500/30 border-emerald-400 text-emerald-100'
                            : cust.drink === 'suntop'
                            ? 'bg-orange-500/25 border-orange-400/65 text-orange-100'
                            : 'bg-sky-400/25 border-sky-300/65 text-sky-100'
                        }`}
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: DRINK_META[cust.drink].color }}
                        />
                        <span>
                          {isAr
                            ? DRINK_META[cust.drink].nameAr
                            : DRINK_META[cust.drink].nameEn}
                        </span>
                      </span>
                    )}
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-white/15 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-[width] duration-100"
                      style={{ width: `${patPct}%`, backgroundColor: barColor }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Feedback Toast */}
          {hud.feedbackToast && (
            <div
              className={`mx-auto rounded-xl px-4 py-1 text-xs sm:text-sm font-black shadow-xl border ${
                hud.feedbackToast.positive
                  ? 'bg-emerald-500 text-slate-950 border-emerald-200'
                  : 'bg-rose-600 text-white border-rose-300'
              }`}
            >
              {hud.feedbackToast.text}
            </div>
          )}
        </div>
      )}

      {/* BOTTOM CHEF PREP DOCK */}
      {hud.status === 'PLAYING' && (
        <div className="w-full px-2 sm:px-5 pb-2 sm:pb-3.5">
          <div className="pointer-events-auto mx-auto w-full max-w-[880px] rounded-2xl bg-[#221116]/95 border border-amber-300/35 p-2 sm:p-2.5 shadow-2xl flex flex-col gap-1.5 sm:gap-2">
            {/* ROW 1: TIMED PREP STATIONS (SLICE SHAWARMA SPIT & CHOP POTATOES) + BOARD SUMMARY */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 items-center">
              {/* Station 1: Slice Shawarma Spit */}
              <button
                type="button"
                onClick={onSliceSpit}
                className={`relative overflow-hidden h-10 sm:h-11 rounded-xl border px-2.5 flex items-center justify-between gap-2 transition-all active:scale-[0.98] cursor-pointer ${
                  hud.meatStock <= 0
                    ? 'bg-orange-600/40 border-orange-300 text-orange-50'
                    : 'bg-[#3d1b12] hover:bg-[#522418] border-orange-400/45 text-orange-50'
                }`}
              >
                {hud.meatSliceProgress > 0 && (
                  <div
                    className="absolute inset-y-0 start-0 bg-orange-400/35 transition-[width] duration-75"
                    style={{ width: `${Math.round(hud.meatSliceProgress * 100)}%` }}
                  />
                )}
                <div className="relative z-10 flex items-center gap-1.5 min-w-0">
                  <span className="text-xs sm:text-sm font-black truncate">
                    {hud.meatSliceProgress > 0 ? t.slicingNow : t.sliceSpitBtn}
                  </span>
                  {u.slicerLevel === 3 && (
                    <span className="text-[9px] font-black px-1 py-0.5 rounded bg-sky-400 text-slate-950">
                      {t.electricTag}
                    </span>
                  )}
                </div>
                <span
                  className={`relative z-10 text-xs font-black tabular-nums px-1.5 py-0.5 rounded-md ${
                    hud.meatStock === 0
                      ? 'bg-rose-500 text-white'
                      : 'bg-black/35 text-amber-200'
                  }`}
                >
                  {hud.meatStock}/{hud.maxStock}
                </span>
              </button>

              {/* Station 2: Chop Fresh Potatoes */}
              <button
                type="button"
                onClick={onChopPotatoes}
                className={`relative overflow-hidden h-10 sm:h-11 rounded-xl border px-2.5 flex items-center justify-between gap-2 transition-all active:scale-[0.98] cursor-pointer ${
                  hud.friesStock <= 0
                    ? 'bg-amber-600/40 border-yellow-300 text-yellow-50'
                    : 'bg-[#3b2912] hover:bg-[#4f3818] border-yellow-400/45 text-yellow-50'
                }`}
              >
                {hud.friesChopProgress > 0 && (
                  <div
                    className="absolute inset-y-0 start-0 bg-yellow-400/35 transition-[width] duration-75"
                    style={{ width: `${Math.round(hud.friesChopProgress * 100)}%` }}
                  />
                )}
                <div className="relative z-10 flex items-center gap-1.5 min-w-0">
                  <span className="text-xs sm:text-sm font-black truncate">
                    {hud.friesChopProgress > 0 ? t.choppingNow : t.chopPotatoBtn}
                  </span>
                  {u.friesLevel === 3 && (
                    <span className="text-[9px] font-black px-1 py-0.5 rounded bg-emerald-400 text-slate-950">
                      {t.autoChefTag}
                    </span>
                  )}
                </div>
                <span
                  className={`relative z-10 text-xs font-black tabular-nums px-1.5 py-0.5 rounded-md ${
                    hud.friesStock === 0
                      ? 'bg-rose-500 text-white'
                      : 'bg-black/35 text-yellow-200'
                  }`}
                >
                  {hud.friesStock}/{hud.maxStock}
                </span>
              </button>

              {/* Compact Current Board Status + Clear */}
              <div className="col-span-2 sm:col-span-1 flex items-center justify-between gap-1.5 bg-white/5 border border-white/10 rounded-xl px-2.5 h-9 sm:h-11 text-[11px] text-amber-100">
                <div className="truncate">
                  {!wb.hasBread && !wb.hasMeat && !wb.drink ? (
                    <span className="text-amber-200/65">{t.emptyBoard}</span>
                  ) : (
                    <span className="font-bold">
                      {[
                        wb.hasBread ? t.breadBtn : null,
                        wb.hasMeat ? t.meatBtn : null,
                        ...wb.toppings.map((tp) =>
                          isAr ? TOPPING_META[tp].nameAr : TOPPING_META[tp].nameEn
                        ),
                        wb.drink
                          ? isAr
                            ? DRINK_META[wb.drink].nameAr
                            : DRINK_META[wb.drink].nameEn
                          : null,
                      ]
                        .filter(Boolean)
                        .join(' + ')}
                    </span>
                  )}
                </div>
                {(wb.hasBread || wb.hasMeat || wb.drink) && (
                  <button
                    type="button"
                    onClick={onClearBoard}
                    className="px-2 py-0.5 rounded-lg bg-rose-500/25 hover:bg-rose-500/40 border border-rose-400/40 text-rose-100 font-bold text-[10.5px] cursor-pointer shrink-0"
                  >
                    {t.clearBtn}
                  </button>
                )}
              </div>
            </div>

            {/* ROW 2: 1-TAP WRAP ASSEMBLY, UNLOCKED TOPPINGS, DRINKS & SERVE */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={onPlaceBread}
                className={`h-10 sm:h-11 px-2.5 sm:px-3.5 rounded-xl font-extrabold text-xs sm:text-sm border transition-all active:scale-95 cursor-pointer ${
                  wb.hasBread
                    ? 'bg-amber-400/25 border-amber-300 text-amber-200'
                    : 'bg-[#3c2419] hover:bg-[#4f2f20] border-amber-300/35 text-amber-50'
                }`}
              >
                {t.breadBtn}
              </button>

              <button
                type="button"
                onClick={onAddMeat}
                className={`h-10 sm:h-11 px-2.5 sm:px-3.5 rounded-xl font-extrabold text-xs sm:text-sm border transition-all active:scale-95 cursor-pointer ${
                  wb.hasMeat
                    ? 'bg-orange-500/35 border-orange-300 text-orange-100'
                    : hud.meatStock <= 0
                    ? 'bg-rose-950/60 border-rose-400/50 text-rose-200'
                    : 'bg-[#4f2213] hover:bg-[#662c19] border-orange-400/45 text-orange-50'
                }`}
              >
                {t.meatBtn}
              </button>

              {unlockedToppings.map((tp) => {
                const m = TOPPING_META[tp];
                const active = wb.toppings.includes(tp);
                const emptyFries = tp === 'fries' && hud.friesStock <= 0;
                return (
                  <button
                    key={tp}
                    type="button"
                    onClick={() => onToggleTopping(tp)}
                    className={`h-10 sm:h-11 px-2.5 sm:px-3 rounded-xl font-extrabold text-xs sm:text-sm border flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                      active
                        ? 'bg-emerald-500/30 border-emerald-300 text-emerald-100'
                        : emptyFries
                        ? 'bg-rose-950/55 border-rose-400/45 text-rose-200'
                        : 'bg-[#301b21] hover:bg-[#41242c] border-white/15 text-amber-50'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: m.color }}
                    />
                    <span>{isAr ? m.nameAr : m.nameEn}</span>
                  </button>
                );
              })}

              {unlockedDrinks.map((dk) => {
                const m = DRINK_META[dk];
                const active = wb.drink === dk;
                return (
                  <button
                    key={dk}
                    type="button"
                    onClick={() => onSelectDrink(dk)}
                    className={`h-10 sm:h-11 px-2.5 sm:px-3 rounded-xl font-black text-xs sm:text-sm border flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                      active
                        ? 'bg-emerald-500/35 border-emerald-300 text-emerald-100'
                        : dk === 'suntop'
                        ? 'bg-orange-500/20 hover:bg-orange-500/30 border-orange-400/55 text-orange-100'
                        : 'bg-sky-500/20 hover:bg-sky-500/30 border-sky-300/55 text-sky-100'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: m.color }}
                    />
                    <span>{isAr ? m.nameAr : m.nameEn}</span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => onServe()}
                disabled={!canServe}
                className={`ms-auto h-10 sm:h-11 px-4 sm:px-6 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
                  canServe
                    ? 'bg-gradient-to-b from-amber-300 to-orange-500 hover:from-amber-200 hover:to-orange-400 active:scale-95 text-[#261004] shadow-lg'
                    : 'bg-white/10 text-white/40 cursor-not-allowed'
                }`}
              >
                {t.serveBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* START SCREEN */}
      {hud.status === 'START' && (
        <div className="pointer-events-auto absolute inset-0 flex flex-col justify-between p-4 sm:p-6">
          <div className="w-full max-w-[960px] mx-auto flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onExit}
              className="h-10 px-3.5 rounded-xl bg-[#241317]/92 hover:bg-[#381d22] border border-amber-300/30 text-amber-100 text-xs sm:text-sm font-bold cursor-pointer"
            >
              {t.exit}
            </button>
            <div className="flex items-center gap-2">
              <div className="h-10 px-3.5 rounded-xl bg-[#241317]/92 border border-amber-300/35 text-amber-300 text-xs sm:text-sm font-black inline-flex items-center gap-1.5 tabular-nums">
                <span>
                  {t.wallet}: {hud.cash} {t.currency}
                </span>
              </div>
              <button
                type="button"
                onClick={onToggleSound}
                className="h-10 px-3.5 rounded-xl bg-[#241317]/92 hover:bg-[#381d22] border border-amber-300/30 text-amber-100 text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <SoundSvg enabled={soundEnabled} />
                <span className="hidden sm:inline">
                  {soundEnabled ? t.soundOn : t.soundOff}
                </span>
              </button>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[490px] mb-3 sm:mb-7 rounded-3xl bg-[#241217]/94 border border-amber-300/40 px-6 py-6 sm:px-8 sm:py-7 text-center shadow-2xl">
            <p className="text-xs sm:text-sm font-bold text-amber-300 mb-1">
              {t.kicker}
            </p>
            <h1
              className="font-black text-amber-50 leading-tight"
              style={{ fontSize: 'clamp(2.1rem, 5.5vw, 3.1rem)' }}
            >
              {t.title}
            </h1>
            <p className="text-xs sm:text-sm text-amber-100/85 mt-2 leading-relaxed">
              {t.subtitle}
            </p>

            {hud.bestCash > 0 && (
              <div className="mt-3 inline-flex items-center gap-2.5 rounded-xl bg-amber-500/15 border border-amber-300/30 px-4 py-1.5 text-xs sm:text-sm font-bold text-amber-200">
                <span>
                  {t.bestCash}:{' '}
                  <strong className="text-amber-300 tabular-nums">
                    {hud.bestCash} {t.currency}
                  </strong>
                </span>
                <span aria-hidden="true">·</span>
                <span>{t.day(hud.bestDay)}</span>
              </div>
            )}

            <div className="mt-5 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={onStart}
                className="w-full h-12 rounded-2xl bg-gradient-to-b from-amber-300 to-orange-500 hover:from-amber-200 hover:to-orange-400 active:scale-[0.98] text-[#2a1104] font-black text-lg shadow-xl cursor-pointer"
              >
                {t.start(hud.day)}
              </button>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowShopModal(true)}
                  className="h-11 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-300/45 text-amber-200 font-black text-sm sm:text-base cursor-pointer"
                >
                  {t.openShop}
                </button>
                <button
                  type="button"
                  onClick={() => setShowHow(true)}
                  className="h-11 rounded-2xl bg-[#3d1e24] hover:bg-[#522830] border border-amber-300/30 text-amber-100 font-bold text-sm sm:text-base cursor-pointer"
                >
                  {t.howToPlay}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DEDICATED STANDALONE SHOP MODAL (accessible from Start & Game Over) */}
      {showShopModal && (
        <div className="pointer-events-auto fixed inset-0 z-30 bg-[#14090c]/88 flex items-center justify-center p-4">
          <div className="w-full max-w-[520px] rounded-3xl bg-[#261318] border border-amber-300/40 p-5 sm:p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-black text-amber-100">
                  {t.shopTitle}
                </h2>
                <div className="text-xs font-black text-amber-300 tabular-nums mt-0.5">
                  {t.wallet}: {hud.cash} {t.currency}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowShopModal(false)}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-lg cursor-pointer"
              >
                ×
              </button>
            </div>

            <ShopItemsGrid
              lang={lang}
              hud={hud}
              onBuyShopItem={onBuyShopItem}
            />

            <button
              type="button"
              onClick={() => setShowShopModal(false)}
              className="w-full h-11 rounded-xl bg-white/12 hover:bg-white/20 text-amber-100 font-extrabold text-sm cursor-pointer"
            >
              {t.shopClose}
            </button>
          </div>
        </div>
      )}

      {/* HOW TO PLAY MODAL */}
      {showHow && (
        <div className="pointer-events-auto fixed inset-0 z-30 bg-[#14090c]/88 flex items-center justify-center p-4">
          <div className="w-full max-w-[520px] max-h-[85vh] rounded-3xl bg-[#261318] border border-amber-300/35 shadow-2xl flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-lg font-black text-amber-100">{t.howTitle}</h2>
              <button
                type="button"
                onClick={() => setShowHow(false)}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-lg cursor-pointer"
              >
                ×
              </button>
            </div>
            <div className="p-5 overflow-y-auto space-y-2.5 text-xs sm:text-sm text-amber-50/90 leading-relaxed">
              {t.rules.map((r, i) => (
                <div
                  key={i}
                  className="rounded-xl bg-white/6 border border-white/10 px-3.5 py-2.5"
                >
                  {r}
                </div>
              ))}
            </div>
            <div className="px-5 py-3.5 border-t border-white/10 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowHow(false);
                  onStart();
                }}
                className="flex-1 h-11 rounded-xl bg-gradient-to-b from-amber-300 to-orange-500 text-[#2a1104] font-black text-sm sm:text-base cursor-pointer"
              >
                {t.howStart}
              </button>
              <button
                type="button"
                onClick={() => setShowHow(false)}
                className="px-4 h-11 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm cursor-pointer"
              >
                {t.howClose}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BETWEEN-DAY SUMMARY & FULL SHOP MODAL */}
      {hud.status === 'DAY_END' && (
        <div className="pointer-events-auto fixed inset-0 z-20 bg-[#14090c]/88 flex items-center justify-center p-4">
          <div className="w-full max-w-[520px] rounded-3xl bg-[#261318] border border-amber-300/40 p-5 sm:p-6 shadow-2xl flex flex-col gap-4">
            <div className="text-center">
              <h2 className="text-2xl font-black text-amber-200">
                {t.dayCompleteTitle(hud.day)}
              </h2>
              <p className="text-xs sm:text-sm text-amber-100/80 mt-1">
                {t.dayCompleteSub}
              </p>
              <div className="mt-2.5 inline-flex items-center gap-3 rounded-xl bg-amber-500/18 border border-amber-300/35 px-4 py-1.5 text-sm font-black text-amber-300 tabular-nums">
                <span>
                  {t.wallet}: {hud.cash} {t.currency}
                </span>
              </div>
            </div>

            <ShopItemsGrid
              lang={lang}
              hud={hud}
              onBuyShopItem={onBuyShopItem}
            />

            <button
              type="button"
              onClick={onNextDay}
              className="w-full h-12 rounded-2xl bg-gradient-to-b from-amber-300 to-orange-500 hover:from-amber-200 hover:to-orange-400 text-[#261105] font-black text-base shadow-xl cursor-pointer"
            >
              {t.nextDayBtn(hud.day + 1)}
            </button>
          </div>
        </div>
      )}

      {/* PAUSE OVERLAY */}
      {hud.status === 'PAUSED' && (
        <div className="pointer-events-auto fixed inset-0 z-20 bg-[#14090c]/84 flex items-center justify-center p-4">
          <div className="w-full max-w-[360px] rounded-3xl bg-[#261318] border border-amber-300/35 p-6 text-center shadow-2xl">
            <h2 className="text-2xl font-black text-amber-100">{t.pausedTitle}</h2>
            <p className="text-xs sm:text-sm text-amber-200/80 mt-1 tabular-nums">
              {t.day(hud.day)} · {hud.dayEarned}/{hud.dayGoal} {t.currency}
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={onResume}
                className="w-full h-12 rounded-2xl bg-gradient-to-b from-amber-300 to-orange-500 text-[#261105] font-black text-base cursor-pointer"
              >
                {t.resume}
              </button>
              <button
                type="button"
                onClick={onRestart}
                className="w-full h-11 rounded-2xl bg-[#3d1e24] hover:bg-[#522830] border border-amber-300/30 text-amber-100 font-bold text-sm cursor-pointer"
              >
                {t.restart}
              </button>
              <button
                type="button"
                onClick={onExit}
                className="w-full h-11 rounded-2xl bg-rose-950/60 hover:bg-rose-900/70 border border-rose-400/30 text-rose-100 font-bold text-sm cursor-pointer"
              >
                {t.exitToHub}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GAME OVER OVERLAY (WITH SHOP ACCESS SO PLAYER CAN UPGRADE BEFORE RETRYING) */}
      {hud.status === 'GAME_OVER' && (
        <div className="pointer-events-auto fixed inset-0 z-20 bg-[#14090c]/86 flex items-center justify-center p-4">
          <div className="w-full max-w-[400px] rounded-3xl bg-[#261318] border border-amber-300/40 p-6 sm:p-7 text-center shadow-2xl">
            <h2 className="text-2xl sm:text-3xl font-black text-amber-100">
              {t.gameOverTitle}
            </h2>
            <p className="text-xs sm:text-sm text-amber-200/80 mt-1">
              {t.gameOverSub}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/6 border border-amber-300/20 p-3.5">
                <div className="text-xs text-amber-200/80 font-semibold">
                  {t.earnedTotal}
                </div>
                <div className="text-2xl font-black text-amber-300 tabular-nums mt-0.5">
                  {hud.cash}
                </div>
              </div>
              <div className="rounded-2xl bg-white/6 border border-amber-300/20 p-3.5">
                <div className="text-xs text-amber-200/80 font-semibold">
                  {t.bestCash}
                </div>
                <div className="text-2xl font-black text-yellow-200 tabular-nums mt-0.5">
                  {hud.bestCash}
                </div>
              </div>
              <div className="col-span-2 rounded-2xl bg-white/6 border border-white/10 p-2.5 text-xs font-bold text-amber-100">
                {t.day(hud.day)} · {t.servedCount}:{' '}
                <strong className="text-amber-300 tabular-nums">
                  {hud.totalServed}
                </strong>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={onRestart}
                className="w-full h-12 rounded-2xl bg-gradient-to-b from-amber-300 to-orange-500 hover:from-amber-200 hover:to-orange-400 text-[#261105] font-black text-lg shadow-xl cursor-pointer"
              >
                {t.playAgain}
              </button>
              <button
                type="button"
                onClick={() => setShowShopModal(true)}
                className="w-full h-11 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-300/45 text-amber-200 font-black text-sm cursor-pointer"
              >
                {t.openShop} ({hud.cash} {t.currency})
              </button>
              <button
                type="button"
                onClick={onExit}
                className="w-full h-11 rounded-2xl bg-white/10 hover:bg-white/16 text-amber-100 font-bold text-sm cursor-pointer"
              >
                {t.exitToHub}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
