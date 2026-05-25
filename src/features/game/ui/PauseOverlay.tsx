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
  const restart = useHud((s) => s.restart);
  const musicVolume = useHud((s) => s.musicVolume);
  const sfxVolume = useHud((s) => s.sfxVolume);
  const setMusicVolume = useHud((s) => s.setMusicVolume);
  const setSfxVolume = useHud((s) => s.setSfxVolume);

  if (status !== "paused") return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <h2 className={styles.title}>{t("paused", locale)}</h2>

        <div className={styles.volumeBlock}>
          <VolumeRow
            label={t("musicVol", locale)}
            value={musicVolume}
            onChange={setMusicVolume}
          />
          <VolumeRow
            label={t("sfxVol", locale)}
            value={sfxVolume}
            onChange={setSfxVolume}
          />
        </div>

        <div className={styles.actions}>
          <Button variant="primary" size="md" bracket onClick={resume}>
            {t("resume", locale)}
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={() => restart()}
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

function VolumeRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className={styles.volumeRow}>
      <label className={styles.volumeLabel}>{label}</label>
      <input
        className={styles.slider}
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      <span className={styles.volumeValue}>{Math.round(value * 100)}</span>
    </div>
  );
}
