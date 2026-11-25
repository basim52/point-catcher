export type PuzzleCategoryId =
  | 'memory'
  | 'safe'
  | 'lights'
  | 'math'
  | 'sequence'
  | 'sorting'
  | 'perception'
  | 'paths'
  | 'words'
  | 'timing';

export type PuzzleDifficulty = 'easy' | 'medium' | 'hard';

export interface PuzzleCategorySpec {
  id: PuzzleCategoryId;
  nameAr: string;
  nameEn: string;
  icon: string;
}

export interface PuzzleDefinition {
  id: number; // 1..50
  category: PuzzleCategoryId;
  variant: 0 | 1 | 2 | 3 | 4;
  icon: string;
  difficulty: PuzzleDifficulty;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
}

export const PUZZLE_CATEGORIES: PuzzleCategorySpec[] = [
  { id: 'memory', nameAr: 'الذاكرة والمطابقة', nameEn: 'Memory & Match', icon: '🧠' },
  { id: 'safe', nameAr: 'أقفال الخزنة والأرقام', nameEn: 'Safe & Codes', icon: '🔐' },
  { id: 'lights', nameAr: 'المنطق والأضواء', nameEn: 'Logic & Lights', icon: '💡' },
  { id: 'math', nameAr: 'الرياضيات والحساب', nameEn: 'Math & Numbers', icon: '➕' },
  { id: 'sequence', nameAr: 'التتابع والإيقاع', nameEn: 'Sequences', icon: '🎵' },
  { id: 'sorting', nameAr: 'الترتيب والتنظيم', nameEn: 'Ordering & Sort', icon: '🔢' },
  { id: 'perception', nameAr: 'الملاحظة والتركيز', nameEn: 'Visual Focus', icon: '👁️' },
  { id: 'paths', nameAr: 'المسارات والمتاهات', nameEn: 'Paths & Mazes', icon: '🗺️' },
  { id: 'words', nameAr: 'الكلمات والفوازير', nameEn: 'Words & Riddles', icon: '📝' },
  { id: 'timing', nameAr: 'التوقيت والدقة', nameEn: 'Timing & Reflex', icon: '⏱️' },
];

export const PUZZLE_CATEGORY_MAP: Record<PuzzleCategoryId, PuzzleCategorySpec> =
  PUZZLE_CATEGORIES.reduce(
    (acc, cat) => {
      acc[cat.id] = cat;
      return acc;
    },
    {} as Record<PuzzleCategoryId, PuzzleCategorySpec>
  );

/**
 * Complete catalog of 50 diverse interactive door-lock puzzles (10 engines x 5 distinct variants).
 */
