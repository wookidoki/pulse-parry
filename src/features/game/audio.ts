let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let started = false;

export function ensureAudio(): boolean {
  if (started && ctx) return true;
  if (typeof window === "undefined") return false;
  try {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctor();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.42;
    masterGain.connect(ctx.destination);
    started = true;
    void preloadSamples();
    return true;
  } catch {
    return false;
  }
}

export function setMasterVolume(v: number) {
  if (masterGain) masterGain.gain.value = Math.max(0, Math.min(1, v)) * 0.75;
}

export function resumeAudio() {
  if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
}

export function getAudioContext(): AudioContext | null {
  return ctx;
}

// ───────── Sample pool ─────────
type SampleKey =
  | "slash"
  | "clash"
  | "laserSmall"
  | "laserHeavy"
  | "forceField"
  | "impact"
  | "explode"
  | "explodeDeep"
  | "uiClick"
  | "pickup";

const SAMPLE_URLS: Record<SampleKey, string[]> = {
  slash: [
    "/audio/sfx/slash1.ogg",
    "/audio/sfx/slash2.ogg",
    "/audio/sfx/slash3.ogg",
    "/audio/sfx/slash4.ogg",
  ],
  clash: [
    "/audio/sfx/clash1.ogg",
    "/audio/sfx/clash2.ogg",
    "/audio/sfx/clash3.ogg",
  ],
  laserSmall: ["/audio/sfx/laser_small.ogg", "/audio/sfx/laser_small2.ogg"],
  laserHeavy: ["/audio/sfx/laser_large.ogg"],
  forceField: ["/audio/sfx/force_field.ogg", "/audio/sfx/force_field2.ogg"],
  impact: ["/audio/sfx/impact_metal.ogg", "/audio/sfx/impact_metal2.ogg"],
  explode: ["/audio/sfx/explosion.ogg", "/audio/sfx/explosion_big.ogg"],
  explodeDeep: ["/audio/sfx/explosion_deep.ogg"],
  uiClick: ["/audio/sfx/ui_click.ogg"],
  pickup: ["/audio/sfx/beep_pickup.ogg"],
};

const samplePool: Partial<Record<SampleKey, AudioBuffer[]>> = {};
let samplesLoaded = false;

// Max concurrent voices per sample key — older voices culled when exceeded.
const MAX_VOICES: Record<SampleKey, number> = {
  slash: 3,
  clash: 3,
  laserSmall: 2,
  laserHeavy: 1,
  forceField: 2,
  impact: 2,
  explode: 2,
  explodeDeep: 2,
  uiClick: 1,
  pickup: 2,
};

// Per-key throttle: repeats within this window get ducked to avoid stacking.
const THROTTLE_MS: Partial<Record<SampleKey, number>> = {
  laserSmall: 45,
  laserHeavy: 80,
  explode: 90,
  explodeDeep: 90,
  impact: 60,
  clash: 35,
};

const activeVoices: Partial<Record<SampleKey, AudioBufferSourceNode[]>> = {};
const lastPlayedAtMs: Partial<Record<SampleKey, number>> = {};

async function preloadSamples(): Promise<void> {
  if (samplesLoaded || !ctx) return;
  samplesLoaded = true;
  await Promise.all(
    (Object.entries(SAMPLE_URLS) as [SampleKey, string[]][]).map(async ([key, urls]) => {
      const buffers = await Promise.all(
        urls.map(async (url) => {
          try {
            const res = await fetch(url);
            const ab = await res.arrayBuffer();
            return await ctx!.decodeAudioData(ab);
          } catch {
            return null;
          }
        }),
      );
      samplePool[key] = buffers.filter((b): b is AudioBuffer => b !== null);
    }),
  );
}

function playSample(
  key: SampleKey,
  opts?: { gain?: number; pitch?: number; delayMs?: number },
): void {
  if (!ctx || !masterGain) return;
  const pool = samplePool[key];
  if (!pool || pool.length === 0) return;

  const nowMs = ctx.currentTime * 1000;
  const throttle = THROTTLE_MS[key] ?? 0;
  const lastMs = lastPlayedAtMs[key] ?? -Infinity;
  let gainMul = 1;
  if (throttle > 0 && nowMs - lastMs < throttle) {
    const ratio = (nowMs - lastMs) / throttle;
    gainMul = 0.35 + ratio * 0.4; // 0.35 → 0.75 as the window decays
  }
  lastPlayedAtMs[key] = nowMs;

  const active = (activeVoices[key] ??= []);
  const max = MAX_VOICES[key] ?? 3;
  while (active.length >= max) {
    const oldest = active.shift();
    try {
      oldest?.stop();
    } catch {
      /* may have already ended */
    }
  }

  const buf = pool[Math.floor(Math.random() * pool.length)];
  const startAt = ctx.currentTime + (opts?.delayMs ? opts.delayMs / 1000 : 0);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.playbackRate.value = opts?.pitch ?? 1;
  const g = ctx.createGain();
  g.gain.value = (opts?.gain ?? 1) * gainMul;
  src.connect(g).connect(masterGain);
  src.start(startAt);
  active.push(src);
  src.onended = () => {
    const i = active.indexOf(src);
    if (i >= 0) active.splice(i, 1);
  };
}

