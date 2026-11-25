import React, { useRef, useState } from 'react';
import {
  DAY_DURATION_SEC,
  EMERGENCY_GRANT_AMOUNT,
  getPriceVerdict,
  GUM_FLAVOR_MAP,
  GUM_FLAVORS,
  MAX_SHELVES,
  MIN_CRATE_COST,
  PACKS_PER_BOX,
  SHELF_SLOTS,
  SHOP_UPGRADES,
  type GumFlavorId,
  type GumShopHudSnapshot,
  type GumShopModalTab,
  type UpgradeId,
} from './types';

interface GumShopUIProps {
  lang: 'ar' | 'en';
  hud: GumShopHudSnapshot;
  hasExistingSave: boolean;
  soundEnabled: boolean;
  activeTab: GumShopModalTab;
  onSetTab: (tab: GumShopModalTab) => void;
  onStartOrResume: () => void;
  onResetShop: () => void;
  onOrderCrate: (flavor: GumFlavorId) => void;
  onSetPrice: (flavor: GumFlavorId, price: number) => void;
  onBuyShelf: (slotIndex: number) => void;
  onBuyUpgrade: (upgradeId: UpgradeId) => void;
  onPayRent: () => void;
  onEmergencyGrant: () => void;
  onInteractNearest: () => void;
  onGoOutsideToCrates: () => void;
  onCheckoutNow: () => void;
  onJoystickMove: (x: number, z: number) => void;
  onToggleSound: () => void;
  onExit: () => void;
}

