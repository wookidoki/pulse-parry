const STAGE_TRACKS: string[] = [
  "/audio/stage2_pulse.ogg",
  "/audio/stage3_factory.ogg",
  "/audio/stage3_overdrive.ogg",
  "/audio/stage4_chaos.ogg",
  "/audio/boss_electric.ogg",
];

const CROSSFADE_MS = 700;
const MUSIC_VOLUME_FACTOR = 0.55;

import { attachAnalyser, resetAnalysisState } from "./audioAnalysis";
import { getAudioContext } from "./audio";

const audioElements: HTMLAudioElement[] = [];
let currentIndex = -1;
let masterVolume = 0.5;
let isPaused = false;

export function initMusic(): void {
  if (typeof window === "undefined" || audioElements.length > 0) return;
  for (const url of STAGE_TRACKS) {
    const a = new Audio(url);
    a.loop = true;
    a.volume = 0;
    a.preload = "auto";
    a.crossOrigin = "anonymous";
    audioElements.push(a);
  }
}

export function setupAudioAnalysis(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  for (let i = 0; i < audioElements.length; i++) {
    attachAnalyser(ctx, audioElements[i], i);
  }
}

export function getCurrentTrackIndex(): number {
  return currentIndex;
}

function fade(el: HTMLAudioElement, target: number, durationMs: number): void {
  const start = el.volume;
  const startT = performance.now();
  const step = () => {
    const t = Math.min(1, (performance.now() - startT) / durationMs);
    el.volume = start + (target - start) * t;
    if (t < 1) requestAnimationFrame(step);
  };
  step();
}

export function setMusicVolume(v: number): void {
  masterVolume = Math.max(0, Math.min(1, v));
  if (currentIndex >= 0 && audioElements[currentIndex]) {
    audioElements[currentIndex].volume = targetVolume();
  }
}

function targetVolume(): number {
  return masterVolume * MUSIC_VOLUME_FACTOR;
}

export function playStageBgm(stageIndex: number): void {
  if (audioElements.length === 0) return;
  if (currentIndex === stageIndex) return;

  if (currentIndex >= 0 && audioElements[currentIndex]) {
    const prev = audioElements[currentIndex];
    fade(prev, 0, CROSSFADE_MS);
    window.setTimeout(() => prev.pause(), CROSSFADE_MS);
  }
  const idx = Math.min(stageIndex, audioElements.length - 1);
  const next = audioElements[idx];
  if (!next) return;
  next.currentTime = 0;
  next.volume = 0;
  next.play().catch(() => {});
  fade(next, targetVolume(), CROSSFADE_MS);
  currentIndex = idx;
  isPaused = false;
  resetAnalysisState();
}

export function pauseMusic(): void {
  isPaused = true;
  if (currentIndex >= 0 && audioElements[currentIndex]) {
    audioElements[currentIndex].pause();
  }
}

export function resumeMusic(): void {
  if (!isPaused) return;
  isPaused = false;
  if (currentIndex >= 0 && audioElements[currentIndex]) {
    audioElements[currentIndex].play().catch(() => {});
  }
}

export function stopMusic(): void {
  for (const a of audioElements) {
    a.pause();
    a.currentTime = 0;
  }
  currentIndex = -1;
  isPaused = false;
}
