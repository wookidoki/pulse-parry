import { PALETTE } from "./palette";

export type AchievementId =
  | "FIRST_BLOOD"
  | "FIRST_STAGE"
  | "RHYTHM_MASTER"
  | "PERFECT_TUNE"
  | "UNTOUCHED"
  | "PRECISION"
  | "CORE_BREAKER"
  | "BOSS_S"
  | "NIGHTMARE"
  | "PURIST_CLEAR"
  | "ENDLESS_3"
  | "ENDLESS_5"
  | "ALL_CHARACTERS"
  | "ALL_CLEAR";

export interface AchievementDef {
  id: AchievementId;
  name: { ko: string; en: string };
  desc: { ko: string; en: string };
  glyph: string;
  color: string;
}

export const ACHIEVEMENTS: Record<AchievementId, AchievementDef> = {
  FIRST_BLOOD: {
    id: "FIRST_BLOOD",
    name: { ko: "첫 일격", en: "FIRST BLOOD" },
    desc: { ko: "적 10명 처치", en: "Defeat 10 enemies" },
    glyph: "⚔",
    color: PALETTE.cyan,
  },
  FIRST_STAGE: {
    id: "FIRST_STAGE",
    name: { ko: "침투", en: "INFILTRATION" },
    desc: { ko: "스테이지 1 클리어", en: "Clear stage 1" },
    glyph: "▶",
    color: PALETTE.cyan,
  },
  RHYTHM_MASTER: {
    id: "RHYTHM_MASTER",
    name: { ko: "리듬 마스터", en: "RHYTHM MASTER" },
    desc: { ko: "한 판 100 콤보 달성", en: "Reach 100 combo in one run" },
    glyph: "♫",
    color: PALETTE.magenta,
  },
  PERFECT_TUNE: {
    id: "PERFECT_TUNE",
    name: { ko: "완벽 조율", en: "PERFECT TUNE" },
    desc: { ko: "한 판 PERFECT 50회", en: "50 PERFECT parries in one run" },
    glyph: "✦",
    color: "#ffffff",
  },
  UNTOUCHED: {
    id: "UNTOUCHED",
    name: { ko: "무결점", en: "UNTOUCHED" },
    desc: { ko: "무피해로 한 스테이지 클리어", en: "Clear a stage with 0 damage" },
    glyph: "◆",
    color: PALETTE.yellow,
  },
  PRECISION: {
    id: "PRECISION",
    name: { ko: "정밀 사격", en: "PRECISION" },
    desc: { ko: "정확도 85%+ 클리어", en: "Clear with 85%+ accuracy" },
    glyph: "◎",
    color: PALETTE.yellow,
  },
  CORE_BREAKER: {
    id: "CORE_BREAKER",
    name: { ko: "코어 파괴자", en: "CORE BREAKER" },
    desc: { ko: "THE CORE 처치", en: "Defeat THE CORE" },
    glyph: "✶",
    color: PALETTE.red,
  },
  BOSS_S: {
    id: "BOSS_S",
    name: { ko: "사신", en: "S-RANK SLAYER" },
    desc: { ko: "보스 S 등급", en: "S-rank on the boss" },
    glyph: "S",
    color: PALETTE.yellow,
  },
  NIGHTMARE: {
    id: "NIGHTMARE",
    name: { ko: "악몽", en: "NIGHTMARE" },
    desc: { ko: "HARD 난이도 클리어", en: "Clear on HARD" },
    glyph: "☠",
    color: PALETTE.red,
  },
  PURIST_CLEAR: {
    id: "PURIST_CLEAR",
    name: { ko: "퓨리스트", en: "PURIST" },
    desc: { ko: "PURIST 모디파이어로 클리어", en: "Clear with PURIST modifier" },
    glyph: "✺",
    color: PALETTE.purple,
  },
  ENDLESS_3: {
    id: "ENDLESS_3",
    name: { ko: "엔드리스 러너", en: "ENDLESS RUNNER" },
    desc: { ko: "엔드리스 LOOP 3 도달", en: "Reach loop 3 in endless mode" },
    glyph: "∞",
    color: PALETTE.cyan,
  },
  ENDLESS_5: {
    id: "ENDLESS_5",
    name: { ko: "초월", en: "TRANSCENDENT" },
    desc: { ko: "엔드리스 LOOP 5 도달", en: "Reach loop 5 in endless mode" },
    glyph: "∞",
    color: PALETTE.magenta,
  },
  ALL_CHARACTERS: {
    id: "ALL_CHARACTERS",
    name: { ko: "다재다능", en: "VERSATILE" },
    desc: { ko: "모든 캐릭터로 한 번 클리어", en: "Clear once with every character" },
    glyph: "❖",
    color: PALETTE.magenta,
  },
  ALL_CLEAR: {
    id: "ALL_CLEAR",
    name: { ko: "완전 정복", en: "ALL CLEAR" },
    desc: { ko: "모든 스테이지 클리어", en: "Clear every stage" },
    glyph: "★",
    color: "#ffffff",
  },
};

export const ACHIEVEMENT_ORDER: AchievementId[] = [
  "FIRST_BLOOD",
  "FIRST_STAGE",
  "RHYTHM_MASTER",
  "PERFECT_TUNE",
  "UNTOUCHED",
  "PRECISION",
  "PURIST_CLEAR",
  "NIGHTMARE",
  "CORE_BREAKER",
  "BOSS_S",
  "ENDLESS_3",
  "ENDLESS_5",
  "ALL_CHARACTERS",
  "ALL_CLEAR",
];
