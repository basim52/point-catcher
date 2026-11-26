export type PartyCharacterId =
  | 'marco'
  | 'lugo'
  | 'rosa'
  | 'toady'
  | 'yosho'
  | 'koopa'
  | 'wario'
  | 'rosy';

export interface PartyCharacterSpec {
  id: PartyCharacterId;
  nameAr: string;
  nameEn: string;
  titleAr: string;
  titleEn: string;
  primary: string;
  secondary: string;
  accent: string;
  skin: string;
  emblem: string;
  perkAr: string;
  perkEn: string;
}

export const PARTY_CHARACTERS: PartyCharacterSpec[] = [
  {
    id: 'marco',
    nameAr: 'ماركو البطل',
    nameEn: 'Marco Hero',
    titleAr: 'بطل القبّعة الحمراء',
    titleEn: 'Red Cap Champion',
    primary: '#ef4444',
    secondary: '#2563eb',
    accent: '#facc15',
    skin: '#f6c79c',
    emblem: 'M',
    perkAr: 'متوازن وسريع القفز',
    perkEn: 'Balanced & snappy jumper',
  },
  {
    id: 'lugo',
    nameAr: 'لويجي الأخضر',
    nameEn: 'Lugo Green',
    titleAr: 'نجم القفزة العالية',
    titleEn: 'High-Jump Star',
    primary: '#16a34a',
    secondary: '#1d4ed8',
    accent: '#fde047',
    skin: '#f6c79c',
    emblem: 'L',
    perkAr: 'خفة ورشاقة في المراوغة',
    perkEn: 'Nimble & agile dodger',
  },
  {
    id: 'rosa',
    nameAr: 'الأميرة روزا',
    nameEn: 'Princess Rosa',
    titleAr: 'أميرة التاج الذهبي',
    titleEn: 'Golden Crown Royal',
    primary: '#ec4899',
    secondary: '#f472b6',
    accent: '#fbbf24',
    skin: '#fbd3b0',
    emblem: '♛',
    perkAr: 'دقّة ملكية في النجوم',
    perkEn: 'Royal star precision',
  },
  {
    id: 'toady',
    nameAr: 'تودي الفطر',
    nameEn: 'Toady Cap',
    titleAr: 'عدّاء المملكة السريع',
    titleEn: 'Kingdom Speedster',
    primary: '#f97316',
    secondary: '#f8fafc',
    accent: '#ef4444',
    skin: '#f8d2ae',
    emblem: '●',
    perkAr: 'سرعة خاطفة في جمع العملات',
    perkEn: 'Lightning coin collector',
  },
  {
    id: 'yosho',
    nameAr: 'يوشو التنين',
    nameEn: 'Yosho Dino',
    titleAr: 'صديق المغامرات الأخضر',
    titleEn: 'Emerald Dino Pal',
    primary: '#84cc16',
    secondary: '#ffffff',
    accent: '#f97316',
    skin: '#bef264',
    emblem: '★',
    perkAr: 'قفزات مرنة وحماسية',
    perkEn: 'Bouncy adventurous spirit',
  },
  {
    id: 'koopa',
    nameAr: 'باوزر الصغير',
    nameEn: 'Koopa Jr.',
    titleAr: 'أمير الصدفة الشائكة',
    titleEn: 'Spiky Shell Prince',
    primary: '#f59e0b',
    secondary: '#15803d',
    accent: '#dc2626',
    skin: '#fcd34d',
    emblem: '▲',
    perkAr: 'قوة هائلة في التكسير',
    perkEn: 'Heavy-hitting power',
  },
  {
    id: 'wario',
    nameAr: 'واريو الذهبي',
    nameEn: 'Wario Gold',
    titleAr: 'صياد الكنوز والذهب',
    titleEn: 'Golden Treasure Hunter',
    primary: '#eab308',
    secondary: '#7c3aed',
    accent: '#fde047',
    skin: '#f4be96',
    emblem: 'W',
    perkAr: 'مهووس بالعملات الذهبية',
    perkEn: 'Gold coin fanatic',
  },
  {
    id: 'rosy',
    nameAr: 'روزي النجمة',
    nameEn: 'Starlight Rosy',
    titleAr: 'حارسة النجوم الكونية',
    titleEn: 'Cosmic Star Guardian',
    primary: '#06b6d4',
    secondary: '#0ea5e9',
    accent: '#fef08a',
    skin: '#fce0c4',
    emblem: '✦',
    perkAr: 'هدوء وتركيز بالذاكرة والإيقاع',
    perkEn: 'Calm rhythm & memory ace',
  },
];

