import React from 'react';

export const ArrowGlyphSvg: React.FC<{
  dir: 'up' | 'down' | 'left' | 'right';
  size?: number;
  className?: string;
}> = ({ dir, size = 22, className }) => {
  const rot =
    dir === 'up' ? 0 : dir === 'right' ? 90 : dir === 'down' ? 180 : 270;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <g transform={`rotate(${rot} 12 12)`}>
        <path
          d="M12 3.5L20.5 14H15.2V20.5H8.8V14H3.5L12 3.5Z"
          fill="currentColor"
          stroke="#0f172a"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
};

export const GoombaSvg: React.FC<{ size?: number; className?: string }> = ({
  size = 56,
  className,
}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
    {/* Shoes */}
    <ellipse cx="21" cy="54" rx="10" ry="6" fill="#3b1d0a" stroke="#1e0e04" strokeWidth="2.5" />
    <ellipse cx="43" cy="54" rx="10" ry="6" fill="#3b1d0a" stroke="#1e0e04" strokeWidth="2.5" />
    {/* Tan body stalk */}
    <path
      d="M21 38 C20 49 23 53 32 53 C41 53 44 49 43 38 Z"
      fill="#f5d0a9"
      stroke="#1e0e04"
      strokeWidth="2.5"
    />
    {/* Mushroom cap head */}
    <path
      d="M10 35 C8 22 20 8 32 8 C44 8 56 22 54 35 C53 43 44 45 32 45 C20 45 11 43 10 35 Z"
      fill="#9a4b1f"
      stroke="#1e0e04"
      strokeWidth="2.8"
    />
    {/* Cap highlight */}
    <ellipse cx="25" cy="18" rx="7" ry="4" fill="#c76d35" opacity="0.6" />
    {/* Eyes */}
    <ellipse cx="24" cy="29" rx="4.2" ry="6" fill="#ffffff" stroke="#1e0e04" strokeWidth="2" />
    <ellipse cx="40" cy="29" rx="4.2" ry="6" fill="#ffffff" stroke="#1e0e04" strokeWidth="2" />
    <ellipse cx="25" cy="30" rx="2" ry="3.2" fill="#0f172a" />
    <ellipse cx="39" cy="30" rx="2" ry="3.2" fill="#0f172a" />
    {/* Angry unibrow */}
    <path
      d="M17 21 L29 26 L35 26 L47 21"
      fill="none"
      stroke="#1e0e04"
      strokeWidth="3.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Mouth & fangs */}
    <path d="M23 39 Q32 36 41 39" fill="none" stroke="#1e0e04" strokeWidth="2.4" strokeLinecap="round" />
    <polygon points="24,39 27,34 29,38" fill="#ffffff" stroke="#1e0e04" strokeWidth="1.2" />
    <polygon points="40,39 37,34 35,38" fill="#ffffff" stroke="#1e0e04" strokeWidth="1.2" />
  </svg>
);

export const SuperStarSvg: React.FC<{ size?: number; className?: string }> = ({
  size = 54,
  className,
}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="mpStarGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="55%" stopColor="#facc15" />
        <stop offset="100%" stopColor="#eab308" />
      </linearGradient>
    </defs>
    <path
      d="M32 5 L39.8 21.8 L58 24.1 L44.6 36.8 L48 55 L32 46.1 L16 55 L19.4 36.8 L6 24.1 L24.2 21.8 Z"
      fill="url(#mpStarGrad)"
      stroke="#713f12"
      strokeWidth="3"
      strokeLinejoin="round"
    />
    {/* Glossy top sheen */}
    <path
      d="M32 10 L37.2 22 L26.8 22 Z"
      fill="#ffffff"
      opacity="0.45"
    />
    {/* Classic Mario Star tall eyes */}
    <ellipse cx="26.5" cy="31" rx="2.7" ry="6.2" fill="#0f172a" />
    <ellipse cx="37.5" cy="31" rx="2.7" ry="6.2" fill="#0f172a" />
    <ellipse cx="26" cy="28.5" rx="1" ry="2" fill="#ffffff" />
    <ellipse cx="37" cy="28.5" rx="1" ry="2" fill="#ffffff" />
  </svg>
);

