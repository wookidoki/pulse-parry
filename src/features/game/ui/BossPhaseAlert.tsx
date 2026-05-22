"use client";

import { useEffect, useState } from "react";
import { useHud } from "../state";
import { initialLocale, type Locale } from "../i18n";
import { playMissileTelegraph } from "../audio";
import styles from "./BossPhaseAlert.module.css";

const KO_LABELS: Record<number, { title: string; sub: string }> = {
  1: { title: "PHASE TWO", sub: "탐색 — 압박 증가" },
  2: { title: "PHASE THREE", sub: "광폭 — 모두 박살" },
};

const EN_LABELS: Record<number, { title: string; sub: string }> = {
  1: { title: "PHASE TWO", sub: "PROBE — INCREASED PRESSURE" },
  2: { title: "PHASE THREE", sub: "FRENZY — TOTAL CHAOS" },
};

export function BossPhaseAlert() {
  const bossPhase = useHud((s) => s.bossPhase);
  const alertKey = useHud((s) => s.bossPhaseAlertKey);
  const [locale] = useState<Locale>(initialLocale);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (alertKey === 0 || bossPhase === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(true);
    playMissileTelegraph();
    const id = window.setTimeout(() => setVisible(false), 1600);
    return () => window.clearTimeout(id);
  }, [alertKey, bossPhase]);

  if (!visible || bossPhase === 0) return null;
  const labels = locale === "ko" ? KO_LABELS : EN_LABELS;
  const label = labels[bossPhase];
  if (!label) return null;

  return (
    <div className={styles.alert} key={alertKey} aria-hidden>
      <div className={styles.bar} />
      <div className={styles.content}>
        <span className={styles.subtitle}>⚠ {label.sub}</span>
        <h3 className={styles.title}>{label.title}</h3>
      </div>
      <div className={styles.bar} />
    </div>
  );
}