export const PARTY_CHARACTER_MAP: Record<PartyCharacterId, PartyCharacterSpec> =
  PARTY_CHARACTERS.reduce((acc, c) => {
    acc[c.id] = c;
    return acc;
  }, {} as Record<PartyCharacterId, PartyCharacterSpec>);

export type MarioMiniGameId =
  | 'coin_block_bash'
  | 'pipe_sprint'
  | 'star_rain_catch'
  | 'cloud_tower_climb'
  | 'balloon_pump_burst'
  | 'lava_bridge_dash'
  | 'whack_goomba'
  | 'mushroom_memory'
  | 'fireball_duel'
  | 'boo_red_light'
  | 'count_toads'
  | 'brick_smash_rush'
  | 'bullet_bill_dodge'
  | 'coin_magnet_maze'
  | 'paint_tiles_party'
  | 'star_rhythm_beat'
  | 'cheep_fishing'
  | 'penguin_ice_slide'
  | 'shell_soccer_kick'
  | 'fire_bar_jump'
  | 'hammer_nail_bash'
  | 'mushroom_color_dash'
  | 'bob_omb_pass'
  | 'sky_balloon_pop'
  | 'crown_castle_sprint'
  | 'kart_drift_3d'
  | 'sky_island_hop_3d'
  | 'bumper_arena_3d'
  | 'star_stadium_3d'
  | 'bowser_tower_3d';

export type MiniGameEngineKind = 'canvas' | 'board' | 'three3d';

export type MiniGameCategory = 'platform' | 'reflex' | 'dodge' | 'puzzle' | 'sport';

export interface MarioMiniGameSpec {
  id: MarioMiniGameId;
  num: number;
  engine: MiniGameEngineKind;
  category: MiniGameCategory;
  durationSec: number;
  nameAr: string;
  nameEn: string;
  ruleAr: string;
  ruleEn: string;
  controlsAr: string;
  controlsEn: string;
  accent: string;
  bgTint: string;
  badgeText: string;
  is3D?: boolean;
}

