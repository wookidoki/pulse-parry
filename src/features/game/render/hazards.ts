import type { EngineState, Hazard } from "../types";
import { getHazardPhaseAlpha, getTelegraphProgress } from "../engine/hazards";

export function drawHazards(
  c: CanvasRenderingContext2D,
  state: EngineState,
  w: number,
  h: number,
  nowMs: number,
): void {
  for (const haz of state.hazards) {
    if (haz.kind === "laserSweep") drawLaserSweep(c, haz, w, h, nowMs);
    else if (haz.kind === "missile") drawMissile(c, haz, nowMs);
    else if (haz.kind === "shockwave") drawShockwave(c, haz, nowMs);
  }
}

function drawLaserSweep(
  c: CanvasRenderingContext2D,
  haz: Hazard,
  w: number,
  h: number,
  nowMs: number,
): void {
  const reach = Math.max(w, h);
  const cos = Math.cos(haz.angle);
  const sin = Math.sin(haz.angle);
  const fade = getHazardPhaseAlpha(haz, nowMs);

  if (haz.state === "telegraph") {
    const tp = getTelegraphProgress(haz, nowMs);
    const pulse = 0.5 + Math.sin(nowMs / 60) * 0.5;
    c.save();
    c.setLineDash([10, 8]);
    c.strokeStyle = `rgba(255, 56, 99, ${0.35 + pulse * 0.4 * fade})`;
    c.lineWidth = haz.width * 0.4;
    c.shadowColor = "#ff3863";
    c.shadowBlur = 12 + tp * 18;
    c.beginPath();
    c.moveTo(-cos * reach, -sin * reach);
    c.lineTo(cos * reach, sin * reach);
    c.stroke();
    c.setLineDash([]);
    c.strokeStyle = `rgba(255, 56, 99, ${0.2 + tp * 0.5})`;
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(-cos * reach, -sin * reach);
    c.lineTo(cos * reach, sin * reach);
    c.stroke();
    c.restore();
    return;
  }

  if (haz.state === "active") {
    // Scanning sweep: beam grows from -reach end to +reach end.
    const scanProg = haz.currentRadius; // 0 → 1
    const SCAN_REACH = 1000;
    const tipDist = -SCAN_REACH + scanProg * 2 * SCAN_REACH;
    const tipX = cos * tipDist;
    const tipY = sin * tipDist;
    const startX = -cos * SCAN_REACH;
    const startY = -sin * SCAN_REACH;
    const passedX = -cos * SCAN_REACH;
    const passedY = -sin * SCAN_REACH;

    c.save();

    // Trailing dim line where beam already passed
    c.shadowColor = "#ff3863";
    c.shadowBlur = 18;
    c.strokeStyle = "rgba(255, 56, 99, 0.55)";
    c.lineWidth = haz.width * 0.5;
    c.beginPath();
    c.moveTo(passedX, passedY);
    c.lineTo(tipX, tipY);
    c.stroke();

    // White hot core inside trailed line
    c.shadowBlur = 30;
    c.strokeStyle = "rgba(255, 255, 255, 0.85)";
    c.lineWidth = haz.width * 0.3;
    c.beginPath();
    c.moveTo(startX, startY);
    c.lineTo(tipX, tipY);
    c.stroke();

    // Bright tip (the scanning head)
    c.shadowColor = "#ffffff";
    c.shadowBlur = 38;
    c.fillStyle = "#ffffff";
    c.beginPath();
    c.arc(tipX, tipY, haz.width * 0.9, 0, Math.PI * 2);
    c.fill();
    c.shadowBlur = 26;
    c.fillStyle = "#ff3863";
    c.beginPath();
    c.arc(tipX, tipY, haz.width * 0.55, 0, Math.PI * 2);
    c.fill();

    // Faint preview of remaining beam ahead
    c.shadowBlur = 0;
    c.strokeStyle = "rgba(255, 56, 99, 0.25)";
    c.lineWidth = haz.width * 0.35;
    c.beginPath();
    c.moveTo(tipX, tipY);
    c.lineTo(cos * SCAN_REACH, sin * SCAN_REACH);
    c.stroke();

    c.restore();
    return;
  }

  c.save();
  c.shadowColor = "#ff3863";
  c.shadowBlur = 18 * fade;
  c.strokeStyle = `rgba(255, 56, 99, ${0.6 * fade})`;
  c.lineWidth = haz.width * fade;
  c.beginPath();
  c.moveTo(-cos * reach, -sin * reach);
  c.lineTo(cos * reach, sin * reach);
  c.stroke();
  c.restore();
}