export const BobOmbSvg: React.FC<{
  size?: number;
  lit?: boolean;
  className?: string;
}> = ({ size = 56, lit = true, className }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
    {/* Wind-up golden key */}
    <rect x="47" y="30" width="9" height="4" rx="2" fill="#facc15" stroke="#713f12" strokeWidth="1.8" />
    <circle cx="57" cy="27" r="4.5" fill="none" stroke="#facc15" strokeWidth="3.2" />
    <circle cx="57" cy="37" r="4.5" fill="none" stroke="#facc15" strokeWidth="3.2" />
    {/* Shoes */}
    <ellipse cx="24" cy="54" rx="8" ry="4.5" fill="#f59e0b" stroke="#713f12" strokeWidth="2.2" />
    <ellipse cx="39" cy="54" rx="8" ry="4.5" fill="#f59e0b" stroke="#713f12" strokeWidth="2.2" />
    {/* Fuse & metallic cap */}
    <path
      d="M32 16 Q34 8 42 7"
      fill="none"
      stroke="#fde68a"
      strokeWidth="3.5"
      strokeLinecap="round"
    />
    {lit && (
      <g>
        <polygon
          points="45,2 47,6 52,5 48,9 51,13 46,11 43,15 43,10 38,9 43,7"
          fill="#fb923c"
          stroke="#fef08a"
          strokeWidth="1.2"
        />
        <circle cx="45" cy="8.5" r="2.6" fill="#fef08a" />
      </g>
    )}
    <rect x="25" y="14" width="14" height="6" rx="2" fill="#94a3b8" stroke="#0f172a" strokeWidth="2.2" />
    {/* Round glossy bomb body */}
    <circle cx="31" cy="35" r="18" fill="#1e293b" stroke="#020617" strokeWidth="3" />
    <ellipse cx="23" cy="26" rx="5.5" ry="3.5" transform="rotate(-28 23 26)" fill="#475569" opacity="0.7" />
    {/* White oval eyes */}
    <ellipse cx="25" cy="34" rx="3.2" ry="6.2" fill="#ffffff" />
    <ellipse cx="35" cy="34" rx="3.2" ry="6.2" fill="#ffffff" />
  </svg>
);

export const ToadSvg: React.FC<{ size?: number; className?: string }> = ({
  size = 46,
  className,
}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
    {/* Vest & shoes */}
    <ellipse cx="23" cy="57" rx="7" ry="4" fill="#7c2d12" stroke="#1e0e04" strokeWidth="2" />
    <ellipse cx="41" cy="57" rx="7" ry="4" fill="#7c2d12" stroke="#1e0e04" strokeWidth="2" />
    <path d="M21 43 H43 L45 54 H19 Z" fill="#2563eb" stroke="#0f172a" strokeWidth="2.2" />
    <rect x="29" y="43" width="6" height="11" fill="#f8fafc" />
    {/* Face */}
    <ellipse cx="32" cy="37" rx="12" ry="9" fill="#fed7aa" stroke="#0f172a" strokeWidth="2.2" />
    <ellipse cx="27.5" cy="36" rx="2.1" ry="3.6" fill="#0f172a" />
    <ellipse cx="36.5" cy="36" rx="2.1" ry="3.6" fill="#0f172a" />
    <path d="M28 41.5 Q32 44.5 36 41.5" fill="none" stroke="#9a3412" strokeWidth="2" strokeLinecap="round" />
    {/* Classic Toad Mushroom Cap (white with big red spots) */}
    <path
      d="M10 31 C8 14 19 5 32 5 C45 5 56 14 54 31 C53 35 45 34 32 34 C19 34 11 35 10 31 Z"
      fill="#ffffff"
      stroke="#0f172a"
      strokeWidth="2.6"
    />
    <circle cx="32" cy="16" r="7.5" fill="#ef4444" />
    <circle cx="15" cy="24" r="5.5" fill="#ef4444" />
    <circle cx="49" cy="24" r="5.5" fill="#ef4444" />
  </svg>
);

