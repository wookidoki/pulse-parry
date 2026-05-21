import { PALETTE } from "./palette";

export interface StageConfig {
  index: number;
  name: string;
  durationMs: number;
  bpm: number;
  maxEnemies: number;
  enemyHp: number;
  beatsPerShot: number;
  bulletSpeed: number;
  spawnEveryBeats: number;
  bgInner: string;
  bgOuter: string;
  accentMagenta: string;
  accentCyan: string;
}

export const STAGES: StageConfig[] = [
  {
    index: 0,
    name: "AWAKEN",
    durationMs: 30000,
    bpm: 96,
    maxEnemies: 2,
    enemyHp: 2,
    beatsPerShot: 4,
    bulletSpeed: 240,
    spawnEveryBeats: 8,
    bgInner: "rgba(28, 240, 255, 0.10)",
    bgOuter: "rgba(255, 43, 214, 0.05)",
    accentMagenta: PALETTE.magenta,
    accentCyan: PALETTE.cyan,
  },
  {
    index: 1,
    name: "PULSE",
    durationMs: 30000,
    bpm: 120,
    maxEnemies: 3,
    enemyHp: 2,
    beatsPerShot: 2,
    bulletSpeed: 290,
    spawnEveryBeats: 6,
    bgInner: "rgba(177, 75, 255, 0.12)",
    bgOuter: "rgba(28, 240, 255, 0.06)",
    accentMagenta: PALETTE.purple,
    accentCyan: PALETTE.cyan,
  },
  {
    index: 2,
    name: "OVERDRIVE",
    durationMs: 45000,
    bpm: 144,
    maxEnemies: 4,
    enemyHp: 3,
    beatsPerShot: 2,
    bulletSpeed: 340,
    spawnEveryBeats: 4,
    bgInner: "rgba(255, 56, 99, 0.14)",
    bgOuter: "rgba(177, 75, 255, 0.07)",
    accentMagenta: PALETTE.red,
    accentCyan: PALETTE.yellow,
  },
];

export function currentStage(stageIndex: number): StageConfig {
  return STAGES[Math.min(stageIndex, STAGES.length - 1)];
}

export const FINAL_STAGE_INDEX = STAGES.length - 1;
