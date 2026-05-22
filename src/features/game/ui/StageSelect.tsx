"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { STAGES, tempoRangeOf } from "../config/stages";
import { CHARACTERS, CHARACTER_ORDER, type CharacterId } from "../config/characters";
import {
  DIFFICULTIES,
  DIFFICULTY_ORDER,
} from "../config/difficulty";
import { MODIFIERS, MODIFIER_ORDER, type RunModifierId } from "../config/modifiers";
import { loadProgress, getBestScore } from "../progress";
import type { Difficulty } from "../types";
import { loadLocale, saveLocale, t, type Locale } from "../i18n";
import { CharacterPortrait } from "./CharacterPortrait";
import { MenuBackground } from "./MenuBackground";
import styles from "./StageSelect.module.css";

function readBestScores(difficulty: Difficulty): Record<number, number> {
  if (typeof window === "undefined") return {};
  const m: Record<number, number> = {};
  for (let i = 0; i < STAGES.length; i++) m[i] = getBestScore(i, difficulty);
  return m;
}

export function StageSelect() {
  const [unlockedStage] = useState<number>(() =>
    typeof window === "undefined" ? 0 : loadProgress().unlockedStage,
  );
  const [locale, setLocale] = useState<Locale>(() => loadLocale());
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [characterId, setCharacterId] = useState<CharacterId>("ninja");
  const [modifierId, setModifierId] = useState<RunModifierId>("none");
  const [bests, setBests] = useState<Record<number, number>>(() =>
    readBestScores("normal"),
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBests(readBestScores(difficulty));
  }, [difficulty]);

  const toggleLocale = () => {
    const next: Locale = locale === "ko" ? "en" : "ko";
    setLocale(next);
    saveLocale(next);
  };

  return (
    <>
      <MenuBackground />
      <main className={styles.page}>
        <header className={styles.topBar}>
          <button className={styles.localeToggle} onClick={toggleLocale}>
            {locale === "ko" ? "EN" : "KO"}
          </button>
        </header>

        <section className={styles.hero}>
          <h1 className={styles.title}>
            <span className={styles.titleMagenta}>PULSE</span>
            <span className={styles.titleCyan}>PARRY</span>
          </h1>
          <p className={styles.subtitle}>{t("subtitle", locale)}</p>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>{t("chooseChar", locale)}</span>
          </div>
          <div className={styles.charRow}>
            {CHARACTER_ORDER.map((id) => {
              const c = CHARACTERS[id];
              const active = id === characterId;
              return (
                <button
                  key={id}
                  className={`${styles.charCard} ${active ? styles.charCardActive : ""}`}
                  style={{ borderColor: c.accentColor }}
                  onClick={() => setCharacterId(id)}
                >
                  <CharacterPortrait
                    characterId={id}
                    active={active}
                    className={styles.charPortrait}
                  />
                  <div className={styles.charName} style={{ color: c.accentColor }}>
                    {c.name[locale]}
                  </div>
                  <div className={styles.charTagline}>{c.tagline[locale]}</div>
                  <div className={styles.charStats}>
                    <StatBar label="CONE" value={c.coneAngleRad / 1.4} color={c.accentColor} />
                    <StatBar label="REACH" value={c.parryRange / 200} color={c.accentColor} />
                    <StatBar label="SPEED" value={(c.reflectSpeed - 600) / 600} color={c.accentColor} />
                    <StatBar label="HP" value={c.maxHp / 5} color={c.accentColor} />
                  </div>
                  <div className={styles.charAbility}>{c.ability[locale]}</div>
                </button>
              );
            })}
          </div>
        </section>

        <section className={styles.dualSection}>
          <div className={styles.subSection}>
            <span className={styles.sectionLabel}>{t("chooseDiff", locale)}</span>
            <div className={styles.pillRow}>
              {DIFFICULTY_ORDER.map((d) => (
                <button
                  key={d}
                  className={`${styles.pill} ${d === difficulty ? styles.pillActive : ""}`}
                  onClick={() => setDifficulty(d)}
                >
                  {DIFFICULTIES[d].label}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.subSection}>
            <span className={styles.sectionLabel}>{t("chooseMod", locale)}</span>
            <div className={styles.pillRow}>
              {MODIFIER_ORDER.map((id) => {
                const m = MODIFIERS[id];
                const active = id === modifierId;
                return (
                  <button
                    key={id}
                    className={`${styles.pill} ${active ? styles.pillActive : ""}`}
                    onClick={() => setModifierId(id)}
                    title={m.description[locale]}
                  >
                    {m.name[locale]}
                  </button>
                );
              })}
            </div>
            <p className={styles.modDesc}>
              {MODIFIERS[modifierId].description[locale]}
            </p>
          </div>
        </section>

        <section className={styles.section}>
          <span className={styles.sectionLabel}>{t("chooseStage", locale)}</span>
          <div className={styles.grid}>
            {STAGES.map((stage, i) => {
              const unlocked = i <= unlockedStage;
              const range = tempoRangeOf(stage);
              const best = bests[i] ?? 0;
              return (
                <Link
                  key={i}
                  href={
                    unlocked
                      ? `/play?stage=${i}&diff=${difficulty}&char=${characterId}&mod=${modifierId}`
                      : "#"
                  }
                  onClick={(e) => {
                    if (!unlocked) e.preventDefault();
                  }}
                  className={`${styles.stageCard} ${unlocked ? "" : styles.cardLocked} ${stage.isBoss ? styles.cardBoss : ""}`}
                >
                  <div className={styles.cardHeader}>
                    <span className={styles.cardIdx}>0{i + 1}</span>
                    {stage.isBoss && (
                      <span className={styles.cardBadge}>{t("boss", locale)}</span>
                    )}
                  </div>
                  <div className={styles.cardName}>{stage.name}</div>
                  <div className={styles.cardTagline}>{stage.tagline}</div>
                  <div className={styles.cardMeta}>
                    <span>{range.min}~{range.max} BPM</span>
                    <span>{Math.round(stage.durationMs / 1000)}s</span>
                  </div>
                  {best > 0 && (
                    <div className={styles.cardBest}>
                      {t("best", locale)} {best.toString().padStart(6, "0")}
                    </div>
                  )}
                  {!unlocked && (
                    <div className={styles.cardLockOverlay}>🔒 {t("locked", locale)}</div>
                  )}
                </Link>
              );
            })}
          </div>
        </section>

        <footer className={styles.footer}>
          <p>{t("controlHint", locale)}</p>
        </footer>
      </main>
    </>
  );
}

function StatBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <div className={styles.statBar}>
      <span className={styles.statLabel}>{label}</span>
      <div className={styles.statTrack}>
        <div
          className={styles.statFill}
          style={{ width: `${clamped * 100}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
