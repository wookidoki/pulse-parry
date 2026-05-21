import type { Difficulty } from "./types";

const STORAGE_KEY = "pulse-parry-progress";

export interface Progress {
  unlockedStage: number;
  bestScores: Record<string, number>;
}

const DEFAULT: Progress = {
  unlockedStage: 0,
  bestScores: {},
};

export function loadProgress(): Progress {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw) as Partial<Progress>;
    return {
      unlockedStage: parsed.unlockedStage ?? 0,
      bestScores: parsed.bestScores ?? {},
    };
  } catch {
    return DEFAULT;
  }
}

function saveProgress(p: Progress): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    // storage disabled or full — ignored
  }
}

export function unlockStage(stageIndex: number): void {
  const p = loadProgress();
  const next = stageIndex + 1;
  if (next > p.unlockedStage) {
    p.unlockedStage = next;
    saveProgress(p);
  }
}

function scoreKey(stageIndex: number, difficulty: Difficulty): string {
  return `s${stageIndex}:${difficulty}`;
}

export function recordScore(
  stageIndex: number,
  difficulty: Difficulty,
  score: number,
): void {
  const p = loadProgress();
  const key = scoreKey(stageIndex, difficulty);
  if (!(key in p.bestScores) || score > p.bestScores[key]) {
    p.bestScores[key] = score;
    saveProgress(p);
  }
}

export function getBestScore(stageIndex: number, difficulty: Difficulty): number {
  return loadProgress().bestScores[scoreKey(stageIndex, difficulty)] ?? 0;
}
