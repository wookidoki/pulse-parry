import type { Enemy, EngineState } from "../types";
import { PALETTE } from "../config/palette";
import { BULLET_KINDS, ENEMY_KINDS } from "../config/enemy-kinds";
import {
  ENEMY_DEATH_MS,
  ENEMY_RADIUS,
  ENEMY_SPAWN_DELAY_MS,
  HIT_RADIUS,
  PLAYER_RADIUS,
  TELEGRAPH_MS,
} from "../config/tuning";
import { magnitude, unitVector } from "../engine/geometry";

interface KindShape {
  sides: number;
  rotationSpeed: number;
  coreSize: number;
  radiusScale: number;
}

const KIND_SHAPE: Record<Enemy["kind"], KindShape> = {
  shooter: { sides: 8, rotationSpeed: 0.0005, coreSize: 4, radiusScale: 1.0 },
  burster: { sides: 6, rotationSpeed: 0.0014, coreSize: 3, radiusScale: 0.9 },
  charger: { sides: 5, rotationSpeed: 0.0002, coreSize: 6, radiusScale: 1.18 },
};

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
  for (const e of state.enemies) {
    c.save();
    if (e.state === "spawning") {
      c.globalAlpha = (nowMs - e.stateEnteredAt) / ENEMY_SPAWN_DELAY_MS;
    } else if (e.state === "dying") {
      c.globalAlpha = Math.max(0, 1 - (nowMs - e.stateEnteredAt) / ENEMY_DEATH_MS);
    }
    drawEnemyBody(c, e, nowMs);
    drawEnemyHpRing(c, e);
    if (e.telegraphMsLeft > 0) {
      drawTelegraphBeam(c, e);
    }
    c.restore();
  }
}

function drawEnemyBody(
  c: CanvasRenderingContext2D,
  e: Enemy,
  nowMs: number,
): void {
  const kindConfig = ENEMY_KINDS[e.kind];
  const shape = KIND_SHAPE[e.kind];
  const radius = ENEMY_RADIUS * shape.radiusScale;
  const color = kindConfig.color;

  c.shadowColor = kindConfig.glowColor;
  c.shadowBlur = 16 + e.pulse * 18;
  c.fillStyle = "rgba(5, 3, 10, 0.6)";
  c.strokeStyle = color;
  c.lineWidth = 2;
  c.beginPath();
  for (let i = 0; i < shape.sides; i++) {
    const a = (i / shape.sides) * Math.PI * 2 + nowMs * shape.rotationSpeed;
    const px = e.x + Math.cos(a) * radius;
    const py = e.y + Math.sin(a) * radius;
    if (i === 0) c.moveTo(px, py);
    else c.lineTo(px, py);
  }
  c.closePath();
  c.fill();
  c.stroke();
  c.shadowBlur = 0;
  c.fillStyle = color;
  c.beginPath();
  c.arc(e.x, e.y, shape.coreSize + e.pulse * 4, 0, Math.PI * 2);
  c.fill();
}

function drawEnemyHpRing(c: CanvasRenderingContext2D, e: Enemy): void {
  const hpRadius = ENEMY_RADIUS + 10;
  for (let i = 0; i < e.maxHp; i++) {
    const a = (i / e.maxHp) * Math.PI * 2 - Math.PI / 2;
    const px = e.x + Math.cos(a) * hpRadius;
    const py = e.y + Math.sin(a) * hpRadius;
    c.fillStyle = i < e.hp ? PALETTE.cyan : "rgba(240, 246, 255, 0.15)";
    c.beginPath();
    c.arc(px, py, 2.5, 0, Math.PI * 2);
    c.fill();
  }
}

function drawTelegraphBeam(c: CanvasRenderingContext2D, e: Enemy): void {
  const progress = 1 - e.telegraphMsLeft / TELEGRAPH_MS;
  const dist = magnitude(e.x, e.y);
  const { ux, uy } = unitVector(-e.x, -e.y);
  const beamLen = dist * progress;
  const bulletKind = ENEMY_KINDS[e.kind].bulletKind;
  const color = BULLET_KINDS[bulletKind].color;
  c.save();
  c.shadowColor = color;
  c.shadowBlur = 18;
  c.strokeStyle = withAlpha(color, 0.4 + progress * 0.5);
  c.lineWidth = 2 + progress * 3;
  c.beginPath();
  c.moveTo(e.x, e.y);
  c.lineTo(e.x + ux * beamLen, e.y + uy * beamLen);
  c.stroke();
  c.restore();
}

function withAlpha(hexOrColor: string, alpha: number): string {
  if (hexOrColor.startsWith("#") && hexOrColor.length === 7) {
    const r = parseInt(hexOrColor.slice(1, 3), 16);
    const g = parseInt(hexOrColor.slice(3, 5), 16);
    const b = parseInt(hexOrColor.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return hexOrColor;
}

export function drawBullets(
  c: CanvasRenderingContext2D,
  state: EngineState,
  nowMs: number,
): void {
  for (const b of state.bullets) {
    const kindConfig = BULLET_KINDS[b.kind];
    c.save();
    if (b.state === "incoming") {
      c.shadowColor = kindConfig.color;
      c.shadowBlur = 14;
      c.fillStyle = kindConfig.color;
      if (b.kind === "heavy") drawHeavyAura(c, b.x, b.y, kindConfig.radius);
    } else if (b.state === "absorbed") {
      const pulse = 0.7 + Math.sin(nowMs / 60) * 0.3;
      c.shadowColor = withAlpha(PALETTE.yellow, pulse);
      c.shadowBlur = 18;
      c.fillStyle = PALETTE.yellow;
    } else if (b.state === "reflected") {
      c.shadowColor = PALETTE.cyan;
      c.shadowBlur = 20;
      c.fillStyle = PALETTE.cyan;
      drawBulletTrail(c, b.x, b.y, b.vx, b.vy);
    }
    c.beginPath();
    c.arc(b.x, b.y, kindConfig.radius, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
}

function drawHeavyAura(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
): void {
  c.strokeStyle = "rgba(177, 75, 255, 0.5)";
  c.lineWidth = 2;
  c.beginPath();
  c.arc(x, y, radius + 6, 0, Math.PI * 2);
  c.stroke();
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
