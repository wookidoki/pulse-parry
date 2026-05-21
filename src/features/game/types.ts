export type EnemyKind = "shooter";
export type EnemyState = "spawning" | "alive" | "dying" | "dead";

export type BulletKind = "normal";
export type BulletState = "incoming" | "absorbed" | "reflected" | "dead";

export interface Enemy {
  id: number;
  x: number;
  y: number;
  kind: EnemyKind;
  hp: number;
  maxHp: number;
  state: EnemyState;
  stateEnteredAt: number;
  lastShotBeat: number;
  telegraphMsLeft: number;
  pulse: number;
  orbitAngle: number;
}

export interface Bullet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  kind: BulletKind;
  state: BulletState;
  spawnedAt: number;
  ownerEnemyId: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLifeMs: number;
  color: string;
  size: number;
}

export interface BeatClock {
  bpm: number;
  startedAtMs: number;
  beatPeriodMs: number;
  currentBeat: number;
  beatPhase: number;
  isBeatTick: boolean;
}

export interface PlayerInput {
  aimX: number;
  aimY: number;
  parryHeld: boolean;
}

export interface EngineState {
  enemies: Enemy[];
  bullets: Bullet[];
  particles: Particle[];
  nextEnemyId: number;
  nextBulletId: number;
  parryHeld: boolean;
  parryStartedAt: number;
  aimAngle: number;
  beat: BeatClock;
  stageIndex: number;
  stageStartMs: number;
  lastEnemySpawnBeat: number;
  shake: number;
  bgPulse: number;
}

export interface EngineCallbacks {
  onScore: (n: number) => void;
  onCombo: (n: number) => void;
  onComboBreak: () => void;
  onDamage: () => void;
  onStageUp: (stageIndex: number) => void;
  onVictory: () => void;
}

export type GameStatus = "menu" | "playing" | "gameover" | "victory";

export interface HudState {
  status: GameStatus;
  hp: number;
  maxHp: number;
  score: number;
  combo: number;
  maxCombo: number;
  stageIndex: number;
  stageName: string;
}