export const MARIO_MINI_GAMES: MarioMiniGameSpec[] = [
  {
    id: 'coin_block_bash',
    num: 1,
    engine: 'canvas',
    category: 'platform',
    durationSec: 22,
    nameAr: 'ضرب مربعات العملات ؟',
    nameEn: 'Question Block Bash',
    ruleAr: 'اقفز واضرب مربعات ؟ الذهبية لتجمع أكبر عدد من العملات وتجنب المربعات الحمراء!',
    ruleEn: 'Jump under glowing ? blocks to pop gold coins while dodging red spike blocks!',
    controlsAr: 'الأسهم / A-D للحركة · مسافة أو لمس للقفز',
    controlsEn: 'Arrows / A-D to move · Space or Tap to jump',
    accent: '#f59e0b',
    bgTint: '#1d4ed8',
    badgeText: '?',
  },
  {
    id: 'pipe_sprint',
    num: 2,
    engine: 'canvas',
    category: 'platform',
    durationSec: 22,
    nameAr: 'سباق أنابيب الفطر',
    nameEn: 'Warp Pipe Hurdles',
    ruleAr: 'اركض بأقصى سرعة واقفز فوق الأنابيب الخضراء لجمع نجوم السرعة قبل خصمك!',
    ruleEn: 'Sprint across Mushroom Track and hurdle green warp pipes to score speed stars!',
    controlsAr: 'مسافة / سهم فوق / لمس للقفز (قفزة مزدوجة متاحة)',
    controlsEn: 'Space / Up / Tap to jump (double jump enabled)',
    accent: '#22c55e',
    bgTint: '#0369a1',
    badgeText: '02',
  },
  {
    id: 'star_rain_catch',
    num: 3,
    engine: 'canvas',
    category: 'dodge',
    durationSec: 22,
    nameAr: 'مطر النجوم الخارقة',
    nameEn: 'Super Star Shower',
    ruleAr: 'التقط النجوم الخارقة والعملات المتساقطة من السماء وتفادَ قنابل البومب والصخور!',
    ruleEn: 'Catch falling Super Stars and coins while dodging Bob-ombs and Thwomp stones!',
    controlsAr: 'الأسهم / A-D أو اسحب بإصبعك يمين ويسار',
    controlsEn: 'Arrows / A-D or drag left & right',
    accent: '#eab308',
    bgTint: '#1e1b4b',
    badgeText: '★',
  },
  {
    id: 'cloud_tower_climb',
    num: 4,
    engine: 'canvas',
    category: 'platform',
    durationSec: 24,
    nameAr: 'برج السحاب العالي',
    nameEn: 'Sky Cloud Tower',
    ruleAr: 'اقفز من سحابة لأخرى واصعد لأعلى ارتفاع ممكن واجمع العملات الذهبية في السماء!',
    ruleEn: 'Bounce higher and higher across floating Mario clouds & coin rings!',
    controlsAr: 'يمين / يسار أو اسحب للتوجيه (قفز تلقائي على السحاب)',
    controlsEn: 'Left / Right or drag to steer (auto-bounce on clouds)',
    accent: '#38bdf8',
    bgTint: '#0284c7',
    badgeText: '☁',
  },
  {
    id: 'balloon_pump_burst',
    num: 5,
    engine: 'board',
    category: 'reflex',
    durationSec: 20,
    nameAr: 'تحدي نفخ بالون باوزر',
    nameEn: 'Bowser Balloon Pump',
    ruleAr: 'اضغط بسرعة لنفخ البالون وتفجير أكبر عدد من البالونات — توقف لحظة إذا سخن المنفاخ!',
    ruleEn: 'Pump rapidly to burst giant Bowser balloons — pause briefly if the pump overheats!',
    controlsAr: 'اضغط زر النفخ أو المسافة بسرعة مع مراقبة الحرارة',
    controlsEn: 'Tap Pump or Space fast while watching the heat meter',
    accent: '#ef4444',
    bgTint: '#7f1d1d',
    badgeText: '05',
  },
  {
    id: 'lava_bridge_dash',
    num: 6,
    engine: 'canvas',
    category: 'platform',
    durationSec: 22,
    nameAr: 'بلاط الحمم المتهاوي',
    nameEn: 'Crumbling Lava Tiles',
    ruleAr: 'تنقّل بحرية فوق بلاطات الحمم التي تتشقق وتسقط خلفك! اجمع زهور النار والنجوم قبل غرق البلاط!',
    ruleEn: 'Leap across basalt tiles floating over molten lava — every stone cracks & sinks after you step on it!',
    controlsAr: 'الأسهم / WASD أو اسحب للتنقل فوق البلاط الآمن',
    controlsEn: 'Arrows / WASD or drag to dash across safe tiles',
    accent: '#f97316',
    bgTint: '#450a0a',
    badgeText: '06',
  },
  {
    id: 'whack_goomba',
    num: 7,
    engine: 'board',
    category: 'reflex',
    durationSec: 22,
    nameAr: 'ضرب الغومبا من الأنابيب',
    nameEn: 'Warp Pipe Whack',
    ruleAr: 'اضغط بسرعة على الغومبا والفطر الذهبي الخارجين من الـ9 أنابيب — لا تضرب القنبلة!',
    ruleEn: 'Whack Goombas & Golden Mushrooms popping out of 9 warp pipes — NEVER hit Bob-ombs!',
    controlsAr: 'اضغط مباشرة على الأنابيب (أو مفاتيح 1-9)',
    controlsEn: 'Tap pipes directly (or keys 1-9)',
    accent: '#16a34a',
    bgTint: '#14532d',
    badgeText: '07',
  },
  {
    id: 'mushroom_memory',
    num: 8,
    engine: 'board',
    category: 'puzzle',
    durationSec: 26,
    nameAr: 'ذاكرة مربعات النجوم',
    nameEn: 'Star Panel Memory',
    ruleAr: 'احفظ أماكن النجوم في اللوحة لمدة ثانيتين ثم افتح كل النجوم بدون لمس القنابل!',
    ruleEn: 'Memorize the Super Star tiles during the flash, then tap every Star and dodge bombs!',
    controlsAr: 'اضغط على المربعات التي كانت تحتوي نجوماً',
    controlsEn: 'Tap the panels that hid Super Stars',
    accent: '#a855f7',
    bgTint: '#3b0764',
    badgeText: '08',
  },
  {
    id: 'fireball_duel',
    num: 9,
    engine: 'canvas',
    category: 'sport',
    durationSec: 22,
    nameAr: 'مدفع الكرات النارية',
    nameEn: 'Fireball Target Blitz',
    ruleAr: 'صوّب وأطلق كرات النار على أهداف الكوبا والنجوم المتحركة لتحقيق أعلى سلسلة نقاط!',
    ruleEn: 'Aim and blast Mario Fireballs at moving Koopa targets & golden rings!',
    controlsAr: 'حرّك الفأرة أو المس الشاشة للتصويب والإطلاق',
    controlsEn: 'Move mouse or tap screen to aim & fire',
    accent: '#f97316',
    bgTint: '#7c2d12',
    badgeText: '09',
  },
  {
    id: 'boo_red_light',
    num: 10,
    engine: 'canvas',
    category: 'reflex',
    durationSec: 24,
    nameAr: 'شبح بو: نور أحمر وأخضر',
    nameEn: 'Boo Sneak & Freeze',
    ruleAr: 'اركض نحو علم النجمة عندما يكون الشبح بو نائماً، وتجمّد فوراً عندما يلتفت إليك!',
    ruleEn: 'Sprint toward the Star Flag while Boo sleeps — FREEZE the instant Boo looks back!',
    controlsAr: 'اضغط باستمرار على مسافة / زر الركض للانطلاق، واتركه للتوقف',
    controlsEn: 'Hold Space / Run button to dash, release to freeze',
    accent: '#e2e8f0',
    bgTint: '#1e1b4b',
    badgeText: '10',
  },
  {
    id: 'count_toads',
    num: 11,
    engine: 'board',
    category: 'puzzle',
    durationSec: 26,
    nameAr: 'عدّ الفطر السريع',
    nameEn: 'Count the Toads!',
    ruleAr: 'راقب الموكب المار على المسرح وعدّ عدد فطر تودي بدقة واختر الرقم الصحيح بسرعة!',
    ruleEn: 'Watch the parade cross the stage and pick the exact Toad count fastest!',
    controlsAr: 'اضغط على الإجابة الصحيحة فور انتهاء العدّ',
    controlsEn: 'Tap the exact count as soon as you spot it',
    accent: '#f43f5e',
    bgTint: '#4c0519',
    badgeText: '11',
  },
  {
    id: 'brick_smash_rush',
    num: 12,
    engine: 'board',
    category: 'reflex',
    durationSec: 22,
    nameAr: 'تكسير طوب الكنز',
    nameEn: 'Treasure Brick Smash',
    ruleAr: 'كسّر قوالب الطوب اللامعة بأسرع ما يمكن لاكتشاف النجوم والعملات الذهبية المخفية!',
    ruleEn: 'Smash glowing brick blocks fast to uncover hidden Stars & Mega Coins!',
    controlsAr: 'اضغط بسرعة على الطوب اللامع والذهبي',
    controlsEn: 'Tap glowing & golden bricks rapidly',
    accent: '#d97706',
    bgTint: '#451a03',
    badgeText: '12',
  },
  {
    id: 'bullet_bill_dodge',
    num: 13,
    engine: 'canvas',
    category: 'dodge',
    durationSec: 24,
    nameAr: 'مدافع السفينة الطائرة',
    nameEn: 'Airship Cannon Storm',
    ruleAr: 'فوق سطح سفينة باوزر الطائرة، راقب خطوط الليزر الحمراء وتفادَ صواريخ المدافع والتقط دروع الحماية والنجوم!',
    ruleEn: 'Dodge laser-sighted Bullet Bills blasting from airship cannons while grabbing Shield Bubbles & Star Crates!',
    controlsAr: 'الأسهم / WASD أو اسحب بإصبعك فوق سطح السفينة',
    controlsEn: 'Arrows / WASD or drag across the airship deck',
    accent: '#94a3b8',
    bgTint: '#0f172a',
    badgeText: '13',
  },
  {
    id: 'coin_magnet_maze',
    num: 14,
    engine: 'canvas',
    category: 'puzzle',
    durationSec: 26,
    nameAr: 'متاهة العملات والأنابيب',
    nameEn: 'Warp-Pipe Pac Maze',
    ruleAr: 'تجول داخل متاهة الطوب لجمع كل العملات، استخدم أنابيب النقل الجانبية، والتقط النجمة الخارقة لمطاردة الأشباح!',
    ruleEn: 'Navigate brick corridors grabbing gold coins, zip through Warp Tunnels, and eat Ghosts with Super Stars!',
    controlsAr: 'الأسهم / WASD أو اسحب للتوجيه داخل المتاهة',
    controlsEn: 'Arrows / WASD or touch-drag through corridors',
    accent: '#10b981',
    bgTint: '#064e3b',
    badgeText: '14',
  },
  {
    id: 'paint_tiles_party',
    num: 15,
    engine: 'canvas',
    category: 'sport',
    durationSec: 24,
    nameAr: 'حرب تلوين البلاط',
    nameEn: 'Color Turf Party',
    ruleAr: 'اركض فوق البلاطات لتلوين أكبر مساحة بلون بطلك واحصد نقاط المكافأة عند إكمال الصفوف!',
    ruleEn: 'Run over floor panels to paint the arena in your hero color — bonus for full rows!',
    controlsAr: 'الأسهم / WASD أو اسحب لتحريك بطلك',
    controlsEn: 'Arrows / WASD or drag to move your hero',
    accent: '#ec4899',
    bgTint: '#312e81',
    badgeText: '15',
  },
  {
    id: 'star_rhythm_beat',
    num: 16,
    engine: 'board',
    category: 'reflex',
    durationSec: 24,
    nameAr: 'إيقاع النجوم الموسيقي',
    nameEn: 'Star Rhythm Beat',
    ruleAr: 'اضغط على الزر الملون الصحيح لحظة وصول النوتة الموسيقية إلى حلقة النجمة الذهبية!',
    ruleEn: 'Hit the matching color lane right as the Star Note crosses the golden ring!',
    controlsAr: 'اضغط الأزرار الـ4 أو مفاتيح A S D F',
    controlsEn: 'Tap the 4 beat pads or keys A S D F',
    accent: '#06b6d4',
    bgTint: '#164e63',
    badgeText: '♪',
  },
  {
    id: 'cheep_fishing',
    num: 17,
    engine: 'board',
    category: 'reflex',
    durationSec: 24,
    nameAr: 'صيد السمك الذهبي',
    nameEn: 'Cheep-Cheep Fishing',
    ruleAr: 'انتظر وميض «اسحب الآن!» واسحب السنارة فوراً لصيد السمك الذهبي وصناديق الكنز!',
    ruleEn: 'Watch the bobber and yank the instant BITE! flashes to land Golden Cheep-Cheeps!',
    controlsAr: 'اضغط زر السحب (أو مسافة) فقط عند الوميض الذهبي',
    controlsEn: 'Tap Reel (or Space) right on the golden bite flash',
    accent: '#0ea5e9',
    bgTint: '#0c4a6e',
    badgeText: '17',
  },
  {
    id: 'penguin_ice_slide',
    num: 18,
    engine: 'canvas',
    category: 'dodge',
    durationSec: 22,
    nameAr: 'تزلج جبل الجليد',
    nameEn: 'Penguin Ice Slide',
    ruleAr: 'انزلق بسرعة على منحدر الجليد، مرّ عبر حلقات النجوم وتفادَ رجال الثلج والصخور!',
    ruleEn: 'Carve down the icy Mario slope through Star Gates while dodging snowmen!',
    controlsAr: 'الأسهم أو اللمس والسحب للتزلج',
    controlsEn: 'Arrow pad or touch & drag to carve',
    accent: '#38bdf8',
    bgTint: '#082f49',
    badgeText: '18',
  },
  {
    id: 'shell_soccer_kick',
    num: 19,
    engine: 'canvas',
    category: 'sport',
    durationSec: 22,
    nameAr: 'ركلة صدفة الكوبا',
    nameEn: 'Koopa Shell Striker',
    ruleAr: 'سدد صدفات الكوبا الخضراء والحمراء داخل المرمى المتحرك وتجاوز الحارس الآلي!',
    ruleEn: 'Blast Koopa Shells into the moving castle goal past the sliding keeper!',
    controlsAr: 'اضغط على الشاشة أو مسافة لتسديد الصدفة باتجاه المؤشر',
    controlsEn: 'Tap screen or Space to kick along the aim arrow',
    accent: '#22c55e',
    bgTint: '#14532d',
    badgeText: '19',
  },
  {
    id: 'fire_bar_jump',
    num: 20,
    engine: 'canvas',
    category: 'platform',
    durationSec: 24,
    nameAr: 'قفز الحبل الناري',
    nameEn: 'Hot Fire-Bar Jump',
    ruleAr: 'اقفز فوق حبل النار الدوار في قلعة باوزر! كل قفزة تزيد السرعة وتضاعف النقاط!',
    ruleEn: 'Leap cleanly over the spinning Castle Fire-Bar — every jump ramps up the speed!',
    controlsAr: 'مسافة / سهم فوق / لمس للقفز',
    controlsEn: 'Space / Up / Tap to jump',
    accent: '#fb923c',
    bgTint: '#431407',
    badgeText: '20',
  },
  {
    id: 'hammer_nail_bash',
    num: 21,
    engine: 'board',
    category: 'reflex',
    durationSec: 22,
    nameAr: 'مطرقة النجوم الدقيقة',
    nameEn: 'Golden Hammer Slam',
    ruleAr: 'اضرب بالمطرقة عندما يصل المؤشر للمنطقة الذهبية بالوسط لتحصل على ضربة مثالية!',
    ruleEn: 'Slam the giant Hammer right when the moving needle hits the golden center zone!',
    controlsAr: 'اضغط زر الضرب أو مسافة في اللحظة المثالية',
    controlsEn: 'Tap Slam or Space right on the golden sweet spot',
    accent: '#eab308',
    bgTint: '#422006',
    badgeText: '21',
  },
  {
    id: 'mushroom_color_dash',
    num: 22,
    engine: 'board',
    category: 'puzzle',
    durationSec: 24,
    nameAr: 'جزر الفطر الملونة',
    nameEn: 'Mushroom Mix-Up',
    ruleAr: 'شاهد لون العلم المرفوع واضغط فوراً على جزيرة الفطر المطابقة قبل أن تغرق البقية!',
    ruleEn: 'Watch the raised color flag and jump onto the matching Toadstool before others sink!',
    controlsAr: 'اضغط على الفطر المطابق للون العلم بأسرع وقت',
    controlsEn: 'Tap the Toadstool matching the raised flag color',
    accent: '#ec4899',
    bgTint: '#500724',
    badgeText: '22',
  },
  {
    id: 'bob_omb_pass',
    num: 23,
    engine: 'board',
    category: 'reflex',
    durationSec: 24,
    nameAr: 'تمرير قنبلة بوب-أومب',
    nameEn: 'Hot Bob-omb Relay',
    ruleAr: 'أدخل رموز الأمان الثلاثة الظاهرة على القنبلة بسرعة لتمريرها وكسب النقاط قبل الانفجار!',
    ruleEn: 'Tap the 3 matching safety symbols on the ticking Bob-omb to pass it before BOOM!',
    controlsAr: 'اضغط الرموز بالترتيب الصحيح بسرعة',
    controlsEn: 'Tap the matching symbols in order fast',
    accent: '#ef4444',
    bgTint: '#1f2937',
    badgeText: '23',
  },
  {
    id: 'sky_balloon_pop',
    num: 24,
    engine: 'canvas',
    category: 'dodge',
    durationSec: 24,
    nameAr: 'منطاد سماء العملات',
    nameEn: 'Sky Balloon Flight',
    ruleAr: 'حلّق بمنطاد النجوم عبر الحلقات الذهبية وفرقع بالونات العملات وتجنب الغيوم الشائكة!',
    ruleEn: 'Steer your Star Balloon through sky rings & coin balloons while dodging spiny clouds!',
    controlsAr: 'الأسهم / WASD أو المس للتحليق للأعلى والأسفل',
    controlsEn: 'Arrows / WASD or hold screen to float up & steer',
    accent: '#38bdf8',
    bgTint: '#1e3a8a',
    badgeText: '24',
  },
  {
    id: 'crown_castle_sprint',
    num: 25,
    engine: 'canvas',
    category: 'sport',
    durationSec: 26,
    nameAr: 'تحطيم قلعة التاج بالصدفة',
    nameEn: 'Crown Castle Brick-Breaker',
    ruleAr: 'حرّك الدرع الذهبي بالأسفل لترتد صدفة الكوبا وتحطّم طوب القلعة وتكسر تاج باوزر المعلّق وتسقط النجوم!',
    ruleEn: 'Slide your Royal Paddle to bounce glowing Koopa Shells into Castle Bricks & Bowser’s Crown Boss for huge points!',
    controlsAr: 'الأسهم أو اللمس والسحب لتحريك الدرع',
    controlsEn: 'Arrow pad or touch & drag to slide your paddle',
    accent: '#facc15',
    bgTint: '#312e81',
    badgeText: '♛',
  },
  // --- 5 Dedicated 3D Mario Mini-Games (Three.js) ---
  {
    id: 'kart_drift_3d',
    num: 26,
    engine: 'three3d',
    category: 'sport',
    durationSec: 26,
    nameAr: 'سباق كارت ماريو 3D',
    nameEn: 'Mario Kart Drift 3D',
    ruleAr: 'سابق عبر 5 عوالم ثلاثية الأبعاد (الفطر، الصحراء، الجليد، الحمم، قوس قزح) وتفادَ العوائق والحواجز وقشر الموز وصدفات الكوبا!',
    ruleEn: 'Race across 5 3D Worlds (Mushroom, Desert, Ice, Lava & Rainbow Road) while dodging barricades, barrels, bananas & Koopa shells!',
    controlsAr: 'الأسهم أو اللمس والسحب على الشاشة · اضغط للقفز',
    controlsEn: 'Arrows or touch-drag to steer · Tap or Space to hop',
    accent: '#ef4444',
    bgTint: '#1e3a8a',
    badgeText: '3D',
    is3D: true,
  },
  {
    id: 'sky_island_hop_3d',
    num: 27,
    engine: 'three3d',
    category: 'platform',
    durationSec: 26,
    nameAr: 'جزر السماء العائمة 3D',
    nameEn: 'Sky Island Hop 3D',
    ruleAr: 'اقفز فوق الجزر العائمة والفطر النطاط في عالم ثلاثي الأبعاد لجمع حلقات النجوم والعملات الذهبية!',
    ruleEn: 'Leap across floating 3D sky islands and mushroom bounce pads to collect Star Rings & gold coins!',
    controlsAr: 'الأسهم أو اللمس والسحب للحركة · اضغط للقفز المزدوج',
    controlsEn: 'Arrows or touch-drag to move · Tap or Space to double-jump',
    accent: '#38bdf8',
    bgTint: '#0369a1',
    badgeText: '3D',
    is3D: true,
  },
  {
    id: 'bumper_arena_3d',
    num: 28,
    engine: 'three3d',
    category: 'sport',
    durationSec: 26,
    nameAr: 'حلبة التصادم 3D',
    nameEn: 'Bumper Orbs Arena 3D',
    ruleAr: 'اركب كرة التصادم ثلاثية الأبعاد وادفع خصوم الكوبا خارج الحلبة العائمة واجمع نجوم التاج!',
    ruleEn: 'Ride your 3D Bumper Orb to knock Koopa bots off the floating sky stadium and snag Crown Stars!',
    controlsAr: 'الأسهم أو اللمس والسحب للقيادة · اضغط لاندفاعة التيربو',
    controlsEn: 'Arrows or touch-drag to roll · Tap or Space for Turbo Dash',
    accent: '#a855f7',
    bgTint: '#312e81',
    badgeText: '3D',
    is3D: true,
  },
  {
    id: 'star_stadium_3d',
    num: 29,
    engine: 'three3d',
    category: 'dodge',
    durationSec: 26,
    nameAr: 'ملعب النجوم 3D',
    nameEn: 'Star Stadium Rush 3D',
    ruleAr: 'اركض بحرية في ملعب الفطر ثلاثي الأبعاد لجمع النجوم الخارقة وتفادَ صخور الثومب المتدحرجة!',
    ruleEn: 'Sprint freely across the 3D Mushroom Stadium grabbing Super Stars while jumping rolling Thwomps!',
    controlsAr: 'الأسهم أو اللمس والسحب للركض · اضغط للقفز',
    controlsEn: 'Arrows or touch-drag to run · Tap or Space to jump',
    accent: '#facc15',
    bgTint: '#14532d',
    badgeText: '3D',
    is3D: true,
  },
  {
    id: 'bowser_tower_3d',
    num: 30,
    engine: 'three3d',
    category: 'platform',
    durationSec: 26,
    nameAr: 'قلعة الحمم النارية 3D',
    nameEn: 'Lava Fortress Run 3D',
    ruleAr: 'اندفع فوق جسر قلعة النار ثلاثي الأبعاد! احذر: لمس النار أو برك الحمم يبطئ سرعتك بشكل كبير — اقفز فوقها واجمع النجوم!',
    ruleEn: 'Dash down Bowser’s 3D Fire Castle! Watch out: touching spinning Fire-Bars or lava pools slows you down — leap over them!',
    controlsAr: 'الأسهم أو اللمس والسحب للمراوغة · اضغط للقفز',
    controlsEn: 'Arrows or touch-drag to weave · Tap or Space to jump',
    accent: '#f97316',
    bgTint: '#7c2d12',
    badgeText: '3D',
    is3D: true,
  },
];

