import type { Bullet, BulletKind, Enemy, EngineCallbacks, EngineState } from "../types";
import { BULLET_KINDS, ENEMY_KINDS } from "../config/enemy-kinds";
import { DIFFICULTIES } from "../config/difficulty";
import { CHARACTERS } from "../config/characters";
import { MODIFIERS } from "../config/modifiers";
import {
  ENEMY_KNOCKBACK_AMOUNT,
  ENEMY_RADIUS,
  HIT_RADIUS,
  NEAR_MISS_RADIUS,
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
  angleOffset: number = 0,
): Bullet {
  const enemyConfig = ENEMY_KINDS[enemy.kind];
  const diffConfig = DIFFICULTIES[state.difficulty];
  const modConfig = MODIFIERS[state.modifierId];
  const kind: BulletKind = modConfig.bulletKindOverride ?? enemyConfig.bulletKind;
  const dx = state.playerX - enemy.x;
  const dy = state.playerY - enemy.y;
  const distance = magnitude(dx, dy);
  const flightBeats = enemyConfig.flightBeats * diffConfig.flightBeatsMul;
  const flightMs = flightBeats * state.beat.beatPeriodMs;
  const loopMul = state.endlessMode ? 1 + Math.min(0.6, state.endlessLoop * 0.08) : 1;
  const speed =
    (distance / Math.max(0.05, flightMs / 1000)) * modConfig.bulletSpeedMul * loopMul;
  const baseAngle = Math.atan2(dy, dx);
  const finalAngle = baseAngle + angleOffset;
  const ux = Math.cos(finalAngle);
  const uy = Math.sin(finalAngle);
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
    isCharged: false,
  };
}

export function createHealItem(
  state: EngineState,
  nowMs: number,
  canvasW: number,
  canvasH: number,
  speed: number,
): Bullet {
  const angle = Math.random() * Math.PI * 2;
  const spawnR = Math.max(canvasW, canvasH) * 0.55;
  const x = Math.cos(angle) * spawnR;
  const y = Math.sin(angle) * spawnR;
  const dx = state.playerX - x;
  const dy = state.playerY - y;
  const { ux, uy } = unitVector(dx, dy);
  return {
    id: state.nextBulletId++,
    x,
    y,
    vx: ux * speed,
    vy: uy * speed,
    kind: "heal",
    state: "incoming",
    spawnedAt: nowMs,
    ownerEnemyId: -1,
    minDist: Infinity,
    nearMissFired: false,
    isPerfect: false,
    isCharged: false,
  };
}

function isInParryCone(
  bx: number,
  by: number,
  px: number,
  py: number,
  aimAngle: number,
  parryRange: number,
  parryHalfCone: number,
): boolean {
  const dx = bx - px;
  const dy = by - py;
  const dist = magnitude(dx, dy);
  if (dist > parryRange || dist < 4) return false;
  const angle = angleBetween(dx, dy);
  return Math.abs(normalizeAngle(angle - aimAngle)) <= parryHalfCone;
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
  enemyKills: { x: number; y: number; kind: import("../types").EnemyKind }[];
  nearMisses: number;
  healCaught: number;
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
    healCaught: 0,
  };
  const offscreenLimit = Math.max(canvasW, canvasH);
  const beatPhase = state.beat.beatPhase;
  const px = state.playerX;
  const py = state.playerY;
  const char = CHARACTERS[state.characterId];
  const modConfig = MODIFIERS[state.modifierId];

  for (const b of state.bullets) {
    if (b.state === "dead") continue;
    const radius = radiusOf(b.kind);

    if (b.state === "incoming") {
      applyIncomingMotion(b, dt, beatPhase, nowMs);
      const distToPlayer = magnitude(b.x - px, b.y - py);
      if (distToPlayer < b.minDist) b.minDist = distToPlayer;
      const inCone =
        state.parryHeld &&
        isInParryCone(
          b.x,
          b.y,
          px,
          py,
          state.aimAngle,
          char.parryRange,
          char.coneAngleRad,
        );
      if (b.kind === "heal") {
        if (inCone) {
          b.state = "dead";
          effects.healCaught += 1;
          emitBurst(state, b.x, b.y, BURSTS.healCatch());
        } else if (distToPlayer <= HIT_RADIUS + radius) {
          b.state = "dead";
        }
      } else if (inCone) {
        b.state = "absorbed";
        const timeSincePress = nowMs - state.parryStartedAt;
        const perfectWindow =
          char.perfectWindowMs *
          DIFFICULTIES[state.difficulty].perfectWindowMul *
          modConfig.perfectWindowMul;
        b.isPerfect = timeSincePress <= perfectWindow;
        effects.parriedCount += 1;
        if (b.isPerfect) effects.perfectCount += 1;
        emitBurst(state, b.x, b.y, BURSTS.parryCatch());
      } else if (distToPlayer <= HIT_RADIUS + radius) {
        b.state = "dead";
        if (state.dashActiveMsLeft > 0) {
          emitBurst(state, b.x, b.y, BURSTS.parryCatch());
        } else {
          effects.damageDealt += damageOf(b.kind);
          emitBurst(state, b.x, b.y, BURSTS.playerHit());
        }
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
      const targetR = char.parryRange * 0.5;
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

        // Mirror enemies bounce non-charged reflects back at the player.
        // Only a CHARGED reflect breaks through and damages a mirror.
        if (e.kind === "mirror" && !b.isCharged) {
          const towardPx = px - b.x;
          const towardPy = py - b.y;
          const { ux, uy } = unitVector(towardPx, towardPy);
          const speed = magnitude(b.vx, b.vy);
          b.vx = ux * speed;
          b.vy = uy * speed;
          b.state = "incoming";
          b.minDist = Infinity;
          b.nearMissFired = false;
          b.isPerfect = false;
          b.ownerEnemyId = e.id;
          e.pulse = 1;
          e.hitFlashMsLeft = 60;
          emitBurst(state, b.x, b.y, BURSTS.parryCatch());
          break;
        }

        const baseDamage = b.kind === "heavy" ? 2 : 1;
        const charged = b.isCharged ? 1 : 0;
        const damage = Math.max(
          1,
          Math.round((baseDamage + charged) * char.reflectDamageMul),
        );
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
          effects.enemyKills.push({ x: e.x, y: e.y, kind: e.kind });
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
  const char = CHARACTERS[state.characterId];
  const cos = Math.cos(state.aimAngle);
  const sin = Math.sin(state.aimAngle);
  for (const b of state.bullets) {
    if (b.state !== "absorbed") continue;
    b.state = "reflected";
    b.vx = cos * char.reflectSpeed;
    b.vy = sin * char.reflectSpeed;
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
  const char = CHARACTERS[state.characterId];
  const enemyById = new Map(state.enemies.map((e) => [e.id, e]));
  const cos = Math.cos(state.aimAngle);
  const sin = Math.sin(state.aimAngle);
  for (const b of state.bullets) {
    if (b.state !== "absorbed") continue;
    const owner = enemyById.get(b.ownerEnemyId);
    if (owner && owner.state === "alive") {
      const { ux, uy } = unitVector(owner.x - b.x, owner.y - b.y);
      b.vx = ux * char.reflectSpeed;
      b.vy = uy * char.reflectSpeed;
    } else {
      b.vx = cos * char.reflectSpeed;
      b.vy = sin * char.reflectSpeed;
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
