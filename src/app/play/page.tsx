import {
  ComboMilestone,
  EndOverlay,
  GameCanvas,
  Hud,
  PauseOverlay,
  StageBanner,
} from "@/features/game";
import {
  BossCutscene,
  DeathCutscene,
  IntroCutscene,
  VictoryCutscene,
} from "@/features/game/ui/Cutscenes";
import { PracticeHud } from "@/features/game/ui/PracticeHud";
import { BossPhaseAlert } from "@/features/game/ui/BossPhaseAlert";
import type { Difficulty } from "@/features/game/types";
import { CHARACTERS, type CharacterId } from "@/features/game/config/characters";
import { MODIFIERS, type RunModifierId } from "@/features/game/config/modifiers";
import { STAGES } from "@/features/game/config/stages";

interface PageProps {
  searchParams: Promise<{
    stage?: string;
    diff?: string;
    char?: string;
    mod?: string;
    tutorial?: string;
    mode?: string;
  }>;
}

function parseDifficulty(v: string | undefined): Difficulty {
  return v === "easy" || v === "hard" ? v : "normal";
}

function parseCharacter(v: string | undefined): CharacterId {
  return v && Object.prototype.hasOwnProperty.call(CHARACTERS, v)
    ? (v as CharacterId)
    : "ninja";
}

function parseModifier(v: string | undefined): RunModifierId {
  return v && Object.prototype.hasOwnProperty.call(MODIFIERS, v)
    ? (v as RunModifierId)
    : "none";
}

export default async function PlayPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const maxStage = STAGES.length - 1;
  const stageIdx = Math.max(0, Math.min(maxStage, parseInt(params.stage ?? "0", 10) || 0));
  const tutorialMode = params.tutorial === "1";
  const endlessMode = params.mode === "endless";
  return (
    <>
      <GameCanvas
        startStage={endlessMode ? 1 : stageIdx}
        difficulty={parseDifficulty(params.diff)}
        characterId={parseCharacter(params.char)}
        modifierId={parseModifier(params.mod)}
        tutorialMode={tutorialMode}
        endlessMode={endlessMode}
      />
      <Hud />
      <StageBanner />
      <ComboMilestone />
      <PauseOverlay />
      <IntroCutscene />
      <BossCutscene />
      <DeathCutscene />
      <VictoryCutscene />
      <BossPhaseAlert />
      <PracticeHud active={tutorialMode} />
      <EndOverlay />
    </>
  );
}
