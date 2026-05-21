import { PALETTE } from "./palette";
import type { BulletKind, EnemyKind } from "../types";

export interface EnemyKindConfig {
  hp: number;
  beatsPerShot: number;
  bulletKind: BulletKind;
  flightBeats: number;
  burstShots: number;
  burstIntervalBeatFraction: number;
  color: string;
  glowColor: string;
}

export const ENEMY_KINDS: Record<EnemyKind, EnemyKindConfig> = {
  shooter: {
    hp: 2,
    beatsPerShot: 2,
    bulletKind: "normal",
    flightBeats: 1,
    burstShots: 1,
    burstIntervalBeatFraction: 0,
    color: PALETTE.magenta,
    glowColor: PALETTE.magenta,
  },
  burster: {
    hp: 2,
    beatsPerShot: 4,
    bulletKind: "rapid",
    flightBeats: 1,
    burstShots: 3,
    burstIntervalBeatFraction: 0.25,
    color: PALETTE.cyan,
    glowColor: PALETTE.cyan,
  },
  charger: {
    hp: 3,
    beatsPerShot: 6,
    bulletKind: "heavy",
    flightBeats: 2,
    burstShots: 1,
    burstIntervalBeatFraction: 0,
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
