import type { Bullet, BulletKind, Enemy, EngineCallbacks, EngineState } from "../types";
import { BULLET_KINDS, ENEMY_KINDS } from "../config/enemy-kinds";
import {
  BULLET_REFLECT_SPEED,
  ENEMY_KNOCKBACK_AMOUNT,
  ENEMY_RADIUS,
  HIT_RADIUS,
  NEAR_MISS_RADIUS,
  PARRY_HALF_CONE_RAD,
  PARRY_RANGE,
  PERFECT_PARRY_WINDOW_MS,
  SCORE_ENEMY_KILL,
  SCORE_REFLECT_HIT,
} from "../config/tuning";
import { angleBetween, magnitude, normalizeAngle, unitVector } from "./geometry";
import { killEnemy } from "./enemy";
import { BURSTS, emitBurst } from "./particles";
import { spawnScorePop } from "./effects";
import { PALETTE } from "../config/palette";

export function createBullet(
  state: EngineState,
  enemy: Enemy,
  nowMs: number,
): Bullet {
  const enemyConfig = ENEMY_KINDS[enemy.kind];
  const kind = enemyConfig.bulletKind;
  const dx = state.playerX - enemy.x;
  const dy = state.playerY - enemy.y;
  const distance = magnitude(dx, dy);
  const flightMs = enemyConfig.flightBeats * state.beat.beatPeriodMs;
  const speed = distance / Math.max(0.05, flightMs / 1000);
  const { ux, uy } = unitVector(dx, dy);
  return {
    id: state.nextBulletId++,
    x: enemy.x,
    y: enemy.y,
    vx: ux * speed,
    vy: uy * speed,
    kind,
    state: "incoming",
    spawnedAt: nowMs,
    ownerEnemyId: enemy.id,
    minDist: Infinity,
    nearMissFired: false,
    isPerfect: false,
  };
}

function isInParryCone(
  bx: number,
  by: number,
  px: number,
  py: number,
  aimAngle: number,
): boolean {
  const dx = bx - px;
  const dy = by - py;
  const dist = magnitude(dx, dy);
  if (dist > PARRY_RANGE || dist < 4) return false;
  const angle = angleBetween(dx, dy);
  return Math.abs(normalizeAngle(angle - aimAngle)) <= PARRY_HALF_CONE_RAD;
}

function speedMulForBeat(beatPhase: number): number {
  return 0.4 + 1.6 * Math.exp(-beatPhase * 14);
}

function applyIncomingMotion(b: Bullet, dt: number, beatPhase: number, nowMs: number): void {
  if (b.kind === "heavy") {
    const mul = speedMulForBeat(beatPhase);
    b.x += b.vx * dt * mul;
    b.y += b.vy * dt * mul;
    return;
  }
  if (b.kind === "rapid") {
    const speed = magnitude(b.vx, b.vy) || 1;
    const perpX = -b.vy / speed;
    const perpY = b.vx / speed;
    const elapsedSec = (nowMs - b.spawnedAt) / 1000;
    const oscAmp = 90;
    const oscRate = 18;
    const offsetVel = Math.cos(elapsedSec * oscRate) * oscAmp;
    b.x += (b.vx + perpX * offsetVel) * dt;
    b.y += (b.vy + perpY * offsetVel) * dt;
    return;
  }
  b.x += b.vx * dt;
  b.y += b.vy * dt;
}

export interface BulletTickEffects {
  damageDealt: number;
  parriedCount: number;
  perfectCount: number;
  reflectHits: { x: number; y: number }[];
  enemyKills: { x: number; y: number }[];
  nearMisses: number;
}

function radiusOf(kind: BulletKind): number {
  return BULLET_KINDS[kind].radius;
}

function damageOf(kind: BulletKind): number {
  return BULLET_KINDS[kind].damage;
}

