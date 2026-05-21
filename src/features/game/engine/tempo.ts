import type { TempoPoint } from "../config/stages";

export function bpmAt(tempoMap: TempoPoint[], t: number): number {
  if (tempoMap.length === 0) return 120;
  const clamped = Math.max(0, Math.min(1, t));
  if (clamped <= tempoMap[0].t) return tempoMap[0].bpm;
  if (clamped >= tempoMap[tempoMap.length - 1].t) {
    return tempoMap[tempoMap.length - 1].bpm;
  }
  for (let i = 0; i < tempoMap.length - 1; i++) {
    const a = tempoMap[i];
    const b = tempoMap[i + 1];
    if (clamped >= a.t && clamped <= b.t) {
      const span = b.t - a.t || 1;
      const local = (clamped - a.t) / span;
      return a.bpm + (b.bpm - a.bpm) * local;
    }
  }
  return tempoMap[tempoMap.length - 1].bpm;
}
