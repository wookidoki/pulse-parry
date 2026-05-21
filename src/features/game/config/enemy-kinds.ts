import { PALETTE } from "./palette";
import type { BulletKind, EnemyKind } from "../types";

export interface EnemyKindConfig {
  hp: number;
  beatsPerShot: number;
  bulletKind: BulletKind;
  bulletSpeedMul: number;
  burstShots: number;
  burstIntervalMs: number;
  color: string;
  glowColor: string;
}

export const ENEMY_KINDS: Record<EnemyKind, EnemyKindConfig> = {
  shooter: {
    hp: 2,
    beatsPerShot: 4,
    bulletKind: "normal",
    bulletSpeedMul: 1.0,
    burstShots: 1,
    burstIntervalMs: 0,
    color: PALETTE.magenta,
    glowColor: PALETTE.magenta,
  },
  burster: {
    hp: 2,
    beatsPerShot: 6,
    bulletKind: "rapid",
    bulletSpeedMul: 1.25,
    burstShots: 3,
    burstIntervalMs: 130,
    color: PALETTE.cyan,
    glowColor: PALETTE.cyan,
  },
  charger: {
    hp: 3,
    beatsPerShot: 8,
    bulletKind: "heavy",
    bulletSpeedMul: 0.7,
    burstShots: 1,
    burstIntervalMs: 0,
    color: PALETTE.purple,
    glowColor: PALETTE.purple,
  },
};

export interface BulletKindConfig {
  radius: number;
  damage: number;
  color: string;
  trailColor: string;
}

export const BULLET_KINDS: Record<BulletKind, BulletKindConfig> = {
  normal: {
    radius: 7,
    damage: 1,
    color: PALETTE.red,
    trailColor: "rgba(255, 56, 99, 0.45)",
  },
  rapid: {
    radius: 5,
    damage: 1,
    color: PALETTE.cyan,
    trailColor: "rgba(28, 240, 255, 0.45)",
  },
  heavy: {
    radius: 13,
    damage: 2,
    color: PALETTE.purple,
    trailColor: "rgba(177, 75, 255, 0.5)",
  },
};
