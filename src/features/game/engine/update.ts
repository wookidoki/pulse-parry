import type { EngineCallbacks, EngineState, PlayerInput } from "../types";
import { FINAL_STAGE_INDEX, STAGES, currentStage } from "../config/stages";
import { tickKickDetection } from "../audioAnalysis";
import {
  BG_PULSE_DECAY_PER_SEC,
  CAMERA_ZOOM_LERP_PER_SEC,
  CAMERA_ZOOM_PUNCH,
  CHARGE_THRESHOLD_MS,
  HIT_STOP_MS_ENEMY_KILL,
  HIT_STOP_MS_PARRY,
  HIT_STOP_MS_PLAYER_HIT,
  HIT_STOP_MS_REFLECT_HIT,
  MASH_COOLDOWN_MS,
  PARRY_HALF_CONE_RAD,
  PLAYER_MAX_DIST,
  PLAYER_MOVE_SPEED,
  SCORE_CHARGED_BONUS,
  SCORE_PARRY_PER_BULLET,
  SCORE_PERFECT_BONUS,
  SHAKE_DECAY_PER_SEC,
  SHAKE_ON_ENEMY_KILL,
  SHAKE_ON_PLAYER_HIT,
  SHAKE_ON_REFLECT,
  SHAKE_ON_STAGE_UP,
  TAP_THRESHOLD_MS,
} from "../config/tuning";
import { PALETTE } from "../config/palette";
import { createBeatClock, setBpm, tickBeat } from "./beat";
import {
  applyBulletEffects,
  autoCounterAbsorbedBullets,
  cleanupBullets,
  createBullet,
  reflectAbsorbedBullets,
  updateBullets,
} from "./bullet";
import {
  createEnemy,
  shouldSpawnEnemy,
  updateEnemies,
  type EnemyShot,
} from "./enemy";
import { BURSTS, emitBurst, updateParticles } from "./particles";
import { bpmAt } from "./tempo";
import {
  spawnScorePop,
  spawnScreenFlash,
  spawnShockwave,
  spawnSlash,
  updateEffects,
} from "./effects";
import * as sfx from "../audio";

const BPM_CHANGE_EPSILON = 0.6;

