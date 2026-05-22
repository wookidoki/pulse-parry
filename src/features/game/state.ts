import { create } from "zustand";
import type { HudState } from "./types";
import { STAGES } from "./config/stages";
import { COMBO_MILESTONES } from "./config/tuning";
import { unlockStage } from "./progress";

interface HudActions {
  reset: () => void;
  start: (maxHp?: number) => void;
  damage: (amount: number) => void;
  heal: (amount: number) => void;
  addScore: (n: number) => void;
  bumpCombo: (n: number) => void;
  breakCombo: () => void;
  bumpParries: (total: number, perfect: number) => void;
  bumpEnemiesKilled: (n: number) => void;
  gameOver: () => void;
  victory: () => void;
  setStage: (index: number) => void;
  pause: () => void;
  resume: () => void;
  togglePause: () => void;
  setMusicVolume: (v: number) => void;
  setSfxVolume: (v: number) => void;
  completeIntro: () => void;
  startBossCutscene: () => void;
  completeBossCutscene: () => void;
  finalizeDeath: () => void;
}

const VOLUME_STORAGE_KEY = "pulse-parry-volumes";

function loadStoredVolumes(): { musicVolume: number; sfxVolume: number } {
  if (typeof window === "undefined") return { musicVolume: 0.55, sfxVolume: 0.7 };
  try {
    const raw = localStorage.getItem(VOLUME_STORAGE_KEY);
    if (!raw) return { musicVolume: 0.55, sfxVolume: 0.7 };
    const parsed = JSON.parse(raw);
    return {
      musicVolume: clamp(Number(parsed.musicVolume) || 0.55),
      sfxVolume: clamp(Number(parsed.sfxVolume) || 0.7),
    };
  } catch {
    return { musicVolume: 0.55, sfxVolume: 0.7 };
  }
}

function persistVolumes(musicVolume: number, sfxVolume: number): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      VOLUME_STORAGE_KEY,
      JSON.stringify({ musicVolume, sfxVolume }),
    );
  } catch {
    /* ignore */
  }
}

function clamp(v: number): number {
  return Math.max(0, Math.min(1, v));
}

const STORED = loadStoredVolumes();

const INITIAL: HudState = {
  status: "menu",
  hp: 3,
  maxHp: 3,
  score: 0,
  combo: 0,
  maxCombo: 0,
  stageIndex: 0,
  stageName: STAGES[0].name,
  milestone: null,
  musicVolume: STORED.musicVolume,
  sfxVolume: STORED.sfxVolume,
  totalParries: 0,
  perfectParries: 0,
  damageTaken: 0,
  enemiesKilled: 0,
  playStartMs: 0,
  playEndMs: 0,
};

const stageNameOf = (index: number): string =>
  STAGES[Math.min(index, STAGES.length - 1)].name;

function nextMilestoneCrossed(prev: number, next: number): number | null {
  for (const m of COMBO_MILESTONES) {
    if (prev < m && next >= m) return m;
  }
  return null;
}

export const useHud = create<HudState & HudActions>((set) => ({
  ...INITIAL,
  reset: () =>
    set((s) => ({ ...INITIAL, musicVolume: s.musicVolume, sfxVolume: s.sfxVolume })),
  start: (maxHp?: number) =>
    set((s) => {
      const hp = maxHp ?? INITIAL.maxHp;
      return {
        ...INITIAL,
        musicVolume: s.musicVolume,
        sfxVolume: s.sfxVolume,
        status: "intro",
        hp,
        maxHp: hp,
        playStartMs: Date.now(),
        playEndMs: 0,
      };
    }),
  damage: (amount) =>
    set((s) => {
      if (s.status !== "playing") return s;
      const hp = Math.max(0, s.hp - amount);
      return {
        hp,
        combo: 0,
        damageTaken: s.damageTaken + amount,
        status: hp === 0 ? "dying" : s.status,
      };
    }),
  heal: (amount) =>
    set((s) => {
      if (s.status !== "playing") return s;
      return { hp: Math.min(s.maxHp, s.hp + amount) };
    }),
  addScore: (n) => set((s) => ({ score: s.score + n })),
  bumpCombo: (n) =>
    set((s) => {
      const newCombo = s.combo + n;
      const crossed = nextMilestoneCrossed(s.combo, newCombo);
      return {
        combo: newCombo,
        maxCombo: Math.max(s.maxCombo, newCombo),
        milestone: crossed
          ? { level: crossed, key: (s.milestone?.key ?? 0) + 1 }
          : s.milestone,
      };
    }),
  breakCombo: () => set({ combo: 0 }),
  bumpParries: (total, perfect) =>
    set((s) => ({
      totalParries: s.totalParries + total,
      perfectParries: s.perfectParries + perfect,
    })),
  bumpEnemiesKilled: (n) =>
    set((s) => ({ enemiesKilled: s.enemiesKilled + n })),
  gameOver: () => set({ status: "gameover", playEndMs: Date.now() }),
  victory: () =>
    set((s) => {
      if (s.status !== "playing") return s;
      unlockStage(s.stageIndex);
      return { status: "victory", playEndMs: Date.now() };
    }),
  setStage: (index) =>
    set({ stageIndex: index, stageName: stageNameOf(index) }),
  pause: () =>
    set((s) => (s.status === "playing" ? { status: "paused" } : s)),
  resume: () =>
    set((s) => (s.status === "paused" ? { status: "playing" } : s)),
  togglePause: () =>
    set((s) => {
      if (s.status === "playing") return { status: "paused" };
      if (s.status === "paused") return { status: "playing" };
      return s;
    }),
  setMusicVolume: (v) =>
    set((s) => {
      const next = clamp(v);
      persistVolumes(next, s.sfxVolume);
      return { musicVolume: next };
    }),
  setSfxVolume: (v) =>
    set((s) => {
      const next = clamp(v);
      persistVolumes(s.musicVolume, next);
      return { sfxVolume: next };
    }),
  completeIntro: () =>
    set((s) => (s.status === "intro" ? { status: "playing" } : s)),
  startBossCutscene: () =>
    set((s) => (s.status === "playing" ? { status: "bossCutscene" } : s)),
  completeBossCutscene: () =>
    set((s) => (s.status === "bossCutscene" ? { status: "playing" } : s)),
  finalizeDeath: () =>
    set((s) =>
      s.status === "dying" ? { status: "gameover", playEndMs: Date.now() } : s,
    ),
}));
