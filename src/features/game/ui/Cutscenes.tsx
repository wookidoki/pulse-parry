"use client";

import { useEffect, useState } from "react";
import { useHud } from "../state";
import { STAGES } from "../config/stages";
import { initialLocale, type Locale } from "../i18n";
import styles from "./Cutscenes.module.css";

const INTRO_DURATION_MS = 2200;
const BOSS_DURATION_MS = 2600;
const DEATH_DURATION_MS = 1900;

export function IntroCutscene() {
  const status = useHud((s) => s.status);
  const stageIndex = useHud((s) => s.stageIndex);
  const completeIntro = useHud((s) => s.completeIntro);
  const [locale] = useState<Locale>(initialLocale);

  useEffect(() => {
    if (status !== "intro") return;
    const id = window.setTimeout(() => completeIntro(), INTRO_DURATION_MS);
    return () => window.clearTimeout(id);
  }, [status, completeIntro]);

  if (status !== "intro") return null;
  const stage = STAGES[Math.min(stageIndex, STAGES.length - 1)];

  return (
    <div className={styles.cutscene} aria-hidden>
      <div className={styles.warpField}>
        {Array.from({ length: 60 }).map((_, i) => (
          <span
            key={i}
            className={styles.warpLine}
            style={{
              transform: `rotate(${(i / 60) * 360}deg)`,
              animationDelay: `${(i / 60) * 0.4}s`,
            }}
          />
        ))}
      </div>
      <div className={styles.introContent}>
        <span className={styles.stageNum}>STAGE 0{stageIndex + 1}</span>
        <h2 className={styles.stageName}>{stage.name}</h2>
        <p className={styles.tagline}>{stage.tagline}</p>
        <span className={styles.diveText}>
          {locale === "ko" ? "DIVING INTO THE GRID" : "DIVING INTO THE GRID"}
        </span>
      </div>
      <div className={styles.scanlines} />
    </div>
  );
}

export function BossCutscene() {
  const status = useHud((s) => s.status);
  const completeBossCutscene = useHud((s) => s.completeBossCutscene);
  const [locale] = useState<Locale>(initialLocale);

  useEffect(() => {
    if (status !== "bossCutscene") return;
    const id = window.setTimeout(() => completeBossCutscene(), BOSS_DURATION_MS);
    return () => window.clearTimeout(id);
  }, [status, completeBossCutscene]);

  if (status !== "bossCutscene") return null;

  return (
    <div className={styles.cutscene} aria-hidden>
      <div className={styles.bossGlitch} />
      <div className={styles.bossWarning}>
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} className={styles.bossBar} style={{ animationDelay: `${i * 0.05}s` }} />
        ))}
      </div>
      <div className={styles.bossContent}>
        <span className={styles.bossAlert}>⚠ {locale === "ko" ? "위협 감지" : "THREAT DETECTED"} ⚠</span>
        <h2 className={styles.bossTitle}>THE CORE</h2>
        <p className={styles.bossSubtitle}>
          {locale === "ko" ? "본체 깨어남 — 박자에 맞춰 부숴라" : "PRIME AWAKENING — SYNC TO BREAK"}
        </p>
      </div>
      <div className={styles.scanlines} />
    </div>
  );
}

export function DeathCutscene() {
  const status = useHud((s) => s.status);
  const finalizeDeath = useHud((s) => s.finalizeDeath);
  const [locale] = useState<Locale>(initialLocale);

  useEffect(() => {
    if (status !== "dying") return;
    const id = window.setTimeout(() => finalizeDeath(), DEATH_DURATION_MS);
    return () => window.clearTimeout(id);
  }, [status, finalizeDeath]);

  if (status !== "dying") return null;

  return (
    <div className={styles.cutscene} aria-hidden>
      <div className={styles.deathOverlay} />
      <div className={styles.deathCracks}>
        {Array.from({ length: 8 }).map((_, i) => (
          <span
            key={i}
            className={styles.deathCrack}
            style={{
              transform: `rotate(${i * 45}deg) translateY(-50%)`,
              animationDelay: `${i * 0.04}s`,
            }}
          />
        ))}
      </div>
      <div className={styles.deathContent}>
        <span className={styles.deathLabel}>
          {locale === "ko" ? "동기화 실패" : "SYNC FAILED"}
        </span>
        <h2 className={styles.deathTitle}>SYSTEM FAILURE</h2>
        <p className={styles.deathHint}>
          {locale === "ko" ? "재부팅 중..." : "REBOOTING..."}
        </p>
      </div>
      <div className={styles.scanlines} />
    </div>
  );
}
