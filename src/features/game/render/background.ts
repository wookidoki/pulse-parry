import type { EngineState } from "../types";
import { currentStage } from "../config/stages";
import { PALETTE } from "../config/palette";

const GRID_STEP = 40;
const RADIAL_LINE_COUNT = 18;

export function drawBackground(
  c: CanvasRenderingContext2D,
  state: EngineState,
  w: number,
  h: number,
  nowMs: number,
): void {
  const stage = currentStage(state.stageIndex);
  const pulseEnv = state.bgPulse;

  c.fillStyle = PALETTE.bg;
  c.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;
  const radial = c.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.7);
  radial.addColorStop(0, stage.bgInner);
  radial.addColorStop(0.5, stage.bgOuter);
  radial.addColorStop(1, "rgba(5, 3, 10, 0)");
  c.globalAlpha = 0.6 + pulseEnv * 0.4;
  c.fillStyle = radial;
  c.fillRect(0, 0, w, h);
  c.globalAlpha = 1;

  drawDriftingGrid(c, w, h, nowMs);
  drawParallaxRadialLines(c, cx, cy, nowMs, state.stageIndex, pulseEnv);
  drawBeatRing(c, cx, cy, state.beat.beatPhase);
}

function drawDriftingGrid(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  nowMs: number,
): void {
  const drift = (nowMs * 0.018) % GRID_STEP;
  c.save();
  c.strokeStyle = "rgba(28, 240, 255, 0.06)";
  c.lineWidth = 1;
  for (let x = -drift; x <= w + GRID_STEP; x += GRID_STEP) {
    c.beginPath();
    c.moveTo(x, 0);
    c.lineTo(x, h);
    c.stroke();
  }
  for (let y = -drift; y <= h + GRID_STEP; y += GRID_STEP) {
    c.beginPath();
    c.moveTo(0, y);
    c.lineTo(w, y);
    c.stroke();
  }
  c.restore();
}

function drawParallaxRadialLines(
  c: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  nowMs: number,
  stageIndex: number,
  pulseEnv: number,
): void {
  const phase = (nowMs * (0.04 + stageIndex * 0.025)) % 1;
  c.save();
  c.strokeStyle = `rgba(247, 255, 58, ${0.05 + pulseEnv * 0.08})`;
  c.lineWidth = 1;
  for (let i = 0; i < RADIAL_LINE_COUNT; i++) {
    const a = (i / RADIAL_LINE_COUNT) * Math.PI * 2;
    const r0 = 60 + phase * 120;
    const r1 = r0 + 30;
    c.beginPath();
    c.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
    c.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    c.stroke();
  }
  c.restore();
}

function drawBeatRing(
  c: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  beatPhase: number,
): void {
  const radius = 80 + beatPhase * 300;
  const alpha = (1 - beatPhase) * 0.4;
  c.save();
  c.strokeStyle = `rgba(28, 240, 255, ${alpha})`;
  c.lineWidth = 2;
  c.beginPath();
  c.arc(cx, cy, radius, 0, Math.PI * 2);
  c.stroke();
  c.restore();
}
