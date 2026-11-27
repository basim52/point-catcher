import React, { useEffect } from 'react';
import { HeroAvatarSvg } from './CharacterArt';
import {
  MARIO_MINI_GAME_MAP,
  PARTY_CHARACTER_MAP,
  type MarioMiniGameId,
  type PartyCharacterId,
} from './types';

export interface MiniGameTutorialSpec {
  goalAr: string;
  goalEn: string;
  stepsAr: [string, string, string];
  stepsEn: [string, string, string];
  keysAr: string[];
  keysEn: string[];
  doAr: string;
  doEn: string;
  avoidAr: string;
  avoidEn: string;
}

export const MARIO_MINI_GAME_TUTORIALS: Record<MarioMiniGameId, MiniGameTutorialSpec> = {
  coin_block_bash: {
    goalAr: 'اضرب مربعات (؟) الذهبية من الأسفل لتجمع أكبر عدد من العملات والنجوم!',
    goalEn: 'Jump under golden ? blocks to pop out the most coins and stars!',
    stepsAr: [
      'تحرّك يميناً ويساراً للوقوف مباشرة تحت مربع (؟) الذهبي.',
      'اقفز لتضرب المربع برأسك فتتناثر العملات وتحسب لك نقاطاً فورية.',
      'تابع المربعات المضيئة باستمرار لتصنع سلسلة نقاط عالية.',
    ],
    stepsEn: [
      'Move left or right to stand directly beneath a glowing ? block.',
      'Jump to bash the block from below and pop out gold coins.',
      'Keep chaining glowing blocks to rack up a huge score.',
    ],
    keysAr: ['◀ ▶ أو A / D', 'مسافة / لمس للقفز'],
    keysEn: ['◀ ▶ or A / D', 'Space / Tap to Jump'],
    doAr: 'اضرب مربعات ؟ الذهبية والنجوم (+نقاط مضاعفة)',
    doEn: 'Bash golden ? blocks & Stars (+bonus points)',
    avoidAr: 'تجنّب المربعات الحمراء الشائكة لأنها تعطّلك وتخصم نقاطاً',
    avoidEn: 'Avoid red spike blocks — they stun you and cost points',
  },
  pipe_sprint: {
    goalAr: 'اقفز فوق الأنابيب الخضراء أثناء الركض واجمع نجوم السرعة!',
    goalEn: 'Hurdle green warp pipes at full speed and grab speed stars!',
    stepsAr: [
      'بطلك يركض للأمام تلقائياً — ركّز تماماً على توقيت القفز.',
      'اضغط للقفز قبل الوصول لكل أنبوب أخضر، واضغط مرة ثانية بالهواء للقفزة المزدوجة.',
      'التقط النجوم والعملات المعلّقة فوق الأنابيب لمضاعفة رصيدك.',
    ],
    stepsEn: [
      'Your hero sprints automatically — focus on crisp jump timing.',
      'Tap to jump over green pipes, and tap again mid-air for a double jump.',
      'Snag stars and coins floating above pipes to boost your score.',
    ],
    keysAr: ['مسافة / ▲', 'لمس الشاشة (قفزة مزدوجة)'],
    keysEn: ['Space / ▲', 'Tap Screen (Double Jump)'],
    doAr: 'القفز النظيف فوق الأنابيب وجمع النجوم بالهواء',
    doEn: 'Clean pipe hurdles & mid-air Star pickups',
    avoidAr: 'الاصطدام بالأنابيب الخضراء يبطئك ويوقف سلسلتك',
    avoidEn: 'Crashing into pipes slows you down and breaks streaks',
  },
  star_rain_catch: {
    goalAr: 'التقط النجوم والعملات المتساقطة من السماء وتفادَ القنابل والصخور!',
    goalEn: 'Catch falling Super Stars and coins while dodging bombs and stones!',
    stepsAr: [
      'حرّك بطلك يميناً ويساراً أسفل الشاشة بسرعة ومرونة.',
      'اتجه نحو النجوم الخارقة والعملات اللامعة لالتقاطها قبل سقوطها.',
      'ابتعد فوراً عن قنابل بوب-أومب السوداء وصخور ثومب الثقيلة.',
    ],
    stepsEn: [
      'Slide your hero left and right quickly along the bottom.',
      'Catch glowing Super Stars and gold coins before they hit the ground.',
      'Dodge dark Bob-ombs and heavy Thwomp stones at all costs.',
    ],
    keysAr: ['◀ ▶ أو A / D', 'السحب بالإصبع يمين ويسار'],
    keysEn: ['◀ ▶ or A / D', 'Drag Left & Right'],
    doAr: 'النجوم الخارقة الذهبية تمنحك أكبر عدد نقاط',
    doEn: 'Golden Super Stars award the highest points',
    avoidAr: 'قنابل بوب-أومب وصخور ثومب تخصم من نقاطك',
    avoidEn: 'Bob-ombs and Thwomp stones deduct points on hit',
  },
  cloud_tower_climb: {
    goalAr: 'اصعد أعلى برج السحاب بالقفز من سحابة لأخرى وجمع العملات!',
    goalEn: 'Climb as high as possible bouncing from cloud to cloud!',
    stepsAr: [
      'بطلك يقفز تلقائياً كلما هبط على سحابة.',
      'وجّه بطلك يميناً ويساراً أثناء الصعود لتهبط على السحابة التالية.',
      'مرّ عبر حلقات العملات والنجوم لزيادة ارتفاعك ونقاطك بسرعة.',
    ],
    stepsEn: [
      'Your hero bounces upward automatically on every cloud.',
      'Steer left and right in mid-air to land safely on higher clouds.',
      'Pass through coin rings and stars for extra height and score.',
    ],
    keysAr: ['◀ ▶ أو A / D', 'اسحب للتوجيه (قفز تلقائي)'],
    keysEn: ['◀ ▶ or A / D', 'Drag to Steer (Auto-Bounce)'],
    doAr: 'السحابات النطاطة وحلقات النجوم تدفعك لأعلى سريعاً',
    doEn: 'Spring clouds & Star rings launch you higher fast',
    avoidAr: 'لا تسقط في الفراغ بين السحب حتى لا تخسر الارتفاع',
    avoidEn: 'Do not fall through gaps between clouds',
  },
  balloon_pump_burst: {
    goalAr: 'انفخ بالونات باوزر بسرعة لتفجير أكبر عدد منها قبل انتهاء الوقت!',
    goalEn: 'Pump Bowser balloons fast to burst as many as you can!',
    stepsAr: [
      'اضغط زر «نفخ» أو المسافة بسرعة متواصلة لتكبير البالون.',
      'راقب عدّاد الحرارة — إذا اقترب من الأحمر توقف نصف ثانية ليبرد.',
      'كل بالون ينفجر يمنحك نقاطاً ضخمة ويظهر بالون جديد فوراً.',
    ],
    stepsEn: [
      'Tap the Pump button or Space rapidly to inflate the balloon.',
      'Watch the heat gauge — pause briefly before it hits red to cool down.',
      'Every balloon burst gives huge points and spawns the next one.',
    ],
    keysAr: ['زر النفخ على الشاشة', 'مفتاح المسافة (Space)'],
    keysEn: ['On-Screen Pump Button', 'Spacebar Rapid Tap'],
    doAr: 'إيقاع ضغط سريع ومنتظم قبل وصول الحرارة للحد الأقصى',
    doEn: 'Fast steady pumping right below the overheat line',
    avoidAr: 'سخونة المنفاخ الكاملة تعطل الضغط لثوانٍ ثمينة',
    avoidEn: 'Overheating locks the pump for precious seconds',
  },
  lava_bridge_dash: {
    goalAr: 'تحرّك فوق بلاطات الحمم قبل أن تتشقق وتغرق واجمع زهور النار والنجوم!',
    goalEn: 'Keep moving across crumbling lava tiles while grabbing Fire Flowers & Stars!',
    stepsAr: [
      'كل بلاطة تقف عليها تبدأ بالتشقق والاهتزاز ثم تسقط في الحمم.',
      'لا تتوقف في مكان واحد — انتقل دائماً إلى البلاطات السليمة المجاورة.',
      'التقط زهور النار والنجوم الظاهرة فوق البلاط لرفع رصيدك.',
    ],
    stepsEn: [
      'Every tile you step on cracks and sinks into the lava behind you.',
      'Never stand still — keep dashing onto solid neighboring tiles.',
      'Grab Fire Flowers and Super Stars on tiles for big points.',
    ],
    keysAr: ['الأسهم / WASD', 'السحب بالإصبع في كل الاتجاهات'],
    keysEn: ['Arrows / WASD', 'Touch-Drag Anywhere'],
    doAr: 'التنقل المستمر وجمع النجوم وزهور النار',
    doEn: 'Keep moving and snag Stars & Fire Flowers',
    avoidAr: 'الوقوف طويلاً على بلاطة متشققة أو السقوط في الحمم',
    avoidEn: 'Lingering on cracked tiles or falling into molten lava',
  },
  whack_goomba: {
    goalAr: 'اضغط بسرعة على الغومبا والفطر الذهبي الخارجة من الـ 9 أنابيب!',
    goalEn: 'Whack Goombas and Golden Mushrooms popping out of the 9 pipes!',
    stepsAr: [
      'راقب الأنابيب الـ 9 — ستخرج منها شخصيات غومبا وفطر ذهبي بسرعة.',
      'اضغط فوراً على الغومبا أو الفطر الذهبي قبل أن يختبئ مجدداً.',
      'توقف ولا تلمس أي قنبلة بوب-أومب تخرج من الأنابيب!',
    ],
    stepsEn: [
      'Watch all 9 pipes as Goombas and Golden Mushrooms pop up.',
      'Tap them quickly (or press keys 1–9) before they duck back down.',
      'Hold your tap whenever a dark Bob-omb appears!',
    ],
    keysAr: ['اللمس / النقر على الأنابيب', 'مفاتيح الأرقام 1 – 9'],
    keysEn: ['Tap / Click Pipes', 'Number Keys 1 – 9'],
    doAr: 'الفطر الذهبي يعطي نقاطاً مضاعفة والغومبا يرفع سلسلتك',
    doEn: 'Golden Mushrooms give bonus points & Goombas build combos',
    avoidAr: 'لا تضرب القنابل أبداً لأنها تخصم نقاطك فوراً',
    avoidEn: 'Never hit Bob-ombs — they explode and deduct points',
  },
  mushroom_memory: {
    goalAr: 'احفظ أماكن النجوم أثناء الوميض ثم افتح كل مربعات النجوم بدقة!',
    goalEn: 'Memorize the Star panels during the flash, then tap every Star!',
    stepsAr: [
      'في بداية كل لوحة ستظهر أماكن النجوم والقنابل لثانيتين — ركّز جيداً!',
      'بعد اختفاء اللوحة، اضغط على المربعات التي كانت تحتوي على النجوم.',
      'إكمال كل النجوم في اللوحة يمنحك مكافأة وينقلك للوحة جديدة.',
    ],
    stepsEn: [
      'At the start of each board, Stars flash briefly — memorize their spots!',
      'Once hidden, tap every panel that concealed a Super Star.',
      'Clearing a full board awards a big bonus and starts the next round.',
    ],
    keysAr: ['اللمس / النقر على المربعات'],
    keysEn: ['Tap / Click Memory Panels'],
    doAr: 'فتح جميع النجوم بدون أخطاء يعطيك مكافأة لوحة كاملة',
    doEn: 'Finding all Stars cleanly awards a full-board bonus',
    avoidAr: 'تجنّب فتح المربعات التي كانت تحتوي قنابل',
    avoidEn: 'Avoid tapping panels that hid bombs',
  },
  fireball_duel: {
    goalAr: 'صوّب وأطلق كرات النار على أهداف الكوبا والنجوم المتحركة!',
    goalEn: 'Aim and fire Mario Fireballs at moving Koopa targets and stars!',
    stepsAr: [
      'وجّه التصويب نحو الأهداف المتحركة باللمس أو بتحريك الفأرة.',
      'اضغط لإطلاق كرة النار بدقة نحو الأهداف والحلقات الذهبية.',
      'الإصابات المتتالية ترفع مضاعف السلسلة وتزيد نقاطك سريعاً.',
    ],
    stepsEn: [
      'Aim at the moving targets by moving your mouse or tapping the screen.',
      'Fire Mario Fireballs at Koopa targets and golden star rings.',
      'Consecutive hits raise your combo multiplier for huge scores.',
    ],
    keysAr: ['لمس الشاشة للتصويب والإطلاق', 'الفأرة + النقر'],
    keysEn: ['Tap Screen to Aim & Fire', 'Mouse Aim + Click'],
    doAr: 'إصابة الأهداف الذهبية والنجوم المتتالية بدون إضاعة',
    doEn: 'Hitting golden targets & chaining streaks without misses',
    avoidAr: 'تجنّب إطلاق النار على الأهداف الحمراء المفخخة',
    avoidEn: 'Watch out for decoy red hazard targets',
  },
  boo_red_light: {
    goalAr: 'اركض نحو علم النجمة عندما ينام الشبح بو، وتجمّد فوراً عندما يلتفت!',
    goalEn: 'Sprint to the Star Flag while Boo sleeps — freeze when Boo looks!',
    stepsAr: [
      'عندما يكون الشبح بو نائماً والضوء أخضر، اضغط باستمرار للركض بأقصى سرعة.',
      'انتبه لإشارة التحذير الصفراء قبل التفات الشبح بو.',
      'ارفع إصبعك فوراً وتجمّد عندما يتحول الضوء للأحمر ويلتفت الشبح!',
    ],
    stepsEn: [
      'While Boo sleeps (Green Light), hold down to sprint toward the Star Flag.',
      'Watch the yellow warning cue right before Boo turns around.',
      'Release immediately and FREEZE when Boo looks back (Red Light)!',
    ],
    keysAr: ['اضغط باستمرار على زر الركض', 'أو استمر بالضغط على مسافة (Space)'],
    keysEn: ['Hold Run Button / Screen', 'or Hold Spacebar'],
    doAr: 'التقدم السريع أثناء الضوء الأخضر والوصول لعلم النجمة',
    doEn: 'Sprinting cleanly on Green Light & reaching the Star Flag',
    avoidAr: 'الحركة أثناء نظر الشبح بو ترجعك للخلف وتفقدك وقتاً',
    avoidEn: 'Moving while Boo watches pushes you back',
  },
  count_toads: {
    goalAr: 'عدّ فطر تودي المار على المسرح بدقة واختر الرقم الصحيح بسرعة!',
    goalEn: 'Count every Toad crossing the stage and pick the exact number fast!',
    stepsAr: [
      'راقب الموكب العابر على المسرح وعدّ شخصيات «فطر تودي» فقط.',
      'لا تخلط بين تودي والشخصيات الأخرى التي تمر للتشتيت.',
      'اضغط على الرقم الصحيح فور ظهور الخيارات لتحصل على نقاط السرعة.',
    ],
    stepsEn: [
      'Watch the parade closely and count ONLY the Toads crossing the stage.',
      'Ignore decoy characters marching in the parade.',
      'Tap the exact number right away for a speed bonus.',
    ],
    keysAr: ['اضغط على الرقم الصحيح'],
    keysEn: ['Tap the Exact Count Option'],
    doAr: 'الإجابة الصحيحة السريعة تمنحك نقاطاً إضافية',
    doEn: 'Fast accurate answers earn speed bonus points',
    avoidAr: 'التخمين الخاطئ يضيّع نقاط الجولة',
    avoidEn: 'Wrong guesses forfeit points for that wave',
  },
  brick_smash_rush: {
    goalAr: 'كسّر قوالب الطوب اللامعة بأسرع ما يمكن لكشف النجوم والعملات!',
    goalEn: 'Smash glowing brick blocks fast to uncover Stars and Mega Coins!',
    stepsAr: [
      'اضغط بسرعة متواصلة على قوالب الطوب اللامعة والذهبية في الشبكة.',
      'الطوب الذهبي والنجوم المخفية تعطي نقاطاً أعلى بكثير.',
      'كلما كسّرت لوحة كاملة ظهرت لوحة طوب جديدة فوراً.',
    ],
    stepsEn: [
      'Tap glowing and golden brick blocks across the grid rapidly.',
      'Golden bricks and hidden Stars pay out huge bonus points.',
      'Clearing a grid instantly spawns a fresh treasure wall.',
    ],
    keysAr: ['لمس / نقر سريع على الطوب'],
    keysEn: ['Rapid Tap / Click on Bricks'],
    doAr: 'ركّز أولاً على الطوب الذهبي اللامع للنجوم المضاعفة',
    doEn: 'Prioritize sparkling golden bricks for Star bursts',
    avoidAr: 'تجنّب الطوب الشائك الداكن لأنه يبطئ إيقاعك',
    avoidEn: 'Avoid dark spiked blocks that slow your streak',
  },
  bullet_bill_dodge: {
    goalAr: 'تفادَ صواريخ المدافع فوق سطح السفينة الطائرة واجمع النجوم والدروع!',
    goalEn: 'Dodge airship Bullet Bills while collecting Stars and Shield Bubbles!',
    stepsAr: [
      'راقب خطوط الليزر الحمراء — إنها تحذرك من مسار الصاروخ قبل إطلاقه.',
      'حرّك بطلك بسرعة بعيداً عن خط الليزر قبل مرور الصاروخ.',
      'التقط فقاعات الدرع وصناديق النجوم لحماية نفسك وزيادة النقاط.',
    ],
    stepsEn: [
      'Watch the red laser sightlines — they telegraph every incoming cannon shot.',
      'Move out of the laser lane before the Bullet Bill blasts across.',
      'Grab Shield Bubbles and Star Crates for safety and big points.',
    ],
    keysAr: ['الأسهم / WASD', 'السحب بالإصبع فوق السفينة'],
    keysEn: ['Arrows / WASD', 'Touch-Drag on Airship Deck'],
    doAr: 'جمع النجوم والبقاء بدون إصابة يرفع نقاطك باستمرار',
    doEn: 'Snagging Stars & staying unhit builds continuous score',
    avoidAr: 'خطوط الليزر الحمراء وصواريخ المدافع المباشرة',
    avoidEn: 'Red laser paths and direct Bullet Bill impacts',
  },
  coin_magnet_maze: {
    goalAr: 'اجمع عملات المتاهة واستخدم الأنابيب الجانبية واطرد الأشباح بالنجمة!',
    goalEn: 'Collect maze coins, zip through Warp Tunnels, and chase Ghosts with Stars!',
    stepsAr: [
      'تنقّل داخل ممرات الطوب واجمع العملات الذهبية في طريقك.',
      'استخدم أنابيب النقل على جانبي المتاهة للهروب السريع والانتقال للجهة الأخرى.',
      'التقط النجمة الخارقة لتصبح خارقاً وتطارد الأشباح لنقاط ضخمة!',
    ],
    stepsEn: [
      'Navigate the brick corridors grabbing gold coins along the way.',
      'Use side Warp Pipes to teleport across the maze and escape Ghosts.',
      'Grab a Super Star to power up and chomp Ghosts for massive points!',
    ],
    keysAr: ['الأسهم / WASD', 'السحب بالإصبع لتغيير الاتجاه'],
    keysEn: ['Arrows / WASD', 'Swipe / Drag to Turn'],
    doAr: 'النجمة الخارقة + مطاردة الأشباح + إكمال ممرات العملات',
    doEn: 'Super Stars + chasing Ghosts + clearing coin corridors',
    avoidAr: 'لمس الأشباح قبل التقاط النجمة الخارقة',
    avoidEn: 'Touching Ghosts without a Super Star active',
  },
  paint_tiles_party: {
    goalAr: 'اركض فوق البلاطات لتلوين أكبر مساحة بلون بطلك قبل نهاية الوقت!',
    goalEn: 'Run over floor tiles to paint the biggest area in your hero color!',
    stepsAr: [
      'تحرّك في جميع الاتجاهات — كل بلاطة تدوس عليها تتلون بلون بطلك.',
      'حاول إكمال صفوف أو مناطق متصلة لتحصل على مكافآت نقاط إضافية.',
      'التقط النجوم الذهبية التي تظهر على الأرض لرشّ مساحة أكبر دفعة واحدة!',
    ],
    stepsEn: [
      'Run in all directions — every tile you step on paints in your color.',
      'Complete full rows and large zones for extra turf bonuses.',
      'Pick up Super Stars to paint extra tiles and rack up points!',
    ],
    keysAr: ['الأسهم / WASD', 'السحب بالإصبع لتحريك بطلك'],
    keysEn: ['Arrows / WASD', 'Touch-Drag to Move'],
    doAr: 'تلوين البلاطات الفارغة وإكمال الصفوف الكاملة',
    doEn: 'Painting fresh tiles & completing full rows',
    avoidAr: 'إضاعة الوقت بالركض فوق بلاطات سبق تلوينها',
    avoidEn: 'Wasting time running over already-painted tiles',
  },
  star_rhythm_beat: {
    goalAr: 'اضغط على الزر الملون الصحيح لحظة وصول النوتة إلى حلقة النجمة الذهبية!',
    goalEn: 'Hit the matching color pad right as the note crosses the golden ring!',
    stepsAr: [
      'تابع النوتات الملونة وهي تنزل في المسارات الأربعة نحو الأسفل.',
      'اضغط الزر المطابق (أو A / S / D / F) فور ملامسة النوتة للحلقة الذهبية.',
      'كل ضغطة «مثالية» متتالية تضاعف نقاطك بشكل كبير!',
    ],
    stepsEn: [
      'Watch the colored star notes drop down the 4 rhythm lanes.',
      'Tap the matching pad (or keys A S D F) right inside the golden ring.',
      'Chaining Perfect hits multiplies your score rapidly!',
    ],
    keysAr: ['الأزرار الملونة الـ 4', 'مفاتيح A · S · D · F'],
    keysEn: ['4 Color Beat Pads', 'Keys A · S · D · F'],
    doAr: 'التوقيت الدقيق داخل الحلقة الذهبية (ضربة مثالية!)',
    doEn: 'Spot-on timing inside the golden ring (Perfect!)',
    avoidAr: 'الضغط المبكر جداً أو المتأخر يقطع سلسلة الإيقاع',
    avoidEn: 'Pressing too early or too late breaks your combo',
  },
  cheep_fishing: {
    goalAr: 'انتظر وميض «اسحب الآن!» واسحب السنارة فوراً لصيد السمك الذهبي!',
    goalEn: 'Wait for the golden BITE! flash and reel in Golden Cheep-Cheeps!',
    stepsAr: [
      'راقب طوافة الصيد في الماء بهدوء ولا تسحب قبل الإشارة.',
      'بمجرد ظهور الوميض الذهبي «اسحب الآن!»، اضغط زر السحب أو المسافة فوراً.',
      'كلما كانت استجابتك أسرع اصطدت أسماكاً ذهبية وصناديق كنز أثمن!',
    ],
    stepsEn: [
      'Watch the bobber calmly — do not yank before the signal.',
      'The instant the golden BITE! flash appears, hit Reel or Space.',
      'Faster reflexes reel in Golden Cheep-Cheeps and treasure chests!',
    ],
    keysAr: ['زر «اسحب!» على الشاشة', 'مفتاح المسافة (Space)'],
    keysEn: ['On-Screen Reel Button', 'Spacebar'],
    doAr: 'السحب الفوري لحظة الوميض الذهبي',
    doEn: 'Instant yank right on the golden bite flash',
    avoidAr: 'السحب المبكر قبل الإشارة يخيف السمكة ويضيع المحاولة',
    avoidEn: 'Reeling too early scares the fish away',
  },
  penguin_ice_slide: {
    goalAr: 'انزلق عبر حلقات النجوم على الجبل الجليدي وتفادَ رجال الثلج والصخور!',
    goalEn: 'Carve down the icy slope through Star Gates while dodging snowmen!',
    stepsAr: [
      'وجّه بطلك يميناً ويساراً أثناء الانزلاق السريع على الجليد.',
      'مرّ داخل بوابات وحلقات النجوم الذهبية لكسب نقاط عالية.',
      'ابتعد عن رجال الثلج والصخور الجليدية في منتصف المنحدر.',
    ],
    stepsEn: [
      'Steer left and right smoothly as you carve down the ice track.',
      'Pass right through glowing Star Gates and coin lines for big points.',
      'Weave around snowmen and icy boulders blocking the slope.',
    ],
    keysAr: ['◀ ▶ أو A / D', 'اللمس والسحب للتزلج'],
    keysEn: ['◀ ▶ or A / D', 'Touch & Drag to Carve'],
    doAr: 'المرور عبر حلقات النجوم الذهبية المتتالية',
    doEn: 'Chaining golden Star Gates down the slope',
    avoidAr: 'الاصطدام برجال الثلج والصخور يبطئ تزلجك',
    avoidEn: 'Hitting snowmen or boulders slows your run',
  },
  shell_soccer_kick: {
    goalAr: 'سدد صدفات الكوبا داخل المرمى المتحرك وتجاوز الحارس الآلي!',
    goalEn: 'Kick Koopa Shells into the moving goal past the keeper!',
    stepsAr: [
      'راقب سهم التصويب المتحرك وحركة الحارس أمام المرمى.',
      'اضغط على الشاشة أو المسافة في اللحظة التي يتجه فيها السهم نحو الزاوية الفارغة.',
      'الصدفات الحمراء والزوايا الصعبة تمنحك نقاط أهداف مضاعفة!',
    ],
    stepsEn: [
      'Track the sweeping aim arrow and the sliding goalkeeper.',
      'Tap the screen or press Space when the arrow points to an open corner.',
      'Red shells and clean corner goals score bonus points!',
    ],
    keysAr: ['لمس الشاشة للتسديد', 'مفتاح المسافة (Space)'],
    keysEn: ['Tap Screen to Kick', 'Spacebar'],
    doAr: 'التسديد في الزاوية البعيدة عن الحارس لبناء سلسلة أهداف',
    doEn: 'Aiming for open corners to build a goal streak',
    avoidAr: 'التسديد مباشرة نحو الحارس يصد الكرة',
    avoidEn: 'Shooting straight into the keeper gets blocked',
  },
  fire_bar_jump: {
    goalAr: 'اقفز فوق حبل النار الدوار في قلعة باوزر وكلما صمدت تضاعفت النقاط!',
    goalEn: 'Jump cleanly over the spinning Castle Fire-Bar as it speeds up!',
    stepsAr: [
      'راقب دوران حبل النار — كلما اقترب من قدمي بطلك استعد للقفز.',
      'اضغط المسافة أو المس الشاشة للقفز فوق اللهب في الوقت المناسب.',
      'مع كل قفزة ناجحة تزيد السرعة وتكسب نقاطاً أعلى!',
    ],
    stepsEn: [
      'Watch the spinning Fire-Bar — get ready as it sweeps toward your hero.',
      'Tap the screen or press Space to leap cleanly over the flames.',
      'Every successful jump speeds up the bar and boosts your points!',
    ],
    keysAr: ['مسافة / ▲', 'لمس الشاشة للقفز'],
    keysEn: ['Space / ▲', 'Tap Screen to Jump'],
    doAr: 'قفزات متتالية نظيفة دون لمس النار',
    doEn: 'Clean consecutive jumps without touching fire',
    avoidAr: 'لمس شريط النار يصعقك ويوقف سلسلتك',
    avoidEn: 'Touching the Fire-Bar stuns you and resets your streak',
  },
  hammer_nail_bash: {
    goalAr: 'اضرب بالمطرقة لحظة وصول المؤشر للمنطقة الذهبية بالوسط!',
    goalEn: 'Slam the Golden Hammer right when the needle hits the gold center!',
    stepsAr: [
      'راقب المؤشر وهو يتحرك ذهاباً وإياباً فوق شريط القوة.',
      'اضغط زر الضرب أو المسافة تماماً عندما يمر المؤشر فوق المنطقة الذهبية.',
      'الضربات المثالية المتتالية ترفع نقاطك أضعافاً مضاعفة!',
    ],
    stepsEn: [
      'Watch the needle swing back and forth across the power bar.',
      'Tap Slam or Space right inside the golden sweet spot in the center.',
      'Chaining Perfect slams skyrockets your score!',
    ],
    keysAr: ['زر الضرب على الشاشة', 'مفتاح المسافة (Space)'],
    keysEn: ['On-Screen Slam Button', 'Spacebar'],
    doAr: 'إصابة المنطقة الذهبية بالمنتصف (ضربة مثالية!)',
    doEn: 'Landing dead-center in the golden zone (Perfect!)',
    avoidAr: 'الضرب خارج المنطقة الملونة يعطي نقاطاً ضعيفة',
    avoidEn: 'Missing the colored zone scores very little',
  },
  mushroom_color_dash: {
    goalAr: 'شاهد لون العلم المرفوع واضغط فوراً على جزيرة الفطر المطابقة!',
    goalEn: 'Match the raised flag color and jump onto that Toadstool fast!',
    stepsAr: [
      'انتبه إلى لون العلم الذي يرتفع في أعلى اللوحة.',
      'اضغط بأسرع وقت على جزيرة الفطر التي تحمل نفس اللون تماماً.',
      'ستغرق الجزر الأخرى — السرعة والدقة تمنحك نقاطاً عالية!',
    ],
    stepsEn: [
      'Spot the color of the flag raised at the top of the board.',
      'Tap the matching Toadstool island as quickly as possible.',
      'All other mushrooms sink — fast accurate picks score big!',
    ],
    keysAr: ['اللمس / النقر على الفطر المطابق'],
    keysEn: ['Tap / Click Matching Toadstool'],
    doAr: 'القفز السريع للون الصحيح فور رفع العلم',
    doEn: 'Instant jumps to the matching flag color',
    avoidAr: 'اختيار لون خاطئ يُغرقك ويخصم نقاط الجولة',
    avoidEn: 'Picking the wrong color drops you in the water',
  },
  bob_omb_pass: {
    goalAr: 'اضغط الرموز الثلاثة الظاهرة على القنبلة بالترتيب لتمريرها قبل الانفجار!',
    goalEn: 'Tap the 3 safety symbols shown on the Bob-omb in order before BOOM!',
    stepsAr: [
      'انظر إلى الرموز الثلاثة المطلوبة فوق قنبلة بوب-أومب.',
      'اضغط نفس الرموز بالترتيب الصحيح من اليسار لليمين بأقصى سرعة.',
      'إتمام الترتيب يمرر القنبلة ويكسبك نقاطاً قبل نفاد الفتيل!',
    ],
    stepsEn: [
      'Read the 3 target symbols shown on the ticking Bob-omb.',
      'Tap those exact symbols in order as fast as you can.',
      'Completing the code passes the bomb safely for big points!',
    ],
    keysAr: ['اضغط أزرار الرموز بالترتيب'],
    keysEn: ['Tap Symbol Buttons in Order'],
    doAr: 'إكمال التمرير بسرعة قبل قِصَر الفتيل',
    doEn: 'Fast clean relays while plenty of fuse remains',
    avoidAr: 'الضغط على رمز خاطئ أو التأخر حتى انفجار القنبلة',
    avoidEn: 'Wrong symbols or letting the fuse burn out',
  },
  sky_balloon_pop: {
    goalAr: 'حلّق بمنطاد النجوم عبر الحلقات الذهبية وفرقع بالونات العملات!',
    goalEn: 'Fly your Star Balloon through golden rings and pop coin balloons!',
    stepsAr: [
      'استمر باللمس أو استخدم الأسهم للارتفاع والهبوط بسلاسة في السماء.',
      'مرّ عبر الحلقات الذهبية وفرقع بالونات العملات لزيادة نقاطك.',
      'تفادَ الغيوم الرعدية الشائكة لأنها تهز المنطاد وتخصم نقاطاً.',
    ],
    stepsEn: [
      'Hold screen or use Arrows/WASD to float up and steer smoothly.',
      'Fly through golden rings and pop coin balloons for points.',
      'Weave past dark spiky storm clouds along the skyway.',
    ],
    keysAr: ['الأسهم / WASD', 'اللمس للتحليق والتوجيه'],
    keysEn: ['Arrows / WASD', 'Hold & Steer to Fly'],
    doAr: 'الحلقات الذهبية وبالونات النجوم المتتالية',
    doEn: 'Golden sky rings & coin balloon clusters',
    avoidAr: 'الغيوم الشائكة والبرق في السماء',
    avoidEn: 'Spiky storm clouds that knock you back',
  },
  crown_castle_sprint: {
    goalAr: 'حرّك الدرع الذهبي لترتد صدفة الكوبا وتحطّم طوب القلعة وتاج باوزر!',
    goalEn: 'Slide your Royal Paddle to bounce Koopa Shells and shatter Bowser’s Crown!',
    stepsAr: [
      'حرّك الدرع الذهبي أسفل الشاشة لتستقبل صدفة الكوبا المرتدة.',
      'وجّه الارتداد نحو طوب القلعة الملون ونحو تاج باوزر المعلّق بالأعلى.',
      'لا تدع الصدفة تسقط أسفل الدرع وحطّم أكبر قدر من الطوب والنجوم!',
    ],
    stepsEn: [
      'Slide your Royal Paddle along the bottom to rebound Koopa Shells.',
      'Aim bounces into Castle Bricks and Bowser’s floating Crown Boss.',
      'Keep the shell in play to drop Stars and rack up huge combos!',
    ],
    keysAr: ['◀ ▶ أو A / D', 'اللمس والسحب لتحريك الدرع'],
    keysEn: ['◀ ▶ or A / D', 'Touch & Drag Paddle'],
    doAr: 'إصابة تاج باوزر والطوب الذهبي لسقوط النجوم',
    doEn: 'Hitting Bowser’s Crown & gold bricks for Star drops',
    avoidAr: 'سقوط الصدفة أسفل الدرع يضيّع سلسلتك',
    avoidEn: 'Letting the shell fall past your paddle',
  },
  kart_drift_3d: {
    goalAr: 'سابق عبر 5 عوالم ثلاثية الأبعاد واجمع النجوم وتفادَ العوائق والموز!',
    goalEn: 'Race through 5 3D Worlds grabbing Stars while dodging obstacles!',
    stepsAr: [
      'وجّه سيارتك يميناً ويساراً على المضمار ثلاثي الأبعاد عبر الأسهم أو السحب.',
      'اقفز فوق الحواجز وقشر الموز وصدفات الكوبا بضغط المسافة أو اللمس.',
      'التقط العملات والنجوم الذهبية وسهام التسريع لتتقدم بأقصى سرعة!',
    ],
    stepsEn: [
      'Steer your 3D kart left and right across the track with Arrows or drag.',
      'Hop over barricades, bananas, and Koopa shells using Space or Tap.',
      'Hit boost pads and collect gold coins & Stars to surge ahead!',
    ],
    keysAr: ['◀ ▶ أو السحب للتوجيه', 'مسافة / لمس للقفز'],
    keysEn: ['◀ ▶ or Drag to Steer', 'Space / Tap to Hop'],
    doAr: 'النجوم الذهبية ومناطق التسريع لتعزيز النقاط',
    doEn: 'Gold Stars & turbo pads for top speed and points',
    avoidAr: 'الحواجز والبراميل وقشر الموز تبطئ سيارتك',
    avoidEn: 'Barricades, barrels & bananas spin out your kart',
  },
  sky_island_hop_3d: {
    goalAr: 'اقفز بين جزر السماء ثلاثية الأبعاد والفطر النطاط واجمع حلقات النجوم!',
    goalEn: 'Leap across floating 3D sky islands & bounce pads to grab Star Rings!',
    stepsAr: [
      'تحرّك بحرية فوق الجزر العائمة نحو العملات وحلقات النجوم.',
      'اضغط المسافة أو المس للقفز بين الجزر (ويمكنك القفز مرتين بالهواء!).',
      'استفد من الفطر النطاط للوصول السريع إلى النجوم العالية.',
    ],
    stepsEn: [
      'Move across floating 3D islands toward glowing coins and Star Rings.',
      'Press Space or Tap to leap gaps (Double Jump works mid-air!).',
      'Use Mushroom Bounce Pads to reach high Star Rings effortlessly.',
    ],
    keysAr: ['الأسهم / السحب للحركة', 'مسافة / لمس (قفزة مزدوجة)'],
    keysEn: ['Arrows / Drag to Move', 'Space / Tap (Double Jump)'],
    doAr: 'حلقات النجوم والفطر النطاط تمنحك أعلى النقاط',
    doEn: 'Star Rings & Mushroom Bounce Pads award top points',
    avoidAr: 'لا تسقط من حواف الجزر العائمة إلى الفراغ',
    avoidEn: 'Watch the island edges so you do not fall off',
  },
  bumper_arena_3d: {
    goalAr: 'ادفع خصوم الكوبا خارج الحلبة العائمة بكرة التصادم واجمع نجوم التاج!',
    goalEn: 'Knock Koopa bots off the floating 3D arena and snatch Crown Stars!',
    stepsAr: [
      'تحكّم بكرة التصادم 3D وتحرّك داخل الحلبة بالأسهم أو السحب.',
      'اضغط المسافة أو المس لتفعيل «اندفاعة التيربو» وضرب الخصوم نحو الحافة!',
      'التقط نجوم التاج التي تظهر وسط الحلبة وابقَ بعيداً عن السقوط.',
    ],
    stepsEn: [
      'Roll your 3D Bumper Orb around the sky stadium with Arrows or drag.',
      'Tap or press Space for a Turbo Dash to knock rivals off the edge!',
      'Grab Crown Stars spawning in the arena while staying on the platform.',
    ],
    keysAr: ['الأسهم / السحب للقيادة', 'مسافة / لمس لاندفاعة التيربو'],
    keysEn: ['Arrows / Drag to Roll', 'Space / Tap for Turbo Dash'],
    doAr: 'إخراج الخصوم من الحلبة + التقاط نجوم التاج',
    doEn: 'Ring-out knockoffs + grabbing Crown Stars',
    avoidAr: 'الاندفاع نحو الحافة دون انتباه قد يسقطك خارج الحلبة',
    avoidEn: 'Dashing carelessly near the edge can drop you off',
  },
  star_stadium_3d: {
    goalAr: 'اركض بحرية في ملعب الفطر 3D واجمع النجوم الخارقة وتفادَ صخور ثومب!',
    goalEn: 'Sprint across the 3D Mushroom Stadium grabbing Stars & jumping Thwomps!',
    stepsAr: [
      'اركض في أنحاء الملعب ثلاثي الأبعاد نحو النجوم الخارقة المتوهجة.',
      'راقب صخور ثومب المتدحرجة واقفز فوقها أو راوغها في الوقت المناسب.',
      'كل نجمة متتالية ترفع سرعتك ومجموع نقاطك بقوة!',
    ],
    stepsEn: [
      'Sprint freely around the 3D stadium chasing glowing Super Stars.',
      'Watch for rolling Thwomp stones and jump over or dodge past them.',
      'Collecting Stars in streaks builds huge scores quickly!',
    ],
    keysAr: ['الأسهم / السحب للركض', 'مسافة / لمس للقفز'],
    keysEn: ['Arrows / Drag to Run', 'Space / Tap to Jump'],
    doAr: 'ملاحقة النجوم الخارقة والعملات المضيئة باستمرار',
    doEn: 'Chasing glowing Super Stars and coin clusters',
    avoidAr: 'صخور ثومب المتدحرجة تسقطك وتؤخرك',
    avoidEn: 'Rolling Thwomp stones knock you back on impact',
  },
  bowser_tower_3d: {
    goalAr: 'اندفع فوق جسر قلعة النار 3D واقفز فوق اللهب والحمم لجمع النجوم!',
    goalEn: 'Dash down Bowser’s 3D Fire Castle leaping over fire-bars & lava!',
    stepsAr: [
      'تحرّك يميناً ويساراً فوق جسر القلعة لتفادي برك الحمم المشتعلة.',
      'اضغط المسافة أو المس للقفز فوق قضبان النار الدوارة والحمم.',
      'التقط النجوم الذهبية الموزعة على الجسر لتتصدّر الترتيب!',
    ],
    stepsEn: [
      'Weave left and right down the 3D castle bridge around molten lava pools.',
      'Press Space or Tap to jump cleanly over spinning Fire-Bars and lava.',
      'Grab golden Stars scattered down the fortress bridge to lead!',
    ],
    keysAr: ['◀ ▶ أو السحب للمراوغة', 'مسافة / لمس للقفز'],
    keysEn: ['◀ ▶ or Drag to Weave', 'Space / Tap to Jump'],
    doAr: 'القفز فوق النار وجمع النجوم الذهبية المتتالية',
    doEn: 'Clean jumps over flames & chaining gold Stars',
    avoidAr: 'لمس النار أو برك الحمم يبطئ سرعتك بشكل كبير',
    avoidEn: 'Touching fire or lava heavily slows your hero',
  },
};

