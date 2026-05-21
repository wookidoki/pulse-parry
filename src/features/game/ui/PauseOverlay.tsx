"use client";

import Link from "next/link";
import { useHud } from "../state";
import styles from "./PauseOverlay.module.css";

export function PauseOverlay() {
  const status = useHud((s) => s.status);
  const resume = useHud((s) => s.resume);
  const reset = useHud((s) => s.reset);
  const volume = useHud((s) => s.volume);
  const setVolume = useHud((s) => s.setVolume);

  if (status !== "paused") return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <h2 className={styles.title}>PAUSED</h2>

        <div className={styles.volumeRow}>
          <label className={styles.volumeLabel}>VOLUME</label>
          <input
            className={styles.slider}
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
          />
          <span className={styles.volumeValue}>{Math.round(volume * 100)}</span>
        </div>

        <div className={styles.actions}>
          <button className={styles.primaryBtn} onClick={resume}>
            ▶ RESUME
          </button>
          <button
            className={styles.secondaryBtn}
            onClick={() => {
              reset();
              window.location.reload();
            }}
          >
            ↻ RESTART
          </button>
          <Link href="/" className={styles.secondaryBtn}>
            ⌂ MAIN MENU
          </Link>
        </div>

        <p className={styles.hint}>
          <kbd>ESC</kbd> 다시 누르면 재개
        </p>
      </div>
    </div>
  );
}