export const PUZZLE_CATALOG: PuzzleDefinition[] = [
  // 1. MEMORY & MATCHING (01 - 05)
  {
    id: 1,
    category: 'memory',
    variant: 0,
    icon: '🔑',
    difficulty: 'easy',
    titleAr: 'أقفال بيت النوم',
    titleEn: 'House Lock Pairs',
    descAr: 'طابق 6 أزواج من رموز بيت النوم لفتح أقفال الباب.',
    descEn: 'Match 6 pairs of Sleep House symbols to release the door bolts.',
  },
  {
    id: 2,
    category: 'memory',
    variant: 1,
    icon: '🍓',
    difficulty: 'easy',
    titleAr: 'مطابقة نكهات العلك',
    titleEn: 'Gum Flavor Pairs',
    descAr: 'اكتشف كل زوج متشابه من نكهات الفواكه والعلك اللذيذة.',
    descEn: 'Find every matching pair of fruit and gum flavors.',
  },
  {
    id: 3,
    category: 'memory',
    variant: 2,
    icon: '👑',
    difficulty: 'medium',
    titleAr: 'خزنة مفاتيح الكنز',
    titleEn: 'Treasure Vault 4×4',
    descAr: 'لوحة موسّعة من 16 بطاقة (8 أزواج) لاختبار ذاكرتك.',
    descEn: 'Expanded 4×4 vault grid with 8 treasure pairs to match.',
  },
  {
    id: 4,
    category: 'memory',
    variant: 3,
    icon: '⚡',
    difficulty: 'medium',
    titleAr: 'وميض الذاكرة السريع',
    titleEn: 'Flash Grid Recall',
    descAr: 'احفظ مواقع المربعات المضيئة خلال ثانيتين ثم اضغط عليها بالضبط!',
    descEn: 'Memorize the glowing squares for 2 seconds, then tap them back!',
  },
  {
    id: 5,
    category: 'memory',
    variant: 4,
    icon: '🔟',
    difficulty: 'medium',
    titleAr: 'أزواج مجموعها 10',
    titleEn: 'Make-10 Pairs',
    descAr: 'افتح بطاقتين يكون مجموع رقميهما يساوي 10 بالضبط (مثل 3 و 7).',
    descEn: 'Flip two number cards whose sum equals exactly 10 (e.g. 3 + 7).',
  },

  // 2. SAFE & COMBINATION LOCKS (06 - 10)
  {
    id: 6,
    category: 'safe',
    variant: 0,
    icon: '🔐',
    difficulty: 'easy',
    titleAr: 'خزنة المحل (3 أرقام)',
    titleEn: '3-Digit Shop Safe',
    descAr: 'خمّن الرقم السري من 3 خانات بالاستعانة بتلميحات الأخضر والأصفر.',
    descEn: 'Crack the 3-digit PIN using exact (green) and misplaced (amber) clues.',
  },
  {
    id: 7,
    category: 'safe',
    variant: 1,
    icon: '🏦',
    difficulty: 'hard',
    titleAr: 'خزنة الليل (4 أرقام)',
    titleEn: '4-Digit Night Vault',
    descAr: 'اكسر شفرة القفل الليلي المكون من 4 أرقام مختلفة.',
    descEn: 'Crack the 4-digit secret code with distinct digits.',
  },
  {
    id: 8,
    category: 'safe',
    variant: 2,
    icon: '🎛️',
    difficulty: 'easy',
    titleAr: 'قفل المجموع السحري',
    titleEn: 'Target Sum Dials',
    descAr: 'اضبط 4 عجلات أرقام ليصل مجموعها إلى الرقم المطلوب بالضبط.',
    descEn: 'Turn 4 number dials so their total equals the target lock sum.',
  },
  {
    id: 9,
    category: 'safe',
    variant: 3,
    icon: '💻',
    difficulty: 'medium',
    titleAr: 'القفل الثنائي (Binary)',
    titleEn: 'Binary Bit Switch',
    descAr: 'شغّل مفاتيح القيم (16، 8، 4، 2، 1) لتكوين الرقم السري.',
    descEn: 'Toggle binary switches (16, 8, 4, 2, 1) to equal the door code.',
  },
  {
    id: 10,
    category: 'safe',
    variant: 4,
    icon: '🎨',
    difficulty: 'hard',
    titleAr: 'شفرة الألوان السرية',
    titleEn: 'Color Mastermind',
    descAr: 'اكتشف ترتيب 4 ألوان سرية عبر مؤشرات الدقة بعد كل محاولة.',
    descEn: 'Deduce the hidden 4-color sequence from peg clues each try.',
  },

  // 3. LOGIC & LIGHTS GRIDS (11 - 15)
  {
    id: 11,
    category: 'lights',
    variant: 0,
    icon: '💡',
    difficulty: 'medium',
    titleAr: 'إضاءة الشبكة 3×3',
    titleEn: 'Lights On 3×3',
    descAr: 'الضغط على أي مصباح يعكسه مع جيرانه الأربعة — أضئ جميع المصابيح!',
    descEn: 'Tapping a bulb flips it and its 4 neighbors — light up all 9!',
  },
  {
    id: 12,
    category: 'lights',
    variant: 1,
    icon: '✨',
    difficulty: 'medium',
    titleAr: 'الأضواء القطرية (×)',
    titleEn: 'Diagonal Flip 3×3',
    descAr: 'الضغط على الخلية يعكسها مع جيرانها القطرية — أضئ اللوحة كاملة.',
    descEn: 'Each tap toggles the tile plus its diagonal corners — light them all.',
  },
  {
    id: 13,
    category: 'lights',
    variant: 2,
    icon: '✚',
    difficulty: 'hard',
    titleAr: 'عكس الصف والعمود',
    titleEn: 'Cross-Row Lock',
    descAr: 'الضغط على زر يعكس كامل صفه وعموده — حوّل جميع الأزرار للأخضر!',
    descEn: 'Tapping any cell flips its entire row and column — turn all green!',
  },
  {
    id: 14,
    category: 'lights',
    variant: 3,
    icon: '⚖️',
    difficulty: 'medium',
    titleAr: 'قفل توازن الصفوف 3×3',
    titleEn: 'Row & Col Balance',
    descAr: 'أضئ الخلايا بحيث يتطابق عدد الأضواء في كل صف وعمود مع الرقم المطلوب.',
    descEn: 'Light cells so every row and column matches its target count.',
  },
  {
    id: 15,
    category: 'lights',
    variant: 4,
    icon: '⚙️',
    difficulty: 'medium',
    titleAr: 'التروس المتشابكة',
    titleEn: 'Coupled Gear Dials',
    descAr: 'تدوير أي ترس يحرّك جاره معه — اجعل الأسهم الأربعة تشير للأعلى ⬆️!',
    descEn: 'Turning a gear rotates its neighbor too — point all 4 arrows UP ⬆️!',
  },

  // 4. MATH & SPEED ARITHMETIC (16 - 20)
  {
    id: 16,
    category: 'math',
    variant: 0,
    icon: '🧮',
    difficulty: 'easy',
    titleAr: 'معادلات باب المحل',
    titleEn: 'Shop Math Lock',
    descAr: 'حل 4 مسائل حسابية سريعة (جمع، طرح، ضرب) لفتح الباب.',
    descEn: 'Solve 4 quick arithmetic lock equations (+, −, ×) in a row.',
  },
  {
    id: 17,
    category: 'math',
    variant: 1,
    icon: '⚖️',
    difficulty: 'medium',
    titleAr: 'الميزان الحسابي',
    titleEn: 'Equation Balance',
    descAr: 'اختر الرقم الناقص لتتساوى كفتا المعادلة على قفل الباب (3 جولات).',
    descEn: 'Pick the missing number to balance both sides of the lock scale.',
  },
  {
    id: 18,
    category: 'math',
    variant: 2,
    icon: '🎯',
    difficulty: 'easy',
    titleAr: 'صائد المضاعفات',
    titleEn: 'Multiples Hunter',
    descAr: 'اضغط فقط على جميع الأرقام التي تقبل القسمة على الرقم السري!',
    descEn: 'Tap ONLY the numbers in the grid divisible by the target divisor!',
  },
  {
    id: 19,
    category: 'math',
    variant: 3,
    icon: '📈',
    difficulty: 'medium',
    titleAr: 'سلسلة الأرقام الذكية',
    titleEn: 'Number Sequences',
    descAr: 'اكتشف النمط واختر الرقم التالي الصحيح في 3 متتاليات ذكاء.',
    descEn: 'Find the pattern and pick the next number in 3 logic sequences.',
  },
  {
    id: 20,
    category: 'math',
    variant: 4,
    icon: '➗',
    difficulty: 'easy',
    titleAr: 'الإشارة المفقودة',
    titleEn: 'Missing Operator',
    descAr: 'اختر العملية الصحيحة (+ أو − أو × أو ÷) لإكمال 4 معادلات.',
    descEn: 'Pick the correct operator (+, −, ×, ÷) to complete 4 formulas.',
  },

  // 5. SEQUENCES & SIMON SAYS (21 - 25)
  {
    id: 21,
    category: 'sequence',
    variant: 0,
    icon: '🟥',
    difficulty: 'easy',
    titleAr: 'سيمون ألوان الباب',
    titleEn: 'Simon Color Lock',
    descAr: 'راقب تسلسل الألوان المضيئة وأعد الضغط عليه بنفس الترتيب!',
    descEn: 'Watch the flashing color pads and repeat the exact sequence!',
  },
  {
    id: 22,
    category: 'sequence',
    variant: 1,
    icon: '🎹',
    difficulty: 'medium',
    titleAr: 'سيمون النغمات الخمس',
    titleEn: 'Musical Chime Lock',
    descAr: 'تابع 5 خطوات من الأزرار الموسيقية المضيئة وأعد عزفها.',
    descEn: 'Follow a 5-step glowing musical sequence and replay it.',
  },
  {
    id: 23,
    category: 'sequence',
    variant: 2,
    icon: '⭐',
    difficulty: 'medium',
    titleAr: 'مسار النجوم المرقّمة',
    titleEn: 'Starlight Order',
    descAr: 'احفظ أماكن النجوم من 1 إلى 5 ثم اضغط عليها بالترتيب الصحيح.',
    descEn: 'Memorize stars numbered 1 to 5, then tap them in exact order.',
  },
  {
    id: 24,
    category: 'sequence',
    variant: 3,
    icon: '⏪',
    difficulty: 'hard',
    titleAr: 'الذاكرة المعكوسة',
    titleEn: 'Reverse Recall',
    descAr: 'راقب تسلسل 4 رموز ثم أدخله بالعكس من الأخير إلى الأول!',
    descEn: 'Watch 4 symbols flash, then tap them in REVERSE order!',
  },
  {
    id: 25,
    category: 'sequence',
    variant: 4,
    icon: '🥁',
    difficulty: 'medium',
    titleAr: 'شفرة لوحة الرموز',
    titleEn: '6-Key Symbol Pattern',
    descAr: 'احفظ وأعد تكرار نمط سريع على لوحة من 6 رموز مختلفة.',
    descEn: 'Watch and repeat a crisp pattern across a 6-symbol keypad.',
  },

  // 6. ORDERING & SORTING (26 - 30)
  {
    id: 26,
    category: 'sorting',
    variant: 0,
    icon: '🧩',
    difficulty: 'hard',
    titleAr: 'لغز الانزلاق 3×3',
    titleEn: '3×3 Sliding Tiles',
    descAr: 'حرّك المربعات نحو الفراغ لترتيب الأرقام من 1 إلى 8.',
    descEn: 'Slide tiles into the blank space to order numbers 1 through 8.',
  },
  {
    id: 27,
    category: 'sorting',
    variant: 1,
    icon: '⬆️',
    difficulty: 'easy',
    titleAr: 'ترتيب تصاعدي سريع',
    titleEn: 'Ascending Rush 1→9',
    descAr: 'اضغط على الأرقام المبعثرة بالترتيب التصاعدي من 1 حتى 9.',
    descEn: 'Tap the scrambled grid numbers in order from 1 up to 9.',
  },
  {
    id: 28,
    category: 'sorting',
    variant: 2,
    icon: '⬇️',
    difficulty: 'easy',
    titleAr: 'الترتيب التنازلي',
    titleEn: 'Descending Vault',
    descAr: 'اضغط على الأرقام العشوائية من الأكبر إلى الأصغر بدون خطأ!',
    descEn: 'Tap all 9 random numbers from largest down to smallest!',
  },
  {
    id: 29,
    category: 'sorting',
    variant: 3,
    icon: '🌈',
    difficulty: 'medium',
    titleAr: 'ترتيب ألوان الطيف',
    titleEn: 'Rainbow Spectrum Sort',
    descAr: 'بدّل مكان بطاقتين في كل مرة لترتيب ألوان قوس قزح بالترتيب الصحيح.',
    descEn: 'Swap pairs of color tiles into smooth rainbow spectrum order.',
  },
  {
    id: 30,
    category: 'sorting',
    variant: 4,
    icon: '📏',
    difficulty: 'easy',
    titleAr: 'ترتيب مقاسات المفاتيح',
    titleEn: 'Key Size Sorter',
    descAr: 'بدّل المفاتيح الخمسة لترتيبها من الأصغر إلى الأكبر (XS → XL).',
    descEn: 'Swap the 5 keys into ascending size order (XS → XL).',
  },

  // 7. VISUAL PERCEPTION & SPOTTERS (31 - 35)
  {
    id: 31,
    category: 'perception',
    variant: 0,
    icon: '🔍',
    difficulty: 'easy',
    titleAr: 'اكتشف الرمز المختلف',
    titleEn: 'Odd One Out',
    descAr: 'اعثر على الرمز الوحيد المختلف داخل شبكة 4×4 خلال 3 جولات.',
    descEn: 'Spot the single different icon hidden in a 4×4 grid (3 rounds).',
  },
  {
    id: 32,
    category: 'perception',
    variant: 1,
    icon: '🍬',
    difficulty: 'easy',
    titleAr: 'عدّ حبات العلك',
    titleEn: 'Count the Gum',
    descAr: 'عدّ بدقة كم مرة يظهر الرمز المطلوب داخل الصينية (3 جولات).',
    descEn: 'Count how many times the target icon appears in the tray (3 rounds).',
  },
  {
    id: 33,
    category: 'perception',
    variant: 2,
    icon: '🎭',
    difficulty: 'medium',
    titleAr: 'فخ الألوان (Stroop)',
    titleEn: 'Color Word Trap',
    descAr: 'اضغط على **لون الخط** الحقيقي وليس معنى الكلمة المكتوبة (4 جولات)!',
    descEn: 'Tap the INK COLOR of the word, NOT what the word says (4 rounds)!',
  },
  {
    id: 34,
    category: 'perception',
    variant: 3,
    icon: '🏆',
    difficulty: 'medium',
    titleAr: 'أي الكفتين أكبر؟',
    titleEn: 'Which Side Is Larger?',
    descAr: 'اختر العبارة الحسابية ذات القيمة الأكبر بسرعة (4 جولات).',
    descEn: 'Pick which math expression has the larger value (4 rounds).',
  },
  {
    id: 35,
    category: 'perception',
    variant: 4,
    icon: '🪞',
    difficulty: 'easy',
    titleAr: 'مرآة الأسهم العكسية',
    titleEn: 'Opposite Arrow Mirror',
    descAr: 'اضغط على السهم **المعاكس تماماً** للسهم الظاهر (5 جولات)!',
    descEn: 'Tap the EXACT OPPOSITE direction arrow (5 quick rounds)!',
  },

  // 8. PATHS, PIPES & MAZES (36 - 40)
  {
    id: 36,
    category: 'paths',
    variant: 0,
    icon: '🔧',
    difficulty: 'medium',
    titleAr: 'أنابيب طاقة الباب',
    titleEn: 'Pipe Circuit Lock',
    descAr: 'دوّر الأنابيب لتوصيل الكهرباء ⚡ من البداية إلى القفل 🔓!',
    descEn: 'Rotate pipe tiles to connect power ⚡ from Start to Door Lock 🔓!',
  },
  {
    id: 37,
    category: 'paths',
    variant: 1,
    icon: '🗺️',
    difficulty: 'easy',
    titleAr: 'متاهة المفتاح 5×5',
    titleEn: '5×5 Key Maze',
    descAr: 'حرّك المفتاح 🔑 بين الجدران للوصول إلى قفل الباب 🚪.',
    descEn: 'Navigate the key 🔑 through the maze walls to reach the door 🚪.',
  },
  {
    id: 38,
    category: 'paths',
    variant: 2,
    icon: '♞',
    difficulty: 'hard',
    titleAr: 'قفزات الحصان الشطرنجي',
    titleEn: 'Chess Knight Keys',
    descAr: 'حرّك الحصان ♞ بحركة حرف L لجمع جميع المفاتيح الذهبية الـ 3!',
    descEn: 'Move the chess knight ♞ in L-jumps to collect all 3 golden keys!',
  },
  {
    id: 39,
    category: 'paths',
    variant: 3,
    icon: '🦋',
    difficulty: 'easy',
    titleAr: 'رسم التناظر المرآتي',
    titleEn: 'Mirror Symmetry Lock',
    descAr: 'ارسم النصف الأيمن ليطابق النصف الأيسر كالمرآة تماماً!',
    descEn: 'Paint the right half of the grid as a perfect mirror of the left!',
  },
  {
    id: 40,
    category: 'paths',
    variant: 4,
    icon: '🧵',
    difficulty: 'medium',
    titleAr: 'المسار المتصل بلا رجوع',
    titleEn: 'One-Stroke Trail',
    descAr: 'مرّ على جميع المربعات المضيئة بمسار متصل واحد دون المرور بمربع مرتين!',
    descEn: 'Visit every lit tile in one continuous orthogonal path!',
  },

  // 9. WORDS, ANAGRAMS & RIDDLES (41 - 45)
  {
    id: 41,
    category: 'words',
    variant: 0,
    icon: '🔤',
    difficulty: 'easy',
    titleAr: 'ترتيب حروف الكلمة',
    titleEn: 'Word Unscramble',
    descAr: 'رتّب الحروف المبعثرة لتكوين كلمتين سريتين لفتح الباب.',
    descEn: 'Tap scrambled letters in order to spell 2 secret lock words.',
  },
  {
    id: 42,
    category: 'words',
    variant: 1,
    icon: '❓',
    difficulty: 'easy',
    titleAr: 'فوازير الذكاء السريعة',
    titleEn: 'Clever Door Riddles',
    descAr: 'أجب بشكل صحيح عن فزورتي ذكاء لفتح قفل البيت.',
    descEn: 'Answer 2 clever brain riddles correctly to unlock the house.',
  },
  {
    id: 43,
    category: 'words',
    variant: 2,
    icon: '🔣',
    difficulty: 'medium',
    titleAr: 'شفرة الرموز والأرقام',
    titleEn: 'Symbol Value Cipher',
    descAr: 'استخدم مفتاح قيم الرموز لحساب شفرة القفل الصحيحة (3 جولات).',
    descEn: 'Use the symbol value legend to compute the door code (3 rounds).',
  },
  {
    id: 44,
    category: 'words',
    variant: 3,
    icon: '🕵️',
    difficulty: 'easy',
    titleAr: 'اكتشف الكلمة الدخيلة',
    titleEn: 'Odd Word Out',
    descAr: 'اختر الكلمة الوحيدة التي لا تنتمي لبقية المجموعة (3 جولات).',
    descEn: 'Pick the 1 word that does not belong to the group (3 rounds).',
  },
  {
    id: 45,
    category: 'words',
    variant: 4,
    icon: '🔠',
    difficulty: 'medium',
    titleAr: 'سلسلة الحروف الذكية',
    titleEn: 'Letter Sequence',
    descAr: 'اختر الحرف التالي الناقص في نمط الحروف المتتالية (3 جولات).',
    descEn: 'Choose the next letter in a shifted alphabet sequence (3 rounds).',
  },

  // 10. TIMING, PRECISION & REFLEX (46 - 50)
  {
    id: 46,
    category: 'timing',
    variant: 0,
    icon: '🎯',
    difficulty: 'easy',
    titleAr: 'قفل النبضة الذهبية',
    titleEn: 'Golden Timing Bar',
    descAr: 'اضغط "توقف" لحظة مرور المؤشر داخل المنطقة الذهبية (3 أقفال)!',
    descEn: 'Hit STOP right when the moving needle enters the gold zone (3 locks)!',
  },
  {
    id: 47,
    category: 'timing',
    variant: 1,
    icon: '⚡',
    difficulty: 'easy',
    titleAr: 'صيد الأقفال المضيئة',
    titleEn: 'Whack-a-Lock',
    descAr: 'اضغط على 6 أقفال خضراء متوهجة فور ظهورها وتجنّب الفخ الأحمر!',
    descEn: 'Tap 6 glowing green locks as they pop up and avoid red traps!',
  },
  {
    id: 48,
    category: 'timing',
    variant: 2,
    icon: '🎚️',
    difficulty: 'easy',
    titleAr: 'ضبط صمامات الضغط',
    titleEn: 'Precision Sliders',
    descAr: 'اضبط 3 أشرطة ضغط داخل نطاقاتها المستهدفة بالضبط لفتح القفل.',
    descEn: 'Align 3 analog pressure sliders inside their green target zones.',
  },
  {
    id: 49,
    category: 'timing',
    variant: 3,
    icon: '⏱️',
    difficulty: 'medium',
    titleAr: 'التوقف على الثانية المثالية',
    titleEn: 'Stopwatch 3.0s Lock',
    descAr: 'شغّل المؤقت وأوقفه قريباً من 3.0 ثانية (بين 2.6 و 3.4 ثانية)!',
    descEn: 'Start the timer and stop it near 3.0s (between 2.6s and 3.4s)!',
  },
  {
    id: 50,
    category: 'timing',
    variant: 4,
    icon: '👑',
    difficulty: 'hard',
    titleAr: 'القفل الملكي ذو الـ 3 مراحل',
    titleEn: 'Royal 3-Stage Gauntlet',
    descAr: 'تحدٍ ملكي من 3 مراحل: معادلة ذكية + اختيار سريع + إيقاف ذهبي!',
    descEn: 'A 3-stage royal lock: quick math + symbol spot + golden stop!',
  },
];

export const PUZZLE_BY_ID: Record<number, PuzzleDefinition> = PUZZLE_CATALOG.reduce(
  (acc, p) => {
    acc[p.id] = p;
    return acc;
  },
  {} as Record<number, PuzzleDefinition>
);

export const TOTAL_PUZZLE_COUNT = PUZZLE_CATALOG.length; // 50

export function pickNextDoorPuzzleId(solvedIds: number[], excludeId?: number): number {
  const solvedSet = new Set(solvedIds);
  const unsolved = PUZZLE_CATALOG.filter(
    (p) => !solvedSet.has(p.id) && p.id !== excludeId
  );
  const pool =
    unsolved.length > 0
      ? unsolved
      : PUZZLE_CATALOG.filter((p) => p.id !== excludeId);
  const picked = pool[Math.floor(Math.random() * pool.length)] ?? PUZZLE_CATALOG[0];
  return picked.id;
}
