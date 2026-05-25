import { PALETTE } from "./palette";

export type CharacterId = "ninja" | "monk" | "netrunner" | "conductor";

export type BladeShape = "katana" | "staff" | "razor" | "baton";

export interface CharacterStats {
  id: CharacterId;
  name: { ko: string; en: string };
  tagline: { ko: string; en: string };
  ability: { ko: string; en: string };
  coneAngleRad: number;
  parryRange: number;
  reflectSpeed: number;
  perfectWindowMs: number;
  dashSpeed: number;
  dashCooldownMs: number;
  maxHp: number;
  bladeColor: string;
  accentColor: string;
  bladeLengthIdle: number;
  bladeLengthParry: number;
  reflectDamageMul: number;
  bladeShape: BladeShape;
}

export const CHARACTERS: Record<CharacterId, CharacterStats> = {
  ninja: {
    id: "ninja",
    name: { ko: "사이버 닌자", en: "CYBER NINJA" },
    tagline: { ko: "균형 잡힌 광선검 마스터", en: "Balanced lightblade master" },
    ability: { ko: "CHARGE +1 데미지", en: "CHARGE deals +1 damage" },
    coneAngleRad: (50 * Math.PI) / 180,
    parryRange: 140,
    reflectSpeed: 880,
    perfectWindowMs: 160,
    dashSpeed: 760,
    dashCooldownMs: 1400,
    maxHp: 3,
    bladeColor: PALETTE.cyan,
    accentColor: PALETTE.cyan,
    bladeLengthIdle: 38,
    bladeLengthParry: 64,
    reflectDamageMul: 1.0,
    bladeShape: "katana",
  },
  monk: {
    id: "monk",
    name: { ko: "디지털 몽크", en: "DIGITAL MONK" },
    tagline: { ko: "넓은 결계, 다중 흡수", en: "Wide barrier, multi-absorb" },
    ability: { ko: "넓은 코운 + HP +1", en: "Wider cone, +1 HP" },
    coneAngleRad: (68 * Math.PI) / 180,
    parryRange: 160,
    reflectSpeed: 700,
    perfectWindowMs: 190,
    dashSpeed: 640,
    dashCooldownMs: 1200,
    maxHp: 4,
    bladeColor: PALETTE.yellow,
    accentColor: PALETTE.yellow,
    bladeLengthIdle: 30,
    bladeLengthParry: 52,
    reflectDamageMul: 0.85,
    bladeShape: "staff",
  },
  netrunner: {
    id: "netrunner",
    name: { ko: "넷러너", en: "NETRUNNER" },
    tagline: { ko: "정밀 사격, 한 번에 끝낸다", en: "Precise, lethal, fast" },
    ability: { ko: "빠른 반사 + 좁은 코운", en: "Faster reflect, narrow cone" },
    coneAngleRad: (32 * Math.PI) / 180,
    parryRange: 125,
    reflectSpeed: 1140,
    perfectWindowMs: 130,
    dashSpeed: 920,
    dashCooldownMs: 1100,
    maxHp: 2,
    bladeColor: PALETTE.red,
    accentColor: PALETTE.red,
    bladeLengthIdle: 46,
    bladeLengthParry: 78,
    reflectDamageMul: 1.4,
    bladeShape: "razor",
  },
  conductor: {
    id: "conductor",
    name: { ko: "컨덕터", en: "CONDUCTOR" },
    tagline: { ko: "박자의 지휘자, PERFECT 마스터", en: "Maestro of the beat — PERFECT master" },
    ability: { ko: "넓은 PERFECT 윈도우 + 긴 반사", en: "Wider PERFECT window, longer reach" },
    coneAngleRad: (42 * Math.PI) / 180,
    parryRange: 150,
    reflectSpeed: 1000,
    perfectWindowMs: 220,
    dashSpeed: 800,
    dashCooldownMs: 1300,
    maxHp: 2,
    bladeColor: PALETTE.magenta,
    accentColor: PALETTE.magenta,
    bladeLengthIdle: 50,
    bladeLengthParry: 82,
    reflectDamageMul: 1.15,
    bladeShape: "baton",
  },
};

export const CHARACTER_ORDER: CharacterId[] = ["ninja", "monk", "netrunner", "conductor"];
