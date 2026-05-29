import { attachAnalyser, resetAnalysisState } from "./audioAnalysis";
import { getAudioContext } from "./audio";

// Indexed by stage. Boss pool is indexed by phase (see setBossPhase), so
// the final entry must hold one track per supported phase.
const STAGE_TRACK_POOLS: string[][] = [
  [
    "/audio/stage1_breach.mp3",
    "/audio/stage1_awaken.ogg",
    "/audio/oga_chill_100.ogg",
  ],
  [
    "/audio/oga1_simulation.ogg",
    "/audio/oga1_anti_matter.ogg",
    "/audio/oga_moonlight.mp3",
  ],
  [
    "/audio/stage2_coldrain.mp3",
    "/audio/stage2_pulse.ogg",
    "/audio/oga_welcome_110.ogg",
    "/audio/oga_jumping_110.ogg",
  ],
  [
    "/audio/oga_casino_120.ogg",
    "/audio/oga1_currents.ogg",
    "/audio/oga_synth_remix.ogg",
  ],
  [
    "/audio/stage3_factory.ogg",
    "/audio/stage3_overdrive.ogg",
    "/audio/oga_15k.mp3",
    "/audio/oga1_experiment_g.ogg",
  ],
  [
    "/audio/oga1_caves.ogg",
    "/audio/oga1_test_subject.ogg",
    "/audio/oga_synth_remix_lo.ogg",
  ],
  [
    "/audio/stage4_chaos.ogg",
    "/audio/oga1_space_collisions.ogg",
  ],
  [
    "/audio/boss_electric.ogg",
    "/audio/oga1_tribal_chaos.ogg",
    "/audio/oga1_wicked.ogg",
  ],
];

interface MenuTrack {
  url: string;
  label: string;
}

const MENU_TRACK_POOL: MenuTrack[] = [
  { url: "/audio/oga1_anti_matter.ogg", label: "ANTI MATTER" },
  { url: "/audio/oga_chill_100.ogg", label: "CHILL 100" },
  { url: "/audio/oga1_currents.ogg", label: "CURRENTS" },
  { url: "/audio/oga1_simulation.ogg", label: "SIMULATION" },
  { url: "/audio/stage1_breach.mp3", label: "LOW LEVEL BREACH" },
  { url: "/audio/oga_moonlight.mp3", label: "MOONLIGHT" },
];

const MENU_TRACK_STORAGE = "pulse-parry-menu-track";

function loadMenuTrackIdx(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(MENU_TRACK_STORAGE);
    const n = raw == null ? 0 : parseInt(raw, 10);
    if (Number.isFinite(n) && n >= 0 && n < MENU_TRACK_POOL.length) return n;
  } catch {
    /* ignore */
  }
  return 0;
}

let menuTrackIdx = loadMenuTrackIdx();

const CROSSFADE_MS = 700;
const PHASE_CROSSFADE_MS = 1200;
const INTENSITY_RAMP_MS = 600;
const MUSIC_VOLUME_FACTOR = 0.55;
const MENU_VOLUME_FACTOR = 0.42;

const stagePools: HTMLAudioElement[][] = [];
let currentStageIdx = -1;
let currentTrackIdx = -1;
let menuAudio: HTMLAudioElement | null = null;
let masterVolume = 0.5;
let isPaused = false;
let bossPhase = 0;
let bossPhaseAudio: HTMLAudioElement | null = null;
let intensityMul = 1;

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

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

// Pending pause + active fade tokens, keyed by element. A new fade supersedes
// any in-flight fade on the same element (token mismatch stops the old loop),
// and starting a track cancels its scheduled pause so transitions can't race
// into a "fully faded in but immediately paused" state.
const pauseTimers = new Map<HTMLAudioElement, number>();
const fadeTokens = new Map<HTMLAudioElement, number>();

