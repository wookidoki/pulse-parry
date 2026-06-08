import type { EngineState } from "../types";
import { STAGES, currentStage } from "../config/stages";
import { CHARACTERS } from "../config/characters";
import { PALETTE } from "../config/palette";
import { ON_BEAT_WINDOW } from "../config/tuning";
import { bpmAt } from "../engine/tempo";

// Contracting beat ring: reaches the parry range exactly on the downbeat so the
// player can time SPACE to the beat. Turns yellow inside the ON-BEAT window.
export function drawBeatGuide(c: CanvasRenderingContext2D, state: EngineState): void {
  const char = CHARACTERS[state.characterId];
  const phase = state.beat.beatPhase;
  const r = char.parryRange * (1 + (1 - phase) * 0.85);
  const onBeat = Math.min(phase, 1 - phase) <= ON_BEAT_WINDOW;
  c.save();
  if (onBeat) {
    c.strokeStyle = "rgba(247, 255, 58, 0.5)";
    c.lineWidth = 2.5;
    c.shadowColor = "rgba(247, 255, 58, 0.6)";
    c.shadowBlur = 10;
  } else {
    c.strokeStyle = "rgba(28, 240, 255, 0.16)";
    c.lineWidth = 1.5;
  }
  c.beginPath();
  c.arc(0, 0, r, 0, Math.PI * 2);
  c.stroke();
  c.restore();
}

export function drawAimLine(
  c: CanvasRenderingContext2D,
  state: EngineState,
  w: number,
  h: number,
): void {
  const aimLen = Math.max(w, h);
  c.strokeStyle = "rgba(28, 240, 255, 0.18)";
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(Math.cos(state.aimAngle) * aimLen, Math.sin(state.aimAngle) * aimLen);
  c.stroke();
}

export function drawParryCone(
  c: CanvasRenderingContext2D,
  state: EngineState,
  nowMs: number,
): void {
  if (!state.parryHeld) return;
  const char = CHARACTERS[state.characterId];
  const startA = state.aimAngle - char.coneAngleRad;
  const endA = state.aimAngle + char.coneAngleRad;
  const pulse = 0.5 + Math.sin(nowMs / 80) * 0.1;
  c.fillStyle = `rgba(247, 255, 58, ${0.12 * pulse})`;
  c.beginPath();
  c.moveTo(0, 0);
  c.arc(0, 0, char.parryRange, startA, endA);
  c.closePath();
  c.fill();
  c.save();
  c.strokeStyle = `rgba(247, 255, 58, ${0.6 * pulse})`;
  c.lineWidth = 2;
  c.shadowColor = "rgba(247, 255, 58, 0.9)";
  c.shadowBlur = 16;
  c.beginPath();
  c.arc(0, 0, char.parryRange, startA, endA);
  c.stroke();
  c.restore();
}

export function drawBossHpBar(
  c: CanvasRenderingContext2D,
  state: EngineState,
  w: number,
  nowMs: number,
): void {
  let boss: { hp: number; maxHp: number } | null = null;
  for (const e of state.enemies) {
    if (e.kind === "boss" && e.state !== "dead") {
      boss = { hp: Math.max(0, e.hp), maxHp: e.maxHp };
      break;
    }
  }
  if (!boss) return;

  const barW = w * 0.5;
  const barX = (w - barW) / 2;
  const barY = 24;
  const barH = 10;
  const fraction = boss.hp / boss.maxHp;
  const pulse = 0.7 + Math.sin(nowMs / 180) * 0.3;

  c.save();
  c.fillStyle = "rgba(5, 3, 10, 0.7)";
  c.fillRect(barX - 4, barY - 4, barW + 8, barH + 8);

  c.fillStyle = "rgba(240, 246, 255, 0.1)";
  c.fillRect(barX, barY, barW, barH);

  c.fillStyle = "#ff3863";
  c.shadowColor = "#ff3863";
  c.shadowBlur = 14 * pulse;
  c.fillRect(barX, barY, barW * fraction, barH);
  c.shadowBlur = 0;

  c.strokeStyle = "rgba(255, 56, 99, 0.7)";
  c.lineWidth = 1;
  c.strokeRect(barX, barY, barW, barH);

  c.fillStyle = "#ffffff";
  c.font = "bold 14px ui-monospace, monospace";
  c.textAlign = "center";
  c.textBaseline = "bottom";
  c.fillText(`THE CORE  —  ${boss.hp} / ${boss.maxHp}`, w / 2, barY - 6);

  // Hint: damage only lands on the glowing weak point.
  c.font = "bold 11px ui-monospace, monospace";
  c.fillStyle = PALETTE.yellow;
  c.shadowColor = PALETTE.yellow;
  c.shadowBlur = 8 * pulse;
  c.textBaseline = "top";
  c.fillText("◆ STRIKE THE WEAK POINT", w / 2, barY + barH + 6);
  c.restore();
}

