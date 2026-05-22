"use client";

import { useEffect, useState } from "react";
import { useHud } from "../state";
import { initialLocale, type Locale } from "../i18n";
import styles from "./PracticeHud.module.css";

interface Props {
  active: boolean;
}

const KO_TIPS = [
  "마우스로 조준하고 SPACE를 눌러 막아라",
  "막는 순간 노란 코운에 들어온 탄막이 흡수돼",
  "SPACE를 놓으면 마우스 방향으로 반격",
  "딱! 짧게 눌렀다 놓으면 자동 카운터 (TAP)",
  "꾹! 길게 누르면 CHARGE — 더 강한 반격",
  "흡수 후 100~190ms 안에 놓으면 PERFECT",
  "SHIFT로 대시 + 무적 (위험 회피)",
  "박자에 맞춰 — 모든 적은 비트에 발사한다",
];

const EN_TIPS = [
  "Aim with mouse — press SPACE to block",
  "Bullets in the yellow cone get absorbed",
  "Release SPACE to reflect in cursor direction",
  "Quick tap = auto counter (TAP)",
  "Long hold = CHARGE attack (+1 damage)",
  "Release within 190ms = PERFECT bonus",
  "SHIFT to dash + i-frames (dodge hazards)",
  "Sync to the beat — enemies fire on it",
];

export function PracticeHud({ active }: Props) {
  const status = useHud((s) => s.status);
  const [locale] = useState<Locale>(initialLocale);
  const [tipIdx, setTipIdx] = useState(0);

  useEffect(() => {
    if (!active || status !== "playing") return;
    const id = window.setInterval(() => {
      setTipIdx((i) => (i + 1) % KO_TIPS.length);
    }, 6000);
    return () => window.clearInterval(id);
  }, [active, status]);

  if (!active) return null;
  if (status !== "playing") return null;

  const tips = locale === "ko" ? KO_TIPS : EN_TIPS;
  const label = locale === "ko" ? "연습 모드" : "PRACTICE MODE";

  return (
    <div className={styles.banner}>
      <div className={styles.label}>▶ {label}</div>
      <div className={styles.tip} key={tipIdx}>
        {tips[tipIdx]}
      </div>
    </div>
  );
}
