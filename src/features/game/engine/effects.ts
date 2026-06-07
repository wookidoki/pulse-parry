import type { EngineState, ScorePop, ScreenFlash, Shockwave, Slash } from "../types";
import { PALETTE } from "../config/palette";
import {
  SCOREPOP_LIFE_MS,
  SCOREPOP_RISE_VY,
  SCREEN_FLASH_LIFE_MS,
  SLASH_DURATION_MS,
  SLASH_RADIUS,
} from "../config/tuning";

const SHOCKWAVE_DURATION_MS = 480;
const SHOCKWAVE_MAX_RADIUS = 160;

export function spawnShockwave(
  state: EngineState,
  x: number,
  y: number,
  nowMs: number,
  color: string = PALETTE.yellow,
  maxRadius: number = SHOCKWAVE_MAX_RADIUS,
): void {
  const wave: Shockwave = {
    x,
    y,
    bornAtMs: nowMs,
    durationMs: SHOCKWAVE_DURATION_MS,
    maxRadius,
    color,
  };
  state.shockwaves.push(wave);
}

export function spawnSlash(
  state: EngineState,
  centerAngle: number,
  halfConeRad: number,
  nowMs: number,
  color: string = PALETTE.cyan,
): void {
  const slash: Slash = {
    startAngle: centerAngle - halfConeRad,
    endAngle: centerAngle + halfConeRad,
    bornAtMs: nowMs,
    durationMs: SLASH_DURATION_MS,
    color,
    radius: SLASH_RADIUS,
  };
  state.slashes.push(slash);
}

export function spawnScorePop(
  state: EngineState,
  x: number,
  y: number,
  text: string,
  color: string = PALETTE.cyan,
  scale: number = 1,
): void {
  const pop: ScorePop = {
    x,
    y,
    vy: SCOREPOP_RISE_VY,
    text,
    color,
    life: 1,
    maxLifeMs: SCOREPOP_LIFE_MS,
    scale,
  };
  state.scorePops.push(pop);
}

export function spawnScreenFlash(
  state: EngineState,
  color: string,
  intensity: number = 0.35,
): void {
  const flash: ScreenFlash = {
    color,
    life: 1,
    maxLifeMs: SCREEN_FLASH_LIFE_MS,
    intensity,
  };
  state.flashes.push(flash);
}

export function updateEffects(state: EngineState, dt: number, nowMs: number): void {
  for (const p of state.scorePops) {
    p.y += p.vy * dt;
    p.vy += dt * 90;
    p.life -= (dt * 1000) / p.maxLifeMs;
  }
  state.scorePops = state.scorePops.filter((p) => p.life > 0);

  for (const f of state.flashes) {
    f.life -= (dt * 1000) / f.maxLifeMs;
  }
  state.flashes = state.flashes.filter((f) => f.life > 0);

  state.slashes = state.slashes.filter(
    (s) => nowMs - s.bornAtMs < s.durationMs,
  );

  state.shockwaves = state.shockwaves.filter(
    (s) => nowMs - s.bornAtMs < s.durationMs,
  );
}