export function drawStageProgress(
  c: CanvasRenderingContext2D,
  state: EngineState,
  w: number,
  nowMs: number,
): void {
  const stage = currentStage(state.stageIndex);
  const elapsed = nowMs - state.stageStartMs;
  const progress = Math.min(1, elapsed / stage.durationMs);
  const barW = w * 0.6;
  const barX = (w - barW) / 2;

  c.save();
  c.fillStyle = "rgba(240, 246, 255, 0.08)";
  c.fillRect(barX, 0, barW, 3);
  c.fillStyle = stage.accentCyan;
  c.shadowColor = stage.accentCyan;
  c.shadowBlur = 8;
  c.fillRect(barX, 0, barW * progress, 3);
  c.restore();

  c.fillStyle = "rgba(240, 246, 255, 0.4)";
  for (let i = 1; i < STAGES.length; i++) {
    const segX = barX + (i / STAGES.length) * barW;
    c.fillRect(segX - 1, 0, 2, 6);
  }

  drawTempoCurve(c, state, barX, barW, progress);
  drawLiveBpm(c, state, barX + barW + 12);
}

function drawTempoCurve(
  c: CanvasRenderingContext2D,
  state: EngineState,
  barX: number,
  barW: number,
  liveT: number,
): void {
  const stage = currentStage(state.stageIndex);
  const samples = 80;
  const top = 12;
  const height = 18;
  let minBpm = Infinity;
  let maxBpm = -Infinity;
  for (const point of stage.tempoMap) {
    if (point.bpm < minBpm) minBpm = point.bpm;
    if (point.bpm > maxBpm) maxBpm = point.bpm;
  }
  const range = Math.max(1, maxBpm - minBpm);

  c.save();
  c.strokeStyle = "rgba(240, 246, 255, 0.18)";
  c.lineWidth = 1;
  c.beginPath();
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const bpm = bpmAt(stage.tempoMap, t);
    const x = barX + t * barW;
    const y = top + height - ((bpm - minBpm) / range) * height;
    if (i === 0) c.moveTo(x, y);
    else c.lineTo(x, y);
  }
  c.stroke();
  c.restore();

  const liveBpm = bpmAt(stage.tempoMap, liveT);
  const markerX = barX + liveT * barW;
  const markerY = top + height - ((liveBpm - minBpm) / range) * height;

  c.save();
  c.fillStyle = stage.accentCyan;
  c.shadowColor = stage.accentCyan;
  c.shadowBlur = 6;
  c.beginPath();
  c.arc(markerX, markerY, 3, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

function drawLiveBpm(
  c: CanvasRenderingContext2D,
  state: EngineState,
  x: number,
): void {
  const bpm = Math.round(state.beat.bpm);
  c.save();
  c.fillStyle = "rgba(240, 246, 255, 0.7)";
  c.font = "13px ui-monospace, monospace";
  c.textBaseline = "top";
  c.fillText(`${bpm} BPM ♪`, x, 6);
  c.restore();
}
