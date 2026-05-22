"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useHud } from "../state";
import { recordScore } from "../progress";
import { initialLocale, t, type Locale } from "../i18n";
import type { Difficulty } from "../types";
import styles from "./EndOverlay.module.css";

interface RankInfo {
  letter: string;
  color: string;
  glow: string;
}

function computeRank(
  isVictory: boolean,
  accuracy: number,
  damageTaken: number,
): RankInfo {
  if (!isVictory) return { letter: "F", color: "#ff3863", glow: "rgba(255,56,99,0.85)" };
  if (accuracy >= 0.85 && damageTaken === 0) return { letter: "S", color: "#f7ff3a", glow: "rgba(247,255,58,0.95)" };
  if (accuracy >= 0.70) return { letter: "A", color: "#1cf0ff", glow: "rgba(28,240,255,0.85)" };
  if (accuracy >= 0.50) return { letter: "B", color: "#ff2bd6", glow: "rgba(255,43,214,0.85)" };
  if (accuracy >= 0.30) return { letter: "C", color: "#b14bff", glow: "rgba(177,75,255,0.85)" };
  return { letter: "D", color: "rgba(240,246,255,0.75)", glow: "rgba(240,246,255,0.5)" };
}

function formatTime(ms: number): string {
  if (ms <= 0) return "0:00";
  const sec = Math.floor(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function EndOverlay() {
  const [locale] = useState<Locale>(initialLocale);
  const searchParams = useSearchParams();
  const diffParam = searchParams?.get("diff");
  const difficulty: Difficulty =
    diffParam === "easy" || diffParam === "hard" ? diffParam : "normal";

  const status = useHud((s) => s.status);
  const score = useHud((s) => s.score);
  const maxCombo = useHud((s) => s.maxCombo);
  const stageIndex = useHud((s) => s.stageIndex);
  const totalParries = useHud((s) => s.totalParries);
  const perfectParries = useHud((s) => s.perfectParries);
  const damageTaken = useHud((s) => s.damageTaken);
  const enemiesKilled = useHud((s) => s.enemiesKilled);
  const playStartMs = useHud((s) => s.playStartMs);
  const playEndMs = useHud((s) => s.playEndMs);
  const reset = useHud((s) => s.reset);

  useEffect(() => {
    if (status === "victory" || status === "gameover") {
      recordScore(stageIndex, difficulty, score);
    }
  }, [status, stageIndex, score, difficulty]);

  const isVictory = status === "victory";
  const accuracy = totalParries > 0 ? perfectParries / totalParries : 0;
  const playDurationMs = playEndMs > playStartMs ? playEndMs - playStartMs : 0;
  const rank = useMemo(
    () => computeRank(isVictory, accuracy, damageTaken),
    [isVictory, accuracy, damageTaken],
  );

  if (status !== "gameover" && status !== "victory") return null;

  return (
    <div className={`${styles.overlay} ${isVictory ? styles.victory : styles.gameover}`}>
      <div className={styles.panel}>
        <h2 className={isVictory ? styles.titleVictory : styles.titleGameover}>
          {isVictory ? t("syncComplete", locale) : t("systemDown", locale)}
        </h2>

        <div
          className={styles.rankBadge}
          style={{
            color: rank.color,
            textShadow: `0 0 24px ${rank.glow}, 0 0 64px ${rank.glow}`,
            borderColor: rank.color,
            boxShadow: `0 0 28px ${rank.glow}, inset 0 0 28px ${rank.glow}33`,
          }}
        >
          <span className={styles.rankLabel}>{t("rank", locale)}</span>
          <span className={styles.rankLetter}>{rank.letter}</span>
        </div>

        <div className={styles.scoreRow}>
          <span className={styles.scoreLabel}>{t("score", locale)}</span>
          <span className={styles.scoreValue}>{score.toString().padStart(6, "0")}</span>
        </div>

        <div className={styles.statGrid}>
          <Stat label={t("perfect", locale)} value={`${perfectParries}`} accent="#ffffff" />
          <Stat label={t("accuracy", locale)} value={`${Math.round(accuracy * 100)}%`} accent="#f7ff3a" />
          <Stat label={t("parries", locale)} value={`${totalParries}`} accent="#1cf0ff" />
          <Stat label={t("maxCombo", locale)} value={`×${maxCombo}`} accent="#ff2bd6" />
          <Stat label={t("killed", locale)} value={`${enemiesKilled}`} accent="#1cf0ff" />
          <Stat label={t("damage", locale)} value={`${damageTaken}`} accent="#ff3863" />
          <Stat
            label={t("timePlayed", locale)}
            value={formatTime(playDurationMs)}
            accent="rgba(240,246,255,0.85)"
          />
        </div>

        {totalParries > 0 && (
          <div className={styles.accuracyBar}>
            <div
              className={styles.accuracyFill}
              style={{ width: `${Math.round(accuracy * 100)}%` }}
            />
          </div>
        )}

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
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className={styles.stat}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue} style={{ color: accent, textShadow: `0 0 10px ${accent}88` }}>
        {value}
      </span>
    </div>
  );
}
