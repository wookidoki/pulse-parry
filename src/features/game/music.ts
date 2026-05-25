import { attachAnalyser, resetAnalysisState } from "./audioAnalysis";
import { getAudioContext } from "./audio";

// One pool per stage. Pools are picked at random per run; boss stage cycles
// pool entries by phase (see setBossPhase).
const STAGE_TRACK_POOLS: string[][] = [
  // 0 INFILTRATION (118-122 BPM, calm intro)
  [
    "/audio/stage1_breach.mp3",
    "/audio/stage1_awaken.ogg",
    "/audio/oga_chill_100.ogg",
  ],
  // 1 ECHO (122-126 BPM, mysterious)
  [
    "/audio/oga1_simulation.ogg",
    "/audio/oga1_anti_matter.ogg",
    "/audio/oga_moonlight.mp3",
  ],
  // 2 FACTORY (128-132 BPM)
  [
    "/audio/stage2_coldrain.mp3",
    "/audio/stage2_pulse.ogg",
    "/audio/oga_welcome_110.ogg",
    "/audio/oga_jumping_110.ogg",
  ],
  // 3 BLOOM (138-144 BPM, energetic)
  [
    "/audio/oga_casino_120.ogg",
    "/audio/oga1_currents.ogg",
    "/audio/oga_synth_remix.ogg",
  ],
  // 4 OVERDRIVE (150-158 BPM)
  [
    "/audio/stage3_factory.ogg",
    "/audio/stage3_overdrive.ogg",
    "/audio/oga_15k.mp3",
    "/audio/oga1_experiment_g.ogg",
  ],
  // 5 TRIAGE (162-168 BPM, urgent)
  [
    "/audio/oga1_caves.ogg",
    "/audio/oga1_test_subject.ogg",
    "/audio/oga_synth_remix_lo.ogg",
  ],
  // 6 CHAOS (172-178 BPM)
  [
    "/audio/stage4_chaos.ogg",
    "/audio/oga1_space_collisions.ogg",
  ],
  // 7 REVOLT / BOSS (176-184 BPM, 3 tracks for 3 phases)
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
// 0.75 (combo break) → 1.15 (sustained combo). Reinforces the rhythm payoff
// without making low-combo runs feel quiet on purpose.
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
  masterVolume = Math.max(0, Math.min(1, v));
  const cur = currentAudio();
  if (cur && !cur.paused) cur.volume = targetVolume();
  if (menuAudio && !menuAudio.paused) menuAudio.volume = masterVolume * MENU_VOLUME_FACTOR;
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
  menuAudio.currentTime = menuAudio.currentTime || 0;
  menuAudio.play().catch(() => {});
  fade(menuAudio, masterVolume * MENU_VOLUME_FACTOR, CROSSFADE_MS);
}

export function stopMenuBgm(): void {
  if (!menuAudio) return;
  const a = menuAudio;
  fade(a, 0, CROSSFADE_MS);
  window.setTimeout(() => {
    a.pause();
  }, CROSSFADE_MS);
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
  // Crossfade to new track
  const prev = menuAudio;
  const wasPlaying = prev && !prev.paused;
  buildMenuAudio();
  if (wasPlaying && menuAudio) {
    menuAudio.play().catch(() => {});
    fade(menuAudio, masterVolume * MENU_VOLUME_FACTOR, CROSSFADE_MS);
    if (prev) {
      fade(prev, 0, CROSSFADE_MS);
      window.setTimeout(() => prev.pause(), CROSSFADE_MS);
    }
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
  if (prev && !prev.paused) {
    fade(prev, 0, PHASE_CROSSFADE_MS);
    window.setTimeout(() => prev.pause(), PHASE_CROSSFADE_MS);
  }
  nextTrack.currentTime = 0;
  nextTrack.volume = 0;
  nextTrack.play().catch(() => {});
  fade(nextTrack, targetVolume(), PHASE_CROSSFADE_MS);
  bossPhaseAudio = nextTrack;
  currentTrackIdx = trackIdx;
  bossPhase = phase;
  resetAnalysisState();
}

export function resetBossPhase(): void {
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
    if (cur && cur.paused && !isPaused) {
      cur.play().catch(() => {});
      fade(cur, targetVolume(), CROSSFADE_MS);
    }
    return;
  }

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
  resetBossPhase();
}
