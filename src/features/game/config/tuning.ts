export const PLAYER_RADIUS = 14;
export const HIT_RADIUS = 22;
export const PLAYER_MAX_DIST = 110;
export const PLAYER_MOVE_SPEED = 260;

export const PARRY_HALF_CONE_RAD = (50 * Math.PI) / 180;
export const PARRY_RANGE = 140;

export const BULLET_REFLECT_SPEED = 880;

export const ENEMY_RADIUS = 22;
export const ENEMY_ORBIT_FACTOR = 0.4;
export const ENEMY_ORBIT_DRIFT_RAD_PER_SEC = 0.05;

export const TELEGRAPH_MS = 350;
export const ENEMY_SPAWN_DELAY_MS = 450;
export const ENEMY_DEATH_MS = 280;

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

export const HIT_STOP_MS_PLAYER_HIT = 60;
export const HIT_STOP_MS_ENEMY_KILL = 95;
export const HIT_STOP_MS_REFLECT_HIT = 35;
export const HIT_STOP_MS_PARRY = 25;

export const KNOCKBACK_DECAY_PER_SEC = 8;
export const ENEMY_KNOCKBACK_AMOUNT = 14;

export const SLASH_DURATION_MS = 260;
export const SLASH_RADIUS = 130;

export const SCOREPOP_RISE_VY = -120;
export const SCOREPOP_LIFE_MS = 800;

export const SCREEN_FLASH_LIFE_MS = 220;

export const NEAR_MISS_RADIUS = 22;
export const SLOWMO_NEAR_MISS_MS = 340;
export const SLOWMO_NEAR_MISS_SCALE = 0.32;

export const CAMERA_ZOOM_PUNCH = 1.06;
export const CAMERA_ZOOM_LERP_PER_SEC = 12;

export const COMBO_MILESTONES = [10, 25, 50, 100, 200] as const;
