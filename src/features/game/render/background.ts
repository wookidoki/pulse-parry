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

  drawRhythmStreaks(c, w, h, nowMs, state.beat.beatPhase, state.stageIndex);
  drawDriftingGrid(c, w, h, nowMs);
  drawCityscape(c, w, h, nowMs, state.stageIndex);
  drawParallaxRadialLines(c, cx, cy, nowMs, state.stageIndex, pulseEnv);
  drawBeatRing(c, cx, cy, state.beat.beatPhase);
}

function drawRhythmStreaks(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  nowMs: number,
  beatPhase: number,
  stageIndex: number,
): void {
  const streakCount = 12 + stageIndex * 3;
  const baseSpeed = 0.18 + stageIndex * 0.04;
  const beatBoost = (1 - beatPhase) * 0.5;
  c.save();
  c.lineCap = "round";
  for (let i = 0; i < streakCount; i++) {
    const seed = ((i * 9301 + 49297) % 233280) / 233280;
    const x = seed * w;
    const speed = baseSpeed * (0.6 + seed * 0.8) * (1 + beatBoost);
    const cycle = h + 200;
    const y = ((nowMs * speed + seed * cycle) % cycle) - 100;
    const len = 60 + seed * 80;
    const alpha = 0.06 + seed * 0.12 + beatBoost * 0.05;
    const hue = i % 3 === 0 ? "247, 255, 58" : i % 3 === 1 ? "28, 240, 255" : "255, 43, 214";
    c.strokeStyle = `rgba(${hue}, ${alpha})`;
    c.lineWidth = 1 + seed * 1.5;
    c.shadowColor = `rgba(${hue}, 0.5)`;
    c.shadowBlur = 6;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x, y + len);
    c.stroke();
  }
  c.shadowBlur = 0;
  c.restore();
}

function drawCityscape(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  nowMs: number,
  stageIndex: number,
): void {
  drawCityLayer(c, w, h, nowMs, 0.012, 0.92, 22, 60, "rgba(5, 3, 18, 0.55)", "rgba(28, 240, 255, 0.10)");
  drawCityLayer(c, w, h, nowMs, 0.028, 0.86, 32, 90, "rgba(10, 5, 26, 0.65)", "rgba(255, 43, 214, 0.14)");
  drawCityLayer(c, w, h, nowMs, 0.055, 0.78, 50, 140, "rgba(15, 8, 32, 0.7)", "rgba(247, 255, 58, 0.12)");
  drawRoadLines(c, w, h, nowMs, stageIndex);
}

function drawCityLayer(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  nowMs: number,
  speed: number,
  baselineFactor: number,
  minHeight: number,
  maxHeight: number,
  fill: string,
  windowColor: string,
): void {
  const baseline = h * baselineFactor;
  const buildingWidth = 64;
  const totalCycle = buildingWidth * 8;
  const scroll = (nowMs * speed) % totalCycle;
  c.save();
  c.fillStyle = fill;
  for (let i = -2; i < Math.ceil(w / buildingWidth) + 2; i++) {
    const x = i * buildingWidth - scroll;
    const seed = ((i + 1000) * 9301 + 49297) % 233280;
    const height = minHeight + (seed / 233280) * (maxHeight - minHeight);
    const top = baseline - height;
    c.fillRect(x, top, buildingWidth - 4, height);
    c.fillStyle = windowColor;
    for (let wy = top + 8; wy < baseline - 4; wy += 12) {
      for (let wx = x + 6; wx < x + buildingWidth - 10; wx += 10) {
        if (((wx + wy) * (i + 1)) % 7 < 3) {
          c.fillRect(wx, wy, 3, 4);
        }
      }
    }
    c.fillStyle = fill;
  }
  c.restore();
}

function drawRoadLines(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  nowMs: number,
  stageIndex: number,
): void {
  const cx = w / 2;
  const cy = h / 2;
  const speed = 80 + stageIndex * 30;
  const phase = (nowMs * speed * 0.001) % 60;
  c.save();
  c.strokeStyle = "rgba(28, 240, 255, 0.16)";
  c.lineWidth = 1;
  const lines = 10;
  for (let i = 0; i < lines; i++) {
    const t = (i / lines + phase / 60) % 1;
    const angle = -Math.PI / 2 + 0.1 + i * 0.025;
    const startR = 60 + t * 600;
    const endR = startR + 18;
    const x1 = cx + Math.cos(angle) * startR;
    const y1 = cy + Math.sin(angle) * startR;
    const x2 = cx + Math.cos(angle) * endR;
    const y2 = cy + Math.sin(angle) * endR;
    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.stroke();
  }
  c.restore();
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
