import type { EngineState, Hazard } from "../types";
import {
  HAZARD_FIRST_SPAWN_DELAY_MS,
  HAZARD_LASER_ACTIVE_MS,
  HAZARD_LASER_FADE_MS,
  HAZARD_LASER_TELEGRAPH_MS,
  HAZARD_LASER_WIDTH,
  HAZARD_SPAWN_MAX_INTERVAL_MS,
  HAZARD_SPAWN_MIN_INTERVAL_MS,
} from "../config/hazards";

let nextHazardId = 1;

export function initHazardSpawn(state: EngineState, nowMs: number): void {
  state.nextHazardAtMs = nowMs + HAZARD_FIRST_SPAWN_DELAY_MS;
}

export function maybeSpawnHazard(state: EngineState, nowMs: number): void {
  if (nowMs < state.nextHazardAtMs) return;
  const angle = Math.random() * Math.PI * 2;
  const hazard: Hazard = {
    id: nextHazardId++,
    kind: "laserSweep",
    state: "telegraph",
    startedAtMs: nowMs,
    angle,
    width: HAZARD_LASER_WIDTH,
  };
  state.hazards.push(hazard);
  const interval =
    HAZARD_SPAWN_MIN_INTERVAL_MS +
    Math.random() * (HAZARD_SPAWN_MAX_INTERVAL_MS - HAZARD_SPAWN_MIN_INTERVAL_MS);
  state.nextHazardAtMs = nowMs + interval;
}

export interface HazardDamageInfo {
  damaged: boolean;
  hazardId: number;
}

export function updateHazards(
  state: EngineState,
  nowMs: number,
): HazardDamageInfo {
  let damaged = false;
  let damageId = -1;
  const survivors: Hazard[] = [];
  for (const h of state.hazards) {
    const age = nowMs - h.startedAtMs;
    if (h.state === "telegraph" && age >= HAZARD_LASER_TELEGRAPH_MS) {
      h.state = "active";
      h.startedAtMs = nowMs;
    } else if (h.state === "active" && age >= HAZARD_LASER_ACTIVE_MS) {
      h.state = "fading";
      h.startedAtMs = nowMs;
    }

    if (h.state === "active" && !damaged && state.dashActiveMsLeft <= 0) {
      if (isPlayerOnLaser(state.playerX, state.playerY, h)) {
        damaged = true;
        damageId = h.id;
        h.state = "fading";
        h.startedAtMs = nowMs;
      }
    }

    if (h.state === "fading" && nowMs - h.startedAtMs >= HAZARD_LASER_FADE_MS) {
      continue;
    }
    survivors.push(h);
  }
  state.hazards = survivors;
  return { damaged, hazardId: damageId };
}

function isPlayerOnLaser(px: number, py: number, h: Hazard): boolean {
  const cos = Math.cos(h.angle);
  const sin = Math.sin(h.angle);
  const perp = -px * sin + py * cos;
  return Math.abs(perp) < h.width / 2;
}

export function getHazardPhaseAlpha(h: Hazard, nowMs: number): number {
  const age = nowMs - h.startedAtMs;
  if (h.state === "telegraph") {
    return Math.min(1, age / HAZARD_LASER_TELEGRAPH_MS);
  }
  if (h.state === "active") {
    return 1;
  }
  return Math.max(0, 1 - age / HAZARD_LASER_FADE_MS);
}