export const MARIO_CLASSIC_MINI_GAMES: MarioMiniGameSpec[] = MARIO_MINI_GAMES.filter(
  (g) => !g.is3D
);

export const MARIO_3D_MINI_GAMES: MarioMiniGameSpec[] = MARIO_MINI_GAMES.filter(
  (g) => Boolean(g.is3D)
);

export const MARIO_MINI_GAME_MAP: Record<MarioMiniGameId, MarioMiniGameSpec> =
  MARIO_MINI_GAMES.reduce((acc, g) => {
    acc[g.id] = g;
    return acc;
  }, {} as Record<MarioMiniGameId, MarioMiniGameSpec>);

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface PartyProfile {
  uid: string;
  displayName: string;
  nameKey: string;
  friendCode: string;
  favoriteCharacter: PartyCharacterId;
  wins: number;
  starsTotal: number;
  gamesPlayed: number;
  lastSeenAtMs: number;
}

export interface PartyDirectoryEntry {
  uid: string;
  displayName: string;
  friendCode: string;
  favoriteCharacter: PartyCharacterId;
}

export interface PartyFriendRequest {
  id: string;
  fromUid: string;
  fromName: string;
  fromCode: string;
  fromCharacter: PartyCharacterId;
  toUid: string;
  toName: string;
  toCode: string;
  status: 'pending' | 'accepted' | 'declined';
}

