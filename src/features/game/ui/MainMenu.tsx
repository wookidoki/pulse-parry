"use client";

import Link from "next/link";
import { useState } from "react";
import { STAGES, tempoRangeOf } from "../config/stages";
import { CHARACTERS, CHARACTER_ORDER, type CharacterId } from "../config/characters";
import { DIFFICULTIES, DIFFICULTY_ORDER } from "../config/difficulty";
import { MODIFIERS, MODIFIER_ORDER, type RunModifierId } from "../config/modifiers";
import { loadProgress, getBestScore } from "../progress";
import type { Difficulty } from "../types";
import { loadLocale, saveLocale, t, type Locale } from "../i18n";
import { MenuBackground } from "./MenuBackground";
import { CharacterPortrait } from "./CharacterPortrait";
import styles from "./MainMenu.module.css";

type View = "title" | "character" | "stage" | "credits";

function readBestScores(difficulty: Difficulty): Record<number, number> {
  if (typeof window === "undefined") return {};
  const m: Record<number, number> = {};
  for (let i = 0; i < STAGES.length; i++) m[i] = getBestScore(i, difficulty);
  return m;
}

export function MainMenu() {
  const [view, setView] = useState<View>("title");
  const [locale, setLocale] = useState<Locale>(() => loadLocale());
  const [characterId, setCharacterId] = useState<CharacterId>("ninja");
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [modifierId, setModifierId] = useState<RunModifierId>("none");
  const [unlockedStage] = useState<number>(() =>
    typeof window === "undefined" ? 0 : loadProgress().unlockedStage,
  );

  const toggleLocale = () => {
    const next: Locale = locale === "ko" ? "en" : "ko";
    setLocale(next);
    saveLocale(next);
  };

  return (
    <>
      <MenuBackground />
      <main className={styles.page}>
        <div className={styles.cornerTop}>
          <button className={styles.localeBtn} onClick={toggleLocale}>
            {locale === "ko" ? "ENGLISH" : "한국어"}
          </button>
        </div>

        <div className={styles.viewport}>
          {view === "title" && (
            <TitleView
              locale={locale}
              hasSave={unlockedStage > 0}
              onPlay={() => setView("character")}
              onCredits={() => setView("credits")}
            />
          )}
          {view === "character" && (
            <CharacterView
              locale={locale}
              characterId={characterId}
              setCharacterId={setCharacterId}
              onBack={() => setView("title")}
              onNext={() => setView("stage")}
            />
          )}
          {view === "stage" && (
            <StageView
              locale={locale}
              characterId={characterId}
              difficulty={difficulty}
              setDifficulty={setDifficulty}
              modifierId={modifierId}
              setModifierId={setModifierId}
              unlockedStage={unlockedStage}
              onBack={() => setView("character")}
            />
          )}
          {view === "credits" && <CreditsView locale={locale} onBack={() => setView("title")} />}
        </div>

        <div className={styles.cornerBottom}>
          <span className={styles.version}>v0.5.0</span>
          <span className={styles.attribution}>
            BGM CC0/OGA · Art CC0/OGA-BY · OpenGameArt
          </span>
        </div>
      </main>
    </>
  );
}

function TitleView({
  locale,
  hasSave,
  onPlay,
  onCredits,
}: {
  locale: Locale;
  hasSave: boolean;
  onPlay: () => void;
  onCredits: () => void;
}) {
  return (
    <div className={`${styles.view} ${styles.titleView}`}>
      <h1 className={styles.title}>
        <span className={styles.titleMagenta}>PULSE</span>
        <span className={styles.titleCyan}>PARRY</span>
      </h1>
      <p className={styles.subtitle}>{t("subtitle", locale)}</p>

      <nav className={styles.menu}>
        <button className={styles.menuItemPrimary} onClick={onPlay}>
          ▶ {hasSave ? t("continueText", locale) : t("newGame", locale)}
        </button>
        <Link href="/tutorial" className={styles.menuItem}>
          {t("tutorial", locale)}
        </Link>
        <button className={styles.menuItem} onClick={onCredits}>
          {t("credits", locale)}
        </button>
      </nav>
    </div>
  );
}