const COPY = {
  ar: {
    title: 'بياع العلك 3D',
    subtitle:
      'اطلب كراتين العلك، اخرج خارج المحل لأخذها، رتّبها على رفوف 3D، سعّر كل نكهة بنفسك، وادفع الإيجار اليومي — تقدمك محفوظ تلقائياً دائماً!',
    continueShop: (day: number, money: number) =>
      `متابعة محلك (اليوم ${day} · ${money} ريال)`,
    startNewShop: 'افتح محلك الآن',
    resetShop: 'بدء محل جديد من الصفر',
    confirmReset: 'تأكيد المسح والبدء من الصفر؟',
    cancel: 'إلغاء',
    exit: 'خروج',
    savedBadge: 'محفوظ تلقائياً',
    dayLabel: (d: number) => `اليوم ${d}`,
    currency: 'ريال',
    rentLabel: 'الإيجار',
    cratesOutside: (n: number) => `${n} كرتون بالخارج — اخرج لأخذه!`,
    carrying: (name: string, packs: number) => `تحمل: ${name} (${packs} علب)`,
    tabOrder: 'طلب علك',
    tabPricing: 'تسعير العلك',
    tabShelves: 'رفوف وتطوير',
    orderTitle: 'مورّد العلك بالجملة',
    orderSub: `كل كرتون يحتوي ${PACKS_PER_BOX} علب ويصل مباشرة خارج باب محلك.`,
    orderBtn: (cost: number) => `اطلب (${cost} ريال)`,
    wholesaleCost: 'الجملة للعلبة',
    marketPrice: 'سعر السوق',
    pricingTitle: 'لوحة تسعير العلك',
    pricingSub:
      'إذا كان السعر غالي قليلاً أو غالي جداً لن يشتري أحد ويقولون "غالي رخصه!" ولن تستطيع دفع الإيجار!',
    yourPrice: 'سعرك',
    fairBtn: 'عادل',
    verdictCheap: 'رخيص ومغري',
    verdictFair: 'سعر عادل',
    verdictHigh: 'غالي قليلاً (لا أحد يشتري!)',
    verdictRipOff: 'غالي جداً! (غالي رخصه!)',
    shelvesTitle: 'شراء رفوف 3D وتطوير المحل',
    shelvesSection: (owned: number) => `رفوف العرض ثلاثية الأبعاد (${owned}/${MAX_SHELVES})`,
    upgradesSection: 'تطويرات المحل',
    owned: 'مملوك',
    buyBtn: (cost: number) => `شراء (${cost} ريال)`,
    actionPickup: 'أخذ الكرتون (E)',
    actionStock: 'تعبئة الرف (E)',
    actionCheckout: 'محاسبة الزبون +15%',
    goOutsideBtn: 'اذهب للكرتون بالخارج',
    waitingCustomers: (n: number) => `زبون ينتظر عند الكاشير (${n})`,
    rentDueTitle: (day: number) => `نهاية اليوم ${day} — حان وقت الإيجار`,
    todayRevenue: 'مبيعات اليوم',
    todayWholesale: 'شراء بضاعة',
    todayPacks: 'علب مباعة',
    dailyRent: 'إيجار اليوم',
    unpaidRent: 'إيجار متأخر',
    totalRentDue: 'إجمالي الإيجار المطلوب',
    payRentBtn: (amt: number) => `دفع الإيجار (${amt} ريال) وبدء اليوم التالي`,
    rentFailedWarn:
      'ما معك قيمة الإيجار! تم إغلاق المحل لأنك لم تستطع دفع الإيجار وستعيد اللعب من البداية.',
    restartFromBeginningBtn: 'ما قدرت تدفع الإيجار — إعادة من البداية (اليوم 1)',
    controlsHint: 'اضغط على الأرض أو الكراتين أو الرفوف للمشي، أو استخدم الأسهم / WASD',
    emergencyBtn: `دعم طارئ (+${EMERGENCY_GRANT_AMOUNT} ريال)`,
    close: 'إغلاق',
    shelvesOwned: 'الرفوف',
    totalSold: 'إجمالي المباع',
  },
  en: {
    title: 'Gum Shop 3D',
    subtitle:
      'Order gum cartons, walk outside to haul them in, buy 3D display shelves, set your own prices, and pay daily rent — auto-saved permanently!',
    continueShop: (day: number, money: number) =>
      `Continue Shop (Day ${day} · ${money} SAR)`,
    startNewShop: 'Open Your Shop',
    resetShop: 'Start Fresh Shop',
    confirmReset: 'Confirm reset to Day 1?',
    cancel: 'Cancel',
    exit: 'Exit',
    savedBadge: 'Auto-Saved',
    dayLabel: (d: number) => `Day ${d}`,
    currency: 'SAR',
    rentLabel: 'Rent',
    cratesOutside: (n: number) => `${n} Crate(s) Outside — Go Pick Up!`,
    carrying: (name: string, packs: number) => `Carrying: ${name} (${packs} packs)`,
    tabOrder: 'Order Gum',
    tabPricing: 'Set Prices',
    tabShelves: '3D Shelves',
    orderTitle: 'Wholesale Gum Supplier',
    orderSub: `Each carton has ${PACKS_PER_BOX} packs and drops right outside your shop door.`,
    orderBtn: (cost: number) => `Order (${cost} SAR)`,
    wholesaleCost: 'Unit Cost',
    marketPrice: 'Market',
    pricingTitle: 'Gum Price Board',
    pricingSub:
      'If a flavor is pricey or too expensive, nobody will buy it ("Too expensive, lower it!") and you will fail rent!',
    yourPrice: 'Your Price',
    fairBtn: 'Fair',
    verdictCheap: 'Hot Deal',
    verdictFair: 'Fair Price',
    verdictHigh: 'Pricey (No Buyers!)',
    verdictRipOff: 'Too Expensive! (Lower It!)',
    shelvesTitle: 'Buy 3D Shelves & Upgrades',
    shelvesSection: (owned: number) => `3D Display Shelves (${owned}/${MAX_SHELVES})`,
    upgradesSection: 'Shop Upgrades',
    owned: 'Owned',
    buyBtn: (cost: number) => `Buy (${cost} SAR)`,
    actionPickup: 'Pick Up Crate (E)',
    actionStock: 'Stock Shelf (E)',
    actionCheckout: 'Ring Up +15%',
    goOutsideBtn: 'Walk to Outside Crate',
    waitingCustomers: (n: number) => `Customer at Checkout (${n})`,
    rentDueTitle: (day: number) => `End of Day ${day} — Rent Due`,
    todayRevenue: "Today's Sales",
    todayWholesale: 'Stock Ordered',
    todayPacks: 'Packs Sold',
    dailyRent: 'Daily Rent',
    unpaidRent: 'Past Due Rent',
    totalRentDue: 'Total Rent Due',
    payRentBtn: (amt: number) => `Pay Rent (${amt} SAR) & Next Day`,
    rentFailedWarn:
      "You can't afford today's rent! Your shop is closed and you must restart from Day 1.",
    restartFromBeginningBtn: "Can't Pay Rent — Restart from Day 1",
    controlsHint: 'Tap floor, crates, or shelves to walk & interact — or use WASD / Arrows',
    emergencyBtn: `Emergency Grant (+${EMERGENCY_GRANT_AMOUNT} SAR)`,
    close: 'Close',
    shelvesOwned: 'Shelves',
    totalSold: 'Total Sold',
  },
} as const;

