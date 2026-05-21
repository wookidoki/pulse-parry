import type { Enemy, EngineState } from "../types";
import type { StageConfig } from "../config/stages";
import {
  ENEMY_ORBIT_DRIFT_RAD_PER_SEC,
  ENEMY_ORBIT_FACTOR,
  ENEMY_SPAWN_DELAY_MS,
  TELEGRAPH_MS,
} from "../config/tuning";
import { normalizeAngle } from "./geometry";

function orbitRadius(canvasW: number, canvasH: number): number {
  return Math.min(canvasW, canvasH) * ENEMY_ORBIT_FACTOR;
}

function pickSpawnAngle(state: EngineState): number {
  const taken = state.enemies
    .filter((e) => e.state !== "dead")
    .map((e) => e.orbitAngle);
  let bestAngle = 0;
  let bestSpread = -1;
  const candidates = 12;
  for (let i = 0; i < candidates; i++) {
    const candidate = (i / candidates) * Math.PI * 2 + state.beat.currentBeat * 0.1;
    let minDelta = Math.PI;
    for (const taken_a of taken) {
      const d = Math.abs(normalizeAngle(candidate - taken_a));
      if (d < minDelta) minDelta = d;
    }
    if (minDelta > bestSpread) {
      bestSpread = minDelta;
      bestAngle = candidate;
    }
  }
  return bestAngle;
}

export function createEnemy(
  state: EngineState,
  nowMs: number,
  canvasW: number,
  canvasH: number,
  stage: StageConfig,
): Enemy {
  const angle = pickSpawnAngle(state);
  const r = orbitRadius(canvasW, canvasH);
  return {
    id: state.nextEnemyId++,
    x: Math.cos(angle) * r,
    y: Math.sin(angle) * r,
    kind: "shooter",
    hp: stage.enemyHp,
    maxHp: stage.enemyHp,
    state: "spawning",
    stateEnteredAt: nowMs,
    lastShotBeat: state.beat.currentBeat,
    telegraphMsLeft: 0,
    pulse: 0,
    orbitAngle: angle,
  };
}

export function shouldSpawnEnemy(
  state: EngineState,
  stage: StageConfig,
): boolean {
  const alive = state.enemies.filter(
    (e) => e.state === "alive" || e.state === "spawning",
  ).length;
  if (alive >= stage.maxEnemies) return false;
  const beatsSinceLastSpawn = state.beat.currentBeat - state.lastEnemySpawnBeat;
  return state.enemies.length === 0 || beatsSinceLastSpawn >= stage.spawnEveryBeats;
}

export interface EnemyTickResult {
  shotsFired: { enemyId: number; x: number; y: number }[];
}

export function updateEnemies(
  state: EngineState,
  dt: number,
  nowMs: number,
  canvasW: number,
  canvasH: number,
  stage: StageConfig,
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

    if (e.state !== "alive") continue;

    if (e.telegraphMsLeft > 0) {
      e.telegraphMsLeft -= dt * 1000;
      if (e.telegraphMsLeft <= 0) {
        e.telegraphMsLeft = 0;
        e.pulse = 1;
        result.shotsFired.push({ enemyId: e.id, x: e.x, y: e.y });
      }
    } else if (
      state.beat.isBeatTick &&
      state.beat.currentBeat - e.lastShotBeat >= stage.beatsPerShot
    ) {
      e.telegraphMsLeft = TELEGRAPH_MS;
      e.lastShotBeat = state.beat.currentBeat;
    }
  }
  return result;
}

export function killEnemy(enemy: Enemy, nowMs: number): void {
  enemy.state = "dying";
  enemy.stateEnteredAt = nowMs;
}
