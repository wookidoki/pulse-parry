import type { BulletKind } from "../types";

export type RunModifierId =
  | "none"
  | "rapidFire"
  | "metalRain"
  | "purist"
  | "stoneHeart"
  | "doubleTime"
  | "glassCannon"
  | "bulletStorm";

export interface RunModifierConfig {
  id: RunModifierId;
  name: { ko: string; en: string };
  description: { ko: string; en: string };
  enemyFireRateMul: number;
  bulletSpeedMul: number;
  spawnRateMul: number;
  bulletKindOverride?: BulletKind;
  scoreMul: number;
  startHpDelta: number;
  perfectWindowMul: number;
  forcedHold: boolean;
  burstShotsBonus: number;
}

export const MODIFIERS: Record<RunModifierId, RunModifierConfig> = {
  none: {
    id: "none",
    name: { ko: "기본", en: "STANDARD" },
    description: { ko: "표준 룰", en: "Standard rules" },
    enemyFireRateMul: 1,
    bulletSpeedMul: 1,
    spawnRateMul: 1,
    scoreMul: 1,
    startHpDelta: 0,
    perfectWindowMul: 1,
    forcedHold: false,
    burstShotsBonus: 0,
  },
  rapidFire: {
    id: "rapidFire",
    name: { ko: "랩 파이어", en: "RAPID FIRE" },
    description: {
      ko: "적 발사 2배 + PERFECT 윈도우 2배 + 점수 1.5배",
      en: "2× fire rate, 2× PERFECT window, 1.5× score",
    },
    enemyFireRateMul: 2,
    bulletSpeedMul: 1.1,
    spawnRateMul: 1,
    scoreMul: 1.5,
    startHpDelta: 0,
    perfectWindowMul: 2,
    forcedHold: false,
    burstShotsBonus: 0,
  },
  metalRain: {
    id: "metalRain",
    name: { ko: "메탈 레인", en: "METAL RAIN" },
    description: {
      ko: "모든 탄막 heavy (2 데미지) + 점수 2배",
      en: "All bullets heavy (2 dmg), 2× score",
    },
    enemyFireRateMul: 0.85,
    bulletSpeedMul: 0.9,
    spawnRateMul: 1,
    bulletKindOverride: "heavy",
    scoreMul: 2,
    startHpDelta: 0,
    perfectWindowMul: 1,
    forcedHold: false,
    burstShotsBonus: 0,
  },
  purist: {
    id: "purist",
    name: { ko: "퓨리스트", en: "PURIST" },
    description: {
      ko: "TAP 금지 (HOLD만 가능) + 점수 1.8배",
      en: "No TAP (HOLD only), 1.8× score",
    },
    enemyFireRateMul: 1,
    bulletSpeedMul: 1,
    spawnRateMul: 1,
    scoreMul: 1.8,
    startHpDelta: 0,
    perfectWindowMul: 1,
    forcedHold: true,
    burstShotsBonus: 0,
  },
  stoneHeart: {
    id: "stoneHeart",
    name: { ko: "스톤 하트", en: "STONE HEART" },
    description: {
      ko: "HP +2 (시작 5) + 적 +50% + 점수 1.3배",
      en: "+2 HP, +50% enemies, 1.3× score",
    },
    enemyFireRateMul: 1,
    bulletSpeedMul: 1,
    spawnRateMul: 1.5,
    scoreMul: 1.3,
    startHpDelta: 2,
    perfectWindowMul: 1,
    forcedHold: false,
    burstShotsBonus: 0,
  },
  doubleTime: {
    id: "doubleTime",
    name: { ko: "더블 타임", en: "DOUBLE TIME" },
    description: {
      ko: "적 발사 1.5배 + 탄속 1.3배 + 스폰 1.3배 + 점수 2.2배",
      en: "1.5× fire rate, 1.3× bullet speed, 1.3× spawn, 2.2× score",
    },
    enemyFireRateMul: 1.5,
    bulletSpeedMul: 1.3,
    spawnRateMul: 1.3,
    scoreMul: 2.2,
    startHpDelta: 0,
    perfectWindowMul: 0.85,
    forcedHold: false,
    burstShotsBonus: 0,
  },
  glassCannon: {
    id: "glassCannon",
    name: { ko: "글래스 캐논", en: "GLASS CANNON" },
    description: {
      ko: "시작 HP 1 + 탄속 0.9배 + 점수 3배",
      en: "Start HP 1, 0.9× bullet speed, 3× score",
    },
    enemyFireRateMul: 1,
    bulletSpeedMul: 0.9,
    spawnRateMul: 1,
    scoreMul: 3,
    startHpDelta: -4,
    perfectWindowMul: 1.2,
    forcedHold: false,
    burstShotsBonus: 0,
  },
  bulletStorm: {
    id: "bulletStorm",
    name: { ko: "불릿 스톰", en: "BULLET STORM" },
    description: {
      ko: "모든 적 +1 추가 탄 + 적 +20% + 점수 1.9배",
      en: "+1 burst shot per enemy, +20% enemies, 1.9× score",
    },
    enemyFireRateMul: 0.95,
    bulletSpeedMul: 1,
    spawnRateMul: 1.2,
    scoreMul: 1.9,
    startHpDelta: 0,
    perfectWindowMul: 1,
    forcedHold: false,
    burstShotsBonus: 1,
  },
};

export const MODIFIER_ORDER: RunModifierId[] = [
  "none",
  "rapidFire",
  "metalRain",
  "purist",
  "stoneHeart",
  "doubleTime",
  "glassCannon",
  "bulletStorm",
];
