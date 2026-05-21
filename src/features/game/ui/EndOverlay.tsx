"use client";

import { useHud } from "../state";
import styles from "./EndOverlay.module.css";

export function EndOverlay() {
  const status = useHud((s) => s.status);
  const score = useHud((s) => s.score);
  const maxCombo = useHud((s) => s.maxCombo);
  const reset = useHud((s) => s.reset);

  if (status !== "gameover" && status !== "victory") return null;
  const isVictory = status === "victory";

  return (
    <div className={`${styles.overlay} ${isVictory ? styles.victory : styles.gameover}`}>
      <h2 className={isVictory ? styles.titleVictory : styles.titleGameover}>
        {isVictory ? "SYNC COMPLETE" : "SYSTEM DOWN"}
      </h2>
      <div className={styles.stats}>
        <div>SCORE <span>{score.toString().padStart(6, "0")}</span></div>
        <div>MAX COMBO <span>×{maxCombo}</span></div>
      </div>
      <button
        className={styles.retryBtn}
        onClick={() => {
          reset();
          window.location.reload();
        }}
      >
        ▶ RETRY
      </button>
    </div>
  );
}
