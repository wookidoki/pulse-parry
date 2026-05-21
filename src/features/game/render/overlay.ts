import type { EngineState } from "../types";
import { STAGES, currentStage } from "../config/stages";
import {
  PARRY_HALF_CONE_RAD,
  PARRY_RANGE,
} from "../config/tuning";

export function drawAimLine(
  c: CanvasRenderingContext2D,
  state: EngineState,
  w: number,
  h: number,
): void {
  const aimLen = Math.max(w, h);
  c.strokeStyle = "rgba(28, 240, 255, 0.18)";
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(Math.cos(state.aimAngle) * aimLen, Math.sin(state.aimAngle) * aimLen);
  c.stroke();
}

export function drawParryCone(
  c: CanvasRenderingContext2D,
  state: EngineState,
  nowMs: number,
): void {
  if (!state.parryHeld) return;
  const startA = state.aimAngle - PARRY_HALF_CONE_RAD;
  const endA = state.aimAngle + PARRY_HALF_CONE_RAD;
  const pulse = 0.5 + Math.sin(nowMs / 80) * 0.1;
  c.fillStyle = `rgba(247, 255, 58, ${0.12 * pulse})`;
  c.beginPath();
  c.moveTo(0, 0);
  c.arc(0, 0, PARRY_RANGE, startA, endA);
  c.closePath();
  c.fill();
  c.save();
  c.strokeStyle = `rgba(247, 255, 58, ${0.6 * pulse})`;
  c.lineWidth = 2;
  c.shadowColor = "rgba(247, 255, 58, 0.9)";
  c.shadowBlur = 16;
  c.beginPath();
  c.arc(0, 0, PARRY_RANGE, startA, endA);
  c.stroke();
  c.restore();
}

export function drawStageProgress(
  c: CanvasRenderingContext2D,
  state: EngineState,
  w: number,
  nowMs: number,
): void {
  const stage = currentStage(state.stageIndex);
  const elapsed = nowMs - state.stageStartMs;
  const progress = Math.min(1, elapsed / stage.durationMs);
  const barW = w * 0.6;
  const barX = (w - barW) / 2;

  c.save();
  c.fillStyle = "rgba(240, 246, 255, 0.08)";
  c.fillRect(barX, 0, barW, 3);
  c.fillStyle = stage.accentCyan;
  c.shadowColor = stage.accentCyan;
  c.shadowBlur = 8;
  c.fillRect(barX, 0, barW * progress, 3);
  c.restore();

  c.fillStyle = "rgba(240, 246, 255, 0.4)";
  for (let i = 1; i < STAGES.length; i++) {
    const segX = barX + (i / STAGES.length) * barW;
    c.fillRect(segX - 1, 0, 2, 6);
  }
}
