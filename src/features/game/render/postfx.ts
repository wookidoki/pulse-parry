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
  const baseStrength = 0.22 + level * 0.025;
  const pulseStrength = state.bgPulse * (0.04 + level * 0.02);
  const totalStrength = Math.min(0.4, baseStrength + pulseStrength);

  const cx = w / 2;
  const cy = h / 2;
  const innerR = Math.min(w, h) * 0.34;
  const outerR = Math.max(w, h) * 0.85;
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
    1: "rgba(28, 240, 255, 0.08)",
    2: "rgba(247, 255, 58, 0.10)",
    3: "rgba(255, 43, 214, 0.12)",
    4: "rgba(255, 56, 99, 0.14)",
    5: "rgba(255, 56, 99, 0.18)",
  };
  const color = palette[level] ?? palette[5];
  const pulse = 0.6 + Math.sin(nowMs / 320 + state.bgPulse * 2) * 0.2;
  const intensity = pulse * (0.32 + level * 0.08);
  const thickness = 40 + level * 14 + state.bgPulse * 18;

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

export function drawChromaticBurst(
  c: CanvasRenderingContext2D,
  state: EngineState,
  w: number,
  h: number,
): void {
  if (state.perfectFlashMsLeft <= 0) return;
  const t = state.perfectFlashMsLeft / 280;
  const intensity = Math.min(1, t);
  const easeOut = 1 - Math.pow(1 - intensity, 2);

  const edge = w * 0.18 * easeOut;
  c.save();

  const leftGrad = c.createLinearGradient(0, 0, edge * 1.4, 0);
  leftGrad.addColorStop(0, `rgba(28, 240, 255, ${0.35 * easeOut})`);
  leftGrad.addColorStop(1, "rgba(28, 240, 255, 0)");
  c.fillStyle = leftGrad;
  c.fillRect(0, 0, edge * 1.4, h);

  const rightGrad = c.createLinearGradient(w - edge * 1.4, 0, w, 0);
  rightGrad.addColorStop(0, "rgba(255, 56, 99, 0)");
  rightGrad.addColorStop(1, `rgba(255, 56, 99, ${0.35 * easeOut})`);
  c.fillStyle = rightGrad;
  c.fillRect(w - edge * 1.4, 0, edge * 1.4, h);

  const topGrad = c.createLinearGradient(0, 0, 0, edge);
  topGrad.addColorStop(0, `rgba(255, 255, 255, ${0.18 * easeOut})`);
  topGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
  c.fillStyle = topGrad;
  c.fillRect(0, 0, w, edge);

  const bottomGrad = c.createLinearGradient(0, h - edge, 0, h);
  bottomGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
  bottomGrad.addColorStop(1, `rgba(255, 255, 255, ${0.18 * easeOut})`);
  c.fillStyle = bottomGrad;
  c.fillRect(0, h - edge, w, edge);

  c.restore();
}

export function drawPauseOverlay(c: CanvasRenderingContext2D, w: number, h: number): void {
  c.fillStyle = "rgba(5, 3, 10, 0.6)";
  c.fillRect(0, 0, w, h);
}
