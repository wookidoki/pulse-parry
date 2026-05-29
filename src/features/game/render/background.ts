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
  const bossActive = state.bossSpawned;
  const bossPhase = state.bossPhase;

  c.fillStyle = PALETTE.bg;
  c.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;

  // Phase-aware inner/outer colors during boss
  let innerColor = stage.bgInner;
  let outerColor = stage.bgOuter;
  if (bossActive) {
    if (bossPhase === 1) {
      innerColor = "rgba(255, 56, 99, 0.20)";
      outerColor = "rgba(255, 56, 99, 0.10)";
    } else if (bossPhase >= 2) {
      const flicker = 0.62 + Math.sin(nowMs / 200) * 0.18;
      innerColor = `rgba(255, 56, 99, ${0.3 * flicker})`;
      outerColor = `rgba(255, 56, 99, 0.18)`;
    }
  }

  const radial = c.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.7);
  radial.addColorStop(0, innerColor);
  radial.addColorStop(0.5, outerColor);
  radial.addColorStop(1, "rgba(5, 3, 10, 0)");
  c.globalAlpha = 0.6 + pulseEnv * 0.4;
  c.fillStyle = radial;
  c.fillRect(0, 0, w, h);
  c.globalAlpha = 1;

  // BPM-aware streak intensity
  const bpmIntensity = Math.max(0.6, Math.min(1.6, state.beat.bpm / 120));
  drawRhythmStreaks(c, w, h, nowMs, state.beat.beatPhase, state.stageIndex, bpmIntensity);
  drawTunnel(c, cx, cy, w, h, nowMs, state.stageIndex, state.beat.beatPhase);
  drawDriftingGrid(c, w, h, nowMs);
  drawCityscape(c, w, h, nowMs, state.stageIndex);
  drawParallaxRadialLines(c, cx, cy, nowMs, state.stageIndex, pulseEnv);
  drawBeatRing(c, cx, cy, state.beat.beatPhase);
  drawStageThemeOverlay(c, w, h, nowMs, state.stageIndex, state.beat.beatPhase, pulseEnv);

  // Boss-only effects
  if (bossActive && bossPhase >= 1) {
    drawBossVignette(c, w, h, bossPhase, nowMs);
  }
  if (bossActive && bossPhase >= 2) {
    drawGlitchLines(c, w, h, nowMs);
  }
}

function drawBossVignette(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  phase: number,
  nowMs: number,
): void {
  const cx = w / 2;
  const cy = h / 2;
  const pulse = 0.68 + Math.sin(nowMs / (phase >= 2 ? 200 : 280)) * 0.32;
  const intensity = phase >= 2 ? 0.45 * pulse : 0.3 * pulse;
  const grad = c.createRadialGradient(
    cx,
    cy,
    Math.min(w, h) * 0.2,
    cx,
    cy,
    Math.max(w, h) * 0.7,
  );
  grad.addColorStop(0, "rgba(255, 56, 99, 0)");
  grad.addColorStop(1, `rgba(255, 56, 99, ${intensity})`);
  c.fillStyle = grad;
  c.fillRect(0, 0, w, h);
}

function drawGlitchLines(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  nowMs: number,
): void {
  const seed = Math.floor(nowMs / 180);
  const lineCount = 3 + (seed % 3);
  c.save();
  for (let i = 0; i < lineCount; i++) {
    const offset = ((seed * (i + 1) * 9301) % 233280) / 233280;
    const y = offset * h;
    const lineH = 2 + (offset * 6);
    c.fillStyle = `rgba(255, 56, 99, ${0.18 + offset * 0.2})`;
    c.fillRect(0, y, w, lineH);
  }
  c.restore();
}