export function updateBullets(
  state: EngineState,
  dt: number,
  canvasW: number,
  canvasH: number,
  nowMs: number,
): BulletTickEffects {
  const effects: BulletTickEffects = {
    damageDealt: 0,
    parriedCount: 0,
    perfectCount: 0,
    reflectHits: [],
    enemyKills: [],
    nearMisses: 0,
  };
  const offscreenLimit = Math.max(canvasW, canvasH);
  const beatPhase = state.beat.beatPhase;
  const px = state.playerX;
  const py = state.playerY;

  for (const b of state.bullets) {
    if (b.state === "dead") continue;
    const radius = radiusOf(b.kind);

    if (b.state === "incoming") {
      applyIncomingMotion(b, dt, beatPhase, nowMs);
      const distToPlayer = magnitude(b.x - px, b.y - py);
      if (distToPlayer < b.minDist) b.minDist = distToPlayer;
      if (state.parryHeld && isInParryCone(b.x, b.y, px, py, state.aimAngle)) {
        b.state = "absorbed";
        const timeSincePress = nowMs - state.parryStartedAt;
        b.isPerfect = timeSincePress <= PERFECT_PARRY_WINDOW_MS;
        effects.parriedCount += 1;
        if (b.isPerfect) effects.perfectCount += 1;
        emitBurst(state, b.x, b.y, BURSTS.parryCatch());
      } else if (distToPlayer <= HIT_RADIUS + radius) {
        b.state = "dead";
        effects.damageDealt += damageOf(b.kind);
        emitBurst(state, b.x, b.y, BURSTS.playerHit());
      } else {
        const towardPlayerX = px - b.x;
        const towardPlayerY = py - b.y;
        const movingAway = b.vx * towardPlayerX + b.vy * towardPlayerY < 0;
        if (
          movingAway &&
          !b.nearMissFired &&
          b.minDist < HIT_RADIUS + radius + NEAR_MISS_RADIUS
        ) {
          b.nearMissFired = true;
          effects.nearMisses += 1;
        }
      }
    } else if (b.state === "absorbed") {
      const targetR = PARRY_RANGE * 0.5;
      const dx = b.x - px;
      const dy = b.y - py;
      const d = magnitude(dx, dy) || 1;
      const tx = px + (dx / d) * targetR;
      const ty = py + (dy / d) * targetR;
      const ease = Math.min(1, dt * 8);
      b.x += (tx - b.x) * ease;
      b.y += (ty - b.y) * ease;
    } else if (b.state === "reflected") {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      for (const e of state.enemies) {
        if (e.state !== "alive") continue;
        const dd = magnitude(b.x - e.x, b.y - e.y);
        if (dd >= ENEMY_RADIUS + radius) continue;

        const damage = b.kind === "heavy" ? 2 : 1;
        e.hp -= damage;
        e.pulse = 1;
        e.hitFlashMsLeft = 120;
        applyKnockback(e, b.vx, b.vy);
        b.state = "dead";
        effects.reflectHits.push({ x: b.x, y: b.y });
        emitBurst(state, b.x, b.y, BURSTS.reflectHit());
        spawnScorePop(state, e.x, e.y - 6, `+${SCORE_REFLECT_HIT}`, PALETTE.cyan, 0.8);
        if (e.hp <= 0) {
          killEnemy(e, nowMs);
          effects.enemyKills.push({ x: e.x, y: e.y });
          emitBurst(state, e.x, e.y, BURSTS.enemyDie());
          spawnScorePop(state, e.x, e.y, `+${SCORE_ENEMY_KILL}`, PALETTE.yellow, 1.2);
        }
        break;
      }
      if (Math.abs(b.x) > offscreenLimit || Math.abs(b.y) > offscreenLimit) {
        b.state = "dead";
      }
    }
  }
  return effects;
}

function applyKnockback(enemy: Enemy, vx: number, vy: number): void {
  const speed = magnitude(vx, vy) || 1;
  enemy.knockbackX += (vx / speed) * ENEMY_KNOCKBACK_AMOUNT;
  enemy.knockbackY += (vy / speed) * ENEMY_KNOCKBACK_AMOUNT;
}

export interface ReleaseResult {
  count: number;
  perfectCount: number;
}

export function reflectAbsorbedBullets(state: EngineState): ReleaseResult {
  let count = 0;
  let perfectCount = 0;
  const cos = Math.cos(state.aimAngle);
  const sin = Math.sin(state.aimAngle);
  for (const b of state.bullets) {
    if (b.state !== "absorbed") continue;
    b.state = "reflected";
    b.vx = cos * BULLET_REFLECT_SPEED;
    b.vy = sin * BULLET_REFLECT_SPEED;
    count++;
    if (b.isPerfect) perfectCount++;
  }
  if (count > 0) {
    emitBurst(state, state.playerX, state.playerY, BURSTS.reflect(count, state.aimAngle));
  }
  return { count, perfectCount };
}

export function autoCounterAbsorbedBullets(state: EngineState): ReleaseResult {
  let count = 0;
  let perfectCount = 0;
  const enemyById = new Map(state.enemies.map((e) => [e.id, e]));
  const cos = Math.cos(state.aimAngle);
  const sin = Math.sin(state.aimAngle);
  for (const b of state.bullets) {
    if (b.state !== "absorbed") continue;
    const owner = enemyById.get(b.ownerEnemyId);
    if (owner && owner.state === "alive") {
      const { ux, uy } = unitVector(owner.x - b.x, owner.y - b.y);
      b.vx = ux * BULLET_REFLECT_SPEED;
      b.vy = uy * BULLET_REFLECT_SPEED;
    } else {
      b.vx = cos * BULLET_REFLECT_SPEED;
      b.vy = sin * BULLET_REFLECT_SPEED;
    }
    b.state = "reflected";
    count++;
    if (b.isPerfect) perfectCount++;
  }
  if (count > 0) {
    emitBurst(state, state.playerX, state.playerY, BURSTS.reflect(count, state.aimAngle));
  }
  return { count, perfectCount };
}

export function cleanupBullets(state: EngineState): void {
  state.bullets = state.bullets.filter((b) => b.state !== "dead");
}

export function applyBulletEffects(
  effects: BulletTickEffects,
  cb: EngineCallbacks,
): void {
  if (effects.damageDealt > 0) cb.onDamage(effects.damageDealt);
  for (let i = 0; i < effects.reflectHits.length; i++) {
    cb.onScore(SCORE_REFLECT_HIT);
    cb.onCombo(1);
  }
  for (let i = 0; i < effects.enemyKills.length; i++) {
    cb.onScore(SCORE_ENEMY_KILL);
  }
}