function drawMissile(c: CanvasRenderingContext2D, haz: Hazard, nowMs: number): void {
  const cx = haz.centerX;
  const cy = haz.centerY;
  const radius = haz.blastRadius;

  if (haz.state === "telegraph") {
    const tp = getTelegraphProgress(haz, nowMs);
    const pulse = 0.55 + Math.sin(nowMs / 100) * 0.45;
    c.save();
    c.strokeStyle = `rgba(255, 56, 99, ${0.45 + pulse * 0.35})`;
    c.lineWidth = 2;
    c.setLineDash([6, 6]);
    c.shadowColor = "#ff3863";
    c.shadowBlur = 16;
    c.beginPath();
    c.arc(cx, cy, radius * tp, 0, Math.PI * 2);
    c.stroke();
    c.setLineDash([]);

    c.strokeStyle = `rgba(255, 56, 99, ${0.55 + pulse * 0.3})`;
    c.lineWidth = 1;
    const x1 = cx - radius * 0.6;
    const x2 = cx + radius * 0.6;
    const y1 = cy - radius * 0.6;
    const y2 = cy + radius * 0.6;
    c.beginPath();
    c.moveTo(x1, cy);
    c.lineTo(x2, cy);
    c.moveTo(cx, y1);
    c.lineTo(cx, y2);
    c.stroke();

    c.fillStyle = `rgba(255, 255, 255, ${pulse})`;
    c.shadowBlur = 12;
    c.beginPath();
    c.arc(cx, cy, 3, 0, Math.PI * 2);
    c.fill();
    c.restore();
    return;
  }

  if (haz.state === "active") {
    c.save();
    const grad = c.createRadialGradient(cx, cy, 0, cx, cy, radius);
    grad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
    grad.addColorStop(0.3, "rgba(255, 200, 60, 0.7)");
    grad.addColorStop(0.7, "rgba(255, 56, 99, 0.55)");
    grad.addColorStop(1, "rgba(255, 56, 99, 0)");
    c.fillStyle = grad;
    c.shadowColor = "#ff3863";
    c.shadowBlur = 40;
    c.beginPath();
    c.arc(cx, cy, radius, 0, Math.PI * 2);
    c.fill();
    c.restore();
    return;
  }

  const fade = getHazardPhaseAlpha(haz, nowMs);
  c.save();
  c.strokeStyle = `rgba(255, 56, 99, ${0.55 * fade})`;
  c.lineWidth = 2;
  c.shadowColor = "#ff3863";
  c.shadowBlur = 14 * fade;
  c.beginPath();
  c.arc(cx, cy, radius * (0.9 + 0.4 * (1 - fade)), 0, Math.PI * 2);
  c.stroke();
  c.restore();
}

function drawShockwave(c: CanvasRenderingContext2D, haz: Hazard, nowMs: number): void {
  if (haz.state === "telegraph") {
    const tp = getTelegraphProgress(haz, nowMs);
    const pulse = 0.5 + Math.sin(nowMs / 80) * 0.5;
    c.save();
    c.strokeStyle = `rgba(255, 56, 99, ${0.4 + pulse * 0.4 * tp})`;
    c.lineWidth = 3;
    c.shadowColor = "#ff3863";
    c.shadowBlur = 16;
    c.beginPath();
    c.arc(0, 0, 24, 0, Math.PI * 2);
    c.stroke();
    c.fillStyle = `rgba(255, 56, 99, ${pulse * 0.3 * tp})`;
    c.shadowBlur = 24;
    c.beginPath();
    c.arc(0, 0, 12 + pulse * 6, 0, Math.PI * 2);
    c.fill();
    c.restore();
    return;
  }

  if (haz.state === "active") {
    const radius = haz.currentRadius;
    c.save();
    c.shadowColor = "#ffffff";
    c.shadowBlur = 36;
    c.strokeStyle = "rgba(255, 255, 255, 0.85)";
    c.lineWidth = haz.width;
    c.beginPath();
    c.arc(0, 0, radius, 0, Math.PI * 2);
    c.stroke();
    c.shadowBlur = 22;
    c.strokeStyle = "rgba(255, 56, 99, 0.95)";
    c.lineWidth = haz.width * 0.55;
    c.beginPath();
    c.arc(0, 0, radius, 0, Math.PI * 2);
    c.stroke();
    c.restore();
    return;
  }

  const fade = getHazardPhaseAlpha(haz, nowMs);
  c.save();
  c.strokeStyle = `rgba(255, 56, 99, ${0.5 * fade})`;
  c.lineWidth = haz.width * fade * 0.6;
  c.shadowColor = "#ff3863";
  c.shadowBlur = 14 * fade;
  c.beginPath();
  c.arc(0, 0, haz.currentRadius, 0, Math.PI * 2);
  c.stroke();
  c.restore();
}
