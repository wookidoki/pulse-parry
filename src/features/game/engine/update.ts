import type { EngineCallbacks, EngineState, PlayerInput } from "../types";
import { KIND_RACE } from "../types";
import { FINAL_STAGE_INDEX, STAGES, currentStage } from "../config/stages";
import { getDetectedBpm, tickKickDetection } from "../audioAnalysis";
import { getCurrentTrackIndex, setBossPhase } from "../music";
import { CHARACTERS, type CharacterId } from "../config/characters";
import { MODIFIERS, type RunModifierId } from "../config/modifiers";
import { maybeSpawnHazard, updateHazards } from "./hazards";
import {
  BG_PULSE_DECAY_PER_SEC,
  CAMERA_ZOOM_LERP_PER_SEC,
  CAMERA_ZOOM_PUNCH,
  CHARGE_THRESHOLD_MS,
  DASH_DURATION_MS,
  HIT_STOP_MS_ENEMY_KILL,
  HIT_STOP_MS_PARRY,
  HIT_STOP_MS_PLAYER_HIT,
  HIT_STOP_MS_REFLECT_HIT,
  MASH_COOLDOWN_MS,
  HEAL_BULLET_SPEED,
  HEAL_COMBO_MILESTONES,
  HEAL_SPAWN_INTERVAL_MS,
  PLAYER_MAX_DIST,
  PLAYER_MOVE_SPEED,
  SCORE_CHARGED_BONUS,
  SCORE_HEAL_CATCH,
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
  createHealItem,
  reflectAbsorbedBullets,
  updateBullets,
} from "./bullet";
import {
  createEnemy,
  createShard,
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

export function createEngineState(
  nowMs: number,
  startStage = 0,
  difficulty: EngineState["difficulty"] = "normal",
  characterId: CharacterId = "ninja",
  modifierId: RunModifierId = "none",
  tutorialMode = false,
  endlessMode = false,
): EngineState {
  const safeStage = Math.max(0, Math.min(STAGES.length - 1, startStage));
  const stage = STAGES[safeStage];
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
    stageIndex: safeStage,
    stageStartMs: nowMs,
    lastEnemySpawnBeat: -999,
    shake: 0,
    bgPulse: 0,
    hitStopMsLeft: 0,
    cameraZoom: 1,
    parryCooldownMsLeft: 0,
    audioKickThisFrame: false,
    difficulty,
    lastHealSpawnAtMs: nowMs,
    lastHealMilestone: 0,
    bossSpawned: false,
    bossPhase: 0,
    bossPhaseZoomMsLeft: 0,
    dashActiveMsLeft: 0,
    dashCooldownMsLeft: 0,
    dashDirX: 0,
    dashDirY: 0,
    dashWasPressed: false,
    bladeSwingMsLeft: 0,
    bladeSwingDurationMs: 0,
    bladeSwingFromAngle: 0,
    bladeSwingToAngle: 0,
    characterId,
    modifierId,
    hazards: [],
    nextHazardAtMs: nowMs + 18000,
    tutorialMode,
    countdownMsLeft: 2300,
    countdownLastSecond: 3,
    perfectFlashMsLeft: 0,
    endlessMode,
    endlessLoop: 0,
  };
}

// Per-loop difficulty multiplier in endless mode. Capped at +60% so it
// stays survivable but distinctly harder each loop.
export function endlessLoopMul(state: EngineState): number {
  if (!state.endlessMode) return 1;
  return 1 + Math.min(0.6, state.endlessLoop * 0.08);
}

function tickBossPhase(state: EngineState, cb: EngineCallbacks): void {
  if (!state.bossSpawned) return;
  const boss = state.enemies.find((e) => e.kind === "boss" && e.state !== "dead");
  if (!boss) return;
  const hpFrac = Math.max(0, boss.hp / boss.maxHp);
  const phase = hpFrac > 0.66 ? 0 : hpFrac > 0.33 ? 1 : 2;
  if (phase !== state.bossPhase) {
    state.bossPhase = phase;
    setBossPhase(phase);
    cb.onBossPhaseChange(phase);
    state.bossPhaseZoomMsLeft = 520;
    applyShake(state, 18);
  }
}

