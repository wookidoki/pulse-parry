import type { Enemy, EngineState, EnemyKind } from "../types";
import type { StageConfig } from "../config/stages";
import { ENEMY_KINDS, type EnemyKindConfig } from "../config/enemy-kinds";
import { DIFFICULTIES } from "../config/difficulty";
import {
  ENEMY_ORBIT_DRIFT_RAD_PER_SEC,
  ENEMY_ORBIT_FACTOR,
  ENEMY_ORBIT_MARGIN,
  ENEMY_SPAWN_DELAY_MS,
  KNOCKBACK_DECAY_PER_SEC,
  TELEGRAPH_MS,
} from "../config/tuning";
import { normalizeAngle } from "./geometry";

const PHANTOM_TELEPORT_BEATS = 4;
const SPREAD_TOTAL_RAD = 0.42;
const SPIRAL_STEP_RAD = 0.22;

function orbitRadius(canvasW: number, canvasH: number): number {
  const min = Math.min(canvasW, canvasH);
  const factored = min * ENEMY_ORBIT_FACTOR;
  const cap = min / 2 - ENEMY_ORBIT_MARGIN;
  return Math.min(factored, Math.max(120, cap));
}

function pickSpawnAngle(state: EngineState): number {
  const taken = state.enemies
    .filter((e) => e.state !== "dead")
    .map((e) => e.orbitAngle);
  const seedBase = state.beat.currentBeat * 9301 + state.nextEnemyId * 49297;
  const seed = ((seedBase % 233280) + 233280) % 233280;
  const baseAngle = (seed / 233280) * Math.PI * 2;
  for (let attempt = 0; attempt < 6; attempt++) {
    const candidate = baseAngle + attempt * 0.42;
    const tooClose = taken.some(
      (a) => Math.abs(normalizeAngle(candidate - a)) < 0.6,
    );
    if (!tooClose) return candidate;
  }
  return baseAngle;
}

function pickEnemyKind(stage: StageConfig): EnemyKind {
  const list = stage.enemyKinds;
  return list[Math.floor(Math.random() * list.length)];
}

export function getEffectiveConfig(enemy: Enemy): EnemyKindConfig {
  if (enemy.kind !== "boss") return ENEMY_KINDS[enemy.kind];
  const base = ENEMY_KINDS.boss;
  const hpFrac = enemy.hp / enemy.maxHp;
  if (hpFrac <= 0.33) {
    return { ...base, beatsPerShot: 1, burstShots: 4, burstIntervalBeatFraction: 0.18 };
  }
  if (hpFrac <= 0.66) {
    return { ...base, beatsPerShot: 1, burstShots: 3, burstIntervalBeatFraction: 0.06 };
  }
  return base;
}

function angleOffsetForShot(
  kind: EnemyKind,
  shotIndex: number,
  totalShots: number,
): number {
  if (totalShots <= 1) return 0;
  if (kind === "spreader") {
    return -SPREAD_TOTAL_RAD / 2 + (shotIndex / (totalShots - 1)) * SPREAD_TOTAL_RAD;
  }
  if (kind === "spiraler") {
    return (shotIndex - (totalShots - 1) / 2) * SPIRAL_STEP_RAD;
  }
  if (kind === "boss") {
    return (shotIndex - (totalShots - 1) / 2) * 0.18;
  }
  return 0;
}

export function createEnemy(
  state: EngineState,
  nowMs: number,
  canvasW: number,
  canvasH: number,
  stage: StageConfig,
): Enemy {
  const kind = pickEnemyKind(stage);
  const angle = kind === "boss" ? -Math.PI / 2 : pickSpawnAngle(state);
  const config = ENEMY_KINDS[kind];
  const baseR = orbitRadius(canvasW, canvasH);
  const r = kind === "boss" ? baseR * 1.1 : baseR;
  const id = state.nextEnemyId++;
  return {
    id,
    x: Math.cos(angle) * r,
    y: Math.sin(angle) * r,
    kind,
    hp: config.hp,
    maxHp: config.hp,
    state: "spawning",
    stateEnteredAt: nowMs,
    lastShotBeat: state.beat.currentBeat,
    telegraphMsLeft: 0,
    pulse: 0,
    orbitAngle: angle,
    burstShotsRemaining: 0,
    burstNextShotAtMs: 0,
    knockbackX: 0,
    knockbackY: 0,
    hitFlashMsLeft: 0,
    beatOffsetFraction: ((id - 1) % 4) * 0.25,
  };
}

export function shouldSpawnEnemy(
  state: EngineState,
  stage: StageConfig,
): boolean {
  if (stage.isBoss && state.bossSpawned) return false;
  let alive = 0;
  for (const e of state.enemies) {
    if (e.state === "alive" || e.state === "spawning") alive += 1;
  }
  const diffConfig = DIFFICULTIES[state.difficulty];
  const maxEnemies = stage.isBoss
    ? 1
    : Math.max(1, stage.maxEnemies + diffConfig.enemyCountDelta);
  if (alive >= maxEnemies) return false;
  const beatsSinceLastSpawn = state.beat.currentBeat - state.lastEnemySpawnBeat;
  return state.enemies.length === 0 || beatsSinceLastSpawn >= stage.spawnEveryBeats;
}

export interface EnemyShot {
  enemyId: number;
  x: number;
  y: number;
  angleOffset: number;
}

