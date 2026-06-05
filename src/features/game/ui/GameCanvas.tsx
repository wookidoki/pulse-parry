"use client";

import { useEffect, useRef } from "react";
import { createEngineState, update } from "../engine/update";
import { ensureAudio, resumeAudio, setMasterVolume } from "../audio";
import {
  initMusic,
  pauseMusic,
  playStageBgm,
  resetBgmIntensity,
  resumeMusic,
  setBgmIntensity,
  setMusicVolume,
  setupAudioAnalysis,
  stopAllMusic,
} from "../music";
import { useHud } from "../state";
import type { Difficulty, EngineState, PlayerInput } from "../types";
import { CHARACTERS, type CharacterId } from "../config/characters";
import { MODIFIERS, isHardcoreRun, type RunModifierId } from "../config/modifiers";
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
  tutorialMode?: boolean;
  endlessMode?: boolean;
}

export function GameCanvas({
  startStage = 0,
  difficulty = "normal",
  characterId = "ninja",
  modifierId = "none",
  tutorialMode = false,
  endlessMode = false,
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
  const setEnemyCount = useHud((s) => s.setEnemyCount);
  const incTap = useHud((s) => s.incTap);
  const incCharge = useHud((s) => s.incCharge);
  const incDash = useHud((s) => s.incDash);
  const incOnBeat = useHud((s) => s.incOnBeat);
  const incGather = useHud((s) => s.incGather);
  const setStage = useHud((s) => s.setStage);
  const victory = useHud((s) => s.victory);
  const togglePause = useHud((s) => s.togglePause);
  const startBossCutscene = useHud((s) => s.startBossCutscene);
  const triggerBossPhaseAlert = useHud((s) => s.triggerBossPhaseAlert);
  const setEndlessLoop = useHud((s) => s.setEndlessLoop);
  const musicVolume = useHud((s) => s.musicVolume);
  const sfxVolume = useHud((s) => s.sfxVolume);
  const stageIndex = useHud((s) => s.stageIndex);
  const status = useHud((s) => s.status);
  const combo = useHud((s) => s.combo);
  const restartKey = useHud((s) => s.restartKey);

  useEffect(() => {
    initMusic();
  }, []);

  useEffect(() => {
    const char = CHARACTERS[characterId];
    const mod = MODIFIERS[modifierId];
    start(char.maxHp + mod.startHpDelta);
  }, [start, characterId, modifierId, restartKey]);

  useEffect(() => {
    setMasterVolume(sfxVolume);
    setMusicVolume(musicVolume);
  }, [sfxVolume, musicVolume]);

  useEffect(() => {
    if (status === "playing") {
      playStageBgm(stageIndex);
      resumeMusic();
    } else if (status === "paused") {
      pauseMusic();
    } else if (status === "gameover" || status === "victory" || status === "menu") {
      resetBgmIntensity();
      stopAllMusic();
    }
  }, [stageIndex, status]);

  useEffect(() => {
    if (status === "playing") setBgmIntensity(combo);
  }, [combo, status]);

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
        // Cutscenes share the Space key (skip). Only arm the parry while
        // actually playing, or skipping a cutscene leaves parryHeld stuck true.
        if (useHud.getState().status === "playing") inputRef.current.parryHeld = true;
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
        if (useHud.getState().status === "playing") inputRef.current.dashPressed = true;
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
      // Leaving the window mid-fight shouldn't cost HP — auto-pause.
      if (useHud.getState().status === "playing") togglePause();
    };

    // Touch controls: one finger = aim toward the touch point + parry (release =
    // reflect, tap = TAP counter, hold = CHARGE). A second finger = dash. Bound
    // to the canvas so UI buttons (separate DOM, on top) keep their own taps.
    const setAimFromTouch = (t: Touch) => {
      inputRef.current.rawMouseX = t.clientX - window.innerWidth / 2;
      inputRef.current.rawMouseY = t.clientY - window.innerHeight / 2;
    };
    const syncTouch = (e: TouchEvent) => {
      const playing = useHud.getState().status === "playing";
      inputRef.current.parryHeld = playing && e.touches.length >= 1;
      inputRef.current.dashPressed = playing && e.touches.length >= 2;
    };
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      // preventDefault can suppress the synthetic pointerdown that resumes audio
      // on first gesture, so resume here too (idempotent).
      resumeAudio();
      setupAudioAnalysis();
      if (e.touches[0]) setAimFromTouch(e.touches[0]);
      syncTouch(e);
    };
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches[0]) setAimFromTouch(e.touches[0]);
    };
    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      syncTouch(e);
    };

    window.addEventListener("resize", resize);
    window.addEventListener("pointerdown", gestureHandler);
    window.addEventListener("keydown", gestureHandler);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);
    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd, { passive: false });
    canvas.addEventListener("touchcancel", handleTouchEnd, { passive: false });

    const startTime = performance.now();
    engineRef.current = createEngineState(
      0,
      startStage,
      difficulty,
      characterId,
      modifierId,
      tutorialMode,
      endlessMode,
    );
    setStage(startStage);
    let prevTime = startTime;
    // Game time excludes paused spans so engine clocks (beat, enemy fire,
    // hazard spawns) freeze on pause/blur instead of jumping ahead on resume.
    let pausedAccumMs = 0;
    let pauseStartedAt = 0;
    let wasPaused = false;

    const loop = (t: number) => {
      const dt = Math.min(MAX_DT_SEC, (t - prevTime) / 1000);
      prevTime = t;
      const engine = engineRef.current;
      // A thrown frame must never kill the loop: always re-register the RAF in
      // finally, so one bad tick degrades to a dropped frame, not a freeze.
      try {
        if (!engine) return;

        const w = window.innerWidth;
        const h = window.innerHeight;
        const hudState = useHud.getState();

        const isPaused = hudState.status === "paused";
        if (isPaused && !wasPaused) pauseStartedAt = t;
        else if (!isPaused && wasPaused) pausedAccumMs += t - pauseStartedAt;
        wasPaused = isPaused;
        const nowMs = t - startTime - pausedAccumMs;

        if (hudState.status === "playing") {
          const baseMul = MODIFIERS[engine.modifierId].scoreMul;
          const scoreMul =
            baseMul * (isHardcoreRun(engine.difficulty, engine.modifierId) ? 1.5 : 1);
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
            onBossAppear: startBossCutscene,
            onBossPhaseChange: triggerBossPhaseAlert,
            onEndlessLoop: setEndlessLoop,
            onEnemyCount: setEnemyCount,
            onDash: incDash,
            onTapCounter: incTap,
            onCharge: incCharge,
            onOnBeat: incOnBeat,
            onGather: incGather,
          });
        }

        render(ctx, engine, w, h, dprRef.current, nowMs, {
          combo: hudState.combo,
          paused: hudState.status === "paused",
        });
      } catch (err) {
        console.error("[game loop] frame error:", err);
      } finally {
        rafRef.current = requestAnimationFrame(loop);
      }
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      stopAllMusic();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointerdown", gestureHandler);
      window.removeEventListener("keydown", gestureHandler);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
      canvas.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [addScore, bumpCombo, breakCombo, bumpParries, bumpEnemiesKilled, damage, heal, setStage, victory, togglePause, startBossCutscene, triggerBossPhaseAlert, setEndlessLoop, setEnemyCount, incTap, incCharge, incDash, incOnBeat, incGather, startStage, difficulty, characterId, modifierId, tutorialMode, endlessMode, restartKey]);

  return <canvas ref={canvasRef} className={styles.canvas} />;
}
