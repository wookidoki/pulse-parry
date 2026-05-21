import type { Enemy, EngineState, EnemyKind } from "../types";
import type { StageConfig } from "../config/stages";
import { ENEMY_KINDS } from "../config/enemy-kinds";
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
}

export interface EnemyTickResult {
  shotsFired: EnemyShot[];
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
  result.shotsFired.push({ enemyId: enemy.id, x: enemy.x, y: enemy.y });

  const config = ENEMY_KINDS[enemy.kind];
  if (config.burstShots > 1) {
    enemy.burstShotsRemaining = config.burstShots - 1;
    enemy.burstNextShotAtMs =
      nowMs + config.burstIntervalBeatFraction * beatPeriodMs;
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
  result.shotsFired.push({ enemyId: enemy.id, x: enemy.x, y: enemy.y });
  enemy.burstShotsRemaining -= 1;
  if (enemy.burstShotsRemaining > 0) {
    const config = ENEMY_KINDS[enemy.kind];
    enemy.burstNextShotAtMs =
      nowMs + config.burstIntervalBeatFraction * beatPeriodMs;
  }
  return true;
}

function maybeStartTelegraph(enemy: Enemy, state: EngineState): void {
  const fireEvent = state.beat.isBeatTick || state.audioKickThisFrame;
  if (!fireEvent) return;
  const config = ENEMY_KINDS[enemy.kind];
  if (state.beat.currentBeat - enemy.lastShotBeat < config.beatsPerShot) return;
  const baseTelegraph = Math.min(TELEGRAPH_MS, state.beat.beatPeriodMs * 0.55);
  const offsetMs = enemy.beatOffsetFraction * state.beat.beatPeriodMs;
  enemy.telegraphMsLeft = baseTelegraph + offsetMs;
  enemy.lastShotBeat = state.beat.currentBeat;
}

export function updateEnemies(
  state: EngineState,
  dt: number,
  nowMs: number,
  canvasW: number,
  canvasH: number,
): EnemyTickResult {
  const result: EnemyTickResult = { shotsFired: [] };
  const r = orbitRadius(canvasW, canvasH);

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
    e.x = Math.cos(e.orbitAngle) * r;
    e.y = Math.sin(e.orbitAngle) * r;
    e.pulse = Math.max(0, e.pulse - dt * 3);
    const decay = Math.max(0, 1 - dt * KNOCKBACK_DECAY_PER_SEC);
    e.knockbackX *= decay;
    e.knockbackY *= decay;
    e.hitFlashMsLeft = Math.max(0, e.hitFlashMsLeft - dt * 1000);

    if (e.state !== "alive") continue;

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