function tickCountdown(state: EngineState, dt: number): boolean {
  if (state.countdownMsLeft <= 0) return false;
  state.countdownMsLeft -= dt * 1000;
  const secondNow = Math.max(0, Math.ceil(state.countdownMsLeft / 1000));
  if (secondNow !== state.countdownLastSecond) {
    state.countdownLastSecond = secondNow;
    sfx.playCountdownBeep(secondNow === 0);
  }
  return state.countdownMsLeft > 0;
}

export interface UpdateContext extends EngineCallbacks {
  state: EngineState;
  input: PlayerInput;
  nowMs: number;
  dt: number;
  canvasW: number;
  canvasH: number;
  currentComboHint: number;
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
  const detected = getDetectedBpm();
  if (detected >= 60 && detected <= 240) {
    const smoothed = state.beat.bpm * 0.85 + detected * 0.15;
    if (Math.abs(smoothed - state.beat.bpm) > BPM_CHANGE_EPSILON) {
      setBpm(state.beat, smoothed, nowMs);
    }
    return;
  }
  const stage = currentStage(state.stageIndex);
  const target = bpmAt(stage.tempoMap, stageProgress(state, nowMs));
  if (Math.abs(target - state.beat.bpm) > BPM_CHANGE_EPSILON) {
    setBpm(state.beat, target, nowMs);
  }
}

function advanceStage(state: EngineState, nowMs: number, cb: EngineCallbacks): boolean {
  const stage = currentStage(state.stageIndex);
  const elapsed = nowMs - state.stageStartMs;
  if (elapsed < stage.durationMs) return false;

  // Endless: when reaching the second-to-last stage (just before the boss),
  // loop back to stage 1 instead, bumping the difficulty boost.
  if (state.endlessMode) {
    const isLastNonBoss = state.stageIndex === FINAL_STAGE_INDEX - 1;
    if (isLastNonBoss) {
      state.stageIndex = 1;
      state.endlessLoop += 1;
      cb.onEndlessLoop(state.endlessLoop);
    } else {
      state.stageIndex += 1;
      // Skip boss stage entirely in endless mode.
      if (state.stageIndex === FINAL_STAGE_INDEX) {
        state.stageIndex = 1;
        state.endlessLoop += 1;
        cb.onEndlessLoop(state.endlessLoop);
      }
    }
  } else {
    if (state.stageIndex >= FINAL_STAGE_INDEX) return false;
    state.stageIndex += 1;
  }
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
  cb: EngineCallbacks,
): void {
  const stage = currentStage(state.stageIndex);
  if (!shouldSpawnEnemy(state, stage)) return;
  const enemy = createEnemy(state, nowMs, canvasW, canvasH, stage);
  state.enemies.push(enemy);
  state.lastEnemySpawnBeat = state.beat.currentBeat;
  if (enemy.kind === "boss") {
    state.bossSpawned = true;
    cb.onBossAppear();
  }
}