function fade(el: HTMLAudioElement, target: number, durationMs: number): void {
  const token = (fadeTokens.get(el) ?? 0) + 1;
  fadeTokens.set(el, token);
  const start = el.volume;
  const goal = clamp01(target);
  const startT = performance.now();
  const step = () => {
    if (fadeTokens.get(el) !== token) return;
    const t = Math.min(1, (performance.now() - startT) / durationMs);
    el.volume = clamp01(start + (goal - start) * t);
    if (t < 1) requestAnimationFrame(step);
  };
  step();
}

function scheduleStop(el: HTMLAudioElement, durationMs: number): void {
  fade(el, 0, durationMs);
  const existing = pauseTimers.get(el);
  if (existing != null) window.clearTimeout(existing);
  const id = window.setTimeout(() => {
    el.pause();
    pauseTimers.delete(el);
  }, durationMs);
  pauseTimers.set(el, id);
}

function cancelPendingStop(el: HTMLAudioElement): void {
  const existing = pauseTimers.get(el);
  if (existing != null) {
    window.clearTimeout(existing);
    pauseTimers.delete(el);
  }
}

function startTrack(el: HTMLAudioElement, durationMs: number): void {
  cancelPendingStop(el);
  el.currentTime = 0;
  el.volume = 0;
  el.play().catch(() => {});
  fade(el, targetVolume(), durationMs);
}

// Resume a track from its current position (no rewind) — used to recover a
// track whose first play() was blocked before the user gesture.
function resumeTrack(el: HTMLAudioElement, durationMs: number): void {
  cancelPendingStop(el);
  el.play().catch(() => {});
  fade(el, targetVolume(), durationMs);
}

function targetVolume(): number {
  return masterVolume * MUSIC_VOLUME_FACTOR * intensityMul;
}

// BGM is the core of this rhythm game (see project memory), so the intensity
// range is intentionally narrow — full ducking would drown out what the
// player came for. Low combo gets a mild tuck, sustained combo rewards a
// modest swell.
function comboToIntensity(combo: number): number {
  if (combo < 5) return 0.92;
  if (combo < 25) return 0.98;
  if (combo < 50) return 1.04;
  if (combo < 100) return 1.1;
  return 1.18;
}

export function setBgmIntensity(combo: number): void {
  const target = comboToIntensity(combo);
  if (Math.abs(target - intensityMul) < 0.02) return;
  intensityMul = target;
  const cur = bossPhaseAudio ?? currentAudio();
  if (cur && !cur.paused) {
    fade(cur, targetVolume(), INTENSITY_RAMP_MS);
  }
}

export function resetBgmIntensity(): void {
  intensityMul = 1;
}

export function setMusicVolume(v: number): void {
  masterVolume = clamp01(v);
  const cur = bossPhaseAudio ?? currentAudio();
  if (cur && !cur.paused) cur.volume = clamp01(targetVolume());
  if (menuAudio && !menuAudio.paused) menuAudio.volume = clamp01(masterVolume * MENU_VOLUME_FACTOR);
}

function buildMenuAudio(): void {
  if (typeof window === "undefined") return;
  menuAudio = new Audio(MENU_TRACK_POOL[menuTrackIdx].url);
  menuAudio.loop = true;
  menuAudio.volume = 0;
  menuAudio.preload = "auto";
}

export function playMenuBgm(): void {
  if (typeof window === "undefined") return;
  if (!menuAudio) buildMenuAudio();
  if (!menuAudio) return;
  const pending = pauseTimers.get(menuAudio);
  if (pending != null) {
    window.clearTimeout(pending);
    pauseTimers.delete(menuAudio);
  }
  menuAudio.play().catch(() => {});
  fade(menuAudio, masterVolume * MENU_VOLUME_FACTOR, CROSSFADE_MS);
}

export function stopMenuBgm(): void {
  if (!menuAudio) return;
  scheduleStop(menuAudio, CROSSFADE_MS);
}

export interface MenuTrackInfo {
  idx: number;
  label: string;
  total: number;
}

export function getMenuTrackInfo(): MenuTrackInfo {
  return {
    idx: menuTrackIdx,
    label: MENU_TRACK_POOL[menuTrackIdx].label,
    total: MENU_TRACK_POOL.length,
  };
}

