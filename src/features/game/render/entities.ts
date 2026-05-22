import type { Enemy, EngineState } from "../types";
import { KIND_RACE, RACE_LABEL } from "../types";
import { PALETTE } from "../config/palette";
import { BULLET_KINDS, ENEMY_KINDS } from "../config/enemy-kinds";
import {
  ENEMY_DEATH_MS,
  ENEMY_RADIUS,
  ENEMY_SPAWN_DELAY_MS,
  HIT_RADIUS,
  PLAYER_MAX_DIST,
  PLAYER_RADIUS,
  TELEGRAPH_MS,
} from "../config/tuning";
import { CHARACTERS } from "../config/characters";
import { magnitude, unitVector } from "../engine/geometry";
import { drawEnemySprite } from "./enemy-sprites";

export function drawMovementRing(
  c: CanvasRenderingContext2D,
  nowMs: number,
): void {
  const pulse = 0.5 + Math.sin(nowMs / 800) * 0.2;
  c.save();
  c.strokeStyle = `rgba(28, 240, 255, ${0.12 * pulse})`;
  c.lineWidth = 1;
  c.setLineDash([6, 10]);
  c.beginPath();
  c.arc(0, 0, PLAYER_MAX_DIST, 0, Math.PI * 2);
  c.stroke();
  c.setLineDash([]);
  c.restore();
}

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
    const drawX = e.x + e.knockbackX;
    const drawY = e.y + e.knockbackY;
    drawEnemyByRace(c, e, drawX, drawY, nowMs);
    drawEnemyHpRing(c, e, drawX, drawY);
    if (e.telegraphMsLeft > 0) drawTelegraphBeam(c, e, drawX, drawY);
    drawRaceLabel(c, e, drawX, drawY, nowMs);
    c.restore();
  }
}

function drawEnemyByRace(
  c: CanvasRenderingContext2D,
  e: Enemy,
  x: number,
  y: number,
  nowMs: number,
): void {
  const race = KIND_RACE[e.kind];
  switch (race) {
    case "omnic":
      drawOmnic(c, e, x, y, nowMs);
      break;
    case "virus":
      drawVirus(c, e, x, y, nowMs);
      break;
    case "drone":
      drawDrone(c, e, x, y, nowMs);
      break;
    case "core":
      drawCore(c, e, x, y, nowMs);
      break;
  }
}

