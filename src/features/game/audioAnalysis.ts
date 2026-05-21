const analysers = new Map<number, AnalyserNode>();
const bassHistory: number[] = [];
const HISTORY_SIZE = 28;
const MIN_INTERVAL_MS = 110;
const KICK_THRESHOLD_MULT = 1.35;
const KICK_MIN_ENERGY = 95;

let lastKickAtMs = -10000;
let recentIntervals: number[] = [];

export function attachAnalyser(
  audioCtx: AudioContext,
  audioEl: HTMLAudioElement,
  key: number,
): void {
  if (analysers.has(key)) return;
  try {
    const src = audioCtx.createMediaElementSource(audioEl);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.5;
    src.connect(analyser);
    analyser.connect(audioCtx.destination);
    analysers.set(key, analyser);
  } catch {
    // Already attached or other error — ignored
  }
}

export function hasAnalyser(key: number): boolean {
  return analysers.has(key);
}

export function tickKickDetection(currentIndex: number, nowMs: number): boolean {
  const analyser = analysers.get(currentIndex);
  if (!analyser) return false;
  const buf = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(buf);

  let bass = 0;
  for (let i = 1; i < 6; i++) bass += buf[i];
  bass /= 5;

  bassHistory.push(bass);
  if (bassHistory.length > HISTORY_SIZE) bassHistory.shift();

  let sum = 0;
  for (const v of bassHistory) sum += v;
  const avg = sum / Math.max(1, bassHistory.length);

  const isKick =
    bass > avg * KICK_THRESHOLD_MULT &&
    bass > KICK_MIN_ENERGY &&
    nowMs - lastKickAtMs > MIN_INTERVAL_MS;

  if (isKick) {
    const interval = nowMs - lastKickAtMs;
    if (interval > 200 && interval < 1200) {
      recentIntervals.push(interval);
      if (recentIntervals.length > 12) recentIntervals.shift();
    }
    lastKickAtMs = nowMs;
    return true;
  }
  return false;
}

export function getDetectedBpm(): number {
  if (recentIntervals.length < 4) return 0;
  const sorted = [...recentIntervals].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  return 60000 / median;
}

export function resetAnalysisState(): void {
  bassHistory.length = 0;
  lastKickAtMs = -10000;
  recentIntervals = [];
}