function drawRhythmStreaks(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  nowMs: number,
  beatPhase: number,
  stageIndex: number,
  bpmIntensity: number = 1,
): void {
  const streakCount = Math.round((12 + stageIndex * 3) * bpmIntensity);
  const baseSpeed = (0.18 + stageIndex * 0.04) * bpmIntensity;
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
  drawCityLayer(c, w, h, nowMs, 0.022, 0.92, 22, 60, "rgba(5, 3, 18, 0.55)", "rgba(28, 240, 255, 0.10)");
  drawCityLayer(c, w, h, nowMs, 0.05, 0.86, 32, 90, "rgba(10, 5, 26, 0.65)", "rgba(255, 43, 214, 0.14)");
  drawCityLayer(c, w, h, nowMs, 0.092, 0.78, 50, 140, "rgba(15, 8, 32, 0.7)", "rgba(247, 255, 58, 0.12)");
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

// Perspective tunnel: rings + spokes accelerating outward from the center to
// sell "flying forward into the system". Speed/density scale with stage so the
// run reads as descending deeper. Kept low-alpha so it never fights gameplay.
function drawTunnel(
  c: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number,
  h: number,
  nowMs: number,
  stageIndex: number,
  beatPhase: number,
): void {
  const maxR = Math.hypot(cx, cy) * 1.1;
  const ringCount = 5 + stageIndex;
  const speed = 0.00026 + stageIndex * 0.00009;
  const beatBoost = 1 + (1 - beatPhase) * 0.35;
  const hue =
    stageIndex >= 6 ? "255, 56, 99" : stageIndex >= 3 ? "177, 75, 255" : "28, 240, 255";
  c.save();
  for (let i = 0; i < ringCount; i++) {
    const phase = ((nowMs * speed * beatBoost) + i / ringCount) % 1;
    const r = phase * phase * maxR; // ease-out → perspective acceleration
    if (r < 20) continue;
    const alpha = (1 - phase) * 0.1;
    c.strokeStyle = `rgba(${hue}, ${alpha})`;
    c.lineWidth = 1 + (1 - phase) * 1.5;
    c.beginPath();
    c.arc(cx, cy, r, 0, Math.PI * 2);
    c.stroke();
  }
  const spokes = 12;
  c.strokeStyle = `rgba(${hue}, 0.05)`;
  c.lineWidth = 1;
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * Math.PI * 2;
    c.beginPath();
    c.moveTo(cx + Math.cos(a) * 40, cy + Math.sin(a) * 40);
    c.lineTo(cx + Math.cos(a) * maxR, cy + Math.sin(a) * maxR);
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

// Stage-specific atmospheric overlays. Drawn on top of the shared background
// pieces so each stage feels distinct without rewriting the whole pipeline.
function drawStageThemeOverlay(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  nowMs: number,
  stageIndex: number,
  beatPhase: number,
  pulseEnv: number,
): void {
  switch (stageIndex) {
    case 0: // INFILTRATION — already neon city; light scanline added.
      drawScanlines(c, w, h, "rgba(28, 240, 255, 0.04)", 4);
      break;
    case 1: // ECHO — vertical mirror reflections, ghosting effect.
      drawMirrorReflections(c, w, h, nowMs);
      break;
    case 2: // FACTORY — existing cityscape + warm sodium tone (no extra).
      drawScanlines(c, w, h, "rgba(247, 255, 58, 0.04)", 6);
      break;
    case 3: // BLOOM — expanding pulse rings tied to beat.
      drawBloomPulses(c, w / 2, h / 2, nowMs, beatPhase);
      break;
    case 4: // OVERDRIVE — fast diagonal streaks (motion).
      drawDiagonalStreaks(c, w, h, nowMs);
      break;
    case 5: // TRIAGE — soft green cross/medical grid + pulse heartbeat.
      drawMedicalCross(c, w, h, nowMs, beatPhase);
      break;
    case 6: // CHAOS — random jitter blocks, glitch.
      drawChaosJitter(c, w, h, nowMs, pulseEnv);
      break;
    case 7: // REVOLT (boss) — handled by existing boss vignette + glitch.
      break;
  }
}

function drawScanlines(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  step: number,
): void {
  c.save();
  c.strokeStyle = color;
  c.lineWidth = 1;
  for (let y = 0; y < h; y += step) {
    c.beginPath();
    c.moveTo(0, y);
    c.lineTo(w, y);
    c.stroke();
  }
  c.restore();
}

function drawMirrorReflections(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  nowMs: number,
): void {
  c.save();
  const stripeCount = 8;
  for (let i = 0; i < stripeCount; i++) {
    const seed = ((i * 9301 + 49297) % 233280) / 233280;
    const x = seed * w;
    const wiggle = Math.sin(nowMs / 600 + i) * 12;
    const width = 80 + seed * 120;
    const alpha = 0.04 + seed * 0.05;
    c.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    c.fillRect(x + wiggle, 0, width, h);
  }
  c.restore();
}

function drawBloomPulses(
  c: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  nowMs: number,
  beatPhase: number,
): void {
  c.save();
  for (let i = 0; i < 4; i++) {
    const phase = ((nowMs / 1200) + i * 0.25) % 1;
    const r = 60 + phase * 600;
    const alpha = (1 - phase) * 0.18;
    const hue = i % 2 === 0 ? "28, 240, 255" : "28, 247, 143";
    c.strokeStyle = `rgba(${hue}, ${alpha})`;
    c.lineWidth = 2 + (1 - phase) * 3;
    c.beginPath();
    c.arc(cx, cy, r, 0, Math.PI * 2);
    c.stroke();
  }
  const beatGlow = (1 - beatPhase) * 0.12;
  if (beatGlow > 0.02) {
    const grad = c.createRadialGradient(cx, cy, 0, cx, cy, 220);
    grad.addColorStop(0, `rgba(28, 247, 143, ${beatGlow})`);
    grad.addColorStop(1, "rgba(28, 247, 143, 0)");
    c.fillStyle = grad;
    c.fillRect(cx - 240, cy - 240, 480, 480);
  }
  c.restore();
}

function drawDiagonalStreaks(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  nowMs: number,
): void {
  c.save();
  c.lineCap = "round";
  for (let i = 0; i < 22; i++) {
    const seed = ((i * 9301 + 49297) % 233280) / 233280;
    const speed = 0.4 + seed * 0.8;
    const cycle = w + h + 200;
    const t = ((nowMs * speed * 0.4 + seed * cycle) % cycle) - 100;
    const startX = -100 + t;
    const startY = -100 + t * 0.8;
    const len = 80 + seed * 160;
    const hue = i % 3 === 0 ? "255, 56, 99" : i % 3 === 1 ? "247, 255, 58" : "177, 75, 255";
    c.strokeStyle = `rgba(${hue}, ${0.08 + seed * 0.1})`;
    c.lineWidth = 1.5 + seed * 1.5;
    c.shadowColor = `rgba(${hue}, 0.4)`;
    c.shadowBlur = 8;
    c.beginPath();
    c.moveTo(startX, startY);
    c.lineTo(startX + len, startY + len);
    c.stroke();
  }
  c.shadowBlur = 0;
  c.restore();
}

function drawMedicalCross(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  nowMs: number,
  beatPhase: number,
): void {
  c.save();
  const pulse = 0.4 + (1 - beatPhase) * 0.6;
  c.strokeStyle = `rgba(28, 247, 143, ${0.08 * pulse})`;
  c.lineWidth = 1;
  const step = 80;
  for (let x = step; x < w; x += step) {
    c.beginPath();
    c.moveTo(x, 0);
    c.lineTo(x, h);
    c.stroke();
  }
  for (let y = step; y < h; y += step) {
    c.beginPath();
    c.moveTo(0, y);
    c.lineTo(w, y);
    c.stroke();
  }
  // EKG line
  const ekgY = h * 0.5;
  c.strokeStyle = `rgba(28, 247, 143, ${0.18 + pulse * 0.25})`;
  c.lineWidth = 1.5;
  c.beginPath();
  for (let x = 0; x <= w; x += 6) {
    const phase = ((nowMs / 2 + x * 3) % 600) / 600;
    let dy = 0;
    if (phase < 0.05) dy = -28 * (phase / 0.05);
    else if (phase < 0.1) dy = -28 + 56 * ((phase - 0.05) / 0.05);
    else if (phase < 0.15) dy = 28 - 28 * ((phase - 0.1) / 0.05);
    c.lineTo(x, ekgY + dy);
  }
  c.stroke();
  c.restore();
}

function drawChaosJitter(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  nowMs: number,
  pulseEnv: number,
): void {
  c.save();
  const blockCount = 6 + Math.floor(pulseEnv * 6);
  const seedBase = Math.floor(nowMs / 80);
  for (let i = 0; i < blockCount; i++) {
    const s = ((seedBase * (i + 1) * 9301 + 49297) % 233280) / 233280;
    const x = s * w;
    const y = ((s * 17.31) % 1) * h;
    const bw = 40 + s * 180;
    const bh = 2 + s * 8;
    const hue = i % 2 === 0 ? "177, 75, 255" : "255, 43, 214";
    c.fillStyle = `rgba(${hue}, ${0.08 + s * 0.1})`;
    c.fillRect(x, y, bw, bh);
  }
  c.restore();
}