export interface EnemyTickResult {
  shotsFired: EnemyShot[];
  teleported: { enemyId: number; oldX: number; oldY: number }[];
}

function tryFireMainShot(
  enemy: Enemy,
  nowMs: number,
  dt: number,
  beatPeriodMs: number,
  result: EnemyTickResult,
): boolean {
  if (enemy.telegraphMsLeft <= 0) return false;
  enemy.telegraphMsLeft -= dt * 1000;
  if (enemy.telegraphMsLeft > 0) return true;

  enemy.telegraphMsLeft = 0;
  enemy.pulse = 1;

  const config = getEffectiveConfig(enemy);
  const totalShots = Math.max(1, config.burstShots);
  const angleOffset = angleOffsetForShot(enemy.kind, 0, totalShots);
  result.shotsFired.push({
    enemyId: enemy.id,
    x: enemy.x,
    y: enemy.y,
    angleOffset,
  });

  if (totalShots > 1) {
    enemy.burstShotsRemaining = totalShots - 1;
    enemy.burstNextShotAtMs = nowMs + config.burstIntervalBeatFraction * beatPeriodMs;
  }
  return true;
}

function tryFireBurstShot(
  enemy: Enemy,
  nowMs: number,
  beatPeriodMs: number,
  result: EnemyTickResult,
): boolean {
  if (enemy.burstShotsRemaining <= 0) return false;
  if (nowMs < enemy.burstNextShotAtMs) return true;

  enemy.pulse = 1;
  const config = getEffectiveConfig(enemy);
  const totalShots = Math.max(1, config.burstShots);
  const shotIndex = totalShots - enemy.burstShotsRemaining;
  const angleOffset = angleOffsetForShot(enemy.kind, shotIndex, totalShots);
  result.shotsFired.push({
    enemyId: enemy.id,
    x: enemy.x,
    y: enemy.y,
    angleOffset,
  });
  enemy.burstShotsRemaining -= 1;
  if (enemy.burstShotsRemaining > 0) {
    enemy.burstNextShotAtMs = nowMs + config.burstIntervalBeatFraction * beatPeriodMs;
  }
  return true;
}

function maybeStartTelegraph(enemy: Enemy, state: EngineState): void {
  const fireEvent = state.beat.isBeatTick || state.audioKickThisFrame;
  if (!fireEvent) return;
  const config = getEffectiveConfig(enemy);
  if (state.beat.currentBeat - enemy.lastShotBeat < config.beatsPerShot) return;
  const baseTelegraph = Math.min(TELEGRAPH_MS, state.beat.beatPeriodMs * 0.55);
  const offsetMs = enemy.beatOffsetFraction * state.beat.beatPeriodMs;
  enemy.telegraphMsLeft = baseTelegraph + offsetMs;
  enemy.lastShotBeat = state.beat.currentBeat;
}

function maybeTeleportPhantom(
  enemy: Enemy,
  state: EngineState,
  canvasW: number,
  canvasH: number,
  result: EnemyTickResult,
): void {
  if (enemy.kind !== "phantom") return;
  if (!state.beat.isBeatTick) return;
  if (state.beat.currentBeat % PHANTOM_TELEPORT_BEATS !== 0) return;
  result.teleported.push({ enemyId: enemy.id, oldX: enemy.x, oldY: enemy.y });
  enemy.orbitAngle = pickSpawnAngle(state);
  const r = orbitRadius(canvasW, canvasH);
  enemy.x = Math.cos(enemy.orbitAngle) * r;
  enemy.y = Math.sin(enemy.orbitAngle) * r;
  enemy.pulse = 1;
}

export function updateEnemies(
  state: EngineState,
  dt: number,
  nowMs: number,
  canvasW: number,
  canvasH: number,
): EnemyTickResult {
  const result: EnemyTickResult = { shotsFired: [], teleported: [] };
  const r = orbitRadius(canvasW, canvasH);
  const bossRadius = r * 1.1;

  for (const e of state.enemies) {
    if (e.state === "dead") continue;

    if (e.state === "spawning") {
      if (nowMs - e.stateEnteredAt >= ENEMY_SPAWN_DELAY_MS) {
        e.state = "alive";
        e.stateEnteredAt = nowMs;
      }
    } else if (e.state === "dying") {
      continue;
    }

    e.orbitAngle += ENEMY_ORBIT_DRIFT_RAD_PER_SEC * dt;
    const orbR = e.kind === "boss" ? bossRadius : r;
    e.x = Math.cos(e.orbitAngle) * orbR;
    e.y = Math.sin(e.orbitAngle) * orbR;
    e.pulse = Math.max(0, e.pulse - dt * 3);
    const decay = Math.max(0, 1 - dt * KNOCKBACK_DECAY_PER_SEC);
    e.knockbackX *= decay;
    e.knockbackY *= decay;
    e.hitFlashMsLeft = Math.max(0, e.hitFlashMsLeft - dt * 1000);

    if (e.state !== "alive") continue;

    maybeTeleportPhantom(e, state, canvasW, canvasH, result);

    if (tryFireMainShot(e, nowMs, dt, state.beat.beatPeriodMs, result)) continue;
    if (tryFireBurstShot(e, nowMs, state.beat.beatPeriodMs, result)) continue;
    maybeStartTelegraph(e, state);
  }
  return result;
}

export function killEnemy(enemy: Enemy, nowMs: number): void {
  enemy.state = "dying";
  enemy.stateEnteredAt = nowMs;
}
