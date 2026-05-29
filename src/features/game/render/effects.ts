import type { EngineState } from "../types";

export function drawSlashes(
  c: CanvasRenderingContext2D,
  state: EngineState,
  nowMs: number,
): void {
  for (const s of state.slashes) {
    const elapsed = nowMs - s.bornAtMs;
    const t = Math.max(0, Math.min(1, elapsed / s.durationMs));
    const ease = 1 - Math.pow(1 - t, 3);
    const sweepFrom = s.startAngle;
    const sweepTo = s.startAngle + (s.endAngle - s.startAngle) * ease;
    const trailFrom = s.startAngle + (s.endAngle - s.startAngle) * Math.max(0, ease - 0.4);
    const alpha = (1 - t) * 0.95;

    c.save();
    c.shadowColor = s.color;
    c.shadowBlur = 26;
    c.lineCap = "round";

    c.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    c.lineWidth = 9;
    c.beginPath();
    c.arc(0, 0, s.radius, trailFrom, sweepTo);
    c.stroke();

    c.strokeStyle = withAlpha(s.color, alpha * 0.85);
    c.lineWidth = 4;
    c.beginPath();
    c.arc(0, 0, s.radius, sweepFrom, sweepTo);
    c.stroke();
    c.restore();
  }
}

export function drawShockwaves(
  c: CanvasRenderingContext2D,
  state: EngineState,
  nowMs: number,
): void {
  for (const w of state.shockwaves) {
    const elapsed = nowMs - w.bornAtMs;
    const t = Math.max(0, Math.min(1, elapsed / w.durationMs));
    const ease = 1 - Math.pow(1 - t, 2.4);
    const radius = w.maxRadius * ease;
    const alpha = (1 - t) * 0.85;
    c.save();
    c.shadowColor = w.color;
    c.shadowBlur = 18;
    c.strokeStyle = withAlpha(w.color, alpha);
    c.lineWidth = 3 + (1 - t) * 4;
    c.beginPath();
    c.arc(w.x, w.y, radius, 0, Math.PI * 2);
    c.stroke();
    c.restore();
  }
}

export function drawScorePops(
  c: CanvasRenderingContext2D,
  state: EngineState,
): void {
  for (const p of state.scorePops) {
    const alpha = Math.max(0, p.life);
    c.save();
    c.globalAlpha = alpha;
    c.shadowColor = p.color;
    c.shadowBlur = 10;
    c.fillStyle = p.color;
    c.font = `bold ${Math.round(18 * p.scale)}px ui-monospace, monospace`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(p.text, p.x, p.y);
    c.restore();
  }
}

export function drawScreenFlashes(
  c: CanvasRenderingContext2D,
  state: EngineState,
  w: number,
  h: number,
): void {
  // Hard ceiling on combined flash opacity so stacked flashes (hazard + kills +
  // hits in one burst) can never wash the screen out to a solid color.
  let budget = 0.42;
  for (const f of state.flashes) {
    if (budget <= 0) break;
    const alpha = Math.min(budget, Math.max(0, f.life) * f.intensity);
    if (alpha <= 0) continue;
    c.fillStyle = withAlpha(f.color, alpha);
    c.fillRect(0, 0, w, h);
    budget -= alpha;
  }
}

function withAlpha(color: string, alpha: number): string {
  if (color.startsWith("#") && color.length === 7) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
}
