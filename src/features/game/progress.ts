import type { Difficulty } from "./types";
import type { CharacterId } from "./config/characters";
import type { RunModifierId } from "./config/modifiers";
import { CHARACTER_ORDER } from "./config/characters";
import { STAGES } from "./config/stages";
import {
  ACHIEVEMENTS,
  type AchievementId,
} from "./config/achievements";

const STORAGE_KEY = "pulse-parry-progress";

export interface Progress {
  unlockedStage: number;
  bestScores: Record<string, number>;
  achievements: AchievementId[];
  charactersCleared: CharacterId[];
  stagesCleared: number[];
  endlessBestLoop: number;
}

const DEFAULT: Progress = {
  unlockedStage: 0,
  bestScores: {},
  achievements: [],
  charactersCleared: [],
  stagesCleared: [],
  endlessBestLoop: 0,
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
      achievements: parsed.achievements ?? [],
      charactersCleared: parsed.charactersCleared ?? [],
      stagesCleared: parsed.stagesCleared ?? [],
      endlessBestLoop: parsed.endlessBestLoop ?? 0,
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

function scoreKey(stageIndex: number, difficulty: Difficulty, endless = false): string {
  return endless ? `endless:${difficulty}` : `s${stageIndex}:${difficulty}`;
}

export function recordScore(
  stageIndex: number,
  difficulty: Difficulty,
  score: number,
  endless = false,
): void {
  const p = loadProgress();
  const key = scoreKey(stageIndex, difficulty, endless);
  if (!(key in p.bestScores) || score > p.bestScores[key]) {
    p.bestScores[key] = score;
    saveProgress(p);
  }
}

export function getBestScore(stageIndex: number, difficulty: Difficulty): number {
  return loadProgress().bestScores[scoreKey(stageIndex, difficulty, false)] ?? 0;
}

export function getEndlessBestScore(difficulty: Difficulty): number {
  return loadProgress().bestScores[scoreKey(0, difficulty, true)] ?? 0;
}

// ───────── Achievements ─────────

export interface RunStats {
  isVictory: boolean;
  isBossKill: boolean;
  bossRank: string;
  score: number;
  totalParries: number;
  perfectParries: number;
  damageTaken: number;
  enemiesKilled: number;
  maxCombo: number;
  stageIndex: number;
  difficulty: Difficulty;
  characterId: CharacterId;
  modifierId: RunModifierId;
  endlessLoop: number;
  endlessMode: boolean;
}

export function getUnlockedAchievements(): Set<AchievementId> {
  return new Set(loadProgress().achievements);
}

function unlockOne(p: Progress, id: AchievementId, newlyUnlocked: AchievementId[]): void {
  if (p.achievements.includes(id)) return;
  p.achievements.push(id);
  newlyUnlocked.push(id);
}

// Returns the list of achievement IDs newly unlocked by this run.
export function checkAchievements(stats: RunStats): AchievementId[] {
  const p = loadProgress();
  const newlyUnlocked: AchievementId[] = [];
  let dirty = false;

  // Track cleared stages: stages reached and survived count as cleared. Boss
  // victory clears stage 7; otherwise we credit stages 0..stageIndex-1
  // because the player advanced past them before dying.
  const clearedThroughIdx = stats.isVictory
    ? stats.stageIndex
    : stats.stageIndex - 1;
  for (let i = 0; i <= clearedThroughIdx; i++) {
    if (!p.stagesCleared.includes(i)) {
      p.stagesCleared.push(i);
      dirty = true;
    }
  }
  // Characters: credit if the player meaningfully played (cleared at least 1 stage).
  if (clearedThroughIdx >= 0 && !p.charactersCleared.includes(stats.characterId)) {
    p.charactersCleared.push(stats.characterId);
    dirty = true;
  }
  if (stats.endlessMode && stats.endlessLoop > p.endlessBestLoop) {
    p.endlessBestLoop = stats.endlessLoop;
    dirty = true;
  }

  // Per-run achievements
  if (stats.enemiesKilled >= 10) unlockOne(p, "FIRST_BLOOD", newlyUnlocked);
  if (stats.isVictory) unlockOne(p, "FIRST_STAGE", newlyUnlocked);
  if (stats.maxCombo >= 100) unlockOne(p, "RHYTHM_MASTER", newlyUnlocked);
  if (stats.perfectParries >= 50) unlockOne(p, "PERFECT_TUNE", newlyUnlocked);
  if (stats.isVictory && stats.damageTaken === 0) unlockOne(p, "UNTOUCHED", newlyUnlocked);
  if (
    stats.isVictory &&
    stats.totalParries >= 20 &&
    stats.perfectParries / stats.totalParries >= 0.85
  ) {
    unlockOne(p, "PRECISION", newlyUnlocked);
  }
  if (stats.isVictory && stats.modifierId === "purist") {
    unlockOne(p, "PURIST_CLEAR", newlyUnlocked);
  }
  if (stats.isVictory && stats.difficulty === "hard") {
    unlockOne(p, "NIGHTMARE", newlyUnlocked);
  }
  if (stats.isBossKill) unlockOne(p, "CORE_BREAKER", newlyUnlocked);
  if (stats.isBossKill && stats.bossRank === "S") unlockOne(p, "BOSS_S", newlyUnlocked);
  if (p.endlessBestLoop >= 3) unlockOne(p, "ENDLESS_3", newlyUnlocked);
  if (p.endlessBestLoop >= 5) unlockOne(p, "ENDLESS_5", newlyUnlocked);

  // Cumulative achievements
  if (CHARACTER_ORDER.every((id) => p.charactersCleared.includes(id))) {
    unlockOne(p, "ALL_CHARACTERS", newlyUnlocked);
  }
  if (STAGES.length > 0 && STAGES.every((_, i) => p.stagesCleared.includes(i))) {
    unlockOne(p, "ALL_CLEAR", newlyUnlocked);
  }

  if (newlyUnlocked.length > 0) dirty = true;
  if (dirty) saveProgress(p);
  return newlyUnlocked;
}

export function totalAchievements(): number {
  return Object.keys(ACHIEVEMENTS).length;
}
