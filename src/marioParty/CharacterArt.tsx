import React from 'react';
import { PARTY_CHARACTER_MAP, type PartyCharacterId } from './types';

/**
 * Hand-crafted SVG portrait for each of the 8 playable Mario-inspired heroes.
 * Used on Character Selection cards, Friend Lists, Invites, and Podiums.
 */
export const HeroAvatarSvg: React.FC<{
  characterId: PartyCharacterId;
  size?: number;
  className?: string;
}> = ({ characterId, size = 64, className = '' }) => {
  const c = PARTY_CHARACTER_MAP[characterId] ?? PARTY_CHARACTER_MAP.marco;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      className={className}
      aria-label={c.nameEn}
    >
      {/* Background Medallion */}
      <defs>
        <radialGradient id={`bg-${c.id}`} cx="35%" cy="28%" r="75%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
          <stop offset="100%" stopColor={c.secondary} stopOpacity="0.92" />
        </radialGradient>
      </defs>
      <circle cx="40" cy="40" r="37" fill={`url(#bg-${c.id})`} stroke={c.accent} strokeWidth="3.2" />

      {/* Overalls / Shoulders */}
      <path
        d="M17 71 C20 56, 60 56, 63 71 Z"
        fill={c.secondary}
        stroke="#0f172a"
        strokeWidth="2.4"
      />
      <circle cx="31" cy="64" r="3" fill={c.accent} />
      <circle cx="49" cy="64" r="3" fill={c.accent} />

      {/* Head / Face */}
      <ellipse
        cx="40"
        cy="43"
        rx="16.5"
        ry="15.5"
        fill={c.skin}
        stroke="#0f172a"
        strokeWidth="2.4"
      />

      {/* Character-Specific Headgear */}
      {characterId === 'rosa' || characterId === 'rosy' ? (
        <>
          {/* Flowing Hair */}
          <path
            d="M22 44 C19 25, 61 25, 58 44 C56 34, 24 34, 22 44 Z"
            fill={characterId === 'rosa' ? '#facc15' : '#fef08a'}
            stroke="#0f172a"
            strokeWidth="2"
          />
          {/* Royal Tiara / Crown */}
          <path
            d="M27 28 L31 15 L40 23 L49 15 L53 28 Z"
            fill={c.accent}
            stroke="#0f172a"
            strokeWidth="2.2"
          />
          <circle cx="40" cy="24" r="2.6" fill={c.primary} />
        </>
      ) : characterId === 'toady' ? (
        <>
          {/* Spotted Mushroom Cap */}
          <ellipse
            cx="40"
            cy="24"
            rx="22"
            ry="14"
            fill="#ffffff"
            stroke="#0f172a"
            strokeWidth="2.4"
          />
          <circle cx="40" cy="21" r="6" fill={c.primary} />
          <circle cx="24" cy="25" r="4.5" fill={c.accent} />
          <circle cx="56" cy="25" r="4.5" fill={c.accent} />
        </>
      ) : characterId === 'yosho' ? (
        <>
          {/* Cute Dino Crest & Snout */}
          <path d="M36 16 L40 8 L45 16 Z" fill={c.accent} stroke="#0f172a" strokeWidth="2" />
          <path d="M44 18 L51 12 L52 21 Z" fill={c.accent} stroke="#0f172a" strokeWidth="2" />
          <ellipse
            cx="40"
            cy="46"
            rx="11"
            ry="7"
            fill="#84cc16"
            stroke="#0f172a"
            strokeWidth="2"
          />
        </>
      ) : characterId === 'koopa' ? (
        <>
          {/* Spiky Horns & Fiery Tuft */}
          <path d="M25 29 L19 16 L31 23 Z" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
          <path d="M55 29 L61 16 L49 23 Z" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
          <path
            d="M32 25 L40 12 L48 25 Z"
            fill="#ef4444"
            stroke="#0f172a"
            strokeWidth="2"
          />
        </>
      ) : (
        <>
          {/* Iconic Plumber Cap (Marco, Lugo, Wario) */}
          <path
            d="M21 34 C22 15, 58 15, 59 34 Z"
            fill={c.primary}
            stroke="#0f172a"
            strokeWidth="2.4"
          />
          <ellipse
            cx="40"
            cy="34"
            rx="21"
            ry="4.2"
            fill={c.primary}
            stroke="#0f172a"
            strokeWidth="2.2"
          />
          <circle cx="40" cy="24" r="6.2" fill="#ffffff" stroke="#0f172a" strokeWidth="1.6" />
          <text
            x="40"
            y="27.5"
            textAnchor="middle"
            fontSize="9.5"
            fontWeight="900"
            fill={c.primary}
          >
            {c.emblem}
          </text>
        </>
      )}

      {/* Expressive Eyes */}
      <ellipse cx="34" cy="41" rx="2.7" ry="4.1" fill="#0f172a" />
      <ellipse cx="46" cy="41" rx="2.7" ry="4.1" fill="#0f172a" />
      <circle cx="33.2" cy="39.5" r="1.1" fill="#ffffff" />
      <circle cx="45.2" cy="39.5" r="1.1" fill="#ffffff" />

      {/* Mustache or Cheerful Smile */}
      {characterId === 'marco' || characterId === 'lugo' || characterId === 'wario' ? (
        <path
          d={
            characterId === 'wario'
              ? 'M26 48 L33 52 L40 48 L47 52 L54 48 L48 54 L40 51 L32 54 Z'
              : 'M29 49 Q34 54 40 50 Q46 54 51 49 Q45 46 40 48 Q35 46 29 49 Z'
          }
          fill="#29170a"
        />
      ) : (
        <path
          d="M34 49 Q40 54 46 49"
          fill="none"
          stroke="#0f172a"
          strokeWidth="2.3"
          strokeLinecap="round"
        />
      )}

      {/* Nose for cap heroes */}
      {(characterId === 'marco' || characterId === 'lugo' || characterId === 'wario') && (
        <ellipse
          cx="40"
          cy="45.5"
          rx="4.2"
          ry="3.1"
          fill={characterId === 'wario' ? '#f472b6' : c.skin}
          stroke="#0f172a"
          strokeWidth="1.6"
        />
      )}
    </svg>
  );
};

