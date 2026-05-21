export type EnemyKind = "shooter" | "burster" | "charger";
export type EnemyState = "spawning" | "alive" | "dying" | "dead";

export type BulletKind = "normal" | "rapid" | "heavy";
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
  burstShotsRemaining: number;
  burstNextShotAtMs: number;
  knockbackX: number;
  knockbackY: number;
  hitFlashMsLeft: number;
}

export interface ScorePop {
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  maxLifeMs: number;
  scale: number;
}

export interface ScreenFlash {
  color: string;
  life: number;
  maxLifeMs: number;
  intensity: number;
}

export interface Slash {
  startAngle: number;
  endAngle: number;
  bornAtMs: number;
  durationMs: number;
  color: string;
  radius: number;
}

export interface Shockwave {
  x: number;
  y: number;
  bornAtMs: number;
  durationMs: number;
  maxRadius: number;
  color: string;
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
  minDist: number;
  nearMissFired: boolean;
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
  rawMouseX: number;
  rawMouseY: number;
  parryHeld: boolean;
  moveUp: boolean;
  moveDown: boolean;
  moveLeft: boolean;
  moveRight: boolean;
}

export interface EngineState {
  enemies: Enemy[];
  bullets: Bullet[];
  particles: Particle[];
  scorePops: ScorePop[];
  flashes: ScreenFlash[];
  slashes: Slash[];
  shockwaves: Shockwave[];
  nextEnemyId: number;
  nextBulletId: number;
  parryHeld: boolean;
  parryStartedAt: number;
  aimAngle: number;
  playerX: number;
  playerY: number;
  beat: BeatClock;
  stageIndex: number;
  stageStartMs: number;
  lastEnemySpawnBeat: number;
  shake: number;
  bgPulse: number;
  hitStopMsLeft: number;
  timeScale: number;
  slowmoMsLeft: number;
  cameraZoom: number;
}

export interface EngineCallbacks {
  onScore: (n: number) => void;
  onCombo: (n: number) => void;
  onComboBreak: () => void;
  onDamage: (amount: number) => void;
  onStageUp: (stageIndex: number) => void;
  onVictory: () => void;
}

export type GameStatus = "menu" | "playing" | "paused" | "gameover" | "victory";

export interface ComboMilestone {
  level: number;
  key: number;
}

export interface HudState {
  status: GameStatus;
  hp: number;
  maxHp: number;
  score: number;
  combo: number;
  maxCombo: number;
  stageIndex: number;
  stageName: string;
  milestone: ComboMilestone | null;
  volume: number;
}
