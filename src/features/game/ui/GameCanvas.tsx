"use client";

import { useEffect, useRef } from "react";
import { createEngineState, update } from "../engine/update";
import { ensureAudio, resumeAudio } from "../audio";
import { useHud } from "../state";
import type { EngineState, PlayerInput } from "../types";
import { render } from "../render/frame";
import styles from "./GameCanvas.module.css";

const MAX_DT_SEC = 0.05;

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<EngineState | null>(null);
  const inputRef = useRef<PlayerInput>({ aimX: 1, aimY: 0, parryHeld: false });
  const rafRef = useRef<number | null>(null);

  const start = useHud((s) => s.start);
  const damage = useHud((s) => s.damage);
  const addScore = useHud((s) => s.addScore);
  const bumpCombo = useHud((s) => s.bumpCombo);
  const breakCombo = useHud((s) => s.breakCombo);
  const setStage = useHud((s) => s.setStage);
  const victory = useHud((s) => s.victory);

  useEffect(() => {
    start();
  }, [start]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dprRef = { current: window.devicePixelRatio || 1 };
    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      dprRef.current = window.devicePixelRatio || 1;
      canvas.width = w * dprRef.current;
      canvas.height = h * dprRef.current;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    };
    resize();

    ensureAudio();
    const gestureHandler = () => {
      resumeAudio();
      window.removeEventListener("pointerdown", gestureHandler);
      window.removeEventListener("keydown", gestureHandler);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - window.innerWidth / 2;
      const dy = e.clientY - window.innerHeight / 2;
      const d = Math.hypot(dx, dy) || 1;
      inputRef.current.aimX = dx / d;
      inputRef.current.aimY = dy / d;
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      e.preventDefault();
      inputRef.current.parryHeld = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      e.preventDefault();
      inputRef.current.parryHeld = false;
    };

    window.addEventListener("resize", resize);
    window.addEventListener("pointerdown", gestureHandler);
    window.addEventListener("keydown", gestureHandler);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    const startTime = performance.now();
    engineRef.current = createEngineState(0);
    let prevTime = startTime;

    const loop = (t: number) => {
      const nowMs = t - startTime;
      const dt = Math.min(MAX_DT_SEC, (t - prevTime) / 1000);
      prevTime = t;
      const engine = engineRef.current;
      if (!engine) return;

      const w = window.innerWidth;
      const h = window.innerHeight;

      if (useHud.getState().status === "playing") {
        update({
          state: engine,
          input: inputRef.current,
          nowMs,
          dt,
          canvasW: w,
          canvasH: h,
          onScore: addScore,
          onCombo: bumpCombo,
          onComboBreak: breakCombo,
          onDamage: damage,
          onStageUp: setStage,
          onVictory: victory,
        });
      }

      render(ctx, engine, w, h, dprRef.current, nowMs);

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointerdown", gestureHandler);
      window.removeEventListener("keydown", gestureHandler);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [addScore, bumpCombo, breakCombo, damage, setStage, victory]);

  return <canvas ref={canvasRef} className={styles.canvas} />;
}