export const GumShopUI: React.FC<GumShopUIProps> = ({
  lang,
  hud,
  hasExistingSave,
  soundEnabled,
  activeTab,
  onSetTab,
  onStartOrResume,
  onResetShop,
  onOrderCrate,
  onSetPrice,
  onBuyShelf,
  onBuyUpgrade,
  onPayRent,
  onEmergencyGrant,
  onInteractNearest,
  onGoOutsideToCrates,
  onCheckoutNow,
  onJoystickMove,
  onToggleSound,
  onExit,
}) => {
  const t = COPY[lang];
  const [confirmingReset, setConfirmingReset] = useState(false);

  // Touch Virtual Joystick state
  const joyBaseRef = useRef<HTMLDivElement | null>(null);
  const joyPointerId = useRef<number>(-1);
  const [joyKnob, setJoyKnob] = useState({ x: 0, y: 0 });

  const updateJoystick = (clientX: number, clientY: number) => {
    const el = joyBaseRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = rect.width * 0.38;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    const scale = dist > maxR ? maxR / dist : 1;
    const kx = dx * scale;
    const ky = dy * scale;
    setJoyKnob({ x: kx, y: ky });
    onJoystickMove(kx / maxR, ky / maxR);
  };

  const handleJoyDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    joyPointerId.current = e.pointerId;
    updateJoystick(e.clientX, e.clientY);
  };

  const handleJoyMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (joyPointerId.current !== e.pointerId) return;
    e.stopPropagation();
    updateJoystick(e.clientX, e.clientY);
  };

  const handleJoyUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (joyPointerId.current !== e.pointerId) return;
    e.stopPropagation();
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    joyPointerId.current = -1;
    setJoyKnob({ x: 0, y: 0 });
    onJoystickMove(0, 0);
  };

  const totalStock =
    hud.shelves.reduce((s, sh) => s + sh.stock, 0) +
    hud.cratesOutsideCount * PACKS_PER_BOX +
    (hud.carriedCrate?.packs ?? 0);
  const showEmergencyGrant = hud.money < MIN_CRATE_COST && totalStock === 0;
  const dayPct = Math.max(0, Math.min(100, (hud.dayTimeLeft / DAY_DURATION_SEC) * 100));

  return (
    <div
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between text-slate-100 select-none"
    >
      {/* Top HUD Bar */}
      <header className="p-2 sm:p-3.5 flex flex-wrap items-start justify-between gap-2">
        {/* Exit & Sound */}
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onExit}
            className="h-9 sm:h-10 px-3 rounded-lg border border-rose-400/50 bg-[#121c2d]/95 hover:bg-[#1e2c45] text-rose-200 hover:text-white font-bold text-xs sm:text-sm inline-flex items-center gap-1.5 cursor-pointer"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4 rtl:rotate-180"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>{t.exit}</span>
          </button>

          <button
            type="button"
            onClick={onToggleSound}
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg border border-white/15 bg-[#121c2d]/95 hover:bg-[#1e2c45] text-amber-200 inline-flex items-center justify-center cursor-pointer"
            aria-label="Toggle Sound"
          >
            {soundEnabled ? (
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            )}
          </button>

          <div className="hidden md:inline-flex items-center gap-1.5 h-9 sm:h-10 px-2.5 rounded-lg border border-emerald-400/35 bg-[#0c1d21]/95 text-emerald-300 text-xs font-bold">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{t.savedBadge}</span>
          </div>
        </div>

        {/* Center Metrics when PLAYING */}
        {hud.status === 'PLAYING' && (
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2.5">
            {/* Money */}
            <div className="rounded-xl border border-amber-400/50 bg-[#121c2d]/95 px-3 py-1.5 flex items-center gap-2">
              <span className="font-num text-base sm:text-xl font-black text-amber-300">
                {hud.money}
              </span>
              <span className="text-[11px] sm:text-xs font-bold text-amber-100/80">
                {t.currency}
              </span>
            </div>

            {/* Day & Clock */}
            <div className="rounded-xl border border-sky-400/40 bg-[#121c2d]/95 px-3 py-1.5 min-w-[116px] sm:min-w-[138px]">
              <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold text-sky-200 mb-1">
                <span>{t.dayLabel(hud.day)}</span>
                <span className="font-num text-white">{hud.dayTimeLeft}s</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-400 to-amber-300 transition-all duration-200"
                  style={{ width: `${dayPct}%` }}
                />
              </div>
            </div>

            {/* Daily Rent Due */}
            <div
              className={`rounded-xl border px-3 py-1.5 text-xs font-bold ${
                hud.money >= hud.totalRentDue
                  ? 'border-teal-400/40 bg-[#0f2027]/95 text-teal-200'
                  : 'border-rose-400/55 bg-[#29121a]/95 text-rose-200'
              }`}
            >
              <span>{t.rentLabel}: </span>
              <span className="font-num font-black text-white">
                {hud.totalRentDue} {t.currency}
              </span>
            </div>
          </div>
        )}

        <div className="hidden sm:block w-16" />
      </header>

      {/* Mid-Top Status Banners (Outside Crates / Carried Crate / Toast Notice) */}
      {hud.status === 'PLAYING' && (
        <div className="px-3 flex flex-col items-center gap-1.5 -mt-1">
          {hud.carriedCrate && (
            <div className="rounded-xl border border-emerald-400/60 bg-[#0d261e]/95 px-3.5 py-1.5 text-xs sm:text-sm font-extrabold text-emerald-200 shadow-lg">
              {t.carrying(
                lang === 'ar'
                  ? GUM_FLAVOR_MAP[hud.carriedCrate.flavor].nameAr
                  : GUM_FLAVOR_MAP[hud.carriedCrate.flavor].nameEn,
                hud.carriedCrate.packs
              )}
            </div>
          )}

          {!hud.carriedCrate && hud.cratesOutsideCount > 0 && (
            <button
              type="button"
              onClick={onGoOutsideToCrates}
              className="pointer-events-auto rounded-xl border border-amber-300/75 bg-[#2c1e06]/95 hover:bg-[#3f2c0a] px-3.5 py-1.5 text-xs sm:text-sm font-extrabold text-amber-200 shadow-lg cursor-pointer"
            >
              {t.cratesOutside(hud.cratesOutsideCount)}
            </button>
          )}

          {hud.waitingCustomerCount > 0 && (
            <button
              type="button"
              onClick={onCheckoutNow}
              className="pointer-events-auto rounded-xl border border-teal-300/70 bg-[#0a2729]/95 hover:bg-[#113b3e] px-3.5 py-1.5 text-xs sm:text-sm font-extrabold text-teal-200 shadow-lg cursor-pointer"
            >
              {t.waitingCustomers(hud.waitingCustomerCount)}
            </button>
          )}

          {showEmergencyGrant && (
            <button
              type="button"
              onClick={onEmergencyGrant}
              className="pointer-events-auto rounded-xl border border-emerald-300 bg-emerald-500 hover:bg-emerald-400 px-4 py-1.5 text-xs sm:text-sm font-black text-slate-950 shadow-lg cursor-pointer"
            >
              {t.emergencyBtn}
            </button>
          )}

          {hud.notice && (
            <div
              className={`rounded-xl border px-3.5 py-1.5 text-xs sm:text-sm font-bold shadow-lg text-center max-w-md ${
                hud.notice.tone === 'good'
                  ? 'border-emerald-400/60 bg-[#0b241c]/95 text-emerald-100'
                  : hud.notice.tone === 'warn'
                  ? 'border-rose-400/60 bg-[#2b1018]/95 text-rose-100'
                  : 'border-sky-400/60 bg-[#0f1f33]/95 text-sky-100'
              }`}
            >
              {hud.notice.text}
            </div>
          )}
        </div>
      )}

      <div className="flex-1" />

      {/* Bottom Controls Dock while PLAYING */}
      {hud.status === 'PLAYING' && (
        <div className="p-2.5 sm:p-4 flex items-end justify-between gap-3">
          {/* Compact Touch Joystick */}
          <div
            ref={joyBaseRef}
            onPointerDown={handleJoyDown}
            onPointerMove={handleJoyMove}
            onPointerUp={handleJoyUp}
            onPointerCancel={handleJoyUp}
            className="pointer-events-auto relative w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-white/25 bg-[#0d1828]/85 touch-none shrink-0 flex items-center justify-center"
            aria-label="Movement Joystick"
          >
            <div
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-amber-400 border-2 border-amber-100 shadow-md"
              style={{
                transform: `translate(${joyKnob.x}px, ${joyKnob.y}px)`,
              }}
            />
          </div>

          {/* Center Contextual Interact + 3 Shop Management Buttons */}
          <div className="flex flex-col items-center gap-2 flex-1 max-w-xl">
            {hud.nearPrompt && (
              <button
                type="button"
                onClick={onInteractNearest}
                className="pointer-events-auto h-10 sm:h-11 px-5 rounded-xl bg-gradient-to-b from-emerald-300 to-teal-500 hover:from-emerald-200 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl cursor-pointer"
              >
                {hud.nearPrompt.kind === 'pickup_crate'
                  ? t.actionPickup
                  : hud.nearPrompt.kind === 'stock_shelf'
                  ? t.actionStock
                  : t.actionCheckout}
              </button>
            )}

            <div className="pointer-events-auto w-full grid grid-cols-3 gap-1.5 sm:gap-2.5">
              <button
                type="button"
                onClick={() => onSetTab(activeTab === 'order' ? 'none' : 'order')}
                className={`h-11 sm:h-12 px-2 rounded-xl border font-extrabold text-xs sm:text-sm transition-colors cursor-pointer ${
                  activeTab === 'order'
                    ? 'border-amber-300 bg-amber-400 text-slate-950'
                    : 'border-amber-400/50 bg-[#142033]/95 hover:bg-[#1e2f4a] text-amber-200'
                }`}
              >
                📦 {t.tabOrder}
              </button>

              <button
                type="button"
                onClick={() => onSetTab(activeTab === 'pricing' ? 'none' : 'pricing')}
                className={`h-11 sm:h-12 px-2 rounded-xl border font-extrabold text-xs sm:text-sm transition-colors cursor-pointer ${
                  activeTab === 'pricing'
                    ? 'border-teal-300 bg-teal-400 text-slate-950'
                    : 'border-teal-400/50 bg-[#142033]/95 hover:bg-[#1e2f4a] text-teal-200'
                }`}
              >
                🏷️ {t.tabPricing}
              </button>

              <button
                type="button"
                onClick={() => onSetTab(activeTab === 'shelves' ? 'none' : 'shelves')}
                className={`h-11 sm:h-12 px-2 rounded-xl border font-extrabold text-xs sm:text-sm transition-colors cursor-pointer ${
                  activeTab === 'shelves'
                    ? 'border-sky-300 bg-sky-400 text-slate-950'
                    : 'border-sky-400/50 bg-[#142033]/95 hover:bg-[#1e2f4a] text-sky-200'
                }`}
              >
                🗄️ {t.tabShelves}
              </button>
            </div>

            <div className="hidden md:block text-[11px] font-semibold text-slate-200 bg-[#0d1828]/85 border border-white/10 rounded-lg px-3 py-1">
              {t.controlsHint}
            </div>
          </div>

          <div className="hidden sm:block w-24 shrink-0" />
        </div>
      )}

      {/* MODAL: Order Gum Crates (delivered outside door) */}
      {hud.status === 'PLAYING' && activeTab === 'order' && (
        <div className="pointer-events-auto fixed inset-0 z-30 bg-[#060e1a]/75 flex items-center justify-center p-3 sm:p-5">
          <div className="w-full max-w-2xl max-h-[86vh] overflow-y-auto rounded-2xl border border-amber-400/55 bg-[#0e1b2e] p-4 sm:p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <h2 className="text-lg sm:text-2xl font-black text-amber-200">
                  {t.orderTitle}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300">{t.orderSub}</p>
              </div>
              <button
                type="button"
                onClick={() => onSetTab('none')}
                className="h-9 px-3 rounded-lg border border-white/20 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white cursor-pointer"
              >
                {t.close}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4">
              {GUM_FLAVORS.map((f) => {
                const canAfford = hud.money >= f.boxCost;
                return (
                  <div
                    key={f.id}
                    className="rounded-xl border border-white/12 bg-[#14253d] p-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-11 h-11 rounded-lg border border-white/25 shrink-0 flex items-center justify-center font-num font-black text-xs text-slate-950"
                        style={{ backgroundColor: f.color }}
                      >
                        ×{f.packsPerBox}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm sm:text-base text-white truncate">
                          {lang === 'ar' ? f.nameAr : f.nameEn}
                        </div>
                        <div className="text-[11px] text-slate-300">
                          {t.wholesaleCost}: <span className="font-num font-bold text-amber-300">{f.unitCost}</span> ·{' '}
                          {t.marketPrice}: <span className="font-num font-bold text-emerald-300">{f.fairPrice}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!canAfford}
                      onClick={() => onOrderCrate(f.id)}
                      className={`h-10 px-3 rounded-lg font-extrabold text-xs whitespace-nowrap transition-colors ${
                        canAfford
                          ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 cursor-pointer'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {t.orderBtn(f.boxCost)}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Set Your Own Gum Prices */}
      {hud.status === 'PLAYING' && activeTab === 'pricing' && (
        <div className="pointer-events-auto fixed inset-0 z-30 bg-[#060e1a]/75 flex items-center justify-center p-3 sm:p-5">
          <div className="w-full max-w-2xl max-h-[86vh] overflow-y-auto rounded-2xl border border-teal-400/55 bg-[#0d1c29] p-4 sm:p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <h2 className="text-lg sm:text-2xl font-black text-teal-200">
                  {t.pricingTitle}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300">{t.pricingSub}</p>
              </div>
              <button
                type="button"
                onClick={() => onSetTab('none')}
                className="h-9 px-3 rounded-lg border border-white/20 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white cursor-pointer"
              >
                {t.close}
              </button>
            </div>

            <div className="space-y-2.5 mt-4">
              {GUM_FLAVORS.map((f) => {
                const curPrice = hud.prices[f.id] ?? f.fairPrice;
                const verdict = getPriceVerdict(f.id, curPrice);
                const verdictText =
                  verdict === 'cheap'
                    ? t.verdictCheap
                    : verdict === 'fair'
                    ? t.verdictFair
                    : verdict === 'high'
                    ? t.verdictHigh
                    : t.verdictRipOff;
                const verdictColor =
                  verdict === 'cheap'
                    ? 'text-sky-300'
                    : verdict === 'fair'
                    ? 'text-emerald-300'
                    : verdict === 'high'
                    ? 'text-amber-300'
                    : 'text-rose-400';

                return (
                  <div
                    key={f.id}
                    className="rounded-xl border border-white/12 bg-[#13263a] p-3 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-[175px]">
                      <div
                        className="w-9 h-9 rounded-lg border border-white/25 shrink-0"
                        style={{ backgroundColor: f.color }}
                      />
                      <div>
                        <div className="font-bold text-sm sm:text-base text-white">
                          {lang === 'ar' ? f.nameAr : f.nameEn}
                        </div>
                        <div className="text-[11px] text-slate-300">
                          {t.wholesaleCost}: <span className="font-num font-bold">{f.unitCost}</span> ·{' '}
                          {t.marketPrice}: <span className="font-num font-bold text-teal-300">{f.fairPrice}</span> ·{' '}
                          <span className={`font-extrabold ${verdictColor}`}>{verdictText}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onSetPrice(f.id, curPrice - 1)}
                        className="w-9 h-9 rounded-lg border border-white/20 bg-slate-800 hover:bg-slate-700 text-white font-black text-base cursor-pointer"
                      >
                        -
                      </button>
                      <div className="min-w-[74px] text-center rounded-lg border border-teal-400/35 bg-[#0a1624] py-1.5 px-2">
                        <span className="font-num font-black text-base text-white">
                          {curPrice}
                        </span>
                        <span className="text-[10px] text-slate-400 ms-1">{t.currency}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onSetPrice(f.id, curPrice + 1)}
                        className="w-9 h-9 rounded-lg border border-white/20 bg-slate-800 hover:bg-slate-700 text-white font-black text-base cursor-pointer"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => onSetPrice(f.id, f.fairPrice)}
                        className="h-9 px-2.5 rounded-lg border border-teal-400/40 bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 text-xs font-bold cursor-pointer"
                      >
                        {t.fairBtn}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Buy 3D Shelves & Upgrades */}
      {hud.status === 'PLAYING' && activeTab === 'shelves' && (
        <div className="pointer-events-auto fixed inset-0 z-30 bg-[#060e1a]/75 flex items-center justify-center p-3 sm:p-5">
          <div className="w-full max-w-2xl max-h-[86vh] overflow-y-auto rounded-2xl border border-sky-400/55 bg-[#0d1a2e] p-4 sm:p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h2 className="text-lg sm:text-2xl font-black text-sky-200">
                {t.shelvesTitle}
              </h2>
              <button
                type="button"
                onClick={() => onSetTab('none')}
                className="h-9 px-3 rounded-lg border border-white/20 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white cursor-pointer"
              >
                {t.close}
              </button>
            </div>

            <div className="text-xs font-extrabold text-amber-300 mb-2">
              {t.shelvesSection(hud.shelves.length)}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
              {SHELF_SLOTS.map((slot) => {
                const owned = hud.shelves.some((s) => s.slotIndex === slot.slotIndex);
                const canAfford = hud.money >= slot.cost;
                return (
                  <div
                    key={slot.slotIndex}
                    className={`rounded-xl border p-3 flex items-center justify-between gap-2 ${
                      owned
                        ? 'border-emerald-400/40 bg-[#102624]'
                        : 'border-white/12 bg-[#14253d]'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm text-white">
                        {lang === 'ar' ? slot.nameAr : slot.nameEn}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {slot.style === 'gold'
                          ? 'Gold VIP 3D'
                          : slot.style === 'acrylic'
                          ? 'Acrylic 3D'
                          : 'Wood 3D'}
                      </div>
                    </div>

                    {owned ? (
                      <span className="text-xs font-extrabold text-emerald-300 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-400/30">
                        ✓ {t.owned}
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={!canAfford}
                        onClick={() => onBuyShelf(slot.slotIndex)}
                        className={`h-9 px-3 rounded-lg font-extrabold text-xs whitespace-nowrap ${
                          canAfford
                            ? 'bg-sky-400 hover:bg-sky-300 text-slate-950 cursor-pointer'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {t.buyBtn(slot.cost)}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="text-xs font-extrabold text-sky-300 mb-2">{t.upgradesSection}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SHOP_UPGRADES.map((u) => {
                const owned = hud.upgrades.includes(u.id);
                const canAfford = hud.money >= u.cost;
                return (
                  <div
                    key={u.id}
                    className={`rounded-xl border p-3 flex flex-col justify-between gap-2.5 ${
                      owned
                        ? 'border-emerald-400/40 bg-[#102624]'
                        : 'border-white/12 bg-[#14253d]'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm text-white">
                        {lang === 'ar' ? u.nameAr : u.nameEn}
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        {lang === 'ar' ? u.descAr : u.descEn}
                      </p>
                    </div>
                    {owned ? (
                      <div className="text-xs font-extrabold text-emerald-300">✓ {t.owned}</div>
                    ) : (
                      <button
                        type="button"
                        disabled={!canAfford}
                        onClick={() => onBuyUpgrade(u.id)}
                        className={`h-9 rounded-lg font-extrabold text-xs ${
                          canAfford
                            ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 cursor-pointer'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {t.buyBtn(u.cost)}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: End of Day / Rent Due */}
      {hud.status === 'RENT_DUE' && (
        <div className="pointer-events-auto fixed inset-0 z-40 bg-[#060e1a]/82 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-amber-400/60 bg-[#0e1b2e] p-5 sm:p-6 shadow-2xl">
            <h2 className="text-xl sm:text-2xl font-black text-amber-200 text-center mb-4">
              {t.rentDueTitle(hud.day)}
            </h2>

            <div className="space-y-2 rounded-xl border border-white/10 bg-[#14253d] p-4 mb-5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-300">{t.todayRevenue}</span>
                <span className="font-num font-bold text-emerald-300">
                  +{hud.todayRevenue} {t.currency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">{t.todayWholesale}</span>
                <span className="font-num font-bold text-rose-300">
                  -{hud.todayWholesale} {t.currency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">{t.todayPacks}</span>
                <span className="font-num font-bold text-sky-300">{hud.todayPacksSold}</span>
              </div>
              <div className="border-t border-white/10 pt-2 mt-2 flex justify-between">
                <span className="text-slate-200">{t.dailyRent}</span>
                <span className="font-num font-bold text-amber-300">
                  {hud.dailyRent} {t.currency}
                </span>
              </div>
              {hud.unpaidRent > 0 && (
                <div className="flex justify-between">
                  <span className="text-rose-300">{t.unpaidRent}</span>
                  <span className="font-num font-bold text-rose-300">
                    {hud.unpaidRent} {t.currency}
                  </span>
                </div>
              )}
              <div className="border-t border-white/15 pt-2 flex justify-between text-base font-black">
                <span className="text-white">{t.totalRentDue}</span>
                <span className="font-num text-amber-300">
                  {hud.totalRentDue} {t.currency}
                </span>
              </div>
            </div>

            {hud.money < hud.totalRentDue && (
              <div className="rounded-xl border border-rose-400/65 bg-rose-950/75 p-3 mb-4 text-xs sm:text-sm font-bold text-rose-100 text-center leading-relaxed">
                {t.rentFailedWarn}
              </div>
            )}

            <button
              type="button"
              onClick={onPayRent}
              className={`w-full h-12 rounded-xl font-black text-sm sm:text-base cursor-pointer ${
                hud.money >= hud.totalRentDue
                  ? 'bg-gradient-to-b from-amber-300 to-amber-500 hover:from-amber-200 hover:to-amber-400 text-slate-950'
                  : 'bg-gradient-to-b from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white'
              }`}
            >
              {hud.money >= hud.totalRentDue
                ? t.payRentBtn(hud.totalRentDue)
                : t.restartFromBeginningBtn}
            </button>
          </div>
        </div>
      )}

      {/* TITLE / WELCOME OVERLAY (Preserves Saved Progress!) */}
      {hud.status === 'TITLE' && (
        <div className="pointer-events-auto fixed inset-0 z-40 bg-[#07111f]/78 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-teal-400/55 bg-[#0e1b2d] p-5 sm:p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <div className="text-xs font-extrabold text-teal-300 mb-1">
                  3D · {t.savedBadge}
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white">{t.title}</h1>
              </div>
              <button
                type="button"
                onClick={onExit}
                className="h-9 px-3 rounded-lg border border-rose-400/45 bg-rose-500/15 hover:bg-rose-500/25 text-rose-200 text-xs font-bold cursor-pointer"
              >
                {t.exit}
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
              {t.subtitle}
            </p>

            {hasExistingSave && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="rounded-xl border border-white/10 bg-[#14253d] p-2.5 text-center">
                  <div className="text-[11px] text-slate-400">{t.dayLabel(hud.day)}</div>
                  <div className="font-num text-base font-black text-amber-300">
                    {hud.money} {t.currency}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#14253d] p-2.5 text-center">
                  <div className="text-[11px] text-slate-400">{t.shelvesOwned}</div>
                  <div className="font-num text-base font-black text-sky-300">
                    {hud.shelves.length}/{MAX_SHELVES}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#14253d] p-2.5 text-center">
                  <div className="text-[11px] text-slate-400">{t.totalSold}</div>
                  <div className="font-num text-base font-black text-emerald-300">
                    {hud.totalPacksSold}
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={onStartOrResume}
              className="w-full h-12 rounded-xl bg-gradient-to-b from-teal-300 to-emerald-500 hover:from-teal-200 hover:to-emerald-400 text-slate-950 font-black text-sm sm:text-base transition-colors cursor-pointer mb-2.5"
            >
              {hasExistingSave ? t.continueShop(hud.day, hud.money) : t.startNewShop}
            </button>

            {hasExistingSave && !confirmingReset && (
              <button
                type="button"
                onClick={() => setConfirmingReset(true)}
                className="w-full h-9 rounded-lg border border-white/15 bg-transparent hover:bg-white/5 text-slate-400 hover:text-rose-200 text-xs font-bold cursor-pointer"
              >
                {t.resetShop}
              </button>
            )}

            {confirmingReset && (
              <div className="rounded-xl border border-rose-400/45 bg-rose-950/50 p-3 flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-rose-200">{t.confirmReset}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmingReset(false);
                      onResetShop();
                    }}
                    className="h-8 px-3 rounded-lg bg-rose-500 text-white text-xs font-extrabold cursor-pointer"
                  >
                    {t.resetShop}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingReset(false)}
                    className="h-8 px-3 rounded-lg bg-slate-800 text-slate-200 text-xs font-bold cursor-pointer"
                  >
                    {t.cancel}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
