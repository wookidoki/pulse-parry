"use client";

import { CHARACTERS, type CharacterId } from "../config/characters";
import styles from "./CharacterPortrait.module.css";

interface Props {
  characterId: CharacterId;
  active: boolean;
  size?: number;
  className?: string;
}

const NINJA_PATH =
  "M255.063 21c-46.697 0-88.406 27.674-117.844 70.656-29.44 42.982-47.25 101.566-47.25 166.094 0 64.527 17.81 123.112 47.25 166.094 29.437 42.982 71.146 70.656 117.843 70.656 46.696 0 88.405-27.674 117.843-70.656 29.44-42.982 47.25-101.567 47.25-166.094 0-64.528-17.81-123.112-47.25-166.094C343.468 48.674 301.76 21 255.062 21zM396.28 200.344c3.365 18.28 5.19 37.527 5.19 57.406 0 18.535-1.594 36.522-4.533 53.688-37.91 12.904-87.436 20.812-141.656 20.812-54.45 0-104.125-8.235-142.186-21.313-2.884-17.014-4.438-34.833-4.438-53.187 0-19.868 1.827-39.103 5.188-57.375 37.903 14.565 87.35 23.25 141.47 23.25 54.136 0 103.183-8.707 140.967-23.28zM177.157 241c-15.137-.162-30.97 3.458-47.375 10.313 14.562 51.423 87.08 42.483 102.157 10.156-17.004-13.822-35.318-20.262-54.78-20.47zm155.75 0c-19.462.208-37.808 6.648-54.812 20.47 15.078 32.326 87.596 41.266 102.156-10.158-16.405-6.854-32.206-10.474-47.344-10.312z";

const MONK_PATH =
  "M218.195 28.5l13.75 110h48.11l13.75-110zm93.069 5.459L295.945 156.5h-79.89L200.754 34.08c-17.39 9.193-33.547 22.691-47.754 39.895V220.5H97.623a334.688 334.688 0 0 0-1.623 31c0 128.13 71.634 232 160 232 71.065-.062 133.586-68.083 153.496-167h-7.371l-32 16h-69.691L263 297.3v-62.8h136v16h16.965c-.335-96.78-42.068-183.093-104.701-216.541zM256 42.5c13.7 0 25 11.3 25 25s-11.3 25-25 25-25-11.3-25-25 11.3-25 25-25zm0 18c-3.973 0-7 3.027-7 7s3.027 7 7 7 7-3.027 7-7-3.027-7-7-7zm-121 39.635c-17.438 29.328-29.537 64.52-35.191 102.365H135zm185 149.38l-32 48 14.977 9.985 32-48zm48 0l-32 48 14.977 9.985 32-48zM144 266.5h80v18h-7.045c-.458 6.484-5.303 10.55-9.617 12.707-4.533 2.267-9.704 3.293-15.338 3.293-5.634 0-10.805-1.026-15.338-3.293-4.314-2.157-9.159-6.223-9.617-12.707H144zm265 2v30h30v-30zm-217 126h128v18H192zm48 32h32v18h-32z";

const NETRUNNER_PATH =
  "M257.375 32.03C139.957 87.197 42.343 247.886 17.5 367.75c71.742 0 124.22 22.845 162.094 63.03l10.47-11.436c-28.06-28.873-64.935-52.446-113.564-75.906 26.142-65.033 66.028-163.458 116.72-169.188 19.835-2.243 41.05 9.735 64.155 43.438 72.33-120.27 141.014 38.54 180.875 125.75-47.687 25.854-84.5 49.463-112.97 78.718l9.25 10.406c37.335-39.758 89.657-64.812 162.72-64.812C467.784 249.384 377.24 90.37 257.375 32.03zm-79.72 243.314c-15.3-.083-26.405 6.436-26.405 16.656 0 12.58 16.834 26.038 37.594 30.063 20.76 4.024 37.594-2.92 37.594-15.5s-16.835-26.038-37.594-30.063c-3.893-.755-7.657-1.137-11.188-1.156zm156.345 0c-3.53.02-7.295.4-11.188 1.156-20.76 4.025-37.593 17.483-37.593 30.063 0 12.58 16.833 19.524 37.592 15.5 20.76-4.025 37.594-17.484 37.594-30.063 0-10.22-11.105-16.74-26.406-16.656z";

// Conductor — stylized treble-clef-like figure: head + raised baton arm + flowing robe.
// Custom path; reads as a maestro silhouette inside the 512×512 viewBox.
const CONDUCTOR_PATH =
  "M256 56c-30 0-54 24-54 54 0 26 17 47 41 53l-3 46-58-22-18 30 70 30-22 80 30 14 18-72h32l18 72 30-14-22-80 70-30-18-30-58 22-3-46c24-6 41-27 41-53 0-30-24-54-54-54zM124 70l-22 14 40 60 18-10zM256 90c11 0 20 9 20 20s-9 20-20 20-20-9-20-20 9-20 20-20zM218 332l-26 134h36l16-104h24l16 104h36l-26-134z";

const PATHS: Record<CharacterId, string> = {
  ninja: NINJA_PATH,
  monk: MONK_PATH,
  netrunner: NETRUNNER_PATH,
  conductor: CONDUCTOR_PATH,
};

export function CharacterPortrait({ characterId, active, size = 120, className }: Props) {
  const char = CHARACTERS[characterId];
  const color = char.accentColor;
  const filterId = `glow-${characterId}-${active ? "a" : "i"}`;

  return (
    <div
      className={`${styles.frame} ${active ? styles.frameActive : ""} ${className ?? ""}`}
      style={{
        borderColor: color,
        background: active
          ? `radial-gradient(circle at 50% 60%, ${color}33, rgba(5,3,10,0.85) 70%)`
          : `radial-gradient(circle at 50% 60%, ${color}1a, rgba(5,3,10,0.9) 65%)`,
        boxShadow: active
          ? `0 0 36px ${color}, inset 0 0 30px ${color}33`
          : `0 0 12px ${color}77`,
        width: size,
        height: size,
      }}
    >
      <svg
        viewBox="0 0 512 512"
        className={styles.svg}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation={active ? 6 : 3} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id={`grad-${characterId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor={color} />
            <stop offset="100%" stopColor={color} stopOpacity="0.7" />
          </linearGradient>
        </defs>

        <path d={PATHS[characterId]} fill={color} opacity={0.18} transform="translate(6 6)" />
        <path d={PATHS[characterId]} fill={color} opacity={0.18} transform="translate(-6 -6)" />
        <path
          d={PATHS[characterId]}
          fill={`url(#grad-${characterId})`}
          filter={`url(#${filterId})`}
        />
      </svg>
      <div
        className={styles.scanline}
        style={{ background: `linear-gradient(transparent 70%, ${color}22 100%)` }}
      />
    </div>
  );
}
