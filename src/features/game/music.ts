import { attachAnalyser, resetAnalysisState } from "./audioAnalysis";
import { getAudioContext } from "./audio";

const STAGE_TRACK_POOLS: string[][] = [
  [
    "/audio/stage1_breach.mp3",
    "/audio/stage1_awaken.ogg",
    "/audio/oga_chill_100.ogg",
    "/audio/oga1_anti_matter.ogg",
    "/audio/oga1_currents.ogg",
    "/audio/oga1_simulation.ogg",
  ],
  [
    "/audio/stage2_coldrain.mp3",
    "/audio/stage2_pulse.ogg",
    "/audio/oga_welcome_110.ogg",
    "/audio/oga_jumping_110.ogg",
    "/audio/oga_casino_120.ogg",
  ],
  [
    "/audio/stage3_factory.ogg",
    "/audio/stage3_overdrive.ogg",
    "/audio/oga_15k.mp3",
    "/audio/oga_synth_remix.ogg",
    "/audio/oga1_experiment_g.ogg",
  ],
  [
    "/audio/stage4_chaos.ogg",
    "/audio/oga1_caves.ogg",
    "/audio/oga1_space_collisions.ogg",
    "/audio/oga1_test_subject.ogg",
    "/audio/oga_synth_remix_lo.ogg",
  ],
  [
    "/audio/boss_electric.ogg",
    "/audio/oga1_tribal_chaos.ogg",
    "/audio/oga1_wicked.ogg",
    "/audio/oga_moonlight.mp3",
  ],
];

const CROSSFADE_MS = 700;
const MUSIC_VOLUME_FACTOR = 0.55;

const stagePools: HTMLAudioElement[][] = [];
let currentStageIdx = -1;
let currentTrackIdx = -1;
let masterVolume = 0.5;
let isPaused = false;

export function initMusic(): void {
  if (typeof window === "undefined" || stagePools.length > 0) return;
  for (const urls of STAGE_TRACK_POOLS) {
    const pool: HTMLAudioElement[] = [];
    for (const url of urls) {
      const a = new Audio(url);
      a.loop = true;
      a.volume = 0;
      a.preload = "none";
      pool.push(a);
    }
    stagePools.push(pool);
  }
}

export function setupAudioAnalysis(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  let flatIdx = 0;
  for (const pool of stagePools) {
    for (const el of pool) {
      attachAnalyser(ctx, el, flatIdx);
      flatIdx += 1;
    }
  }
}

export function getCurrentTrackIndex(): number {
  if (currentStageIdx < 0 || currentTrackIdx < 0) return -1;
  let flat = 0;
  for (let i = 0; i < currentStageIdx; i++) flat += stagePools[i].length;
  return flat + currentTrackIdx;
}

function currentAudio(): HTMLAudioElement | null {
  if (currentStageIdx < 0 || currentTrackIdx < 0) return null;
  return stagePools[currentStageIdx][currentTrackIdx] ?? null;
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

function targetVolume(): number {
  return masterVolume * MUSIC_VOLUME_FACTOR;
}

export function setMusicVolume(v: number): void {
  masterVolume = Math.max(0, Math.min(1, v));
  const cur = currentAudio();
  if (cur && !cur.paused) cur.volume = targetVolume();
}

export function playStageBgm(stageIndex: number): void {
  if (stagePools.length === 0) return;
  const safeIdx = Math.min(stageIndex, stagePools.length - 1);
  if (currentStageIdx === safeIdx) return;

  const prev = currentAudio();
  if (prev) {
    fade(prev, 0, CROSSFADE_MS);
    window.setTimeout(() => prev.pause(), CROSSFADE_MS);
  }

  const pool = stagePools[safeIdx];
  if (pool.length === 0) return;
  const trackIdx = Math.floor(Math.random() * pool.length);
  const next = pool[trackIdx];
  next.preload = "auto";
  next.currentTime = 0;
  next.volume = 0;
  next.play().catch(() => {});
  fade(next, targetVolume(), CROSSFADE_MS);

  currentStageIdx = safeIdx;
  currentTrackIdx = trackIdx;
  isPaused = false;
  resetAnalysisState();
}

export function pauseMusic(): void {
  isPaused = true;
  const cur = currentAudio();
  if (cur) cur.pause();
}

export function resumeMusic(): void {
  if (!isPaused) return;
  isPaused = false;
  const cur = currentAudio();
  if (cur) cur.play().catch(() => {});
}

export function stopMusic(): void {
  for (const pool of stagePools) {
    for (const a of pool) {
      a.pause();
      a.currentTime = 0;
    }
  }
  currentStageIdx = -1;
  currentTrackIdx = -1;
  isPaused = false;
}
