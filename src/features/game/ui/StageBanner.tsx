"use client";

import { useHud } from "../state";
import { STAGES, tempoRangeOf } from "../config/stages";
import styles from "./StageBanner.module.css";

export function StageBanner() {
  const stageIndex = useHud((s) => s.stageIndex);
  const stage = STAGES[Math.min(stageIndex, STAGES.length - 1)];
  const range = tempoRangeOf(stage);

  return (
    <div className={styles.banner} key={stageIndex}>
      <div className={styles.stageNum}>STAGE {stageIndex + 1}</div>
      <div className={styles.stageName}>{stage.name}</div>
      <div className={styles.stageBpm}>
        {range.min} → {range.max} BPM
      </div>
    </div>
  );
}