export interface PartyFriendship {
  id: string;
  uidA: string;
  uidB: string;
  nameA: string;
  nameB: string;
  codeA: string;
  codeB: string;
  charA: PartyCharacterId;
  charB: PartyCharacterId;
}

export interface PartyInvite {
  id: string;
  fromUid: string;
  fromName: string;
  fromCharacter: PartyCharacterId;
  toUid: string;
  roomCode: string;
  mode: 'cup' | 'single';
  gameId: MarioMiniGameId;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
}

export interface PartyRoom {
  roomCode: string;
  hostUid: string;
  hostName: string;
  status: 'lobby' | 'playing' | 'round_result' | 'podium' | 'closed';
  mode: 'cup' | 'single';
  currentGameId: MarioMiniGameId;
  roundIndex: number;
  totalRounds: number;
  roundSeed: number;
  roundStartedAtMs: number;
  roundDurationSec: number;
  cupQueue: MarioMiniGameId[];
  winnerUid: string;
  winnerName: string;
}

export interface PartyRoomPlayer {
  uid: string;
  roomCode: string;
  displayName: string;
  characterId: PartyCharacterId;
  ready: boolean;
  stars: number;
  coins: number;
  roundScore: number;
  roundProgress: number;
  roundDone: boolean;
}

export interface MarioPartyLocalStats {
  gamesPlayed: number;
  wins: number;
  starsTotal: number;
  bestScore: number;
}