export function createEngineState(nowMs: number): EngineState {
  const stage = STAGES[0];
  const initialBpm = stage.tempoMap[0]?.bpm ?? 120;
  return {
    enemies: [],
    bullets: [],
    particles: [],
    scorePops: [],
    flashes: [],
    slashes: [],
    shockwaves: [],
    nextEnemyId: 1,
    nextBulletId: 1,
    parryHeld: false,
    parryStartedAt: 0,
    aimAngle: 0,
    playerX: 0,
    playerY: 0,
    beat: createBeatClock(initialBpm, nowMs),
    stageIndex: 0,
    stageStartMs: nowMs,
    lastEnemySpawnBeat: -999,
    shake: 0,
    bgPulse: 0,
    hitStopMsLeft: 0,
    cameraZoom: 1,
    parryCooldownMsLeft: 0,
    audioKickThisFrame: false,
    difficulty: "normal",
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

function applyHitStop(state: EngineState, ms: number): void {
  if (ms > state.hitStopMsLeft) state.hitStopMsLeft = ms;
}

function stageProgress(state: EngineState, nowMs: number): number {
  const stage = currentStage(state.stageIndex);
  return Math.min(1, (nowMs - state.stageStartMs) / stage.durationMs);
}

function tickTempoCurve(state: EngineState, nowMs: number): void {
  const stage = currentStage(state.stageIndex);
  const target = bpmAt(stage.tempoMap, stageProgress(state, nowMs));
  if (Math.abs(target - state.beat.bpm) > BPM_CHANGE_EPSILON) {
    setBpm(state.beat, target, nowMs);
  }
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
  const next = STAGES[state.stageIndex];
  setBpm(state.beat, next.tempoMap[0]?.bpm ?? 120, nowMs);
  applyShake(state, SHAKE_ON_STAGE_UP);
  emitBurst(state, 0, 0, BURSTS.stageUp());
  spawnScreenFlash(state, PALETTE.cyan, 0.5);
  sfx.playStageUp();
  cb.onStageUp(state.stageIndex);
  return true;
}

function handleParryInputTransitions(
  state: EngineState,
  input: PlayerInput,
  nowMs: number,
  dt: number,
) {
  state.parryCooldownMsLeft = Math.max(0, state.parryCooldownMsLeft - dt * 1000);

  if (state.parryCooldownMsLeft > 0) {
    if (state.parryHeld) state.parryHeld = false;
    return { justReleased: false };
  }

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
  shots: EnemyShot[],
  nowMs: number,
): void {
  if (shots.length === 0) return;
  const enemyById = new Map(state.enemies.map((e) => [e.id, e]));
  for (const s of shots) {
    const enemy = enemyById.get(s.enemyId);
    if (!enemy) continue;
    state.bullets.push(createBullet(state, enemy, nowMs));
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
  state.parryCooldownMsLeft = MASH_COOLDOWN_MS;
  const heldMs = nowMs - state.parryStartedAt;
  const isTap = heldMs < TAP_THRESHOLD_MS;
  const isCharged = heldMs >= CHARGE_THRESHOLD_MS;

  if (isCharged) {
    for (const b of state.bullets) {
      if (b.state === "absorbed") b.isCharged = true;
    }
  }

  const result = isTap
    ? autoCounterAbsorbedBullets(state)
    : reflectAbsorbedBullets(state);

  if (result.count > 0) {
    cb.onScore(SCORE_PARRY_PER_BULLET * result.count);
    cb.onCombo(result.count);
    applyShake(state, SHAKE_ON_REFLECT);
    applyHitStop(state, HIT_STOP_MS_PARRY);
    sfx.playReflect();
    sfx.playSlashWoosh();
    const slashColor = result.perfectCount > 0
      ? "#ffffff"
      : isCharged
        ? PALETTE.red
        : isTap
          ? PALETTE.yellow
          : PALETTE.cyan;
    spawnSlash(state, state.aimAngle, PARRY_HALF_CONE_RAD, nowMs, slashColor);

    if (isCharged) {
      cb.onScore(SCORE_CHARGED_BONUS * result.count);
      applyShake(state, 12);
      spawnScreenFlash(state, PALETTE.red, 0.32);
      spawnScorePop(
        state,
        state.playerX,
        state.playerY - 32,
        `CHARGED ×${result.count}`,
        PALETTE.red,
        1.2,
      );
    }

    if (result.perfectCount > 0) {
      cb.onScore(SCORE_PERFECT_BONUS * result.perfectCount);
      cb.onCombo(result.perfectCount);
      spawnScreenFlash(state, "#ffffff", 0.35);
      spawnScorePop(
        state,
        state.playerX,
        state.playerY - 50,
        result.perfectCount > 1 ? `PERFECT ×${result.perfectCount}` : "PERFECT!",
        "#ffffff",
        1.4,
      );
      sfx.playSlashWoosh();
    }
    return;
  }
  if (heldMs > 80) cb.onComboBreak();
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

function processHitStop(state: EngineState, dt: number): boolean {
  if (state.hitStopMsLeft <= 0) return false;
  state.hitStopMsLeft = Math.max(0, state.hitStopMsLeft - dt * 1000);
  return true;
}

function updateCameraZoom(state: EngineState, dt: number): void {
  const target = state.hitStopMsLeft > 0 ? CAMERA_ZOOM_PUNCH : 1;
  const lerp = Math.min(1, dt * CAMERA_ZOOM_LERP_PER_SEC);
  state.cameraZoom += (target - state.cameraZoom) * lerp;
}

function updatePlayerMovement(state: EngineState, input: PlayerInput, dt: number): void {
  const mx = (input.moveRight ? 1 : 0) - (input.moveLeft ? 1 : 0);
  const my = (input.moveDown ? 1 : 0) - (input.moveUp ? 1 : 0);
  if (mx !== 0 || my !== 0) {
    const mag = Math.hypot(mx, my);
    state.playerX += (mx / mag) * PLAYER_MOVE_SPEED * dt;
    state.playerY += (my / mag) * PLAYER_MOVE_SPEED * dt;
  }
  const dist = Math.hypot(state.playerX, state.playerY);
  if (dist > PLAYER_MAX_DIST) {
    state.playerX *= PLAYER_MAX_DIST / dist;
    state.playerY *= PLAYER_MAX_DIST / dist;
  }
}

function recomputeAimAngle(state: EngineState, input: PlayerInput): void {
  const dx = input.rawMouseX - state.playerX;
  const dy = input.rawMouseY - state.playerY;
  state.aimAngle = Math.atan2(dy, dx);
}

export function update(ctx: UpdateContext): void {
  const { state, input, nowMs, dt, canvasW, canvasH } = ctx;

  state.shake = Math.max(0, state.shake - dt * SHAKE_DECAY_PER_SEC);
  state.bgPulse = Math.max(0, state.bgPulse - dt * BG_PULSE_DECAY_PER_SEC);
  updateCameraZoom(state, dt);

  if (processHitStop(state, dt)) {
    state.parryHeld = input.parryHeld;
    recomputeAimAngle(state, input);
    return;
  }

  updatePlayerMovement(state, input, dt);
  recomputeAimAngle(state, input);

  tickTempoCurve(state, nowMs);
  tickBeat(state.beat, nowMs);
  state.audioKickThisFrame = tickKickDetection(state.stageIndex, nowMs);
  if (state.beat.isBeatTick || state.audioKickThisFrame) {
    state.bgPulse = 1;
  }

  advanceStage(state, nowMs, ctx);

  const { justReleased } = handleParryInputTransitions(state, input, nowMs, dt);

  spawnEnemyIfNeeded(state, nowMs, canvasW, canvasH);

  const enemyResult = updateEnemies(state, dt, nowMs, canvasW, canvasH);
  processEnemyShots(state, enemyResult.shotsFired, nowMs);

  const bulletEffects = updateBullets(state, dt, canvasW, canvasH, nowMs);
  for (let i = 0; i < bulletEffects.parriedCount; i++) sfx.playParryHit();
  if (bulletEffects.damageDealt > 0) {
    applyShake(state, SHAKE_ON_PLAYER_HIT);
    applyHitStop(state, HIT_STOP_MS_PLAYER_HIT);
    spawnScreenFlash(state, PALETTE.red, 0.5);
    sfx.playPlayerHit();
  }
  if (bulletEffects.reflectHits.length > 0) {
    applyHitStop(state, HIT_STOP_MS_REFLECT_HIT);
  }
  for (const kill of bulletEffects.enemyKills) {
    applyShake(state, SHAKE_ON_ENEMY_KILL);
    applyHitStop(state, HIT_STOP_MS_ENEMY_KILL);
    spawnScreenFlash(state, PALETTE.yellow, 0.25);
    spawnShockwave(state, kill.x, kill.y, nowMs, PALETTE.yellow);
    sfx.playEnemyDie();
  }
  if (bulletEffects.nearMisses > 0) {
    spawnScreenFlash(state, PALETTE.cyan, 0.22);
    applyShake(state, 4);
    ctx.onScore(20);
  }
  applyBulletEffects(bulletEffects, ctx);

  handleParryRelease(state, justReleased, nowMs, ctx);

  updateParticles(state, dt);
  updateEffects(state, dt, nowMs);

  cleanupBullets(state);
  cleanupEnemies(state, nowMs);

  checkVictory(state, nowMs, ctx);
}
