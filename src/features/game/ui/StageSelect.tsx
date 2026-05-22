"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { STAGES, tempoRangeOf } from "../config/stages";
import { loadProgress, getBestScore } from "../progress";
import type { Difficulty } from "../types";
import { DIFFICULTIES, DIFFICULTY_ORDER } from "../config/difficulty";
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
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [bests, setBests] = useState<Record<number, number>>(() =>
    readBestScores("normal"),
  );

  useEffect(() => {
    // localStorage read in response to user input — safe pattern despite lint rule
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBests(readBestScores(difficulty));
  }, [difficulty]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          <span className={styles.titleMagenta}>PULSE</span>
          <span className={styles.titleCyan}>PARRY</span>
        </h1>
        <p className={styles.subtitle}>360° RHYTHM PARRY SURVIVOR</p>
      </header>

      <div className={styles.difficultyRow}>
        <span className={styles.diffLabel}>DIFFICULTY</span>
        {DIFFICULTY_ORDER.map((d) => (
          <button
            key={d}
            className={`${styles.diffBtn} ${d === difficulty ? styles.diffBtnActive : ""}`}
            onClick={() => setDifficulty(d)}
          >
            {DIFFICULTIES[d].label}
          </button>
        ))}
      </div>

      <div className={styles.grid}>
        {STAGES.map((stage, i) => {
          const unlocked = i <= unlockedStage;
          const range = tempoRangeOf(stage);
          const best = bests[i] ?? 0;
          return (
            <Link
              key={i}
              href={unlocked ? `/play?stage=${i}&diff=${difficulty}` : "#"}
              onClick={(e) => {
                if (!unlocked) e.preventDefault();
              }}
              className={`${styles.card} ${unlocked ? "" : styles.cardLocked} ${stage.isBoss ? styles.cardBoss : ""}`}
            >
              <div className={styles.cardHeader}>
                <span className={styles.cardIdx}>0{i + 1}</span>
                {stage.isBoss && <span className={styles.cardBadge}>BOSS</span>}
              </div>
              <div className={styles.cardName}>{stage.name}</div>
              <div className={styles.cardTagline}>{stage.tagline}</div>
              <div className={styles.cardMeta}>
                <span>{range.min}~{range.max} BPM</span>
                <span>{Math.round(stage.durationMs / 1000)}s</span>
              </div>
              {best > 0 && (
                <div className={styles.cardBest}>
                  BEST {best.toString().padStart(6, "0")}
                </div>
              )}
              {!unlocked && <div className={styles.cardLockOverlay}>🔒 LOCKED</div>}
            </Link>
          );
        })}
      </div>

      <div className={styles.hints}>
        <p>
          <kbd>WASD</kbd> 회피 · <kbd>SHIFT</kbd> 대시 · <kbd>MOUSE</kbd> 조준 · <kbd>SPACE</kbd> 막기 / 놓음=반격 · <kbd>꾹</kbd>=차지 · <kbd>딱</kbd>=PERFECT · <kbd>ESC</kbd> 일시정지
        </p>
      </div>
    </main>
  );
}