export function cycleMenuTrack(): MenuTrackInfo {
  menuTrackIdx = (menuTrackIdx + 1) % MENU_TRACK_POOL.length;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(MENU_TRACK_STORAGE, String(menuTrackIdx));
    } catch {
      /* ignore */
    }
  }
  const prev = menuAudio;
  const wasPlaying = prev && !prev.paused;
  buildMenuAudio();
  if (wasPlaying && menuAudio) {
    menuAudio.play().catch(() => {});
    fade(menuAudio, masterVolume * MENU_VOLUME_FACTOR, CROSSFADE_MS);
    if (prev) scheduleStop(prev, CROSSFADE_MS);
  }
  return getMenuTrackInfo();
}

export function setBossPhase(phase: number): void {
  if (phase === bossPhase) return;
  const stage5 = stagePools[stagePools.length - 1];
  if (!stage5 || stage5.length === 0) return;
  const trackIdx = Math.min(phase, stage5.length - 1);
  const nextTrack = stage5[trackIdx];
  if (bossPhaseAudio === nextTrack) {
    bossPhase = phase;
    return;
  }
  const prev = bossPhaseAudio ?? currentAudio();
  if (prev && prev !== nextTrack && !prev.paused) {
    scheduleStop(prev, PHASE_CROSSFADE_MS);
  }
  startTrack(nextTrack, PHASE_CROSSFADE_MS);
  bossPhaseAudio = nextTrack;
  currentTrackIdx = trackIdx;
  bossPhase = phase;
  resetAnalysisState();
}

function resetBossPhase(): void {
  // Boss phase tracks live in the shared stage5 pool, so leaving the boss
  // fight must stop the phase track or it keeps playing under the next BGM.
  if (bossPhaseAudio && !bossPhaseAudio.paused) {
    scheduleStop(bossPhaseAudio, CROSSFADE_MS);
  }
  bossPhase = 0;
  bossPhaseAudio = null;
}

export function playStageBgm(stageIndex: number): void {
  if (stagePools.length === 0) return;
  stopMenuBgm();
  resetBossPhase();
  const safeIdx = Math.min(stageIndex, stagePools.length - 1);

  // Same stage already selected: just ensure the existing track is actually playing.
  // First call often happens before user gesture and play() is blocked silently;
  // this lets the second call (after gesture) recover instead of early-returning.
  if (currentStageIdx === safeIdx) {
    const cur = currentAudio();
    if (cur && cur.paused && !isPaused) resumeTrack(cur, CROSSFADE_MS);
    return;
  }

  const prev = currentAudio();
  if (prev) scheduleStop(prev, CROSSFADE_MS);

  const pool = stagePools[safeIdx];
  if (pool.length === 0) return;
  const trackIdx = Math.floor(Math.random() * pool.length);
  const next = pool[trackIdx];
  next.preload = "auto";
  startTrack(next, CROSSFADE_MS);

  currentStageIdx = safeIdx;
  currentTrackIdx = trackIdx;
  isPaused = false;
  resetAnalysisState();
}

export function pauseMusic(): void {
  isPaused = true;
  const cur = bossPhaseAudio ?? currentAudio();
  if (cur) cur.pause();
}

export function resumeMusic(): void {
  if (!isPaused) return;
  isPaused = false;
  const cur = bossPhaseAudio ?? currentAudio();
  if (cur) cur.play().catch(() => {});
}

// Hard stop for run end / unmount: fade out every live track and reset state so
// nothing bleeds into the next screen (death/victory/menu) or overlaps a restart.
export function stopAllMusic(): void {
  const cur = currentAudio();
  if (cur) scheduleStop(cur, CROSSFADE_MS);
  if (bossPhaseAudio) scheduleStop(bossPhaseAudio, CROSSFADE_MS);
  if (menuAudio) scheduleStop(menuAudio, CROSSFADE_MS);
  currentStageIdx = -1;
  currentTrackIdx = -1;
  bossPhase = 0;
  bossPhaseAudio = null;
  isPaused = false;
}

