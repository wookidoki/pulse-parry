import type { EngineState, Hazard, HazardKind } from "../types";
import {
  HAZARD_LASER_ACTIVE_MS,
  HAZARD_LASER_FADE_MS,
  HAZARD_LASER_TELEGRAPH_MS,
  HAZARD_LASER_WIDTH,
  HAZARD_MISSILE_ACTIVE_MS,
  HAZARD_MISSILE_BLAST_RADIUS,
  HAZARD_MISSILE_FADE_MS,
  HAZARD_MISSILE_TELEGRAPH_MS,
  HAZARD_SHOCKWAVE_ACTIVE_MS,
  HAZARD_SHOCKWAVE_FADE_MS,
  HAZARD_SHOCKWAVE_TELEGRAPH_MS,
  HAZARD_SPAWN_MAX_INTERVAL_MS,
  HAZARD_SPAWN_MIN_INTERVAL_MS,
} from "../config/hazards";
import { PLAYER_MAX_DIST } from "../config/tuning";

let nextHazardId = 1;

const SHOCKWAVE_DAMAGE_GRACE_MS = 150;

function pickKind(state: EngineState): HazardKind {
  const stage = state.stageIndex;
  // shockwave (center-origin double ring) retired — only laser + missile.
  const choices: HazardKind[] = ["laserSweep"];
  if (stage >= 1) choices.push("missile");
  return choices[Math.floor(Math.random() * choices.length)];
}

function spawnLaser(nowMs: number): Hazard {
  return {
    id: nextHazardId++,
    kind: "laserSweep",
    state: "telegraph",
    startedAtMs: nowMs,
    angle: Math.random() * Math.PI * 2,
    width: HAZARD_LASER_WIDTH,
    centerX: 0,
    centerY: 0,
    blastRadius: 0,
    currentRadius: 0,
    consumed: false,
  };
}

function spawnMissile(nowMs: number, state: EngineState): Hazard {
  const angle = Math.random() * Math.PI * 2;
  const offset = (0.2 + Math.random() * 0.6) * PLAYER_MAX_DIST;
  const aimX = state.playerX + Math.cos(angle) * offset * 0.5;
  const aimY = state.playerY + Math.sin(angle) * offset * 0.5;
  return {
    id: nextHazardId++,
    kind: "missile",
    state: "telegraph",
    startedAtMs: nowMs,
    angle: 0,
    width: 0,
    centerX: aimX,
    centerY: aimY,
    blastRadius: HAZARD_MISSILE_BLAST_RADIUS,
    currentRadius: 0,
    consumed: false,
  };
}

export function maybeSpawnHazard(state: EngineState, nowMs: number): void {
  if (nowMs < state.nextHazardAtMs) return;
  const kind = pickKind(state);
  if (kind === "missile") {
    // Spawn a barrage of 3 missiles staggered by 280ms
    const count = 2 + Math.floor(Math.random() * 2); // 2 or 3
    for (let i = 0; i < count; i++) {
      state.hazards.push(spawnMissile(nowMs + i * 280, state));
    }
  } else {
    state.hazards.push(spawnLaser(nowMs));
  }
  const interval =
    HAZARD_SPAWN_MIN_INTERVAL_MS +
    Math.random() * (HAZARD_SPAWN_MAX_INTERVAL_MS - HAZARD_SPAWN_MIN_INTERVAL_MS);
  state.nextHazardAtMs = nowMs + interval;
}

function telegraphMs(h: Hazard): number {
  if (h.kind === "missile") return HAZARD_MISSILE_TELEGRAPH_MS;
  if (h.kind === "shockwave") return HAZARD_SHOCKWAVE_TELEGRAPH_MS;
  return HAZARD_LASER_TELEGRAPH_MS;
}

function activeMs(h: Hazard): number {
  if (h.kind === "missile") return HAZARD_MISSILE_ACTIVE_MS;
  if (h.kind === "shockwave") return HAZARD_SHOCKWAVE_ACTIVE_MS;
  return HAZARD_LASER_ACTIVE_MS;
}

function fadeMs(h: Hazard): number {
  if (h.kind === "missile") return HAZARD_MISSILE_FADE_MS;
  if (h.kind === "shockwave") return HAZARD_SHOCKWAVE_FADE_MS;
  return HAZARD_LASER_FADE_MS;
}

