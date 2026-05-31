import type { Difficulty } from "../types";

export interface DifficultyConfig {
  label: string;
  flightBeatsMul: number;
  perfectWindowMul: number;
  enemyCountDelta: number;
  scoreMul: number;
  // Bullet arrival is quantized to this beat subdivision so enemy fire reads
  // like a score. Coarser grid = more predictable/rhythmic (easier to parry on
  // beat); finer grid = denser, off-beat notes allowed (harder).
  beatGridSub: number;
}

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy: {
    label: "EASY",
    flightBeatsMul: 1.45,
    perfectWindowMul: 1.6,
    enemyCountDelta: -1,
    scoreMul: 0.7,
    beatGridSub: 1, // quarter notes — every shot lands on a downbeat
  },
  normal: {
    label: "NORMAL",
    flightBeatsMul: 1.0,
    perfectWindowMul: 1.0,
    enemyCountDelta: 0,
    scoreMul: 1.0,
    beatGridSub: 0.5, // eighth notes — on/off beat
  },
  hard: {
    label: "HARD",
    flightBeatsMul: 0.7,
    perfectWindowMul: 0.65,
    enemyCountDelta: 1,
    scoreMul: 1.5,
    beatGridSub: 0.25, // sixteenth notes — dense, syncopated
  },
};

export const DIFFICULTY_ORDER: Difficulty[] = ["easy", "normal", "hard"];