const MARIO_PARTY_STATS_KEY = 'point_catcher_mario_party_stats_v1';

export function readMarioPartyStats(): MarioPartyLocalStats {
  if (typeof window === 'undefined') {
    return { gamesPlayed: 0, wins: 0, starsTotal: 0, bestScore: 0 };
  }
  try {
    const raw = window.localStorage.getItem(MARIO_PARTY_STATS_KEY);
    if (!raw) return { gamesPlayed: 0, wins: 0, starsTotal: 0, bestScore: 0 };
    const p = JSON.parse(raw) as Partial<MarioPartyLocalStats>;
    const num = (v: unknown) =>
      typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0;
    return {
      gamesPlayed: num(p.gamesPlayed),
      wins: num(p.wins),
      starsTotal: num(p.starsTotal),
      bestScore: num(p.bestScore),
    };
  } catch {
    return { gamesPlayed: 0, wins: 0, starsTotal: 0, bestScore: 0 };
  }
}

export function recordMarioPartyLocalStats(update: {
  won: boolean;
  stars: number;
  bestRoundScore: number;
}): MarioPartyLocalStats {
  const cur = readMarioPartyStats();
  const next: MarioPartyLocalStats = {
    gamesPlayed: cur.gamesPlayed + 1,
    wins: cur.wins + (update.won ? 1 : 0),
    starsTotal: cur.starsTotal + Math.max(0, Math.floor(update.stars)),
    bestScore: Math.max(cur.bestScore, Math.max(0, Math.floor(update.bestRoundScore))),
  };
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(MARIO_PARTY_STATS_KEY, JSON.stringify(next));
    } catch {
      // ignore storage quota errors
    }
  }
  return next;
}
