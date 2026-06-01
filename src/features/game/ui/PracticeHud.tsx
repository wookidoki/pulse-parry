"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useHud } from "../state";
import { playUiTap } from "../audio";
import { initialLocale, type Locale } from "../i18n";
import styles from "./PracticeHud.module.css";

interface Props {
  active: boolean;
}

interface Step {
  ko: string;
  en: string;
}

// Ordered lessons. Each advances when the player actually performs the action
// (counters in the HUD store), so the tutorial is a hands-on practice, not a
// slideshow. The last step is open-ended free play.
const STEPS: Step[] = [
  { ko: "마우스로 조준하고 SPACE를 꾹 눌러 막으세요", en: "Aim with the mouse, hold SPACE to block" },
  { ko: "톡! 짧게 눌렀다 놓아 자동 카운터 (TAP)", en: "Quick tap-and-release = auto counter (TAP)" },
  { ko: "꾹! 길게 눌러 강한 반격 (CHARGE)", en: "Long hold = stronger counter (CHARGE)" },
  { ko: "흡수 직후 빠르게 놓으면 PERFECT", en: "Release right after absorbing = PERFECT" },
  { ko: "박자에 맞춰 막으면 ON BEAT 보너스", en: "Block on the beat for an ON BEAT bonus" },
  { ko: "여러 탄을 모았다가 원하는 방향으로 한 번에 반격", en: "Gather bullets, then reflect them all one way" },
  { ko: "SHIFT 또는 Q로 대시 — 무적 회피", en: "SHIFT or Q to dash — invincible dodge" },
  { ko: "완료! 자유 연습 — 모든 적 패턴을 막아보세요", en: "Done! Free practice — read every pattern" },
];

// Immersive enemy-pattern subtitles, cycled during free play (final step).
const PATTERN_TIPS_KO = [
  "OMNIC — 정밀 단발. 다이아몬드 실루엣",
  "VIRUS — 분열·연사. 톱니 본체",
  "DRONE — 무거운 보라 일격. 차지 주의",
  "PULSER — 8방향 일제. 중심을 비워라",
  "RUSHER — 박자에 맞춰 돌진. 반사하거나 대시",
  "BOMBER — 자폭 접근. 점멸하면 대시로 회피",
];
const PATTERN_TIPS_EN = [
  "OMNIC — precise single shots. Diamond shape",
  "VIRUS — splitting bursts. Jagged body",
  "DRONE — heavy purple blow. Watch the charge",
  "PULSER — 8-way volley. Clear the center",
  "RUSHER — charges on the beat. Reflect or dash",
  "BOMBER — suicide rush. Dash when it blinks",
];

export function PracticeHud({ active }: Props) {
  const status = useHud((s) => s.status);
  const reset = useHud((s) => s.reset);
  const totalParries = useHud((s) => s.totalParries);
  const tapCount = useHud((s) => s.tapCount);
  const chargeCount = useHud((s) => s.chargeCount);
  const perfectParries = useHud((s) => s.perfectParries);
  const onBeatCount = useHud((s) => s.onBeatCount);
  const dashCount = useHud((s) => s.dashCount);
  const gatherCount = useHud((s) => s.gatherCount);
  const [locale] = useState<Locale>(initialLocale);
  const [patternIdx, setPatternIdx] = useState(0);

  const lastStep = STEPS.length - 1;
  // Completion per gated step (indices 0..lastStep-1). Step is DERIVED from the
  // action counters — no local state to advance — so finishing an action simply
  // re-renders to the next lesson. (Avoids set-state-in-effect.)
  const checks = [
    totalParries >= 1,
    tapCount >= 1,
    chargeCount >= 1,
    perfectParries >= 1,
    onBeatCount >= 1,
    gatherCount >= 1, // held reflect of 2+ bullets at once
    dashCount >= 1,
  ];
  const firstIncomplete = checks.findIndex((c) => !c);
  const step = firstIncomplete === -1 ? lastStep : firstIncomplete;
  const onFree = step >= lastStep;

  // Cycle enemy-pattern subtitles on the final free-play step.
  useEffect(() => {
    if (!active || status !== "playing" || !onFree) return;
    const id = window.setInterval(() => {
      setPatternIdx((i) => (i + 1) % PATTERN_TIPS_KO.length);
    }, 4500);
    return () => window.clearInterval(id);
  }, [active, status, onFree]);

  if (!active || status !== "playing") return null;

  const label = locale === "ko" ? "연습 모드" : "PRACTICE";
  const exitLabel = locale === "ko" ? "← 메뉴" : "← MENU";
  const mainText = STEPS[step][locale];
  const patternText = (locale === "ko" ? PATTERN_TIPS_KO : PATTERN_TIPS_EN)[patternIdx];

  return (
    <div className={styles.banner}>
      <div className={styles.row}>
        <div className={styles.label}>
          ▶ {label} {onFree ? "" : `${step + 1}/${lastStep}`}
        </div>
        <Link
          href="/"
          className={styles.exitBtn}
          onClick={() => {
            playUiTap();
            reset();
          }}
        >
          {exitLabel}
        </Link>
      </div>
      <div className={styles.tip} key={step}>
        {mainText}
      </div>
      {onFree && (
        <div className={styles.pattern} key={patternIdx}>
          {patternText}
        </div>
      )}
    </div>
  );
}
