import type { EngineState } from "../types";

export function drawCountdown(
  c: CanvasRenderingContext2D,
  state: EngineState,
  w: number,
  h: number,
): void {
  if (state.countdownMsLeft <= 0) return;
  const second = Math.max(0, Math.ceil(state.countdownMsLeft / 1000));
  const text = second > 0 ? String(second) : "GO!";

  const secProgress = 1 - ((state.countdownMsLeft / 1000) % 1);
  const scale = 1.3 - secProgress * 0.3;
  const alpha = 1 - secProgress * 0.7;
  const color = second === 0 ? "#1cf0ff" : "#f7ff3a";
  const glowColor = second === 0 ? "rgba(28, 240, 255, 0.85)" : "rgba(247, 255, 58, 0.85)";

  c.save();
  c.translate(w / 2, h / 2 - 40);
  c.scale(scale, scale);

  c.font = "bold 140px ui-monospace, monospace";
  c.textAlign = "center";
  c.textBaseline = "middle";

  c.shadowColor = glowColor;
  c.shadowBlur = 48;
  c.fillStyle = color;
  c.fillText(text, 0, 0);
  c.shadowBlur = 24;
  c.fillStyle = "#ffffff";
  c.globalAlpha = alpha * 0.55;
  c.fillText(text, 0, 0);
  c.globalAlpha = 1;

  c.restore();

  c.save();
  c.translate(w / 2, h / 2 + 110);
  c.font = "bold 14px ui-monospace, monospace";
  c.textAlign = "center";
  c.fillStyle = "rgba(240, 246, 255, 0.55)";
  c.fillText(second === 0 ? "ENGAGE" : "GET READY", 0, 0);
  c.restore();
}
