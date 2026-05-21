import type { Bullet, BulletKind, Enemy, EngineCallbacks, EngineState } from "../types";
import { BULLET_KINDS, ENEMY_KINDS } from "../config/enemy-kinds";
import {
  BULLET_REFLECT_SPEED,
  ENEMY_RADIUS,
  HIT_RADIUS,
  PARRY_HALF_CONE_RAD,
  PARRY_RANGE,
  SCORE_ENEMY_KILL,
  SCORE_REFLECT_HIT,
} from "../config/tuning";
import { angleBetween, magnitude, normalizeAngle, unitVector } from "./geometry";
import { killEnemy } from "./enemy";
import { BURSTS, emitBurst } from "./particles";

export function createBullet(
  state: EngineState,
  enemy: Enemy,
  nowMs: number,
  baseSpeed: number,
): Bullet {
  const enemyConfig = ENEMY_KINDS[enemy.kind];
  const kind = enemyConfig.bulletKind;
  const speed = baseSpeed * enemyConfig.bulletSpeedMul;
  const { ux, uy } = unitVector(-enemy.x, -enemy.y);
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
  };
}

function isInParryCone(x: number, y: number, aimAngle: number): boolean {
  const dist = magnitude(x, y);
  if (dist > PARRY_RANGE || dist < 4) return false;
  const angle = angleBetween(x, y);
  return Math.abs(normalizeAngle(angle - aimAngle)) <= PARRY_HALF_CONE_RAD;
}

export interface BulletTickEffects {
  damageDealt: number;
  parriedCount: number;
  reflectHits: { x: number; y: number }[];
  enemyKills: { x: number; y: number }[];
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
    reflectHits: [],
    enemyKills: [],
  };
  const offscreenLimit = Math.max(canvasW, canvasH);

  for (const b of state.bullets) {
    if (b.state === "dead") continue;
    const radius = radiusOf(b.kind);

    if (b.state === "incoming") {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      const dist = magnitude(b.x, b.y);
      if (state.parryHeld && isInParryCone(b.x, b.y, state.aimAngle)) {
        b.state = "absorbed";
        effects.parriedCount += 1;
        emitBurst(state, b.x, b.y, BURSTS.parryCatch());
      } else if (dist <= HIT_RADIUS + radius) {
        b.state = "dead";
        effects.damageDealt += damageOf(b.kind);
        emitBurst(state, b.x, b.y, BURSTS.playerHit());
      }
    } else if (b.state === "absorbed") {
      const targetR = PARRY_RANGE * 0.5;
      const d = magnitude(b.x, b.y) || 1;
      const tx = (b.x / d) * targetR;
      const ty = (b.y / d) * targetR;
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
        b.state = "dead";
        effects.reflectHits.push({ x: b.x, y: b.y });
        emitBurst(state, b.x, b.y, BURSTS.reflectHit());
        if (e.hp <= 0) {
          killEnemy(e, nowMs);
          effects.enemyKills.push({ x: e.x, y: e.y });
          emitBurst(state, e.x, e.y, BURSTS.enemyDie());
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

export function reflectAbsorbedBullets(state: EngineState): number {
  let count = 0;
  const cos = Math.cos(state.aimAngle);
  const sin = Math.sin(state.aimAngle);
  for (const b of state.bullets) {
    if (b.state !== "absorbed") continue;
    b.state = "reflected";
    b.vx = cos * BULLET_REFLECT_SPEED;
    b.vy = sin * BULLET_REFLECT_SPEED;
    count++;
  }
  if (count > 0) {
    emitBurst(state, 0, 0, BURSTS.reflect(count, state.aimAngle));
  }
  return count;
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
