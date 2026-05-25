"use client";

import { useState } from "react";
import { playUiTap } from "../audio";
import { initialLocale, t, type Locale, type I18nKey } from "../i18n";
import { MenuBackground } from "./MenuBackground";
import { Button, ButtonLink } from "./Button";
import styles from "./Tutorial.module.css";

interface StepDef {
  titleKey: I18nKey;
  descKey: I18nKey;
  glyph: string;
  glyphColor: string;
}

const STEPS: StepDef[] = [
  { titleKey: "tutAimT", descKey: "tutAimD", glyph: "↗", glyphColor: "#1cf0ff" },
  { titleKey: "tutParryT", descKey: "tutParryD", glyph: "◐", glyphColor: "#f7ff3a" },
  { titleKey: "tutTapT", descKey: "tutTapD", glyph: "✱", glyphColor: "#f7ff3a" },
  { titleKey: "tutChargeT", descKey: "tutChargeD", glyph: "▲", glyphColor: "#ff3863" },
  { titleKey: "tutPerfectT", descKey: "tutPerfectD", glyph: "✦", glyphColor: "#ffffff" },
  { titleKey: "tutDashT", descKey: "tutDashD", glyph: "⇶", glyphColor: "#1cf0ff" },
  { titleKey: "tutHazardT", descKey: "tutHazardD", glyph: "⚠", glyphColor: "#ff3863" },
  { titleKey: "tutHealT", descKey: "tutHealD", glyph: "+", glyphColor: "#1cf78f" },
  { titleKey: "tutMirrorT", descKey: "tutMirrorD", glyph: "◇", glyphColor: "#ffffff" },
  { titleKey: "tutHealerT", descKey: "tutHealerD", glyph: "✚", glyphColor: "#1cf78f" },
  { titleKey: "tutPulserT", descKey: "tutPulserD", glyph: "✺", glyphColor: "#1cf0ff" },
  { titleKey: "tutReadyT", descKey: "tutReadyD", glyph: "◆", glyphColor: "#ff2bd6" },
];

export function Tutorial() {
  const [locale] = useState<Locale>(initialLocale);
  const [step, setStep] = useState(0);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  return (
    <>
      <MenuBackground />
      <main className={styles.page}>
        <header className={styles.topBar}>
          <h1 className={styles.title}>{t("tutTitle", locale)}</h1>
          <ButtonLink variant="ghost" size="sm" href="/">
            {t("tutSkip", locale)}
          </ButtonLink>
        </header>

        <div className={styles.progressRow}>
          {STEPS.map((_, i) => (
            <button
              key={i}
              className={`${styles.progressDot} ${i === step ? styles.progressDotActive : ""} ${i < step ? styles.progressDotDone : ""}`}
              onClick={() => {
                playUiTap();
                setStep(i);
              }}
              aria-label={`step ${i + 1}`}
            />
          ))}
        </div>

        <section className={styles.card}>
          <div
            className={styles.glyph}
            style={{
              color: current.glyphColor,
              textShadow: `0 0 32px ${current.glyphColor}, 0 0 64px ${current.glyphColor}`,
            }}
          >
            {current.glyph}
          </div>
          <div className={styles.stepLabel}>
            {t("tutStep", locale)} {step + 1} / {STEPS.length}
          </div>
          <h2 className={styles.stepTitle}>{t(current.titleKey, locale)}</h2>
          <p className={styles.stepDesc}>{t(current.descKey, locale)}</p>
        </section>

        <div className={styles.actions}>
          <Button
            variant="secondary"
            size="md"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={isFirst}
          >
            {t("tutPrev", locale)}
          </Button>
          {isLast ? (
            <>
              <ButtonLink variant="secondary" size="md" href="/">
                {t("tutFinish", locale)}
              </ButtonLink>
              <ButtonLink
                variant="primary"
                size="md"
                bracket
                href="/play?stage=0&char=ninja&mod=none&diff=easy&tutorial=1"
              >
                {locale === "ko" ? "▶ 연습 시작" : "▶ PRACTICE"}
              </ButtonLink>
            </>
          ) : (
            <Button
              variant="primary"
              size="md"
              bracket
              onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
            >
              {t("tutNext", locale)}
            </Button>
          )}
        </div>
      </main>
    </>
  );
}
