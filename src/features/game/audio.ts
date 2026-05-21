type AudioCtx = AudioContext & { _master?: GainNode };

let ctx: AudioCtx | null = null;
let masterGain: GainNode | null = null;
let started = false;

export function ensureAudio(): boolean {
  if (started && ctx) return true;
  if (typeof window === "undefined") return false;
  try {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctor() as AudioCtx;
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.6;
    masterGain.connect(ctx.destination);
    started = true;
    return true;
  } catch {
    return false;
  }
}

export function setMasterVolume(v: number) {
  if (masterGain) masterGain.gain.value = Math.max(0, Math.min(1, v));
}

export function resumeAudio() {
  if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
}

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

export function playKick() {
  envOsc(180, 42, 0.18, "sine", 0.45);
}

export function playHat() {
  noiseBurst(0.04, 0.18, 7500);
}

export function playSnare() {
  noiseBurst(0.12, 0.28, 1800);
  envOsc(220, 160, 0.08, "triangle", 0.2);
}

export function playBeat(beatNum: number) {
  const inBar = beatNum % 4;
  if (inBar === 0) {
    playKick();
  } else if (inBar === 2) {
    playSnare();
  } else {
    playHat();
  }
}

export function playParryHit() {
  envOsc(1400, 2400, 0.06, "square", 0.12);
}

export function playReflect() {
  envOsc(900, 2200, 0.18, "sawtooth", 0.18);
  noiseBurst(0.06, 0.08, 4000);
}

export function playEnemyShoot() {
  envOsc(420, 220, 0.08, "sawtooth", 0.1);
}

export function playEnemyDie() {
  envOsc(800, 90, 0.32, "triangle", 0.25);
  noiseBurst(0.18, 0.18, 600);
}

export function playPlayerHit() {
  envOsc(180, 60, 0.32, "sawtooth", 0.4);
  noiseBurst(0.22, 0.2, 320);
}

export function playStageUp() {
  if (!ctx) return;
  [392, 523, 784].forEach((f, i) => {
    setTimeout(() => envOsc(f, f, 0.18, "square", 0.18), i * 90);
  });
}
