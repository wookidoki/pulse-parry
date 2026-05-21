"use client";

import { useHud } from "../state";
import styles from "./ComboMilestone.module.css";

const LEVEL_TAGLINES: Record<number, string> = {
  10: "WARMING UP",
  25: "IN THE ZONE",
  50: "ZERO LATENCY",
  100: "TRANCE STATE",
  200: "SINGULARITY",
};

const LEVEL_CLASS: Record<number, string> = {
  10: "level1",
  25: "level2",
  50: "level3",
  100: "level4",
  200: "level5",
};

export function ComboMilestone() {
  const milestone = useHud((s) => s.milestone);
  if (!milestone) return null;

  const tagline = LEVEL_TAGLINES[milestone.level] ?? "FLOW";
  const cls = LEVEL_CLASS[milestone.level] ?? "level5";

  return (
    <div className={`${styles.container} ${styles[cls]}`} key={milestone.key}>
      <div className={styles.number}>×{milestone.level}</div>
      <div className={styles.tagline}>{tagline}</div>
    </div>
  );
}
