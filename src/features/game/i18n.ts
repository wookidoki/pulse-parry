export type Locale = "ko" | "en";

export const I18N_STRINGS = {
  ko: {
    title: "PULSE PARRY",
    subtitle: "360° 리듬 패링 서바이버",
    difficulty: "난이도",
    character: "캐릭터",
    boss: "보스",
    best: "베스트",
    play: "▶ 시작",
    resume: "▶ 재개",
    restart: "↻ 재시작",
    mainMenu: "⌂ 메인 메뉴",
    stageSelect: "⌂ 스테이지 선택",
    retry: "▶ 다시",
    paused: "PAUSED",
    syncComplete: "SYNC COMPLETE",
    systemDown: "SYSTEM DOWN",
    score: "SCORE",
    maxCombo: "MAX COMBO",
    enemies: "적",
    volume: "VOLUME",
    musicVol: "음악",
    sfxVol: "효과음",
    tutorial: "▶ 튜토리얼",
    chooseDiff: "난이도 선택",
    chooseChar: "캐릭터 선택",
    chooseMod: "모디파이어",
    chooseStage: "스테이지 선택",
    newGame: "새 게임",
    continueText: "이어서",
    credits: "크레딧",
    next: "다음",
    backToTitle: "타이틀",
    backToCharacter: "캐릭터",
    step1: "STEP 1",
    step2: "STEP 2",
    startGame: "게임 시작",
    accuracy: "정확도",
    perfect: "PERFECT",
    parries: "패링",
    damage: "받은 데미지",
    killed: "처치",
    timePlayed: "플레이 시간",
    rank: "등급",
    endlessMode: "엔드리스",
    endlessStart: "▶ 엔드리스 시작",
    endlessDesc: "스테이지 무한 루프. 매 루프 난이도 상승. 죽을 때까지 점수 누적.",
    loop: "LOOP",
    achievements: "업적",
    hardcoreBadge: "★ HARDCORE +50%",
  },
  en: {
    title: "PULSE PARRY",
    subtitle: "360° RHYTHM PARRY SURVIVOR",
    difficulty: "DIFFICULTY",
    character: "CHARACTER",
    boss: "BOSS",
    best: "BEST",
    play: "▶ START",
    resume: "▶ RESUME",
    restart: "↻ RESTART",
    mainMenu: "⌂ MAIN MENU",
    stageSelect: "⌂ STAGE SELECT",
    retry: "▶ RETRY",
    paused: "PAUSED",
    syncComplete: "SYNC COMPLETE",
    systemDown: "SYSTEM DOWN",
    score: "SCORE",
    maxCombo: "MAX COMBO",
    enemies: "ENEMIES",
    volume: "VOLUME",
    musicVol: "MUSIC",
    sfxVol: "SFX",
    tutorial: "▶ TUTORIAL",
    chooseDiff: "DIFFICULTY",
    chooseChar: "CHARACTER",
    chooseMod: "MODIFIER",
    chooseStage: "STAGE",
    newGame: "NEW GAME",
    continueText: "CONTINUE",
    credits: "CREDITS",
    next: "NEXT",
    backToTitle: "TITLE",
    backToCharacter: "CHARACTER",
    step1: "STEP 1",
    step2: "STEP 2",
    startGame: "START GAME",
    accuracy: "ACCURACY",
    perfect: "PERFECT",
    parries: "PARRIES",
    damage: "DAMAGE TAKEN",
    killed: "KILLED",
    timePlayed: "TIME",
    rank: "RANK",
    endlessMode: "ENDLESS",
    endlessStart: "▶ ENDLESS START",
    endlessDesc: "Stages loop forever. Difficulty rises per loop. Score until you die.",
    loop: "LOOP",
    achievements: "ACHIEVEMENTS",
    hardcoreBadge: "★ HARDCORE +50%",
  },
} as const;

export type I18nKey = keyof typeof I18N_STRINGS.ko;

const STORAGE_KEY = "pulse-parry-locale";

export function loadLocale(): Locale {
  if (typeof window === "undefined") return "ko";
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "en" || v === "ko") return v;
  } catch {
    /* ignore */
  }
  return "ko";
}

export function saveLocale(l: Locale): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, l);
  } catch {
    /* ignore */
  }
}

export function t(key: I18nKey, locale: Locale): string {
  return I18N_STRINGS[locale][key];
}

export function initialLocale(): Locale {
  if (typeof window === "undefined") return "ko";
  return loadLocale();
}
