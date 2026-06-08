export const PLAYER_RADIUS = 14;
export const HIT_RADIUS = 22;
export const PLAYER_MAX_DIST = 180;
export const PLAYER_MOVE_SPEED = 300;
export const DASH_DURATION_MS = 160;
// I-frame window granted by a dash — a touch longer than the movement itself so
// the dodge "판정" is more forgiving than the visible slide.
export const DASH_IFRAME_MS = 240;
// Small extra reach added at dash start (px), on top of the speed×duration slide.
export const DASH_DISTANCE_BONUS_PX = 10;

export const ENEMY_RADIUS = 22;
export const ENEMY_ORBIT_FACTOR = 0.48;
export const ENEMY_ORBIT_MARGIN = 60;
export const ENEMY_ORBIT_DRIFT_RAD_PER_SEC = 0.05;

export const TELEGRAPH_MS = 350;
export const ENEMY_SPAWN_DELAY_MS = 450;
export const ENEMY_DEATH_MS = 200;

export const SCORE_REFLECT_HIT = 15;
export const SCORE_ENEMY_KILL = 100;
export const SCORE_PARRY_PER_BULLET = 5;

export const SHAKE_ON_PLAYER_HIT = 22;
export const SHAKE_ON_ENEMY_KILL = 14;
export const SHAKE_ON_REFLECT = 8;
export const SHAKE_ON_STAGE_UP = 18;
export const SHAKE_DECAY_PER_SEC = 80;

export const BG_PULSE_DECAY_PER_SEC = 2.8;

export const PARTICLE_DRAG_PER_SEC = 1.8;

export const TAP_THRESHOLD_MS = 200;
export const CHARGE_THRESHOLD_MS = 700;

export const MASH_COOLDOWN_MS = 100;
export const SCORE_PERFECT_BONUS = 25;
export const SCORE_CHARGED_BONUS = 35;
export const SCORE_HEAL_CATCH = 50;

export const HEAL_SPAWN_INTERVAL_MS = 45000;
export const HEAL_BULLET_SPEED = 140;
export const HEAL_COMBO_MILESTONES = [25, 50, 100, 200] as const;

export const SHIELD_SPAWN_INTERVAL_MS = 70000;
export const SHIELD_BULLET_SPEED = 140;
export const SHIELD_INVULN_MS = 10000;
// I-frames after taking a hit — player blinks and is immune so a single hazard
// or bullet can't chain into instant death.
export const POST_HIT_INVULN_MS = 2200;

export const HIT_STOP_MS_PLAYER_HIT = 50;
export const HIT_STOP_MS_ENEMY_KILL = 55;
export const HIT_STOP_MS_REFLECT_HIT = 25;
export const HIT_STOP_MS_PARRY = 18;

export const KNOCKBACK_DECAY_PER_SEC = 8;
export const ENEMY_KNOCKBACK_AMOUNT = 14;

export const SLASH_DURATION_MS = 260;
export const SLASH_RADIUS = 130;

export const SCOREPOP_RISE_VY = -120;
export const SCOREPOP_LIFE_MS = 800;

export const SCREEN_FLASH_LIFE_MS = 150;

export const NEAR_MISS_RADIUS = 22;

export const CAMERA_ZOOM_PUNCH = 1.06;
export const CAMERA_ZOOM_LERP_PER_SEC = 12;
export const BOSS_PHASE_ZOOM_MS = 520;

export const DEFAULT_BPM = 120;

// Rhythm core: a parry counts as ON-BEAT when the SPACE press lands within this
// fraction of a beat from the downbeat (each side). Drives bonus score + juice.
export const ON_BEAT_WINDOW = 0.16;
export const SCORE_ONBEAT_BONUS = 20;

export const COMBO_MILESTONES = [10, 25, 50, 100, 200] as const;

// THE CORE boss — WEAK POINT gimmick + choreographed attack patterns.
// The shell is armored: reflects that strike the armor just spark off. A single
// glowing WEAK POINT orbits the core; only reflects that hit it deal damage. You
// can still mash — but the hit only lands while the weak point faces your shot,
// so it's about WHERE/WHEN you strike, not how fast. The weak point spins faster
// each phase, so the windows tighten as the boss dies.
export const BOSS_WEAK_ARC = 0.62; // ±rad around the weak point that takes damage (~71° span)
export const BOSS_WEAK_SPIN = [0.85, 1.35, 2.0]; // rad/s, per phase (P0/P1/P2)
export const BOSS_PATTERN_TELEGRAPH_MS = 600;
export const BOSS_NOVA_ECHO_DELAY_MS = 420;
// Choreographed pattern cycle per phase. Pattern ids:
//   0 RING   — full 360° ring burst (one boom)
//   1 SPIRAL — two rotating arms sweeping outward (weave through the gaps)
//   2 FAN    — wide aimed fan at the player (parry wall)
//   3 LANCE  — fast tight aimed volley (read + dash the line)
export const BOSS_PATTERN_CYCLE: readonly (readonly number[])[] = [
  [2, 0],
  [2, 1, 0],
  [2, 1, 3, 0],
];
export const BOSS_ATTACK_GAP_BEATS = [4, 3, 2]; // idle beats between patterns, per phase
export const BOSS_RING_COUNT = [14, 18, 22]; // ring bullets, per phase
export const BOSS_RING_ECHO = [0, 0, 10]; // extra delayed echo ring (P2 only)
