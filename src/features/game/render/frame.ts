import type { EngineState } from "../types";
import { drawBackground } from "./background";
import {
  drawBullets,
  drawEnemies,
  drawParticles,
  drawPlayer,
} from "./entities";
import {
  drawAimLine,
  drawParryCone,
  drawStageProgress,
} from "./overlay";
import {
  drawScorePops,
  drawScreenFlashes,
  drawSlashes,
} from "./effects";

export function render(
  c: CanvasRenderingContext2D,
  state: EngineState,
  w: number,
  h: number,
  dpr: number,
  nowMs: number,
): void {
  c.setTransform(dpr, 0, 0, dpr, 0, 0);

  drawBackground(c, state, w, h, nowMs);

  const cx = w / 2;
  const cy = h / 2;
  const shakeX = (Math.random() - 0.5) * state.shake;
  const shakeY = (Math.random() - 0.5) * state.shake;

  c.save();
  c.translate(cx + shakeX, cy + shakeY);

  drawParticles(c, state);
  drawAimLine(c, state, w, h);
  drawParryCone(c, state, nowMs);
  drawEnemies(c, state, nowMs);
  drawBullets(c, state, nowMs);
  drawSlashes(c, state, nowMs);
  drawPlayer(c, state, nowMs);
  drawScorePops(c, state);

  c.restore();

  drawScreenFlashes(c, state, w, h);
  drawStageProgress(c, state, w, nowMs);
}
