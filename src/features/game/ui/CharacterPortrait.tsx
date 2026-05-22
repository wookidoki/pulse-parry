"use client";

import Image from "next/image";
import { CHARACTERS, type CharacterId } from "../config/characters";
import styles from "./CharacterPortrait.module.css";

interface Props {
  characterId: CharacterId;
  active: boolean;
  className?: string;
}

const PORTRAIT_SRC: Record<CharacterId, string> = {
  ninja: "/assets/characters/ninja_portrait.png",
  monk: "/assets/characters/monk_portrait.png",
  netrunner: "/assets/characters/netrunner_portrait.png",
};

export function CharacterPortrait({ characterId, active, className }: Props) {
  const char = CHARACTERS[characterId];
  return (
    <div
      className={`${styles.frame} ${active ? styles.frameActive : ""} ${className ?? ""}`}
      style={{
        borderColor: char.accentColor,
        boxShadow: active
          ? `0 0 28px ${char.accentColor}, inset 0 0 20px ${char.accentColor}33`
          : `0 0 8px ${char.accentColor}77`,
      }}
    >
      <Image
        src={PORTRAIT_SRC[characterId]}
        alt={char.id}
        width={120}
        height={120}
        className={styles.img}
        style={{ opacity: active ? 1 : 0.75 }}
        priority={active}
      />
      <div
        className={styles.scanline}
        style={{ background: `linear-gradient(transparent 70%, ${char.accentColor}22 100%)` }}
      />
    </div>
  );
}