function spawnHealIfNeeded(
  state: EngineState,
  nowMs: number,
  canvasW: number,
  canvasH: number,
  comboNow: number,
): void {
  const dueByTime = nowMs - state.lastHealSpawnAtMs >= HEAL_SPAWN_INTERVAL_MS;
  let dueByCombo = 0;
  for (const m of HEAL_COMBO_MILESTONES) {
    if (comboNow >= m && state.lastHealMilestone < m) {
      dueByCombo = m;
    }
  }
  if (!dueByTime && dueByCombo === 0) return;
  state.bullets.push(
    createHealItem(state, nowMs, canvasW, canvasH, HEAL_BULLET_SPEED),
  );
  state.lastHealSpawnAtMs = nowMs;
  if (dueByCombo > 0) state.lastHealMilestone = dueByCombo;
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
    const bullet = createBullet(state, enemy, nowMs, s.angleOffset);
    state.bullets.push(bullet);
    const race = KIND_RACE[enemy.kind];
    if (race === "core") {
      sfx.playBossShoot();
    } else if (race === "drone") {
      if (bullet.kind === "heavy") sfx.playDroneShootHeavy();
      else sfx.playDroneShoot();
    } else if (race === "virus") {
      sfx.playVirusShoot();
    } else {
      sfx.playOmnicShoot();
    }
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
  const modConfig = MODIFIERS[state.modifierId];
  const isTap = heldMs < TAP_THRESHOLD_MS && !modConfig.forcedHold;
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
    cb.onParries(result.count, result.perfectCount);
    applyShake(state, SHAKE_ON_REFLECT);
    applyHitStop(state, HIT_STOP_MS_PARRY);
    sfx.playReflect();
    sfx.playSlashWoosh();
    triggerBladeSwing(state, isCharged);
    const slashColor = result.perfectCount > 0
      ? "#ffffff"
      : isCharged
        ? PALETTE.red
        : isTap
          ? PALETTE.yellow
          : PALETTE.cyan;
    spawnSlash(state, state.aimAngle, CHARACTERS[state.characterId].coneAngleRad, nowMs, slashColor);

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
      spawnScreenFlash(state, "#ffffff", 0.45);
      applyHitStop(state, HIT_STOP_MS_PARRY * 1.6);
      state.perfectFlashMsLeft = 280;
      spawnScorePop(
        state,
        state.playerX,
        state.playerY - 50,
        result.perfectCount > 1 ? `PERFECT ×${result.perfectCount}` : "PERFECT!",
        "#ffffff",
        1.4,
      );
      sfx.playPerfectChime();
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
  const stage = STAGES[FINAL_STAGE_INDEX];
  if (stage.isBoss) {
    if (!state.bossSpawned) return;
    const bossExists = state.enemies.some((e) => e.kind === "boss");
    if (!bossExists) cb.onVictory();
    return;
  }
  const elapsed = nowMs - state.stageStartMs;
  if (elapsed < stage.durationMs) return;
  if (state.enemies.length > 0) return;
  cb.onVictory();
}

function processHitStop(state: EngineState, dt: number): boolean {
  if (state.hitStopMsLeft <= 0) return false;
  state.hitStopMsLeft = Math.max(0, state.hitStopMsLeft - dt * 1000);
  return true;
}

function updateCameraZoom(state: EngineState, dt: number): void {
  let target = state.hitStopMsLeft > 0 ? CAMERA_ZOOM_PUNCH : 1;
  state.bossPhaseZoomMsLeft = Math.max(0, state.bossPhaseZoomMsLeft - dt * 1000);
  if (state.bossPhaseZoomMsLeft > 0) {
    const progress = 1 - state.bossPhaseZoomMsLeft / 520;
    const wave = Math.sin(progress * Math.PI);
    target = Math.max(target, 1 + 0.14 * wave);
  }
  const lerp = Math.min(1, dt * CAMERA_ZOOM_LERP_PER_SEC);
  state.cameraZoom += (target - state.cameraZoom) * lerp;
}

function triggerBladeSwing(state: EngineState, isCharged: boolean): void {
  const char = CHARACTERS[state.characterId];
  const duration = isCharged ? 340 : 240;
  const cone = char.coneAngleRad;
  const sign = Math.random() < 0.5 ? -1 : 1;
  state.bladeSwingMsLeft = duration;
  state.bladeSwingDurationMs = duration;
  state.bladeSwingFromAngle = state.aimAngle + sign * cone * 1.1;
  state.bladeSwingToAngle = state.aimAngle - sign * cone * 1.1;
}

function processDashTrigger(state: EngineState, input: PlayerInput): void {
  state.dashActiveMsLeft = Math.max(0, state.dashActiveMsLeft);
  state.dashCooldownMsLeft = Math.max(0, state.dashCooldownMsLeft);

  const justPressed = input.dashPressed && !state.dashWasPressed;
  state.dashWasPressed = input.dashPressed;
  if (!justPressed) return;
  if (state.dashActiveMsLeft > 0 || state.dashCooldownMsLeft > 0) return;

  const char = CHARACTERS[state.characterId];
  const dx = input.rawMouseX - state.playerX;
  const dy = input.rawMouseY - state.playerY;
  const mag = Math.hypot(dx, dy) || 1;
  state.dashDirX = dx / mag;
  state.dashDirY = dy / mag;
  state.dashActiveMsLeft = DASH_DURATION_MS;
  state.dashCooldownMsLeft = char.dashCooldownMs;
  sfx.playDashWhoosh();
}

