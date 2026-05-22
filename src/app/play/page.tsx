import {
  ComboMilestone,
  EndOverlay,
  GameCanvas,
  Hud,
  PauseOverlay,
  StageBanner,
} from "@/features/game";
import type { Difficulty } from "@/features/game/types";
import type { CharacterId } from "@/features/game/config/characters";
import type { RunModifierId } from "@/features/game/config/modifiers";

interface PageProps {
  searchParams: Promise<{
    stage?: string;
    diff?: string;
    char?: string;
    mod?: string;
  }>;
}

function parseDifficulty(v: string | undefined): Difficulty {
  return v === "easy" || v === "hard" ? v : "normal";
}

function parseCharacter(v: string | undefined): CharacterId {
  return v === "monk" || v === "netrunner" ? v : "ninja";
}

function parseModifier(v: string | undefined): RunModifierId {
  if (
    v === "rapidFire" ||
    v === "metalRain" ||
    v === "purist" ||
    v === "stoneHeart"
  ) {
    return v;
  }
  return "none";
}

export default async function PlayPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const stageIdx = Math.max(0, Math.min(4, parseInt(params.stage ?? "0", 10) || 0));
  return (
    <>
      <GameCanvas
        startStage={stageIdx}
        difficulty={parseDifficulty(params.diff)}
        characterId={parseCharacter(params.char)}
        modifierId={parseModifier(params.mod)}
      />
      <Hud />
      <StageBanner />
      <ComboMilestone />
      <PauseOverlay />
      <EndOverlay />
    </>
  );
}