/**
 * Draws the player's chosen Mario-style hero directly inside any 2D Canvas mini-game!
 * Crisp outlines, animated running feet, hat/crown silhouette, and emblem.
 */
export function drawHeroSprite(
  ctx: CanvasRenderingContext2D,
  characterId: PartyCharacterId,
  x: number,
  y: number,
  size: number,
  facing: 1 | -1 = 1,
  animPhase = 0,
  jumping = false,
  alpha = 1
): void {
  const c = PARTY_CHARACTER_MAP[characterId] ?? PARTY_CHARACTER_MAP.marco;
  const r = size * 0.5;
  const stride = jumping ? 0.35 : Math.sin(animPhase * 11) * 0.28;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.scale(facing, 1);

  // Soft Ground Shadow when near feet
  ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.94, r * 0.68, r * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Animated Boots
  ctx.fillStyle = '#451a03';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(-r * 0.26 + stride * r * 0.6, r * 0.78, r * 0.24, r * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(r * 0.26 - stride * r * 0.6, r * 0.78, r * 0.24, r * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Torso / Overalls
  ctx.fillStyle = c.secondary;
  ctx.beginPath();
  ctx.roundRect(-r * 0.46, r * 0.05, r * 0.92, r * 0.68, r * 0.22);
  ctx.fill();
  ctx.stroke();

  // Shirt Sleeves + Gloves
  ctx.fillStyle = c.primary;
  ctx.beginPath();
  ctx.arc(-r * 0.52, r * 0.34 - stride * r * 0.3, r * 0.19, 0, Math.PI * 2);
  ctx.arc(r * 0.52, r * 0.34 + stride * r * 0.3, r * 0.19, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Gold Overalls Buttons
  ctx.fillStyle = c.accent;
  ctx.beginPath();
  ctx.arc(-r * 0.18, r * 0.32, r * 0.08, 0, Math.PI * 2);
  ctx.arc(r * 0.18, r * 0.32, r * 0.08, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = c.skin;
  ctx.beginPath();
  ctx.arc(0, -r * 0.24, r * 0.46, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Hat / Crown / Mushroom Cap
  if (characterId === 'toady') {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.64, r * 0.64, r * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = c.primary;
    ctx.beginPath();
    ctx.arc(0, -r * 0.72, r * 0.18, 0, Math.PI * 2);
    ctx.arc(-r * 0.38, -r * 0.6, r * 0.14, 0, Math.PI * 2);
    ctx.arc(r * 0.38, -r * 0.6, r * 0.14, 0, Math.PI * 2);
    ctx.fill();
  } else if (characterId === 'rosa' || characterId === 'rosy') {
    ctx.fillStyle = c.accent;
    ctx.beginPath();
    ctx.moveTo(-r * 0.36, -r * 0.6);
    ctx.lineTo(-r * 0.26, -r * 0.98);
    ctx.lineTo(0, -r * 0.74);
    ctx.lineTo(r * 0.26, -r * 0.98);
    ctx.lineTo(r * 0.36, -r * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (characterId === 'koopa') {
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(-r * 0.38, -r * 0.58);
    ctx.lineTo(-r * 0.56, -r * 0.96);
    ctx.lineTo(-r * 0.16, -r * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(r * 0.38, -r * 0.58);
    ctx.lineTo(r * 0.56, -r * 0.96);
    ctx.lineTo(r * 0.16, -r * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(-r * 0.22, -r * 0.66);
    ctx.lineTo(0, -r * 1.02);
    ctx.lineTo(r * 0.22, -r * 0.66);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (characterId === 'yosho') {
    ctx.fillStyle = c.accent;
    ctx.beginPath();
    ctx.moveTo(-r * 0.32, -r * 0.65);
    ctx.lineTo(-r * 0.14, -r * 0.98);
    ctx.lineTo(r * 0.05, -r * 0.68);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    // Classic Cap (Marco, Lugo, Wario)
    ctx.fillStyle = c.primary;
    ctx.beginPath();
    ctx.arc(0, -r * 0.44, r * 0.48, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Visor pointing forward
    ctx.beginPath();
    ctx.ellipse(r * 0.22, -r * 0.46, r * 0.44, r * 0.13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Emblem Circle
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(r * 0.1, -r * 0.68, r * 0.16, 0, Math.PI * 2);
    ctx.fill();
  }

  // Eyes (looking forward)
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.ellipse(r * 0.18, -r * 0.28, r * 0.08, r * 0.13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(r * 0.2, -r * 0.32, r * 0.035, 0, Math.PI * 2);
  ctx.fill();

  // Mustache for Marco/Lugo/Wario
  if (characterId === 'marco' || characterId === 'lugo' || characterId === 'wario') {
    ctx.fillStyle = '#29170a';
    ctx.beginPath();
    ctx.ellipse(r * 0.22, -r * 0.09, r * 0.24, r * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
