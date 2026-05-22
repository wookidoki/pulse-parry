"use client";

import { useEffect, useRef } from "react";
import { createEngineState, update } from "../engine/update";
import { ensureAudio, resumeAudio, setMasterVolume } from "../audio";
import {
  initMusic,
  pauseMusic,
  playStageBgm,
  resumeMusic,
  setMusicVolume,
  setupAudioAnalysis,
} from "../music";
import { useHud } from "../state";
import { preloadEnemySprites } from "../render/enemy-sprites";
import type { Difficulty, EngineState, PlayerInput } from "../types";
import { CHARACTERS, type CharacterId } from "../config/characters";
import { MODIFIERS, type RunModifierId } from "../config/modifiers";
import { render } from "../render/frame";
import styles from "./GameCanvas.module.css";

const MAX_DT_SEC = 0.05;

const MOVE_KEYS: Record<string, keyof Pick<PlayerInput, "moveUp" | "moveDown" | "moveLeft" | "moveRight">> = {
  KeyW: "moveUp",
  KeyS: "moveDown",
  KeyA: "moveLeft",
  KeyD: "moveRight",
  ArrowUp: "moveUp",
  ArrowDown: "moveDown",
  ArrowLeft: "moveLeft",
  ArrowRight: "moveRight",
};

interface GameCanvasProps {
  startStage?: number;
  difficulty?: Difficulty;
  characterId?: CharacterId;
  modifierId?: RunModifierId;
}

export function GameCanvas({
  startStage = 0,
  difficulty = "normal",
  characterId = "ninja",
  modifierId = "none",
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<EngineState | null>(null);
  const inputRef = useRef<PlayerInput>({
    rawMouseX: 1,
    rawMouseY: 0,
    parryHeld: false,
    moveUp: false,
    moveDown: false,
    moveLeft: false,
    moveRight: false,
    dashPressed: false,
  });
  const rafRef = useRef<number | null>(null);

  const start = useHud((s) => s.start);
  const damage = useHud((s) => s.damage);
  const heal = useHud((s) => s.heal);
  const addScore = useHud((s) => s.addScore);
  const bumpCombo = useHud((s) => s.bumpCombo);
  const breakCombo = useHud((s) => s.breakCombo);
  const bumpParries = useHud((s) => s.bumpParries);
  const bumpEnemiesKilled = useHud((s) => s.bumpEnemiesKilled);
  const setStage = useHud((s) => s.setStage);
  const victory = useHud((s) => s.victory);
  const togglePause = useHud((s) => s.togglePause);
  const musicVolume = useHud((s) => s.musicVolume);
  const sfxVolume = useHud((s) => s.sfxVolume);
  const stageIndex = useHud((s) => s.stageIndex);
  const status = useHud((s) => s.status);

  useEffect(() => {
    const char = CHARACTERS[characterId];
    const mod = MODIFIERS[modifierId];
    start(char.maxHp + mod.startHpDelta);
    preloadEnemySprites();
  }, [start, characterId, modifierId]);

  useEffect(() => {
    setMasterVolume(sfxVolume);
  }, [sfxVolume]);

  useEffect(() => {
    setMusicVolume(musicVolume);
  }, [musicVolume]);

  useEffect(() => {
    initMusic();
  }, []);

  useEffect(() => {
    if (status === "playing") playStageBgm(stageIndex);
  }, [stageIndex, status]);

  useEffect(() => {
    if (status === "paused") pauseMusic();
    else if (status === "playing") resumeMusic();
  }, [status]);

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
    setMasterVolume(useHud.getState().sfxVolume);
    setMusicVolume(useHud.getState().musicVolume);
    const gestureHandler = () => {
      resumeAudio();
      setupAudioAnalysis();
      playStageBgm(useHud.getState().stageIndex);
      window.removeEventListener("pointerdown", gestureHandler);
      window.removeEventListener("keydown", gestureHandler);
    };

    const handleMouseMove = (e: MouseEvent) => {
      inputRef.current.rawMouseX = e.clientX - window.innerWidth / 2;
      inputRef.current.rawMouseY = e.clientY - window.innerHeight / 2;
    };
    const isDashKey = (code: string) =>
      code === "ShiftLeft" || code === "ShiftRight" || code === "KeyQ";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        inputRef.current.parryHeld = true;
        return;
      }
      if (e.code === "Escape") {
        e.preventDefault();
        togglePause();
        inputRef.current.parryHeld = false;
        return;
      }
      if (isDashKey(e.code)) {
        e.preventDefault();
        inputRef.current.dashPressed = true;
        return;
      }
      const moveKey = MOVE_KEYS[e.code];
      if (moveKey) {
        e.preventDefault();
        inputRef.current[moveKey] = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        inputRef.current.parryHeld = false;
        return;
      }
      if (isDashKey(e.code)) {
        e.preventDefault();
        inputRef.current.dashPressed = false;
        return;
      }
      const moveKey = MOVE_KEYS[e.code];
      if (moveKey) {
        e.preventDefault();
        inputRef.current[moveKey] = false;
      }
    };
    const handleBlur = () => {
      inputRef.current.parryHeld = false;
      inputRef.current.moveUp = false;
      inputRef.current.moveDown = false;
      inputRef.current.moveLeft = false;
      inputRef.current.moveRight = false;
      inputRef.current.dashPressed = false;
    };

    window.addEventListener("resize", resize);
    window.addEventListener("pointerdown", gestureHandler);
    window.addEventListener("keydown", gestureHandler);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);

    const startTime = performance.now();
    engineRef.current = createEngineState(0, startStage, difficulty, characterId, modifierId);
    setStage(startStage);
    let prevTime = startTime;

    const loop = (t: number) => {
      const nowMs = t - startTime;
      const dt = Math.min(MAX_DT_SEC, (t - prevTime) / 1000);
      prevTime = t;
      const engine = engineRef.current;
      if (!engine) return;

      const w = window.innerWidth;
      const h = window.innerHeight;
      const hudState = useHud.getState();

      if (hudState.status === "playing") {
        const scoreMul = MODIFIERS[engine.modifierId].scoreMul;
        update({
          state: engine,
          input: inputRef.current,
          nowMs,
          dt,
          canvasW: w,
          canvasH: h,
          currentComboHint: hudState.combo,
          onScore: (n) => addScore(Math.round(n * scoreMul)),
          onCombo: bumpCombo,
          onComboBreak: breakCombo,
          onDamage: damage,
          onHeal: heal,
          onStageUp: setStage,
          onVictory: victory,
          onParries: bumpParries,
          onEnemyKilled: bumpEnemiesKilled,
        });
      }

      render(ctx, engine, w, h, dprRef.current, nowMs, {
        combo: hudState.combo,
        paused: hudState.status === "paused",
      });

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
      window.removeEventListener("blur", handleBlur);
    };
  }, [addScore, bumpCombo, breakCombo, bumpParries, bumpEnemiesKilled, damage, heal, setStage, victory, togglePause, startStage, difficulty, characterId, modifierId]);

  return <canvas ref={canvasRef} className={styles.canvas} />;
}