// ───────── Synth helpers ─────────
function envOsc(
  freqStart: number,
  freqEnd: number,
  durSec: number,
  type: OscillatorType,
  gainPeak: number,
) {
  if (!ctx || !masterGain) return;
  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, t0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t0 + durSec);
  g.gain.setValueAtTime(gainPeak, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + durSec);
  osc.connect(g).connect(masterGain);
  osc.start(t0);
  osc.stop(t0 + durSec);
}

function noiseBurst(durSec: number, gainPeak: number, filterFreq: number) {
  if (!ctx || !masterGain) return;
  const t0 = ctx.currentTime;
  const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * durSec));
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = filterFreq;
  filter.Q.value = 2;
  const g = ctx.createGain();
  g.gain.setValueAtTime(gainPeak, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + durSec);
  src.connect(filter).connect(g).connect(masterGain);
  src.start(t0);
  src.stop(t0 + durSec);
}

const PITCH_VAR = () => 0.92 + Math.random() * 0.16;

// ───────── Player-side SFX ─────────
export function playParryHit() {
  playSample("clash", { gain: 0.35, pitch: PITCH_VAR() });
  envOsc(1400, 2400, 0.06, "square", 0.05);
}

export function playReflect() {
  playSample("slash", { gain: 0.5, pitch: PITCH_VAR() });
  playSample("clash", { gain: 0.4, pitch: 0.95 + Math.random() * 0.1, delayMs: 25 });
  envOsc(900, 2200, 0.12, "sawtooth", 0.08);
  envOsc(80, 38, 0.14, "sine", 0.22);
}

export function playSlashWoosh() {
  playSample("slash", { gain: 0.4, pitch: 1.05 + Math.random() * 0.15 });
}

export function playEnemyShoot() {
  playSample("laserSmall", { gain: 0.28, pitch: PITCH_VAR() });
}

export function playEnemyShootHeavy() {
  playSample("laserHeavy", { gain: 0.4, pitch: PITCH_VAR() });
}

// ───────── Race-specific shoots — distinct timbres ─────────
// omnic = clean digital pulse, virus = noise glitch (no laser sample),
// drone = low thud, boss = heavy sub.
export function playOmnicShoot() {
  playSample("laserSmall", { gain: 0.3, pitch: 0.95 + Math.random() * 0.15 });
  envOsc(880, 660, 0.04, "square", 0.03);
}

export function playVirusShoot() {
  noiseBurst(0.06, 0.09, 4800);
  envOsc(1320, 660, 0.07, "sawtooth", 0.06);
}

export function playDroneShoot() {
  playSample("laserSmall", { gain: 0.26, pitch: 0.7 + Math.random() * 0.08 });
  envOsc(380, 200, 0.08, "sawtooth", 0.05);
}

export function playDroneShootHeavy() {
  playSample("laserHeavy", { gain: 0.45, pitch: 0.85 + Math.random() * 0.1 });
  envOsc(180, 60, 0.18, "sine", 0.1);
}

export function playBossShoot() {
  playSample("laserHeavy", { gain: 0.5, pitch: 0.65 + Math.random() * 0.1 });
  playSample("explodeDeep", { gain: 0.2, pitch: 0.95, delayMs: 20 });
  envOsc(140, 80, 0.2, "sawtooth", 0.1);
}

// ───────── Enemy deaths — distinct first-100ms per race ─────────
export function playEnemyDie() {
  playSample("explode", { gain: 0.38, pitch: PITCH_VAR() });
  envOsc(60, 28, 0.22, "sine", 0.2);
}

// omnic = digital shutdown (metal + descending square — no explode)
export function playOmnicDie() {
  playSample("impact", { gain: 0.32, pitch: 1.1 + Math.random() * 0.1 });
  envOsc(880, 110, 0.32, "square", 0.16);
  envOsc(440, 90, 0.28, "sine", 0.12);
}

// virus = glitch implosion (noise + sawtooth — no explode)
export function playVirusDie() {
  noiseBurst(0.18, 0.16, 2200);
  noiseBurst(0.1, 0.12, 5800);
  envOsc(1320, 80, 0.34, "sawtooth", 0.14);
  envOsc(660, 60, 0.36, "square", 0.08);
}

// drone = heavy mech crash (explodeDeep + impact, not stacked explode)
export function playDroneDie() {
  playSample("explodeDeep", { gain: 0.45, pitch: 0.78 + Math.random() * 0.08 });
  playSample("impact", { gain: 0.28, pitch: 0.8, delayMs: 70 });
  envOsc(220, 60, 0.3, "sawtooth", 0.16);
  envOsc(80, 30, 0.4, "sine", 0.22);
}

// boss = epic chain (kept layered, slightly trimmed)
export function playBossDie() {
  playSample("explode", { gain: 0.6, pitch: 1.0 });
  playSample("explodeDeep", { gain: 0.6, pitch: 0.75, delayMs: 80 });
  playSample("explode", { gain: 0.45, pitch: 0.65, delayMs: 220 });
  playSample("explodeDeep", { gain: 0.5, pitch: 0.6, delayMs: 360 });
  playSample("impact", { gain: 0.4, pitch: 0.7, delayMs: 60 });
  envOsc(660, 60, 0.6, "sawtooth", 0.2);
  envOsc(110, 30, 0.8, "sine", 0.3);
}

