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
  drawShockwaves,
  drawSlashes,
} from "./effects";
import {
  drawComboFlowEdges,
  drawPauseOverlay,
  drawVignette,
} from "./postfx";

export interface RenderHudSnapshot {
  combo: number;
  paused: boolean;
}

export function render(
  c: CanvasRenderingContext2D,
  state: EngineState,
  w: number,
  h: number,
  dpr: number,
  nowMs: number,
  hud: RenderHudSnapshot,
): void {
  c.setTransform(dpr, 0, 0, dpr, 0, 0);

  drawBackground(c, state, w, h, nowMs);

  const cx = w / 2;
  const cy = h / 2;
  const shakeX = (Math.random() - 0.5) * state.shake;
  const shakeY = (Math.random() - 0.5) * state.shake;

  c.save();
  c.translate(cx + shakeX, cy + shakeY);
  c.scale(state.cameraZoom, state.cameraZoom);

  drawParticles(c, state);
  drawShockwaves(c, state, nowMs);
  drawEnemies(c, state, nowMs);
  drawBullets(c, state, nowMs);

  c.save();
  c.translate(state.playerX, state.playerY);
  drawAimLine(c, state, w, h);
  drawParryCone(c, state, nowMs);
  drawSlashes(c, state, nowMs);
  drawPlayer(c, state, nowMs);
  c.restore();

  drawScorePops(c, state);

  c.restore();

  drawVignette(c, state, hud.combo, w, h);
  drawComboFlowEdges(c, state, hud.combo, w, h, nowMs);
  drawScreenFlashes(c, state, w, h);
  drawStageProgress(c, state, w, nowMs);

  if (hud.paused) drawPauseOverlay(c, w, h);
}
