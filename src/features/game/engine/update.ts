import type { EngineCallbacks, EngineState, PlayerInput } from "../types";
import { FINAL_STAGE_INDEX, STAGES, currentStage } from "../config/stages";
import {
  BG_PULSE_DECAY_PER_SEC,
  SCORE_PARRY_PER_BULLET,
  SHAKE_DECAY_PER_SEC,
  SHAKE_ON_ENEMY_KILL,
  SHAKE_ON_PLAYER_HIT,
  SHAKE_ON_REFLECT,
  SHAKE_ON_STAGE_UP,
} from "../config/tuning";
import { createBeatClock, setBpm, tickBeat } from "./beat";
import {
  applyBulletEffects,
  cleanupBullets,
  createBullet,
  reflectAbsorbedBullets,
  updateBullets,
} from "./bullet";
import {
  createEnemy,
  shouldSpawnEnemy,
  updateEnemies,
} from "./enemy";
import { BURSTS, emitBurst, updateParticles } from "./particles";
import * as sfx from "../audio";

export function createEngineState(nowMs: number): EngineState {
  const stage = STAGES[0];
  return {
    enemies: [],
    bullets: [],
    particles: [],
    nextEnemyId: 1,
    nextBulletId: 1,
    parryHeld: false,
    parryStartedAt: 0,
    aimAngle: 0,
    beat: createBeatClock(stage.bpm, nowMs),
    stageIndex: 0,
    stageStartMs: nowMs,
    lastEnemySpawnBeat: -999,
    shake: 0,
    bgPulse: 0,
  };
}

export interface UpdateContext extends EngineCallbacks {
  state: EngineState;
  input: PlayerInput;
  nowMs: number;
  dt: number;
  canvasW: number;
  canvasH: number;
}

function applyShake(state: EngineState, amount: number): void {
  if (amount > state.shake) state.shake = amount;
}

function advanceStage(state: EngineState, nowMs: number, cb: EngineCallbacks): boolean {
  const stage = currentStage(state.stageIndex);
  const elapsed = nowMs - state.stageStartMs;
  if (state.stageIndex >= FINAL_STAGE_INDEX || elapsed < stage.durationMs) {
    return false;
  }
  state.stageIndex += 1;
  state.stageStartMs = nowMs;
  state.lastEnemySpawnBeat = state.beat.currentBeat;
  setBpm(state.beat, STAGES[state.stageIndex].bpm, nowMs);
  applyShake(state, SHAKE_ON_STAGE_UP);
  emitBurst(state, 0, 0, BURSTS.stageUp());
  sfx.playStageUp();
  cb.onStageUp(state.stageIndex);
  return true;
}

function handleParryInputTransitions(state: EngineState, input: PlayerInput, nowMs: number) {
  const justPressed = input.parryHeld && !state.parryHeld;
  const justReleased = !input.parryHeld && state.parryHeld;
  state.parryHeld = input.parryHeld;
  if (justPressed) state.parryStartedAt = nowMs;
  return { justReleased };
}

function spawnEnemyIfNeeded(
  state: EngineState,
  nowMs: number,
  canvasW: number,
  canvasH: number,
): void {
  const stage = currentStage(state.stageIndex);
  if (!shouldSpawnEnemy(state, stage)) return;
  state.enemies.push(createEnemy(state, nowMs, canvasW, canvasH, stage));
  state.lastEnemySpawnBeat = state.beat.currentBeat;
}

function processEnemyShots(
  state: EngineState,
  shots: { enemyId: number; x: number; y: number }[],
  nowMs: number,
): void {
  if (shots.length === 0) return;
  const stage = currentStage(state.stageIndex);
  const enemyById = new Map(state.enemies.map((e) => [e.id, e]));
  for (const s of shots) {
    const enemy = enemyById.get(s.enemyId);
    if (!enemy) continue;
    state.bullets.push(createBullet(state, enemy, nowMs, stage.bulletSpeed));
    sfx.playEnemyShoot();
  }
}

function handleParryRelease(
  state: EngineState,
  justReleased: boolean,
  nowMs: number,
  cb: EngineCallbacks,
): void {
  if (!justReleased) return;
  const fired = reflectAbsorbedBullets(state);
  if (fired > 0) {
    cb.onScore(SCORE_PARRY_PER_BULLET * fired);
    cb.onCombo(fired);
    applyShake(state, SHAKE_ON_REFLECT);
    sfx.playReflect();
  } else if (nowMs - state.parryStartedAt > 80) {
    cb.onComboBreak();
  }
}

function cleanupEnemies(state: EngineState, nowMs: number): void {
  state.enemies = state.enemies.filter((e) => {
    if (e.state !== "dying") return e.state !== "dead";
    return nowMs - e.stateEnteredAt < 280;
  });
}

function checkVictory(state: EngineState, nowMs: number, cb: EngineCallbacks): void {
  if (state.stageIndex !== FINAL_STAGE_INDEX) return;
  const elapsed = nowMs - state.stageStartMs;
  if (elapsed < STAGES[FINAL_STAGE_INDEX].durationMs) return;
  if (state.enemies.length > 0) return;
  cb.onVictory();
}

export function update(ctx: UpdateContext): void {
  const { state, input, nowMs, dt, canvasW, canvasH } = ctx;
  state.aimAngle = Math.atan2(input.aimY, input.aimX);

  tickBeat(state.beat, nowMs);
  if (state.beat.isBeatTick) {
    state.bgPulse = 1;
    sfx.playBeat(state.beat.currentBeat);
  }

  advanceStage(state, nowMs, ctx);

  const { justReleased } = handleParryInputTransitions(state, input, nowMs);

  spawnEnemyIfNeeded(state, nowMs, canvasW, canvasH);

  const enemyResult = updateEnemies(
    state,
    dt,
    nowMs,
    canvasW,
    canvasH,
    currentStage(state.stageIndex),
  );
  processEnemyShots(state, enemyResult.shotsFired, nowMs);

  const bulletEffects = updateBullets(state, dt, canvasW, canvasH, nowMs);
  for (let i = 0; i < bulletEffects.parriedCount; i++) sfx.playParryHit();
  if (bulletEffects.playerHit) {
    applyShake(state, SHAKE_ON_PLAYER_HIT);
    sfx.playPlayerHit();
  }
  for (let i = 0; i < bulletEffects.enemyKills.length; i++) {
    applyShake(state, SHAKE_ON_ENEMY_KILL);
    sfx.playEnemyDie();
  }
  applyBulletEffects(bulletEffects, ctx);

  handleParryRelease(state, justReleased, nowMs, ctx);

  updateParticles(state, dt);

  state.shake = Math.max(0, state.shake - dt * SHAKE_DECAY_PER_SEC);
  state.bgPulse = Math.max(0, state.bgPulse - dt * BG_PULSE_DECAY_PER_SEC);

  cleanupBullets(state);
  cleanupEnemies(state, nowMs);

  checkVictory(state, nowMs, ctx);
}
