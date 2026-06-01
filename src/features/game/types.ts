export type EnemyKind =
  | "shooter"
  | "burster"
  | "charger"
  | "boss"
  | "sniper"
  | "spreader"
  | "spiraler"
  | "phantom"
  | "mortar"
  | "bomber"
  | "splitter"
  | "shard"
  | "mirror"
  | "healer"
  | "pulser"
  | "rusher";
export type EnemyRace = "omnic" | "virus" | "drone" | "core";
export type EnemyState = "spawning" | "alive" | "dying" | "dead";

export const KIND_RACE: Record<EnemyKind, EnemyRace> = {
  shooter: "omnic",
  burster: "virus",
  charger: "drone",
  boss: "core",
  sniper: "omnic",
  spreader: "omnic",
  spiraler: "virus",
  phantom: "omnic",
  mortar: "drone",
  bomber: "drone",
  splitter: "virus",
  shard: "virus",
  mirror: "omnic",
  healer: "drone",
  pulser: "virus",
  rusher: "drone",
};

export const RACE_LABEL: Record<EnemyRace, string> = {
  omnic: "OMNIC",
  virus: "VIRUS",
  drone: "DRONE",
  core: "THE CORE",
};

export type BulletKind = "normal" | "rapid" | "heavy" | "heal" | "shield";
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
  orbitRingMul: number;
  burstShotsRemaining: number;
  burstNextShotAtMs: number;
  knockbackX: number;
  knockbackY: number;
  hitFlashMsLeft: number;
  beatOffsetFraction: number;
  // Melee "rusher" lunge state: counts down while charging the player; 0 = orbiting.
  lungeMsLeft: number;
  nextLungeAtMs: number;
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
  isPerfect: boolean;
  isCharged: boolean;
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
  dashPressed: boolean;
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
  parryPressBeatPhase: number;
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
  cameraZoom: number;
  parryCooldownMsLeft: number;
  audioKickThisFrame: boolean;
  difficulty: Difficulty;
  lastHealSpawnAtMs: number;
  lastHealMilestone: number;
  lastShieldSpawnAtMs: number;
  invulnMsLeft: number;
  bossSpawned: boolean;
  bossPhase: number;
  bossPhaseZoomMsLeft: number;
  countdownMsLeft: number;
  countdownLastSecond: number;
  perfectFlashMsLeft: number;
  dashActiveMsLeft: number;
  dashCooldownMsLeft: number;
  dashDirX: number;
  dashDirY: number;
  dashWasPressed: boolean;
  bladeSwingMsLeft: number;
  bladeSwingDurationMs: number;
  bladeSwingFromAngle: number;
  bladeSwingToAngle: number;
  characterId: import("./config/characters").CharacterId;
  modifierId: import("./config/modifiers").RunModifierId;
  hazards: Hazard[];
  nextHazardAtMs: number;
  tutorialMode: boolean;
  endlessMode: boolean;
  endlessLoop: number;
}

export type HazardKind = "laserSweep" | "missile" | "shockwave";

export interface Hazard {
  id: number;
  kind: HazardKind;
  state: "telegraph" | "active" | "fading";
  startedAtMs: number;
  angle: number;
  width: number;
  centerX: number;
  centerY: number;
  blastRadius: number;
  currentRadius: number;
  consumed: boolean;
}

export interface EngineCallbacks {
  onScore: (n: number) => void;
  onCombo: (n: number) => void;
  onComboBreak: () => void;
  onDamage: (amount: number) => void;
  onHeal: (amount: number) => void;
  onStageUp: (stageIndex: number) => void;
  onVictory: () => void;
  onParries: (total: number, perfect: number) => void;
  onEnemyKilled: (n: number) => void;
  onBossAppear: () => void;
  onBossPhaseChange: (phase: number) => void;
  onEndlessLoop: (loop: number) => void;
  onEnemyCount: (n: number) => void;
}

export type GameStatus =
  | "menu"
  | "intro"
  | "playing"
  | "paused"
  | "bossCutscene"
  | "winning"
  | "dying"
  | "gameover"
  | "victory";

export type Difficulty = "easy" | "normal" | "hard";

export interface ComboMilestone {
  level: number;
  key: number;
}

export interface HudState {
  status: GameStatus;
  bossPhase: number;
  bossPhaseAlertKey: number;
  hp: number;
  maxHp: number;
  score: number;
  combo: number;
  maxCombo: number;
  stageIndex: number;
  stageName: string;
  milestone: ComboMilestone | null;
  musicVolume: number;
  sfxVolume: number;
  totalParries: number;
  perfectParries: number;
  damageTaken: number;
  enemiesKilled: number;
  enemyCount: number;
  playStartMs: number;
  playEndMs: number;
  endlessLoop: number;
  restartKey: number;
}