export const KoopaSvg: React.FC<{ size?: number; className?: string }> = ({
  size = 46,
  className,
}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
    {/* Boots */}
    <ellipse cx="22" cy="56" rx="7.5" ry="4" fill="#ea580c" stroke="#0f172a" strokeWidth="2" />
    <ellipse cx="42" cy="56" rx="7.5" ry="4" fill="#ea580c" stroke="#0f172a" strokeWidth="2" />
    {/* Green Koopa Shell */}
    <ellipse cx="36" cy="39" rx="16" ry="14" fill="#16a34a" stroke="#0f172a" strokeWidth="2.6" />
    <path d="M24 38 L36 30 L48 38 L36 47 Z" fill="#22c55e" stroke="#14532d" strokeWidth="1.8" />
    {/* White shell rim */}
    <path
      d="M21 44 Q36 53 51 44"
      fill="none"
      stroke="#ffffff"
      strokeWidth="4.2"
      strokeLinecap="round"
    />
    {/* Yellow belly */}
    <ellipse cx="27" cy="43" rx="8" ry="8" fill="#fde047" stroke="#0f172a" strokeWidth="2" />
    {/* Cute Koopa head */}
    <ellipse cx="21" cy="23" rx="10" ry="9" fill="#facc15" stroke="#0f172a" strokeWidth="2.4" />
    <ellipse cx="14" cy="26" rx="6.5" ry="4.5" fill="#fde047" stroke="#0f172a" strokeWidth="2" />
    <ellipse cx="22" cy="20" rx="2.4" ry="4" fill="#ffffff" stroke="#0f172a" strokeWidth="1.4" />
    <circle cx="21.5" cy="20.5" r="1.4" fill="#0f172a" />
  </svg>
);

export const BrickBlockSvg: React.FC<{
  size?: number;
  cracked?: boolean;
  className?: string;
}> = ({ size = 50, cracked = false, className }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
    <rect x="4" y="4" width="56" height="56" rx="7" fill="#c2410c" stroke="#431407" strokeWidth="3.2" />
    {/* Brick rows & mortar */}
    <line x1="4" y1="22" x2="60" y2="22" stroke="#431407" strokeWidth="3" />
    <line x1="4" y1="42" x2="60" y2="42" stroke="#431407" strokeWidth="3" />
    <line x1="32" y1="4" x2="32" y2="22" stroke="#431407" strokeWidth="3" />
    <line x1="18" y1="22" x2="18" y2="42" stroke="#431407" strokeWidth="3" />
    <line x1="46" y1="22" x2="46" y2="42" stroke="#431407" strokeWidth="3" />
    <line x1="32" y1="42" x2="32" y2="60" stroke="#431407" strokeWidth="3" />
    {/* Top specular bevel */}
    <rect x="8" y="8" width="20" height="4" rx="2" fill="#fb923c" opacity="0.65" />
    <rect x="36" y="8" width="20" height="4" rx="2" fill="#fb923c" opacity="0.65" />
    <rect x="22" y="26" width="20" height="4" rx="2" fill="#fb923c" opacity="0.55" />
    {cracked && (
      <path
        d="M22 10 L30 25 L25 35 L39 49 L35 58"
        fill="none"
        stroke="#fef08a"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )}
  </svg>
);

export const QuestionBlockSvg: React.FC<{ size?: number; className?: string }> = ({
  size = 50,
  className,
}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="mpQBlock" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fde047" />
        <stop offset="100%" stopColor="#d97706" />
      </linearGradient>
    </defs>
    <rect x="4" y="4" width="56" height="56" rx="8" fill="url(#mpQBlock)" stroke="#713f12" strokeWidth="3.2" />
    <circle cx="12" cy="12" r="2.5" fill="#78350f" />
    <circle cx="52" cy="12" r="2.5" fill="#78350f" />
    <circle cx="12" cy="52" r="2.5" fill="#78350f" />
    <circle cx="52" cy="52" r="2.5" fill="#78350f" />
    <path
      d="M23 24 C23 17 41 17 41 25 C41 31 32 32 32 38"
      fill="none"
      stroke="#ffffff"
      strokeWidth="6.5"
      strokeLinecap="round"
    />
    <circle cx="32" cy="48" r="3.8" fill="#ffffff" />
  </svg>
);

