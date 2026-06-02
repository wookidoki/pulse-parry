"use client";

import { useEffect, useState } from "react";
import { useHud } from "../state";
import { STAGES } from "../config/stages";
import { initialLocale, type Locale } from "../i18n";
import {
  playBossSiren,
  playDeathBoom,
  playIntroWarp,
  playVictoryFlourish,
} from "../audio";
import styles from "./Cutscenes.module.css";

const INTRO_DURATION_MS = 2200;
const BOSS_DURATION_MS = 2600;
const DEATH_DURATION_MS = 1900;
const VICTORY_DURATION_MS = 2800;

function useSkipKey(active: boolean, finish: () => void): void {
  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        finish();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [active, finish]);
}

function SkipHint({ locale }: { locale: Locale }) {
  return (
    <div className={styles.skipHint}>
      {locale === "ko" ? "SPACE 건너뛰기" : "SPACE TO SKIP"}
    </div>
  );
}

export function IntroCutscene() {
  const status = useHud((s) => s.status);
  const stageIndex = useHud((s) => s.stageIndex);
  const completeIntro = useHud((s) => s.completeIntro);
  const [locale] = useState<Locale>(initialLocale);
  const active = status === "intro";

  useEffect(() => {
    if (!active) return;
    playIntroWarp();
    const id = window.setTimeout(() => completeIntro(), INTRO_DURATION_MS);
    return () => window.clearTimeout(id);
  }, [active, completeIntro]);

  useSkipKey(active, completeIntro);

  if (!active) return null;
  const stage = STAGES[Math.min(stageIndex, STAGES.length - 1)];

  return (
    <div className={styles.cutscene} aria-hidden onClick={completeIntro}>
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
        <p className={styles.tagline}>{stage.lore?.[locale] ?? stage.tagline}</p>
        <span className={styles.diveText}>DIVING INTO THE GRID</span>
      </div>
      <div className={styles.scanlines} />
      <SkipHint locale={locale} />
    </div>
  );
}

export function BossCutscene() {
  const status = useHud((s) => s.status);
  const completeBossCutscene = useHud((s) => s.completeBossCutscene);
  const [locale] = useState<Locale>(initialLocale);
  const active = status === "bossCutscene";

  useEffect(() => {
    if (!active) return;
    playBossSiren();
    const id = window.setTimeout(() => completeBossCutscene(), BOSS_DURATION_MS);
    return () => window.clearTimeout(id);
  }, [active, completeBossCutscene]);

  useSkipKey(active, completeBossCutscene);

  if (!active) return null;

  return (
    <div className={styles.cutscene} aria-hidden onClick={completeBossCutscene}>
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
      <SkipHint locale={locale} />
    </div>
  );
}

export function DeathCutscene() {
  const status = useHud((s) => s.status);
  const finalizeDeath = useHud((s) => s.finalizeDeath);
  const [locale] = useState<Locale>(initialLocale);
  const active = status === "dying";

  useEffect(() => {
    if (!active) return;
    playDeathBoom();
    const id = window.setTimeout(() => finalizeDeath(), DEATH_DURATION_MS);
    return () => window.clearTimeout(id);
  }, [active, finalizeDeath]);

  useSkipKey(active, finalizeDeath);

  if (!active) return null;

  return (
    <div className={styles.cutscene} aria-hidden onClick={finalizeDeath}>
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
      <SkipHint locale={locale} />
    </div>
  );
}

export function VictoryCutscene() {
  const status = useHud((s) => s.status);
  const finalizeVictory = useHud((s) => s.finalizeVictory);
  const [locale] = useState<Locale>(initialLocale);
  const active = status === "winning";

  useEffect(() => {
    if (!active) return;
    playVictoryFlourish();
    const id = window.setTimeout(() => finalizeVictory(), VICTORY_DURATION_MS);
    return () => window.clearTimeout(id);
  }, [active, finalizeVictory]);

  useSkipKey(active, finalizeVictory);

  if (!active) return null;

  return (
    <div className={styles.cutscene} aria-hidden onClick={finalizeVictory}>
      <div className={styles.victoryRays}>
        {Array.from({ length: 36 }).map((_, i) => (
          <span
            key={i}
            className={styles.victoryRay}
            style={{
              transform: `rotate(${(i / 36) * 360}deg)`,
              animationDelay: `${(i % 6) * 0.04}s`,
            }}
          />
        ))}
      </div>
      <div className={styles.victoryBurst} />
      <div className={styles.victoryContent}>
        <span className={styles.victoryLabel}>
          {locale === "ko" ? "코어 정화 완료" : "CORE PURGED"}
        </span>
        <h2 className={styles.victoryTitle}>VICTORY</h2>
        <p className={styles.victorySubtitle}>
          {locale === "ko"
            ? "시스템이 다시 숨 쉰다 — 비트는 너의 것이었다"
            : "THE SYSTEM BREATHES AGAIN — THE BEAT WAS YOURS"}
        </p>
      </div>
      <div className={styles.scanlines} />
      <SkipHint locale={locale} />
    </div>
  );
}