function drawCore(
  c: CanvasRenderingContext2D,
  e: Enemy,
  x: number,
  y: number,
  nowMs: number,
): void {
  const config = ENEMY_KINDS[e.kind];
  const baseR = ENEMY_RADIUS * 1.9;
  const styles = flashStyles(e);
  const beat = Math.sin(nowMs / 240) * 0.08 + 1;
  const rot = nowMs * 0.0004;
  const spriteColor = e.hitFlashMsLeft > 0 ? "#ffffff" : config.color;
  drawEnemySprite(c, e.kind, x, y, baseR * 0.85, spriteColor, 0.78, 36 + e.pulse * 26);

  c.save();
  c.translate(x, y);

  c.shadowColor = config.glowColor;
  c.shadowBlur = 28 + e.pulse * 30;
  c.strokeStyle = styles.stroke;
  c.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    const r = baseR + i * 14 + Math.sin(nowMs / 200 + i) * 4;
    c.beginPath();
    c.arc(0, 0, r * beat, 0, Math.PI * 2);
    c.stroke();
  }

  c.save();
  c.rotate(rot);
  c.fillStyle = styles.bgFill;
  c.strokeStyle = styles.stroke;
  c.lineWidth = 3;
  drawPolygon(c, 8, baseR);
  c.fill();
  c.stroke();
  c.restore();

  c.save();
  c.rotate(-rot * 1.4);
  c.strokeStyle = styles.stroke;
  c.lineWidth = 1.5;
  drawPolygon(c, 6, baseR * 0.65);
  c.stroke();
  c.restore();

  c.shadowBlur = 32;
  c.fillStyle = "#ffffff";
  c.beginPath();
  c.arc(0, 0, 7 + e.pulse * 6, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = styles.fill;
  c.beginPath();
  c.arc(0, 0, 4 + e.pulse * 3, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

function flashStyles(e: Enemy): { fill: string; stroke: string; bgFill: string } {
  const flash = Math.max(0, Math.min(1, e.hitFlashMsLeft / 120));
  const color = ENEMY_KINDS[e.kind].color;
  if (flash > 0) {
    return {
      fill: "#ffffff",
      stroke: "#ffffff",
      bgFill: `rgba(255, 255, 255, ${0.3 + flash * 0.5})`,
    };
  }
  return { fill: color, stroke: color, bgFill: "rgba(5, 3, 10, 0.6)" };
}

function drawOmnic(
  c: CanvasRenderingContext2D,
  e: Enemy,
  x: number,
  y: number,
  nowMs: number,
): void {
  const config = ENEMY_KINDS[e.kind];
  const radius = ENEMY_RADIUS;
  const rotation = nowMs * 0.0006;
  const styles = flashStyles(e);
  const visorPulse = 0.7 + Math.sin(nowMs / 180) * 0.3;
  const spriteColor = e.hitFlashMsLeft > 0 ? "#ffffff" : config.color;
  drawEnemySprite(c, e.kind, x, y, radius, spriteColor, 0.9, 18 + e.pulse * 18);

  c.save();
  c.translate(x, y);

  c.shadowColor = config.glowColor;
  c.shadowBlur = 20 + e.pulse * 22;
  c.save();
  c.rotate(rotation);
  c.fillStyle = styles.bgFill;
  c.strokeStyle = styles.stroke;
  c.lineWidth = 2.5;
  drawPolygon(c, 6, radius);
  c.fill();
  c.stroke();
  c.restore();

  c.shadowBlur = 0;
  c.save();
  c.rotate(-rotation * 0.6);
  c.strokeStyle = styles.stroke;
  c.lineWidth = 1;
  drawPolygon(c, 6, radius * 0.62);
  c.stroke();
  c.restore();

  c.shadowColor = config.glowColor;
  c.shadowBlur = 12 * visorPulse;
  c.strokeStyle = styles.fill;
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(-radius * 0.55, -2);
  c.lineTo(radius * 0.55, -2);
  c.stroke();

  c.shadowBlur = 0;
  c.fillStyle = `rgba(${parseColorRgb(config.color)}, ${0.7 * visorPulse})`;
  c.fillRect(-radius * 0.55, -3, radius * 1.1, 2);

  c.shadowColor = "#ffffff";
  c.shadowBlur = 8;
  c.fillStyle = "#ffffff";
  c.beginPath();
  c.arc(0, -2, 1.5, 0, Math.PI * 2);
  c.fill();

  c.shadowBlur = 14;
  c.fillStyle = styles.fill;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + rotation;
    const cornerX = Math.cos(a) * radius * 0.92;
    const cornerY = Math.sin(a) * radius * 0.92;
    c.beginPath();
    c.arc(cornerX, cornerY, 1.8 + e.pulse * 1.2, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

function drawVirus(
  c: CanvasRenderingContext2D,
  e: Enemy,
  x: number,
  y: number,
  nowMs: number,
): void {
  const config = ENEMY_KINDS[e.kind];
  const radius = ENEMY_RADIUS * 0.95;
  const rotation = nowMs * 0.002;
  const counterRot = nowMs * -0.0028;
  const styles = flashStyles(e);
  const jitterX = Math.sin(nowMs * 0.022) * 1.8;
  const jitterY = Math.cos(nowMs * 0.024) * 1.8;
  const glitchOffset = Math.floor(nowMs / 120) % 4;
  const spriteColor = e.hitFlashMsLeft > 0 ? "#ffffff" : config.color;
  drawEnemySprite(c, e.kind, x + jitterX, y + jitterY, radius, spriteColor, 0.88, 18 + e.pulse * 18);

  c.save();
  c.translate(x + jitterX, y + jitterY);
  c.shadowColor = config.glowColor;
  c.shadowBlur = 20 + e.pulse * 22;

  c.save();
  c.rotate(rotation);
  c.fillStyle = styles.bgFill;
  c.strokeStyle = styles.stroke;
  c.lineWidth = 2.5;
  drawStar(c, 3, radius, radius * 0.45);
  c.fill();
  c.stroke();
  c.restore();

  c.shadowBlur = 0;
  c.save();
  c.rotate(counterRot);
  c.strokeStyle = withAlpha(config.color, 0.65);
  c.lineWidth = 1.4;
  drawStar(c, 3, radius * 0.5, radius * 0.22);
  c.stroke();
  c.restore();

  c.strokeStyle = withAlpha(config.color, 0.4);
  c.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const baseY = -radius * 0.4 + i * radius * 0.4 + glitchOffset;
    const w1 = radius * (0.6 + (i % 2) * 0.3);
    c.beginPath();
    c.moveTo(-w1, baseY);
    c.lineTo(w1, baseY);
    c.stroke();
  }

  c.shadowColor = config.glowColor;
  c.shadowBlur = 12;
  c.fillStyle = styles.fill;
  for (let i = 0; i < 5; i++) {
    const a = rotation * 1.6 + (i / 5) * Math.PI * 2;
    const orbitR = radius * 1.45;
    const sx = Math.cos(a) * orbitR;
    const sy = Math.sin(a) * orbitR;
    c.beginPath();
    c.arc(sx, sy, 2 + e.pulse * 1.8, 0, Math.PI * 2);
    c.fill();
  }

  c.shadowBlur = 14;
  c.fillStyle = "#ffffff";
  c.beginPath();
  c.arc(0, 0, 1.8, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = styles.fill;
  c.beginPath();
  c.arc(0, 0, 4 + e.pulse * 3, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

function drawDrone(
  c: CanvasRenderingContext2D,
  e: Enemy,
  x: number,
  y: number,
  nowMs: number,
): void {
  const config = ENEMY_KINDS[e.kind];
  const radius = ENEMY_RADIUS * 1.2;
  const rotation = nowMs * 0.0003;
  const propRotation = nowMs * 0.012;
  const styles = flashStyles(e);
  const spriteColor = e.hitFlashMsLeft > 0 ? "#ffffff" : config.color;
  drawEnemySprite(c, e.kind, x, y, radius * 0.95, spriteColor, 0.85, 22 + e.pulse * 18);

  c.save();
  c.translate(x, y);
  c.rotate(rotation);

  c.shadowColor = config.glowColor;
  c.shadowBlur = 24 + e.pulse * 20;
  c.fillStyle = styles.bgFill;
  c.strokeStyle = styles.stroke;
  c.lineWidth = 3;
  drawPolygon(c, 4, radius);
  c.fill();
  c.stroke();

  c.shadowBlur = 0;
  c.strokeStyle = withAlpha(config.color, 0.45);
  c.lineWidth = 1;
  drawPolygon(c, 4, radius * 0.62);
  c.stroke();

  c.save();
  c.rotate(propRotation);
  c.strokeStyle = withAlpha(config.color, 0.7);
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(-radius * 0.5, 0);
  c.lineTo(radius * 0.5, 0);
  c.moveTo(0, -radius * 0.5);
  c.lineTo(0, radius * 0.5);
  c.stroke();
  c.restore();

  c.shadowColor = config.glowColor;
  c.shadowBlur = 10;
  c.strokeStyle = styles.stroke;
  c.lineWidth = 2;
  for (const ang of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
    const tipX = Math.cos(ang) * radius * 1.55;
    const tipY = Math.sin(ang) * radius * 1.55;
    c.beginPath();
    c.moveTo(Math.cos(ang) * radius * 1.05, Math.sin(ang) * radius * 1.05);
    c.lineTo(tipX, tipY);
    c.stroke();

    c.fillStyle = styles.fill;
    c.beginPath();
    c.arc(tipX, tipY, 2.2 + e.pulse * 1.2, 0, Math.PI * 2);
    c.fill();
  }

  c.shadowBlur = 14;
  c.fillStyle = "#ffffff";
  c.beginPath();
  c.arc(0, 0, 2.5, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = styles.fill;
  c.beginPath();
  c.arc(0, 0, 5 + e.pulse * 4, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

function drawPolygon(c: CanvasRenderingContext2D, sides: number, radius: number): void {
  c.beginPath();
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2;
    const px = Math.cos(a) * radius;
    const py = Math.sin(a) * radius;
    if (i === 0) c.moveTo(px, py);
    else c.lineTo(px, py);
  }
  c.closePath();
}

function drawStar(
  c: CanvasRenderingContext2D,
  points: number,
  outer: number,
  inner: number,
): void {
  c.beginPath();
  const total = points * 2;
  for (let i = 0; i < total; i++) {
    const a = (i / total) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? outer : inner;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (i === 0) c.moveTo(px, py);
    else c.lineTo(px, py);
  }
  c.closePath();
}

function parseColorRgb(hex: string): string {
  if (hex.startsWith("#") && hex.length === 7) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
  }
  return "255, 255, 255";
}

function drawRaceLabel(
  c: CanvasRenderingContext2D,
  e: Enemy,
  x: number,
  y: number,
  nowMs: number,
): void {
  const age = nowMs - e.stateEnteredAt;
  if (age > 1400 || e.state !== "spawning" && e.state !== "alive") return;
  const fade =
    age < 200 ? age / 200 : age < 1000 ? 1 : Math.max(0, 1 - (age - 1000) / 400);
  if (fade <= 0) return;
  const race = KIND_RACE[e.kind];
  const label = RACE_LABEL[race];
  c.save();
  c.globalAlpha = fade * 0.85;
  c.fillStyle = "rgba(240, 246, 255, 0.85)";
  c.font = "bold 10px ui-monospace, monospace";
  c.textAlign = "center";
  c.fillText(label, x, y - ENEMY_RADIUS - 14);
  c.restore();
}

function drawEnemyHpRing(c: CanvasRenderingContext2D, e: Enemy, x: number, y: number): void {
  const hpRadius = ENEMY_RADIUS + 14;
  for (let i = 0; i < e.maxHp; i++) {
    const a = (i / e.maxHp) * Math.PI * 2 - Math.PI / 2;
    const px = x + Math.cos(a) * hpRadius;
    const py = y + Math.sin(a) * hpRadius;
    c.fillStyle = i < e.hp ? PALETTE.cyan : "rgba(240, 246, 255, 0.15)";
    c.beginPath();
    c.arc(px, py, 2.5, 0, Math.PI * 2);
    c.fill();
  }
}

function drawTelegraphBeam(c: CanvasRenderingContext2D, e: Enemy, x: number, y: number): void {
  const progress = 1 - e.telegraphMsLeft / TELEGRAPH_MS;
  const dist = magnitude(x, y);
  const { ux, uy } = unitVector(-x, -y);
  const beamLen = dist * progress;
  const bulletKind = ENEMY_KINDS[e.kind].bulletKind;
  const color = BULLET_KINDS[bulletKind].color;
  c.save();
  c.shadowColor = color;
  c.shadowBlur = 18;
  c.strokeStyle = withAlpha(color, 0.4 + progress * 0.5);
  c.lineWidth = 2 + progress * 3;
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x + ux * beamLen, y + uy * beamLen);
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
    let color = kindConfig.color;
    if (b.state === "incoming") {
      c.shadowColor = color;
      c.shadowBlur = 14;
      if (b.kind === "heavy") drawHeavyAura(c, b.x, b.y, kindConfig.radius);
    } else if (b.state === "absorbed") {
      const pulse = 0.7 + Math.sin(nowMs / 60) * 0.3;
      color = PALETTE.yellow;
      c.shadowColor = withAlpha(PALETTE.yellow, pulse);
      c.shadowBlur = 18;
    } else if (b.state === "reflected") {
      color = PALETTE.cyan;
      c.shadowColor = PALETTE.cyan;
      c.shadowBlur = 20;
      drawBulletTrail(c, b.x, b.y, b.vx, b.vy);
    }
    if (b.kind === "heal") {
      drawHealCross(c, b.x, b.y, kindConfig.radius, nowMs, color);
    } else {
      drawShuriken(c, b.x, b.y, kindConfig.radius, b.kind, nowMs, color);
    }
    c.restore();
  }
}

function drawHealCross(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  nowMs: number,
  color: string,
): void {
  const pulse = 0.85 + Math.sin(nowMs / 140) * 0.15;
  const rotation = nowMs * 0.0008;
  const arm = radius * 1.05 * pulse;
  const thickness = radius * 0.42;

  c.save();
  c.translate(x, y);
  c.rotate(rotation);
  c.shadowColor = color;
  c.shadowBlur = 24;
  c.fillStyle = color;
  c.fillRect(-thickness / 2, -arm, thickness, arm * 2);
  c.fillRect(-arm, -thickness / 2, arm * 2, thickness);
  c.shadowBlur = 0;
  c.fillStyle = "rgba(255, 255, 255, 0.85)";
  c.fillRect(-thickness / 4, -arm * 0.85, thickness / 2, arm * 1.7);
  c.fillRect(-arm * 0.85, -thickness / 4, arm * 1.7, thickness / 2);
  c.restore();
}

function drawShuriken(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  kind: string,
  nowMs: number,
  color: string,
): void {
  const points = kind === "heavy" ? 6 : kind === "rapid" ? 3 : 4;
  const spinSpeed = kind === "rapid" ? 0.04 : kind === "heavy" ? 0.012 : 0.025;
  const rotation = nowMs * spinSpeed;
  const innerR = radius * (kind === "heavy" ? 0.55 : 0.42);

  c.save();
  c.translate(x, y);
  c.rotate(rotation);
  c.fillStyle = color;
  c.beginPath();
  const totalPoints = points * 2;
  for (let i = 0; i < totalPoints; i++) {
    const angle = (i / totalPoints) * Math.PI * 2;
    const r = i % 2 === 0 ? radius : innerR;
    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r;
    if (i === 0) c.moveTo(px, py);
    else c.lineTo(px, py);
  }
  c.closePath();
  c.fill();
  c.shadowBlur = 0;
  c.fillStyle = "rgba(5, 3, 10, 0.7)";
  c.beginPath();
  c.arc(0, 0, innerR * 0.45, 0, Math.PI * 2);
  c.fill();
  c.restore();
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

const BLADE_INNER_OFFSET = PLAYER_RADIUS + 4;

export function drawPlayer(
  c: CanvasRenderingContext2D,
  state: EngineState,
  nowMs: number,
): void {
  const pulse = 0.85 + Math.sin(nowMs / 220) * 0.1 + state.bgPulse * 0.2;
  const dashing = state.dashActiveMsLeft > 0;
  c.save();
  c.shadowColor = dashing ? "#ffffff" : PALETTE.cyan;
  c.shadowBlur = (dashing ? 36 : 22) * pulse;
  c.fillStyle = dashing ? "#ffffff" : PALETTE.cyan;
  c.beginPath();
  c.arc(0, 0, PLAYER_RADIUS * 0.4, 0, Math.PI * 2);
  c.fill();
  c.shadowBlur = 0;
  c.strokeStyle = dashing ? "rgba(255, 255, 255, 1)" : "rgba(28, 240, 255, 0.9)";
  c.lineWidth = dashing ? 3 : 2;
  c.beginPath();
  c.arc(0, 0, PLAYER_RADIUS, 0, Math.PI * 2);
  c.stroke();
  c.strokeStyle = "rgba(255, 56, 99, 0.15)";
  c.lineWidth = 1;
  c.beginPath();
  c.arc(0, 0, HIT_RADIUS, 0, Math.PI * 2);
  c.stroke();
  c.restore();

  drawLightsaberBlade(c, state, nowMs);
  drawDashCooldown(c, state);
}

function drawDashCooldown(c: CanvasRenderingContext2D, state: EngineState): void {
  if (state.dashCooldownMsLeft <= 0 && state.dashActiveMsLeft <= 0) return;
  const total = 1400;
  const cooldownFrac = Math.max(0, state.dashCooldownMsLeft / total);
  const r = PLAYER_RADIUS + 5;
  const arc = (1 - cooldownFrac) * Math.PI * 2;
  c.save();
  c.strokeStyle = state.dashActiveMsLeft > 0 ? "#ffffff" : "rgba(28, 240, 255, 0.4)";
  c.lineWidth = 2;
  c.beginPath();
  c.arc(0, 0, r, -Math.PI / 2, -Math.PI / 2 + arc);
  c.stroke();
  c.restore();
}

function drawLightsaberBlade(
  c: CanvasRenderingContext2D,
  state: EngineState,
  nowMs: number,
): void {
  const char = CHARACTERS[state.characterId];

  const swingActive = state.bladeSwingMsLeft > 0;
  const swingProgress = swingActive
    ? 1 - state.bladeSwingMsLeft / Math.max(1, state.bladeSwingDurationMs)
    : 0;
  const easeOut = 1 - Math.pow(1 - swingProgress, 2.6);
  const swingAngle = swingActive
    ? lerpAngle(state.bladeSwingFromAngle, state.bladeSwingToAngle, easeOut)
    : state.aimAngle;

  const length = swingActive
    ? char.bladeLengthParry * 1.15
    : state.parryHeld
      ? char.bladeLengthParry + Math.sin(nowMs / 60) * 4
      : char.bladeLengthIdle;

  if (swingActive) {
    drawSwingTrail(
      c,
      state.bladeSwingFromAngle,
      state.bladeSwingToAngle,
      easeOut,
      length,
      char.bladeColor,
    );
  }

  drawBladeAt(c, swingAngle, length, char.bladeColor, state.parryHeld || swingActive, nowMs, char.bladeShape);
}

function lerpAngle(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function drawBladeAt(
  c: CanvasRenderingContext2D,
  angle: number,
  length: number,
  bladeColor: string,
  intense: boolean,
  nowMs: number,
  shape: "katana" | "staff" | "razor" = "katana",
): void {
  if (shape === "staff") drawStaffBlade(c, angle, length, bladeColor, intense, nowMs);
  else if (shape === "razor") drawRazorBlade(c, angle, length, bladeColor, intense, nowMs);
  else drawKatanaBlade(c, angle, length, bladeColor, intense, nowMs);
}

function drawKatanaBlade(
  c: CanvasRenderingContext2D,
  angle: number,
  length: number,
  bladeColor: string,
  intense: boolean,
  nowMs: number,
): void {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const innerX = cos * BLADE_INNER_OFFSET;
  const innerY = sin * BLADE_INNER_OFFSET;
  const tipX = cos * (BLADE_INNER_OFFSET + length);
  const tipY = sin * (BLADE_INNER_OFFSET + length);

  c.save();
  c.lineCap = "round";
  c.shadowColor = intense ? PALETTE.yellow : bladeColor;
  c.shadowBlur = intense ? 28 : 18;
  c.strokeStyle = intense ? PALETTE.yellow : bladeColor;
  c.lineWidth = intense ? 8 : 5;
  c.beginPath();
  c.moveTo(innerX, innerY);
  c.lineTo(tipX, tipY);
  c.stroke();

  c.shadowBlur = 0;
  c.strokeStyle = "rgba(255, 255, 255, 0.95)";
  c.lineWidth = intense ? 3 : 2;
  c.beginPath();
  c.moveTo(innerX, innerY);
  c.lineTo(tipX, tipY);
  c.stroke();

  if (intense) {
    c.fillStyle = `rgba(255, 255, 255, ${0.6 + Math.sin(nowMs / 50) * 0.2})`;
    c.shadowColor = bladeColor;
    c.shadowBlur = 16;
    c.beginPath();
    c.arc(tipX, tipY, 4, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

function drawStaffBlade(
  c: CanvasRenderingContext2D,
  angle: number,
  length: number,
  bladeColor: string,
  intense: boolean,
  nowMs: number,
): void {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const perpCos = -sin;
  const perpSin = cos;
  const innerX = cos * BLADE_INNER_OFFSET;
  const innerY = sin * BLADE_INNER_OFFSET;
  const tipX = cos * (BLADE_INNER_OFFSET + length);
  const tipY = sin * (BLADE_INNER_OFFSET + length);

  c.save();
  c.lineCap = "round";
  c.shadowColor = intense ? PALETTE.yellow : bladeColor;
  c.shadowBlur = intense ? 30 : 22;
  c.strokeStyle = intense ? PALETTE.yellow : bladeColor;
  c.lineWidth = intense ? 12 : 9;
  c.beginPath();
  c.moveTo(innerX, innerY);
  c.lineTo(tipX, tipY);
  c.stroke();

  // Crossguard near hilt (perpendicular bar)
  const cgX = innerX + cos * length * 0.18;
  const cgY = innerY + sin * length * 0.18;
  const cgLen = intense ? 14 : 11;
  c.shadowBlur = intense ? 16 : 10;
  c.strokeStyle = intense ? PALETTE.yellow : bladeColor;
  c.lineWidth = intense ? 5 : 3.5;
  c.beginPath();
  c.moveTo(cgX - perpCos * cgLen, cgY - perpSin * cgLen);
  c.lineTo(cgX + perpCos * cgLen, cgY + perpSin * cgLen);
  c.stroke();

  // Inner white core
  c.shadowBlur = 0;
  c.strokeStyle = "rgba(255, 255, 255, 0.95)";
  c.lineWidth = intense ? 4 : 3;
  c.beginPath();
  c.moveTo(innerX, innerY);
  c.lineTo(tipX, tipY);
  c.stroke();

  // Spherical tip
  c.shadowColor = bladeColor;
  c.shadowBlur = intense ? 20 : 12;
  c.fillStyle = "#ffffff";
  c.beginPath();
  c.arc(tipX, tipY, intense ? 7 + Math.sin(nowMs / 80) : 5, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

function drawRazorBlade(
  c: CanvasRenderingContext2D,
  angle: number,
  length: number,
  bladeColor: string,
  intense: boolean,
  nowMs: number,
): void {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const perpCos = -sin;
  const perpSin = cos;
  const innerX = cos * BLADE_INNER_OFFSET;
  const innerY = sin * BLADE_INNER_OFFSET;
  const tipX = cos * (BLADE_INNER_OFFSET + length);
  const tipY = sin * (BLADE_INNER_OFFSET + length);
  const baseWidth = intense ? 9 : 6;

  c.save();
  c.shadowColor = intense ? PALETTE.yellow : bladeColor;
  c.shadowBlur = intense ? 28 : 18;

  // Triangle base (left + right + tip)
  const baseLeftX = innerX + perpCos * baseWidth;
  const baseLeftY = innerY + perpSin * baseWidth;
  const baseRightX = innerX - perpCos * baseWidth;
  const baseRightY = innerY - perpSin * baseWidth;
  const midPoint = 0.4;
  const midX = innerX + cos * length * midPoint;
  const midY = innerY + sin * length * midPoint;
  const midLeftX = midX + perpCos * baseWidth * 0.55;
  const midLeftY = midY + perpSin * baseWidth * 0.55;
  const midRightX = midX - perpCos * baseWidth * 0.55;
  const midRightY = midY - perpSin * baseWidth * 0.55;

  c.fillStyle = intense ? PALETTE.yellow : bladeColor;
  c.beginPath();
  c.moveTo(baseLeftX, baseLeftY);
  c.lineTo(midLeftX, midLeftY);
  c.lineTo(tipX, tipY);
  c.lineTo(midRightX, midRightY);
  c.lineTo(baseRightX, baseRightY);
  c.closePath();
  c.fill();

  c.shadowBlur = 0;
  c.strokeStyle = "rgba(255, 255, 255, 0.95)";
  c.lineWidth = intense ? 2 : 1.5;
  c.beginPath();
  c.moveTo(innerX, innerY);
  c.lineTo(tipX, tipY);
  c.stroke();

  // Flame at tip
  if (intense) {
    const flameX = tipX + cos * 6;
    const flameY = tipY + sin * 6;
    c.shadowColor = "#ffffff";
    c.shadowBlur = 24;
    c.fillStyle = `rgba(255, 255, 255, ${0.7 + Math.sin(nowMs / 40) * 0.3})`;
    c.beginPath();
    c.arc(flameX, flameY, 5 + Math.sin(nowMs / 60) * 2, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = bladeColor;
    c.beginPath();
    c.arc(flameX, flameY, 3, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

function drawSwingTrail(
  c: CanvasRenderingContext2D,
  fromAngle: number,
  toAngle: number,
  progress: number,
  length: number,
  color: string,
): void {
  const ghosts = 6;
  c.save();
  c.lineCap = "round";
  for (let i = 0; i < ghosts; i++) {
    const ratio = i / ghosts;
    const ghostProgress = progress * (1 - ratio * 0.6);
    if (ghostProgress < 0) continue;
    const ghostAngle = lerpAngle(fromAngle, toAngle, ghostProgress);
    const cos = Math.cos(ghostAngle);
    const sin = Math.sin(ghostAngle);
    const innerX = cos * BLADE_INNER_OFFSET;
    const innerY = sin * BLADE_INNER_OFFSET;
    const tipX = cos * (BLADE_INNER_OFFSET + length);
    const tipY = sin * (BLADE_INNER_OFFSET + length);
    const alpha = (1 - ratio) * 0.45;
    c.shadowColor = color;
    c.shadowBlur = 18 * (1 - ratio);
    c.strokeStyle = withAlpha(color, alpha);
    c.lineWidth = 6 - ratio * 4;
    c.beginPath();
    c.moveTo(innerX, innerY);
    c.lineTo(tipX, tipY);
    c.stroke();
  }
  c.restore();
}
