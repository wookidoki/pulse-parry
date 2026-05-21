import { PALETTE } from "./palette";
import type { EnemyKind } from "../types";

export interface TempoPoint {
  t: number;
  bpm: number;
}

export interface StageConfig {
  index: number;
  name: string;
  durationMs: number;
  tempoMap: TempoPoint[];
  maxEnemies: number;
  enemyKinds: EnemyKind[];
  bulletSpeed: number;
  spawnEveryBeats: number;
  bgInner: string;
  bgOuter: string;
  accentMagenta: string;
  accentCyan: string;
}

export const BPM_REFERENCE = 120;

export const STAGES: StageConfig[] = [
  {
    index: 0,
    name: "AWAKEN",
    durationMs: 30000,
    tempoMap: [
      { t: 0, bpm: 80 },
      { t: 0.6, bpm: 100 },
      { t: 1, bpm: 110 },
    ],
    maxEnemies: 2,
    enemyKinds: ["shooter"],
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
    durationMs: 35000,
    tempoMap: [
      { t: 0, bpm: 105 },
      { t: 0.35, bpm: 135 },
      { t: 0.5, bpm: 95 },
      { t: 0.65, bpm: 100 },
      { t: 1, bpm: 135 },
    ],
    maxEnemies: 3,
    enemyKinds: ["shooter", "burster"],
    bulletSpeed: 280,
    spawnEveryBeats: 6,
    bgInner: "rgba(177, 75, 255, 0.12)",
    bgOuter: "rgba(28, 240, 255, 0.06)",
    accentMagenta: PALETTE.purple,
    accentCyan: PALETTE.cyan,
  },
  {
    index: 2,
    name: "OVERDRIVE",
    durationMs: 55000,
    tempoMap: [
      { t: 0, bpm: 110 },
      { t: 0.25, bpm: 160 },
      { t: 0.45, bpm: 75 },
      { t: 0.55, bpm: 78 },
      { t: 0.7, bpm: 130 },
      { t: 1, bpm: 178 },
    ],
    maxEnemies: 4,
    enemyKinds: ["shooter", "burster", "charger"],
    bulletSpeed: 320,
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

export function tempoRangeOf(stage: StageConfig): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;
  for (const point of stage.tempoMap) {
    if (point.bpm < min) min = point.bpm;
    if (point.bpm > max) max = point.bpm;
  }
  return { min: Math.round(min), max: Math.round(max) };
}
