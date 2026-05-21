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
  const elapsedInBeat = clock.beatPhase * clock.beatPeriodMs;
  clock.bpm = bpm;
  clock.beatPeriodMs = 60000 / bpm;
  clock.startedAtMs = nowMs - elapsedInBeat;
}

export function tickBeat(clock: BeatClock, nowMs: number): void {
  const elapsed = nowMs - clock.startedAtMs;
  const beat = Math.floor(elapsed / clock.beatPeriodMs);
  const phase = (elapsed % clock.beatPeriodMs) / clock.beatPeriodMs;
  clock.isBeatTick = beat !== clock.currentBeat;
  clock.currentBeat = beat;
  clock.beatPhase = phase;
}