export function playPlayerHit() {
  playSample("impact", { gain: 0.55, pitch: 0.9 + Math.random() * 0.1 });
  playSample("explodeDeep", { gain: 0.3, pitch: 0.85, delayMs: 20 });
  envOsc(180, 60, 0.28, "sawtooth", 0.22);
}

export function playPerfectHeal() {
  playSample("pickup", { gain: 0.45, pitch: 1.0 });
  playSample("pickup", { gain: 0.4, pitch: 1.5, delayMs: 60 });
  envOsc(990, 1980, 0.18, "triangle", 0.1);
}

export function playPerfectChime() {
  playSample("forceField", { gain: 0.4, pitch: 1.5 });
  envOsc(2200, 3400, 0.14, "sine", 0.14);
  envOsc(1760, 2640, 0.18, "triangle", 0.1);
}

export function playDashWhoosh() {
  playSample("forceField", { gain: 0.28, pitch: 1.8 });
  noiseBurst(0.16, 0.1, 1800);
}

// ───────── HUD / cutscene cues (no uiClick reuse) ─────────
export function playStageUp() {
  if (!ctx) return;
  [392, 523, 784, 1046].forEach((f, i) => {
    setTimeout(() => envOsc(f, f * 1.005, 0.18, "triangle", 0.13), i * 80);
  });
}

export function playCountdownBeep(final = false) {
  if (final) {
    playSample("forceField", { gain: 0.42, pitch: 1.2 });
    envOsc(880, 1320, 0.32, "triangle", 0.18);
  } else {
    envOsc(660, 660, 0.14, "triangle", 0.14);
    envOsc(990, 990, 0.1, "sine", 0.06);
  }
}

export function playUiClick() {
  playSample("uiClick", { gain: 0.22, pitch: 1.4 });
}

// ───────── Cutscene SFX ─────────
export function playIntroWarp() {
  playSample("forceField", { gain: 0.5, pitch: 0.65 });
  playSample("explodeDeep", { gain: 0.35, pitch: 1.5, delayMs: 700 });
  envOsc(180, 880, 1.4, "sine", 0.1);
  envOsc(90, 220, 1.6, "triangle", 0.06);
}

export function playBossSiren() {
  playSample("laserHeavy", { gain: 0.5, pitch: 0.55 });
  playSample("explodeDeep", { gain: 0.65, pitch: 0.85, delayMs: 220 });
  playSample("impact", { gain: 0.45, pitch: 0.9, delayMs: 500 });
  playSample("impact", { gain: 0.45, pitch: 1.0, delayMs: 1000 });
  playSample("impact", { gain: 0.45, pitch: 0.85, delayMs: 1500 });
  envOsc(80, 60, 2.4, "sawtooth", 0.14);
  envOsc(420, 220, 0.4, "square", 0.08);
}

export function playDeathBoom() {
  playSample("explodeDeep", { gain: 0.7, pitch: 0.6 });
  playSample("impact", { gain: 0.55, pitch: 0.55, delayMs: 120 });
  playSample("explode", { gain: 0.4, pitch: 0.7, delayMs: 250 });
  envOsc(440, 60, 1.5, "sawtooth", 0.18);
  envOsc(220, 30, 1.7, "sine", 0.25);
}

export function playMissileTelegraph() {
  envOsc(330, 990, 0.42, "square", 0.1);
  envOsc(220, 660, 0.4, "triangle", 0.05);
}

export function playMissileExplode() {
  playSample("explode", { gain: 0.55, pitch: 1.0 });
  playSample("explodeDeep", { gain: 0.45, pitch: 0.85, delayMs: 30 });
  playSample("impact", { gain: 0.4, pitch: 0.95, delayMs: 60 });
  envOsc(240, 60, 0.4, "sawtooth", 0.14);
}

export function playShockwaveTelegraph() {
  playSample("forceField", { gain: 0.3, pitch: 0.7 });
  envOsc(110, 440, 0.8, "sine", 0.08);
}

export function playShockwave() {
  playSample("forceField", { gain: 0.45, pitch: 0.5 });
  playSample("explodeDeep", { gain: 0.4, pitch: 0.7, delayMs: 80 });
  envOsc(60, 30, 1.0, "sine", 0.18);
}

export function playVictoryFlourish() {
  playSample("explode", { gain: 0.55, pitch: 1.05 });
  playSample("forceField", { gain: 0.4, pitch: 1.4, delayMs: 100 });
  const pitches = [1.0, 1.2, 1.5, 1.8];
  pitches.forEach((pitch, i) => {
    playSample("clash", { gain: 0.32, pitch, delayMs: 180 + i * 130 });
  });
  envOsc(440, 1320, 0.8, "triangle", 0.14);
  envOsc(660, 1980, 0.8, "sine", 0.1);
  envOsc(330, 990, 1.1, "sawtooth", 0.06);
}
