import type { BeatClock } from "../types";

export function createBeatClock(bpm: number, startedAtMs: number): BeatClock {
  return {
    bpm,
    startedAtMs,
    beatPeriodMs: 60000 / bpm,
    currentBeat: 0,
    beatPhase: 0,
    isBeatTick: false,
  };
}

export function setBpm(clock: BeatClock, bpm: number, nowMs: number): void {
  if (!Number.isFinite(bpm) || bpm <= 0) return;
  const totalElapsedBeats = clock.currentBeat + clock.beatPhase;
  clock.bpm = bpm;
  clock.beatPeriodMs = 60000 / bpm;
  clock.startedAtMs = nowMs - totalElapsedBeats * clock.beatPeriodMs;
}

export function tickBeat(clock: BeatClock, nowMs: number): void {
  if (!Number.isFinite(clock.beatPeriodMs) || clock.beatPeriodMs <= 0) return;
  const elapsed = nowMs - clock.startedAtMs;
  const beat = Math.floor(elapsed / clock.beatPeriodMs);
  const phase = (elapsed % clock.beatPeriodMs) / clock.beatPeriodMs;
  clock.isBeatTick = beat !== clock.currentBeat;
  clock.currentBeat = beat;
  clock.beatPhase = phase;
}
