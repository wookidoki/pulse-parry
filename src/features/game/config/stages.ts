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
  /** Optional 1-2 sentence story snippet shown on stage entry. */
  lore?: { ko: string; en: string };
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
    lore: {
      ko: "침투 프로토콜 가동. 시스템의 심장박동이 이제 너의 박자다. 깨진 격자 너머 — 코어까지 내려가 정화하라.",
      en: "Purge protocol live. The system's heartbeat is your beat now. Past the broken grid — descend to the core and cleanse it.",
    },
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
    lore: {
      ko: "첫 방어층은 거울로 되어 있다. 네 일격이 메아리처럼 돌아온다 — 더 깊이 베어야 통과한다.",
      en: "The first defense layer is mirrors. Your strike echoes back — cut deeper to break through.",
    },
    durationMs: 70000,
    tempoMap: [
      { t: 0, bpm: 122 },
      { t: 0.5, bpm: 126 },
      { t: 1, bpm: 124 },
    ],
    maxEnemies: 3,
    enemyKinds: ["shooter", "mirror", "sniper", "rusher"],
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
    lore: {
      ko: "변종이 깨어나는 생산층. 코어가 너의 신호를 읽기 시작했다 — 멈추는 순간 들킨다.",
      en: "The fabrication layer stirs with variants. The core reads your signal now — stop moving and it sees you.",
    },
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
    lore: {
      ko: "탄이 꽃처럼 만개한다. 시스템이 너를 에워싸려 한다 — 박자 사이 빈틈으로 흘러라.",
      en: "Fire blooms in every direction. The system moves to surround you — flow through the gaps in the beat.",
    },
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
    lore: {
      ko: "심장박동이 임계를 넘었다. 시스템이 가속한다 — 회전탄막의 나선에 휘말리면 끝이다.",
      en: "The heartbeat crosses redline. The system overclocks — caught in the spiral, you're gone.",
    },
    durationMs: 90000,
    tempoMap: [
      { t: 0, bpm: 150 },
      { t: 0.3, bpm: 158 },
      { t: 0.5, bpm: 150 },
      { t: 1, bpm: 156 },
    ],
    maxEnemies: 4,
    enemyKinds: ["spreader", "burster", "charger", "spiraler", "bomber", "rusher"],
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
    lore: {
      ko: "시스템이 스스로를 치료한다. 회복선을 먼저 끊지 않으면 — 이 싸움은 영원히 끝나지 않는다.",
      en: "The system heals itself. Sever the lifelines first, or this never ends.",
    },
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
    lore: {
      ko: "패턴이 무너지고 본능과 박자만 남는다. 코어가 바로 아래에 있다 — 그것이 너를 똑바로 본다.",
      en: "Patterns collapse to instinct and beat. The core is just below — and it is looking right at you.",
    },
    durationMs: 105000,
    tempoMap: [
      { t: 0, bpm: 172 },
      { t: 0.4, bpm: 178 },
      { t: 0.6, bpm: 170 },
      { t: 1, bpm: 176 },
    ],
    maxEnemies: 4,
    enemyKinds: ["spiraler", "phantom", "mortar", "spreader", "bomber", "splitter", "mirror", "rusher"],
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
    lore: {
      ko: "THE CORE — 시스템의 심장이 깨어났다. 마지막 비트, 박자에서 떨어지는 순간 모든 게 끝난다.",
      en: "THE CORE — the system's heart awakens. Final beat: fall off the rhythm and it is over.",
    },
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
