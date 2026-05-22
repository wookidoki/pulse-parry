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
  gameOver: () => void;
  victory: () => void;
  setStage: (index: number) => void;
  pause: () => void;
  resume: () => void;
  togglePause: () => void;
  setVolume: (v: number) => void;
}

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
  volume: 0.6,
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
    set((s) => ({ ...INITIAL, volume: s.volume })),
  start: (maxHp?: number) =>
    set((s) => {
      const hp = maxHp ?? INITIAL.maxHp;
      return {
        ...INITIAL,
        volume: s.volume,
        status: "playing",
        hp,
        maxHp: hp,
      };
    }),
  damage: (amount) =>
    set((s) => {
      if (s.status !== "playing") return s;
      const hp = Math.max(0, s.hp - amount);
      return {
        hp,
        combo: 0,
        status: hp === 0 ? "gameover" : s.status,
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
  gameOver: () => set({ status: "gameover" }),
  victory: () =>
    set((s) => {
      if (s.status !== "playing") return s;
      unlockStage(s.stageIndex);
      return { status: "victory" };
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
  setVolume: (v) => set({ volume: Math.max(0, Math.min(1, v)) }),
}));
