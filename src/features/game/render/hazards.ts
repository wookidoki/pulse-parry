import type { EngineState } from "../types";
import { getHazardPhaseAlpha } from "../engine/hazards";
import { HAZARD_LASER_TELEGRAPH_MS } from "../config/hazards";

export function drawHazards(
  c: CanvasRenderingContext2D,
  state: EngineState,
  w: number,
  h: number,
  nowMs: number,
): void {
  const reach = Math.max(w, h);
  for (const haz of state.hazards) {
    const cos = Math.cos(haz.angle);
    const sin = Math.sin(haz.angle);
    const fade = getHazardPhaseAlpha(haz, nowMs);

    if (haz.state === "telegraph") {
      const pulse = 0.5 + Math.sin(nowMs / 60) * 0.5;
      c.save();
      c.setLineDash([10, 8]);
      c.strokeStyle = `rgba(255, 56, 99, ${0.35 + pulse * 0.4 * fade})`;
      c.lineWidth = haz.width * 0.4;
      c.shadowColor = "#ff3863";
      c.shadowBlur = 12;
      c.beginPath();
      c.moveTo(-cos * reach, -sin * reach);
      c.lineTo(cos * reach, sin * reach);
      c.stroke();
      c.setLineDash([]);
      const remaining = Math.max(0, 1 - (nowMs - haz.startedAtMs) / HAZARD_LASER_TELEGRAPH_MS);
      c.strokeStyle = `rgba(255, 56, 99, ${0.6 - remaining * 0.4})`;
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(-cos * reach, -sin * reach);
      c.lineTo(cos * reach, sin * reach);
      c.stroke();
      c.restore();
      continue;
    }

    if (haz.state === "active") {
      c.save();
      c.shadowColor = "#ffffff";
      c.shadowBlur = 40;
      c.strokeStyle = "rgba(255, 255, 255, 0.95)";
      c.lineWidth = haz.width;
      c.beginPath();
      c.moveTo(-cos * reach, -sin * reach);
      c.lineTo(cos * reach, sin * reach);
      c.stroke();
      c.shadowBlur = 28;
      c.strokeStyle = "#ff3863";
      c.lineWidth = haz.width * 0.55;
      c.beginPath();
      c.moveTo(-cos * reach, -sin * reach);
      c.lineTo(cos * reach, sin * reach);
      c.stroke();
      c.restore();
      continue;
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
}
