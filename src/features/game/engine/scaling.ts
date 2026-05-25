import type { EngineState } from "../types";

const ENDLESS_LOOP_STEP = 0.08;
const ENDLESS_LOOP_CAP = 0.6;

/**
 * Per-loop difficulty multiplier in endless mode. Returns 1 in normal mode,
 * scales linearly with endlessLoop up to a cap. Shared by enemy spawn/fire
 * rate and bullet speed so all three stay in sync.
 */
export function endlessLoopMul(state: EngineState): number {
  if (!state.endlessMode) return 1;
  return 1 + Math.min(ENDLESS_LOOP_CAP, state.endlessLoop * ENDLESS_LOOP_STEP);
}
