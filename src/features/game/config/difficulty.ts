import type { Difficulty } from "../types";

export interface DifficultyConfig {
  label: string;
  flightBeatsMul: number;
  perfectWindowMul: number;
  enemyCountDelta: number;
  scoreMul: number;
}

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy: {
    label: "EASY",
    flightBeatsMul: 1.45,
    perfectWindowMul: 1.6,
    enemyCountDelta: -1,
    scoreMul: 0.7,
  },
  normal: {
    label: "NORMAL",
    flightBeatsMul: 1.0,
    perfectWindowMul: 1.0,
    enemyCountDelta: 0,
    scoreMul: 1.0,
  },
  hard: {
    label: "HARD",
    flightBeatsMul: 0.7,
    perfectWindowMul: 0.65,
    enemyCountDelta: 1,
    scoreMul: 1.5,
  },
};

export const DIFFICULTY_ORDER: Difficulty[] = ["easy", "normal", "hard"];
