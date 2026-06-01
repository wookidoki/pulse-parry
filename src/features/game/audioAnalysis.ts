const analysers = new Map<number, AnalyserNode>();
const bassHistory: number[] = [];
const HISTORY_SIZE = 28;
const MIN_INTERVAL_MS = 110;
const KICK_THRESHOLD_MULT = 1.35;
const KICK_MIN_ENERGY = 95;
const FFT_BUFFER = new Uint8Array(128);

let lastKickAtMs = -10000;

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

export function tickKickDetection(currentIndex: number, nowMs: number): boolean {
  const analyser = analysers.get(currentIndex);
  if (!analyser) return false;
  analyser.getByteFrequencyData(FFT_BUFFER);

  let bass = 0;
  for (let i = 1; i < 6; i++) bass += FFT_BUFFER[i];
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
    lastKickAtMs = nowMs;
    return true;
  }
  return false;
}

export function resetAnalysisState(): void {
  bassHistory.length = 0;
  lastKickAtMs = -10000;
}
