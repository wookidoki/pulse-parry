import type { EngineState } from "../types";
import { currentStage } from "../config/stages";
import { PALETTE } from "../config/palette";
import {
  BULLET_RADIUS,
  ENEMY_DEATH_MS,
  ENEMY_RADIUS,
  ENEMY_SPAWN_DELAY_MS,
  HIT_RADIUS,
  PLAYER_RADIUS,
  TELEGRAPH_MS,
} from "../config/tuning";
import { magnitude, unitVector } from "../engine/geometry";

export function drawParticles(c: CanvasRenderingContext2D, state: EngineState): void {
  for (const p of state.particles) {
    c.save();
    c.globalAlpha = Math.max(0, p.life);
    c.shadowColor = p.color;
    c.shadowBlur = 12;
    c.fillStyle = p.color;
    c.beginPath();
    c.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
}

export function drawEnemies(
  c: CanvasRenderingContext2D,
  state: EngineState,
  nowMs: number,
): void {
  const stage = currentStage(state.stageIndex);
  for (const e of state.enemies) {
    c.save();
    if (e.state === "spawning") {
      c.globalAlpha = (nowMs - e.stateEnteredAt) / ENEMY_SPAWN_DELAY_MS;
    } else if (e.state === "dying") {
      c.globalAlpha = Math.max(0, 1 - (nowMs - e.stateEnteredAt) / ENEMY_DEATH_MS);
    }

    drawEnemyBody(c, e.x, e.y, e.pulse, nowMs, stage.accentMagenta);
    drawEnemyHpRing(c, e.x, e.y, e.hp, e.maxHp, stage.accentCyan);
    if (e.telegraphMsLeft > 0) {
      drawTelegraphBeam(c, e.x, e.y, e.telegraphMsLeft);
    }
    c.restore();
  }
}

function drawEnemyBody(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  pulse: number,
  nowMs: number,
  color: string,
): void {
  c.shadowColor = color;
  c.shadowBlur = 16 + pulse * 18;
  c.fillStyle = "rgba(5, 3, 10, 0.6)";
  c.strokeStyle = color;
  c.lineWidth = 2;
  c.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + nowMs * 0.0005;
    const px = x + Math.cos(a) * ENEMY_RADIUS;
    const py = y + Math.sin(a) * ENEMY_RADIUS;
    if (i === 0) c.moveTo(px, py);
    else c.lineTo(px, py);
  }
  c.closePath();
  c.fill();
  c.stroke();
  c.shadowBlur = 0;
  c.fillStyle = color;
  c.beginPath();
  c.arc(x, y, 4 + pulse * 4, 0, Math.PI * 2);
  c.fill();
}

function drawEnemyHpRing(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  hp: number,
  maxHp: number,
  fullColor: string,
): void {
  const hpRadius = ENEMY_RADIUS + 10;
  for (let i = 0; i < maxHp; i++) {
    const a = (i / maxHp) * Math.PI * 2 - Math.PI / 2;
    const px = x + Math.cos(a) * hpRadius;
    const py = y + Math.sin(a) * hpRadius;
    c.fillStyle = i < hp ? fullColor : "rgba(240, 246, 255, 0.15)";
    c.beginPath();
    c.arc(px, py, 2.5, 0, Math.PI * 2);
    c.fill();
  }
}

function drawTelegraphBeam(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  msLeft: number,
): void {
  const progress = 1 - msLeft / TELEGRAPH_MS;
  const dist = magnitude(x, y);
  const { ux, uy } = unitVector(-x, -y);
  const beamLen = dist * progress;
  c.save();
  c.shadowColor = PALETTE.red;
  c.shadowBlur = 18;
  c.strokeStyle = `rgba(255, 56, 99, ${0.4 + progress * 0.5})`;
  c.lineWidth = 2 + progress * 3;
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x + ux * beamLen, y + uy * beamLen);
  c.stroke();
  c.restore();
}

export function drawBullets(
  c: CanvasRenderingContext2D,
  state: EngineState,
  nowMs: number,
): void {
  for (const b of state.bullets) {
    c.save();
    if (b.state === "incoming") {
      c.shadowColor = PALETTE.red;
      c.shadowBlur = 14;
      c.fillStyle = PALETTE.red;
    } else if (b.state === "absorbed") {
      const pulse = 0.7 + Math.sin(nowMs / 60) * 0.3;
      c.shadowColor = `rgba(247, 255, 58, ${pulse})`;
      c.shadowBlur = 18;
      c.fillStyle = PALETTE.yellow;
    } else if (b.state === "reflected") {
      c.shadowColor = PALETTE.cyan;
      c.shadowBlur = 20;
      c.fillStyle = PALETTE.cyan;
      drawBulletTrail(c, b.x, b.y, b.vx, b.vy);
    }
    c.beginPath();
    c.arc(b.x, b.y, BULLET_RADIUS, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
}

function drawBulletTrail(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  vx: number,
  vy: number,
): void {
  const speed = magnitude(vx, vy) || 1;
  const trailLen = 24;
  const tx = x - (vx / speed) * trailLen;
  const ty = y - (vy / speed) * trailLen;
  c.strokeStyle = "rgba(28, 240, 255, 0.45)";
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(tx, ty);
  c.lineTo(x, y);
  c.stroke();
}

export function drawPlayer(
  c: CanvasRenderingContext2D,
  state: EngineState,
  nowMs: number,
): void {
  const pulse = 0.85 + Math.sin(nowMs / 220) * 0.1 + state.bgPulse * 0.2;
  c.save();
  c.shadowColor = PALETTE.cyan;
  c.shadowBlur = 22 * pulse;
  c.fillStyle = PALETTE.cyan;
  c.beginPath();
  c.arc(0, 0, PLAYER_RADIUS * 0.4, 0, Math.PI * 2);
  c.fill();
  c.shadowBlur = 0;
  c.strokeStyle = "rgba(28, 240, 255, 0.9)";
  c.lineWidth = 2;
  c.beginPath();
  c.arc(0, 0, PLAYER_RADIUS, 0, Math.PI * 2);
  c.stroke();
  c.strokeStyle = "rgba(255, 56, 99, 0.15)";
  c.lineWidth = 1;
  c.beginPath();
  c.arc(0, 0, HIT_RADIUS, 0, Math.PI * 2);
  c.stroke();
  c.restore();
}
