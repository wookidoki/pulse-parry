"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useHud } from "../state";
import { recordScore } from "../progress";
import { initialLocale, t, type Locale } from "../i18n";
import styles from "./EndOverlay.module.css";

export function EndOverlay() {
  const [locale] = useState<Locale>(initialLocale);

  const status = useHud((s) => s.status);
  const score = useHud((s) => s.score);
  const maxCombo = useHud((s) => s.maxCombo);
  const stageIndex = useHud((s) => s.stageIndex);
  const reset = useHud((s) => s.reset);

  useEffect(() => {
    if (status === "victory" || status === "gameover") {
      recordScore(stageIndex, "normal", score);
    }
  }, [status, stageIndex, score]);

  if (status !== "gameover" && status !== "victory") return null;
  const isVictory = status === "victory";

  return (
    <div className={`${styles.overlay} ${isVictory ? styles.victory : styles.gameover}`}>
      <h2 className={isVictory ? styles.titleVictory : styles.titleGameover}>
        {isVictory ? t("syncComplete", locale) : t("systemDown", locale)}
      </h2>
      <div className={styles.stats}>
        <div>
          {t("score", locale)} <span>{score.toString().padStart(6, "0")}</span>
        </div>
        <div>
          {t("maxCombo", locale)} <span>×{maxCombo}</span>
        </div>
      </div>
      <div className={styles.actionRow}>
        <button
          className={styles.retryBtn}
          onClick={() => {
            reset();
            window.location.reload();
          }}
        >
          {t("retry", locale)}
        </button>
        <Link href="/" className={styles.menuBtn} onClick={() => reset()}>
          {t("stageSelect", locale)}
        </Link>
      </div>
    </div>
  );
}