export const GoldCoinSvg: React.FC<{ size?: number; className?: string }> = ({
  size = 44,
  className,
}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
    <ellipse cx="32" cy="32" rx="20" ry="25" fill="#facc15" stroke="#854d0e" strokeWidth="3.2" />
    <ellipse cx="32" cy="32" rx="14" ry="19" fill="#fde047" stroke="#ca8a04" strokeWidth="2" />
    <rect x="28.5" y="19" width="7" height="26" rx="3.5" fill="#ca8a04" />
    <rect x="29.5" y="20" width="2.5" height="23" rx="1.2" fill="#fef9c3" />
  </svg>
);

export const ToadstoolSvg: React.FC<{
  capColor: string;
  size?: number;
  className?: string;
}> = ({ capColor, size = 50, className }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
    {/* Stem */}
    <path
      d="M22 36 H42 L44 54 C44 57 40 59 32 59 C24 59 20 57 20 54 Z"
      fill="#fef3c7"
      stroke="#0f172a"
      strokeWidth="2.6"
    />
    {/* Eyes on stem */}
    <ellipse cx="27" cy="46" rx="2.1" ry="3.8" fill="#0f172a" />
    <ellipse cx="37" cy="46" rx="2.1" ry="3.8" fill="#0f172a" />
    {/* Mushroom Cap */}
    <path
      d="M7 36 C7 16 18 7 32 7 C46 7 57 16 57 36 C57 40 48 40 32 40 C16 40 7 40 7 36 Z"
      fill={capColor}
      stroke="#0f172a"
      strokeWidth="2.8"
    />
    {/* Classic white spots */}
    <circle cx="32" cy="18" r="7" fill="#ffffff" opacity="0.95" />
    <circle cx="15" cy="29" r="5" fill="#ffffff" opacity="0.95" />
    <circle cx="49" cy="29" r="5" fill="#ffffff" opacity="0.95" />
  </svg>
);

export const FlagIconSvg: React.FC<{
  flagColor: string;
  size?: number;
  className?: string;
}> = ({ flagColor, size = 28, className }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden="true">
    <rect x="5" y="4" width="3.5" height="25" rx="1.5" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1.2" />
    <circle cx="6.8" cy="4" r="2.6" fill="#facc15" stroke="#0f172a" strokeWidth="1.2" />
    <path
      d="M8.5 6 C14 4 20 9 27 6.5 V18.5 C20 21 14 16 8.5 18.5 Z"
      fill={flagColor}
      stroke="#0f172a"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>
);

export const BowserBalloonSvg: React.FC<{
  fillPct: number;
  overheated: boolean;
}> = ({ fillPct, overheated }) => {
  const scale = 0.62 + (fillPct / 100) * 0.66;
  const hot = fillPct >= 75 || overheated;
  return (
    <svg
      width="160"
      height="160"
      viewBox="0 0 140 140"
      style={{
        transform: `scale(${scale})`,
        transition: 'transform 85ms cubic-bezier(0.22, 1, 0.36, 1)',
      }}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="mpBalloonGrad" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor={hot ? '#fde047' : '#fb7185'} />
          <stop offset="55%" stopColor={hot ? '#ef4444' : '#e11d48'} />
          <stop offset="100%" stopColor="#7f1d1d" />
        </radialGradient>
      </defs>
      {/* Spikes around Bowser balloon */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <polygon
          key={deg}
          points="70,8 64,22 76,22"
          fill="#fef9c3"
          stroke="#450a0a"
          strokeWidth="2"
          transform={`rotate(${deg} 70 66)`}
        />
      ))}
      {/* Balloon body */}
      <circle cx="70" cy="66" r="46" fill="url(#mpBalloonGrad)" stroke="#450a0a" strokeWidth="3.5" />
      {/* Glossy shine */}
      <ellipse cx="52" cy="46" rx="14" ry="8" transform="rotate(-32 52 46)" fill="#ffffff" opacity="0.32" />
      {/* Bowser-inspired eyes */}
      <ellipse cx="56" cy="59" rx="7" ry="8" fill="#ffffff" stroke="#450a0a" strokeWidth="2.2" />
      <ellipse cx="84" cy="59" rx="7" ry="8" fill="#ffffff" stroke="#450a0a" strokeWidth="2.2" />
      <circle cx="58" cy="60" r="3.5" fill="#dc2626" />
      <circle cx="82" cy="60" r="3.5" fill="#dc2626" />
      <path d="M46 49 L63 54 M94 49 L77 54" stroke="#450a0a" strokeWidth="4" strokeLinecap="round" />
      {/* Percentage readout inside */}
      <text
        x="70"
        y="90"
        textAnchor="middle"
        fill="#ffffff"
        stroke="#450a0a"
        strokeWidth="3.5"
        paintOrder="stroke"
        fontSize="21"
        fontWeight="900"
        fontFamily="monospace"
      >
        {fillPct}%
      </text>
      {/* Knot & hose */}
      <polygon points="63,112 77,112 74,122 66,122" fill="#b91c1c" stroke="#450a0a" strokeWidth="2.2" />
      <rect x="67" y="122" width="6" height="14" rx="2" fill="#facc15" stroke="#450a0a" strokeWidth="1.8" />
    </svg>
  );
};

