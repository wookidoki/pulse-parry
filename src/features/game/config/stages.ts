import { PALETTE } from "./palette";
import type { EnemyKind } from "../types";

export interface TempoPoint {
  t: number;
  bpm: number;
}

export interface StageConfig {
  index: number;
  name: string;
  tagline: string;
  durationMs: number;
  tempoMap: TempoPoint[];
  maxEnemies: number;
  enemyKinds: EnemyKind[];
  spawnEveryBeats: number;
  bgInner: string;
  bgOuter: string;
  accentMagenta: string;
  accentCyan: string;
  isBoss: boolean;
}

export const STAGES: StageConfig[] = [
  {
    index: 0,
    name: "INFILTRATION",
    tagline: "옴닉 보초들이 깨어난다. 박자에 맞춰 쳐내라.",
    durationMs: 60000,
    tempoMap: [
      { t: 0, bpm: 118 },
      { t: 0.4, bpm: 122 },
      { t: 0.55, bpm: 116 },
      { t: 1, bpm: 122 },
    ],
    maxEnemies: 2,
    enemyKinds: ["shooter"],
    spawnEveryBeats: 10,
    bgInner: "rgba(28, 240, 255, 0.10)",
    bgOuter: "rgba(255, 43, 214, 0.05)",
    accentMagenta: PALETTE.magenta,
    accentCyan: PALETTE.cyan,
    isBoss: false,
  },
  {
    index: 1,
    name: "FACTORY",
    tagline: "바이러스 군체가 합류한다. 점사 3연발 주의.",
    durationMs: 75000,
    tempoMap: [
      { t: 0, bpm: 128 },
      { t: 0.5, bpm: 132 },
      { t: 1, bpm: 130 },
    ],
    maxEnemies: 3,
    enemyKinds: ["shooter", "burster"],
    spawnEveryBeats: 7,
    bgInner: "rgba(247, 255, 58, 0.10)",
    bgOuter: "rgba(177, 75, 255, 0.06)",
    accentMagenta: PALETTE.yellow,
    accentCyan: PALETTE.purple,
    isBoss: false,
  },
  {
    index: 2,
    name: "OVERDRIVE",
    tagline: "보안 드론 출격. 무거운 일격 — 차지 패링으로 받아쳐라.",
    durationMs: 90000,
    tempoMap: [
      { t: 0, bpm: 150 },
      { t: 0.3, bpm: 158 },
      { t: 0.5, bpm: 150 },
      { t: 1, bpm: 156 },
    ],
    maxEnemies: 4,
    enemyKinds: ["shooter", "burster", "charger"],
    spawnEveryBeats: 6,
    bgInner: "rgba(255, 56, 99, 0.14)",
    bgOuter: "rgba(177, 75, 255, 0.07)",
    accentMagenta: PALETTE.red,
    accentCyan: PALETTE.yellow,
    isBoss: false,
  },
  {
    index: 3,
    name: "CHAOS",
    tagline: "옴닉도 바이러스도 드론도 함께. 신호가 일그러진다.",
    durationMs: 105000,
    tempoMap: [
      { t: 0, bpm: 172 },
      { t: 0.4, bpm: 178 },
      { t: 0.6, bpm: 170 },
      { t: 1, bpm: 176 },
    ],
    maxEnemies: 4,
    enemyKinds: ["shooter", "burster", "charger"],
    spawnEveryBeats: 5,
    bgInner: "rgba(177, 75, 255, 0.18)",
    bgOuter: "rgba(28, 240, 255, 0.08)",
    accentMagenta: PALETTE.purple,
    accentCyan: PALETTE.magenta,
    isBoss: false,
  },
  {
    index: 4,
    name: "REVOLT",
    tagline: "본체 — THE CORE. 박자에 맞춰 모든 코어를 부숴라.",
    durationMs: 180000,
    tempoMap: [
      { t: 0, bpm: 176 },
      { t: 0.4, bpm: 184 },
      { t: 0.6, bpm: 174 },
      { t: 1, bpm: 184 },
    ],
    maxEnemies: 1,
    enemyKinds: ["boss"],
    spawnEveryBeats: 1,
    bgInner: "rgba(255, 56, 99, 0.22)",
    bgOuter: "rgba(255, 43, 214, 0.12)",
    accentMagenta: PALETTE.red,
    accentCyan: PALETTE.magenta,
    isBoss: true,
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
