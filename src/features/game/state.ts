import { create } from "zustand";
import type { HudState } from "./types";
import { STAGES } from "./config/stages";

interface HudActions {
  reset: () => void;
  start: () => void;
  damage: () => void;
  addScore: (n: number) => void;
  bumpCombo: (n: number) => void;
  breakCombo: () => void;
  gameOver: () => void;
  victory: () => void;
  setStage: (index: number) => void;
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
};

const stageNameOf = (index: number): string =>
  STAGES[Math.min(index, STAGES.length - 1)].name;

export const useHud = create<HudState & HudActions>((set) => ({
  ...INITIAL,
  reset: () => set({ ...INITIAL }),
  start: () => set({ ...INITIAL, status: "playing" }),
  damage: () =>
    set((s) => {
      if (s.status !== "playing") return s;
      const hp = Math.max(0, s.hp - 1);
      return {
        hp,
        combo: 0,
        status: hp === 0 ? "gameover" : s.status,
      };
    }),
  addScore: (n) => set((s) => ({ score: s.score + n })),
  bumpCombo: (n) =>
    set((s) => {
      const combo = s.combo + n;
      return { combo, maxCombo: Math.max(s.maxCombo, combo) };
    }),
  breakCombo: () => set({ combo: 0 }),
  gameOver: () => set({ status: "gameover" }),
  victory: () =>
    set((s) => (s.status === "playing" ? { status: "victory" } : s)),
  setStage: (index) =>
    set({ stageIndex: index, stageName: stageNameOf(index) }),
}));