export const GoldenHammerSvg: React.FC<{ size?: number; className?: string }> = ({
  size = 96,
  className,
}) => (
  <svg width={size} height={size} viewBox="0 0 110 90" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="mpHammerGold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="50%" stopColor="#facc15" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>
    </defs>
    {/* Starburst behind hammer */}
    <polygon
      points="80,10 84,21 96,21 86,28 90,40 80,32 70,40 74,28 64,21 76,21"
      fill="#fde047"
      stroke="#78350f"
      strokeWidth="2"
    />
    {/* Wooden handle */}
    <g transform="rotate(-24 50 50)">
      <rect x="44" y="34" width="12" height="50" rx="5" fill="#92400e" stroke="#292524" strokeWidth="2.8" />
      <rect x="47" y="38" width="3" height="40" rx="1.5" fill="#d97706" opacity="0.6" />
      {/* Mega Golden Head */}
      <rect x="20" y="12" width="60" height="30" rx="8" fill="url(#mpHammerGold)" stroke="#451a03" strokeWidth="3.2" />
      <rect x="16" y="16" width="8" height="22" rx="3" fill="#fef08a" stroke="#451a03" strokeWidth="2.4" />
      <rect x="76" y="16" width="8" height="22" rx="3" fill="#fef08a" stroke="#451a03" strokeWidth="2.4" />
      {/* Star emblem on hammer */}
      <polygon
        points="50,18 52.5,24 59,24.5 54,28.5 55.5,35 50,31.5 44.5,35 46,28.5 41,24.5 47.5,24"
        fill="#ffffff"
        opacity="0.9"
      />
    </g>
  </svg>
);

export const FishingRodIconSvg: React.FC<{ size?: number; className?: string }> = ({
  size = 24,
  className,
}) => (
  <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className} aria-hidden="true">
    <path d="M4 24 L17 6 Q21 3 23 8" stroke="#0f172a" strokeWidth="3.2" strokeLinecap="round" />
    <path d="M23 8 V19" stroke="#f8fafc" strokeWidth="1.6" strokeDasharray="2 1" />
    <circle cx="23" cy="21" r="3.6" fill="#ef4444" stroke="#0f172a" strokeWidth="1.6" />
    <path d="M19.6 21 H26.4 A3.4 3.4 0 0 1 19.6 21 Z" fill="#ffffff" />
  </svg>
);

/**
 * Full illustrated Mario Lagoon scene for Cheep-Cheep Fishing (#17)
 * Zero emojis — custom Cheep-Cheep fish, Golden Cheep-Cheep, animated water, dock, rod & bobber!
 */
