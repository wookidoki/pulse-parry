export type Locale = "ko" | "en";

export const I18N_STRINGS = {
  ko: {
    title: "PULSE PARRY",
    subtitle: "360° 리듬 패링 서바이버",
    difficulty: "난이도",
    character: "캐릭터",
    modifier: "모디파이어",
    locked: "잠김",
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
    volume: "VOLUME",
    bpmHint: "BPM",
    bossLabel: "THE CORE",
    tutorial: "▶ 튜토리얼",
    tutorialAvail: "처음이라면 튜토리얼부터",
    chooseDiff: "난이도 선택",
    chooseChar: "캐릭터 선택",
    chooseMod: "모디파이어",
    chooseStage: "스테이지 선택",
    backToSelect: "← 선택",
    controlHint:
      "WASD 회피 · SHIFT 대시 · MOUSE 조준 · SPACE 막기 / 놓음=반격 · 꾹=차지 · 딱=PERFECT · ESC 일시정지",
  },
  en: {
    title: "PULSE PARRY",
    subtitle: "360° RHYTHM PARRY SURVIVOR",
    difficulty: "DIFFICULTY",
    character: "CHARACTER",
    modifier: "MODIFIER",
    locked: "LOCKED",
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
    volume: "VOLUME",
    bpmHint: "BPM",
    bossLabel: "THE CORE",
    tutorial: "▶ TUTORIAL",
    tutorialAvail: "Start here if new",
    chooseDiff: "DIFFICULTY",
    chooseChar: "CHARACTER",
    chooseMod: "MODIFIER",
    chooseStage: "STAGE",
    backToSelect: "← BACK",
    controlHint:
      "WASD move · SHIFT dash · MOUSE aim · SPACE parry / release=reflect · HOLD=charge · QUICK=PERFECT · ESC pause",
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
