"use client";

import { useState } from "react";
import { useHud } from "../state";
import { initialLocale, t, type Locale } from "../i18n";
import { Button, ButtonLink } from "./Button";
import styles from "./PauseOverlay.module.css";

export function PauseOverlay() {
  const [locale] = useState<Locale>(initialLocale);

  const status = useHud((s) => s.status);
  const resume = useHud((s) => s.resume);
  const reset = useHud((s) => s.reset);
  const volume = useHud((s) => s.volume);
  const setVolume = useHud((s) => s.setVolume);

  if (status !== "paused") return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <h2 className={styles.title}>{t("paused", locale)}</h2>

        <div className={styles.volumeRow}>
          <label className={styles.volumeLabel}>{t("volume", locale)}</label>
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
          <Button variant="primary" size="md" bracket onClick={resume}>
            {t("resume", locale)}
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={() => {
              reset();
              window.location.reload();
            }}
          >
            {t("restart", locale)}
          </Button>
          <ButtonLink variant="secondary" size="md" href="/">
            {t("mainMenu", locale)}
          </ButtonLink>
        </div>

        <p className={styles.hint}>
          <kbd>ESC</kbd>
        </p>
      </div>
    </div>
  );
}
