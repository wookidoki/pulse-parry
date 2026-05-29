export const PLAYER_RADIUS = 14;
export const HIT_RADIUS = 22;
export const PLAYER_MAX_DIST = 180;
export const PLAYER_MOVE_SPEED = 300;
export const DASH_DURATION_MS = 160;

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
export const SHIELD_INVULN_MS = 5000;
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

export const COMBO_MILESTONES = [10, 25, 50, 100, 200] as const;
