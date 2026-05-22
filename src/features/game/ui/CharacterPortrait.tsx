"use client";

import { CHARACTERS, type CharacterId } from "../config/characters";

interface Props {
  characterId: CharacterId;
  active: boolean;
  className?: string;
}

export function CharacterPortrait({ characterId, active, className }: Props) {
  const char = CHARACTERS[characterId];
  const glow = active ? 1 : 0.4;

  if (characterId === "ninja") {
    return (
      <svg
        className={className}
        viewBox="0 0 100 110"
        style={{ filter: `drop-shadow(0 0 ${active ? 18 : 6}px ${char.accentColor})` }}
      >
        <defs>
          <linearGradient id="ninjaBlade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor={char.bladeColor} />
          </linearGradient>
        </defs>
        <path d="M50 8 L66 28 L66 52 L50 64 L34 52 L34 28 Z" fill={char.bladeColor} opacity={glow} />
        <rect x="47" y="62" width="6" height="36" fill="rgba(240,246,255,0.85)" />
        <line
          x1="22"
          y1="100"
          x2="72"
          y2="50"
          stroke="url(#ninjaBlade)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle cx="50" cy="36" r="3" fill="#ffffff" />
        <rect x="44" y="42" width="12" height="2" fill="rgba(5,3,10,0.7)" />
      </svg>
    );
  }

  if (characterId === "monk") {
    return (
      <svg
        className={className}
        viewBox="0 0 100 110"
        style={{ filter: `drop-shadow(0 0 ${active ? 18 : 6}px ${char.accentColor})` }}
      >
        <circle cx="50" cy="40" r="20" fill={char.bladeColor} opacity={0.18} />
        <circle cx="50" cy="40" r="13" fill={char.bladeColor} opacity={glow} />
        <circle cx="50" cy="40" r="6" fill="#ffffff" />
        <path
          d="M50 60 L34 86 L42 102 L50 90 L58 102 L66 86 Z"
          fill={char.bladeColor}
          opacity={glow * 0.8}
        />
        <circle cx="32" cy="40" r="3" fill={char.bladeColor} opacity={0.7} />
        <circle cx="68" cy="40" r="3" fill={char.bladeColor} opacity={0.7} />
      </svg>
    );
  }

  return (
    <svg
      className={className}
      viewBox="0 0 100 110"
      style={{ filter: `drop-shadow(0 0 ${active ? 18 : 6}px ${char.accentColor})` }}
    >
      <path
        d="M30 12 L68 12 L70 40 L62 50 L62 92 L54 100 L46 100 L38 92 L38 50 L30 40 Z"
        fill={char.bladeColor}
        opacity={glow * 0.85}
      />
      <rect x="42" y="30" width="16" height="4" fill="#ffffff" opacity={glow} />
      <path
        d="M62 64 L88 70 L62 76 Z"
        fill={char.bladeColor}
        opacity={glow}
      />
      <circle cx="62" cy="70" r="4" fill="#ffffff" opacity={glow} />
    </svg>
  );
}