function updatePlayerMovement(state: EngineState, input: PlayerInput, dt: number): void {
  state.dashActiveMsLeft = Math.max(0, state.dashActiveMsLeft - dt * 1000);
  state.dashCooldownMsLeft = Math.max(0, state.dashCooldownMsLeft - dt * 1000);

  const char = CHARACTERS[state.characterId];

  if (state.dashActiveMsLeft > 0) {
    state.playerX += state.dashDirX * char.dashSpeed * dt;
    state.playerY += state.dashDirY * char.dashSpeed * dt;
    const dashAngle = Math.atan2(state.dashDirY, state.dashDirX);
    emitBurst(state, state.playerX, state.playerY, BURSTS.dashTrail(char.accentColor, dashAngle));
  } else {
    const mx = (input.moveRight ? 1 : 0) - (input.moveLeft ? 1 : 0);
    const my = (input.moveDown ? 1 : 0) - (input.moveUp ? 1 : 0);
    if (mx !== 0 || my !== 0) {
      const mag = Math.hypot(mx, my);
      state.playerX += (mx / mag) * PLAYER_MOVE_SPEED * dt;
      state.playerY += (my / mag) * PLAYER_MOVE_SPEED * dt;
    }
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
  state.bladeSwingMsLeft = Math.max(0, state.bladeSwingMsLeft - dt * 1000);
  state.perfectFlashMsLeft = Math.max(0, state.perfectFlashMsLeft - dt * 1000);
  updateCameraZoom(state, dt);

  if (processHitStop(state, dt)) {
    state.parryHeld = input.parryHeld;
    recomputeAimAngle(state, input);
    return;
  }

  if (tickCountdown(state, dt)) {
    recomputeAimAngle(state, input);
    return;
  }

  processDashTrigger(state, input);
  updatePlayerMovement(state, input, dt);
  recomputeAimAngle(state, input);

  if (!state.tutorialMode) maybeSpawnHazard(state, nowMs);
  const hazardInfo = updateHazards(state, nowMs);
  if (hazardInfo.damaged) {
    applyShake(state, SHAKE_ON_PLAYER_HIT);
    applyHitStop(state, HIT_STOP_MS_PLAYER_HIT);
    spawnScreenFlash(state, PALETTE.red, 0.55);
    if (hazardInfo.hazardKind === "missile") sfx.playMissileExplode();
    else sfx.playPlayerHit();
    ctx.onDamage(1);
  }
  for (const h of state.hazards) {
    if (h.state === "telegraph" && nowMs - h.startedAtMs < 30) {
      if (h.kind === "missile") sfx.playMissileTelegraph();
      else if (h.kind === "shockwave") sfx.playShockwaveTelegraph();
    } else if (
      h.state === "active" &&
      nowMs - h.startedAtMs < 30 &&
      h.kind === "shockwave"
    ) {
      sfx.playShockwave();
    }
  }

  tickTempoCurve(state, nowMs);
  tickBeat(state.beat, nowMs);
  state.audioKickThisFrame = tickKickDetection(getCurrentTrackIndex(), nowMs);
  if (state.beat.isBeatTick || state.audioKickThisFrame) {
    state.bgPulse = 1;
  }

  advanceStage(state, nowMs, ctx);

  const { justReleased } = handleParryInputTransitions(state, input, nowMs, dt);

  spawnEnemyIfNeeded(state, nowMs, canvasW, canvasH, ctx);
  spawnHealIfNeeded(state, nowMs, canvasW, canvasH, ctx.currentComboHint);
  tickBossPhase(state, ctx);

  const enemyResult = updateEnemies(state, dt, nowMs, canvasW, canvasH);
  processEnemyShots(state, enemyResult.shotsFired, nowMs);
  for (const tp of enemyResult.teleported) {
    emitBurst(state, tp.oldX, tp.oldY, BURSTS.parryCatch());
  }
  for (const hp of enemyResult.healerPulses) {
    emitBurst(state, hp.fromX, hp.fromY, BURSTS.healCatch());
    emitBurst(state, hp.toX, hp.toY, BURSTS.healCatch());
    spawnScorePop(state, hp.toX, hp.toY - 16, "+1 HP", "#1cf78f", 0.7);
  }

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
  if (bulletEffects.enemyKills.length > 0) {
    ctx.onEnemyKilled(bulletEffects.enemyKills.length);
  }
  for (const kill of bulletEffects.enemyKills) {
    const race = KIND_RACE[kill.kind];
    const killColor =
      race === "omnic"
        ? PALETTE.magenta
        : race === "virus"
          ? PALETTE.cyan
          : race === "drone"
            ? PALETTE.purple
            : PALETTE.red;
    const isBoss = kill.kind === "boss";
    applyShake(state, isBoss ? SHAKE_ON_ENEMY_KILL * 2.5 : SHAKE_ON_ENEMY_KILL);
    applyHitStop(state, isBoss ? HIT_STOP_MS_ENEMY_KILL * 1.8 : HIT_STOP_MS_ENEMY_KILL);
    spawnScreenFlash(state, "#ffffff", isBoss ? 0.55 : 0.32);
    spawnScreenFlash(state, killColor, isBoss ? 0.45 : 0.28);
    spawnShockwave(state, kill.x, kill.y, nowMs, killColor);
    if (isBoss) {
      spawnShockwave(state, kill.x, kill.y, nowMs + 80, "#ffffff");
      spawnShockwave(state, kill.x, kill.y, nowMs + 160, PALETTE.yellow);
    }
    emitBurst(state, kill.x, kill.y, BURSTS.enemyDie());
    if (race === "core") sfx.playBossDie();
    else if (race === "drone") sfx.playDroneDie();
    else if (race === "virus") sfx.playVirusDie();
    else sfx.playOmnicDie();

    if (kill.kind === "splitter") {
      state.enemies.push(
        createShard(state, nowMs, kill.x, kill.y, 0, Math.PI * 0.55),
      );
      state.enemies.push(
        createShard(state, nowMs, kill.x, kill.y, 0, -Math.PI * 0.55),
      );
    }
  }

  for (const det of enemyResult.bomberDetonations) {
    applyShake(state, 22);
    applyHitStop(state, 90);
    spawnScreenFlash(state, "#ffffff", 0.45);
    spawnScreenFlash(state, PALETTE.red, 0.4);
    spawnShockwave(state, det.x, det.y, nowMs, PALETTE.red);
    spawnShockwave(state, det.x, det.y, nowMs + 50, "#ffffff");
    emitBurst(state, det.x, det.y, BURSTS.enemyDie());
    sfx.playMissileExplode();
    if (det.hitPlayer) {
      ctx.onDamage(1);
    }
    const bomberEnemy = state.enemies.find((e) => e.id === det.enemyId);
    if (bomberEnemy && bomberEnemy.state !== "dying" && bomberEnemy.state !== "dead") {
      bomberEnemy.state = "dying";
      bomberEnemy.stateEnteredAt = nowMs;
    }
  }
  if (bulletEffects.nearMisses > 0) {
    spawnScreenFlash(state, PALETTE.cyan, 0.22);
    applyShake(state, 4);
    ctx.onScore(20);
  }
  if (bulletEffects.healCaught > 0) {
    ctx.onHeal(bulletEffects.healCaught);
    ctx.onScore(SCORE_HEAL_CATCH * bulletEffects.healCaught);
    spawnScreenFlash(state, "#1cf78f", 0.3);
    spawnScorePop(
      state,
      state.playerX,
      state.playerY - 36,
      `+${bulletEffects.healCaught} HP`,
      "#1cf78f",
      1.3,
    );
    sfx.playPerfectHeal();
  }
  applyBulletEffects(bulletEffects, ctx);

  handleParryRelease(state, justReleased, nowMs, ctx);

  updateParticles(state, dt);
  updateEffects(state, dt, nowMs);

  cleanupBullets(state);
  cleanupEnemies(state, nowMs);

  checkVictory(state, nowMs, ctx);
}
