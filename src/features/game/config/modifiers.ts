import type { BulletKind } from "../types";

export type RunModifierId = "none" | "rapidFire" | "metalRain" | "purist" | "stoneHeart";

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
  },
};

export const MODIFIER_ORDER: RunModifierId[] = [
  "none",
  "rapidFire",
  "metalRain",
  "purist",
  "stoneHeart",
];
