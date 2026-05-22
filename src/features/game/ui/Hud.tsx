"use client";

import { useState } from "react";
import { useHud } from "../state";
import { initialLocale, t, type Locale } from "../i18n";
import styles from "./Hud.module.css";

export function Hud() {
  const [locale] = useState<Locale>(initialLocale);

  const hp = useHud((s) => s.hp);
  const maxHp = useHud((s) => s.maxHp);
  const score = useHud((s) => s.score);
  const combo = useHud((s) => s.combo);

  return (
    <div className={styles.hud}>
      <HpRow hp={hp} maxHp={maxHp} />
      <ScoreBox score={score} combo={combo} locale={locale} />
    </div>
  );
}

function HpRow({ hp, maxHp }: { hp: number; maxHp: number }) {
  return (
    <div className={styles.hpRow}>
      {Array.from({ length: maxHp }).map((_, i) => (
        <span
          key={i}
          className={`${styles.heart} ${i < hp ? styles.heartFull : styles.heartEmpty}`}
        >
          ◆
        </span>
      ))}
    </div>
  );
}

function ScoreBox({
  score,
  combo,
  locale,
}: {
  score: number;
  combo: number;
  locale: Locale;
}) {
  return (
    <div className={styles.scoreBox}>
      <div className={styles.scoreLabel}>{t("score", locale)}</div>
      <div className={styles.scoreValue}>{score.toString().padStart(6, "0")}</div>
      {combo > 1 && (
        <div className={styles.combo}>
          <span className={styles.comboX}>×</span>
          <span className={styles.comboNum}>{combo}</span>
          <span className={styles.comboLabel}>COMBO</span>
        </div>
      )}
    </div>
  );
}