function CharacterView({
  locale,
  characterId,
  setCharacterId,
  onBack,
  onNext,
}: {
  locale: Locale;
  characterId: CharacterId;
  setCharacterId: (id: CharacterId) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const currentIdx = CHARACTER_ORDER.indexOf(characterId);
  const char = CHARACTERS[characterId];

  const prev = () => {
    const newIdx = (currentIdx - 1 + CHARACTER_ORDER.length) % CHARACTER_ORDER.length;
    setCharacterId(CHARACTER_ORDER[newIdx]);
  };
  const next = () => {
    const newIdx = (currentIdx + 1) % CHARACTER_ORDER.length;
    setCharacterId(CHARACTER_ORDER[newIdx]);
  };

  return (
    <div className={`${styles.view} ${styles.characterView}`}>
      <header className={styles.viewHeader}>
        <button className={styles.backBtn} onClick={onBack}>
          ◀ {t("backToTitle", locale)}
        </button>
        <span className={styles.stepLabel}>
          {t("step1", locale)} — {t("chooseChar", locale)}
        </span>
        <span className={styles.stepCount}>1 / 2</span>
      </header>

      <div className={styles.characterStage}>
        <button className={styles.arrowBtn} onClick={prev} aria-label="prev">
          ◀
        </button>
        <CharacterPortrait characterId={characterId} active={true} size={280} />
        <button className={styles.arrowBtn} onClick={next} aria-label="next">
          ▶
        </button>
      </div>

      <div className={styles.characterMeta}>
        <h2 className={styles.charName} style={{ color: char.accentColor }}>
          {char.name[locale]}
        </h2>
        <p className={styles.charTagline}>{char.tagline[locale]}</p>
        <div className={styles.statGrid}>
          <Stat label="CONE" value={char.coneAngleRad / 1.4} color={char.accentColor} />
          <Stat label="REACH" value={char.parryRange / 200} color={char.accentColor} />
          <Stat label="SPEED" value={(char.reflectSpeed - 600) / 600} color={char.accentColor} />
          <Stat label="HP" value={char.maxHp / 5} color={char.accentColor} />
        </div>
        <div className={styles.abilityBox} style={{ borderColor: char.accentColor }}>
          <span className={styles.abilityLabel}>ABILITY</span>
          <span className={styles.abilityText}>{char.ability[locale]}</span>
        </div>
      </div>

      <div className={styles.dotRow}>
        {CHARACTER_ORDER.map((id) => (
          <button
            key={id}
            className={`${styles.dot} ${id === characterId ? styles.dotActive : ""}`}
            onClick={() => setCharacterId(id)}
            aria-label={id}
          />
        ))}
      </div>

      <button className={styles.primaryBtn} onClick={onNext}>
        {t("next", locale)} ▶
      </button>
    </div>
  );
}

function StageView({
  locale,
  characterId,
  difficulty,
  setDifficulty,
  modifierId,
  setModifierId,
  unlockedStage,
  onBack,
}: {
  locale: Locale;
  characterId: CharacterId;
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
  modifierId: RunModifierId;
  setModifierId: (id: RunModifierId) => void;
  unlockedStage: number;
  onBack: () => void;
}) {
  const [bests, setBests] = useState<Record<number, number>>(() => readBestScores(difficulty));
  const [selectedStage, setSelectedStage] = useState<number>(
    Math.min(unlockedStage, STAGES.length - 1),
  );

  const onSelectDifficulty = (d: Difficulty) => {
    setDifficulty(d);
    setBests(readBestScores(d));
  };

  const stage = STAGES[selectedStage];
  const range = tempoRangeOf(stage);

  return (
    <div className={`${styles.view} ${styles.stageView}`}>
      <header className={styles.viewHeader}>
        <button className={styles.backBtn} onClick={onBack}>
          ◀ {t("backToCharacter", locale)}
        </button>
        <span className={styles.stepLabel}>
          {t("step2", locale)} — {t("chooseStage", locale)}
        </span>
        <span className={styles.stepCount}>2 / 2</span>
      </header>

      <div className={styles.stageGrid}>
        {STAGES.map((s, i) => {
          const unlocked = i <= unlockedStage;
          const isSel = selectedStage === i;
          const best = bests[i] ?? 0;
          return (
            <button
              key={i}
              className={`${styles.stageCard} ${isSel ? styles.stageCardSelected : ""} ${!unlocked ? styles.stageCardLocked : ""} ${s.isBoss ? styles.stageCardBoss : ""}`}
              onClick={() => unlocked && setSelectedStage(i)}
              disabled={!unlocked}
            >
              <div className={styles.stageIdx}>0{i + 1}</div>
              <div className={styles.stageName}>{s.name}</div>
              {s.isBoss && <div className={styles.stageBadge}>{t("boss", locale)}</div>}
              {best > 0 && (
                <div className={styles.stageBest}>
                  {t("best", locale)} {best.toString().padStart(6, "0")}
                </div>
              )}
              {!unlocked && <div className={styles.stageLock}>🔒</div>}
            </button>
          );
        })}
      </div>

      <div className={styles.selectedPanel}>
        <div className={styles.selectedHeader}>
          <h3 className={styles.selectedName}>{stage.name}</h3>
          <span className={styles.selectedMeta}>
            {range.min}~{range.max} BPM · {Math.round(stage.durationMs / 1000)}s
          </span>
        </div>
        <p className={styles.selectedTagline}>{stage.tagline}</p>
      </div>

      <div className={styles.settingsRow}>
        <div className={styles.settingGroup}>
          <span className={styles.settingLabel}>{t("chooseDiff", locale)}</span>
          <div className={styles.pillRow}>
            {DIFFICULTY_ORDER.map((d) => (
              <button
                key={d}
                className={`${styles.pill} ${d === difficulty ? styles.pillActive : ""}`}
                onClick={() => onSelectDifficulty(d)}
              >
                {DIFFICULTIES[d].label}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.settingGroup}>
          <span className={styles.settingLabel}>{t("chooseMod", locale)}</span>
          <div className={styles.pillRow}>
            {MODIFIER_ORDER.map((id) => (
              <button
                key={id}
                className={`${styles.pill} ${id === modifierId ? styles.pillActive : ""}`}
                onClick={() => setModifierId(id)}
                title={MODIFIERS[id].description[locale]}
              >
                {MODIFIERS[id].name[locale]}
              </button>
            ))}
          </div>
        </div>
      </div>
      <p className={styles.modDescription}>{MODIFIERS[modifierId].description[locale]}</p>

      <Link
        href={`/play?stage=${selectedStage}&diff=${difficulty}&char=${characterId}&mod=${modifierId}`}
        className={styles.startBtn}
      >
        ▶ {t("startGame", locale)}
      </Link>
    </div>
  );
}

function CreditsView({ locale, onBack }: { locale: Locale; onBack: () => void }) {
  return (
    <div className={`${styles.view} ${styles.creditsView}`}>
      <header className={styles.viewHeader}>
        <button className={styles.backBtn} onClick={onBack}>
          ◀ {t("backToTitle", locale)}
        </button>
        <span className={styles.stepLabel}>{t("credits", locale)}</span>
        <span className={styles.stepCount} />
      </header>

      <section className={styles.creditsSection}>
        <h3 className={styles.creditsRole}>DESIGN · CODE</h3>
        <p className={styles.creditsName}>wookidoki</p>
      </section>
      <section className={styles.creditsSection}>
        <h3 className={styles.creditsRole}>AI ASSIST</h3>
        <p className={styles.creditsName}>Claude Opus 4.7</p>
      </section>
      <section className={styles.creditsSection}>
        <h3 className={styles.creditsRole}>CHARACTERS</h3>
        <p className={styles.creditsName}>Hyptosis — Cyberpunk Portraits (CC0)</p>
      </section>
      <section className={styles.creditsSection}>
        <h3 className={styles.creditsRole}>BACKGROUNDS</h3>
        <p className={styles.creditsName}>CraftPix.net — Cyberpunk Pixel Art (OGA-BY 3.0)</p>
      </section>
      <section className={styles.creditsSection}>
        <h3 className={styles.creditsRole}>MUSIC</h3>
        <p className={styles.creditsName}>OpenGameArt CC0 · Google Lyria AI</p>
      </section>
      <section className={styles.creditsSection}>
        <h3 className={styles.creditsRole}>BUILT WITH</h3>
        <p className={styles.creditsName}>Next.js 16 · React 19 · Zustand · Canvas 2D · Web Audio API</p>
      </section>

      <p className={styles.creditsFooter}>2026 · Vibe Coding Hackathon</p>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <div className={styles.stat}>
      <div className={styles.statHeader}>
        <span className={styles.statLabel}>{label}</span>
        <span className={styles.statValue}>{Math.round(clamped * 100)}</span>
      </div>
      <div className={styles.statTrack}>
        <div
          className={styles.statFill}
          style={{ width: `${clamped * 100}%`, backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
        />
      </div>
    </div>
  );
}
