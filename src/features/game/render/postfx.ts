import type { EngineState } from "../types";
import { COMBO_MILESTONES } from "../config/tuning";

export function comboLevel(combo: number): number {
  let level = 0;
  for (const m of COMBO_MILESTONES) {
    if (combo >= m) level += 1;
  }
  return level;
}

export function drawVignette(
  c: CanvasRenderingContext2D,
  state: EngineState,
  combo: number,
  w: number,
  h: number,
): void {
  const level = comboLevel(combo);
  const baseStrength = 0.32 + level * 0.05;
  const pulseStrength = state.bgPulse * (0.08 + level * 0.05);
  const totalStrength = Math.min(0.7, baseStrength + pulseStrength);

  const cx = w / 2;
  const cy = h / 2;
  const innerR = Math.min(w, h) * 0.28;
  const outerR = Math.max(w, h) * 0.78;
  const grad = c.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
  grad.addColorStop(0, "rgba(5, 3, 10, 0)");
  grad.addColorStop(1, `rgba(5, 3, 10, ${totalStrength})`);
  c.fillStyle = grad;
  c.fillRect(0, 0, w, h);
}

export function drawComboFlowEdges(
  c: CanvasRenderingContext2D,
  state: EngineState,
  combo: number,
  w: number,
  h: number,
  nowMs: number,
): void {
  const level = comboLevel(combo);
  if (level <= 0) return;

  const palette: Record<number, string> = {
    1: "rgba(28, 240, 255, 0.18)",
    2: "rgba(247, 255, 58, 0.22)",
    3: "rgba(255, 43, 214, 0.26)",
    4: "rgba(255, 56, 99, 0.32)",
    5: "rgba(255, 56, 99, 0.40)",
  };
  const color = palette[level] ?? palette[5];
  const pulse = 0.55 + Math.sin(nowMs / 220 + state.bgPulse * 4) * 0.45;
  const intensity = pulse * (0.4 + level * 0.18);
  const thickness = 80 + level * 30 + state.bgPulse * 40;

  const grad = c.createLinearGradient(0, 0, 0, thickness);
  grad.addColorStop(0, color);
  grad.addColorStop(1, "rgba(0, 0, 0, 0)");

  c.save();
  c.globalAlpha = intensity;
  c.fillStyle = grad;
  c.fillRect(0, 0, w, thickness);
  c.fillRect(0, h - thickness, w, thickness);

  const gradH = c.createLinearGradient(0, 0, thickness, 0);
  gradH.addColorStop(0, color);
  gradH.addColorStop(1, "rgba(0, 0, 0, 0)");
  c.fillStyle = gradH;
  c.fillRect(0, 0, thickness, h);
  c.fillRect(w - thickness, 0, thickness, h);
  c.restore();
}

export function drawPauseOverlay(c: CanvasRenderingContext2D, w: number, h: number): void {
  c.fillStyle = "rgba(5, 3, 10, 0.6)";
  c.fillRect(0, 0, w, h);
}