export interface TutorialReadyPlayer {
  uid: string;
  displayName: string;
  characterId: PartyCharacterId;
  isReady: boolean;
  isMe: boolean;
}

export interface MiniGameTutorialScreenProps {
  lang: 'ar' | 'en';
  gameId: MarioMiniGameId;
  roundLabel: string;
  myCharId: PartyCharacterId;
  rivalCharId?: PartyCharacterId;
  /** Online multiplayer ready roster — NO timer; round starts once every player clicks Ready. */
  readyPlayers?: TutorialReadyPlayer[];
  isMyReady?: boolean;
  readyBusy?: boolean;
  onToggleReady?: () => void;
  /** For Solo mode (or manual preview modal): button to start immediately when Ready. */
  onStartNow?: () => void;
  startLabel?: string;
  /** Optional checkbox to control whether tutorial shows automatically before each Solo round. */
  showEveryRound?: boolean;
  onToggleShowEveryRound?: (next: boolean) => void;
  /** Optional close handler when opened as a preview modal from the Lobby. */
  onClosePreview?: () => void;
}

export const MiniGameTutorialScreen: React.FC<MiniGameTutorialScreenProps> = ({
  lang,
  gameId,
  roundLabel,
  myCharId,
  rivalCharId,
  readyPlayers,
  isMyReady,
  readyBusy,
  onToggleReady,
  onStartNow,
  startLabel,
  showEveryRound,
  onToggleShowEveryRound,
  onClosePreview,
}) => {
  const ar = lang === 'ar';
  const spec = MARIO_MINI_GAME_MAP[gameId];
  const tutorial = MARIO_MINI_GAME_TUTORIALS[gameId];
  const myChar = PARTY_CHARACTER_MAP[myCharId];
  const rivalChar = rivalCharId ? PARTY_CHARACTER_MAP[rivalCharId] : null;

  // Allow pressing Space or Enter to mark Ready / start right away
  useEffect(() => {
    const primaryAction = onStartNow ?? (onToggleReady && !isMyReady ? onToggleReady : undefined);
    if (!primaryAction) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const tag = (e.target as HTMLElement | null)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        e.preventDefault();
        primaryAction();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onStartNow, onToggleReady, isMyReady]);

  const steps = ar ? tutorial.stepsAr : tutorial.stepsEn;
  const keys = ar ? tutorial.keysAr : tutorial.keysEn;

  return (
    <div
      dir={ar ? 'rtl' : 'ltr'}
      className="rounded-3xl border-2 border-amber-300/65 bg-gradient-to-b from-[#132957] via-[#0d1f44] to-[#08132a] p-4 sm:p-6 shadow-2xl space-y-4"
    >
      {/* Top Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="font-num text-xs font-black px-2.5 py-1 rounded-lg text-slate-950 shrink-0"
            style={{ backgroundColor: spec.accent }}
          >
            {roundLabel}
          </span>
          {spec.is3D && (
            <span className="font-num text-[11px] font-black px-2 py-0.5 rounded-md bg-sky-400 text-slate-950 shrink-0">
              3D
            </span>
          )}
          <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-amber-400/20 border border-amber-300/40 text-amber-200 whitespace-nowrap">
            {ar ? 'تعليم اللعبة قبل البدء' : 'HOW TO PLAY'}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="font-num text-xs font-bold text-slate-300">
            {ar ? `المدة: ${spec.durationSec} ثانية` : `Time: ${spec.durationSec}s`}
          </span>
          {onClosePreview && (
            <button
              type="button"
              onClick={onClosePreview}
              className="h-8 px-3 rounded-lg border border-white/15 bg-white/10 hover:bg-white/15 text-xs font-bold text-white cursor-pointer"
            >
              {ar ? 'إغلاق' : 'Close'}
            </button>
          )}
        </div>
      </div>

      {/* Hero Matchup + Title & Goal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#09152e]/80 p-3.5 sm:p-4">
        <div className="space-y-1.5 min-w-0 flex-1">
          <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
            {ar ? spec.nameAr : spec.nameEn}
          </h3>
          <p className="text-sm font-bold text-amber-200 leading-relaxed">
            {ar ? tutorial.goalAr : tutorial.goalEn}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-center sm:self-auto">
          <div className="flex flex-col items-center">
            <HeroAvatarSvg characterId={myCharId} size={56} />
            <span className="text-[10px] font-bold text-sky-200 mt-0.5 whitespace-nowrap">
              {ar ? myChar.nameAr : myChar.nameEn}
            </span>
          </div>
          {rivalChar && (
            <>
              <span className="font-num text-base font-black text-amber-300 px-1">VS</span>
              <div className="flex flex-col items-center">
                <HeroAvatarSvg characterId={rivalChar.id} size={56} />
                <span className="text-[10px] font-bold text-rose-200 mt-0.5 whitespace-nowrap">
                  {ar ? rivalChar.nameAr : rivalChar.nameEn}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Tutorial Grid: 3 Steps + Controls & Tips */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Step-by-Step Instructions */}
        <div className="lg:col-span-7 rounded-2xl border border-sky-400/25 bg-[#0a1836] p-4 space-y-2.5">
          <div className="text-xs font-black text-sky-300 uppercase tracking-wide">
            {ar ? 'طريقة اللعب (3 خطوات سريعة)' : 'HOW TO PLAY (3 QUICK STEPS)'}
          </div>
          <ol className="space-y-2">
            {steps.map((step, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 rounded-xl bg-[#0e2044] border border-white/8 px-3 py-2"
              >
                <span
                  className="font-num w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black text-slate-950 shrink-0 mt-0.5"
                  style={{ backgroundColor: spec.accent }}
                >
                  {i + 1}
                </span>
                <span className="text-xs sm:text-sm text-slate-100 leading-relaxed font-semibold">
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* Controls + Do / Avoid */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          {/* Controls Card */}
          <div className="rounded-2xl border border-amber-300/30 bg-[#0a1836] p-3.5 space-y-2">
            <div className="text-xs font-black text-amber-300">
              {ar ? 'أزرار التحكم' : 'CONTROLS'}
            </div>
            <div className="flex flex-wrap gap-2">
              {keys.map((k, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center rounded-lg border border-amber-300/45 bg-amber-400/15 px-2.5 py-1 text-xs font-black text-amber-100"
                >
                  {k}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {ar ? spec.controlsAr : spec.controlsEn}
            </p>
          </div>

          {/* Do / Avoid Quick Tips */}
          <div className="grid grid-cols-1 gap-2 flex-1">
            <div className="rounded-xl border border-emerald-400/35 bg-emerald-500/10 px-3 py-2.5">
              <div className="text-[11px] font-black text-emerald-300">
                {ar ? 'اكسب النقاط' : 'SCORE BIG'}
              </div>
              <p className="text-xs text-emerald-100 mt-0.5 leading-relaxed font-semibold">
                {ar ? tutorial.doAr : tutorial.doEn}
              </p>
            </div>
            <div className="rounded-xl border border-rose-400/35 bg-rose-500/10 px-3 py-2.5">
              <div className="text-[11px] font-black text-rose-300">
                {ar ? 'احذر!' : 'WATCH OUT!'}
              </div>
              <p className="text-xs text-rose-100 mt-0.5 leading-relaxed font-semibold">
                {ar ? tutorial.avoidAr : tutorial.avoidEn}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Action Bar: Zero-Timer Ready System (Online Multiplayer OR Solo) */}
      <div className="pt-1 flex flex-col gap-3">
        {readyPlayers && readyPlayers.length > 0 ? (
          <div className="w-full space-y-3 rounded-2xl border border-emerald-400/30 bg-[#08152e]/90 p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs sm:text-sm font-black text-amber-200">
                {ar
                  ? `اضغط «جاهز» لتبدأ اللعبة — بدون مؤقت (${readyPlayers.filter((p) => p.isReady).length} / ${readyPlayers.length})`
                  : `Tap Ready to start — no timer (${readyPlayers.filter((p) => p.isReady).length} / ${readyPlayers.length})`}
              </div>
              <span className="text-[11px] font-bold text-slate-300">
                {ar ? 'تبدأ فور استعداد الجميع' : 'Starts as soon as everyone is ready'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {readyPlayers.map((p) => (
                <div
                  key={p.uid}
                  className={`flex items-center gap-2 rounded-xl border px-2.5 py-1.5 ${
                    p.isReady
                      ? 'border-emerald-400/60 bg-emerald-500/15'
                      : 'border-white/10 bg-[#0d1d3d]'
                  }`}
                >
                  <HeroAvatarSvg characterId={p.characterId} size={28} className="shrink-0" />
                  <span className="text-xs font-extrabold text-white max-w-[110px] truncate">
                    {p.displayName}
                  </span>
                  <span
                    className={`text-[10px] font-black px-1.5 py-0.5 rounded-md whitespace-nowrap ${
                      p.isReady
                        ? 'bg-emerald-400 text-slate-950'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {p.isReady
                      ? ar
                        ? 'جاهز ✓'
                        : 'READY ✓'
                      : ar
                      ? 'يقرأ...'
                      : 'Reading...'}
                  </span>
                </div>
              ))}
            </div>

            {onToggleReady && (
              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                {isMyReady ? (
                  <>
                    <span className="text-xs font-black text-emerald-300">
                      {ar
                        ? 'أنت جاهز ✓ بانتظار باقي اللاعبين...'
                        : 'You are Ready ✓ Waiting for others...'}
                    </span>
                    <button
                      type="button"
                      disabled={readyBusy}
                      onClick={onToggleReady}
                      className="h-10 px-4 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-slate-200 font-bold text-xs whitespace-nowrap cursor-pointer disabled:opacity-60"
                    >
                      {ar ? 'إلغاء الجاهزية' : 'Cancel Ready'}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={readyBusy}
                    onClick={onToggleReady}
                    className="w-full sm:w-auto h-12 px-8 rounded-2xl bg-gradient-to-b from-emerald-300 to-emerald-500 hover:from-emerald-200 hover:to-emerald-400 active:scale-[0.98] text-slate-950 font-black text-base shadow-xl transition-all whitespace-nowrap cursor-pointer disabled:opacity-60"
                  >
                    {readyBusy
                      ? ar
                        ? 'جاري التأكيد...'
                        : 'Confirming...'
                      : ar
                      ? 'جاهز — ابدأ اللعبة!'
                      : 'Ready — Start Game!'}
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {onToggleShowEveryRound ? (
              <label className="inline-flex items-center gap-2 text-xs text-slate-300 font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showEveryRound !== false}
                  onChange={(e) => onToggleShowEveryRound(e.target.checked)}
                  className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
                />
                <span>
                  {ar
                    ? 'إظهار تعليم اللعبة قبل كل جولة'
                    : 'Show game tutorial before every round'}
                </span>
              </label>
            ) : (
              <div />
            )}

            {onStartNow && (
              <button
                type="button"
                onClick={onStartNow}
                className="w-full sm:w-auto h-12 px-8 rounded-2xl bg-gradient-to-b from-emerald-300 to-emerald-500 hover:from-emerald-200 hover:to-emerald-400 active:scale-[0.98] text-slate-950 font-black text-base shadow-xl transition-all whitespace-nowrap cursor-pointer"
              >
                {startLabel ?? (ar ? 'جاهز — ابدأ اللعبة!' : 'Ready — Start Game!')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export interface PartyQuickGuideModalProps {
  lang: 'ar' | 'en';
  onClose: () => void;
}

export const PartyQuickGuideModal: React.FC<PartyQuickGuideModalProps> = ({ lang, onClose }) => {
  const ar = lang === 'ar';
  return (
    <div
      dir={ar ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-5"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[88dvh] overflow-y-auto rounded-3xl border-2 border-amber-300/55 bg-gradient-to-b from-[#132957] to-[#09142b] p-5 sm:p-6 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <div className="text-xs font-black text-amber-300">
              {ar ? 'دليل البداية السريع' : 'QUICK START GUIDE'}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {ar ? 'كيف تلعب حفلة ماريو أونلاين؟' : 'How to Play Mario Party Online'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-3.5 rounded-xl border border-white/15 bg-white/10 hover:bg-white/15 text-xs font-black text-white cursor-pointer"
          >
            {ar ? 'إغلاق' : 'Close'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-2xl border border-amber-300/30 bg-[#0b1834] p-3.5 space-y-1.5">
            <div className="font-num text-xs font-black text-amber-300">01</div>
            <h3 className="text-sm font-black text-white">
              {ar ? 'اختر بطلك من 8 شخصيات' : 'Pick From 8 Mario Heroes'}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {ar
                ? 'قبل بدء المباراة اختر شخصيتك المفضلة لتظهر بها أمام أصدقائك داخل جميع الـ 30 لعبة.'
                : 'Choose your favorite character before kickoff — your hero plays in all 30 mini-games.'}
            </p>
          </div>

          <div className="rounded-2xl border border-sky-400/30 bg-[#0b1834] p-3.5 space-y-1.5">
            <div className="font-num text-xs font-black text-sky-300">02</div>
            <h3 className="text-sm font-black text-white">
              {ar ? 'تعليم واضح قبل كل لعبة' : 'Tutorial Before Every Game'}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {ar
                ? 'قبل بداية كل جولة سيظهر لك شرح سريع يوضح الهدف وخطوات اللعب وأزرار التحكم وما يجب تجنّبه.'
                : 'Before every mini-game begins, a quick tutorial card explains the goal, controls, and hazards.'}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-400/30 bg-[#0b1834] p-3.5 space-y-1.5">
            <div className="font-num text-xs font-black text-emerald-300">03</div>
            <h3 className="text-sm font-black text-white">
              {ar ? 'اربح النجوم والعملات' : 'Win Stars & Coins'}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {ar
                ? 'صاحب أعلى نقاط في كل جولة يفوز بنجمة ★ و15 عملة! صاحب أكبر عدد من النجوم بنهاية البطولة يتوّج التوب #1.'
                : 'The highest scorer each round wins 1 Star ★ and 15 coins! Most Stars at the end wins TOP #1.'}
            </p>
          </div>

          <div className="rounded-2xl border border-fuchsia-400/30 bg-[#0b1834] p-3.5 space-y-1.5">
            <div className="font-num text-xs font-black text-fuchsia-300">04</div>
            <h3 className="text-sm font-black text-white">
              {ar ? 'أونلاين أو ضد الكمبيوتر' : 'Online Rooms or vs Bot'}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {ar
                ? 'أنشئ غرفة وشارك الكود مع أصدقائك، أو العب مباشرة ضد الكمبيوتر في بطولة من 3 حتى 10 ألعاب متنوعة!'
                : 'Create a live room and invite friends by code, or jump straight into a 3–10 game Cup vs Bot!'}
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-7 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm cursor-pointer"
          >
            {ar ? 'فهمت، لنلعب!' : 'Got It, Let’s Play!'}
          </button>
        </div>
      </div>
    </div>
  );
};
