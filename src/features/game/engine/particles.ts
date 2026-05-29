import type { EngineState, Particle } from "../types";
import { PALETTE } from "../config/palette";
import { PARTICLE_DRAG_PER_SEC } from "../config/tuning";

export interface BurstSpec {
  count: number;
  color: string;
  speedMin: number;
  speedMax: number;
  lifeMs: number;
  angle?: number;
  spreadRad?: number;
  sizeMin?: number;
  sizeMax?: number;
}

export const BURSTS = {
  parryCatch: (): BurstSpec => ({
    count: 6,
    color: PALETTE.yellow,
    speedMin: 40,
    speedMax: 140,
    lifeMs: 280,
  }),
  playerHit: (): BurstSpec => ({
    count: 14,
    color: PALETTE.red,
    speedMin: 80,
    speedMax: 260,
    lifeMs: 420,
  }),
  reflect: (firedCount: number, angle: number): BurstSpec => ({
    count: 12 + firedCount * 4,
    color: PALETTE.cyan,
    speedMin: 120,
    speedMax: 420,
    lifeMs: 300,
    angle,
    spreadRad: Math.PI / 4,
  }),
  reflectHit: (): BurstSpec => ({
    count: 10,
    color: PALETTE.cyan,
    speedMin: 60,
    speedMax: 220,
    lifeMs: 380,
  }),
  enemyDie: (): BurstSpec => ({
    count: 22,
    color: PALETTE.yellow,
    speedMin: 80,
    speedMax: 360,
    lifeMs: 600,
  }),
  stageUp: (): BurstSpec => ({
    count: 32,
    color: PALETTE.cyan,
    speedMin: 80,
    speedMax: 320,
    lifeMs: 700,
  }),
  healCatch: (): BurstSpec => ({
    count: 18,
    color: "#1cf78f",
    speedMin: 60,
    speedMax: 220,
    lifeMs: 500,
  }),
  dashTrail: (color: string, angle: number): BurstSpec => ({
    count: 4,
    color,
    speedMin: 20,
    speedMax: 80,
    lifeMs: 260,
    angle: angle + Math.PI,
    spreadRad: Math.PI * 0.5,
    sizeMin: 1.5,
    sizeMax: 3,
  }),
};

// Hard cap so dense action (fast BPM, many kills) can't let the particle array
// grow unbounded and tank the frame rate.
const MAX_PARTICLES = 700;

export function emitBurst(
  state: EngineState,
  x: number,
  y: number,
  spec: BurstSpec,
): void {
  if (state.particles.length >= MAX_PARTICLES) return;
  const sizeMin = spec.sizeMin ?? 2;
  const sizeMax = spec.sizeMax ?? 4;
  for (let i = 0; i < spec.count; i++) {
    const a =
      spec.angle != null
        ? spec.angle + (Math.random() - 0.5) * (spec.spreadRad ?? Math.PI * 2)
        : Math.random() * Math.PI * 2;
    const s = spec.speedMin + Math.random() * (spec.speedMax - spec.speedMin);
    const particle: Particle = {
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: 1,
      maxLifeMs: spec.lifeMs,
      color: spec.color,
      size: sizeMin + Math.random() * (sizeMax - sizeMin),
    };
    state.particles.push(particle);
  }
}

export function updateParticles(state: EngineState, dt: number): void {
  for (const p of state.particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    const drag = 1 - dt * PARTICLE_DRAG_PER_SEC;
    p.vx *= drag;
    p.vy *= drag;
    p.life -= (dt * 1000) / p.maxLifeMs;
  }
  state.particles = state.particles.filter((p) => p.life > 0);
}