function hits(state: EngineState, h: Hazard, scanProgress = 1): boolean {
  if (h.kind === "laserSweep") {
    const cos = Math.cos(h.angle);
    const sin = Math.sin(h.angle);
    const along = state.playerX * cos + state.playerY * sin;
    const perp = -state.playerX * sin + state.playerY * cos;
    if (Math.abs(perp) >= h.width / 2) return false;
    // Beam scans from -reach to +reach over active phase.
    const reach = 1000;
    const tipPos = -reach + scanProgress * 2 * reach;
    return along <= tipPos;
  }
  if (h.kind === "missile") {
    const dx = state.playerX - h.centerX;
    const dy = state.playerY - h.centerY;
    return Math.hypot(dx, dy) < h.blastRadius;
  }
  if (h.kind === "shockwave") {
    const dist = Math.hypot(state.playerX, state.playerY);
    return Math.abs(dist - h.currentRadius) < h.width / 2;
  }
  return false;
}

export interface HazardDamageInfo {
  damaged: boolean;
  hazardId: number;
  hazardKind: HazardKind | null;
}

export function updateHazards(
  state: EngineState,
  nowMs: number,
): HazardDamageInfo {
  let damaged = false;
  let damageId = -1;
  let damageKind: HazardKind | null = null;
  const survivors: Hazard[] = [];
  for (const h of state.hazards) {
    if (nowMs < h.startedAtMs) {
      survivors.push(h);
      continue;
    }
    const age = nowMs - h.startedAtMs;
    if (h.state === "telegraph" && age >= telegraphMs(h)) {
      h.state = "active";
      h.startedAtMs = nowMs;
    } else if (h.state === "active" && age >= activeMs(h)) {
      h.state = "fading";
      h.startedAtMs = nowMs;
    }

    if (h.kind === "shockwave" && h.state === "active") {
      const progress = (nowMs - h.startedAtMs) / activeMs(h);
      h.currentRadius = progress * h.blastRadius;
    }

    if (h.kind === "laserSweep" && h.state === "active") {
      const progress = Math.min(1, (nowMs - h.startedAtMs) / activeMs(h));
      h.currentRadius = progress;
    }

    // A hazard damages the player at most once (h.consumed). Without this the
    // beam/ring stays "active" and re-hits every frame → continuous damage +
    // a red flash that never clears. Dash i-frames and post-hit invuln also
    // suppress the hit. Shockwave gets a short activation grace so the ring is
    // never an unavoidable point-blank hit the instant it spawns.
    const shockwaveGrace =
      h.kind === "shockwave" && nowMs - h.startedAtMs < SHOCKWAVE_DAMAGE_GRACE_MS;
    if (
      h.state === "active" &&
      !damaged &&
      !h.consumed &&
      state.dashActiveMsLeft <= 0 &&
      state.invulnMsLeft <= 0 &&
      !shockwaveGrace
    ) {
      const scanProg = h.kind === "laserSweep" ? h.currentRadius : 1;
      if (hits(state, h, scanProg)) {
        damaged = true;
        damageId = h.id;
        damageKind = h.kind;
        h.consumed = true;
        if (h.kind !== "shockwave" && h.kind !== "laserSweep") {
          h.state = "fading";
          h.startedAtMs = nowMs;
        }
      }
    }

    if (h.state === "fading" && nowMs - h.startedAtMs >= fadeMs(h)) {
      continue;
    }
    survivors.push(h);
  }
  state.hazards = survivors;
  return { damaged, hazardId: damageId, hazardKind: damageKind };
}

export function getHazardPhaseAlpha(h: Hazard, nowMs: number): number {
  const age = Math.max(0, nowMs - h.startedAtMs);
  if (h.state === "telegraph") {
    return Math.min(1, age / telegraphMs(h));
  }
  if (h.state === "active") {
    return 1;
  }
  return Math.max(0, 1 - age / fadeMs(h));
}

export function getTelegraphProgress(h: Hazard, nowMs: number): number {
  if (h.state !== "telegraph") return 1;
  // Lower clamp is critical: staggered hazards spawn with a FUTURE startedAtMs,
  // so before they start this would go negative → negative arc radius in the
  // renderer → IndexSizeError → the whole frame throws and the canvas freezes.
  return Math.max(0, Math.min(1, (nowMs - h.startedAtMs) / telegraphMs(h)));
}
