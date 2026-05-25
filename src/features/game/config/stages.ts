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
    tagline: "옴닉 보초 + 스나이퍼. 4박 텔레그래프 무거운 일격 주의.",
    durationMs: 60000,
    tempoMap: [
      { t: 0, bpm: 118 },
      { t: 0.4, bpm: 122 },
      { t: 0.55, bpm: 116 },
      { t: 1, bpm: 122 },
    ],
    maxEnemies: 3,
    enemyKinds: ["shooter", "sniper", "spreader"],
    spawnEveryBeats: 7,
    bgInner: "rgba(28, 240, 255, 0.10)",
    bgOuter: "rgba(255, 43, 214, 0.05)",
    accentMagenta: PALETTE.magenta,
    accentCyan: PALETTE.cyan,
    isBoss: false,
  },
  {
    index: 1,
    name: "ECHO",
    tagline: "거울이 반사된 탄을 되돌려보낸다. CHARGE로 깨라.",
    durationMs: 70000,
    tempoMap: [
      { t: 0, bpm: 122 },
      { t: 0.5, bpm: 126 },
      { t: 1, bpm: 124 },
    ],
    maxEnemies: 3,
    enemyKinds: ["shooter", "mirror", "sniper"],
    spawnEveryBeats: 7,
    bgInner: "rgba(255, 255, 255, 0.08)",
    bgOuter: "rgba(255, 43, 214, 0.10)",
    accentMagenta: PALETTE.magenta,
    accentCyan: "#e5f3ff",
    isBoss: false,
  },
  {
    index: 2,
    name: "FACTORY",
    tagline: "바이러스 점사 + 옴닉 스프레더. 산개탄 코운으로 정리.",
    durationMs: 75000,
    tempoMap: [
      { t: 0, bpm: 128 },
      { t: 0.5, bpm: 132 },
      { t: 1, bpm: 130 },
    ],
    maxEnemies: 3,
    enemyKinds: ["shooter", "burster", "spreader"],
    spawnEveryBeats: 7,
    bgInner: "rgba(247, 255, 58, 0.10)",
    bgOuter: "rgba(177, 75, 255, 0.06)",
    accentMagenta: PALETTE.yellow,
    accentCyan: PALETTE.purple,
    isBoss: false,
  },
  {
    index: 3,
    name: "BLOOM",
    tagline: "PULSER가 8방향 일제 사격. 중심에서 빠져나와라.",
    durationMs: 80000,
    tempoMap: [
      { t: 0, bpm: 138 },
      { t: 0.4, bpm: 144 },
      { t: 0.7, bpm: 140 },
      { t: 1, bpm: 144 },
    ],
    maxEnemies: 4,
    enemyKinds: ["spreader", "pulser", "burster", "shooter"],
    spawnEveryBeats: 6,
    bgInner: "rgba(28, 240, 255, 0.14)",
    bgOuter: "rgba(28, 247, 143, 0.08)",
    accentMagenta: PALETTE.cyan,
    accentCyan: "#1cf78f",
    isBoss: false,
  },
  {
    index: 4,
    name: "OVERDRIVE",
    tagline: "드론 + 바이러스 스파이럴러. 회전탄막에 휘말리지 마라.",
    durationMs: 90000,
    tempoMap: [
      { t: 0, bpm: 150 },
      { t: 0.3, bpm: 158 },
      { t: 0.5, bpm: 150 },
      { t: 1, bpm: 156 },
    ],
    maxEnemies: 4,
    enemyKinds: ["spreader", "burster", "charger", "spiraler", "bomber"],
    spawnEveryBeats: 6,
    bgInner: "rgba(255, 56, 99, 0.14)",
    bgOuter: "rgba(177, 75, 255, 0.07)",
    accentMagenta: PALETTE.red,
    accentCyan: PALETTE.yellow,
    isBoss: false,
  },
  {
    index: 5,
    name: "TRIAGE",
    tagline: "HEALER가 동료를 살린다. 우선 처치하지 않으면 끝없이 회복.",
    durationMs: 95000,
    tempoMap: [
      { t: 0, bpm: 162 },
      { t: 0.4, bpm: 168 },
      { t: 0.6, bpm: 164 },
      { t: 1, bpm: 168 },
    ],
    maxEnemies: 4,
    enemyKinds: ["charger", "healer", "spreader", "mortar", "burster"],
    spawnEveryBeats: 6,
    bgInner: "rgba(28, 247, 143, 0.14)",
    bgOuter: "rgba(177, 75, 255, 0.10)",
    accentMagenta: "#1cf78f",
    accentCyan: PALETTE.purple,
    isBoss: false,
  },
  {
    index: 6,
    name: "CHAOS",
    tagline: "팬텀이 4박마다 순간이동. 박격포가 무게로 짓누른다.",
    durationMs: 105000,
    tempoMap: [
      { t: 0, bpm: 172 },
      { t: 0.4, bpm: 178 },
      { t: 0.6, bpm: 170 },
      { t: 1, bpm: 176 },
    ],
    maxEnemies: 4,
    enemyKinds: ["spiraler", "phantom", "mortar", "spreader", "bomber", "splitter", "mirror"],
    spawnEveryBeats: 5,
    bgInner: "rgba(177, 75, 255, 0.18)",
    bgOuter: "rgba(28, 240, 255, 0.08)",
    accentMagenta: PALETTE.purple,
    accentCyan: PALETTE.magenta,
    isBoss: false,
  },
  {
    index: 7,
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