export const FishingSceneSvg: React.FC<{
  state: 'wait' | 'normal' | 'gold';
}> = ({ state }) => {
  const isGold = state === 'gold';
  const isBiting = state !== 'wait';

  return (
    <svg
      viewBox="0 0 420 180"
      className="w-full h-full block select-none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="fishSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={isGold ? '#1e3a8a' : '#0284c7'} />
          <stop offset="100%" stopColor={isGold ? '#f59e0b' : '#38bdf8'} />
        </linearGradient>
        <linearGradient id="fishWater" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={isGold ? '#0ea5e9' : '#0369a1'} />
          <stop offset="100%" stopColor="#082f49" />
        </linearGradient>
        <linearGradient id="cheepRed" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fb7185" />
          <stop offset="55%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#b91c1c" />
        </linearGradient>
        <linearGradient id="cheepGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fef9c3" />
          <stop offset="50%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>

      {/* Sky */}
      <rect x="0" y="0" width="420" height="96" fill="url(#fishSky)" />

      {/* Distant Mario Rounded Hills */}
      <path d="M180 96 Q220 42 260 96 Z" fill="#15803d" opacity="0.65" />
      <path d="M295 96 Q345 28 395 96 Z" fill="#16a34a" opacity="0.7" />
      {/* Cute fluffy clouds */}
      <g fill="#ffffff" opacity="0.88">
        <ellipse cx="148" cy="30" rx="22" ry="11" />
        <ellipse cx="164" cy="27" rx="16" ry="10" />
        <ellipse cx="330" cy="34" rx="20" ry="10" />
        <ellipse cx="348" cy="31" rx="15" ry="9" />
      </g>

      {/* Water surface & lagoon depth */}
      <rect x="0" y="92" width="420" height="88" fill="url(#fishWater)" />
      {/* Shimmering wave highlights */}
      <path
        d="M0 95 Q35 88 70 95 T140 95 T210 95 T280 95 T350 95 T420 95"
        fill="none"
        stroke="#bae6fd"
        strokeWidth="3.5"
        opacity="0.75"
      />
      <path
        d="M20 120 Q55 115 90 120 M280 126 Q320 120 360 126 M120 152 Q165 147 210 152"
        fill="none"
        stroke="#38bdf8"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.35"
      />

      {/* Wooden Mario Pier on Left */}
      <rect x="0" y="76" width="84" height="16" rx="3" fill="#92400e" stroke="#451a03" strokeWidth="2.4" />
      <rect x="14" y="92" width="12" height="58" fill="#78350f" stroke="#451a03" strokeWidth="2" />
      <rect x="58" y="92" width="12" height="58" fill="#78350f" stroke="#451a03" strokeWidth="2" />

      {/* Fishing Rod curving out from pier */}
      <path
        d={isBiting ? 'M46 78 Q128 18 228 48' : 'M46 78 Q126 10 226 30'}
        fill="none"
        stroke="#fbbf24"
        strokeWidth="5.5"
        strokeLinecap="round"
      />
      <path
        d={isBiting ? 'M46 78 Q128 18 228 48' : 'M46 78 Q126 10 226 30'}
        fill="none"
        stroke="#78350f"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Fishing Line */}
      <line
        x1={isBiting ? 228 : 226}
        y1={isBiting ? 48 : 30}
        x2="232"
        y2={isBiting ? 114 : 98}
        stroke="#f8fafc"
        strokeWidth="2"
        strokeDasharray={isBiting ? undefined : '4 2'}
      />

      {/* Calm underwater silhouettes while waiting */}
      {!isBiting && (
        <g opacity="0.28" fill="#7dd3fc">
          <ellipse cx="160" cy="140" rx="16" ry="8" />
          <polygon points="144,140 135,134 135,146" />
          <ellipse cx="305" cy="146" rx="19" ry="9" />
          <polygon points="324,146 334,139 334,153" />
        </g>
      )}

      {/* Concentric water ripples around bobber */}
      <ellipse
        cx="232"
        cy="104"
        rx={isBiting ? 54 : 28}
        ry={isBiting ? 13 : 6}
        fill="none"
        stroke={isGold ? '#fde047' : '#e0f2fe'}
        strokeWidth={isBiting ? 3 : 2}
        opacity={isBiting ? 0.9 : 0.65}
      />
      {isBiting && (
        <ellipse
          cx="232"
          cy="106"
          rx="76"
          ry="18"
          fill="none"
          stroke={isGold ? '#facc15' : '#7dd3fc'}
          strokeWidth="2.5"
          opacity="0.65"
        />
      )}

      {/* Red-and-White Floating Bobber */}
      <g transform={isBiting ? 'translate(0, 14)' : 'translate(0, 0)'}>
        <circle cx="232" cy="98" r="10" fill="#ef4444" stroke="#0f172a" strokeWidth="2.2" />
        <path d="M222 98 H242 A10 10 0 0 1 222 98 Z" fill="#ffffff" stroke="#0f172a" strokeWidth="1.6" />
        <rect x="230.5" y="83" width="3" height="7" rx="1.5" fill="#fef08a" stroke="#0f172a" strokeWidth="1.2" />
      </g>

      {/* Splash arcs & leaping Cheep-Cheep when biting! */}
      {isBiting && (
        <g>
          {/* Water splash droplets */}
          <g fill={isGold ? '#fef08a' : '#e0f2fe'} stroke="#0284c7" strokeWidth="1.2">
            <circle cx="182" cy="84" r="5" />
            <circle cx="195" cy="68" r="4" />
            <circle cx="282" cy="80" r="5.5" />
            <circle cx="270" cy="64" r="4" />
            <circle cx="212" cy="58" r="3.5" />
            <circle cx="256" cy="56" r="3.5" />
          </g>

          {/* Golden radiant sparkles if Golden Cheep-Cheep */}
          {isGold && (
            <g fill="#fef08a" stroke="#b45309" strokeWidth="1.2">
              <polygon points="172,46 175,54 183,54 177,59 179,67 172,62 165,67 167,59 161,54 169,54" />
              <polygon points="292,38 295,46 303,46 297,51 299,59 292,54 285,59 287,51 281,46 289,46" />
              <polygon points="236,22 239,29 246,29 240,33 242,40 236,36 230,40 232,33 226,29 233,29" />
            </g>
          )}

          {/* Classic Mario Cheep-Cheep Fish Leaping */}
          <g transform="translate(232, 86) rotate(-14)">
            {/* Tail fin */}
            <path
              d="M26 0 L44 -16 Q39 0 44 16 Z"
              fill={isGold ? '#fef08a' : '#facc15'}
              stroke="#0f172a"
              strokeWidth="2.4"
              strokeLinejoin="round"
            />
            {/* Top Mohawk crest */}
            <path
              d="M-8 -22 Q4 -36 16 -20 Q6 -16 -8 -22 Z"
              fill={isGold ? '#fef08a' : '#facc15'}
              stroke="#0f172a"
              strokeWidth="2.2"
            />
            {/* Plump fish body */}
            <ellipse
              cx="0"
              cy="0"
              rx="28"
              ry="23"
              fill={isGold ? 'url(#cheepGold)' : 'url(#cheepRed)'}
              stroke="#0f172a"
              strokeWidth="2.8"
            />
            {/* White belly patch */}
            <path
              d="M-22 6 Q-4 24 20 10 Q4 20 -22 6 Z"
              fill="#ffffff"
              opacity="0.92"
            />
            {/* Wing fin */}
            <path
              d="M2 2 Q18 -6 22 10 Q10 14 2 2 Z"
              fill="#ffffff"
              stroke="#0f172a"
              strokeWidth="2"
            />
            {/* Big cartoon eye */}
            <ellipse cx="-10" cy="-6" rx="7" ry="8.5" fill="#ffffff" stroke="#0f172a" strokeWidth="2.2" />
            <ellipse cx="-12" cy="-6" rx="3.4" ry="4.8" fill="#0f172a" />
            <circle cx="-13" cy="-8.5" r="1.5" fill="#ffffff" />
            {/* Iconic plump Cheep-Cheep lips */}
            <ellipse cx="-29" cy="2" rx="6.5" ry="5" fill={isGold ? '#fde047' : '#fdba74'} stroke="#0f172a" strokeWidth="2.2" />
            <line x1="-35" y1="2" x2="-24" y2="2" stroke="#0f172a" strokeWidth="1.8" />
          </g>
        </g>
      )}
    </svg>
  );
};
