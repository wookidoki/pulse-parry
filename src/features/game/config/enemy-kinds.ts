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
    beatsPerShot: 4,
    bulletKind: "normal",
    flightBeats: 2.5,
    burstShots: 1,
    burstIntervalBeatFraction: 0,
    color: PALETTE.magenta,
    glowColor: PALETTE.magenta,
  },
  burster: {
    hp: 2,
    beatsPerShot: 6,
    bulletKind: "rapid",
    flightBeats: 2,
    burstShots: 3,
    burstIntervalBeatFraction: 0.33,
    color: PALETTE.cyan,
    glowColor: PALETTE.cyan,
  },
  charger: {
    hp: 3,
    beatsPerShot: 10,
    bulletKind: "heavy",
    flightBeats: 3.5,
    burstShots: 1,
    burstIntervalBeatFraction: 0,
    color: PALETTE.purple,
    glowColor: PALETTE.purple,
  },
  boss: {
    hp: 18,
    beatsPerShot: 2,
    bulletKind: "normal",
    flightBeats: 2.5,
    burstShots: 2,
    burstIntervalBeatFraction: 0.5,
    color: PALETTE.red,
    glowColor: PALETTE.red,
  },
  sniper: {
    hp: 1,
    beatsPerShot: 8,
    bulletKind: "heavy",
    flightBeats: 4,
    burstShots: 1,
    burstIntervalBeatFraction: 0,
    color: PALETTE.yellow,
    glowColor: PALETTE.yellow,
  },
  spreader: {
    hp: 2,
    beatsPerShot: 4,
    bulletKind: "normal",
    flightBeats: 2.2,
    burstShots: 3,
    burstIntervalBeatFraction: 0.04,
    color: PALETTE.magenta,
    glowColor: PALETTE.magenta,
  },
  spiraler: {
    hp: 2,
    beatsPerShot: 5,
    bulletKind: "rapid",
    flightBeats: 2,
    burstShots: 6,
    burstIntervalBeatFraction: 0.16,
    color: PALETTE.cyan,
    glowColor: PALETTE.cyan,
  },
  phantom: {
    hp: 1,
    beatsPerShot: 3,
    bulletKind: "rapid",
    flightBeats: 1.8,
    burstShots: 1,
    burstIntervalBeatFraction: 0,
    color: PALETTE.magenta,
    glowColor: PALETTE.magenta,
  },
  mortar: {
    hp: 2,
    beatsPerShot: 6,
    bulletKind: "heavy",
    flightBeats: 4,
    burstShots: 1,
    burstIntervalBeatFraction: 0,
    color: PALETTE.purple,
    glowColor: PALETTE.purple,
  },
  bomber: {
    hp: 2,
    beatsPerShot: 999,
    bulletKind: "normal",
    flightBeats: 2,
    burstShots: 1,
    burstIntervalBeatFraction: 0,
    color: PALETTE.red,
    glowColor: PALETTE.red,
  },
  splitter: {
    hp: 3,
    beatsPerShot: 5,
    bulletKind: "rapid",
    flightBeats: 2.2,
    burstShots: 2,
    burstIntervalBeatFraction: 0.18,
    color: PALETTE.cyan,
    glowColor: PALETTE.cyan,
  },
  shard: {
    hp: 1,
    beatsPerShot: 3,
    bulletKind: "rapid",
    flightBeats: 1.6,
    burstShots: 1,
    burstIntervalBeatFraction: 0,
    color: PALETTE.cyan,
    glowColor: PALETTE.cyan,
  },
  mirror: {
    hp: 3,
    beatsPerShot: 8,
    bulletKind: "normal",
    flightBeats: 2.5,
    burstShots: 1,
    burstIntervalBeatFraction: 0,
    color: "#ffffff",
    glowColor: PALETTE.magenta,
  },
  healer: {
    hp: 3,
    beatsPerShot: 10,
    bulletKind: "normal",
    flightBeats: 3,
    burstShots: 1,
    burstIntervalBeatFraction: 0,
    color: "#1cf78f",
    glowColor: "#1cf78f",
  },
  pulser: {
    hp: 2,
    beatsPerShot: 6,
    bulletKind: "rapid",
    flightBeats: 2.4,
    burstShots: 8,
    burstIntervalBeatFraction: 0.04,
    color: PALETTE.cyan,
    glowColor: PALETTE.cyan,
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
  heal: {
    radius: 12,
    damage: 0,
    color: "#1cf78f",
    trailColor: "rgba(28, 247, 143, 0.5)",
  },
};
