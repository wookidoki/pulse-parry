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
    tutNext: "다음 ▶",
    tutPrev: "◀ 이전",
    tutSkip: "건너뛰기",
    tutFinish: "준비 완료 → 시작",
    tutStep: "단계",
    tutTitle: "PULSE PARRY 학습",
    tutAimT: "조준",
    tutAimD: "마우스로 사방을 겨냥하세요. 광선검은 항상 커서를 따라갑니다.",
    tutParryT: "막기 → 반격",
    tutParryD: "SPACE를 누르면 막기 자세. 노란 부채꼴에 들어온 탄을 흡수하고, 놓는 순간 커서 방향으로 반격합니다.",
    tutTapT: "TAP — 자동 카운터",
    tutTapD: "200ms 안에 짧게 누르고 놓으면, 흡수한 탄을 발사한 적에게 자동 반격. 조준 부담 없음.",
    tutChargeT: "CHARGE — 강한 일격",
    tutChargeD: "700ms 이상 길게 누르면 흡수한 탄이 CHARGED 상태가 됩니다. 반사 시 +1 데미지, 빨간 슬래시.",
    tutPerfectT: "PERFECT 타이밍",
    tutPerfectD: "SPACE를 누르고 100~190ms 안에 탄을 흡수하면 PERFECT. 흰 슬래시와 함께 +25점 보너스.",
    tutDashT: "대시 — 무적 회피",
    tutDashD: "SHIFT 또는 Q를 누르면 커서 방향으로 폭발 이동 + 160ms 무적. 환경 위험은 패링 불가, 대시로 통과하세요.",
    tutHazardT: "환경 위험",
    tutHazardD: "스테이지 진행 중 빨간 레이저·미사일·충격파가 등장합니다. 1초 텔레그래프 후 활성화. 패링 불가 — 이동 또는 대시 i-frame으로만 피할 수 있습니다.",
    tutHealT: "HP 회복",
    tutHealD: "초록 + 아이템이 가끔 떨어집니다. 패링으로 잡으면 HP +1, 놓치면 사라집니다.",
    tutMirrorT: "MIRROR (거울)",
    tutMirrorD: "거울은 반사된 탄을 다시 너에게 되돌립니다. 일반 반사로는 못 깸 — 길게 꾹! CHARGE 반사로만 부숩니다.",
    tutHealerT: "HEALER (치유사)",
    tutHealerD: "초록색 치유사는 4박마다 인접 적의 HP를 회복. 다른 적보다 먼저 처치하세요. 자기 HP를 깎아가며 회복하므로 결국 자멸하긴 합니다.",
    tutPulserT: "PULSER (펄서)",
    tutPulserD: "8방향으로 일제 사격. 펄서 중심에 가까이 가지 마세요. 탄 사이 빈 각도로 흘러나오는 게 정답.",
    tutReadyT: "준비 완료",
    tutReadyD: "이제 코어로 향하세요. 박자가 이끄는 대로 검을 휘두르세요.",
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
    tutNext: "NEXT ▶",
    tutPrev: "◀ PREV",
    tutSkip: "SKIP",
    tutFinish: "READY → START",
    tutStep: "STEP",
    tutTitle: "PULSE PARRY TUTORIAL",
    tutAimT: "AIM",
    tutAimD: "Move your mouse to aim your blade in any direction. The lightblade always tracks the cursor.",
    tutParryT: "PARRY = ATTACK",
    tutParryD: "Hold SPACE = block stance ON. Bullets entering the yellow cone are absorbed. Release = reflect in cursor direction.",
    tutTapT: "TAP — AUTO COUNTER",
    tutTapD: "Quick tap-release under 200ms = auto-counter at the shooter. No aim required.",
    tutChargeT: "CHARGE",
    tutChargeD: "Hold over 700ms = absorbed bullets become CHARGED. +1 damage on reflect. Red slash.",
    tutPerfectT: "PERFECT TIMING",
    tutPerfectD: "Absorb a bullet within 100~190ms after pressing = PERFECT. White slash + bonus +25.",
    tutDashT: "DASH + I-FRAMES",
    tutDashD: "SHIFT or Q = burst dash + 160ms i-frames. Red laser hazards cannot be parried — dash through.",
    tutHazardT: "HAZARDS",
    tutHazardD: "Red lasers appear in later stages. 1.1s telegraph then active. No parry — only movement or dash i-frames avoid damage.",
    tutHealT: "HEAL ITEMS",
    tutHealD: "Green + items drop occasionally. Catch with parry cone = +1 HP. Miss = lost.",
    tutMirrorT: "MIRROR",
    tutMirrorD: "Mirrors bounce reflected bullets back at you. Normal reflect won't break them — only a long HOLD = CHARGE reflect shatters through.",
    tutHealerT: "HEALER",
    tutHealerD: "Green healers restore HP to nearby enemies every 4 beats. Prioritize them. Each heal burns the healer's own HP, so they eventually self-destruct.",
    tutPulserT: "PULSER",
    tutPulserD: "Fires 8 bullets in a full circle. Don't camp near a pulser's center — slip through the gaps between rays.",
    tutReadyT: "READY",
    tutReadyD: "Time to face the CORE. Let the beat guide your blade.",
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
