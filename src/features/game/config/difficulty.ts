import type { Difficulty } from "../types";

export interface DifficultyConfig {
  label: string;
  flightBeatsMul: number;
  perfectWindowMul: number;
  enemyCountDelta: number;
  scoreMul: number;
  // Bullet arrival is quantized to a beat subdivision so enemy fire reads like a
  // score. The grid VARIES per beat within a 4-beat bar (groove) instead of a
  // flat subdivision — a constant quarter grid feels loose/monotonous. Each
  // entry is the subdivision for arrivals landing in that beat of the bar.
  // Coarser (1=quarter) = predictable/easy to parry on beat; finer (0.25) = dense.
  beatGridPattern: number[];
}

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy: {
    label: "EASY",
    flightBeatsMul: 1.45,
    perfectWindowMul: 1.6,
    enemyCountDelta: -1,
    scoreMul: 0.7,
    // strong downbeat, eighth-note lift on 2 & 4 — grooves without crowding
    beatGridPattern: [1, 0.5, 1, 0.5],
  },
  normal: {
    label: "NORMAL",
    flightBeatsMul: 1.2,
    perfectWindowMul: 1.2,
    enemyCountDelta: 0,
    scoreMul: 1.0,
    beatGridPattern: [0.5, 0.5, 0.25, 0.5],
  },
  hard: {
    label: "HARD",
    flightBeatsMul: 0.7,
    perfectWindowMul: 0.65,
    enemyCountDelta: 1,
    scoreMul: 1.5,
    beatGridPattern: [0.25, 0.5, 0.25, 0.25],
  },
};

export const DIFFICULTY_ORDER: Difficulty[] = ["easy", "normal", "hard"];
